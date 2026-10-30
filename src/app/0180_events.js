// ================= 이벤트 =================
document.addEventListener('input',e=>{if(e.target.id==='q'){UI.f.q=e.target.value;clearTimeout(UI.qt);UI.qt=setTimeout(()=>{const pos=e.target.selectionStart;render();const q=$('#q');if(q){q.focus();q.setSelectionRange(pos,pos)}},250)}});
document.addEventListener('click',e=>{
  if(e.target.id==='scrim'){if(M&&M.paused&&!M.done){return}closeSheet();return}
  if(e.target.closest('[data-close]')&&M&&M.done){closeSheet();return}
  const b=e.target.closest('button');if(!b)return;const d=b.dataset;
  if(d.tab){UI.tab=d.tab;render();scrollTo(0,0);return}
  if(d.new){startGame(+d.new);return}
  if(d.sq){UI.sq=d.sq;render();return}
  if(d.tt){UI.tt=d.tt;UI.lim=40;render();return}
  if(d.lt){UI.lt=d.lt;render();return}
  if(d.f){UI.f[d.f]=d.v;UI.lim=40;render();return}
  if(d.player){playerSheet(+d.player);return}
  if(d.close!==undefined){closeSheet();return}
  if(suppressClick){suppressClick=false;e.preventDefault();return}
  if(d.phase){TAC.phase=d.phase;render();return}
  if(d.shape){const T=S.tac;if(TAC.phase==='base'){T.form={base:d.shape,atk:d.shape,def:d.shape};T.pos={};T.slotAs={};T.fam=famGet(T.preset,d.shape);if(typeof M!=='undefined'&&M&&M.edit){S.xi=E3.bestAssign(S.xi.map(pl),d.shape);T.roles=E3.defaultRoles(S.xi.map(pl),d.shape);T.duties=S.xi.map(()=>1);T.marks=S.xi.map(()=>({on:false,tight:false,t:null}))}else{S.xi=null;T.roles=[]}ensureXI()}else{T.form[TAC.phase]=d.shape;delete T.pos[TAC.phase]}save();render();return}
  if(d.zones!==undefined){TAC.showZones=!TAC.showZones;render();return}
  if(d.resetpos!==undefined){delete S.tac.pos[TAC.phase];if(TAC.phase==='base')S.tac.slotAs={};save();render();return}
  if(d.applyxi!==undefined){S.xi=recLineup();S.tac.roles=E3.defaultRoles(S.xi.map(pl),S.tac.form.base);save();render();toast('추천 라인업을 적용했습니다');return}
  if(d.ment){S.tac.ment=d.ment;save();render();return}
  if(d.preset){const T=S.tac;T.preset=d.preset;T.ti=[...E3.PRESETS[d.preset]];if(!(typeof M!=='undefined'&&M&&M.edit))famSync();else T.fam=famGet(T.preset,T.form.base);save();render();return}
  if(d.ti){S.tac.ti[+d.ti]=+d.v;save();render();return}
  if(d.pinfo){playerSheet(+d.pinfo);return}
  if(d.slotopen){TAC.sel=null;openSlot(+d.slotopen);return}
  if(d.tfocus!==undefined){S.tac.focus=d.tfocus==='null'?null:d.tfocus==='W'?'W':+d.tfocus;save();render();toast(d.tfocus==='null'?'공격 방향 자동':'공격 집중 방향을 정했습니다');return}
  if(d.slot){const i=+d.slot;if(TAC.sel===i){TAC.sel=null;openSlot(i)}else{TAC.sel=i;TAC.bsel=null;render()}return}
  if(d.mslot){openSlot(+d.mslot,'m');return}
  if(d.stab){SH.tab=d.stab;drawSlot();return}
  if(d.sort){SH.sort=d.sort;drawSlot();return}
  if(d.open){const id=+d.open;if(id===S.xi[SH.slot])return;SH.open=SH.open===id?null:id;const y=$('#scrim .sheet').scrollTop;drawSlot();$('#scrim .sheet').scrollTop=y;return}
  if(d.chk){const id=+d.chk,i=SH.cmp.indexOf(id);if(i>=0)SH.cmp.splice(i,1);else{if(SH.cmp.length>=2){toast('현재 선수 포함 최대 3명까지 비교할 수 있습니다');return}SH.cmp.push(id)}const y=$('#scrim .sheet').scrollTop;drawSlot();$('#scrim .sheet').scrollTop=y;return}
  if(d.compare!==undefined){drawCompare();return}
  if(d.back!==undefined){drawSlot();return}
  if(d.role){S.tac.roles[SH.slot]=+d.role;save();drawSlot();return}
  if(d.slotas){const i=SH.slot,bk=E3.FORMS[S.tac.form.base][i];S.tac.slotAs=S.tac.slotAs||{};if(S.tac.pos.base)delete S.tac.pos.base[i];if(d.slotas===bk)delete S.tac.slotAs[i];else S.tac.slotAs[i]=d.slotas;const rs=E3.ROLES[grpAt(i)]||E3.ROLES.CM,p=pl(S.xi[i]);let bi=0,bv=-1;rs.forEach((r,j)=>{const v=E3.roleFit(p,r);if(v>bv){bv=v;bi=j}});S.tac.roles[i]=bi;save();render();drawSlot();return}
  if(d.tsets!==undefined){tsetSheet();return}
  if(d.tsave){S.tsets=S.tsets||[null,null,null];S.tsets[+d.tsave]=tacSnap();save();tsetSheet();toast('전술 '+TSN[+d.tsave]+' 저장');return}
  if(d.tload){const x=(S.tsets||[])[+d.tload];if(x){tsetApply(x);save();closeSheet();render();toast('전술 '+TSN[+d.tload]+' 적용')}return}
  if(d.pi){const id=pl(S.xi[SH.slot]).id;S.tac.pi=S.tac.pi||{};const o=S.tac.pi[id]=S.tac.pi[id]||{};o[d.pi]=+d.v;save();drawSlot();return}
  if(d.pireset){S.tac.pi=S.tac.pi||{};delete S.tac.pi[+d.pireset];save();drawSlot();return}
  if(d.duty){S.tac.duties[SH.slot]=+d.duty;save();drawSlot();return}
  if(d.mk){const m=S.tac.marks[SH.slot];m.on=d.mk==='on';if(m.on&&!m.t){const e2=expectedFor(SH.slot);m.t=e2?e2.p.id:null}save();drawSlot();return}
  if(d.mkt){S.tac.marks[SH.slot].tight=d.mkt==='1';save();drawSlot();return}
  if(d.mtar){S.tac.marks[SH.slot].t=+d.mtar;save();drawSlot();return}
  if(d.pick){const id=+d.pick,i=+d.i,j=S.xi.indexOf(id);if(j>=0){S.xi[j]=S.xi[i];[S.tac.roles[i],S.tac.roles[j]]=[S.tac.roles[j],S.tac.roles[i]]}else S.tac.roles[i]=E3.defaultRoles([pl(id)],S.tac.form.base)[0];S.xi[i]=id;save();closeSheet();render();return}
  if(d.mo){handleMoment(d.mo);return}
  if(d.subin){doSub(+d.subout,+d.subin);return}
  if(d.subout&&!d.subin){UI.subOut=+d.subout;subsSheet();return}
  if(d.pk){takePK(+d.pk);return}
  if(d.kick){kickSheet(d.kick);return}
  if(d.kickset){S.tac.setp=S.tac.setp||{};S.tac.setp[d.kickset]=d.v?+d.v:null;save();closeSheet();render();return}
  if(d.o){const O=UI.off,v=+d.v;
    if(d.o==='fee')O.fee=Math.max(0,O.fee+v*1e6);else if(d.o==='feeset')O.fee=Math.round(v/1e5)*1e5;else if(d.o==='wage')O.wage=Math.max(1e5,Math.round(O.wage*(1+v*.05)/1e4)*1e4);else if(d.o==='loan')O.loan=!!v;else O[d.o]=v;
    O.resp=null;offerSheet(O.id);return}
  if(d.r){const R=UI.ren,v=+d.v;if(d.r==='wage')R.wage=Math.max(1e5,Math.round(R.wage*(1+v*.05)/1e4)*1e4);else R[d.r]=v;R.resp=null;renewSheet(R.id);return}
  if(d.talk){const q=S.ps[+d.id]=S.ps[+d.id]||{},p=pl(+d.id);const h=q.happy??60;let dh=0,msg='';q.cndv=Math.min(100,(q.cndv??50)+(d.talk==='criticize'?(p.pro>=12?6:-10):d.talk==='encourage'?6:4));
    if(d.talk==='praise'){dh=(p.apps||0)>0?6:-2;msg=dh>0?'칭찬을 반기며 의욕을 보였습니다.':'뛴 경기도 없는데 칭찬이 어색하다는 반응입니다.'}
    if(d.talk==='encourage'){dh=h<50?7:2;msg='격려를 고맙게 받아들였습니다.'}
    if(d.talk==='criticize'){dh=p.pro>=12?3:-8;msg=dh>0?'비판을 받아들이고 더 노력하겠다고 합니다.':'비판에 불만을 드러냈습니다.'}
    if(d.talk==='promise2'||d.talk==='promise1'){q.promise=d.talk==='promise2'?2:1;dh=8;msg=`${ROLE_N[q.promise]} 약속을 받고 만족했습니다. 약속을 지키지 못하면 만족도가 크게 떨어집니다.`}
    q.happy=Math.max(0,Math.min(100,h+dh));save();closeSheet();toast(msg);render();return}
  if(d.msg){const m=S.inbox.find(x=>x.id===+d.msg);handleMsg(m,d.do);return}
  switch(d.act){
    case 'resume':S=loadSave();devLoad();careerLoad();SQC=null;render();break;
    case 'advance':advance();break;
    case 'auto':S.xi=E3.autoPick(squadOf(S.club).filter(canUse),S.tac.form.base);S.tac.roles=E3.defaultRoles(S.xi.map(pl),S.tac.form.base);save();render();toast('체력·컨디션·포지션을 반영해 선발을 짰습니다');break;
    case 'msubs':UI.subOut=null;M.paused=true;clearTimeout(M.timer);subsSheet();break;
    case 'mshout':M.paused=true;clearTimeout(M.timer);shoutSheet();break;
    case 'mtac':M.paused=true;clearTimeout(M.timer);mtacSheet();break;
    case 'more':UI.lim+=40;render();break;
    case 'newsf':UI.allNews=false;render();break;case 'newsa':UI.allNews=true;render();break;
    case 'fin':finSheet();break;
    case 'watch':{const id=+d.id,i=S.watch.indexOf(id);if(i>=0)S.watch.splice(i,1);else S.watch.push(id);save();playerSheet(id);break}
    case 'scout':{const id=+d.id;if(S.scouts.length>=scoutMax()){toast(`스카우트는 동시에 ${scoutMax()}명까지 보낼 수 있습니다`);break}S.scouts.push({id,next:addD(S.date,7)});if(!S.watch.includes(id))S.watch.push(id);save();playerSheet(id);toast('스카우트를 파견했습니다. 매주 정보가 쌓입니다');break}
    case 'offer':UI.off=null;offerSheet(+d.id);break;
    case 'sendOffer':{const O=UI.off,p=pl(O.id);const r=clubRespond(p,O);O.resp=r;save();if(r.k==='ok'){const O2=UI.off;O2.resp=null;offerSheet(O.id);toast(r.msg)}else offerSheet(O.id);break}
    case 'payClause':{const O=UI.off,p=pl(O.id);S.negs[p.id]={stage:'player',agreed:{fee:p.clause*1e6,inst:1,clause:true}};O.resp=null;offerSheet(p.id);toast('바이아웃 지불을 전제로 선수와 협상합니다');break}
    case 'sendTerms':{const O=UI.off,p=pl(O.id);const r=playerRespond(p,O);O.resp=r;
      if(r.k==='ok'){const n=S.negs[p.id]||{agreed:{fee:0}};const c=clubOf(p.id);const pre=c!==FA&&monthsLeft(p)<=6&&!winNow();const ag=n.agreed||{fee:0};
        const fee=c===FA||pre?0:ag.fee;const up=ag.loan?0:fee/(ag.inst||1);
        if(up>spendable()){O.resp={k:'no',msg:'예산이 부족합니다.'};offerSheet(O.id);break}
        if(pre){S.pre=(S.pre||[]).concat({id:p.id,wage:O.wage,cEnd:`${S.season+1+O.years}-06-30`,role:O.role});delete S.negs[p.id];closeSheet();inbox('contract','',`${p.name} 사전 계약`,`7월 1일에 자유계약으로 합류합니다.`);save();render();break}
        completeTransfer(p.id,S.club,fee,{wage:O.wage,cEnd:ag.loan?p.cEnd:`${S.season+(D(S.date).getUTCMonth()<6?0:1)+O.years}-06-30`,role:O.role,inst:ag.inst,upfront:up,loan:ag.loan});
        closeSheet();inbox('contract','',`${p.name} 영입 완료`,`${ag.loan?'임대':fee?money(fee):'자유계약'} · 연봉 ${money(O.wage)} · ${O.years}년`);save();render();toast(`${p.name} 영입!`)}else offerSheet(O.id);break}
    case 'renew':UI.ren=null;renewSheet(+d.id);break;
    case 'sendRenew':{const R=UI.ren,p=pl(R.id);const dem=Math.round(p.wage*(1.1+((p.happy??60)<40?.2:0)+(ageOf(p)<24&&p.pa>p.ovr+4?.2:0))/1e4)*1e4;
      if(wageBill(S.club)-p.wage+R.wage>CLUBS[S.club].wageCap*1e6){R.resp={k:'no',msg:'연봉 총액 한도를 넘습니다.'}}
      else if(R.wage>=dem*.97){setP(p.id,{wage:R.wage,cEnd:`${S.season+R.years+(D(S.date).getUTCMonth()<6?0:1)}-06-30`,happy:Math.min(100,(p.happy??60)+10)});R.resp={k:'ok',msg:'재계약에 합의했습니다.'};save()}
      else R.resp={k:R.wage>=dem*.85?'mid':'no',msg:`요구 연봉은 ${money(dem)} 수준입니다.`};renewSheet(R.id);render();break}
    case 'listtog':{const p=pl(+d.id);setP(p.id,{listed:!p.listed,askList:p.listed?null:Math.round(p.val*AGEK(ageOf(p))/1e5)*1e5});save();playerSheet(p.id);render();break}
    case 'loanout':{const p=pl(+d.id);const clubs=CLUBS.filter(c=>c.i!==S.club&&c.rep<CLUBS[S.club].rep&&c.rep>=CLUBS[S.club].rep-45);const to=clubs[Math.floor(Math.random()*clubs.length)];
      if(p.ovr>ourLevel(p)+2){toast('핵심 선수라 임대 보낼 수 없습니다');break}
      completeTransfer(p.id,to.i,0,{loan:true});S.ps[p.id].loanFrom=S.club;save();closeSheet();render();toast(`${p.name}, ${to.name}로 임대`);break}
    case 'talk':talkSheet(+d.id);break;
    case 'speed':M.speed=M.speed===.5?1:M.speed>=1?.25:.5;/* v258: 보통(½)→빠르게(1)→느리게(¼)→보통 */UI.mspd=M.speed;b.textContent=spdLbl(M.speed);break;
    case 'skip':finish();break;
    case 'closematch':$('#match').remove();M=null;closeSheet();render();setTimeout(hlShow,250);break;
    case 'mreport':reportSheet(S.reports&&S.reports[0]);break;
    case 'lastrep':reportSheet(S.reports&&S.reports[+(b.dataset.i||0)]);break;
  }
});
function handleMsg(m,act){const p=pl(m.pid);
  if(['accept','counter','letgo'].includes(act)&&sqSize(S.club)<=16){toast('스쿼드가 16명 이하라 더 팔 수 없습니다');return}
  if(m.type==='offer'){
    if(act==='accept'){completeTransfer(p.id,m.from,m.fee,{cEnd:`${S.season+4}-06-30`,wage:Math.round(p.wage*1.2)});m.result=`${money(m.fee)}에 판매`}
    if(act==='counter'){const c=Math.round(m.fee*1.2/1e5)*1e5;if(c<=m.max){completeTransfer(p.id,m.from,c,{cEnd:`${S.season+4}-06-30`,wage:Math.round(p.wage*1.2)});m.result=`역제안 수락 · ${money(c)}에 판매`}else m.result='역제안 거절, 협상 종료'}
    if(act==='reject'){m.result='거절';if((p.happy??60)<50&&CLUBS[m.from].rep>CLUBS[S.club].rep)setP(p.id,{happy:Math.max(0,(p.happy??60)-12)})}
  }
  if(m.type==='request'){const q=S.ps[p.id]=S.ps[p.id]||{};
    if(act==='list'){q.listed=true;q.askList=Math.round(p.val*AGEK(ageOf(p))/1e5)*1e5;q.happy=Math.min(100,(q.happy??30)+15);m.result='판매 명단에 올림'}
    if(act==='promise'){q.promise=Math.min(2,expectRole(p,S.club)+1);q.happy=Math.min(100,(q.happy??30)+20);m.result=`${ROLE_N[q.promise]} 약속`}
    if(act==='deny'){q.happy=Math.max(0,(q.happy??30)+(p.pro>=12?5:-15));m.result=p.pro>=12?'받아들이고 남기로 함':'크게 실망함'}
    q.reqAt=null}
  if(m.type==='clause'){
    if(act==='letgo'){completeTransfer(p.id,m.from,m.fee,{cEnd:`${S.season+5}-06-30`,wage:Math.round(p.wage*1.4)});m.result='이적 확정'}
    if(act==='persuade'){const stay=(p.happy??60)/100*.7+(p.pro/20)*.3>.55;if(stay){m.result='잔류 설득 성공';setP(p.id,{happy:Math.min(100,(p.happy??60)+5)})}else{completeTransfer(p.id,m.from,m.fee,{cEnd:`${S.season+5}-06-30`,wage:Math.round(p.wage*1.4)});m.result='설득 실패 · 이적 확정'}}}
  m.done=true;m.read=true;save();render();toast(m.result||'처리했습니다');
}
function finSheet(){const c=CLUBS[S.club],wb=wageBill(S.club),cap=c.wageCap*1e6;
  sheet(`<button class="x" data-close>닫기</button><h3>재정</h3><div class="fin">
  <div class="facts"><div><small>연 매출</small><b>${mM(c.rev)}</b></div><div><small>이적 예산</small><b>${money(S.fin.budget)}</b></div><div><small>판매 수입</small><b>${money(S.fin.income)}</b></div></div>
  <p class="note">매출 출처: ${c.revSrc}. 이적 예산 = 매출 × 12% × 지출 성향(${c.tend}) + 판매 수입의 70%.</p>
  <div class="lbl">연봉 총액 ${money(wb)} / 한도 ${money(cap)} (매출의 60%)</div><div class="bar"><i style="left:0;width:${Math.min(100,wb/cap*100)}%;background:${wb/cap>.95?'var(--bad)':'var(--good)'}"></i></div>
  ${S.fin.later.length?`<div class="lbl">예정된 분할금</div>${S.fin.later.map(x=>`<div class="li" style="padding:6px 0"><span class="nm"><b>${esc(x.t)}</b><span>${fmtD(x.d)}</span></span><span class="num">${money(x.v)}</span></div>`).join('')}`:''}
  <div class="lbl">거래 내역</div>${S.fin.log.slice(0,30).map(x=>`<div class="li" style="padding:6px 0"><span class="nm"><b>${esc(x.t)}</b><span>${fmtD(x.d)}</span></span><span class="num" style="color:${x.v<0?'var(--bad)':'var(--good)'}">${money(x.v)}</span></div>`).join('')||'<p class="note">아직 거래가 없습니다.</p>'}</div>`)}
// 사전 계약 합류(7월 1일)
const _roll=rollover;rollover=function(){_roll();(S.pre||[]).forEach(x=>{setP(x.id,{club:S.club,wage:x.wage,cEnd:x.cEnd,promise:x.role,joined:S.date});inbox('contract','',`${pl(x.id).name} 합류`,'사전 계약한 선수가 팀에 합류했습니다.')});S.pre=[]};
const APPV=__CFG__("APPV");

