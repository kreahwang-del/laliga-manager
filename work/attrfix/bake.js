// tx_final.json 변환을 페이지에서 적용해 선수별 변화량(Δ)을 뽑는다 → bake.py가 src/data/G/players.json 원본 값에 더함
// 사용: HTML=.. TX="$(cat work/attrfix/tx_final.json)" OUT=work/attrfix/delta.json node work/attrfix/bake.js
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const pg=await b.newPage();await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1000);
await pg.evaluate(()=>{UI.mode='club';UI.nm='t';startGame(LIGA[0]);window.__B0={};const K=['shoot','pass','drib','cross','tackle','posit','offball','aerial','pace','stamina','gk_save','gk_air','gk_sweep','gk_dist','str','comp','fk','pen','ovr'];window.__K=K;for(const id in BASE){const p=BASE[id];__B0[id]=K.map(k=>p[k])}});
const rep=await pg.evaluate(([src,tx])=>(new Function('TX',src))(tx),[fs.readFileSync(__dirname+'/tx_page.js','utf8'),JSON.parse(process.env.TX)]);
const d=await pg.evaluate(()=>{const o={};for(const id in BASE){const p=BASE[id],a=__B0[id];const dd=__K.map((k,i)=>typeof p[k]==='number'&&typeof a[i]==='number'?+(p[k]-a[i]).toFixed(3):0);if(dd.some(x=>Math.abs(x)>1e-6))o[id]=dd}return o});
fs.writeFileSync(process.env.OUT,JSON.stringify({K:await pg.evaluate(()=>__K),rep,d}));console.log('players changed',Object.keys(d).length);await b.close()})();
