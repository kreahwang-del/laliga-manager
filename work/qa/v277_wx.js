// v277 이적 예산↔연봉 한도 전환, 협상 화면 버튼, 계속 바 숨김 확인(사용자 세이브 2027-07-22)
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1200);
await pg.evaluate(sv=>{window.__SV=sv},fs.readFileSync(process.env.SAVE,'utf8'));
const r=await pg.evaluate(()=>{S=JSON.parse(window.__SV);devLoad();careerLoad();SQC=null;save=()=>{};UI.tab='home';render();const c=S.club;const o={cap0:CLUBS[c].wageCap,b0:S.fin.budget,lim:wxLim()};
 finSheet();o.card=!!document.querySelector('.wxc');o.oldGone=![...document.querySelectorAll('#scrim .lbl')].some(l=>/연봉 총액 한도 늘리기/.test(l.textContent));
 document.querySelector('[data-wx="10"]').click();o.cap1=CLUBS[c].wageCap;o.b1=S.fin.budget;document.querySelector('[data-wx="-5"]').click();o.cap2=CLUBS[c].wageCap;o.b2=S.fin.budget;closeSheet();
 const t=CLUBS.filter(x=>x&&['EN','ES','DE'].includes(x.lg)).map(x=>squadOf(x.i)).flat().filter(p=>p.ovr>=85&&p.wage>15e6)[0];o.target=t&&[t.name,t.wage];
 try{offerSheet(t.id);UI.off=UI.off||{};UI.off.wage=t.wage;closeSheet();offerSheet(t.id)}catch(e){o.oerr=e.message}o.needBtn=!!document.querySelector('[data-wxneed]');o.warn=(document.querySelector('#scrim .warnline')||{}).textContent;
 S.fin.ps.done=false;finSeasonEnd();o.capAfterSeason=CLUBS[c].wageCap;o.wcx=S.wcx;return o});
await pg.evaluate(()=>{closeSheet();UI.tab='home';render();scrollTo(0,0)});await pg.mouse.wheel(0,900);await pg.waitForTimeout(400);r.hidden=await pg.evaluate(()=>document.querySelector('.go').classList.contains('gohide'));await pg.mouse.wheel(0,-200);await pg.waitForTimeout(400);r.shown=!(await pg.evaluate(()=>document.querySelector('.go').classList.contains('gohide')));
console.log(JSON.stringify(r,null,1),errs.slice(0,3));process.exit(0)})();
