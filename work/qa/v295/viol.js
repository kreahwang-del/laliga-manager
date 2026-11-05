const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message.slice(0,200)));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1200);
const r=await pg.evaluate(()=>{const o={v:[]};UI.mode='club';UI.nm='t';startGame(LIGA[0]);goUnemployed('t',0);save=()=>{};render=()=>{};S.engAll=false;
  while(S.date<'2026-11-01'){divFastToday();S.date=addD(S.date,1);RSEED=Math.floor(hsh(S.date+S.club)*1e9);daily();
    if(o.v.length<8)for(const c of CLUBS){if(!c||!SQR[c.lg]||!SQR[c.lg].m)continue;const T=teamFor(c.i);const f=T.xi.filter(p=>p&&isFor(p,c.i));if(f.length>SQR[c.lg].m){const used=new Set(T.xi.map(p=>p.id));
      const w=f.sort((a,b)=>a.ovr-b.ovr)[0];const dom=squadOf(c.i).filter(p=>!isFor(p,c.i)&&!used.has(p.id));
      o.v.push({d:S.date,c:c.short,lg:c.lg,n:f.length,weak:w.g,domFree:dom.map(p=>p.g+((S.ps[p.id]||{}).injD>0?'(inj)':'')+(p.ban>0?'(ban)':'')+(p.ntAway?'(nt)':'')).join(' '),gk:T.xi.filter(p=>p.g==='GK').map(p=>p.nat).join()})}}}
  return o});console.log(JSON.stringify(r,null,0));console.log('ERR',errs.slice(0,3));await b.close();process.exit(0)})();
