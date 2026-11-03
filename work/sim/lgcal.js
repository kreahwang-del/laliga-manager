// v285 리그 보정(ENGF3) 측정: F='{"US":1.1}'로 계수 덮어쓰기, 전체 슈팅(ts)도 기록
// v272 리그 수준 보정 측정: 리그별 AI끼리 엔진 경기 득점·xG·GK선방/공격수 슈팅 평균(LGC) + 빠른 모델(LGP, 실제 리그 득점에 맞춘 값) 목표치
// 사용: HTML=.. LGS=US,CN,ES N=40 OV='{"lgN":.6,...}' OUT=.. node lgnorm.js
const {chromium}=require('playwright');const fs=require('fs');
const LGS=(process.env.LGS||'US,CN,EN,ES,DE,IT,FR').split(','),N=+(process.env.N||40),OV=JSON.parse(process.env.OV||'{}'),FAST=+(process.env.FAST||0);
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1000);
if(process.env.F)await pg.evaluate(j=>{window.__F=JSON.parse(j)},process.env.F);if(process.env.SAVE)await pg.evaluate(sv=>{window.__SV=sv},fs.readFileSync(process.env.SAVE,'utf8'));
await pg.evaluate(OV=>{if(window.__SV){S=JSON.parse(window.__SV);devLoad();careerLoad();SQC=null}else{UI.mode='club';UI.nm='t';startGame(LIGA[0]);goUnemployed('t',0)}save=()=>{};window.__OV=OV;if(window.__F)Object.assign(ENGF3,window.__F);const _c=E4.createMatch;E4.createMatch=(H,A,o)=>_c(H,A,Object.assign({},o,{cfg:Object.assign({},(o&&o.cfg)||{},window.__OV)}))},OV);
const out=[];
for(const lg of LGS){const r=await pg.evaluate(([lg,N,FAST])=>{const C=CLUBS.filter(c=>c&&c.lg===lg&&c.i!==S.club);if(C.length<4)return null;let x=17;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};
  const R={lg,ts:0,n:0,g:0,xg:0,sv:0,sh:0,a:0,d:0,fg:0,fn:0};
  for(let k=0;k<N;k++){const h=C[(k*7)%C.length],a=C[(k*11+3)%C.length];if(h===a)continue;x=(k*7919+31)%2147483646+1;const H=teamFor(h.i),A=teamFor(a.i);const m=runMatch(H,A,{});while(!m.done)m.step();const st=m.st;
   R.n++;R.ts+=st.sh[0]+st.sh[1];R.g+=st.sc[0]+st.sc[1];R.xg+=st.xg[0]+st.xg[1];R.d+=st.sc[0]===st.sc[1];if(st.lgc){R.sv+=st.lgc.sv;R.sh+=st.lgc.sh;R.a+=st.lgc.a}}
  if(FAST){window.EA_OFF=true;for(let k=0;k<FAST;k++){const h=C[(k*5)%C.length],a=C[(k*9+2)%C.length];if(h===a)continue;const f={h:h.i,a:a.i,d:S.date,lg};try{fastMatch(f);if(f.res){R.fg+=f.res.sc[0]+f.res.sc[1];R.fn++}}catch(e){}}window.EA_OFF=false}
  return R},[lg,N,FAST]);
 if(!r)continue;const o={ts:+(r.ts/r.n).toFixed(1),lg,n:r.n,g:+(r.g/r.n).toFixed(2),xg:+(r.xg/r.n).toFixed(2),draw:+(r.d/r.n).toFixed(3),sv:+(r.sv/r.n).toFixed(2),sh:+(r.sh/r.n).toFixed(2),adj:+(r.a/r.n).toFixed(2),fast:r.fn?+(r.fg/r.fn).toFixed(2):null};out.push(o);console.log(JSON.stringify(o))}
fs.writeFileSync(process.env.OUT,out.map(o=>JSON.stringify(o)).join('\n')+'\n');if(errs.length)console.error('ERR',errs.slice(0,3));process.exit(0)})().catch(e=>{console.log('E',e.message);process.exit(1)});
