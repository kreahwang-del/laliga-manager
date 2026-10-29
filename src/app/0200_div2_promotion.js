// ================= 승강제(v64): 라리가2(2부) 22팀 · 대회 단위 구조 =================
// 설계
//  · LIGA(1부)·LIGA2(2부) 구단 목록은 시즌마다 바뀜(배열 내용만 교체). S.d1·S.d2에 저장
//  · S.fixtures = 우리 팀이 속한 리그의 일정, S.fixO = 다른 리그 일정(S.myDiv: 1|2). 우리 리그는 2D 엔진, 다른 리그는 엔진에 맞춘 빠른 결과 계산
//  · v65: 2부 22팀은 EA FC27 2부 선수단 데이터(s2/seg.py, 496명). 인원 적은 구단은 시작 시 20명까지 보충. 데이터가 없으면 아래 생성 방식으로 대체. 수준: 주전 평균 66.5~73(1부 하위 구단 상위 16명 평균 73~74보다 낮게)
//  · 시즌 말: 1부 하위 3팀 강등, 2부 1·2위 자동 승격, 3~6위 플레이오프(3v6·4v5 홈앤어웨이 → 결승 홈앤어웨이, 빠른 계산) 1팀 승격
//  · 강등 시 기본 예산 1부 기준의 50%(낙하산), 승격 시 1부 기본 예산(처음 승격이면 최소 8M) · 평판 ±5 · 강등팀 82+ 선수는 이적 희망
const LIGA2=[];
/* v72: '우리 리그'(엔진) 일반화 — S.hlg = 우리 구단 나라의 1부 코드(ES·EN·DE…). LIGA/LIGA2 = 그 나라 1·2부 구단(배열 내용만 교체). 나머지 리그(스페인 포함)는 빠른 계산
   S.fxHL·S.fxHL2 = 지금 S.fixtures·S.fixO 일정이 어느 리그 것인지(시즌 전환 때 지난 시즌 순위 계산용) */
const HL2={ES:'ES2',EN:'EN2',DE:'DE2',IT:'IT2',FR:'FR2'};let PEND_HL=null;
function hl(){return (S&&S.hlg)||PEND_HL||'ES'}
function hl2(){return HL2[hl()]||null}
function baseLg(lg){return lg&&/2$/.test(lg)&&HL2[lg.slice(0,-1)]===lg?lg.slice(0,-1):lg}
function setHomeLeague(lg){const L1=CLUBS.filter(c=>c&&c.lg===lg).map(c=>c.i),l2=HL2[lg],L2=l2?CLUBS.filter(c=>c&&c.lg===l2).map(c=>c.i):[];
  LIGA.splice(0,LIGA.length,...L1);LIGA2.splice(0,LIGA2.length,...L2);if(S){S.d1=[...LIGA];S.d2=[...LIGA2]}SQC=null}
const D2_CLUBS=[['Girona FC','GIR',73.0,14,40],['RCD Mallorca','RCM',72.5,13,40],['Real Oviedo','OVI',72.0,11,36],['Real Valladolid','VLL',71.5,9,36],['UD Las Palmas','LPA',71.5,9,35],
  ['CD Leganés','LEG',71.0,8,33],['Real Zaragoza','ZAR',70.5,6,34],['Sporting Gijón','SPO',70.5,6,33],['Granada CF','GRA',70.5,7,33],['UD Almería','ALM',70.5,7,32],['Cádiz CF','CAD',70.0,6,32],
  ['SD Eibar','EIB',70.0,5,30],['SD Huesca','HUE',69.0,4,28],['Albacete','ALB',68.5,4,27],['Burgos CF','BUR',68.5,4,26],['CD Castellón','CAS',68.5,4,27],['Córdoba CF','COR',68.0,4,27],
  ['CD Mirandés','MIR',68.0,3,24],['FC Andorra','AND',67.5,4,24],['CD Tenerife','TEN',67.5,4,27],['Cultural Leonesa','CUL',67.0,3,22],['AD Ceuta','CEU',66.5,3,20]];
/* v68: 홈·원정 득점 난수 키를 앞쪽에서 달리함 — 이전엔 끝 글자만 달라 두 난수가 거의 같아져(FNV 해시) 무승부가 31~51%로 과다했음 */
const FASTM={a:.142,b:.044,h:.2,a2:.005}; // 빠른 결과: log λ = a + b·(선발 평균 능력 차) ± h(홈), 게임 안 엔진 296경기 포아송 회귀로 맞춤(b .044·홈 .2). a2 = 2부 득점 수준(실제 2부 경기당 약 2.2골)
function myDiv(){return S&&S.myDiv||1}
function divOf(c){return LIGA2.includes(c)?2:LIGA.includes(c)?1:0}
function fxOf(d){return d===myDiv()?S.fixtures:(S.fixO||[])}
function tableOf(d){const ids=d===2?LIGA2:LIGA;const t={};ids.forEach(id=>t[id]={id,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});
  fxOf(d).forEach(f=>{if(!f.res)return;const [a,b]=f.res.sc,H=t[f.h],Aw=t[f.a];if(!H||!Aw)return;H.p++;Aw.p++;H.gf+=a;H.ga+=b;Aw.gf+=b;Aw.ga+=a;
    if(a>b){H.w++;Aw.l++;H.pts+=3}else if(a<b){Aw.w++;H.l++;Aw.pts+=3}else{H.d++;Aw.d++;H.pts++;Aw.pts++}});
  return Object.values(t).sort((x,y)=>y.pts-x.pts||(y.gf-y.ga)-(x.gf-x.ga)||y.gf-x.gf)}
table=function(){return tableOf(window._vd||myDiv())};
posOf=function(c){return tableOf(divOf(c)||1).findIndex(t=>t.id===c)+1};
recOf=function(c,since){const r=[];fxOf(divOf(c)===2?2:1).forEach(f=>{if(!f.res||f.d<since||(f.h!==c&&f.a!==c))return;const [a,b]=f.res.sc,g=f.h===c?a-b:b-a;r.push(g>0?3:g===0?1:0)});return r};
{const _ps=playShare;playShare=function(p){const c=clubOf(p.id);if(c>=0&&CLUBS[c]&&(LIGA.includes(c)||LIGA2.includes(c))){const fx=fxOf(divOf(c)===2?2:1),q=S.ps[p.id]||{};const played=fx.filter(f=>f.res&&(f.h===c||f.a===c)).length;return played<3?rankShare(p):Math.min(1,(q.mins||0)/(played*90))}return _ps(p)}}
if(typeof LGN!=='undefined')LGN.ES2='라리가2';
// ---- 2부 구단·선수 생성 ----
function genDiv2(){if(S.d2&&S.d2.length)return;const y=S.season;
  if(hl()!=='ES'){const l2=hl2();const dc=l2?CLUBS.filter(c=>c&&c.lg===l2).map(c=>c.i):[];LIGA2.splice(0,LIGA2.length,...dc);S.d1=[...LIGA];S.d2=[...LIGA2];dc.forEach(c=>{if(S.aiBudget&&S.aiBudget[c]==null)S.aiBudget[c]=CLUBS[c].budget*1e6;try{squadFill(c,y)}catch(e){}});SQC=null;return}
  const dataC=CLUBS.filter(c=>c&&c.lg==='ES2').map(c=>c.i);
  if(dataC.length>=20){LIGA2.splice(0,LIGA2.length,...dataC);S.d1=[...LIGA];S.d2=[...LIGA2];dataC.forEach(c=>{if(S.aiBudget&&S.aiBudget[c]==null)S.aiBudget[c]=CLUBS[c].budget*1e6;try{squadFill(c,y)}catch(e){console.error(e)}});SQC=null;return}
  S.genC=[];
  const POS=['GK','GK','GK','CB','CB','CB','CB','FB','FB','FB','FB','DM','DM','CM','CM','CM','CM','AM','AM','W','W','W','ST','ST','ST'];
  D2_CLUBS.forEach(([name,short,tgt,bud,rep],k)=>{const i=CLUBS.length;const c={i,name,short,lg:'ES2',rev:bud*3,budget:bud,wageCap:bud*3,rep,revSrc:'게임 생성(2부)',tend:1,tm:null,gen:1};CLUBS.push(c);S.genC.push(c);
    const cnt={};POS.forEach((g,j)=>{const n=cnt[g]=(cnt[g]||0)+1;const H=x=>hsh(name+':'+j+':'+x);const age=Math.max(18,Math.min(34,Math.round(26+gauss(H('a1'),H('a2'))*4)));
      const off=n===1?1.5:n===2?-1.5:n===3?-4:-6;const ovr=Math.max(55,Math.min(84,Math.round(tgt+off+gauss(H('o1'),H('o2'))*2-(g==='GK'&&n>1?3:0))));
      const pa=Math.min(95,ovr+Math.max(0,Math.round((25-age)*1.6+H('p')*4)));
      const p=makeYouth(i,y,{g,age,ovrSet:ovr,pa,grade:'C'});delete p.youth;p.cEnd=`${y+2+Math.floor(H('ce')*3)}-06-30`;S.gen[p.id]=p;BASE[p.id]=p});
    if(S.aiBudget)S.aiBudget[i]=bud*1e6});
  LIGA2.splice(0,LIGA2.length,...S.genC.map(c=>c.i));S.d1=[...LIGA];S.d2=[...LIGA2];SQC=null}
/* v64 저장(생성 2부 구단)과 v65 데이터 2부 구단의 번호가 겹치면 생성 구단을 뒤 번호로 옮김 */
function divRemap(){if(!S.genC||!S.genC.length||S.genRemapped)return;const clash=S.genC.some(c=>CLUBS[c.i]&&CLUBS[c.i].name!==c.name);if(!clash){S.genRemapped=1;return}
  const mp={};let n=CLUBS.length;S.genC.forEach(c=>{mp[c.i]=n;c.i=n;CLUBS[n]=c;n++});const R=x=>mp[x]!==undefined?mp[x]:x;
  for(const id in S.gen){const p=S.gen[id];if(mp[p.club]!==undefined)p.club=R(p.club)}for(const id in S.ps){const q=S.ps[id];if(q&&q.club!==undefined&&mp[q.club]!==undefined)q.club=R(q.club)}
  ['d1','d2'].forEach(k=>{if(S[k])S[k]=S[k].map(R)});[S.fixtures,S.fixO,S.friendlies].forEach(fx=>(fx||[]).forEach(f=>{f.h=R(f.h);f.a=R(f.a)}));
  ['aiBudget','exp','aiTac','clubB','bRank'].forEach(k=>{const o=S[k];if(!o)return;const nw={};for(const c in o)nw[R(+c)]=o[c];S[k]=nw});
  if(mp[S.club]!==undefined)S.club=R(S.club);(S.mg||[]).forEach(m=>{if(m.c!=null&&mp[m.c]!==undefined)m.c=R(m.c)});S.genRemapped=1;
  CLUBS.forEach(c=>{if(c&&c.lg==='ES2'&&!S.d2.includes(c.i)&&!S.d1.includes(c.i))c.lg='X2'})}
function divLoad(){if(!S)return;divRemap();try{if(typeof es3Load==='function')es3Load()}catch(e){console.error(e)} /* v147: 3부 생성 구단을 먼저 복원(2부로 승격한 생성 구단이 S.d2에 있으면 아래에서 CLUBS[i] 없음 오류) */if(S.genC)S.genC.forEach(c=>{if(!CLUBS[c.i]||CLUBS[c.i].name!==c.name)CLUBS[c.i]=c});
  const H=hl(),H2=hl2();if(S.d1&&S.d1.length){LIGA.splice(0,LIGA.length,...S.d1);S.d1.forEach(i=>CLUBS[i].lg=H)}
  if(S.d2&&S.d2.length&&H2){LIGA2.splice(0,LIGA2.length,...S.d2);S.d2.forEach(i=>CLUBS[i].lg=H2)}else if(!H2)LIGA2.splice(0,LIGA2.length)
  if(S.clubB)for(const i in S.clubB)if(CLUBS[i])Object.assign(CLUBS[i],S.clubB[i]);SQC=null}
{const _dl=devLoad;devLoad=function(){_dl();divLoad()}}
// ---- 2부 일정(42라운드): 1부 주말 일정 38일 + 주중 4일, 1부보다 늦게 끝나지 않음 ----
function div2Fixtures(y){if(hl()!=='ES'){const l2=hl2();return l2?euroFixtures(l2,y).map(f=>Object.assign(f,{dv:2})):[]}const r=roundRobin([...LIGA2].sort(()=>hsh(y+'s2')-.5));const ds=leagueDates(y).slice();[8,16,24,32].forEach(k=>ds.push(addD(ds[k],3)));ds.sort();
  const out=[];r.forEach((ms,i)=>ms.forEach(([h,a])=>out.push({d:ds[Math.min(i,ds.length-1)],r:i+1,h,a,res:null,dv:2})));return out}
function divAssign(f1,f2){if(divOf(S.club)===2){S.myDiv=2;S.fixtures=f2;S.fixO=f1}else{S.myDiv=1;S.fixtures=f1;S.fixO=f2}}
function divSwapCheck(){if(!LIGA2.length||!S.fixO)return;const want=divOf(S.club)===2?2:1;if(want!==myDiv()){const a=S.fixtures;S.fixtures=S.fixO;S.fixO=a;S.myDiv=want;SQC=null}}
// ---- 빠른 결과 계산(다른 리그 경기) ----
function poisR(l,u){let k=0,p=Math.exp(-l),s=p;while(u>s&&k<10){k++;p*=l/k;s+=p}return k}
/* v68 빠른 결과 보강: ① 체력이 떨어진 선발은 실력 감소(체력 1당 능력 −0.1, 엔진의 체력 계수를 완만하게 옮김) ② 부상(엔진과 비슷한 빈도: 경기당 약 0.45건, 부상 성향 반영)
   ③ 평점(결과·득점·도움·무실점·개인 수준 + 편차, 엔진 평균 수준에 맞춤) ④ 경고(시즌 기록용). 컵 경기는 부상만(기록 제외) */
const FIT_K=.1;function effO(p){return (p.ovr||70)-(100-Math.min(100,p.fit??100))*FIT_K}
function gN(u1,u2){return Math.sqrt(-2*Math.log(Math.max(1e-9,u1)))*Math.cos(2*Math.PI*u2)}
function fastAfter(f,H,A,x,y,ev,counts){const k=(f.cup?'c'+f.cup+f.rd:'')+f.d+':'+f.h+':'+f.a;
  [[H,0,x,y],[A,1,y,x]].forEach(([T,s,gf,ga])=>{const tav=T.xi.reduce((a,p)=>a+(p.ovr||70),0)/Math.max(1,T.xi.length);
    T.xi.forEach(p=>{const q=S.ps[p.id]=S.ps[p.id]||{};const ip=.026+(p.inj||8)/20*.065;
      if(!(q.injD>0)&&hsh('inj'+p.id+k)<ip){let ri=0;q.injD=typeof injDays==='function'?injDays('a',()=>hsh('id'+p.id+k+(ri++))):(5+Math.floor(hsh('id'+p.id+k)*11));if(q.injD>=30)q.injLong=S.season;
        if(T.club===S.club&&!(typeof unemp==='function'&&unemp())){const m=typeof injMsg==='function'?injMsg(p,q.injD,''):`약 ${Math.max(1,Math.round(q.injD/7))}주 결장 예상입니다.`;if(m)inbox('부상','',`${p.name} 부상`,m)}}
      if(!counts)return;
      const g=ev.filter(e=>e.pid===p.id&&e.s===s).length,as=ev.filter(e=>e.aid===p.id&&e.s===s).length;const res=gf>ga?.35:gf<ga?-.35:0;const gd=Math.max(-3,Math.min(3,gf-ga))*.08;
      const cs=ga===0?(p.g==='GK'?.6:p.g==='CB'||p.g==='FB'?.35:p.g==='DM'?.15:0):0;const conc=(p.g==='GK'||p.g==='CB'||p.g==='FB')?-Math.max(0,ga-1)*.12:0;
      let r=FAST_R0+res+gd+g*(p.g==='ST'?.8:.9)+as*.5+cs+conc+((p.ovr||70)-tav)*.02+gN(hsh('r1'+p.id+k),hsh('r2'+p.id+k))*.35;r=Math.round(Math.max(5,Math.min(9.8,r))*10)/10;
      q.rs=(q.rs||0)+r;if(T.club===S.club)q.recentR=((q.recentR||[]).concat(r)).slice(-5);
      if(hsh('yc'+p.id+k)<(p.g==='CB'||p.g==='DM'?.2:p.g==='GK'?.03:.12)){q.ss=q.ss||{};q.ss.yc=(q.ss.yc||0)+1}})})}
const FAST_R0=6.40;
function fastMatch(f){const H=teamFor(f.h),A=teamFor(f.a);if(!H||!A){f.res={sc:[0,0],ev:[]};return}const lgM=f.cup==null&&!f.eu&&!f.po&&!f.ko&&!f.md; // v96: 컵·유럽·PO 빠른 경기는 리그 기록(출전·골·도움·평점)에 넣지 않음
  const av=t=>t.xi.reduce((s,p)=>s+effO(p),0)/Math.max(1,t.xi.length);const d=av(H)-av(A),a=f.dv===2||divOf(f.h)===2?FASTM.a2:FASTM.a;
  const lh=Math.exp(a+FASTM.b*d+FASTM.h),la=Math.exp(a-FASTM.b*d-FASTM.h),k=f.d+':'+f.h+':'+f.a;const x=poisR(lh,hsh('h'+k)),y=poisR(la,hsh('a'+k));const ev=[];
  [[H,x,0],[A,y,1]].forEach(([T,n,s])=>{const W=T.xi.map(p=>(p.g==='ST'?3:p.g==='W'||p.g==='AM'?2:p.g==='CM'?1:p.g==='GK'?0:.35)*((p.shoot||10)+(p.offball||10)));const Wa=T.xi.map(p=>p.g==='GK'?0:(p.pass||10)+(p.cross||10)*.5);
    const pick=(w,u)=>{const t=w.reduce((a,b)=>a+b,0);let v=u*t;for(let i=0;i<w.length;i++){v-=w[i];if(v<=0)return i}return w.length-1};
    for(let g=0;g<n;g++){const i=pick(W,hsh('g'+g+s+k));const sc=T.xi[i];let as=null;if(hsh('ha'+g+s+k)<.72){const w2=Wa.slice();w2[i]=0;as=T.xi[pick(w2,hsh('as'+g+s+k))]}
      ev.push({m:1+Math.floor(hsh('m'+g+s+k)*90),s,t:'goal',p:sc.name,a:as?as.name:null,pid:sc.id,aid:as?as.id:null})}
    T.xi.forEach(p=>{const q=S.ps[p.id]=S.ps[p.id]||{};if(lgM){q.apps=(q.apps||0)+1;q.starts=(q.starts||0)+1;q.mins=(q.mins||0)+90}q.played=S.date;q.fit=Math.max(30,Math.round((q.fit??100)-(p.g==='GK'?2:9)))})});
  if(lgM)ev.forEach(e=>{const q=S.ps[e.pid];if(q)q.gl=(q.gl||0)+1;if(e.aid){const qa=S.ps[e.aid];if(qa)qa.as=(qa.as||0)+1}});
  try{fastAfter(f,H,A,x,y,ev,lgM)}catch(e){console.error(e)}
  ev.sort((p,q)=>p.m-q.m);f.res={sc:[x,y],ev:[],fast:1}} /* 저장 용량: 빠른 결과 경기는 득점 기록을 선수 누적(S.ps)에만 남김 */
function divFastToday(){if(!LIGA2.length||!S.fixO)return;divSwapCheck();for(const f of S.fixO)if(f.d===S.date&&!f.res)fastMatch(f)}
function divOtherDone(){if(!LIGA2.length||!S.fixO||!S.fixO.length)return true;return S.fixO.every(f=>f.res)}
// ---- 시즌 말 승강 ----
function legs2(h,a){const f1={d:S.date,h,a,dv:2},f2={d:addD(S.date,3),h:a,a:h,dv:2};fastMatch(f1);fastMatch(f2);const gh=f1.res.sc[0]+f2.res.sc[1],ga=f1.res.sc[1]+f2.res.sc[0];
  return {w:gh>ga?h:gh<ga?a:(hsh(h+':'+a+S.season)<.5?h:a),sc:`${f1.res.sc[0]}-${f1.res.sc[1]}, ${f2.res.sc[1]}-${f2.res.sc[0]}`}}
const isB=c=>/ B$|\(B\)/.test(CLUBS[c].name);
function promoteRelegate(){const t1=tableOf(1),t2a=tableOf(2);if(t2a.length<6||!t2a.some(t=>t.p>0))return;const t2=t2a.filter(t=>!isB(t.id)); /* B팀(리저브)은 승격 불가 — 실제 규정 */
  const down=t1.slice(-3).map(t=>t.id),up=[t2[0].id,t2[1].id];const s1=legs2(t2[5].id,t2[2].id),s2=legs2(t2[4].id,t2[3].id);const fin=legs2(s2.w,s1.w);up.push(fin.w);
  const po=`플레이오프: ${CLUBS[t2[2].id].short}–${CLUBS[t2[5].id].short} ${s1.sc} · ${CLUBS[t2[3].id].short}–${CLUBS[t2[4].id].short} ${s2.sc} → 결승 ${CLUBS[s1.w].short}–${CLUBS[s2.w].short} ${fin.sc}`;
  S.clubB=S.clubB||{};
  down.forEach(c=>{const C=CLUBS[c];C.b1=C.b1??C.budget;C.budget=Math.round(C.b1*.5*10)/10;C.rep=Math.max(10,C.rep-5);C.lg='ES2';S.clubB[c]={b1:C.b1,budget:C.budget,rep:C.rep,lg:'ES2'};
    if(c!==S.club)squadOf(c).filter(p=>p.ovr>=82).forEach(p=>{if(hsh(p.id+'rel'+S.season)<.5){const buyers=LIGA.filter(b=>!down.includes(b)&&b!==S.club&&CLUBS[b].rep>=C.rep);if(buyers.length){const b=buyers[Math.floor(hsh(p.id+'rb'+S.season)*buyers.length)];completeTransfer(p.id,b,Math.round(p.val*.8),{cEnd:`${S.season+4}-06-30`})}}});
    if(c===S.club)squadOf(c).filter(p=>p.ovr>=82).forEach(p=>{const q=S.ps[p.id]=S.ps[p.id]||{};q.happy=Math.min(q.happy??65,15)})});
  up.forEach(c=>{const C=CLUBS[c];if(C.b1==null)C.b1=Math.max(8,Math.round(C.budget*2.5));C.budget=C.b1;C.rep=Math.min(95,C.rep+5);C.lg='ES';S.clubB[c]={b1:C.b1,budget:C.budget,rep:C.rep,lg:'ES'};
    if(typeof mgrOf==='function'&&S.mg&&c!==S.club&&!mgrOf(c)&&typeof newCoach==='function'){const m=newCoach(typeof reqRep==='function'?reqRep(c):30);m.c=c;m.out=false;m.since=S.date;m.free=null}});
  LIGA.splice(0,LIGA.length,...LIGA.filter(c=>!down.includes(c)),...up);LIGA2.splice(0,LIGA2.length,...LIGA2.filter(c=>!up.includes(c)),...down);S.d1=[...LIGA];S.d2=[...LIGA2];SQC=null;
  const nm=a=>a.map(c=>CLUBS[c].short).join('·');
  S.news.unshift({d:S.date,t:`승격 ${nm(up)} · 강등 ${nm(down)}`,b:po,v:0,big:true});
  S.divHist=(S.divHist||[]).concat([{y:S.season,up,down,champ2:t2a[0].id}]).slice(-30);
  if(up.includes(S.club))inbox('board','',`${CLUBS[S.club].name} 1부 승격!`,`${up.indexOf(S.club)<2?'자동 승격':'플레이오프 승리'}로 다음 시즌 라리가에서 뜁니다. ${po}`);
  if(down.includes(S.club))inbox('board','',`${CLUBS[S.club].name} 2부 강등`,`다음 시즌은 라리가2에서 뜁니다. 기본 이적 예산이 절반으로 줄고, 주축 일부가 이적을 원할 수 있습니다.`);
  if(divOf(S.club)===2&&!up.includes(S.club)&&t2.slice(2,6).some(t=>t.id===S.club))inbox('eval','',`승격 플레이오프 결과`,po)}
// 1·2부 AI 구단 최소 인원 보장(계약 만료·이적 후): 20명·골키퍼 2명 미만이면 자유계약 선수 → 부족하면 구단 수준에 맞춘 선수 생성
function squadFill(c,y){if(c===S.club)return;let sq=squadOf(c);const lvl=(()=>{const s=sq.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,16);return s.length?s.reduce((a,p)=>a+p.ovr,0)/s.length:72})();
  const need=g=>g==='GK'?2-sq.filter(p=>p.g==='GK').length:0;let k=0;
  const sign=p=>{setP(p.id,{club:c,cEnd:`${y+2}-06-30`,faS:0});SQC=null;sq=squadOf(c)};
  for(let n=need('GK');n>0;n--){const fa=squadOf(FA).filter(p=>p.g==='GK'&&p.ovr<=lvl+2).sort((a,b)=>b.ovr-a.ovr)[0];if(fa)sign(fa);else{const p=makeYouth(c,y,{g:'GK',age:24+Math.floor(hsh(c+'gk'+y+n)*8),ovrSet:Math.round(lvl-3),pa:Math.round(lvl),grade:'C'});delete p.youth;p.cEnd=`${y+2}-06-30`;sq=squadOf(c)}}
  const G2=['CB','FB','CM','W','ST','DM','AM','CB','FB','CM'];while(sq.length<20&&k<30){const g=G2[k%G2.length];k++;const fa=squadOf(FA).filter(p=>p.g===g&&p.ovr<=lvl+2&&p.ovr>=lvl-10).sort((a,b)=>b.ovr-a.ovr)[0];
    if(fa)sign(fa);else{const p=makeYouth(c,y,{g,age:22+Math.floor(hsh(c+g+y+k)*10),ovrSet:Math.round(lvl-3+hsh(c+'o'+y+k)*3),pa:Math.round(lvl+1),grade:'C'});delete p.youth;p.cEnd=`${y+2}-06-30`;SQC=null;sq=squadOf(c)}}}
{const _ns=newSeason;newSeason=function(y,first){if(!first&&(S.fxHL||'ES')==='ES'&&LIGA2.length&&S.fixO)promoteRelegate();if(!first||hl()!=='ES')setHomeLeague(hl());_ns(y,first);if(hl()!=='ES')S.fixtures=euroFixtures(hl(),y).map(f=>{delete f.lg;return f});S.fxHL=hl();S.fxHL2=hl2();if(LIGA2.length){[...LIGA,...LIGA2].forEach(c=>{try{squadFill(c,y)}catch(e){console.error(e)}});const f1=S.fixtures,f2=div2Fixtures(y);divAssign(f1,f2);LIGA2.forEach(c=>{if(S.aiBudget&&S.aiBudget[c]==null)S.aiBudget[c]=CLUBS[c].budget*1e6})}}}
{const _sg=startGame;startGame=function(club){_sg(club);genDiv2();const f1=S.myDiv===2?S.fixO:S.fixtures;divAssign(f1,div2Fixtures(S.season));if(typeof careerSeasonStart==='function'&&S.mg)careerSeasonStart();save();render()}}
{const _dy=daily;daily=function(){divSwapCheck();_dy()}}
// ---- 화면: 리그 탭에 1부/2부 전환 ----
UI.ldv=UI.ldv||0;
function withDiv(d,fn){if(!LIGA2.length||d===myDiv())return fn();const l1=[...LIGA],fx=S.fixtures,sv=S.myDiv;try{LIGA.splice(0,LIGA.length,...(d===2?LIGA2:S.d1));S.fixtures=S.fixO;S.myDiv=d;window._vd=d;return fn()}finally{LIGA.splice(0,LIGA.length,...l1);S.fixtures=fx;S.myDiv=sv;window._vd=0}}
{const _lv=leagueView;leagueView=function(){if(!LIGA2.length)return _lv();const d=UI.ldv||myDiv();const sw=`<div class="tabs" style="margin-bottom:8px"><button data-ldv="1" aria-selected="${d===1}">${esc(LGN[hl()]||hl())}</button><button data-ldv="2" aria-selected="${d===2}">${esc(LGN[hl2()]||hl2()||"")}</button></div>`;
  let h=withDiv(d,()=>_lv());const note=d===2?'<div class="note" style="margin-top:6px">1·2위 자동 승격 · 3~6위 플레이오프(1팀) · 다른 리그 경기는 빠른 결과 계산</div>':LIGA2.length?'<div class="note" style="margin-top:6px">18~20위 2부 강등</div>':'';return sw+h+note}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-ldv]');if(!b)return;UI.ldv=+b.dataset.ldv;render()},true);
