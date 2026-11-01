// '연구당함' 측정: 사용자 팀 리그 일정을 엔진으로 직접 치름(AI 맞춤 대비 aiPlan 포함). 조건: 구단(CLUB 이름) × 전략(fixed=한 성향 고집 / rotate=매 경기 3성향 순환) × 연구(on/off)
// 경기별 재시드(on/off 짝 비교). 기록: 결과·사용자 성향·연구 단계·상대 대비(_plan) 여부
const {chromium}=require('playwright');const fs=require('fs');
const HTML=process.env.HTML,CLUB=process.env.CLUB||'Real Madrid',STRAT=process.env.STRAT||'fixed',STUDY=+(process.env.STUDY||0),SEASONS=+(process.env.SEASONS||4),SEED=+(process.env.SEED||1),OUT=process.env.OUT,PRE=process.env.PRE||'';
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());
await pg.goto('file://'+HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(600);
const r=await pg.evaluate(([CLUB,STRAT,STUDY,SEASONS,SEED,PRE])=>{UI.mode='club';UI.nm='t';const c=CLUBS.find(x=>x&&x.name===CLUB).i;startGame(c);save=()=>{};
 const fxs=S.fixtures.filter(f=>f.h===S.club||f.a===S.club).sort((a,b)=>a.d<b.d?-1:1);const P0=PRE||S.tac.preset;const ROT=['측면 공략','티키타카','게겐프레싱'];const out=[];let k=0;
 for(let s=0;s<SEASONS;s++){S.aigStudy=null;S.aigHist=[];for(let i=0;i<fxs.length;i++,k++){const f=fxs[i];S.date=f.d;const pre=STRAT==='fixed'?P0:ROT[i%3];S.tac.preset=pre;S.tac.ti=[...E3.PRESETS[pre]];
   let x=(SEED*7919+k*104729)%2147483646+1;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};const dSav=S.date;S.date=f.d+'#'+s;/* 시즌별 다른 시드(aiPlan hsh) */
   const H=teamFor(f.h),A=teamFor(f.a);const me=f.h===S.club?0:1;const lv=aigStudyLv(pre);const m=runMatch(H,A);while(!m.done)m.step();const res=m.finalize();S.date=dSav;const op=me===0?A:H;
   const g=[res.sc[me],res.sc[1-me]];const rr=g[0]>g[1]?'W':g[0]<g[1]?'L':'D';if(STUDY)aigStudyUpdate(pre,rr);
   out.push({s,i,pre,lv,r:rr,gf:g[0],ga:g[1],plan:op._plan?1:0,planF:op._planF?1:0,mk:op._planM?1:0,xg:[+res.stats.xg[me].toFixed(2),+res.stats.xg[1-me].toFixed(2)]})}}
 return out},[CLUB,STRAT,STUDY,SEASONS,SEED,PRE]);
fs.writeFileSync(OUT,r.map(o=>JSON.stringify(o)).join('\n')+'\n');if(errs.length)console.error(errs.slice(0,3));console.log(OUT,r.length);process.exit(0)})().catch(e=>{console.log('E',e.message);process.exit(1)})
