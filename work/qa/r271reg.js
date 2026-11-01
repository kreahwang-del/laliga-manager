// v271 리그 회귀: AI끼리 경기, 득점·무·홈승·강팀승률·중거리 득점 비중
const {chromium}=require('playwright');
const HTML=process.env.HTML,N=+(process.env.N||150),SEED=+(process.env.SEED||31),K0=+(process.env.K0||0);
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis/,r=>r.abort());await pg.goto('file://'+HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(800);
const out=await pg.evaluate(([N,SEED,K0])=>{let x=SEED;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};UI.mode='club';UI.nm='t';startGame(LIGA[0]);
 const all=CLUBS.filter(c=>c&&['ES','EN','IT','DE','FR'].includes(c.lg)&&c.i!==S.club);const R=[];
 for(let k=K0;k<K0+N;k++){const h=all[(k*7)%all.length],a=all[(k*13+5)%all.length];if(h===a)continue;x=(SEED+k*7919)%2147483647||1;
  const H=teamFor(h.i),A=teamFor(a.i);const m=runMatch(H,A,{});while(!m.done)m.step();const st=m.st;
  const gs=st.ev.filter(e=>e.t==='goal').map(e=>({s:e.s,ty:e.type}));
  R.push({k,hr:h.rep,ar:a.rep,hp:H.preset,ap:A.preset,sc:[st.sc[0],st.sc[1]],xg:[+st.xg[0].toFixed(2),+st.xg[1].toFixed(2)],gs})}
 return R},[N,SEED,K0]);
require('fs').writeFileSync(process.env.OUT,JSON.stringify(out));if(errs.length)console.error(errs.slice(0,3));process.exit(0)})();
