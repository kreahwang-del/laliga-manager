// 경기 리포트 빌드업·롱패스 집계: 프리셋별 엔진 경기 N개. env HTML N
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message.slice(0,200)));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1200);
const r=await pg.evaluate((N)=>{UI.mode='club';UI.nm='t';startGame(LIGA[0]);goUnemployed('t',0);save=()=>{};const C=CLUBS.filter(c=>c&&c.lg==='ES');let x=17;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};
  const out={};for(const pre of ['다이렉트','티키타카','균형','선수비 후 역습']){const R={n:0,build0:0,build:0,pl:0,long:0,longWon:0,clr:0,ms:[]};
    for(let k=0;k<N;k++){x=(k*7919+31)%2147483646+1;const h=C[(k*7)%C.length],a=C[(k*13+3)%C.length];if(h===a)continue;
      const H=Object.assign({},teamFor(h.i),{preset:pre,ti:E3.PRESETS[pre].slice()}),A=teamFor(a.i);const res=simulate(H,A);const o=traceStats(res,0);R.n++;if(!o.build)R.build0++;R.build+=o.build;R.pl+=o.pressLost;R.long+=o.long;R.longWon+=o.longWon;R.clr+=o.clr||0}
    out[pre]={n:R.n,build0:R.build0,build:+(R.build/R.n).toFixed(1),pressLostPct:+(100*R.pl/Math.max(1,R.build)).toFixed(1),long:+(R.long/R.n).toFixed(1),longWonPct:+(100*R.longWon/Math.max(1,R.long)).toFixed(1),clr:+(R.clr/R.n).toFixed(1)}}
  return out},+(process.env.N||30));console.log(JSON.stringify(r));console.log('ERR',errs.slice(0,3));await b.close();process.exit(0)})();
