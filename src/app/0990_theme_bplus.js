// ================= 디자인 B+ 2단계: 경기 화면 중계 그래픽(스코어버그 색·GOAL 띠·모멘텀 막대) =================
// 원칙: 기존 DOM·id·class·data-* 는 건드리지 않고 '덧붙이기'만 함. 이 파일을 빼면 기능은 그대로.
// 1) 경기 시작 시 #match 에 두 팀 색(--hc·--ac)과 글자색을 CSS 변수로 넣어 스코어버그 띠를 칠함
// 2) 골 이벤트가 중계에 뜰 때 피치 위로 GOAL 띠가 지나감(2.4초, 동작 줄이기 설정이면 생략)
// 3) 스코어버그 아래 모멘텀 막대: 최근 10분 xG 비중(기록이 없으면 점유율)
{
  /* 플레이테스트 반영: 글자색은 WCAG 대비로 흰색/검정 중 높은 쪽, 색을 못 읽으면(hsl) 흰색 */
  const bpRgb=c=>{const m=String(c).trim().match(/^#([0-9a-f]{6})$/i);if(m){const n=parseInt(m[1],16);return [n>>16,(n>>8)&255,n&255]}const k=String(c).match(/^hsl\((\d+)\s+(\d+)%\s+(\d+)%\)$/);if(k){const h=+k[1]/360,sa=+k[2]/100,l=+k[3]/100;const q=l<.5?l*(1+sa):l+sa-l*sa,p=2*l-q;const f=t=>{t=(t+1)%1;return Math.round(255*(t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p))};return [f(h+1/3),f(h),f(h-1/3)]}return null};
  const bpLum=rgb=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(rgb[0])+.7152*f(rgb[1])+.0722*f(rgb[2])};
  const bpInk=c=>{const rgb=bpRgb(c);if(!rgb)return '#fff';const L=bpLum(rgb);return (L+.05)/(.0074+.05)>1.05/(L+.05)?'#0A0B0D':'#fff'};
  const bpNear=(a,b)=>{const x=bpRgb(a),y=bpRgb(b);if(!x||!y)return a===b;return Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2])<90};
  /* 재확인 반영: 긴 정식 구단명은 앞의 공통 단어만 남아 구분이 안 됨 → 'Football Club'·'Club Atlético' 같은 공통어를 빼고, 그래도 20자 넘으면 3글자 약칭(정식명은 title로 보존) */
  const BP_GEN=/\b(Football Club|Futebol Clube|Fútbol Club|Club Atlético|Clube Atlético|Clube de Regatas|Clube|Club Deportivo|Asociación Atlética|Asociación|Associação|Sociedade Esportiva|Esporte Clube|Sport Club|Club Social y Deportivo|Club Social|Club de Fútbol|Club|FC|CF|SC|AC|CA|CD|SD|UD|AFC|Inc\.|Ltd\.|Co\.)\b\.?/gi;
  const bpDisp=n=>{if(n.length<=16)return n;const t=n.replace(BP_GEN,' ').replace(/\s+/g,' ').trim().replace(/^(de|do|da|del|dos|das|of)\s+/i,'');if(t&&t.length<=20)return t;const sh=(CLUBS.find(c=>c&&c.name===n)||{}).short;return sh||t.slice(0,18)+'…'};
  const bpCol=c=>{try{return clubCol(c)}catch(e){return ['#2E6B5E','#4A3F7A']}};
  function bpMatchInit(){const d=document.getElementById('match');if(!d||!M||!M.fx)return;
    const h=bpCol(M.fx.h)[0];let a=bpCol(M.fx.a)[0];if(bpNear(h,a)){const a2=bpCol(M.fx.a)[1];a=a2&&!bpNear(h,a2)?a2:'#3A3E45'}d.classList.add('bp');
    /* 팀 이름을 span으로 감싸 2줄 말줄임·순위 줄 배치(글자는 그대로) */d.querySelectorAll('.board>.team').forEach(t=>{[...t.childNodes].forEach(n=>{if(n.nodeType===3&&n.textContent.trim()){const sp=document.createElement('span');sp.className='bpnm';const full=n.textContent.trim();const dn=bpDisp(full);sp.textContent=dn;if(dn!==full)sp.title=full;t.replaceChild(sp,n)}})});d.style.setProperty('--hc',h);d.style.setProperty('--ac',a);d.style.setProperty('--hink',bpInk(h));d.style.setProperty('--aink',bpInk(a));
    const b=d.querySelector('.board');if(b&&!d.querySelector('.bpmom'))b.insertAdjacentHTML('afterend',`<div class="bpmom" aria-label="최근 10분 흐름(왼쪽 ${esc(CLUBS[M.fx.h].short||'')} · 오른쪽 ${esc(CLUBS[M.fx.a].short||'')})"><span class="l">흐름</span><span class="tm" style="color:var(--hc2,var(--text))">${esc(CLUBS[M.fx.h].short||'')}</span><div class="bar2"><i style="width:50%"></i></div><span class="tm">${esc(CLUBS[M.fx.a].short||'')}</span><span class="r">최근 10분</span></div>`/* v262 사용성 점검: 막대 양끝이 어느 팀인지 표시 */);
    setTimeout(()=>{try{d.querySelectorAll('.board .mrk').forEach(e=>{const t=e.textContent;const m=t.match(/(\d+위\s*·\s*-?\d+점)\s*$/);if(m&&!e.title){e.title=t;e.textContent=m[1]}})}catch(_){}},0);
    M.bpH=[]}
  function bpMom(){const d=document.getElementById('match');if(!d||!M||!M.m||M.done)return;const el=d.querySelector('.bpmom i');if(!el)return;const st=M.m.st,mn=M.m.min;
    const H=M.bpH||(M.bpH=[]);if(!H.length||H[H.length-1][0]!==mn)H.push([mn,st.xg[0],st.xg[1],st.pos[0],st.pos[1]]);
    const old=H.find(x=>x[0]>=mn-10)||H[0];const dx0=st.xg[0]-old[1],dx1=st.xg[1]-old[2];let p;
    if(dx0+dx1>.05)p=dx0/(dx0+dx1);else{const q0=st.pos[0]-old[3],q1=st.pos[1]-old[4];p=q0+q1>0?q0/(q0+q1):.5}
    el.style.width=Math.round(Math.max(.06,Math.min(.94,p))*100)+'%'}
  function bpGoal(e){try{if(!e||e.t!=='goal'||(M&&M.skipping))return;if(matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;const w=document.querySelector('#match .m2dw');if(!w)return;
    const old=w.querySelector('.bpgoal');if(old)old.remove();const s=e.s===0?M.fx.h:M.fx.a;
    const g=document.createElement('div');g.className='bpgoal';g.style.setProperty('--gc',bpCol(s)[0]);g.innerHTML=`<b>GOAL</b><span>${esc(typeof shortName==='function'?shortName(e.p||''):(e.p||''))} · ${esc(CLUBS[s].short||'')}</span>`;w.appendChild(g);setTimeout(()=>g.remove(),2600)}catch(_){}}
  {const _sm=startMatch;startMatch=function(){const r=_sm.apply(this,arguments);try{bpMatchInit()}catch(e){console.error(e)}return r}}
  {const _ub=updateBoard;updateBoard=function(){const r=_ub.apply(this,arguments);try{bpMom()}catch(e){}return r}}
  {const _fd=feed;feed=function(e){const r=_fd.apply(this,arguments);bpGoal(e);return r}}
  const st=document.createElement('style');st.textContent=`
#match.bp .board{grid-template-columns:1fr auto 1fr;gap:0;padding:12px 0 0;border-bottom:0;filter:drop-shadow(0 10px 18px rgba(0,0,0,.55))}
#match.bp .board>.team{display:grid;grid-template-columns:22px minmax(0,1fr);grid-auto-rows:auto;column-gap:6px;align-items:center;align-content:center;min-width:0;min-height:54px;padding:4px 8px;font-weight:900;font-size:12.5px;line-height:1.15;text-align:left;overflow:hidden}
#match.bp .board>.team .crest{grid-column:1;grid-row:1/span 2}
#match.bp .board>.team .bpnm{grid-column:2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:keep-all;hyphens:auto}
#match.bp .board>.team .mrk{grid-column:2;display:block;margin:1px 0 0;font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#match.bp .board>.team:first-child{background:var(--hc);color:var(--hink);clip-path:polygon(0 0,100% 0,100% 100%,8px 100%)}
#match.bp .board>.team:last-child{background:var(--ac);color:var(--aink);grid-template-columns:minmax(0,1fr) 22px;text-align:right;clip-path:polygon(0 0,100% 0,calc(100% - 8px) 100%,0 100%)}
#match.bp .board>.team:last-child .crest{grid-column:2}#match.bp .board>.team:last-child .bpnm,#match.bp .board>.team:last-child .mrk{grid-column:1}
#match.bp .board>.team .crest{width:22px;height:22px;font-size:8px}
#match.bp .board>.team .mrk{color:inherit;opacity:.75}
#match.bp .board>div:nth-child(2){background:#0A0B0D;min-width:82px;align-self:stretch;min-height:54px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 8px}
#match.bp .board .score{font-size:34px;line-height:1;color:#fff}
html #match.bp .board .clock{margin-top:2px;font-size:13px;padding:0 10px;background:var(--text);color:var(--bg)}
#match.bp .bpmom{display:flex;align-items:center;gap:8px;height:22px;padding:0 10px;background:#15171B;font-size:11px;color:var(--muted)}
#match.bp .bpmom .bar2{flex:1;height:4px;background:var(--ac);display:flex}#match.bp .bpmom .bar2 i{display:block;height:4px;background:var(--hc);transition:width .6s}
#match.bp .bpmom .l{font-weight:800;letter-spacing:.1em;color:var(--amber)}
.bpmom .tm{font-weight:800;color:var(--text);font-size:11px}
#match.bp .m2dw{position:relative}
.bpgoal{position:absolute;left:0;right:0;bottom:30px;height:44px;display:flex;align-items:center;gap:12px;padding:0 18px;background:linear-gradient(90deg,var(--amber) 0 64%,var(--gc,#2E6B5E) 64%);clip-path:polygon(0 0,100% 0,calc(100% - 14px) 100%,0 100%);animation:bpg 2.5s cubic-bezier(.2,.8,.2,1) forwards;pointer-events:none;z-index:4}
.bpgoal b{font-family:var(--disp);font-size:32px;font-weight:900;font-style:italic;color:#0A0B0D;letter-spacing:.04em}
.bpgoal span{font-weight:900;font-size:14px;color:#0A0B0D;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@keyframes bpg{0%{transform:translateX(-105%)}14%{transform:translateX(0)}84%{transform:translateX(0);opacity:1}100%{transform:translateX(105%);opacity:0}}`;document.head.appendChild(st);
}

// ---- 리포트: 첫 줄(스코어 h3)을 대형 FT 스코어 띠로 보이게 하고, 그 아래에 경기 최우수 링 카드를 덧붙임(기존 줄·버튼은 그대로) ----
{const _rh=reportHTML;reportHTML=function(R){let h=_rh.apply(this,arguments);try{if(!R||!R.sc)return h;const k=h.indexOf('</h3>');if(k<0)return h;
  const top=R.rat&&R.rat[0];const res=R.sc[0]>R.sc[1]?'승리':R.sc[0]<R.sc[1]?'패배':'무승부';const rc=R.sc[0]>R.sc[1]?'var(--good)':R.sc[0]<R.sc[1]?'var(--bad)':'var(--muted)';
  const mom=top?`<div class="bpmom2"><div class="ring" style="--p:${Math.round(Math.min(10,top.r)/10*100)}"><b class="num">${top.r.toFixed(1)}</b></div><div><small>경기 최우수${top.w?' · 상대':''}</small><b>${esc(shortName(top.n))}</b></div><span class="res" style="color:${rc}">${res}</span></div>`:'';
  return '<i class="bprep" hidden></i>'+h.slice(0,k+5)+mom+h.slice(k+5)}catch(e){return h}}}
{const st2=document.createElement('style');st2.textContent=`
.sheet:has(.bprep)>h3:first-of-type{width:calc(100% + 32px);box-sizing:border-box;margin:10px -16px 0;padding:12px 16px;background:#0A0B0D;border-top:1px solid var(--line);border-bottom:3px solid var(--amber);gap:12px!important}
.sheet:has(.bprep)>h3:first-of-type .num{font-size:46px!important;font-weight:900;letter-spacing:.02em}
.sheet:has(.bprep)>h3:first-of-type .num::before{content:'FT';display:inline-block;vertical-align:14px;margin-right:10px;font-size:13px;padding:1px 8px;background:var(--text);color:var(--bg);clip-path:polygon(0 0,100% 0,calc(100% - 5px) 100%,5px 100%)}
.bpmom2{display:flex;align-items:center;gap:12px;margin:10px 0 4px;padding:10px 12px;background:rgba(255,255,255,.04);border-left:3px solid var(--amber)}
.bpmom2 .ring{width:52px;height:52px;border-radius:50%;flex:none;display:grid;place-items:center;background:conic-gradient(var(--amber) calc(var(--p)*1%),rgba(255,255,255,.08) 0)}
.bpmom2 .ring b{width:42px;height:42px;border-radius:50%;background:#111317;display:grid;place-items:center;font-size:19px}
.bpmom2 small{display:block;font-size:11px;letter-spacing:.08em;color:var(--muted)}.bpmom2 div>b{font-size:16px;font-weight:900}
.bpmom2 .res{margin-left:auto;font-weight:900;font-size:15px}`;document.head.appendChild(st2)}

// ---- 홈: 다음 경기 카드를 두 팀 색 사선 분할 'NEXT MATCH' 카드로(마크업·버튼 그대로, 색만 CSS 변수로 주입) ----
{const _hvB=homeView;homeView=function(){let h=_hvB.apply(this,arguments);try{const k=h.indexOf('<section class="card fixture"');if(k<0)return h;
  const seg=h.slice(k,k+4000);const cs=[...seg.matchAll(/class="crest[^"]*" style="background:linear-gradient\(135deg,(.+?) 50%/g)].map(m=>m[1]).slice(0,2);if(cs.length<2)return h;
  return h.slice(0,k)+`<section class="card fixture bpnext" style="--hc:${cs[0]};--ac:${cs[1]}"`+h.slice(k+'<section class="card fixture"'.length)}catch(e){return h}}}
{const st3=document.createElement('style');st3.textContent=`
.fixture.bpnext{position:relative;overflow:hidden;border:0;border-top:3px solid var(--amber);background:linear-gradient(105deg,color-mix(in srgb,var(--hc) 34%,#0A0B0D) 0 49.6%,#0A0B0D 49.6% 50.4%,color-mix(in srgb,var(--ac) 34%,#0A0B0D) 50.4%)}
.fixture.bpnext::before{content:'NEXT MATCH';position:absolute;right:-6px;bottom:-14px;font-family:var(--disp);font-weight:900;font-style:italic;font-size:64px;line-height:1;color:rgba(255,255,255,.05);pointer-events:none}
.fixture.bpnext .md{color:#C9CDD3;font-weight:700;letter-spacing:.04em}
.fixture.bpnext .vs .mid{font-style:italic;font-weight:900;font-size:34px;color:var(--amber)}
.fixture.bpnext .vs .team{font-weight:900}
.banner.closed{border-left:3px solid var(--amber)}.banner .num{font-weight:900;color:var(--amber)}`;document.head.appendChild(st3)}

// ---- 리포트 xG 흐름(시안 ProReport): 경기 이벤트의 슈팅 xG를 슈팅마다 [분, 편, xG]로 리포트에 저장(R.xgs, 경기당 약 25개) → 리포트에 계단 그래프 ----
{const _br=buildReport;buildReport=function(res,me,fx){const R=_br.apply(this,arguments);try{if(R&&res&&res.ev){const o=1-me,B=19,a=[new Array(B).fill(0),new Array(B).fill(0)];
  /* 슈팅 결과 이벤트(골·빗나감·선방·블록). xG가 없는 이벤트(선방·블록 일부)는 평균값으로 넣고, 마지막에 경기 기록 xG(R.xg)에 맞춰 비례 조정 → 모양은 실제 슈팅 시점, 합계는 기록과 일치 */
  const SH=res.ev.filter(e=>['goal','miss','save','block','post'].includes(e.t)&&e.m!=null&&e.type!=='pen');const xs=SH.filter(e=>e.xg!=null).map(e=>+e.xg);const av=xs.length?xs.reduce((p,q)=>p+q,0)/xs.length:.1;
  SH.forEach(e=>{const k=Math.min(B-1,Math.floor(e.m/5));a[e.s===me?0:1][k]+=e.xg!=null?+e.xg:av});
  const tw=[0,0];SH.forEach(e=>{tw[e.s===me?0:1]+=e.xg!=null?+e.xg:av});const f=[tw[0]>0?R.xg[0]/tw[0]:0,tw[1]>0?R.xg[1]/tw[1]:0];
  /* 재점검 반영: 5분 칸 대신 슈팅마다 [분, 편, xG] 저장 → 골 점이 실제 분에 찍힘(경기당 약 25개) */R.xgs=SH.map(e=>{const w=e.s===me?0:1;return [e.m,w,+((e.xg!=null?+e.xg:av)*f[w]).toFixed(3)]}).sort((p,q)=>p[0]-q[0]);delete R.xgf;R.xgfG=res.ev.filter(e=>e.t==='goal'&&e.m!=null).map(e=>[e.m,e.s===me?0:1])}}catch(e){}return R}}
function bpXgChart(R){if(!R||!R.xgs)return '';const W=320,H=110,P=6,mx=Math.max(.5,R.xg[0],R.xg[1]);const X=m=>P+(W-2*P)*Math.min(90,m)/90,Y=v=>H-P-(H-2*P)*v/mx;
  const at=(w,m)=>{let t=0;for(const [mm,ww,x] of R.xgs){if(ww===w&&mm<=m)t+=x}return t};
  const path=w=>{let d=`M${X(0)},${Y(0)}`,t=0;for(const [m,ww,x] of R.xgs){if(ww!==w)continue;t+=x;d+=`H${X(m)}V${Y(t)}`}return d+`H${X(90)}`};
  const gm=(R.xgfG||[]).map(([m,w])=>`<circle cx="${X(m)}" cy="${Y(at(w,m))}" r="3.5" fill="${w===0?'var(--amber)':'#C9CDD3'}" stroke="#0A0B0D" stroke-width="1.5"/>`).join('');
  return `<div class="bpxg"><div class="h"><span>xG 흐름</span><span><i style="background:var(--amber)"></i>우리 ${R.xg[0].toFixed(2)} <i style="background:#C9CDD3"></i>상대 ${R.xg[1].toFixed(2)}</span></div><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="경기 시간대별 누적 기대득점"><line x1="${X(45)}" x2="${X(45)}" y1="${P}" y2="${H-P}" stroke="rgba(255,255,255,.12)" stroke-dasharray="3 3"/><path d="${path(1)}" fill="none" stroke="#C9CDD3" stroke-width="2"/><path d="${path(0)}" fill="none" stroke="var(--amber)" stroke-width="2.5"/>${gm}</svg><div class="ax"><span>0'</span><span>45'</span><span>90'</span></div></div>`}
{const _rhX=reportHTML;reportHTML=function(R){let h=_rhX.apply(this,arguments);try{const c=bpXgChart(R);if(!c)return h;const k=h.indexOf('<div class="bpmom2"');const e=k>=0?h.indexOf('</div></div>',k):-1;
  /* 최우수 카드 바로 다음(없으면 첫 h3 다음)에 넣음 */if(e>=0){const at=h.indexOf('<span class="res"',k);const end=h.indexOf('</div>',at)+6;return h.slice(0,end)+c+h.slice(end)}const j=h.indexOf('</h3>');return j<0?h:h.slice(0,j+5)+c+h.slice(j+5)}catch(err){return h}}}
{const st4=document.createElement('style');st4.textContent=`.bpxg{margin:10px 0 6px;padding:10px 12px 6px;background:rgba(255,255,255,.035);border:1px solid var(--line)}
.bpxg .h{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--muted);margin-bottom:4px}.bpxg .h>span:first-child{font-weight:900;letter-spacing:.1em;color:var(--text)}
.bpxg .h i{display:inline-block;width:10px;height:3px;margin:0 4px 0 8px;vertical-align:3px}.bpxg svg{display:block;width:100%;height:auto}
.bpxg .ax{display:flex;justify-content:space-between;font-size:10.5px;color:var(--faint);font-family:var(--disp)}`;document.head.appendChild(st4)}

// ---- 홈: 다음 경기 승·무·패 예상(사용자 결정 2026-10-30) + 스태프 조언 타일 ----
// 확률은 다른 리그 빠른 계산과 같은 모형(FASTM: 게임 엔진 296경기 포아송 회귀, log λ = a + b·선발 평균 능력 차 ± 홈)으로 계산 → 게임 안 결과와 일관
// 계산 중에는 Math.random을 임시 고정값으로 바꿔 게임의 난수 흐름을 건드리지 않음. 같은 날·같은 경기는 캐시
function bpNextFx(){try{const mn=myNext();const fr=S.friendlies.find(x=>!x.res);return [fr,mn,(typeof cupNextMine==='function'?cupNextMine():null)].filter(Boolean).sort((a,b)=>a.d<b.d?-1:1)[0]||null}catch(e){return null}}
function bpPred(fx){if(!fx||typeof FASTM==='undefined')return null;const key=S.date+'|'+fx.d+'|'+fx.h+'|'+fx.a+'|'+(S.xi||[]).join(',');if(bpPred.k===key)return bpPred.v;
  const R0=Math.random;let out=null;try{Math.random=()=>.5;const H=teamFor(fx.h),A=teamFor(fx.a);if(H&&A&&H.xi&&A.xi){const av=t=>t.xi.reduce((s,p)=>s+effO(p),0)/Math.max(1,t.xi.length);
    const d=av(H)-av(A),a=(typeof divOf==='function'&&divOf(fx.h)===2)?FASTM.a2:FASTM.a,lh=Math.exp(a+FASTM.b*d+FASTM.h),la=Math.exp(a-FASTM.b*d-FASTM.h);
    const P=l=>{const r=[];let p=Math.exp(-l);for(let k=0;k<11;k++){r.push(p);p*=l/(k+1)}return r};const ph=P(lh),pa=P(la);let w=0,dr=0,lo=0;
    for(let i=0;i<11;i++)for(let j=0;j<11;j++){const q=ph[i]*pa[j];if(i>j)w+=q;else if(i===j)dr+=q;else lo+=q}const t=w+dr+lo;
    const me=fx.h===S.club?0:1;const mine=me===0?[w,dr,lo]:[lo,dr,w];
    const us=me===0?H:A,them=me===0?A:H;out={p:mine.map(x=>x/t),us,them,me}}}catch(e){out=null}finally{Math.random=R0}bpPred.k=key;bpPred.v=out;return out}
function bpStaff(pr){try{const T=[];const us=pr.us,th=pr.them;const pct=Math.round(pr.p[0]*100);
  const avg=L=>L.reduce((s,p)=>s+(p.ovr||70),0)/Math.max(1,L.length);const dv=avg(us.xi)-avg(th.xi);
  T.push(['수석코치',dv>=2?`전력은 우리가 앞섭니다(선발 평균 ${avg(us.xi).toFixed(0)} vs ${avg(th.xi).toFixed(0)}). 이길 확률 ${pct}%.`:dv<=-2?`상대 선발이 더 강합니다(${avg(th.xi).toFixed(0)} vs ${avg(us.xi).toFixed(0)}). 승점 1점도 나쁘지 않습니다.`:`비슷한 전력입니다(${avg(us.xi).toFixed(0)} vs ${avg(th.xi).toFixed(0)}). 작은 차이가 승부를 가릅니다.`]);
  const ids=new Set(us.xi.map(p=>p.id));const tired=us.xi.filter(p=>(S.ps[p.id]?.fit??100)<80);const inj=squadOf(S.club).filter(p=>(S.ps[p.id]?.injD||0)>0);
  T.push(['피지컬 코치',tired.length?`선발 중 체력 80% 미만 ${tired.length}명: ${tired.slice(0,2).map(p=>esc(shortName(p.name))).join(', ')}${tired.length>2?' 외':''}. 로테이션을 고려하세요.`:inj.length?`부상자 ${inj.length}명(${inj.slice(0,2).map(p=>esc(shortName(p.name))).join(', ')}${inj.length>2?' 외':''}). 선발 체력은 양호합니다.`:'선발 체력 양호, 부상자 없습니다.']);
  if(typeof decAir==='function'){const oa=decAir(us.xi),da=decAir(th.xi),ad=oa-da;T.push(['분석관',ad>=1.5?`공중볼 우위(${oa.toFixed(1)} vs ${da.toFixed(1)}). 지고 있으면 크로스 공략이 통합니다.`:ad<=-1.5?`공중볼은 상대가 강합니다(${da.toFixed(1)} vs ${oa.toFixed(1)}). 크로스보다 땅볼·중거리가 낫습니다.`:`공중볼은 대등합니다(${oa.toFixed(1)} vs ${da.toFixed(1)}).`])}
  return `<div class="bpstaff">${T.map(([w,t])=>`<div><small>${w}</small><p>${t}</p></div>`).join('')}</div>`}catch(e){return ''}}
{const _hvP=homeView;homeView=function(){let h=_hvP.apply(this,arguments);try{const k=h.indexOf('<section class="card fixture bpnext"');if(k<0)return h;const e=h.indexOf('</section>',k);if(e<0)return h;
  const pr=bpPred(bpNextFx());if(!pr)return h;const [w,d,l]=pr.p.map(x=>Math.round(x*100));const bar=`<div class="bpwdl" aria-label="예상 승 ${w}% 무 ${d}% 패 ${l}%"><div class="b"><i class="w" style="width:${w}%"></i><i class="d" style="width:${d}%"></i><i class="l" style="width:${l}%"></i></div><div class="t"><span>승 <b class="num">${w}%</b></span><span>무 <b class="num">${d}%</b></span><span>패 <b class="num">${l}%</b></span></div><small>전력 기준 예상</small></div>`;
  return h.slice(0,e)+bar+h.slice(e,e+10)+bpStaff(pr)+h.slice(e+10)}catch(err){return h}}}
{const st5=document.createElement('style');st5.textContent=`.bpwdl{position:relative;margin-top:12px}.bpwdl .b{display:flex;height:6px;background:#0A0B0D}.bpwdl .b i{display:block;height:6px}.bpwdl .b .w{background:var(--good)}.bpwdl .b .d{background:#5A6068}.bpwdl .b .l{background:var(--bad)}
.bpwdl .t{display:flex;justify-content:space-between;margin-top:4px;font-size:12px;color:#C9CDD3}.bpwdl .t b{font-size:16px;color:var(--text);margin-left:3px}.bpwdl small{display:block;text-align:center;font-size:10.5px;color:var(--faint);margin-top:2px}
.bpstaff{display:grid;gap:6px;margin-top:10px}.bpstaff>div{background:rgba(255,255,255,.035);border-left:3px solid var(--amber);padding:8px 12px}.bpstaff small{font-size:11px;font-weight:900;letter-spacing:.08em;color:var(--amber)}.bpstaff p{margin:2px 0 0;font-size:13px;line-height:1.45}`;document.head.appendChild(st5)}
/* v262 사용성 점검: 경기 기록 표처럼 가로로 넘치는 표는 오른쪽 끝을 흐리게 해 '옆으로 더 있음'을 알림(끝까지 밀면 사라짐) */
{const pk=()=>{document.querySelectorAll('.pstw').forEach(w=>{const m=w.scrollLeft+w.clientWidth<w.scrollWidth-4;if(w.classList.contains('more')!==m)w.classList.toggle('more',m)})};setInterval(pk,700);document.addEventListener('scroll',e=>{if(e.target&&e.target.classList&&e.target.classList.contains('pstw'))pk()},true);
 const st5=document.createElement('style');st5.textContent=`.pstw.more{-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 28px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 28px),transparent)}`;document.head.appendChild(st5)}
