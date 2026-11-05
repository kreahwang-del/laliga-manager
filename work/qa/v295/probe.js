const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message.slice(0,200)));pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load/.test(m.text()))errs.push(m.text().slice(0,200))});
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1200);
const r=await pg.evaluate(()=>{const o={};UI.mode='club';UI.nm='t';startGame(LIGA[0]);goUnemployed('t',0);save=()=>{};render=()=>{};S.engAll=false;
  // (a) 시작 시점 AI 선발 외국인 초과 원인
  o.viol=[];for(const c of CLUBS){if(!c||!SQR[c.lg]||!SQR[c.lg].m)continue;const T=teamFor(c.i);const f=T.xi.filter(p=>p&&isFor(p,c.i));if(f.length+(T.bench||[]).filter(p=>isFor(p,c.i)).length>SQR[c.lg].m){
    const sq=squadOf(c.i);const dom=sq.filter(p=>!isFor(p,c.i));o.viol.push({c:c.short,lg:c.lg,xiFor:f.map(p=>p.g+':'+p.nat).join(' '),domByPos:dom.map(p=>p.g).join(' '),sq:sq.length,domN:dom.length})}}
  // (b) 토글 공략: 끄면 AI도 꺼지는지
  const k=CLUBS.find(c=>c&&c.lg==='KR'&&(()=>{const T=teamFor(c.i);return 1})());S.sqr=false;let offViolAI=0;for(const c of CLUBS){if(!c||!SQR[c.lg]||!SQR[c.lg].m)continue;const T=teamFor(c.i);if(T.xi.filter(p=>p&&isFor(p,c.i)).length+(T.bench||[]).filter(p=>isFor(p,c.i)).length>SQR[c.lg].m)offViolAI++}o.aiViolWhenOff=offViolAI;
  const sa=CLUBS.find(c=>c&&c.lg==='SA');const cand=Object.values(BASE).map(p=>pl(p.id)).filter(p=>isFor(p,sa.i)&&clubOf(p.id)!==sa.i&&clubOf(p.id)>=0).slice(0,1)[0];
  o.quotaOff=quotaOK(cand,sa.i,false);S.sqr=true;o.quotaOnUserFull=(()=>{/* 사용자 구단처럼 판정(ai=false) */return {forCnt:forCnt(sa.i),h:SQR.SA.h,ok:quotaOK(cand,sa.i,false)}})();
  return o});
console.log(JSON.stringify(r,null,0));console.log('ERR',errs.slice(0,3));await b.close();process.exit(0)})();
