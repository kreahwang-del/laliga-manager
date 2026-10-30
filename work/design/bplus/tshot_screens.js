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
fs.writeFileSync(path.join(OUT,`${TAG}_inv.json`),JSON.stringify({R,errs},null,1));console.log(TAG,'screens',Object.keys(R).length,'errs',errs.length,errs.slice(0,3));await b.close()})();
