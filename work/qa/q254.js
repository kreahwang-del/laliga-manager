// QA v254 runner (KD=def → uncapped def-only). env: HTML, POL(ai|off|best|p0|p1|p2|rnd), S0,S1 (seed range incl), CAP(1=real UI decWant caps|0=uncapped), PL(1 possLog), OUT
const {chromium}=require('playwright');
const E=process.env,KD=E.KD||'',HTML=E.HTML,POL=E.POL,S0=+E.S0,S1=+E.S1,CAP=E.CAP!=='0',PL=E.PL==='1',OUT=E.OUT;
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis/,r=>r.abort());
await pg.goto('file://'+HTML);await pg.waitForTimeout(400);
const out=await pg.evaluate(([POL,S0,S1,CAP,PL,KD])=>{
 let x=777;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};UI.mode='club';UI.nm='t';startGame(LIGA[0]);
 if(typeof S!=='undefined'&&S)S.decOn=true;
 if(PL){const _c=E4.createMatch;E4.createMatch=(H,A,o)=>_c(H,A,Object.assign(o||{},{possLog:true}))}
 const all=CLUBS.filter(c=>c&&['ES','EN','IT','DE','FR'].includes(c.lg));const SH=['goal','save','miss','block'];
 const OP={box:['bshot','bpass','bdrib'],cross:['low','high','carry'],fk:['shot','cross','short'],wide:['switch','wide','inside'],def:['follow','tackle','block']};const CTR={drib:'follow',pass:'block',shot:'tackle'};
 const R=[];
 for(let seed=S0;seed<=S1;seed++){const k=seed-910001;const h=all[(k*7)%all.length];let a=all[(k*13+5)%all.length];if(h===a)a=all[(k*13+6)%all.length];
  x=seed;let y=(seed*48271)%2147483647;const rnd=()=>{y=(y*48271)%2147483647;return y/2147483647};
  let m;let hooks;const MM={me:0,skipping:false,done:false};
  if(POL==='ai')hooks={};
  else if(POL==='off')hooks={wantDec:()=>false};
  else if(CAP)hooks={wantDec:(kk,s)=>{M=MM;return decWant(kk,s)}};
  else hooks={wantDec:(kk,s)=>s===0&&(!KD||kk===KD)};
  m=runMatch(teamFor(h.i),teamFor(a.i),hooks);MM.m=m;
  const dl=[];const pers={};const tm=[];let lastTm=null;let aiDec=0;
  while(!m.done){M=MM;m.step();
    // persistence polling
    const sec=m.st.sec;
    for(const s of [0,1])for(const q of (m.P&&m.P[s])||[]){if(q.decB||q.decN){if(s===1)aiDec++;const key=q.p.id+'@'+q.decT;const o=pers[key]||(pers[key]={s,id:q.p.id,decT:q.decT,first:sec,last:sec,b:q.decB||null});o.last=sec}}
    const T=m.st.decTm;if(T&&T!==lastTm){lastTm=T;tm.push({s:T.s,o:T.o,until:T.until,seen:sec})}
    const d=m.st.pendingDec;if(d){
    M=MM;if(CAP&&!d.shown){d.shown=1;MM.decN=(MM.decN||0)+1;MM.decLast=m.min;if(d.k!=='fk'){MM.decK=MM.decK||{};MM.decK[d.k]=(MM.decK[d.k]||0)+1}}
    const opts=OP[d.k];const ev0=decEval(d,null),best=ev0.best;let ch;
    if(POL==='best')ch=best;else if(POL==='rnd')ch=opts[Math.floor(rnd()*3)];else if(POL==='auto')ch=null;else if(POL==='orc')ch=d.k==='def'?CTR[d.intent]:best;else if(POL==='hint'){if(d.k==='def'){const pr=d.info.pr,mx=Math.max(...pr);ch=mx>=.42?CTR[['drib','pass','shot'][pr.indexOf(mx)]]:'follow'}else ch=best}else if(['follow','tackle','block'].includes(POL))ch=d.k==='def'?POL:best;else ch=opts[+POL.slice(1)];
    const gr={};for(const o of opts)gr[o]=decEval(d,o).grade;const intent=d.intent||null;
    const p=m.T[0].xi.find(q=>q.id===d.aid)||{};
    dl.push({k:d.k,ch,best,gr,intent,info:d.info,min:m.min,sec:m.st.sec,sh:p.shoot,dr:p.drib,s:d.s});
    m.api.decide(ch,ch?gr[ch]==='좋은 판단':false)}}
  const ev=m.st.ev;let hs=0;const js=JSON.stringify(ev);for(let i=0;i<js.length;i++)hs=(hs*31+js.charCodeAt(i))|0;
  let xg=[0,0],shots=[0,0];for(const e of ev)if(SH.includes(e.t)){xg[e.s]+=e.xg||0;shots[e.s]++}
  const decs=[];
  for(let i=0;i<ev.length;i++){const e=ev[i];if(e.t!=='dec')continue;
   const o={s:e.s,k:e.k,ch:e.ch,fol:e.fol,fp:e.fp,pn:e.pn,sec:e.sec,min:e.m,intent:e.intent,res:e.res};if(e.k==='def'){const P2=m.st.pl2||[];let tUs=null;for(const q of P2){if(q[3]<=e.sec)continue;if(q[0]===0){tUs=q[3];break}}if(tUs==null)tUs=1e9;let dx=0,dsh=0,dg=0;for(const f of ev){if(!SH.includes(f.t)||f.s!==1)continue;if(f.sec>=e.sec-0.5&&f.sec<=tUs){dx+=f.xg||0;dsh=1;if(f.t==='goal')dg=1}}o.dx=+dx.toFixed(4);o.dsh=dsh;o.dg=dg;o.reg=tUs-e.sec;const da=ev.slice(i+1).find(f=>f.t==='decAct'&&f.k==='def');if(da){o.dak=da.ak;o.dadl=+(da.sec-e.sec).toFixed(2);o.dres=da.res}}
   let act=null;if(e.k!=='def')for(let j=i+1;j<ev.length;j++){const f=ev[j];if(f.t==='decAct'&&f.s===e.s&&f.pn===e.pn){act=f;break}if(f.t==='dec')break}
   if(act){o.ak=act.k;o.aok=act.ok;o.adl=+(act.sec-e.sec).toFixed(2);o.afol=act.fol}
   if(PL){let t0=e.sec;if(e.k!=='fk'&&act&&act.sec<=e.sec+8)t0=act.sec;const P2=m.st.pl2||[];let tOpp=null,tBack=null;
    for(const q of P2){if(q[3]<=t0)continue;if(tOpp==null){if(q[0]===1)tOpp=q[3]}else if(q[0]===0){tBack=q[3];break}}
    if(tOpp==null)tOpp=1e9;if(tBack==null)tBack=1e9;let own=0,oxg=0,g=0,osh=0,og=0,oxa=0;
    for(const f of ev){if(!SH.includes(f.t))continue;if(f.s===0&&f.sec>=t0-0.6&&f.sec<=tOpp){own=1;oxg+=f.xg||0;if(f.t==='goal')g=1}if(f.s===1&&f.sec>=tOpp&&f.sec<=tBack){osh=1;oxa+=f.xg||0;if(f.t==='goal')og=1}}
    o.loss=(!own&&tOpp<1e9)?1:0;o.loss8=(tOpp<=t0+8&&!(own&&tOpp>t0))?1:0;o.own=own;o.oxg=+oxg.toFixed(4);o.osh=osh;o.oxa=+oxa.toFixed(4);o.og=og;o.g=g;o.end=tOpp>=1e9?1:0}
   decs.push(o)}
  R.push({seed,h:h.i,a:a.i,sc:[m.st.sc[0],m.st.sc[1]],xg:xg.map(v=>+v.toFixed(3)),shots,hs,decs,dl,pers:Object.values(pers),tm,aiDec,nev:ev.length,poss:m.st.pos||null})}
 M=null;return R},[POL,S0,S1,CAP,PL,KD]);
require('fs').writeFileSync(OUT,JSON.stringify(out));if(errs.length)console.error('ERRS',errs.slice(0,3));await b.close()})();
