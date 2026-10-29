// ================= 임대 명단·임대 제안(v136) =================
// 이전: '임대 보내기'를 누르면 평판 낮은 아무 구단으로 즉시 이적 → 실제 관행과 다름
// 실제: 구단이 선수를 임대 가능 명단에 올리면 관심 구단이 조건(기간·연봉 분담·임대료·출전 역할·완전 이적 옵션)을 제시하고 원소속 구단이 고름
// FIFA 임대 규정(2022.7 시행, 2024-25부터 최종 단계): 시즌 중 임대 보낸 선수 최대 6명(21세 이하·자체 육성 선수 제외), 한 구단에 최대 3명,
//   기간은 다음 등록 기간까지 이상·최대 1년, 재임대(임대 중 다시 임대) 금지
const LN_MAX=6,LN_PER=3;
function lnExempt(p){return ageOf(p)<=21||(typeof ythOf==='function'&&ythOf(p)===S.club)}
function lnOut(){const L=[];for(const id in S.ps){const q=S.ps[id];if(q&&q.loanFrom===S.club&&q.club!==S.club)L.push(+id)}return L}
function lnCount(to){return lnOut().filter(id=>{const p=pl(id);return !lnExempt(p)&&(to==null||clubOf(id)===to)}).length}
function lnCountTo(to){return lnOut().filter(id=>clubOf(id)===to).length}
// 제안 구단은 경기가 실제로 시뮬레이션되는 리그 소속만(출전 시간·성장이 기록되도록)
// 받는 구단에서의 예상 역할: 같은 포지션 주전급과 비교(2 주전·1 로테이션·0 백업)
function lnRole(p,c){const sq=squadOf(c).filter(q=>q.g===p.g&&q.id!==p.id).sort((a,b)=>b.ovr-a.ovr);const need=p.g==='GK'?1:p.g==='CB'||p.g==='FB'||p.g==='W'||p.g==='CM'?2:1;
  const ref=sq[need-1],ref2=sq[need+1];if(!ref||p.ovr>=ref.ovr)return 2;if(!ref2||p.ovr>=ref2.ovr)return 1;return 0}
// 임대 연봉 분담(받는 구단 부담 비율): 받는 구단이 클수록·선수가 좋을수록·역할이 클수록 많이 부담
function lnShare(p,c,role){return Math.max(.2,Math.min(1,Math.round((.35+(CLUBS[c].rep-60)/90+(p.ovr-68)/45+role*.1)*10)/10))}
function lnOffer(p){const my=CLUBS[S.club].rep;const C=CLUBS.filter(c=>c.i!==S.club&&c.i!=null&&fxLg(c.lg).filter(f=>!f.res&&f.d>S.date&&(f.h===c.i||f.a===c.i)).length>=8&&c.rep<my+3&&c.rep>=my-50&&lnCountTo(c.i)<LN_PER&&!(S.inbox||[]).some(m=>m.type==='loanoffer'&&!m.done&&m.pid===p.id&&m.from===c.i));
  const W=C.map(c=>{const role=lnRole(p,c.i);return [c,role,(role===2?3:role===1?1.5:.25)*(1+(c.rep>=my-25?.5:0))]}).filter(x=>x[2]>0);if(!W.length)return null;
  let u=rnd()*W.reduce((a,x)=>a+x[2],0),pick=W[0];for(const x of W){u-=x[2];if(u<=0){pick=x;break}}const [c,role]=pick;
  const share=lnShare(p,c.i,role),a=ageOf(p);const fee=a<=21||role===0?0:Math.round(p.val*(.02+rnd()*.06)/1e5)*1e5;
  const opt=a>=20&&a<=29&&rnd()<.3?Math.round(p.val*AGEK(a)*(1+rnd()*.2)/1e5)*1e5:0;const w=winNow();const until=`${S.season+1}-06-30`;
  return {from:c.i,role,share,fee,opt,until,win:w?w.k:''}}
const LN_ROLE=['백업','로테이션','주전'];
// 이적시장 기간: 임대 명단 선수마다 하루 확률로 제안(판매 명단 12%/일보다 낮게 6%/일, 21세 이하 유망주는 관심 ↑)
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);try{if(!S||(typeof unemp==='function'&&unemp()))return r;
  const w=winNow();if(w&&S.date<addD(w.to,-1))squadOf(S.club).filter(p=>(S.ps[p.id]||{}).loanList).forEach(p=>{const pr=ageOf(p)<=21?.08:.06;if(rnd()>pr)return;
    if((S.inbox||[]).filter(m=>m.type==='loanoffer'&&!m.done&&m.pid===p.id).length>=3)return;const o=lnOffer(p);if(!o)return;
    inbox('loanoffer','',`${CLUBS[o.from].name}의 ${p.name} 임대 제안`,`${LN_ROLE[o.role]} 역할 · 연봉 ${Math.round(o.share*100)}% 부담 · 임대료 ${o.fee?money(o.fee):'없음'} · ${o.until.slice(0,4)}년 6월까지${o.opt?` · 완전 이적 옵션 ${money(o.opt)}`:''}`,Object.assign({pid:p.id},o))});
  // 6월 1일: 완전 이적 옵션 행사 여부(받는 구단 판단) + 임대 선수 시즌 리포트
  if(S.date.endsWith('-06-01')){const L=lnOut();if(L.length){const rep=L.map(id=>{const p=pl(id),q=S.ps[id];const sh=(q.mins||0)/(38*90);let s=`${p.name}(${CLUBS[clubOf(id)].short}) ${q.apps||0}경기 ${q.mins||0}분 ${q.gl||0}골 ${q.as||0}도움`;
      if(q.lnOpt&&!q.lnOpt.ex){const go=sh>=.45&&p.ovr>=lnRefOvr(p,clubOf(id))-1&&rnd()<.65;if(go){q.lnOpt.ex=true;s+=` → 완전 이적 옵션 행사(${money(q.lnOpt.fee)}, 7월 1일)`}else s+=' → 옵션 미행사, 복귀'}return s});
    inbox('loanrep','',`임대 선수 시즌 리포트`,rep.join('<br>'))}}}catch(e){console.error(e)}return r}}
function lnRefOvr(p,c){const sq=squadOf(c).filter(q=>q.g===p.g&&q.id!==p.id).sort((a,b)=>b.ovr-a.ovr);return sq[0]?sq[0].ovr:0}
// 7월 1일: 옵션 행사 건은 완전 이적(원래 롤오버가 원소속팀 복귀를 처리하기 전에)
{const _ro=rollover;rollover=function(){try{lnOut().forEach(id=>{const q=S.ps[id],o=q.lnOpt;if(!(o&&o.ex))return;const p=pl(id),to=clubOf(id);
    S.fin.budget+=o.fee;S.fin.log.unshift({d:S.date,t:`${p.name} 판매(임대 후 완전 이적)`,v:o.fee});if(S.aiBudget&&S.aiBudget[to]!==undefined)S.aiBudget[to]-=o.fee;
    q.loanFrom=null;q.lnOpt=null;q.loanWsh=null;q.cEnd=`${S.season+4}-06-30`;S.news.unshift({d:S.date,t:`${p.name}: ${CLUBS[S.club].name} → ${CLUBS[to].name} (임대 후 완전 이적)`,v:o.fee,big:true})});
  lnOut().forEach(id=>{const q=S.ps[id];q.loanWsh=null;q.lnOpt=null})}catch(e){console.error(e)}return _ro.apply(this,arguments)}}
// 연봉: 임대 보낸 선수의 남은 부담분은 우리 연봉 총액에 계속 포함
{const _wb=wageBill;wageBill=function(c){let v=_wb(c);try{if(S&&c===S.club)for(const id of lnOut()){const q=S.ps[id];if(q.loanWsh)v+=pl(id).wage*q.loanWsh}}catch(e){}return v}}
function lnAccept(m){const p=pl(m.pid),q=S.ps[m.pid]=S.ps[m.pid]||{};if(clubOf(p.id)!==S.club)return '이미 팀을 떠난 선수입니다';
  if(q.loanFrom!=null&&q.loanFrom!==S.club)return '임대 중인 선수는 다시 임대 보낼 수 없습니다(FIFA 재임대 금지)';
  if(!lnExempt(p)&&lnCount()>=LN_MAX)return `임대 보낸 선수가 이미 ${LN_MAX}명입니다(FIFA 한도, 21세 이하·자체 육성 제외)`;
  if(lnCountTo(m.from)>=LN_PER)return `${CLUBS[m.from].name}에는 이미 ${LN_PER}명을 임대 보냈습니다(FIFA 한도)`;
  if(typeof sqSize==='function'&&sqSize(S.club)<=16)return '스쿼드가 16명 이하라 더 보낼 수 없습니다';
  completeTransfer(p.id,m.from,0,{loan:true});const q2=S.ps[p.id];q2.loanFrom=S.club;q2.loanList=false;q2.loanWsh=+(1-m.share).toFixed(2);q2.lnRole=m.role;q2.lnOpt=m.opt?{fee:m.opt,ex:false}:null;
  if(S.xi)S.xi=S.xi.filter(x=>x!==p.id);
  if(m.fee){S.fin.budget+=m.fee;S.fin.log.unshift({d:S.date,t:`${p.name} 임대료`,v:m.fee});if(S.aiBudget&&S.aiBudget[m.from]!==undefined)S.aiBudget[m.from]-=m.fee}
  (S.inbox||[]).forEach(x=>{if(x.type==='loanoffer'&&x.pid===p.id&&x!==m&&!x.done){x.done=true;x.result='다른 제안 수락으로 종료'}});
  S.news.unshift({d:S.date,t:`${p.name}: ${CLUBS[S.club].name} → ${CLUBS[m.from].name} (임대)`,v:0});return null}
{const _mh=msgHTML;msgHTML=function(m){if(m.type!=='loanoffer'&&m.type!=='loanrep')return _mh(m);
  const acts=m.type==='loanoffer'&&!m.done?`<div class="acts"><button class="btn sm" data-lnok="${m.id}">수락</button><button class="btn sm ghost" data-lnno="${m.id}">거절</button><button class="btn sm ghost" data-player="${m.pid}">선수 보기</button></div>`:'';
  return `<div class="msg ${m.read?'':'new'}"><div class="h"><span>${fmtD(m.d)}</span><span>${m.type==='loanrep'?'임대 리포트':'임대 제안'}</span></div><b>${esc(m.title)}</b><p>${m.type==='loanrep'?m.body:esc(m.body)}${m.result?` <span style="color:var(--text)">→ ${esc(m.result)}</span>`:''}</p>${acts}</div>`}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-lnok],[data-lnno],[data-act="loanout"]');if(!b||!S)return;e.stopPropagation();e.preventDefault();
  if(b.dataset.act==='loanout'){const id=+b.dataset.id,p=pl(id),q=S.ps[id]=S.ps[id]||{};if(q.loanFrom!=null&&q.loanFrom!==S.club){toast('임대 온 선수는 다시 임대 보낼 수 없습니다');return}
    q.loanList=!q.loanList;if(q.loanList&&q.listed){q.listed=false}save();playerSheet(id);render();toast(q.loanList?`${p.name}을 임대 명단에 올렸습니다. 이적시장 기간에 관심 구단의 제안이 들어옵니다`:'임대 명단에서 뺐습니다');return}
  const m=S.inbox.find(x=>x.id===+(b.dataset.lnok||b.dataset.lnno));if(!m||m.done)return;
  if(b.dataset.lnok){const err=lnAccept(m);if(err){toast(err);return}m.result='수락 · 임대 확정';toast(`${pl(m.pid).name}, ${CLUBS[m.from].name}로 임대`)}else m.result='거절';
  m.done=true;m.read=true;save();render()},true);
// 선수 화면 버튼 문구: 임대 명단 올림/제외(이적시장 밖에서도 등록 가능)
{const _ps=playerSheet;playerSheet=function(id){const r=_ps.apply(this,arguments);try{const b=document.querySelector('[data-act="loanout"]');if(b){const q=S.ps[id]||{};b.disabled=false;
  b.textContent=q.loanList?'임대 명단에서 제외':'임대 명단에 올림'}}catch(e){}return r}}
// 이적 > 판매 화면: 임대 명단·임대 보낸 선수 현황
{const _sv=sellView;sellView=function(){let h=_sv.apply(this,arguments);try{const L=squadOf(S.club).filter(p=>(S.ps[p.id]||{}).loanList);const O=lnOut().map(pl);
  h+=`<h2>임대 명단</h2><div class="card list">${L.map(p=>rowP(p,`<span class="pill">${ageOf(p)<=21?'유망주':'임대 가능'}</span>`)).join('')||'<div class="li note">임대 명단이 비어 있습니다. 선수 화면에서 \'임대 명단에 올림\'을 누르면 이적시장 기간에 제안이 들어옵니다.</div>'}</div>
  <h2>임대 보낸 선수 (${lnCount()}/${LN_MAX}명 · 21세 이하·자체 육성 제외)</h2><div class="card list">${O.map(p=>{const q=S.ps[p.id];return rowP(p,`<span class="pill">${CLUBS[clubOf(p.id)].short} · ${LN_ROLE[q.lnRole??1]} · ${q.mins||0}분</span>`)}).join('')||'<div class="li note">임대 보낸 선수가 없습니다.</div>'}</div>`}catch(e){console.error(e)}return h}}
// 임대 출전 약속 이행: 받는 구단 선발에 임대 선수 반영(주전 약속은 매 경기, 로테이션은 약 45% 경기) — 같은 포지션 선발 중 가장 낮은 선수와 교체
{const _tf=teamFor;teamFor=function(c){const T=_tf.apply(this,arguments);try{if(!S||c===S.club||!T||!T.xi)return T;
  for(const id of lnOut()){if(clubOf(id)!==c)continue;const q=S.ps[id];if(q.injD>0||T.xi.some(x=>x.id===id))continue;const role=q.lnRole??1;
    if(role===0||(role===1&&hsh(S.date+':'+id)>.45))continue;const p=pl(id);let k=-1,lo=99;T.xi.forEach((x,i)=>{if(x.g===p.g&&x.ovr<lo){lo=x.ovr;k=i}});
    if(k<0)T.xi.forEach((x,i)=>{if(x.g!=='GK'&&p.g!=='GK'&&x.ovr<lo){lo=x.ovr;k=i}});if(k>=0){T.xi[k]=p;if(T.bench)T.bench=T.bench.filter(b=>b.id!==id)}}}catch(e){console.error(e)}return T}}
// ---- 이적 협상 인내심(v141): 3번 거절이면 결렬 → 제안이 요구액에 가까울수록 적게 소모(요구액 90% 이상 1/3번, 80~90% 1/2번, 그 아래 1번), 직전보다 3% 이상 올리면 소모 25% 감소 ----
{const _cr=clubRespond;clubRespond=function(p,o){if(!o||o.loan)return _cr.apply(this,arguments);const n=S.negs[p.id]||(S.negs[p.id]={stage:'club',tries:0});
  if(n.stage!=='club')return _cr.apply(this,arguments);let ask=0,e=0;try{ask=asking(p,S.club);e=effOffer(o)}catch(err){return _cr.apply(this,arguments)}
  let w=e>=ask*.9?1/3:e>=ask*.8?.5:1;if(n.lastE&&e>=n.lastE*1.03)w*=.75;const t0=n.tries||0;n.tries=t0-1+w;const pre=n.tries;const r=_cr.apply(this,arguments);
  try{if(n.tries===pre)n.tries=t0;n.lastE=e;if(r&&r.msg){r.msg=r.msg.replace('세 번의 제안이 모두 부족해','여러 번의 제안이 모두 부족해');if(n.stage==='club'&&r.k!=='ok'){const left=Math.max(0,Math.floor((3-n.tries)/(e>=ask*.9?1/3:e>=ask*.8?.5:1)+1e-9));r.msg+=` (비슷한 금액이면 약 ${left}번 더 제안 가능)`}}}catch(err){}return r}}
// ---- 방출(계약 해지, v144) ----
// 실제: 합의 해지(남은 연봉 중 일부를 위로금으로 지급) 또는 구단 일방 해지(남은 계약 전액 보상, FIFA 선수 지위·이적 규정 17조 '정당한 사유 없는 해지'의 보상 원칙)
// 선수 수락: 100%(전액)는 항상 수락. 75%·50%는 선수가 떠나고 싶을수록(만족도 낮음·출전 기회 적음·이적 요청) 수락 → 해지 뒤 자유계약 선수
function relRemain(p){const ms=Math.max(0,(D(p.cEnd||S.date)-D(S.date))/(30.44*864e5));return {months:Math.round(ms),wage:Math.round(p.wage*ms/12)}}
function relWill(p){const q=S.ps[p.id]||{};const h=q.happy??65,sh=(typeof playShare==='function'?playShare(p):.5),req=q.reqAt?1:0,ex=expectRole(p,S.club);
  return Math.max(0,Math.min(1,.5+(60-h)/80+(.5-sh)*.6+req*.3+(ageOf(p)>=31?.1:0)-(ex>=2?.2:0)))}
function relSheet(id){const p=pl(id),R=relRemain(p),w=relWill(p);const opt=k=>{const c=Math.round(R.wage*k/1e5)*1e5;const acc=k>=1?'항상 수락':w>=(k>=.75?.35:.6)?'수락 예상':'거절 가능성 높음';return `<button class="btn ${k>=1?'':'ghost'}" data-rel="${id}" data-k="${k}" ${c>S.fin.budget?'disabled':''}>${Math.round(k*100)}% 지급 ${money(c)} · ${acc}</button>`};
  sheet(`<button class="x" data-close>닫기</button><div class="note" style="margin:0">계약 해지(방출)</div><h3>${esc(p.name)}</h3>
  <div class="facts"><div><small>남은 계약</small><b>${R.months}개월</b></div><div><small>연봉</small><b>${money(p.wage)}</b></div><div><small>남은 연봉 합계</small><b>${money(R.wage)}</b></div></div>
  <p class="note">해지하면 자유계약 선수가 되고 위로금은 이적 예산에서 바로 나갑니다. 전액(100%) 지급은 구단 일방 해지라 항상 가능하고, 75%·50%는 선수와의 합의가 필요합니다(이 선수가 떠나고 싶어 하는 정도 ${Math.round(w*100)}%).</p>
  <div style="display:grid;gap:6px">${[1,.75,.5].map(opt).join('')}</div>`)}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-relopen],[data-rel]');if(!b||!S)return;e.stopPropagation();e.preventDefault();
  if(b.dataset.relopen){relSheet(+b.dataset.relopen);return}
  const id=+b.dataset.rel,k=+b.dataset.k,p=pl(id);if(clubOf(id)!==S.club)return;if(typeof sqSize==='function'&&sqSize(S.club)<=16){toast('스쿼드가 16명 이하라 더 방출할 수 없습니다');return}
  const R=relRemain(p),c=Math.round(R.wage*k/1e5)*1e5;if(c>S.fin.budget){toast('예산이 부족합니다');return}
  if(k<1){const w=relWill(p);if(w<(k>=.75?.35:.6)&&hsh(id+':rel:'+S.date+k)>w){toast(`${p.name}이 ${Math.round(k*100)}% 위로금으로는 해지에 합의하지 않았습니다`);relSheet(id);return}}
  S.fin.budget-=c;S.fin.log.unshift({d:S.date,t:`${p.name} 계약 해지 위로금`,v:-c});setP(id,{club:FA,listed:false,loanList:false,res:false,promise:null,cEnd:S.date});if(S.xi)S.xi=S.xi.filter(x=>x!==id);SQC=null;
  S.news.unshift({d:S.date,t:`${p.name}: ${CLUBS[S.club].name}와 계약 해지 (자유계약)`,v:0});save();closeSheet();render();toast(`${p.name} 방출 · 위로금 ${money(c)}`)},true);
{const _ps=playerSheet;playerSheet=function(id){const r=_ps.apply(this,arguments);try{if(clubOf(id)===S.club&&!document.querySelector('[data-relopen]')){const q=S.ps[id]||{};if(q.loanFrom!=null&&q.loanFrom!==S.club)return r;const b=document.querySelector('[data-act="loanout"]');const row=b&&b.parentElement;if(row){const d=document.createElement('div');d.className='row2';d.innerHTML=`<button class="btn ghost" data-relopen="${id}">계약 해지(방출)</button>`;(document.querySelector('[data-res]')?.parentElement||row).after(d)}}}catch(e){console.error(e)}return r}}
// ---- AI 구단끼리 임대(v144): 이적시장 기간 매주 월요일, AI 구단의 23세 이하 출전 기회 적은 선수(팀 내 19위 밖 또는 2군)를 평판이 낮은 구단에 임대 ----
// 실제 경향: 5대 리그 구단은 시즌마다 유망주를 하위 구단·하위 리그로 여러 명 임대(FIFA 한도 6명, 21세 이하·자체 육성 제외). 받는 구단은 로테이션 이상 역할을 줄 수 있는 경우만
function aiLnOutCnt(c){return (S.aiLn||[]).filter(id=>{const q=S.ps[id];return q&&q.loanFrom===c&&clubOf(id)!==c&&!(ageOf(pl(id))<=21)}).length}
function aiLoanWeek(){S.aiLn=S.aiLn||[];const lenders=CLUBS.filter(c=>c&&c.i!==S.club&&c.i!=null&&fxLg(c.lg).length&&!(c.par!=null));let made=0;
  for(const L of lenders){if(hsh(S.date+'al'+L.i)>.35)continue;const sq=squadOf(L.i).slice().sort((a,b)=>b.ovr-a.ovr);
    const cand=sq.filter((p,i)=>{const q=S.ps[p.id]||{};return ageOf(p)<=23&&(i>=18||q.res)&&q.loanFrom==null&&!(p.injD>0)});if(!cand.length)continue;
    const p=cand[Math.floor(hsh(S.date+'ac'+L.i)*cand.length)];if(!(ageOf(p)<=21)&&aiLnOutCnt(L.i)>=LN_MAX)continue;
    const NE=new Set(['AR','BR','US','MX','KR','JP','CN','SA']),eu=x=>!NE.has(x);const B=CLUBS.filter(c=>c&&c.i!==L.i&&c.i!==S.club&&c.i!=null&&!(c.par!=null)&&eu(c.lg)===eu(L.lg)&&c.rep<L.rep-4&&c.rep>=L.rep-45&&fxLg(c.lg).filter(f=>!f.res&&f.d>S.date&&(f.h===c.i||f.a===c.i)).length>=8).map(c=>[c,lnRole(p,c.i)]).filter(x=>x[1]>=1);
    if(!B.length)continue;const [to,role]=B[Math.floor(hsh(S.date+'ab'+p.id)*B.length)];if((S.aiLn||[]).filter(id=>(S.ps[id]||{}).loanFrom===L.i&&clubOf(id)===to.i).length>=LN_PER)continue;
    if(typeof sqSize==='function'&&sqSize(L.i)<=20)continue;
    completeTransfer(p.id,to.i,0,{loan:true});const q=S.ps[p.id];q.loanFrom=L.i;q.lnRole=role;q.res=false;S.aiLn.push(p.id);made++;
    if(made<=3||CLUBS[L.i].lg==='ES')S.news.unshift({d:S.date,t:`${p.name}: ${CLUBS[L.i].name} → ${to.name} (임대)`,v:0})}SQC=null}
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);try{const w=winNow();if(S&&w&&D(S.date).getUTCDay()===1&&S.date<addD(w.to,-2))aiLoanWeek()}catch(e){console.error(e)}return r}}
{const _ro=rollover;rollover=function(){const r=_ro.apply(this,arguments);try{S.aiLn=[]}catch(e){}return r}}
// 받는 구단은 AI 임대 선수에게도 약속 역할 이행
{const _tf=teamFor;teamFor=function(c){const T=_tf.apply(this,arguments);try{if(!S||c===S.club||!T||!T.xi||!S.aiLn||!S.aiLn.length)return T;
  for(const id of S.aiLn){if(clubOf(id)!==c)continue;const q=S.ps[id];if(!q||q.injD>0||T.xi.some(x=>x.id===id))continue;const role=q.lnRole??1;if(role===0||(role===1&&hsh(S.date+':'+id)>.45))continue;
    const p=pl(id);let k=-1,lo=99;T.xi.forEach((x,i)=>{if(x.g===p.g&&x.ovr<lo){lo=x.ovr;k=i}});if(k>=0)T.xi[k]=p}}catch(e){console.error(e)}return T}}

