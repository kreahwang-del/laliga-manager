// ================= v309 1군 등록 30명 + 보유 40명(사용자 결정 2026-11-23) =================
// 보유(계약)와 1군 등록을 분리: 넘는 인원은 계약 해지 대신 2군으로. 외국인 보유 한도는 1군 등록 선수만 셈
// 영입 직후: AI 구단은 다시 배정(resAssignAI), 사용자 구단은 1군 등록이 꽉 차 있으면 새 선수를 2군에 등록하고 알림
{const _ct=completeTransfer;completeTransfer=function(id,to,fee,o){const p=pl(id);
  try{/* AI 외국인 영입: 한도가 차 있으면 가장 약한 등록 외국인을 먼저 2군으로(1014의 계약 해지 대신) */
    if(sqrOn()&&p&&to!==S.club&&to>=0&&CLUBS[to]&&!(o&&o.loan)&&clubOf(id)!==to&&isFor(p,to)){const cap=aiCap(to);if(cap&&forCnt(to)>=cap&&ownSize(to)<OWNMAX){const w=sqrWeakFor(to,id);if(w&&w.ovr<p.ovr)(S.ps[w.id]=S.ps[w.id]||{}).res=true}}}catch(e){console.error(e)}
  const r=_ct.apply(this,arguments);
  try{if(sqrOn()&&to>=0&&CLUBS[to]&&clubOf(id)===to){if(to!==S.club){if(regOver(to)||lgQuotaOver(to))resAssignAI(to)}
    else if(regOver(S.club)){const q=S.ps[id]=S.ps[id]||{};const ln=q.loanFrom!=null&&q.loanFrom!==S.club;if(!ln){q.res=true;if(!(typeof unemp==='function'&&unemp()))inbox('board','','1군 등록 인원 초과',`1군 등록이 꽉 차(${regTxt(S.club)}) ${p?p.name:'새 선수'}을(를) 2군에 등록했습니다. 선수 화면에서 1군으로 올리려면 다른 선수를 2군으로 내리세요(23세 미만은 2군에 있어도 1군 소집 가능).`)}}}}catch(e){console.error(e)}
  return r}}
// 기존 세이브: 첫 불러오기 때 AI 구단 한 번 다시 배정(새 기준)
{const _dl=devLoad;devLoad=function(){const r=_dl.apply(this,arguments);try{if(S&&!S.mig309){S.mig309=1;CLUBS.forEach(c=>{if(c&&c.i!==S.club&&c.i>=0)try{resAssignAI(c.i)}catch(e){}});SQC=null}}catch(e){console.error(e)}return r}}
{const _sg=startGame;startGame=function(){const r=_sg.apply(this,arguments);try{if(S)S.mig309=1}catch(e){}return r}}
