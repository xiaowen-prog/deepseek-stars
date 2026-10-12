import * as THREE from 'three';
import {createWhale} from './whale.js?v=16';
const smooth=(x,a,b)=>THREE.MathUtils.smoothstep(x,a,b);
export function createEnding(host){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#030817');const camera=new THREE.PerspectiveCamera(48,1,.1,120);camera.position.z=13;
 const whale=createWhale(host.positions,host.quality==='low'?4500:10000);scene.add(whale.points);
 const seed=new THREE.Mesh(new THREE.SphereGeometry(.043,24,16),new THREE.MeshBasicMaterial({color:0xd7eeff,transparent:true}));scene.add(seed);
 const p=[];for(let i=0;i<650;i++)p.push(Math.sin(i*133.3)*22,Math.cos(i*17.7)*14,-5-(i%59));
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));const m=new THREE.PointsMaterial({color:'#7293e8',size:.025,transparent:true,opacity:.35,depthWrite:false});const stars=new THREE.Points(g,m);scene.add(stars);let progress=0;
 return {whalePoints:whale.points,prepare:async()=>{},setProgress(v){progress=THREE.MathUtils.clamp(v,0,1);},update({time}){
   const expand=smooth(progress,.18,.40),form=smooth(progress,.46,.74),lift=smooth(progress,.76,.80);
   whale.update(time,form,smooth(progress,.16,.30),host.renderer.getPixelRatio(),host.endingLift||0);
   const info=host.endingLift||0;whale.points.scale.setScalar((innerWidth<760?.8:1.15)*Math.max(.001,expand)*(1-info*.35));
   whale.points.position.set(0,lift*(innerWidth<760?2.1:2.05)+info*.95,0);whale.points.rotation.set(0,Math.sin(time*.14)*.035*form*(1-info),0);
   {const hf=host.handoff,hh=Math.tan(THREE.MathUtils.degToRad(24))*13,mv=1-smooth(progress,.015,.12);seed.position.set(hf?hf.x*hh*camera.aspect*mv:0,hf?hf.y*hh*mv:0,0);}seed.material.opacity=1-smooth(progress,.18,.30);seed.scale.setScalar(1+Math.sin(time*2)*.08);stars.material.opacity=.06+expand*.3;
   host.renderer.render(scene,camera);
 },resize({width,height}){camera.aspect=width/height;camera.updateProjectionMatrix();},dispose(){whale.dispose();g.dispose();m.dispose();seed.geometry.dispose();seed.material.dispose();}};
}
