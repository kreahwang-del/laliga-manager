// ================= v247 구단 매출 보정 · 선수단 비용 비율 규정(SCR) — 사용자 요청 =================
// ① 매출 보정: 딜로이트 머니리그에 없는 구단 매출은 '스쿼드 가치 추정'이라 5대 리그 밖이 크게 부풀려져 있었음(예: 벤피카 €718M·아약스 €700M·갈라타사라이 €792M → 리그 전체가 실제의 5~14배)
//    리그 실제 매출(2023/24)에 맞춰 딜로이트 외 구단 매출·연봉 한도에 배율: 5대 리그 = Deloitte Annual Review 2025(EPL £6.3bn·분데스 €3.8bn·라리가 €3.8bn·세리에A €2.9bn·리그1 €2.6bn)에서 딜로이트 머니리그 구단 몫을 뺀 나머지
//    스코틀랜드 €378M(UEFA 2025), 포르투갈 약 €600M·덴마크 약 €230M(UEFA 입장 수입과 그 비중으로 역산), 그 밖의 리그는 추정(표시: 추정)
//    벤피카는 딜로이트 머니리그 2026(2024/25) €283.4M으로 고정(이름 불일치로 빠져 있었음)
const RVF={EN:.48,ES:.48,IT:.44,DE:.77,FR:.67,PT:.072,NL:.13,TR:.19,BE:.17,SC:.30,DK:.15,AT:.25,CH:.21,BR:.28,AR:.12,US:.29,MX:.26,SA:.3,EN2:.26,DE2:.43,IT2:.16,FR2:.25,ES2:.47,JP:.49,KR:.33,CN:.53};
/* 리그 평균 연봉/매출 비율(Deloitte 2025 기준 근사: EPL 63%·라리가 62%·분데스 55%·세리에A 68%·리그1 70%, 그 밖 60% 추정) */const WRT={EN:.63,ES:.62,DE:.55,IT:.68,FR:.70};
const W0={};(function(){try{for(const id in BASE){const p=BASE[id];if(p&&p.club!=null)W0[p.club]=(W0[p.club]||0)+(p.wage||0)}}catch(e){}})();
(function(){try{CLUBS.forEach(c=>{if(!c)return;if(/Benfica/.test(c.name)){const f=283.4/c.rev;c.rev=283.4;c.revSrc='딜로이트 2026';c.wageCap=Math.round(c.wageCap*f*10)/10;return}
  if(/딜로이트/.test(c.revSrc||''))return;const f=RVF[c.lg]??RVF[typeof baseLg==='function'?baseLg(c.lg):c.lg]??.3;c.rev0=c.rev;const w0=(W0[c.i]||0)/1e6,tr=WRT[c.lg]??.6;
    /* 단, 시작 연봉 총액 ÷ 리그 평균 연봉 비율보다 낮게 잡지 않음 — 5대 리그 중위권은 연봉이 리그 평균 수준이라 배율만 쓰면 매출보다 연봉이 큰 구단이 생김(레알 소시에다드·나폴리 등) */
    c.rev=Math.round(Math.max(c.rev*f,w0/tr)*10)/10;c.wageCap=Math.round(Math.max(c.wageCap*(c.rev/c.rev0),w0*1.08)*10)/10;c.revSrc=(c.revSrc||'')+' · 리그 실제 매출 보정'})}catch(e){console.error(e)}})();
function rvfOf(c){const C=CLUBS[c];if(!C||C.rev0==null)return /Benfica/.test(C&&C.name||'')?null:1;return C.rev/C.rev0}
// 기존 세이브: 저장된 연봉 한도(S.wcap·S.wc0)도 같은 배율로 한 번 — 우리 구단은 이번 시즌엔 지금 연봉 총액 아래로 내리지 않음(다음 시즌부터 적용, 안내 메일)
{const _dlR=devLoad;devLoad=function(){const r=_dlR.apply(this,arguments);try{if(S&&!S.rvf247){S.rvf247=1;const bf=CLUBS.find(c=>c&&/Benfica/.test(c.name));
    const fac=c=>{const C=CLUBS[c];if(!C)return 1;if(C.rev0!=null)return C.rev/C.rev0;return 1};
    for(const k of ['wcap','wc0'])if(S[k])for(const c in S[k]){const f=fac(+c);if(f!==1)S[k][c]=Math.round(S[k][c]*f*10)/10}
    if(S.club!=null&&S.club>=0&&CLUBS[S.club]){const wb=wageBill(S.club)/1e6;if(CLUBS[S.club].wageCap<wb){S.scrGrace=S.season;CLUBS[S.club].wageCap=Math.ceil(wb);(S.wcap=S.wcap||{})[S.club]=Math.ceil(wb)}
      inbox('board','',`재정 기준 변경: 구단 매출·연봉 한도 재산정`,`리그 실제 매출 수준에 맞춰 구단 매출을 다시 계산했습니다. ${esc(CLUBS[S.club].name)} 연 매출 €${Math.round(CLUBS[S.club].rev)}M · 선수단 비용 한도 ${Math.round(scrLim(S.club)*100)}%${S.scrGrace===S.season?'<br>지금 연봉 총액이 새 한도를 넘어, 이번 시즌은 유예하고 다음 시즌부터 규정을 적용합니다. 연봉 총액을 줄여 두세요.':''}`)}}}catch(e){console.error(e)}return r}}
// ② 선수단 비용 비율(SCR) = (선수 연봉 + 이적료 상각) ÷ 매출
//  한도: EPL 85%(2026/27부터, 115% 넘으면 승점 6 + £6.5M(약 €7.6M)마다 1점 삭감) · 유럽대항전 출전 구단 70%(UEFA) · 라리가 70%(구단별 비용 한도를 비율로 근사, 넘으면 판매 수입의 20%만 재투자) · 그 밖의 리그 80%(추정, 리그 라이선스)
//  이적료 상각 = 이적료 ÷ 계약 연수(게임 시작 뒤 이적만 기록). 우리 구단은 시즌 종료 때 정산, AI 구단은 영입 때마다 검사
function scrInEu(c){try{if(!S.eu||S.eu.y!==S.season)return false;for(const k in S.eu.comp)if((S.eu.comp[k].teams||[]).includes(c))return true}catch(e){}return false}
function scrLim(c){const lg=CLUBS[c]&&CLUBS[c].lg;let L=lg==='EN'?.85:lg==='ES'?.70:.80;if(scrInEu(c))L=Math.min(L,.70);return L}
function scrAm(c){let a=0;const y=S.season;for(const id in (S.am||{})){const x=S.am[id];if(x.c===c&&y<=x.u)a+=x.a}return a}
function scrCost(c){return wageBill(c)+scrAm(c)}
function scrRatio(c){const R=(CLUBS[c].rev||1)*1e6;return scrCost(c)/R}
function SCRON(){return !(typeof SCR_OFF!=='undefined'&&SCR_OFF)}
{const _ctA=completeTransfer;completeTransfer=function(id,to,fee,o){const fr=clubOf(id);const over=SCRON()&&fr>=0&&CLUBS[fr]&&CLUBS[fr].lg==='ES'&&scrRatio(fr)>scrLim(fr);if(over){o=Object.assign({},o||{});o._w0=pl(id).wage||0;o._wb0=wageBill(fr)}const r=_ctA.apply(this,arguments);try{if(!SCRON())return r;const A=S.am=S.am||{};delete A[id];
    if(fee>0&&!(o&&o.loan)&&to>=0&&CLUBS[to]){const ce=(o&&o.cEnd)||pl(id).cEnd||`${S.season+3}-06-30`;const yrs=Math.max(1,Math.min(5,+String(ce).slice(0,4)-S.season));A[id]={c:to,a:fee/yrs,u:S.season+yrs-1}}
    /* 라리가 재투자 제한(v248 보강): 한도를 넘은 구단은 판매 수입의 20%만(원래 70% 반영), 팀 연봉 총액의 5%를 넘게 받던 핵심 선수 판매는 30% */if(over&&fee>0){const fr5=(o&&o._w0!=null?o._w0:0)>(o&&o._wb0||Infinity)*.05;const keep=fr5?.3:.2;const cut=fee*(.7-keep);if(fr===S.club){S.fin.budget-=cut;S.fin.log.unshift({d:S.date,t:`라리가 비용 한도 초과 — 판매 수입 재투자 ${Math.round(keep*100)}%만 허용${fr5?'(핵심 선수)':''}`,v:-cut})}else if(S.aiBudget[fr]!==undefined)S.aiBudget[fr]-=cut}
    /* 비용 절감분 재투자: 한도를 넘은 라리가 구단에서 선수가 나가면(판매·방출) 줄어든 연봉 1년치의 60%(핵심 선수 70%)를 이적 예산에 */if(over&&o&&o._w0>0&&!(o.loan)){const fr5=o._w0>(o._wb0||Infinity)*.05;const sv=o._w0*(fr5?.7:.6);if(fr===S.club){S.fin.budget+=sv;S.fin.log.unshift({d:S.date,t:`라리가 비용 절감분 재투자 ${fr5?70:60}%`,v:sv})}else if(S.aiBudget[fr]!==undefined)S.aiBudget[fr]+=sv}}catch(e){console.error(e)}return r}}
// AI 영입 검사: 영입 뒤 SCR이 한도를 넘으면 그 영입은 하지 않음(연봉 = 지금 연봉 × 1.15 × 리그 배율, 상각 = 이적료 ÷ 계약 연수)
function scrOK(p,c,fee){if(!SCRON())return true;try{const yrs=4;const w=p.wage*1.15*(typeof lgWageMul==='function'?lgWageMul(p,c):1);const add=w+(fee||0)/yrs;return (scrCost(c)+add)<=(scrLim(c)-.03)*CLUBS[c].rev*1e6}catch(e){return true}}
// 시즌 종료 정산(모든 구단): 위반 기록 → 우리 구단 메일·제재, AI 구단 다음 시즌 예산 감액
function scrSettle(){if(!SCRON())return;const out=[];const y=S.season;S.pen=S.pen||{};CLUBS.forEach(c=>{if(!c||c.i===FA||c.i===RET||!c.rev)return;if(c.i!==S.club&&S.aiBudget[c.i]===undefined)return;const R=c.rev*1e6,cost=scrCost(c.i),r=cost/R,L=scrLim(c.i);if(r<=L)return;/* v248 유예 구간: EPL은 규정대로(85% 넘으면 부담금), 그 밖은 한도 +5%p까지 경고만 */if(c.lg!=='EN'&&r<=L+.05){if(c.i===S.club)inbox('board','',`선수단 비용 비율 경고 (${Math.round(r*100)}% / 한도 ${Math.round(L*100)}%)`,'한도를 조금 넘었습니다. +5%p를 넘으면 제재를 받습니다.');return}
  if(c.i===S.club&&S.scrGrace===y){out.push([c.i,r,L,'유예']);return}
  let msg='';if(c.lg==='EN'){const red=L+.30;if(r>red){const pts=6+Math.floor((cost-red*R)/7.6e6);(S.pen[y+1]=S.pen[y+1]||{})[c.i]=pts;msg=`승점 ${pts}점 삭감(다음 시즌)`}else{const lev=(cost-L*R)*(r-L);msg=`부담금 €${(lev/1e6).toFixed(1)}M`;if(c.i===S.club){S.fin.budget-=lev;S.fin.log.unshift({d:S.date,t:'선수단 비용 비율 부담금',v:-lev})}else S.aiBudget[c.i]=(S.aiBudget[c.i]||0)-lev}}
  else if(scrInEu(c.i)){const fine=(cost-L*R)*.1;msg=`UEFA 벌금 €${(fine/1e6).toFixed(1)}M(초과분 10%)`;if(c.i===S.club){S.fin.budget-=fine;S.fin.log.unshift({d:S.date,t:'UEFA 재정 규정 벌금',v:-fine})}else S.aiBudget[c.i]=(S.aiBudget[c.i]||0)-fine}
  else if(c.lg==='ES'){msg='비용 한도 초과 — 다음 시즌 판매 수입 재투자 20%로 제한'}
  else{msg='리그 라이선스 — 다음 시즌 이적 예산 절반';if(c.i===S.club){S.fin.budget=Math.min(S.fin.budget,S.fin.budget*.5)}else S.aiBudget[c.i]=(S.aiBudget[c.i]||0)*.5}
  out.push([c.i,r,L,msg])});
  const me=out.find(x=>x[0]===S.club);if(me)inbox('board','',`선수단 비용 비율 초과 (${Math.round(me[1]*100)}% / 한도 ${Math.round(me[2]*100)}%)`,`${me[3]==='유예'?'이번 시즌은 유예입니다. 다음 시즌부터 제재가 적용됩니다.':esc(me[3])}<br>선수단 비용 = 선수 연봉 + 이적료 상각, 매출 €${Math.round(CLUBS[S.club].rev)}M 기준.`);
  S.scrLog=(S.scrLog||[]).concat([{y,n:out.length,top:out.slice(0,10).map(x=>[x[0],Math.round(x[1]*100),x[3]])}]).slice(-12)}
{const _roS=rollover;rollover=function(){try{if(S.seasonDone)scrSettle()}catch(e){console.error(e)}return _roS.apply(this,arguments)}}
// 승점 삭감 반영(우리 리그 순위표·다른 리그 순위표)
{const _tb=table;table=function(){const t=_tb.apply(this,arguments);try{const P=S.pen&&S.pen[S.season];if(P&&Object.keys(P).length){t.forEach(r=>{if(P[r.id])r.pts-=P[r.id]});t.sort((x,y)=>y.pts-x.pts||(y.gf-y.ga)-(x.gf-x.ga)||y.gf-x.gf)}}catch(e){}return t}}
if(typeof tableLg==='function'){const _tl=tableLg;tableLg=function(lg){const t=_tl.apply(this,arguments);try{const P=S.pen&&S.pen[S.season];if(P&&Object.keys(P).length){t.forEach(r=>{if(P[r.id])r.pts-=P[r.id]});t.sort((x,y)=>y.pts-x.pts||(y.gf-y.ga)-(x.gf-x.ga)||y.gf-x.gf)}}catch(e){}return t}}
// 재정 화면에 선수단 비용 비율
{const _fsS=finSheet;finSheet=function(){const r=_fsS.apply(this,arguments);try{if(S.club<0||!SCRON())return r;const sh=document.querySelector('#scrim .sheet');if(!sh||sh.querySelector('.scrw'))return r;const c=S.club,R=CLUBS[c].rev,ra=scrRatio(c),L=scrLim(c);const P=S.pen&&S.pen[S.season]&&S.pen[S.season][c];
  sh.insertAdjacentHTML('beforeend',`<div class="scrw"><h3 style="margin:14px 0 6px">선수단 비용 비율 (재정 규정)</h3><div class="card pad" style="font-size:13px;line-height:1.6">매출 €${Math.round(R)}M · 선수단 비용 €${Math.round(scrCost(c)/1e6)}M(연봉 €${Math.round(wageBill(c)/1e6)}M + 이적료 상각 €${Math.round(scrAm(c)/1e6)}M)<br><b style="color:${ra>L?'var(--bad)':'var(--good)'}">${Math.round(ra*100)}%</b> / 한도 ${Math.round(L*100)}% (${CLUBS[c].lg==='EN'?'EPL 85%':CLUBS[c].lg==='ES'?'라리가 비용 한도(비율 근사)':'리그 라이선스 80%(추정)'}${scrInEu(c)?' · 유럽대항전 출전 UEFA 70%':''})${S.scrGrace===S.season?'<br>이번 시즌은 재정 기준 변경으로 유예':''}${P?`<br>승점 삭감 ${P}점 적용 중`:''}<p class="note" style="margin:6px 0 0">시즌 종료 때 정산 — 넘으면 EPL 부담금(115% 넘으면 승점 삭감), UEFA 벌금, 라리가 재투자 20% 제한, 그 밖의 리그 다음 시즌 이적 예산 절반</p></div></div>`)}catch(e){console.error(e)}return r}}

// ---- v243 컵·유럽대항전도 엔진(사용자 제안: 대진이 정해진 경기는 미리 계산) ----
// 대진이 나온 다른 팀 컵·유럽대항전 경기(국내 컵·챔스·유로파·컨퍼런스, 1·2차전 모두)를 리그 경기와 함께 미리 계산 → 그날 결과(점수)를 엔진 결과로
// 연장·승부차기·합산·다음 라운드는 지금 규칙 그대로(cupPost). 승강 플레이오프(2부)는 빠른 결과 유지. 컵·유럽 경기는 시즌 리그 기록에는 넣지 않음(이전과 같음)
function eaKoList(from,to,incl){const L=[];const mineOn=!(typeof unemp==='function'&&unemp());const add=f=>{if(!f||f.res||f.h==null||f.a==null)return;if(incl?f.d!==from:(f.d<=from||f.d>to))return;if(mineOn&&(f.h===S.club||f.a===S.club))return;L.push(f)};
  try{if(typeof cupAll==='function')cupAll().forEach(add)}catch(e){}try{if(typeof euAll==='function')euAll().forEach(add)}catch(e){}return L}
// 진행: 그날 경기(리그·컵·유럽)를 처리하기 전에 미리 계산이 끝나길 기다림(없으면 지금 시작)
function engAllPre(){try{if(!engAllOn())return null;const L=eaKoList(S.date,S.date,true);if(S.fixO)S.fixO.forEach(f=>{if(!f.res&&f.d===S.date)L.push(f)});if(S.fxE)for(const lg in S.fxE)S.fxE[lg].forEach(f=>{if(!f.res&&f.d===S.date)L.push(f)});
  const P=[];L.forEach(f=>{const o=EA.pre[eaKey(f)]||eaStart(f);if(o&&!o.r){if(typeof simBump==='function')simBump(o.p,'');P.push(o.p)}});/* v266: 오늘 경기는 대기열 맨 앞으로 */return P.length?Promise.all(P):null}catch(e){console.error(e);return null}}
{const _cfE=cupFast;cupFast=function(f){try{if(engAllOn()){const k=eaKey(f),o=EA.pre[k];if(o&&o.r){delete EA.pre[k];const res=o.r;res.T=res.T||[{club:o.H.club,xi:[]},{club:o.A.club,xi:[]}];try{applyMatch(o.H,o.A,res,false)}catch(e){}f.res=Object.assign(pack(res),{eng:1});return}}}catch(e){console.error(e)}return _cfE.apply(this,arguments)}}

