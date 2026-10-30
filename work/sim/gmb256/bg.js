// 빌더 v256 승부수 재설계 측정: QA qg.js 사본. POL airA=공중볼+gsx2.5(가), airAB=가+공중볼 우열 증폭(나, OV gmbAirK). 경기별 재시드, 해시 대진
const {chromium}=require('playwright');const fs=require('fs');
const HTML=process.env.HTML||'/home/claude/work/cur256.html',N=+(process.env.N||100),SEED=+(process.env.SEED||8642),POLS=(process.env.POLS||'none,g_all,g_air,g_long').split(','),OUT=process.env.OUT,CH=+(process.env.CH||25),K0=+(process.env.K0||0);
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis/,r=>r.abort());await pg.goto('file://'+HTML);await pg.waitForTimeout(400);
const OV=JSON.parse(process.env.OV||'{}');
await pg.evaluate(([OV,RK,MENT])=>{window.__RK=RK;window.__MENT=MENT;if(Object.keys(OV).length){const _c=E4.createMatch;E4.createMatch=(H,A,o)=>_c(H,A,Object.assign({},o,{cfg:Object.assign({},(o&&o.cfg)||{},OV)}))}UI.mode='club';UI.nm='t';startGame(LIGA[0]);window.__all=CLUBS.filter(c=>c&&['ES','EN','IT','DE','FR'].includes(c.lg));},[OV,+(process.env.RK||.5),process.env.MENT||'']);
fs.writeFileSync(OUT,'');
for(let c0=K0;c0<K0+N;c0+=CH){
 const out=await pg.evaluate(([c0,n,SEED,POLS])=>{let x=1;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};
  const all=window.__all,R=[];const hs=v=>{v=(v^61)^(v>>>16);v=Math.imul(v,9);v^=v>>>4;v=Math.imul(v,0x27d4eb2d);v^=v>>>15;return v>>>0};
  const av=(L,k,f)=>{const v=L.filter(f).map(p=>p[k]??10);return v.length?v.reduce((a,x)=>a+x,0)/v.length:10};
  for(let k=c0;k<c0+n;k++){const hi=hs(SEED*100003+k*2)%all.length;let ai=hs(SEED*100003+k*2+1)%all.length;if(ai===hi)ai=(ai+1)%all.length;
   const h=all[hi],a=all[ai];
   for(const POL of POLS){x=((SEED*7919+k*104729)%2147483646)+1;
   const H=teamFor(h.i),A=teamFor(a.i);let snap=null;H._pl=1;H.aiGs=null;if(window.__MENT)H.ment=window.__MENT;let g85=null;
   const m=runMatch(H,A,{afterMinute:(min,st,T,api)=>{
     if(min===80&&!snap){if(st.sc[0]>=st.sc[1])st.sc[1]=st.sc[0]+1;
       snap={d:st.sc[1]-st.sc[0],g0:st.sc[0],g1:st.sc[1],x0:st.xg[0],x1:st.xg[1],s0:st.sh[0],s1:st.sh[1],r:Math.round(x%100000),
         oa:+decAir(T[0].xi).toFixed(2),da:+decAir(T[1].xi).toFixed(2),op:+av(T[1].xi,'pace',p=>['ST','W','AM'].includes(p.g)).toFixed(2),dp:+av(T[0].xi,'pace',p=>['CB','FB'].includes(p.g)).toFixed(2),
         ment:T[0].ment||'',ls:+(T[0].xi.filter(p=>p.g!=='GK').map(p=>p.shoot??10).sort((a,b)=>b-a).slice(0,4).reduce((a,v)=>a+v,0)/4).toFixed(2),ogk:+((T[1].xi.find(p=>p.g==='GK')||{}).gk_save??10),oppG:+(T[1].gsx||0).toFixed(2)};
       if(POL==='longL'){gambleApply(api,0,T[0],'g_long',T[1])}else if(POL==='airD'){gambleApply(api,0,T[0],'g_air');T[0].gsx=1.5;T[0].gmbRest=1;T[0].gmbRestK=+(window.__RK||.5);T[0].gmbAir=1;T[0].gmbAirD=decAir(T[0].xi)-decAir(T[1].xi)}else if(POL==='airC'){gambleApply(api,0,T[0],'g_air');T[0].gsx=1.5;T[0].gmbRest=1;T[0].gmbAir=1;T[0].gmbAirD=decAir(T[0].xi)-decAir(T[1].xi)}else if(POL==='airA'||POL==='airAB'){gambleApply(api,0,T[0],'g_air');T[0].gsx=2.5;if(POL==='airAB'){T[0].gmbAir=1;T[0].gmbAirD=decAir(T[0].xi)-decAir(T[1].xi)}}else if(POL!=='none')gambleApply(api,0,T[0],POL)}
     if(min===85)g85=+(T[0].gsx||0).toFixed(2)}});
   while(!m.done)m.step();const st=m.st;
   R.push({k,pol:POL,h:h.i,a:a.i,d:snap.d,r:snap.r,oa:snap.oa,da:snap.da,op:snap.op,dp:snap.dp,ment:snap.ment,ls:snap.ls,ogk:snap.ogk,oppG:snap.oppG,g85,g90:+(m.T?0:0),
     gf:st.sc[0]-snap.g0,ga:st.sc[1]-snap.g1,xf:+(st.xg[0]-snap.x0).toFixed(3),xa:+(st.xg[1]-snap.x1).toFixed(3),sf:st.sh[0]-snap.s0,sa:st.sh[1]-snap.s1})}}
  return R},[c0,Math.min(CH,K0+N-c0),SEED,POLS]);
 fs.appendFileSync(OUT,out.map(o=>JSON.stringify(o)).join('\n')+'\n');}
if(errs.length)console.error(errs.slice(0,3));await b.close()})();
