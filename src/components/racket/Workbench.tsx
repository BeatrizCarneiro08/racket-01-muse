import { useCallback, useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { ArrowUpRight, Check, ChevronRight, Download, Layers3, Moon, Sun, RotateCcw, Bookmark, X, Trash2, Plus, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { GUARDS, INITIAL, textureCanvas, type Configuration, type Guard } from '@/lib/racket/materials';
import { deliverFile } from '@/lib/racket/download';
import { Stage, type ViewCommand } from './Stage';
import { MoodRecommendation } from './MoodRecommendation';

type Saved = { id: string; name: string; config: Configuration; image: string; };
const STORE = 'racket-synthesis-saved-v1';
function validConfig(c: unknown): c is Configuration {
  if (!c || typeof c !== 'object') return false;
  const v = c as Configuration;
  return ['bone','blue','tortoise','engraved'].includes(v.guard) && ['bone','black'].includes(v.body) && ['chrome','brushed'].includes(v.hardware) && typeof v.exploded === 'boolean';
}
function Swatch({kind}:{kind:Guard|'black'|'chrome'|'brushed'}) {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{const c=ref.current;if(!c || ['black','chrome','brushed'].includes(kind))return; c.getContext('2d')?.drawImage(textureCanvas(kind as Guard),0,0,96,96);},[kind]);
  return <span className={`swatch swatch-${kind}`}><canvas ref={ref} width={96} height={96}/></span>;
}
export function Workbench() {
  const [config,setConfig]=useState<Configuration>({...INITIAL});
  const [command,setCommand]=useState<ViewCommand>({view:'reset',sequence:0});
  const [dark,setDark]=useState(false),[saved,setSaved]=useState<Saved[]>([]);
  const [panel,setPanel]=useState<'saved'|'export'|'parts'|null>(null);
  const [name,setName]=useState(''),[notice,setNotice]=useState(''),[ready,setReady]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const stage=useRef<HTMLDivElement>(null),object=useRef<T.Group|null>(null);
  useEffect(()=>{
    const pref=localStorage.getItem('racket-theme');setDark(pref?pref==='dark':matchMedia('(prefers-color-scheme: dark)').matches);
    try {const items=JSON.parse(localStorage.getItem(STORE)||'[]'); if(Array.isArray(items))setSaved(items.filter(v=>v && typeof v.id==='string' && typeof v.name==='string' && typeof v.image==='string' && validConfig(v.config)));} catch {/* empty collection */}
    const params=new URLSearchParams(location.search);const c={guard:params.get('guard'),body:params.get('body'),hardware:params.get('hardware'),exploded:false};if(validConfig(c))setConfig(c);
  },[]);
  useEffect(()=>{document.documentElement.classList.toggle('dark',dark);return()=>document.documentElement.classList.remove('dark');},[dark]);
  useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),4500);return()=>clearTimeout(t);},[notice]);
  const onObject=useCallback((o:T.Group|null)=>{object.current=o;},[]);
  const onReady=useCallback(()=>setReady(true),[]),onError=useCallback((s:string)=>setError(s),[]);
  const onCamera=useCallback((s:string)=>stage.current?.setAttribute('data-camera',s),[]);
  const change=<K extends keyof Configuration>(k:K,v:Configuration[K])=>setConfig(c=>({...c,[k]:v}));
  const view=(v:ViewCommand['view'])=>setCommand(c=>({view:v,sequence:c.sequence+1}));
  const toggleTheme=()=>{setDark(!dark);localStorage.setItem('racket-theme',dark?'light':'dark');};
  const guard=GUARDS.find(g=>g.id===config.guard)??GUARDS[1];
  const persist=(items:Saved[])=>{try{localStorage.setItem(STORE,JSON.stringify(items));setSaved(items);return true;}catch{setNotice('Your collection could not be saved. Browser storage may be full.');return false;}};
  function capture() {
    const canvas=stage.current?.querySelector('canvas');if(!canvas)return null;
    const out=document.createElement('canvas');out.width=1200;out.height=1400;const ctx=out.getContext('2d');if(!ctx)return null;
    const css=getComputedStyle(document.documentElement);ctx.fillStyle=css.getPropertyValue('--export-ground').trim();ctx.fillRect(0,0,1200,1400);
    ctx.fillStyle=css.getPropertyValue('--export-ink').trim();ctx.font='100px "Bodoni Moda", serif';ctx.fillText('RACKET',65,125);ctx.font='22px "DM Sans", sans-serif';ctx.fillText('01 / ONE FORM. YOUR FINISH.',68,170);
    const scale=Math.min(1060/canvas.width,1030/canvas.height);ctx.drawImage(canvas,(1200-canvas.width*scale)/2,205,canvas.width*scale,canvas.height*scale);
    ctx.font='24px "DM Sans", sans-serif';ctx.fillText(`${guard?.name} / ${config.body === 'bone'?'Bone':'Black'} / ${config.hardware === 'chrome'?'Chrome':'Brushed'}`,65,1300);ctx.font='17px "IBM Plex Mono", monospace';ctx.fillText('RACKET / LONDON                              VISUAL PROTOTYPE',65,1350);return out;
  }
  function save(){const image=capture()?.toDataURL('image/jpeg',.6)||'';const item={id:crypto.randomUUID(),name:name.trim()||`RACKET 01 / ${guard?.name}`,config:{...config},image};if(persist([...saved,item])){setName('');setNotice('A keeper. Saved to your collection.');}}
  async function exportImage(){setBusy(true);try{const c=capture();if(!c)throw Error();const blob=await new Promise<Blob|null>(resolve=>c.toBlob(resolve,'image/png'));if(!blob)throw Error();await deliverFile(blob,'RACKET-01-'+config.guard+'.png');setNotice('Your point of view, exported.');}catch{setNotice('Image export unavailable. Please try again.');}finally{setBusy(false);}}
  async function exportModel(){const o=object.current;if(!o)return;setBusy(true);try{o.updateMatrixWorld(true);const result=await new GLTFExporter().parseAsync(o,{binary:true});if(!(result instanceof ArrayBuffer))throw Error();await deliverFile(new Blob([result],{type:'model/gltf-binary'}),'RACKET-01-'+config.guard+'.glb');setNotice('Your 3D configuration, exported.');}catch{setNotice('3D export unavailable. Please try Chrome or Firefox.');}finally{setBusy(false);}}
  async function share(){const url=new URL(location.href);url.search='';url.searchParams.set('guard',config.guard);url.searchParams.set('body',config.body);url.searchParams.set('hardware',config.hardware);try{await navigator.clipboard.writeText(url.toString());setNotice('Configuration link copied.');}catch{setNotice('Link copying is unavailable in this browser.');}}
  return <main className="racket-app">
    <header className="brand-header"><div className="brand">RACKET<span>®</span></div><div className="header-right"><span className="header-motto">A DIFFERENT ANGLE.<ArrowUpRight size={14}/></span><div className="header-actions"><Button variant="tool" onClick={()=>setPanel('saved')}><Bookmark/> <span>My configurations</span><span className="collection-count">{String(saved.length).padStart(2,'0')}</span></Button><Button variant="tool" size="icon" title={dark?'Switch to light mode':'Switch to dark mode'} aria-label={dark?'Switch to light mode':'Switch to dark mode'} onClick={toggleTheme}>{dark?<Sun/>:<Moon/>}</Button></div></div></header>
    <div className="intro"><div className="intro-title"><h1>RACKET <span>01</span></h1><span className="intro-divider"/><p>Same instrument.<br/>Different point of view.</p></div><span className="prototype"><i/> FORM &amp; FINISH / VISUAL PROTOTYPE</span></div>
    <div className="workspace"><section className="instrument-stage" ref={stage} aria-label="Interactive guitar stage" data-guard={config.guard} data-body={config.body} data-hardware={config.hardware} data-exploded={config.exploded}>
      <div className="stage-top"><span>01 / THE INSTRUMENT</span><span className="stage-status">{ready?'LIVE / 3D':'PREPARING / 3D'}</span></div>
      <div className="stage-watermark" aria-hidden="true">01</div>
      <div className="canvas-wrap"><Stage config={config} scan={null} command={command} onObject={onObject} onCamera={onCamera} onReady={onReady} onError={onError}/></div>
      <div className="dimension"><span>OVERALL FORM</span><div/><span>~ 1,000 MM</span></div>
      <div className="product-note note-neck"><span>01 — MAPLE NECK</span><p>Six in line.<br/>A familiar feeling.</p></div><div className="product-note note-body"><span>02 — {config.body.toUpperCase()} BODY</span><p>One form.<br/>No wrong answers.</p></div>
      {error&&<div role="alert" className="stage-error">{error}</div>}
      <div className="stage-bottom"><div className="camera-controls" aria-label="Camera controls"><Button variant="tool" aria-pressed={command.view==='front'} onClick={()=>view('front')}>Front</Button><Button variant="tool" aria-pressed={command.view==='rear'} onClick={()=>view('rear')}>Rear</Button><Button variant="tool" size="icon" title="Reset camera" aria-label="Reset camera" onClick={()=>view('reset')}><RotateCcw/></Button></div><Button variant="tool" aria-pressed={config.exploded} onClick={()=>{change('exploded',!config.exploded);if(!config.exploded)view('reset');}}><Layers3/><span>Exploded view</span></Button></div>
      <div className="stage-footnote"><span>DIMENSIONAL APPROXIMATION / FIT UNVERIFIED</span><span>DRAG TO TURN ↔</span></div>
    </section>
    <aside className="configuration-rail" aria-label="Configuration choices"><div className="rail-heading"><span className="eyebrow">YOUR POINT OF VIEW</span><h2>Make it <em>yours.</em></h2><p>A mood, not a rule.</p></div>
      <section className="choice-section"><div className="section-label"><h3>Pickguard</h3><span>01 / MATERIAL</span></div><div className="guard-choices">{GUARDS.map(g=><Button key={g.id} variant="material" aria-pressed={config.guard===g.id} onClick={()=>change('guard',g.id)}><Swatch kind={g.id}/><span className="choice-copy"><strong>{g.name}</strong><small>{g.detail}</small></span><span className="choice-check">{config.guard===g.id?<Check/>:<span>{g.number}</span>}</span></Button>)}</div></section>
      <section className="choice-section"><div className="section-label"><h3>Body finish</h3><span>02 / SURFACE</span></div><div className="paired-choices">{(['bone','black'] as const).map(b=><Button key={b} variant="material" aria-pressed={config.body===b} onClick={()=>change('body',b)}><Swatch kind={b}/><span><strong>{b==='bone'?'Bone':'Black'}</strong><small>{b==='bone'?'Warm · Satin':'Deep · Gloss'}</small></span>{config.body===b&&<Check className="pair-check"/>}</Button>)}</div></section>
      <section className="choice-section hardware-section"><div className="section-label"><h3>Hardware</h3><span>03 / DETAIL</span></div><div className="paired-choices">{(['chrome','brushed'] as const).map(h=><Button key={h} variant="material" aria-pressed={config.hardware===h} onClick={()=>change('hardware',h)}><Swatch kind={h}/><span><strong>{h==='chrome'?'Chrome':'Brushed'}</strong><small>{h==='chrome'?'Polished · Bright':'Soft · Industrial'}</small></span>{config.hardware===h&&<Check className="pair-check"/>}</Button>)}</div></section>
      <div className="configuration-summary"><span>YOUR RACKET 01</span><p>{guard?.name} / {config.body==='bone'?'Bone':'Black'} / {config.hardware==='chrome'?'Chrome':'Brushed'}</p></div><div className="primary-actions"><Button variant="racket" onClick={()=>setPanel('saved')} disabled={!ready||!!error}><Bookmark/>Save configuration</Button><Button variant="tool" size="icon" title="Export configuration" aria-label="Export configuration" onClick={()=>setPanel('export')} disabled={!ready||!!error}><Download/></Button></div>
    </aside></div>
    <section className="editorial-strip ai-editorial"><div><span className="eyebrow">A LITTLE DIRECTION. NEVER A DICTATE.</span><h2>What's the mood?</h2></div><MoodRecommendation onApply={c=>{setConfig(c);setNotice('A starting point. Make it your own.');}}/><Button variant="tool" className="parts-link" onClick={()=>setPanel('parts')}>A closer look at the parts<ArrowUpRight/></Button></section>
    <footer className="site-footer"><span>RACKET / LONDON</span><p>An unbuilt idea, not an order. Materials, fit and internal engineering remain proposed.</p><span>ONE FORM. YOUR FINISH.</span></footer>
    <div className={`notice ${notice?'notice-visible':''}`} role="status" aria-live="polite">{notice}</div>
    <Dialog open={panel!==null} onOpenChange={open=>{if(!open)setPanel(null);}}><DialogContent className="racket-dialog"><DialogTitle>{panel==='saved'?'Your collection.':panel==='export'?'Take it with you.':'Under the surface.'}</DialogTitle><DialogDescription>{panel==='saved'?'A few different points of view. Saved on this device.':panel==='export'?'Your RACKET 01. Outside the frame.':'A dimensional prototype. Not production engineering.'}</DialogDescription>
      {panel==='saved'&&<><form className="save-form" onSubmit={e=>{e.preventDefault();save();}}><label htmlFor="config-name">NAME THIS CONFIGURATION</label><div><input id="config-name" placeholder={`RACKET 01 / ${guard?.name}`} value={name} maxLength={60} onChange={e=>setName(e.target.value)}/><Button variant="racket" type="submit" disabled={!ready||!!error}><Plus/>Save</Button></div></form><div className="saved-grid">{saved.length===0?<p className="empty-collection">Nothing here yet. Some things are worth keeping.</p>:saved.map(s=><article className="saved-item" key={s.id}>{s.image&&<img src={s.image} alt={s.name}/>}<div><h3>{s.name}</h3><p>{s.config.guard} / {s.config.body} / {s.config.hardware}</p><div><Button variant="tool" onClick={()=>{setConfig({...s.config});view('reset');setPanel(null);setNotice('Back to this point of view.');}}>Load<ArrowUpRight/></Button><Button variant="tool" size="icon" aria-label={`Delete ${s.name}`} title="Delete configuration" onClick={()=>persist(saved.filter(v=>v.id!==s.id))}><Trash2/></Button></div></div></article>)}</div></>}
      {panel==='export'&&<div className="export-options"><Button variant="racket" disabled={busy} onClick={exportImage}><Download/>{busy?'Preparing…':'Image / PNG'}</Button><Button variant="tool" disabled={busy} onClick={exportModel}><Download/>3D configuration / GLB</Button><Button variant="tool" disabled={busy} onClick={share}><Share2/>Copy configuration link</Button><p className="export-disclaimer">Exports contain the displayed dimensional approximation, not the original FLORA mesh. Dimensions and fit are unverified.</p></div>}
      {panel==='parts'&&<div className="parts-list">{[['01','Neck & headstock','Maple neck, rosewood fingerboard. Six-inline tuning keys and 22 frets.'],['02','Body & pickguard','One body form. Four material directions. An independently mounted pickguard.'],['03','Pickups & hardware','Neck single coil, bridge humbucker, fixed bridge and a three-knob control plate.']].map(([n,t,d])=><div key={n}><span>{n}</span><div><h3>{t}</h3><p>{d}</p></div></div>)}<Button variant="racket" onClick={()=>{change('exploded',true);view('reset');setPanel(null);}}>Explore the assembly<Layers3/></Button><p className="export-disclaimer">Original FLORA reference mesh is currently unavailable: source asset access is blocked. This is B's working configurable 3D implementation.</p></div>}
    </DialogContent></Dialog>
  </main>;
}
