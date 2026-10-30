// 회귀: AI끼리 경기 이벤트 해시(t252.js 방식) + 스코어. 경기별 재시드, 해시 대진
const {chromium}=require('playwright');const fs=require('fs');
const HTML=process.env.HTML,N=+(process.env.N||300),SEED=+(process.env.SEED||2718),OUT=process.env.OUT,CH=+(process.env.CH||50),K0=+(process.env.K0||0);
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis/,r=>r.abort());await pg.goto('file://'+HTML);await pg.waitForTimeout(400);
await pg.evaluate(()=>{UI.mode='club';UI.nm='t';startGame(LIGA[0]);window.__all=CLUBS.filter(c=>c&&['ES','EN','IT','DE','FR'].includes(c.lg))});
fs.writeFileSync(OUT,'');
for(let c0=K0;c0<K0+N;c0+=CH){
 const out=await pg.evaluate(([c0,n,SEED])=>{let x=1;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};
  const all=window.__all,R=[];const hs=v=>{v=(v^61)^(v>>>16);v=Math.imul(v,9);v^=v>>>4;v=Math.imul(v,0x27d4eb2d);v^=v>>>15;return v>>>0};
  for(let k=c0;k<c0+n;k++){const hi=hs(SEED*100003+k*2)%all.length;let ai=hs(SEED*100003+k*2+1)%all.length;if(ai===hi)ai=(ai+1)%all.length;
   x=((SEED*7919+k*104729)%2147483646)+1;const m=runMatch(teamFor(all[hi].i),teamFor(all[ai].i),{});while(!m.done)m.step();const st=m.st;
   let h=0;for(const e of st.ev){const t=e.t+':'+e.m+':'+(e.p||'');for(let i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0}
   R.push({k,sc:[st.sc[0],st.sc[1]],xg:[+st.xg[0].toFixed(3),+st.xg[1].toFixed(3)],nev:st.ev.length,h})}
  return R},[c0,Math.min(CH,K0+N-c0),SEED]);
 fs.appendFileSync(OUT,out.map(o=>JSON.stringify(o)).join('\n')+'\n');}
if(errs.length)console.error(errs.slice(0,3));await b.close()})();
