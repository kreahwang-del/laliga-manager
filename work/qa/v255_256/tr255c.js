const {chromium}=require('playwright');
const HTML=process.env.HTML||'/home/claude/work/cur.html',N=+(process.env.N||60),POL=process.env.POL||'auto',SEED=+(process.env.SEED||12345);
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis/,r=>r.abort());
await pg.goto('file://'+HTML);await pg.waitForTimeout(400);
const out=await pg.evaluate(([N,POL,SEED,process_FK])=>{let x=SEED;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};UI.mode='club';UI.nm='t';startGame(LIGA[0]);
 const _c=E4.createMatch;E4.createMatch=(H,A,o)=>_c(H,A,Object.assign(o||{},{possLog:true}));const all=CLUBS.filter(c=>c&&['ES','EN','IT','DE','FR'].includes(c.lg));const R=[];const INF=[];const SH=['goal','save','miss','block'];
 for(let k=0;k<N;k++){const h=all[(k*7)%all.length],a=all[(k*13+5)%all.length];if(h===a)continue;
  const m=runMatch(teamFor(h.i),teamFor(a.i),{wantDec:(kk,s)=>s===0&&(process_FK?kk==='fk':kk==='corner')});
  while(!m.done){m.step();const d=m.st.pendingDec;if(d){let ch=null;const OP={box:['bshot','bpass','bdrib'],cross:['low','high','carry'],fk:['shot','cross','short'],def:['follow','tackle','block'],corner:['cc','cn','cs']};if(POL!=='auto')ch=(OP[d.k]||[])[+POL]||null;const p=m.T[0].xi.find(q=>q.id===d.aid)||{};INF.push({k:d.k,info:d.info,sh:p.shoot,dr:p.drib,pa:p.pass,cr:p.cross,ch});m.api.decide(ch,false)}}
  const ev=m.st.ev;const decs=[];
  for(let i=0;i<ev.length;i++){const e=ev[i];if(e.t!=='dec'||e.s!==0)continue;let t0=e.sec,act=null;
    if(e.k!=='fk'&&e.k!=='corner'&&e.k!=='def'){for(let j=i+1;j<ev.length&&ev[j].sec<=e.sec+8;j++){if(ev[j].t==='decAct'&&ev[j].s===0){act=ev[j];t0=ev[j].sec;break}}}
    let loss=0,osh=0,own=0,xg=0,goal=0,og=0;const PL=(m.st.pl2||[]);
    let tOpp=null,tBack=null;for(const q of PL){if(q[3]<=t0)continue;if(tOpp==null){if(q[0]===1)tOpp=q[3]}else if(q[0]===0){tBack=q[3];break}}
    if(tOpp==null)tOpp=1e9;if(tBack==null)tBack=1e9;
    for(const f of ev){if(!SH.includes(f.t))continue;if(f.s===0&&f.sec>=t0-0.6&&f.sec<=tOpp){own=1;xg+=f.xg||0;if(f.t==='goal')goal=1}if(f.s===1&&f.sec>=tOpp&&f.sec<=tBack){osh=1;if(f.t==='goal')og=1}}
    loss=(!own&&tOpp<1e9)?1:0;const loss8=(tOpp<=t0+8&&!(own&&tOpp>t0))?1:0;
    let dx=0,dsh=0,dg=0,reg8=0;if(e.k==='def'){let tUs=null;for(const q of PL){if(q[3]<=e.sec)continue;if(q[0]===0){tUs=q[3];break}}if(tUs==null)tUs=1e9;for(const f of ev){if(!SH.includes(f.t)||f.s!==1)continue;if(f.sec>=e.sec-0.5&&f.sec<=tUs){dx+=f.xg||0;dsh=1;if(f.t==='goal')dg=1}}reg8=tUs<=e.sec+10?1:0}decs.push({dx:+dx.toFixed(3),dsh,dg,reg8,res:e.res,intent:e.intent,loss8,inf:INF.find(q=>q.done==null&&q.k===e.k&&(q.done=1)),k:e.k,ch:e.ch,fol:e.fol,act:act?act.k:null,ok:act?act.ok:null,loss,osh,own,xg:+xg.toFixed(3),goal,og})}
  R.push({sc:m.st.sc?[m.st.sc[0],m.st.sc[1]]:null,decs})}
 return R},[N,POL,SEED,!!process.env.FK]);
require('fs').writeFileSync(process.env.OUT||('rr_'+POL+'.json'),JSON.stringify(out));if(errs.length)console.error(errs.slice(0,3));await b.close()})();
