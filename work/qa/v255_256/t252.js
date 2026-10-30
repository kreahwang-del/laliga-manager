const {chromium}=require('playwright');
const HTML=process.env.HTML||'/home/claude/work/cur.html',N=+(process.env.N||20),MODE=process.env.MODE||'dec',SEED=+(process.env.SEED||99);
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis/,r=>r.abort());
await pg.goto('file://'+HTML);await pg.waitForTimeout(400);
const out=await pg.evaluate(([N,MODE,SEED])=>{let x=SEED;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};UI.mode='club';UI.nm='t';startGame(LIGA[0]);
 const es=CLUBS.filter(c=>c&&c.lg==='ES');const chs=['switch','wide','inside'];let g=0;const R={hash:[],dec:[],act:[],goals:0};
 for(let k=0;k<N;k++){const hk=MODE==='ai'?{}:{wantDec:(kk,s)=>s===0};const m=runMatch(teamFor(es[k%10].i),teamFor(es[10+(k*3)%10].i),hk);
  while(!m.done){m.step();if(m.st.pendingDec){const d=m.st.pendingDec;m.api.decide(d.k==='fk'?['shot','cross','short'][g%3]:chs[g%3],g%2===0);g++}}
  const ev=m.st.ev;let h=0;for(const e of ev){const t=e.t+':'+e.m+':'+(e.p||'');for(let i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0}R.hash.push(h);
  for(const e of ev){if(e.t==='dec')R.dec.push({k:e.k,ch:e.ch,fol:e.fol,fp:e.fp,why:e.why});if(e.t==='decAct')R.act.push({ch:e.ch,fol:e.fol,k:e.k,lat:e.lat,tx:e.tx,ok:e.ok});if(e.t==='goal')R.goals++}}
 return R},[N,MODE,SEED]);
console.log(JSON.stringify(out));if(errs.length)console.error(errs.slice(0,3));await b.close()})();
