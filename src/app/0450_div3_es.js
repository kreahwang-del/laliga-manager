// ================= 3부 리그: 프리메라 페데라시온(v138, 2군 A1 확장) =================
// 구성: RFEF 공식 발표 2026/27 프리메라 페데라시온 2개 조 × 20팀(rfef.es '아프로바도스 로스 그루포스 2026/27')
// 대회 규정(RFEF 2026/27 프리메라 페데라시온 대회 규정 7·8·9·11조):
//  · 조 1위 2팀 2부 직행, 조 2~5위 8팀 플레이오프(다른 조끼리 2위–5위·3위–4위, 홈앤어웨이 2라운드) → 2팀 추가 승격(총 4팀)
//  · 조 16~20위(조당 5팀) 4부(세군다 페데라시온) 강등
//  · B팀(필리알)은 1군과 같은 리그나 그 위에 있을 수 없음: 1군이 B팀 리그로 강등되면 B팀은 한 단계 아래로, B팀이 승격 자리에 들어도 1군 조건상 불가하면 다음 순위 팀이 승격·플레이오프
// 2부는 4팀 강등·4팀 승격(1부↔2부 기존 처리 뒤에 적용). 4부는 게임에 없어 강등 팀은 대기 명단(X3)으로 빠지고, 4부 승격 팀은 대기 명단·4부 상위권 구단 목록에서 채움
// 선수: 3부 구단은 실제 선수 데이터가 없어 구단 수준에 맞춘 가상 선수(22명). B팀은 자체 가상 유망주 14명 + 1군 구단의 2군 선수(경기마다 합류)
// 수준(상위 16명 평균, 추정): 2부 강등·전통 구단 64, 일반 62, 승격 구단 60, B팀 자체 선수 61(14명)(2부 최하위 평균 약 65)
const ES3_LGS=['ES3A','ES3B'];LGN.ES3A='1RFEF 1조';LGN.ES3B='1RFEF 2조';if(typeof LGP!=='undefined'&&LGP.ES)LGP.ES3A=LGP.ES3B=LGP.ES;if(typeof LGH!=='undefined'){LGH.ES3A=LGH.ES3B=.15}
// [이름, 약칭, 조(1·2), 등급(1 전통·강등 / 2 일반 / 3 승격·소규모 / 'B' B팀), 1군 이름]
const ES3_DATA=[['AD Mérida','MER',1,2],['Arenas Club','ARE',1,2],["Athletic Club 'B'",'ATB',1,'B','Athletic Club'],['Barakaldo CF','BAR',1,2],['CD Coria','COR',1,3],['CD Extremadura','EXT',1,2],['CD Lugo','LUG',1,1],['CD Mirandés','MIR',1,1],['CP Cacereño','CAC',1,2],['CyD Leonesa','CUL',1,1],
  ['Pontevedra CF','PON',1,2],['Racing Club Ferrol','RFE',1,1],['RC Deportivo Fabril','FAB',1,'B',null],['Real Avilés Industrial','AVI',1,2],['Real Unión Club','RUN',1,2],['SD Ponferradina','PFR',1,1],['UD Logroñés','LOG',1,2],['UD Ourense','OUR',1,2],['Unionistas de Salamanca CF','UNI',1,2],['Zamora CF','ZAM',1,2],
  ['AD Alcorcón','ALC',2,1],['Águilas FC','AGU',2,3],['Algeciras CF','ALG',2,2],['Antequera CCF','ANT',2,2],['Atlético Madrileño','ATM',2,'B','Atlético Madrid'],['CD Teruel','TER',2,2],['CE Europa','EUR',2,2],['CF Rayo Majadahonda','MAJ',2,2],['FC Cartagena','CAR',2,1],['Gimnàstic de Tarragona','NAS',2,1],
  ['Hércules de Alicante CF','HER',2,1],['Juventud de Torremolinos CF','TOR',2,3],['Real Jaén CF','JAE',2,2],['Real Madrid Castilla','RMC',2,'B','Real Madrid'],['Real Murcia CF','MUR',2,1],['Real Zaragoza','ZAR',2,1],['SD Huesca','HUE',2,1],['UD Ibiza','IBI',2,2],['UE Sant Andreu','SAN',2,2],["Villarreal CF 'B'",'VIB',2,'B','Villarreal']];
// 4부 승격 후보(실제 4부·과거 3부 구단 — 4부는 게임에 없어 근사): 대기 명단이 모자랄 때 차례로 생성
const ES3_POOL=[['Sevilla Atlético','SEA','B','Sevilla FC'],['Barça Atlètic','FCB','B','Barcelona'],['Betis Deportivo','BED','B','Real Betis'],['CA Osasuna Promesas','OSP','B','Osasuna'],['Recreativo de Huelva','REC',2],['Marbella FC','MRB',2],['Atlético Sanluqueño','SNL',3],['Gimnástica Segoviana','SEG',3],
  ['SD Tarazona','TAR',3],['Sestao River','SES',3],['CD Badajoz','BAD',2],['Linares Deportivo','LIN',3],['CF Fuenlabrada','FUE',2],['CF Talavera','TAL',3],['SD Amorebieta','AMO',2],['CD Numancia','NUM',2],['Real Valladolid Promesas','VAP','B','Real Valladolid'],['UD Melilla','MEL',3],['CD Atlético Baleares','ATB2',2],['SCR Peña Deportiva','PEN',3]];
const ES3_LV={1:64,2:62,3:60,B:61},ES3_FIN={1:[3.5,16],2:[1.5,11],3:[.8,8],B:[.5,10]};
function es3Par(nm){if(!nm)return null;const c=CLUBS.find(x=>x&&x.name===nm)||CLUBS.find(x=>x&&x.lg&&/^ES/.test(x.lg)&&x.name.startsWith(nm));return c?c.i:null}
function es3IsB(c){return CLUBS[c]&&CLUBS[c].par!=null}
// 2부의 기존 B팀(셀타 포르투나·레알 소시에다드 B)도 1군 연결
function es3LinkES2(){[['Celta Fortuna (B)','Celta'],['Real Sociedad B','Real Sociedad']].forEach(([b,p])=>{const c=CLUBS.find(x=>x&&x.name===b);const pi=CLUBS.find(x=>x&&x.lg&&/^ES/.test(x.lg)&&x.name.includes(p)&&x.name!==b&&!/\(B\)| B$/.test(x.name));if(c&&pi&&c.par==null)c.par=pi.i})}
// B팀은 자체 유망주만(1군 2군 선수가 경기마다 합류) — 구단 최소 인원 보충에서 제외
{const _sf=squadFill;squadFill=function(c){if(CLUBS[c]&&CLUBS[c].par!=null&&CLUBS[c].gen)return;return _sf.apply(this,arguments)}}
function es3MakeClub(name,short,tier,parName,lg,opt){const i=CLUBS.length,[bud,rep]=(opt&&opt.fin)||ES3_FIN[tier];const C={i,name,short,lg,rev:bud*4,budget:bud,wageCap:bud*3,rep,revSrc:'게임 생성(3부, 추정)',tend:1,tm:null,gen:1,tier,par:tier==='B'?es3Par(parName):null};CLUBS.push(C);S.genC3.push(C);
  const y=S.season,lv=(opt&&opt.lv)||ES3_LV[tier];const POS=tier==='B'?['GK','GK','CB','CB','CB','FB','FB','DM','CM','CM','AM','W','W','ST']:['GK','GK','GK','CB','CB','CB','CB','FB','FB','FB','FB','DM','DM','CM','CM','CM','AM','AM','W','W','ST','ST'];
  const cnt={};POS.forEach((g,j)=>{const n=cnt[g]=(cnt[g]||0)+1;const H=x=>hsh(name+':3:'+j+':'+x);const age=tier==='B'?18+Math.floor(H('a')*5):Math.max(18,Math.min(35,Math.round(26+gauss(H('a1'),H('a2'))*4)));
    const off=tier==='B'?0:n===1?1.5:n===2?-1.5:n===3?-4:-6;const ovr=Math.max(50,Math.min(78,Math.round(lv+off+gauss(H('o1'),H('o2'))*2-(g==='GK'&&n>1?3:0))));
    const pa=Math.min(92,ovr+Math.max(0,Math.round((25-age)*(tier==='B'?2.2:1.6)+H('p')*4)));const p=makeYouth(i,y,{g,age,ovrSet:ovr,pa,grade:'C'});delete p.youth;p.cEnd=`${y+1+Math.floor(H('ce')*3)}-06-30`;S.gen[p.id]=p;BASE[p.id]=p;
    const q=S.ps[p.id];if(q&&q.res)delete q.res});
  if(S.aiBudget)S.aiBudget[i]=bud*1e6;SQC=null;return C}
function es3Ensure(){if(!S)return;if(S.genC3&&S.genC3.length)return;S.genC3=[];S.es3Pool=[];es3LinkES2();
  ES3_DATA.forEach(([name,short,g,tier,par])=>es3MakeClub(name,short,tier,par,g===1?'ES3A':'ES3B'));SQC=null}
function es3Load(){if(!S||!S.genC3)return;for(const c of S.genC3){if(CLUBS[c.i]&&CLUBS[c.i].name!==c.name){console.error('3부 구단 번호 충돌',c.i,c.name);continue}CLUBS[c.i]=c}es3LinkES2();SQC=null}
{const _dl=devLoad;devLoad=function(){_dl.apply(this,arguments);try{es3Load()}catch(e){console.error(e)}}}
{const _fl=fastLgs;fastLgs=function(){const L=_fl.apply(this,arguments);return S&&S.genC3&&S.genC3.length?L.concat(ES3_LGS):L}}
{const _eb=euroBuild;euroBuild=function(y){try{es3Ensure()}catch(e){console.error(e)}return _eb.apply(this,arguments)}}
// ---- B팀 경기: 자체 선수 + 1군 구단 2군 선수(최근 2일 안에 뛴 선수 제외) ----
function es3BPool(c){const C=CLUBS[c];const own=squadOf(c);if(C.par==null)return own;const recent=addD(S.date,-1);
  const res=squadOf(C.par).filter(p=>(S.ps[p.id]||{}).res&&!((S.ps[p.id]||{}).played>=recent)&&!(p.injD>0));return own.concat(res)}
{const _tf=teamFor;teamFor=function(c){if(!S||c===S.club||!CLUBS[c]||CLUBS[c].par==null)return _tf.apply(this,arguments);try{const T0=S.aiTac[c]||(S.aiTac[c]=aiTacFor(c));const sq=es3BPool(c).filter(p=>!(p.injD>0));
  const xi=E3.autoPick(sq,T0.form.base).map(id=>id!=null?pl(id):null).filter(Boolean);if(xi.length<11)return _tf.apply(this,arguments);const ids=new Set(xi.map(p=>p.id));const bench=sq.filter(p=>!ids.has(p.id)).sort((a,b)=>b.ovr-a.ovr).slice(0,9);
  return {club:c,xi,bench,form:T0.form,pos:{},roles:E3.defaultRoles(xi,T0.form.base),duties:xi.map(()=>1),marks:xi.map(()=>({on:false,tight:false,t:null})),preset:T0.preset,ti:[...T0.ti],fam:T0.fam,ment:'균형',_aiMark:true,sp:aiSP(T0.preset,xi)}}catch(e){console.error(e);return _tf.apply(this,arguments)}}}
// B팀 경기에 뛴 1군 구단 소속 선수의 출전은 1군 리그 기록이 아니라 2군 기록(rmins)으로 옮김
{const _fm=fastMatch;fastMatch=function(f){const bs=[f.h,f.a].filter(c=>CLUBS[c]&&CLUBS[c].par!=null);if(!bs.length)return _fm.apply(this,arguments);
  const snap={};bs.forEach(c=>squadOf(CLUBS[c].par).forEach(p=>{const q=S.ps[p.id];if(q&&q.res)snap[p.id]={m:q.mins||0,a:q.apps||0,s:q.starts||0,g:q.gl||0,as:q.as||0}}));
  const r=_fm.apply(this,arguments);try{for(const id in snap){const q=S.ps[id],o=snap[id];const dm=(q.mins||0)-o.m;if(dm>0){q.mins=o.m;q.apps=o.a;q.starts=o.s;const dg=(q.gl||0)-o.g,da=(q.as||0)-o.as;q.gl=o.g;q.as=o.as;q.rmins=(q.rmins||0)+dm;q.rapps=(q.rapps||0)+1;q.rgl=(q.rgl||0)+dg;q.ras=(q.ras||0)+da}}}catch(e){console.error(e)}return r}}
// 실제 B팀이 리그에서 뛰는 구단은 주간 가상 2군 경기에서 제외
function es3HasB(c){return CLUBS.some(C=>C&&C.par===c&&['ES2','ES3A','ES3B'].includes(C.lg))}
{const _rm=resMatchday;resMatchday=function(){const keep={};try{for(const id in S.ps){const q=S.ps[id];if(q.res){const c=clubOf(+id);if(es3HasB(c)){keep[id]=1;q.res=false}}}}catch(e){}try{return _rm.apply(this,arguments)}finally{for(const id in keep)S.ps[id].res=true}}}
// ---- 승강: 2부↔3부 ----
function es3Tbl(lg){return tableLg(lg).filter(t=>t.p>0||true)}
function es3Elig(c){const C=CLUBS[c];if(C.par==null)return true;return !!(CLUBS[C.par]&&CLUBS[C.par].lg==='ES')}
function es3Exchange(t2){if(!S.genC3||!S.genC3.length||!t2||t2.length<8)return;const msgs=[];const A=tableLg('ES3A'),B=tableLg('ES3B');if(A.length<10||B.length<10||!A.some(t=>t.p>0))return;
  // 2부 강등 4팀(v147: 우리 팀도 강등 — 3부는 맡을 수 없어 시즌 전환 직후 자동 경질)
  const down=t2.slice(-4).map(t=>t.id);if(down.includes(S.club))S.relSack={c:S.club,lg:'ES2'};
  // 3부 승격: 조 1위(자격) + 플레이오프
  const eA=A.filter(t=>es3Elig(t.id)),eB=B.filter(t=>es3Elig(t.id));const up=[eA[0].id,eB[0].id];
  const s1=legs2(eB[4].id,eA[1].id),s2=legs2(eA[3].id,eB[2].id),f1=legs2(s2.w,s1.w);const s3=legs2(eA[4].id,eB[1].id),s4=legs2(eB[3].id,eA[2].id),f2=legs2(s4.w,s3.w);up.push(f1.w,f2.w);
  const po=`PO ${CLUBS[f1.w].short}·${CLUBS[f2.w].short} 승격`;
  // 3부 강등: 조 16~20위
  const relA=A.slice(15).map(t=>t.id),relB=B.slice(15).map(t=>t.id);
  const setLg=(c,lg)=>{CLUBS[c].lg=lg;S.clubB=S.clubB||{};S.clubB[c]=Object.assign(S.clubB[c]||{},{lg,budget:CLUBS[c].budget,rep:CLUBS[c].rep})};
  // 2부에서 내려온 팀 → 조 배정(인원 적은 조), 예산 절반
  const gA=new Set(A.map(t=>t.id).filter(c=>!up.includes(c)&&!relA.includes(c))),gB=new Set(B.map(t=>t.id).filter(c=>!up.includes(c)&&!relB.includes(c)));
  down.forEach(c=>{const C=CLUBS[c];C.b2=C.b2??C.budget;C.budget=Math.round(C.budget*.5*10)/10;C.rep=Math.max(8,C.rep-4);(gA.size<=gB.size?gA:gB).add(c)});
  up.forEach(c=>{const C=CLUBS[c];C.budget=Math.max(C.budget,2);C.rep=Math.min(40,C.rep+4)});
  // 1군이 2부로 내려왔는데 B팀이 2부에 있으면 B팀은 3부로(규정 11조)
  CLUBS.forEach(C=>{if(C&&C.par!=null&&C.lg==='ES2'&&(CLUBS[C.par].lg==='ES2'||down.includes(C.par))){(gA.size<=gB.size?gA:gB).add(C.i);msgs.push(`${C.short} 1군 강등으로 3부행`)}});
  // 3부 B팀의 1군이 3부로 오면(가상 상황) B팀은 대기 명단으로
  [...gA,...gB].forEach(c=>{const C=CLUBS[c];if(C.par!=null&&down.includes(C.par)){gA.delete(c);gB.delete(c);setLg(c,'X3')}});
  // 4부에서 채우기: 대기 명단(X3, 이전 강등 팀) + 후보 목록
  const fill=(G,lg)=>{let guard=0;while(G.size<20&&guard++<60){let pool=CLUBS.filter(C=>C&&C.lg==='X3'&&!gA.has(C.i)&&!gB.has(C.i)&&!relA.includes(C.i)&&!relB.includes(C.i)&&!(C.par!=null&&!['ES','ES2'].includes(CLUBS[C.par].lg)));let c=null;
      if(pool.length&&hsh(S.season+lg+G.size)<.6){c=pool[Math.floor(hsh(S.season+'p'+lg+G.size)*pool.length)].i}else{const row=ES3_POOL.find(r=>!CLUBS.some(C=>C&&C.name===r[0])&&(r[2]!=='B'||(()=>{const pi=es3Par(r[3]);return pi!=null&&['ES','ES2'].includes(CLUBS[pi].lg)})()));if(row){c=es3MakeClub(row[0],row[1],row[2],row[3],lg).i}else if(pool.length)c=pool[0].i}
      if(c==null)break;G.add(c)}};
  relA.concat(relB).forEach(c=>setLg(c,'X3'));fill(gA,'ES3A');fill(gB,'ES3B');gA.forEach(c=>setLg(c,'ES3A'));gB.forEach(c=>setLg(c,'ES3B'));
  up.forEach(c=>setLg(c,'ES2'));down.forEach(c=>{if(!CLUBS[c].lg.startsWith('ES3'))setLg(c,gA.has(c)?'ES3A':'ES3B')});
  SQC=null;const nm=a=>a.map(c=>CLUBS[c].short).join('·');
  S.news.unshift({d:S.date,t:`3부 승격 ${nm(up)} · 2부 강등 ${nm(down)}`,b:`${po}. 3부 강등 ${nm(relA.concat(relB))}${msgs.length?' · '+msgs.join(', '):''}`,v:0,big:true});
  return {up,down}}
// 2부 최종 순위(현재 일정 기준). 우리 리그가 스페인이면 LIGA2 일정, 아니면 빠른 리그 ES2
function es3ES2Table(){try{if(hl()==='ES'){const fx=fxOf(2);if(!fx||!fx.length)return null;const ids=new Set();fx.forEach(f=>{ids.add(f.h);ids.add(f.a)});const t={};ids.forEach(id=>t[id]={id,p:0,pts:0,gd:0,gf:0});
    fx.forEach(f=>{if(!f.res)return;const [a,b]=f.res.sc;t[f.h].p++;t[f.a].p++;t[f.h].gd+=a-b;t[f.a].gd+=b-a;t[f.h].gf+=a;t[f.a].gf+=b;if(a>b)t[f.h].pts+=3;else if(a<b)t[f.a].pts+=3;else{t[f.h].pts++;t[f.a].pts++}});
    return Object.values(t).sort((x,y)=>y.pts-x.pts||y.gd-x.gd||y.gf-x.gf)}return tableLg('ES2')}catch(e){console.error(e);return null}}
// 1부↔2부 처리 뒤에 2부↔3부. 우리 리그가 스페인이면 LIGA2·S.d2도 갱신
{const _pr=promoteRelegate;promoteRelegate=function(){const t2=es3ES2Table();const r=_pr.apply(this,arguments);try{const t2b=(t2||[]).filter(t=>!LIGA.includes(t.id));const x=es3Exchange(t2b);
  if(x){LIGA2.splice(0,LIGA2.length,...LIGA2.filter(c=>!x.down.includes(c)),...x.up);S.d2=[...LIGA2];SQC=null}}catch(e){console.error(e)}return r}}
// v147: 2부 순위는 1↔2부 승강 전에 떠 둠(이전엔 승강 뒤에 떠서 1부에서 막 내려온 팀이 0점으로 최하위 → 곧바로 3부행 되는 문제)
{const _px=proRel;proRel=function(){const snap={};try{['ES2','EN2','DE2','IT2','FR2'].forEach(lg=>{if(lg==='ES2'&&hl()==='ES')return;snap[lg]=tableLg(lg).filter(t=>t.p>0)})}catch(e){console.error(e)}
  const r=_px.apply(this,arguments);try{if(snap.ES2){const t2=snap.ES2.filter(t=>CLUBS[t.id].lg==='ES2');es3Exchange(t2)}}catch(e){console.error(e)}
  for(const lg of ['EN2','DE2','IT2','FR2']){try{if(snap[lg])x3Exchange(lg,snap[lg].filter(t=>CLUBS[t.id].lg===lg))}catch(e){console.error(e)}}return r}}
// ---- 화면: 스쿼드 2군 칸에 B팀 소속 리그·순위 ----
function es3BOf(c){return S&&S.genC3?S.genC3.find(b=>b.par===c&&CLUBS[b.i].lg!=='X3'):null}
{const _sv=squadView;squadView=function(){let h=_sv.apply(this,arguments);try{if(UI.sqv==='trn'||UI.sqv==='mgmt')return h;const b=es3BOf(S.club);if(b){const C=CLUBS[b.i];const t=fxLg(C.lg).length?tableLg(C.lg):[];const rk=t.findIndex(x=>x.id===b.i)+1;
  h=h.replace('<h2>2군 (',`<p class="note"><b>B팀 ${esc(C.name)}</b> · ${LGN[C.lg]||C.lg}${rk?` ${rk}위 (${t[rk-1].pts}점)`:''} — 2군 선수는 B팀 리그 경기에 나섭니다(최근 이틀 안에 1군에서 뛴 선수 제외).</p><h2>2군 (`)}}catch(e){console.error(e)}return h}}
// 3부 구단은 경기 엔진(우리 리그) 대상이 아니어서 감독 공석·이직 대상에서 제외
function es3Lower(c){return CLUBS[c]&&/^(ES3|X3)|3X$/.test(CLUBS[c].lg||'')}
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);try{if(S&&S.vac)S.vac=S.vac.filter(v=>!es3Lower(v.c))}catch(e){}return r}}
if(typeof moveTo==='function'){const _mt=moveTo;moveTo=function(c){if(es3Lower(c)){toast('3부 구단은 아직 맡을 수 없습니다');return}return _mt.apply(this,arguments)}}

