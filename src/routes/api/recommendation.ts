import { createFileRoute } from '@tanstack/react-router';
export const Route=createFileRoute('/api/recommendation')({server:{handlers:{POST:async({request})=>{const {handleRecommendation}=await import('@/lib/ai/recommendation.server');return handleRecommendation(request);}}}});
