import * as THREE from 'three';

export type Guard = 'bone' | 'blue' | 'tortoise' | 'engraved';
export type Configuration = { guard: Guard; body: 'bone' | 'black'; hardware: 'chrome' | 'brushed'; exploded: boolean };
export const INITIAL: Configuration = { guard: 'blue', body: 'bone', hardware: 'chrome', exploded: false };
export const GUARDS: { id: Guard; number: string; name: string; detail: string }[] = [
  { id: 'bone', number: '00', name: 'Bone', detail: 'Warm ivory · Satin' },
  { id: 'blue', number: '01', name: 'Blue', detail: 'Ultramarine · Marbled' },
  { id: 'tortoise', number: '02', name: 'Tortoise', detail: 'Dark amber · Mottled' },
  { id: 'engraved', number: '03', name: 'Engraved', detail: 'Silver · Ornamental' },
];
// All render-material colors live here; interface colors live in styles.css.
export const palette = { bone: '#e7ddbf', black: '#151616', maple: '#cda66b', rosewood: '#39291f', cream: '#e9debb', metal: '#bfc2bf', steel: '#999b94', pickup: '#171a19', ink: '#30291e', inlay: '#e9e4d1' };
function seeded(seed = 81) { let s = seed; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export function textureCanvas(kind: Guard | 'maple' | 'rosewood' | 'logo'): HTMLCanvasElement {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const c = canvas.getContext('2d'); if (!c) return canvas;
  const rnd = seeded();
  if (kind === 'logo') {
    c.clearRect(0, 0, 512, 512); c.fillStyle = palette.ink; c.font = '54px Georgia'; c.textAlign = 'center'; c.translate(256, 256); c.rotate(-Math.PI / 2); c.fillText('RACKET', 0, 18); return canvas;
  }
  if (kind === 'blue' || kind === 'tortoise') {
    const img = c.createImageData(512, 512);
    for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
      const u = x / 512, v = y / 512;
      const warp = Math.sin(u * 21 + Math.sin(v * 17) * 2) + Math.cos(v * 26 + u * 11);
      const a = Math.sin(u * 49 + v * 27 + warp * 3.6);
      const b = Math.sin(v * 68 - u * 24 + warp * 2.9);
      const noise = rnd() * 0.1;
      const n = (a * b + 1) * 0.5;
      const vein = Math.pow(Math.max(0, 1 - Math.abs(Math.sin(warp * 3 + u * 12 + v * 19)) * 5), 3);
      const idx = (y * 512 + x) * 4;
      const rgb = kind === 'blue' ? [8 + n * 9 + vein * 15, 17 + n * 24 + vein * 45, 75 + n * 85 + vein * 62] : [22 + Math.pow(n, 4) * 145 + vein * 30, 11 + Math.pow(n, 5) * 58 + vein * 15, 6 + Math.pow(n, 6) * 13];
      for (let k = 0; k < 3; k++) img.data[idx + k] = (rgb[k] ?? 0) * (0.95 + noise);
      img.data[idx + 3] = 255;
    }
    c.putImageData(img, 0, 0);
  } else if (kind === 'engraved') {
    c.fillStyle = '#bcbcb2'; c.fillRect(0, 0, 512, 512);
    for (let y = -40; y < 560; y += 64) for (let x = -40; x < 560; x += 64) {
      c.save(); c.translate(x + (y % 128 ? 32 : 0), y); c.rotate(rnd() * 0.6);
      for (let j = 0; j < 4; j++) {
        c.strokeStyle = j % 2 ? '#dcdcd3' : '#676a61'; c.lineWidth = 1.1;
        c.beginPath();
        for (let t = 0; t < 10; t += 0.08) { const r = 2.8 * t + j * 1.5; const px = Math.cos(t) * r, py = Math.sin(t) * r; if (!t) c.moveTo(px, py); else c.lineTo(px, py); }
        c.stroke();
      }
      for (let a = 0; a < 6; a++) { c.rotate(Math.PI / 3); c.strokeStyle = '#777a70'; c.beginPath(); c.moveTo(16, 4); c.bezierCurveTo(40, -18, 44, 30, 17, 9); c.stroke(); }
      c.restore();
    }
  } else if (kind === 'maple' || kind === 'rosewood') {
    c.fillStyle = kind === 'maple' ? palette.maple : palette.rosewood; c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 400; i++) { c.strokeStyle = kind === 'maple' ? `rgba(106,66,25,${rnd() * .16})` : `rgba(192,146,88,${rnd() * .19})`; c.lineWidth = rnd() * 2; const x = rnd() * 512; c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + rnd() * 15, 160, x - rnd() * 15, 370, x + rnd() * 8, 512); c.stroke(); }
  } else {
    c.fillStyle = palette.bone; c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1800; i++) { c.fillStyle = `rgba(107,87,53,${rnd() * .07})`; c.fillRect(rnd() * 512, rnd() * 512, 1, 1); }
  }
  return canvas;
}
export function makeTexture(kind: Parameters<typeof textureCanvas>[0]) {
  const t = new THREE.CanvasTexture(textureCanvas(kind)); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}
export function createMaterials(config: Configuration) {
  const guardMap = makeTexture(config.guard);
  const hardware = new THREE.MeshStandardMaterial({ color: palette.metal, metalness: .82, roughness: config.hardware === 'chrome' ? .22 : .55 });
  const body = new THREE.MeshPhysicalMaterial({ color: config.body === 'black' ? palette.black : palette.bone, roughness: .25, clearcoat: .8, clearcoatRoughness: .22 });
  const guard = new THREE.MeshPhysicalMaterial({ map: guardMap, metalness: config.guard === 'engraved' ? .85 : .05, roughness: config.guard === 'bone' ? .43 : .32, clearcoat: config.guard === 'engraved' ? .1 : .18, bumpMap: config.guard === 'engraved' ? guardMap : null, bumpScale: .006 });
  return { body, guard, hardware, maple: new THREE.MeshStandardMaterial({ map: makeTexture('maple'), roughness: .42 }), board: new THREE.MeshStandardMaterial({ map: makeTexture('rosewood'), roughness: .6 }), cream: new THREE.MeshStandardMaterial({ color: palette.cream, roughness: .4 }), black: new THREE.MeshStandardMaterial({ color: palette.pickup, roughness: .35 }), dots: new THREE.MeshStandardMaterial({ color: palette.inlay, roughness: .4 }), strings: new THREE.MeshStandardMaterial({ color: palette.steel, metalness: .9, roughness: .28 }), logo: new THREE.MeshBasicMaterial({ map: makeTexture('logo'), transparent: true, depthWrite: false }) };
}
