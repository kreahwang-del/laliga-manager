// QA v295: 1시즌 완주 + rollover + 저장 왕복. env: HTML, MODE(unemp|KR|MX|save), SV, POST(rollover 후 진행 일수)
const {chromium}=require('playwright');const fs=require('fs');(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];
pg.on('pageerror',e=>errs.push('PE '+e.message.slice(0,200)));pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push('CE '+m.text().slice(0,3000))});
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1200);
if(process.env.SV)await pg.evaluate(t=>{window.__SV=t},fs.readFileSync(process.env.SV,'utf8'));
const r=await pg.evaluate(async([MODE,POST])=>{const o={mode:MODE,v:typeof APPV!=='undefined'?APPV:null};
  if(MODE==='save'){S=JSON.parse(window.__SV);psUnpack(S.ps);devLoad();careerLoad();SQC=null}
  else{UI.mode='club';UI.nm='t';if(MODE==='unemp'){startGame(LIGA[0]);goUnemployed('t',0)}else{const c=CLUBS.find(c=>c&&c.lg===MODE);PEND_HL=MODE;startGame(c.i)}}
  save=()=>{};render=()=>{};S.engAll=false;o.start=S.date;o.club=CLUBS[S.club]&&CLUBS[S.club].name;o.hl=S.fxHL;
  const has=n=>typeof window[n]==='function';const SQ=has('isFor')?SQR:{};
  const LGS=[...new Set(CLUBS.filter(c=>c&&c.lg).map(c=>c.lg))];
  const fxOfLg=lg=>((S.fxE&&S.fxE[lg])||(lg===(S.fxHL||'ES')?S.fixtures:null)||[]);
  // teamFor 성능
  let t=performance.now();for(const c of CLUBS)if(c&&c.lg)teamFor(c.i);o.tf1=Math.round(performance.now()-t);
  t=performance.now();for(let k=0;k<3;k++)for(const c of CLUBS)if(c&&c.lg)teamFor(c.i);o.tf3=Math.round(performance.now()-t);
  const hold0={};if(has('forCnt'))for(const c of CLUBS)if(c&&SQ[c.lg]&&SQ[c.lg].h)hold0[c.i]=forCnt(c.i);
  const sz0={};for(const c of CLUBS)if(c&&c.lg)sz0[c.i]=squadOf(c.i).length;
  const fc={samples:0,viol:0,xiViol:0,ex:[],ntXI:0,ntSamples:0,ntEx:[]};
  const sample=()=>{if(!has('isFor'))return;for(const c of CLUBS){if(!c||!SQ[c.lg]||!SQ[c.lg].m||c.i===S.club)continue;const T=teamFor(c.i);if(!T)continue;fc.samples++;const xi=T.xi.filter(p=>p&&isFor(p,c.i)).length,bn=(T.bench||[]).filter(p=>p&&isFor(p,c.i)).length;
      if(xi+bn>SQ[c.lg].m){fc.viol++;if(fc.ex.length<4)fc.ex.push([S.date,c.short,xi,bn,SQ[c.lg].m])}if(xi>SQ[c.lg].m)fc.xiViol++;
      const na=T.xi.filter(p=>p&&pl(p.id).ntAway).length;fc.ntSamples++;if(na){fc.ntXI+=na;if(fc.ntEx.length<4)fc.ntEx.push([S.date,c.short,T.xi.filter(p=>p&&pl(p.id).ntAway).map(p=>p.name+'/'+p.nat).join(',')])}}};
  let tD=0,tF=0,tM=0,days=0,g=0;let doneD=null;const pending=[];
  const step=()=>{let a=performance.now();divFastToday();tF+=performance.now()-a;
    const mine=S.fixtures.filter(x=>x.d===S.date&&!x.res);const cm=cupMine();if(cm)mine.push(cm);a=performance.now();for(const f of mine)if(!f.res)fastMatch(f);tM+=performance.now()-a;
    if(!S.seasonDone&&S.fixtures.every(x=>x.res)&&S.date>=S.fixtures[S.fixtures.length-1].d&&divOtherDone()){S.seasonDone=true;doneD=S.date;return 'done'}
    S.date=addD(S.date,1);RSEED=Math.floor(hsh(S.date+S.club)*1e9);if(S.date.endsWith('-07-01')&&S.seasonDone){rollover();return 'roll'}
    a=performance.now();daily();tD+=performance.now()-a;days++;
    if(S.date.endsWith('-15')||(S.date>=`${S.season}-09-21`&&S.date<=`${S.season}-10-06`&&S.date.endsWith('0'))||(S.date>`${S.season+1}-01-07`&&S.date<`${S.season+1}-02-05`&&S.date.endsWith('0')))sample();return null};
  while(g++<420){const s=step();if(s==='done')break}
  o.seasonEnd=doneD;o.daysSim=days;o.dailyMsPerDay=+(tD/days).toFixed(2);o.fastTodayMsPerDay=+(tF/days).toFixed(2);o.fc=fc;
  // 리그별 집계
  o.lg={};for(const lg of LGS){const fx=fxOfLg(lg);if(!fx.length)continue;const per={};let gl=0,dr=0,n=0;fx.forEach(f=>{per[f.h]=(per[f.h]||0)+1;per[f.a]=(per[f.a]||0)+1;if(f.res){n++;gl+=f.res.sc[0]+f.res.sc[1];if(f.res.sc[0]===f.res.sc[1])dr++}});const pv=Object.values(per);
    const st=has('lfSt')?lfSt(lg):null;o.lg[lg]={teams:pv.length,gpt:Math.min(...pv)+'-'+Math.max(...pv),un:fx.length-n,n,gpg:+(gl/n).toFixed(3),dr:+(dr/n).toFixed(3),last:fx[fx.length-1].d,
      grp:st&&st.grp?st.grp.map(x=>x.length).join('+'):undefined,po:st&&st.po?st.po.length+'/'+st.po.filter(f=>f.res).length:undefined,ch:st&&st.ch?Object.keys(st.ch).join(','):undefined}}
  // 보유·인원 상한(새 위반: 시즌 시작보다 늘어난 초과)
  if(has('forCnt')){let hv=[];for(const id in hold0){const c=+id;const h=SQ[CLUBS[c].lg].h;const n1=forCnt(c);if(n1>h&&n1>hold0[id])hv.push([CLUBS[c].short,hold0[id],n1,h])}o.holdNewViol=hv.slice(0,6);o.holdNewViolN=hv.length;
    let sv=[];for(const c of CLUBS){if(!c||!c.lg)continue;const n1=squadOf(c.i).length;if(n1>30&&n1>sz0[c.i])sv.push([c.short,sz0[c.i],n1])}o.sizeNewViolN=sv.length;o.sizeEx=sv.slice(0,5)}
  o.myTitles=S.me&&S.me.titles;o.lgfCh=S.lgf?Object.fromEntries(Object.entries(S.lgf).map(([k,v])=>[k,v.ch?Object.entries(v.ch).map(([a,b])=>a+':'+CLUBS[b].short).join(' '):null])):null;
  try{UI.elg='';o.lv=leagueView().length}catch(e){o.lvErr=e.message.slice(0,150)}
  for(const L of ['MX','US','AR','KR','AT']){try{UI.elg=L;leagueView()}catch(e){o['lvErr'+L]=e.message.slice(0,150)}}UI.elg='';
  try{o.svBytesEnd=svSerialize().length}catch(e){o.svErr=e.message}
  // rollover까지
  let rolled=false;g=0;while(g++<200){const s=step();if(s==='roll'){rolled=true;break}}o.rolled=rolled;o.newSeason=S.season;
  const ec=S.euroCh&&S.euroCh[S.euroCh.length-1];o.euroChLast=ec?{y:ec.y,ch:(ec.ch||[]).filter(([l])=>['KR','MX','US','AR','AT','ES'].includes(l)).map(([l,i])=>l+':'+(CLUBS[i]&&CLUBS[i].short)).join(' ')}:null;
  o.newLgf=S.lgf?Object.fromEntries(Object.entries(S.lgf).map(([k,v])=>[k,v.y+(v.grp?'grp':'')+(v.po?'po':'')])):null;
  o.newFx={};for(const lg of ['KR','MX','AR','US','AT','DK','SC','CH','ES']){const fx=fxOfLg(lg);const per={};fx.forEach(f=>{per[f.h]=(per[f.h]||0)+1;per[f.a]=(per[f.a]||0)+1});const pv=Object.values(per);o.newFx[lg]=fx.length+'/'+(pv.length?Math.min(...pv)+'-'+Math.max(...pv):'')}
  // 저장 왕복 후 POST일 진행
  try{const str=svSerialize();o.svBytesNew=str.length;S=JSON.parse(str);psUnpack(S.ps);devLoad();careerLoad();SQC=null;save=()=>{};S.engAll=false;o.rt='ok'}catch(e){o.rt='ERR '+e.message}
  g=0;let dd=0;while(g++<(+POST||60)){step();dd++}o.postDate=S.date;o.postKR=(()=>{const fx=fxOfLg('KR');return fx.filter(f=>f.res).length+'/'+fx.length})();
  o.badPsKeys=Object.keys(S.ps).filter(k=>isNaN(+k)).slice(0,5);
  return o},[process.env.MODE,process.env.POST||'60']);
console.log(JSON.stringify(r,null,0));const grp={};for(const e of errs){const ln=(e.match(/html:(\d+)/g)||[]).map(x=>x.slice(5)).join('>');const k=e.split('\n')[0].slice(0,90)+' @'+ln.slice(0,160);grp[k]=(grp[k]||0)+1}console.log('ERRS',errs.length,JSON.stringify(grp));await b.close();process.exit(0)})().catch(e=>{console.log('E',e.message);process.exit(1)});
