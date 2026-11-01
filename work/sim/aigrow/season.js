// AI 성장 장치 다시즌 측정: 무소속(우리 경기 없음)으로 라리가 시즌을 '계속' 진행 → 시즌마다 구단별 전술 성향·대형·순위·승점·평판·감독 기록
// 사용: HTML=.. SEASONS=3 SEED=1 OUT=.. OPT='{"grow":1,...}' node season.js
const {chromium}=require('playwright');const fs=require('fs');
const HTML=process.env.HTML,SEASONS=+(process.env.SEASONS||2),SEED=+(process.env.SEED||1),OUT=process.env.OUT,OPT=JSON.parse(process.env.OPT||'{}'),USER=process.env.USER_TAC||'';
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());
await pg.goto('file://'+HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(600);
await pg.evaluate(([SEED,OPT])=>{let x=SEED*7919+13;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};window.AIG_OPT=OPT;UI.mode='club';UI.nm='t';startGame(LIGA[LIGA.length-1]);S.engAll=false;goUnemployed('test',0);S.inbox.forEach(m=>m.read=true);save=()=>{};},[SEED,OPT]);
fs.writeFileSync(OUT,'');const t0=Date.now();let lastSeason=null;
for(let it=0;it<5000;it++){
  const st=await pg.evaluate(async()=>{S.inbox.forEach(m=>{m.read=true});S.pendJob=null;advance();await new Promise(r=>{const iv=setInterval(()=>{if(!document.querySelector('.busy')){clearInterval(iv);r()}},50)});S.inbox.forEach(m=>{m.read=true;if(m.type==='job'&&!m.done)m.done=true});
    return {d:S.date,season:S.season,done:!!S.seasonDone}});
  if(st.done&&lastSeason!==st.season){lastSeason=st.season;
    const rec=await pg.evaluate(()=>{const t=table();return {season:S.season,rows:t.map((r,i)=>{const c=r.id;const tac=S.aiTac&&S.aiTac[c];const m=typeof mgrOf==='function'?mgrOf(c):null;return {c,n:CLUBS[c].short,pos:i+1,pts:r.pts,gd:r.gf-r.ga,rep:CLUBS[c].rep,xp:S.exp&&S.exp[c]?S.exp[c].xp:null,ep:S.exp&&S.exp[c]?S.exp[c].ep:null,pre:tac?tac.preset:null,form:tac&&tac.form?tac.form.base:null,mg:m?m.n:null,mrep:m?m.rep:null}})}});
    fs.appendFileSync(OUT,JSON.stringify(rec)+'\n');console.log('season',rec.season,'done',((Date.now()-t0)/60000).toFixed(1),'min');
    if((lastSeason-2026+1)>=SEASONS)break}
}
if(errs.length)console.error(errs.slice(0,5));process.exit(0)})().catch(e=>{console.log('E',e.message);process.exit(1)})
