const {chromium}=require('playwright');
const HTML=process.env.HTML||'/home/claude/work/cur256.html',N=+(process.env.N||100),POL=process.env.POL||'none',SEED=+(process.env.SEED||777);
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis/,r=>r.abort());
await pg.goto('file://'+HTML);await pg.waitForTimeout(400);
const out=await pg.evaluate(([N,POL,SEED])=>{let x=SEED;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};UI.mode='club';UI.nm='t';startGame(LIGA[0]);
 const all=CLUBS.filter(c=>c&&['ES','EN','IT','DE','FR'].includes(c.lg));const R=[];
 const av=(L,k,f)=>{const v=L.filter(f).map(p=>p[k]??10);return v.length?v.reduce((a,x)=>a+x,0)/v.length:10};
 for(let k=0;k<N;k++){const h=all[(k*7)%all.length],a=all[(k*13+5)%all.length];if(h===a)continue;x=(SEED+k*7919)%2147483647||1;
  const H=teamFor(h.i),A=teamFor(a.i);H._pl=1;H.aiGs=null;let snap=null;
  const m=runMatch(H,A,{afterMinute:(min,st,T,api)=>{if(min===80&&!snap){if(st.sc[0]>=st.sc[1])st.sc[1]=st.sc[0]+1;snap={d:st.sc[1]-st.sc[0],g0:st.sc[0],g1:st.sc[1],x0:st.xg[0],x1:st.xg[1],s0:st.sh[0],s1:st.sh[1],oa:+decAir(T[0].xi).toFixed(2),da:+decAir(T[1].xi).toFixed(2),op:+av(T[1].xi,'pace',p=>['ST','W','AM'].includes(p.g)).toFixed(2),dp:+av(T[0].xi,'pace',p=>['CB','FB'].includes(p.g)).toFixed(2),r:Math.round(x%100000),ls:+(T[0].xi.filter(p=>p.g!=='GK').map(p=>p.shoot??10).sort((a,b)=>b-a).slice(0,4).reduce((a,v)=>a+v,0)/4).toFixed(2)};if(POL!=='none')gambleApply(api,0,T[0],POL)}}});
  while(!m.done)m.step();const st=m.st;
  R.push({k,ls:snap.ls,d:snap.d,oa:snap.oa,da:snap.da,op:snap.op,dp:snap.dp,r:snap.r,gf:st.sc[0]-snap.g0,ga:st.sc[1]-snap.g1,xf:+(st.xg[0]-snap.x0).toFixed(3),xa:+(st.xg[1]-snap.x1).toFixed(3),sf:st.sh[0]-snap.s0,sa:st.sh[1]-snap.s1})}
 return R},[N,POL,SEED]);
require('fs').writeFileSync(process.env.OUT,JSON.stringify(out));if(errs.length)console.error(errs.slice(0,3));await b.close()})();
