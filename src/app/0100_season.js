// ================= 시즌 =================
function newSeason(y,first){
  const r=roundRobin([...LIGA].sort(()=>hsh(y+'s')-.5)); const ds=leagueDates(y);
  S.fixtures=[];r.forEach((ms,i)=>ms.forEach(([h,a])=>S.fixtures.push({d:ds[i],r:i+1,h,a,res:null})));
  S.friendlies=[`${y}-07-18`,`${y}-07-25`,`${y}-08-01`,`${y}-08-08`].map((d,i)=>{const opp=CLUBS.filter(c=>c.lg!=='ES');return {d,h:S.club,a:opp[Math.floor(hsh(y+'f'+i+S.club)*opp.length)].i,res:null}});
  S.windows=windows(y,first);
  S.season=y;
  S.aiBudget={};CLUBS.forEach(c=>S.aiBudget[c.i]=c.budget*1e6);
  S.aiTac={};S.form5=[];
  for(const id in S.ps){const q=S.ps[id];q.apps=0;q.gl=0;q.as=0;q.rs=0;q.recentApps=[]}
}
function startGame(club){
  SQC=null;S={v:3,club,date:SEASON_START,season:2026,tac:defaultTac('4-3-3','균형'),aiTac:{},xi:null,ps:{},know:{},scouts:[],watch:[],negs:{},inbox:[],news:[],
     fin:{budget:CLUBS[club].budget*1e6,income:0,log:[],later:[]}};
  newSeason(2026,true);
  inbox('board','',`${CLUBS[club].name} 감독 부임`,`이사회 목표: ${CLUBS[club].rep>=90?'리그 우승':CLUBS[club].rep>=65?'4위 이내':CLUBS[club].rep>=45?'상위권':'잔류'}. 첫 시즌은 여름 이적시장 없이 프리시즌부터 시작합니다. 겨울 이적시장은 2027년 1월 2일에 열립니다.`);
  ensureXI(); UI.tab='home'; save(); render();
}
function nextEvent(){ // 다음 경기(친선 포함)
  const f=S.fixtures.find(x=>!x.res);const fr=S.friendlies.find(x=>!x.res);
  const c=[f,fr].filter(Boolean).sort((a,b)=>a.d<b.d?-1:1);return c[0]}
function myNext(){return S.fixtures.find(x=>!x.res&&(x.h===S.club||x.a===S.club))}
function advance(){ // 다음 우리 경기일 또는 처리할 일이 생길 때까지 진행(다른 경기는 백그라운드 워커에서 병렬 시뮬레이션)
  const busy=document.createElement('div');busy.className='busy';busy.textContent='진행 중…';document.body.appendChild(busy);
  setTimeout(async()=>{try{
    let guard=0;
    while(guard++<400){
      const todays=S.fixtures.filter(x=>x.d===S.date&&!x.res), fr=S.friendlies.find(x=>x.d===S.date&&!x.res)||(typeof cupMine==='function'?cupMine():null);
      const mine=todays.find(x=>x.h===S.club||x.a===S.club)||fr;
      const others=todays.filter(x=>x!==mine);if(typeof engAllPre==='function'){const _pw=engAllPre();if(_pw){busy.textContent=typeof eaBusyTxt==='function'?eaBusyTxt():'다른 리그 경기 계산 중…';const _iv0=setInterval(()=>{try{busy.textContent=eaBusyTxt()}catch(e){}},700);try{await _pw}finally{clearInterval(_iv0)}}}if(typeof divFastToday==='function'){divFastToday();if(typeof engAllWait==='function'){const _ew=engAllWait();if(_ew){busy.textContent=typeof eaBusyTxt==='function'?eaBusyTxt():'다른 리그 경기 계산 중…';const _iv=setInterval(()=>{try{busy.textContent=eaBusyTxt()}catch(e){}},700);try{await _ew}finally{clearInterval(_iv)}}}}
      if(others.length){busy.textContent=`다른 경기 진행 중… (${others.length}경기)`;const jobs=others.map(x=>{/* v260(사용자 지적: 우리 리그 같은 날 경기를 그 자리에서 계산해 오래 걸림): 미리 계산해 둔 결과가 있으면 사용 */try{if(typeof EA!=='undefined'&&typeof eaKey==='function'){const k=eaKey(x),o=EA.pre[k];if(o&&o.H&&o.A){delete EA.pre[k];if(!o.r&&typeof simBump==='function')simBump(o.p,'');return (o.r?Promise.resolve(o.r):o.p).then(res=>({x,H:o.H,Aw:o.A,res}))}}}catch(e){}const H=teamFor(x.h),Aw=teamFor(x.a);return simAsync(H,Aw).then(res=>({x,H,Aw,res}))});
        const done=await Promise.all(jobs);done.forEach(({x,H,Aw,res})=>{applyMatch(H,Aw,res,true);x.res=pack(res)});busy.textContent='진행 중…'}
      if(mine){busy.remove();save();render();startMatch(mine);return}
      if(S.fixtures.every(x=>x.res)&&S.date>=S.fixtures[S.fixtures.length-1].d&&!S.seasonDone&&(typeof divOtherDone!=='function'||divOtherDone())){S.seasonDone=true;inbox(unemp()?'eval':'board','',`시즌 종료`,unemp()?`${CLUBS[table()[0].id].name} 우승. 7월 1일 새 시즌이 시작됩니다.`:`최종 순위 ${table().findIndex(t=>t.id===S.club)+1}위. 7월 1일 새 시즌이 시작됩니다.`);break}
      S.date=addD(S.date,1); RSEED=Math.floor(hsh(S.date+S.club)*1e9);
      if(S.date.endsWith('-07-01')&&S.seasonDone){rollover()}
      daily();
      if(S.inbox.some(m=>!m.read&&['offer','request','clause','scout','window','board','job','renew','eval','vac','press','renewreq','media','loanopt'].includes(m.type)&&m.d===S.date))break;
      const nx=nextEvent(); if(nx&&nx.d===S.date)continue;
    }
    save();render();if((S.hl||[]).length)setTimeout(hlShow,200);
  }catch(e){console.error(e)}finally{busy.remove()}},30);
}

function rollover(){ // 시즌 넘김: 성장 정산·은퇴·유망주(4단계) → 계약·새 시즌
  devSeasonEnd();
  const y=S.season+1;
  for(const id in BASE){if(clubOf(+id)===RET)continue;const p=pl(+id);if(p.cEnd<`${y}-07-01`&&clubOf(+id)!==FA){const c=clubOf(+id);
    if(c!==S.club&&(typeof aiRenewCE==='function'?aiRenewCE(p,c,y):(hsh(id+'renew'+y)<.6&&ageOf(p)<33?`${y+2}-06-30`:null))){setP(+id,{cEnd:(typeof aiRenewCE==='function'?aiRenewCE(p,c,y):`${y+2}-06-30`)})}else{setP(+id,{club:FA});if(c===S.club)inbox('contract','',`${p.name} 계약 만료`,`자유계약 선수로 팀을 떠났습니다.`)}}
    const q=S.ps[id]; if(q&&q.loanFrom!=null&&q.loanFrom!==undefined&&q.club!==q.loanFrom){q.club=q.loanFrom;q.loanFrom=null}}
  S.seasonDone=false; newSeason(y,false); S.fin.budget=Math.max(S.fin.budget,0)+CLUBS[S.club].budget*1e6; S.fin.log.unshift({d:S.date,t:'새 시즌 이적 예산 배정',v:CLUBS[S.club].budget*1e6});
}
function pack(res){return {sc:res.sc,ev:res.ev.filter(e=>e.t==='goal').map(e=>({m:e.m,s:e.s,p:e.p}))}}
function table(){const t={};LIGA.forEach(id=>t[id]={id,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});
  S.fixtures.forEach(f=>{if(!f.res)return;const [a,b]=f.res.sc,H=t[f.h],Aw=t[f.a];H.p++;Aw.p++;H.gf+=a;H.ga+=b;Aw.gf+=b;Aw.ga+=a;
    if(a>b){H.w++;Aw.l++;H.pts+=3}else if(a<b){Aw.w++;H.l++;Aw.pts+=3}else{H.d++;Aw.d++;H.pts++;Aw.pts++}});
  return Object.values(t).sort((x,y)=>y.pts-x.pts||(y.gf-y.ga)-(x.gf-x.ga)||y.gf-x.gf)}

function rnd0(v){return v==null||isNaN(v)?'-':Math.round(v)}
// v150 속도 버튼은 '지금 속도'를 표시(이전엔 다음 단계 이름이 보여, 3배속인데 '느리게'로 보였음). 고른 속도는 다음 경기에도 유지
function spdLbl(v){return v>=1?'속도: 빠르게':v<=.25?'속도: 느리게':'속도: 보통'} // v258(사용자 요청): 3단계 — 예전 보통(1)=빠르게, 예전 느리게(½)=보통, 예전 아주 느리게(¼)=느리게, 예전 빠르게(3배) 없앰
