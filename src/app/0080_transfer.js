// ================= 이적 로직 =================
const AGEK=a=>a<=21?1.2:a<=24?1.03:a<=27?.91:a<=30?.8:.67;
const RIVAL=(a,b)=>{const n=[CLUBS[a].name,CLUBS[b].name].sort().join('|');return n==='Barcelona|Real Madrid'};
function monthsLeft(p){return Math.max(0,daysBetween(S.date,p.cEnd)/30.4)}
function rankInClub(p){const sq=squadOf(clubOf(p.id)).sort((a,b)=>b.ovr-a.ovr);return sq.findIndex(q=>q.id===p.id)+1}
function valueNow(p){ // 게임 내 시장가치: 기본값 × 나이·계약 보정(간단)
  const ml=monthsLeft(p);return Math.round(p.val*(ml<6?.55:ml<12?.8:1))}
function asking(p,buyer){
  const seller=clubOf(p.id); if(seller===FA)return 0;
  const rk=rankInClub(p), imp=rk<=3?1.5:rk<=11?1.25:.95, ml=monthsLeft(p), ck=ml<=12?.6:ml<=24?.85:1;
  const rich=CLUBS[seller].rep>CLUBS[buyer].rep?1.15:(CLUBS[buyer].rep-CLUBS[seller].rep>30?.95:1);
  const noise=.85+.4*hsh(p.id+':'+S.season+':ask');
  let a=p.val*AGEK(ageOf(p))*imp*ck*rich*noise; if(p.clause)a=Math.min(a,p.clause*1e6);
  return Math.round(a/1e5)*1e5;
}
function effOffer(o){const inst={1:1,2:.96,3:.93}[o.inst||1];return o.fee*inst*(1+(o.sellOn||0)/100*.3)}
function expectRole(p,club){ // 선수가 기대하는 역할: 우리 팀 같은 포지션군 내 순위
  const sq=squadOf(club).filter(q=>LINE[q.g]===LINE[p.g]&&q.id!==p.id).sort((a,b)=>b.ovr-a.ovr);
  const need={GK:1,DF:4,MF:3,FW:3}[LINE[p.g]]; const better=sq.filter(q=>q.ovr>p.ovr).length;
  return better<need-1?2:better<need+1?1:0 } // 2 주전, 1 로테이션, 0 백업
const ROLE_N=['백업','로테이션','주전'];
function wageDemand(p,club){const base=Math.max(p.wage*(1.15+.25*hsh(p.id+'w'+S.season)),p.val*.12);
  const fromRep=CLUBS[clubOf(p.id)]?.rep||40, diff=fromRep-CLUBS[club].rep; return Math.round(base*(1+Math.max(0,diff)/100)/1e4)*1e4}
function interest(p,club){const fromC=clubOf(p.id);const fromRep=fromC===FA?30:CLUBS[fromC].rep;
  let v=55+(CLUBS[club].rep-fromRep)*.8+(p.pro-10)*1.2+ (hsh(p.id+'int'+club)-.5)*30; if(fromC!==FA&&RIVAL(fromC,club))v-=60; return v}
function wageBill(c){return squadOf(c).reduce((a,p)=>a+p.wage,0)}
function spendable(){return S.fin.budget}
function completeTransfer(id,to,fee,o){
  const from=clubOf(id), p=pl(id);
  setP(id,{club:to,wage:o.wage??p.wage,cEnd:o.cEnd??p.cEnd,listed:false,promise:o.role??null,joined:S.date,happy:60,loanFrom:o.loan?from:null});
  if(to===S.club){S.fin.budget-=o.upfront??fee;S.fin.log.unshift({d:S.date,t:`${p.name} 영입`,v:-(o.upfront??fee)});if((o.inst||1)>1)S.fin.later.push({d:`${S.season+1}-07-01`,v:fee-(o.upfront??fee),t:`${p.name} 분할금`})}
  if(from===S.club){S.fin.budget+=fee*.7;S.fin.income+=fee;S.fin.log.unshift({d:S.date,t:`${p.name} 판매(예산 70% 반영)`,v:fee*.7});S.xi=S.xi.filter(x=>x!==id)}
  if(from>=0&&from!==S.club&&S.aiBudget[from]!==undefined)S.aiBudget[from]+=fee*.7;
  if(to!==S.club&&S.aiBudget[to]!==undefined)S.aiBudget[to]-=fee;
  S.know[id]=to===S.club?3:S.know[id];
  const big=fee>=2e7||CLUBS[to]?.lg==='ES'||(from>=0&&CLUBS[from]?.lg==='ES');
  S.news.unshift({d:S.date,t:`${p.name}: ${from===FA?'자유계약':CLUBS[from].name} → ${CLUBS[to].name}${o.loan?' (임대)':''}`,v:fee,big});
  S.news=S.news.slice(0,200);
  delete S.negs[id];
}
// 협상 상태: S.negs[id]={stage:'club'|'player'|'broken', tries, fee, until, agreed:{...}}
/* 거절 시 상대 희망 금액(±5% 범위로 반올림)과 시장가치 대비 이유 안내 */
function askHint(p,ask){const r=x=>money(Math.round(x/5e5)*5e5);const v=p.val||0,ratio=v?ask/v:1;const why=[];const rk=rankInClub(p),ml=monthsLeft(p);
  if(rk<=3)why.push('팀 핵심 선수');else if(rk<=11)why.push('주전 선수');if(ml>36)why.push('계약 기간이 많이 남음');else if(ml<=12)why.push('계약 만료가 가까워 할인');
  if(CLUBS[clubOf(p.id)].rep>CLUBS[S.club].rep)why.push('상대가 더 큰 구단');
  return `상대 희망 이적료는 약 ${r(ask*.95)}~${r(ask*1.05)}(일시불 기준, 시장가치 ${money(v)}의 ${Math.round(ratio*100)}%)${why.length?' · 이유: '+why.join(', '):''}.`}
function clubRespond(p,o){
  const n=S.negs[p.id]||(S.negs[p.id]={stage:'club',tries:0});
  if(n.stage==='broken'&&S.date<n.until)return {k:'no',msg:`협상이 결렬되었습니다. ${fmtD(n.until)} 이후 다시 제안할 수 있습니다.`};
  const seller=clubOf(p.id);
  if(RIVAL(seller,S.club)&&hsh(p.id+'rival'+S.season)<.85)return {k:'no',msg:`${CLUBS[seller].name}은 라이벌 구단에 선수를 팔지 않겠다고 합니다.`};
  if(o.loan){const rk=rankInClub(p);const ok=(rk>11||(ageOf(p)<=23&&rk>3))&&o.share>=75;
    if(ok){n.stage='player';n.agreed=Object.assign({},o,{fee:0});return {k:'ok',msg:`${CLUBS[seller].name}이 임대를 수락했습니다. 이제 선수와 개인 조건을 협상하세요.`}}
    n.tries++;return {k:'no',msg:rk<=11?'주전 선수라 임대 보낼 생각이 없답니다.':'연봉 부담 비율을 더 높여 달라고 합니다(75% 이상).'}}
  const ask=asking(p,S.club), e=effOffer(o);
  if(e>=ask){n.stage='player';n.agreed=Object.assign({},o);return {k:'ok',msg:`${CLUBS[seller].name}이 제안을 수락했습니다. 이제 선수와 개인 조건을 협상하세요.`}}
  n.tries++;
  if(n.tries>=3){n.stage='broken';n.until=addD(S.date,14);return {k:'no',msg:`세 번의 제안이 모두 부족해 상대 구단이 협상을 중단했습니다(2주). ${askHint(p,ask)}`}}
  if(e>=ask*.8){const c=Math.round(ask*(1+.05*hsh(p.id+'c'+n.tries))/1e5)*1e5;n.counter=c;return {k:'mid',msg:`${CLUBS[seller].name}의 역제안: ${money(c)} (일시불 기준). 수락하려면 이 금액 이상으로 다시 제안하세요.`}}
  return {k:'no',msg:`${CLUBS[seller].name}이 제안을 거절했습니다. ${askHint(p,ask)}`};
}
function playerRespond(p,t){ // t={wage,years,role}
  const exp=expectRole(p,S.club), dem=wageDemand(p,S.club)*(t.role<exp?1.15:1), itv=interest(p,S.club);
  if(itv<20)return {k:'no',msg:`${p.name}은 ${CLUBS[S.club].name} 이적에 관심이 없다고 합니다.`};
  if(wageBill(S.club)+t.wage>CLUBS[S.club].wageCap*1e6)return {k:'no',msg:'연봉 총액 한도를 넘습니다. 다른 선수를 정리하거나 연봉을 낮추세요.'};
  if(t.wage>=dem*.97)return {k:'ok',msg:`${p.name}이 조건을 받아들였습니다.`};
  if(t.wage>=dem*.85)return {k:'mid',msg:`${p.name} 측 요구: 연봉 ${money(dem)}${t.role<exp?` (기대 역할: ${ROLE_N[exp]}, 약속이 낮아 요구액이 올랐습니다)`:''}.`};
  return {k:'no',msg:`${p.name} 측이 연봉이 너무 낮다고 합니다. 요구액은 ${money(dem)} 수준입니다.`};
}
