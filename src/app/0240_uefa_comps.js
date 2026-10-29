// ================= 유럽대항전(v69): 챔피언스리그·유로파리그·컨퍼런스리그 =================
// 설계(2024~ 실제 형식 단순화)
//  · 각 대회 36팀 리그 페이즈: UCL·UEL 8경기(포트 4개 × 2팀, 홈·원정 1번씩), UECL 6경기(포트 6개 × 1팀). 같은 나라 팀끼리는 피함
//  · 1~8위 16강 직행, 9~24위 플레이오프(9~16위 시드, 2차전 홈), 25위 이하 탈락. 16강·8강·4강 홈앤어웨이(추첨), 결승 중립 단판. 동점 → 연장 → 승부차기
//  · 출전권(게임 리그 13개만 사용: 실제엔 다른 나라 팀도 나오지만 게임에 없음): 전 시즌 리그 순위 + 국내 컵 우승(UEL). 첫 시즌은 선수단 전력 순위로 대신
//    UCL: 잉·스 5, 이·독·프 4, 포·네 3, 벨·튀 2, 스코·스위스·오스트리아·덴마크 1 = 36
//    UEL: 컵 우승(이미 출전권 있으면 다음 순위) + 다음 순위(대리그 2·기타 1~2) → 남는 자리는 나라별 차례로 / UECL: 그다음 순위
//  · 날짜: UCL 화요일, UEL·UECL 목요일(리그 주말 사이), 리그 페이즈 9월~1월, 녹아웃 2~5월, 결승은 리그 종료 뒤
//  · 우리 경기는 2D 엔진, 나머지는 빠른 계산(대회별 실제 득점·홈 이점: UCL 2024~ TM 경기당 3.3골·홈 .145). 기록은 리그 기록에 넣지 않음(체력·부상만)
//  · 상금(실제 2024~27 배분 근사)의 50%를 이적 예산에 반영(우리 팀·AI 모두)
const EUC={UCL:{n:'챔피언스리그',md:8,pots:4,dow:2,prize:{part:18.6e6,w:2.1e6,d:.7e6,r16:11e6,qf:12.5e6,sf:15e6,f:18.5e6,win:6.5e6}},
  UEL:{n:'유로파리그',md:8,pots:4,dow:4,prize:{part:4.3e6,w:.45e6,d:.15e6,r16:1.75e6,qf:2.5e6,sf:2.8e6,f:4.5e6,win:4e6}},
  UECL:{n:'컨퍼런스리그',md:6,pots:6,dow:4,prize:{part:3.2e6,w:.4e6,d:.13e6,r16:.8e6,qf:1.3e6,sf:2e6,f:3e6,win:2e6}}};
const EU_LG=['EN','ES','IT','DE','FR','PT','NL','BE','TR','SC','CH','AT','DK'];
const EU_UCL={EN:5,ES:5,IT:4,DE:4,FR:4,PT:3,NL:3,BE:2,TR:2,SC:1,CH:1,AT:1,DK:1};
const EU_UEL={EN:2,ES:2,IT:2,DE:2,FR:2,PT:2,NL:2,BE:2,TR:2,SC:1,CH:1,AT:1,DK:1}; /* + 국내 컵 우승 1 */
const EU_UECL={EN:1,ES:1,IT:1,DE:1,FR:1,PT:1,NL:1,BE:1,TR:1,SC:2,CH:2,AT:2,DK:2};
/* 대회별 빠른 계산 [a,b]·홈: UCL은 TM 2024~ 리그 페이즈(경기당 3.3골, 1위 21~24점·8위 16·24위 9~11·꼴찌 0~1)에 맞춤. UEL·UECL은 실측이 없어 경기당 약 2.9골로 추정 */
LGP.UCL=[.4,.075];LGP.UEL=[.27,.07];LGP.UECL=[.25,.07];LGH.UCL=.145;LGH.UEL=.15;LGH.UECL=.15;
function euLgOf(c){return CLUBS[c]&&CLUBS[c].lg}
const EUSTR={};function euStr(c){if(EUSTR[c]&&EUSTR[c].d===S.date)return EUSTR[c].v;const sq=squadOf(c).slice().sort((a,b)=>b.ovr-a.ovr).slice(0,16);const v=sq.length?sq.reduce((a,p)=>a+p.ovr,0)/sq.length:60;EUSTR[c]={d:S.date,v};return v}
function euRankNow(){const R={};EU_LG.forEach(lg=>{const t=tableLg(lg);if(t.length&&t.some(x=>x.p>0))R[lg]=t.map(x=>x.id)});return R}
function euRankStr(){const R={};EU_LG.forEach(lg=>{const ids=lgClubs(lg);R[lg]=ids.slice().sort((a,b)=>euStr(b)-euStr(a))});return R}
function euQualify(R,cupW){const taken=new Set(),Q={UCL:[],UEL:[],UECL:[]};const nextOf=lg=>(R[lg]||[]).find(c=>!taken.has(c)&&CLUBS[c]&&!/2$/.test(CLUBS[c].lg));
  const put=(k,c)=>{if(c==null||taken.has(c))return false;taken.add(c);Q[k].push(c);return true};
  EU_LG.forEach(lg=>{for(let i=0;i<EU_UCL[lg];i++)put('UCL',nextOf(lg))});
  EU_LG.forEach(lg=>{const w=cupW&&cupW[lg];if(w!=null&&!taken.has(w))put('UEL',w);else put('UEL',nextOf(lg));for(let i=0;i<EU_UEL[lg];i++)put('UEL',nextOf(lg))});
  EU_LG.forEach(lg=>{for(let i=0;i<EU_UECL[lg];i++)put('UECL',nextOf(lg))});
  ['UCL','UEL','UECL'].forEach(k=>{let g=0;while(Q[k].length<36&&g<200){const lg=EU_LG[g%EU_LG.length];put(k,nextOf(lg));g++}});return Q}
function euDraw(k,teams,y){let b=null;for(let r=0;r<25;r++){const d=euDraw1(k,teams,y+'r'+r);if(!b||d.same<b.same||(d.same===b.same&&d.days<b.days))b=d;if(!d.same&&d.days===EUC[k].md)break}return b}
function euDraw1(k,teams,y){const C=EUC[k],P=C.pots,per=36/P;const ord=teams.slice().sort((a,b)=>(CLUBS[b].rep||0)-(CLUBS[a].rep||0)||euStr(b)-euStr(a));const pots=[];for(let i=0;i<P;i++)pots.push(ord.slice(i*per,(i+1)*per));
  let st=Math.floor(hsh(y+k+'dr')*4294967295)>>>0;const rnd=()=>{st=(st+0x6D2B79F5)>>>0;let t=st;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296};
  const shuf=a=>a.map(x=>[rnd(),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]);const same=(a,b)=>euLgOf(a)===euLgOf(b);
  const have=new Set(),key=(a,b)=>a<b?a+'-'+b:b+'-'+a;const days=[];const ok=(x,o)=>!same(x,o)&&!have.has(key(x,o));
  const tryPerm=(A,B)=>{let b=null,bs=1e9;for(let t=0;t<400;t++){const s=shuf(B);const bad=A.reduce((n,x,i)=>n+(ok(x,s[i])?0:1),0);if(bad<bs){bs=bad;b=s}if(!bad)break}return b};
  const push=(d,h,a)=>{days[d]=days[d]||[];days[d].push([h,a]);have.add(key(h,a))};
  /* 각 경기일 = 36팀 전원 1경기(완전 매칭). 포트 쌍 조합을 경기일 단위로 묶어 구성 */
  if(C.md===8){const G=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]];let d=0;
    G.forEach(grp=>{for(let rep=0;rep<2;rep++){grp.forEach(([i,j])=>{const A=pots[i],s1=tryPerm(A,pots[j]);A.forEach((x,q)=>rep===0?push(d,x,s1[q]):push(d,s1[q],x))});d++}});
    /* 마지막 2일: 같은 포트끼리(9팀이라 포트마다 1팀은 옆 포트 팀과) */
    const prevHome={};days.flat().forEach(([h])=>prevHome[h]=(prevHome[h]||0)+1);
    for(let dd=0;dd<2;dd++){let best=null,bb=1e9;for(let t=0;t<300;t++){const out=[],left=[];pots.forEach(pt=>{const s=shuf(pt);left.push(s[8]);for(let q=0;q<8;q+=2)out.push([s[q],s[q+1]])});const L=dd===0?[[left[0],left[1]],[left[2],left[3]]]:[[left[0],left[2]],[left[1],left[3]]];const all=out.concat(L);const bad=all.reduce((n,[a,b])=>n+(ok(a,b)?0:1),0);if(bad<bb){bb=bad;best=all}if(!bad)break}
      best.forEach(([a,b])=>{const ha=prevHome[a]||0,hb=prevHome[b]||0;const aHome=ha<hb||(ha===hb&&rnd()<.5);if(aHome){push(6+dd,a,b);prevHome[a]=ha+1}else{push(6+dd,b,a);prevHome[b]=hb+1}})}}
  else{/* UECL: 포트 6개 라운드로빈(5일) + 같은 포트 1일 */const R=roundRobin([0,1,2,3,4,5]).slice(0,5);
    R.forEach((pr,d)=>pr.forEach(([i,j])=>{const s1=tryPerm(pots[i],pots[j]);pots[i].forEach((x,q)=>push(d,x,s1[q]))}));
    const prevHome={};days.flat().forEach(([h])=>prevHome[h]=(prevHome[h]||0)+1);
    pots.forEach(pt=>{let best=null,bb=1e9;for(let t=0;t<200;t++){const s=shuf(pt);const pr=[[s[0],s[1]],[s[2],s[3]],[s[4],s[5]]];const bad=pr.reduce((n,[a,b])=>n+(ok(a,b)?0:1),0);if(bad<bb){bb=bad;best=pr}if(!bad)break}
      best.forEach(([a,b])=>{const ha=prevHome[a]||0,hb=prevHome[b]||0;if(ha<=hb)push(5,a,b);else push(5,b,a)})})}
  const order=shuf(days.map((x,i)=>i));const fx=[];order.forEach((di,md)=>days[di].forEach(([h,a])=>fx.push({h,a,md})));
  /* 홈·원정 정확히 반반: 오일러 회로 방향으로 홈 결정(모든 팀 차수가 짝수라 가능) */
  {const adj={};fx.forEach((m,e)=>{(adj[m.h]=adj[m.h]||[]).push(e);(adj[m.a]=adj[m.a]||[]).push(e)});const used=new Array(fx.length).fill(false),ptr={};
   for(const v0 in adj){const stack=[+v0];while(stack.length){const v=stack[stack.length-1];const L=adj[v];let p=ptr[v]||0;while(p<L.length&&used[L[p]])p++;ptr[v]=p;
     if(p===L.length){stack.pop();continue}const e=L[p];used[e]=true;const m=fx[e];const w=m.h===v?m.a:m.h;m.h=v;m.a=w;stack.push(w)}}}
  return {pots,days:days.length,fx,same:fx.filter(m=>same(m.h,m.a)).length}}
function euDates(y){const w=leagueDates(y);return {md:[3,5,7,10,12,16,18,21],po:[24,25],r16:[26,29],qf:[30,31],sf:[32,34],w}}
function euBuildY(y,R,cupW){const Q=euQualify(R,cupW),D=euDates(y);S.eu={y,Q,comp:{}};
  for(const k in EUC){const C=EUC[k];if(Q[k].length<36)continue;const dr=euDraw(k,Q[k],y);const dw=C.dow;
    const fx=dr.fx.map(m=>({d:addD(D.w[D.md[m.md]],dw),h:m.h,a:m.a,res:null,eu:k,md:m.md+1,lg:k}));
    S.eu.comp[k]={teams:Q[k],pots:dr.pots,fx,ko:[],champ:null};
    Q[k].forEach(c=>euPay(c,k,'part'))}
  const me=Object.keys(S.eu.comp).find(k=>S.eu.comp[k].teams.includes(S.club));
  if(me&&!(typeof unemp==='function'&&unemp())){const C=S.eu.comp[me];const my=C.fx.filter(f=>f.h===S.club||f.a===S.club).sort((a,b)=>a.d<b.d?-1:1);
    inbox('board','',`${EUC[me].n} 리그 페이즈 추첨`,`상대 ${my.length}팀: ${my.map(f=>`${CLUBS[f.h===S.club?f.a:f.h].short}(${f.h===S.club?'홈':'원정'})`).join(' · ')}. 첫 경기 ${fmtD(my[0].d)}. 1~8위 16강 직행, 9~24위 플레이오프.`)}
  S.news.unshift({d:S.date,t:'유럽대항전 리그 페이즈 추첨',b:Object.keys(S.eu.comp).map(k=>`${EUC[k].n} ${S.eu.comp[k].teams.filter(c=>euLgOf(c)==='ES').map(c=>CLUBS[c].short).join('·')||'-'}`).join(' / ')+' (스페인 구단)',v:0,big:true})}
function euPay(c,k,what){const v=EUC[k].prize[what];if(!v)return;const add=Math.round(v*.5);
  if(c===S.club&&!(typeof unemp==='function'&&unemp())){S.fin.budget+=add;S.fin.log.unshift({d:S.date,t:`${EUC[k].n} 상금(${({part:'출전',w:'승리',d:'무승부',r16:'16강',qf:'8강',sf:'4강',f:'결승',win:'우승'})[what]}, 예산 50% 반영)`,v:add})}
  else if(S.aiBudget&&S.aiBudget[c]!=null)S.aiBudget[c]+=add}
function euAll(){const o=[];if(!S.eu||S.eu.y!==S.season)return o;for(const k in S.eu.comp){const C=S.eu.comp[k];C.fx.forEach(f=>o.push(f));C.ko.forEach(r=>r.ties.forEach(t=>t.f.forEach(f=>o.push(f))))}return o}
function euMine(){if(typeof unemp==='function'&&unemp())return null;return euAll().find(f=>f.d===S.date&&!f.res&&(f.h===S.club||f.a===S.club))||null}
function euTable(k){const C=S.eu.comp[k];const t={};C.teams.forEach(id=>t[id]={id,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});
  C.fx.forEach(f=>{if(!f.res)return;const [a,b]=f.res.sc,H=t[f.h],A=t[f.a];H.p++;A.p++;H.gf+=a;H.ga+=b;A.gf+=b;A.ga+=a;if(a>b){H.w++;A.l++;H.pts+=3}else if(a<b){A.w++;H.l++;A.pts+=3}else{H.d++;A.d++;H.pts++;A.pts++}});
  return Object.values(t).sort((x,y)=>y.pts-x.pts||(y.gf-y.ga)-(x.gf-x.ga)||y.gf-x.gf||(CLUBS[y.id].rep||0)-(CLUBS[x.id].rep||0))}
const EU_RN=['플레이오프','16강','8강','4강','결승'];
function euKoRound(k,ri,pairs){const D=euDates(S.season),C=EUC[k],dw=C.dow;const nm=EU_RN[ri];
  const dd=ri===0?D.po:ri===1?D.r16:ri===2?D.qf:ri===3?D.sf:null;
  const ties=pairs.map(([lo,hi],i)=>{if(ri===4){const d=k==='UCL'?addD(D.w[37],6):addD(D.w[37],3);return {h:hi,a:lo,w:null,f:[{d,h:hi,a:lo,res:null,eu:k,ko:ri,ti:i,leg:0,lg:k,neu:1}]}}
    return {h:hi,a:lo,w:null,f:[{d:addD(D.w[dd[0]],dw),h:lo,a:hi,res:null,eu:k,ko:ri,ti:i,leg:1,lg:k},{d:addD(D.w[dd[1]],dw),h:hi,a:lo,res:null,eu:k,ko:ri,ti:i,leg:2,lg:k}]}});
  S.eu.comp[k].ko[ri]={nm,ties};
  const my=ties.find(t=>t.h===S.club||t.a===S.club);if(my&&!(typeof unemp==='function'&&unemp())){const o=my.h===S.club?my.a:my.h;inbox('board','',`${C.n} ${nm} 대진`,`상대 ${CLUBS[o].name} · ${my.f.map(f=>`${fmtD(f.d)}(${f.h===S.club?'홈':'원정'})`).join(' / ')}${ri===4?' · 중립 경기장':''}`)}}
function euShuffle(a,key){return a.map(x=>[hsh(key+x),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1])}
function euProgress(){if(!S.eu||S.eu.y!==S.season)return;for(const k in S.eu.comp){const C=S.eu.comp[k];if(C.champ!=null)continue;
  if(!C.ko.length){if(!C.fx.every(f=>f.res))continue;const t=euTable(k).map(x=>x.id);C.rank=t;
    const seeded=euShuffle(t.slice(8,16),S.season+k+'pos'),un=euShuffle(t.slice(16,24),S.season+k+'pou');euKoRound(k,0,seeded.map((s,i)=>[un[i],s]));
    if(t.slice(0,8).includes(S.club)&&!(typeof unemp==='function'&&unemp()))inbox('board','',`${EUC[k].n} 16강 직행`,`리그 페이즈 ${t.indexOf(S.club)+1}위로 16강에 직행했습니다.`);
    if(t.slice(24).includes(S.club)&&!(typeof unemp==='function'&&unemp()))inbox('board','',`${EUC[k].n} 탈락`,`리그 페이즈 ${t.indexOf(S.club)+1}위로 탈락했습니다(24위 이내 필요).`);
    continue}
  const ri=C.ko.length-1,r=C.ko[ri];if(!r.ties.every(t=>t.w!=null))continue;const W=r.ties.map(t=>t.w);
  if(ri===0){const top=euShuffle(C.rank.slice(0,8),S.season+k+'r16t'),po=euShuffle(W,S.season+k+'r16p');euKoRound(k,1,top.map((s,i)=>[po[i],s]))}
  else if(ri<4){const sh=euShuffle(W,S.season+k+'ko'+ri);const pr=[];for(let i=0;i+1<sh.length;i+=2)pr.push([sh[i],sh[i+1]]);euKoRound(k,ri+1,pr)}}}
/* 녹아웃 판정(2차전/결승 후): 합계 → 연장 → 승부차기 */
function euPost(f){if(f.md){const [a,b]=f.res.sc;if(a>b)euPay(f.h,f.eu,'w');else if(a<b)euPay(f.a,f.eu,'w');else{euPay(f.h,f.eu,'d');euPay(f.a,f.eu,'d')}return}
  const C=S.eu.comp[f.eu],t=C.ko[f.ko].ties[f.ti];if(!t||t.w!=null)return;const two=t.f.length===2;if(two&&f.leg===1)return;if(two&&!t.f[0].res)return;
  let gh,ga;if(two){const x=t.f[0].res.sc,y=t.f[1].res.sc;gh=x[1]+y[0];ga=x[0]+y[1]}else{gh=f.res.sc[0];ga=f.res.sc[1]}
  if(gh===ga){const L=cupLamT(f,teamFor(f.h),teamFor(f.a)),k2=S.season+':eu'+f.eu+f.ko+':'+f.ti;const e=[poisR(L[0]/3,hsh('h'+k2)),poisR(L[1]/3,hsh('a'+k2))];f.et=e;gh+=e[0];ga+=e[1];
    if(gh===ga){f.pk=cupPens(f);t.w=f.pk[0]>f.pk[1]?f.h:f.a}else t.w=gh>ga?t.h:t.a}else t.w=gh>ga?t.h:t.a;
  t.sl=`${CLUBS[t.h].short} ${gh}-${ga} ${CLUBS[t.a].short}`;
  const nx=['r16','qf','sf','f','win'][f.ko];euPay(t.w,f.eu,nx);
  if(f.ko===4){C.champ=t.w;const lo=t.w===t.h?t.a:t.h;CLUBS[t.w].rep=Math.min(99,(CLUBS[t.w].rep||50)+3);S.clubB=S.clubB||{};S.clubB[t.w]=Object.assign(S.clubB[t.w]||{},{rep:CLUBS[t.w].rep});
    S.euHist=(S.euHist||[]).concat([{y:S.season,k:f.eu,w:t.w,r:lo}]).slice(-90);
    S.news.unshift({d:S.date,t:`${EUC[f.eu].n} 우승: ${CLUBS[t.w].name}`,b:`결승 ${CLUBS[f.h].short} ${f.res.sc[0]}-${f.res.sc[1]} ${CLUBS[f.a].short}${f.et?` (연장 ${f.et[0]}-${f.et[1]})`:''}${f.pk?` · 승부차기 ${f.pk[0]}-${f.pk[1]}`:''}`,v:0,big:true});
    if(t.w===S.club&&!(typeof unemp==='function'&&unemp())){if(S.me){S.me.trust=Math.min(100,(S.me.trust||60)+10);S.me.titles=(S.me.titles||0)+1;S.me.rep=Math.min(99,(S.me.rep||50)+4)}inbox('board','',`${EUC[f.eu].n} 우승!`,`유럽 정상에 올랐습니다. 구단 평판 +3.`);if(typeof hlPush==='function')hlPush({key:'eu'+S.season+f.eu,pri:7,tone:'good',c:S.club,t:`${EUC[f.eu].n} 우승!`,b:t.sl})}}
  else if((t.h===S.club||t.a===S.club)&&!(typeof unemp==='function'&&unemp())&&typeof hlPush==='function'){const ok=t.w===S.club;hlPush({key:'euk'+S.season+f.eu+f.ko,pri:ok?3:3,tone:ok?'good':'bad',c:ok?(t.h===S.club?t.a:t.h):t.w,t:`${EUC[f.eu].n} ${EU_RN[f.ko]} ${ok?'통과':'탈락'}`,b:`합계 ${t.sl}${f.pk?` (승부차기 ${f.pk[0]}-${f.pk[1]})`:''}`});if(ok&&S.me&&f.ko>=2)S.me.trust=Math.min(100,(S.me.trust||60)+2)}}
function euToday(){if(!S.eu||S.eu.y!==S.season)return;const mineOn=!(typeof unemp==='function'&&unemp());
  for(const f of euAll()){if(f.res||f.d>S.date)continue;if(mineOn&&f.d===S.date&&(f.h===S.club||f.a===S.club))continue;cupFast(f);euPost(f)}euProgress()}
function euDone(){if(!S.eu||S.eu.y!==S.season)return true;for(const k in S.eu.comp){const C=S.eu.comp[k];if(C.champ==null&&S.date<=addD(leagueDates(S.season)[37],16))return false}return true}
{const _ft=divFastToday;divFastToday=function(){_ft();try{euToday()}catch(e){console.error(e)}}}
{const _od=divOtherDone;divOtherDone=function(){return _od()&&euDone()}}
/* 시즌 전환: 승강 전에 지난 시즌 순위·컵 우승 기록 → 새 시즌 출전권 */
{const _ns=newSeason;newSeason=function(y,first){let R=null,cw=null;if(!first){try{R=euRankNow();cw={};if(S.cups)for(const lg in S.cups)if(S.cups[lg].champ!=null)cw[lg]=S.cups[lg].champ}catch(e){console.error(e)}}
  _ns(y,first);if(!first&&R){try{euBuildY(y,R,cw)}catch(e){console.error(e)}}}}
{const _sg=startGame;startGame=function(club){_sg(club);try{euBuildY(S.season,euRankStr(),null)}catch(e){console.error(e)}save();render()}}
{const _dl=devLoad;devLoad=function(){_dl();try{if(S&&S.fxE&&(!S.eu||S.eu.y!==S.season))euBuildY(S.season,euRankStr(),null)}catch(e){console.error(e)}}}
/* 우리 경기(엔진) 종료 후 */
{const _fi=finish;finish=function(){const fx=M&&M.fx;_fi();if(!fx||!fx.eu)return;try{euPost(fx);
  if(fx.md)feed({m:0,t:'sys',txt:`${EUC[fx.eu].n} 리그 페이즈 ${fx.md}차전 종료 · 현재 ${euTable(fx.eu).findIndex(t=>t.id===S.club)+1}위`});
  else{const t=S.eu.comp[fx.eu].ko[fx.ko].ties[fx.ti];if(fx.et)feed({m:120,t:'sys',txt:`연장전 ${fx.et[0]} : ${fx.et[1]}`});if(fx.pk)feed({m:120,t:'sys',txt:`승부차기 ${fx.pk[0]} : ${fx.pk[1]}`});
    if(t&&t.w!=null)feed({m:0,t:'sys',txt:t.w===S.club?(fx.ko===4?`${EUC[fx.eu].n} 우승!`:`다음 라운드 진출 (${t.f.length>1?'합계 ':''}${t.sl})`):`탈락 (${t.f.length>1?'합계 ':''}${t.sl})`});else if(fx.leg===1)feed({m:0,t:'sys',txt:'1차전 종료 · 2차전에서 승부'})}save()}catch(e){console.error(e)}}}
/* 표기·진행 연결 */
{const _cl=cupLabel;cupLabel=function(f){if(f.eu)return `${EUC[f.eu].n} ${f.md?`리그 페이즈 ${f.md}차전`:EU_RN[f.ko]+(f.leg?` ${f.leg}차전`:'')}`;return _cl(f)}}
{const _cm=cupMine;cupMine=function(){return _cm()||euMine()}}
{const _cn=cupNextMine;cupNextMine=function(){const a=_cn();if(typeof unemp==='function'&&unemp())return a;const b=euAll().filter(f=>!f.res&&(f.h===S.club||f.a===S.club)).sort((x,y)=>x.d<y.d?-1:1)[0];return [a,b].filter(Boolean).sort((x,y)=>x.d<y.d?-1:1)[0]||null}}
// ---- 화면: 리그 탭 '유럽대항전' ----
UI.euk=UI.euk||'';
function euView(){if(!S.eu||S.eu.y!==S.season)return '<div class="card pad">이번 시즌 유럽대항전 정보가 없습니다.</div>';const ks=Object.keys(S.eu.comp);const mine=ks.find(k=>S.eu.comp[k].teams.includes(S.club));const k=S.eu.comp[UI.euk]?UI.euk:(mine||'UCL');const C=S.eu.comp[k];
  const chips=`<div class="tabs" style="margin-bottom:8px">${ks.map(x=>`<button data-euk="${x}" aria-selected="${x===k}">${EUC[x].n}</button>`).join('')}</div>`;
  const nm=c=>esc(CLUBS[c].short);const sc=f=>f.res?`${f.res.sc[0]} : ${f.res.sc[1]}`:'vs';
  const ko=C.ko.map((r,ri)=>({r,ri})).reverse().map(({r})=>`<h2>${esc(r.nm)}</h2><div class="card list">${r.ties.map(t=>{const me=t.h===S.club||t.a===S.club;const ex=t.f.map(f=>(f.et?` 연장 ${f.et[0]}-${f.et[1]}`:'')+(f.pk?` · 승부차기 ${f.pk[0]}-${f.pk[1]}`:'')).join('');
    return `<div class="li" style="${me?'background:var(--surf2)':''}"><span class="nm"><b>${t.f.map(f=>`${nm(f.h)} ${sc(f)} ${nm(f.a)}`).join(' / ')}</b><span>${t.f.map(f=>fmtD(f.d)).join(' · ')}${ex}${t.w!=null?` → ${nm(t.w)}`:''}</span></span></div>`}).join('')}</div>`).join('');
  const tb=euTable(k);const zone=i=>i<8?'var(--good)':i<24?'var(--amber)':'var(--faint)';
  const table=`<h2>리그 페이즈</h2><div class="card"><div class="tbl-wrap"><table><thead><tr><th>#</th><th style="text-align:left">구단</th><th>경기</th><th>승</th><th>무</th><th>패</th><th>득실</th><th>승점</th></tr></thead><tbody>${tb.map((r,i)=>`<tr class="${r.id===S.club?'me':''}"><td style="border-left:3px solid ${zone(i)}">${i+1}</td><td class="t">${esc(CLUBS[r.id].name)} <span style="color:var(--muted);font-size:11px">${esc(LGN[euLgOf(r.id)]||'')}</span></td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf-r.ga>0?'+':''}${r.gf-r.ga}</td><td class="pts">${r.pts}</td></tr>`).join('')}</tbody></table></div></div>`;
  const my=C.fx.filter(f=>f.h===S.club||f.a===S.club);const myL=my.length?`<h2>우리 리그 페이즈 일정</h2><div class="card list">${my.sort((a,b)=>a.d<b.d?-1:1).map(f=>`<div class="li"><span class="nm"><b>${nm(f.h)} ${sc(f)} ${nm(f.a)}</b><span>${f.md}차전 · ${fmtD(f.d)}</span></span></div>`).join('')}</div>`:'';
  const hist=(S.euHist||[]).filter(h=>h.k===k).slice(-5).reverse();
  return chips+(C.champ!=null?`<div class="card pad" style="margin-bottom:8px">🏆 ${S.season}-${String(S.season+1).slice(2)} 우승 <b>${esc(CLUBS[C.champ].name)}</b></div>`:'')+ko+myL+table+
   (hist.length?`<h2>역대 우승</h2><div class="card list">${hist.map(h=>`<div class="li"><span class="nm"><b>${h.y}-${String(h.y+1).slice(2)} ${esc(CLUBS[h.w].name)}</b><span>준우승 ${esc(CLUBS[h.r].name)}</span></span></div>`).join('')}</div>`:'')+
   `<div class="note" style="margin-top:6px">초록 1~8위 16강 직행 · 노랑 9~24위 플레이오프 · 결승 중립 단판. 게임에 있는 13개 유럽 리그 구단만 출전(실제 형식을 단순화). 첫 시즌 출전권은 선수단 전력 순위, 다음 시즌부터 전 시즌 리그 순위·국내 컵 우승으로 결정. 우리 경기는 2D 엔진, 나머지는 빠른 계산이며 기록은 리그 기록에 넣지 않습니다.</div>`}
{const _lv=leagueView;leagueView=function(){let h=_lv();if(!S.eu)return h;
  h=h.replace('<button data-elg="CUP"',`<button data-elg="EU" aria-selected="${UI.elg==='EU'}">유럽대항전</button><button data-elg="CUP"`);
  if(UI.elg==='EU'){const i=h.indexOf('</div>');return h.slice(0,i+6)+euView()}
  if(!UI.elg&&UI.lt==='fix'){const my=euAll().filter(f=>f.h===S.club||f.a===S.club).sort((a,b)=>a.d<b.d?-1:1);if(my.length)h+=`<h2>유럽대항전 경기</h2><div class="card list">${my.map(f=>`<div class="li"><span class="nm"><b>${esc(CLUBS[f.h].short)} ${f.res?`${f.res.sc[0]} : ${f.res.sc[1]}`:'vs'} ${esc(CLUBS[f.a].short)}</b><span>${esc(cupLabel(f))} · ${fmtD(f.d)}</span></span></div>`).join('')}</div>`}
  return h}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-euk]');if(!b)return;UI.euk=b.dataset.euk;render()},true);

