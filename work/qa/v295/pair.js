// 같은 대진·같은 날짜 키로 빠른 경기(AI끼리)를 두 빌드에서 돌려 경기별 결과 비교. env HTML, OUT
const {chromium}=require('playwright');const fs=require('fs');(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];
pg.on('pageerror',e=>errs.push('PE '+e.message.slice(0,200)));pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load/.test(m.text()))errs.push('CE '+m.text().slice(0,200))});
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1200);
const r=await pg.evaluate(()=>{UI.mode='club';UI.nm='t';startGame(LIGA[0]);goUnemployed('t',0);save=()=>{};render=()=>{};S.engAll=false;S.date='2026-08-20';
  const LGS=[...new Set(CLUBS.filter(c=>c&&c.lg).map(c=>c.lg))];const res={};const t0=performance.now();
  for(const lg of LGS){const cl=lgClubs(lg).slice().sort((a,b)=>a-b);const T=cl.length%2?[...cl,null]:cl;const rr=roundRobin(T);const out=[];
    for(let rep=0;rep<2;rep++)rr.forEach((ms,i)=>{for(const id in S.ps){const q=S.ps[id];if(!q)continue;q.fit=100;q.injD=0;delete q.bn;delete q.ban}ms.forEach(([h,a])=>{if(h==null||a==null)return;const f={d:addD('2026-08-20',rep*60+i),r:i+1,h:rep?a:h,a:rep?h:a,res:null,lg};fastMatch(f);out.push(f.res?f.res.sc.join('-'):'x')})});
    res[lg]=out}
  return {ms:Math.round(performance.now()-t0),res}});
fs.writeFileSync(process.env.OUT,JSON.stringify(r));console.log('ms',r.ms,'ERRS',errs.length,JSON.stringify(errs.slice(0,4)));await b.close();process.exit(0)})().catch(e=>{console.log('E',e.message);process.exit(1)});
