const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const pg=await b.newPage();
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1200);
const r=await pg.evaluate(()=>{UI.mode='club';UI.nm='t';startGame(LIGA[0]);goUnemployed('t',0);save=()=>{};render=()=>{};S.engAll=false;const C=CLUBS.filter(c=>c&&c.lg);const tf=[],dl=[];
  for(let k=0;k<8;k++){S.date=addD(S.date,1);SQC=null;let t=performance.now();for(const c of C)teamFor(c.i);tf.push(performance.now()-t);t=performance.now();daily();dl.push(performance.now()-t)}
  const med=a=>a.slice().sort((x,y)=>x-y)[a.length>>1];return {clubs:C.length,teamForAllMed:Math.round(med(tf)),perClubMs:+(med(tf)/C.length).toFixed(2),dailyMed:Math.round(med(dl))}});
console.log(process.env.HTML.slice(-12),JSON.stringify(r));await b.close();process.exit(0)})();
