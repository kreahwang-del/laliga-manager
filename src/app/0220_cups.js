// ================= 국내 컵대회(v68): 국왕컵 + 각국 컵 =================
// 설계
//  · 나라별 1개 대회(1부 + 해당 나라 2부). 단판 녹아웃, 무승부 → 연장(빠른 계산) → 승부차기. 국왕컵·코파 이탈리아는 4강 홈앤어웨이(실제 규정)
//  · 1라운드: 참가 팀 수가 2의 거듭제곱이 아니면 하위(2부·평판 낮은) 팀끼리 예선, 상위 팀은 부전승
//  · 홈: 단판(결승 제외)은 하위 리그 팀이 홈(국왕컵 실제 규정을 전체에 적용). 결승은 중립(빠른 계산 홈 이점 0)
//  · 날짜: 주말 리그 일정의 수요일(10월 말 ~ 4월). 우리 팀 경기는 2D 엔진, 나머지는 리그별 빠른 결과 계산
//  · 컵 경기 기록은 리그 득점·출전 기록에 넣지 않음(체력만 소모). 상위 팀은 4강 전까지 로테이션을 크게 돌림(실제 컵 운영)
const CUPS={ES:['국왕컵','ES2',1],EN:['FA컵','EN2',0],DE:['DFB 포칼','DE2',0],IT:['코파 이탈리아','IT2',1],FR:['쿠프 드 프랑스','FR2',0],PT:['타사 드 포르투갈'],NL:['KNVB 베이커르'],
  BE:['벨기에컵'],TR:['튀르키예컵'],SC:['스코티시컵'],CH:['스위스컵'],AT:['오스트리아컵'],DK:['덴마크컵'],KR:['코리아컵'],JP:['천황배'],CN:['중국 FA컵'],SA:['킹스컵'],US:['US 오픈컵'],AR:['코파 아르헨티나'],BR:['코파 두 브라질']};
const CUP_PRIZE={ES:3e6,EN:3e6,DE:3e6,IT:3e6,FR:2e6};
function cupTeams(lg){const C=CUPS[lg];const t=lgClubs(lg).concat(C[1]?lgClubs(C[1]):[]);return t.filter(c=>!isB(c))}
const lowerOf=c=>/2$/.test(CLUBS[c].lg)?1:0;
function cupRName(n){return n===2?'결승':n===4?'4강':n===8?'8강':n===16?'16강':n===32?'32강':n===64?'64강':`${n}강`}
function cupBuild(y){S.cups={};const w=leagueDates(y);
  for(const lg in CUPS){const tm=cupTeams(lg);if(tm.length<4)continue;let P=1;while(P*2<=tm.length)P*=2;const pre=tm.length>P;const R=Math.log2(P)+(pre?1:0);
    const sf2=CUPS[lg][2]&&P>=4;const dates=[];
    for(let k=0;k<R;k++){let i=Math.round(9+k*(33-9)/Math.max(1,R-1));if([8,16,24,32].includes(i))i++;const d=addD(w[Math.min(37,i)],3);
      if(sf2&&k===R-2){const i2=Math.min(i+2,Math.round(9+(R-1)*(33-9)/Math.max(1,R-1))-1);dates.push([d,addD(w[i2],3)])}else dates.push([d])}
    const cu={lg,n:CUPS[lg][0],R,dates,sf2,rounds:[],champ:null};
    // 1라운드: 약한 팀 2m팀 예선, 나머지 부전승
    const str=c=>lowerOf(c)*1000-(CLUBS[c].rep||0)-hsh(y+'cs'+c);const ord=tm.slice().sort((a,b)=>str(b)-str(a));
    const m=tm.length-P;const play=pre?ord.slice(0,2*m):tm.slice(),bye=pre?ord.slice(2*m):[];
    cu.rounds.push(cupDraw(cu,0,play,bye));S.cups[lg]=cu}}
function cupDraw(cu,k,ent,bye){const y=S.season,lg=cu.lg;const sh=ent.slice().sort((a,b)=>hsh(y+lg+k+'d'+a)-hsh(y+lg+k+'d'+b));const ties=[];const n=(ent.length+(bye||[]).length);
  const fin=k===cu.R-1,two=cu.sf2&&k===cu.R-2,ds=cu.dates[k];const nm=k===0&&(bye||[]).length?'1라운드':cupRName(n);
  for(let i=0;i+1<sh.length;i+=2){let h=sh[i],a=sh[i+1];if(!fin&&!two&&lowerOf(a)>lowerOf(h)){const t=h;h=a;a=t}
    const mk=(d,hh,aa,leg)=>({d,h:hh,a:aa,res:null,cup:lg,rd:k,ti:ties.length,leg,lg,neu:fin?1:0});
    ties.push({h,a,w:null,f:two?[mk(ds[0],h,a,1),mk(ds[1]||addD(ds[0],14),a,h,2)]:[mk(ds[0],h,a,0)]})}
  return {nm,ties,bye:bye||[]}}
function cupAll(){const o=[];for(const lg in (S.cups||{}))S.cups[lg].rounds.forEach(r=>r.ties.forEach(t=>t.f.forEach(f=>o.push(f))));return o}
function cupTie(f){const cu=S.cups&&S.cups[f.cup];return cu&&cu.rounds[f.rd]&&cu.rounds[f.rd].ties[f.ti]}
function cupLabel(f){const cu=S.cups[f.cup],r=cu.rounds[f.rd];return `${cu.n} ${r.nm}${f.leg?` ${f.leg}차전`:''}`}
function cupMine(){if(typeof unemp==='function'&&unemp())return null;return cupAll().find(f=>f.d===S.date&&!f.res&&(f.h===S.club||f.a===S.club))||null}
function cupNextMine(){if(typeof unemp==='function'&&unemp())return null;return cupAll().filter(f=>!f.res&&(f.h===S.club||f.a===S.club)).sort((a,b)=>a.d<b.d?-1:1)[0]||null}
function cupLamT(f,H,A){const P=LGP[f.lg]||[FASTM.a,FASTM.b];if(!H||!A)return [1.2,1.2];const av=t=>t.xi.reduce((s,p)=>s+effO(p),0)/Math.max(1,t.xi.length);const d=av(H)-av(A),hh=f.neu?0:lgHome(f.lg),a=P[0]+Math.log(Math.cosh(.2)/Math.cosh(hh));
  return [Math.exp(a+P[1]*d+hh),Math.exp(a-P[1]*d-hh)]}
function cupLam(f){return cupLamT(f,teamFor(f.h),teamFor(f.a))}
/* 컵 빠른 계산: 리그 기록(출전·골)에 넣지 않고 체력만 소모 */
function cupFast(f){const H=teamFor(f.h),A=teamFor(f.a);if(!H||!A){f.res={sc:[1,0],ev:[],fast:1};return}const L=cupLamT(f,H,A),k=S.season+':'+f.cup+':'+f.rd+':'+f.h+':'+f.a+':'+f.leg;
  f.res={sc:[poisR(L[0],hsh('h'+k)),poisR(L[1],hsh('a'+k))],ev:[],fast:1};
  [H,A].forEach(T=>T.xi.forEach(p=>{const q=S.ps[p.id]=S.ps[p.id]||{};q.played=S.date;q.fit=Math.max(30,Math.round((q.fit??100)-(p.g==='GK'?2:9)))}));try{fastAfter(f,H,A,f.res.sc[0],f.res.sc[1],[],false)}catch(e){console.error(e)}}
/* 승부차기: 키커 상위 5명(페널티·침착성)과 골키퍼(선방)로 성공 확률, 5명 → 서든데스 */
function cupPens(f){const H=teamFor(f.h),A=teamFor(f.a),k=S.season+':'+f.cup+':'+f.rd+':'+f.h+':'+f.a+'pk';
  const tk=T=>T?T.xi.filter(p=>p.g!=='GK').map(p=>(p.pen||10)*.7+(p.comp||12)*.3).sort((a,b)=>b-a):[];const gk=T=>{const g=T&&T.xi.find(p=>p.g==='GK');return g?(g.gk_save||12):12};
  const K=[tk(H),tk(A)],G2=[gk(A),gk(H)],s=[0,0];const pr=(i,j)=>Math.max(.55,Math.min(.9,.75+((K[i][j%Math.max(1,K[i].length)]||12)-12)*.012-(G2[i]-12)*.008));
  for(let j=0;j<5;j++)for(let i=0;i<2;i++){if(hsh(i+'_'+j+k)<pr(i,j))s[i]++}
  let j=5;while(s[0]===s[1]&&j<30){const a=hsh('0_'+j+k)<pr(0,j),b=hsh('1_'+j+k)<pr(1,j);s[0]+=a;s[1]+=b;j++}if(s[0]===s[1])s[hsh(k+'x')<.5?0:1]++;return s}
/* 경기 후 처리: 단판/2차전에서 동률이면 연장(빠른 계산, 90분 득점률의 1/3) → 승부차기 */
function cupPost(f){const t=cupTie(f);if(!t||t.w!=null)return;const two=t.f.length===2;if(two&&f.leg===1)return;if(two&&!t.f[0].res)return;
  let gh,ga;if(two){const a=t.f[0].res.sc,b=t.f[1].res.sc;gh=a[0]+b[1];ga=a[1]+b[0]}else{gh=f.res.sc[0];ga=f.res.sc[1]}
  /* 2차전은 홈·원정이 바뀌어 있음(t.h가 2차전 원정) */
  if(gh===ga){const L=cupLam(f),k=S.season+':'+f.cup+':'+f.rd+':'+f.h+f.a+'et';const e=[poisR(L[0]/3,hsh('h'+k)),poisR(L[1]/3,hsh('a'+k))];f.et=e;
    if(two){gh+=e[1];ga+=e[0]}else{gh+=e[0];ga+=e[1]}
    if(gh===ga){f.pk=cupPens(f);const fw=f.pk[0]>f.pk[1]?f.h:f.a;t.w=fw}else t.w=gh>ga?t.h:t.a}
  else t.w=gh>ga?t.h:t.a;t.sc=`${gh}-${ga}`;t.sl=`${CLUBS[t.h].short} ${gh}-${ga} ${CLUBS[t.a].short}`;cupWon(f,t)}
function cupWon(f,t){const cu=S.cups[f.cup];const lo=t.w===t.h?t.a:t.h;
  if(f.rd===cu.R-1){cu.champ=t.w;S.cupHist=(S.cupHist||[]).concat([{y:S.season,lg:cu.lg,w:t.w,r:lo}]).slice(-200);
    S.news.unshift({d:S.date,t:`${cu.n} 우승: ${CLUBS[t.w].name}`,b:`결승 ${CLUBS[f.h].short} ${f.res.sc[0]}-${f.res.sc[1]} ${CLUBS[f.a].short}${f.et?` (연장 ${f.et[0]}-${f.et[1]})`:''}${f.pk?` · 승부차기 ${f.pk[0]}-${f.pk[1]}`:''}`,v:0,big:true});
    if(t.w===S.club&&!(typeof unemp==='function'&&unemp())){const pz=CUP_PRIZE[cu.lg]||1e6;S.fin.budget+=pz;S.fin.log.unshift({d:S.date,t:`${cu.n} 우승 상금`,v:pz});if(S.me){S.me.trust=Math.min(100,(S.me.trust||60)+6);S.me.titles=(S.me.titles||0)+1}
      inbox('board','',`${cu.n} 우승!`,`${CLUBS[S.club].name}이(가) ${cu.n} 정상에 올랐습니다. 상금 ${money(pz)}이 이적 예산에 들어갑니다.`);if(typeof hlPush==='function')hlPush({key:'cup'+S.season+cu.lg,pri:6,tone:'good',c:S.club,t:`${cu.n} 우승!`,b:'트로피를 들어 올렸습니다'})}}
  else if((t.h===S.club||t.a===S.club)&&!(typeof unemp==='function'&&unemp())){const r=cu.rounds[f.rd].nm;
    if(t.w===S.club){if(typeof hlPush==='function'&&f.rd>=cu.R-3)hlPush({key:'cupw'+S.season+f.rd,pri:3,tone:'good',c:lo,t:`${cu.n} ${r} 통과`,b:`${t.sl}${f.pk?` (승부차기 ${f.pk[0]}-${f.pk[1]})`:''}`})}
    else{const shock=lowerOf(t.w)>lowerOf(S.club);if(typeof hlPush==='function')hlPush({key:'cupl'+S.season,pri:shock?4:2,tone:'bad',c:t.w,t:`${cu.n} ${r} 탈락${shock?' — 하부 리그 팀에 이변':''}`,b:`${t.sl}${f.pk?` (승부차기 ${f.pk[0]}-${f.pk[1]})`:''}`});if(shock&&S.me)S.me.trust=Math.max(0,(S.me.trust||60)-3)}}}
function cupProgress(){for(const lg in (S.cups||{})){const cu=S.cups[lg];if(cu.champ!=null)continue;const k=cu.rounds.length-1,r=cu.rounds[k];if(!r.ties.every(t=>t.w!=null))continue;if(k>=cu.R-1)continue;
  const ent=r.ties.map(t=>t.w).concat(r.bye||[]);cu.rounds.push(cupDraw(cu,k+1,ent,[]));
  const my=cu.rounds[k+1].ties.find(t=>t.h===S.club||t.a===S.club);if(my&&!(typeof unemp==='function'&&unemp())){const o=my.h===S.club?my.a:my.h;inbox('board','',`${cu.n} ${cu.rounds[k+1].nm} 대진`,`상대: ${CLUBS[o].name} (${my.h===S.club?'홈':'원정'}) · ${fmtD(my.f[0].d)}${my.f.length>1?` / 2차전 ${fmtD(my.f[1].d)}`:''}`)}}}
/* 빠른 계산: 오늘(또는 지난) 컵 경기. 우리 팀 오늘 경기는 엔진으로 직접 진행하므로 제외. 상위 팀은 8강 전까지 로테이션 확대 */
function cupToday(){if(!S.cups)return;const mineOn=!(typeof unemp==='function'&&unemp());
  for(const f of cupAll()){if(f.res||f.d>S.date)continue;if(mineOn&&f.d===S.date&&(f.h===S.club||f.a===S.club))continue;const cu=S.cups[f.cup];const early=f.rd<cu.R-3;
    const r0={...ROT};if(early){ROT.base=.3;ROT.eu=.35;ROT.gk=.6}try{cupFast(f)}finally{Object.assign(ROT,r0)}
    cupPost(f)}
  cupProgress()}
function cupsDone(){if(!S.cups)return true;for(const lg in S.cups){const cu=S.cups[lg];if(cu.champ==null&&S.date<=addD(cu.dates[cu.R-1][0],10))return false}return true} /* 안전장치: 결승 예정일 10일 뒤에는 막지 않음 */
{const _ft=divFastToday;divFastToday=function(){_ft();try{cupToday()}catch(e){console.error(e)}}}
{const _od=divOtherDone;divOtherDone=function(){return _od()&&cupsDone()}}
{const _ns=newSeason;newSeason=function(y,first){if(!first&&S.cups){const ch=Object.values(S.cups).filter(c=>c.champ!=null).map(c=>c.n+' '+CLUBS[c.champ].short);S.cupCh=(S.cupCh||[]).concat([{y:S.season,ch:Object.values(S.cups).map(c=>[c.lg,c.champ])}]).slice(-30)}
  _ns(y,first);if(S.d2||!first){try{cupBuild(y)}catch(e){console.error(e)}}}}
{const _sg=startGame;startGame=function(club){_sg(club);cupBuild(S.season);save();render()}}
{const _dl=devLoad;devLoad=function(){_dl();try{if(S&&!S.cups&&S.fxE)cupBuild(S.season)}catch(e){console.error(e)}}}
/* 우리 팀 컵 경기(엔진) 종료 후: 연장·승부차기 판정과 중계 표시 */
{const _fi=finish;finish=function(){const fx=M&&M.fx;_fi();if(!fx||!fx.cup)return;try{cupPost(fx);const t=cupTie(fx);
  if(fx.et)feed({m:120,t:'sys',txt:`연장전 ${fx.et[0]} : ${fx.et[1]}`});if(fx.pk)feed({m:120,t:'sys',txt:`승부차기 ${fx.pk[0]} : ${fx.pk[1]}`});
  if(t&&t.w!=null){const ok=t.w===S.club;feed({m:0,t:'sys',txt:ok?(fx.rd===S.cups[fx.cup].R-1?`${S.cups[fx.cup].n} 우승!`:`다음 라운드 진출 (${t.f.length>1?'합계 ':''}${t.sl})`):`탈락 (${t.f.length>1?'합계 ':''}${t.sl})`});toast(ok?'컵 다음 라운드 진출':'컵 탈락')}
  else if(fx.leg===1)feed({m:0,t:'sys',txt:'1차전 종료 · 2차전에서 승부'});save()}catch(e){console.error(e)}}}
// ---- 화면: 리그 탭 '컵대회' ----
UI.cup=UI.cup||'';
function cupMyLg(){const c=CLUBS[S.club];if(!c)return 'ES';const lg=c.lg.replace(/2$/,'');return CUPS[lg]?lg:'ES'}
function cupView(){if(!S.cups)return '<div class="card pad">컵대회 정보가 없습니다.</div>';const lgs=Object.keys(S.cups);const sel=S.cups[UI.cup]?UI.cup:cupMyLg();const cu=S.cups[sel];
  const chips=`<div class="tabs" style="margin-bottom:8px;overflow-x:auto;white-space:nowrap">${lgs.map(lg=>`<button data-cup="${lg}" aria-selected="${sel===lg}">${esc(S.cups[lg].n)}</button>`).join('')}</div>`;
  const sc=f=>f.res?`${f.res.sc[0]} : ${f.res.sc[1]}`:'vs';
  const tie=t=>{const me=t.h===S.club||t.a===S.club;const nm=c=>`<span style="${t.w===c?'font-weight:700':t.w!=null?'color:var(--muted)':''}">${esc(CLUBS[c].short)}</span>`;
    const ex=t.f.map(f=>(f.et?` 연장 ${f.et[0]}-${f.et[1]}`:'')+(f.pk?` · 승부차기 ${f.pk[0]}-${f.pk[1]}`:'')).join('');
    return `<div class="li" style="${me?'background:var(--surf2)':''}"><span class="nm"><b>${nm(t.h)} ${t.f.length>1?`${sc(t.f[0])} / ${t.f[1].res?`${t.f[1].res.sc[1]} : ${t.f[1].res.sc[0]}`:'vs'}`:sc(t.f[0])} ${nm(t.a)}</b><span>${fmtD(t.f[0].d)}${t.f.length>1?' · '+fmtD(t.f[1].d):''}${ex}</span></span></div>`};
  const rs=cu.rounds.map((r,k)=>({r,k})).reverse();
  const hist=(S.cupHist||[]).filter(h=>h.lg===sel).slice(-5).reverse();
  return chips+`${cu.champ!=null?`<div class="card pad" style="margin-bottom:8px">🏆 ${S.season}-${String(S.season+1).slice(2)} 우승 <b>${esc(CLUBS[cu.champ].name)}</b></div>`:''}
  ${rs.map(({r,k})=>`<h2>${esc(r.nm)}${r.bye.length?` <span class="note">· 부전승 ${r.bye.length}팀</span>`:''}</h2><div class="card list">${r.ties.map(tie).join('')}</div>`).join('')}
  ${cu.rounds.length<cu.R?`<div class="note" style="margin-top:6px">다음 라운드: ${fmtD(cu.dates[cu.rounds.length][0])} (앞 라운드가 끝나면 추첨)</div>`:''}
  ${hist.length?`<h2>역대 우승</h2><div class="card list">${hist.map(h=>`<div class="li"><span class="nm"><b>${h.y}-${String(h.y+1).slice(2)} ${esc(CLUBS[h.w].name)}</b><span>준우승 ${esc(CLUBS[h.r].name)}</span></span></div>`).join('')}</div>`:''}
  <div class="note" style="margin-top:6px">단판 · 동점이면 연장 후 승부차기 · 하위 리그 팀 홈 · 결승 중립${cu.sf2?' · 4강 홈앤어웨이':''}. 우리 팀 경기는 2D 엔진, 나머지는 빠른 결과 계산(4강 전까지 상위 팀 로테이션 반영). 컵 기록은 리그 기록에 넣지 않습니다.</div>`}
{const _lv=leagueView;leagueView=function(){let h=_lv();if(!S.cups)return h;
  h=h.replace('<button data-elg="" aria-selected="',`<button data-elg="CUP" aria-selected="${UI.elg==='CUP'}">컵대회</button><button data-elg="" aria-selected="`);
  if(UI.elg==='CUP'){const i=h.indexOf('</div>');return h.slice(0,i+6)+cupView()}
  if(!UI.elg&&UI.lt==='fix'){const my=cupAll().filter(f=>f.h===S.club||f.a===S.club);if(my.length)h+=`<h2>컵 경기</h2><div class="card list">${my.map(f=>`<div class="li"><span class="nm"><b>${esc(CLUBS[f.h].short)} ${f.res?`${f.res.sc[0]} : ${f.res.sc[1]}`:'vs'} ${esc(CLUBS[f.a].short)}</b><span>${esc(cupLabel(f))} · ${fmtD(f.d)}${f.et?` · 연장 ${f.et[0]}-${f.et[1]}`:''}${f.pk?` · 승부차기 ${f.pk[0]}-${f.pk[1]}`:''}</span></span></div>`).join('')}</div>`}
  return h}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-cup]');if(!b)return;UI.cup=b.dataset.cup;render()},true);

