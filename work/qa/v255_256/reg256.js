const {chromium}=require('playwright');
const HTML=process.env.HTML,N=+(process.env.N||300),SEED=+(process.env.SEED||31),K0=+(process.env.K0||0);
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis/,r=>r.abort());await pg.goto('file://'+HTML);await pg.waitForTimeout(400);
const out=await pg.evaluate(([N,SEED,K0])=>{let x=SEED;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};UI.mode='club';UI.nm='t';startGame(LIGA[0]);
 const all=CLUBS.filter(c=>c&&['ES','EN','IT','DE','FR'].includes(c.lg)&&c.i!==S.club);const R=[];
 for(let k=K0;k<K0+N;k++){const h=all[(k*7)%all.length],a=all[(k*13+5)%all.length];if(h===a)continue;x=(SEED+k*7919)%2147483647||1;
  let s70=null,sh65=null;const m=runMatch(teamFor(h.i),teamFor(a.i),{afterMinute:(min,st)=>{if(min===70)s70=[st.sc[0],st.sc[1]];if(min===65)sh65=[st.sh[0],st.sh[1],st.sc[0],st.sc[1]]}});
  while(!m.done)m.step();const st=m.st;const late=st.ev.filter(e=>e.t==='goal'&&e.m>=76).length;
  R.push({sc:[st.sc[0],st.sc[1]],s70,sh65,shE:[st.sh[0],st.sh[1]],late,xg:[+st.xg[0].toFixed(2),+st.xg[1].toFixed(2)]})}
 return R},[N,SEED,K0]);
require('fs').writeFileSync(process.env.OUT,JSON.stringify(out));if(errs.length)console.error(errs.slice(0,3));await b.close()})();
