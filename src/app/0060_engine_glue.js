
const ENGINE_SRC=__ENGINE_SRC__;

const FORMS=E3.FORMS, LINE={GK:'GK',CB:'DF',FB:'DF',DM:'MF',CM:'MF',AM:'MF',W:'FW',ST:'FW'};
const fitOf=(p,slotKey)=>E3.fitOf(p,slotKey);
const CONDS=[{a:'↑',n:'최상',c:'var(--good)'},{a:'↗',n:'좋음',c:'#9CCB6A'},{a:'→',n:'보통',c:'var(--muted)'},{a:'↘',n:'나쁨',c:'var(--warn)'},{a:'↓',n:'최악',c:'var(--bad)'}];
const cnd=p=>CONDS[p.cond??2];
// 전술별 숙련도: (성향, 기본 대형) 조합마다 따로 쌓임. 기본 50, 최대 100. 시즌 중엔 오르기만 함: 리그 1경기에 사용 조합 +2(출전 시간 비례), 써 본 적 있는 다른 조합 +0.2
// 이적시장 마감 다음 날(여름·겨울): 핵심 14명 중 새 얼굴 비중(능력치 가중)만큼 50 초과분을 일부 깎음
const FAM0=50;const famKey=(pre,base)=>pre+'|'+base;
function famMapInit(){if(!S.famMap){S.famMap={};if(S.tac)S.famMap[famKey(S.tac.preset,S.tac.form.base)]=Math.max(FAM0,S.tac.fam||FAM0)}return S.famMap}
function famGet(pre,base){const m=famMapInit();return Math.max(FAM0,m[famKey(pre,base)]??FAM0)}
function famSync(){if(S&&S.tac)S.tac.fam=famGet(S.tac.preset,S.tac.form.base)}
const FAMCORE=14,FAMK=.8;
function famCore(){return squadOf(S.club).slice().sort((a,b)=>b.ovr-a.ovr).slice(0,FAMCORE)}
function famSnapTake(){if(S.club>=0)S.famSnap=famCore().map(p=>p.id)}
function famWindowCheck(){if(!S.windows||S.club<0)return;const w=S.windows.find(w=>addD(w.to,1)===S.date);if(!w)return;
  if(!S.famSnap){famSnapTake();return}const old=new Set(S.famSnap),core=famCore();famSnapTake();
  const tot=core.reduce((a,p)=>a+p.ovr,0)||1,nw=core.filter(p=>!old.has(p.id)),turn=Math.min(1,nw.reduce((a,p)=>a+p.ovr,0)/tot);
  const m=famMapInit();let mx=0,cur0=famGet(S.tac.preset,S.tac.form.base);
  if(turn>0)for(const x in m){const v=m[x],nv=FAM0+(v-FAM0)*(1-FAMK*turn);mx=Math.max(mx,v-nv);m[x]=nv}
  famSync();const d=Math.round(cur0-S.tac.fam);const wn=w.k==='winter'?'겨울':'여름';
  if(!nw.length)inbox('board','',`${wn} 이적시장 마감 · 전술 숙련도 유지`,`핵심 선수 변화가 없어 전술 숙련도가 그대로 유지됩니다.`);
  else inbox('board','',`${wn} 이적시장 마감 · 전술 숙련도 조정`,`핵심 ${FAMCORE}명 중 새 얼굴 ${nw.length}명(${nw.map(p=>shortName(p.name)).join(', ')}) · 비중 ${Math.round(turn*100)}%. 50 초과분이 ${Math.round(FAMK*turn*100)}% 줄었습니다. 현재 전술 ${cur0.toFixed(0)} → ${S.tac.fam.toFixed(0)}${d?` (−${d})`:''}.`)}
{const _dy=daily;daily=function(){_dy();try{famWindowCheck()}catch(e){console.error(e)}}}
/* AI 세트피스 성향: 성향별 기본값 + 롱스로 가능한 선수(힘 17+) 있으면 롱스로인 */
function aiSP(preset,xi){const sp={};if(preset==='두 줄 수비'){sp.dMark='zonal';sp.posts=1;sp.outlet=0;sp.stay=3}else if(preset==='선수비 후 역습'){sp.outlet=2;sp.stay=2}else if(preset==='측면 공략'){sp.cAtk=6;sp.cTarget='far'}else if(preset==='게겐프레싱'){sp.dMark='man';sp.stay=1;sp.cAtk=6}else if(preset==='티키타카'){sp.cType='short';sp.fkMode='short'}else if(preset==='다이렉트'){sp.cTarget='near';sp.cAtk=6}const th=xi.filter(p=>p.g!=='GK'&&(p.str||0)>=17).sort((a,b)=>(b.str||0)-(a.str||0))[0];if(th&&Math.random()<.5){sp.longThrow=true;sp.thrower=th.id}return sp}
function defaultTac(form='4-3-3',preset='균형'){return {form:{base:form,atk:form,def:form},pos:{},roles:[],duties:[],marks:[],pi:{},preset,ti:[...E3.PRESETS[preset]],fam:50,focus:null,ment:'균형',setp:{cornerL:null,cornerR:null,fk:null,pen:null}}}
function aiTacFor(c){const rep=CLUBS[c].rep,h=hsh('ai'+c+S.season);
  const name=CLUBS[c].name;
  if(name==='Barcelona')return Object.assign(defaultTac('4-3-3','티키타카'),{fam:85});
  if(name==='Real Madrid')return Object.assign(defaultTac('4-3-3','선수비 후 역습'),{fam:75});
  if(name==='Atlético Madrid'){const t=defaultTac('4-4-2','두 줄 수비');t.form.def='5-4-1';t.fam=85;return t}
  const P=rep>=80?['티키타카','게겐프레싱','균형','측면 공략']:rep>=55?['균형','측면 공략','선수비 후 역습','게겐프레싱']:['두 줄 수비','선수비 후 역습','균형','다이렉트'];
  const F=rep>=70?['4-3-3','4-2-3-1','4-3-3','3-4-3']:['4-2-3-1','4-4-2','5-4-1','4-1-4-1'];
  // 선수 구성 적합도: 60%는 가장 잘 맞는 전술(▲), 나머지는 성향 후보 중 안 맞는 전술(▼) 제외
  const sm=E3.styleMap(E3.autoPick(squadOf(c),'4-3-3').map(id=>id!=null?pl(id):null).filter(Boolean));const best=Object.keys(sm).filter(k=>sm[k]>0).sort((a,b)=>sm[b]-sm[a])[0];
  const P2=P.filter(k=>!(sm[k]<0));const preset=best&&hsh('st'+c+S.season)<.6?best:(P2.length?P2:P)[Math.floor(h*(P2.length?P2:P).length)],form=F[Math.floor(hsh('f'+c+S.season)*4)];const t=defaultTac(form,preset);
  if(preset==='두 줄 수비'||preset==='선수비 후 역습')t.form.def=rep<55?'5-4-1':'4-4-2';t.fam=60+Math.floor(h*30);return t}
function autoPick(players,form){return E3.autoPick(players,form)}
function pickW(arr,wf,r){const ws=arr.map(wf),t=ws.reduce((a,b)=>a+b,0);let x=r()*t;for(let i=0;i<arr.length;i++){x-=ws[i];if(x<=0)return arr[i]}return arr[arr.length-1]}
function ensureXI(){const sq=squadOf(S.club).filter(p=>typeof canUse!=='function'||canUse(p)),T=S.tac;
  const _bn=id=>typeof banLeft==='function'&&banLeft(id,banScope(S.club))>0;
  if(!S.xi||S.xi.length!==11||S.xi.some(id=>id==null||clubOf(id)!==S.club||(S.ps[id]&&S.ps[id].injD>0)||_bn(id))){
    const keep=(S.xi||[]).filter(id=>id!=null&&clubOf(id)===S.club&&!(S.ps[id]&&S.ps[id].injD>0)&&!_bn(id));
    const fresh=E3.autoPick(sq,T.form.base);
    // 가능한 한 기존 선발 유지: 빠진 자리만 채움
    const used=new Set(keep);S.xi=(S.xi||[]).map((id,i)=>{if(id!=null&&keep.includes(id))return id;const cand=fresh.find(x=>!used.has(x));used.add(cand);return cand});
    if(S.xi.length!==11)S.xi=fresh;
  }
  const players=S.xi.map(pl);
  if(!T.roles||T.roles.length!==11)T.roles=E3.defaultRoles(players,T.form.base);
  if(!T.duties||T.duties.length!==11)T.duties=players.map(()=>1);
  if(!T.marks||T.marks.length!==11)T.marks=players.map(()=>({on:false,tight:false,t:null}));
  // 선수가 바뀐 슬롯은 역할 재추천
  players.forEach((p,i)=>{const bk=E3.FORMS[T.form.base][i],ek=E3.effKey(T,i);const rs=E3.ROLES[ek!==bk?E3.SLOT[ek][0]:p.g]||E3.ROLES.CM;if(T.roles[i]>=rs.length)T.roles[i]=0});
  return players}
/* AI 로테이션(v62): 게임은 리그 경기만 있어 AI가 매 경기 최정예로 나섬(실제는 유럽대회·컵 일정으로 상위 팀일수록 리그 선발을 25~30% 돌림).
   팀 내 상위 14명 중 일부를 경기마다 쉬게 함: 유럽대회권(전년도 7위 안, 첫 시즌은 예산 상위 7팀) 선수당 18%, 그 외 10%, 31세+ ×1.4, 골키퍼 ×0.15. 선발 가능 인원이 부족하면 쉬지 않음 */
const ROT={eu:.18,base:.1,old:1.4,gk:.15};
function aiRotate(c,sq){try{let eu;if(S.bRank&&Object.keys(S.bRank).length)eu=(S.bRank[c]||99)<=7;else eu=LIGA.slice().sort((a,b)=>CLUBS[b].budget-CLUBS[a].budget).slice(0,7).includes(c);
  const fit=sq.filter(p=>!((S.ps[p.id]||{}).injD>0));if(fit.length<16)return sq;const top=new Set(fit.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,14).map(p=>p.id));const base=eu?ROT.eu:ROT.base;
  const rest=new Set();fit.forEach(p=>{if(!top.has(p.id))return;let pr=base*(ageOf(p)>=31?ROT.old:1)*(p.g==='GK'?ROT.gk:1);if(hsh(p.id+'rot'+S.date+c)<pr)rest.add(p.id)});
  if(fit.length-rest.size<14)return sq;return sq.filter(p=>!rest.has(p.id))}catch(e){return sq}}
function teamFor(c){const mine=c===S.club;
  const benchOf=(xi)=>squadOf(c).filter(p=>!xi.some(x=>x.id===p.id)&&!((S.ps[p.id]||{}).injD>0)&&!(p.ban>0)).sort((a,b)=>b.ovr-a.ovr).slice(0,9);
  if(mine){const players=ensureXI();const T=S.tac;return {club:c,xi:players,bench:benchOf(players),form:T.form,pos:(typeof posZMig==='function'?(posZMig(),T.pos):T.pos),posZ:T.posZ,roles:[...T.roles],duties:[...T.duties],marks:T.marks.map(m=>({...m})),preset:T.preset,ti:[...T.ti],fam:T.fam,ment:T.ment,pi:Object.assign({},T.pi||{}),slotAs:Object.assign({},T.slotAs||{}),focus:T.focus,af:T.af||null,setp:{...(T.setp||{})},sp:{...(T.sp||{})}}}
  const T=S.aiTac[c]||(S.aiTac[c]=aiTacFor(c));const sq=aiRotate(c,squadOf(c));const xi=E3.autoPick(sq,T.form.base).map(id=>id!=null?pl(id):null).filter(Boolean);
  if(xi.length<11)return null;
  const marks=xi.map(()=>({on:false,tight:false,t:null}));
  // AI 맨마킹: 상대 최고 공격수가 87+면 가장 빠른 수비수가 마크(50%)
  return {club:c,xi,bench:benchOf(xi),form:T.form,pos:{},roles:E3.defaultRoles(xi,T.form.base),duties:xi.map(()=>1),marks,preset:T.preset,ti:[...T.ti],fam:T.fam,ment:'균형',_aiMark:true,sp:aiSP(T.preset,xi)}}
function aiMarking(T,opp){if(!T._aiMark)return;const star=opp.xi.filter(p=>LINE[p.g]==='FW'||p.g==='AM').sort((a,b)=>b.ovr-a.ovr)[0];
  if(star&&star.ovr>=87&&hsh(T.club+'mk'+S.date)<.5){let bi=-1,bv=-1;T.xi.forEach((p,i)=>{if(LINE[p.g]==='DF'&&p.pace>bv){bv=p.pace;bi=i}});if(bi>=0)T.marks[bi]={on:true,tight:false,t:star.id}}}
// 더비: 엘 클라시코, 마드리드, 세비야, 바스크, 발렌시아, 바르셀로나, 갈리시아 더비(과열만 반영)
const DERBY={'RMA|BAR':'엘 클라시코','RMA|ATM':'마드리드 더비','SEV|BET':'세비야 더비','ATH|RSO':'바스크 더비','VAL|LEV':'발렌시아 더비','BAR|ESP':'바르셀로나 더비','CEL|DEP':'갈리시아 더비'};
function derbyOf(h,a){const x=CLUBS[h]&&CLUBS[h].short,y=CLUBS[a]&&CLUBS[a].short;return DERBY[x+'|'+y]||DERBY[y+'|'+x]||null}
const ENGINE=4; /* 4: 연속 시뮬레이션(22명 위치), 3: 구역 매치업(이전) */
/* AI 경기별 전략(v63): 상대가 확연히 강하면 수비적(라인 한 칸 내림), 확연히 약하면 공격적. 실제 약팀은 강팀 상대로 내려앉아 무승부를 노림.
   기준: 선발 평균 능력 차(홈 +1 보정) ≥ AIM.d. 우리 팀은 직접 정함 */
const AIM={d:3,on:0};
function aiMent(T,O,home){if(!AIM.on||!T||!O||T.club===S.club||!T._aiMark)return;const av=x=>x.xi.reduce((a,p)=>a+(p.ovr||70),0)/Math.max(1,x.xi.length);const d=av(T)-av(O)+(home?1:-1);
  if(d<=-AIM.d){T.ment='수비적';T.ti=[...T.ti];T.ti[0]=Math.max(1,T.ti[0]-1)}else if(AIM.fav&&d>=AIM.d)T.ment='공격적'}
/* v74 리그별 엔진: 엔진은 라리가 실측에 맞춰져 있음. 다른 나라 리그(우리 리그로 고른 경우)·그 나라 컵 경기는
   ① 두 팀 선수 능력치를 '그 리그 평균 → 라리가 평균'으로 같은 폭만큼 옮겨(상대 전력 차는 그대로) 리그 수준 차로 슈팅·득점이 줄거나 늘지 않게 하고
   ② 그 리그 실제 경기당 골(FBref 25-26/2025) ÷ 라리가 2.63 배를 마무리 계수에 곱함. 나라가 다른 팀끼리(유럽대항전)는 그대로(절대 전력) */
const LGGPM={ES:2.63,EN:2.64,IT:2.37,DE:3.17,FR:2.74,PT:2.59,NL:3.1,BE:2.6,TR:2.57,SC:2.68,CH:3.23,AT:2.61,DK:3.03,EN2:2.51,DE2:2.85,IT2:2.49,FR2:2.47,ES2:2.55,SA:2.89,MX:2.83,US:2.9,BR:2.46,AR:1.88,JP:2.34,CN:3.11,KR:2.46};
const ENG_K=['shoot','pass','drib','cross','tackle','posit','offball','aerial','pace','stamina','gk_save','gk_air','gk_sweep','gk_dist','str','comp','fk','pen'];
const LGM={};function lgMean(lg){const key=lg+':'+(S&&S.season);if(LGM[key])return LGM[key];const m={},n={};const ids=CLUBS.filter(c=>c&&c.lg===lg).map(c=>c.i);
  ids.forEach(c=>{squadOf(c).slice().sort((a,b)=>b.ovr-a.ovr).slice(0,16).forEach(p=>{const gk=p.g==='GK';ENG_K.forEach(k=>{if(k.startsWith('gk')!==gk&&k.startsWith('gk'))return;const v=p[k];if(typeof v!=='number')return;const kk=(gk?'g:':'f:')+k;m[kk]=(m[kk]||0)+v;n[kk]=(n[kk]||0)+1})})});
  for(const k in m)m[k]/=n[k];return LGM[key]=m}
function engLg(H,Aw){const a=CLUBS[H.club]&&CLUBS[H.club].lg,b=CLUBS[Aw.club]&&CLUBS[Aw.club].lg;if(!a||!b)return null;const ba=typeof baseLg==='function'?baseLg(a):a,bb=typeof baseLg==='function'?baseLg(b):b;if(ba!==bb)return null;return a===b?a:ba}
/* 리그별 계수: 리그마다 엔진으로 한 시즌(1회전) 돌린 경기당 골 → 실제(FBref)와의 비로 정함(라리가 기준 상대값, s2/fbref/engf.json) */
/* v234 재보정(현재 엔진 E5): 2029 세이브 리그별 150경기×3회(계수 3개) → 공통 탄력도 k=.964로 로그 회귀, 실제 FBref 경기당 골(LGGPM)에 맞춤. 이전 값(v74 엔진 기준)은 에레디비시 3.66골(실제 3.1) 등 대부분 과다 */
const ENGF2={ES:1,EN:0.88,IT:0.93,DE:1.25,FR:1.19,PT:1.23,NL:1.37,BE:1.17,TR:1.14,SC:1.34,CH:1.7,AT:1.33,DK:1.46,EN2:1.16,DE2:1.4,IT2:1.19,FR2:1.33,ES2:1.21,SA:1.28,MX:1.41,US:1.38,BR:1.05,AR:0.81,JP:0.95,CN:1.74,KR:1.18};
function engCfg(H,Aw){try{const k=engLg(H,Aw);if(!k||k==='ES')return null;const f=ENGF2[k]??((LGGPM[k]||2.63)/2.63);return f===1?null:{finK:1.25*f,finK5:1.16*f}}catch(e){return null}}
/* ① 능력치 옮기기: 경기용 복사본만 바꿈(저장 데이터 불변) */
function engShift(T,lg){if(!lg||lg==='ES'||!T||!T.xi)return T;const L=lgMean(lg),E=lgMean('ES');const sh=p=>{if(!p)return p;const q=Object.assign({},p),gk=p.g==='GK';ENG_K.forEach(k=>{const kk=(gk?'g:':'f:')+k;if(typeof q[k]==='number'&&L[kk]!=null&&E[kk]!=null)q[k]=Math.max(1,Math.min(20,q[k]+(E[kk]-L[kk])))});return q};
  return Object.assign({},T,{xi:T.xi.map(sh),bench:(T.bench||[]).map(sh)})}
function runMatch(H,Aw,hooks){aiMarking(H,Aw);aiMarking(Aw,H);aiMent(H,Aw,true);aiMent(Aw,H,false);const o={hooks,derby:!!derbyOf(H.club,Aw.club),record:!!hooks};const cf=engCfg(H,Aw);if(cf){o.cfg=cf;const lg=engLg(H,Aw);H=engShift(H,lg);Aw=engShift(Aw,lg)}return (ENGINE===4&&window.E4?E4:E3).createMatch(H,Aw,o)}
function simulate(H,Aw){const m=runMatch(H,Aw);while(!m.done)m.step();return m.finalize()}
/* 백그라운드 시뮬레이션: 웹 워커 풀(코어 수 −1, 최대 4). 실패하면 메인 스레드에서 그대로 계산 */
const SIMW={pool:[],q:new Map(),id:0,ok:false,init:false};
function simPoolInit(){if(SIMW.init)return;SIMW.init=true;try{if(typeof Worker==='undefined'||typeof ENGINE_SRC==='undefined')return;
  const src='var window=self;'+ENGINE_SRC+'\nself.onmessage=function(e){var d=e.data;try{var r=(d.eng===4?E4:E3).simulate(d.H,d.A,d.o);r.T=[{club:d.H.club,xi:[]},{club:d.A.club,xi:[]}];postMessage({id:d.id,res:r})}catch(err){postMessage({id:d.id,err:String(err&&err.stack||err)})}}';
  const url=URL.createObjectURL(new Blob([src],{type:'text/javascript'}));/* v242 작업자 최대 4 → 6(코어 수 −1, 화면·시스템용으로 1개 남김). 다른 리그 엔진(v241)으로 계산량이 커져서 */const n=Math.max(1,Math.min(6,(navigator.hardwareConcurrency||2)-1));
  for(let i=0;i<n;i++){const w=new Worker(url);w.onmessage=e=>{w._n=Math.max(0,(w._n||0)-1);const cb=SIMW.q.get(e.data.id);SIMW.q.delete(e.data.id);if(cb)cb(e.data);simPump()};w.onerror=ev=>{console.error('worker',ev.message);SIMW.ok=false;const qs=[...SIMW.q.values()];SIMW.q.clear();qs.forEach(cb=>cb({err:'worker'}))};SIMW.pool.push(w)}SIMW.ok=true}catch(e){console.error(e);SIMW.ok=false}}
/* v266 사용자 지적('계속' 뒤 "다른 리그 경기 계산 중… 남은 356경기" 대기): 작업자에 바로 보내던 방식(순서 고정)이라 오늘 꼭 필요한 경기가 며칠 뒤 미리 계산분 뒤에 줄 서는 일이 생김 → 대기열에 우선순위(경기 날짜, 급한 건 '')를 두고 작업자마다 1경기씩만 보냄. simBump로 급한 경기를 앞으로 */
SIMW.wait=[];function simPump(){if(!SIMW.ok)return;for(const w of SIMW.pool){if((w._n||0)>=1||!SIMW.wait.length)continue;let bi=0;for(let i=1;i<SIMW.wait.length;i++)if(SIMW.wait[i].pr<SIMW.wait[bi].pr)bi=i;const j=SIMW.wait.splice(bi,1)[0];j.sent=1;w._n=(w._n||0)+1;try{w.postMessage(j.msg)}catch(e){w._n--;SIMW.q.delete(j.id);j.fb()}}}
function simBump(p,pr){if(p&&p.job&&!p.job.sent&&p.job.pr>(pr||'')){p.job.pr=pr||'';simPump()}}
function simAsync(H,A,pr){simPoolInit();if(!SIMW.ok)return Promise.resolve(simulate(H,A));aiMarking(H,A);aiMarking(A,H);const id=++SIMW.id;let job;
  const p=new Promise(res=>{SIMW.q.set(id,d=>{if(d.err){console.error(d.err);res(simulate(H,A))}else res(d.res)});try{const _cf=engCfg(H,A),_lg=_cf?engLg(H,A):null;job={id,pr:pr||'',sent:0,msg:{id,eng:ENGINE,H:_cf?engShift(H,_lg):H,A:_cf?engShift(A,_lg):A,o:Object.assign({derby:!!derbyOf(H.club,A.club)},_cf?{cfg:_cf}:{})},fb:()=>res(simulate(H,A))};SIMW.wait.push(job)}catch(e){SIMW.q.delete(id);res(simulate(H,A))}});p.job=job;simPump();return p}

// 경기 후 반영: 체력·기록·부상·최근 평점
function applyMatch(H,Aw,res,counts){
  if(counts)[H,Aw].forEach((T,s)=>{try{devAfterMatch(T,res,s)}catch(_){}});
  [H,Aw].forEach((T,s)=>{const all=T.xi.concat(res.subs[s].map(x=>x.out));
    all.forEach(p=>{const q=S.ps[p.id]=S.ps[p.id]||{};const r=res.ratings[p.id];if(!r)return;const f=res.fatigue[s][p.id]||0;
      q.fit=Math.max(30,Math.round((q.fit??100)-((p.g==='GK'?2:p.g==='CB'?6:8)+f*.16)*(1-(p.stamina-10)/40)));q.played=S.date;
      q.recentR=((q.recentR||[]).concat(r.r)).slice(-5);
      if(counts){const so=res.subs[s].find(x=>x.out.id===p.id),si=res.subs[s].find(x=>x.inP.id===p.id);const mn=si?Math.max(1,90-si.m):so?so.m:90;
        q.apps=(q.apps||0)+1;q.gl=(q.gl||0)+r.g;q.as=(q.as||0)+r.a;q.rs=(q.rs||0)+r.r;q.mins=(q.mins||0)+mn;if(!si)q.starts=(q.starts||0)+1;q.shs=(q.shs||0)+(r.sh||0)}
      const ij=(res.inj||[]).find(x=>x.id===p.id&&x.s===s); // 경기 중 부상(거친 태클·비접촉) + 경기 후 가벼운 부상(추정)
      /* v161 경기 후 발견 부상 하향(.012+inj·.026 → .006+inj·.014): 우리 팀(엔진 경기) 경기 관련 부상이 경기당 약 0.63건으로 AI 빠른 경기(실측 0.39)·UEFA 기준(경기당 약 0.45건, Ekstrand 2011)보다 많았음 */if(!(q.injD>0)&&(ij||Math.random()<.006+p.inj/20*.014)){q.injD=typeof injDays==='function'?injDays(ij?'m':'k'):(ij?(7+Math.floor(Math.random()*(ij.why==='nc'?25:40))):(5+Math.floor(Math.random()*15)));if(q.injD>=30)q.injLong=S.season;if(T.club===S.club){const m=typeof injMsg==='function'?injMsg(p,q.injD,ij?'':'경기 후 통증'):`약 ${Math.max(1,Math.round(q.injD/7))}주 결장 예상입니다.`;if(m)inbox('부상','',`${p.name} 부상`,m)}}});
    if(counts&&T.club===S.club)squadOf(S.club).forEach(p=>{const q=S.ps[p.id]=S.ps[p.id]||{};const on=all.some(x=>x.id===p.id);/*v230: 부상·징계로 못 뛴 경기는 출전 기회 박탈로 집계하지 않음*/if(!on&&((q.injD>0)||(p.ban>0)||(q.ban>0)))return;q.recentApps=(q.recentApps||[]).concat(on?1:0).slice(-8)});
  });
  if(counts){const me=H.club===S.club?0:Aw.club===S.club?1:-1;if(me>=0){{const m=famMapInit();const tu=(res.tu&&res.tu[me])||{[famKey(S.tac.preset,S.tac.form.base)]:90};const tot=Object.values(tu).reduce((a,b)=>a+b,0)||1;for(const x in m)if(!tu[x])m[x]=Math.min(100,m[x]+.2);if(!S.famSnap)famSnapTake();for(const x in tu)m[x]=Math.min(100,Math.max(FAM0,m[x]??FAM0)+2*tu[x]/tot);famSync()}const d=res.sc[me]-res.sc[1-me];S.form5=((S.form5||[]).concat(d>0?'W':d<0?'L':'D')).slice(-5)}}
}
// 컨디션(0 최상 ~ 4 최악) 갱신: 매주
/* v187 컨디션 민감도: 평점 계수 14·팀 분위기 2·평균 회귀 .15 → 연승 팀은 늘 '최상'(+8%)·연패 팀은 '최악'(−8%)으로 고정(평형점 이득 ≈6.7배). 6·1·.25로 낮춤 → 3승 2패·평점 6.6 팀 ≈68(좋음), 2승 3패·평점 6.0 팀 ≈30(나쁨), 보통 팀 50 */
const CND_K=[6,1,.25];
function updateConditions(){
  const my=squadOf(S.club);const teamForm=(S.form5||[]).reduce((a,x)=>a+(x==='W'?1:x==='L'?-1:0),0);
  my.forEach(p=>{const q=S.ps[p.id]=S.ps[p.id]||{};let v=(q.cndv??50);
    const rr=q.recentR||[];const avgR=rr.length?rr.slice(-3).reduce((a,b)=>a+b,0)/Math.min(3,rr.length):6.35;
    v+= (avgR-6.35)*CND_K[0];                                 // 최근 평점 — v186: 기준 6.7 → 6.35(엔진 평점 평균 6.33, 승리 팀 6.70·패배 팀 5.98). 예전 기준이면 평균 선수가 매주 −5씩 깎여 우리 팀만 컨디션 '최악'(능력 −8%)으로 수렴
    const gap=q.played?daysBetween(q.played,S.date):30; v+= gap>21?-6:gap>10?-2:2;   // 경기 감각
    if(q.injD>0)v-=4; if(q.retFlag){v-=10;q.retFlag=false}
    v+= teamForm*CND_K[1] + ((q.happy??60)-60)*.08 + (Math.random()-.5)*8 + (50-v)*CND_K[2];   // 팀 분위기·만족도·무작위·평균 회귀
    q.cndv=Math.max(0,Math.min(100,v));
    q.cnd=v>=72?0:v>=58?1:v>=42?2:v>=28?3:4});
}
function condLabelOf(id){const q=S.ps[id]||{};return CONDS[q.cnd??2]}
/* 성향이 없는 선수(새 유망주 등): 능력치 예측식(포지션별) + 선수 ID 고정 편차 */
/* v64: 생성 선수(유스·2부·보충) 성향은 능력치 '모양'만 반영(전체 수준 제거). 수준까지 넣으면 능력 낮은 생성 선수일수록 슈팅·드리블 성향이 낮아져, 생성 선수가 늘수록 리그 슈팅·골이 줄어듦(10시즌 2.6→2.3골) */
function zShape(z){const m=z.reduce((a,b)=>a+b,0)/z.length;return z.map(v=>v-m)}
function habOf(p){const M=G.tendM&&G.tendM[p.g];if(!M)return null;const A=G.attrs.slice(0,10);const z=zShape(A.map((k,i)=>((p[k]??10)-M.mu[i])/M.sd[i]));
  const gs=k=>{const h=hsh(p.id+'hab'+k),h2=hsh(p.id+'hab2'+k);return Math.sqrt(-2*Math.log(Math.max(1e-9,h)))*Math.cos(2*Math.PI*h2)};
  return (G.tendK||[]).map(k=>{const m=M[k];let v=m.b[0];for(let i=0;i<z.length;i++)v+=m.b[i+1]*z[i];v+=gs(k)*m.e*.8;return Math.max(.35,Math.min(2.8,+Math.exp(v).toFixed(2)))})}
/* 수비 성향이 없는 선수(유스·기록 없는 선수): 포지션별 능력치 예측식 + ID 고정 편차 */
function dhOf(p){const M=G.dtM&&G.dtM[p.g];if(!M)return null;const A=G.attrs.slice(0,10);const z=zShape(A.map((k,i)=>((p[k]??10)-M.mu[i])/M.sd[i]));
  return [0,1].map(j=>{const m=M['k'+j];const h=hsh(p.id+'dh'+j),h2=hsh(p.id+'dh2'+j);let v=m.b[0];for(let i=0;i<z.length;i++)v+=m.b[i+1]*z[i];v+=Math.sqrt(-2*Math.log(Math.max(1e-9,h)))*Math.cos(2*Math.PI*h2)*m.e*.8;return Math.max(.4,Math.min(2.5,+Math.exp(v).toFixed(2)))})}
{const _pl0=pl;pl=function(id){const p=_pl0(id);if(p&&!p.hab&&p.g!=='GK'){const b=BASE[id];if(b&&!b.habC){b.habC=1;b.hab=habOf(p)}p.hab=b?b.hab:habOf(p)}if(p&&!p.dh&&p.g!=='GK'){const b=BASE[id];if(b&&!b.dhC){b.dhC=1;b.dh=dhOf(p)}p.dh=b?b.dh:dhOf(p)}return p}}
// 자동 선발 주전 보너스(v92→v95): 우리 팀만 — GK는 능력 1위 GK에 +6%(v92의 '최근 출전' 기준은 한번 후보 GK가 뛰면 그 GK가 계속 보너스를 받는 악순환), 필드는 최근 5경기 중 3경기 이상 출전 +1.5%.
// 근거: 주전 GK는 리그 출전 시간 대부분을 소화(로테이션이 드묾) → 컨디션 한두 단계 차이(±4%)로 주전 GK가 바뀌지 않게. 필드 선수는 작은 차이로 매주 바뀌는 것 방지
{const _ap=E3.autoPick;E3.autoPick=function(players,form){try{if(typeof S!=='undefined'&&S&&players&&players.length&&players.some(p=>p&&clubOf(p.id)===S.club)){const gkTop=players.filter(p=>p&&p.g==='GK'&&!((p.injD||0)>0)).sort((a,b)=>(b.ovr||0)-(a.ovr||0))[0];players=players.map(p=>{if(!p)return p;const q=S.ps[p.id]||{};const ra=(q.recentApps||[]).slice(-5);const n=ra.reduce((a,b)=>a+b,0);
  return Object.assign({},p,{_inc:p.g==='GK'?(gkTop&&p.id===gkTop.id?.06:0):(n>=3?.015:0)})})}}catch(e){}return _ap.call(this,players,form)}}
// v96 돌파 시도 선수별 보정값(vendor/tocal.json, 이름 기준) → BASE.toc
function tocApply(){if(typeof TOCAL==='undefined'||typeof BASE==='undefined')return;for(const id in BASE){const b=BASE[id];const v=TOCAL[b.name];if(v!=null&&b.g!=='GK')b.toc=v}}

