const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load/.test(m.text()))errs.push(m.text().slice(0,900))});
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1200);
const r=await pg.evaluate(()=>{UI.mode='club';UI.nm='t';startGame(LIGA[0]);goUnemployed('t',0);save=()=>{};render=()=>{};
  const sa=CLUBS.find(c=>c&&c.lg==='SA'&&forCnt(c.i)>=SQR.SA.h)||CLUBS.find(c=>c&&c.lg==='SA');const o={club:sa.short,for0:forCnt(sa.i),n0:squadOf(sa.i).length};
  // 다른 리그의 좋은 외국인(사우디 기준) 1명을 AI 영입
  const w=sqrWeakFor(sa.i);const cand=Object.values(BASE).map(p=>pl(p.id)).filter(p=>isFor(p,sa.i)&&clubOf(p.id)>=0&&clubOf(p.id)!==sa.i&&p.ovr>=w.ovr+5&&CLUBS[clubOf(p.id)].lg!=='SA')[0];
  o.weak=[w.name,w.ovr];o.cand=[cand.name,cand.ovr];o.quota=quotaOK(cand,sa.i,true);let thrown=null;try{completeTransfer(cand.id,sa.i,1e6,{wage:cand.wage})}catch(e){thrown=e.message}
  o.thrown=thrown;o.for1=forCnt(sa.i);o.n1=squadOf(sa.i).length;o.weakClub=clubOf(w.id);o.weakInSquad=squadOf(sa.i).some(p=>p.id===w.id);o.candClub=clubOf(cand.id);SQC=null;o.weakInSquadAfterReset=squadOf(sa.i).some(p=>p.id===w.id);o.for2=forCnt(sa.i);
  o.news=S.news.slice(0,2).map(n=>n.t);return o});
console.log(JSON.stringify(r));console.log('ERR',errs.length,errs.slice(0,2));await b.close();process.exit(0)})();
