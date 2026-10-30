// v256 버그 3건 재현·수정 확인: 시작 화면 사진 토글 / 선수 면담 시트 / 감독 탭 '감독' 칩
const {chromium}=require('playwright');const HTML=process.env.HTML;
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis/,r=>r.abort());await pg.goto('file://'+HTML);await pg.waitForTimeout(500);
const R={};
// 1. 시작 화면 토글
R.tog_count=await pg.locator('[data-imgtog]').count();
if(R.tog_count){const before=await pg.evaluate(()=>IMG.on);await pg.click('[data-imgtog]');R.tog_changed=(await pg.evaluate(()=>IMG.on))!==before;await pg.click('[data-imgtog]')}
// 2. 면담 시트
await pg.evaluate(()=>{UI.mode='club';UI.nm='t';startGame(LIGA[0]);render()});await pg.waitForTimeout(300);
const pid=await pg.evaluate(()=>{const p=Object.values(S.ps?{}:{});const id=squadOf(S.club)[0].id;talkSheet(id);return id});
const h0=await pg.evaluate(id=>(S.ps[id]||{}).happy??null,pid);const e0=errs.length;
await pg.click('[data-talk="encourage"]');await pg.waitForTimeout(200);
R.talk={pid,happy_before:h0,happy_after:await pg.evaluate(id=>(S.ps[id]||{}).happy??null,pid),nan_entry:await pg.evaluate(()=>'NaN' in S.ps),new_errors:errs.slice(e0)};
// 3. 감독 탭 칩
await pg.evaluate(()=>{document.querySelector('.sheet [data-close]')?.click();UI.cv=undefined;UI.tab='career';render()});await pg.waitForTimeout(200);
const cnt=()=>pg.evaluate(()=>({analysis:[...document.querySelectorAll('h2')].some(h=>h.textContent==='분석실'),sections:document.querySelectorAll('main section').length,btns:document.querySelectorAll('main button').length}));
R.career_default=await cnt();await pg.click('[data-hof="mgr"]');await pg.waitForTimeout(200);R.career_mgr=await cnt();
R.errors=errs.slice(0,5);console.log(JSON.stringify(R,null,1));await b.close()})();
