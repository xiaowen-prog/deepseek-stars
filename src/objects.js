import {VISUAL} from './visual-palette.js';
/** Rich milestone object builders — each metaphor is felt through motion. */
export function createBuilders({ THREE, rimMat, lineMat, pillar, V3, MOBILE, INTERACT, uniforms, FOG, makeWhale }) {
  const addGlowPts = (g, n, spread, col, size = 0.08) => {
    const pos = [], c = [];
    const color = new THREE.Color(col);
    const c2 = color.clone().lerp(new THREE.Color(0xffffff), 0.35);
    for (let i = 0; i < n; i++) {
      const t = Math.random();
      pos.push((Math.random() - 0.5) * spread[0], (Math.random() - 0.5) * spread[1], (Math.random() - 0.5) * spread[2]);
      const cc = t > 0.82 ? c2 : color;
      c.push(cc.r, cc.g, cc.b);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      size: size * 1.15, vertexColors: true, transparent: true, opacity: 0.92,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
    g.add(pts); return pts;
  };

  // A single front outline avoids competing front/back edges on dark hardware.
  const instrumentFrame=(width,height,z,col,thickness=.023,opacity=.55)=>{
    const group=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity,depthWrite:false});
    for(const y of [-height/2,height/2]){const stroke=new THREE.Mesh(new THREE.PlaneGeometry(width,thickness),mat);stroke.position.set(0,y,z);group.add(stroke);}
    for(const x of [-width/2,width/2]){const stroke=new THREE.Mesh(new THREE.PlaneGeometry(thickness,height),mat);stroke.position.set(x,0,z);group.add(stroke);}
    return group;
  };

  return [
    // 01 Turing — imitation game: two chambers; question-packets fly; which replies?
    (c) => {
      const g = new THREE.Group();
      const chambers = [];
      [[-2.4, 0xffc27a, false], [2.4, 0x9fb7ff, true]].forEach(([x, col, isMachine], i) => {
        const frame = new THREE.Group();
        const box = new THREE.BoxGeometry(2.6, 4.6, 0.08);
        frame.add(new THREE.Mesh(box, rimMat(col, 1.3, 0.04, 0.25)));
        frame.add(new THREE.LineSegments(new THREE.EdgesGeometry(box), lineMat(col, 0.95)));
        // inner veil
        frame.add(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.0), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending })));
        const figure = isMachine
          ? new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), rimMat(col, 1.1, 0.7))
          : new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.9, 6, 12), rimMat(col, 1.1, 0.7));
        figure.position.set(0, isMachine ? 0.2 : -0.3, 0.5);
        frame.add(figure);
        frame.position.x = x; frame.rotation.y = isMachine ? -0.28 : 0.28;
        g.add(frame); chambers.push({ frame, figure, isMachine, col });
      });
      // question packets traveling the seam
      const packets = [];
      addGlowPts(g, MOBILE?100:260, [7, 6, 4], 0xffffff, 0.045);
      for (let i = 0; i < 16; i++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        g.add(p); packets.push(p);
      }
      const seam = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 7.5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending }));
      g.add(seam);
      // judge spotlight in front
      const eye = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.48, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      eye.position.set(0, 1.6, 2.4); g.add(eye);
      g.userData.update = (t, l) => {
        chambers.forEach((ch, i) => {
          ch.figure.material.uniforms.uGain.value = 0.6 + 0.8 * (0.5 + 0.5 * Math.sin(t * 2 + i));
          if (ch.isMachine) ch.figure.rotation.set(t * 0.5, t * 0.7, 0);
          else ch.figure.position.y = -0.3 + Math.sin(t * 1.4) * 0.12;
        });
        packets.forEach((p, i) => {
          const u = ((t * 0.35 + i / 10) % 1);
          const side = Math.floor(u * 2); // 0 left reply, 1 right
          const x = side === 0 ? -1.2 : 1.2;
          p.position.set(x * Math.sin(u * Math.PI), 1.2 - u * 2.5, 0.8);
          p.scale.setScalar(0.5 + l);
          p.material.opacity = l;
        });
        seam.material.opacity = 0.25 + l * 0.65;
        eye.material.opacity = 0.3 + 0.5 * Math.abs(Math.sin(t * 3));
      };
      return g;
    },

    // 02 Dartmouth — name rises from table, splits into Symbol river vs Connection cloud
    (c) => {
      const g = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.05, 10, 128), rimMat(c, 1, 1.3));
      ring.rotation.x = Math.PI / 2; g.add(ring);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.15, 10), rimMat(c, 1.4, 0.45));
        seat.position.set(Math.cos(a) * 3.6, -0.15, Math.sin(a) * 3.6); g.add(seat);
        const halo = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), rimMat(0xffffff, 1, 1));
        halo.position.set(Math.cos(a) * 3.6, 0.55, Math.sin(a) * 3.6); g.add(halo);
      }
      const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 3), rimMat(0xffffff, 0.7, 1.8)); g.add(orb);
      // symbol stack
      const left = new THREE.Group();
      for (let i = 0; i < 14; i++) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.55), rimMat(0xffc27a, 1.4, 0.55));
        b.position.set((i % 2) * 0.2 - 0.1, i * 0.22 - 1.2, (Math.floor(i / 2) % 2) * 0.15); left.add(b);
      }
      // neural cloud
      const right = new THREE.Group();
      const cloud = addGlowPts(right, MOBILE?280:520, [2.6, 2.6, 2.6], 0x9fb7ff, 0.085);
      addGlowPts(g, MOBILE?120:280, [8, 5, 8], c, 0.05);
      const pL = pillar(0xffc27a, 48, 0.18, 0.9); pL.position.set(-2.8, -1.2, 0);
      const pR = pillar(0x9fb7ff, 48, 0.18, 0.9); pR.position.set(2.8, -1.2, 0);
      left.position.set(-2.8, 1.4, 0); right.position.set(2.8, 1.4, 0);
      g.add(left, right, pL, pR);
      // bifurcation beams
      const beams = new THREE.Group(); g.add(beams);
      g.rotation.x = 0.28;
      g.userData.update = (t, l) => {
        orb.position.y = -0.15 + l * 1.5; orb.scale.setScalar(0.45 + l);
        const split = THREE.MathUtils.smoothstep(l, 0.3, 0.95);
        left.position.x = -0.3 - split * 2.5; right.position.x = 0.3 + split * 2.5;
        pL.material.uniforms.uI.value = split * 1.2; pR.material.uniforms.uI.value = split * 1.2;
        left.visible = right.visible = split > 0.05;
        cloud.rotation.y = t * 0.3; g.rotation.y = t * 0.05;
        left.children.forEach((b, i) => { b.material.uniforms.uGain.value = 0.5 + split * (0.5 + 0.5 * Math.sin(t * 2 + i)); });
      };
      return g;
    },

    // 03 Perceptron — rough Mark I device: chassis + lamp grid + knobs; PARTIAL pattern lamps (never all-on/all-off)
    (c) => {
      const g = new THREE.Group();
      // chassis body (rough industrial box)
      const body = new THREE.Mesh(new THREE.BoxGeometry(5.4, 3.6, 1.8), rimMat(0x3a4658, 2.4, 0.12, 0.92));
      g.add(body);
      g.add(instrumentFrame(5.4,3.6,.925,0x91a6c5,.025,.6));
      // front bezel / panel recess
      const panel = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.8, 0.12), rimMat(0x1c2433, 2.8, 0.08, 0.95));
      panel.position.z = 0.95; g.add(panel);
      g.add(instrumentFrame(4.6,2.8,1.025,0x8b9fbc,.022,.48));
      // Quiet instrument details: same blue-grey rim material, no new palette.
      const fastenerGeo = new THREE.CylinderGeometry(.055,.055,.035,12);
      for(const x of [-2.13,2.13])for(const y of [-1.18,1.18]){
        const screw=new THREE.Mesh(fastenerGeo,rimMat(0x8193b2,2,.35));
        screw.rotation.x=Math.PI/2;screw.position.set(x,y,1.04);g.add(screw);
        const slot=new THREE.Mesh(new THREE.BoxGeometry(.06,.013,.008),new THREE.MeshBasicMaterial({color:0x182338}));slot.position.set(x,y,1.065);slot.rotation.z=x*y*.4;g.add(slot);
      }
      // Narrow panel seams and low feet make the chassis read as assembled hardware.
      const seams=[];
      for(const y of [-1.22,1.3])seams.push(V3(-2.05,y,1.04),V3(2.05,y,1.04));
      g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(seams),lineMat(0x8193b2,.4)));
      for(const x of [-2.1,2.1]){const foot=new THREE.Mesh(new THREE.BoxGeometry(.6,.18,1.15),rimMat(0x28364c,2,.18));foot.position.set(x,-1.88,0);g.add(foot);}
      // side vents (readable machine detail)
      for (let i = 0; i < 5; i++) {
        const vent = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.2, 0.35), rimMat(0x2a3548, 2, 0.2));
        vent.position.set(-2.75, 0, -0.2 + i * 0.28); g.add(vent);
        const ventR = vent.clone(); ventR.position.x = 2.75; g.add(ventR);
      }
      // output lamp grid 6×5 — target pattern ≈ cross (~36% of lamps)
      const COLS = 6, ROWS = 5;
      const lamps = [];
      const lampPitchX = 0.58, lampPitchY = 0.48;
      const ox = -((COLS - 1) * lampPitchX) / 2, oy = -((ROWS - 1) * lampPitchY) / 2 + 0.15;
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const isTarget = (col === 2 || col === 3 || row === 2); // thick cross
          const bulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.14, 12, 10),
            rimMat(isTarget ? c : 0x6a7388, 1.2, 0.15)
          );
          const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.08, 10), rimMat(0x2a3344, 2, 0.25));
          socket.rotation.x = Math.PI / 2;
          const lx = ox + col * lampPitchX, ly = oy + (ROWS - 1 - row) * lampPitchY;
          bulb.position.set(lx, ly, 1.12);
          socket.position.set(lx, ly, 1.02);
          g.add(socket, bulb);
          // deterministic neighbor for fail misfires
          const nCol = (col + 1) % COLS, nRow = row;
          lamps.push({ bulb, col, row, isTarget, nCol, nRow, idx: lamps.length });
        }
      }
      // optional knobs (weight dials) — 3 along bottom rail
      const knobs = [];
      for (let i = 0; i < 3; i++) {
        const kg = new THREE.Group();
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.22, 14), rimMat(0x4a5568, 2, 0.35));
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.1, 16), rimMat(0xc9d6ff, 1.6, 0.4));
        const mark = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.06), rimMat(0xffffff, 1, 0.9));
        cap.position.y = 0.14; mark.position.set(0, 0.2, 0.2);
        kg.add(stem, cap, mark);
        kg.position.set(-1.2 + i * 1.2, -1.45, 1.05);
        kg.rotation.x = Math.PI / 2;
        // Fixed calibration ticks surround the turning dial, never move with it.
        const ticks=[];
        for(let j=0;j<11;j++){const a=-Math.PI*.75+j*Math.PI*1.5/10;const r=.34;const r2=j%5===0?.42:.39;ticks.push(V3(kg.position.x+Math.sin(a)*r,kg.position.y+Math.cos(a)*r,1.075),V3(kg.position.x+Math.sin(a)*r2,kg.position.y+Math.cos(a)*r2,1.075));}
        g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ticks),lineMat(0x9aafcc,.6)));
        g.add(kg);
        knobs.push({ g: kg, cap, mark, home: kg.rotation.z });
      }
      // label plate strip
      const strip = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.22, 0.06), rimMat(0x5fe0ff, 2, 0.2, 0.55));
      strip.position.set(0, 1.45, 1.08); g.add(strip);
      const nameCanvas=document.createElement('canvas');nameCanvas.width=512;nameCanvas.height=64;
      const nameCtx=nameCanvas.getContext('2d');nameCtx.font='24px monospace';nameCtx.textAlign='center';nameCtx.fillStyle='#9fb4d0';nameCtx.fillText('PERCEPTRON / WEIGHT CONTROL',256,42);
      const namePlate=new THREE.Mesh(new THREE.PlaneGeometry(2.8,.18),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(nameCanvas),transparent:true,depthWrite:false}));namePlate.position.set(0,1.45,1.13);g.add(namePlate);
      // frost particles for failure (knob / panel edge — not full blackout)
      const frost = addGlowPts(g, MOBILE ? 160 : 320, [5.2, 3.4, 1.2], 0xc9d6ff, 0.04);
      frost.position.z = 1.0; frost.material.opacity = 0;
      addGlowPts(g, MOBILE ? 40 : 90, [4, 2.5, 1], c, 0.035);
      g.rotation.y = -0.18; g.rotation.x = 0.08;
      g.userData.update = (t, l) => {
        // Independent sample-and-hold lamp states, not a synchronized pattern.
        const noise=(i,step)=>{const x=Math.sin(i*127.1+step*311.7)*43758.5453;return x-Math.floor(x);};
        lamps.forEach((lp,i)=>{
          const clock=t*(.65+(i%7)*.11)+i*.71,step=Math.floor(clock),fade=THREE.MathUtils.smoothstep(clock-step,0,.16);
          const a=noise(i,step-1)>.7?1:0,b=noise(i,step)>.7?1:0,on=a+(b-a)*fade;
          lp.bulb.material.uniforms.uGain.value=.035+on*1.15;
          lp.bulb.scale.setScalar(.86+on*.13);
        });
        knobs.forEach((k,i)=>{
          // Rotation around the knob's own spindle; its position is fixed.
          k.g.rotation.y=t*(.26+i*.09)*(i===1?-1:1);
          const lit=noise(i+40,Math.floor(t*.75+i*.8))>.57;
          k.cap.material.uniforms.uGain.value=lit?.7:.13;
          k.mark.material.uniforms.uGain.value=lit?1.1:.3;
        });
        frost.material.opacity=0;
        strip.material.uniforms.uGain.value=.3;

      };
      return g;
    },

    // 04 Winter I — ice lattice cracks, shards fall, residual neuron blinks out
    (c) => {
      const g = new THREE.Group();
      const S = 6.4, n = MOBILE ? 18 : 26;
      const gridPts = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) gridPts.push(0, (j / (n - 1) - 0.5) * S, (i / (n - 1) - 0.5) * S);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(gridPts, 3));
      const grid = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xc9d6ff, size: 0.12, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      g.add(grid);
      // ice plane
      const ice = new THREE.Mesh(new THREE.BoxGeometry(0.18, S + 1, S + 1), rimMat(0xa8bddc, 1.3, 0.12, 0.35));
      g.add(ice);
      // shards
      const shards = [];
      for (let i = 0; i < (MOBILE?28:48); i++) {
        const sh = new THREE.Mesh(new THREE.TetrahedronGeometry(0.25 + Math.random() * 0.25, 0), rimMat(0xdfe8ff, 1.5, 0.4, 0.7));
        sh.position.set(0.2, (Math.random() - 0.5) * S * 0.8, (Math.random() - 0.5) * S * 0.8);
        sh.userData.vel = V3((Math.random() - 0.5) * 3, -1 - Math.random() * 4, (Math.random() - 0.5) * 3);
        sh.userData.spin = V3(Math.random(), Math.random(), Math.random());
        g.add(sh); shards.push(sh);
      }
      // cracks
      const cracks = [];
      for (let k = 0; k < 5; k++) {
        let p = V3(0, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
        for (let s = 0; s < 8; s++) {
          const q = p.clone().add(V3(0, (Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 1.4));
          cracks.push(p, q); p = q;
        }
      }
      g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(cracks), lineMat(0xffffff, 0.55)));
      const lastNeuron = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), rimMat(0x5fe0ff, 1, 1.5));
      lastNeuron.position.set(0.4, 0.3, 0); g.add(lastNeuron);
      g.userData.update = (t, l) => {
        const crack = THREE.MathUtils.smoothstep(l, 0.2, 0.85);
        grid.material.opacity = 0.9 - crack * 0.55;
        ice.material.uniforms.uGain.value = 0.8 - crack * 0.5;
        shards.forEach((sh, i) => {
          const f = Math.max(0, crack - i * 0.01);
          sh.position.addScaledVector(sh.userData.vel, f * 0.02);
          sh.rotation.x += sh.userData.spin.x * f * 0.05;
          sh.material.uniforms.uGain.value = 0.9 * (1 - f * 0.7);
        });
        lastNeuron.material.uniforms.uGain.value = (1 - crack) * (0.4 + 0.6 * Math.abs(Math.sin(t * 4)));
        lastNeuron.scale.setScalar(1 - crack * 0.6);
      };
      return g;
    },

    // 06 Backprop — error pulses reverse through layers; cheque digit ignites
    (c) => {
      const g = new THREE.Group();
      const layers = [7, 9, 7, 5, 3];
      const nodes = [];
      layers.forEach((n, li) => {
        for (let i = 0; i < n; i++) {
          const nd = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), rimMat(VISUAL.violet, 1.2, 0.8));
          nd.position.set(li * 1.65 - 3.0, (i - (n - 1) / 2) * 0.52, 0);
          g.add(nd); nodes.push(nd);
        }
      });
      const segs = [];
      for (let li = 0; li < layers.length - 1; li++) {
        for (let a = 0; a < layers[li]; a += 1) for (let b = 0; b < layers[li + 1]; b += 1) {
          if ((a * 3 + b) % 4 !== 0) continue;
          segs.push(
            V3(li * 1.65 - 3.0, (a - (layers[li] - 1) / 2) * 0.52, 0),
            V3((li + 1) * 1.65 - 3.0, (b - (layers[li + 1] - 1) / 2) * 0.52, 0),
          );
        }
      }
      g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segs), lineMat(VISUAL.violet, 0.2)));
      const pulses = [];
      for (let i = 0; i < 28; i++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), new THREE.MeshBasicMaterial({ color: VISUAL.ink }));
        g.add(p); pulses.push(p);
      }
      // cheque
      const cheque = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2), rimMat(0xe8f0ff, 2, 0.15, 0.5));
      cheque.position.set(4.4, 0, 0); g.add(cheque);
      const digit = new THREE.Group();
      // seven-ish strokes for "5"
      [[0, 0.35, 0.7, 0.08], [-0.35, 0.1, 0.08, 0.4], [0, 0, 0.7, 0.08], [0.35, -0.2, 0.08, 0.4], [0, -0.4, 0.7, 0.08]].forEach(([x, y, w, h]) => {
        const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), rimMat(VISUAL.violet, 1, 1.5));
        s.position.set(x, y, 0.02); digit.add(s);
      });
      digit.position.copy(cheque.position); g.add(digit);
      g.userData.update = (t, l) => {
        pulses.forEach((p, i) => {
          const u = 1 - ((t * 0.4 + i / 28) % 1); // reverse
          const li = u * (layers.length - 1);
          p.position.set(li * 1.65 - 3.0, Math.sin(i * 1.7 + t) * 1.4 * Math.sin(u * Math.PI), 0);
          p.visible = l > 0.1;
          p.scale.setScalar(0.7 + l * 0.8);
        });
        nodes.forEach((nd, i) => {
          nd.material.uniforms.uGain.value = 0.3 + l * (0.5 + 0.5 * Math.sin(t * 3 - i * 0.2));
        });
        const lit = THREE.MathUtils.smoothstep(l, 0.4, 0.9);
        digit.children.forEach((s, i) => { s.material.uniforms.uGain.value = lit * (1 + 0.5 * Math.sin(t * 5 + i)); });
        cheque.material.uniforms.uGain.value = 0.3 + lit;
      };
      return g;
    },

    // 05 Winter II — rule-box tower (readable stack); at the peak the top third topples (bubble bursts)
    (c) => {
      const g = new THREE.Group();
      const n = 18, H = 0.34, blocks = [];
      for (let i = 0; i < n; i++) {
        const blk = new THREE.Group();
        const geo = new THREE.BoxGeometry(1.9 - (i % 3) * 0.12, 0.28, 1.2);
        blk.add(new THREE.Mesh(geo, rimMat(0x8a5a1c, 2.2, 0.55)));
        blk.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xffc46a })));
        // label strip on the spine (IF / THEN rule card)
        const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.1), new THREE.MeshBasicMaterial({ color: 0xffe2a8 }));
        tag.position.set(0, 0, 0.605); blk.add(tag);
        blk.userData.home = new THREE.Vector3(Math.sin(i * 1.7) * 0.06, i * H - 3.0, 0);
        blk.userData.yaw = Math.sin(i * 2.3) * 0.12;
        blk.userData.top = i >= n - 6;
        blk.userData.dir = (i % 2 ? 1 : -1);
        g.add(blk); blocks.push(blk);
      }
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 1.8), rimMat(0x4b5563, 2, 0.5));
      base.position.y = -3.25; g.add(base);
      const dust = addGlowPts(g, MOBILE ? 120 : 260, [5, 3, 3], 0xb9a07a, 0.05); dust.position.y = 2.2; dust.material.opacity = 0;
      g.userData.update = (t, l) => {
        const build = THREE.MathUtils.smoothstep(l, 0.05, 0.6);
        const topple = THREE.MathUtils.smoothstep(l, 0.72, 1.0);
        blocks.forEach((blk, i) => {
          const appear = THREE.MathUtils.clamp(build * n - i, 0, 1);
          const h = blk.userData.home;
          blk.visible = appear > 0.01;
          blk.position.set(h.x, h.y + (1 - appear) * 1.2, h.z);
          blk.rotation.set(0, blk.userData.yaw, 0);
          if (blk.userData.top && topple > 0) {
            const k = topple * (0.6 + (i - (n - 6)) * 0.12);
            blk.position.x += blk.userData.dir * k * (1.2 + (i - (n - 6)) * 0.35);
            blk.position.y -= k * k * 1.4;
            blk.rotation.z = -blk.userData.dir * k * 0.9;
          }
        });
        dust.material.opacity = topple * 0.6;
      };
      return g;
    },

    // 07 Deep Blue — chessboard, black king falls with afterimage trail
    (c) => {
      const g = new THREE.Group();
      // board
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
        if ((i + j) % 2) continue;
        const sq = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), rimMat(0x3a4a7a, 2.5, 0.15, 0.5));
        sq.rotation.x = -Math.PI / 2; sq.position.set((i - 3.5), -1.85, (j - 3.5)); g.add(sq);
      }
      const boardEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(8.2, 0.08, 8.2)), lineMat(0x7fa2ff, 0.5));
      boardEdge.position.y = -1.85; g.add(boardEdge);
      const pts = [[0, 0], [1.0, 0], [1.0, 0.18], [0.82, 0.3], [0.55, 0.5], [0.42, 1.6], [0.62, 1.8], [0.62, 1.95], [0.4, 2.05], [0.55, 2.6], [0.62, 2.85], [0.2, 2.95], [0.12, 3.0], [0.12, 3.25], [0.35, 3.25], [0.35, 3.4], [0.12, 3.4], [0.12, 3.65], [0, 3.65]].map(([x, y]) => new THREE.Vector2(x, y));
      const geo = new THREE.LatheGeometry(pts, 64); geo.translate(0, -1.8, 0);
      const king = new THREE.Mesh(geo, rimMat(c, 1.6, 0.12));
      king.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 22), lineMat(c, 0.4)));
      king.scale.setScalar(1.35);
      const pivot = new THREE.Group(); pivot.position.set(0.95, -1.85, 0); king.position.set(-0.95, 1.85, 0); pivot.add(king); g.add(pivot);
      // afterimage trail dots
      const ghosts = [];
      for (let i = 0; i < 14; i++) {
        const gh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending }));
        g.add(gh); ghosts.push(gh);
      }
      const impact = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.0, 64), new THREE.MeshBasicMaterial({ color: 0x7fa2ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      impact.rotation.x = -Math.PI / 2; impact.position.y = -1.82; g.add(impact);
      g.userData.update = (t, l) => {
        const drop = 1 - THREE.MathUtils.smoothstep(l, 0.02, 0.5);
        pivot.position.y = -1.85 + drop * 11;
        pivot.rotation.x = drop * 0.5;
        const tip = THREE.MathUtils.smoothstep(l, 0.45, 0.98);
        pivot.rotation.z = -tip * 1.45;
        ghosts.forEach((gh, i) => {
          const gd = Math.max(0, 1 - THREE.MathUtils.smoothstep(l, 0.02, 0.5 - i * 0.035));
          gh.position.set(pivot.position.x, -1.85 + gd * 11 - i * 0.35, 0);
          gh.material.opacity = drop > 0.05 ? 0.35 * (1 - i / 8) * gd : 0;
        });
        impact.material.opacity = tip * (1 - tip) * 2 * 0.8;
        impact.scale.setScalar(0.5 + tip * 4);
        g.rotation.y = -0.35 + t * 0.04;
      };
      return g;
    },

    // 08 CUDA + ImageNet — three rivers converge
    (c) => {
      const g = new THREE.Group();
      const mk = (col, n, off) => {
        const pos = [], cc = [];
        const color = new THREE.Color(col);
        for (let i = 0; i < n; i++) {
          pos.push((Math.random() - 0.5) * 1.8, (Math.random() - 0.5) * 1.8, -Math.random() * 16);
          cc.push(color.r, color.g, color.b);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3));
        const p = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.11, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
        p.position.copy(off); g.add(p); return p;
      };
      // GPU chips
      const chips = new THREE.Group();
      for (let i = 0; i < 12; i++) {
        const chip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), rimMat(0x76ff8a, 1.5, 0.5));
        chip.position.set((i % 4) * 0.65 - 1, Math.floor(i / 4) * 0.5 - 0.5, 0);
        chips.add(chip);
      }
      // image tiles
      const tiles = new THREE.Group();
      for (let i = 0; i < (MOBILE?40:72); i++) {
        const tile = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.35), rimMat(new THREE.Color().setHSL(Math.random(), 0.7, 0.6).getHex(), 1.5, 0.6));
        tile.position.set((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2);
        tiles.add(tile);
      }
      const sA = mk(VISUAL.violet, MOBILE?600:1400, V3(-5, 2.5, 5));
      const sC = mk(0x76ff8a, MOBILE?500:1200, V3(0, -3.5, 5));
      const sD = mk(0x5fe0ff, MOBILE?700:1600, V3(5, 1.5, 5));
      chips.position.copy(sC.position); tiles.position.copy(sD.position);
      g.add(chips, tiles);
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.65, 2), rimMat(0xffffff, 0.7, 1.8)); g.add(core);
      const beam = pillar(0xffffff, 30, 0.15, 0.6); beam.position.y = -1; g.add(beam);
      g.userData.update = (t, l) => {
        const pull = THREE.MathUtils.smoothstep(l, 0.15, 0.92);
        [sA, sC, sD].forEach((s, i) => {
          s.position.lerp(V3(0, 0, 0), pull * 0.9);
          s.rotation.y = t * (0.15 + i * 0.05);
        });
        chips.position.lerp(V3(0, -0.8, 0), pull);
        tiles.position.lerp(V3(0, 0.8, 0), pull);
        tiles.rotation.y = t * 0.2;
        tiles.children.forEach((tile, i) => { tile.position.multiplyScalar(1 - pull * 0.02); tile.material.uniforms.uGain.value = 0.5 + pull; });
        core.scale.setScalar(0.35 + pull * 1.6);
        core.material.uniforms.uGain.value = 0.4 + pull * 1.8;
        beam.material.uniforms.uI.value = pull * 1.4;
      };
      return g;
    },

    // 09 AlexNet — CNN layers explode with rising "accuracy" ring
    (c) => {
      const g = new THREE.Group();
      const layers = [];
      const sizes = MOBILE ? [28, 18, 12, 7, 3] : [36, 24, 16, 10, 5];
      sizes.forEach((n, li) => {
        const pos = [], col = []; const span = 5.4 - li * 0.95;
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          pos.push((i / (n - 1) - 0.5) * span, (j / (n - 1) - 0.5) * span, 0);
          const cc = new THREE.Color(VISUAL.blue).lerp(new THREE.Color(VISUAL.cyan),(i+j)/(n*2)).lerp(new THREE.Color(VISUAL.violet),li/8);
          col.push(cc.r, cc.g, cc.b);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        const p = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.09 + li * 0.035, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
        p.position.z = 3.0 - li * 1.4;
        const fr = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(span + 0.35, span + 0.35)), lineMat(c, 0.28));
        fr.position.z = p.position.z;
        g.add(p, fr); layers.push({ p, fr, z0: p.position.z, span });
      });
      // accuracy arc
      const acc = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.06, 8, 64, 0), rimMat(0x5fe0ff, 1, 1.5));
      acc.rotation.x = Math.PI / 2; acc.position.z = -2; g.add(acc);
      const label = addGlowPts(g, MOBILE?100:220, [1.4, 1.4, 0.4], 0xffffff, 0.065);
      addGlowPts(g, MOBILE?150:420, [7, 7, 5], c, 0.04);
      label.position.z = -2;
      g.rotation.y = 0.55;
      g.userData.update = (t, l) => {
        const burst = THREE.MathUtils.smoothstep(l, 0.2, 0.95);
        layers.forEach((ly, i) => {
          ly.p.position.z = ly.z0 * (0.45 + burst * 0.7);
          ly.fr.position.copy(ly.p.position);
          ly.p.material.opacity = Math.min(1, (0.35 + burst * 0.65) * 1.3) * (1 + 0.25 * Math.exp(-Math.pow((burst - 0.6) / 0.12, 2))); /* DC+: +30%, arrival pulse */
          ly.p.rotation.z = Math.sin(t * 0.3 + i) * 0.05 * burst;
          ly.fr.rotation.copy(ly.p.rotation);ly.fr.scale.copy(ly.p.scale);
        });
        // torus length via scale hack — expand accuracy
        acc.scale.setScalar((0.5 + burst * 1.1) * 1.2);
        acc.material.uniforms.uGain.value = 0.4 + burst * 1.5;
        g.rotation.y = 0.55 + Math.sin(t * 0.2) * 0.1;
      };
      return g;
    },

    // 10 Move 37 — go board, stone drops, shockwave (tap-boosted)
    (c) => {
      const g = new THREE.Group(); const S = 7.6, n = 19, pts = [];
      for (let i = 0; i < n; i++) {
        const v = (i / (n - 1) - 0.5) * S;
        pts.push(V3(v, 0, -S / 2), V3(v, 0, S / 2), V3(-S / 2, 0, v), V3(S / 2, 0, v));
      }
      g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x1a140c })));
      // star points
      [[3, 3], [3, 9], [3, 15], [9, 3], [9, 9], [9, 15], [15, 3], [15, 9], [15, 15]].forEach(([i, j]) => {
        const d = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), rimMat(0x8fa3c7, 2, 0.4));
        d.position.set((i - 9) * (S / 18), 0.02, (j - 9) * (S / 18)); g.add(d);
      });
      const cell = S / (n - 1);
      // board surface (dim wood) so a BLACK stone reads by contrast
      const board = new THREE.Mesh(new THREE.PlaneGeometry(S + 0.6, S + 0.6), new THREE.MeshBasicMaterial({ color: 0x5a4628 }));
      board.rotation.x = -Math.PI / 2; board.position.y = -0.03; g.add(board);
      // AlphaGo played BLACK in game 2 → hero stone is black with a thin light rim
      const stone = new THREE.Mesh(new THREE.SphereGeometry(cell * 0.48, 32, 16), new THREE.MeshBasicMaterial({ color: 0x0a0c10 }));
      stone.scale.y = 0.42; stone.position.set(5 * cell, 0, 0); g.add(stone);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(cell * 0.48, 0.022, 8, 48), new THREE.MeshBasicMaterial({ color: 0xcfd8ee }));
      rim.rotation.x = Math.PI / 2; stone.add(rim); rim.scale.set(1, 1, 1 / 0.42);
      stone.material.uniforms = { uGain: { value: 1 } };
      // Lee Sedol (white) stones for context
      const whites = [[-3, 4], [-2, -5], [4, -3]].map(([a, b]) => {
        const w = new THREE.Mesh(new THREE.SphereGeometry(cell * 0.48, 24, 12), new THREE.MeshBasicMaterial({ color: 0xd9dde6 }));
        w.scale.y = 0.42; w.position.set(a * cell, 0, b * cell); g.add(w); return w;
      });
      [[-4, 3], [2, -4]].forEach(([a, b]) => {
        const k2 = new THREE.Mesh(new THREE.SphereGeometry(cell * 0.48, 24, 12), new THREE.MeshBasicMaterial({ color: 0x14171d }));
        k2.scale.y = 0.42; k2.position.set(a * cell, 0, b * cell); g.add(k2);
      });
      const rings = [0, 1, 2, 3].map(() => {
        const r = new THREE.Mesh(new THREE.RingGeometry(0.96, 1.02, 96), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
        r.rotation.x = -Math.PI / 2; r.position.copy(stone.position); g.add(r); return r;
      });
      g.rotation.x = 0.88; g.position.y = 0.5;
      g.userData.update = (t, l) => {
        stone.position.y = (1 - THREE.MathUtils.smoothstep(l, 0.1, 0.65)) * 3.5;
        const since = performance.now() / 1000 - INTERACT.tap;
        rings.forEach((r, i) => {
          const k = since < 3.5 ? Math.min(1, Math.max(0, since * 0.55 - i * 0.11)) : ((t * 0.15 + i / 4) % 1);
          const boost = since < 3.5 ? 1 : 0.45;
          r.scale.setScalar(0.15 + k * (since < 3.5 ? 16 : 7) * l);
          r.material.opacity = (1 - k) * boost * l * 0.55;
        });
        stone.material.uniforms.uGain.value = 1 + Math.max(0, 1.2 - since) * 2.5;
      };
      return g;
    },

    // 11 Transformer → ChatGPT — attention star → cursor → hold text sea
    (c) => {
      const g = new THREE.Group();
      const n = 22, pos = [], edges = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, r = 2.6 + (i % 4) * 0.35;
        pos.push(Math.cos(a) * r, Math.sin(a) * r * 0.72, (Math.random() - 0.5) * 1.4);
      }
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        if (Math.random() > 0.55) continue;
        edges.push(V3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]), V3(pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]));
      }
      // fix: pos is flat array
      const posFlat = pos;
      const edgePts = [];
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        if ((i * 7 + j * 3) % 5 !== 0) continue;
        edgePts.push(
          V3(posFlat[i * 3], posFlat[i * 3 + 1], posFlat[i * 3 + 2]),
          V3(posFlat[j * 3], posFlat[j * 3 + 1], posFlat[j * 3 + 2]),
        );
      }
      const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(posFlat, 3)), new THREE.PointsMaterial({ color: 0xffc27a, size: 0.16, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      const net = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(edgePts), lineMat(0xffb547, 0.4));
      g.add(stars, net);
      // attention beams animating
      const beams = [];
      for (let i = 0; i < 8; i++) {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 6), new THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending }));
        g.add(b); beams.push(b);
      }
      const cursor = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 1.1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending }));
      cursor.position.set(0, 0, 2); g.add(cursor);
      const tp = [], tc = [];
      for (let i = 0; i < (MOBILE ? 900 : 2800); i++) {
        tp.push((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12);
        tc.push(1, 0.9 + Math.random() * 0.1, 0.7);
      }
      const sea = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)).setAttribute('color', new THREE.Float32BufferAttribute(tc, 3)), new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      g.add(sea);
      g.userData.update = (t, l) => {
        const zoom = THREE.MathUtils.smoothstep(l, 0.25, 0.85);
        stars.scale.setScalar(1 + zoom * 2.2); net.scale.copy(stars.scale);
        stars.material.opacity = 1 - zoom * 0.75; net.material.opacity = 0.4 * (1 - zoom);
        beams.forEach((b, i) => {
          const a = t * 0.8 + i;
          const i0 = i % n, i1 = (i * 5 + 3) % n;
          const x0 = posFlat[i0 * 3], y0 = posFlat[i0 * 3 + 1], z0 = posFlat[i0 * 3 + 2];
          const x1 = posFlat[i1 * 3], y1 = posFlat[i1 * 3 + 1], z1 = posFlat[i1 * 3 + 2];
          b.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
          const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0) || 1;
          b.scale.set(1, len, 1);
          b.lookAt(x1, y1, z1); b.rotateX(Math.PI / 2);
          b.material.opacity = (1 - zoom) * (0.3 + 0.4 * Math.sin(a));
          b.visible = zoom < 0.9;
        });
        cursor.material.opacity = 0.35 + zoom * 0.65 + (Math.sin(t * 5) > 0 ? 0.35 : 0);
        cursor.scale.setScalar(0.4 + zoom * 2.4);
        const hold = INTERACT.cursorHold || 0;
        sea.material.opacity = hold * 0.9;
        sea.rotation.y = t * 0.06;
        g.rotation.y = t * 0.04;
      };
      return g;
    },

    // 12 R1 — official whale
    (c) => { const w = makeWhale(c, MOBILE ? 0.85 : 1.45); w.userData.station = true; return w; },
  ];
}
