// 중거리 보정(lsK) 측정: AI끼리 경기 전체 — 경기당 골·무승부·슈팅 유형별 수·xG·골. OV로 CFG 덮어쓰기. 경기별 재시드·해시 대진
const {chromium}=require('playwright');const fs=require('fs');
const HTML=process.env.HTML,N=+(process.env.N||300),SEED=+(process.env.SEED||8642),OUT=process.env.OUT,CH=+(process.env.CH||25),OV=JSON.parse(process.env.OV||'{}');
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic/,r=>r.abort());await pg.goto('file://'+HTML);await pg.waitForTimeout(400);
await pg.evaluate(([OV])=>{if(Object.keys(OV).length){const _c=E4.createMatch;E4.createMatch=(H,A,o)=>_c(H,A,Object.assign({},o,{cfg:Object.assign({},(o&&o.cfg)||{},OV)}))}UI.mode='club';UI.nm='t';startGame(LIGA[0]);window.__all=CLUBS.filter(c=>c&&['ES','EN','IT','DE','FR'].includes(c.lg));},[OV]);
fs.writeFileSync(OUT,'');
for(let c0=0;c0<N;c0+=CH){const out=await pg.evaluate(([c0,n,SEED])=>{let x=1;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};
  const all=window.__all,R=[];const hs=v=>{v=(v^61)^(v>>>16);v=Math.imul(v,9);v^=v>>>4;v=Math.imul(v,0x27d4eb2d);v^=v>>>15;return v>>>0};
  for(let k=c0;k<c0+n;k++){const hi=hs(SEED*100003+k*2)%all.length;let ai=hs(SEED*100003+k*2+1)%all.length;if(ai===hi)ai=(ai+1)%all.length;x=((SEED*7919+k*104729)%2147483646)+1;
   const m=runMatch(teamFor(all[hi].i),teamFor(all[ai].i),{});while(!m.done)m.step();const st=m.st;const sh={},xg={},g={};
   st.ev.forEach(e=>{if(e.t==='goal'||e.t==='miss'||e.t==='save'){const t=e.type||'?';sh[t]=(sh[t]||0)+1;xg[t]=+((xg[t]||0)+(+e.xg||0)).toFixed(3);if(e.t==='goal')g[t]=(g[t]||0)+1}});
   R.push({k,sc:[st.sc[0],st.sc[1]],shots:st.sh[0]+st.sh[1],xg:+(st.xg[0]+st.xg[1]).toFixed(3),blk:st.blk[0]+st.blk[1],sh,xgT:xg,g})}
  return R},[c0,Math.min(CH,N-c0),SEED]);fs.appendFileSync(OUT,out.map(o=>JSON.stringify(o)).join('\n')+'\n')}
if(errs.length)console.error(errs.slice(0,3));await b.close()})();
