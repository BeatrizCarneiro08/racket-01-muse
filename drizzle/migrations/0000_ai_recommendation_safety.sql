CREATE TABLE public.ai_recommendation_gate (
 id text PRIMARY KEY,
 status integer NOT NULL,
 message text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ai_recommendation_gate TO service_role;
ALTER TABLE public.ai_recommendation_gate ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.ai_recommendation_gate IS 'Server-only durable pause state for terminal AI Gateway access and credit failures. No buyer inputs are stored.';
CREATE TABLE public.ai_recommendation_limits (
 id text PRIMARY KEY,
 window_start timestamptz NOT NULL DEFAULT now(),
 requests integer NOT NULL DEFAULT 0
);
GRANT ALL ON public.ai_recommendation_limits TO service_role;
ALTER TABLE public.ai_recommendation_limits ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.claim_ai_recommendation_slot(slot_id text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE used integer;
BEGIN
 INSERT INTO public.ai_recommendation_limits (id, requests) VALUES (slot_id, 1)
 ON CONFLICT (id) DO UPDATE SET
 requests = CASE WHEN ai_recommendation_limits.window_start < now() - interval '1 hour' THEN 1 ELSE ai_recommendation_limits.requests + 1 END,
 window_start = CASE WHEN ai_recommendation_limits.window_start < now() - interval '1 hour' THEN now() ELSE ai_recommendation_limits.window_start END
 RETURNING requests INTO used;
 RETURN used <= 12;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_ai_recommendation_slot(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_ai_recommendation_slot(text) TO service_role;