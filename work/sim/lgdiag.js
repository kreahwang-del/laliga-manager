// MLS 득점 차이 진단: 세이브 상태 vs 새 게임 상태에서 같은 대진 AI끼리 경기 → 득점·xG·LGC·선발 평균 OVR·컨디션·체력·슈팅 유형
const {chromium}=require('playwright');const fs=require('fs');const N=+(process.env.N||40),MODE=process.env.MODE;
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1200);
if(MODE==='save')await pg.evaluate(sv=>{window.__SV=sv},fs.readFileSync(process.env.SAVE,'utf8'));
const r=await pg.evaluate(([N,MODE])=>{if(MODE==='save'){S=JSON.parse(window.__SV);devLoad();careerLoad();SQC=null}else{UI.mode='club';UI.nm='t';startGame(LIGA[0]);goUnemployed('t',0)}save=()=>{};
 const C=CLUBS.filter(c=>c&&c.lg==='US'&&c.i!==S.club);let x=5;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};const A={n:0,g:0,xg:0,ovr:0,cond:0,fit:0,sv:0,sh:0,ty:{},sot:0,shots:0,pre:{}};
 for(let k=0;k<N;k++){const h=C[(k*7)%C.length],a=C[(k*11+3)%C.length];if(h===a)continue;x=(k*7919+31)%2147483646+1;const H=teamFor(h.i),Aw=teamFor(a.i);
  [H,Aw].forEach(T=>{A.pre[T.preset]=(A.pre[T.preset]||0)+1;T.xi.forEach(p=>{A.ovr+=p.ovr/22;A.cond+=(p.cond??2)/22;A.fit+=(p.fit??100)/22})});
  const m=runMatch(H,Aw,{});while(!m.done)m.step();const st=m.st;A.n++;A.g+=st.sc[0]+st.sc[1];A.xg+=st.xg[0]+st.xg[1];A.sot+=st.sot[0]+st.sot[1];A.shots+=st.sh[0]+st.sh[1];if(st.lgc){A.sv+=st.lgc.sv;A.sh+=st.lgc.sh}
  st.ev.filter(e=>e.t==='goal').forEach(e=>A.ty[e.type]=(A.ty[e.type]||0)+1)}
 const o={};for(const k of ['g','xg','ovr','cond','fit','sv','sh','sot','shots'])o[k]=+(A[k]/A.n).toFixed(2);o.n=A.n;o.ty=A.ty;o.pre=A.pre;o.engAll=S.engAll;return o},[N,MODE]);
console.log(MODE,JSON.stringify(r));if(errs.length)console.error('ERR',errs.slice(0,3));process.exit(0)})().catch(e=>{console.log('E',e.message);process.exit(1)});
