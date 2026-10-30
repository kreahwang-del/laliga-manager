// v256 승부수 UI 플레이스루: 79분 열세 강제 → 승부수 시트 → 공중볼 선택 → 외침 후 강도 유지 → 리포트
const {chromium}=require('playwright');const OUT=process.env.OUT,FD=process.env.FD;
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:360,height:780}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic/,r=>r.abort());await pg.goto('file://'+process.env.HTML);
if(FD)await pg.addStyleTag({content:[700,800,900].map(w=>`@font-face{font-family:'Big Shoulders Display';font-weight:${w};src:url(file://${FD}/big-shoulders-display-latin-${w}-normal.woff2)}`).join('')+`@font-face{font-family:'Noto Sans KR';font-weight:400;src:local('Noto Sans CJK KR')}@font-face{font-family:'Noto Sans KR';font-weight:700;src:local('Noto Sans CJK KR Bold')}@font-face{font-family:'Noto Sans KR';font-weight:900;src:local('Noto Sans CJK KR Black')}`});
await pg.waitForTimeout(400);
await pg.evaluate(()=>{let x=33;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};UI.mode='club';UI.nm='t';startGame(LIGA[0]);const fx=S.fixtures.filter(f=>!f.res&&(f.h===S.club||f.a===S.club)).sort((a,b)=>a.d<b.d?-1:1)[0];S.date=fx.d;
 window.decWant=()=>false;const _cm=checkMoments;checkMoments=(min,st,T,api)=>{if(min===79){const me=M.me;if(st.sc[me]>=st.sc[1-me])st.sc[1-me]=st.sc[me]+1}return _cm(min,st,T,api)};startMatch(fx);M.speed=16});
const R={};const t0=Date.now();
while(Date.now()-t0<400000){await pg.waitForTimeout(200);
 const s=await pg.evaluate(()=>{const sh=document.querySelector('#scrim .sheet');const g=sh&&sh.querySelector('[data-mo="g_air"]');if(g)return {g:1,txt:sh.innerText};if(M&&M.paused&&sh&&!M.done){const b2=sh.querySelector('[data-mo="resume"],[data-close],button.x');if(b2)b2.click()}return {done:M.done,min:M.m.min}});
 if(s.g){R.sheet=s.txt.replace(/\n+/g,' / ');await pg.screenshot({path:OUT+'/gmb_sheet.png'});await pg.evaluate(()=>document.querySelector('[data-mo="g_air"]').click());await pg.waitForTimeout(600);await pg.screenshot({path:OUT+'/gmb_after.png'});
   R.afterPick=await pg.evaluate(()=>{const T=M.m.T[M.me];return {gsx:T.gsx,gmbGsx:T.gmbGsx,gmbRest:T.gmbRest,gmbAir:T.gmbAir,ad:+(T.gmbAirD||0).toFixed(2),feed:[...document.querySelectorAll('#mfd *')].map(e=>e.innerText).filter(t=>/승부수|분석관/.test(t)).slice(0,2)}});
   // 외침(공격적) 후 강도 유지 확인
   await pg.evaluate(()=>{const sh=document.querySelector('#scrim .sheet');if(sh){const b2=sh.querySelector('[data-mo="resume"],[data-close],button.x');if(b2)b2.click()}document.querySelector('[data-act="mshout"]').click()});await pg.waitForTimeout(400);
   await pg.evaluate(()=>{const b=document.querySelector('[data-mo="shout:push"]');if(b&&!b.disabled)b.click()});await pg.waitForTimeout(300);
   R.afterShout=await pg.evaluate(()=>{const T=M.m.T[M.me];return {ment:T.ment,gsx:T.gsx}});
   await pg.evaluate(()=>{M.speed=16;const sh=document.querySelector('#scrim .sheet');if(sh){const b2=sh.querySelector('[data-mo="resume"],[data-close],button.x');if(b2)b2.click()}});}
 if(s.done)break}
await pg.waitForTimeout(800);R.rep=await pg.evaluate(()=>{const R=S.reports&&S.reports[0];if(!R)return null;reportSheet(R);const el=document.querySelector('#scrim .sheet');return el.innerText.split('\n').filter(t=>/승부수|감독 지시/.test(t)).slice(0,4)});
await pg.screenshot({path:OUT+'/gmb_report.png'});R.errs=errs.slice(0,5);console.log(JSON.stringify(R,null,1));await b.close()})();
