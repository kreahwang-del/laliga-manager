// v272 UI 확인: ① 다음 지시까지 빨리 감기 ② 실시간 선수 분석 창 열린 채 지시 장면 → 지시 창 유지 ③ 분석 창 탭별 높이 동일
const {chromium}=require('playwright');const fs=require('fs');const H=process.env.HTML,OUT=process.env.OUT;
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+H,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(800);
await pg.evaluate(()=>{let x=77;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};UI.mode='club';UI.nm='t';startGame(LIGA[0]);S.decT=0;const fx=S.fixtures.filter(f=>!f.res&&(f.h===S.club||f.a===S.club)).sort((a,b)=>a.d<b.d?-1:1)[0];S.date=fx.d;startMatch(fx);M.speed=.5});
await pg.waitForTimeout(1500);
// 하프타임 등 시트 닫기 도우미
const closeNonDec=()=>pg.evaluate(()=>{const sh=document.querySelector('#scrim .sheet');if(sh&&!sh.querySelector('[data-mo^="dec:"]')&&!sh.querySelector('.livetag')&&M.paused&&!M.done){const b2=sh.querySelector('[data-mo="resume"],[data-close],button.x');if(b2)b2.click()}});
const r={};r.btn0=await pg.evaluate(()=>document.getElementById('mff')?.textContent);await pg.screenshot({path:OUT+'/ff_btn.png'});
const t0=Date.now();const m0=await pg.evaluate(()=>M.m.min);await pg.click('#mff');r.btnFF=await pg.evaluate(()=>document.getElementById('mff')?.textContent);
let got=null;while(Date.now()-t0<60000){await pg.waitForTimeout(200);const s=await pg.evaluate(()=>({dec:!!document.querySelector('#scrim [data-mo^="dec:"]'),min:M.m.min,ff:!!M.ff,done:M.done,sheet:document.querySelector('#scrim h3')?.textContent||null}));if(s.dec||s.done||(!s.ff&&s.sheet)){got=s;break}}
r.ff={from:m0,stop:got,sec:((Date.now()-t0)/1000).toFixed(1)};await pg.screenshot({path:OUT+'/ff_stop.png'});
// ② 지시 창 떠 있을 때 고르고 → 실시간 분석 열기 → 다음 지시까지 빨리 감기
if(got&&got.dec)await pg.evaluate(()=>document.querySelector('#scrim [data-mo^="dec:"]').click());
await pg.waitForTimeout(500);await closeNonDec();
await pg.evaluate(()=>{UI.mpst='0';mpst()});await pg.waitForTimeout(400);
const id=await pg.evaluate(()=>{const T=M.m.T[M.me];const p=T.xi.find(p=>M.m.st.ana&&M.m.st.ana.H[p.id]);if(p)anaSheet(p.id,'live');return p&&p.id});
r.anaOpen=await pg.evaluate(()=>!!document.querySelector('#scrim .livetag'));
// 탭별 높이
const hs={};for(const t of ['heat','pass','shot','def','drib']){await pg.evaluate(t=>{const b=document.querySelector(`[data-anatab="${t}"]`);b&&b.click()},t);await pg.waitForTimeout(150);hs[t]=await pg.evaluate(()=>Math.round(document.querySelector('#scrim .sheet').getBoundingClientRect().height))}
r.heights=hs;await pg.screenshot({path:OUT+'/ana_pass.png'});
// 분석 창 연 채로 빨리 감기 버튼은 창에 가려지므로 내부 함수로 진행 → 지시 장면 대기(2초 갱신이 덮어쓰는지)
await pg.evaluate(()=>{if(M.paused){M.paused=false}ffStart()});
let st2=null;const t1=Date.now();while(Date.now()-t1<120000){await pg.waitForTimeout(300);const s=await pg.evaluate(()=>({pend:!!(M.m.st.pendingDec&&!M.m.st.pendingDec.done),dec:!!document.querySelector('#scrim [data-mo^="dec:"]'),live:!!document.querySelector('#scrim .livetag'),done:M.done,min:M.m.min}));if(s.pend){await pg.waitForTimeout(4500);st2=await pg.evaluate(()=>({dec:!!document.querySelector('#scrim [data-mo^="dec:"]'),live:!!document.querySelector('#scrim .livetag'),min:M.m.min}));break}if(s.done)break}
r.decAfterAna=st2;await pg.screenshot({path:OUT+'/dec_after_ana.png'});
console.log(JSON.stringify(r,null,1));if(errs.length)console.error('ERR',errs.slice(0,5));process.exit(0)})().catch(e=>{console.log('E',e.message);process.exit(1)});
