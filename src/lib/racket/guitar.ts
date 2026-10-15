import * as T from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createMaterials, type Configuration } from './materials';

export function bodyOutline() {
  const s = new T.Shape();
  s.moveTo(-.12, -4.24);
  s.bezierCurveTo(-1.05,-4.3,-1.65,-4.08,-1.66,-3.48);
  s.bezierCurveTo(-1.71,-2.83,-1.06,-2.15,-1.04,-1.54);
  s.bezierCurveTo(-1.01,-1.06,-1.5,-.27,-1.32,.12);
  s.bezierCurveTo(-1.22,.38,-.99,.30,-.98,.04);
  s.bezierCurveTo(-.96,-.51,-.63,-.77,-.28,-.62);
  s.lineTo(.28,-.76);
  s.bezierCurveTo(.67,-1.12,1.05,-.81,1.13,-.39);
  s.bezierCurveTo(1.22,-.06,1.44,-.15,1.46,-.48);
  s.bezierCurveTo(1.55,-1.05,1.1,-1.59,1.12,-2.02);
  s.bezierCurveTo(1.15,-2.61,1.8,-3.29,1.64,-3.75);
  s.bezierCurveTo(1.51,-4.2,.84,-4.3,-.12,-4.24);
  return s;
}
function roundedPath(x: number,y: number,w: number,h: number,r: number) {
  const s = new T.Path(); s.moveTo(x+r,y); s.lineTo(x+w-r,y); s.quadraticCurveTo(x+w,y,x+w,y+r); s.lineTo(x+w,y+h-r); s.quadraticCurveTo(x+w,y+h,x+w-r,y+h); s.lineTo(x+r,y+h); s.quadraticCurveTo(x,y+h,x,y+h-r); s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y); return s;
}
export function guardOutline() {
  const s = new T.Shape(); s.moveTo(-.98,-.63);
  s.bezierCurveTo(-.83,-.63,-.52,-.98,-.29,-.96); s.lineTo(.29,-1.06);
  s.bezierCurveTo(.78,-1.23,1.12,-.94,1.20,-.45);
  s.bezierCurveTo(1.25,-.30,1.33,-.40,1.32,-.61);
  s.bezierCurveTo(1.31,-1.16,1.02,-1.64,1.02,-2.04);
  s.bezierCurveTo(1.04,-2.42,1.35,-2.95,1.38,-3.2);
  s.bezierCurveTo(1.40,-3.37,1.24,-3.40,1.20,-3.24);
  s.lineTo(1.05,-2.72); s.bezierCurveTo(.97,-2.45,.67,-2.49,.65,-2.76);
  s.lineTo(.65,-3.05); s.lineTo(.41,-2.96); s.lineTo(-.36,-2.96);
  s.quadraticCurveTo(-.41,-3.12,-.58,-3.12); s.lineTo(-.99,-3.12);
  s.bezierCurveTo(-1.27,-3.08,-1.20,-2.58,-1.02,-2.11);
  s.bezierCurveTo(-.78,-1.49,-.94,-1.14,-1.03,-.84); s.quadraticCurveTo(-1.08,-.63,-.98,-.63);
  s.holes.push(roundedPath(-.46,-1.62,.92,.21,.1));
  s.holes.push(roundedPath(-.46,-2.66,.92,.48,.065));
  return s;
}
function extrude(s: T.Shape, depth: number, bevel: number) {
  return new T.ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelSegments: 4, steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 40 });
}
function planarUV(g: T.BufferGeometry, xmin: number, ymin: number,w: number,h: number) {
  const p = g.getAttribute('position'); const uv = g.getAttribute('uv');
  for (let i = 0; i < p.count; i++) uv.setXY(i,(p.getX(i)-xmin)/w,(p.getY(i)-ymin)/h); uv.needsUpdate = true;
}
export function buildGuitar(config: Configuration) {
  const m = createMaterials(config), root = new T.Group(); root.name = 'RACKET_01_dimensional_approximation';
  const e = config.exploded ? 1 : 0;
  const add = (name: string, geometry: T.BufferGeometry, material: T.Material, pos: [number,number,number], parent = root) => { const mesh = new T.Mesh(geometry,material); mesh.name = name; mesh.position.set(...pos); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh; };
  const box = (name: string,w: number,h: number,d: number,x: number,y: number,z: number,mat: T.Material=m.hardware,r=.015,parent=root) => add(name,new RoundedBoxGeometry(w,h,d,2,r),mat,[x,y,z],parent);
  const disc = (name: string,r: number,d: number,x: number,y: number,z: number,mat=m.hardware,parent=root) => { const g = new T.CylinderGeometry(r,r,d,20); g.rotateX(Math.PI/2); return add(name,g,mat,[x,y,z],parent); };
  const body = extrude(bodyOutline(),.30,.10); add('Body',body,m.body,[0,0,-.20]);
  const pickguard = extrude(guardOutline(),.025,.012); planarUV(pickguard,-1.2,-3.4,2.6,3.0); add('Pickguard',pickguard,m.guard,[0,0,.225+e*.85]);
  const screwGeos: T.BufferGeometry[]=[];
  const screw = (x:number,y:number,z:number) => { const g = new T.SphereGeometry(.027,8,6); g.scale(1,1,.38); g.translate(x,y,z); screwGeos.push(g); };
  [[-.97,-.76],[1.24,-.55],[1.15,-1.24],[-.93,-1.56],[-1.1,-2.55],[-.98,-3.01],[.51,-2.86],[.76,-2.1],[.61,-1.27],[1.30,-3.23]].forEach(([x,y]) => screw(x ?? 0,y ?? 0,.272+e*.85));
  // Neck and six-inline headstock are a separate assembly.
  const neck = new T.Group(); neck.name = 'Maple_neck_assembly'; neck.position.set(0,e*.40,-e*.25); root.add(neck);
  const ns = new T.Shape(); ns.moveTo(-.275,-1.13); ns.lineTo(.275,-1.13); ns.lineTo(.20,4.28); ns.lineTo(-.20,4.28); ns.closePath();
  const ng = extrude(ns,.23,.045); planarUV(ng,-.3,-1.2,.6,5.5); add('Maple_neck',ng,m.maple,[0,0,-.12],neck);
  const fs = new T.Shape(); fs.moveTo(-.274,-1.14); fs.lineTo(.274,-1.14); fs.lineTo(.198,4.23); fs.lineTo(-.198,4.23); fs.closePath();
  const fg = extrude(fs,.055,.012); planarUV(fg,-.28,-1.15,.56,5.4); add('Rosewood_fingerboard',fg,m.board,[0,0,.185],neck);
  const fretGeos: T.BufferGeometry[]=[]; const dotGeos:T.BufferGeometry[]=[];
  for(let i=1;i<=22;i++) {
    const y = 4.14 - 7.3*(1-Math.pow(2,-i/12)); const w = .40+(4.14-y)*.027;
    const g = new T.CylinderGeometry(.008,.008,w,6); g.rotateZ(Math.PI/2); g.translate(0,y,.262); fretGeos.push(g);
    if([3,5,7,9,12,15,17,19,21].includes(i)) {
      const prev=4.14-7.3*(1-Math.pow(2,-(i-1)/12)); const cy=(y+prev)/2;
      for(const x of i===12 ? [-.085,.085] : [0]) { const d = new T.CircleGeometry(.027,12); d.translate(x,cy,.255); dotGeos.push(d); }
    }
  }
  const frets=mergeGeometries(fretGeos); if(frets) add('22_frets',frets,m.hardware,[0,0,0],neck);
  const dots=mergeGeometries(dotGeos); if(dots) add('Position_inlays',dots,m.dots,[0,0,0],neck);
  box('Nut',.42,.065,.09,0,4.19,.27,m.cream,.01,neck);
  const hs = new T.Shape(); hs.moveTo(-.20,4.22); hs.lineTo(.20,4.22); hs.bezierCurveTo(.22,4.45,.40,4.42,.34,4.72); hs.lineTo(.30,5.14); hs.bezierCurveTo(.30,5.43,.65,5.56,.48,5.87); hs.bezierCurveTo(.31,6.15,-.09,6.10,-.17,5.82); hs.lineTo(-.42,4.55); hs.quadraticCurveTo(-.44,4.43,-.20,4.22);
  const hg=extrude(hs,.16,.035); planarUV(hg,-.45,4.2,1,1.95); add('Six_inline_headstock',hg,m.maple,[0,0,-.03],neck);
  add('RACKET_lettering',new T.PlaneGeometry(.40,1.10),m.logo,[.16,5.04,.168],neck);
  const tunerGeos:T.BufferGeometry[]=[];
  for(let i=0;i<6;i++) {
    const y=4.53+i*.24,x=-.27+i*.05;
    disc(`Tuner_${i+1}`,.055,.14,x,y,.18,m.hardware,neck);
    const stem = new T.CylinderGeometry(.021,.021,.20,10); stem.rotateZ(Math.PI/2); stem.translate(x-.14,y,.05); tunerGeos.push(stem);
    const key=new T.SphereGeometry(.064,10,8); key.scale(.7,1, .45); key.translate(x-.25,y,.05); tunerGeos.push(key);
  }
  const tuners=mergeGeometries(tunerGeos); if(tuners) add('Six_inline_tuning_keys',tuners,m.hardware,[0,0,0],neck);
  // Exactly two pickups, independently editable and mounted through guard holes.
  const pickupZ=.31+e*1.48;
  const pickups = new T.Group(); pickups.name='Two_pickups'; root.add(pickups);
  box('Neck_single_coil',.83,.18,.13,0,-1.515,pickupZ,m.cream,.08,pickups);
  box('Bridge_humbucker_frame',.91,.47,.04,0,-2.42,pickupZ-.035,m.hardware,.035,pickups);
  for(let row=0;row<2;row++) box(`Humbucker_bobbin_${row+1}`,.81,.205,.115,0,-2.53+row*.22,pickupZ+.02,m.black,.06,pickups);
  const poles:T.BufferGeometry[]=[];
  for(let i=0;i<6;i++) for(const y of [-1.515,-2.53,-2.31]) { const g=new T.CylinderGeometry(.021,.021,.014,10); g.rotateX(Math.PI/2); g.translate(-.307+i*.123,y,pickupZ+.088); poles.push(g); }
  const pg=mergeGeometries(poles); if(pg) add('18_pickup_poles',pg,m.hardware,[0,0,0]);
  // Separate, elongated control plate. Three independently named knobs.
  const platePath=roundedPath(.76,-3.92,.39,1.49,.19); const ps=new T.Shape(platePath.getPoints(50));
  add('Control_plate',extrude(ps,.027,.014),m.hardware,[0,0,.22+e*1.15]);
  for(let i=0;i<3;i++) {
    const y=-2.72-i*.47,z=.32+e*1.85;
    disc(`Knob_${i+1}`,.108,.14,.955,y,z); disc(`Knob_${i+1}_cap`,.086,.006,.955,y,z+.075);
    box(`Knob_${i+1}_indicator`,.009,.04,.008,.955,y+.043,z+.081,m.black,.002);
  }
  screw(.955,-2.50,.265+e*1.15); screw(.955,-3.84,.265+e*1.15);
  const bridgeZ=.29+e*.48;
  box('Fixed_bridge_base',.92,.48,.075,0,-3.21,bridgeZ,m.hardware,.03);
  for(let i=0;i<6;i++) {
    const x=-.32+i*.128;
    box(`Saddle_${i+1}`,.105,.27,.09,x,-3.19+(i%3)*.025,bridgeZ+.075,m.hardware,.013);
    const spring=new T.CylinderGeometry(.014,.014,.13,8); add(`Saddle_screw_${i+1}`,spring,m.hardware,[x,-3.35,bridgeZ+.10]);
    screw(x,-3.01,bridgeZ+.045);
  }
  const strings:T.BufferGeometry[]=[];
  for(let i=0;i<6;i++) {
    const start=new T.Vector3(-.32+i*.128,-3.30,.46+e*2.35); const end=new T.Vector3(-.15+i*.06,4.21,.35+e*2.35);
    const len=start.distanceTo(end); const g=new T.CylinderGeometry(.0035+i*.0006,.0035+i*.0006,len,5); g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),end.clone().sub(start).normalize())); g.translate(...start.clone().add(end).multiplyScalar(.5).toArray()); strings.push(g);
    // Strings continue from nut to individual tuner posts.
    const tip=new T.Vector3(-.27+i*.05,4.53+i*.24,.23+e*2.35); const g2=new T.CylinderGeometry(.0035,.0035,end.distanceTo(tip),5); g2.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),tip.clone().sub(end).normalize())); g2.translate(...end.clone().add(tip).multiplyScalar(.5).toArray()); strings.push(g2);
  }
  const sg=mergeGeometries(strings); if(sg) add('Six_strings',sg,m.strings,[0,0,0]);
  const screws=mergeGeometries(screwGeos); if(screws) add('Mounting_screws',screws,m.hardware,[0,0,0]);
  // Rear ferrules and neck mounting plate are genuine rear-facing geometry.
  box('Rear_neck_plate',.48,.52,.025,0,-.86,-.314,m.hardware,.025);
  for(let i=0;i<6;i++) disc(`Rear_string_ferrule_${i+1}`,.035,.012,-.32+i*.128,-3.43,-.31);
  root.userData = { disclaimer:'Dimensional approximation. Dimensions and fit unverified.', configuration: config };
  return root;
}
export function disposeGuitar(root:T.Object3D) {
  const materials=new Set<T.Material>(), textures=new Set<T.Texture>();
  root.traverse(o=>{ if(o instanceof T.Mesh) { o.geometry.dispose(); const a=Array.isArray(o.material)?o.material:[o.material]; a.forEach(m=>materials.add(m)); } });
  materials.forEach(m=>{ Object.values(m).forEach(v=>{ if(v instanceof T.Texture) textures.add(v); }); m.dispose(); }); textures.forEach(t=>t.dispose());
}
