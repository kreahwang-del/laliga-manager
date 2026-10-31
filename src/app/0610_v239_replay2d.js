// ================= v239 2D 경기 복기: 전체 타임라인 + 골·빅찬스 표시 (사용자 요청) =================
// 기록: 엔진이 0.5초마다 남기는 22명·공 위치(st.frames, 매 분 새로 채워짐)를 1초 간격으로 모아 둠 → 경기 전체 약 5,400장
//  한 장 = Int16 71칸(시간, 공 x·y·높이, 공 가진 선수 칸, 공격 팀, 재개 여부, 선수 32칸 × x·y; 0.1m 단위, 없음 = −32768) → 경기당 약 0.8MB
// 보관: 진행 중 경기는 메모리, 끝난 경기는 IndexedDB(저장과 같은 DB)에 최근 5경기만(리포트 5개와 같은 수)
// 표시: 빅찬스 = 표시 xG 0.15 이상 슈팅(v237 빅찬스 메이킹과 같은 기준), 골, 퇴장
const RP_NC=32,RP_W=7+RP_NC*2,RP_NA=-32768;
function rpNew(){const m=M&&M.m;if(!m||m.v!==4)return null;const me=M.me;const KP=typeof p2kits==='function'?p2kits():null;
  return {fx:{h:M.fx.h,a:M.fx.a,d:M.fx.d},me,cols:[],col:{},F:[],lastT:-1,kc:KP?[KP[0].col,KP[1].col]:['#d33','#36c']}}
function rpColOf(R,id){let c=R.col[id];if(c!=null)return c;if(R.cols.length>=RP_NC)return -1;c=R.cols.length;let s=0,p=null;for(const q of [0,1]){const a=(M.m.P[q]||[]).find(a=>String(a.p.id)===String(id));if(a){s=q;p=a;break}}
  if(!p){for(const q of [0,1]){const x=(M.m.T[q].xi||[]).concat(M.m.T[q].bench||[]).find(z=>z&&String(z.id)===String(id));if(x){s=q;p={p:x,gk:x.g==='GK'}}}}
  R.cols.push({id:String(id),n:p&&p.p?p.p.name:'',s,gk:!!(p&&(p.gk||p.p&&p.p.g==='GK'))});R.col[id]=c;return c}
function rpAdd(R,frames){for(const f of frames||[]){if(!f||f.t==null)continue;const ti=Math.round(f.t*2);/* v244 0.5초 간격(시간×2 저장) — 1초 간격이면 슈팅처럼 빠른 공이 다음 장면(킥오프)으로 바로 넘어가 보였음 */if(ti<=R.lastT)continue;R.lastT=ti;const a=new Int16Array(RP_W).fill(RP_NA);
    a[0]=ti;a[1]=Math.round(f.b[0]*10);a[2]=Math.round(f.b[1]*10);a[3]=Math.round((f.b[2]||0)*100);a[4]=f.o!=null?rpColOf(R,f.o):-1;a[5]=f.ps==null?-1:f.ps;a[6]=f.rs?1:0;
    for(const id in f.p){const c=rpColOf(R,id);if(c<0)continue;const q=f.p[id];a[7+c*2]=Math.round(q[0]*10);a[8+c*2]=Math.round(q[1]*10)}R.F.push(a)}}
function rpMarks(ev){const out=[];(ev||[]).forEach(e=>{if(e.sec==null)return;const sh=['goal','save','miss','block','post','fkShot'].includes(e.t);
    if(e.t==='goal')out.push({t:e.sec,k:'goal',s:e.s,p:e.p,a:e.a||null,xg:e.xg,m:e.m});
    else if(sh&&(e.xg||0)>=.15)out.push({t:e.sec,k:'big',s:e.s,p:e.p,xg:e.xg,m:e.m,r:e.t});
    else if(e.t==='red')out.push({t:e.sec,k:'red',s:e.s,p:e.p,m:e.m})});return out}
// 진행 중 경기 기록: 매 분(step) 뒤 그 분의 프레임을 모음
{const _sm=startMatch;startMatch=function(fx){const r=_sm.apply(this,arguments);try{if(M&&M.m&&M.m.v===4){M.rp=rpNew();const st0=M.m.step;M.m.step=function(){const o=st0.apply(this,arguments);try{if(M&&M.rp&&M.m)rpAdd(M.rp,M.m.st.frames)}catch(e){}return o};
    const tb=document.getElementById('mptab');if(tb&&!tb.querySelector('[data-rpopen]'))tb.insertAdjacentHTML('beforeend','<button data-rpopen="live" title="경기 복기">복기</button>')}}catch(e){console.error(e)}return r}}
// 경기 종료: IndexedDB 보관(최근 5경기), 리포트에 열쇠
function rpPack(R,ev){const n=R.F.length,buf=new Int16Array(n*RP_W);R.F.forEach((a,i)=>buf.set(a,i*RP_W));return {v:2,ts:2,fx:R.fx,me:R.me,cols:R.cols,kc:R.kc,n,mk:rpMarks(ev),buf:buf.buffer}}
function rpPut(key,obj){try{if(!IDB||!IDB.db)return;const os=IDB.db.transaction('s','readwrite').objectStore('s');os.put(obj,key);
  S.rpKeys=(S.rpKeys||[]).filter(k=>k!==key);S.rpKeys.unshift(key);const old=S.rpKeys.slice(5);S.rpKeys=S.rpKeys.slice(0,5);old.forEach(k=>{try{os.delete(k)}catch(e){}})}catch(e){console.error(e)}}
function rpGet(key){return new Promise(res=>{try{if(!IDB||!IDB.db)return res(null);const q=IDB.db.transaction('s','readonly').objectStore('s').get(key);q.onsuccess=()=>res(q.result||null);q.onerror=()=>res(null)}catch(e){res(null)}})}
{const _br=buildReport;buildReport=function(res,me,fx){const R=_br.apply(this,arguments);try{if(M&&M.rp&&M.rp.F.length>60&&fx){const key='rp:'+fx.d+':'+fx.h+':'+fx.a;R.rpk=key;
    try{rpAdd(M.rp,M.m.st.frames)}catch(e){}const ob=rpPack(M.rp,res.ev||M.m.st.ev);M.rpObj=ob;rpPut(key,ob)}}catch(e){console.error(e)}return R}}
// ---- 보기 화면 ----
const RV={on:false,o:null,t:0,play:false,spd:1,/* v258(사용자 요청): 복기 재생 기본 4배속→1배속, 0.5배속 추가 */raf:0,last:0,lbl:false,live:false};
function rpLiveObj(){const R=M&&M.rp;if(!R)return null;try{rpAdd(R,M.m.st.frames)}catch(e){}const n=R.F.length,buf=new Int16Array(n*RP_W);R.F.forEach((a,i)=>buf.set(a,i*RP_W));return {v:2,ts:2,fx:R.fx,me:R.me,cols:R.cols,kc:R.kc,n,mk:rpMarks(M.m.st.ev),buf:buf.buffer}}
function rpOpen(o,live){if(!o||!o.n){toast('복기할 기록이 없습니다');return}RV.o=o;RV.A=new Int16Array(o.buf);RV.live=!!live;RV.ts=o.ts||1;RV.t0=RV.A[0]/RV.ts;RV.t1=RV.A[(o.n-1)*RP_W]/RV.ts;RV.t=RV.t0;RV.play=false;RV.on=true;
  if(live&&M&&!M.done){RV.wasRun=!M.paused;M.paused=true;clearTimeout(M.timer);try{if(typeof stopAnim==='function')stopAnim()}catch(e){}}
  const H=CLUBS[o.fx.h],Aw=CLUBS[o.fx.a];const dur=Math.max(1,RV.t1-RV.t0);const pos=t=>((t-RV.t0)/dur*100).toFixed(2);
  const mk=o.mk.filter(x=>x.t>=RV.t0&&x.t<=RV.t1+5);
  const mkI=x=>x.k==='goal'?'⚽':x.k==='red'?'🟥':'●';const sideNm=s=>esc((s===0?H:Aw).short);
  const lab=x=>`${x.m!=null?x.m+"'":''} ${mkI(x)} ${sideNm(x.s)} ${esc(shortName(x.p||''))}${x.k==='goal'&&x.a?` (도움 ${esc(shortName(x.a))})`:''}${x.k==='big'?` · ${({save:'선방',miss:'빗나감',block:'블록',post:'골대',fkShot:'프리킥'})[x.r]||'슈팅'} xG ${(+x.xg).toFixed(2)}`:x.k==='goal'&&x.xg!=null?` · xG ${(+x.xg).toFixed(2)}`:''}`;
  let d=document.getElementById('rpv');if(d)d.remove();d=document.createElement('div');d.id='rpv';
  d.innerHTML=`<div class="rpbox"><div class="rphd"><b id="rpsc"></b><span id="rpclk"></span><button class="chip" data-rpx="1">닫기</button></div>
   <svg id="rpsvg" viewBox="-2 -2 109 72" preserveAspectRatio="xMidYMid meet"><rect x="-2" y="-2" width="109" height="72" fill="#2f7a3b"/>${[0,1,2,3,4,5,6,7,8,9,10].map(i=>`<rect x="${i*10.5}" y="0" width="5.25" height="68" fill="rgba(255,255,255,.035)"/>`).join('')}
    <g fill="none" stroke="rgba(255,255,255,.75)" stroke-width=".35"><rect x="0" y="0" width="105" height="68"/><line x1="52.5" y1="0" x2="52.5" y2="68"/><circle cx="52.5" cy="34" r="9.15"/><rect x="0" y="13.85" width="16.5" height="40.3"/><rect x="88.5" y="13.85" width="16.5" height="40.3"/><rect x="0" y="24.85" width="5.5" height="18.3"/><rect x="99.5" y="24.85" width="5.5" height="18.3"/><rect x="-1.5" y="30.34" width="1.5" height="7.32"/><rect x="105" y="30.34" width="1.5" height="7.32"/></g>
    <g id="rpP"></g><circle id="rpB" r="1" fill="#fff" stroke="#111" stroke-width=".25"/></svg>
   <div class="rptl"><div class="rpmk">${mk.map((x,i)=>`<button class="rpm ${x.k}" data-rpm="${i}" style="left:${pos(x.t)}%" title="${esc(lab(x).replace(/<[^>]*>/g,''))}">${mkI(x)}</button>`).join('')}<i class="rpht" style="left:${pos(RV.t0+(RV.t1-RV.t0)/2)}%"></i></div>
    <input type="range" id="rpr" min="${RV.t0}" max="${RV.t1}" step="1" value="${RV.t0}"></div>
   <div class="rpfine"><span class="note">정밀 ±15초</span><input type="range" id="rpf" min="-15" max="15" step="0.1" value="0"></div>
   <div class="rpctl"><button class="chip" data-rpj="-15">−15초</button><button class="chip" data-rpj="-3">−3초</button><button class="chip" data-rpplay="1" id="rpplay">▶ 재생</button><button class="chip" data-rpj="3">+3초</button><button class="chip" data-rpj="15">+15초</button><button class="chip" data-rpspd="1" id="rpspd">${RV.spd}배속</button><button class="chip" data-rplbl="1" aria-pressed="${RV.lbl}">이름</button></div>
   <div class="rplist">${mk.length?mk.map((x,i)=>`<button class="li rpli ${x.k}" data-rpm="${i}"><span>${lab(x)}</span></button>`).join(''):'<div class="note">골·빅찬스가 아직 없습니다.</div>'}</div>
   <p class="note" style="margin:6px 2px 0">● 빅찬스 = xG 0.15 이상 슈팅 · 장면을 누르면 8초 전부터 재생 · 1배속 = 실제 시간${live?' · 닫으면 경기가 이어집니다':''}</p></div>`;
  document.body.appendChild(d);RV.mk=mk;RV.ga=rpGoalAnim(mk);rpBuild();rpDraw(RV.t)}
function g_tJ(g){return g.tJ}
function rpGoalAnim(mk){const A=RV.A,n=RV.o.n,ts=RV.ts,out=[];mk.filter(m=>m.k==='goal').forEach(m=>{let jx=-1;for(let i=Math.max(0,rpIdx(m.t-4));i<n-1&&A[i*RP_W]/ts<=m.t+4;i++){if(Math.hypot(A[(i+1)*RP_W+1]-A[i*RP_W+1],A[(i+1)*RP_W+2]-A[i*RP_W+2])>150&&Math.hypot(A[(i+1)*RP_W+1]-525,A[(i+1)*RP_W+2]-340)<25&&Math.abs(A[i*RP_W+1]-525)>300){jx=i;break}/* v266 사용자 지적(복기 2D에서 손흥민 골이 델가도 골처럼 보임): 골 직전 긴 패스(15m 넘게 이동)를 골 장면으로 잘못 잡았음 → 센터 킥오프 자리로 뛰는 구간만(실시간 2D v264와 같은 기준) */}if(jx<0)return;
  let s0=jx;while(s0>0&&A[jx*RP_W]/ts-A[(s0-1)*RP_W]/ts<4&&Math.abs(A[(s0-1)*RP_W+1]-A[jx*RP_W+1])<8&&Math.abs(A[(s0-1)*RP_W+2]-A[jx*RP_W+2])<8)s0--;const x0=A[s0*RP_W+1]/10,y0=A[s0*RP_W+2]/10;out.push({tS:Math.min(A[s0*RP_W]/ts,A[jx*RP_W]/ts-.6),tJx:A[jx*RP_W]/ts,tJ:A[(jx+1)*RP_W]/ts,x0,y0,gx:x0<52.5?-1.2:106.2,gy:Math.max(31,Math.min(37,y0))})});return out}
function rpBuild(){const o=RV.o,g=document.getElementById('rpP');if(!g)return;g.innerHTML=o.cols.map((c,i)=>`<g class="rpp" data-c="${i}" style="display:none"><circle r="1.6" fill="${c.gk?(c.s===0?'#E8C547':'#9C6ADE'):o.kc[c.s]}" stroke="${c.s===o.me?'#F0B429':'rgba(0,0,0,.5)'}" stroke-width="${c.s===o.me?.45:.3}"/><text y="-2.1" text-anchor="middle" font-size="2" fill="#fff" stroke="rgba(0,0,0,.6)" stroke-width=".25" paint-order="stroke" class="rpn">${esc(shortName(c.n||''))}</text></g>`).join('');
  RV.el=[...g.querySelectorAll('.rpp')];RV.tx=[...g.querySelectorAll('.rpn')];RV.tx.forEach(t=>t.style.display=RV.lbl?'':'none')}
function rpIdx(t){const A=RV.A,n=RV.o.n;let lo=0,hi=n-1;while(lo<hi){const m=(lo+hi+1)>>1;if(A[m*RP_W]/RV.ts<=t)lo=m;else hi=m-1}return lo}
function rpDraw(t){const A=RV.A,o=RV.o;if(!A)return;const t_=t;const gw=(RV.ga||[]).find(g=>t>=g.tS&&t<g.tJ+2.2);if(gw&&t>=g_tJ(gw))t=gw.tJx;const i=rpIdx(t),j=Math.min(o.n-1,i+1),b0=i*RP_W,b1=j*RP_W;const ta=A[b0]/RV.ts,tb=A[b1]/RV.ts;const k=tb>ta?Math.max(0,Math.min(1,(t-ta)/(tb-ta))):0;
  for(let c=0;c<o.cols.length;c++){const el=RV.el[c];if(!el)continue;const x0=A[b0+7+c*2],y0=A[b0+8+c*2];if(x0===RP_NA){el.style.display='none';continue}let x1=A[b1+7+c*2],y1=A[b1+8+c*2];if(x1===RP_NA){x1=x0;y1=y0}
    el.style.display='';el.setAttribute('transform',`translate(${((x0+(x1-x0)*k)/10).toFixed(2)} ${((y0+(y1-y0)*k)/10).toFixed(2)})`)}
  let bx=(A[b0+1]+(A[b1+1]-A[b0+1])*k)/10,by=(A[b0+2]+(A[b1+2]-A[b0+2])*k)/10,bh=(A[b0+3]+(A[b1+3]-A[b0+3])*k)/100;
  /* v244 골 장면: 엔진은 슈팅 순간 공을 멈춘 채 판정 → 몇 초 뒤 킥오프 위치로 순간이동. 복기에선 멈춘 순간부터 0.7초 동안 공을 가까운 골문 안으로 보내고, 킥오프 전까지 골망에 둠 */
  /* 골 뒤 2.2초는 골 직전 장면에 멈춰 공을 골망에 둠(엔진은 곧바로 킥오프 위치로 옮김) */if(gw){const kk=Math.min(1,(t_-gw.tS)/.6);bx=gw.x0+(gw.gx-gw.x0)*kk;by=gw.y0+(gw.gy-gw.y0)*kk;bh=kk<1?.8*Math.sin(kk*Math.PI):0}
  /* 그 밖의 재개(골킥·스로인 등) 순간이동은 미끄러지듯 옮기지 않음 */
  if(j>i&&Math.hypot(A[b1+1]-A[b0+1],A[b1+2]-A[b0+2])>150&&!gw){bx=A[b0+1]/10;by=A[b0+2]/10;bh=A[b0+3]/100}const B=document.getElementById('rpB');if(B){B.setAttribute('cx',bx.toFixed(2));B.setAttribute('cy',(by-bh*1.2).toFixed(2));B.setAttribute('r',(1+bh*.6).toFixed(2))}
  const g=[0,0];RV.mk.forEach(x=>{if(x.k==='goal'&&x.t<=t_)g[x.s]++});const sc=document.getElementById('rpsc');if(sc)sc.textContent=`${CLUBS[o.fx.h].short} ${g[0]} - ${g[1]} ${CLUBS[o.fx.a].short}`;
  const mm=Math.floor(t_/60),ss=Math.floor(t_%60);const ck=document.getElementById('rpclk');if(ck)ck.textContent=`${mm}:${String(ss).padStart(2,'0')}`;
  const r=document.getElementById('rpr');if(r&&!RV.drag)r.value=Math.round(t_)}
function rpLoop(now){if(!RV.on)return;const dt=Math.min(.1,(now-RV.last)/1000);RV.last=now;if(RV.play){RV.t+=dt*RV.spd;if(RV.t>=RV.t1){RV.t=RV.t1;rpSetPlay(false)}rpDraw(RV.t)}RV.raf=requestAnimationFrame(rpLoop)}
function rpSetPlay(v){RV.play=v;const b=document.getElementById('rpplay');if(b)b.textContent=v?'❚❚ 멈춤':'▶ 재생';if(v){RV.last=performance.now();cancelAnimationFrame(RV.raf);RV.raf=requestAnimationFrame(rpLoop)}}
function rpClose(){RV.on=false;RV.play=false;cancelAnimationFrame(RV.raf);const d=document.getElementById('rpv');if(d)d.remove();if(RV.live&&M&&!M.done&&RV.wasRun){try{resume()}catch(e){}}RV.live=false}
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('[data-rpopen],[data-rpx],[data-rpm],[data-rpj],[data-rpplay],[data-rpspd],[data-rplbl]');if(!t)return;e.preventDefault();e.stopPropagation();const d=t.dataset;
  if(d.rpopen){if(d.rpopen==='live')rpOpen(rpLiveObj(),true);else{const k=d.rpopen;if(M&&M.rpObj&&R_KEY_OK(k))rpOpen(M.rpObj,false);else rpGet(k).then(o=>o?rpOpen(o,false):toast('이 경기의 복기 기록이 없습니다(최근 5경기만 보관)'))}return}
  if(d.rpx){rpClose();return}
  if(d.rpm!=null){const x=RV.mk[+d.rpm];if(x){RV.t=Math.max(RV.t0,x.t-8);rpDraw(RV.t);rpSetPlay(true)}return}
  if(d.rpj){RV.t=Math.max(RV.t0,Math.min(RV.t1,RV.t+(+d.rpj)));rpDraw(RV.t);return}
  if(d.rpplay){rpSetPlay(!RV.play);return}
  if(d.rpspd){const L=[.5,1,2,4,8];RV.spd=L[(L.indexOf(RV.spd)+1)%L.length];t.textContent=RV.spd+'배속';return}
  if(d.rplbl){RV.lbl=!RV.lbl;t.setAttribute('aria-pressed',RV.lbl);(RV.tx||[]).forEach(x=>x.style.display=RV.lbl?'':'none');return}},true);
function R_KEY_OK(k){return M&&M.rpObj&&M.fx&&k==='rp:'+M.fx.d+':'+M.fx.h+':'+M.fx.a}
document.addEventListener('input',e=>{if(!e.target)return;if(e.target.id==='rpr'){RV.drag=true;RV.t=+e.target.value;RV.fb=null;const f=document.getElementById('rpf');if(f)f.value=0;rpDraw(RV.t);RV.drag=false}
  /* v245 정밀 슬라이더: 놓은 지점 기준 ±15초를 0.1초 단위로(v244 ±60초도 빠르다는 의견)(전체 슬라이더는 한 칸이 약 15초라 너무 빠름) */if(e.target.id==='rpf'){if(RV.fb==null)RV.fb=RV.t;RV.t=Math.max(RV.t0,Math.min(RV.t1,RV.fb+(+e.target.value)));rpDraw(RV.t)}});
document.addEventListener('change',e=>{if(e.target&&e.target.id==='rpf'){RV.fb=null;e.target.value=0}});
// 리포트에 버튼
{const _rh=reportHTML;reportHTML=function(R){let h=_rh.apply(this,arguments);try{if(R&&R.rpk&&(S.rpKeys||[]).includes(R.rpk))h=`<button class="btn ghost" data-rpopen="${esc(R.rpk)}" style="width:100%;margin:0 0 10px">⏪ 2D 경기 복기 (전체 타임라인 · 골 · 빅찬스)</button>`+h}catch(e){}return h}}
{const cs=document.createElement('style');cs.textContent=`#rpv{position:fixed;inset:0;z-index:80;background:var(--bg,#0B1016);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:max(10px,env(safe-area-inset-top)) 8px 16px}
#rpv .rpbox{width:100%;max-width:760px}#rpv .rphd{display:flex;align-items:center;gap:10px;margin:4px 2px 8px;color:#fff}#rpv .rphd b{font-size:17px}#rpv .rphd span{color:var(--amber,#F0B429);font-family:var(--disp,inherit);font-size:15px;flex:1}
#rpv svg{width:100%;height:auto;display:block;border-radius:8px;background:#2f7a3b}#rpv .rptl{position:relative;margin:22px 4px 4px}#rpv .rpmk{position:absolute;left:0;right:0;top:-20px;height:20px}
#rpv .rpm{position:absolute;transform:translateX(-50%);border:0;background:none;padding:0;font-size:13px;line-height:20px;cursor:pointer;color:#cfd6de}#rpv .rpm.big{color:#9fb3c8;font-size:10px}#rpv .rpm.goal{font-size:14px;z-index:2}
#rpv .rpht{position:absolute;top:4px;width:1px;height:14px;background:rgba(255,255,255,.35)}#rpv input[type=range]{width:100%;accent-color:var(--amber,#F0B429)}
#mptab{display:flex!important;flex-wrap:nowrap!important;gap:6px}#mptab>button{flex:1 1 0!important;min-width:0!important;white-space:nowrap;padding-left:4px!important;padding-right:4px!important;font-size:14px}#rpv .rpfine{display:flex;align-items:center;gap:8px;margin:6px 4px 0}#rpv .rpfine input{flex:1;accent-color:#9fb3c8}#rpv .rpfine .note{margin:0;white-space:nowrap;font-size:11px}#rpv .rpctl{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}#rpv .rplist{max-height:30vh;overflow:auto;background:rgba(255,255,255,.04);border-radius:8px}#rpv .rpli{width:100%;text-align:left;font-size:13px;padding:8px 10px}#rpv .rpli.goal{font-weight:700}#rpv .rpli.big{color:#c9d3dd}`;document.head.appendChild(cs)}

