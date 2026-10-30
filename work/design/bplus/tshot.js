// B+ 테마 적용 전후 비교: 화면별 스크린샷 + 버튼 수·data-* 이름·글자 수·가로 넘침
// 사용: HTML=<빌드> TAG=<이름> OUT=<폴더> W=390 node tshot.js
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const HTML=process.env.HTML,TAG=process.env.TAG||'x',OUT=process.env.OUT,W=+(process.env.W||390);
const FD=process.env.FONTDIR||'';
const FONTCSS=FD?`@font-face{font-family:'Big Shoulders Display';font-weight:700;src:url(file://${FD}/big-shoulders-display-latin-700-normal.woff2)}
@font-face{font-family:'Big Shoulders Display';font-weight:800;src:url(file://${FD}/big-shoulders-display-latin-800-normal.woff2)}
@font-face{font-family:'Big Shoulders Display';font-weight:900;src:url(file://${FD}/big-shoulders-display-latin-900-normal.woff2)}
@font-face{font-family:'Noto Sans KR';font-weight:400;src:local('Noto Sans CJK KR')}
@font-face{font-family:'Noto Sans KR';font-weight:500;src:local('Noto Sans CJK KR Medium'),local('Noto Sans CJK KR')}
@font-face{font-family:'Noto Sans KR';font-weight:700;src:local('Noto Sans CJK KR Bold'),local('Noto Sans CJK KR')}
@font-face{font-family:'Noto Sans KR';font-weight:900;src:local('Noto Sans CJK KR Black'),local('Noto Sans CJK KR')}`:'';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const pg=await b.newPage({viewport:{width:W,height:844}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic/,r=>r.abort());await pg.goto('file://'+HTML);if(FONTCSS)await pg.addStyleTag({content:FONTCSS});await pg.waitForTimeout(700);
const R={};
const snap=async(name,full=true)=>{await pg.waitForTimeout(250);
  R[name]=await pg.evaluate(()=>{const root=document.querySelector('#scrim .sheet')||document.body;const bs=[...root.querySelectorAll('button')].filter(b=>b.offsetParent!==null||b.closest('#match'));
    const attrs=new Set();root.querySelectorAll('*').forEach(e=>{for(const a of e.attributes)if(a.name.startsWith('data-'))attrs.add(a.name)});
    const over=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1&&!e.closest('.chips,.tabs,.tbl-wrap,.pstw,.bench,.sorts,[style*="overflow"]')}).slice(0,6).map(e=>(e.className||e.tagName)+':'+Math.round(e.getBoundingClientRect().right));
    return {btn:bs.length,data:[...attrs].sort(),txt:root.innerText.replace(/\s+/g,'').length,docW:document.documentElement.scrollWidth,over}});
  await pg.screenshot({path:path.join(OUT,`${TAG}_${name}.png`),fullPage:full})};
await snap('01_start');
await pg.evaluate(()=>{let x=33;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};UI.mode='club';UI.nm='황감독';startGame(LIGA[0]);render()});
const navs=await pg.evaluate(()=>[...document.querySelectorAll('.nav button')].map(b=>b.innerText.trim()));
for(let i=0;i<navs.length;i++){await pg.evaluate(i=>{document.querySelectorAll('.nav button')[i].click();window.scrollTo(0,0)},i);await snap(`02_tab${i}_${navs[i]}`)}
await pg.evaluate(()=>{document.querySelector('.nav button').click();const id=squadOf(S.club)[0].id;playerSheet(id)});await snap('03_player',false);
await pg.evaluate(()=>{document.querySelector('#scrim [data-close]')?.click();const fx=S.fixtures.filter(f=>!f.res&&(f.h===S.club||f.a===S.club)).sort((a,b)=>a.d<b.d?-1:1)[0];S.date=fx.d;window.decWant=()=>false;startMatch(fx);M.speed=16});
const t0=Date.now();while(Date.now()-t0<240000){await pg.waitForTimeout(250);const s=await pg.evaluate(()=>{const sh=document.querySelector('#scrim .sheet');if(M&&M.paused&&sh){const b2=sh.querySelector('[data-mo="resume"],[data-close],button.x');if(b2)b2.click()}return {min:M.m.min,done:M.done}});if(s.min>=55||s.done)break}
await pg.evaluate(()=>{M.speed=0;if(typeof pause==='function')try{pause()}catch(e){}});await snap('04_match60',false);
await pg.evaluate(()=>{M.speed=16;if(typeof resume==='function')try{resume()}catch(e){}});
const t1=Date.now();while(Date.now()-t1<240000){await pg.waitForTimeout(300);const d=await pg.evaluate(()=>{const sh=document.querySelector('#scrim .sheet');if(M&&M.paused&&sh&&!M.done){const b2=sh.querySelector('[data-mo="resume"],[data-close],button.x');if(b2)b2.click()}return M.done});if(d)break}
await pg.waitForTimeout(800);await snap('05_match_end',false);
await pg.evaluate(()=>{const R=S.reports&&S.reports[0];if(R)reportSheet(R)});await snap('06_report',false);
fs.writeFileSync(path.join(OUT,`${TAG}_inv.json`),JSON.stringify({R,errs},null,1));console.log(TAG,'screens',Object.keys(R).length,'errs',errs.length,errs.slice(0,3));await b.close()})();
