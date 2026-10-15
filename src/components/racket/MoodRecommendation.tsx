import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ImagePlus, LoaderCircle, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { recommendationSchema, type Recommendation } from '@/lib/ai/recommendation.schema';
import { GUARDS, type Configuration } from '@/lib/racket/materials';
async function prepareImage(file:File){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPG, PNG or WebP photo.');
 if(file.size>10*1024*1024)throw Error('Choose a photo smaller than 10 MB.');
 const bitmap=await createImageBitmap(file);try{
 const ratio=Math.min(1,1280/Math.max(bitmap.width,bitmap.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(bitmap.width*ratio));c.height=Math.max(1,Math.round(bitmap.height*ratio));const ctx=c.getContext('2d');if(!ctx)throw Error('This photo could not be opened.');ctx.drawImage(bitmap,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.85);
 }finally{bitmap.close();}
}
export function MoodRecommendation({onApply}:{onApply:(c:Configuration)=>void}){
 const [mood,setMood]=useState(''),[image,setImage]=useState<string|null>(null),[filename,setFilename]=useState(''),[result,setResult]=useState<Recommendation|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[preparing,setPreparing]=useState(false),[blocked,setBlocked]=useState(false);
 const fileInput=useRef<HTMLInputElement>(null),controller=useRef<AbortController|null>(null),generation=useRef(0);
 useEffect(()=>()=>controller.current?.abort(),[]);
 async function upload(file?:File){if(!file)return;setPreparing(true);setError('');setResult(null);try{setImage(await prepareImage(file));setFilename(file.name);}catch(e){setError(e instanceof Error?e.message:'This photo could not be opened.');}finally{setPreparing(false);}}
 async function recommend(){
 if(loading||blocked||(!mood.trim()&&!image))return;const id=++generation.current;const abort=new AbortController();controller.current=abort;setLoading(true);setError('');setResult(null);
 try{
 const response=await fetch('/api/recommendation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mood:mood.trim(),image}),signal:abort.signal});
 if(!response.headers.get('content-type')?.includes('application/x-ndjson')){const data=await response.json();if([402,403,404].includes(response.status))setBlocked(true);throw Error(data.message||'AI recommendations are unavailable.');}
 const reader=response.body?.getReader();if(!reader)throw Error('No pairing came back.');const decoder=new TextDecoder();let pending='',found=false;
 function event(line:string){if(!line.trim())return;const data=JSON.parse(line);if(id!==generation.current)return;if(data.type==='error'){if([402,403,404].includes(data.status))setBlocked(true);throw Error(data.message);}if(data.type==='result'){const r=recommendationSchema.parse(data.recommendation);setResult(r);found=true;}}
 while(true){const part=await reader.read();if(part.done)break;pending+=decoder.decode(part.value,{stream:true});let newline;while((newline=pending.indexOf('\n'))>=0){event(pending.slice(0,newline));pending=pending.slice(newline+1);}}
 if(pending.trim())event(pending);if(!found)throw Error('No pairing came back. Please start a new request.');
 }catch(e){if(!abort.signal.aborted&&id===generation.current)setError(e instanceof Error?e.message:'AI recommendations are unavailable.');}finally{if(id===generation.current){setLoading(false);controller.current=null;}}
 }
 function stop(){generation.current++;controller.current?.abort();controller.current=null;setLoading(false);setError('Stopped. Your reference is still here.');}
  return <div className="ai-mood" aria-busy={loading||preparing}><form onSubmit={e=>{e.preventDefault();void recommend();}}><div className="ai-input-row"><label className="sr-only" htmlFor="mood">Describe a mood or visual reference</label><textarea id="mood" rows={2} maxLength={2000} value={mood} disabled={loading} onChange={e=>{setMood(e.target.value);setResult(null);}} placeholder="A faded Camden café. A blue Sunday. Something else."/><div className="ai-input-tools"><input ref={fileInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Reference image" disabled={loading||preparing} onChange={e=>{void upload(e.target.files?.[0]);e.target.value='';}}/><Button variant="tool" size="icon" type="button" title="Upload reference image" aria-label="Upload reference image" disabled={loading||preparing} onClick={()=>fileInput.current?.click()}><ImagePlus/></Button><Button variant="tool" size="icon" type="button" aria-label={loading?'Stop recommendation':'Find an AI material pairing'} title={loading?'Stop recommendation':'Find an AI material pairing'} disabled={!loading&&(blocked||preparing||(!mood.trim()&&!image))} onClick={()=>{if(loading)stop();else void recommend();}}>{loading?<Square/>:<ArrowUpRight/>}</Button></div></div><div className="ai-input-meta"><span>AI-POWERED / A MOOD, NOT A RULE</span><span>JPG, PNG, WEBP / UP TO 10 MB</span></div></form>
 {image&&<div className="ai-reference"><img src={image} alt="Your visual reference"/><span>{filename}</span><Button variant="tool" size="icon" aria-label="Remove reference image" title="Remove reference image" disabled={loading} onClick={()=>{setImage(null);setFilename('');setResult(null);}}><X/></Button></div>}
 {(loading||preparing)&&<p className="ai-progress" role="status"><LoaderCircle className="ai-spinner"/>{preparing?'Preparing your reference…':'Finding your angle…'}</p>}
 {error&&<p className="ai-error" role="alert">{error}</p>}
 {result&&<div className="ai-result" aria-live="polite"><span className="eyebrow">OUR TAKE</span><h3>{result.title}</h3><p className="ai-pairing">{GUARDS.find(g=>g.id===result.guard)?.name} / {result.body==='bone'?'Bone':'Black'} / {result.hardware==='chrome'?'Chrome':'Brushed'}</p><p>{result.rationale}</p><Button variant="racket" onClick={()=>onApply({guard:result.guard,body:result.body,hardware:result.hardware,exploded:false})}>Try this combination<ArrowUpRight/></Button></div>}
 </div>;
}
