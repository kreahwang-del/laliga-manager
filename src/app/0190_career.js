// ================= 4-3단계: 감독 커리어 =================
// 평판·이사회 신뢰(주간 평가, 경고·최후통첩·경질)·계약·제안·지원·사임, AI 감독(실명·은퇴·신인 등장)
const NC=-9;
CLUBS[NC]={i:NC,name:'무소속',short:'—',lg:'XX',rep:0,budget:0,wageCap:0,rev:0};
const MG0=G.mgrs||[];
// 기대 승점/경기: 시즌 시작 전력 순위별(게임 엔진 자동 시즌 평균으로 보정)
const EPPG=[2.4,2.2,1.8,1.65,1.55,1.45,1.4,1.38,1.33,1.28,1.24,1.2,1.17,1.14,1.1,1.07,1.04,1.0,.96,.9];  // 전력 순위별 기대 승점/경기(엔진 자동 시즌 4회 평균으로 보정)
const reqRep=c=>Math.max(12,Math.round(CLUBS[c].rep*.9-5));
const tierOf=r=>r>=85?'세계적':r>=70?'대륙급':r>=55?'전국급':r>=40?'지역급':'무명';
const unemp=()=>S&&S.club===NC;
const mgAge=m=>+S.date.slice(0,4)-m.by;
function mgrOf(c){return S.mg?S.mg.find(m=>m.c===c&&!m.ret):null}
function posOf(c){return table().findIndex(t=>t.id===c)+1}
function recOf(c,since){const r=[];S.fixtures.forEach(f=>{if(!f.res||f.d<since||(f.h!==c&&f.a!==c))return;const [a,b]=f.res.sc,g=f.h===c?a-b:b-a;r.push(g>0?3:g===0?1:0)});return r}
function tgtOf(ep,c){if(ep===1)return [1,'리그 우승'];if(ep===2&&CLUBS[c].rep>=85)return [2,'우승 경쟁(2위 이내)'];if(ep<=4)return [4,'챔피언스리그 진출(4위 이내)'];if(ep<=7)return [7,'유럽대항전 진출(7위 이내)'];if(ep<=12)return [12,'중위권(12위 이내)'];return [17,'잔류(17위 이내)']}
function careerSeasonStart(){if(!S.mg)return;
  const st=LIGA.map(c=>{const s=squadOf(c).sort((a,b)=>b.ovr-a.ovr).slice(0,16);return [c,s.reduce((a,p)=>a+p.ovr,0)/Math.max(1,s.length)]}).sort((a,b)=>b[1]-a[1]);
  S.exp={};st.forEach(([c],i)=>{const [tp,lb]=tgtOf(i+1,c);S.exp[c]={ep:i+1,tp,lb}});
  if(typeof LIGA2!=='undefined'&&LIGA2.length){LIGA2.map(c=>{const s=squadOf(c).sort((a,b)=>b.ovr-a.ovr).slice(0,16);return [c,s.reduce((a,p)=>a+p.ovr,0)/Math.max(1,s.length)]}).sort((a,b)=>b[1]-a[1]).forEach(([c],i)=>{const ep=i+1;const [tp,lb]=ep<=2?[2,'자동 승격(2위 이내)']:ep<=6?[6,'승격 플레이오프(6위 이내)']:ep<=12?[12,'중위권(12위 이내)']:[18,'잔류권 유지(18위 이내)'];S.exp[c]={ep,tp,lb,dv:2}})}
  if(unemp())S.friendlies=[];
}
function newCoach(req){const nat=rnd()<.8?'ESP':['ARG','POR','ITA','URU'][Math.floor(rnd()*4)],NP=NAMES[nat]||NAMES.ESP;
  const m={id:S.mg.length,n:NP.f[Math.floor(rnd()*NP.f.length)]+' '+NP.l[Math.floor(rnd()*NP.l.length)],by:+S.date.slice(0,4)-(34+Math.floor(rnd()*14)),nat,rep:Math.max(12,Math.min(45,Math.round(req-6+rnd()*8))),
    form:['4-2-3-1','4-3-3','4-4-2','4-1-4-1','3-5-2'][Math.floor(rnd()*5)],real:0,c:null,out:false,free:S.date,hist:[],trust:70,warn:0};S.mg.push(m);return m}
function careerInit(mode,name,club){
  S.mg=MG0.map((m,i)=>({id:i,n:m.n,by:m.by,nat:m.nat,rep:m.rep,form:m.form,real:1,c:null,out:true,free:null,hist:[],trust:65,warn:0}));
  LIGA.forEach(c=>{const k=MG0.findIndex(x=>x.club===CLUBS[c].name);if(k>=0){const m=S.mg[k];m.c=c;m.out=false;m.since='2026-07-01'}});
  S.mg.forEach((m,i)=>{if(m.c==null&&MG0[i].club==null){}});
  const inc=mgrOf(club);if(inc){inc.c=null;inc.out=false;inc.free=S.date}
  const rep=mode==='challenge'?22:Math.max(30,reqRep(club));
  S.me={name:(name||'').trim()||'감독',mode,rep,since:S.date,start:S.date,trust:70,warn:0,cEnd:`${2026+(mode==='challenge'?2:3)}-06-30`,hist:[],titles:0,sacked:0};
  S.vac=[];S.champs=[];careerSeasonStart();
  const ex=S.exp[club];
  S.inbox=S.inbox.filter(m=>!(m.type==='board'&&/감독 부임/.test(m.title)));
  inbox('board','',`${CLUBS[club].name} 감독 부임`,`${S.me.name} 감독, 환영합니다. 이사회 목표: ${ex.lb} (전력 ${ex.ep}위). 계약 ${fmtD(S.me.cEnd)}까지. 첫 시즌은 여름 이적시장 없이 프리시즌부터 시작합니다. 겨울 이적시장은 2027년 1월 2일에 열립니다.`);
}
function careerLoad(){if(S&&!S.mg){careerInit('club','감독',S.club)}}
// ---- 이사회 평가 ----
function evalOne(c,st){const ex=S.exp&&S.exp[c];if(!ex)return;const r=recOf(c,st.since||S.start||'2026-07-01');const n=r.length;if(n<3)return;
  const ppg=r.reduce((a,b)=>a+b,0)/n,r5=r.slice(-5),p5=r5.reduce((a,b)=>a+b,0)/r5.length,e=ex.xp??EPPG[Math.min(EPPG.length-1,ex.ep-1)],pos=posOf(c);
  let s=.6*(ppg-e)*n/(n+6)+.4*(p5-e)*.7;
  if(pos>=18&&ex.tp>=17)s-=.12;if(pos>ex.tp+4)s-=.08;if(pos<=ex.tp)s+=.05;
  const big=CLUBS[c].rep>=70?1.4:1;
  const T=Math.max(0,Math.min(100,62+CK.k*s*(s<0?big:1)));
  st.trust=Math.max(0,Math.min(100,st.trust+(T-st.trust)*CK.rate));
  return n}
const CK={k:135,rate:.22,sack:14,warn1:38,warn2:24};  // k: 실제 라리가 시즌 중 경질 연 7~12건(2015~25 평균 9.7)에 맞춤
function careerWeekly(){if(!S.mg||!S.exp)return;const rd=(typeof fxOf==='function'?fxOf(1):S.fixtures).filter(f=>f.res).length/10;
  LIGA.forEach(c=>{if(c===S.club)return;const m=mgrOf(c);if(!m)return;const n=evalOne(c,m);
    if(n>=6&&m.trust<CK.sack&&rd<=35)sackAI(m,'성적 부진')});
  if(!unemp()){const n=evalOne(S.club,S.me);const t=S.me.trust,w0=S.me.warn;
    if(n>=6&&t<CK.sack&&rd<=35){sackMe('성적 부진으로 경질');return}
    const w=t<CK.warn2?2:t<CK.warn1?1:0;
    if(w>w0){inbox('board','',w===2?'이사회 최후통첩':'이사회 경고',w===2?`성적이 개선되지 않으면 경질될 수 있습니다. 신뢰도 ${Math.round(t)} · 목표 ${S.exp[S.club].lb} · 현재 ${posOf(S.club)}위`:`이사회가 최근 성적을 우려하고 있습니다. 신뢰도 ${Math.round(t)} · 목표 ${S.exp[S.club].lb} · 현재 ${posOf(S.club)}위`)}
    if(w<w0&&w===0)inbox('eval','','이사회 신뢰 회복','최근 성적으로 이사회의 우려가 해소됐습니다.');
    S.me.warn=w}
}
/* v172: 지난 시즌 리그 기록 누적 — S.fixtures는 시즌마다 새로 만들어져, 예전엔 여러 시즌 부임해도 마지막 시즌 기록만 남았음. 시즌 넘김 직전에 지휘 중인 부임(구단|부임일)별로 S.spAcc에 더해 둠 */
function recRaw(c,since){const r=recOf(c,since);return {P:r.length,W:r.filter(x=>x===3).length,D:r.filter(x=>x===1).length,L:r.filter(x=>x===0).length}}
function spellRec(c,since){const o=recRaw(c,since),a=S.spAcc&&S.spAcc[c+'|'+since];if(a){o.P+=a.P;o.W+=a.W;o.D+=a.D;o.L+=a.L}o.full=1;return o}
function spAccSnap(){const nx={},old=S.spAcc||{},all=[...LIGA,...LIGA2];
  const cnt=(c,since)=>{const o={P:0,W:0,D:0,L:0};[S.fixtures||[],S.fixO||[]].forEach(L=>L.forEach(f=>{if(!f.res||f.d<since||(f.h!==c&&f.a!==c))return;const [x,y]=f.res.sc,g=f.h===c?x-y:y-x;o.P++;g>0?o.W++:g===0?o.D++:o.L++}));return o};
  all.forEach(c=>{let since=null;if(c===S.club&&!unemp())since=S.me.since;else{const m=mgrOf(c);if(m)since=m.since}if(!since)return;const k=c+'|'+since,a=old[k]||{P:0,W:0,D:0,L:0},n=cnt(c,since);
    nx[k]={P:a.P+n.P,W:a.W+n.W,D:a.D+n.D,L:a.L+n.L}});S.spAcc=nx}
const ssOf=d=>+d.slice(0,4)-(+d.slice(5,7)<7?1:0);
function histRec(h){const multi=!h.full&&ssOf(h.from)!==ssOf(h.to);return `<span class="num" style="font-size:13px;text-align:right">${h.W}승 ${h.D}무 ${h.L}패${multi?'<br><span class="note" style="font-size:11px">마지막 시즌 리그만</span>':''}</span>`}
function sackAI(m,why){const c=m.c;m.hist.push(Object.assign({c,from:m.since,to:S.date,why},spellRec(c,m.since)));m.c=null;m.free=S.date;m.rep=Math.max(10,m.rep-3);m.trust=65;m.warn=0;
  S.news.unshift({d:S.date,t:`${CLUBS[c].name}, ${m.n} 감독 ${why==='성적 부진'?'경질':why}`,v:0,big:true,mg:1});vacate(c)}
function vacate(c){if(S.vac.some(v=>v.c===c))return;S.vac.push({c,d:S.date,fill:addD(S.date,4+Math.floor(rnd()*10)),app:false,pend:null});delete S.aiTac[c];
  if(S.me&&c!==S.club&&S.me.rep>=reqRep(c)-14)inbox('vac','',`${CLUBS[c].name} 감독직 공석`,`요구 평판 ${reqRep(c)} · 내 평판 ${S.me.rep}. 감독 탭에서 지원할 수 있습니다.`,{club:c})}
function closeMySpell(why){const c=S.club;S.me.hist.push(Object.assign({c,from:S.me.since,to:S.date,why,best:S.me.best||null},spellRec(c,S.me.since)));S.me.best=null}
function goUnemployed(why,repHit){const c=S.club;closeMySpell(why);S.aiBudget[c]=Math.max(0,S.fin.budget);S.me.rep=Math.max(10,S.me.rep-repHit);
  S.club=NC;S.xi=[];S.pre=[];S.negs={};S.friendlies=(S.friendlies||[]).filter(f=>f.res);S.fin={budget:0,income:0,log:[],later:[]};S.me.trust=60;S.me.warn=0;S.me.free=S.date;SQC=null;vacate(c);const vv=S.vac.find(x=>x.c===c);if(vv)vv.userOut=true;
  if(['squad','tac','trans'].includes(UI.tab))UI.tab='home'}
function sackMe(why){const c=S.club;S.me.sacked++;goUnemployed('경질',4);
  inbox('board','',`${CLUBS[c].name} 감독직에서 경질`,`${why}. 감독 탭에서 공석에 지원하거나 제안을 기다릴 수 있습니다. 평판 ${S.me.rep}.`)}
function moveTo(c){const old=S.club;
  if(old!==NC){closeMySpell('이직');S.aiBudget[old]=Math.max(0,S.fin.budget);vacate(old);const vv=S.vac.find(x=>x.c===old);if(vv)vv.userOut=true}
  const inc=mgrOf(c);if(inc){inc.hist.push(Object.assign({c,from:inc.since,to:S.date,why:'교체'},spellRec(c,inc.since)));inc.c=null;inc.free=S.date}
  S.club=c;S.xi=null;S.tac=defaultTac((S.tac&&S.tac.form&&S.tac.form.base)||'4-3-3','균형');S.famMap={};S.tac.fam=FAM0;S.famSnap=null;S.form5=[];S.negs={};S.pre=[];
  S.fin={budget:S.aiBudget[c]??CLUBS[c].budget*1e6,income:0,log:[],later:[]};delete S.aiTac[c];
  (S.friendlies||[]).forEach(f=>{if(!f.res)f.h=c});
  S.me.since=S.date;S.me.trust=72;S.me.warn=0;S.me.cEnd=`${+S.date.slice(0,4)+(+S.date.slice(5,7)>=6?2:1)}-06-30`;S.me.free=null;S.me.renewAsked=false;
  S.vac=S.vac.filter(v=>v.c!==c);SQC=null;ensureXI();
  const ex=S.exp[c];inbox('board','',`${CLUBS[c].name} 감독 부임`,`이사회 목표: ${ex.lb}. 계약 ${fmtD(S.me.cEnd)}까지.`)}
// ---- 공석 채우기 ----
function candScore(rep,req){return Math.min(rep,req+18)-Math.max(0,req-rep)*1.6}
function fillVacancies(){
  S.vac.forEach(v=>{if(v.pend){if(S.date>v.pend.until){const msg=S.inbox.find(x=>x.id===v.pend.mid);if(msg&&!msg.done){msg.done=true;msg.result='기한 만료'}v.pend=null;v.app=false;v.userOut=true;v.fill=S.date}else return}
    if(S.date<v.fill)return;const c=v.c,req=reqRep(c);
    const pool=[];
    S.mg.forEach(m=>{if(m.ret||m.c===c)return;
      if(m.c==null&&!m.out){if(m.rep>req+25&&daysBetween(m.free||S.date,S.date)<150)return;pool.push([m,candScore(m.rep,req)+rnd()*8])}
      else if(m.out){if(req>=35&&rnd()<.25&&m.rep>=req-4)pool.push([m,candScore(m.rep,req)+rnd()*8-3])}
      else if(m.c!=null&&m.c!==NC&&CLUBS[m.c].rep<=CLUBS[c].rep-15&&m.rep>=req-2&&rnd()<.35)pool.push([m,candScore(m.rep,req)+rnd()*8-2])});
    let me=null;if(!v.userOut&&S.me&&(v.app||(S.me.rep>=req-4&&(unemp()||CLUBS[S.club].rep<=CLUBS[c].rep-10)&&rnd()<.6)))me=candScore(S.me.rep,req)+rnd()*8+(v.app?4:0);
    pool.sort((a,b)=>b[1]-a[1]);const best=pool[0];
    if(me!=null&&(!best||me>=best[1])&&S.me.rep>=req-10){const mid=(S.mid||0)+1;
      inbox('job','',`${CLUBS[c].name} 감독직 제안`,`${CLUBS[c].name}이(가) ${S.me.name} 감독에게 지휘봉을 제안했습니다. 목표: ${(S.exp[c]&&S.exp[c].lb)||"상위권"}. 5일 안에 답해 주세요.${unemp()?'':' 수락하면 현재 구단을 떠납니다.'}`,{club:c});
      v.pend={mid,until:addD(S.date,5)};return}
    if(v.app){v.app=false;v.userOut=true;inbox('eval','',`${CLUBS[c].name} 지원 결과`,`이사회는 다른 후보를 선택했습니다. (요구 평판 ${req} · 내 평판 ${S.me.rep})`)}
    let m=best&&best[0].rep>=req-12?best[0]:null;if(!m)m=newCoach(req);
    if(m.c!=null&&m.c!==c){const oc=m.c;m.hist.push(Object.assign({c:oc,from:m.since,to:S.date,why:'이직'},spellRec(oc,m.since)));vacate(oc)}
    m.c=c;m.out=false;m.since=S.date;m.trust=70;m.warn=0;m.free=null;delete S.aiTac[c];v.done=true;
    S.news.unshift({d:S.date,t:`${CLUBS[c].name}, ${m.n} 감독 선임${m.real?'':' (신예)'}`,v:0,big:true,mg:1})});
  S.vac=S.vac.filter(v=>!v.done)}
// ---- 매일 ----
function careerDaily(){if(!S.mg)return;
  if(D(S.date).getUTCDay()===1)careerWeekly();
  fillVacancies();
  const mo=+S.date.slice(5,7);
  if(!unemp()&&S.date.endsWith('-01')&&(mo>=10||mo<=5)&&S.exp&&S.exp[S.club]){const ex=S.exp[S.club];
    inbox('eval','',`이사회 월간 평가 · 신뢰도 ${Math.round(S.me.trust)}`,`목표 ${ex.lb} · 현재 ${posOf(S.club)}위 · ${S.me.trust>=60?'만족':S.me.trust>=CK.warn1?'보통':'우려'}`)}
  if(unemp()&&S.date.endsWith('-01'))inbox('eval','',`무소속 ${Math.floor(daysBetween(S.me.free||S.date,S.date)/30)}개월째`,`평판 ${S.me.rep}(${tierOf(S.me.rep)}) · ${esc((typeof LGN!=='undefined'&&typeof hl==='function'&&LGN[hl()])||'라리가')} 공석 ${S.vac.length}곳`);
  if(!unemp()&&S.date===`${+S.me.cEnd.slice(0,4)}-02-01`&&!S.me.renewAsked){S.me.renewAsked=true;
    if(S.me.trust>=55)inbox('renew','',`이사회 재계약 제안`,`${CLUBS[S.club].name} 이사회가 2년 연장(${+S.me.cEnd.slice(0,4)+2}년 6월 30일까지)을 제안합니다.`);
    else inbox('eval','','이사회 재계약 보류',`신뢰도 ${Math.round(S.me.trust)} — 이사회는 아직 재계약 의사가 없습니다. 계약은 ${fmtD(S.me.cEnd)}에 끝납니다.`)}
}
// ---- 시즌 종료(롤오버 직전) ----
function careerSeasonEnd(){if(!S.mg||!S.exp)return;const tb=typeof tableOf==='function'?tableOf(1):table(),y=S.season;
  const champ=tb[0].id;S.champs.push({y,c:champ,m:champ===S.club?S.me.name:(mgrOf(champ)||{}).n||''});
  const upd=(st,c,T=tb)=>{const ex=S.exp[c];if(!ex)return 0;const pos=T.findIndex(t=>t.id===c)+1;st.rep=Math.max(8,Math.min(99,Math.round(st.rep+Math.max(-5,Math.min(6,(ex.ep-pos)*1))+(pos===1?4:0))));
    st.trust=Math.max(0,Math.min(100,st.trust+Math.max(-25,Math.min(15,(ex.tp-pos)*3))));return pos};
  LIGA.forEach(c=>{if(c===S.club)return;const m=mgrOf(c);if(!m)return;const pos=upd(m,c);
    if(m.trust<34)sackAI(m,'성적 부진');
    else if(mgAge(m)>=64&&rnd()<.06+.06*(mgAge(m)-64)){m.hist.push(Object.assign({c,from:m.since,to:S.date,why:'은퇴'},spellRec(c,m.since)));m.c=null;m.ret=true;S.news.unshift({d:S.date,t:`${m.n} 감독 은퇴 (${CLUBS[c].name})`,v:0,big:true,mg:1});vacate(c)}
    else if(m.rep>=60&&daysBetween(m.since,S.date)>=700&&rnd()<.08){m.hist.push(Object.assign({c,from:m.since,to:S.date,why:'해외 이적'},spellRec(c,m.since)));m.c=null;m.out=true;S.news.unshift({d:S.date,t:`${m.n} 감독, ${CLUBS[c].name} 떠나 해외 구단으로`,v:0,big:true,mg:1});vacate(c)}
    else m.trust=Math.round(50+(m.trust-50)*.5+10)});
  S.mg.forEach(m=>{if(m.c==null&&!m.ret){m.rep=Math.max(8,m.rep-1);if(mgAge(m)>=66&&rnd()<.15+.05*(mgAge(m)-66))m.ret=true}});
  if(!unemp()){const c=S.club,d2=typeof divOf==='function'&&divOf(c)===2,pos=upd(S.me,c,d2?tableOf(2):tb);if(pos===1&&!d2)S.me.titles++;S.me.best=Math.min(S.me.best||99,pos);S.me.renewAsked=false;
    if(S.me.trust<30){sackMe(`시즌 목표(${S.exp[c].lb}) 미달 · 최종 ${pos}위`)}
    else if(S.me.cEnd<`${y+1}-07-01`){goUnemployed('계약 만료',0);inbox('board','',`${CLUBS[c].name} 계약 만료`,`계약이 끝나 팀을 떠났습니다. 감독 탭에서 공석에 지원할 수 있습니다.`)}
    else{S.me.trust=Math.round(50+(S.me.trust-50)*.5+10);S.me.warn=0;inbox('eval','',`시즌 평가 · ${pos}위`,`목표 ${S.exp[c].lb} · 평판 ${S.me.rep}(${tierOf(S.me.rep)}) · 새 시즌 신뢰도 ${S.me.trust}`)}}
  else S.me.rep=Math.max(8,S.me.rep-1);
}
// ---- 훅 ----
{const _ns=newSeason;newSeason=function(y,first){_ns(y,first);if(S.mg&&!first)careerSeasonStart()}}
{const _ro=rollover;rollover=function(){careerSeasonEnd();try{spAccSnap()}catch(e){console.error(e)}_ro()}}
/* AI 구단 베테랑(33세+) 재계약: 이전엔 33세 이상은 무조건 계약 만료 → 리그 33세+ 비율 7%→1~2%로 급감.
   팀 내 능력 순위로 1년 재계약(주전 11위 안 70%, 16위 안 35%, 그 밖 5%) */
{const _roV=rollover;rollover=function(){try{const y=S.season+1;for(const id in BASE){const c=clubOf(+id);if(c<0||c===S.club)continue;const p=pl(+id);if(!p||!(p.cEnd<`${y}-07-01`)||ageOf(p)<33)continue;
  const rk=rankInClub(p),pr=rk<=11?.7:rk<=16?.35:.05;if(hsh(id+'vet'+y)<pr)setP(+id,{cEnd:`${y+1}-06-30`})}}catch(e){console.error(e)}_roV()}}
/* 이적 예산(v61): 매 시즌 기본 예산(구단 매출 기반) × 전년도 라리가 순위 배수. 이월은 1년치까지.
   근거(구조): 라리가 중계권은 균등 50%·성적 25%·관중/시청 25%, 챔스 진출 수입이 상위 구단 예산 차이를 가장 크게 만듦.
   배수: 1위 1.25, 2~4위(챔스) 1.18, 5~6위(유로파) 1.08, 7위(컨퍼런스) 1.04, 8~12위 1.0, 13~17위 0.93, 18~20위 0.8(게임에 강등이 없어 강등권 수입 감소로 대체).
   정정(v64): 원래도 newSeason이 매 시즌 기본 예산으로 재설정하고 있었음(이월 없음). v60~v63은 재설정 위에 기본 예산을 한 번 더 더해 AI 예산이 약 2배였음 → 재설정 전 잔액을 받아 '이월(최대 1년치) + 기본×순위 배수'로 정정 */
function budgetMul(rk){return rk==null?1:rk===1?1.25:rk<=4?1.18:rk<=6?1.08:rk===7?1.04:rk<=12?1:rk<=17?.93:.8}
{const _roB=rollover;rollover=function(){let rk={},prev={};try{if(S.seasonDone){table().forEach((t,i)=>rk[t.id]=i+1)}S.bRank=rk;prev=Object.assign({},S.aiBudget||{})}catch(e){console.error(e)}_roB();
  try{CLUBS.forEach(c=>{const m=budgetMul(rk[c.i]);if(c.i===S.club){const add=Math.round(c.budget*1e6*(m-1));if(add){S.fin.budget+=add;S.fin.log.unshift({d:S.date,t:`전년도 ${rk[c.i]}위 ${add>0?'성적 보너스':'수입 감소'}`,v:add})}return}
    if(S.aiBudget[c.i]===undefined)return;S.aiBudget[c.i]=Math.min(Math.max(prev[c.i]??0,0),c.budget*1e6)+c.budget*1e6*m})}catch(e){console.error(e)}}}
{const _da=daily;daily=function(){_da();careerDaily()}}
{const _sg=startGame;startGame=function(club){_sg(club);careerInit(UI.mode||'club',UI.nm,club);save();render()}}
// AI 전술: 감독이 바뀌면 감독 선호 포메이션(실제 기록)으로 새로 짬
{const _at=aiTacFor;aiTacFor=function(c){const m=mgrOf(c);const t=_at(c);if(!m)return t;
  if(m.n==='Hansi Flick')return Object.assign(defaultTac('4-3-3','티키타카'),{fam:85}); /* v60: 숙련도 누락(기본 50)으로 바르샤가 약해지던 버그 */
  if(m.n==='Diego Simeone'){const x=defaultTac('4-4-2','두 줄 수비');x.form.def='5-4-1';x.fam=85;return x}
  if(m.n==='Álvaro Arbeloa')return Object.assign(defaultTac('4-3-3','선수비 후 역습'),{fam:75});
  if(['Barcelona','Real Madrid','Atlético Madrid'].includes(CLUBS[c].name)&&!['Hansi Flick','Diego Simeone','Álvaro Arbeloa'].includes(m.n)){const x=defaultTac(m.form,t.preset);x.fam=55;return x}
  if(E3.FORMS[m.form]&&hsh('mf'+m.id+S.season)<.7){t.form.base=m.form;t.form.atk=m.form;if(!['두 줄 수비','선수비 후 역습'].includes(t.preset))t.form.def=m.form}
  if(S.me&&m.since===S.date)t.fam=45;return t}}
// ---- 화면 ----
const tbar=(v,col)=>`<div class="bar" style="height:6px;margin-top:4px"><i style="width:${Math.max(2,Math.min(100,v))}%;background:${col}"></i></div>`;
const trustCol=t=>t>=60?'var(--good)':t>=CK.warn1?'var(--amber)':'var(--bad)';
function boardCard(){if(unemp()||!S.exp||!S.exp[S.club])return '';const ex=S.exp[S.club],t=Math.round(S.me.trust),pos=S.fixtures.some(x=>x.res)?posOf(S.club):null;
  return `<section class="card pad" style="margin-top:12px"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><b>이사회 신뢰도 <span class="num" style="color:${trustCol(t)}">${t}</span></b><span class="note">${S.me.warn===2?'<b style="color:var(--bad)">최후통첩</b>':S.me.warn===1?'<b style="color:var(--amber)">경고</b>':'안정'}</span></div>${tbar(t,trustCol(t))}
   <div class="note" style="margin-top:6px">목표 ${ex.lb}${pos?` · 현재 ${pos}위`:''} · 계약 ${fmtD(S.me.cEnd)}</div></section>`}
function unempHome(){const msgs=S.inbox.slice(0,25);setTimeout(()=>{S.inbox.forEach(m=>{if(!['job','renew'].includes(m.type)||m.done)m.read=true});save()},0);
  return `<section class="card pad" style="margin-top:14px"><b>무소속</b><p class="note" style="margin-top:6px">${esc(S.me.name)} · 평판 ${S.me.rep}(${tierOf(S.me.rep)}). 공석이 생기면 제안이 오거나 감독 탭에서 지원할 수 있습니다. '계속'을 누르면 시간이 흐릅니다.</p>
    <button class="btn sm" data-tab="career" style="margin-top:8px">감독 탭 · 공석 ${S.vac.length}곳</button></section>
  <h2>받은 소식</h2><div class="card inbox">${msgs.length?msgs.map(msgHTML).join(''):'<div class="msg"><p>새 소식이 없습니다.</p></div>'}</div>
  ${S.fixtures.some(x=>x.res)?`<h2>${esc((typeof LGN!=='undefined'&&typeof hl==='function'&&LGN[hl()])||'라리가')} 순위</h2><div class="card">${tableHTML(table().slice(0,20),true)}</div>`:''}`}
{const _hv=homeView;homeView=function(){if(unemp())return unempHome();const h=_hv();const i=h.indexOf('<h2>받은 소식</h2>');return i>=0?h.slice(0,i)+boardCard()+h.slice(i):h+boardCard()}}
{const _mh=msgHTML;msgHTML=function(m){if(!['job','renew','eval','vac'].includes(m.type))return _mh(m);
  const acts=m.done?'':m.type==='job'?`<button class="btn sm" data-job="accept" data-msg="${m.id}">수락</button><button class="btn sm ghost" data-job="decline" data-msg="${m.id}">거절</button>`:m.type==='renew'?`<button class="btn sm" data-renew="1" data-msg="${m.id}">서명</button><button class="btn sm ghost" data-renew="0" data-msg="${m.id}">보류</button>`:m.type==='vac'&&S.vac.some(v=>v.c===m.club&&!v.app&&!v.userOut&&!v.pend)&&m.club!==S.club?`<button class="btn sm ghost" data-apply="${m.club}">지원</button>`:'';
  return `<div class="msg ${m.read?'':'new'}"><div class="h"><span>${fmtD(m.d)}</span><span>${{job:'감독직 제안',renew:'이사회',eval:'이사회',vac:'공석'}[m.type]}</span></div><b>${esc(m.title)}</b><p>${esc(m.body)}${m.result?` <span style="color:var(--text)">→ ${esc(m.result)}</span>`:''}</p>${acts?`<div class="acts">${acts}</div>`:''}</div>`}}
function careerView(){const me=S.me,emp=!unemp();
  const cur=emp?spellRec(S.club,me.since):null;
  const hist=[...me.hist].reverse();
  const vac=S.vac.map(v=>{const req=reqRep(v.c);return `<div class="li"><span class="nm">${crest(v.c)}<span><b>${esc(CLUBS[v.c].name)}</b><span>요구 평판 ${req} · 목표 ${S.exp[v.c]?S.exp[v.c].lb:'-'}</span></span></span>${v.c===S.club?'':v.pend?'<span class="note">제안 대기</span>':v.app?'<span class="note">지원함</span>':v.userOut?'<span class="note">탈락</span>':`<button class="btn sm ${me.rep>=req-10?'':'ghost'}" data-apply="${v.c}">지원</button>`}</div>`}).join('');
  const mgR=LIGA.map(c=>{const m=c===S.club?null:mgrOf(c);const t=m?Math.round(m.trust):null;
    return [c===S.club||(t!=null&&t<CK.warn1)||!m,`<div class="li"><span class="nm">${crest(c)}<span><b>${c===S.club?esc(me.name)+' (나)':m?esc(m.n):'<span style="color:var(--muted)">공석</span>'}</b><span>${esc(CLUBS[c].short)}${m?` · ${mgAge(m)}세 · 평판 ${m.rep}${m.real?'':' · 신예'}`:''}</span></span></span>${t!=null?`<span class="num" style="font-size:14px;color:${trustCol(t)}">${t<CK.warn2?'🔥 ':''}${t}</span>`:''}</div>`]});/* v262: 나·공석·신뢰도 경고(38 미만) 감독만 먼저, 나머지는 펼치기 */
  const mgs=foldRows('mgs',mgR.filter(x=>x[0]).map(x=>x[1]),mgR.filter(x=>!x[0]).map(x=>x[1]),`전체 감독 ${mgR.length}명 보기`);
  return `<section class="card pad" style="margin-top:14px"><div class="eyebrow">${me.mode==='challenge'?'도전 모드':'구단 선택 모드'}</div><h2 style="margin:4px 0 2px">${esc(me.name)}</h2>
    <div class="note">${emp?esc(CLUBS[S.club].name)+' 감독 · 계약 '+fmtD(me.cEnd):'무소속'} · 우승 ${me.titles}회${me.sacked?` · 경질 ${me.sacked}회`:''}</div>
    <div style="margin-top:10px"><b>평판 ${me.rep}</b> <span class="note">${tierOf(me.rep)}</span>${tbar(me.rep,'var(--c2)')}</div>
    ${emp?`<div style="margin-top:10px"><b>이사회 신뢰도 ${Math.round(me.trust)}</b> <span class="note">${me.warn===2?'최후통첩':me.warn===1?'경고':'안정'} · 목표 ${S.exp[S.club].lb}</span>${tbar(me.trust,trustCol(me.trust))}</div>
    <p class="note" style="margin-top:8px">이번 부임 리그 ${cur.P}경기 ${cur.W}승 ${cur.D}무 ${cur.L}패</p>`:''}
    <p class="note" style="margin-top:8px;line-height:1.55">신뢰도는 매주 전력 순위 기대 승점 대비 성적(누적 60% + 최근 5경기 40%)으로 움직입니다. 38 미만 경고, 24 미만 최후통첩, 14 미만(6경기 이상 지휘) 경질. 빅클럽(평판 70+)은 부진에 1.4배 민감합니다.</p>
    ${emp?`<button class="btn sm ghost" data-resign="1" style="margin-top:6px">사임</button>`:''}</section>
  <h2>${esc((typeof LGN!=='undefined'&&typeof hl==='function'&&LGN[hl()])||'라리가')} 공석 ${S.vac.length}곳</h2><div class="card list">${vac||'<div class="li"><span class="note">지금은 공석이 없습니다.</span></div>'}</div>
  <h2>경력 <span class="note" style="font-size:12px;font-weight:400">리그 승·무·패</span></h2><div class="card list">${hist.length?hist.map(h=>`<div class="li"><span class="nm">${crest(h.c)}<span><b>${esc(CLUBS[h.c].name)}</b><span>${fmtD(h.from)} ~ ${fmtD(h.to)} · ${h.why}</span></span></span>${histRec(h)}</div>`).join(''):'<div class="li"><span class="note">첫 부임 중</span></div>'}</div>
  <h2>${esc((typeof LGN!=='undefined'&&typeof hl==='function'&&LGN[hl()])||'라리가')} 감독</h2><div class="card list">${mgs}</div>
  ${S.champs.length?`<h2>역대 우승</h2><div class="card list">${[...S.champs].reverse().map(x=>`<div class="li"><span class="nm">${crest(x.c)}<span><b>${x.y}-${String(x.y+1).slice(2)} ${esc(CLUBS[x.c].name)}</b><span>${esc(x.m)}</span></span></span></div>`).join('')}</div>`:''}
  <p class="note" style="margin-top:14px;line-height:1.55">AI 감독: 2025-26 시즌 종료 시점 실제 라리가 감독과 최근 라리가 경력 감독(Transfermarkt 경기 기록). 평판은 최근 지휘 구단 수준과 같은 수준 구단 평균 대비 승점으로 산정했습니다. 나이는 공개 프로필 기준이며 일부(승격팀 감독 3명)는 추정입니다.</p>`}
function startCareerView(){const saved=loadSave();const mode=UI.mode||'club';
  const teams=LIGA.map(i=>{const sq=squadOfBase(i).sort((a,b)=>b.ovr-a.ovr).slice(0,16);return {i,avg:Math.round(sq.reduce((a,p)=>a+p.ovr,0)/sq.length),star:sq[0]}}).sort((a,b)=>b.avg-a.avg);
  const list=mode==='challenge'?teams.slice(-10):teams;
  return `<main class="wrap"><section class="hero"><div class="eyebrow">LaLiga · 2026-27</div><h1>라리가 매니저</h1>
  <p>2026년 7월 1일 프리시즌부터 시작합니다. 첫 시즌은 여름 이적시장이 없고, 2027년 1월 겨울 이적시장부터 영입·판매가 가능합니다.</p></section>
  ${saved?`<button class="btn" data-act="resume">이어하기 · ${esc(saved.me?saved.me.name+' · ':'')}${esc(CLUBS[saved.club].name)} · ${fmtD(saved.date)}</button><p class="note">새 게임을 시작하면 저장된 진행은 지워집니다.</p>`:''}
  <h2>감독 이름</h2><input id="mgname" class="inp" maxlength="16" placeholder="이름을 입력하세요" value="${esc(UI.nm||'')}" style="width:100%;padding:12px;border-radius:10px;border:1px solid var(--line);background:var(--surf);color:var(--text);font-size:16px">
  <h2>시작 방식</h2><div class="chips"><button class="chip" data-mode="club" aria-pressed="${mode==='club'}">구단 선택</button><button class="chip" data-mode="challenge" aria-pressed="${mode==='challenge'}">도전 모드</button></div>
  <p class="note" style="margin-top:6px">${mode==='club'?'원하는 구단에 바로 부임합니다. 평판은 그 구단 요구 수준에서 시작합니다.':'평판 22의 무명 감독으로 시작합니다. 전력 하위 10개 구단 중 한 곳의 제안을 골라 부임합니다.'}</p>
  <div class="pick">${list.map(t=>`<button data-new="${t.i}">${crest(t.i)}<span><b>${esc(CLUBS[t.i].name)}</b><small>${mode==='challenge'?'요구 평판 '+reqRep(t.i)+' · ':''}에이스 ${esc(t.star.name)} · 이적 예산 ${mM(CLUBS[t.i].budget)}</small></span><span class="ovr num ${ovrCls(t.avg)}">${t.avg}</span></button>`).join('')}</div>
  <p class="note" style="margin-top:18px;line-height:1.6">숫자는 상위 16명 평균 능력치. 선수 기록: FBref 기반 5대 리그 데이터(2024-25 세부, 2025-26·2026-27 기본). 시장가치·계약: Transfermarkt 기반 공개 데이터셋. 매출: 딜로이트 풋볼 머니 리그 2026(상위 구단), 나머지는 스쿼드 가치로 추정. 연봉·바이아웃은 추정치입니다.</p></main>`}
startView=startCareerView;
document.addEventListener('input',e=>{if(e.target.id==='mgname')UI.nm=e.target.value});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
  if(d.mode){UI.mode=d.mode;render();return}
  if(d.imgtog!==undefined){IMG.on=!IMG.on;try{localStorage.setItem('lm-img',IMG.on?'1':'0')}catch(e){}render();return}
  if(d.job){const m=S.inbox.find(x=>x.id===+d.msg);if(!m||m.done)return;m.done=true;m.read=true;const v=S.vac.find(x=>x.c===m.club);
    if(d.job==='accept'){m.result='수락';moveTo(m.club);UI.tab='home';save();render();toast(`${CLUBS[m.club].name} 감독 부임!`)}
    else{m.result='거절';if(v){v.pend=null;v.userOut=true;v.fill=S.date}save();render()}return}
  if(d.renew!==undefined){const m=S.inbox.find(x=>x.id===+d.msg);if(!m||m.done)return;m.done=true;m.read=true;
    if(d.renew==='1'){S.me.cEnd=`${+S.me.cEnd.slice(0,4)+2}-06-30`;m.result='서명 · '+fmtD(S.me.cEnd)+'까지'}else m.result='보류(계약 만료 시 떠남)';save();render();return}
  if(d.apply){const v=S.vac.find(x=>x.c===+d.apply);if(v){v.app=true;v.fill=v.fill<=S.date?addD(S.date,3):v.fill;save();render();toast('지원서를 냈습니다. 며칠 안에 결과가 나옵니다')}return}
  if(d.resign){sheet(`<h3>사임</h3><p class="note" style="margin:8px 0 14px">${esc(CLUBS[S.club].name)} 감독직에서 물러납니다. 평판이 2 떨어지고 무소속이 됩니다.</p><div class="act"><button class="btn" data-resignok="1">사임</button><button class="btn ghost" data-close>취소</button></div>`);return}
  if(d.resignok){closeSheet();const c=S.club;goUnemployed('사임',2);inbox('board','',`${CLUBS[c].name} 감독 사임`,'무소속이 됐습니다. 감독 탭에서 공석에 지원할 수 있습니다.');save();render();return}
});

