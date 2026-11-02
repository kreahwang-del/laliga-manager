// ================= v277 이적시장 밖 판매 = 사전 합의(사용자 지적 2026-11-02: "이적시장이 아닌데 판매하자마자 바로 그쪽으로 가버림") =================
// 이적설·바이아웃·이적 요청 제안은 시장 밖에서도 오는데, 수락하면 즉시 completeTransfer → 시장 밖에서도 선수가 바로 떠났음
// → 우리 선수가 다른 구단으로 가는 이적·임대는 시장이 닫혀 있으면 '사전 합의'로 저장하고 다음 이적시장 개장일에 실행(그때까지 우리 팀에서 뜀, 이적료도 그때 입금)
function tfPendOf(id){return (S.tfPend||[]).find(x=>x.id===id)}
{const _ct=completeTransfer;completeTransfer=function(id,to,fee,o){try{const from=clubOf(id);if(from===S.club&&to!==S.club&&typeof winNow==='function'&&!winNow()&&!(o&&o.__now)&&to!==FA&&to!==RET){const nw=nextWin();const d=nw?nw.from:null;
      S.tfPend=S.tfPend||[];if(!tfPendOf(id)){S.tfPend.push({id,to,fee,o:Object.assign({},o||{}),d,at:S.date});const p=pl(id);try{inbox('window','',`${p.name} ${CLUBS[to].short||CLUBS[to].name} 이적 합의`,`이적시장이 닫혀 있어 ${d?fmtD(d)+' 이적시장 개장일':'다음 이적시장'}에 이적합니다. 그때까지 우리 팀에서 뛰고, 이적료 ${money(fee||0)}도 그때 들어옵니다.`)}catch(e){}try{toast(`이적 합의 · ${d?fmtD(d):'다음 이적시장'}에 이적`)}catch(e){}}return}}catch(e){console.error(e)}return _ct.apply(this,arguments)}}
function tfPendRun(){try{if(!S.tfPend||!S.tfPend.length||!winNow())return;const L=S.tfPend;S.tfPend=[];L.forEach(x=>{try{if(clubOf(x.id)!==S.club)return;completeTransfer(x.id,x.to,x.fee,Object.assign({},x.o,{__now:1}));const p=pl(x.id);inbox('window','',`${p.name} 이적 완료`,`${CLUBS[x.to].name}로 이적했습니다.${x.fee?` 이적료 ${money(x.fee)}`:''}`)}catch(e){console.error(e)}})}catch(e){console.error(e)}}
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);try{tfPendRun()}catch(e){}return r}}
/* 선수 목록·상세에 '이적 합의' 표시 */
{const _pn=typeof playerSheet==='function'?playerSheet:null;if(_pn){playerSheet=function(id){const r=_pn.apply(this,arguments);try{const x=tfPendOf(typeof id==='object'?id.id:id);if(x){const sh=document.querySelector('#scrim .sheet');if(sh&&!sh.querySelector('.tfpd'))sh.insertAdjacentHTML('afterbegin',`<div class="warnline tfpd" style="margin:0 0 8px">${esc(CLUBS[x.to].name)} 이적 합의 · ${x.d?fmtD(x.d):'다음 이적시장'}에 이적</div>`)}}catch(e){}return r}}}

// ================= v277 이적 예산 ↔ 연봉 한도 전환(사용자 승인 2026-11-02 "이적료는 있는데 연봉 때문에 영입 못 함" → FM 방식) =================
// v159 이사회 요청(시즌 1회 +5%/+10%, 3년치 비용)을 대체: 이번 시즌 동안 €1M 단위로 자유롭게 1:1 전환(이적 예산 €1M → 연봉 한도 +€1M/년), 반대도 가능(남는 연봉 여유 → 이적 예산)
// 전환 폭: 이사회 신뢰도 60 이상 시즌 시작 한도의 ±40%, 45~59 ±25%, 45 미만 ±10%. 시즌 결산 전에 전환분을 되돌린 뒤 매출 기준으로 다음 시즌 한도를 다시 정함
function wxLim(){const t=S.me?S.me.trust:60;const base=CLUBS[S.club].wageCap-wxAdd();return Math.floor(base*(t>=60?.4:t>=45?.25:.1))}
function wxAdd(){const x=S.wcx;return x&&x.c===S.club&&x.y===S.season?x.add:0}
function wxMove(m){/* m(€M): +면 이적 예산 → 연봉 한도, −면 반대 */try{const c=S.club,cur=wxAdd(),lim=wxLim();let nv=Math.max(-lim,Math.min(lim,cur+m));let d=nv-cur;if(!d)return toast('이번 시즌 전환 한도에 도달했습니다');
  if(d>0&&S.fin.budget<d*1e6){d=Math.floor(S.fin.budget/1e6);if(d<=0)return toast('이적 예산이 부족합니다')}
  if(d<0){const room=(CLUBS[c].wageCap*1e6-wageBill(c))/1e6;const mx=Math.floor(room);if(mx<=0)return toast('남는 연봉 여유가 없습니다');d=Math.max(d,-mx)}
  nv=cur+d;wcSet(c,CLUBS[c].wageCap+d);S.wcx={c,y:S.season,add:nv};S.fin.budget-=d*1e6;S.fin.log.unshift({d:S.date,t:d>0?`이적 예산 → 연봉 한도 ${money(d*1e6)}`:`연봉 한도 → 이적 예산 ${money(-d*1e6)}`,v:-d*1e6});save();return d}catch(e){console.error(e)}}
/* 시즌 결산: 전환분을 먼저 되돌림 */
{const _fe=finSeasonEnd;finSeasonEnd=function(){try{const a=wxAdd();if(a&&!(S.fin.ps&&S.fin.ps.done)){wcSet(S.club,CLUBS[S.club].wageCap-a);S.wcx=null}}catch(e){console.error(e)}return _fe.apply(this,arguments)}}
function wxCard(){const c=S.club,cap=CLUBS[c].wageCap*1e6,wb=wageBill(c),a=wxAdd(),lim=wxLim();
  const b=(m,l)=>`<button class="chip" data-wx="${m}" style="flex:1;justify-content:center">${l}</button>`;
  return `<div class="card pad wxc" style="margin-top:10px"><div class="lbl">이적 예산 ↔ 연봉 한도</div>
   <p class="note" style="margin:4px 0 8px">이번 시즌 동안 1:1로 옮깁니다(이적 예산 €1M = 연봉 한도 €1M/년). 시즌 결산 때 원래대로 돌아가고 매출로 다시 정해집니다.</p>
   <div class="li" style="padding:4px 0"><span class="nm"><b>연봉 한도</b><span>지출 ${money(wb)} · 여유 ${money(cap-wb)}</span></span><span class="num">${money(cap)}</span></div>
   <div class="li" style="padding:4px 0"><span class="nm"><b>이적 예산</b><span>이번 시즌 전환 ${a>0?'+':''}${money(a*1e6)} (가능 ±${money(lim*1e6)})</span></span><span class="num">${money(S.fin.budget)}</span></div>
   <div class="lbl" style="margin-top:6px">연봉 한도로 옮기기</div><div style="display:flex;gap:6px">${b(1,'+€1M')}${b(5,'+€5M')}${b(10,'+€10M')}</div>
   <div class="lbl" style="margin-top:6px">이적 예산으로 되돌리기</div><div style="display:flex;gap:6px">${b(-1,'−€1M')}${b(-5,'−€5M')}${b(-10,'−€10M')}</div></div>`}
{const _fs=finSheet;finSheet=function(){const r=_fs.apply(this,arguments);try{if(S.club<0)return r;const sh=document.querySelector('#scrim .sheet');if(!sh)return r;
  /* 예전 이사회 요청 카드 대신 */[...sh.querySelectorAll('.card.pad')].forEach(d=>{const l=d.querySelector('.lbl');if(l&&/연봉 총액 한도 늘리기/.test(l.textContent))d.remove()});
  const h=document.createElement('div');h.innerHTML=wxCard();const lbl=[...sh.querySelectorAll('.lbl')].find(l=>/연봉 총액/.test(l.textContent));const anchor=lbl?lbl.nextElementSibling:null;(anchor&&anchor.parentNode?anchor:sh.lastElementChild).after(h.firstElementChild)}catch(e){console.error(e)}return r}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-wx],[data-wxneed]');if(!b)return;e.preventDefault();e.stopPropagation();
  if(b.dataset.wx){const d=wxMove(+b.dataset.wx);if(d){const y=(document.querySelector('#scrim .sheet')||{}).scrollTop||0;closeSheet();finSheet();const sh=document.querySelector('#scrim .sheet');if(sh)sh.scrollTop=y;toast(d>0?`연봉 한도 +${money(d*1e6)}`:`이적 예산 +${money(-d*1e6)}`)}return}
  const need=+b.dataset.wxneed,id=+b.dataset.wxid;const d=wxMove(need);if(d){closeSheet();offerSheet(id);toast(`이적 예산 ${money(d*1e6)} → 연봉 한도`)}},true);
/* 영입 협상 화면: 연봉 한도에 막히면 그 자리에서 옮기기 */
{const _os=offerSheet;offerSheet=function(id){const r=_os.apply(this,arguments);try{const O=UI.off;const sh=document.querySelector('#scrim .sheet');if(!O||!sh||O.id!==id)return r;const p=pl(id);const w=O.loan?(p.wage||0)*(O.share||100)/100:(O.wage||0);
  const room=CLUBS[S.club].wageCap*1e6-wageBill(S.club);if(w>room){const need=Math.ceil((w-room)/1e6);const lim=wxLim()-wxAdd();const can=need<=lim&&S.fin.budget>=need*1e6;
   const fa=sh.querySelector('.facts');const html=`<div class="warnline" style="margin:6px 0">연봉 한도가 ${money(w-room)} 모자랍니다. ${can?`<button class="btn sm" data-wxneed="${need}" data-wxid="${id}" style="margin-top:6px;width:100%">이적 예산 ${money(need*1e6)} → 연봉 한도로 옮기기</button>`:`이번 시즌 전환 가능액(${money(Math.max(0,lim)*1e6)})이나 이적 예산이 부족합니다.`}</div>`;
   (fa||sh.firstElementChild).insertAdjacentHTML('afterend',html)}}catch(e){console.error(e)}return r}}
