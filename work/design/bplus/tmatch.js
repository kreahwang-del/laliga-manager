// B+ 2단계 경기 화면 확인: 골 직후(GOAL 띠)·60분·종료 캡처, 버튼 수·오류 기록
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const HTML=process.env.HTML,OUT=process.env.OUT,TAG=process.env.TAG||'m',FD=process.env.FONTDIR||'',W=+(process.env.W||390);
const FONTCSS=FD?[700,800,900].map(w=>`@font-face{font-family:'Big Shoulders Display';font-weight:${w};src:url(file://${FD}/big-shoulders-display-latin-${w}-normal.woff2)}`).join('')+`@font-face{font-family:'Noto Sans KR';font-weight:400;src:local('Noto Sans CJK KR')}@font-face{font-family:'Noto Sans KR';font-weight:700;src:local('Noto Sans CJK KR Bold')}@font-face{font-family:'Noto Sans KR';font-weight:900;src:local('Noto Sans CJK KR Black')}`:'';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const pg=await b.newPage({viewport:{width:W,height:844}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic/,r=>r.abort());await pg.goto('file://'+HTML);if(FONTCSS)await pg.addStyleTag({content:FONTCSS});await pg.waitForTimeout(500);
await pg.evaluate(()=>{let x=+(window.SEEDX||41);Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};UI.mode='club';UI.nm='황감독';startGame(LIGA[0]);
 const fx=S.fixtures.filter(f=>!f.res&&(f.h===S.club||f.a===S.club)).sort((a,b)=>a.d<b.d?-1:1)[0];S.date=fx.d;startMatch(fx);M.speed=4});
const R={};let shotGoal=false,shot60=false;const t0=Date.now();
while(Date.now()-t0<420000){await pg.waitForTimeout(120);
 const s=await pg.evaluate(()=>{const sh=document.querySelector('#scrim .sheet');if(M&&M.paused&&sh&&!M.done){const b2=sh.querySelector('[data-mo="resume"],[data-close],button.x,[data-mo^="dec:"]');if(b2)b2.click()}
   return {min:M.m.min,done:M.done,goal:!!document.querySelector('.bpgoal'),btn:document.querySelectorAll('#match button').length}});
 if(s.goal&&!shotGoal){await pg.waitForTimeout(500);await pg.screenshot({path:path.join(OUT,TAG+'_goal.png')});shotGoal=true;R.goalMin=s.min}
 if(s.min>=60&&!shot60){await pg.screenshot({path:path.join(OUT,TAG+'_60.png')});shot60=true;R.btn60=s.btn;await pg.evaluate(()=>{M.speed=16})}
 if(s.done)break}
await pg.waitForTimeout(600);await pg.screenshot({path:path.join(OUT,TAG+'_end.png')});
R.board=await pg.evaluate(()=>{const bd=document.querySelector('#match .board');return bd?{w:Math.round(bd.getBoundingClientRect().width),over:[...bd.querySelectorAll('*')].filter(e=>e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).overflow==='visible').length}:null});
R.errs=errs.slice(0,5);console.log(JSON.stringify(R));await b.close()})();
