import * as THREE from 'three';
export function createWhale(positions, count=6500){
 if(!positions?.length){positions=[];for(let i=0;i<2400;i++){const a=i*2.39996,r=Math.sqrt((i%101)/101);positions.push(Math.cos(a)*2.4*r,Math.sin(a)*1.15*r,Math.sin(i*13.1)*.12);}}

 const n=Math.min(count,positions.length/3), p=[], seeds=[];
 for(let i=0;i<n;i++){const j=Math.floor(i*positions.length/3/n)*3;p.push(-positions[j],positions[j+1],positions[j+2]);seeds.push(i/n);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geometry.setAttribute('seed',new THREE.Float32BufferAttribute(seeds,1));
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{time:{value:0},form:{value:0},opacity:{value:1},pixel:{value:1}},vertexShader:`attribute float seed;uniform float time,form,pixel;varying float v;varying float fl;
vec3 flow(vec3 p,float t){return vec3(sin(p.y*.9+t*.7)+sin(p.z*1.3+t*.4),sin(p.z*.8+t*.6)+cos(p.x*1.1-t*.5),cos(p.x*.7+t*.3)+sin(p.y*1.2+t*.8))*.5;}
void main(){float a=seed*213.73;vec3 cloud=vec3(cos(a)*sin(a*.43),sin(a*.43),sin(a)*cos(a*.31))*8.;
float h=fract(seed*97.31);float f=smoothstep(h*.45,h*.45+.55,form);
vec3 base=mix(cloud,position,f);
float drift=(1.-f)*1.6+.05;vec3 q=base;q+=flow(q*.35,time*.5+seed*6.)*drift;q+=flow(q*.7+3.,time*.35)*drift*.35;
vec3 p=q;p.y+=sin(time*.65+p.x)*.05*f;
vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(pixel*(20.+seed*14.)/(-mv.z),1.,3.*pixel);v=.5+seed*.5;fl=f;}`,fragmentShader:`uniform float opacity;varying float v;varying float fl;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float a=pow(1.-d,1.8)*opacity*(.42+.36*fl);gl_FragColor=vec4(mix(vec3(.09,.20,1.),vec3(.32,.57,1.),v)*1.35,a);#include <tonemapping_fragment>
#include <colorspace_fragment>}`.replace(';#include',';\n#include')});
 const points=new THREE.Points(geometry,material);points.frustumCulled=false;return {points,update(t,f,o,dpr){material.uniforms.time.value=t;material.uniforms.form.value=f;material.uniforms.opacity.value=o;material.uniforms.pixel.value=dpr;},dispose(){geometry.dispose();material.dispose();}};
}
