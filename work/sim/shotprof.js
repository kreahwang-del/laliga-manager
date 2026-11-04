// 엔진 근본 보정 1단계: 슈팅 종류·위치별 xG(모델)·실제 결과 실측. 리그 계수(ENGF3) 1로 고정(F 기본 전부 1)
// 사용: HTML=.. LGS=ES,EN N=60 OUT=.. [SAVE=..] [OV='{"d5ShB":-.5}'(엔진 CFG 덮어쓰기)] node work/sim/shotprof.js
const {chromium}=require('playwright');const fs=require('fs');
const LGS=(process.env.LGS||'ES').split(','),N=+(process.env.N||40);
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1000);
if(process.env.SAVE)await pg.evaluate(sv=>{window.__SV=sv},fs.readFileSync(process.env.SAVE,'utf8'));
await pg.evaluate(()=>{if(window.__SV){S=JSON.parse(window.__SV);devLoad();careerLoad();SQC=null}else{UI.mode='club';UI.nm='t';startGame(LIGA[0]);goUnemployed('t',0)}save=()=>{};for(const k in ENGF3)ENGF3[k]=1});
if(process.env.PRE)await pg.evaluate(src=>(new Function(src))(),process.env.PRE);/* PRE: 페이지 안 임의 설정(예: LG_DNA.DK[0]=2) */
if(process.env.TX){const rep=await pg.evaluate(([src,tx])=>(new Function('TX',src))(tx),[fs.readFileSync(__dirname+'/../attrfix/tx_page.js','utf8'),JSON.parse(process.env.TX)]);console.log('TX',JSON.stringify(rep))}
const OV=JSON.parse(process.env.OV||'{}');await pg.evaluate(OV=>{const _c=E4.createMatch;E4.createMatch=(H,A,o)=>_c(H,A,Object.assign({},o,{cfg:Object.assign({},(o&&o.cfg)||{},OV)}))},OV);
const out={};
for(const lg of LGS){const r=await pg.evaluate(([lg,N,PSTAT])=>{const C=CLUBS.filter(c=>c&&c.lg===lg&&c.i!==S.club);if(C.length<4)return null;let x=17;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};
  const PST=PSTAT,PS={};const R={ps:PS,n:0,g:0,xg:0,sh:0,sot:0,blk:0,fo:0,yc:0,rc:0,hw:0,dr:0,gd:0,ty:{},dbg:{}};
  for(let k=0;k<N;k++){const h=C[(k*7)%C.length],a=C[(k*11+3)%C.length];if(h===a)continue;x=(k*7919+31)%2147483646+1;const TH=teamFor(h.i),TA=teamFor(a.i);if(PST){[TH,TA].forEach(T=>T.xi.forEach(q=>{if(q){const o=PS[q.name]||(PS[q.name]={st:0,g:0,c:CLUBS[T.club].name});o.st++}}))}const m=runMatch(TH,TA,{});while(!m.done)m.step();const st=m.st;
   if(PST)for(const e of m.st.ev)if(e.t==='goal'&&!e.og&&PS[e.p])PS[e.p].g++;R.n++;R.g+=st.sc[0]+st.sc[1];R.xg+=st.xg[0]+st.xg[1];R.sh+=st.sh[0]+st.sh[1];R.sot+=st.sot[0]+st.sot[1];R.blk+=st.blk[0]+st.blk[1];R.fo+=(st.fouls||[0,0])[0]+(st.fouls||[0,0])[1];R.hw+=st.sc[0]>st.sc[1];R.dr+=st.sc[0]===st.sc[1];R.gd+=Math.abs(st.sc[0]-st.sc[1]);for(const e of st.ev){if(e.t==='yellow')R.yc++;else if(e.t==='red')R.rc++}
   for(const e of st.ev){if(!['goal','save','miss','block'].includes(e.t))continue;const t=e.type||'?';const o=R.ty[t]||(R.ty[t]={n:0,goal:0,save:0,miss:0,block:0,xg:0});o.n++;o[e.t]++;o.xg+=e.xg||0}
   for(const k in (st.dbg||{})){const v=st.dbg[k];if(typeof v==='number')R.dbg[k]=(R.dbg[k]||0)+v}}
  return R},[lg,N,!!process.env.PSTAT]);if(!r)continue;out[lg]=r;console.log(lg,r.n,(r.g/r.n).toFixed(2),(r.xg/r.n).toFixed(2),(r.sh/r.n).toFixed(1))}
fs.writeFileSync(process.env.OUT,JSON.stringify(out));if(errs.length)console.error('ERR',errs.slice(0,3));process.exit(0)})().catch(e=>{console.log('E',e.message);process.exit(1)});
