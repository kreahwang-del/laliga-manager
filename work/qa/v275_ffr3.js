// v275 빨리 감기 중 골 3D 다시보기 칩 생성 확인
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(800);
await pg.evaluate(()=>{let x=5;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};UI.mode='club';UI.nm='t';startGame(LIGA[0]);S.decT=0;S.decOn=false;const fx=S.fixtures.filter(f=>!f.res&&(f.h===S.club||f.a===S.club)).sort((a,b)=>a.d<b.d?-1:1)[0];S.date=fx.d;startMatch(fx);M.speed=1;ffStart()});
for(let i=0;i<240;i++){await pg.waitForTimeout(250);const d=await pg.evaluate(()=>{const sh=document.querySelector('#scrim .sheet');if(sh&&M.paused&&!M.done){const x=sh.querySelector('[data-mo="resume"],button.x');if(x){x.click();setTimeout(()=>{try{ffStart()}catch(e){}},200)}}return M.done||M.m.min>=60});if(d)break}
const r=await pg.evaluate(()=>({min:M.m.min,goals:M.m.st.ev.filter(e=>e.t==='goal').map(e=>e.m+"'"+e.p),reps:(M.reps||[]).map(x=>x.e.m+"'"+x.e.t+' '+x.e.p),chips:document.querySelectorAll('[data-r3d]').length}));
console.log(JSON.stringify(r),errs.slice(0,3));process.exit(0)})();
