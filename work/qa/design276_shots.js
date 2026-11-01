// 디자인 검토용 주요 화면 캡처(사용자 세이브, 390×844 폰 세로)
const {chromium}=require('playwright');const fs=require('fs');const OUT='/home/claude/work/qa/design276';
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1500);
await pg.evaluate(sv=>{window.__SV=sv},fs.readFileSync(process.env.SAVE,'utf8'));
await pg.evaluate(()=>{S=JSON.parse(window.__SV);devLoad();careerLoad();SQC=null;save=()=>{};});
const shot=async(n,full)=>{await pg.waitForTimeout(500);await pg.screenshot({path:`${OUT}/${n}.png`,fullPage:!!full});console.log(n)};
for(const [n,t,cv] of [['01_home','home'],['02_squad','squad'],['03_tactics','tac'],['04_transfer','trans'],['05_league','league'],['06_career','career','mgr']]){await pg.evaluate(([t,cv])=>{UI.tab=t;if(cv)UI.cv=cv;render();scrollTo(0,0)},[t,cv]);await shot(n);await shot(n+'_full',true)}
// 선수 상세
await pg.evaluate(()=>{UI.tab='squad';render();const p=S.xi&&S.xi[9];if(typeof playerSheet==='function'&&p)playerSheet(p)});await shot('07_player');await pg.evaluate(()=>closeSheet());
// 경기
await pg.evaluate(()=>{S.decT=0;advance()});for(let i=0;i<300;i++){await pg.waitForTimeout(500);if(await pg.evaluate(()=>typeof M!=='undefined'&&M&&M.m))break}
await pg.evaluate(()=>{M.speed=1});await pg.waitForTimeout(6000);await shot('08_match_live');
await pg.evaluate(()=>{UI.mpst='0';mpst()});await shot('09_match_records');
await pg.evaluate(()=>ffStart());let dec=false,half=false;
for(let i=0;i<500&&!(dec&&half);i++){await pg.waitForTimeout(250);const s=await pg.evaluate(()=>{if(!M||M.done)return 'done';const sh=document.querySelector('#scrim .sheet');if(sh&&sh.querySelector('[data-mo^="dec:"]'))return 'dec';if(sh&&sh.querySelector('[data-mo="t_praise"]'))return 'half';if(sh&&M.paused){const x=sh.querySelector('[data-mo="resume"],button.x');x&&x.click();setTimeout(()=>{try{ffStart()}catch(e){}},200)}return ''});
 if(s==='done')break;if(s==='dec'&&!dec){dec=true;await pg.waitForTimeout(700);await shot('10_decision');await pg.evaluate(()=>{document.querySelector('#scrim [data-mo^="dec:"]').click();setTimeout(()=>{try{ffStart()}catch(e){}},300)})}else if(s==='dec'){await pg.evaluate(()=>{document.querySelector('#scrim [data-mo^="dec:"]').click();setTimeout(()=>{try{ffStart()}catch(e){}},300)})}
 if(s==='half'&&!half){half=true;await shot('11_halftime');await pg.evaluate(()=>{document.querySelector('#scrim [data-mo="t_calm"]').click();setTimeout(()=>{const x=document.querySelector('#scrim [data-mo="resume"]');x&&x.click();setTimeout(()=>{try{ffStart()}catch(e){}},300)},200)})}}
await pg.evaluate(()=>{if(M&&!M.done)finish()});await pg.waitForTimeout(1500);await shot('12_post_match');await shot('12_post_match_full',true);
console.log(errs.slice(0,3));process.exit(0)})().catch(e=>{console.log('E',e.message);process.exit(1)});
