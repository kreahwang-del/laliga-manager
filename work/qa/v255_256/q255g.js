const {chromium}=require('playwright');
const HTML=process.env.HTML||'/home/claude/work/cur.html',N=+(process.env.N||200),POL=process.env.POL||'none',SEED=+(process.env.SEED||777);
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis/,r=>r.abort());
await pg.goto('file://'+HTML);await pg.waitForTimeout(400);
const out=await pg.evaluate(([N,POL,SEED,OFF])=>{let x=SEED;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};UI.mode='club';UI.nm='t';startGame(LIGA[0]);
 const all=CLUBS.filter(c=>c&&['ES','EN','IT','DE','FR'].includes(c.lg));const R=[];
 const apply=(api,T,k)=>{const ti=[...T.ti];if(k==='all'){api.shout(0,'push');ti[0]=Math.min(5,ti[0]+2);ti[3]=Math.min(5,ti[3]+1);ti[2]=Math.min(5,ti[2]+1);api.setTactic(0,{ti})}
  else if(k==='air'){ti[4]=5;ti[2]=5;api.setTactic(0,{ti});T.focus='W'}
  else if(k==='pat'){api.shout(0,'calm');ti[3]=Math.max(1,ti[3]-1);ti[4]=Math.max(1,ti[4]-1);api.setTactic(0,{ti});T.focus=null}};
 for(let k=0;k<N;k++){x=((SEED*31+k*7919)%2147483646)+1;/*QA: 경기마다 재시드 → 80분까지 정책 간 동일(짝비교)*/const kk2=k+OFF;const h=all[(kk2*7)%all.length],a=all[(kk2*13+5)%all.length];if(h===a)continue;let snap=null;
  const m=runMatch(teamFor(h.i),teamFor(a.i),{afterMinute:(min,st,T,api)=>{if(min===80&&!snap){if(st.sc[0]>=st.sc[1])st.sc[1]=st.sc[0]+1;const air=L=>{const v=L.filter(p=>p.g!=='GK').map(p=>(p.aerial??10)+((p.h||180)-180)*.08).sort((a,b)=>b-a).slice(0,3);return v.reduce((a,x)=>a+x,0)/v.length};const av=(L,k,f)=>{const v=L.filter(f).map(p=>p[k]??10);return v.length?v.reduce((a,x)=>a+x,0)/v.length:10};snap={g0:st.sc[0],g1:st.sc[1],sh0:st.sh[0],sh1:st.sh[1],x0:st.xg[0],x1:st.xg[1],oa:+air(T[0].xi).toFixed(2),da:+air(T[1].xi).toFixed(2),op:+av(T[1].xi,'pace',p=>['ST','W','AM'].includes(p.g)).toFixed(2),mp:+av(T[0].xi,'pass',p=>p.g!=='GK').toFixed(2),dp:+av(T[0].xi,'pace',p=>['CB','FB'].includes(p.g)).toFixed(2),ov:Math.round(av(T[0].xi,'ovr',p=>1)-av(T[1].xi,'ovr',p=>1))};if(st.sc[0]<st.sc[1]&&POL!=='none')apply(api,T[0],POL)}}});
  while(!m.done)m.step();const st=m.st;
  if(snap&&snap.g0<snap.g1)R.push({k,oa:snap.oa,da:snap.da,op:snap.op,mp:snap.mp,dp:snap.dp,ov:snap.ov,d:snap.g1-snap.g0,gf:st.sc[0]-snap.g0,ga:st.sc[1]-snap.g1,sf:st.sh[0]-snap.sh0,sa:st.sh[1]-snap.sh1,xf:+(st.xg[0]-snap.x0).toFixed(3),xa:+(st.xg[1]-snap.x1).toFixed(3)})}
 return R},[N,POL,SEED,+(process.env.OFF||0)]);
require('fs').writeFileSync(process.env.OUT||('g_'+POL+'.json'),JSON.stringify(out));if(errs.length)console.error(errs.slice(0,3));await b.close()})();
