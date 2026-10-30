// QA v256: MODE=ai (AI끼리) | gmb (80분 1점 열세 강제, 유저 팀 AI 점수상황 로직 없음)
// 경기마다 재시드(짝비교). 대진은 별도 해시로 무작위. OV=JSON → E4 CFG 덮어쓰기(파라미터 스윕)
const {chromium}=require('playwright');const fs=require('fs');
const HTML=process.env.HTML,N=+(process.env.N||300),SEED=+(process.env.SEED||2025),MODE=process.env.MODE||'ai',POL=process.env.POL||'none',
  OV=JSON.parse(process.env.OV||'{}'),OUT=process.env.OUT,CH=+(process.env.CH||50),K0=+(process.env.K0||0);
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis/,r=>r.abort());await pg.goto('file://'+HTML);await pg.waitForTimeout(400);
await pg.evaluate(([OV])=>{UI.mode='club';UI.nm='t';startGame(LIGA[0]);
  if(Object.keys(OV).length){const _c=E4.createMatch;E4.createMatch=(H,A,o)=>_c(H,A,Object.assign({},o,{cfg:Object.assign({},(o&&o.cfg)||{},OV)}))}
  window.__all=CLUBS.filter(c=>c&&['ES','EN','IT','DE','FR'].includes(c.lg));},[OV]);
fs.writeFileSync(OUT,'');
for(let c0=K0;c0<K0+N;c0+=CH){
 const out=await pg.evaluate(([c0,n,SEED,MODE,POL,process_ment])=>{let x=1;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};
  const all=window.__all,R=[];const hs=v=>{v=(v^61)^(v>>>16);v=Math.imul(v,9);v^=v>>>4;v=Math.imul(v,0x27d4eb2d);v^=v>>>15;return v>>>0};
  for(let k=c0;k<c0+n;k++){const hi=hs(SEED*100003+k*2)%all.length;let ai=hs(SEED*100003+k*2+1)%all.length;if(ai===hi)ai=(ai+1)%all.length;
   const h=all[hi],a=all[ai];x=((SEED*7919+k*104729)%2147483646)+1;
   const H=teamFor(h.i),A=teamFor(a.i);let snap=null,s70=null,sh65=null,m10=null,r80=null;
   if(MODE==='gmb'||MODE==='usr'){H._pl=1;H.aiGs=null}if(MODE==='usr')H.ment=process_ment;
   const m=runMatch(H,A,{afterMinute:(min,st,T,api)=>{
     if(min===10)m10=[T[0].ment||'',T[1].ment||'',+(T[0].gsx||0).toFixed(2),+(T[1].gsx||0).toFixed(2)];
     if(min===70)s70=[st.sc[0],st.sc[1]];if(min===65)sh65=[st.sh[0],st.sh[1],st.sc[0],st.sc[1],+st.xg[0].toFixed(3),+st.xg[1].toFixed(3)];
     if(MODE==='gmb'&&min===80&&!snap){if(st.sc[0]>=st.sc[1])st.sc[1]=st.sc[0]+1;snap={d:st.sc[1]-st.sc[0],g0:st.sc[0],g1:st.sc[1],x0:st.xg[0],x1:st.xg[1],s0:st.sh[0],s1:st.sh[1],r:Math.round(x%100000)};if(POL!=='none')gambleApply(api,0,T[0],POL)}}});
   while(!m.done)m.step();const st=m.st;
   if(MODE!=='gmb'){const g=st.ev.filter(e=>e.t==='goal').map(e=>[e.m,e.s]);
     R.push({k,h:h.i,a:a.i,sc:[st.sc[0],st.sc[1]],s70,sh65,shE:[st.sh[0],st.sh[1]],xg:[+st.xg[0].toFixed(3),+st.xg[1].toFixed(3)],g,m10})}
   else R.push({k,d:snap.d,r:snap.r,gf:st.sc[0]-snap.g0,ga:st.sc[1]-snap.g1,xf:+(st.xg[0]-snap.x0).toFixed(3),xa:+(st.xg[1]-snap.x1).toFixed(3),sf:st.sh[0]-snap.s0,sa:st.sh[1]-snap.s1})}
  return R},[c0,Math.min(CH,K0+N-c0),SEED,MODE,POL,process.env.MENT||'균형']);
 fs.appendFileSync(OUT,out.map(o=>JSON.stringify(o)).join('\n')+'\n');}
if(errs.length)console.error(errs.slice(0,3));await b.close()})();
