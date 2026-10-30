// ================= 디자인 B+ 2단계: 경기 화면 중계 그래픽(스코어버그 색·GOAL 띠·모멘텀 막대) =================
// 원칙: 기존 DOM·id·class·data-* 는 건드리지 않고 '덧붙이기'만 함. 이 파일을 빼면 기능은 그대로.
// 1) 경기 시작 시 #match 에 두 팀 색(--hc·--ac)과 글자색을 CSS 변수로 넣어 스코어버그 띠를 칠함
// 2) 골 이벤트가 중계에 뜰 때 피치 위로 GOAL 띠가 지나감(2.4초, 동작 줄이기 설정이면 생략)
// 3) 스코어버그 아래 모멘텀 막대: 최근 10분 xG 비중(기록이 없으면 점유율)
{
  const bpInk=c=>{try{const m=String(c).match(/^#([0-9a-f]{6})$/i);if(!m)return '#fff';const n=parseInt(m[1],16),r=n>>16,g=(n>>8)&255,b=n&255;return (r*299+g*587+b*114)/1000>150?'#0A0B0D':'#fff'}catch(e){return '#fff'}};
  const bpCol=c=>{try{return clubCol(c)}catch(e){return ['#2E6B5E','#4A3F7A']}};
  function bpMatchInit(){const d=document.getElementById('match');if(!d||!M||!M.fx)return;
    const h=bpCol(M.fx.h)[0],a=bpCol(M.fx.a)[0];d.classList.add('bp');d.style.setProperty('--hc',h);d.style.setProperty('--ac',a);d.style.setProperty('--hink',bpInk(h));d.style.setProperty('--aink',bpInk(a));
    const b=d.querySelector('.board');if(b&&!d.querySelector('.bpmom'))b.insertAdjacentHTML('afterend',`<div class="bpmom" aria-label="최근 10분 흐름"><span class="l">흐름</span><div class="bar2"><i style="width:50%"></i></div><span class="r">최근 10분</span></div>`);
    M.bpH=[]}
  function bpMom(){const d=document.getElementById('match');if(!d||!M||!M.m)return;const el=d.querySelector('.bpmom i');if(!el)return;const st=M.m.st,mn=M.m.min;
    const H=M.bpH||(M.bpH=[]);if(!H.length||H[H.length-1][0]!==mn)H.push([mn,st.xg[0],st.xg[1],st.pos[0],st.pos[1]]);
    const old=H.find(x=>x[0]>=mn-10)||H[0];const dx0=st.xg[0]-old[1],dx1=st.xg[1]-old[2];let p;
    if(dx0+dx1>.05)p=dx0/(dx0+dx1);else{const q0=st.pos[0]-old[3],q1=st.pos[1]-old[4];p=q0+q1>0?q0/(q0+q1):.5}
    el.style.width=Math.round(Math.max(.06,Math.min(.94,p))*100)+'%'}
  function bpGoal(e){try{if(!e||e.t!=='goal'||(M&&M.skipping))return;if(matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;const w=document.querySelector('#match .m2dw');if(!w)return;
    const old=w.querySelector('.bpgoal');if(old)old.remove();const s=e.s===0?M.fx.h:M.fx.a;
    w.insertAdjacentHTML('beforeend',`<div class="bpgoal" style="--gc:${bpCol(s)[0]}"><b>GOAL</b><span>${esc(e.p||'')} · ${esc(CLUBS[s].short||'')}</span></div>`);setTimeout(()=>{const g=w.querySelector('.bpgoal');if(g)g.remove()},2600)}catch(_){}}
  {const _sm=startMatch;startMatch=function(){const r=_sm.apply(this,arguments);try{bpMatchInit()}catch(e){console.error(e)}return r}}
  {const _ub=updateBoard;updateBoard=function(){const r=_ub.apply(this,arguments);try{bpMom()}catch(e){}return r}}
  {const _fd=feed;feed=function(e){const r=_fd.apply(this,arguments);bpGoal(e);return r}}
  const st=document.createElement('style');st.textContent=`
#match.bp .board{grid-template-columns:1fr auto 1fr;gap:0;padding:12px 0 0;border-bottom:0;filter:drop-shadow(0 10px 18px rgba(0,0,0,.55))}
#match.bp .board>.team{flex-direction:row;justify-content:space-between;gap:8px;min-width:0;height:54px;padding:0 12px;font-weight:900;font-size:14px;line-height:1.1;text-align:left;overflow:hidden}
#match.bp .board>.team:first-child{background:var(--hc);color:var(--hink);clip-path:polygon(0 0,100% 0,100% 100%,8px 100%)}
#match.bp .board>.team:last-child{background:var(--ac);color:var(--aink);flex-direction:row-reverse;text-align:right;clip-path:polygon(0 0,100% 0,calc(100% - 8px) 100%,0 100%)}
#match.bp .board>.team .crest{width:30px;height:30px;font-size:10px}
#match.bp .board>.team .mrk{color:inherit;opacity:.75}
#match.bp .board>div:nth-child(2){background:#0A0B0D;min-width:104px;height:54px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 8px}
#match.bp .board .score{font-size:40px;line-height:1;color:#fff}
#match.bp .board .clock{margin-top:2px;font-size:13px;padding:0 10px}
#match.bp .bpmom{display:flex;align-items:center;gap:8px;height:22px;padding:0 10px;background:#15171B;font-size:11px;color:var(--muted)}
#match.bp .bpmom .bar2{flex:1;height:4px;background:var(--ac);display:flex}#match.bp .bpmom .bar2 i{display:block;height:4px;background:var(--hc);transition:width .6s}
#match.bp .bpmom .l{font-weight:800;letter-spacing:.1em;color:var(--amber)}
#match.bp .m2dw{position:relative}
.bpgoal{position:absolute;left:0;right:0;top:38%;height:54px;display:flex;align-items:center;gap:12px;padding:0 18px;background:linear-gradient(90deg,var(--amber) 0 64%,var(--gc,#2E6B5E) 64%);clip-path:polygon(0 0,100% 0,calc(100% - 14px) 100%,0 100%);animation:bpg 2.5s cubic-bezier(.2,.8,.2,1) forwards;pointer-events:none;z-index:4}
.bpgoal b{font-family:var(--disp);font-size:40px;font-weight:900;font-style:italic;color:#0A0B0D;letter-spacing:.04em}
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
