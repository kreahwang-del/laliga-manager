// 시작 화면 지도 두 손가락 확대 확인(CDP 터치 2점)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1500);
const box=await pg.evaluate(()=>{const s=document.getElementById('wmap');if(!s)return null;s.scrollIntoView({block:'center'});const r=s.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,vb:s.getAttribute('viewBox')}});
if(!box){console.log('no map');process.exit(0)}
const cdp=await ctx.newCDPSession(pg);const T=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((p,i)=>({x:p[0],y:p[1],id:i}))});
await T('touchStart',[[box.x-20,box.y],[box.x+20,box.y]]);for(let k=1;k<=8;k++){await T('touchMove',[[box.x-20-k*10,box.y],[box.x+20+k*10,box.y]]);await pg.waitForTimeout(30)}await T('touchEnd',[]);
await pg.waitForTimeout(300);const vb2=await pg.evaluate(()=>document.getElementById('wmap').getAttribute('viewBox'));
console.log(JSON.stringify({before:box.vb,after:vb2}),errs.slice(0,3));process.exit(0)})();
