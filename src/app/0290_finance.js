// ================= 구단 재정·시설(v78) =================
// 운영 손익: 매출(입장·중계·상업) − 지출(선수 연봉·코치 연봉·시설 유지·기타 운영비)
//  · 매출 기준: 구단 연 매출(딜로이트 풋볼 머니 리그 2026 또는 스쿼드 가치 추정). 구성비는 근사치 — 딜로이트 상위 구단 입장 18%·중계 34%·상업 48%, 그 외(추정 구단) 14%·62%·24%
//  · 입장 수입 = 경기장 좌석(Transfermarkt) × 관중 비율 × 객단가(기준 시즌 22홈경기·관중 85%에서 위 구성비가 되도록 구단별 산정). 관중 비율은 기대 순위 대비 성적·최근 폼에 따라 55~100%
//  · 기타 운영비는 시즌 시작 때 '기대 운영 이익 = 기본 이적 예산'이 되도록 정함 → 기대보다 잘 벌면(관중·성적·상금) 차액의 50%가 다음 시즌 이적 예산에 더해지고, 연봉을 늘리면 줄어듦
//  · 시즌 종료 정산: 순위별 중계권 차등(±15%), 트로피당 상업 수입 +5%
// 시설(1~5단계, 구단 평판으로 시작 단계): 경기장 증축(좌석 +10%·12개월), 훈련장(성장 +3%/단계·부상 −5%/단계, 6개월), 유스 아카데미(유망주 등급 +6%/단계, 6개월) — 효과는 시작 단계 대비
const FIN_MIX=d=>d?{md:.18,tv:.34,com:.48}:{md:.14,tv:.62,com:.24};
const FAC_N={st:['경기장','좌석 +10% → 입장 수입'],tr:['훈련장','성장 +3%·부상 −5% (단계당)'],yo:['유스 아카데미','유망주 등급 +6% (단계당)']};
function finSeats(c){const t=CLUBS[c].tm;const s=t!=null&&typeof STAD!=='undefined'?STAD[t]:null;return s||Math.round(Math.max(6000,Math.min(40000,CLUBS[c].rev*250)))}
function facInit(){if(!S||S.club==null||S.club<0)return null;if(S.fac&&S.fac.c===S.club)return S.fac;const c=S.club,l0=Math.max(1,Math.min(5,1+Math.round((CLUBS[c].rep||40)/25)));
  S.fac={c,seats:finSeats(c),seats0:finSeats(c),st:{l:0,l0:0},tr:{l:l0,l0},yo:{l:l0,l0},build:null};return S.fac}
function finBase(){const c=CLUBS[S.club],R=c.rev*1e6,mix=FIN_MIX(/딜로이트/.test(c.revSrc||''));const F=facInit();const price=R*mix.md/(F.seats0*.85*22);return {R,mix,price}}
function finStaffW(){return (S.staff||[]).reduce((a,s)=>a+s.w,0)}
function finUpkeep(){const F=facInit();return ((F.tr.l)+(F.yo.l))*6e5}
function finSeasonStart(){if(!S||unempF())return;const b=finBase();const W=wageBill(S.club),St=finStaffW(),Up=finUpkeep(),B=CLUBS[S.club].budget*1e6;
  const O=Math.max(b.R*.08,b.R-W-St-Up-B);S.fin.ps={y:S.season,inc:{md:0,tv:0,com:0,set:0},exp:{wage:0,staff:0,up:0,oth:0},O,expNet:b.R-W-St-Up-O,done:false};S.fin.cash=S.fin.cash||0}
function unempF(){return typeof unemp==='function'&&unemp()}
function finAdd(kind,k,v,label){const ps=S.fin.ps;if(!ps)return;ps[kind][k]=(ps[kind][k]||0)+v;S.fin.cash=(S.fin.cash||0)+(kind==='inc'?v:-v);if(label&&Math.abs(v)>=1)S.fin.log.unshift({d:S.date,t:label,v:kind==='inc'?v:-v,op:1});S.fin.log=S.fin.log.slice(0,120)}
function finFill(){const ex=S.exp&&S.exp[S.club];let pos=10,n=20;try{pos=posOf(S.club);n=LIGA.length}catch(e){}const perf=ex?(ex.ep-pos)/Math.max(6,n/2):0;
  const f5=(S.form5||[]).reduce((a,x)=>a+(x==='W'?1:x==='L'?-1:0),0);return Math.max(.55,Math.min(1,.85+.12*perf+.012*f5))}
// 월별 정산(매달 1일)·시즌 종료 정산
function finMonthly(){if(!S.fin.ps||S.fin.ps.y!==S.season)finSeasonStart();const b=finBase(),ps=S.fin.ps,mo=+S.date.slice(5,7);
  const tv=(mo>=8||mo<=5)?b.R*b.mix.tv/10:0,com=b.R*b.mix.com/12,w=wageBill(S.club)/12,st=finStaffW()/12,up=finUpkeep()/12,ot=ps.O/12;
  finAdd('inc','tv',tv);finAdd('inc','com',com);finAdd('exp','wage',w);finAdd('exp','staff',st);finAdd('exp','up',up);finAdd('exp','oth',ot);
  S.fin.log.unshift({d:S.date,t:`${mo}월 운영 손익(중계·상업 − 연봉·운영비)`,v:Math.round(tv+com-w-st-up-ot),op:1})}
function finSeasonEnd(){const ps=S.fin.ps;if(!ps||ps.done)return;const b=finBase();let pos=10,n=20;try{pos=posOf(S.club);n=LIGA.length}catch(e){}
  const merit=b.R*b.mix.tv*.3*((n-pos)/Math.max(1,n-1)-.5);finAdd('inc','set',merit,`중계권 순위 정산 (${pos}위)`);
  const tr=((S.me&&S.me.seasons||[]).find(s=>s.y===S.season)||{tr:[]}).tr.length;if(tr)finAdd('inc','set',b.R*b.mix.com*.05*tr,`트로피 ${tr}개 상업 보너스`);
  const inc=Object.values(ps.inc).reduce((a,v)=>a+v,0),exp=Object.values(ps.exp).reduce((a,v)=>a+v,0);ps.net=inc-exp;ps.carry=Math.round((ps.net-ps.expNet)*.5);ps.done=true;
  inbox('board','',`시즌 재정 결산`,`운영 손익 ${money(ps.net)} (기대 ${money(ps.expNet)}) → 다음 시즌 이적 예산 ${ps.carry>=0?'+':''}${money(ps.carry)}`)}
// 훅
{const _am=applyMatch;applyMatch=function(H,Aw,res,counts){const out=_am.apply(this,arguments);try{if(counts&&S&&!unempF()&&H.club===S.club){if(!S.fin.ps||S.fin.ps.y!==S.season)finSeasonStart();const b=finBase(),F=facInit();const fill=finFill(),att=Math.round(F.seats*fill);
  finAdd('inc','md',att*b.price,`홈 경기 입장 수입 · 관중 ${att.toLocaleString()}명(${Math.round(fill*100)}%)`);S.fin.lastAtt=att}}catch(e){console.error(e)}return out}}
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);try{if(S&&!unempF()&&S.club>=0){facInit();if(!S.fin.ps)finSeasonStart();
  if(S.date.endsWith('-01'))finMonthly();
  const B=S.fac.build;if(B&&S.date>=B.d){if(B.k==='st'){S.fac.seats+=B.add;S.fac.st.l++}else S.fac[B.k].l++;inbox('board','',`${FAC_N[B.k][0]} 공사 완료`,B.k==='st'?`좌석 ${B.add.toLocaleString()}석 증설 · 총 ${S.fac.seats.toLocaleString()}석`:`${FAC_N[B.k][0]} ${S.fac[B.k].l}단계`);S.fac.build=null}
  if(S.seasonDone&&S.fin.ps&&!S.fin.ps.done&&S.awards&&S.awards[S.season])finSeasonEnd()}}catch(e){console.error(e)}return r}}
{const _ro=rollover;rollover=function(){try{if(S&&!unempF()&&S.fin.ps&&!S.fin.ps.done)finSeasonEnd()}catch(e){}const carry=S&&S.fin&&S.fin.ps&&S.fin.ps.carry||0;const club0=S&&S.club;const out=_ro.apply(this,arguments);
  try{if(S&&!unempF()&&S.club===club0&&carry){const v=Math.max(-S.fin.budget*.6,carry);S.fin.budget+=v;S.fin.log.unshift({d:S.date,t:`지난 시즌 운영 손익 반영(기대 대비 50%)`,v})}if(S&&!unempF())finSeasonStart()}catch(e){console.error(e)}return out}}
// 시설 효과: 훈련장(성장·부상), 유스 아카데미(유망주)
{const _tm=trMult;trMult=function(k){const F=S&&S.fac&&S.fac.c===S.club?S.fac:null;return _tm(k)*(F?1+.03*(F.tr.l-F.tr.l0):1)}}
{const _ti=trInjF;trInjF=function(){const F=S&&S.fac&&S.fac.c===S.club?S.fac:null;return _ti()*(F?Math.max(.7,1-.05*(F.tr.l-F.tr.l0)):1)}}
{const _my=makeYouth;makeYouth=function(c,y,o={}){const F=S&&S.fac&&S.fac.c===c&&c===S.club?S.fac:null;if(!F||o.grade||o.pa||F.yo.l===F.yo.l0)return _my.apply(this,arguments);const nm=CLUBS[c].name,had=Object.prototype.hasOwnProperty.call(YOUTH_MULT,nm),old=YOUTH_MULT[nm];
  YOUTH_MULT[nm]=(old||1)*(1+.06*(F.yo.l-F.yo.l0));try{return _my.apply(this,arguments)}finally{if(had)YOUTH_MULT[nm]=old;else delete YOUTH_MULT[nm]}}}
// 시설 공사 비용
function facCost(k){const F=facInit();if(k==='st'){const add=Math.max(3000,Math.round(F.seats*.1/500)*500);return {add,cost:add*4000,mo:12}}const l=F[k].l;return {cost:(k==='tr'?8e6:6e6)*(l+1),mo:6}}
// ---- 화면(재정 시트 교체) ----
finSheet=function(){const c=CLUBS[S.club],wb=wageBill(S.club),cap=c.wageCap*1e6;facInit();if(!S.fin.ps)finSeasonStart();const b=finBase(),ps=S.fin.ps,F=S.fac;
  const inc=Object.values(ps.inc).reduce((a,v)=>a+v,0),exp=Object.values(ps.exp).reduce((a,v)=>a+v,0);
  const row=(l,v,n)=>`<div class="li" style="padding:6px 0"><span class="nm"><b>${l}</b>${n?`<span>${n}</span>`:''}</span><span class="num" style="color:${v<0?'var(--bad)':'var(--text)'}">${money(v)}</span></div>`;
  const facRow=k=>{const lv=k==='st'?F.st.l:F[k].l,co=facCost(k),busy=F.build;const max=k==='st'?F.st.l>=5:lv>=5;
    return `<div class="li" style="padding:8px 0"><span class="nm"><b>${FAC_N[k][0]} ${k==='st'?`${F.seats.toLocaleString()}석`:`${lv}단계`}</b><span>${FAC_N[k][1]}${k!=='st'&&lv!==F[k].l0?` · 시작 대비 ${lv-F[k].l0>0?'+':''}${lv-F[k].l0}`:''}</span></span>${busy&&busy.k===k?`<span class="note">공사 중 · ${fmtD(busy.d)}</span>`:max?'<span class="note">최대</span>':`<button class="btn sm ${busy?'ghost':''}" data-fac="${k}" ${busy?'disabled':''}>${k==='st'?`+${co.add.toLocaleString()}석`:'확장'} ${money(co.cost)}</button>`}</div>`};
  sheet(`<button class="x" data-close>닫기</button><h3>재정</h3><div class="fin">
  <div class="facts"><div><small>연 매출(기준)</small><b>${mM(c.rev)}</b></div><div><small>이적 예산</small><b>${money(S.fin.budget)}</b></div><div><small>운영 손익(이번 시즌)</small><b style="color:${inc-exp<0?'var(--bad)':'var(--good)'}">${money(inc-exp)}</b></div></div>
  <div class="lbl">이번 시즌 수입</div>${row('입장 수입',ps.inc.md,`좌석 ${F.seats.toLocaleString()} · 객단가 €${Math.round(b.price)}${S.fin.lastAtt?` · 최근 관중 ${S.fin.lastAtt.toLocaleString()}`:''}`)}${row('중계권',ps.inc.tv,'8~5월 매달 · 시즌 끝 순위 정산 ±15%')}${row('상업(스폰서·용품)',ps.inc.com,'매달 · 트로피당 +5%')}${ps.inc.set?row('시즌 정산',ps.inc.set):''}
  <div class="lbl">이번 시즌 지출</div>${row('선수 연봉',-ps.exp.wage,`현재 연봉 총액 ${money(wb)}/년`)}${row('코치 연봉',-ps.exp.staff,`${money(finStaffW())}/년`)}${row('시설 유지',-ps.exp.up)}${row('기타 운영비(상각·인건비 등)',-ps.exp.oth,`${money(ps.O)}/년 · 시즌 시작 때 고정`)}
  <p class="note">기대 운영 손익 ${money(ps.expNet)} — 시즌이 끝나면 기대와의 차이의 50%가 다음 시즌 이적 예산에 더해지거나 빠집니다(연봉을 늘리면 줄어듦). 매출 구성비는 근사치이며 매출 출처: ${esc(c.revSrc)}.</p>
  <div class="lbl">연봉 총액 ${money(wb)} / 한도 ${money(cap)} (매출의 60%)</div><div class="bar"><i style="left:0;width:${Math.min(100,wb/cap*100)}%;background:${wb/cap>.95?'var(--bad)':'var(--good)'}"></i></div>
  <div class="lbl">시설</div>${['st','tr','yo'].map(facRow).join('')}<p class="note">공사비는 이적 예산에서 냅니다(경기장 좌석당 €4,000·12개월, 훈련장·아카데미 6개월). 한 번에 한 곳만 공사할 수 있습니다.</p>
  ${S.fin.later.length?`<div class="lbl">예정된 분할금</div>${S.fin.later.map(x=>`<div class="li" style="padding:6px 0"><span class="nm"><b>${esc(x.t)}</b><span>${fmtD(x.d)}</span></span><span class="num">${money(x.v)}</span></div>`).join('')}`:''}
  <div class="lbl">이적 예산 내역</div>${S.fin.log.filter(x=>!x.op).slice(0,20).map(x=>`<div class="li" style="padding:6px 0"><span class="nm"><b>${esc(x.t)}</b><span>${fmtD(x.d)}</span></span><span class="num" style="color:${x.v<0?'var(--bad)':'var(--good)'}">${money(x.v)}</span></div>`).join('')||'<p class="note">아직 거래가 없습니다.</p>'}
  <div class="lbl">운영 내역</div>${S.fin.log.filter(x=>x.op).slice(0,12).map(x=>`<div class="li" style="padding:6px 0"><span class="nm"><b>${esc(x.t)}</b><span>${fmtD(x.d)}</span></span><span class="num" style="color:${x.v<0?'var(--bad)':'var(--good)'}">${money(x.v)}</span></div>`).join('')||'<p class="note">매달 1일·홈 경기마다 기록됩니다.</p>'}</div>`)};
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-fac]');if(!b||!S)return;e.stopPropagation();const k=b.dataset.fac;const F=facInit();if(F.build){toast('이미 공사 중입니다');return}
  const co=facCost(k);if(S.fin.budget<co.cost){toast('이적 예산이 부족합니다');return}S.fin.budget-=co.cost;S.fin.log.unshift({d:S.date,t:`${FAC_N[k][0]} 공사 착수`,v:-co.cost});
  F.build={k,d:addD(S.date,co.mo*30),add:co.add||0};save();finSheet();toast(`${FAC_N[k][0]} 공사를 시작했습니다`)},true);

