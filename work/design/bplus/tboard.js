const {chromium}=require('playwright');const FD=process.env.FD,SP=process.env.SP;
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:360,height:740}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic/,r=>r.abort());await pg.goto('file://'+process.env.HTML);
await pg.addStyleTag({content:[700,800,900].map(w=>`@font-face{font-family:'Big Shoulders Display';font-weight:${w};src:url(file://${FD}/big-shoulders-display-latin-${w}-normal.woff2)}`).join('')+`@font-face{font-family:'Noto Sans KR';font-weight:400;src:local('Noto Sans CJK KR')}@font-face{font-family:'Noto Sans KR';font-weight:700;src:local('Noto Sans CJK KR Bold')}@font-face{font-family:'Noto Sans KR';font-weight:900;src:local('Noto Sans CJK KR Black')}`});
await pg.waitForTimeout(400);
const cases=await pg.evaluate(()=>{UI.mode='club';UI.nm='t';startGame(LIGA[0]);S.fixtures.filter(f=>f.r===1).forEach(f=>f.res={sc:[1,0]});
 const byN=n=>CLUBS.findIndex(c=>c&&c.name===n);const long=CLUBS.map((c,i)=>[c,i]).filter(([c])=>c&&c.name).sort((a,b)=>b[0].name.length-a[0].name.length).slice(0,2).map(x=>x[1]);
 return [[byN('Real Madrid'),byN('Rayo Vallecano'),'white'],[long[0],long[1],'long'],[S.club,LIGA[5],'rank']]});
for(const [h,a,tag] of cases){if(h<0||a<0){console.log('skip',tag);continue}
 await pg.evaluate(([h,a])=>{const old=document.getElementById('match');if(old)old.remove();if(window.M)M.done=true;const f=S.fixtures.find(x=>x.r===2&&(x.h===S.club||x.a===S.club));const fx=Object.assign({},f,{h,a});startMatch(fx);M.speed=0.01},[h,a]);
 await pg.waitForTimeout(500);const info=await pg.evaluate(()=>({names:[...document.querySelectorAll('#match .board .team')].map(t=>t.innerText.replace(/\n/g,'/')),mrkH:[...document.querySelectorAll('#match .mrk')].map(e=>Math.round(e.getBoundingClientRect().height)),hc:getComputedStyle(document.getElementById('match')).getPropertyValue('--hc'),ac:getComputedStyle(document.getElementById('match')).getPropertyValue('--ac')}));
 console.log(tag,JSON.stringify(info));await pg.screenshot({path:`${SP}/s4/board_${tag}.png`,clip:{x:0,y:0,width:360,height:150}})}
console.log(errs.slice(0,3));await b.close()})();
