import {moves, boardAt} from './go-record.js';
export const PEOPLE = [
 {name:'约翰·麦卡锡',en:'John McCarthy',tag:'为一个领域命名',bio:'达特茅斯计划的四位发起人之一。“人工智能”一词见于 1955 年提案；他后来提出 Lisp，推动符号推理与知识表示。'},
 {name:'马文·明斯基',en:'Marvin Minsky',tag:'从神经网络追问智能',bio:'四位发起人之一。早期研制神经网络学习机器，研究学习理论，并在研讨期间提出几何定理证明的思路。'},
 {name:'克劳德·香农',en:'Claude Shannon',tag:'信息、搜索与机器',bio:'四位发起人之一。奠定信息论基础，1950 年提出计算机下棋的研究方法，并用迷宫机器探索学习与搜索。'},
 {name:'纳撒尼尔·罗切斯特',en:'Nathaniel Rochester',tag:'让想法进入计算机',bio:'四位发起人之一、IBM 701 的设计者之一。研究自动编程与神经网络模拟，支持把机器智能研究落实为程序。'}
];
export function reviseBuilders(builders,{THREE,INTERACT,MOBILE,REDUCED,STORY,camera}) {
 const basic=(color,opacity=1)=>new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity});
 const line=(points,color=0x7195d2,opacity=.6)=>new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color,transparent:true,opacity}));
 const sphere=(r,col)=>new THREE.Mesh(new THREE.SphereGeometry(r,20,16),basic(col));
 const smooth=(x,a=0,b=1)=>THREE.MathUtils.smoothstep(x,a,b);
 const label=(text,color='#bbd5ff',size=1)=>{
  const cv=document.createElement('canvas');cv.width=512;cv.height=96;const ctx=cv.getContext('2d');ctx.fillStyle=color;ctx.font='36px monospace';ctx.textAlign='center';ctx.fillText(text,256,61);
  const tex=new THREE.CanvasTexture(cv),sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));sp.scale.set(size*4,size*.75,1);return sp;
 };
 builders[0]=()=>{
  const g=new THREE.Group(),packets=[];
  [-2.1,2.1].forEach((x,i)=>{
   const terminal=new THREE.Group();terminal.position.set(x,1,0);
   terminal.add(new THREE.Mesh(new THREE.BoxGeometry(2.7,2.8,.16),basic(0x0c1728)));
   // Mesh strokes stay continuous under perspective; no one-pixel dashed edges.
   const frame=new THREE.Shape();frame.moveTo(-1.35,-1.30);frame.lineTo(-1.35,1.30);frame.quadraticCurveTo(-1.35,1.40,-1.25,1.40);frame.lineTo(1.25,1.40);frame.quadraticCurveTo(1.35,1.40,1.35,1.30);frame.lineTo(1.35,-1.30);frame.quadraticCurveTo(1.35,-1.40,1.25,-1.40);frame.lineTo(-1.25,-1.40);frame.quadraticCurveTo(-1.35,-1.40,-1.35,-1.30);
   const outline=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(frame.getPoints(8).map(p=>new THREE.Vector3(p.x,p.y,.10)),true,'centripetal'),128,.016,6,true),basic(0x9fb7df,.78));terminal.add(outline);
   for(const y of [-1.17,1.17])terminal.add(line([[-1.13,y,.115],[1.13,y,.115]],0x536b8c,.32));
   const id=label(i?'B · ?':'A · ?', '#e6efff',.6);id.position.set(0,1.85,0);terminal.add(id);
   for(let j=0;j<5;j++){const stroke=line([[-.85,.7-j*.3,.12],[.3+(j%2)*.5,.7-j*.3,.12]],0x83abd4,.65);terminal.add(stroke);}
   const caret=new THREE.Mesh(new THREE.PlaneGeometry(.035,.15),basic(0xa4c7ee,.8));caret.position.set(.43,-.5,.14);terminal.add(caret);terminal.userData.caret=caret;
   g.add(terminal);
   const pts=[[x,-.45,.1],[x,-1.1,.1],[x,-1.1,.1],[0,-2.4,.1]];g.add(line(pts,0x7faddd,.5));
   for(let j=0;j<4;j++){const p=sphere(.065,0xd2edff);g.add(p);packets.push({p,x,j});}
  });
  const head=sphere(.24,0xffc88f);head.position.y=-2.55;g.add(head);
  const body=new THREE.Mesh(new THREE.ConeGeometry(.36,.65,24),basic(0x9a7554));body.position.y=-3.1;g.add(body);
  const judge=label('YOU / 提问者','#ffc88f',.5);judge.position.y=-3.85;g.add(judge);
  g.userData.update=t=>{g.children.forEach(o=>{if(o.userData.caret)o.userData.caret.material.opacity=Math.sin(t*3.4)>.1?.8:.12;});packets.forEach(({p,x,j})=>{const v=(t*.23+j*.25)%1;p.position.set(x*v,-2.35+v*1.8,.2);});};
  return g;
 };
 builders[1]=()=>{
  const g=new THREE.Group(),figures=[],featured=[];
  const table=new THREE.Mesh(new THREE.CylinderGeometry(2.35,2.35,.16,72),basic(0x15223d));g.add(table);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(2.35,.027,8,96),basic(0x9dbaeb));rim.rotation.x=Math.PI/2;rim.position.y=.1;g.add(rim);
  // A few quiet paper sheets suggest a workshop without crowding the people.
  for(let i=0;i<4;i++){const a=paperAngle(i);const sheet=new THREE.Mesh(new THREE.PlaneGeometry(.48,.62),basic(0x657b99,.6));sheet.rotation.x=-Math.PI/2;sheet.rotation.z=a;sheet.position.set(Math.cos(a)*1.65,.095,Math.sin(a)*1.65);g.add(sheet);}
  function paperAngle(i){return .3+i*Math.PI/2;}
  const legs=new THREE.Mesh(new THREE.CylinderGeometry(.28,.7,1.3,24),basic(0x243759));legs.position.y=-.65;g.add(legs);
  // Ten symbolic participants; highlighted figures represent the four proposal authors.
  const keySeats=[0,3,5,8];
  for(let i=0;i<10;i++){
   const a=Math.PI/10+i*Math.PI/5,person=new THREE.Group(),key=keySeats.indexOf(i),special=key>=0;
   person.position.set(Math.cos(a)*3.05,0,Math.sin(a)*3.05);
   const body=new THREE.Mesh(new THREE.CylinderGeometry(.16,.32,.83,24),basic(special?0x778bac:0x354861));body.position.y=.49;
   const head=sphere(special?.23:.20,special?0xd7c29e:0x8292ad);head.position.y=1.13;
   const base=new THREE.Mesh(new THREE.CylinderGeometry(.37,.4,.10,24),basic(special?0x617798:0x26384f));person.add(body,head,base);
   if(special){person.userData.person=key;const halo=new THREE.Mesh(new THREE.TorusGeometry(.38,.019,6,40),basic(0xc3ac88,.7));halo.rotation.x=Math.PI/2;halo.position.y=.07;person.add(halo);featured[key]=head;}
   g.add(person);figures.push({person,body,head,key});
  }
  g.rotation.x=.36;g.rotation.y=.15;
  g.userData.people=featured;
  g.userData.update=t=>figures.forEach(f=>{const selected=f.key>=0&&INTERACT.person===f.key,hover=f.key>=0&&INTERACT.personHover===f.key;f.head.material.color.set(selected?0xffdca0:hover?0xffeed0:f.key>=0?0xd7c29e:0x8292ad);f.body.material.color.set(selected?0xa37a4c:f.key>=0?0x778bac:0x354861);f.person.position.y=selected?.06:0;});
  return g;
 };
 // Winter I: the perceptron's lamp array becomes a frozen learning network.
 builders[3]=()=>{
  const g=new THREE.Group(),nodes=[],links=[],packets=[],embers=new Set([8,18,25]);
  const colorCold=0x849bb9,colorLit=0xafd6df,positions=[];
  for(let row=0;row<5;row++)for(let col=0;col<6;col++){
   const p=new THREE.Vector3((col-2.5)*.95,(2-row)*.82,0);positions.push(p);
   const node=sphere(.095,colorLit);node.material.transparent=true;node.material.depthWrite=false;node.position.copy(p);g.add(node);
   const socket=new THREE.Mesh(new THREE.TorusGeometry(.15,.009,5,24),basic(colorCold,.3));socket.position.copy(p);g.add(socket);
   nodes.push({node,socket});
  }
  const up=new THREE.Vector3(0,1,0);
  const connect=(a,b)=>{
   const start=positions[a],end=positions[b],delta=end.clone().sub(start),len=delta.length();
   const edge=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,len,5),basic(colorCold,.25));edge.position.copy(start).add(end).multiplyScalar(.5);edge.quaternion.setFromUnitVectors(up,delta.normalize());g.add(edge);
   // Short branch-shaped frost, kept subtler than the main connection.
   const mid=start.clone().lerp(end,.55),frost=line([[mid.x-.12,mid.y-.11,.04],[mid.x,mid.y,.04],[mid.x,mid.y,.04],[mid.x+.12,mid.y+.13,.04]],0xb9cddd,.32);g.add(frost);
   links.push({a,b,edge,frost});
  };
  for(let row=0;row<5;row++)for(let col=0;col<6;col++){const i=row*6+col;if(col<5)connect(i,i+1);if(row<4)connect(i,i+6);}
  for(let i=0;i<10;i++){const packet=sphere(.047,colorLit);packet.material.transparent=true;packet.material.depthWrite=false;g.add(packet);packets.push(packet);}
  const caption=label('学习的光，逐渐停滞','#a6b8cf',.72);caption.position.set(0,2.55,.1);g.add(caption);
  const snowPos=new Float32Array(90*3),snowHome=[];for(let i=0;i<90;i++){snowHome.push([(Math.sin(i*17.7)+1)*3.5-3.5,(Math.cos(i*9.3)+1)*2.7-2.7]);}
  const snowGeo=new THREE.BufferGeometry();snowGeo.setAttribute('position',new THREE.BufferAttribute(snowPos,3));const snow=new THREE.Points(snowGeo,new THREE.PointsMaterial({color:0xc7d9e9,size:.055,transparent:true,opacity:0,depthWrite:false}));g.add(snow);
  const frostMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{amount:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float amount;void main(){vec2 q=vUv;float edge=pow(abs(q.x-.5)*2.,3.)+pow(abs(q.y-.5)*2.,3.);float branch=pow(abs(sin(q.x*53.+q.y*21.)),28.)*pow(abs(sin(q.y*39.-q.x*15.)),8.);float sweep=1.-smoothstep(amount-.1,amount+.1,q.x);gl_FragColor=vec4(.57,.69,.83,sweep*(edge*.19+branch*.14)*amount); }'});
  const frostPane=new THREE.Mesh(new THREE.PlaneGeometry(6.6,4.7),frostMat);frostPane.position.z=.10;g.add(frostPane);
  let start=0,wasActive=false,lastReplay=-1;const projected=new THREE.Vector3();
  g.userData.update=(t,l)=>{
   const active=l>.5,replay=INTERACT.winterReplay||0;
   if((active&&!wasActive)||replay!==lastReplay){start=t;lastReplay=replay;}wasActive=active;
   const age=Math.max(0,t-start),freeze=REDUCED?1:smooth(age,1.6,5.6),thaw=smooth(STORY.seg,4.16,4.70),fade=1-smooth(STORY.seg,4.55,4.98);
   g.updateWorldMatrix(true,true);
   nodes.forEach(({node,socket},i)=>{
    node.getWorldPosition(projected);projected.project(camera);
    const dx=((projected.x*.5+.5)-INTERACT.mx)*innerWidth/innerHeight,dy=(-projected.y*.5+.5)-INTERACT.my;
    const torch=INTERACT.winterLight?1-smooth(Math.hypot(dx,dy),.04,.24):0;
    const dim=smooth(freeze,(i%6)*.055,.65+(i%5)*.04),breath=REDUCED?.75:.65+.35*Math.sin(t*1.2+i);
    const reverseGlow=thaw>0?Math.max(0,1-Math.abs((1-thaw)*6-i%6)*1.6):0;
    node.material.opacity=fade*((1-dim)*.8+dim*(embers.has(i)?.78*breath:.19)+torch*.36*dim+reverseGlow*.65);
    node.material.color.set(thaw>.1?0xafc7e6:embers.has(i)?0xd5b386:colorCold);
    socket.material.opacity=fade*(.28+torch*.4+reverseGlow*.35);
   });
   links.forEach(({edge,frost,a,b},i)=>{edge.material.opacity=fade*(.22+(1-freeze)*.28+thaw*.23);frost.material.opacity=fade*freeze*(1-thaw)*(.32+(i%4)*.035);});
   packets.forEach((packet,i)=>{
    const path=links[(i*7)%links.length];
    // Ease-out travel reaches a fixed endpoint as the network freezes.
    const bounded=Math.min(age,5.6),flow=REDUCED?0:bounded-bounded*bounded/11.2,u=((flow*.38+i*.173)%1),reverse=thaw>0?1-((thaw*2+i*.173)%1):u;
    packet.position.copy(positions[path.a]).lerp(positions[path.b],reverse);packet.position.z=.06;
    packet.material.opacity=fade*(thaw>0?.65:(1-freeze)*.75+freeze*.05);
   });
   frostMat.uniforms.amount.value=freeze*(1-thaw)*fade;
   snow.material.opacity=REDUCED?0:freeze*.5*fade*(1-thaw);const sa=snowGeo.attributes.position;
   snowHome.forEach((p,i)=>sa.setXYZ(i,p[0]+Math.sin(t*.4+i)*.12,((p[1]+2.7-t*(.12+(i%4)*.018))%5.4+5.4)%5.4-2.7,.15+(i%3)*.15));sa.needsUpdate=true;
   caption.material.opacity=fade*.85;
   INTERACT.winterPhase=thaw>.05?'thaw':freeze>.96?'frozen':'freezing';
  };
  return g;
 };
 // Winter II: approved rule-tree metaphor; fixed branches preserve legibility.
 builders[5]=c=>{
  const g=new THREE.Group(),nodes=[],edges=[];
  const positions=[[0,2.5,0],[-1.9,1,0],[1.9,1,0],[-2.8,-.7,0],[-1,-.7,0],[1,-.7,0],[2.8,-.7,0]];
  positions.forEach((p,i)=>{const n=sphere(i?.16:.23,0x607080);n.position.set(...p);g.add(n);nodes.push(n);});
  for(let i=1;i<7;i++){const parent=Math.floor((i-1)/2);const edge=line([positions[parent],positions[i]],0x657486,.7);g.add(edge);edges.push(edge);}
  const title=label('IF → THEN','#c6d6e7',.65);title.position.y=3.25;g.add(title);
  const good=label('MATCH / 答案','#8eb9a6',.48);good.position.set(-2.8,-1.35,0);g.add(good);
  const dead=label('规则止步','#d4ae79',.48);dead.position.set(2.8,-1.35,0);g.add(dead);
  const outside=new THREE.Group();g.add(outside);
  const gap=line([[2.9,-.7,.05],[3.18,-.7,.05],[3.45,-.7,.05],[3.62,-.7,.05],[3.78,-.7,.05],[3.95,-.7,.05]],0xc79a61,.7);outside.add(gap);
  const stop=line([[3.16,-.87,.07],[3.16,-.53,.07]],0xefbc79,.9);outside.add(stop);
  const question=label('?', '#ebcfaa',1.1);question.position.set(4.2,-.7,.1);outside.add(question);
  const note=label('规则之外的新问题','#b6a183',.75);note.position.set(3.7,-1.95,0);outside.add(note);
  const ruleReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const traveler=sphere(.14,0xcfe9ff);g.add(traveler);let ruleMode=null,ruleStart=0,wasActive=false,lastReplay=-1;
  const success=label('✓  找到答案','#a8ccbf',.65);success.position.set(-2.8,-1.35,.1);g.add(success);good.visible=false;
  g.userData.update=(t,l)=>{
   const mode=INTERACT.ruleMode||'auto',active=l>.55;
   if(ruleMode!==mode||lastReplay!==(INTERACT.ruleReplay||0)||(active&&!wasActive)){ruleMode=mode;ruleStart=t;lastReplay=INTERACT.ruleReplay||0;}wasActive=active;
   const age=ruleReduced?7:Math.max(0,t-ruleStart),isNew=mode==='new'||(mode==='auto'&&age>=4.2);
   const knownDone=mode==='auto'?age>=2.5:mode==='known'&&age>=2.5;
   const p=ruleReduced?1:Math.min(1,Math.max(0,(age-(isNew&&mode==='auto'?4.2:0))/2.5));
   const path=isNew?[0,2,6]:[0,1,3],segment=Math.min(1,Math.floor(p*2)),v=Math.min(1,p*2-segment);
   traveler.position.fromArray(positions[path[segment]]).lerp(new THREE.Vector3(...positions[path[segment+1]]),smooth(v));
   const passed=i=>path.includes(i)&&path.indexOf(i)<=p*2+.03;
   nodes.forEach((n,i)=>n.material.color.set(passed(i)?(isNew?0xd5b386:0xa8ccbf):knownDone&&[1,3].includes(i)?0x8cae9e:0x455363));
   edges.forEach((edge,i)=>{const current=passed(i+1),retained=knownDone&&[1,3].includes(i+1);edge.material.color.set(current?(isNew?0xd5b386:0xa8ccbf):retained?0x8cae9e:0x43546b);edge.material.opacity=current?.95:retained?.65:.24;});
   outside.visible=isNew&&p>.85;
   traveler.material.color.set(isNew?0xe2bc86:0xd6f2ef);
   if(p===1&&isNew)traveler.position.x+=Math.sin(t*2.2)*.05;
   success.material.opacity=knownDone?1:.2;dead.material.opacity=isNew&&p===1?1:.2;
   INTERACT.rulePhase=isNew?(p===1?'new-stop':'new-travel'):(p===1?'known-done':'known-travel');
  };
  return g;
 };
 builders[6]=()=>{
  // V14 · 1997 Deep Blue: calm board → piece drops (fast ease-in, contact, tiny settle) → square ripple → eval wave → freeze.
  const g=new THREE.Group(),BOARD_Y=-1.9,PX=.5,PZ=.5; // piece lands on a square centre (e5-ish)
  g.add(new THREE.AmbientLight(0x9aadc6,1.3));const light=new THREE.PointLight(0xdbe7f5,24,20);light.position.set(3,5,4);g.add(light);
  const board=new THREE.Group();board.position.y=BOARD_Y;g.add(board);
  const tiles=[],BASE_D=new THREE.Color(0x1a2638),BASE_L=new THREE.Color(0x2b3a52),LIT=new THREE.Color(0x9cc2ec),FLIP=new THREE.Color(0x3f5878),tmp=new THREE.Color();
  for(let row=0;row<8;row++)for(let col=0;col<8;col++){const dark=(row+col)%2===1,tile=new THREE.Mesh(new THREE.PlaneGeometry(.94,.94),basic(dark?0x1a2638:0x2b3a52,.9));tile.rotation.x=-Math.PI/2;tile.position.set(col-3.5,0,row-3.5);tile.userData={dark,d:Math.hypot(col-3.5-PX,row-3.5-PZ)};board.add(tile);tiles.push(tile);}
  const gp=[];for(let i=0;i<=8;i++){const v=i-4;gp.push([v,.004,-4],[v,.004,4],[-4,.004,v],[4,.004,v]);}const grid=line(gp,0x8fa6c4,.55);board.add(grid);
  const king=new THREE.Group(),profile=[[0,0],[.57,0],[.63,.1],[.63,.18],[.51,.26],[.48,.34],[.35,.4],[.23,1.3],[.43,1.42],[.44,1.55],[.29,1.68],[.29,1.98],[.34,2.02],[.34,2.13],[0,2.13]].map(v=>new THREE.Vector2(...v));
  const kingMat=new THREE.MeshStandardMaterial({color:0x52677f,metalness:.18,roughness:.38,transparent:true,opacity:1});
  king.add(new THREE.Mesh(new THREE.LatheGeometry(profile,48),kingMat));
  const crossMat=new THREE.MeshStandardMaterial({color:0x90a4bd,roughness:.4,transparent:true,opacity:1});
  const cross=new THREE.Group();const vertical=new THREE.Mesh(new THREE.BoxGeometry(.11,.52,.11),crossMat),horizontal=new THREE.Mesh(new THREE.BoxGeometry(.40,.11,.11),crossMat);horizontal.position.y=.08;cross.add(vertical,horizontal);cross.position.y=2.35;king.add(cross);king.userData.role='crown';king.scale.setScalar(.82);g.add(king);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.62,48),basic(0x03070e,.0));shadow.rotation.x=-Math.PI/2;shadow.position.set(PX,BOARD_Y+.012,PZ);g.add(shadow);
  // thin crisp ring outline riding the wave front (no additive glow)
  const ring=new THREE.Mesh(new THREE.RingGeometry(.97,1,96),basic(0xc9dcf2,0));ring.rotation.x=-Math.PI/2;ring.position.set(PX,BOARD_Y+.02,PZ);g.add(ring);
  // eval readout: a small monospace number that rises with the wave, then freezes on the result
  const cv=document.createElement('canvas');cv.width=1024;cv.height=160;const cx=cv.getContext('2d'),tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const evalSp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false,opacity:0}));evalSp.scale.set(MOBILE?6.6:5.4,MOBILE?1.03:.84,1);evalSp.position.set(0,BOARD_Y+3.9,0);g.add(evalSp);let lastTxt='';
  const draw=(a,b)=>{const k=a+'|'+b;if(k===lastTxt)return;lastTxt=k;cx.clearRect(0,0,1024,160);cx.textAlign='center';cx.fillStyle='#dbe7f5';cx.font='600 64px monospace';cx.fillText(a,512,70);cx.fillStyle='#8fa6c4';cx.font='34px monospace';cx.fillText(b,512,132);tex.needsUpdate=true;};
  g.rotation.x=.16;g.rotation.y=-.25;let start=0,wasActive=false,lastReplay=-1,armed=false;
  const T_IN=MOBILE?.7:1.7,T_DROP=MOBILE?1.05:2.15,T_HIT=MOBILE?1.35:2.5,SPEED=MOBILE?4.2:3.4,MAXD=Math.hypot(4,4)+1.2;
  const paintBoard=(fade,r)=>{
   tiles.forEach(o=>{const d=o.userData.d,band=r<0?0:Math.exp(-Math.pow((d-r)/.55,2)),passed=r<0?0:smooth(r-d,0,.8);
    tmp.copy(o.userData.dark?BASE_D:BASE_L).lerp(FLIP,passed*(o.userData.dark?.55:.35)).lerp(LIT,band*.78*(1-Math.min(1,d/MAXD)*.45));
    o.material.color.copy(tmp);o.material.opacity=.9*fade;o.position.y=band*.05;});
   grid.material.opacity=.72*fade;
  };
  g.userData.update=(t,l)=>{
   // Mobile cards eat proximity — arm the drop earlier so the piece is not still hanging mid-scroll.
   const active=l>(MOBILE?.28:.55),replay=INTERACT.crownReplay||0;
   if(active&&!wasActive||replay!==lastReplay){start=t;lastReplay=replay;armed=true;}wasActive=active;
   // Idle: keep a calm visible board so entering never blanks/blues for a frame.
   if(!armed){
    board.visible=true;paintBoard(.85,-9);king.visible=false;shadow.material.opacity=0;ring.material.opacity=0;evalSp.material.opacity=0;
    INTERACT.crownPhase='enter';return;
   }
   const age=REDUCED?12:Math.max(0,t-start),fade=.55+.45*smooth(age,0,.55);
   board.visible=true;
   // piece: appears high, brief hang, then crisp cubic ease-in drop
   const H=4.2,show=smooth(age,T_IN,T_IN+.35);let y=H;
   if(age>=T_DROP){const p=Math.min(1,(age-T_DROP)/(T_HIT-T_DROP));y=H*(1-p*p*p);}
   let sy=1,sxz=1;const s=age-T_HIT;
   if(s>=0&&s<.32){const k=Math.exp(-s*14)*Math.cos(s*38);sy=1-.06*k;sxz=1+.03*k;y=Math.max(0,.035*Math.exp(-s*12)*Math.sin(Math.max(0,s-.05)*30));}
   if(s>=.32)y=0;
   king.visible=age>T_IN;kingMat.opacity=crossMat.opacity=show;
   king.position.set(PX,BOARD_Y+.012+y,PZ);king.scale.set(.82*sxz,.82*sy,.82*sxz);
   const near=1-Math.min(1,y/H);shadow.material.opacity=age>T_IN?show*(.08+.42*near*near):0;shadow.scale.setScalar(1.5-.6*near);
   // ripple across squares
   const r=age>T_HIT?(age-T_HIT)*SPEED:-9;paintBoard(fade,r);
   const ro=r>0&&r<4.4?Math.pow(1-r/4.4,1.5)*.6:0;ring.material.opacity=ro;ring.scale.setScalar(Math.max(.01,r));
   // eval wave: rises with the ring, then freezes on the result
   const ev=smooth(age,T_HIT+.1,T_HIT+2.6),fin=age>T_HIT+3.2;
   draw(fin?'DEEP BLUE 3½ – 2½ KASPAROV':'EVAL +'+(ev*3.95).toFixed(2),fin?'1997.05.11 · GAME 6 · 1–0':'DEEP BLUE · 200M POS/S');
   evalSp.material.opacity=smooth(age,T_HIT+.1,T_HIT+.5);
   INTERACT.crownPhase=age<T_DROP?'enter':age<T_HIT+.35?'placing':'placed';
  };return g;
 };
 builders[9]=()=>{
  const g=new THREE.Group(),pts=[],size=7.2,cell=size/18;
  const board=new THREE.Mesh(new THREE.BoxGeometry(size+.55,.13,size+.55),basic(0x9a8057));board.position.y=-.1;g.add(board);const border=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(size+.55,.13,size+.55)),new THREE.LineBasicMaterial({color:0xc6ab7b,transparent:true,opacity:.35}));border.position.copy(board.position);g.add(border);
  for(let i=0;i<19;i++){const v=(i-9)*cell;pts.push([v,0,-size/2],[v,0,size/2],[-size/2,0,v],[size/2,0,v]);}g.add(line(pts,0x302a21,.85));
  for(const x of [3,9,15])for(const y of [3,9,15]){const p=sphere(.039,0x2a241b);p.position.set((x-9)*cell,.01,(y-9)*cell);g.add(p);}
  const geo=new THREE.SphereGeometry(cell*.47,20,12),black=basic(0x10151d),white=basic(0xb7c4d7),stones=[];
  for(let i=0;i<361;i++){const s=new THREE.Mesh(geo,black);s.scale.y=.48;s.position.set((i%19-9)*cell,.085,(Math.floor(i/19)-9)*cell);s.visible=false;g.add(s);stones.push(s);}
  const marker=new THREE.Mesh(new THREE.RingGeometry(.058,.074,24),basic(0xefb874));marker.rotation.x=-Math.PI/2;g.add(marker);let last=-1;
  g.rotation.x=.98;g.position.y=.35;
  // Move 37: soft waves originate from the recorded stone, not the board center.
  const p37=moves[36][1],i37=(p37.charCodeAt(1)-97)*19+(p37.charCodeAt(0)-97);
  const hx=(p37.charCodeAt(0)-106)*cell,hz=(p37.charCodeAt(1)-106)*cell;
  const waveMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
   uniforms:{uElapsed:{value:0},uCenter:{value:new THREE.Vector2(hx,hz)},uHalf:{value:size/2}},
   vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
   fragmentShader:`uniform float uElapsed,uHalf;uniform vec2 uCenter;varying vec2 vUv;
    void main(){vec2 q=vec2(vUv.x-.5,.5-vUv.y)*5.4;vec2 board=q+uCenter;
     if(abs(board.x)>uHalf||abs(board.y)>uHalf)discard;
     float d=length(q),alpha=0.;
     for(int i=0;i<3;i++){
      float delay=float(i)*2.6;
      if(uElapsed<delay)continue;
      float age=mod(uElapsed-delay,7.8);
      float u=clamp(age/5.2,0.,1.);float radius=mix(.19,2.45,u);
      float band=1.-smoothstep(.013,.055,abs(d-radius));
      float life=smoothstep(0.,.16,u)*(1.-smoothstep(.42,1.,u));
      alpha+=band*life*.48;
     }
     if(alpha<.003)discard;
     gl_FragColor=vec4(vec3(1.,.77,.42),min(alpha,.64));
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`
  });
  const ripple=new THREE.Mesh(new THREE.PlaneGeometry(5.4,5.4),waveMat);
  ripple.rotation.x=-Math.PI/2;ripple.position.set(hx,.025,hz);ripple.visible=false;g.add(ripple);
  let previousMove=-1,wasActive=false,start=0,seenReplay=0,seenTap=-99;
  const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  g.userData.update=(t,l)=>{
   const n=INTERACT.goMove??37,active=l>.45;
   const replay=INTERACT.goReplay||0,tap=INTERACT.tap??-99;
   if(n===37&&((active&&!wasActive)||previousMove!==37||replay!==seenReplay||tap!==seenTap))start=t;
   seenReplay=replay;seenTap=tap;wasActive=active;previousMove=n;
   const elapsed=Math.max(0,t-start),rit=n===37&&active&&!reduced&&elapsed<1.7;
   const T_DROP=.25,T_LAND=.8,T_WAVE=1.25;
   // A short arrival ritual; slow ripple continues while viewers read the board.
   window.__goStill=rit?1:0;
   document.documentElement.classList.toggle('go-still',rit&&elapsed<T_LAND);
   const key=rit&&elapsed<T_DROP?36:n;
   if(key!==last){last=key;const b=boardAt(key);stones.forEach((s,i)=>{s.visible=!!b[i];s.material=b[i]===2?white:black;s.position.y=.085;});}
   if(n===37){const hs=stones[i37];hs.position.y=.085+(rit?1-THREE.MathUtils.smoothstep(elapsed,T_DROP,T_LAND):0);}
   marker.visible=n!==37&&!!moves[n-1]&&!(rit&&elapsed<T_LAND);
   const p=moves[n-1]?.[1];if(p)marker.position.set((p.charCodeAt(0)-106)*cell,.186,(p.charCodeAt(1)-106)*cell);
   ripple.visible=n===37&&active&&!reduced&&elapsed>=T_WAVE;
   waveMat.uniforms.uElapsed.value=Math.max(0,elapsed-T_WAVE);
  };
  return g;
 };
 return builders;
}
