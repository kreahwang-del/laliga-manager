// ================= v268 벤치 지시 장면 보기(사용자 요청 2026-11-01: "상황을 모르고 글만 보고 고르는 느낌") =================
// 디자인·플레이테스트 에이전트 의견 반영:
//  1단계 결정 시트를 낮추고 뒤 2D 피치를 가리지 않음 + 공·관련 선수(우리 노랑/상대 빨강)·골문 거리선 강조
//  2단계 상황 부위로 자동 확대(0.3초) + 위치 사실 정보(슈팅 길 수비 수·박스 안 숫자 등). 선택지 방향 표시는 뜻이 고정된 세트피스(프리킥·코너)만 — 빈 동료로 가는 패스 길·상대 의도처럼 '정답'이 드러나는 표시는 하지 않음
//  3단계 지시 결과 장면을 3D 다시보기 칩('지시 결과')으로 남김(누를 때만 3D를 띄움 → 폰 성능 부담 없음)
const DV={vb:null,anim:0};
function dvFlip(){return M&&M.m&&M.m.st&&M.m.st.min>45}
function dvE2D(x,y){return dvFlip()?[105-x,68-y]:[x,y]}/* 엔진 좌표 → 화면 좌표(후반엔 진영 교체) */
function dvGoalX(s){return ((s===0)!==dvFlip())?105:0}/* s팀이 공격하는 골문 x */
function dvFrame(){const fr=M&&M.m&&M.m.st&&M.m.st.frames;return fr&&fr.length?fr[fr.length-1]:null}
function dvPos(f,id){const q=f&&id!=null&&f.p[id];return q?[q[0],q[1]]:null}
function dvIdByName(n){if(!n)return null;for(const s of [0,1])for(const a of (M.m.P[s]||[]))if(a.p.name===n)return a.p.id;return null}
function dvNear(f,s,pt,n){const out=[];for(const a of (M.m.P[s]||[])){if(a.gk)continue;const q=dvPos(f,a.p.id);if(q)out.push([Math.hypot(q[0]-pt[0],q[1]-pt[1]),a.p.id])}return out.sort((a,b)=>a[0]-b[0]).slice(0,n).map(x=>x[1])}
function dvTopAir(s){return (M.m.P[s]||[]).filter(a=>!a.gk).map(a=>[(a.p.aerial??10)+((a.p.h||180)-180)*.08,a.p.id]).sort((a,b)=>b[0]-a[0]).slice(0,3).map(x=>x[1])}
function dvVB(svg,x,y,w,h){svg.setAttribute('viewBox',`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`)}
function dvZoom(svg,cx,cy,w){const h=w*68/105;let x=Math.max(-3,Math.min(108-w,cx-w/2)),y=Math.max(-3,Math.min(71-h,cy-h/2));
  const v0=(svg.getAttribute('viewBox')||'0 0 105 68').split(/\s+/).map(Number);const t0=performance.now(),id=++DV.anim;
  const step=now=>{if(id!==DV.anim)return;const k=Math.min(1,(now-t0)/300),e=k*(2-k);dvVB(svg,v0[0]+(x-v0[0])*e,v0[1]+(y-v0[1])*e,v0[2]+(w-v0[2])*e,v0[3]+(h-v0[3])*e);if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)}
function dvClear(){DV.anim++;const svg=document.getElementById('m2d');if(svg){if(DV.vb!=null)svg.setAttribute('viewBox',DV.vb);svg.classList.remove('dvz')}DV.vb=null;const g=document.getElementById('dvL');if(g)g.remove();const sc=document.getElementById('scrim');if(sc)sc.classList.remove('dvm')}
function dvShow(d){const svg=document.getElementById('m2d');const f=dvFrame();if(!svg||!f||!d)return null;if(DV.vb==null)DV.vb=svg.getAttribute('viewBox')||'0 0 105 68';
  const me=M.me,atk=d.k==='def'?1-d.s:d.s,opp=1-atk,gx=dvGoalX(atk),gy=34,dir=gx>52?1:-1;
  let ball=[f.b[0],f.b[1]],our=[],their=[],marks=[],info='',zw=44,zc=null;
  if(d.k==='fk'){ball=dvE2D(d.x,d.y);our=[d.tk&&d.tk.id];info=`골문까지 ${d.info.d}m · 정면에서 ${d.info.ang}m 옆`;marks=[[gx,gy,'1'],[gx-dir*11,gy,'2'],[ball[0]-dir*6,ball[1]+(ball[1]<34?6:-6),'3']]}
  else if(d.k==='corner'){const L_=(d.info||{}).side==='L';const ey=d.s?(L_?67.5:.5):(L_?.5:67.5);ball=dvE2D(d.s?0:105,ey);our=dvTopAir(atk);their=dvTopAir(opp);const tid=dvIdByName((d.info||{}).tk);if(tid)our.unshift(tid);
    const ny=ball[1]<34?30.3:37.7;marks=[[gx-dir*11,gy,'1'],[gx-dir*3,ny,'2'],[ball[0]-dir*9,ball[1]<34?ball[1]+3:ball[1]-3,'3']];info=`박스 공중볼 상위 3명 표시 · 우리(노랑) vs 상대(빨강)`;zc=[gx-dir*14,gy];zw=40}
  else if(d.k==='def'){const ap=dvPos(f,d.atk),dp=dvPos(f,d.aid);if(ap)ball=ap;our=[d.aid];their=[d.atk];info=`상대 ${esc(shortName((d.info||{}).an||''))} → 골문까지 ${(d.info||{}).dist}m`;zw=38;zc=ap&&dp?[(ap[0]+dp[0])/2,(ap[1]+dp[1])/2]:null}
  else{const ap=dvPos(f,d.aid);if(ap)ball=ap;our=[d.aid];their=dvNear(f,opp,ball,1);const I=d.info||{};
    info=d.k==='box'?`골문까지 ${I.dist}m · 슈팅 길 수비 ${I.cone??'-'}명 · 가장 가까운 수비 ${I.nd}m · 박스 안 우리 ${I.bA} : 상대 ${I.bD}`:d.k==='cross'?`가장 가까운 수비 ${I.nd}m · 박스 안 우리 ${I.bA} : 상대 ${I.bD}`:`박스 안 우리 ${I.bA??'-'} : 상대 ${I.bD??'-'} · 가장 가까운 수비 ${I.nd??'-'}m`;zw=d.k==='box'?40:44;zc=[(ball[0]+gx)/2,(ball[1]+gy)/2]}
  if(!zc)zc=[(ball[0]+gx)/2,(ball[1]+gy)/2];
  const NS='http://www.w3.org/2000/svg';let g=document.getElementById('dvL');if(g)g.remove();g=document.createElementNS(NS,'g');g.id='dvL';g.setAttribute('pointer-events','none');
  const ring=(id,col,r)=>{const q=dvPos(f,id);if(!q)return '';return `<circle cx="${q[0]}" cy="${q[1]}" r="${r}" fill="none" stroke="${col}" stroke-width=".55"/>`};
  const dist=Math.hypot(gx-ball[0],gy-ball[1]);let h='';
  h+=`<line x1="${ball[0]}" y1="${ball[1]}" x2="${gx}" y2="${gy}" stroke="#F5D547" stroke-width=".35" stroke-dasharray="1.2 .9" opacity=".85"/><text x="${ball[0]+(gx-ball[0])*.3}" y="${ball[1]+(gy-ball[1])*.3-1.4}" text-anchor="middle" font-size="2.3" font-weight="800" fill="#F5D547" stroke="#0A0B0D" stroke-width=".35" paint-order="stroke">${Math.round(dist)}m</text>`;
  our.filter(Boolean).forEach((id,i)=>h+=ring(id,'#F5D547',i===0?2.9:2.4));their.filter(Boolean).forEach(id=>h+=ring(id,'#E5484D',2.6));
  h+=`<circle cx="${ball[0]}" cy="${ball[1]}" r="1.9" fill="none" stroke="#fff" stroke-width=".4"><animate attributeName="r" values="1.4;2.6;1.4" dur="1.2s" repeatCount="indefinite"/></circle>`;
  marks.forEach(([x,y,t])=>h+=`<g><circle cx="${x}" cy="${y}" r="1.7" fill="#0A0B0D" stroke="#F5D547" stroke-width=".35"/><text x="${x}" y="${y+.8}" text-anchor="middle" font-size="2.2" font-weight="900" fill="#F5D547">${t}</text></g>`);
  g.innerHTML=h;svg.appendChild(g);svg.classList.add('dvz');dvZoom(svg,zc[0],zc[1],zw);return {info,marks:marks.length}}
/* 결정 시트: 낮게 + 뒤 피치 보이게 + 위치 정보 한 줄 + 세트피스는 선택지 번호 */
{const _ds=decSheet;decSheet=function(){const r=_ds.apply(this,arguments);try{const d=M&&M.m&&M.m.st.pendingDec;if(!d)return r;const sc=document.getElementById('scrim');if(sc)sc.classList.add('dvm');const o=dvShow(d);const sh=sc&&sc.querySelector('.sheet');
  if(o&&sh){const h3=sh.querySelector('h3');if(h3&&o.info)h3.insertAdjacentHTML('afterend',`<div class="dvinfo">${o.info}</div>`);if(o.marks){[...sh.querySelectorAll('[data-mo^="dec:"]')].slice(0,3).forEach((b,i)=>{const bb=b.querySelector('b');if(bb)bb.insertAdjacentHTML('beforebegin',`<span class="dvn">${i+1}</span>`)})}}}catch(e){console.error(e)}return r}}
{const _rs=resume;resume=function(){try{dvClear()}catch(e){}return _rs.apply(this,arguments)}}
{const _cs=closeSheet;closeSheet=function(){try{if(!(M&&M.m&&M.m.st&&M.m.st.pendingDec))dvClear()}catch(e){}return _cs.apply(this,arguments)}}
/* 3단계: 지시 결과 장면을 3D 다시보기 칩으로(지시 순간 3초 전 ~ 8초 뒤) */
{const _dp=decPick;decPick=function(ch){try{const d=M&&M.m&&M.m.st.pendingDec;if(d&&typeof R3!=='undefined'&&typeof r3Roster==='function'){const sec=M.m.st.sec;const nm=d.k==='fk'?(d.tk&&d.tk.name):d.k==='corner'?(d.info||{}).tk:d.k==='def'?(d.info||{}).dn:((M.m.T[M.me].xi.find(p=>p.id===d.aid)||{}).name);R3.pend.push({e:{t:'dec',k:d.k,sec,m:M.m.min,p:nm||''},t0:sec-3,t1:sec+8,ros:r3Roster()})}}catch(e){console.error(e)}return _dp.apply(this,arguments)}}
{const _rl=r3Lab;r3Lab=function(e){return e&&e.t==='dec'?'지시 결과':_rl.apply(this,arguments)}}
{const st=document.createElement('style');st.textContent=`.scrim.dvm{background:transparent;pointer-events:none}.scrim.dvm .sheet{pointer-events:auto;max-height:50%;box-shadow:0 -10px 28px rgba(0,0,0,.7);padding-top:12px}
.scrim.dvm .sheet h3{margin:2px 0 4px}.scrim.dvm .sheet .btn{padding:9px 12px;margin-top:6px}.dvinfo{margin:0 0 6px;padding:6px 8px;background:rgba(245,213,71,.10);border-left:3px solid var(--amber,#F5D547);font-size:12.5px;font-weight:700;color:var(--text,#F2F3F5)}
#m2d.dvz .pl text{font-size:1.25px;stroke-width:.15px}#m2d.dvz .pl circle{r:1.25px}
.dvn{display:inline-grid;place-items:center;width:18px;height:18px;margin-right:6px;border:1.5px solid var(--amber,#F5D547);color:var(--amber,#F5D547);font-size:11px;font-weight:900;border-radius:50%;vertical-align:1px}`;document.head.appendChild(st)}
