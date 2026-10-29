// QA v252 runner. env: HTML, POL(ai|off|best|sw|wd|in|rnd|auto), S0,S1 (seed range incl), CAP(1|0), PL(1 possLog), OUT
const {chromium}=require('playwright');
const E=process.env,HTML=E.HTML,POL=E.POL,S0=+E.S0,S1=+E.S1,CAP=E.CAP!=='0',PL=E.PL==='1',OUT=E.OUT;
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis/,r=>r.abort());
await pg.goto('file://'+HTML);await pg.waitForTimeout(400);
const out=await pg.evaluate(([POL,S0,S1,CAP,PL])=>{
 let x=777;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};UI.mode='club';UI.nm='t';startGame(LIGA[0]);
 if(PL){const _c=E4.createMatch;E4.createMatch=(H,A,o)=>_c(H,A,Object.assign(o||{},{possLog:true}))}
 const all=CLUBS.filter(c=>c&&['ES','EN','IT','DE','FR'].includes(c.lg));const SH=['goal','save','miss','block'];
 const FIX={sw:['switch','shot'],wd:['wide','cross'],in:['inside','short']};
 const R=[];
 for(let seed=S0;seed<=S1;seed++){const k=seed-900001;const h=all[(k*7)%all.length];let a=all[(k*13+5)%all.length];if(h===a)a=all[(k*13+6)%all.length];
  x=seed;let y=(seed*48271)%2147483647;const rnd=()=>{y=(y*48271)%2147483647;return y/2147483647};
  let m;const cap={n:0,w:0,last:null};
  let hooks;
  if(POL==='ai')hooks={};
  else if(POL==='off')hooks={wantDec:()=>false};
  else hooks={wantDec:(kk,s)=>{if(s!==0)return false;if(!CAP)return true;const mn=m&&m.st?m.st.min:(m&&m.min)||0;
     if(cap.n>=3)return false;if(kk==='wide'&&cap.w>=2)return false;if(cap.last!=null&&mn-cap.last<10)return false;if(kk==='wide'&&mn<10)return false;
     cap.n++;cap.last=mn;if(kk==='wide')cap.w++;return true}};
  m=runMatch(teamFor(h.i),teamFor(a.i),hooks);
  const dl=[];
  while(!m.done){m.step();const d=m.st.pendingDec;if(d){
    let ch=null,good=false;
    if(POL!=='auto'){
      M={m,me:0};const ev0=decEval(d,'switch'),best=ev0.best;
      const opts=d.k==='fk'?['shot','cross','short']:['switch','wide','inside'];
      if(POL==='best')ch=best;else if(POL==='rnd')ch=opts[Math.floor(rnd()*3)];else ch=FIX[POL][d.k==='fk'?1:0];
      good=decEval(d,ch).grade==='좋은 판단';M=null;
      dl.push({k:d.k,ch,best,good,info:d.info,min:m.st.min});
    } else dl.push({k:d.k,ch:null,min:m.st.min});
    m.api.decide(ch,good)}}
  const ev=m.st.ev;let hs=0;const js=JSON.stringify(ev);for(let i=0;i<js.length;i++)hs=(hs*31+js.charCodeAt(i))|0;
  let xg=[0,0],shots=[0,0];for(const e of ev)if(SH.includes(e.t)){xg[e.s]+=e.xg||0;shots[e.s]++}
  const decs=[],acts=[];
  for(let i=0;i<ev.length;i++){const e=ev[i];
   if(e.t==='decAct')acts.push({s:e.s,fol:e.fol,ch:e.ch,k:e.k,ok:e.ok,good:e.good,lat:e.lat,tx:e.tx,sec:e.sec});
   if(e.t!=='dec')continue;
   const o={s:e.s,k:e.k,ch:e.ch,fol:e.fol,fp:e.fp,why:e.why,good:e.good,pn:e.pn,sec:e.sec,min:e.m};
   if(PL){let t0=e.sec;const P2=m.st.pl2||[];let tOpp=null,tBack=null;
    for(const q of P2){if(q[3]<=t0)continue;if(tOpp==null){if(q[0]===1)tOpp=q[3]}else if(q[0]===0){tBack=q[3];break}}
    if(tOpp==null)tOpp=1e9;if(tBack==null)tBack=1e9;let own=0,oxg=0,osh=0,og=0,g=0,fk1=null;
    for(const f of ev){if(!SH.includes(f.t))continue;if(f.s===0&&f.sec>=t0-0.6&&f.sec<=tOpp){own=1;oxg+=f.xg||0;if(f.t==='goal')g=1;if(fk1==null)fk1=f.type||null}if(f.s===1&&f.sec>=tOpp&&f.sec<=tBack){osh=1;if(f.t==='goal')og=1}}
    o.loss=(!own&&tOpp<1e9)?1:0;o.own=own;o.oxg=+oxg.toFixed(3);o.osh=osh;o.og=og;o.g=g;o.end=tOpp>=1e9?1:0}
   decs.push(o)}
  // player attrs for decided players
  const xi=m.T[0].xi||[];const pa={};for(const d of decs){if(d.pn&&!pa[d.pn]){const p=xi.find(q=>q.name===d.pn)||(m.T[0].bench||[]).find(q=>q.name===d.pn);if(p)pa[d.pn]={pro:p.pro,cond:p.cond,pass:p.pass,cross:p.cross,drib:p.drib,hab:p.hab}}}
  R.push({seed,h:h.i,a:a.i,sc:[m.st.sc[0],m.st.sc[1]],xg:xg.map(v=>+v.toFixed(3)),shots,hs,decs,acts,dl,pa,nev:ev.length})}
 return R},[POL,S0,S1,CAP,PL]);
require('fs').writeFileSync(OUT,JSON.stringify(out));if(errs.length)console.error('ERRS',errs.slice(0,3));await b.close()})();
