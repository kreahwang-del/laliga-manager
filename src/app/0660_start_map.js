// ================= 시작 화면: 세계 지도에서 나라 → 리그 → 구단(v73, '월드 풋볼매니저') =================
//  · 지도: Natural Earth(world-atlas) 국경, 리그가 있는 나라만 색칠·선택 가능. 끌어서 이동·두 손가락/버튼으로 확대
//  · 영국은 잉글랜드(1·2부)·스코틀랜드를 함께 보여 줌
const CC_LG={'724':['ES','ES2'],'826':['EN','EN2','SC'],'380':['IT','IT2'],'276':['DE','DE2'],'250':['FR','FR2'],'620':['PT'],'528':['NL'],'056':['BE'],'792':['TR'],'756':['CH'],'040':['AT'],'208':['DK'],'410':['KR'],'392':['JP'],'156':['CN'],'682':['SA'],'840':['US'],'484':['MX'],'032':['AR'],'076':['BR']};
const CC_NM={'724':'스페인','826':'잉글랜드·스코틀랜드','380':'이탈리아','276':'독일','250':'프랑스','620':'포르투갈','528':'네덜란드','056':'벨기에','792':'튀르키예','756':'스위스','040':'오스트리아','208':'덴마크','410':'대한민국','392':'일본','156':'중국','682':'사우디아라비아','840':'미국','484':'멕시코','032':'아르헨티나','076':'브라질'};
const CC_ORD=['724','826','380','276','250','620','528','056','792','756','040','208','410','392','156','682','840','484','032','076'];
UI.scc=UI.scc||'724';UI.mapVB=UI.mapVB||null;
function mapVB(){return UI.mapVB||[466,86,140,80.5]} /* 처음엔 유럽 쪽을 크게 */
function mapSVG(){const W=WMAP,vb=mapVB(),k=vb[2]/1000;const sel=UI.scc;
  const cs=Object.keys(W.c).map(id=>`<path d="${W.c[id]}" data-cc="${id}" class="mc${id===sel?' on':''}"/>`).join('');
  const lb=Object.keys(W.ctr).map(id=>{const [x,y]=W.ctr[id];const nm=CC_NM[id].split('·')[0];return `<g data-cc="${id}" class="ml"><circle cx="${x}" cy="${y}" r="${(id===sel?4.2:3)*k*3}"/><text x="${x}" y="${y-5*k*3}" font-size="${11*k*3}">${esc(nm)}</text></g>`}).join('');
  return `<svg id="wmap" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid meet"><rect x="-500" y="-500" width="2000" height="1500" class="msea"/><path d="${W.bg}" class="mbg"/>${cs}${lb}</svg>`}
function clubRows(ids,mode){const row=c=>{const sq=squadOfBase(c).sort((a,b)=>b.ovr-a.ovr).slice(0,16);return {i:c,avg:sq.length?Math.round(sq.reduce((a,p)=>a+p.ovr,0)/sq.length):60,star:sq[0]}};
  let L=ids.filter(c=>!/ B$|\(B\)/.test(CLUBS[c].name)).map(row).sort((a,b)=>b.avg-a.avg);if(mode==='challenge')L=L.slice(-Math.min(10,Math.ceil(L.length/2)));
  return L.map(t=>`<button data-new="${t.i}">${crest(t.i)}<span><b>${esc(CLUBS[t.i].name)}</b><small>${mode==='challenge'?'요구 평판 '+reqRep(t.i)+' · ':''}${t.star?'에이스 '+esc(t.star.name)+' · ':''}이적 예산 ${mM(CLUBS[t.i].budget)}</small></span><span class="ovr num ${ovrCls(t.avg)}">${t.avg}</span></button>`).join('')}
startView=function(){const saved=loadSave();const mode=UI.mode||'club';const cc=CC_LG[UI.scc]?UI.scc:'724';const lgs=CC_LG[cc];const lg=lgs.includes(UI.slg)?UI.slg:lgs[0];
  const ids=CLUBS.filter(c=>c&&c.lg===lg).map(c=>c.i);
  return `<main class="wrap"><section class="hero"><div class="eyebrow">26개 리그 · 2026-27</div><h1>월드 풋볼매니저</h1>
  <p>지도에서 나라를 고르고, 리그와 구단을 선택하세요. 고른 나라 리그는 2D 엔진으로, 나머지 리그는 빠른 계산으로 함께 진행됩니다. 2026년 7월 1일 프리시즌부터 시작합니다.</p></section>
  ${saved?`<button class="btn" data-act="resume">이어하기 · ${esc(saved.me?saved.me.name+' · ':'')}${esc(CLUBS[saved.club]?CLUBS[saved.club].name:'')} · ${fmtD(saved.date)}</button><p class="note">새 게임을 시작하면 저장된 진행은 지워집니다.</p>`:''}
  <h2>감독 이름</h2><input id="mgname" class="inp" maxlength="16" placeholder="이름을 입력하세요" value="${esc(UI.nm||'')}" style="width:100%;padding:12px;border-radius:10px;border:1px solid var(--line);background:var(--surf);color:var(--text);font-size:16px">
  <h2>시작 방식</h2><div class="chips"><button class="chip" data-mode="club" aria-pressed="${mode==='club'}">구단 선택</button><button class="chip" data-mode="challenge" aria-pressed="${mode==='challenge'}">도전 모드</button></div>
  <p class="note" style="margin-top:6px">${mode==='club'?'원하는 구단에 바로 부임합니다. 평판은 그 구단 요구 수준에서 시작합니다.':'평판 22의 무명 감독으로 시작합니다. 고른 리그의 약체 구단 중 한 곳에 부임합니다.'}</p>
  <h2>나라 선택</h2><div class="wmapw">${mapSVG()}<div class="mzoom"><button data-mz="in" aria-label="확대">＋</button><button data-mz="out" aria-label="축소">－</button><button data-mz="eu">유럽</button><button data-mz="w">세계</button></div></div>
  <div class="tabs" style="margin:8px 0;overflow-x:auto;white-space:nowrap">${CC_ORD.map(x=>`<button data-scc="${x}" aria-selected="${x===cc}">${esc(CC_NM[x].split('·')[0])}</button>`).join('')}</div>
  <h2>${esc(CC_NM[cc])}</h2>${lgs.length>1?`<div class="tabs" style="margin-bottom:8px">${lgs.map(x=>`<button data-slg="${x}" aria-selected="${x===lg}">${esc(LGN[x]||x)}</button>`).join('')}</div>`:`<p class="note" style="margin:-4px 0 6px">${esc(LGN[lg]||lg)}</p>`}
  <div class="pick">${clubRows(ids,mode)}</div>
  ${lg!=='ES'&&lg!=='ES2'?'<p class="note" style="margin-top:6px">스페인 외 리그 감독은 게임이 만든 감독입니다.</p>':''}
  <h2>저장 파일 불러오기</h2><div class="card pad"><button class="btn sm ghost" data-sv="imp">백업 파일에서 이어하기</button></div>
  <div class="chips" style="margin-top:14px"><button class="chip" data-imgtog aria-pressed="${IMG.on}">선수 사진·로고 표시 ${IMG.on?'켬':'끔'}</button></div>
  <p class="note" style="margin-top:18px;line-height:1.6">숫자는 상위 16명 평균 능력치. 선수 능력치: EA FC27·5대 리그 FBref 기록 기반, 시장가치·계약: Transfermarkt 공개 데이터셋, 지도: Natural Earth. 연봉·바이아웃 일부는 추정치입니다.</p></main>`};
/* 지도 조작: 나라 누르기(조금만 움직였을 때), 끌어서 이동, 두 손가락 확대, 버튼 확대·축소 */
(function(){let P=new Map(),start=null,moved=0,pinch=null;const svgEl=()=>document.getElementById('wmap');
  const toVB=(e,vb,r)=>[vb[0]+(e.clientX-r.left)/r.width*vb[2],vb[1]+(e.clientY-r.top)/r.height*vb[3]];
  const clampVB=vb=>{const w=Math.max(40,Math.min(1000,vb[2])),h=w*.575;return [Math.max(-100,Math.min(1100-w,vb[0])),Math.max(-60,Math.min(560-h,vb[1])),w,h]};
  const apply=vb=>{UI.mapVB=clampVB(vb);const s=svgEl();if(s)s.setAttribute('viewBox',UI.mapVB.join(' '))};
  document.addEventListener('pointerdown',e=>{const s=e.target.closest&&e.target.closest('#wmap');if(!s)return;P.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;start={vb:mapVB().slice(),x:e.clientX,y:e.clientY};
    if(P.size===2){const [a,b]=[...P.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),vb:mapVB().slice(),cx:(a.x+b.x)/2,cy:(a.y+b.y)/2}}try{s.setPointerCapture(e.pointerId)}catch(_){}},true);
  document.addEventListener('pointermove',e=>{if(!P.has(e.pointerId))return;const s=svgEl();if(!s)return;P.set(e.pointerId,{x:e.clientX,y:e.clientY});const r=s.getBoundingClientRect();
    if(P.size>=2&&pinch){const [a,b]=[...P.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);const f=pinch.d/Math.max(10,d);const vb=pinch.vb;const c=toVB({clientX:pinch.cx,clientY:pinch.cy},vb,r);const w=vb[2]*f,h=vb[3]*f;apply([c[0]-(c[0]-vb[0])*f,c[1]-(c[1]-vb[1])*f,w,h]);moved=99;return}
    if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;moved=Math.max(moved,Math.abs(dx)+Math.abs(dy));if(moved<6)return;const vb=start.vb;apply([vb[0]-dx/r.width*vb[2],vb[1]-dy/r.height*vb[3],vb[2],vb[3]])},true);
  const end=e=>{if(!P.has(e.pointerId))return;P.delete(e.pointerId);if(P.size<2)pinch=null;if(P.size===0){if(moved<6){const t=document.elementFromPoint(e.clientX,e.clientY);const g=t&&t.closest&&t.closest('[data-cc]');if(g&&CC_LG[g.dataset.cc]){UI.scc=g.dataset.cc;UI.slg=CC_LG[UI.scc][0];render();setTimeout(()=>{const h=[...document.querySelectorAll('h2')].find(x=>x.textContent===CC_NM[UI.scc]);if(h)h.scrollIntoView({behavior:'smooth',block:'start'})},60)}}start=null}};
  document.addEventListener('pointerup',end,true);document.addEventListener('pointercancel',end,true);
  document.addEventListener('wheel',e=>{const s=e.target.closest&&e.target.closest('#wmap');if(!s)return;e.preventDefault();const r=s.getBoundingClientRect(),vb=mapVB(),c=toVB(e,vb,r),f=e.deltaY>0?1.15:1/1.15;apply([c[0]-(c[0]-vb[0])*f,c[1]-(c[1]-vb[1])*f,vb[2]*f,vb[3]*f])},{passive:false,capture:true});
  document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-mz],[data-scc]');if(!b)return;e.stopPropagation();
    if(b.dataset.scc){UI.scc=b.dataset.scc;UI.slg=CC_LG[UI.scc][0];const c=WMAP.ctr[UI.scc];if(c){const vb=mapVB();apply([c[0]-vb[2]/2,c[1]-vb[3]/2,vb[2],vb[3]])}render();return}
    const z=b.dataset.mz,vb=mapVB();if(z==='w')apply([0,0,1000,575]);else if(z==='eu')apply([466,86,140,80.5]);else{const f=z==='in'?1/1.5:1.5,cx=vb[0]+vb[2]/2,cy=vb[1]+vb[3]/2;apply([cx-vb[2]*f/2,cy-vb[3]*f/2,vb[2]*f,vb[3]*f])}},true)})();
/* 지도 스타일 */
(function(){const st=document.createElement('style');st.textContent=`.wmapw{position:relative;border-radius:14px;overflow:hidden;border:1px solid var(--line);background:var(--surf)}
#wmap{display:block;width:100%;height:auto;aspect-ratio:2/1.15;touch-action:none;cursor:grab;user-select:none}
#wmap .msea{fill:#0f1d29}#wmap .mbg{fill:#1f2a33;stroke:#0f1d29;stroke-width:.3}
#wmap .mc{fill:#3b5566;stroke:#0f1d29;stroke-width:.4;cursor:pointer}#wmap .mc.on{fill:var(--amber)}
#wmap .ml circle{fill:var(--amber);stroke:#0f1d29;stroke-width:.4}#wmap .ml text{fill:#e9eef2;text-anchor:middle;font-weight:600;paint-order:stroke;stroke:#0f1d29;stroke-width:.25em;pointer-events:none}
.hero h1{word-break:keep-all}.mzoom{position:absolute;right:8px;top:8px;display:flex;gap:6px}.mzoom button{min-width:40px;height:36px;border-radius:10px;border:1px solid var(--line);background:rgba(13,19,24,.85);color:var(--text);font-size:15px;font-weight:600;padding:0 8px}`;document.head.appendChild(st)})();
/* v189: 시작 화면 버전 표시 */
{const _sv2=startView;startView=function(){const h=_sv2.apply(this,arguments);if(typeof verTag!=='function')return h;const k=h.lastIndexOf('</main>');return k>=0?h.slice(0,k)+verTag()+h.slice(k):h+verTag()}}


