// ================= v312 리그 별도 규정 2차(사용자 결정 2026-11-24: 1~4 전부 반영 + 모든 리그 경기 명단 인원 제한, 에이전트 3명 의견 work/agents_1124) =================
// ① 경기 명단(벤치) 인원: 리그 규정대로(라리가·라리가2·네덜란드·아르헨티나 12, 튀르키예 10(명단 21), 리그2 7, 그 밖 9, 유럽대항전 12)
//    사용자도 벤치에 넣은 선수 중에서만 교체(전술 탭에서 벤치 고르기, 안 고르면 자동). AI·사용자 모두 벤치에 GK 1명 우선
// ② K리그1 U22: 명단 20명 중 U22 2명 이상, 1명이면 19·0명이면 18(벤치 축소). U22 = 그해-22년 이후 출생(기준 연도는 △)
// ③ 리가MX 어린 선수: 시즌-22년(2026-27 = 2004년) 이후 출생 정규리그 1,170분/대회, 미달 시 승점 −3(17라운드 뒤, 리기야 대진 전)
// ④ 사우디: U21 외국인(시즌-20년 이후 출생)은 1군 리그 출전 불가·외국인 몫에서 제외(2군 배정)
// ⑤ 튀르키예: 명단 28명, 2006년(시즌-20) 이후 출생 자국 선수는 명단 밖, 외국인 GK 1명까지(GK 3명 중 2명 자국)
// ⑥ 임대 한도: FIFA 국제(보내기·받기 각 6, 21세 이하·자체 육성 제외, 같은 구단 3) AI에도 / EPL 국내 받기 동시 2·시즌 4 / 독일 국내 보내기 6(21세 이하 제외) / 오스트리아 보내기 10·받기 6·같은 구단 2
// ⑦ 독일 1·2부 독일 국적 12명 이상: 모자라면 외국인 영입 불가, AI는 자유계약 독일 선수로 채움 / J1 홈그로운 4명: 안내만
// ⑧ MLS: 연봉 데이터 MLSPA 2026 가을(work/mls) + 리그 연봉 상한(시니어 20명 부담액 ≤ 상한+GAM+TAM, DP 3명 부담액 고정, U22 이니셔티브 3명 고정). 시작 때 넘은 구단은 그 수준까지 인정, 새 영입만 검사
// 하지 않음: 몰수패·강제 출전·강제 방출·소급 감점(기존 세이브는 지금 대회 유예)
Object.assign(LGR.TR,{reg:28,bench:10});
function dobY(p){return p&&p.dob?+p.dob.slice(0,4):0}
// ---------- ① 벤치 ----------
const BENCH_EU=12;
benchN=function(c){try{if(typeof banScope==='function'&&banScope(c)==='eu')return BENCH_EU}catch(e){}return lgR(c).bench||9};
function kU22(p){return dobY(p)>=+S.date.slice(0,4)-22}
function benchPick(c,xi,mine){const N=benchN(c);const ids=new Set(xi.filter(Boolean).map(p=>p.id));
  const ok=p=>!ids.has(p.id)&&!((S.ps[p.id]||{}).injD>0)&&!(p.ban>0)&&(mine?(typeof canUse!=='function'||canUse(p)):(typeof elig!=='function'||elig(p,c)));
  const pool=squadOf(c).filter(ok);const out=[];const man=mine&&Array.isArray(S.bench)&&S.bench.length;
  if(man)for(const id of S.bench){const p=pool.find(q=>q.id===id);if(p&&out.length<N)out.push(p)}
  const rest=pool.filter(p=>!out.includes(p)).sort((a,b)=>b.ovr-a.ovr);const take=p=>{if(p&&out.length<N){out.push(p);rest.splice(rest.indexOf(p),1)}};
  if(!out.some(p=>p.g==='GK'))take(rest.find(p=>p.g==='GK'));
  const kr=lgRaw(c)==='KR'&&(typeof banScope!=='function'||banScope(c)!=='eu');
  if(kr){let k=xi.filter(p=>p&&kU22(p)).length+out.filter(kU22).length;while(k<2){const u=rest.find(kU22);if(!u||out.length>=N)break;take(u);k++}}
  while(out.length<N&&rest.length)take(rest[0]);
  if(kr){const k=xi.filter(p=>p&&kU22(p)).length+out.filter(kU22).length;if(k<2){const cut=N-(2-k);while(out.length>cut){/* 명단 축소: U22·GK가 아닌 가장 약한 선수부터 */let wi=-1;out.forEach((p,i)=>{if(kU22(p)||p.g==='GK')return;if(wi<0||p.ovr<out[wi].ovr)wi=i});if(wi<0)wi=out.length-1;out.splice(wi,1)}}}
  return out}
// 경기 중 교체는 킥오프 때 벤치 선수만
{const _sm=startMatch;startMatch=function(){const r=_sm.apply(this,arguments);try{if(M&&M.m&&M.m.T&&M.m.T[M.me])M._bIds=new Set((M.m.T[M.me].bench||[]).map(p=>p.id))}catch(e){}return r}}
{const _bl=benchList;benchList=function(){const L=_bl.apply(this,arguments);try{if(!M||!M._bIds||!M._bIds.size)return L;return L.filter(p=>M._bIds.has(p.id))}catch(e){return L}}}
// 전술 탭: 벤치 고르기
function benchMine(){try{const xi=(S.xi||[]).map(id=>id!=null?pl(id):null).filter(Boolean);return benchPick(S.club,xi,true)}catch(e){return []}}
{const _tv=tacView;tacView=function(){const h=_tv.apply(this,arguments);try{if(!S||unemp()||TAC.phase==='sp'||(typeof M!=='undefined'&&M&&M.edit))return h;const c=S.club,N=benchN(c),B=benchMine(),bs=new Set(B.map(p=>p.id));
    const xi=new Set(S.xi||[]);const cand=squadOf(c).filter(p=>!xi.has(p.id)&&canUse(p)&&!((S.ps[p.id]||{}).injD>0)&&!(p.ban>0)).sort((a,b)=>(bs.has(b.id)-bs.has(a.id))||b.ovr-a.ovr);
    const kr=lgRaw(c)==='KR';const ku=kr?[...(S.xi||[])].map(id=>id!=null?pl(id):null).filter(p=>p&&kU22(p)).length+B.filter(kU22).length:0;
    const info=[`벤치 ${B.length}/${N}명`];if(kr)info.push(`U22 ${ku}/2${ku<2?` → 명단 ${18+ku}명`:''}`);const x=lgExtraChips(c);if(x)info.push(x);
    const card=`<section class="card pad" style="margin:8px 0"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><b>경기 명단 벤치 · ${info.join(' · ')}</b><span><button class="chip" data-bauto="1" aria-pressed="${!(Array.isArray(S.bench)&&S.bench.length)}">자동</button></span></div>
      <p class="note" style="margin:6px 0">경기 중 교체는 여기 벤치에 넣은 선수만 할 수 있습니다(${esc(LGN[lgRaw(c)]||'리그')} 규정 ${N}명, 유럽대항전 ${BENCH_EU}명). 눌러서 넣고 빼세요. 자동이면 능력 순(골키퍼 1명 포함).</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px">${cand.map(p=>`<button class="chip" data-bsel="${p.id}" aria-pressed="${bs.has(p.id)}">${esc(p.g)} ${esc(shortName(p.name))} ${p.ovr}${kr&&kU22(p)?' U22':''}</button>`).join('')}</div></section>`;
    const i=h.indexOf('<h2>교체 명단');return i>=0?h.slice(0,i)+card+h.slice(i):h+card}catch(e){console.error(e);return h}}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-bsel],[data-bauto]');if(!b||!S)return;e.preventDefault();e.stopPropagation();
  if(b.dataset.bauto){S.bench=null;save();render();toast('벤치를 자동으로 고릅니다');return}
  const id=+b.dataset.bsel,N=benchN(S.club);let cur=Array.isArray(S.bench)&&S.bench.length?S.bench.slice():benchMine().map(p=>p.id);
  if(cur.includes(id))cur=cur.filter(x=>x!==id);else{if(cur.length>=N){toast(`벤치는 ${N}명까지입니다. 먼저 한 명을 빼세요`);return}cur.push(id)}
  S.bench=cur;save();render()},true);
// ---------- ④ 사우디 U21 외국인 ----------
function saU21(p,c){return lgRaw(c)==='SA'&&isFor(p,c)&&dobY(p)>=S.season-20}
{const _e=elig;elig=function(p,c){if(p&&c!=null&&c>=0&&CLUBS[c]&&sqrOn()&&saU21(p,c))return false;return _e.apply(this,arguments)}}
{const _f=forCnt;forCnt=function(c,ex){const n=_f.apply(this,arguments);try{if(lgRaw(c)!=='SA'||!sqrOn())return n;return n-squadOf(c).filter(q=>q.id!==ex&&!resOf(q.id)&&saU21(q,c)).length}catch(e){return n}}}
// ---------- ⑤ 튀르키예 ----------
{const _x=regEx;regEx=function(p,c){if(lgRaw(c)==='TR'&&p&&!isFor(p,c)&&dobY(p)>=S.season-20)return true;return _x.apply(this,arguments)}}
function regXOK(c,p,f,st){if(saU21(p,c))return false;if(lgRaw(c)==='TR'&&f&&p.g==='GK'&&(st.fg||0)>=1)return false;return true}
{const _rf=regFeas;regFeas=function(c,list){if(!_rf.apply(this,arguments))return false;if(lgRaw(c)==='TR'&&sqrOn()&&list.filter(p=>p.g==='GK'&&isFor(p,c)).length>1)return false;return true}}
// ---------- ③ 리가MX 어린 선수 출전 ----------
const MXY={min:1170,pen:3,a:22};
function mxYoung(p){return dobY(p)>=S.season-MXY.a}
function mxStage(){const fx=(typeof lfFx==='function'&&lfFx('MX'))||[];const A=fx.filter(f=>f.st==='A');return A.length&&A.every(f=>f.res)?'C':'A'}
function mxBase(q,stg){if(q.mxB&&q.mxB.s===S.season&&q.mxB.st===stg)return q.mxB.v||0;if(stg==='C'&&q.mxA&&q.mxA.s===S.season)return q.mxA.v||0;return 0}
function mxMin(c,stg){let m=0;for(const p of squadOf(c)){if(!mxYoung(p))continue;const q=S.ps[p.id];if(!q)continue;m+=Math.max(0,(q.mins||0)-mxBase(q,stg))}return m}
function mxLeft(c,stg){return ((typeof lfFx==='function'&&lfFx('MX'))||[]).filter(f=>f.st===stg&&!f.res&&(f.h===c||f.a===c)).length}
function mxActive(stg){const k=S.season*10+(stg==='C'?1:0);return !(S.mxFrom&&k<S.mxFrom)}
{const _ct=completeTransfer;completeTransfer=function(id,to){const r=_ct.apply(this,arguments);try{if(to!=null&&to>=0&&lgRaw(to)==='MX'&&clubOf(id)===to){const q=S.ps[id]=S.ps[id]||{};q.mxB={s:S.season,st:mxStage(),v:q.mins||0}}LNX=null}catch(e){}return r}}
function mxCheck(){try{const fx=(typeof lfFx==='function'&&lfFx('MX'))||[];if(!fx.length)return;S.mxChk=S.mxChk||{};
  for(const stg of ['A','C']){const k=S.season+stg;if(S.mxChk[k])continue;const F=fx.filter(f=>f.st===stg);if(!F.length||!F.every(f=>f.res))continue;S.mxChk[k]=1;
    const ids=lfIds('MX');const bad=[];if(mxActive(stg))for(const c of ids){const m=mxMin(c,stg);if(m<MXY.min){bad.push([c,m]);S.penS=S.penS||{};const P=(S.penS[S.season]=S.penS[S.season]||{});(P['MX'+stg]=P['MX'+stg]||{})[c]=MXY.pen;S.pen=S.pen||{};const Q=(S.pen[S.season]=S.pen[S.season]||{});Q[c]=(Q[c]||0)+MXY.pen}}
    if(stg==='A')for(const c of ids)for(const p of squadOf(c)){const q=S.ps[p.id];if(q)q.mxA={s:S.season,v:q.mins||0}}
    const nm=stg==='A'?'아페르투라':'클라우수라';if(bad.length)S.news.unshift({d:S.date,t:`리가MX ${nm} 어린 선수 출전 규정 미달 ${bad.length}구단 승점 −${MXY.pen}`,b:bad.map(([c,m])=>`${CLUBS[c].short} ${m}분`).join(', '),v:0});
    if(S.club>=0&&ids.includes(S.club)&&!unemp()){const m=mxMin(S.club,stg);inbox('board','',`${nm} 어린 선수 출전 시간 ${m>=MXY.min?'충족':'미달'}`,m>=MXY.min?`${S.season-MXY.a}년 이후 출생 선수 정규리그 ${m}분 / ${MXY.min}분 — 규정을 지켰습니다.`:mxActive(stg)?`${S.season-MXY.a}년 이후 출생 선수 정규리그 ${m}분 / ${MXY.min}분 — 승점 ${MXY.pen}점이 깎였습니다(리기야 대진 전 반영).`:`${m}분 / ${MXY.min}분 — 이번 대회는 규정 적용 전이라 감점하지 않습니다.`)}}}catch(e){console.error(e)}}
{const _pt=lfPoTick;lfPoTick=function(lg){if(lg==='MX')mxCheck();return _pt.apply(this,arguments)}}
{const _st=lfStageTable;lfStageTable=function(lg,stg){const t=_st.apply(this,arguments);try{const P=S.penS&&S.penS[S.season]&&S.penS[S.season][lg+stg];if(P){t.forEach(r=>{if(P[r.id])r.pts-=P[r.id]});t.sort(lfSort)}}catch(e){}return t}}
// 감점 결함: 스플릿 리그 순위표(1010 래퍼가 0630 감점 래퍼를 건너뜀)
{const _tl=tableLg;tableLg=function(lg){const t=_tl.apply(this,arguments);try{if(LGF[lg]&&LGF[lg].t==='split'&&lfSt(lg)){const P=S.pen&&S.pen[S.season];if(P&&t.some(r=>P[r.id])){t.forEach(r=>{if(P[r.id])r.pts-=P[r.id]});const st=lfSt(lg);if(!st||!st.grp)t.sort(lfSort)}}}catch(e){}return t}}
// AI: 남은 경기로 나눠 어린 선수를 선발로(빠른 계산 경기는 선발 90분만 셈)
let MXC={};
{const _tf=teamFor;teamFor=function(c){const T=_tf.apply(this,arguments);try{if(!T||c===S.club||lgRaw(c)!=='MX'||!sqrOn()||(typeof banScope==='function'&&banScope(c)!=='lg'))return T;const stg=mxStage();if(!mxActive(stg))return T;
    const key=c+':'+S.date;let need=MXC[key];if(need==null){const left=Math.max(1,mxLeft(c,stg));const def=MXY.min-mxMin(c,stg);need=def<=0?0:Math.min(3,Math.ceil(def/(left*85)));MXC={};MXC[key]=need}
    if(!need)return T;const xi=T.xi.slice();let have=xi.filter(mxYoung).length;if(have>=need)return T;const ids=new Set(xi.map(p=>p.id));
    const yp=squadOf(c).filter(p=>mxYoung(p)&&!ids.has(p.id)&&!((S.ps[p.id]||{}).injD>0)&&!(p.ban>0)&&elig(p,c)).sort((a,b)=>b.ovr-a.ovr);
    for(const y of yp){if(have>=need)break;let wi=-1;xi.forEach((p,i)=>{if(mxYoung(p)||p.g==='GK'&&y.g!=='GK')return;if(LINE[p.g]!==LINE[y.g])return;if(wi<0||p.ovr<xi[wi].ovr)wi=i});if(wi<0)continue;xi[wi]=y;have++}
    const bench=(T.bench||[]).filter(p=>!xi.includes(p));return Object.assign({},T,{xi,bench})}catch(e){console.error(e)}return T}}
// ---------- ⑦ 독일 12명·J1 홈그로운 ----------
function deDom(c){const lg=lgRaw(c);return lg==='DE'||lg==='DE2'}
function natCnt(c){return squadOf(c).filter(p=>!isFor(p,c)).length}
{const _lm=lgMoveOK;lgMoveOK=function(p,to){if(!_lm.apply(this,arguments))return false;try{if(sqrOn()&&to!==S.club&&to>=0&&CLUBS[to]){if(deDom(to)&&isFor(p,to)&&clubOf(p.id)!==to&&natCnt(to)<12)return false;if(lgRaw(to)==='US'&&!mlsOK(p,to,p.wage))return false}}catch(e){}return true}}
{const _os=offerSheet;offerSheet=function(id){try{const p=pl(id),c=S.club;if(p&&clubOf(id)!==c&&sqrOn()&&!unemp()){let why=null;
  if(deDom(c)&&isFor(p,c)&&natCnt(c)<12)why=`독일 리그 규정상 독일 국적 선수를 12명 이상 보유해야 합니다(지금 ${natCnt(c)}명). 독일 선수를 먼저 영입한 뒤 외국인 선수에게 제안할 수 있습니다.`;
  else if(lgRaw(c)==='US'&&!mlsOK(p,c,p.wage))why=`MLS 연봉 상한을 넘습니다(${mlsTxt(c)}). 연봉이 낮은 선수를 내보내거나 지정 선수(DP) 자리를 비운 뒤 제안할 수 있습니다.`;
  if(why){sheet(`<button class="x" data-close>닫기</button><h3>${esc(p.name)}</h3><p class="note" style="margin:8px 0">${esc(why)}</p><button class="btn ghost" data-player="${id}" style="display:block;width:100%">선수 보기</button>`);return}}}catch(e){console.error(e)}return _os.apply(this,arguments)}}
/* 독일 12명: 자유계약 독일 선수 → 없으면 유스 승격(독일 국적, 2군) — 실제 구단은 유스·2군 독일 선수로 채움(데이터에 1군만 있음) */
function deFill(c){let n=natCnt(c),k=0;let fa=squadOf(FA).filter(p=>clubOf(p.id)===FA&&(p.nat==='GER'||p.nat2==='GER')&&ageOf(p)<=33);const sq=squadOf(c);const L=sq.length?sq.reduce((a,p)=>a+p.ovr,0)/sq.length:60;
  while(n<12&&k<12){k++;const d=fa.filter(p=>clubOf(p.id)===FA).sort((a,b)=>Math.abs(a.ovr-L+2)-Math.abs(b.ovr-L+2))[0];if(d&&ownSize(c)<OWNMAX){completeTransfer(d.id,c,0,{wage:d.wage,cEnd:`${S.season+2}-06-30`});n++;continue}
    try{const p=makeYouth(c,S.season,{nat:'GER',age:18+Math.floor(hsh(c+':deY'+k+S.date)*3)});if(!p)break;(S.ps[p.id]=S.ps[p.id]||{}).res=true;n++}catch(e){console.error(e);break}}
  if(k)SQC=null}
function aiDomFill(){if(!sqrOn()||!S||!winNow()||S.aiDeD===S.date)return;S.aiDeD=S.date;let fa=null;
  for(const C of CLUBS){if(!C||C.i===S.club||C.i<0||!S.aiBudget||S.aiBudget[C.i]===undefined)continue;
    try{if(deDom(C.i)&&natCnt(C.i)<12){deFill(C.i);fa=null}
      if(lgRaw(C.i)==='MX'&&squadOf(C.i).filter(p=>mxYoung(p)&&elig(p,C.i)).length<3&&ownSize(C.i)<OWNMAX){fa=fa||squadOf(FA);const d=fa.filter(p=>clubOf(p.id)===FA&&mxYoung(p)&&aiFAok(p,C.i)).sort((a,b)=>(b.nat==='MEX')-(a.nat==='MEX')||b.ovr-a.ovr)[0];if(d){completeTransfer(d.id,C.i,0,{wage:d.wage,cEnd:`${S.season+3}-06-30`});fa=null}}}catch(e){console.error(e)}}}
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);try{aiDomFill();lgNotice()}catch(e){console.error(e)}return r}}
function jpHG(c){return typeof hgStat==='function'?squadOf(c).filter(p=>hgStat(p,c)==='c').length:0}
// ---------- ⑥ 임대 한도 ----------
let LNX=null;
function lnx(){if(LNX&&LNX.d===S.date)return LNX;const o={d:S.date,out:{},inn:{},pair:{},outD:{},inD:{}};for(const id in S.ps){const q=S.ps[id];if(!q||q.loanFrom==null)continue;const c=clubOf(+id);const f=q.loanFrom;if(c===f||c==null||c<0)continue;
    const p=pl(+id);const ex=lnExemptX(p,f);const dom=lnDom(f,c);if(!ex){o.out[f]=(o.out[f]||0)+1;o.inn[c]=(o.inn[c]||0)+1}if(dom){if(!(ageOf(p)<=21))o.outD[f]=(o.outD[f]||0)+1;o.inD[c]=(o.inD[c]||0)+1}const k=f+'>'+c;o.pair[k]=(o.pair[k]||0)+1}
  LNX=o;return o}
function lnNat(c){const lg=lgRaw(c);if(!lg)return null;const b=typeof baseLg==='function'?baseLg(lg.replace(/L$/,'')):lg;return (LGNAT[b]||LGNAT[lg]||[null])[0]}
function lnDom(a,b){const x=lnNat(a),y=lnNat(b);return !!x&&x===y}
function lnExemptX(p,c){if(!p)return true;if(ageOf(p)<=21)return true;try{return typeof hgStat==='function'&&hgStat(p,c)==='c'}catch(e){return false}}
function lnLgOK(p,from,to){try{if(!p||from==null||to==null||from<0||to<0||!CLUBS[from]||!CLUBS[to])return null;const X=lnx();const ex=lnExemptX(p,from);
  if(!lnDom(from,to)){if(!ex&&(X.out[from]||0)>=6)return `${CLUBS[from].name}의 임대 보낸 선수가 FIFA 한도(6명, 21세 이하·자체 육성 제외)입니다`;if(!ex&&(X.inn[to]||0)>=6)return `${CLUBS[to].name}의 임대 받은 선수가 FIFA 한도(6명)입니다`}
  if((X.pair[from+'>'+to]||0)>=(lgRaw(from)==='AT'||lgRaw(to)==='AT'?2:3))return `같은 구단으로 보낼 수 있는 임대 인원을 넘습니다`;
  const lf=lgRaw(from),lt=lgRaw(to);
  if(lnDom(from,to)&&(lt==='EN')){if((X.inD[to]||0)>=2)return `프리미어리그 규정상 국내 임대 선수는 동시에 2명까지입니다`;const sN=((S.lnS||{})[S.season]||{})[to]||0;if(sN>=4)return `프리미어리그 규정상 국내 임대 영입은 시즌 4건까지입니다`}
  if(lnDom(from,to)&&(lf==='DE'||lf==='DE2')&&!(ageOf(p)<=21)&&(X.outD[from]||0)>=6)return `독일 리그 규정상 국내 임대 보내기는 6명까지입니다(21세 이하 제외)`;
  if(lf==='AT'&&(X.out[from]||0)+(lnDom(from,to)?0:0)>=10)return `오스트리아 리그 규정상 임대 보내기는 10명까지입니다`;
  if(lt==='AT'&&(X.inD[to]||0)+(X.inn[to]||0)>=6)return `오스트리아 리그 규정상 임대 받기는 6명까지입니다`;
  return null}catch(e){console.error(e);return null}}
{const _ct=completeTransfer;completeTransfer=function(id,to,fee,o){const r=_ct.apply(this,arguments);try{if(o&&o.loan&&to>=0&&lnDom(clubOf(id),to)!==null){S.lnS=S.lnS||{};const Y=(S.lnS[S.season]=S.lnS[S.season]||{});const q=S.ps[id];if(q&&q.loanFrom!=null&&lnDom(q.loanFrom,to))Y[to]=(Y[to]||0)+1}LNX=null}catch(e){}return r}}
{const _ro=rollover;rollover=function(){const r=_ro.apply(this,arguments);try{if(S.lnS)for(const y in S.lnS)if(+y<S.season)delete S.lnS[y];LNX=null;if(S.penS)for(const y in S.penS)if(+y<S.season-1)delete S.penS[y]}catch(e){}return r}}
{const _la=lnAccept;lnAccept=function(m){try{const p=pl(m.pid);const w=lnLgOK(p,S.club,m.from);if(w)return w}catch(e){}return _la.apply(this,arguments)}}
{const _cr=clubRespond;clubRespond=function(p,o){try{if(o&&o.loan){const w=lnLgOK(p,clubOf(p.id),S.club);if(w)return {k:'no',msg:w}}}catch(e){}return _cr.apply(this,arguments)}}
// ---------- ⑧ MLS 연봉 상한 ----------
const MLS={fx:.86,cap:6425000,max:803125,gam:3280000,tam:2125000,u22:200000,dp:3,u22n:3};
function mlsAllow(){return (MLS.cap+MLS.gam+MLS.tam)*MLS.fx}
function mlsCharge(c,add,w){const L=squadOf(c).filter(p=>!resOf(p.id)&&(!add||p.id!==add.id)).map(p=>[p.wage||0,ageOf(p)]);if(add)L.push([w!=null?w:add.wage||0,ageOf(add)]);L.sort((a,b)=>b[0]-a[0]);
  const MX=MLS.max*MLS.fx,U=MLS.u22*MLS.fx;let dp=0,u=0;const ch=[];for(const [x,a] of L){if(x>MX&&dp<MLS.dp){dp++;ch.push(MX);continue}if(a<=22&&x>U&&u<MLS.u22n){u++;ch.push(U);continue}ch.push(x>MX?x:Math.min(x,MX))}
  ch.sort((a,b)=>b-a);return {sum:ch.slice(0,20).reduce((a,b)=>a+b,0),dp,u}}
function mlsLim(c){S.mls0=S.mls0||{};const a=mlsAllow();const g=S.mls0[c];return Math.max(a,g||0)}
function mlsOK(p,c,w){if(!sqrOn()||lgRaw(c)!=='US')return true;if(clubOf(p.id)===c)return true;const after=mlsCharge(c,p,w).sum;if(after<=mlsLim(c))return true;return after<=mlsCharge(c).sum/* 줄어드는 교체는 허용 */}
function mlsTxt(c){const k=mlsCharge(c);return `시니어 20명 부담액 €${(k.sum/1e6).toFixed(2)}M / 한도 €${(mlsLim(c)/1e6).toFixed(2)}M · DP ${k.dp}/${MLS.dp} · U22 ${k.u}/${MLS.u22n}`}
{const _pr=playerRespond;playerRespond=function(p,t){try{if(t&&S.club>=0&&lgRaw(S.club)==='US'&&!mlsOK(p,S.club,t.wage))return {k:'no',msg:`MLS 연봉 상한을 넘습니다(${mlsTxt(S.club)}). 연봉을 낮추거나 선수단 연봉을 줄여야 합니다.`}}catch(e){}return _pr.apply(this,arguments)}}
function mlsInit(){try{S.mls0=S.mls0||{};const a=mlsAllow();for(const C of CLUBS){if(!C||C.lg!=='US'||S.mls0[C.i]!=null)continue;const s=mlsCharge(C.i).sum;S.mls0[C.i]=s>a?s:0}}catch(e){console.error(e)}}
// ---------- 규정 문구·칩·안내 ----------
function lgExtraChips(c){const a=[];const lg=lgRaw(c);try{
  if(lg==='MX'){const st=mxStage();const m=mxMin(c,st);a.push(`유스 ${m}/${MXY.min}분${m<MXY.min&&mxLeft(c,st)*90<MXY.min-m?' ⚠':''}`)}
  if(deDom(c))a.push(`독일 국적 ${natCnt(c)}/12`);if(lg==='JP')a.push(`HG ${jpHG(c)}/4`);if(lg==='US')a.push(mlsTxt(c))}catch(e){}return a.join(' · ')}
{const _rt=sqrRuleTxt;sqrRuleTxt=function(c){let t=_rt.apply(this,arguments);const lg=lgRaw(c),a=[];
  t=t.replace(`벤치 ${benchN(c)}명`,`벤치 ${benchN(c)}명(유럽대항전 ${BENCH_EU}명, 교체는 벤치 선수만)`);
  if(lg==='KR')a.push(`출전 명단 20명 중 U22(${+S.date.slice(0,4)-22}년 이후 출생, 기준 연도 추정) 2명 이상 — 1명이면 19명·0명이면 18명`);
  if(lg==='MX')a.push(`${S.season-MXY.a}년 이후 출생 선수 대회(아페르투라·클라우수라)마다 정규리그 ${MXY.min}분 이상, 미달 시 승점 −${MXY.pen}`);
  if(lg==='SA')a.push(`${S.season-20}년 이후 출생 외국인은 리그 1군 출전 불가`);
  if(lg==='TR')a.push(`${S.season-20}년 이후 출생 자국 선수는 명단 밖 출전 가능 · GK 3명 중 2명 자국`);
  if(deDom(c))a.push('독일 국적 선수 12명 이상(모자라면 외국인 영입 불가)');if(lg==='JP')a.push('홈그로운 4명 이상(안내)');
  if(lg==='US')a.push(`MLS 연봉 상한(시니어 20명 부담액, DP ${MLS.dp}명·U22 ${MLS.u22n}명 고정 부담, 할당금 포함 €${(mlsAllow()/1e6).toFixed(2)}M)`);
  const ln=lg==='EN'?'국내 임대 받기 동시 2·시즌 4':lg==='DE'||lg==='DE2'?'국내 임대 보내기 6(21세 이하 제외)':lg==='AT'?'임대 보내기 10·받기 6':'';a.push(`임대 FIFA 6명(21세 이하·자체 육성 제외)${ln?' · '+ln:''}`);
  return t.replace(/ · 계약 선수 /,` · ${a.join(' · ')} · 계약 선수 `)}}
function lgNotice(){try{if(!S||S.club<0||unemp()||!sqrOn())return;const c=S.club,lg=lgRaw(c),w=winNow();S.lgNt=S.lgNt||{};
  if(w&&addD(S.date,3)===w.to){const k='w'+w.to;if(!S.lgNt[k]){S.lgNt[k]=1;const a=[];if(deDom(c)&&natCnt(c)<12)a.push(`독일 국적 선수 ${natCnt(c)}명 — 12명 이상이어야 외국인 영입이 가능합니다.`);if(lg==='JP'&&jpHG(c)<4)a.push(`홈그로운 선수 ${jpHG(c)}명 — J리그는 등록 마감일에 4명 이상을 요구합니다.`);if(a.length)inbox('board','','이적시장 마감 전 규정 점검',a.join('\n'))}}
  if(lg==='MX'){const st=mxStage();if(!mxActive(st))return;const left=mxLeft(c,st),m=mxMin(c,st);const k='mx'+S.season+st+(left<=8?'b':'a');if((left===8||left===4)&&m<MXY.min&&!S.lgNt[k]){const need=Math.ceil((MXY.min-m)/Math.max(1,left));if(need>45){S.lgNt[k]=1;inbox('board','',`어린 선수 출전 시간 부족`,`${S.season-MXY.a}년 이후 출생 선수 정규리그 ${m}/${MXY.min}분. 남은 ${left}경기에서 경기당 약 ${need}분이 더 필요합니다. 못 채우면 승점 ${MXY.pen}점이 깎입니다.`)}}}}catch(e){console.error(e)}}
// ---------- 시작·기존 세이브 ----------
function mig312(){if(!S||S.mig312)return;S.mig312=1;try{/* 리가MX: 이미 시작한 대회는 유예 */const fx=(typeof lfFx==='function'&&lfFx('MX'))||[];const st=mxStage();const started=fx.some(f=>f.st===st&&f.res);S.mxFrom=S.season*10+(st==='C'?1:0)+(started?1:0);
  if(st==='C'||started){for(const c of lfIds('MX')||[])for(const p of squadOf(c)){const q=S.ps[p.id];if(q&&st==='C'&&!q.mxA)q.mxA={s:S.season,v:0}}}mlsInit();SQC=null;
  if(S.club>=0&&!unemp())inbox('board','','리그 별도 규정 추가',`경기 명단 벤치 인원(리그 규정, 교체는 벤치 선수만)·어린 선수 규정·임대 한도·자국 선수 최소 인원·MLS 연봉 상한이 들어갔습니다: ${sqrRuleTxt(S.club)}.\n전술 탭에서 벤치를 고를 수 있습니다(안 고르면 자동). 리가MX 출전 시간 규정은 다음 대회부터 적용합니다.`)}catch(e){console.error(e)}}
{const _dl=devLoad;devLoad=function(){const r=_dl.apply(this,arguments);try{mig312()}catch(e){console.error(e)}return r}}
{const _sg=startGame;startGame=function(){const r=_sg.apply(this,arguments);try{if(S){S.mig312=1;S.mxFrom=0;mlsInit();if(sqrOn())CLUBS.forEach(C=>{if(C&&C.i>=0&&C.i!==S.club&&deDom(C.i)&&S.aiBudget&&S.aiBudget[C.i]!==undefined&&natCnt(C.i)<12)deFill(C.i)})}}catch(e){console.error(e)}return r}}
