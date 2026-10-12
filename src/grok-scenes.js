/** Grokbot scenes: 2009 three rivers (+ chip-evolution dive toward 2012) and 2022 cursor → text sea → dialog lights. */


const sstep = (x, a, b) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function textSprite(THREE, text, { size = 64, color = '#e8eefc', w = 512, h = 128, scale = 1 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.font = `600 ${size}px "Noto Sans SC","PingFang SC",sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = color; x.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  sp.scale.set(scale * w / h, scale, 1);
  return sp;
}

export function grokBuilders(builders, { THREE, INTERACT, MOBILE, REDUCED, STORY, camera, scene }) {
  /* ---------------- 2009 · 算力 / 数据 / 算法 ---------------- */
  builders[7] = () => {
    const g = new THREE.Group();
    if (!MOBILE) g.position.x = -1.4; // keep clear of the right-side card
    const END = new THREE.Vector3(0, 0, 0);
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const tmpC = new THREE.Color(), dummy = new THREE.Object3D();
    // instanced rim shader: dark body, soft fresnel rim, per-instance glow (instanceColor)
    const rimInst = (body, rim) => new THREE.ShaderMaterial({
      uniforms: { uBody: { value: new THREE.Color(body) }, uRim: { value: new THREE.Color(rim) }, uOp: { value: 1 } },
      transparent: true, depthWrite: true,
      vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vG;
        void main(){ mat4 im = instanceMatrix; vec4 mv = modelViewMatrix * im * vec4(position,1.);
          vN = normalize(normalMatrix * mat3(im) * normal); vV = normalize(-mv.xyz);
          #ifdef USE_INSTANCING_COLOR
            vG = instanceColor;
          #else
            vG = vec3(0.);
          #endif
          gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform vec3 uBody, uRim; uniform float uOp; varying vec3 vN; varying vec3 vV; varying vec3 vG;
        void main(){ float f = 1. - abs(dot(normalize(vN), vV)); float rim = pow(f, 2.2);
          float face = .55 + .45 * abs(dot(normalize(vN), normalize(vec3(.4,.8,.5))));
          vec3 c = uBody * face + uRim * rim * .75 + vG;
          gl_FragColor = vec4(min(c, vec3(.82)), uOp); }`,
    });

    /* DATA — cyan cubes raining down their river, denser downstream */
    const nD = MOBILE ? 64 : 144;
    const dataCv = new THREE.CatmullRomCurve3([V(-7.5, 5.5, -3), V(-6, 3.4, -2), V(-3.6, 1.6, -0.8), V(-1.6, 0.4, 0), END.clone()]);
    const cubes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), rimInst(0x0d3340, 0x8ec9dc), nD);
    cubes.frustumCulled = false; g.add(cubes);
    const dS = Array.from({ length: nD }, () => ({ t: Math.random(), sp: 0.05 + Math.random() * 0.02, j: V((Math.random() - .5) * 1.4, (Math.random() - .5) * 0.6, (Math.random() - .5) * 1.0), r: Math.random() * 6 }));
    const gridN = Math.ceil(Math.sqrt(nD));
    const dT = dS.map((_, i) => { const zz = (Math.floor(i / gridN) - (gridN - 1) / 2) * 0.24; return V(-1.7 - zz * 0.6, ((i % gridN) - (gridN - 1) / 2) * 0.24, zz * 0.8); }); // input grid (layer 0)

    /* COMPUTE — orange hex prisms in a honeycomb lane, synchronized heartbeat */
    const hcols = MOBILE ? 9 : 14, hrows = 3, nH = hcols * hrows;
    const hexes = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 6), rimInst(0x3a1c08, 0xd5b386), nH);
    hexes.frustumCulled = false; g.add(hexes);
    const hL = [], hT = [];
    const hw = 0.36, hd = 0.31;
    for (let c = 0; c < hcols; c++) for (let r = 0; r < hrows; r++) {
      hL.push(V(0.9 + c * hw * 0.9, -2.1 - c * 0.12 + (c % 2) * 0.0, (r - 1) * hd * 1.15 + (c % 2) * hd * 0.57)); // lane runs back from the merge point
    }
    // base patch under the network: same lattice, compact, centered
    const patch = [];
    for (let a = -5; a <= 5; a++) for (let b = -5; b <= 5; b++) patch.push(V(a * hw + (b % 2 ? hw / 2 : 0), -1.75, b * hd));
    patch.sort((p, q) => p.length() - q.length());
    for (let i = 0; i < nH; i++) hT.push(patch[i].clone().add(V(0.4, 0, 0)));

    /* ALGORITHM — white-blue octahedra, thin links, relay lighting */
    const nO = MOBILE ? 9 : 12;
    const algoCv = new THREE.CatmullRomCurve3([V(4.6, 3.4, -2.6), V(3.6, 2.3, -1.6), V(2.4, 1.2, -0.6), V(1.2, 0.4, 0)]);
    const octs = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.17), rimInst(0x1a2236, 0xcfdcff), nO);
    octs.frustumCulled = false; g.add(octs);
    const oL = Array.from({ length: nO }, (_, i) => algoCv.getPoint(i / (nO - 1)));
    const layers = MOBILE ? [4, 3, 2] : [5, 4, 3];
    const oT = []; layers.forEach((n, li) => { for (let j = 0; j < n; j++) oT.push(V(-0.2 + li * 0.95, (j - (n - 1) / 2) * 0.55, 0)); });
    const chainPairs = []; for (let i = 0; i < nO - 1; i++) chainPairs.push([i, i + 1]);
    const layerPairs = []; let off = 0;
    layers.forEach((n, li) => { if (li < layers.length - 1) { const m = layers[li + 1]; for (let a = 0; a < n; a++) for (let b = 0; b < m; b++) layerPairs.push([off + a, off + n + b]); } off += n; });
    const mkLines = (pairs, col) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(pairs.length * 6), 3));
      const ls = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0 })); ls.frustumCulled = false; g.add(ls); return ls; };
    const chainL = mkLines(chainPairs, 0x8ea6d8), layerL = mkLines(layerPairs, 0x8ea6d8);

    // restrained flash: a small soft sprite at the merge point
    const fc = document.createElement('canvas'); fc.width = fc.height = 64;
    const fx = fc.getContext('2d'); const gr = fx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(230,240,255,1)'); gr.addColorStop(1, 'rgba(230,240,255,0)'); fx.fillStyle = gr; fx.fillRect(0, 0, 64, 64);
    const flashSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(fc), transparent: true, depthWrite: false, opacity: 0 }));
    flashSp.position.set(0.3, 0, 0); g.add(flashSp);

    const pTmp=new THREE.Vector3();
    g.userData.update = (t, l) => {
      const u = STORY.seg - 8, flow = REDUCED ? 0 : t;
      const merge = REDUCED ? 0 : sstep(u, -0.12, 0.16);
      const dive = REDUCED ? 0 : sstep(u, 0.22, 0.48);
      const vis = l * (1 - dive);
      const ease = merge * merge * (3 - 2 * merge);
      // data rain
      dS.forEach((s, i) => {
        const tt = (s.t + flow * s.sp) % 1, d = Math.pow(tt, 0.6);
        const p = dataCv.getPoint(d).addScaledVector(s.j, 1 - d);
        pTmp.copy(p).lerp(dT[i], ease);
        dummy.position.copy(pTmp);
        dummy.rotation.set(s.r + flow * 0.4 * (1 - ease), s.r * 0.7 + flow * 0.3 * (1 - ease), 0);
        dummy.scale.setScalar(vis * (0.7 + 0.5 * d * (1 - ease) + 0.3 * ease)); dummy.updateMatrix(); cubes.setMatrixAt(i, dummy.matrix);
        tmpC.setRGB(0.02, 0.09 * d, 0.11 * d); cubes.setColorAt(i, tmpC);
      });
      cubes.instanceMatrix.needsUpdate = true; cubes.instanceColor.needsUpdate = true;
      // honeycomb heartbeat (all in sync)
      const ph = (flow * 1.15) % 1, beat = Math.exp(-ph * 9) + 0.5 * Math.exp(-Math.max(0, ph - 0.18) * 11) * (ph > 0.18 ? 1 : 0);
      hL.forEach((p, i) => {
        dummy.position.copy(p).lerp(hT[i], ease); dummy.rotation.set(0, 0, 0);
        dummy.scale.set(vis * (1 + beat * 0.12), vis * (1 + beat * 0.35), vis * (1 + beat * 0.12)); dummy.updateMatrix(); hexes.setMatrixAt(i, dummy.matrix);
        tmpC.setRGB(0.22 * beat, 0.09 * beat, 0.01); hexes.setColorAt(i, tmpC);
      });
      hexes.instanceMatrix.needsUpdate = true; hexes.instanceColor.needsUpdate = true;
      // octahedra relay
      const relay = (flow * 3.2) % (nO + 3);
      const oP = oL.map((p, i) => p.clone().lerp(oT[i], ease));
      oP.forEach((p, i) => {
        const key = ease > 0.5 ? (layers[0] > i ? 0 : layers[0] + layers[1] > i ? 1 : 2) * 3 : i; // after merge, relay layer-by-layer
        const on = Math.max(0, 1 - Math.abs(key - (ease > 0.5 ? (flow * 2.4) % 9 : relay)) * 0.8);
        dummy.position.copy(p); dummy.rotation.set(0, flow * 0.5, 0); dummy.scale.setScalar(vis * (1 + on * 0.25)); dummy.updateMatrix(); octs.setMatrixAt(i, dummy.matrix);
        tmpC.setRGB(0.25 * on, 0.3 * on, 0.4 * on); octs.setColorAt(i, tmpC);
      });
      octs.instanceMatrix.needsUpdate = true; octs.instanceColor.needsUpdate = true;
      const fill = (ls, pairs) => { const a = ls.geometry.attributes.position; pairs.forEach(([x, y], k) => { a.setXYZ(k * 2, oP[x].x, oP[x].y, oP[x].z); a.setXYZ(k * 2 + 1, oP[y].x, oP[y].y, oP[y].z); }); a.needsUpdate = true; };
      fill(chainL, chainPairs); fill(layerL, layerPairs);
      chainL.material.opacity = 0.45 * vis * (1 - ease); layerL.material.opacity = 0.3 * vis * ease;
      [cubes, hexes, octs].forEach((m) => { m.material.uniforms.uOp.value = 1; m.visible = vis > 0.002; });
      const flash = Math.exp(-Math.pow((u - 0.15) / 0.035, 2));
      flashSp.material.opacity = flash * 0.22 * l; flashSp.scale.setScalar(0.5 + flash * 1.1);


    };
    return g;
  };
  /* ---------------- 2022 · 一个光标 → 文字之海 → 两个月，一亿人 ---------------- */
  builders[10] = () => {
    const g=new THREE.Group(),cv=document.createElement('canvas');cv.width=2048;cv.height=1440;const ctx=cv.getContext('2d');ctx.scale(2,2);
    const texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
    const mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false});const chat=new THREE.Mesh(new THREE.PlaneGeometry(MOBILE?9.5:8,MOBILE?6.68:5.625),mat);g.add(chat);
    const prompt='你好，你能和我聊聊吗？',answer='当然。你可以提出问题、分享想法，或和我一起探索一个新的方向。';let start=null,lastKey='',lastReplay=-1;
    const box=(x,y,w,h,fill,edge)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,12);ctx.fillStyle=fill;ctx.fill();if(edge){ctx.strokeStyle=edge;ctx.lineWidth=2;ctx.stroke();}};
    const paint=(p,a,blink)=>{
      ctx.clearRect(0,0,1024,720);box(2,2,1020,716,'#0b1425','#506782');
      ctx.fillStyle='#96aac6';ctx.font='24px monospace';ctx.fillText('2022 / A CONVERSATION BEGINS',40,58);ctx.fillStyle='#dce6f4';ctx.font='38px "PingFang SC",sans-serif';ctx.fillText('对话，从一句你好开始',40,119);
      ctx.strokeStyle='#2c3d54';ctx.beginPath();ctx.moveTo(38,151);ctx.lineTo(986,151);ctx.stroke();
      ctx.font='23px "PingFang SC",sans-serif';ctx.fillStyle='#8dabc8';ctx.fillText('你',938,192);
      box(270,211,710,91,'#1d3049','#415d7c');ctx.fillStyle='#dce6f4';ctx.font='38px "PingFang SC",sans-serif';ctx.fillText(prompt.slice(0,p),295,269);
      if(p<prompt.length&&blink){const x=295+ctx.measureText(prompt.slice(0,p)).width;ctx.fillStyle='#8ec9dc';ctx.fillRect(x+5,235,3,40);}
      ctx.font='23px "PingFang SC",sans-serif';ctx.fillStyle='#8dabc8';ctx.fillText('AI',42,347);
      box(42,370,852,162,'#111f32','#304960');ctx.fillStyle='#c9d8e8';ctx.font='36px "PingFang SC",sans-serif';
      const response=answer.slice(0,a);let row='',y=417;for(const char of response){if(ctx.measureText(row+char).width>788){ctx.fillText(row,68,y);row='';y+=50;}row+=char;}ctx.fillText(row,68,y);
      if(a===0&&p===prompt.length){ctx.fillStyle='#7298bb';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(83+i*22,415,5,0,Math.PI*2);ctx.fill();}}
      box(40,588,944,90,'#0b1423','#33475f');ctx.font='27px "PingFang SC",sans-serif';ctx.fillStyle='#70859f';ctx.fillText('输入一个问题，让对话继续…',65,643);ctx.fillStyle='#8ec9dc';ctx.font='35px sans-serif';ctx.fillText('↑',929,645);texture.needsUpdate=true;
    };
    g.userData.update=(t,l)=>{
      const active=STORY.seg>10.55&&STORY.seg<11.5;if(active&&start===null)start=t;if(!active)start=null;
      if(lastReplay!==(INTERACT.chatReplay||0)){lastReplay=INTERACT.chatReplay||0;start=t;}
      const age=REDUCED?20:Math.max(start===null?0:t-start,(INTERACT.cursorHold||0)*7),p=Math.min(prompt.length,Math.max(0,Math.floor((age-.6)/.15))),a=Math.min(answer.length,Math.max(0,Math.floor((age-3.1)/.10))),blink=REDUCED||Math.sin(t*5)>0;
      INTERACT.chatComplete=a===answer.length;const key=p+':'+a+':'+blink;if(key!==lastKey){lastKey=key;paint(p,a,blink);}
      mat.opacity=Math.min(1,l*2);chat.position.y=0;chat.rotation.y=-.05;
    };return g;
  };
  return builders;
}
