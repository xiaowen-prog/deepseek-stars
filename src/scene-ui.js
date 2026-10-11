import {PEOPLE} from './revised-scenes.js';
import {moves} from './go-record.js';
export function createSceneUI({THREE,stations,INTERACT,camera,renderer}) {
 const card=k=>document.querySelector(`.card[data-k="${k}"]`);
 INTERACT.person=-1;INTERACT.personHover=-1;INTERACT.ruleMode='auto';INTERACT.goMove=37;
 const panel=document.createElement('div');panel.className='scene-controls turing-controls';
 panel.innerHTML=`<p class="control-title">隔着屏幕，你会怎样判断？</p><button type="button" id="ask-turing">发送同一个问题</button><div class="turing-responses" hidden><p><b>问题</b>雨停了，你会做什么？</p><p><b>A</b>出去走走，看看路边的积水。</p><p><b>B</b>打开窗，听最后几滴雨落下。</p><div class="control-row"><button type="button" data-answer="A">我猜 A 是机器</button><button type="button" data-answer="B">我猜 B 是机器</button></div></div><p class="turing-result" aria-live="polite"></p>`;
 card(1).append(panel);panel.querySelector('#ask-turing').onclick=()=>{panel.querySelector('.turing-responses').hidden=false;panel.querySelector('#ask-turing').textContent='问题已发送';};
 panel.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{panel.querySelector('.turing-result').textContent='仅凭这两句，很难确定。图灵把“会不会思考”转化为：机器能否在文字交谈中，让提问者难以分辨它与人。这里的回答是交互示例，不是原实验记录。';});
 const personBox=document.createElement('aside');personBox.className='person-dialog';personBox.hidden=true;personBox.setAttribute('role','dialog');personBox.setAttribute('aria-label','研究者介绍');document.body.append(personBox);
 const layer=document.createElement('div');layer.className='person-hotspots';layer.hidden=true;document.body.append(layer);
 let selected=-1,lastFocus=null,autoStart=null,manualUntil=0,previousAuto=-1;const reducePeople=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function closePerson(restore=true){selected=-1;INTERACT.person=-1;personBox.hidden=true;buttons.forEach(b=>b.setAttribute('aria-expanded','false'));if(restore&&lastFocus?.isConnected)lastFocus.focus({preventScroll:true});}
 function select(i,automatic=false){if(!automatic)manualUntil=Infinity;selected=i;INTERACT.person=i;const p=PEOPLE[i];if(!automatic)lastFocus=buttons[i];personBox.classList.toggle('person-auto',automatic);personBox.setAttribute('role',automatic?'region':'dialog');personBox.innerHTML=`<button type="button" class="person-close" aria-label="关闭人物介绍">×</button><p class="person-kicker">达特茅斯研究计划 · 发起人</p><h2>${p.name}</h2><p class="person-en">${p.en}</p><p class="person-tag">${p.tag}</p><p class="person-bio">${p.bio}</p><p class="person-note">人物与圆桌为示意，不代表实际座次与出席人数。</p>`;personBox.hidden=false;personBox.querySelector('button').onclick=()=>{manualUntil=performance.now()+12000;closePerson(!automatic);};buttons.forEach((b,j)=>b.setAttribute('aria-expanded',String(i===j)));if(!automatic)personBox.querySelector('button').focus({preventScroll:true});else if(!reducePeople)personBox.animate([{opacity:0,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:600,easing:'ease-out'});}
 const buttons=PEOPLE.map((p,i)=>{const b=document.createElement('button');b.type='button';b.className='person-hotspot person-hit';b.setAttribute('aria-label',`了解${p.name}`);b.setAttribute('aria-expanded','false');b.onclick=()=>select(i);b.onpointerenter=()=>INTERACT.personHover=i;b.onpointerleave=()=>INTERACT.personHover=-1;layer.append(b);return b;});
 addEventListener('keydown',e=>{if(e.key==='Escape'&&!personBox.hidden){e.preventDefault();closePerson();}});
 const personHint=document.createElement('p');personHint.className='person-discover-hint';personHint.textContent='人物介绍缓慢轮播 · 点击人物可停留阅读';personHint.hidden=true;document.body.append(personHint);
 const winterOne=document.createElement('div');winterOne.className='scene-controls winter-learning-controls';winterOne.innerHTML='<p class="winter-learning-status" aria-live="polite">信号在网络中传递，学习的光逐渐停滞。</p><p class="control-note">移动光，寻找未熄灭的研究。触屏可用手指移动。<br>场景为视觉隐喻。</p><button type="button">重看 · 光如何停滞</button>';card(4).append(winterOne);
 winterOne.querySelector('button').onclick=()=>INTERACT.winterReplay=(INTERACT.winterReplay||0)+1;
 let lastWinterPhase='';const winterMessages={freezing:'信号逐渐减速，学习的光正在停滞。',frozen:'网络停滞了，仍有几处微光。照亮它们，研究并未完全消失。',thaw:'一道光沿网络往回走——误差，开始成为学习的线索。'};
 const winter=document.createElement('div');winter.className='scene-controls';winter.innerHTML='<div class="control-row"><button type="button" data-rule="auto" aria-pressed="true">重播两条路径</button><button type="button" data-rule="known" aria-pressed="false">熟悉的问题</button><button type="button" data-rule="new" aria-pressed="false">新问题</button></div><p class="rule-status" aria-live="polite">先看熟悉的问题，如何沿规则找到答案。</p>';card(6).append(winter);
 winter.querySelectorAll('button').forEach(b=>b.onclick=()=>{INTERACT.ruleMode=b.dataset.rule;INTERACT.ruleReplay=(INTERACT.ruleReplay||0)+1;winter.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
 let lastRulePhase='';
 const ruleMessages={'known-travel':'① 熟悉的问题：条件匹配，沿熟悉的规则前进。','known-done':'① 找到答案。接下来，看看规则之外的新问题。','new-travel':'② 新问题：尝试另一条路径，已经走通的路径保留。','new-stop':'② 规则止步。熟悉的问题能找到答案，新问题却没有可用规则。'};
 const crown=document.createElement('div');crown.className='scene-controls';crown.innerHTML='<p class="crown-status control-note" aria-live="polite">棋盘出现，等待落子。</p><button type="button">重播 · 落子</button>';crown.querySelector('button').onclick=()=>{INTERACT.crownReplay=(INTERACT.crownReplay||0)+1;};card(7).append(crown);
 const go=document.createElement('div');go.className='scene-controls go-controls';go.innerHTML=`<p class="go-status mono" aria-live="polite"></p><label for="go-move">查看完整棋局</label><input id="go-move" aria-label="棋谱手数" type="range" min="0" max="${moves.length}" value="37"><div class="control-row"><button type="button" data-go="prev" aria-label="上一手">←</button><button type="button" data-go="37">重播第 37 手</button><button type="button" data-go="end">终局 · 211 手</button><button type="button" data-go="next" aria-label="下一手">→</button></div><small class="control-note">2016.03.10 · AlphaGo 执黑 / 李世石执白 · 黑中盘胜<br>按真实棋谱复盘，包含提子。第 37 手以波纹定位；其他手数以小圈标记最近一手。</small><a class="record-link" href="assets/alphago-lee-game2.sgf" download>下载本局棋谱 ↗</a>`;card(10).append(go);
 const range=go.querySelector('input');function setMove(n){if(n===37)INTERACT.goReplay=(INTERACT.goReplay||0)+1;INTERACT.goMove=Math.max(0,Math.min(moves.length,n));range.value=INTERACT.goMove;const p=moves[INTERACT.goMove-1];go.querySelector('.go-status').textContent=INTERACT.goMove?`第 ${INTERACT.goMove} / 211 手 · ${p[0]==='B'?'黑棋':'白棋'}${INTERACT.goMove===37?' · 五路肩冲':''}`:'开局 · 尚未落子';}range.oninput=()=>setMove(+range.value);go.querySelectorAll('button').forEach(b=>b.onclick=()=>setMove(b.dataset.go==='prev'?INTERACT.goMove-1:b.dataset.go==='next'?INTERACT.goMove+1:b.dataset.go==='end'?211:37));setMove(37);
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
 addEventListener('pointerup',event=>{
  if(layer.hidden||event.target.closest('button,a,input,.card,.rail,.person-dialog'))return;
  pointer.set(event.clientX/innerWidth*2-1,1-event.clientY/innerHeight*2);ray.setFromCamera(pointer,camera);
  const hits=ray.intersectObject(stations[1].obj,true);
  for(const hit of hits){let obj=hit.object;while(obj&&obj!==stations[1].obj){if(Number.isInteger(obj.userData.person)){select(obj.userData.person);return;}obj=obj.parent;}}
 });
 const v=new THREE.Vector3();
 return {update(k){
  const visible=k===2&&!document.documentElement.classList.contains('opening');layer.hidden=!visible;personHint.hidden=!visible;
  if(!visible){if(selected!==-1)closePerson(false);autoStart=null;previousAuto=-1;manualUntil=0;}
  if(visible){const now=performance.now();if(autoStart===null)autoStart=now;const age=now-autoStart;if(age>1800&&now>manualUntil&&!personBox.matches(':hover')&&!personBox.contains(document.activeElement)){const index=reducePeople?0:Math.floor((age-1800)/7500)%PEOPLE.length;if(index!==previousAuto||personBox.hidden){previousAuto=index;select(index,true);}}}
  if(visible){camera.updateMatrixWorld();stations[1].root.updateMatrixWorld(true);stations[1].obj.userData.people.forEach((target,i)=>{target.getWorldPosition(v);v.project(camera);buttons[i].style.left=`${(v.x*.5+.5)*innerWidth}px`;buttons[i].style.top=`${(-v.y*.5+.5)*innerHeight}px`;buttons[i].hidden=v.z>1||v.z< -1;});}
  if(k===7){const text={enter:'棋盘出现，等待落子。',placing:'棋子落下，波纹扩散。',placed:'深蓝 3½–2½ 卡斯帕罗夫，定格。'}[INTERACT.crownPhase]||'';const status=crown.querySelector('.crown-status');if(status.textContent!==text)status.textContent=text;}
  if(k===4&&INTERACT.winterPhase!==lastWinterPhase){lastWinterPhase=INTERACT.winterPhase;winterOne.querySelector('.winter-learning-status').textContent=winterMessages[lastWinterPhase]||'';}
  if(k===6&&INTERACT.rulePhase!==lastRulePhase){lastRulePhase=INTERACT.rulePhase;winter.querySelector('.rule-status').textContent=ruleMessages[lastRulePhase]||'';}
  document.body.dataset.scene=String(k);
 }};
}
