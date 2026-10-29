// ================= 이적 협상 강화(v90): 에이전트 수수료 · 바이아웃 조항 · 임대 후 완전 이적 옵션/의무 =================
// 에이전트 수수료 기준: FIFA(2023) 국제 이적 에이전트 수수료 USD 8.88억 / 이적료 USD 96.3억 ≈ 9% → 이적료의 9%.
// 자유계약·사전계약은 이적료가 없으므로 계약금(사이닝 보너스)+수수료로 연봉 요구액의 50%.
// 바이아웃: 스페인 선수 계약은 방출 조항이 의무 — 시장가치 ×1.5/×2.5/×4 중 선택, 높을수록 선수 쪽 연봉 요구 상승(묶어 두는 대가)
const TF_AG={.6:[1.08,'낮게'],1:[1,'요구대로'],1.4:[.95,'넉넉히']},TF_CL={1:[1.5,.97,'낮음'],2:[2.5,1,'보통'],3:[4,1.06,'높음']};
function tfAgreed(id){const n=S.negs[id];return n&&n.agreed||null}
function tfFeeNow(p){const c=clubOf(p.id);const pre=c!==FA&&monthsLeft(p)<=6&&!winNow();const ag=tfAgreed(p.id)||{fee:0};return c===FA||pre||ag.loan?0:(ag.fee||0)}
function tfAgentAsk(p){const f=tfFeeNow(p);const ag=tfAgreed(p.id)||{};if(ag.loan)return Math.round(wageDemand(p,S.club)*.1/1e4)*1e4;return Math.round((f>0?f*.09:wageDemand(p,S.club)*.5)/1e4)*1e4}
function tfOff(){const O=UI.off;if(!O)return null;if(O.ag==null)O.ag=1;if(O.cl==null)O.cl=2;if(O.lopt==null)O.lopt=0;return O}
function tfAgentFee(p,O){return Math.round(tfAgentAsk(p)*(O.ag??1)/1e4)*1e4}
function tfClauseVal(p,lv){return Math.max(1,Math.round(valueNow(p)*TF_CL[lv][0]/1e6))}
// 화면: 개인 조건 단계에 수수료·바이아웃, 구단 단계(임대)에 완전 이적 옵션
{const _os=offerSheet;offerSheet=function(id,step){const r=_os.apply(this,arguments);try{const O=tfOff();if(!O||O.id!==id)return r;const p=pl(id);
  const bt=document.querySelector('[data-act="sendTerms"]');
  if(bt){const ask=tfAgentAsk(p);const ag=tfAgreed(id)||{};
    const h=`<div class="lbl">에이전트 수수료 <span style="font-weight:400">(요구 ${money(ask)}${tfFeeNow(p)>0?' · 이적료의 9%':ag.loan?'':' · 계약금 포함'})</span></div><div class="seg" style="grid-template-columns:repeat(3,1fr)">${[['.6',TF_AG[.6]],['1',TF_AG[1]],['1.4',TF_AG[1.4]]].map(([k,v])=>`<button data-tfo="ag" data-v="${k}" aria-pressed="${+k===O.ag}">${v[1]} ${money(ask*k)}</button>`).join('')}</div>
      ${ag.loan?'':`<div class="lbl">바이아웃 조항</div><div class="seg" style="grid-template-columns:repeat(3,1fr)">${Object.entries(TF_CL).map(([k,v])=>`<button data-tfo="cl" data-v="${k}" aria-pressed="${+k===O.cl}">${v[2]} €${tfClauseVal(p,+k)}M</button>`).join('')}</div>`}
      <p class="note">수수료를 낮게 주면 선수 측 연봉 요구가 약 8% 오르고, 넉넉히 주면 약 5% 내려갑니다. 바이아웃을 높게 걸면 다른 구단이 빼 가기 어렵지만 연봉 요구가 약 6% 오릅니다. 수수료는 영입 때 이적 예산에서 바로 나갑니다.</p>`;
    bt.insertAdjacentHTML('beforebegin',h)}
  const bo=document.querySelector('[data-act="sendOffer"]');
  if(bo&&O.loan){const ask=asking(p,S.club);if(O.lfee==null)O.lfee=Math.round(ask/1e6)*1e6;
    const h=`<div class="lbl">완전 이적 조항</div><div class="seg" style="grid-template-columns:repeat(3,1fr)">${[[0,'없음'],[1,'구매 옵션'],[2,'구매 의무']].map(([v,l])=>`<button data-tfo="lopt" data-v="${v}" aria-pressed="${O.lopt===v}">${l}</button>`).join('')}</div>
      ${O.lopt?`<div class="stepper" style="margin-top:6px"><button data-tfo="lfee" data-v="-5">-5</button><div class="v">${money(O.lfee)}</div><button data-tfo="lfee" data-v="5">+5</button></div><p class="note">시즌이 끝날 때 ${O.lopt===2?'자동으로':'원하면'} ${money(O.lfee)}에 완전 영입합니다(그때 예산에서 지급). 상대 희망가 근처면 주전급도 임대에 응할 수 있고, 의무는 나중에 내는 이적이라 희망가의 92% 이상이면 받아들입니다.</p>`:''}`;
    bo.insertAdjacentHTML('beforebegin',h)}}catch(e){console.error(e)}return r}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-tfo]');if(!b||!UI.off)return;e.stopPropagation();e.preventDefault();const O=tfOff(),k=b.dataset.tfo,v=+b.dataset.v;
  if(k==='lfee')O.lfee=Math.max(1e6,(O.lfee||0)+v*1e6);else O[k]=v;O.resp=null;offerSheet(O.id)},true);
// 구단 응답: 임대 + 완전 이적 조항
{const _cr=clubRespond;clubRespond=function(p,o){if(o&&o.loan&&o.lopt){const n=S.negs[p.id]||(S.negs[p.id]={stage:'club',tries:0});const seller=clubOf(p.id);
  if(!(n.stage==='broken'&&S.date<n.until)&&!(RIVAL(seller,S.club)&&hsh(p.id+'rival'+S.season)<.85)){const ask=asking(p,S.club),rk=rankInClub(p);
    const ok=o.lopt===2?o.lfee>=ask*.92&&o.share>=50:o.lfee>=ask*1.05&&o.share>=50&&(rk>8||(ageOf(p)<=24&&rk>3));
    if(ok){n.stage='player';n.agreed=Object.assign({},o,{fee:0});return {k:'ok',msg:`${CLUBS[seller].name}이 ${o.lopt===2?'구매 의무':'구매 옵션'} 포함 임대(${money(o.lfee)})를 수락했습니다. 이제 선수와 개인 조건을 협상하세요.`}}
    if(o.lopt===2&&o.lfee>=ask*.8){n.tries++;return {k:'mid',msg:`${CLUBS[seller].name}: 의무 이적료를 ${money(Math.round(ask*.92/1e5)*1e5)} 이상으로 올려 달라고 합니다.`}}
    if(o.lopt===1&&rk<=8&&!(ageOf(p)<=24&&rk>3)){n.tries++;return {k:'no',msg:'핵심 선수라 옵션 임대로는 보내지 않겠답니다. 구매 의무 조항이면 검토하겠다고 합니다.'}}
    if(o.lopt===1){n.tries++;return {k:'mid',msg:`${CLUBS[seller].name}: 옵션 금액을 ${money(Math.round(ask*1.05/1e5)*1e5)} 이상으로 해 달라고 합니다.`}}}}
  return _cr.apply(this,arguments)}}
// 선수 응답: 수수료·바이아웃이 연봉 요구에 반영, 수수료 포함 예산 확인
{const _pr=playerRespond;playerRespond=function(p,t){const O=UI.off&&UI.off.id===p.id?tfOff():null;if(!O)return _pr.apply(this,arguments);
  const ag=tfAgreed(p.id)||{};const mult=(TF_AG[O.ag]||TF_AG[1])[0]*(ag.loan?1:(TF_CL[O.cl]||TF_CL[2])[1]);const fee=tfFeeNow(p);const up=ag.loan?0:fee/(ag.inst||1);const af=tfAgentFee(p,O);
  if(up+af>spendable())return {k:'no',msg:`이적료 선지급 ${money(up)} + 에이전트 수수료 ${money(af)}가 예산 ${money(spendable())}를 넘습니다.`};
  const r=_pr(p,Object.assign({},t,{wage:t.wage/mult}));if(r&&r.k!=='ok'&&mult!==1&&r.msg){const dm=Math.round(wageDemand(p,S.club)*(t.role<expectRole(p,S.club)?1.15:1)*mult/1e4)*1e4;r.msg+=` 수수료·바이아웃 조건까지 반영한 요구 연봉은 약 ${money(dm)}입니다.`}return r}}
// 영입 완료: 수수료 차감·바이아웃 설정·임대 옵션 기록
{const _ct=completeTransfer;completeTransfer=function(id,to,fee,o){const seller=clubOf(id);const O=to===S.club&&UI.off&&UI.off.id===id?tfOff():null;const p0=pl(id);const af=O?tfAgentFee(p0,O):0;const r=_ct.apply(this,arguments);
  try{if(O){if(af>0){S.fin.budget-=af;S.fin.log.unshift({d:S.date,t:`${p0.name} 에이전트 수수료`,v:-af})}
    if(!o||!o.loan){setP(id,{clause:tfClauseVal(p0,O.cl)})}
    else if(O.lopt){const q=S.ps[id]=S.ps[id]||{};q.loanOpt={fee:O.lfee,must:O.lopt===2,from:seller,ex:false}}}}catch(e){console.error(e)}return r}}
// 시즌 끝: 6월 1일 옵션 행사 여부 질문, 7월 1일(롤오버) 직전 의무·행사 건 완전 이적 처리
function tfLoanOpts(){const L=[];for(const id in S.ps){const q=S.ps[id];if(q&&q.loanOpt&&q.loanFrom!=null&&q.club===S.club)L.push(+id)}return L}
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);try{if(S.date.endsWith('-06-01')&&!(typeof unemp==='function'&&unemp()))tfLoanOpts().forEach(id=>{const q=S.ps[id],p=pl(id);
  if(q.loanOpt.must)inbox('loanopt','',`${p.name} 구매 의무`,`임대 계약의 구매 의무에 따라 7월 1일 ${money(q.loanOpt.fee)}에 완전 영입됩니다.`,{lo:id,done:true});
  else inbox('loanopt','',`${p.name} 구매 옵션`,`임대 계약의 구매 옵션 ${money(q.loanOpt.fee)}를 행사할지 정하세요(6월 30일까지). 행사하지 않으면 7월 1일 원소속팀으로 돌아갑니다.`,{lo:id})})}catch(e){console.error(e)}return r}}
{const _ro=rollover;rollover=function(){try{tfLoanOpts().forEach(id=>{const q=S.ps[id],o=q.loanOpt,p=pl(id);if(!(o.must||o.ex))return;
  S.fin.budget-=o.fee;S.fin.log.unshift({d:S.date,t:`${p.name} 완전 영입(임대 ${o.must?'의무':'옵션'})`,v:-o.fee});if(S.aiBudget&&S.aiBudget[o.from]!==undefined)S.aiBudget[o.from]+=o.fee*.7;
  q.loanFrom=null;q.loanOpt=null;q.cEnd=`${S.season+4}-06-30`;S.news.unshift({d:S.date,t:`${p.name}: ${CLUBS[o.from].name} → ${CLUBS[S.club].name} (임대 후 완전 이적)`,v:o.fee,big:true});
  inbox('contract','',`${p.name} 완전 영입`,`${money(o.fee)} · 계약 ${S.season+4}년 6월까지`)})}catch(e){console.error(e)}return _ro.apply(this,arguments)}}
{const _mh=msgHTML;msgHTML=function(m){if(m.type!=='loanopt')return _mh(m);const q=S.ps[m.lo];const open=!m.done&&q&&q.loanOpt&&!q.loanOpt.ex;
  return `<div class="msg ${m.read?'':'new'}"><div class="h"><span>${fmtD(m.d)}</span><span>임대 계약</span></div><b>${esc(m.title)}</b><p>${esc(m.body)}${m.result?` <span style="color:var(--text)">→ ${esc(m.result)}</span>`:''}</p>${open?`<div class="acts"><button class="btn sm" data-loex="${m.id}">행사 (${money(q.loanOpt.fee)})</button><button class="btn sm ghost" data-lono="${m.id}">돌려보내기</button></div>`:''}</div>`}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-loex],[data-lono]');if(!b||!S)return;e.stopPropagation();e.preventDefault();const m=S.inbox.find(x=>x.id===+(b.dataset.loex||b.dataset.lono));if(!m)return;const q=S.ps[m.lo];if(!q||!q.loanOpt)return;
  if(b.dataset.loex){if(q.loanOpt.fee>spendable()){toast('예산이 부족합니다');return}q.loanOpt.ex=true;m.result='옵션 행사 — 7월 1일 완전 영입';toast('구매 옵션을 행사했습니다')}else{q.loanOpt=null;m.result='원소속팀으로 복귀 예정';toast('7월 1일 원소속팀으로 돌아갑니다')}
  m.done=true;m.read=true;save();render()},true);
// ---- 계약 제안 중복 방지(v91, 사용자 보고) ----
// 재계약 합의 뒤에도 재계약 창의 '제시' 버튼과 재계약 요청 메시지가 그대로 살아 있어 다시 제안할 수 있었음 → 합의하면 버튼을 없애고 요청 메시지 종료
{const _rs=renewSheet;renewSheet=function(id){const r=_rs.apply(this,arguments);try{const R=UI.ren;if(R&&R.id===id&&R.resp&&R.resp.k==='ok'){const b=document.querySelector('[data-act="sendRenew"]');if(b)b.outerHTML=`<button class="btn" data-close>재계약 완료 · 닫기</button>`;
  (S.inbox||[]).forEach(m=>{if(m.type==='renewreq'&&m.pid===id&&!m.done){m.done=true;m.read=true;m.result='재계약 합의'}});const q=S.ps[id];if(q){q.renReq=null}}}catch(e){console.error(e)}return r}}
{const _rv=renewSheet;renewSheet=function(id){if(UI.ren&&UI.ren.id===id&&UI.ren.resp&&UI.ren.resp.k==='ok'&&UI.ren.doneAt&&UI.ren.doneAt!==S.date)UI.ren=null;const r=_rv.apply(this,arguments);if(UI.ren&&UI.ren.resp&&UI.ren.resp.k==='ok'&&!UI.ren.doneAt)UI.ren.doneAt=S.date;return r}}
{const _mh=msgHTML;msgHTML=function(m){if(m.type==='renewreq'&&m.done)return `<div class="msg ${m.read?'':'new'}"><div class="h"><span>${fmtD(m.d)}</span><span>재계약</span></div><b>${esc(m.title)}</b><p>${esc(m.body)}${m.result?` <span style="color:var(--text)">→ ${esc(m.result)}</span>`:''}</p></div>`;return _mh(m)}}
// 같은 선수에 대한 다른 영입 제안·바이아웃 메시지: 한 건을 받아들여 이적하면 나머지는 종료, 이미 떠난 선수면 처리하지 않음
{const _hm=handleMsg;handleMsg=function(m,act){try{if((m.type==='offer'||m.type==='clause')&&!m.done&&clubOf(m.pid)!==S.club){m.done=true;m.read=true;m.result='이미 팀을 떠난 선수입니다';save();render();toast(m.result);return}}catch(e){}
  const r=_hm.apply(this,arguments);try{if(clubOf(m.pid)!==S.club)(S.inbox||[]).forEach(x=>{if(x!==m&&(x.type==='offer'||x.type==='clause'||x.type==='request')&&x.pid===m.pid&&!x.done){x.done=true;x.read=true;x.result='선수 이적으로 종료'}});save();render()}catch(e){}return r}}
// 사전 계약을 마친 선수(7월 1일 합류 예정)는 원소속팀에 남아 있어 영입 제안 창이 다시 열렸음 → 완료 안내로 대체
{const _os2=offerSheet;offerSheet=function(id,step){const pre=(S.pre||[]).find(x=>x.id===id);if(pre){const p=pl(id);sheet(`<button class="x" data-close>닫기</button><div class="note" style="margin:0">사전 계약 완료</div><h3>${esc(p.name)}</h3><p class="note">7월 1일에 자유계약으로 합류합니다 · 연봉 ${money(pre.wage)} · ${pre.cEnd.slice(0,4)}년 6월까지. 추가 제안은 필요 없습니다.</p>`);return}return _os2.apply(this,arguments)}}
// ---- 재계약 바이아웃(v91): 재계약 창에서도 바이아웃 수준 선택(연봉 요구 ×0.97/×1/×1.06) ----
{const _rs3=renewSheet;renewSheet=function(id){const R0=UI.ren;const r=_rs3.apply(this,arguments);try{const R=UI.ren;if(!R||R.id!==id)return r;if(R._w!=null){R.wage=R._w;R._w=null}if(R.cl==null)R.cl=2;const p=pl(id);
  const b=document.querySelector('[data-act="sendRenew"]');if(b){b.insertAdjacentHTML('beforebegin',`<div class="lbl">바이아웃 조항 <span style="font-weight:400">(현재 ${p.clause?'€'+p.clause+'M':'없음'})</span></div><div class="seg" style="grid-template-columns:repeat(3,1fr)">${Object.entries(TF_CL).map(([k,v])=>`<button data-rcl="${k}" aria-pressed="${+k===R.cl}">${v[2]} €${tfClauseVal(p,+k)}M</button>`).join('')}</div><p class="note">높게 걸수록 다른 구단이 빼 가기 어렵지만 선수 측 연봉 요구가 오릅니다(낮음 −3%, 높음 +6%).</p>`)}}catch(e){console.error(e)}return r}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-rcl]');if(!b||!UI.ren)return;e.stopPropagation();e.preventDefault();UI.ren.cl=+b.dataset.rcl;UI.ren.resp=null;renewSheet(UI.ren.id)},true);
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-act="sendRenew"]');if(!b||!UI.ren)return;const R=UI.ren;const m=(TF_CL[R.cl||2]||TF_CL[2])[1];R._w=R.wage;R._cl=R.cl||2;R.wage=Math.round(R.wage/m);
  setTimeout(()=>{try{if(R._w!=null){R.wage=R._w;R._w=null}if(R.resp&&R.resp.k==='ok'&&!R.clSet){R.clSet=1;const p=pl(R.id);setP(R.id,{wage:R.wage,clause:tfClauseVal(p,R._cl)});save()}}catch(err){}},0)},true);

