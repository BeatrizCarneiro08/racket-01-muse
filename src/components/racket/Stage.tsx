import { Component, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { OrbitControls as OrbitImpl } from 'three-stdlib';
import * as T from 'three';
import { buildGuitar, disposeGuitar } from '@/lib/racket/guitar';
import { type Configuration } from '@/lib/racket/materials';

export type ViewCommand = { view: 'front' | 'rear' | 'reset'; sequence: number };
class RenderBoundary extends Component<{ children: ReactNode; onError: (message:string)=>void }, { failed:boolean }> {
  override state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  override componentDidCatch(){this.props.onError('3D rendering is unavailable. Try a WebGL-enabled browser.');}
  override render(){return this.state.failed?null:this.props.children;}
}
function Scene({config, scan, command, onObject, onCamera, onReady, onError}:{config:Configuration;scan:T.Group|null;command:ViewCommand;onObject:(o:T.Group|null)=>void;onCamera:(v:string)=>void;onReady:()=>void;onError:(message:string)=>void}) {
  const object=useMemo(()=>buildGuitar(config),[config]);
  const controls=useRef<OrbitImpl>(null);
  const modelHolder=useRef<T.Group>(null);
  const {camera,size,gl}=useThree();
  useEffect(()=>{onObject(object); onReady(); return ()=>{onObject(null);disposeGuitar(object);};},[object,onObject,onReady]);
  useEffect(()=>{const holder=modelHolder.current;if(!holder)return;const displayed=scan??object;holder.add(displayed);return()=>{holder.remove(displayed);};},[scan,object]);
  const distance = Math.max(size.width < 400 ? 18.8 : 16.1, 5.6 / Math.tan(T.MathUtils.degToRad(19)), 2.0 / Math.tan(T.MathUtils.degToRad(19)) / (size.width/size.height));
  useEffect(()=>{
    const c=controls.current;if(!c)return;
    const rear=command.view==='rear';
    camera.position.set(command.view==='reset'?distance*.11:0,.9,rear?-distance:distance);
    c.target.set(0,.9,.15); c.update();
  },[camera,command,distance]);
  useEffect(()=>{const handler=(e:Event)=>{e.preventDefault();onError('The 3D connection was lost. Reload to reconnect.');}; gl.domElement.addEventListener('webglcontextlost',handler);return()=>gl.domElement.removeEventListener('webglcontextlost',handler);},[gl,onError]);
  useEffect(()=>{
    const element=gl.domElement;
    const handler=(event:KeyboardEvent)=>{
      const c=controls.current;if(!c)return;
      const offset=camera.position.clone().sub(c.target);
      if(event.key==='ArrowLeft'||event.key==='ArrowRight') offset.applyAxisAngle(new T.Vector3(0,1,0),event.key==='ArrowLeft'?.12:-.12);
      else if(event.key==='+'||event.key==='=') offset.multiplyScalar(.92);
      else if(event.key==='-') offset.multiplyScalar(1.08);
      else return;
      event.preventDefault();offset.clampLength(7,36);camera.position.copy(c.target).add(offset);c.update();
    };
    element.addEventListener('keydown',handler);return()=>element.removeEventListener('keydown',handler);
  },[camera,gl]);
  return <>
    <ambientLight intensity={.65}/>
    <directionalLight position={[-5,7,9]} intensity={2.0}/>
    <directionalLight position={[5,2,-6]} intensity={1.1}/>
    <Environment resolution={128} environmentIntensity={.45}>
      <Lightformer intensity={2} position={[-4,2,6]} rotation-y={Math.PI} scale={[5,12,1]}/>
      <Lightformer intensity={1.5} position={[0,1,8]} rotation-y={Math.PI} scale={[8,12,1]}/>
      <Lightformer intensity={2} position={[5,4,2]} rotation-y={-Math.PI*2/3} scale={[4,10,1]}/>
      <Lightformer intensity={1} position={[0,5,-5]} scale={[8,8,1]}/>
    </Environment>
    <group ref={modelHolder} rotation-z={-.065}/>
    <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping={false} minDistance={7} maxDistance={36} rotateSpeed={.7} zoomSpeed={.75} target={[0,.9,.15]} onChange={()=>onCamera(camera.position.toArray().map(n=>n.toFixed(3)).join(','))}/>
  </>;
}
export function Stage(props:Parameters<typeof Scene>[0]&{onError:(message:string)=>void}) {
  return <RenderBoundary onError={props.onError}><Canvas dpr={[1,1.5]} camera={{position:[0,.9,17],fov:38,near:.1,far:100}} gl={{antialias:true,alpha:true,preserveDrawingBuffer:true}} fallback={<div className="stage-error">WebGL is unavailable. Please try a browser with 3D support.</div>} onCreated={({gl})=>{gl.domElement.setAttribute('aria-label','Interactive RACKET guitar. Drag or use left and right arrow keys to rotate. Scroll or use plus and minus to zoom.');gl.domElement.setAttribute('role','img');gl.domElement.tabIndex=0;}}><Scene {...props}/></Canvas></RenderBoundary>;
}
