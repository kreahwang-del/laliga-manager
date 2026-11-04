// 리그 간 밸런스 검증: 하부 리그 최상위 공격수를 라리가 중위 팀으로 옮겨 시즌(38경기) 출전·득점을 본다
// 사용: HTML=.. TX="$(cat work/attrfix/tx_v4.json)" LGS=SC,AT,KR RUNS=3 OUT=.. node work/attrfix/xfer_test.js
// 기준(축구 전문가 2026-11-04): PT·NL·BE·EN2·ES2 90분당 0.35~0.55·선발 60%+ / SC·AT·DK·DE2·IT2·FR2 0.25~0.45·40~70% / KR·US·JP·CN 0.15~0.35·30~60%, 원 리그 대비 40~65% 유지
const {chromium}=require('playwright');const fs=require('fs');
const LGS=(process.env.LGS||'SC').split(','),RUNS=+(process.env.RUNS||3);
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1000);
await pg.evaluate(()=>{UI.mode='club';UI.nm='t';startGame(LIGA[0]);goUnemployed('t',0);save=()=>{}});
if(process.env.TX){const rep=await pg.evaluate(([src,tx])=>(new Function('TX',src))(tx),[fs.readFileSync(__dirname+'/tx_page.js','utf8'),JSON.parse(process.env.TX)]);console.log('TX',JSON.stringify(rep))}
const out={};
for(const lg of LGS){const r=await pg.evaluate(([lg,RUNS])=>{
  const str=c=>{const T=teamFor(c);return T.xi.reduce((a,p)=>a+(p?p.ovr:0),0)};
  const ES=CLUBS.filter(c=>c&&c.lg==='ES').map(c=>c.i).sort((a,b)=>str(b)-str(a));const tgt=ES[9];/* 라리가 10위권 전력 */
  const C=CLUBS.filter(c=>c&&c.lg===lg).map(c=>c.i);const cand=[];for(const id in BASE){const c=clubOf(+id);if(C.includes(c)&&BASE[id].g==='ST')cand.push(+id)}
  cand.sort((a,b)=>(BASE[b].ovr+BASE[b].shoot)-(BASE[a].ovr+BASE[a].shoot));const pid=cand[0];const p=BASE[pid];const home=clubOf(pid);
  const run=(club,opps,seed)=>{let x=seed;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};let st=0,g=0,n=0;
    for(let i=0;i<opps.length;i++){x=(seed*31+i*7919)%2147483646+1;const T=teamFor(club),O=teamFor(opps[i]);const on=T.xi.some(q=>q&&q.id===pid);const hm=i%2===0;
      const m=hm?runMatch(T,O,{}):runMatch(O,T,{});while(!m.done)m.step();n++;if(on)st++;for(const e of m.st.ev)if(e.t==='goal'&&!e.og&&e.p===p.name)g++}
    return {n,st,g}};
  const dom=C.filter(c=>c!==home);const domOpp=dom.concat(dom);const esOpp=ES.filter(c=>c!==tgt);const esO=esOpp.concat(esOpp);
  const R={name:p.name,ovr:Math.round(p.ovr),shoot:+p.shoot.toFixed(1),home:CLUBS[home].name,tgt:CLUBS[tgt].name,dom:{n:0,st:0,g:0},es:{n:0,st:0,g:0}};
  for(let k=0;k<RUNS;k++){const a=run(home,domOpp,1000+k);['n','st','g'].forEach(z=>R.dom[z]+=a[z])}
  {/* 기준: 옮기기 전 라리가 팀 주전 공격수의 90분당 득점 */const T0=teamFor(tgt);const st0=T0.xi.filter(q=>q&&q.g==='ST').sort((a,b)=>b.ovr-a.ovr)[0];if(st0){const keep={pid:st0.id,name:st0.name};let x=1;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};let s=0,gg=0;
    for(let k=0;k<RUNS;k++)for(let i=0;i<esO.length;i++){x=((3000+k)*31+i*7919)%2147483646+1;const T=teamFor(tgt),O=teamFor(esO[i]);const on=T.xi.some(q=>q&&q.id===keep.pid);const m=i%2===0?runMatch(T,O,{}):runMatch(O,T,{});while(!m.done)m.step();if(on)s++;for(const e of m.st.ev)if(e.t==='goal'&&!e.og&&e.p===keep.name)gg++}
    R.base={name:keep.name,ovr:Math.round(st0.ovr),shoot:st0.shoot,g90:+(s?gg/s:0).toFixed(2),start:+(s/(esO.length*RUNS)).toFixed(2)}}}
  S.ps[pid]=S.ps[pid]||{};const old=S.ps[pid].club;S.ps[pid].club=tgt;SQC=null;
  for(let k=0;k<RUNS;k++){const a=run(tgt,esO,2000+k);['n','st','g'].forEach(z=>R.es[z]+=a[z])}
  if(old===undefined)delete S.ps[pid].club;else S.ps[pid].club=old;SQC=null;
  const f=o=>({start:+(o.st/o.n).toFixed(2),g90:+(o.st?o.g/o.st:0).toFixed(2)});R.domF=f(R.dom);R.esF=f(R.es);R.keep=R.domF.g90?+(R.esF.g90/R.domF.g90).toFixed(2):null;return R},[lg,RUNS]);
  out[lg]=r;console.log(lg,JSON.stringify(r))}
fs.writeFileSync(process.env.OUT,JSON.stringify(out));if(errs.length)console.error('ERR',errs.slice(0,3));process.exit(0)})().catch(e=>{console.log('E',e.message);process.exit(1)});
