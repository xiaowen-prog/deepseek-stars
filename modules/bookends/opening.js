import * as THREE from 'three';
import {CONFIG} from './config.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {AfterimagePass} from 'three/addons/postprocessing/AfterimagePass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
const smooth=(x,a,b)=>THREE.MathUtils.smoothstep(x,a,b);
export function createOpening(host){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#02040d');
 const camera=new THREE.PerspectiveCamera(78,1,.1,150);camera.position.z=4;
 const geometry=new THREE.CylinderGeometry(5.5,5.5,110,host.quality==='low'?48:80,96,true);geometry.rotateX(Math.PI/2);geometry.translate(0,0,-48);
 const material=new THREE.ShaderMaterial({side:THREE.BackSide,transparent:true,depthWrite:false,uniforms:{time:{value:0},flight:{value:0},alpha:{value:0}},
 vertexShader:`uniform float time,flight;varying vec2 vUv;varying float depth;void main(){vUv=uv;vec3 p=position;float d=clamp(-p.z/90.,0.,1.);float a=atan(p.y,p.x);float r=1.+.13*sin(a*3.+p.z*.13+time*.35)+.07*cos(a*5.-p.z*.21-time*.2);p.xy*=r;p.x+=sin(p.z*.055+time*.18)*d*8.;p.y+=cos(p.z*.047+time*.13)*d*6.;depth=-p.z;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
 fragmentShader:`uniform float time,flight,alpha;varying vec2 vUv;varying float depth;void main(){float a=vUv.x*6.28318;float z=vUv.y;float twist=a+z*2.5+sin(z*8.+time*.3)*.2;float ridge=pow(.5+.5*sin(twist*13.),24.);float rib=pow(.5+.5*cos(z*115.-time*(2.+flight*15.)),34.);float lanes=pow(.5+.5*cos(twist*7.+time*.13),4.);float pulse=pow(.5+.5*sin(z*26.-time*(1.+flight*8.)+a*2.),10.);vec3 col=mix(vec3(.16,.09,.6),vec3(.08,.68,.91),.5+.5*sin(a+z*7.));col*=.14+ridge*.7+rib*.36+lanes*pulse*.9;col+=vec3(.45,.7,1.)*ridge*pulse*.5;float fog=1.-smoothstep(52.,108.,depth);gl_FragColor=vec4(col*1.05,alpha*fog);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});
 const tube=new THREE.Mesh(geometry,material);tube.frustumCulled=false;scene.add(tube);
 const points=[],ends=[];for(let i=0;i<700;i++){const a=i*2.39996,r=1.2+(i%37)/37*7,z=-(i%101);points.push(Math.cos(a)*r,Math.sin(a)*r,z,Math.cos(a)*r,Math.sin(a)*r,z);ends.push(0,1);}
 const streakGeo=new THREE.BufferGeometry();streakGeo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));streakGeo.setAttribute('edge',new THREE.Float32BufferAttribute(ends,1));
 const streakMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{travel:{value:0},flight:{value:0},alpha:{value:0}},vertexShader:`attribute float edge;uniform float travel,flight;varying float fade;void main(){vec3 p=position;p.z=mod(p.z+travel,102.)-98.-edge*(.2+flight*4.);fade=1.-smoothstep(25.,100.,-p.z);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`uniform float alpha;varying float fade;void main(){gl_FragColor=vec4(.45,.76,1.,alpha*fade);}`});const streaks=new THREE.LineSegments(streakGeo,streakMat);streaks.frustumCulled=false;scene.add(streaks);
 // DOM and WebGL share the host's paused clock: no independent typing timers.
 const root=host.mount;
 root.classList.add('ds-bookend-opening');
 root.innerHTML=`<div class="ds-opening-veil" aria-hidden="true"></div><div class="ds-opening-question" aria-label="${CONFIG.title}"><span class="ds-opening-measure" aria-hidden="true">${CONFIG.title}</span><span class="ds-opening-typed" aria-hidden="true"></span><i class="ds-opening-cursor" aria-hidden="true"></i></div><div class="ds-opening-seed" aria-hidden="true"></div><div class="ds-opening-journey" aria-hidden="true"><span>循着问题，走向未知</span><small>FOLLOW THE QUESTION</small></div><div class="ds-opening-arrival" aria-hidden="true"><small>1950 · 模仿游戏</small><p>图灵把这个问题，变成了一场实验。</p></div><div class="ds-bookend-depth"><span id="ld-num">0000</span><small> m · 正在下潜</small></div>`;
 const typed=root.querySelector('.ds-opening-typed'),cursor=root.querySelector('.ds-opening-cursor'),measure=root.querySelector('.ds-opening-measure'),depth=root.querySelector('#ld-num');
 const chars=[...CONFIG.title];
 // Punctuation creates a small pause, while every character remains legible.
 const keyTimes=[1.85,2.04,2.22,2.53,2.73,2.92,3.13,3.34,3.54,3.65];
 let composer=null,after=null,bloom=null,exit=null;
 try {
  composer=new EffectComposer(host.renderer);
  composer.addPass(new RenderPass(scene,camera));
  after=new AfterimagePass(.7);composer.addPass(after);
  if(host.quality!=='low'){bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.25,.35,.72);composer.addPass(bloom);}
  composer.addPass(new OutputPass());
  exit=new ShaderPass({
   uniforms:{tDiffuse:{value:null},story:{value:null},progress:{value:0},aspect:{value:1},focus:{value:new THREE.Vector2(.5,.5)}},
   vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
   fragmentShader:`uniform sampler2D tDiffuse,story;uniform float progress,aspect;uniform vec2 focus;varying vec2 vUv;
    void main(){vec4 old=texture2D(tDiffuse,vUv);if(progress<=0.){gl_FragColor=old;return;}
     vec2 q=(vUv-focus)*vec2(aspect,1.);
     float farthest=length(vec2(max(focus.x,1.-focus.x)*aspect,max(focus.y,1.-focus.y)));
     float radius=mix(0.,farthest+.15,progress);
     float mask=(1.-smoothstep(radius-.08,radius+.08,length(q)))*smoothstep(0.,.12,progress);
     gl_FragColor=mix(old,texture2D(story,vUv),mask);
    }`
  });composer.addPass(exit);
 } catch(err){console.warn('[opening] composer off',err);composer?.dispose();composer=null;}
 let active=false,done=false,start=0,last=0,travel=0,handoff=false,lastCount=-1;
 const qs=new URLSearchParams(location.search),freeze=qs.has('t'),frozen=Number(qs.get('t'));
 function finish(reason){
  if(done)return;done=true;active=false;
  root.classList.add('ds-bookend-done');root.inert=true;
  root.style.setProperty('--arrival','0');root.style.setProperty('--journey','0');
  host.onComplete({reason});
 }
 const key=e=>{if(active&&e.key==='Escape')finish('skipped');};addEventListener('keydown',key);
 function render(t,idle=false){
  const e=idle?CONFIG.duration:freeze?Math.max(0,frozen):Math.max(0,t-start),dt=Math.min(.05,Math.max(0,t-last));last=t;
  const flight=smooth(e,5.55,6.85)*(1-smooth(e,7.6,8.8));
  const fade=idle?.06:smooth(e,5.35,6.3)*(1-smooth(e,8.8,9.65));
  if(freeze)travel=5*e+65*Math.max(0,e-5.3);else travel+=dt*(5+flight*65);
  const phase=idle?t:e;
  material.uniforms.time.value=phase;material.uniforms.flight.value=flight;material.uniforms.alpha.value=fade;
  streakMat.uniforms.travel.value=travel;streakMat.uniforms.flight.value=flight;streakMat.uniforms.alpha.value=idle?.015:flight*.5;
  tube.rotation.z=Math.sin(phase*.2)*.1+phase*.035;streaks.rotation.z=phase*.025;
  camera.fov=78+flight*13;camera.position.x=Math.sin(phase*.24)*flight*.22;camera.position.y=Math.cos(phase*.19)*flight*.13;camera.updateProjectionMatrix();
  const count=keyTimes.filter(at=>e>=at).length;
  if(count!==lastCount){typed.textContent=chars.slice(0,count).join('');lastCount=count;}
  const full=measure.getBoundingClientRect().width,used=typed.getBoundingClientRect().width;
  const settle=smooth(e,1.5,1.85);
  const cursorX=THREE.MathUtils.lerp(full*.5,used+5,settle);
  cursor.style.left=`${THREE.MathUtils.lerp(cursorX,full*.5,smooth(e,4.85,5.35))}px`;
  // Two deliberate pulses; after typing starts the cursor remains lit.
  cursor.style.opacity=String(e<1.8?(e<.43||e>=.88&&e<1.32||e>=1.68?1:.06):1);
  root.style.setProperty('--question',String(1-smooth(e,4.85,5.35)));
  root.style.setProperty('--question-scale',String(1-smooth(e,4.85,5.35)*.045));
  const collapse=smooth(e,4.95,5.35);
  cursor.style.height=`${THREE.MathUtils.lerp(1.05*parseFloat(getComputedStyle(measure).fontSize),3,collapse)}px`;
  cursor.style.top=`${THREE.MathUtils.lerp(.23*parseFloat(getComputedStyle(measure).fontSize),measure.getBoundingClientRect().height*.5,collapse)}px`;
  root.style.setProperty('--seed',String(smooth(e,5.12,5.35)*(1-smooth(e,5.42,5.78))));
  root.style.setProperty('--seed-scale',String((1+smooth(e,5.12,5.38)*1.6)*(1-smooth(e,5.42,5.78)*.85)));
  root.style.setProperty('--iris',`${smooth(e,5.4,6.6)*Math.hypot(innerWidth,innerHeight)*.6}px`);
  root.style.setProperty('--veil',String(1-smooth(e,6.15,6.65)));
  root.style.setProperty('--depth',String(smooth(e,5.9,6.5)*(1-smooth(e,9.05,9.65))));
  root.style.setProperty('--journey',String(smooth(e,6.25,6.65)*(1-smooth(e,7.75,8.05))));
  root.style.setProperty('--journey-shift',`${-smooth(e,7.65,8.1)*14}px`);
  root.style.setProperty('--arrival',String(smooth(e,8.05,8.4)*(1-smooth(e,9.15,9.65))));
  depth.textContent=String(Math.round(smooth(e,5.5,CONFIG.duration)*700)).padStart(4,'0');
  if(!idle&&e>=8.1&&!handoff){handoff=true;host.beginOpeningHandoff?.();}
  const reveal=idle?0:smooth(e,8.25,9.65);
  root.style.setProperty('--reveal',String(reveal));
  if(composer){
   after.uniforms.damp.value=idle?.5:.52+flight*.24;
   if(bloom)bloom.strength=.12+flight*.18;
   exit.uniforms.progress.value=reveal;
   if(reveal>0){host.composer.render();exit.uniforms.story.value=host.composer.readBuffer.texture;const focus=host.getOpeningFocus?.();if(focus)exit.uniforms.focus.value.set(focus.x,focus.y);}
   composer.render();
  }else if(reveal>.5)host.composer.render();else host.renderer.render(scene,camera);
  if(!idle&&e>=CONFIG.duration&&!freeze)finish('finished');
 }
 return {
  prepare:async()=>{await document.fonts.ready;},
  play(t=0){start=last=t;travel=0;active=true;done=false;handoff=false;lastCount=-1;typed.textContent='';
   for(const [name,value] of Object.entries({question:1,'question-scale':1,seed:0,'seed-scale':1,iris:'0px',veil:1,depth:0,journey:0,arrival:0,reveal:0}))root.style.setProperty(`--${name}`,String(value));
   root.classList.remove('ds-bookend-done');root.inert=false;},
  skip:()=>finish('skipped'),get active(){return active;},
  update:({time})=>render(time),renderIdle:t=>render(t,true),
  resize({width,height}){if(composer){composer.setPixelRatio(host.renderer.getPixelRatio());composer.setSize(width,height);exit.uniforms.aspect.value=width/height;}camera.aspect=width/height;camera.updateProjectionMatrix();},
  dispose(){composer?.dispose?.();exit?.material.dispose();removeEventListener('keydown',key);geometry.dispose();material.dispose();streakGeo.dispose();streakMat.dispose();}
 };
}
