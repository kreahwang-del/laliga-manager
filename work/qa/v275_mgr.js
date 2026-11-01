// v275 감독 기록·칭호·계속 버튼·상대 감독 줄 확인(사용자 세이브)
const {chromium}=require('playwright');const fs=require('fs');const OUT='/home/claude/work/qa/v275';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1500);
await pg.evaluate(sv=>{window.__SV=sv},fs.readFileSync(process.env.SAVE,'utf8'));
await pg.evaluate(()=>{S=JSON.parse(window.__SV);devLoad();careerLoad();SQC=null;save=()=>{};UI.tab='home';render()});await pg.waitForTimeout(500);
const r={};r.btn=await pg.evaluate(()=>document.querySelector('[data-act="advance"]')?.innerText);await pg.screenshot({path:OUT+'/home.png'});
r.staff=await pg.evaluate(()=>{const t=[...document.querySelectorAll('small')].find(x=>x.textContent==='상대 감독');return t?t.parentElement.innerText:null});
// 경기: 다음 우리 경기까지 진행 → 빨리 감기로 지시 장면마다 첫 선택, 하프타임 칭찬
await pg.evaluate(()=>{S.decT=0;advance()});for(let i=0;i<300;i++){await pg.waitForTimeout(500);if(await pg.evaluate(()=>typeof M!=='undefined'&&M&&M.m))break}
await pg.evaluate(()=>{M.speed=1;ffStart()});
for(let i=0;i<600;i++){await pg.waitForTimeout(250);const st=await pg.evaluate(()=>{if(!M||M.done)return {done:true};const sh=document.querySelector('#scrim .sheet');if(sh){const d=sh.querySelector('[data-mo^="dec:"]');if(d){d.click();setTimeout(()=>{try{ffStart()}catch(e){}},300);return {}}const t=sh.querySelector('[data-mo="t_praise"]');if(t){t.click();setTimeout(()=>{const x=document.querySelector('#scrim [data-mo="resume"]');x&&x.click();setTimeout(()=>{try{ffStart()}catch(e){}},300)},200);return {talk:1}}const x=sh.querySelector('[data-mo="resume"],button.x');if(x){x.click();setTimeout(()=>{try{ffStart()}catch(e){}},300)}}else if(!M.ff&&!M.paused&&!M.animating){try{ffStart()}catch(e){}}return {min:M.m.min}});if(st.done)break}
await pg.waitForTimeout(800);
r.log=await pg.evaluate(()=>({mlog:S.me.mlog,talkG:M&&M.talkG,fm:M&&M.m&&M.m.st.fm}));
r.mgrNeutral=await pg.evaluate(()=>teamFor(S.club).mgr);
await pg.evaluate(()=>{S.me.mlog=Array.from({length:12},(_,i)=>({d:'x',dn:3,dg:3,db:0,tn:1,tg:1,tb:0}));});r.mgrHigh=await pg.evaluate(()=>teamFor(S.club).mgr);
await pg.evaluate(()=>{try{M=null}catch(e){}UI.tab='career';UI.cv='mgr';render()});await pg.waitForTimeout(400);await pg.screenshot({path:OUT+'/career.png',fullPage:false});
r.card=await pg.evaluate(()=>{const h=[...document.querySelectorAll('h2')].find(x=>x.textContent.startsWith('감독 기록'));return h?h.nextElementSibling.innerText.slice(0,300):null});
console.log(JSON.stringify(r,null,1));if(errs.length)console.error('ERR',errs.slice(0,5));process.exit(0)})().catch(e=>{console.log('E',e.message);process.exit(1)});
