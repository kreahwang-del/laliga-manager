// 사용자 세이브(2026-12-16) 검증: v271 빌드에 불러와 상태 요약 + 화면 캡처
const {chromium}=require('playwright');const fs=require('fs');
const HTML=process.env.HTML,SAVE=process.env.SAVE,OUT=process.env.OUT||'/home/claude/work/qa/save1102';
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:412,height:900},deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());
const sv=fs.readFileSync(SAVE,'utf8');await pg.goto('file://'+HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1500);
await pg.evaluate(sv=>{window.__SV=sv},sv);
const info=await pg.evaluate(()=>{S=JSON.parse(window.__SV);save=()=>{};devLoad();careerLoad();SQC=null;render();
 const C=CLUBS[S.club];const t=table();const pos=t.findIndex(r=>r.id===S.club)+1;
 const lgC=t.map(r=>r.id);const str=lgC.map(c=>{const sq=squadOf(c).sort((a,b)=>b.ovr-a.ovr).slice(0,11);return {c,n:CLUBS[c].short,ovr:+(sq.reduce((a,p)=>a+p.ovr,0)/11).toFixed(1),rep:CLUBS[c].rep}}).sort((a,b)=>b.ovr-a.ovr);
 const my=S.fixtures.filter(f=>(f.h===S.club||f.a===S.club)&&f.res);let gf=0,ga=0,xf=0,xa=0;my.forEach(f=>{const m=f.h===S.club?0:1;gf+=f.res.sc[m];ga+=f.res.sc[1-m];if(f.res.xg){xf+=f.res.xg[m];xa+=f.res.xg[1-m]}});
 const lgF=S.fixtures.filter(f=>f.res&&lgC.includes(f.h));const lgG=lgF.reduce((a,f)=>a+f.res.sc[0]+f.res.sc[1],0)/lgF.length;
 const pv=E3.PRESETS[S.tac.preset];
 return {club:C.name,lg:C.lg,rep:C.rep,pos,n:t.length,top:t.slice(0,5).map(r=>[CLUBS[r.id].short,r.p,r.pts,r.gf,r.ga]),me:t[pos-1],strRank:str.findIndex(x=>x.c===S.club)+1,str:str.slice(0,6),myStr:str.find(x=>x.c===S.club),
  gf,ga,xf:+xf.toFixed(1),xa:+xa.toFixed(1),games:my.length,lgGoals:+lgG.toFixed(2),tac:{pre:S.tac.preset,ti:S.tac.ti,base:pv,ment:S.tac.ment,form:S.tac.form,fam:S.tac.fam,focus:S.tac.focus},
  study:typeof aigStudyLv==='function'?Object.keys(E3.PRESETS).map(k=>[k,aigStudyLv(k)]):null,aigStudy:S.aigStudy||null,
  me2:S.me,cups:JSON.stringify(S.cups).slice(0,300),eu:JSON.stringify(S.eu).slice(0,300),budget:S.fin.budget,
  sm:E3.styleMap(S.xi.map(pl).filter(Boolean)),inbox:S.inbox.slice(0,8).map(m=>m.t||m.title||m.s)}});
fs.writeFileSync(OUT+'/info.json',JSON.stringify(info,null,1));
for(const [nm,fn] of [['home',"UI.tab='home'"],['tac',"UI.tab='tactics'"],['table',"UI.tab='table'"],['squad',"UI.tab='squad'"]]){try{await pg.evaluate(f=>{eval(f);render()},fn);await pg.waitForTimeout(500);await pg.screenshot({path:OUT+'/'+nm+'.png',fullPage:false})}catch(e){console.log(nm,e.message)}}
console.log(JSON.stringify(info,null,1).slice(0,4000));if(errs.length)console.error('ERR',errs.slice(0,5));process.exit(0)})().catch(e=>{console.log('E',e.message);process.exit(1)});
