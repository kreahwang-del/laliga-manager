// ================= v308 실제 이적 자료 반영(사용자 제공 트랜스퍼마르크트 자료, 개인용 — 상업용은 교체) =================
// 데이터 갱신(work/tmupd/upd.py): 현 소속 583명(2026 여름 이적 등), 계약 만료일 6,230명, 키. 시장가치는 게임 경제에 맞춘 값이라 그대로 둠
// ① 새 게임: 실제 임대 1,023명을 임대 상태로 시작(원 소속 구단 기록, 시즌 말 복귀). 예정 이적(이미 합의된 완전 이적)은 그 날짜에 실행
// ② 기존 세이브: 소속·계약이 바뀐 선수는 예전 값 유지(진행 중인 게임이 갑자기 바뀌지 않게)
// ③ 선수 정보 창: 최근 이적 기록(날짜·구단·방식·이적료)
function tm308Start(){if(!S)return;const T=G.tm308||{};S.mig308=1;let n=0;
  for(const id in (T.loan0||{})){const [par,end]=T.loan0[id];if(!BASE[id]||!CLUBS[par])continue;const q=S.ps[id]=S.ps[id]||{};if(q.loanFrom!=null)continue;q.loanFrom=par;q.lnEnd=end;n++}
  S.pre308=(T.pre||[]).map(x=>x.slice());if(n)SQC=null;
  /* 시작 정리: 소속 갱신·빠진 선수 추가로 30명·외국인 한도를 넘은 AI 구단을 바로 정리(이적시장 하루 1명 규칙을 시작 시점에 몰아서 실행) */
  /* v309: 1군 30명·외국인 한도는 2군으로 내려서 맞추고(계약 유지), 보유 40명을 넘는 구단만 정리 */
  try{CLUBS.forEach(c=>{if(c&&c.i!==S.club&&c.i>=0)resAssignAI(c.i)});SQC=null;if(regOver(S.club))resAssignAI(S.club)}catch(e){console.error(e)}
  const _w=winNow,_nw=S.news.slice();try{winNow=()=>true;/* 시작일(7/1)은 이적시장 시작 전이라 잠깐 열린 것으로 봄 */for(let k=0;k<20;k++){S.aiSqD=null;S.aiDomD=null;if(typeof aiSqTrimDay==='function')aiSqTrimDay()}}catch(e){console.error(e)}finally{winNow=_w;S.news=_nw;/* 시작 정리 소식은 남기지 않음 */S.aiSqD=null;S.aiDomD=null;SQC=null}
  return n}
function mig308(){if(!S||S.mig308)return;S.mig308=1;const P=(G.tm308||{}).prev||{};let n=0;
  for(const id in P){if(!BASE[id])continue;const [c,ce]=P[id];const q=S.ps[id]=S.ps[id]||{};if(q.club===undefined&&c!==BASE[id].club){q.club=c;n++}if(q.cEnd===undefined&&ce&&ce!==BASE[id].cEnd)q.cEnd=ce}
  SQC=null;return n}
function pre308Day(){if(!S||!S.pre308||!S.pre308.length)return;const keep=[];
  for(const x of S.pre308){const [id,to,d,fee]=x;if(d>S.date){keep.push(x);continue}const from=clubOf(id);
    if(from===to||from===S.club||to===S.club||from===RET||!CLUBS[to])continue;/* 사용자 구단이 걸리면 실행하지 않음 */
    try{completeTransfer(id,to,fee||0,{});const p=pl(id);S.news.unshift({d:S.date,t:`${p.name}: ${from>=0?CLUBS[from].name:'자유계약'} → ${CLUBS[to].name} (사전 합의 이적)`,v:fee||0})}catch(e){console.error(e)}}
  S.pre308=keep}
{const _sg=startGame;startGame=function(){const r=_sg.apply(this,arguments);try{tm308Start()}catch(e){console.error(e)}return r}}
{const _dl=devLoad;devLoad=function(){const r=_dl.apply(this,arguments);try{mig308()}catch(e){console.error(e)}return r}}
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);try{pre308Day()}catch(e){console.error(e)}return r}}
// 선수 정보 창: 이적 기록
function tfhHTML(id){const H=G.tfh&&G.tfh.h&&G.tfh.h[id];if(!H||!H.length)return '';const N=G.tfh.n;const ty={T:'이적',F:'자유 이적',L:'임대'};
  const rows=H.slice().reverse().map(([d,f,t,k,fee])=>`<div class="attr" style="grid-template-columns:62px 1fr auto"><span class="note" style="margin:0">${d.slice(0,7)}</span><span style="font-size:13px">${esc(N[f])} → ${esc(N[t])}</span><b style="font-size:12px">${k==='T'&&fee?money(fee):ty[k]}</b></div>`).join('');
  return `<h2>이적 기록</h2>${rows}<p class="note">실제 기록(2026년 11월까지, 유스 내부 이동·임대 복귀 제외)</p>`}
{const _ps=playerSheet;playerSheet=function(id){const r=_ps.apply(this,arguments);try{const h=tfhHTML(id);const sh=document.querySelector('#scrim .sheet');if(h&&sh)sh.insertAdjacentHTML('beforeend',h)}catch(e){console.error(e)}return r}}
