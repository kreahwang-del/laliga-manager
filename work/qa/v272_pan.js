// v272 지시 장면 확대 화면 끌어서 이동 확인
const {chromium}=require('playwright');const H=process.env.HTML;
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844},hasTouch:false});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+H,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(800);
await pg.evaluate(()=>{let x=77;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};UI.mode='club';UI.nm='t';startGame(LIGA[0]);S.decT=0;const fx=S.fixtures.filter(f=>!f.res&&(f.h===S.club||f.a===S.club)).sort((a,b)=>a.d<b.d?-1:1)[0];S.date=fx.d;startMatch(fx);M.speed=.5;ffStart()});
for(let i=0;i<60;i++){await pg.waitForTimeout(250);if(await pg.evaluate(()=>!!document.querySelector('#scrim [data-mo^="dec:"]')))break}
await pg.waitForTimeout(600);const r0=await pg.evaluate(()=>({vb:document.getElementById('m2d').getAttribute('viewBox'),dvz:document.getElementById('m2d').classList.contains('dvz'),hint:!!document.querySelector('.dvdrag')}));
const bx=await pg.evaluate(()=>{const r=document.getElementById('m2d').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]});
await pg.mouse.move(bx[0],bx[1]);await pg.mouse.down();await pg.mouse.move(bx[0]+80,bx[1]+30,{steps:6});await pg.mouse.up();
const r1=await pg.evaluate(()=>document.getElementById('m2d').getAttribute('viewBox'));await pg.screenshot({path:'/home/claude/work/qa/v272/pan.png'});
console.log(JSON.stringify({r0,r1}),errs.slice(0,3));process.exit(0)})();
