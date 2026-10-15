import { z } from 'zod';
import type { ModelMessage } from 'ai';
import { createRecommendationCall } from './responses.server';
import { getLovableAiGatewayResponseHeaders } from './run-id.server.ts';
const inputSchema=z.object({mood:z.string().trim().max(2000),image:z.string().max(3000000).nullable()}).strict().refine(v=>v.mood.length>0||v.image!==null);
function imageValid(image:string){
 const match=/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(image);if(!match)return false;
 const encoded=match[2];if(!encoded)return false;
 try{const bytes=atob(encoded.slice(0,32));return match[1]==='jpeg'?bytes.startsWith('\xff\xd8\xff'):match[1]==='png'?bytes.startsWith('\x89PNG\r\n\x1a\n'):bytes.startsWith('RIFF')&&bytes.slice(8,12)==='WEBP';}catch{return false;}
}
export async function handleRecommendation(request:Request){
 const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)return Response.json({message:'Please request a pairing from the RACKET configurator.'},{status:403});
 if(!request.headers.get('content-type')?.startsWith('application/json'))return Response.json({message:'Invalid request.'},{status:400});
 const reader=request.body?.getReader();if(!reader)return Response.json({message:'Add a mood or reference photo.'},{status:400});
 let total=0;const chunks:Uint8Array[]=[];
 while(true){const part=await reader.read();if(part.done)break;total+=part.value.length;if(total>3100000){await reader.cancel();return Response.json({message:'Reference image is too large. Choose a smaller photo.'},{status:413});}chunks.push(part.value);}
 const joined=new Uint8Array(total);let at=0;for(const chunk of chunks){joined.set(chunk,at);at+=chunk.length;}
 let input:z.infer<typeof inputSchema>;try{input=inputSchema.parse(JSON.parse(new TextDecoder().decode(joined)));if(input.image&&!imageValid(input.image))throw Error();}catch{return Response.json({message:'Add a mood or a valid JPG, PNG or WebP reference photo.'},{status:400});}
 // Privileged access is restricted to service safety metadata, after origin and input validation.
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const {data:gate,error:gateError}=await supabaseAdmin.from('ai_recommendation_gate').select('status,message').eq('id','racket').maybeSingle();
 if(gateError)return Response.json({message:'AI recommendations are temporarily unavailable.'},{status:503});
 if(gate)return Response.json({message:gate.message},{status:gate.status});
 const key=process.env['LOVABLE_API_KEY'];if(!key)return Response.json({message:'AI recommendations need to be configured by the app owner.'},{status:401});
 const ip=request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]||'preview';
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key+ip));const slot=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
 const {data:allowed,error:limitError}=await supabaseAdmin.rpc('claim_ai_recommendation_slot',{slot_id:slot});
 if(limitError)return Response.json({message:'AI recommendations are temporarily unavailable.'},{status:503});
 if(!allowed)return Response.json({message:'You’ve explored a few directions. Please return in an hour for more AI pairings.'},{status:429,headers:{'Retry-After':'3600'}});
 const content:Extract<ModelMessage,{role:'user'}>['content']=[{type:'text',text:input.mood||'Recommend a RACKET 01 pairing inspired by this reference image.'}];
 if(input.image)content.push({type:'image',image:new URL(input.image)});
 const cancellation=new AbortController();
 const signal=AbortSignal.any([request.signal,cancellation.signal]);
 const call=createRecommendationCall(request,key,[{role:'user',content}],signal);
 const encoder=new TextEncoder();let failure:unknown,cancelled=false;
 const body=new ReadableStream<Uint8Array>({async start(controller){
  const send=(event:unknown)=>{if(!signal.aborted&&!cancelled)controller.enqueue(encoder.encode(JSON.stringify(event)+'\n'));};
  try{
   send({type:'status',message:'Finding your angle…'});
   for await(const event of call.result.fullStream){if(event.type==='error')failure=event.error;}
   if(failure)throw failure;
   const output=await call.result.output;
   if(!output)throw Error('No recommendation was returned.');
   send({type:'result',recommendation:{...output,title:output.title.slice(0,100),rationale:output.rationale.slice(0,700)}});
  }catch(error){
   const upstream=call.getUpstream();
   const status=signal.aborted?499:upstream.status>=400?upstream.status:502;
   const message=upstream.message||'No pairing came back. Please start a new request.';
   if(status===402||status===403){await supabaseAdmin.from('ai_recommendation_gate').upsert({id:'racket',status,message,updated_at:new Date().toISOString()});}
   send({type:'error',status,message});
  }finally{if(!cancelled)controller.close();}
 },cancel(){cancelled=true;cancellation.abort();}});
 await call.correlation.waitForRunId();const upstream=call.getUpstream();
 const headers=getLovableAiGatewayResponseHeaders(undefined,{'Content-Type':'application/x-ndjson','Cache-Control':'no-cache, no-transform'});
 const run=call.correlation.getRunId();if(run)headers.set('X-Lovable-AIG-Run-ID',run);
 return new Response(body,{status:request.signal.aborted?499:upstream.status>=400?upstream.status:200,headers});
}
