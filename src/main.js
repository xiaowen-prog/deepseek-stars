import {VISUAL} from './visual-palette.js';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { MILESTONES, PLATES } from './data.js';
import { createBuilders } from './objects.js?v=15.1';
import { reviseBuilders } from './revised-scenes.js?v=16';
import { createSceneUI } from './scene-ui.js';
import { grokBuilders } from './grok-scenes.js';
import { createOpening } from '../modules/bookends/opening.js';
import { createEnding } from '../modules/bookends/ending.js?v=16';
import { CONFIG } from '../modules/bookends/config.js';

const CDN = {
  gsap: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js',
  ScrollTrigger: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js',
};
const load = (src) => new Promise((ok) => { const s = document.createElement('script'); s.src = src; s.onload = s.onerror = ok; document.head.appendChild(s); });
for (const k of Object.keys(CDN)) if (!window[k]) await load(CDN[k]);
const { gsap, ScrollTrigger } = window;


/* preload official whale particle cloud */
try {
  const r = await fetch('./assets/whale-particles.json');
  const j = await r.json();
  window.__whalePos = j.pos;
} catch (e) { window.__whalePos = null; }

const INIT_HASH = location.hash; // captured before any replaceState
let hashReady = !/^#(y\d{4}|end)$/.test(INIT_HASH);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const QS = new URLSearchParams(location.search);
const N = MILESTONES.length; // 12
const KEYS = N + 3;          // 0 intro … 12 R1, 13 slogan, 14 logo, 15 info
// ending (seg 12.5→KEYS) gets extra scroll distance so its phases breathe
const END_S = 12.5, END_EXT = 2.5, SPAN = KEYS + END_EXT;
const segFromRaw = (r) => r <= END_S ? r : END_S + (r - END_S) * (KEYS - END_S) / (KEYS - END_S + END_EXT);
const rawFromSeg = (k) => k <= END_S ? k : END_S + (k - END_S) * (KEYS - END_S + END_EXT) / (KEYS - END_S);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

/* Depth HUD (STORYBOARD scale) */
const DEPTHS = [200, 700, 1300, 1500, 2600, 4300, 4400, 5400, 6600, 6900, 7300, 7900, 8200, 9000, 10000, 10994]; /* DC#2: one continuous dive — opening 0→200, story →8200, ending →10994 (Challenger Deep) */

/* Camera path — 5 acts, distinct motion
   Act1 dawn  (1–3):  forward dive along -Z
   Act2 winter(4–6):  sideways +X drift
   Act3 rise  (7–8):  vertical ascent +Y
   Act4 burst (9–11): fastest forward dive
   Act5 whale (12):   hold-form, then rise to ending
*/
const OBJ = [
  V3(0, -0.6, -12),   // 0 unused look
  V3(0, -8, -50),     // 1 Turing
  V3(0, -16, -96),    // 2 Dartmouth
  V3(0, -24, -142),   // 3 Perceptron
  V3(28, -28, -150),  // 4 Winter I  (side)
  V3(52, -28, -150),  // 5 Winter II
  V3(76, -28, -150),  // 6 Backprop
  V3(76, 8, -170),    // 7 Deep Blue (above)
  V3(76, -6, -200),   // 8 CUDA merge
  V3(76, -30, -280),  // 9 AlexNet
  V3(76, -38, -320),  // 10 Move 37
  V3(76, -46, -360),  // 11 ChatGPT
  V3(76, -54, -400),  // 12 R1
  V3(76, -48, -400),  // 13 slogan (rise)
  V3(76, -42, -400),  // 14 logo
  V3(76, -36, -400),  // 15 info
];
const CAM = [
  V3(0, 0, 0),
  V3(0, -7.4, -38),
  V3(0, -15.4, -84),
  V3(0, -23.4, -130),
  V3(16, -27.4, -150),  // look +X at winter grid
  V3(40, -27.4, -150),
  V3(64, -27.4, -150), // face the rule tree; rise only during the Deep Blue handoff
  V3(76, 13, -156),     // look down onto the placed king and board
  V3(76, -5.4, -188),
  V3(76, -29.4, -268),
  V3(76, -37.4, -308),
  V3(76, -45.4, -348),
  V3(76, -53.4, -388),
  V3(76, -46, -392),    // 13 slogan rise
  V3(76, -40, -394),    // 14 logo
  V3(76, -34, -396),    // 15 info
];
const LOOK = OBJ.map((o, i) => (i === 0 ? OBJ[1].clone() : o.clone()));
LOOK[13] = V3(76, -48, -400);
LOOK[14] = V3(76, -44, -400);
LOOK[15] = V3(76, -40, -400);

const keyPos = (k) => CAM[Math.min(k, KEYS)].clone();
const anchor = (k) => OBJ[Math.min(k, KEYS)].clone();

/* ---------- DOM ---------- */
const cardsEl = document.getElementById('cards');
MILESTONES.forEach((m, i) => {
  const c = document.createElement('article');
  c.className = `card panel ${m.side}`;
  c.dataset.k = i + 1;
  if (m.acc) c.dataset.acc = m.acc;
  if (m.act) c.dataset.act = m.act;
  if (m.acc) c.style.setProperty('--acc', ({blue:'#5B7CFF',amber:'#FFB547',cyan:'#5FE0FF',violet:'#D46AFF',green:'#76FF8A'}[m.acc]||'#5B7CFF'));
  const stI = Math.floor(i / 3);
  c.innerHTML = `<div class="no mono">第${'一二三四'[stI]}章 · ${['一个问题', '寒冬中的暗流', '条件终于汇合', '回答之后'][stI]} · ${String(i + 1).padStart(2, '0')}/${N}</div>
  <div class="yr">${m.year}</div><h3>${m.title}</h3>
  <blockquote>${m.line}</blockquote><p class="fact">${m.fact}</p>
  <p class="src mono"><a href="${m.src}" target="_blank" rel="noopener">来源 ↗ ${m.srcName}</a>${m.src2 ? `<a href="${m.src2}" target="_blank" rel="noopener">↗ ${m.srcName2}</a>` : ''}${m.src3 ? `<a href="${m.src3}" target="_blank" rel="noopener">↗ ${m.srcName3}</a>` : ''}</p>`;
  cardsEl.appendChild(c);
});
const panels = [...document.querySelectorAll('.panel')].sort((a, b) => a.dataset.k - b.dataset.k);
/* ---------- chapter nav (rail pill + expandable menu) ---------- */
const STAGES = [
  { name: '一个问题', ks: [1, 2, 3] },
  { name: '寒冬中的暗流', ks: [4, 5, 6] },
  { name: '条件终于汇合', ks: [7, 8, 9] },
  { name: '回答之后', ks: [10, 11, 12] },
];
const stageOf = (k) => STAGES.findIndex((s) => s.ks.includes(k));
const railNav = document.querySelector('.rail');
railNav.innerHTML = `<button type="button" class="rail-cur" aria-expanded="false" aria-controls="chapters">
  <span class="rc-yr mono">—</span><span class="rc-idx mono">00 / 12</span><span class="rc-ico" aria-hidden="true"></span></button>
  <ol id="rail" aria-hidden="true"></ol>
  <div id="chapters" class="chapters" role="dialog" aria-label="章节目录" hidden>
    <div class="ch-head"><span class="mono">章节目录</span><button type="button" class="ch-close" aria-label="关闭目录">×</button></div>
    <div class="ch-list"></div>
    <button type="button" class="ch-top">↑ 重新下潜</button>
  </div>`;
const rail = railNav.querySelector('#rail');
const chList = railNav.querySelector('.ch-list');
const chPanel = railNav.querySelector('#chapters');
const railBtn = railNav.querySelector('.rail-cur');
STAGES.forEach((st, si) => {
  const h = document.createElement('p'); h.className = 'ch-stage mono'; h.textContent = `${si + 1} · ${st.name}`; chList.appendChild(h);
  st.ks.forEach((k) => {
    const m = MILESTONES[k - 1];
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ch-item'; b.dataset.k = k;
    b.innerHTML = `<span class="mono">${m.year}</span><span>${m.title}</span><em class="mono">${String(k).padStart(2, '0')}</em>`;
    b.addEventListener('click', () => { closeMenu(); window.__story.jumpTo(k); });
    chList.appendChild(b);
  });
});
MILESTONES.forEach((m, i) => {
  const li = document.createElement('li'); li.title = m.year;
  li.addEventListener('click', () => window.__story.jumpTo(i + 1));
  rail.appendChild(li);
});
const chItems = [...chList.querySelectorAll('.ch-item')];
function openMenu() {
  chPanel.hidden = false; railBtn.setAttribute('aria-expanded', 'true'); railNav.classList.add('open');
  (chItems.find((b) => +b.dataset.k === activeK) || chItems[0]).focus();
}
function closeMenu(refocus) {
  if (chPanel.hidden) return;
  chPanel.hidden = true; railBtn.setAttribute('aria-expanded', 'false'); railNav.classList.remove('open');
  if (refocus) railBtn.focus();
}
railBtn.addEventListener('click', () => (chPanel.hidden ? openMenu() : closeMenu(true)));
railNav.querySelector('.ch-close').addEventListener('click', () => closeMenu(true));
railNav.querySelector('.ch-top').addEventListener('click', () => { closeMenu(); window.__story.jumpTo(0); });
chPanel.addEventListener('keydown', (e) => {
  const i = chItems.indexOf(document.activeElement);
  if (e.key === 'Escape') { e.preventDefault(); closeMenu(true); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); chItems[Math.min(chItems.length - 1, i + 1)].focus(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); chItems[Math.max(0, i - 1)].focus(); }
  e.stopPropagation(); // don't let page keys (space/arrows) scroll behind the menu
});
addEventListener('pointerdown', (e) => { if (!chPanel.hidden && !railNav.contains(e.target)) closeMenu(); });
const railDots = [...rail.children];
const depthEl = document.getElementById('depth');
const FX = { el: document.getElementById('fx'), c: '' };
const HOLD = document.getElementById('hold');
const TAP = document.getElementById('tap');
document.getElementById('scroll').style.height = `${Math.round((1 + SPAN * 1.65) * 100)}vh`;
document.body.style.minHeight = document.getElementById('scroll').style.height;

/* ---------- renderer ---------- */
const canvas = document.getElementById('gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  document.documentElement.classList.add('static');
  document.getElementById('loader')?.remove();
  panels.forEach((p) => p.classList.add('on'));
  throw e;
}
const MOBILE = matchMedia('(max-width: 760px)').matches || matchMedia('(pointer: coarse)').matches;
// Keep readable geometry at device resolution; lower particle work before resolution.
const BASE_DPR = Math.min(devicePixelRatio || 1, MOBILE ? 1.75 : 2);
let DPR = BASE_DPR;
renderer.setPixelRatio(DPR);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;

const scene = new THREE.Scene();
const BG_TOP = new THREE.Color(0x0c1a2e), BG_DEEP = new THREE.Color(0x03050a);
scene.background = BG_TOP.clone();
scene.fog = new THREE.FogExp2(0x04060c, 0.032);
const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 520);

const FOG = `uniform float uFog; float fogF(float d){ return exp(-pow(d*uFog,1.85)); }`;
const uniforms = { uTime: { value: 0 }, uFog: { value: 0.032 } };

function rimMat(color, power = 2.2, base = 0.08, alpha = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uColor: { value: new THREE.Color(color) }, uPow: { value: power }, uBase: { value: base }, uA: { value: alpha }, uGain: { value: 1 } },
    transparent: alpha < 1, depthWrite: alpha >= 1,
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vD; varying vec3 vW;
      void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); vD=-mv.z; vW=normalize(position); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `${FOG} uniform vec3 uColor; uniform float uPow,uBase,uA,uGain,uTime; varying vec3 vN; varying vec3 vV; varying float vD; varying vec3 vW;
      void main(){
        float ndv=abs(dot(normalize(vN),vV));
        float f=pow(1.-ndv,uPow);
        float soft=pow(1.-ndv,0.55)*.35;
        vec3 iri=vec3(.55+.45*sin(vW.x*3.+uTime*.3), .65+.35*sin(vW.y*4.+1.2), .95);
        vec3 c=mix(uColor, iri, f*.18)*(uBase+f*1.5+soft*.8)*uGain;
        gl_FragColor=vec4(c*fogF(vD),uA);
      }`,
  });
}
const lineMat = (color, opacity = 1) => new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });

function pillar(color, h = 70, rTop = 0.35, rBot = 1.5) {
  const geo = new THREE.CylinderGeometry(rTop, rBot, h, 48, 1, true);
  geo.translate(0, h / 2, 0);
  const m = new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uColor: { value: new THREE.Color(color) }, uI: { value: 1 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying float vD;
      void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `${FOG} uniform vec3 uColor; uniform float uTime,uI; varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying float vD;
      void main(){ float edge=pow(abs(dot(normalize(vN),vV)),2.2); float v=pow(1.-vUv.y,2.0)*.9+.06;
        float shimmer=.8+.2*sin(vUv.y*48.-uTime*1.6+vUv.x*14.);
        float bands=.92+.08*sin(vUv.y*120.+uTime*.8);
        float a=edge*v*shimmer*bands*uI*.26;
        vec3 core=mix(uColor,vec3(.85,.9,1.),pow(1.-vUv.y,3.)*.45);
        gl_FragColor=vec4(core*a*max(fogF(vD*.55),.18),1.); }`,
  });
  return new THREE.Mesh(geo, m);
}
function floorGlow(color, r = 5) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uI: { value: 1 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform vec3 uColor; uniform float uI; varying vec2 vUv; void main(){ float d=length(vUv-.5)*2.; float a=pow(max(1.-d,0.),2.5)*.5*uI; gl_FragColor=vec4(uColor*a,1.); }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), m);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

/* ---------- interactive state ---------- */
const INTERACT = { tap: -99, hold: 0, holding: false, mx: 0.5, my: 0.5, cursorHold: 0 };
window.__interact = INTERACT;

/* ---------- whale (organic silhouette, dense particles) ---------- */
function makeWhale(color, countScale = 1) {
  // Prefer official DeepSeek mark sampled to particles; fallback to procedural body.
  let pos = [], rnd = [];
  const baked = window.__whalePos;
  if (baked && baked.length) {
    const n = baked.length / 3;
    const take = Math.floor(n * countScale);
    const step = Math.max(1, Math.floor(n / take));
    for (let i = 0; i < n; i += step) {
      pos.push(baked[i * 3], baked[i * 3 + 1], baked[i * 3 + 2]);
      rnd.push(Math.random());
    }
  } else {
    const bodyR = (u) => {
      const head = Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, u * 1.15))), 0.55);
      const belly = 1 + 0.45 * Math.sin(Math.PI * THREE.MathUtils.clamp((u - 0.15) / 0.55, 0, 1));
      const taper = 1 - Math.pow(Math.max(0, u - 0.55) / 0.45, 1.4) * 0.85;
      return 1.15 * head * belly * taper;
    };
    const L = 10, nBody = Math.floor(14000 * countScale);
    for (let i = 0; i < nBody; i++) {
      const u = Math.pow(Math.random(), 0.85), a = Math.random() * Math.PI * 2;
      const shell = Math.random() < 0.72 ? 0.82 + Math.random() * 0.18 : Math.random() * 0.82;
      const r = bodyR(u) * shell, x = -u * L + L * 0.42;
      pos.push(x, Math.sin(a) * r * 0.72, Math.cos(a) * r * 1.15); rnd.push(Math.random());
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aR', new THREE.Float32BufferAttribute(rnd, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uColor: { value: new THREE.Color(color) }, uPx: { value: 1 }, uForm: { value: 1 }, uSpread: { value: 6 }, uGain: { value: 1.05 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uTime,uPx,uForm,uSpread; attribute float aR; varying float vR; varying float vD; varying float vLoose;
      void main(){
        vec3 target=position;
        float sw=sin(uTime*1.15-target.x*.45)*.05*(1.-uForm*0.55);
        target.y+=sw;
        // hash seed
        vec3 h3=fract(sin(vec3(aR*127.1,aR*311.7,aR*74.7))*43758.5453)-.5;
        float loose=1.-uForm;
        // Igloo-style: spiral from a wide sphere into silhouette
        float rad0=uSpread*(0.55+aR*0.9);
        float phi=aR*6.2832 + uTime*(0.55+aR*0.35);
        float th=(aR*2.0-1.0)*1.35 + sin(uTime*.4+aR*8.)*.2;
        vec3 cloud=vec3(cos(phi)*cos(th), sin(th)*0.72, sin(phi)*cos(th))*rad0;
        cloud+=h3*uSpread*0.35;
        // swirl residual near form
        float ang=loose*loose*(aR*6.28+uTime*0.85);
        vec3 spun=target; spun.xz=mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*spun.xz;
        spun+=h3*vec3(2.2,1.8,2.0)*uSpread*loose*loose*0.55;
        vec3 p=mix(cloud, spun, smoothstep(0.0,0.55,uForm));
        p=mix(p, target, smoothstep(0.35,1.0,uForm));
        vec4 mv=modelViewMatrix*vec4(p,1.); vD=-mv.z; vR=aR; vLoose=loose;
        gl_Position=projectionMatrix*mv;
        float sz=(1.35+aR*3.1)*uPx*(38./max(vD,1.));
        // brighter larger points while assembling, crisp when formed
        sz*=mix(1.55, 0.95+uForm*0.35, uForm);
        gl_PointSize=sz;
      }`,
    fragmentShader: `${FOG} uniform vec3 uColor; uniform float uTime,uGain; varying float vR; varying float vD; varying float vLoose;
      void main(){ vec2 q=gl_PointCoord-.5; float d=length(q); if(d>.5) discard;
        float a=smoothstep(.5,0.,d); a*=a*.85; // tighter core, less additive wash
        float tw=.65+.35*sin(uTime*2.2+vR*40.);
        // fluid glow: teal→white while loose (ASTRODITHER energy)
        vec3 fluid=mix(vec3(.25,.55,1.), vec3(.85,.93,1.), a);
        vec3 formed=mix(uColor, vec3(.75,.82,1.), step(.95,vR)*.35);
        vec3 c=mix(fluid, formed, 1.-vLoose*vLoose);
        gl_FragColor=vec4(c*a*tw*uGain*max(fogF(vD),.25),1.);
      }`,
  });
  const pts = new THREE.Points(geo, mat);
  const g = new THREE.Group(); g.add(pts);
  g.userData.mat = mat; g.userData.base = 1;
  g.userData.update = (t, l) => {
    mat.uniforms.uForm.value = (0.25 + 0.75 * INTERACT.hold) * THREE.MathUtils.smoothstep(l, 0.0, 0.45); /* DC#6: starts ~65% formed */
    if (g.userData.station) mat.uniforms.uGain.value = 0.42;
    g.position.y = Math.sin(t * 0.45) * 0.12;
    g.rotation.z = Math.sin(t * 0.2) * 0.04;
  };
  return g;
}

/* ---------- symbolic builders (12) ---------- */
const STORY = { seg: 0 };
const builders = grokBuilders(
  reviseBuilders(createBuilders({ THREE, rimMat, lineMat, pillar, V3, MOBILE, INTERACT, uniforms, FOG, makeWhale, STORY, REDUCED }), {THREE, INTERACT, MOBILE, REDUCED, STORY, camera}),
  { THREE, INTERACT, MOBILE, REDUCED, STORY, camera, scene });

const stations = [];
MILESTONES.forEach((m, i) => {
  const k = i + 1, root = new THREE.Group();
  root.position.copy(anchor(k));
  const obj = builders[i](m.color);
  // winter objects face +X (camera looks sideways)
  if (m.act === 'winter') obj.rotation.y = Math.PI / 2;
  root.add(obj);
  const pil = pillar(i === N - 1 ? 0x6f8bff : m.act === 'winter' ? 0x4b5568 : 0xe8f0ff, m.act === 'winter' ? 52 : 78, 0.2, m.act === 'winter' ? 1.05 : 1.55);
  pil.position.y = -2.2; if (m.act === 'winter') pil.material.uniforms.uI.value = 0.4; root.add(pil);
  const fl = floorGlow(m.color, 7.5); fl.position.y = -2.2; root.add(fl);
  // orbital dust halo around each station
  const haloN = MOBILE ? 180 : 420, hp = [], hr = [];
  for (let j = 0; j < haloN; j++) {
    const a = Math.random() * Math.PI * 2, rr = 2.2 + Math.random() * 4.5;
    hp.push(Math.cos(a) * rr, (Math.random() - 0.5) * 2.4, Math.sin(a) * rr);
    hr.push(Math.random());
  }
  const hGeo = new THREE.BufferGeometry();
  hGeo.setAttribute('position', new THREE.Float32BufferAttribute(hp, 3));
  hGeo.setAttribute('aR', new THREE.Float32BufferAttribute(hr, 1));
  const hMat = new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uColor: { value: new THREE.Color(m.color) }, uPx: { value: 1 }, uI: { value: 0.4 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uTime,uPx; attribute float aR; varying float vA; varying float vD;
      void main(){ float ang=uTime*(.12+aR*.08)+aR*6.28; mat2 R=mat2(cos(ang),-sin(ang),sin(ang),cos(ang));
        vec3 p=position; p.xz=R*p.xz; p.y+=sin(uTime*.5+aR*10.)*.15;
        vec4 mv=modelViewMatrix*vec4(p,1.); vD=-mv.z; vA=.4+aR;
        gl_Position=projectionMatrix*mv; gl_PointSize=(1.1+aR*2.4)*uPx*(30./max(vD,1.)); }`,
    fragmentShader: `${FOG} uniform vec3 uColor; uniform float uI; varying float vA; varying float vD;
      void main(){ vec2 q=gl_PointCoord-.5; float d=length(q); if(d>.5) discard;
        float a=smoothstep(.5,0.,d)*vA*uI; gl_FragColor=vec4(uColor*a*fogF(vD*.7),1.); }`,
  });
  const halo = new THREE.Points(hGeo, hMat); root.add(halo);
  // soft energy ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.4, 0.018, 8, 96),
    new THREE.MeshBasicMaterial({ color: m.color, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  ring.rotation.x = Math.PI / 2; ring.position.y = -1.6; root.add(ring);
  if ([1,2,4,5,6,7,8,9,10,11].includes(k)) { pil.visible=false; fl.visible=false; halo.visible=false; ring.visible=false; }
  scene.add(root);
  stations.push({ k, root, obj, pil, fl, act: m.act, halo, ring });
});

const sceneUI = createSceneUI({THREE, stations, INTERACT, camera, renderer});

/* ---------- T3: particle morph 复苏→爆发 (after 2009, 三河 untouched) ---------- */
const MORPH = (() => {
  const count = MOBILE ? 900 : 2200;
  const start = new Float32Array(count * 3);
  const end = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const cur = new Float32Array(count * 3);
  const sizes = MOBILE ? [18, 12, 8, 5, 3] : [28, 18, 12, 8, 4];
  /* end targets: AlexNet-like layer grids */
  let ei = 0;
  for (let li = 0; li < sizes.length && ei < count; li++) {
    const n = sizes[li], span = 5.2 - li * 0.9, z = 3.0 - li * 1.35;
    for (let i = 0; i < n && ei < count; i++) for (let j = 0; j < n && ei < count; j++) {
      end[ei*3] = (i / Math.max(1, n - 1) - 0.5) * span;
      end[ei*3+1] = (j / Math.max(1, n - 1) - 0.5) * span;
      end[ei*3+2] = z;
      const c = new THREE.Color(VISUAL.blue).lerp(new THREE.Color(VISUAL.cyan),(i+j)/(n*2)).lerp(new THREE.Color(VISUAL.violet),li/8);
      col[ei*3]=c.r; col[ei*3+1]=c.g; col[ei*3+2]=c.b;
      ei++;
    }
  }
  for (; ei < count; ei++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 1.2;
    end[ei*3] = Math.cos(a)*r; end[ei*3+1]=Math.sin(a)*r; end[ei*3+2]=-1.5+Math.random()*2;
    col[ei*3]=0.6; col[ei*3+1]=0.85; col[ei*3+2]=1;
  }
  /* start: three river streams (violet / green / cyan) converging — visual rhyme with 三河, not mutating it */
  const rivers = [
    { c: new THREE.Color(VISUAL.blue), o: [-5, 2.5, 5] },
    { c: new THREE.Color(VISUAL.amber), o: [0, -3.5, 5] },
    { c: new THREE.Color(VISUAL.cyan), o: [5, 1.5, 5] },
  ];
  for (let i = 0; i < count; i++) {
    const R = rivers[i % 3];
    start[i*3]   = R.o[0] + (Math.random() - 0.5) * 1.8;
    start[i*3+1] = R.o[1] + (Math.random() - 0.5) * 1.8;
    start[i*3+2] = R.o[2] - Math.random() * 16;
    /* blend start color toward river */
    col[i*3]   = col[i*3]   * 0.35 + R.c.r * 0.65;
    col[i*3+1] = col[i*3+1] * 0.35 + R.c.g * 0.65;
    col[i*3+2] = col[i*3+2] * 0.35 + R.c.b * 0.65;
    cur[i*3]=start[i*3]; cur[i*3+1]=start[i*3+1]; cur[i*3+2]=start[i*3+2];
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(cur, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    size: MOBILE ? 0.07 : 0.09, vertexColors: true, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  const root = new THREE.Group(); root.add(pts); root.visible = false;
  root.position.copy(anchor(9));
  root.rotation.y = 0.55;
  scene.add(root);
  return { root, pts, start, end, cur, count, geo };
})();



/* ---------- opening whale (award-site sequence) ---------- */
const OPEN = { form: 0, bloom: 1.0, light: 0, cam: 7, title: 0, burst: 0, ring: 0, fog: 0, dither: 0, pillars: 0 };
const WHALE_HOME = V3(0, -1.2, -16);
const introWhale = makeWhale(0x5b7cff, MOBILE ? 1.15 : 1.85);
introWhale.userData.update = null;
introWhale.position.copy(WHALE_HOME);
introWhale.rotation.set(0.08, 0.35, -0.06); // 3/4 silhouette reads better
introWhale.scale.setScalar(MOBILE ? 1.05 : 1.45);
introWhale.userData.mat.uniforms.uSpread.value = 42;
introWhale.userData.mat.uniforms.uGain.value = 0.35;
introWhale.userData.mat.uniforms.uForm.value = 0;
scene.add(introWhale);
const introPillar = pillar(0xd8e6ff, 140, 0.14, 2.6);
introPillar.position.copy(WHALE_HOME).add(V3(0, -5.2, 0));
introPillar.material.uniforms.uI.value = 0;
scene.add(introPillar);
const introFloor = floorGlow(0x4d6bfe, 11);
introFloor.position.copy(WHALE_HOME).add(V3(0, -5.15, 0));
introFloor.material.uniforms.uI.value = 0;
scene.add(introFloor);
/* Totem-style fog pillars flanking the open stage */
const openPillars = [];
{
  const spots = [
    [-7.5, -6, -12], [7.2, -6.5, -13], [-11, -8, -22], [10.5, -7.5, -20],
    [-4.5, -5.5, -28], [5.0, -6, -30], [-14, -9, -18], [13.5, -8.5, -17],
  ];
  spots.forEach((pos, i) => {
    const pil = pillar(i % 2 ? 0x7aa0ff : 0xb8d0ff, 70 + (i % 3) * 22, 0.12, 0.95);
    pil.position.set(pos[0], pos[1], pos[2]);
    pil.material.uniforms.uI.value = 0;
    scene.add(pil);
    openPillars.push(pil);
  });
}
// opening nebula burst + fluid cloud (extra free particles)
{
  const n = MOBILE ? 9000 : 28000, p = [], r = [];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, b = (Math.random() - 0.5) * Math.PI, rad = 1.2 + Math.random() * 34;
    p.push(Math.cos(a) * Math.cos(b) * rad, Math.sin(b) * rad * 0.62, Math.sin(a) * Math.cos(b) * rad);
    r.push(Math.random());
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  geo.setAttribute('aR', new THREE.Float32BufferAttribute(r, 1));
  window.__burstMat = new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uPx: { value: 1 }, uBurst: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uTime,uPx,uBurst; attribute float aR; varying float vA; varying float vD;
      void main(){ float k=max(uBurst,0.);
        float swirl=uTime*(0.3+aR*.5)+aR*6.28;
        vec3 p=position*(0.08+k*1.05);
        // fluid spiral (Igloo / ASTRODITHER energy)
        p.xz = mat2(cos(swirl*k),-sin(swirl*k),sin(swirl*k),cos(swirl*k))*p.xz;
        p += normalize(position+0.001)*sin(uTime*2.4+aR*20.)*0.22*k;
        vec4 mv=modelViewMatrix*vec4(p,1.); vD=-mv.z;
        vA=k*(1.-smoothstep(0.75,1.35,k))*(0.45+aR);
        gl_Position=projectionMatrix*mv; gl_PointSize=(1.2+aR*3.6)*uPx*(40./max(vD,1.))*max(k,.01); }`,
    fragmentShader: `varying float vA; varying float vD; void main(){ vec2 q=gl_PointCoord-.5; float d=length(q); if(d>.5) discard;
      float a=smoothstep(.5,0.,d); a*=a; vec3 c=mix(vec3(.2,.45,1.),vec3(.9,.95,1.),a);
      gl_FragColor=vec4(c*a*vA,1.); }`,
  });
  const burst = new THREE.Points(geo, window.__burstMat);
  burst.position.copy(WHALE_HOME);
  scene.add(burst); window.__burst = burst;
  // multi shockwave rings
  window.__rings = [0,1,2].map((i) => {
    const r = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.02, 128),
      new THREE.MeshBasicMaterial({ color: 0xb8d0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
    );
    r.rotation.x = -Math.PI / 2;
    r.position.copy(WHALE_HOME).add(V3(0, -4.8, 0));
    scene.add(r);
    return r;
  });
  window.__ring = window.__rings[0];
}

/* ---------- environment ---------- */
const SNOW = MOBILE ? 7000 : 22000;
const snowGeo = new THREE.BufferGeometry();
{
  const p = [], r = [];
  for (let i = 0; i < SNOW; i++) {
    p.push(-20 + Math.random() * 120, 25 - Math.random() * 100, 5 - Math.random() * 430);
    r.push(Math.random());
  }
  snowGeo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  snowGeo.setAttribute('aR', new THREE.Float32BufferAttribute(r, 1));
}
const snowMat = new THREE.ShaderMaterial({
  uniforms: { ...uniforms, uPx: { value: 1 }, uVel: { value: 0 } },
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `uniform float uTime,uPx,uVel; attribute float aR; varying float vD;
    void main(){ vec3 p=position; p.y+=mod(uTime*(.12+aR*.28),6.)-3.; p.x+=sin(uTime*.25+aR*30.)*.35;
      vec4 mv=modelViewMatrix*vec4(p,1.); vD=-mv.z; gl_Position=projectionMatrix*mv;
      gl_PointSize=(.55+aR*1.5)*uPx*(28./max(vD,1.))*(1.+uVel*2.2); }`,
  fragmentShader: `${FOG} varying float vD; void main(){ vec2 q=gl_PointCoord-.5; float a=smoothstep(.5,0.,length(q)); gl_FragColor=vec4(vec3(.7,.82,1.)*a*.28*fogF(vD*.75),1.); }`,
});
scene.add(new THREE.Points(snowGeo, snowMat));
for (let i = 0; i < 28; i++) {
  const p = pillar(0x9fb7ff, 95 + Math.random() * 40, 0.28, 1.35 + Math.random() * 0.5);
  p.position.set(30 + (Math.random() < 0.5 ? -1 : 1) * (14 + Math.random() * 28), -40 - Math.random() * 45, -Math.random() * 420);
  p.material.uniforms.uI.value = 0.16 + Math.random() * 0.12; scene.add(p);
}
const surf = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshBasicMaterial({ color: 0x2a4a7a, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
surf.rotation.x = Math.PI / 2; surf.position.set(0, 7, -40); scene.add(surf);
/* volumetric nebula dust — dense soft fog particles */
{
  const n = MOBILE ? 3500 : 9000, p = [], r = [];
  for (let i = 0; i < n; i++) {
    p.push(-40 + Math.random() * 160, -60 + Math.random() * 90, 10 - Math.random() * 430);
    r.push(Math.random());
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  geo.setAttribute('aR', new THREE.Float32BufferAttribute(r, 1));
  window.__nebulaMat = new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uPx: { value: 1 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uTime,uPx; attribute float aR; varying float vA; varying float vD;
      void main(){ vec3 p=position; p.x+=sin(uTime*.08+aR*20.)*1.2; p.y+=cos(uTime*.06+aR*12.)*.6;
        vec4 mv=modelViewMatrix*vec4(p,1.); vD=-mv.z; vA=.35+aR*.45;
        gl_Position=projectionMatrix*mv; gl_PointSize=(4.+aR*10.)*uPx*(42./max(vD,1.)); }`,
    fragmentShader: `${FOG} varying float vA; varying float vD; void main(){ vec2 q=gl_PointCoord-.5; float d=length(q); if(d>.5) discard;
      float a=smoothstep(.5,.0,d); a*=a; vec3 c=mix(vec3(.15,.28,.65),vec3(.55,.7,1.),a);
      gl_FragColor=vec4(c*a*vA*.22*fogF(vD*.5),1.); }`,
  });
  scene.add(new THREE.Points(geo, window.__nebulaMat));
}

/* ---------- post ---------- */
const storyTarget = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
storyTarget.samples = MOBILE ? 2 : 4;
const composer = new EffectComposer(renderer, storyTarget);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.22, 0.18, 0.85);
composer.addPass(bloom);
const grade = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) },
    uWinter: { value: 0 }, uMouse: { value: new THREE.Vector2(0.5, 0.5) }, uDepth: { value: 0 }, uOpen: { value: 1 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime,uWinter,uDepth,uOpen; uniform vec2 uRes,uMouse; varying vec2 vUv;
    float bayer(vec2 p){ p=mod(floor(p),4.); int i=int(p.x+p.y*4.);
      float m[16]; m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
      for(int k=0;k<16;k++){ if(k==i) return m[k]/16.; } return 0.; }
    float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233))+uTime)*43758.5453); }
    void main(){
      vec2 c=vUv-.5; float ca=.00015*uOpen*length(c);
      vec3 col=vec3(texture2D(tDiffuse,vUv+c*ca).r, texture2D(tDiffuse,vUv).g, texture2D(tDiffuse,vUv-c*ca).b);
      // soft teal lift (Atmos) + deep crush
      col=mix(col, col*vec3(.92,.96,1.08), .28);
      col=pow(max(col,0.), vec3(.92));
      // film grain + dither (ASTRODITHER punch during opening)
      vec2 px=vUv*uRes;
      float dith=uOpen*.008;
      float grain=.003 + uOpen*.008;
      col+=(bayer(px*.5)-.5)*dith+(h(px)-.5)*grain;
      // open-phase fluid chroma fringe
      float caOpen=ca*(1.+uOpen*2.4);
      if(uOpen>0.01){
        vec3 fr=vec3(texture2D(tDiffuse,vUv+c*caOpen).r, texture2D(tDiffuse,vUv).g, texture2D(tDiffuse,vUv-c*caOpen).b);
        col=mix(col, fr, uOpen*.55);
      }
      // depth haze wash
      float haze=smoothstep(0.,1.,uDepth)*.06;
      col=mix(col, vec3(.04,.08,.16), haze);
      float gray=dot(col,vec3(.299,.587,.114));
      vec2 m=(vUv-uMouse)*vec2(uRes.x/uRes.y,1.); float torch=smoothstep(.32,.04,length(m));
      vec3 cold=vec3(gray)*vec3(.4,.44,.52);
      col=mix(col, mix(cold*.28, vec3(gray)*vec3(.85,.93,1.18)*1.5, torch), uWinter);
      // cinematic vignette
      col*=1.-dot(c,c)*.55;
      // subtle letterbox breath
      float letter=smoothstep(.0,.04,vUv.y)*smoothstep(1.,.96,vUv.y);
      col*=.88+.12*letter;
      gl_FragColor=vec4(col,1.);
    }`,
});
/* act transitions: gl-transitions-style noise dissolve, purely a function of scroll seg (reversible) */
const QS_NOTRANS = location.search.includes("notrans");
/* Act transitions — mode: 0 frost crystal dissolve, 1 rising dark, 2 soft wipe */
const ACT_TRANS = [
  { at: 3.48, w: 0.34, tint: new THREE.Color(0x071018), dir: 1, mode: 0 },  // 萌芽→寒冬 frost (strengthened)
  { at: 8.55, w: 0.14, tint: new THREE.Color(0x040814), dir: 1, mode: 2 },  // soft assist under particle morph
];
const actTrans = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null }, uT: { value: 0 }, uDir: { value: 1 }, uMode: { value: 0 },
    uTint: { value: new THREE.Color() }, uAsp: { value: 1 }, uTime: { value: 0 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uT,uDir,uAsp,uMode,uTime; uniform vec3 uTint; varying vec2 vUv;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
    float fbm(vec2 p){return .52*n(p)+.28*n(p*2.17)+.14*n(p*4.41)+.06*n(p*8.9);}
    void main(){
      vec4 c=texture2D(tDiffuse,vUv);
      if(uT<=0.001){gl_FragColor=c;return;}
      vec2 uv=vUv; vec2 p=vec2(uv.x*uAsp,uv.y);
      float g=mix(uv.y,1.-uv.y,step(0.,uDir));
      vec3 col;
      if(uMode<0.5){
        /* FROST: crystalline freeze from top — ice plates + sparkle edge */
        float ice=fbm(p*4.2+vec2(0.,uTime*.04));
        float plates=pow(max(0.,fbm(p*9.5+ice)-.28),1.35);
        float cracks=smoothstep(.42,.78,fbm(p*18.+plates*2.));
        float v=ice*.42+plates*.28+g*.26+cracks*.04;
        float th=uT*1.38-.16;
        float m=smoothstep(th+.1,th-.12,v);
        float edge=smoothstep(.16,0.,abs(v-th))*(1.-smoothstep(.88,1.,uT));
        float gray=dot(c.rgb,vec3(.22,.48,.3));
        vec3 frozen=mix(c.rgb, vec3(gray)*vec3(.48,.68,.98), clamp(m*1.1+uT*.25,0.,1.));
        /* ice rim — cyan/white, no muddy bloom wash */
        vec3 rim=vec3(.62,.88,1.2)*edge*(1.1+plates*1.8);
        /* pixel frost sparkles along the front */
        float cell=h(floor(p*vec2(70.,90.)+uTime*2.));
        float spark=step(.93,cell)*edge;
        col=mix(frozen,uTint,m*.94)+rim*.7+vec3(spark*1.15);
        /* slight freeze desat ahead of front */
        float pre=smoothstep(th+.18,th+.02,v)*(1.-m);
        col=mix(col, mix(col,vec3(dot(col,vec3(.3,.5,.2)))*vec3(.7,.85,1.05),.55), pre*.65);
      } else {
        /* generic noise dissolve (rising / wipe) */
        float f=.55*n(p*5.)+.3*n(p*11.5)+.15*n(p*25.5);
        float v=f*.6+g*.4;
        float th=uT*1.24-.12;
        float m=smoothstep(th+.06,th-.06,v);
        float edge=smoothstep(.07,0.,abs(v-th))*(1.-step(.98,uT));
        col=mix(c.rgb,uTint,m*.96)+vec3(.35,.55,.85)*edge*.22;
      }
      gl_FragColor=vec4(col,c.a);
    }`,
});
composer.addPass(grade);
composer.addPass(actTrans); window.__actTrans = actTrans;
composer.addPass(new OutputPass());

/* ---------- resize ---------- */
let W = 1, H = 1, narrow = false;
function resize() {
  W = innerWidth; H = innerHeight; narrow = W <= 760;
  renderer.setSize(W, H, false); composer.setSize(W, H);
  renderer.setPixelRatio(DPR); composer.setPixelRatio(DPR);
  // Composer owns the bloom target sizes, including pixel ratio.
  grade.uniforms.uRes.value.set(W * DPR, H * DPR);
  camera.aspect = W / H; camera.updateProjectionMatrix();
  const px = DPR * H / 900;
  snowMat.uniforms.uPx.value = px;
  if (window.__nebulaMat) window.__nebulaMat.uniforms.uPx.value = px;
  introWhale.userData.mat.uniforms.uPx.value = px; if (window.__burstMat) window.__burstMat.uniforms.uPx.value = px;
  stations.forEach((st) => { if (st.halo?.material?.uniforms?.uPx) st.halo.material.uniforms.uPx.value = px; });
  introWhale.scale.setScalar(narrow ? 1.05 : 1.45);
  stations.forEach((s) => {
    const base = s.obj.userData.base || 1;
    s.obj.scale.setScalar(base * (narrow ? (s.k === N ? 0.42 : 0.6) : 1));
    if (s.obj.userData.mat) s.obj.userData.mat.uniforms.uPx.value = px;
  });
}
addEventListener('resize', resize); resize();

/* ---------- scroll ---------- */
gsap.registerPlugin(ScrollTrigger);
let lenis = null;
const state = { p: 0, vel: 0, lastY: 0 };
function readProgress() {
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const y = window.scrollY || document.documentElement.scrollTop || 0;
  state.vel = Math.min(2, Math.abs(y - state.lastY) / 40);
  state.lastY = y;
  state.p = Math.min(1, Math.max(0, y / max));
}
// Lenis disabled: was swallowing wheel without advancing on some machines.
// Native scroll + ScrollTrigger is the reliable path for the competition demo.
lenis = null;
addEventListener('scroll', readProgress, { passive: true });
ScrollTrigger.create({
  trigger: '#scroll', start: 'top top', end: 'bottom bottom',
  onUpdate: (s) => { state.p = s.progress; state.vel = Math.abs(s.getVelocity()) / 4000; },
});
readProgress();
/* Small dive companion: a draggable, keyboard-accessible progress rail. */
const diveTrack=document.createElement('div');diveTrack.className='whale-scroll';
diveTrack.innerHTML=`<div class="whale-track"></div><button type="button" class="whale-thumb" role="scrollbar" aria-label="下潜进度，可拖动" aria-controls="scroll" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><svg viewBox="0 0 28 44" aria-hidden="true"><path d="M14 8 22 21 14 34 6 21Z" fill="#0c1930" stroke="#a3c4ef" stroke-width="1"/><path d="m10 20 4 5 4-5" fill="none" stroke="#c5e7ff" stroke-width="1.2"/><circle cx="14" cy="7" r="1.4" fill="#7aabda"/></svg></button>`;document.body.append(diveTrack);
const diveThumb=diveTrack.querySelector('button');let diveDrag=false,diveOffset=0;
function diveTo(event){const rect=diveTrack.getBoundingClientRect(),h=rect.height-44,p=THREE.MathUtils.clamp((event.clientY-rect.top-22-diveOffset)/h,0,1);stopWheel();stopEndAuto();scrollTo({top:p*Math.max(1,document.documentElement.scrollHeight-innerHeight),behavior:'instant'});}
diveTrack.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();diveDrag=true;diveOffset=e.target.closest('.whale-thumb')?e.clientY-diveThumb.getBoundingClientRect().top-22:0;diveTrack.setPointerCapture(e.pointerId);diveTrack.classList.add('dragging');diveTo(e);});
diveTrack.addEventListener('pointermove',e=>{if(diveDrag)diveTo(e);});
const diveEnd=()=>{diveDrag=false;diveTrack.classList.remove('dragging');};diveTrack.addEventListener('pointerup',diveEnd);diveTrack.addEventListener('pointercancel',diveEnd);
diveThumb.addEventListener('keydown',e=>{let target=null;const max=document.documentElement.scrollHeight-innerHeight;if(e.key==='Home')target=0;else if(e.key==='End')target=max;else if(e.key==='ArrowDown'||e.key==='PageDown')target=scrollY+max/SPAN;else if(e.key==='ArrowUp'||e.key==='PageUp')target=scrollY-max/SPAN;if(target!=null){e.preventDefault();e.stopPropagation();stopWheel();stopEndAuto();scrollTo({top:THREE.MathUtils.clamp(target,0,max),behavior:'smooth'});}});
function updateDiveTrack(seg,depth){const p=THREE.MathUtils.clamp(state.p,0,1);diveThumb.style.top=`${p*Math.max(0,diveTrack.clientHeight-44)}px`;diveThumb.setAttribute('aria-valuenow',String(Math.round(p*100)));diveThumb.setAttribute('aria-valuetext',`${Math.round(depth)} 米，${Math.round(p*100)}%`);diveThumb.title=`下潜 ${Math.round(depth)} 米 · 拖动探索`;diveTrack.classList.toggle('in-winter',seg>=3.65&&seg<6.2);}

// A wheel gesture crosses at most one milestone, then settles into a readable view.
let wheelTarget=null,wheelFrame=0,wheelSnap=0,wheelLast=0,wheelOrigin=0,wheelDir=1,wheelEase=.18;
function stopWheel(){wheelLast=0;wheelTarget=null;cancelAnimationFrame(wheelFrame);wheelFrame=0;clearTimeout(wheelSnap);}
function wheelAnimate(){if(wheelTarget==null)return;const y=window.scrollY,next=y+(wheelTarget-y)*wheelEase;scrollTo({top:Math.abs(next-wheelTarget)<.7?wheelTarget:next,behavior:'instant'});if(Math.abs(next-wheelTarget)>.7)wheelFrame=requestAnimationFrame(wheelAnimate);else wheelFrame=0;}
addEventListener('wheel',e=>{
 if(e.ctrlKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)||!e.deltaY)return;
 if(document.documentElement.classList.contains('opening')){e.preventDefault();return;}
 if(e.target.closest?.('.card,.chapters,.person-dialog,input,textarea'))return;
 const seg=segFromRaw(state.p*SPAN);
 if(seg>=11.85){stopWheel();return;}
 e.preventDefault();stopEndAuto();
 const now=performance.now(),max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
 if(now-wheelLast>240){wheelOrigin=Math.max(0,Math.min(12,Math.round(seg)));wheelTarget=window.scrollY;}
 wheelLast=now;
 wheelEase=.18;
 const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
 wheelDir=Math.sign(delta);
 const resistance=seg>=3.65&&seg<6.18?.48:.76;
 const lo=max*rawFromSeg(Math.max(0,wheelOrigin-1))/SPAN,hi=max*rawFromSeg(Math.min(12.24,wheelOrigin+1))/SPAN;
 wheelTarget=THREE.MathUtils.clamp((wheelTarget??window.scrollY)+THREE.MathUtils.clamp(delta,-220,220)*resistance,lo,hi);
 if(!wheelFrame)wheelFrame=requestAnimationFrame(wheelAnimate);
 clearTimeout(wheelSnap);wheelSnap=setTimeout(()=>{
  const s=segFromRaw((wheelTarget??window.scrollY)/max*SPAN),d=s-wheelOrigin;
  const k=Math.abs(d)>.12?(Math.sign(d)===wheelDir?wheelOrigin+wheelDir:Math.round(s)):null;
  if(k>=1&&k<=12){wheelEase=.075;wheelTarget=max*rawFromSeg(k)/SPAN;if(!wheelFrame)wheelFrame=requestAnimationFrame(wheelAnimate);}
 },280);
},{passive:false});
addEventListener('touchstart',stopWheel,{passive:true});
addEventListener('pointerdown',e=>{if(e.target.closest?.('.rail,.chapters,.person-dialog'))stopWheel();},{passive:true});
// keyboard chapter advance

addEventListener('keydown', (e) => {
  if (document.documentElement.classList.contains('opening')) return;
  if (e.target.closest?.('input,textarea,button,a')) return;
  if(['ArrowDown','ArrowUp','PageDown','PageUp','Space'].includes(e.code))stopWheel();
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const step = max / SPAN;
  if (e.code === 'ArrowDown' || e.code === 'PageDown' || e.code === 'Space') {
    e.preventDefault();
    const y = Math.min(max, (window.scrollY || 0) + step * 0.92);
    if (lenis) lenis.scrollTo(y, { duration: 0.85 }); else scrollTo({ top: y, behavior: 'smooth' });
  } else if (e.code === 'ArrowUp' || e.code === 'PageUp') {
    e.preventDefault();
    const y = Math.max(0, (window.scrollY || 0) - step * 0.92);
    if (lenis) lenis.scrollTo(y, { duration: 0.85 }); else scrollTo({ top: y, behavior: 'smooth' });
  }
});

/* chapter jump: short fade/cut — never a long fly-through */
const keyToY = (k) => (document.documentElement.scrollHeight - innerHeight) * (rawFromSeg(k) / SPAN);
const hashFor = (k) => (k >= 1 && k <= N ? `#y${MILESTONES[Math.round(k) - 1].year}` : k > N ? '#end' : '');
const kFromHash = (h) => {
  if (h === '#end') return 14.999; /* completed finale */
  const i = MILESTONES.findIndex((m) => `#y${m.year}` === h); return i >= 0 ? i + 1 : -1;
};
let jumping = false;
function jumpTo(k, { instant = false } = {}) {
  stopEndAuto();stopWheel();
  k = Math.max(0, Math.min(KEYS, k));
  if (k >= GATE_SEG) endingGateOpen = true;
  const cut = () => {
    scrollTo({ top: keyToY(k), behavior: 'instant' });
    readProgress(); smoothP = state.p; // snap camera: no interpolation fly-through
    const h = hashFor(k); history.replaceState(null, '', h || location.pathname + location.search);
  };
  if (instant || REDUCED) { cut(); return; }
  if (jumping) return; jumping = true;
  FX.el.style.transition = 'opacity .1s'; FX.el.style.background = '#03050a'; FX.c = '#03050a'; FX.el.style.opacity = '1';
  setTimeout(() => { cut(); requestAnimationFrame(() => { FX.el.style.opacity = '0'; setTimeout(() => { FX.el.style.transition = ''; jumping = false; }, 140); }); }, 90);
}

/* ---------- T4: sticky chapter-end gate — click / #end / soft auto-unlock → finale ---------- */
const GATE_SEG = 12.42;
const FINALE_SEG = 14.85; /* unified-ending opacity on (≥~14.5); slogan + CTAs */
let endingGateOpen = false;
let gateShownAt = 0;
let gateAutoTimer = 0;
const GATE_AUTO_MS = 2600;
/* ending autoplay: time → endingP keyframes (smoothstep between = natural holds) */
const END_KF = [[0,0],[1.6,.06],[3,.15],[5.6,.42],[6.8,.45],[10.2,.74],[11.4,.80],[12.8,.84],[15.5,.94],[16.5,.95],[18.2,1]];
const ENDAUTO = { on: false, t0: 0 };
const ENDING_COPY={start:null};
const PREAUTO = { on: false, t0: 0, from: 12 };
function endAutoP(t) {
  for (let i = 1; i < END_KF.length; i++) {
    const [ta, pa] = END_KF[i - 1], [tb, pb] = END_KF[i];
    if (t <= tb) { const x = Math.max(0, (t - ta) / (tb - ta)); return pa + (pb - pa) * x * x * (3 - 2 * x); }
  }
  return 1;
}
function startEndAuto() { ENDAUTO.on = !REDUCED; ENDAUTO.t0 = elapsed; }
const stopEndAuto = () => { ENDAUTO.on = false; PREAUTO.on = false; };
addEventListener('wheel', stopEndAuto, { passive: true });
addEventListener('touchstart', stopEndAuto, { passive: true });
addEventListener('keydown', (e) => { if (/Arrow|Page|Space|Home|End/.test(e.code)) stopEndAuto(); });
window.__endAuto = ENDAUTO;
const gateEl = document.createElement('button');
gateEl.type = 'button';
gateEl.id = 'ending-gate';
gateEl.className = 'ending-gate';
gateEl.hidden = true;
gateEl.setAttribute('aria-hidden', 'true');
gateEl.innerHTML = '<span class="eg-kicker mono">第四章 · 终章入口</span><strong>进入星辰汇聚</strong><small>点击解锁终章 · 群星 → 鲸鱼</small>';
document.body.appendChild(gateEl);
function clearGateAuto() {
  if (gateAutoTimer) { clearTimeout(gateAutoTimer); gateAutoTimer = 0; }
  gateShownAt = 0;
}
function openEndingGate(opts = {}) {
  const instant = opts.instant !== false;
  endingGateOpen = true;
  clearGateAuto();
  gateEl.hidden = true;
  gateEl.setAttribute('aria-hidden', 'true');
  document.documentElement.classList.remove('ending-gated');
  /* always reveal finale (slogan + CTAs); jumpTo also marks gate open via k >= GATE_SEG */
  /* director cut #1: start ending at endingP=0 and auto-play full point→stars→gather→whale→slogan with holds */
  if (opts.to != null) { jumpTo(opts.to, { instant }); return; }
  jumpTo(END_S + 0.001, { instant: true });
  startEndAuto();
}
gateEl.addEventListener('click', () => openEndingGate());
gateEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEndingGate(); } });
function enforceEndingGate() {
  if (endingGateOpen || REDUCED || !OPEN.title) {
    clearGateAuto();
    gateEl.hidden = true;
    gateEl.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('ending-gated');
    return;
  }
  const gateY = keyToY(GATE_SEG);
  const y = window.scrollY || document.documentElement.scrollTop || 0;
  if (y > gateY + 2) {
    scrollTo({ top: gateY, behavior: 'instant' });
    readProgress();
    smoothP = Math.min(smoothP, rawFromSeg(GATE_SEG) / SPAN);
  }
  /* only around chapter-12 end — never during earlier acts */
  const show = STORY.seg >= (GATE_SEG - 0.18) && STORY.seg < 12.52 && !PREAUTO.on;
  gateEl.hidden = !show;
  gateEl.setAttribute('aria-hidden', show ? 'false' : 'true');
  document.documentElement.classList.toggle('ending-gated', show);
  if (show) {
    if (!gateShownAt) {
      gateShownAt = performance.now();
      gateAutoTimer = setTimeout(() => {
        if (!endingGateOpen) openEndingGate({ instant: true });
      }, GATE_AUTO_MS);
    }
  } else {
    clearGateAuto();
  }
}

window.__story = {
  jumpTo,
  get activeK() { return activeK; },
  stages: STAGES,
  openEnding: openEndingGate,
  get endingGateOpen() { return endingGateOpen; },
};
/* auto-unlock if deep-linking into ending (#end) or skip+end */
if (INIT_HASH === '#end') endingGateOpen = true;
addEventListener('hashchange', () => {
  if (location.hash === '#end') endingGateOpen = true;
  const k = kFromHash(location.hash);
  if (k >= 0 && k !== activeK) jumpTo(k);
});

const setPtr = (e) => {
  const p = e.touches ? e.touches[0] : e; if (!p) return;
  INTERACT.mx = p.clientX / W; INTERACT.my = p.clientY / H; INTERACT.winterLight=true;
  const wc = document.querySelector('.card.on[data-act="winter"]');
  if (wc) { const r = wc.getBoundingClientRect(); wc.style.setProperty('--mx', p.clientX - r.left + 'px'); wc.style.setProperty('--my', p.clientY - r.top + 'px'); }
};
addEventListener('pointermove', setPtr, { passive: true });
addEventListener('touchmove', setPtr, { passive: true });
/* Round 3 interactions: click/tap = primary; long-press = enhancement; never gates scroll */
const ACT = { 10: { v: 0, target: 0 }, 11: { v: 0, target: 0 }, 12: { v: 0, target: 0 } };
let press = null;
const actK = () => (activeK >= 10 && activeK <= 12 ? activeK : -1);
function activate(k) {               // click / tap / Enter
  if (k === 10) { INTERACT.tap = performance.now() / 1000; ACT[10].target = 1; ACT[10].v = 1; return; }
  const a = ACT[k]; if (!a) return;
  if(k===12&&a.v>=.999){a.v=0;a.target=1;STORY.r1Done=0;PREAUTO.on=false;return;}
  if(k===11&&INTERACT.chatComplete){INTERACT.chatReplay=(INTERACT.chatReplay||0)+1;a.v=0;a.target=0;INTERACT.chatComplete=false;return;}
  a.target = a.v >= 0.999 ? 0 : 1;   // success → click again resets
}
function resetAct(k) { const a = ACT[k]; if (a) { a.target = 0; if (k === 10) a.v = 0; } }
const blocked = (el) => !el?.closest?.('.hint.act') && el?.closest?.('a,button,input,.rail,.chapters,.card,.cta,.person-hotspots,.whale-scroll');
const down = (e) => {
  if (document.documentElement.classList.contains('opening')) return;
  setPtr(e);
  const k = actK(); if (k < 0 || blocked(e.target)) return;
  press = { k, t0: performance.now() }; INTERACT.holding = k !== 10;
};
const up = () => {
  INTERACT.holding = false;
  if (!press) return;
  const { k, t0 } = press; press = null;
  const dur = performance.now() - t0;
  if (k === 10) activate(10);
  else if (dur < 320) activate(k);              // short click → auto-fill (or reset if done)
  else if (ACT[k].v < 0.999) ACT[k].target = Math.max(ACT[k].target, ACT[k].v); // released long-press: keep progress, no decay
};
addEventListener('pointerdown', down); addEventListener('pointerup', up); addEventListener('pointercancel', () => { INTERACT.holding = false; press = null; });
document.querySelectorAll('.hint.act').forEach((b) => b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); activate(+b.dataset.k); } }));
addEventListener('keydown', (e) => {
  if (document.documentElement.classList.contains('opening')) return;
  if (e.target.closest?.('input,button,a,.chapters,.hint.act')) return;
  const k = actK(); if (k < 0) return;
  if (e.code === 'Enter' || e.code === 'KeyF') { e.preventDefault(); activate(k); }
  if (e.code === 'KeyR') resetAct(k);
});
addEventListener('contextmenu', (e) => { if (activeK === 12 || activeK === 11) e.preventDefault(); });

const plateau = (f) => {
  const h = REDUCED ? 0.2 : 0.20;
  if (f < h) return 0; if (f > 1 - h) return 1;
  const x = (f - h) / (1 - 2 * h); return x * x * (3 - 2 * x);
};

const tmp = new THREE.Vector3(), look = new THREE.Vector3(), viewOff = { x: 0, y: 0 };
let activeK = -1, smoothP = 0;
const frame = { last: 0 };
/* Codex bookends — created in the adapter section below */
let bookOpening = null, bookEnding = null;
const PROGRESS = { seg: 0, whale: 0, ending: 0 };
const FRAME = { time: 0, delta: 0, pointer: { x: 0.5, y: 0.5, down: false }, paused: false };

function tick(t) {
  readProgress();
  uniforms.uTime.value = REDUCED ? 0 : t;
  grade.uniforms.uTime.value = REDUCED ? 0 : t % 10;
  let frostDamp = 0;
  if (!REDUCED && ACT_TRANS[0]) {
    const a = ACT_TRANS[0], dd = Math.abs((STORY.seg || 0) - a.at);
    if (dd < a.w) { const x = 1 - dd / a.w; frostDamp = x * x * (3 - 2 * x); }
  }
  smoothP += (state.p - smoothP) * (REDUCED ? 1 : (0.16 - frostDamp * 0.11));
  if (PREAUTO.on) {
    const x = Math.min(1, (t - PREAUTO.t0) / 1.7), e = x * x * (3 - 2 * x);
    smoothP = rawFromSeg(PREAUTO.from + (GATE_SEG - 0.005 - PREAUTO.from) * e) / SPAN;
    const yy = smoothP * Math.max(1, document.documentElement.scrollHeight - innerHeight);
    scrollTo({ top: yy, behavior: 'instant' }); state.p = smoothP; state.lastY = yy;
    if (x >= 1) { PREAUTO.on = false; openEndingGate(); }
  }
  if (ENDAUTO.on) {
    const ep = endAutoP(t - ENDAUTO.t0);
    smoothP = rawFromSeg(Math.min(KEYS - 1e-4, END_S + ep * (KEYS - END_S))) / SPAN;
    const yy = smoothP * Math.max(1, document.documentElement.scrollHeight - innerHeight);
    scrollTo({ top: yy, behavior: 'instant' }); state.p = smoothP; state.lastY = yy;
    if (ep >= 1) ENDAUTO.on = false;
  }
  const seg = Math.min(segFromRaw(smoothP * SPAN), KEYS - 1e-4);
  STORY.seg = seg; window.__seg = seg;
  document.documentElement.classList.toggle('at-home', seg < 0.5);
  document.documentElement.classList.toggle('at-opening-start', seg < 1.35);
  const k = Math.floor(seg), f = plateau(seg - k), kk = Math.min(KEYS, k + 1);

  tmp.lerpVectors(keyPos(k), keyPos(kk), f);
  camera.position.copy(tmp);
  if (!REDUCED) { const dr = 1 - (window.__goStill || 0); camera.position.x += Math.sin(t * 0.2) * 0.22 * dr; camera.position.y += Math.sin(t * 0.16) * 0.12 * dr; }
  look.lerpVectors(LOOK[k], LOOK[kk], f);
  camera.lookAt(look);


  const nearest = Math.round(seg);
  let on;
  if (!OPEN.title) on = -1;
  else if (seg < 0.55) on = 0; // keep intro HUD until well into first dive
  else {
    // always show nearest key — avoid long empty stretches between panels
    on = Math.abs(seg - nearest) < 0.42 ? nearest : Math.max(1, Math.min(KEYS, Math.round(seg)));
  }
  if (on !== activeK || (on === 0 && OPEN.title && !panels[0].classList.contains('on'))) {
    panels.forEach((p) => {
      const pk = +p.dataset.k;
      let show = pk === on && (on !== 0 || OPEN.title);
      // keep intro readable until we are clearly into Turing
      if (pk === 0 && OPEN.title && seg < 0.55) show = true;
      if (pk === 0 && seg >= 0.55) show = false;
      p.classList.toggle('on', show);
    });
    railDots.forEach((d, i) => d.classList.toggle('on', i + 1 === on));
    activeK = on;
    const ck = Math.max(0, Math.min(N, on));
    railBtn.querySelector('.rc-yr').textContent = on > N ? '终章' : ck >= 1 ? MILESTONES[ck - 1].year : '开始';
    railBtn.querySelector('.rc-idx').textContent = `${String(ck).padStart(2, '0')} / ${N}`;
    railBtn.setAttribute('aria-label', `当前 ${railBtn.querySelector('.rc-yr').textContent}，打开章节目录`);
    chItems.forEach((b) => b.classList.toggle('on', +b.dataset.k === on));
    const si = stageOf(on);
    /* DC#5: chapter name only flashes ~1.3s on entering a new act */
    const hm = document.querySelector('.hud-mid');
    if (hm && si >= 0 && si !== STORY.lastStage && on >= 1 && on <= N) {
      hm.innerHTML = `<b>CHAPTER ${['I', 'II', 'III', 'IV'][si]}</b> / ${STAGES[si].name}`;
      hm.classList.add('flash'); clearTimeout(STORY.hmT); STORY.hmT = setTimeout(() => hm.classList.remove('flash'), 1300);
    }
    if (si >= 0) STORY.lastStage = si; else if (on <= 0) STORY.lastStage = -1;
    if (hashReady && !jumping && OPEN.title && on >= 0) { const h = hashFor(on); if (h !== location.hash) history.replaceState(null, '', h || location.pathname + location.search); }
  }

  // view offset — cards opposite objects; ending pushes whale down
  const side = on >= 1 && on <= N ? MILESTONES[on - 1].side : null;
  const tx = (OPEN.title < 1) ? 0 : narrow ? 0 : side === 'L' ? -W * 0.16 : side === 'R' ? W * 0.16 : 0;
  const ty = (OPEN.title < 1) ? 0 : on >= 13 ? -H * 0.08 : narrow && side ? H * 0.18 : 0;
  viewOff.x += (tx - viewOff.x) * 0.07; viewOff.y += (ty - viewOff.y) * 0.07;
  camera.setViewOffset(W, H, viewOff.x, viewOff.y, W, H);

  // stations
  stations.forEach((s) => {
    const l = s.k === N && seg > s.k ? 1 : THREE.MathUtils.clamp(1 - Math.abs(seg - s.k) / 0.85, 0, 1);
    // Restore the builder's own opacity before applying the chapter handoff.
    if(s.handoffOpacity)for(const [mat,opacity] of s.handoffOpacity)mat.opacity=opacity;
    if (s.obj.userData.update) s.obj.userData.update(REDUCED ? 0 : t, REDUCED ? (Math.round(l) || l) : l);
    // P0 overexposure: pillars are backdrop only — never wash the subject
    const pilMax = s.k === N ? 0.12 : s.act === 'winter' ? 0.14 : 0.18;
    s.pil.material.uniforms.uI.value = 0.015 + l * pilMax * .45;
    if (s.act === 'winter' && s.k !== 4 && s.obj.children) s.obj.traverse(ch=>{ if(ch.material?.uniforms?.uGain) ch.material.uniforms.uGain.value=0.45+l*0.45; if(ch.material?.opacity!=null && ch.isPoints) ch.material.opacity=0.35+l*0.3; });
    s.fl.material.uniforms.uI.value = 0.08 + l * 0.22;
    if (s.halo?.material?.uniforms?.uI) s.halo.material.uniforms.uI.value = 0.035 + l * 0.12;
    if (s.ring) { s.ring.material.opacity = 0.025 + l * 0.08; s.ring.rotation.z = (REDUCED ? 0 : t) * 0.15; s.ring.scale.setScalar(0.72 + l * 0.12); }
    s.root.visible = Math.abs(seg - s.k) < 1.1;
    // The AlexNet scene must never be translated onto the Go board.
    if (s.k === 9) s.root.visible = seg >= 8.84 && seg < 9.48; // after the chip-evolution dive
    if (s.k === 8) s.root.visible = seg < 8.5;
    if (s.k === 4) s.root.visible=seg>=3.55&&seg<4.62; // cut winter I before 1987 so embers don't bleed
    if (s.k === 5) s.root.visible=seg>=4.52&&seg<5.7;
    if (s.k === 12) s.root.visible=seg>=11.52&&seg<12.5;
    if (s.k === 11) s.root.visible=seg>=10.55&&seg<11.52;
    if (s.k === 10) s.root.visible = seg >= 9.52 && seg < 10.75;
    if(s.k===6||s.k===7){
      const fade=s.k===6?1-THREE.MathUtils.smoothstep(seg,6.15,6.70):THREE.MathUtils.smoothstep(seg,6.10,6.55);
      s.handoffOpacity ||= new Map();const seen=new Set();
      s.obj.traverse(o=>{if(!o.material)return;for(const mat of (Array.isArray(o.material)?o.material:[o.material])){
        if(seen.has(mat))continue;seen.add(mat);s.handoffOpacity.set(mat,mat.opacity);mat.transparent=true;mat.opacity*=fade;
      }});
      s.root.visible=s.root.visible&&fade>.002;
      s.pil.material.uniforms.uI.value*=fade;s.fl.material.uniforms.uI.value*=fade;
      if(s.halo?.material?.uniforms?.uI)s.halo.material.uniforms.uI.value*=fade;
      if(s.ring)s.ring.material.opacity*=fade;
    }
  });

  /* DC#6: R1 reasoning branches — hold explores paths, failed ones fade, valid ones converge into the whale */
  {
    const s12 = stations.find((x) => x.k === N);
    if (s12 && !s12.br) {
      const g = new THREE.Group(); s12.br = [];
      let rs = 7;
      const rnd = () => ((rs = (rs * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 14; i++) {
        const ok = i % 4 === 0; // ~4 valid paths
        const S = new THREE.Vector3(-4.7, -2.0, 0.5);
        const pts = [S.clone()];
        let c = S.clone();
        const E = ok ? new THREE.Vector3((rnd() - 0.5) * 1.2, (rnd() - 0.5) * 0.8, 0) : new THREE.Vector3(-4.4 + rnd() * 6, -2.8 + rnd() * 5.8, (rnd() - 0.5) * 2);
        for (let j = 1; j <= 4; j++) { c = S.clone().lerp(E, j / 4); c.x += (rnd() - 0.5) * (ok ? 1.2 : 2.2) * (j < 4); c.y += (rnd() - 0.5) * (ok ? 1.2 : 2.4) * (j < 4); pts.push(c); }
        const curve = new THREE.CatmullRomCurve3(pts), geo = new THREE.TubeGeometry(curve,60,MOBILE?.028:.024,6,false);
        // Actual geometry gives the branches visible thickness across WebGL implementations.
        const m = new THREE.MeshBasicMaterial({ color: ok ? 0xa8c1ff : 0xffc886, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
        const line = new THREE.Mesh(geo, m); line.frustumCulled = false; g.add(line);
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: ok ? 0xbfd0ff : 0xffc27a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
        g.add(tip);
        s12.br.push({ line, tip, ok, curve, d0: i * 0.025, len: ok ? 1 : 0.55 + rnd() * 0.35, die: 0.38 + rnd() * 0.3 });
      }
      s12.obj.add(g); s12.brG = g;
    }
    if (s12?.br) {
      const h = ACT[12].v, vis = on === N && h > 0.001 && h < .82 && seg < 12.3;
      s12.brG.visible = vis;
      if (vis) s12.br.forEach((b) => {
        const grow = THREE.MathUtils.clamp((h - b.d0) / (b.ok ? 0.8 : 0.4), 0, 1) * b.len;
        b.line.geometry.setDrawRange(0, Math.floor(grow * 60) * 36);
        const fade = b.ok ? 1 - THREE.MathUtils.smoothstep(h, .55, .8) : 1 - THREE.MathUtils.smoothstep(h, b.die, b.die + 0.18);
        b.line.material.opacity = 0.95 * fade * Math.min(1, h * 6);
        b.curve.getPoint(Math.max(0.001, grow), b.tip.position);
        b.tip.material.opacity = fade * (grow > 0.01 ? 1 : 0) * (b.ok && grow >= 0.999 ? 0.4 : 1);
      });
    }
    /* completed → hold ~1s → whale shrinks to a point → ending */
    if (on === N && ACT[12].v >= 0.999 && !INTERACT.holding && !endingGateOpen && !REDUCED) {
      if (!STORY.r1Done) STORY.r1Done = t;
      else if (!PREAUTO.on && t - STORY.r1Done > 5) { PREAUTO.on = true; PREAUTO.t0 = t; PREAUTO.from = seg; }
    } else if (on !== N) STORY.r1Done = 0;
  }

  /* DC#3: 2025 story whale fades → shrinks to a light point; screen pos handed to ending seed */
  {
    const s12 = stations.find((x) => x.k === N);
    if (s12) {
      const q = REDUCED ? 0 : THREE.MathUtils.smoothstep(seg, 12.18, 12.42);
      const base = (s12.obj.userData.base || 1) * (narrow ? 0.42 : 1);
      s12.obj.scale.setScalar(base * Math.max(0.015, 1 - q));
      if (s12.obj.userData.mat) s12.obj.userData.mat.uniforms.uGain.value = 0.42 * Math.pow(1 - q, 1.5);
      s12.pil.material.uniforms.uI.value *= 1 - q; s12.fl.material.uniforms.uI.value *= 1 - q;
      if (s12.halo?.material?.uniforms?.uI) s12.halo.material.uniforms.uI.value *= 1 - q;
      if (s12.ring) s12.ring.material.opacity *= 1 - q;
      if (!s12.dot) {
        s12.dot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 14), new THREE.MeshBasicMaterial({ color: 0xd7eeff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
        scene.add(s12.dot);
      }
      s12.obj.getWorldPosition(s12.dot.position);
      s12.dot.visible = q > 0.01 && seg < 12.5;
      s12.dot.material.opacity = THREE.MathUtils.smoothstep(q, 0.55, 0.95);
      s12.dot.scale.setScalar(0.6 + q * 0.8 + Math.sin(t * 2) * 0.06);
      if (seg < 12.5 && q > 0.3) {
        const v = s12.dot.position.clone().project(camera);
        host.handoff = { x: v.x, y: v.y };
      }
    }
    const hd = document.getElementById('handoff-dot');
    if (seg >= 12.5 && STORY.prevSeg < 12.5 && host.handoff) {
      STORY.handT = performance.now();
      hd.style.left = ((host.handoff.x + 1) / 2 * 100) + '%'; hd.style.top = ((1 - host.handoff.y) / 2 * 100) + '%';
    }
    const ho = STORY.handT ? 1 - (performance.now() - STORY.handT) / 280 : 0;
    hd.style.opacity = String(Math.max(0, ho)); if (ho <= 0) STORY.handT = 0;
    STORY.prevSeg = seg;
  }

  /* T3 particle morph: after 2009 (三河 stays intact) → AlexNet layers in place */
  {
    const m0 = 8.20, m1 = 8.96;
    const mt = THREE.MathUtils.clamp((seg - m0) / (m1 - m0), 0, 1);
    const live = mt > 0 && mt < 1;
    const ease = mt * mt * (3 - 2 * mt);
    MORPH.root.visible = !REDUCED && mt > 0.001 && mt < 0.995;
    if (MORPH.root.visible) {
      MORPH.root.position.lerpVectors(anchor(8),anchor(9),plateau(seg-8));
      const arr = MORPH.cur;
      /* converge rivers first, then unfold into CNN layers */
      const pull = THREE.MathUtils.smoothstep(ease, 0, 0.45); // streams → core
      const form = THREE.MathUtils.smoothstep(ease, 0.35, 1);  // core → layers
      for (let i = 0; i < MORPH.count; i++) {
        const sx = MORPH.start[i*3], sy = MORPH.start[i*3+1], sz = MORPH.start[i*3+2];
        const ex = MORPH.end[i*3], ey = MORPH.end[i*3+1], ez = MORPH.end[i*3+2];
        const cx = THREE.MathUtils.lerp(sx, 0, pull);
        const cy = THREE.MathUtils.lerp(sy, 0, pull);
        const cz = THREE.MathUtils.lerp(sz, 0, pull);
        arr[i*3]   = THREE.MathUtils.lerp(cx, ex, form);
        arr[i*3+1] = THREE.MathUtils.lerp(cy, ey, form);
        arr[i*3+2] = THREE.MathUtils.lerp(cz, ez, form);
      }
      MORPH.geo.attributes.position.needsUpdate = true;
      const fadeIn = THREE.MathUtils.smoothstep(mt, 0.02, 0.15);
      const fadeOut = 1 - THREE.MathUtils.smoothstep(mt, 0.82, 0.98);
      MORPH.pts.material.opacity = fadeIn * fadeOut * 1.0;
      MORPH.pts.material.size = (MOBILE ? 0.08 : 0.11) * (0.85 + form * 0.35);
      MORPH.root.rotation.y = 0.55 + Math.sin(t * 0.35) * 0.08;
      /* hold AlexNet hidden until morph nearly formed; never touch 三河 builder */
      const st9 = stations[8]; // k=9 → index 8
      if (st9) st9.root.visible = mt > 0.78 && seg < 9.48;
      document.documentElement.classList.toggle('morph-trans', mt > 0.05 && mt < 0.95);
    } else {
      document.documentElement.classList.remove('morph-trans');
    }
  }

  // act transitions
  const u = seg - k;
  const mid = Math.sin(Math.PI * THREE.MathUtils.clamp((u - 0.2) / 0.6, 0, 1));
  let fxC = '#fff', fxA = 0, fov = narrow ? 62 : 50;
  if (REDUCED) { fxC = '#05070d'; fxA = k >= 1 ? mid * 0.85 : 0; }
  // 4 stages, 3 mid transitions
  else if (k === 3) { fxA = 0; }                 // S1→S2: now the WebGL frost-dissolve (ACT_TRANS), no white DOM flash
  else if (k === 6) { fxA = 0; }                 // S2→S3: now the WebGL rising dissolve (ACT_TRANS)
  else if (k === 8) { const fl = Math.exp(-Math.pow((u - 0.12) / 0.05, 2)); fxC = '#dfe9ff'; fxA = 0; void fl; } // 2009 merge flash → chip dive
  else if (k === 9) { fov -= mid * 4; fxC='#030817'; fxA=Math.pow(mid,4)*.95; }                                // S3→S4: network collapses into the Go board (see below)
  if (!jumping) { if (FX.c !== fxC) { FX.el.style.background = fxC; FX.c = fxC; } FX.el.style.opacity = fxA.toFixed(3); }
  if (Math.abs(camera.fov - fov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix(); }

  // Scene roots stay at their own anchors; transition hides them at the cut.
  stations[8].root.position.copy(anchor(9));
  stations[8].root.scale.setScalar(1);

  // winter flashlight + friction
  const winter = THREE.MathUtils.clamp(1 - Math.min(Math.abs(seg - 4), Math.abs(seg - 5), Math.abs(seg - 6)) / 0.9, 0, 1);
  grade.uniforms.uWinter.value = winter * (on === 6 ? .18 : on === 4 ? .28 : .08);
  grade.uniforms.uMouse.value.set(INTERACT.mx, 1 - INTERACT.my);
  if (lenis && lenis.options) lenis.options.lerp = 0.1 - 0.04 * winter;
  document.documentElement.classList.toggle('winter', winter > 0.45 && on === 4);

  // holds
  const now = performance.now();
  const dt = Math.min(0.1, (now - (frame.last || now)) / 1000);
  frame.last = now;
  // interactions: auto-fill toward target; long-press fills while held; no decay; finale auto-forms (never gated)
  if(on===12){if(STORY.r1Entered==null)STORY.r1Entered=t;if(t-STORY.r1Entered>.7)ACT[12].target=1;}else STORY.r1Entered=null;
  [11, 12].forEach((k) => {
    const a = ACT[k];
    if (on === k && INTERACT.holding && press) a.v = Math.min(1, a.v + dt / (k === 12 ? 2.4 : 1.1));
    else if (a.target > a.v) a.v = Math.min(a.target, a.v + dt / (REDUCED ? 0.15 : k === 12 ? 3.8 : 0.6));
    else if (a.target < a.v) a.v = Math.max(a.target, a.v - dt / 0.35);
    if (a.v >= 1) a.target = 1;
  });
  if (on >= 13) ACT[12].v = Math.max(ACT[12].v, THREE.MathUtils.smoothstep(seg, 12.2, 13.6));
  INTERACT.cursorHold = ACT[11].v;
  INTERACT.hold = ACT[12].v;
  const HC = document.getElementById('holdCursor');
  [[HOLD, 12, MOBILE?'汇聚中':'粒子正在汇聚', MOBILE?'已汇聚 · 重播':'已汇聚 · 点击重播'], [HC, 11, MOBILE?'打开对话':'展开对话', MOBILE?'已展开 · 重播':'对话已展开 · 点击重播'], [TAP, 10, '落子', MOBILE?'已落子 · 重放':'已落子 · 再点重放']].forEach(([el, k, verb, doneTxt]) => {
    if (!el) return;
    const v = ACT[k].v, done = v >= 0.999 || k===11&&INTERACT.chatComplete;
    el.style.setProperty('--h', v.toFixed(3));
    el.classList.toggle('show', on === k);
    el.classList.toggle('done', done);
    el.tabIndex = on === k ? 0 : -1;
    const lbl = el.querySelector('.lbl'); const txt = done ? doneTxt : `${k === 12 ? '自动' : '点击'} · ${verb}`;
    if (lbl.textContent !== txt) lbl.textContent = txt;
    const sm = el.querySelector('small');
    if (sm) { const tip = MOBILE ? '（点击 · Enter）' : (k === 12 ? '（点击亦可 · Enter）' : k === 11 ? '（长按亦可 · Enter）' : '（Enter）'); if (sm.textContent !== tip) sm.textContent = tip; }
  });

  // opening — camera locked on whale until unlock; then soft handoff
  const iw = introWhale.userData.mat.uniforms;
  iw.uForm.value = OPEN.form;
  iw.uGain.value = 0.35 + OPEN.form * 1.15 + OPEN.light * 0.15;
  const away = THREE.MathUtils.smoothstep(seg, 0.05, 0.8);
  const inOpen = OPEN.title < 1 || away < 0.02;
  introWhale.visible = away < 1 || on >= 13;
  if (away < 1) {
    introWhale.position.lerpVectors(WHALE_HOME, V3(WHALE_HOME.x - 16, WHALE_HOME.y - 2, WHALE_HOME.z - 10), away);
  }
  introPillar.position.copy(introWhale.position).add(V3(0, -5.2, 0));
  introFloor.position.copy(introWhale.position).add(V3(0, -5.15, 0));
  introPillar.material.uniforms.uI.value = OPEN.light * (1 - away) * 0.85;
  introFloor.material.uniforms.uI.value = (0.15 + OPEN.form * 0.9 + OPEN.light * 0.25) * (1 - away);
  openPillars.forEach((pil, i) => {
    const breath = 0.35 + 0.65 * Math.sin(t * 0.35 + i * 0.9);
    pil.material.uniforms.uI.value = OPEN.pillars * (0.25 + breath * 0.55) * (1 - away * 0.85);
  });
  // bloom: punch then drop; while assembling (form rising) hard-cap ≤1.1 so silhouette never blows out
  const bloomRest = 0.22;
  let bStr = inOpen ? OPEN.bloom : THREE.MathUtils.lerp(OPEN.bloom, bloomRest, Math.min(1, seg * 1.6));
  if (inOpen && OPEN.form > 0.08 && OPEN.form < 0.99) bStr = Math.min(bStr, 1.1);
  if (inOpen && OPEN.form >= 0.99) bStr = Math.min(bStr, 1.12);
  bloom.strength = bStr;
  if (PERF_TIER >= 2) bloom.strength = Math.min(bloom.strength, 0.35); else if (PERF_TIER >= 1) bloom.strength = Math.min(bloom.strength, 0.45);
  grade.uniforms.uOpen.value = inOpen ? Math.max(OPEN.dither, 1 - OPEN.title) : Math.max(0, grade.uniforms.uOpen.value * 0.92);
  if (inOpen) {
    // halved dolly: stay close enough that 3/4 silhouette reads during assemble
    const dolly = OPEN.cam;
    camera.position.set(
      0.55 + Math.sin(t * 0.08) * 0.25,
      -0.55 + Math.sin(t * 0.12) * 0.12 - dolly * 0.03,
      -5.2 + dolly
    );
    camera.lookAt(introWhale.position.x + 0.4, introWhale.position.y + 0.25, introWhale.position.z);
    // gentle open fog
    const openFog = 0.018 + OPEN.fog * 0.02;
    uniforms.uFog.value = openFog;
    if (scene.fog) scene.fog.density = openFog;
    scene.background.setRGB(0.015 + OPEN.light * 0.02, 0.025 + OPEN.fog * 0.04, 0.06 + OPEN.fog * 0.08);
  }
  if (window.__burstMat) {
    window.__burstMat.uniforms.uBurst.value = OPEN.burst * (1 - away);
    window.__burst.visible = OPEN.burst > 0.02 && away < 1;
    window.__burst.position.copy(introWhale.position);
  }
  if (window.__rings) {
    window.__rings.forEach((r, i) => {
      const rk = Math.max(0, OPEN.ring - i * 0.12);
      r.position.copy(introWhale.position).add(V3(0, -4.8, 0));
      r.scale.setScalar(0.3 + rk * (18 + i * 6));
      r.material.opacity = Math.max(0, (1 - rk) * OPEN.burst * (0.75 - i * 0.18)) * (1 - away);
    });
  } else if (window.__ring) {
    const rk = OPEN.ring;
    window.__ring.scale.setScalar(0.4 + rk * 28);
    window.__ring.material.opacity = Math.max(0, (1 - rk) * OPEN.burst * 0.7) * (1 - away);
  }
  // finale: keep R1 whale visible under logo stages, auto-form
  if (on >= 13) {
    const st = stations[N - 1];
    if (st) {
      st.root.visible = on <= 14; // hide 3D whale under info stage
      st.obj.userData.update?.(t, 1);
      if (st.obj.userData.mat) st.obj.userData.mat.uniforms.uGain.value = on === 14 ? 0.25 : 0.42;
      st.pil.material.uniforms.uI.value = on === 13 ? 0.45 : 0.15;
    }
  }

  const streak = 0;
  snowMat.uniforms.uVel.value += ((REDUCED ? 0 : Math.min(state.vel, 1.4)) + streak - snowMat.uniforms.uVel.value) * 0.12;

  const dp = THREE.MathUtils.lerp(DEPTHS[k], DEPTHS[kk], f);
  depthEl.textContent = String(Math.round(dp)).padStart(5, '0');
  updateDiveTrack(seg,dp);
  grade.uniforms.uDepth.value = Math.min(1, seg / KEYS);
  { let tt = 0, mode = 0, frostAmt = 0;
    for (const a of ACT_TRANS) {
      const d = Math.abs(seg - a.at);
      if (d < a.w) {
        const x = 1 - d / a.w; tt = x * x * (3 - 2 * x);
        actTrans.uniforms.uTint.value.copy(a.tint);
        actTrans.uniforms.uDir.value = a.dir;
        mode = a.mode || 0;
        if (a.mode === 0) frostAmt = tt;
      }
    }
    actTrans.uniforms.uT.value = REDUCED ? 0 : tt;
    actTrans.uniforms.uMode.value = mode;
    actTrans.uniforms.uTime.value = REDUCED ? 0 : t;
    actTrans.enabled = tt > 0.001 && !QS_NOTRANS;
    actTrans.uniforms.uAsp.value = innerWidth / Math.max(1, innerHeight);
    /* frost side-channel: deepen winter grade + freeze scroll feel + bloom chill */
    if (frostAmt > 0.01 && !REDUCED) {
      grade.uniforms.uWinter.value = Math.max(grade.uniforms.uWinter.value, 0.35 + frostAmt * 0.55);
      bloom.strength = Math.min(bloom.strength, THREE.MathUtils.lerp(0.55, 0.28, frostAmt));
      document.documentElement.classList.add('frost-trans');
    } else {
      document.documentElement.classList.remove('frost-trans');
    }
  }
  scene.background.copy(BG_TOP).lerp(BG_DEEP, Math.min(1, seg / 2.6));
  if (k >= N) scene.background.lerp(new THREE.Color(0x08123a), f * 0.9);
  // deepen fog as we dive
  const fogAmt = 0.028 + Math.min(0.022, seg * 0.0022);
  uniforms.uFog.value = fogAmt;
  if (scene.fog) scene.fog.density = fogAmt;

  // host progress (single native scroll) — act 12 whale + ending
  PROGRESS.seg = seg;
  PROGRESS.whale = THREE.MathUtils.clamp(seg - 11.5, 0, 1);
  PROGRESS.ending = THREE.MathUtils.clamp((seg - 12.5) / 2.5, 0, 1);
  FRAME.time = t; FRAME.delta = dt; FRAME.paused = document.hidden;
  FRAME.pointer.x = INTERACT.mx; FRAME.pointer.y = INTERACT.my; FRAME.pointer.down = INTERACT.holding;
  sceneUI.update(on);
  enforceEndingGate();
  const endingP=THREE.MathUtils.clamp((seg-12.5)/2.5,0,1);
  const endingActive=seg>=12.5;
  document.documentElement.classList.toggle('in-ending',endingActive);
  const endEl=document.querySelector('.unified-ending');
  const endAlpha=THREE.MathUtils.smoothstep(endingP,.74,.80);
  if(endingActive&&endingP>=.80){if(ENDING_COPY.start===null)ENDING_COPY.start=t;}else ENDING_COPY.start=null;
  const copyAge=REDUCED?10:ENDING_COPY.start===null?-1:t-ENDING_COPY.start;
  endEl.classList.toggle('on',endingActive&&endAlpha>0);
  endEl.style.opacity=String(endAlpha);
  const fullSlogan=CONFIG.slogan,typedCount=REDUCED?fullSlogan.length:Math.min(fullSlogan.length,Math.floor(THREE.MathUtils.clamp((copyAge-.95)/2.25,0,1)*(fullSlogan.length+1)));
  const sloganEl=endEl.querySelector('.slogan-cn');
  if(sloganEl.dataset.typed!==String(typedCount)){sloganEl.dataset.typed=String(typedCount);sloganEl.querySelector('.final-typed').textContent=fullSlogan.slice(0,typedCount);}
  const cursorEl=endEl.querySelector('.final-cursor');cursorEl.style.opacity=String(copyAge>=0&&copyAge<4.1?(REDUCED?1:Math.sin(t*5.2)>.1?1:.08):0);
  sloganEl.style.opacity=String(THREE.MathUtils.smoothstep(copyAge,0,.35));
  const infoAlpha=THREE.MathUtils.smoothstep(copyAge,3.65,4.55);host.endingInfo=infoAlpha;host.endingLift=THREE.MathUtils.smoothstep(copyAge,.95,.95+2.25*fullSlogan.length/(fullSlogan.length+1));
  endEl.querySelectorAll('.slogan-en,.ending-details,.fine').forEach(el=>{el.style.opacity=String(infoAlpha);el.style.transform=`translateY(${(1-infoAlpha)*8}px)`;el.inert=infoAlpha<.9;});
  endEl.inert=endAlpha<.9;
  document.querySelector('.ending-cue').style.opacity=String(1-THREE.MathUtils.smoothstep(endingP,.70,.80));
  document.querySelector('#ending-phase').textContent=endingP<.18?'一点微光':endingP<.46?'散作群星':'群星，终有回响';
  document.querySelector('.ending-cue small').textContent=ENDAUTO.on?'终章正在展开 · 滚动可接管':(seg>=12.05||endingGateOpen)?'终章入口 · 星辰即将汇聚':'继续向下 · 让星辰汇聚';
  if(endingActive)document.querySelector('.card[data-k="12"]').classList.remove('on');
  // render selection (Codex contract): opening → idle whale bg → story composer → ending
  if (bookOpening?.active) bookOpening.update({ time: t });
  else if (bookOpening && seg < 0.35) bookOpening.renderIdle(REDUCED ? 0 : t);
  else if (bookEnding && seg >= 12.5) { bookEnding.setProgress((seg - 12.5) / 2.5); bookEnding.update({ time: REDUCED ? 0 : t }); }
  else composer.render();
}

/* adaptive quality */
let acc = 0, cnt = 0, last = performance.now(), downgraded = false, slowAfter = 0;
let PERF_TIER = 0;
function applyTier2() {
  PERF_TIER = 2;
  snowGeo.setDrawRange(0, Math.min(SNOW, 9000));
  const wp = bookEnding?.whalePoints; if (wp) wp.geometry.setDrawRange(0, Math.min(wp.geometry.attributes.position.count, 5000));
  window.__perfTier = 2;
}
if (QS.has('lowperf')) setTimeout(() => { downgraded = true; PERF_TIER = 1; applyTier2(); }, 0);
function perf(now) {
  const d = now - last; last = now;
  if (document.hidden || bookOpening?.active || d > 120) { acc = 0; cnt = 0; return; }
  acc += d; cnt++;
  if (acc > 2500) {
    const avg = acc / cnt; acc = cnt = 0;
    if (avg > 24 && !downgraded) { downgraded = true; PERF_TIER = 1; DPR = Math.min(BASE_DPR, Math.max(1.25, BASE_DPR * .85)); bloom.strength = Math.min(bloom.strength, 0.45); resize(); }
    else if (avg > 24 && PERF_TIER === 1 && ++slowAfter >= 2) applyTier2(); /* DC#8: second tier if still slow after DPR drop */
  }
}

/* ---------- Codex bookends adapter (see docs/HOST-API.md) ---------- */
const loader = document.getElementById('loader');
document.querySelector('.intro h1').textContent = CONFIG.title;
document.querySelectorAll('.slogan-cn').forEach(el=>{el.setAttribute('aria-label',CONFIG.slogan);el.innerHTML='<span class="final-typed" aria-hidden="true"></span><i class="final-cursor" aria-hidden="true"></i>';});
const HASH_RE = /^#(y\d{4}|end)$/;
const deepLink = HASH_RE.test(INIT_HASH);
const lockScroll = (on) => document.documentElement.classList.toggle('scroll-locked', !!on);
let unlocked = false;
function unlockOpening({ reason = 'done' } = {}) {
  if (unlocked) return;
  unlocked = true;
  Object.assign(OPEN, { title: 1, form: 1, bloom: 0.5, light: 0, cam: 1.2, burst: 0, ring: 1, fog: 0, dither: 0, pillars: 0 });
  activeK = -2;
  lockScroll(false);
  try { sessionStorage.setItem(CONFIG.sessionKey, '1'); } catch (_) {}
  document.documentElement.classList.remove('opening');
  document.documentElement.classList.add('opened');
  introWhale.visible = false; // Codex opening/idle whale replaces the old intro whale
  host.lastReason = reason;
  if (reason === 'finished' || reason === 'skipped') jumpTo(1, { instant: true });
}
const host = {
  version: 2,
  renderer, scene, camera, composer,
  positions: window.__whalePos || [],
  quality: MOBILE ? 'low' : DPR < 1.2 ? 'medium' : 'high',
  reducedMotion: REDUCED,
  mount: loader,
  onComplete: unlockOpening,
  beginOpeningHandoff() {
    // Prepare the real first scene behind the opening, using the existing camera and renderer.
    Object.assign(OPEN, { title: 1, form: 1, bloom: .5, light: 0, cam: 1.2, burst: 0, ring: 1, fog: 0, dither: 0, pillars: 0 });
    activeK = -2;
    jumpTo(1, { instant: true });
  },
  getOpeningFocus() {
    const p=stations[0].obj.localToWorld(new THREE.Vector3(0,1,0)).project(camera);
    return {x:(p.x+1)/2,y:(p.y+1)/2};
  },
  get whaleProgress() { return PROGRESS.whale; },
  get endingProgress() { return PROGRESS.ending; },
  navigate(action) {
    if (action === 'replay') replayOpening();
    else if (action === 'home') window.__story?.jumpTo(0);
    else if (action === 'chat') window.open('https://chat.deepseek.com', '_blank', 'noopener');
    else if (action === 'site') window.open('https://www.deepseek.com/', '_blank', 'noopener');
  },
};
window.__host = host;
bookOpening = createOpening(host);
bookEnding = createEnding(host);
window.__bookends = { opening: bookOpening, ending: bookEnding };
await Promise.all([bookOpening.prepare?.(), bookEnding.prepare?.()].map((p) => Promise.resolve(p).catch((e) => console.warn('[host] prepare', e))));
const resizeBookends = () => { const size = { width: innerWidth, height: innerHeight }; bookOpening.resize(size); bookEnding.resize(size); };
resizeBookends(); addEventListener('resize', resizeBookends);

let visited = false; try { visited = sessionStorage.getItem(CONFIG.sessionKey) === '1'; } catch (_) {}
const FAST = REDUCED || QS.has('skip') || (deepLink && !QS.has('replay') && !QS.has('t')) || (visited && !QS.has('replay') && !QS.has('t'));
let elapsed = 0, previousFrame = performance.now();
function replayOpening() {
  if (REDUCED) return;
  window.__story?.jumpTo(0, { instant: true });
  scrollTo({ top: 0, behavior: 'instant' }); state.p = 0; smoothP = 0;
  unlocked = false; OPEN.title = 0;
  document.documentElement.classList.remove('opened');
  document.documentElement.classList.add('opening'); lockScroll(true);
  bookOpening.play(elapsed);
}
if (FAST) bookOpening.skip();
else { document.documentElement.classList.add('opening'); lockScroll(true); scrollTo(0, 0); bookOpening.play(0); }
const replayBtn = document.createElement('button');
replayBtn.type = 'button'; replayBtn.className = 'ds-bookend-replay'; replayBtn.textContent = '重播开场';
replayBtn.addEventListener('click', replayOpening); document.body.append(replayBtn);
document.querySelector('.ds-bookend-return')?.addEventListener('click', () => window.__story.jumpTo(0));
document.querySelector('#replay-ending')?.addEventListener('click',()=>window.__story.jumpTo(12.52));

renderer.compile(scene, camera);
gsap.ticker.add(() => {
  const now = performance.now(); const dt = Math.min(0.05, (now - previousFrame) / 1000); previousFrame = now;
  if (document.hidden) return;   // visibility pause: animation clock stops
  elapsed += dt; perf(now); tick(elapsed);
});
// The opening uses the paused animation clock, including completion and replay.

if (deepLink && FAST) {
  const dk = kFromHash(INIT_HASH);
  ScrollTrigger.refresh();
  if (dk >= 0) jumpTo(dk, { instant: true });
  history.replaceState(null, '', INIT_HASH);
  setTimeout(() => { hashReady = true; }, 400);
} else hashReady = true;
addEventListener('pagehide', () => { try { bookOpening.dispose(); bookEnding.dispose(); } catch (_) {} });
ScrollTrigger.refresh();
window.__lenis = lenis;
window.__ready = true;
