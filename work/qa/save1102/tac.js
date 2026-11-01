// 세이브 팀(LAFC)으로 남은 리그 일정 엔진 재현: 전술 변형별 승점·xG·상대 맞춤 대비 빈도(같은 시드 짝)
const {chromium}=require('playwright');const fs=require('fs');
const V=JSON.parse(process.env.V);const SEEDS=+(process.env.SEEDS||8);
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1500);
await pg.evaluate(sv=>{window.__SV=sv},fs.readFileSync(process.env.SAVE,'utf8'));
const r=await pg.evaluate(([V,SEEDS])=>{S=JSON.parse(window.__SV);save=()=>{};devLoad();careerLoad();SQC=null;
 const T0=JSON.parse(JSON.stringify(S.tac));const fx=S.fixtures.filter(f=>(f.h===S.club||f.a===S.club)&&!f.res).sort((a,b)=>a.d<b.d?-1:1);const out=[];
 for(const v of V){for(let s=0;s<SEEDS;s++)for(let i=0;i<fx.length;i++){const f=fx[i];S.tac=JSON.parse(JSON.stringify(T0));if(v.pre)S.tac.preset=v.pre;if(v.ti)S.tac.ti=[...v.ti];if(v.ment)S.tac.ment=v.ment;
   let x=(s*7919+i*104729+11)%2147483646+1;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};const d0=S.date;S.date=f.d+'#'+s;
   const H=teamFor(f.h),A=teamFor(f.a);S.date=d0;const me=f.h===S.club?0:1;const op=me?H:A;const m=runMatch(H,A);while(!m.done)m.step();const st=m.st;
   const gf=st.sc[me],ga=st.sc[1-me];out.push({v:v.nm,s,i,r:gf>ga?'W':gf<ga?'L':'D',gf,ga,xf:+st.xg[me].toFixed(2),xa:+st.xg[1-me].toFixed(2),plan:op._plan?1:0,op:op.preset,cnt:(E3.BEATS[op.preset]||[]).includes(v.pre||T0.preset)?1:0})}}
 return out},[V,SEEDS]);
fs.writeFileSync(process.env.OUT,r.map(o=>JSON.stringify(o)).join('\n')+'\n');if(errs.length)console.error(errs.slice(0,3));console.log(r.length);process.exit(0)})().catch(e=>{console.log('E',e.message);process.exit(1)});
