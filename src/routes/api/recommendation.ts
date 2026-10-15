import { createFileRoute } from '@tanstack/react-router';
export const Route=createFileRoute('/api/recommendation')({server:{handlers:{POST:async({request})=>{try{const {handleRecommendation}=await import('@/lib/ai/recommendation.server');return await handleRecommendation(request);}catch(error){if(request.signal.aborted)return new Response(null,{status:499});throw error;}}}});
