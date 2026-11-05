// 사용자 경로: KR 선발 외국인 초과 → startMatch 자동 조정, MX 리기야 엔진 경기(startMatch→finish), 경고 누적 규정 단위 점검
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push('PE '+e.message.slice(0,300)));pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load/.test(m.text()))errs.push('CE '+m.text().slice(0,600))});
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1200);
const A=await pg.evaluate(()=>{const o={};UI.mode='club';UI.nm='t';startGame(LIGA[0]);const c=CLUBS.filter(c=>c&&c.lg==='KR').sort((a,b)=>squadOf(b.i).filter(p=>p.nat!=='KOR').length-squadOf(a.i).filter(p=>p.nat!=='KOR').length)[0];PEND_HL='KR';startGame(c.i);save=()=>{};S.engAll=false;
  o.club=c.short;const fo=squadOf(S.club).filter(p=>isFor(p,S.club));o.forInSquad=fo.length;
  // 외국인을 같은 라인 자리에 최대한 넣음
  const fo2=fo.filter(q=>q.g!=='GK'&&!S.xi.includes(q.id));let j=0;S.xi=S.xi.map(id=>{const p=pl(id);if(!p||p.g==='GK'||isFor(p,S.club))return id;const f=fo2[j++];return f?f.id:id});SQC=null;
  o.before=sqrMyCheck().n;o.tac=(()=>{try{UI.tab='tactics';return /선발 외국인 \d+\/5/.test(tacView())}catch(e){return 'ERR '+e.message}})();
  const fx=S.fixtures.find(f=>!f.res&&(f.h===S.club||f.a===S.club));S.date=fx.d;fx._pr=1;startMatch(fx);o.after=sqrMyCheck().n;const T=M.me===0?M.H:M.Aw;o.engXiFor=T.xi.filter(p=>p&&isFor(p,S.club)).length;o.engBenchFor=(T.bench||[]).filter(p=>p&&isFor(p,S.club)).length;
  o.inbox=(S.inbox.find(m=>/외국인 출전 한도/.test(m.title))||{}).body;finish();o.res=fx.res&&fx.res.sc;o.nullKey=('null' in S.ps);document.getElementById('match')&&document.getElementById('match').remove();
  // 끄면 조정 안 함
  S.sqr=false;o.offCheck=sqrMyCheck();S.sqr=true;
  // 경고 누적 규정
  const yr={};for(const lg of ['KR','JP','BR','TR','SC','CH','EN2','ES','IT']){const R=BAN_R[lg];yr[lg]=[];for(let n=1;n<=16;n++){const k=banYThr(R,n,'lg');if(k)yr[lg].push(n+':'+k)}}o.ban=yr;S.date='2026-12-01';o.en2=[5,10,15].map(n=>banYThr(BAN_R.EN2,n,'lg'));S.date='2026-11-15';o.en2b=[5,10,15].map(n=>banYThr(BAN_R.EN2,n,'lg'));
  return o});
console.log('A',JSON.stringify(A));
await pg.reload({waitUntil:'domcontentloaded'});await pg.waitForTimeout(1200);
const B=await pg.evaluate(()=>{const o={matches:[]};UI.mode='club';UI.nm='t';const c=CLUBS.filter(c=>c&&c.lg==='MX')[3];PEND_HL='MX';startGame(c.i);save=()=>{};S.engAll=false;o.club=c.short;let g=0;
  while(g++<400&&S.date<'2027-01-15'){divFastToday();for(const f of S.fixtures.filter(x=>x.d===S.date&&!x.res)){if(f.h===S.club||f.a===S.club){f.res={sc:f.h===S.club?[2,0]:[0,2],ev:[]}}else fastMatch(f)}
    const m=cupMine();if(m){if(m.lgpo){const lab=cupLabel(m);try{m._pr=1;startMatch(m);finish();document.getElementById('match')&&document.getElementById('match').remove();const fd=[...document.querySelectorAll('#mfd .ev')].slice(0,0);o.matches.push([S.date,lab,m.res&&m.res.sc.join('-'),m.w!=null?CLUBS[m.w].short:null])}catch(e){o.matches.push([S.date,lab,'ERR '+e.message])}}else fastMatch(m)}
    S.date=addD(S.date,1);daily()}
  const st=lfSt('MX');o.ch=st&&st.ch;o.next=(()=>{const n=cupNextMine();return n?[n.d,cupLabel(n)]:null})();o.html=(()=>{try{UI.elg='';return /리기야/.test(leagueView())}catch(e){return 'ERR '+e.message}})();return o});
console.log('B',JSON.stringify(B));console.log('ERRS',errs.length,JSON.stringify(errs.slice(0,6)));await b.close();process.exit(0)})().catch(e=>{console.log('E',e.message);process.exit(1)});
