// v272 3D 다시보기 공 경로 검사: 지시 결과(dec) 장면마다 공을 0.05초 간격으로 따라가며 '골이 아닌데 골문 안(골라인 너머·골대 사이·크로스바 아래)'에 들어간 순간과 카메라 모드 기록
const {chromium}=require('playwright');const fs=require('fs');const H=process.env.HTML,G=+(process.env.G||3),OUT=process.env.OUT;
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const pg=await b.newPage({viewport:{width:390,height:844}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());const res=[];
for(let g=0;g<G;g++){await pg.goto('file://'+H,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(800);
 await pg.evaluate(g=>{let x=91+g*13;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};UI.mode='club';UI.nm='t';startGame(LIGA[g%LIGA.length]);S.decT=0;const fx=S.fixtures.filter(f=>!f.res&&(f.h===S.club||f.a===S.club)).sort((a,b)=>a.d<b.d?-1:1)[0];S.date=fx.d;startMatch(fx);M.speed=16},g);
 const t0=Date.now();while(Date.now()-t0<240000){await pg.waitForTimeout(250);const st=await pg.evaluate(()=>{const sh=document.querySelector('#scrim .sheet');const d=M&&M.m&&M.m.st.pendingDec;if(d&&sh){const bs=[...sh.querySelectorAll('[data-mo^="dec:"]')];if(bs.length){bs[(M.m.min)%bs.length].click();return {}}}if(M&&M.paused&&sh&&!M.done){const b2=sh.querySelector('[data-mo="resume"],[data-close],button.x');if(b2)b2.click()}return {done:M.done,n:(M.reps||[]).filter(r=>r.e.t==='dec').length}});if(st.done)break}
 const n=await pg.evaluate(()=>(M.reps||[]).length);
 for(let i=0;i<n;i++){const ok=await pg.evaluate(i=>{const r=M.reps[i];if(!r||r.e.t!=='dec')return false;r3Open(r);return true},i);if(!ok)continue;
  await pg.waitForFunction(()=>window.__r3,null,{timeout:20000}).catch(()=>{});
  const o=await pg.evaluate(async i=>{const R=window.__r3;if(!R)return {i,err:'no r3'};R.setSpd(0);const out={i,k:M.reps[i].e.k,in:0,maxJ:0,cams:{}};let prev=null;
   for(let t=R.t0;t<R.tE;t+=.1){R.setT(t);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const p=R.ball.position;const x=p.x+52.5,y=p.z+34,z=p.y;
    if((x>105.05||x<-.05)&&y>30.34&&y<37.66&&z<2.44)out.in++;if(prev)out.maxJ=Math.max(out.maxJ,Math.hypot(x-prev[0],y-prev[1]));prev=[x,y];const c=R.cam.position;const cy=Math.round(c.y);out.cams[cy]=(out.cams[cy]||0)+1}
   document.querySelector('[data-r3x],[data-r3close]')?.click();return out},i);
  res.push(Object.assign({g},o));await pg.evaluate(()=>{const c=document.querySelector('#r3 [data-r3c="close"],#r3wrap button:last-child');}).catch(()=>{});
  await pg.keyboard.press('Escape').catch(()=>{});await pg.waitForTimeout(300)}}
fs.writeFileSync(OUT,JSON.stringify(res,null,0));console.log(JSON.stringify(res));if(errs.length)console.error('ERR',errs.slice(0,4));process.exit(0)})().catch(e=>{console.log('E',e.message);process.exit(1)});
