// 긴 골키퍼 백패스 측정: AI끼리 경기, 경기 분석 패스 기록(A.P: 우리 골문 x=0 기준)에서 우리 박스 안 끝점 패스(=GK 쪽)를 시작 거리별로 집계
const {chromium}=require('playwright');const N=+(process.env.N||40);
(async()=>{const b=await chromium.launch();const pg=await b.newPage();await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1200);
console.log(await pg.evaluate(N=>{UI.mode='club';UI.nm='t';startGame(LIGA[0]);goUnemployed('t',0);save=()=>{};let x=21;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};
 const C=CLUBS.filter(c=>c&&['ES','EN','DE','IT','FR'].includes(c.lg));const bands={'<20m':0,'20-30m':0,'30-40m':0,'40m+':0};let tot=0,pass=0,teams=0,gkRecv=0;
 for(let k=0;k<N;k++){const h=C[(k*7)%C.length],a=C[(k*13+5)%C.length];if(h===a)continue;const m=runMatch(teamFor(h.i),teamFor(a.i),{record:true});while(!m.done)m.step();const A=m.st.ana;if(!A)continue;teams+=2;
  for(const id in A.P)for(const p of A.P[id]){pass++;const [x0,y0,x1,y1,ok]=p;if(ok&&x1<6.5&&y1>24&&y1<44){gkRecv++;const d=Math.hypot(x0-x1,y0-y1);const bd=d<20?'<20m':d<30?'20-30m':d<40?'30-40m':'40m+';bands[bd]++}}}
 const per=v=>+(v/teams).toFixed(2);return JSON.stringify({teams,passPerTeam:per(pass),gkRecvPerTeam:per(gkRecv),bands:Object.fromEntries(Object.entries(bands).map(([k,v])=>[k,per(v)]))})},N));process.exit(0)})();
