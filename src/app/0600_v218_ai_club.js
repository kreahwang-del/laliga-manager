/* ================= v218 AI 구단 운영 =================
   ① 재계약: 예전엔 만료 선수 전원 60% 무작위(+2년) → 주전·핵심도 40%가 자유계약 유출. 이제 스쿼드 순위·나이·성장 여지로 결정(주전 30세 미만 약 90%), 기간은 나이별 1~4년
   ② 영입: 예전엔 하루 0~5건(전 리그 합)·후보는 데이터 순서 앞쪽 40명 중 무작위. 이제 이적시장 동안 구단마다 매일 행동 확률(예산 여유에 비례), 가장 약한 주전 자리(라인별)를 보강할 선수를
      전체에서 찾아 '능력 향상·나이·몸값' 점수로 고르고(무소속 우선 고려), 예산 안에서 영입 */
let AIR_C={},AIR_Y=null;
function aiRenewCE(p,c,y){if(AIR_Y!==y){AIR_C={};AIR_Y=y}const sq=AIR_C[c]||(AIR_C[c]=squadOf(c).sort((a,b)=>b.ovr-a.ovr).map(q=>q.id));const r=sq.indexOf(p.id),a=ageOf(p);
  let pr=r<0?.5:r<11?.9:r<16?.7:.4;if(a>=33)pr*=.45;else if(a>=31)pr*=.7;if(a<=23&&(p.pa||0)-p.ovr>=5)pr=Math.min(.95,pr+.1);
  if(hsh(p.id+'renew'+y)>=pr)return null;const u=hsh(p.id+'ry'+y);const yrs=a<26?(u<.5?3:4):a<30?(u<.5?2:3):(u<.6?1:2);return `${y+yrs}-06-30`}
const AIQ={GK:1,DF:4,MF:3,FW:3};function aiFrom(arr,mx){let lo=0,hi=arr.length;while(lo<hi){const m=(lo+hi)>>1;if(arr[m].ovr>mx)lo=m+1;else hi=m}return lo}let AIB_IDX=null;
function aiBuyDay(){const w=winNow();if(!w)return;const _rk=rankInClub;try{return aiBuyDay_(w,_rk)}finally{rankInClub=_rk}}
function aiBuyDay_(w,_rk){const summer=w.k!=='winter';
  let idx=AIB_IDX&&AIB_IDX.d&&daysBetween(AIB_IDX.d,S.date)<5&&daysBetween(AIB_IDX.d,S.date)>=0?AIB_IDX.x:null;if(!idx){idx={GK:[],DF:[],MF:[],FW:[]};for(const id in BASE){const c=clubOf(+id);if(c===S.club||c===RET)continue;const p=pl(+id);if(!p||!LINE[p.g]||p.loanFrom!=null)continue;if(c!==FA&&(p.joined&&daysBetween(p.joined,S.date)<120))continue;idx[LINE[p.g]].push(p)}
  for(const k in idx)idx[k].sort((a,b)=>b.ovr-a.ovr);AIB_IDX={d:S.date,x:idx}}
  const D0=S.aiBuyLog||(S.aiBuyLog={});const base=summer?.05:.025;const RK={};const rkOf=p=>{const c=clubOf(p.id);if(!RK[c])RK[c]=squadOf(c).sort((a,b)=>b.ovr-a.ovr).map(q=>q.id);return RK[c].indexOf(p.id)+1};rankInClub=rkOf;let made=0;
  for(const b of CLUBS){if(!b||b.i===S.club||b.i===FA||b.i===RET||S.aiBudget[b.i]===undefined)continue;const bud=S.aiBudget[b.i]||0;const bb=Math.max(1e6,(b.budget||1)*1e6*(typeof lbsOf==='function'?lbsOf(b.i):1));
    const big5=LG5.has(b.lg);const dLeft=daysBetween(S.date,w.to);const wk=S.season+(summer?'s':'w');const urg=MKON()&&S.aiUrg&&S.aiUrg[b.i]&&S.aiUrg[b.i].k===wk?S.aiUrg[b.i]:null;
    /* v240 마감 효과: 마감 7일 전부터 시도 빈도가 점차 2배까지. 급한 공백(주전 판매 직후) 구단은 4배 */const pAct=base*(big5?1.3:.6)*Math.max(.4,Math.min(3.5,bud/bb))*(MKON()&&dLeft<=7?1+(7-dLeft)/7:1)*(urg?4:1)*(MKON()&&sqSize(b.i)<20?3:1);if(rnd()>pAct)continue;const sq=squadOf(b.i);if(sq.length>=30||sq.length<11)continue;
    const top=sq.map(p=>p.ovr).sort((a,b)=>b-a);const L=top.slice(0,16).reduce((a,v)=>a+v,0)/Math.min(16,top.length);
    const lv={};for(const ln in AIQ){const v=sq.filter(p=>LINE[p.g]===ln).map(p=>p.ovr).sort((a,b)=>b-a);lv[ln]=v[AIQ[ln]-1]??(L-12)}
    const ln=urg&&AIQ[urg.ln]?urg.ln:Object.keys(AIQ).sort((x,y)=>(L-lv[y])-(L-lv[x]))[0];const v=lv[ln];const tmin=Math.round(v+(urg?0:2)),tmax=Math.round(Math.max(L,v)+(bud>1.5*bb?6:4));
    const C=[];const A1=idx[ln];const yS=MKON()&&big5;for(let ii=aiFrom(A1,tmax);ii<A1.length;ii++){const p=A1[ii];if(p.ovr<tmin-(yS?4:0))break;const c=clubOf(p.id);if(c===b.i||c===S.club||c===RET)continue;
      /* v246 5대 리그 구단은 판매 리그의 23세 이하 유망주를 능력치가 목표보다 4 낮아도 잠재력이 목표 이상이면 후보로 */if(p.ovr<tmin&&!(CLUBS[c]&&SELL_LG.has(CLUBS[c].lg)&&ageOf(p)<=23&&(p.pa||0)>=tmin))continue;
      /* v246 5대 리그 밖 구단이 5대 리그 선수를 사는 건 29세 이상 아니면 30%만 */if(MKON()&&!big5&&CLUBS[c]&&LG5.has(CLUBS[c].lg)&&ageOf(p)<29&&hsh(p.id+'dn'+b.i+S.season)>.3)continue;{const q=S.ps[p.id];if(q&&q.joined&&daysBetween(q.joined,S.date)<120)continue}const a=ageOf(p);if(a>32)continue;
      if(c!==FA){const sc=CLUBS[c];if(!sc||sc.rep>b.rep+8||sqSize(c)<=18||RIVAL(c,b.i))continue;if(!big5&&LG5.has(sc.lg)&&a<27&&rkOf(p)<=16)continue;const rk=rkOf(p);/* v247 판매 리그 구단(연봉 수준이 1.5배 이상 높은 리그의 제안)은 핵심 3명도 평판 −3까지 팔고, '판매 불가'는 절반만 적용 — 실제 벤피카·포르투·아약스의 주전 판매 */const sl0=MKON()&&SELL_LG.has(sc.lg)&&lgW(b.i)>lgW(c)*1.5;if(rk<=3&&b.rep<sc.rep+(sl0?-3:8))continue;if(b.rep<sc.rep+15&&nfsOf(p,b.i)&&!(sl0&&hsh(p.id+'nfs'+b.i+S.season)<.5))continue;if(rk<=11){const sellLg=!(typeof LGMKT_OFF!=='undefined'&&LGMKT_OFF)&&typeof SELL_LG!=='undefined'&&SELL_LG.has(sc.lg)&&typeof lgW==='function'&&lgW(b.i)>lgW(c)*1.5;/* v240 판매 리그(포르투갈·네덜란드 등) 주전은 연봉 수준이 1.5배 이상 높은 리그 구단이면 평판이 조금 낮아도(−5까지) 팔고, 창마다 3명까지 */if(sellLg?b.rep<sc.rep-5:(b.rep<sc.rep+3||(!LG5.has(b.lg)&&b.rep<sc.rep+10)))continue;const SS=S.aiSold||(S.aiSold={});const kk=S.season+':'+(summer?'s':'w')+':'+c;if((SS[kk]||0)>=(sellLg?3:2))continue;if(MKON()&&!mkSellOK(p,c,b.i,dLeft,sellLg))continue}}C.push(p);if(C.length>=60)break}
    /* 보강감이 없거나 30%: 유망주(22세 이하, 잠재력이 팀 수준+3 이상) 영입 — v240 30세+ 주전을 판 구단은 70% */const yRot=MKON()&&S.aiYth&&S.aiYth[b.i]===wk;if(!C.length||rnd()<(yRot?.7:.3)){const P2=[];for(const ln2 in idx){const A2=idx[ln2];for(let ii=aiFrom(A2,L+2);ii<A2.length;ii++){const p=A2[ii];if(p.ovr<L-8)break;const c=clubOf(p.id);if(c===b.i||c===S.club||c===RET)continue;const a=ageOf(p);if(a>22||(p.pa||0)<L+3)continue;if(c!==FA){const sc=CLUBS[c];if(!sc||sc.rep>b.rep+8||sqSize(c)<=18||RIVAL(c,b.i))continue;if(!big5&&LG5.has(sc.lg))continue;if(rkOf(p)<=11&&b.rep<sc.rep+3)continue}P2.push(p);if(P2.length>=40)break}}if(P2.length){C.length=0;P2.forEach(p=>C.push(p))}}
    if(!C.length)continue;
    const sc=p=>{const a=ageOf(p);return (p.ovr-v)*2-Math.max(0,a-27)*.8-Math.max(0,22-a)*.3+hsh(p.id+S.date+b.i)*2+(MKON()?mkPref(p,b,a):0)};const pick=C.sort((x,y)=>sc(y)-sc(x)).slice(0,typeof LGMKT_OFF!=='undefined'&&LGMKT_OFF?12:30);/* v240 후보 12 → 30명: 예산이 작은 리그는 상위 후보가 모두 비싸 아무도 못 사던 문제(얼어붙음) → 예산 안의 저가·자유계약 선수까지 봄 */
    let best=null,bs=-1e9;for(const p of pick){if(typeof lgMoveOK==='function'&&!lgMoveOK(p,b.i))continue;let fee=clubOf(p.id)===FA?0:asking(p,b.i);/* v240 패닉 바잉: 마지막 3일, 급한 공백이거나 그 포지션이 팀 수준보다 5 이상 낮으면 +15% */if(MKON()&&fee&&dLeft<=3&&(urg||L-v>=5))fee=Math.round(fee*1.15/1e5)*1e5;if(fee>bud*.9)continue;if(typeof scrOK==='function'&&!scrOK(p,b.i,fee))continue;const s=sc(p)-fee/bb*2.5;if(s>bs){bs=s;best=[p,fee]}}
    if(!best)continue;const [p,fee]=best;{const c0=clubOf(p.id);if(MKON()&&c0!==FA&&CLUBS[c0]&&rkOf(p)<=11){const U=S.aiUrg||(S.aiUrg={});U[c0]={k:wk,ln:LINE[p.g]};if(ageOf(p)>=30){(S.aiYth||(S.aiYth={}))[c0]=wk}}if(c0!==FA&&rkOf(p)<=11){const SS=S.aiSold||(S.aiSold={});const kk=S.season+':'+(summer?'s':'w')+':'+c0;SS[kk]=(SS[kk]||0)+1}}const a=ageOf(p),y0=S.season+1;const yrs=a<26?4:a<30?3:2;
    {const c0=clubOf(p.id);if(!SQC)buildSQ();const keep=SQC;completeTransfer(p.id,b.i,fee,{cEnd:`${y0+yrs-1}-06-30`,wage:typeof lgWageMul==='function'?Math.round(Math.max(p.wage*1.05,p.wage*1.15*lgWageMul(p,b.i))/1e4)*1e4:Math.round(p.wage*1.15)});if(!SQC&&keep){SQC=keep;const A=SQC[c0];if(A){const k=A.indexOf(p.id);if(k>=0)A.splice(k,1)}(SQC[b.i]=SQC[b.i]||[]).push(p.id)}delete RK[c0];delete RK[b.i]}if(urg&&LINE[p.g]===urg.ln&&S.aiUrg)delete S.aiUrg[b.i];made++;D0[S.season]=(D0[S.season]||0)+1}
  return made}
/* v218 개인 조건 협상: 예전엔 연봉 요구액이 고정(부족하면 같은 금액만 반복). 이제 제안이 요구의 85% 이상이거나 '너무 낮다' 수준이면
   선수 측이 라운드마다 2~4%씩 낮춤 — 우리 구단 관심도가 높을수록 더 많이(관심 70+ 최대 10%, 45+ 7%, 그 외 4%) */
{const _wd=wageDemand;wageDemand=function(p,c){const v=_wd.apply(this,arguments);try{if(c===S.club){const n=S.negs[p.id];if(n&&n.wd)return v*(1-n.wd)}}catch(e){}return v}}
{const _pr=playerRespond;playerRespond=function(p,t){const r=_pr.apply(this,arguments);try{const n=S.negs[p.id];if(!n||!r||r.k==='ok')return r;if(!(r.k==='mid'||/너무 낮다/.test(r.msg||'')))return r;
  const itv=interest(p,S.club);const mx=itv>=70?.10:itv>=45?.07:.04;const b0=n.wd||0;
  if(b0<mx-1e-6){const step=Math.min(mx-b0,.02+.02*hsh(p.id+'wd'+(n.wt||0)));n.wd=b0+step;n.wt=(n.wt||0)+1;const r2=_pr.apply(this,arguments);
    if(r2&&r2.k==='ok'){r2.msg=`${p.name} 측이 요구를 낮춰 조건을 받아들였습니다(협상으로 ${Math.round(n.wd*100)}% 양보).`;return r2}
    const dem=wageDemand(p,S.club)*(t.role<expectRole(p,S.club)?1.15:1);r.msg=`${p.name} 측이 한 발 물러섰습니다. 새 요구 연봉 ${money(dem)} (협상으로 ${Math.round(n.wd*100)}% 양보). 이 금액 이상이면 받아들입니다.`}
  else r.msg+=' 더 이상은 낮출 수 없다고 합니다.'}catch(e){console.error(e)}return r}}
/* v219 이적료 협상: 상대 구단이 역제안·양보 희망가를 냈으면 '상대 희망가로' 버튼(분할·셀온을 고른 상태면 일시불 환산 기준이 맞도록 금액 보정) */
{const _os=offerSheet;offerSheet=function(id){const r=_os.apply(this,arguments);try{const n=S.negs[id];const b=document.querySelector('.sheet [data-o="feeset"]');if(n&&n.counter&&n.stage==='club'&&b&&!document.querySelector('.sheet [data-cntset]')){const O=UI.off||{};const k={1:1,2:.96,3:.93}[O.inst||1]*(1+(O.sellOn||0)/100*.3);const v=Math.ceil(n.counter/k/1e5)*1e5;
  (b.parentElement||b).insertAdjacentHTML('afterend',`<button class="btn sm" data-o="feeset" data-cntset="1" data-v="${v}" style="display:block;width:100%;margin-top:6px">상대 희망가로 (${money(v)}${k!==1?' · 지급 조건 반영':''})</button>`)}}catch(e){console.error(e)}return r}}
/* v219 개인 조건: '선수 요구액으로' 버튼(협상 양보 반영, 출전 약속이 기대보다 낮으면 +15%) */
{const _os=offerSheet;offerSheet=function(id){const r=_os.apply(this,arguments);try{const w=document.querySelector('.sheet [data-o="wage"]');if(w&&!document.querySelector('.sheet [data-wset]')){const p=pl(id),O=UI.off||{};const exp=expectRole(p,S.club);const dem=Math.ceil(wageDemand(p,S.club)*((O.role??exp)<exp?1.15:1)/1e4)*1e4;
  const st=w.closest('.stepper')||w.parentElement;st.insertAdjacentHTML('afterend',`<button class="btn sm ghost" data-wset="${dem}" style="display:block;width:100%;margin-top:6px">선수 요구액으로 (${money(dem)})</button>`)}}catch(e){console.error(e)}return r}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-wset]');if(!b)return;e.stopPropagation();const O=UI.off;if(!O)return;O.wage=+b.dataset.wset;offerSheet(O.id)},true);
/* v220 관심 목록 숫자 불일치: 영입해서 우리 선수가 된 선수·데이터 없는 선수가 S.watch에 남아 탭 숫자만 올라감(목록은 우리 선수를 빼고 보여줌) → 이적 화면 그릴 때 정리 */
function watchClean(){try{S.watch=(S.watch||[]).filter(id=>BASE[id]&&clubOf(+id)!==S.club&&clubOf(+id)!==RET)}catch(e){}}
{const _tv=transView;transView=function(){watchClean();return _tv.apply(this,arguments)}}
/* v221 이적 직후 재이적 금지: 이번 이적시장에 팀을 옮긴 선수는 그 시장이 끝날 때까지 영입 제안을 하거나 받을 수 없음(다음 이적시장부터 가능) */
function tfLocked(id){try{const q=S.ps[id];if(!q||!q.joined)return null;const w=winNow();if(!w||q.joined<w.from)return null;const nx=(S.windows||[]).filter(x=>x.from>w.to).sort((a,b)=>a.from<b.from?-1:1)[0];return nx?nx.from:'다음 이적시장'}catch(e){return null}}
{const _ib=inbox;inbox=function(type,_,title,body,extra){try{if((type==='offer'||type==='clause')&&extra&&extra.pid!=null&&tfLocked(extra.pid))return}catch(e){}return _ib.apply(this,arguments)}}
{const _os=offerSheet;offerSheet=function(id){try{if(clubOf(id)!==S.club){const nx=tfLocked(id);if(nx){const p=pl(id);sheet(`<button class="x" data-close>닫기</button><h3>${esc(p.name)}</h3><p class="note" style="margin:8px 0">이번 이적시장에 ${esc(CLUBS[clubOf(id)]?CLUBS[clubOf(id)].name:'새 팀')}(으)로 이적한 선수라 이 시장이 끝날 때까지 다시 이적할 수 없습니다. ${/^\d{4}-/.test(nx)?fmtD(nx)+' 열리는 다음 이적시장':'다음 이적시장'}부터 제안할 수 있습니다.</p><button class="btn ghost" data-player="${id}" style="display:block;width:100%">선수 보기</button>`);return}}}catch(e){console.error(e)}return _os.apply(this,arguments)}}
/* v222 AI 구단 핵심 선수 '판매 불가': 팀 내 1~3위(시즌마다 1위 80%·2위 60%·3위 40% 확률로 지정, 23세 이하 유망주 +10%p)는 협상 자체를 거절.
   예외: 선수가 이적을 원함(만족도 35 미만)·계약 12개월 이하 남음·바이아웃 지불(구단 동의 불필요). AI끼리도 평판 15 이상 큰 구단만 영입 시도 */
function nfsOf(p,buyer){try{if(buyer==null)buyer=S.club;const c=clubOf(p.id);if(c===buyer||c===FA||c===RET||!CLUBS[c]||!CLUBS[buyer])return false;const rk=rankInClub(p);const q=S.ps[p.id]||{};if(q.happy!=null&&q.happy<35)return false;if(monthsLeft(p)<=12)return false;
  const same=CLUBS[c].lg===CLUBS[buyer].lg,derby=!!(RIVAL(c,buyer)||(typeof derbyOf==='function'&&derbyOf(c,buyer)));
  /* 라이벌(더비)에는 주전(11위 안) 거의 안 팖, 같은 리그 경쟁 팀엔 핵심을 더 지킴(4~5위까지), 다른 리그로는 기본 기준 */
  if(derby&&rk<=11)return hsh(p.id+'nfsd'+S.season+buyer)<.9;if(rk>(same?5:3))return false;
  const pr=(rk<=3?[0,.8,.6,.4][rk]:.3)+(same&&rk<=3?.15:0)+(ageOf(p)<=23?.1:0);return hsh(p.id+'nfs'+S.season+(same?'s':''))<pr}catch(e){return false}}
{const _cr=clubRespond;clubRespond=function(p,o){try{if(nfsOf(p)){const c=clubOf(p.id);const dby=RIVAL(c,S.club)||(typeof derbyOf==='function'&&derbyOf(c,S.club));const sm=CLUBS[c].lg===CLUBS[S.club].lg;return {k:'no',msg:`${CLUBS[c].name}: ${dby?`라이벌 ${CLUBS[S.club].name}에는 ${p.name}을(를) 절대 팔지 않겠다고 합니다.`:sm?`같은 리그 경쟁 팀에는 핵심 선수 ${p.name}을(를) 팔지 않겠다고 합니다(다른 리그 구단이면 검토).`:`${p.name}은(는) 팀의 핵심 선수라 어떤 금액에도 팔지 않겠다고 합니다.`}${p.clause?` 바이아웃(${money(p.clause*1e6)})을 지불하면 구단 동의 없이 선수와 협상할 수 있습니다.`:''}`}}}catch(e){console.error(e)}return _cr.apply(this,arguments)}}
{const _os=offerSheet;offerSheet=function(id){const r=_os.apply(this,arguments);try{const p=pl(id);if(nfsOf(p)){const sh=document.querySelector('.sheet');const h3=sh&&sh.querySelector('h3');if(h3&&!sh.querySelector('.nfs'))h3.insertAdjacentHTML('afterend',`<div class="note nfs" style="color:var(--bad);margin:4px 0 8px">판매 불가 선수: 구단이 우리 구단에는 팔지 않겠다는 입장입니다(핵심 선수·같은 리그·라이벌 여부 반영)${p.clause?' · 바이아웃 지불만 가능':''}.</div>`)}}catch(e){console.error(e)}return r}}

/* v222 같은 리그 구단에 팔 때 이적료 웃돈(+12%), 라이벌(더비)이면 +25% */
{const _as=asking;asking=function(p,buyer){const a=_as.apply(this,arguments);try{const c=clubOf(p.id);if(!a||buyer==null||!CLUBS[c]||!CLUBS[buyer])return a;if(RIVAL(c,buyer)||(typeof derbyOf==='function'&&derbyOf(c,buyer)))return Math.round(a*1.25/1e5)*1e5;if(CLUBS[c].lg===CLUBS[buyer].lg)return Math.round(a*1.12/1e5)*1e5}catch(e){}return a}}
// ---- v230: 부상 중인 선수는 출전 시간 불만(만족도 하락·이적 요청)을 만들지 않음 ----
// 실제로도 부상 선수는 출전 기회가 아니라 재활 중이므로, 부상 기간엔 출전 비중으로 인한 만족도 변화를 멈추고 이적 요청도 내지 않음
(function(){if(typeof weekly!=='function')return;const _wk=weekly;weekly=function(){
  const keep={};try{squadOf(S.club).forEach(p=>{const q=S.ps[p.id];if(q&&q.injD>0)keep[p.id]=[q.happy,q.reqAt]})}catch(e){}
  const n0=S.mid||0;const r=_wk.apply(this,arguments);
  try{for(const id in keep){const q=S.ps[id];if(!q)continue;if(keep[id][0]!=null)q.happy=Math.max(q.happy,keep[id][0]);q.reqAt=keep[id][1]}
    if(S.inbox)S.inbox=S.inbox.filter(m=>!(m.id>n0&&m.type==='request'&&keep[m.pid]));}catch(e){}
  return r}})();
// 기존 세이브: 부상 중인데 이미 와 있는 '출전 기회 부족' 이적 요청은 읽지 않은 상태면 정리
function injReqFix230(){try{if(!S||S.injFix230)return;S.injFix230=1;S.inbox=(S.inbox||[]).filter(m=>!(m.type==='request'&&!m.done&&!m.read&&/출전 기회가 부족/.test(m.body||'')&&(S.ps[m.pid]||{}).injD>0))}catch(e){}}
{const _dl2=devLoad;devLoad=function(){const r=_dl2.apply(this,arguments);injReqFix230();return r}}
// ---- v231: 부상 선수 복귀 일정 표시 (남은 기간·복귀 예정일) ----
// injD는 매일 1씩 줄어드는 남은 결장 일수 → 복귀 예정일 = 오늘 + injD
function injLeft(d){d=Math.max(1,Math.ceil(d||0));return d<14?`${d}일`:`약 ${Math.round(d/7)}주`}
function injRet(d){try{const t=addD(S.date,Math.max(1,Math.ceil(d||0)));return `${+t.slice(5,7)}/${+t.slice(8,10)}`}catch(e){return ''}}
function injTag(p){return `<span class="inj">부상 ${injLeft(p.injD)}</span>`}
{const _ps2=playerSheet;playerSheet=function(id){const r=_ps2.apply(this,arguments);try{const p=pl(id);if(clubOf(id)===S.club&&(p.injD>0||p.ban>0)){const sh=document.querySelector('.sheet');if(sh&&!sh.querySelector('.injw')){
  const t=p.injD>0?`🩹 <b>부상</b> · 남은 기간 ${injLeft(p.injD)} · <b>${injRet(p.injD)} 복귀 예정</b>`:`🟥 <b>출장 정지</b> · 남은 ${p.ban}경기`;
  const h=`<p class="note injw" style="color:var(--bad);margin:6px 0">${t}</p>`;const sm=[...sh.querySelectorAll('small')].find(e=>e.textContent.trim()==='능력치');const g=sm?sm.closest('.grid,div[style*="grid"]')||sm.parentElement.parentElement:null;if(g)g.insertAdjacentHTML('beforebegin',h);else{const a=sh.querySelector('.row2');if(a)a.insertAdjacentHTML('beforebegin',h);else sh.insertAdjacentHTML('afterbegin',h)}}}}catch(e){console.error(e)}return r}}
// ---- v233: 자동 선발 기준 3단계(우리 팀) ----
// 균형 = 기존(능력 × (.55+.45×적합도)). 포지션 우선 = 주 포지션(적합도 .95↑)만 온전히, 보조 포지션은 크게 깎음(능력치 6~8 높아도 주 포지션 선수 우선).
// 능력치 우선 = 적합도 영향 작게(.85+.15×적합도) → 보조 포지션이라도 능력 높은 선수 선발(전혀 다른 포지션은 여전히 불리)
const PICKF={pos:f=>f>=.95?1:f>=.8?.78:.4+.35*f,ovr:f=>.85+.15*f};
{const _ap3=E3.autoPick;E3.autoPick=function(players,form){const mine=typeof S!=='undefined'&&S&&S.pickMode&&PICKF[S.pickMode]&&players&&players.some(p=>p&&clubOf(p.id)===S.club);if(!mine||!E3.PICKM)return _ap3.apply(this,arguments);E3.PICKM.f=PICKF[S.pickMode];try{return _ap3.apply(this,arguments)}finally{E3.PICKM.f=null}}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-pickm]');if(!b)return;e.preventDefault();e.stopPropagation();const o=[null,'pos','ovr'];S.pickMode=o[(o.indexOf(S.pickMode||null)+1)%3];save();
  const nm=({pos:'포지션 우선 — 주 포지션 선수를 먼저 뽑습니다',ovr:'능력치 우선 — 보조 포지션이라도 능력 높은 선수를 뽑습니다'})[S.pickMode]||'균형 — 능력치와 포지션 적합도를 함께 봅니다';
  b.textContent='기준: '+(({pos:'포지션',ovr:'능력치'})[S.pickMode]||'균형');toast('자동 선발 기준: '+nm+' (자동 선발을 누르면 적용)')},true);
// ---- v234: 순위 알림 정리 + 유럽대항전권 알림 ----
// 문제: 경기 직전 순위(M.pos0)는 같은 날 먼저 끝난 다른 경기가 반영된 순위라, 1위를 지키고 있어도 경쟁 팀이 먼저 이겨 잠깐 2위가 되면 우리 경기 뒤 '1위 등극'이 또 나옴
// 수정: 비교 기준을 '직전 우리 리그 경기 뒤 순위'(S.hlPos, 시즌별 저장)로 바꿈 → 1위를 계속 지키면 다시 안 나오고, 떨어졌다가 되찾을 때만 나옴
// 추가: 챔피언스리그권·유로파리그권·컨퍼런스리그권(리그별 배정 순위, 국내 컵 우승 몫 제외) 진입·이탈도 같은 방식으로 한 번씩
function hlZone(lg,pos){if(pos===1)return 0;if(typeof EU_UCL==='undefined'||EU_UCL[lg]==null)return 9;const u=EU_UCL[lg],e=EU_UEL[lg]||0,c=EU_UECL[lg]||0;return pos<=u?1:pos<=u+e?2:pos<=u+e+c?3:9}
const HLZN={1:'챔피언스리그권',2:'유로파리그권',3:'컨퍼런스리그권'};
{const _hf=hlFromMatch;hlFromMatch=function(fx,res,me,pos0){if(!fx||!fx.r)return _hf.apply(this,arguments);
  const hp=S.hlPos&&S.hlPos.s===S.season?S.hlPos.p:null;const prev=hp!=null?hp:pos0;const r=_hf.call(this,fx,res,me,prev);
  try{const pos=posOf(S.club),lg=CLUBS[S.club].lg,top=typeof myDiv!=='function'||myDiv()===1;const rd=S.fixtures.filter(f=>f.res&&(f.h===S.club||f.a===S.club)&&f.r).length;
    if(top&&rd>=3&&prev!=null){const z0=hlZone(lg,prev),z1=hlZone(lg,pos);
      if(z1!==z0&&z1>=1&&z1<=3&&z1<z0)hlPush({key:'zone'+S.date,pri:4,tone:'good',c:S.club,t:`${HLZN[z1]} 진입`,b:`${pos}위 · ${rd}라운드 기준`});
      else if(z1>z0&&z0>=1&&z0<=2)hlPush({key:'zone'+S.date,pri:3,tone:'bad',c:S.club,t:`${HLZN[z0]}에서 밀려남`,b:`${pos}위로 하락 · ${rd}라운드 기준`})}
    S.hlPos={s:S.season,p:pos}}catch(e){console.error(e)}return r}}

// ---- v235: 리그 위상(평균 연봉 수준) 차이를 연봉 요구·이적 의향·이적료에 반영 ----
// 리그 평균 1군 연봉(€M). 근거: Global Sports Salaries Survey 2018(Sporting Intelligence) 평균 기본 연봉 — EN 3.38, ES 2.49, IT 1.72, DE 1.58, FR 1.12, TR .74, BR .58, MX .35, US .30, PT .31, NL .28, JP .27, SC .20, KR .11
//  조사에 없는 리그는 추정: 챔피언십 .75, 벨기에 .35, 스위스 .30, 덴마크 .22, 오스트리아 .20, 아르헨티나 .30, 2부(독 .35·스 .20·이 .20·프 .15), 3부·리저브 .08
//  사우디는 2023년 이후 대형 영입으로 2018(.44)보다 크게 올라 1.2로 추정, 중국은 2021 연봉 상한 뒤 2018(.90)보다 낮춰 .40으로 추정
const LGW={EN:3.38,ES:2.49,IT:1.72,DE:1.58,FR:1.12,TR:.74,BR:.58,MX:.35,US:.30,PT:.31,NL:.28,JP:.27,SC:.20,KR:.11,EN2:.75,BE:.35,CH:.30,DK:.22,AT:.20,AR:.30,DE2:.35,ES2:.20,IT2:.20,FR2:.15,SA:1.2,CN:.40};
function lgW(c){const lg=CLUBS[c]&&CLUBS[c].lg;if(!lg)return .3;return LGW[lg]??LGW[baseLg?baseLg(lg):lg]??.08}
// R = 지금 리그 연봉 수준 ÷ 갈 리그 연봉 수준. 하위 리그로(R>1): R^0.3배 더 요구(최대 2.5배; 예: 프리미어→에레디비시 2.1배, 프리미어→K리그 2.5배, 라리가→에레디비시 1.9배)
// 상위 리그로(R<1): R^0.06배로 조금 덜 요구(최저 0.85배; 예: 에레디비시→프리미어 0.86배, 라리가→프리미어 0.98배). 같은 수준이면 1배
// v236 예외(사용자 요청): 하위 리그 할증을 줄이는 계수 s(0~1) — 출전 시간·나이·고향 복귀
//  출전: 팀 내 능력 순위 11위 안 1, 12~16위 .25, 17위 밖 .1. 만족도 40 미만이면서 비주전이면 연봉 삭감(×.85)도 받아들임(출전 시간을 위해)
//  나이: 31~32세 ×.5, 33세 이상 ×.15(커리어 말년). 고향 복귀(국적 = 갈 리그 나라): 할증 없음 + 이적 의향 +8
const LGNAT={EN:['ENG'],ES:['ESP','SPA'],IT:['ITA'],DE:['GER'],FR:['FRA'],PT:['POR'],NL:['NED','HOL','NET'],BE:['BEL'],TR:['TUR','TÜR'],SC:['SCO'],CH:['SWI','SUI'],AT:['AUT','AUS'],DK:['DEN'],KR:['KOR'],JP:['JAP','JPN'],CN:['CHI','CHN'],SA:['SAU','KSA'],US:['USA','UNI'],MX:['MEX'],AR:['ARG'],BR:['BRA']};
function lgHome(p,to){try{const lg=CLUBS[to].lg,b=(typeof baseLg==='function'?baseLg(lg):lg);return (LGNAT[b]||LGNAT[lg]||[]).includes(p.nat)}catch(e){return false}}
function lgSoft(p,to){if(lgHome(p,to))return 0;let s=1;let rk=11;try{rk=rankInClub(p)}catch(e){}s*=rk<=11?1:rk<=16?.25:.1;const a=ageOf(p);if(a>=33)s*=.15;else if(a>=31)s*=.5;return s}
// R = 지금 리그 연봉 수준 ÷ 갈 리그. 하위 리그로(R>1): R^(0.3×s)배(최대 2배). 상위 리그로(R<1): R^0.06배(최저 0.85배). 같은 수준이면 1배
function lgWageMul(p,to){const fr=clubOf(p.id);if(fr==null||fr===FA||!CLUBS[fr]||!CLUBS[to])return 1;const R=lgW(fr)/lgW(to);if(R<=1)return Math.max(.85,Math.pow(R,.06));
  const s=lgSoft(p,to);let m=Math.min(2,Math.pow(R,.3*s));let rk=11;try{rk=rankInClub(p)}catch(e){}const h=(S.ps[p.id]||{}).happy??65;if(rk>11&&h<40)m=Math.min(m,.85);return m}
// 이적 의향: log10(갈 리그/지금 리그) × 15점(−30~+10) — 하위 리그로 갈 때 감점에도 계수 s 적용, 고향 복귀면 +8
function lgIntAdj(p,to){const fr=clubOf(p.id);if(fr==null||fr===FA||!CLUBS[fr]||!CLUBS[to])return 0;if(lgHome(p,to)&&CLUBS[fr].lg!==CLUBS[to].lg)return 8;const L=15*Math.log10(lgW(to)/lgW(fr));return Math.max(-30,Math.min(10,L<0?L*Math.max(.25,lgSoft(p,to)):L))}
// 이적료: 연봉 수준이 높은 리그 구단이 사면 프리미엄 +15%×log10(배율), 최대 +25%. 반대 방향 할인은 없음(판매 구단 기준)
function lgFeeMul(p,buyer){const fr=clubOf(p.id);if(fr==null||fr===FA||!CLUBS[fr]||!CLUBS[buyer])return 1;const L=Math.log10(lgW(buyer)/lgW(fr));return L>0?1+Math.min(.25,.15*L):1}
// AI 이적: 연봉 수준 1/3 이하 리그로는 대부분 거절 — 수락 확률 25% + (1−s)×60%(비주전·노장·고향 복귀일수록 수락), 시즌·선수별 고정
function lgMoveOK(p,to){const fr=clubOf(p.id);if(fr==null||fr===FA||!CLUBS[fr]||!CLUBS[to])return true;const R=lgW(fr)/lgW(to);if(R<3)return true;return hsh(p.id+'lgmv'+to+S.season)<.25+.6*(1-lgSoft(p,to))}
{const _wd5=wageDemand;wageDemand=function(p,club){let v=_wd5.apply(this,arguments);try{const fr=clubOf(p.id);if(fr!=null&&fr!==FA&&CLUBS[fr]&&CLUBS[club]&&fr!==club&&CLUBS[fr].lg!==CLUBS[club].lg){
  /* 기존 구단 평판 할증(1점당 1%)은 리그 차이와 겹치므로 리그가 다르면 절반만 남김 */const diff=Math.max(0,(CLUBS[fr].rep||40)-CLUBS[club].rep);v=v/(1+diff/100)*(1+diff/200);const m=lgWageMul(p,club);/* v236: 하위 리그로는 '지금 연봉×1.15×배율'과 기본 요구 중 큰 쪽(시장가 연봉에 배율을 또 곱하던 이중 할증 제거), 상위 리그로는 기본 요구×배율 */v=m>1?Math.max(v,Math.round(p.wage*1.15*m/1e4)*1e4):Math.round(v*m/1e4)*1e4;/* 상위 리그로 가도 지금 연봉보다 낮게는 요구하지 않음 */if(m<1)v=Math.max(v,Math.round(p.wage/1e4)*1e4)}}catch(e){}return v}}
{const _in5=interest;interest=function(p,club){const v=_in5.apply(this,arguments);try{return v+lgIntAdj(p,club)}catch(e){return v}}}
{const _as5=asking;asking=function(p,buyer){const a=_as5.apply(this,arguments);try{if(!a||buyer==null)return a;const m=lgFeeMul(p,buyer);return m>1?Math.round(a*m/1e5)*1e5:a}catch(e){return a}}}

var LGMKT_OFF=__CFG__("LGMKT_OFF"); /* 10시즌 시뮬 검증 전까지 끔 */
// ---- v240: 리그별 이적시장 규모(AI 구단 예산 배율) · EPL 구매 프리미엄 · 판매 리그 ----
// v245 2차: 1차(이탈리아 .8·독일 .8·스페인 .8·프랑스 .9)로는 10시즌 평균 지출이 EPL의 57~86%(실제 24~41%) → .55·.5·.45·.5
// 근거: Transfermarkt 2022 여름(Football365): 지출 EPL £1.33bn · 세리에A £540m · 분데스 £424m · 라리가 £369m · 리그1 £336m · 포르투갈 £134m · 에레디비시 £123m · 튀르키예 £79m · 벨기에 £70m · 챔피언십 £68m
//  (EPL=100 → 41·32·28·25·10·9·6·5·5), 2024 여름 EPL €2.33bn vs 라리가 €556m(24), 사우디 2023 여름 $957m(Deloitte)
//  게임 기본 예산 합(EPL=100): 세리에A 51·분데스 40·라리가 32·리그1 33·포르투갈 34·에레디비시 28·튀르키예 28·벨기에 22·챔피언십 22·브라질 39·MLS 33·아르헨 23 → 실제 비율에 맞춰 배율
//  자료가 없는 리그(브라질·MLS·아르헨·멕시코·북유럽·아시아·2부)는 추정. 사우디는 2023년 이후 지출 확대로 상향
// 적용: AI 구단 이적 예산(시즌 초 재설정)과 영입 빈도 기준(bb)에 같은 배율 → 영입 시도 빈도는 그대로, 비싼 영입 대신 자유계약·유망주·저가 영입 비중이 늘어남. 사용자 구단 예산은 그대로
const LBS={EN:1,IT:.55,DE:.33,ES:.45,FR:.5,PT:.3,NL:.32,BE:.23,TR:.3,EN2:.35,BR:.2,US:.18,AR:.09,MX:.3,SA:1.8,DK:.3,CH:.3,AT:.3,SC:.3,JP:.2,CN:.3,KR:.3,IT2:.5,DE2:.5,FR2:.5,ES2:.5};
function lbsOf(c){if(typeof LGMKT_OFF!=='undefined'&&LGMKT_OFF)return 1;const lg=CLUBS[c]&&CLUBS[c].lg;if(!lg)return 1;return LBS[lg]??LBS[typeof baseLg==='function'?baseLg(lg):lg]??.3}
const SELL_LG=new Set(['PT','NL','BE','BR','AR','DK','AT','CH','SC','US','TR','MX']);
// 예산 재설정: 기존 '이월(최대 1년치)+기본×순위 배수'를 배율 적용 기본으로 다시 계산(사용자 구단 제외)
{const _roL=rollover;rollover=function(){let rk={},prev={};try{if(S.seasonDone)table().forEach((t,i)=>rk[t.id]=i+1);prev=Object.assign({},S.aiBudget||{})}catch(e){}const r=_roL.apply(this,arguments);
  try{if(!(typeof LGMKT_OFF!=='undefined'&&LGMKT_OFF))CLUBS.forEach(c=>{if(!c||c.i===S.club||S.aiBudget[c.i]===undefined)return;const B=c.budget*1e6*lbsOf(c.i),m=typeof budgetMul==='function'?budgetMul(rk[c.i]):1;S.aiBudget[c.i]=Math.min(Math.max(prev[c.i]??0,0),B)+B*m})}catch(e){console.error(e)}return r}}
// 기존 세이브·새 게임 첫 시즌: 한 번 배율 적용
{const _dL=daily;daily=function(){try{if(S&&S.aiBudget&&!S.lbs240&&!(typeof LGMKT_OFF!=='undefined'&&LGMKT_OFF)){S.lbs240=1;for(const k in S.aiBudget){const c=+k;if(c===S.club||!CLUBS[c])continue;S.aiBudget[k]=Math.min(S.aiBudget[k]*lbsOf(c),CLUBS[c].budget*1e6*2*lbsOf(c))}}}catch(e){}return _dL.apply(this,arguments)}}
// EPL 구매 프리미엄: 연봉 수준 배율과 별도로 EPL 구단이 살 때 +12% (CIES: 2022년 7월 이후 EPL 20개 구단 중 17곳이 모델 가치보다 더 냄, 초과 합계 €13억+). 합계 상한 +35%
{const _as6=asking;asking=function(p,buyer){const a=_as6.apply(this,arguments);try{if(!a||buyer==null||(typeof LGMKT_OFF!=='undefined'&&LGMKT_OFF))return a;const c=clubOf(p.id);if(CLUBS[buyer]&&CLUBS[buyer].lg==='EN'&&CLUBS[c]&&CLUBS[c].lg!=='EN'){const m0=typeof lgFeeMul==='function'?lgFeeMul(p,buyer):1;const m=Math.min(1.35,m0*1.12)/m0;return Math.round(a*m/1e5)*1e5}}catch(e){}return a}}

// ---- v240: 이적시장 순환(대체자 · 먼저 팔기 · 마감 효과 · 나이 회전 · 연대 기금) ----
function MKON(){return !(typeof LGMKT_OFF!=='undefined'&&LGMKT_OFF)}
// 주전 판매 판단(AI 구단끼리). 같은 포지션 라인에 능력치 −3 이내 선수가 따로 있으면 그냥 판다(대체자 있음)
// 대체자가 없을 때:
//  · 먼저 팔고 그 돈으로 구하기 — 판매 리그 구단이거나 예산이 기준의 절반 미만, 또는 남은 기간 10일 이상이면서 제안이 판매가의 115% 이상(사는 쪽이 더 얹을 때)
//  · 대체자 먼저 — 그 밖(부자·강팀)은 거절. 남은 기간 10일 미만이면 판매 리그도 거절(대체자를 구할 시간이 없음, 예: 이삭·뉴캐슬)
//  팔고 나면 그 구단은 그 라인 '급한 공백'으로 남은 기간 동안 영입 시도 4배·목표 수준을 낮춤 → 연쇄 이동
function mkSellOK(p,c,buyer,dLeft,sellLg){try{const ln=LINE[p.g];const sq=squadOf(c);const rep=sq.some(q=>q.id!==p.id&&LINE[q.g]===ln&&q.ovr>=p.ovr-3);if(rep)return true;
  const bud=S.aiBudget[c]||0,bb=Math.max(1e6,(CLUBS[c].budget||1)*1e6*lbsOf(c));const poor=bud<bb*.5;if(dLeft<10)return false;if(sellLg||poor)return true;
  const ask=asking(p,buyer),bBud=S.aiBudget[buyer]||0;return bBud*.9>=ask*1.15}catch(e){return true}}
// 연대 기금: 이적료의 5%를 육성 구단(게임 시작 때 21세 이하였던 선수의 시작 구단, 이후 유스 출신은 그 구단)에 — 판매 구단 몫에서 뗌. FIFA 연대 기여금 최대 5%(12~23세 소속 구단 분배)를 단순화
function ycOf(id){const q=S.ps[id]||{};if(q.yc!=null)return q.yc;const b=BASE[id];if(!b)return null;try{const a=2026-+(String(b.dob||b[5]||'').slice(0,4));if(a&&a<=21&&b.club!=null)return b.club}catch(e){}return null}
{const _ctS=completeTransfer;completeTransfer=function(id,to,fee,o){const fr=clubOf(id);const r=_ctS.apply(this,arguments);try{if(MKON()&&fee>0&&!(o&&o.loan)){const y=ycOf(id);if(y!=null&&y!==fr&&y!==to&&CLUBS[y]){const sol=Math.round(fee*.05);
    if(fr!==S.club&&S.aiBudget[fr]!==undefined)S.aiBudget[fr]-=sol;else if(fr===S.club){S.fin.budget-=sol;S.fin.log.unshift({d:S.date,t:`${pl(id).name} 연대 기금(육성 구단 5%)`,v:-sol})}
    if(y===S.club){S.fin.budget+=sol;S.fin.log.unshift({d:S.date,t:`${pl(id).name} 이적 연대 기금 수입`,v:sol})}else if(S.aiBudget[y]!==undefined)S.aiBudget[y]+=sol}}}catch(e){}return r}}
// 유스 출신(게임 생성 유망주)의 육성 구단 기록
{const _mY=makeYouth;makeYouth=function(c,y,o){const r=_mY.apply(this,arguments);try{const id=9000000+S.genSeq;const q=S.ps[id]=S.ps[id]||{};if(q.yc==null)q.yc=c}catch(e){}return r}}
// ---- v244: 선수 화면에 이번 시즌 세부 기록(리그 경기) — 검색 필터에 쓰는 지표를 선수 화면에서도 확인 ----
function ssHTML(id){const p=pl(id),q=S.ps[id]||{},ss=q.ss||{};const ap=q.apps||0;if(!ap)return '';const has=(ss.pa||0)+(ss.ta||0)+(ss.at||0)>0;const pc=(w,t)=>(ss[t]||0)>0?`${Math.round((ss[w]||0)/ss[t]*100)}% <span class="note">(${ss[w]||0}/${ss[t]})</span>`:'–';
  const pg=k=>((ss[k]||0)/ap).toFixed(2);const avg=ap?((q.rs||0)/ap).toFixed(2):'–';
  const rows=[['경기 · 출전 시간',`${ap}경기 · ${q.mins||0}분`],['골 · 도움',`${q.gl||0} · ${q.as||0}`],['평균 평점',avg]];
  if(has)rows.push(['슈팅 (유효)',`${q.shs||0} (${ss.so||0})`],['xG · xA',`${(ss.xg||0).toFixed(2)} · ${(ss.xa||0).toFixed(2)}`],['키패스 (경기당)',`${ss.kp||0} (${pg('kp')})`],['빅찬스 메이킹 (경기당)',`${ss.bc||0} (${pg('bc')})`],
    ['패스 성공률',pc('pc','pa')],['크로스 성공률',pc('crc','cr')],['드리블 성공률',pc('dw','da')],['태클 성공률',pc('tkw','ta')],['공중볼 승률',pc('aw','at')],['차단 (경기당)',`${ss.it||0} (${pg('it')})`],['파울',`${ss.fc||0}`]);
  if(p.g==='GK'&&has)rows.push(['선방',`${ss.sv||0}`]);
  return `<h3 style="margin:14px 0 6px">이번 시즌 기록 <span class="note" style="font-weight:400">리그 경기${has?'':' · 세부 기록은 경기 엔진으로 치른 경기만'}</span></h3><div class="card" style="padding:4px 10px">${rows.map(([k,v])=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--line);font-size:13px"><span class="note" style="margin:0">${k}</span><span>${v}</span></div>`).join('')}</div>`}
{const _psS=playerSheet;playerSheet=function(id){const r=_psS.apply(this,arguments);try{const sh=document.querySelector('.sheet');if(sh&&!sh.querySelector('.ssw')){const h=ssHTML(id);if(h){const w=sh.querySelector('.pshw');const div=`<div class="ssw">${h}</div>`;if(w)w.insertAdjacentHTML('beforebegin',div);else{const sm=[...sh.querySelectorAll('small')].find(e=>e.textContent.trim()==='능력치');const g=sm?sm.closest('.grid,div[style*="grid"]')||sm.parentElement.parentElement:null;if(g)g.insertAdjacentHTML('afterend',div);else sh.insertAdjacentHTML('beforeend',div)}}}}catch(e){console.error(e)}return r}}

// ---- v245 2차 조정: 선수 흐름 방향 · 최소 스쿼드 20명 · 자유계약 선수 활용 ----
// 1차 10시즌 결과: 포르투갈·네덜란드·브라질이 여전히 순지출(+) — 5대 리그가 남는 선수를 내려보내기만 하고, 그 리그 유망주를 사 오는 일은 드묾
// 후보 점수 보정: 5대 리그 구단 → 판매 리그 24세 이하 +2.5(스카우팅·재판매 가치), 5대 리그 밖 구단 → 5대 리그 소속 선수 −2(비싸고 연봉 높음, 국내·저가 선호), 자유계약 +1.5(이적료 없음)
function mkPref(p,b,a){const c=clubOf(p.id);let v=0;if(c===FA)return 1.5;const sl=CLUBS[c]&&CLUBS[c].lg;if(LG5.has(b.lg)&&SELL_LG.has(sl)&&a<=24)v+=2.5;if(!LG5.has(b.lg)&&LG5.has(sl))v-=2;return v}
// 최소 스쿼드(v245 사용자 기준): 이적시장 기간만. 20명 미만 구단은 먼저 이적료 영입(시도 3배), 마감 3일 전까지 안 되면 최후 수단으로 자유계약 → 없으면 임대(하루 2명)
// 자유계약 활용: 이적시장 기간에 능력치 70+ 자유계약을 그 포지션 주전 기준보다 나은 AI 구단이 영입(하루 15%, 마감 10일 전부터 40%·36세까지·팀 수준 +8까지)
function mkFAday(){if(!MKON())return;const w=winNow();if(!w)return;try{const dLeft=daysBetween(S.date,w.to);const late=dLeft<=10;const fa=squadOf(FA).filter(p=>ageOf(p)<=(late?36:33)&&LINE[p.g]).sort((a,b)=>b.ovr-a.ovr);const used=new Set();const y0=S.season+1;
  const sign=(p,c)=>{const a=ageOf(p),yrs=a<26?3:a<30?2:1;const cut=faCut(p);const wg=Math.round(Math.max(p.wage*.9*cut,(typeof mktWage==='function'?mktWage(p,c):p.wage)*.8*cut)*(typeof lgWageMul==='function'?Math.min(1.5,lgWageMul(p,c)):1)/1e4)*1e4;completeTransfer(p.id,c,0,{cEnd:`${y0+yrs-1}-06-30`,wage:wg});used.add(p.id)};
  const lvOf=c=>{const sq=squadOf(c);const top=sq.map(p=>p.ovr).sort((a,b)=>b-a);const L=top.length?top.slice(0,16).reduce((a,v)=>a+v,0)/Math.min(16,top.length):60;const lv={};for(const ln in AIQ){const v=sq.filter(p=>LINE[p.g]===ln).map(p=>p.ovr).sort((a,b)=>b-a);lv[ln]=v[AIQ[ln]-1]??(L-12)}return {sq,L,lv}};
  if(dLeft<=3)for(const b of CLUBS){if(!b||b.i===S.club||b.i===FA||b.i===RET||S.aiBudget[b.i]===undefined)continue;const n=sqSize(b.i);if(n>=20)continue;const {L,lv}=lvOf(b.i);let k=0;
    const need=Object.keys(AIQ).sort((x,y)=>(lv[x]-L)-(lv[y]-L));for(const ln of need){if(k>=2||n+k>=20)break;let p=fa.find(q=>!used.has(q.id)&&LINE[q.g]===ln&&q.ovr>=L-12&&q.ovr<=L+2&&(typeof lgMoveOK!=='function'||lgMoveOK(q,b.i)));if(p){sign(p,b.i);k++;continue}
      const L2=CLUBS.filter(c=>c&&c.i!==b.i&&c.i!==S.club&&c.rep>b.rep&&S.aiBudget[c.i]!==undefined&&sqSize(c.i)>22).slice(0,60);
      for(const c of L2){const sq=squadOf(c.i).sort((x,y)=>y.ovr-x.ovr);const q=sq.slice(19).find(x=>LINE[x.g]===ln&&!x.loanFrom&&x.ovr>=L-8&&x.ovr<=L+2&&!used.has(x.id));if(q){completeTransfer(q.id,b.i,0,{loan:true});const qq=S.ps[q.id];qq.lnRole=1;qq.res=false;(S.aiLn=S.aiLn||[]).push(q.id);used.add(q.id);k++;break}}}}
  for(const p of fa){if(used.has(p.id)||p.ovr<70)continue;if(hsh(p.id+'fad'+S.date)>(late?.4:.15))continue;const ln=LINE[p.g];
    const C=CLUBS.filter(b=>b&&b.i!==S.club&&b.i!==FA&&b.i!==RET&&S.aiBudget[b.i]!==undefined&&sqSize(b.i)<28).map(b=>{const {L,lv}=lvOf(b.i);return [b,p.ovr-lv[ln],L]}).filter(x=>x[1]>=1&&p.ovr<=x[2]+(late?8:4)&&(typeof lgMoveOK!=='function'||lgMoveOK(p,x[0].i))).sort((x,y)=>(y[0].rep-x[0].rep)||(y[1]-x[1]));
    if(C.length){sign(p,C[0][0].i)}}}catch(e){console.error(e)}}
// v246 자유계약 몸값 양보: 이적시장 진행률에 따라 연봉 요구 하향(30세+ 최대 −35%, 그 아래 −15%) — 우리 협상·AI 영입 모두
function faCut(p){try{if(clubOf(p.id)!==FA)return 1;const w=winNow();if(!w)return 1;const tot=Math.max(1,daysBetween(w.from,w.to)),pr=Math.max(0,Math.min(1,daysBetween(w.from,S.date)/tot));return 1-pr*(ageOf(p)>=30?.35:.15)}catch(e){return 1}}
{const _wdF=wageDemand;wageDemand=function(p,c){const v=_wdF.apply(this,arguments);try{if(!MKON())return v;const k=faCut(p);return k<1?Math.round(v*k/1e4)*1e4:v}catch(e){return v}}}
{const _dFA=daily;daily=function(){const r=_dFA.apply(this,arguments);try{mkFAday()}catch(e){}return r}}

