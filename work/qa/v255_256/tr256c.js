const {chromium}=require('playwright');
const HTML=process.env.HTML||'/home/claude/work/cur.html',N=+(process.env.N||60),POL=process.env.POL||'auto',SEED=+(process.env.SEED||12345),K0=+(process.env.K0||0);
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis/,r=>r.abort());
await pg.goto('file://'+HTML);await pg.waitForTimeout(400);
const out=await pg.evaluate(([N,POL,SEED,K0])=>{let x=SEED;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};UI.mode='club';UI.nm='t';startGame(LIGA[0]);
 const all=CLUBS.filter(c=>c&&['ES','EN','IT','DE','FR'].includes(c.lg));const R=[];const SH=['goal','save','miss','block'];const DMS=['zonal','man','mixed'];
 const AIR=L=>{const v=L.filter(p=>p.g!=='GK').map(p=>(p.aerial??10)+((p.h||180)-180)*.08).sort((a,b)=>b-a).slice(0,3);return v.reduce((a,x)=>a+x,0)/v.length};
 for(let k=K0;k<K0+N;k++){const h=all[(k*7)%all.length],a=all[(k*13+5)%all.length];if(h===a)continue;
  x=(SEED+k*7919)%2147483647||1;const H=teamFor(h.i),A=teamFor(a.i);const dm=DMS[k%3];A.sp=Object.assign({},A.sp||{});A.sp.g=Object.assign({},(A.sp&&A.sp.g)||{},{dMark:dm});
  const gk=A.xi.find(p=>p.g==='GK')||{};const gka=gk.gk_air??gk.aerial??null;const oa=AIR(H.xi),da=AIR(A.xi);
  const m=runMatch(H,A,{wantDec:(kk,s)=>s===0&&kk==='corner'});
  while(!m.done){m.step();const d=m.st.pendingDec;if(d){const ch=POL==='auto'?null:['cc','cn','cs'][+POL];m.api.decide(ch,false)}}
  const ev=m.st.ev;
  for(let i=0;i<ev.length;i++){const e=ev[i];if(e.t!=='dec'||e.s!==0||e.k!=='corner')continue;let t0=null;
    for(let j=i+1;j<ev.length;j++){if(ev[j].s===0&&(ev[j].t==='corner'||ev[j].t==='cornerShort'||ev[j].t==='claim'||ev[j].t==='aerialWon'||ev[j].t==='aerialLost')){t0=ev[j].sec;break}if(ev[j].t==='dec')break}
    if(t0==null)t0=e.sec;let g=0,sh=0,xg=0,og=0,osh=0;
    for(const f of ev){if(!SH.includes(f.t))continue;if(f.s===0&&f.sec>=t0-.5&&f.sec<=t0+12){sh=1;xg+=f.xg||0;if(f.t==='goal')g=1}if(f.s===1&&f.sec>t0&&f.sec<=t0+25){osh=1;if(f.t==='goal')og=1}}
    R.push({k,dm,gka,oa:+oa.toFixed(2),da:+da.toFixed(2),g,sh,xg:+xg.toFixed(3),osh,og})}}
 return R},[N,POL,SEED,K0]);
require('fs').writeFileSync(process.env.OUT,JSON.stringify(out));if(errs.length)console.error(errs.slice(0,3));await b.close()})();
