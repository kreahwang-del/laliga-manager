// v277 시장 밖 판매 → 사전 합의 확인(사용자 세이브 12/16: 시장 닫힘, 1/2 개장)
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1200);
await pg.evaluate(sv=>{window.__SV=sv},fs.readFileSync(process.env.SAVE,'utf8'));
const r=await pg.evaluate(()=>{S=JSON.parse(window.__SV);devLoad();careerLoad();SQC=null;save=()=>{};const p=squadOf(S.club).sort((a,b)=>a.ovr-b.ovr)[0];const to=CLUBS.find(c=>c&&c.lg==='US'&&c.i!==S.club).i;const b0=S.fin.budget;
 completeTransfer(p.id,to,2e6,{cEnd:'2030-06-30',wage:p.wage});const a={win:!!winNow(),club1:clubOf(p.id)===S.club,pend:(S.tfPend||[]).length,budgetSame:S.fin.budget===b0};
 while(!winNow()){S.date=addD(S.date,1)}daily();a.club2=clubOf(p.id)===to;a.pend2=(S.tfPend||[]).length;a.budgetUp=S.fin.budget>b0;a.date=S.date;return a});
console.log(JSON.stringify(r),errs.slice(0,3));process.exit(0)})();
