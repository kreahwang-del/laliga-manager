// 전술 성향별 실제 효과: 같은 대진·같은 시드에서 홈팀 성향만 바꿔 치름(7성향 + 원래 성향). MODE=raw(양쪽 맞춤 대비 끔) / adapt(홈팀 고정, 원정 AI는 맞춤 대비)
const {chromium}=require('playwright');const fs=require('fs');const HTML=process.env.HTML,N=+(process.env.N||150),SEED=+(process.env.SEED||5),MODE=process.env.MODE||'raw',PAIR=process.env.PAIR||'',PS=(process.env.PS||'').split(',').filter(Boolean),OUT=process.env.OUT;
(async()=>{const b=await chromium.launch();const pg=await b.newPage();await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(500);
await pg.evaluate(()=>{UI.mode='club';UI.nm='t';startGame(LIGA[0]);goUnemployed('t',0)});fs.writeFileSync(OUT,'');
for(let c0=0;c0<N;c0+=10){const R=await pg.evaluate(([c0,N,SEED,MODE,PAIR,PS])=>{const all=LIGA.slice();const hs=v=>{v=(v^61)^(v>>>16);v=Math.imul(v,9);v^=v>>>4;v=Math.imul(v,0x27d4eb2d);v^=v>>>15;return v>>>0};const P=Object.keys(E3.PRESETS);const out=[];
 if(MODE==='raw')AIP.plan=0;
 for(let k=c0;k<Math.min(N,c0+10);k++){let h=all[hs(SEED*1009+k*2)%all.length];let a=all[hs(SEED*1009+k*2+1)%all.length];if(a===h)a=all[(all.indexOf(h)+1)%all.length];if(PAIR==='under'){const so=all.slice().sort((x,y)=>CLUBS[x].rep-CLUBS[y].rep);const weak=so.slice(0,8),strong=so.slice(-6);h=weak[hs(SEED*7+k)%8];a=strong[hs(SEED*11+k)%6]}S.date='2026-09-'+String(1+k%28).padStart(2,'0');
  const row={k,h,a};for(const p of ['orig',...(PS.length?PS:P)]){let x=(SEED*7919+k*104729)%2147483646+1;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};const H=teamFor(h),A=teamFor(a);if(p!=='orig'){H.preset=p;H.ti=[...E3.PRESETS[p]]}if(MODE==='adapt'){H._pl=1;H._pl2=1}
   const m=runMatch(H,A);while(!m.done)m.step();const r=m.finalize();row[p]=[r.sc[0],r.sc[1],+r.stats.xg[0].toFixed(2),+r.stats.xg[1].toFixed(2),H.preset,(E3.styleMap(H.xi)[p==='orig'?H.preset:p]??null)]}out.push(row)}return out},[c0,N,SEED,MODE,PAIR,PS]);
 fs.appendFileSync(OUT,R.map(o=>JSON.stringify(o)).join('\n')+'\n')}
process.exit(0)})().catch(e=>{console.log('E',e.message);process.exit(1)})
