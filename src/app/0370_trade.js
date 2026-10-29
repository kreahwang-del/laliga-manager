// ================= 트레이드(v102): 선수+현금 거래 — 내가 제안 / AI도 제안 =================
// 상대 구단의 선수 평가 = 시장가(가치×나이 계수) × 필요도(받는 팀에서의 예상 역할: 주전 1.05·로테이션 0.8·백업 0.5) × 연봉 부담(받는 팀 최고 연봉의 1배 초과분만큼 감액, 1.6배 넘으면 0) × 32세 이상 0.8
// 포함된 선수가 받는 팀에 관심이 너무 낮으면(interest<15) 선수가 거부 → 평가 0. 내 제안은 현금(분할·셀온 반영) + 선수 평가 합계를 상대 희망가와 비교
// AI 제안: 우리 선수 영입 제안 중 25%가 '현금 + 자기 선수'(우리 팀에서 로테이션 이상이 될 선수, 시장가가 제안액의 20~70%, 자기 팀 상위 3명 제외) — 현금은 그 선수 시장가의 95%만큼 줄임
function tdMv(p){return p.val*AGEK(ageOf(p))}
function tdVal(p,club){const mv=tdMv(p);const role=expectRole(p,club);let f={2:1.05,1:.8,0:.5}[role];const why=[ROLE_N[role]+' 예상'];
  const sq=squadOf(club).filter(q=>q.id!==p.id);const maxW=Math.max(1,...sq.map(q=>q.wage||0));const wr=(p.wage||0)/maxW;
  if(wr>1.6)return {v:0,role,why:'연봉 감당 불가(팀 최고 연봉의 '+wr.toFixed(1)+'배)'};if(wr>1){f*=1-(wr-1)*.6;why.push('연봉 부담')}
  if(ageOf(p)>=32){f*=.8;why.push('나이')}
  if(interest(p,club)<15)return {v:0,role,why:'선수가 이적 거부'};
  return {v:Math.round(mv*f/1e5)*1e5,role,why:why.join(' · ')}}
function tdList(O){return (O&&O.tp||[]).filter(id=>clubOf(id)===S.club)}
{const _e=effOffer;effOffer=function(o){let e=_e(o);try{if(o&&o.tp&&o.tp.length&&o.id!=null){const c=clubOf(o.id);for(const id of o.tp)if(clubOf(id)===S.club)e+=tdVal(pl(id),c).v}}catch(er){}return e}}
{const _cr=clubRespond;clubRespond=function(p,o){const r=_cr.apply(this,arguments);try{if(o&&o.tp&&o.tp.length&&r&&r.k==='mid')r.msg+=' (현금 + 포함 선수 평가액 합계 기준)';if(o&&o.tp&&o.tp.length&&r&&r.k==='ok'){const n=S.negs[p.id];if(n&&n.agreed)n.agreed.tp=[...o.tp]}}catch(e){}return r}}
// 영입 성사 시 포함 선수를 상대 구단으로
{const _ct=completeTransfer;completeTransfer=function(id,to,fee,o){const seller=clubOf(id);const n=S.negs[id];const tp=to===S.club&&n&&n.agreed&&n.agreed.tp?n.agreed.tp.filter(x=>clubOf(x)===S.club):[];
  const r=_ct.apply(this,arguments);
  try{if(tp.length&&clubOf(id)===S.club){tp.forEach(x=>{const q=pl(x);completeTransfer(x,seller,0,{wage:q.wage,cEnd:q.cEnd});});const nm=tp.map(x=>pl(x).name).join(', ');
    S.news.unshift({d:S.date,t:`트레이드: ${pl(id).name} ↔ ${nm}${fee?` + ${money(fee)}`:''}`,v:fee,big:true});if(typeof mlog==='function')mlog(`트레이드 · ${pl(id).name} 영입, ${nm} 이적`)}}catch(e){console.error(e)}return r}}
// 연봉 한도: 트레이드로 나가는 선수 연봉은 빼고 계산
let TD_EXCL=null;
{const _wb=wageBill;wageBill=function(c){let w=_wb(c);if(TD_EXCL&&c===S.club)for(const id of TD_EXCL)if(clubOf(id)===S.club)w-=pl(id).wage||0;return w}}
{const _pr=playerRespond;playerRespond=function(p,t){const n=S.negs[p.id];TD_EXCL=n&&n.agreed&&n.agreed.tp?n.agreed.tp:null;try{return _pr.apply(this,arguments)}finally{TD_EXCL=null}}}
// 제안 화면: 우리 선수 포함
{const _os=offerSheet;offerSheet=function(id,step){const r=_os.apply(this,arguments);try{const O=UI.off;if(!O||O.id!==id||O.loan)return r;const bo=document.querySelector('[data-act="sendOffer"]');if(!bo)return r;
  const c=clubOf(id);const L=tdList(O);O.tp=L;const tot=L.reduce((a,x)=>a+tdVal(pl(x),c).v,0);
  const h=`<div class="lbl">트레이드 · 우리 선수 포함 <span style="font-weight:400">(최대 2명)</span></div>
   ${L.map(x=>{const q=pl(x),v=tdVal(q,c);return `<div class="li" style="padding:6px 0"><span class="nm"><b>${esc(q.name)}</b><span>${GN[q.g]||q.g} · ${q.ovr} · ${ageOf(q)}세 · ${esc(v.why)}</span></span><span class="num">${money(v.v)}</span><button class="btn sm ghost" data-tpx="${x}" style="margin-left:6px">빼기</button></div>`}).join('')}
   ${L.length<2?`<button class="btn sm ghost" data-tpadd="1">+ 우리 선수 추가</button>`:''}
   ${L.length?`<p class="note">상대 평가 합계 ${money(tot)} + 현금 ${money(O.fee)}(분할·셀온 반영 전) = 총 ${money(tot+O.fee)}. 상대 평가는 시장가에 상대 팀에서의 예상 역할·연봉 부담·나이를 반영한 금액입니다. 연봉 한도는 나가는 선수 연봉을 빼고 계산합니다.</p>`:`<p class="note">우리 선수를 넣으면 상대 팀 필요도에 따라 평가한 금액만큼 현금을 줄일 수 있습니다.</p>`}`;
  bo.insertAdjacentHTML('beforebegin',h)}catch(e){console.error(e)}return r}}
function tdPick(){const O=UI.off;if(!O)return;const c=clubOf(O.id);const sq=squadOf(S.club).filter(q=>!q.loanFrom&&!(O.tp||[]).includes(q.id)).map(q=>({q,v:tdVal(q,c)})).sort((a,b)=>b.v.v-a.v.v);
  sheet(`<button class="x" data-tpback="1">뒤로</button><div class="note" style="margin:0">${esc(CLUBS[c].name)}이 평가하는 우리 선수</div><h3>트레이드에 넣을 선수</h3>
   ${sq.map(({q,v})=>`<div class="li" style="padding:7px 0"><span class="nm"><b>${esc(q.name)}</b><span>${GN[q.g]||q.g} · ${q.ovr} · ${ageOf(q)}세 · 시장가 ${money(tdMv(q))} · ${esc(v.why)}</span></span><span class="num">${money(v.v)}</span><button class="btn sm" data-tpick="${q.id}" style="margin-left:6px" ${v.v>0?'':'disabled'}>넣기</button></div>`).join('')}`)}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-tpadd],[data-tpx],[data-tpick],[data-tpback]');if(!b||!UI.off)return;e.stopPropagation();e.preventDefault();const O=UI.off;O.tp=O.tp||[];
  if(b.dataset.tpadd){tdPick();return}
  if(b.dataset.tpx){O.tp=O.tp.filter(x=>x!==+b.dataset.tpx)}
  if(b.dataset.tpick){if(sqSize(S.club)-O.tp.length-1<16){toast('스쿼드가 16명 아래로 내려갑니다');tdPick();return}O.tp.push(+b.dataset.tpick);O.tp=O.tp.slice(0,2)}
  O.resp=null;if(S.negs[O.id]&&S.negs[O.id].stage==='club')S.negs[O.id].counter=null;offerSheet(O.id)},true);
// AI 제안: 현금 + 선수
{const _ib=inbox;inbox=function(type,_,title,body,extra){try{if(type==='offer'&&extra&&extra.pid!=null&&extra.from>=0&&!extra.tp&&CLUBS[extra.from]&&Math.random()<.25){const fee=extra.fee;
    const top=new Set(squadOf(extra.from).slice().sort((a,b)=>b.ovr-a.ovr).slice(0,3).map(q=>q.id));
    const cand=squadOf(extra.from).filter(q=>!top.has(q.id)&&!q.loanFrom&&ageOf(q)<=33&&tdMv(q)>=fee*.2&&tdMv(q)<=fee*.7&&expectRole(q,S.club)>=1&&interest(q,S.club)>=20)
      .sort((a,b)=>tdVal(b,S.club).v-tdVal(a,S.club).v);
    if(cand.length){const q=cand[0],mv=tdMv(q),cash=Math.max(0,Math.round((fee-mv*.95)/1e5)*1e5);
      extra=Object.assign({},extra,{fee:cash,tp:[q.id],tpv:Math.round(mv*.95/1e5)*1e5,tot:fee,maxT:extra.max});
      title=title.replace('영입 제안','트레이드 제안');body=`이적료 ${money(cash)} + ${q.name}(${GN[q.g]||q.g} · ${q.ovr} · ${ageOf(q)}세 · 시장가 ${money(mv)}, 우리 팀 예상 역할 ${ROLE_N[expectRole(q,S.club)]}) 제안이 들어왔습니다.`}}}catch(e){console.error(e)}
  return _ib.call(this,type,_,title,body,extra)}}
{const _mh=msgHTML;msgHTML=function(m){let h=_mh(m);try{if(m.type==='offer'&&m.tp&&!m.done){const cc=Math.round((m.fee+m.tot*.2)/1e5)*1e5;h=h.replace(`역제안 ${money(Math.round(m.fee*1.2/1e5)*1e5)}`,`역제안 현금 ${money(cc)} + 선수`)}}catch(e){}return h}}
{const _hm=handleMsg;handleMsg=function(m,act){if(!(m&&m.type==='offer'&&m.tp&&!m.done))return _hm.apply(this,arguments);
  const p=pl(m.pid),q=pl(m.tp[0]);
  if(clubOf(q.id)!==m.from){m.done=true;m.read=true;m.result='상대 선수가 이미 팀을 떠나 제안이 무효가 됐습니다';save();render();toast(m.result);return}
  if((act==='accept'||act==='counter')&&wageBill(S.club)-(p.wage||0)+(q.wage||0)>CLUBS[S.club].wageCap*1e6){toast('받는 선수 연봉 때문에 연봉 총액 한도를 넘습니다');return}
  if(act==='counter'){const cc=Math.round((m.fee+m.tot*.2)/1e5)*1e5;if(cc+m.tpv<=m.maxT){m.fee=cc;act='accept'}else{m.done=true;m.read=true;m.result='역제안 거절, 협상 종료';save();render();toast(m.result);return}}
  const r=_hm.call(this,m,act);
  try{if(act==='accept'&&clubOf(p.id)===m.from&&clubOf(q.id)===m.from){completeTransfer(q.id,S.club,0,{wage:q.wage,cEnd:q.cEnd});m.result=`${money(m.fee)} + ${q.name} 영입으로 트레이드`;
    S.news.unshift({d:S.date,t:`트레이드: ${p.name} ↔ ${q.name}${m.fee?` + ${money(m.fee)}`:''}`,v:m.fee,big:true});if(typeof mlog==='function')mlog(`트레이드 · ${p.name} 이적, ${q.name} 영입`);save();render()}}catch(e){console.error(e)}return r}}

