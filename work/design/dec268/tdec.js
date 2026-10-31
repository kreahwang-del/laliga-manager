// v268 벤치 지시 장면 보기 확인: 결정 장면이 뜰 때마다 스크린샷·정보 기록(종류별 1장), 3번 넘으면 다음 경기
const {chromium}=require('playwright');const fs=require('fs');const OUT=process.env.OUT,H=process.env.HTML,W=+(process.env.W||360),HT=+(process.env.HT||780);
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:W,height:HT}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+H,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(600);
const seen={},log=[];let mi=0;
for(let g=0;g<6&&Object.keys(seen).length<6;g++){
 if(g>0){await pg.goto('file://'+H,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(600)}
 await pg.evaluate(g=>{let x=33+g*7;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};UI.mode='club';UI.nm='t';startGame(LIGA[g%LIGA.length]);S.decT=0;const fx=S.fixtures.filter(f=>!f.res&&(f.h===S.club||f.a===S.club)).sort((a,b)=>a.d<b.d?-1:1)[0];S.date=fx.d;startMatch(fx);M.speed=16},g);
 const t0=Date.now();while(Date.now()-t0<200000){await pg.waitForTimeout(300);const st=await pg.evaluate(()=>{const d=M&&M.m&&M.m.st.pendingDec;const sh=document.querySelector('#scrim .sheet');if(d&&sh&&sh.querySelector('[data-mo^="dec:"]'))return {dec:d.k};if(M&&M.paused&&sh&&!M.done){const b2=sh.querySelector('[data-mo="resume"],[data-close],button.x');if(b2)b2.click()}return {done:M.done}});
  if(st.dec){await pg.waitForTimeout(450);const k=st.dec;const info=await pg.evaluate(()=>{const sh=document.querySelector('#scrim .sheet');const r=sh.getBoundingClientRect();const pit=document.getElementById('m2d').getBoundingClientRect();return {sheetTop:Math.round(r.top),sheetH:Math.round(r.height),pitchBottom:Math.round(pit.bottom),vb:document.getElementById('m2d').getAttribute('viewBox'),info:sh.querySelector('.dvinfo')?.innerText,nums:sh.querySelectorAll('.dvn').length,btnsVisible:[...sh.querySelectorAll('[data-mo^="dec:"]')].filter(b=>b.getBoundingClientRect().bottom<=innerHeight).length,layer:!!document.getElementById('dvL')}});
   log.push(Object.assign({k},info));if(!seen[k]||k==='def'||k==='box'){seen[k]=1;await pg.screenshot({path:`${OUT}/dec_${k}.png`})}
   await pg.evaluate(()=>{const b=document.querySelector('#scrim [data-mo^="dec:"]');b&&b.click()});await pg.waitForTimeout(300);const after=await pg.evaluate(()=>({vb:document.getElementById('m2d')?.getAttribute('viewBox'),layer:!!document.getElementById('dvL')}));log[log.length-1].after=after;continue}
  if(st.done)break}
 const chips=await pg.evaluate(()=>[...document.querySelectorAll('#r3dbar .chip')].map(c=>c.textContent));log.push({chips});
 await pg.evaluate(()=>{try{document.querySelector('#scrim [data-close]')?.click()}catch(e){}M=null;render()});}
fs.writeFileSync(`${OUT}/log.json`,JSON.stringify({log,errs},null,1));console.log(JSON.stringify(log.slice(0,14)),errs.slice(0,3));process.exit(0)})().catch(e=>{console.log('E',e.message);process.exit(1)})
