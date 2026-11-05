// 롱볼 실측: 팀별 롱패스 수(st.lg), 걷어내기, 리포트 '롱볼 경합' 집계(o.long), 전체 패스 시도, 직선성 지시(ti[4])별
// 사용: HTML=.. LGS=ES N=60 OUT=.. node work/sim/longprof.js
const {chromium}=require('playwright');const fs=require('fs');
const LGS=(process.env.LGS||'ES').split(','),N=+(process.env.N||40);
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1000);
await pg.evaluate(()=>{UI.mode='club';UI.nm='t';startGame(LIGA[0]);goUnemployed('t',0);save=()=>{}});
const out={};
for(const lg of LGS){const r=await pg.evaluate(([lg,N])=>{const C=CLUBS.filter(c=>c&&c.lg===lg&&c.i!==S.club);let x=17;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};
  const gcd=(x,y)=>y?gcd(y,x%y):x;const ST=[11,13,17,19,23].find(v=>gcd(v,C.length)===1);const D0=S.date;const rows=[];
  for(let k=0;k<N;k++){const h=C[(k*7)%C.length],a=C[(k*ST+3)%C.length];if(h===a)continue;x=(k*7919+31)%2147483646+1;const dd=new Date(D0);dd.setDate(dd.getDate()+(k%280));S.date=dd.toISOString().slice(0,10);
   const TH=teamFor(h.i),TA=teamFor(a.i);const m=runMatch(TH,TA,{});while(!m.done)m.step();const st=m.st;const res=m.res||st;
   for(const s of [0,1]){const T=s?TA:TH;const sh=engShift?engShift(T,lg):T;const ti=(sh&&sh.ti)||T.ti||[];
     let pa=0;for(const id in st.pr){}const names=new Set(T.xi.filter(Boolean).map(p=>p.id));for(const id in st.pr){if(names.has(+id))pa+=(st.pr[id].pa||0)}
     const clr=st.ev.filter(e=>e.t==='clear'&&e.s===s).length;
     let trL=0,trC=0,trI=0,trF=0,trCt=0,build=0,start=0,startLong=0;const set=new Set();st.ev.forEach(e=>{if(e.tr&&e.tr.s===s)set.add(e.tr)});
     set.forEach(tr=>{const s0=tr[0]||{};const base=s0.k==='start'&&!s0.tr&&!s0.sec&&!s0.sp;if(base){start++;const f=tr.find((y,i)=>i>0&&(y.k==='pass'||y.k==='long'));if(f&&f.k==='long')startLong++}
       if(base&&!tr.some(y=>y.k==='long'))build++;tr.forEach(y=>{if(y.k!=='long')return;trL++;if(y.clear)trC++;else if(y.int)trI++;else if(y.free)trF++;else if(y.vs)trCt++})});
     const D=st.dbg||{};let ht=0,hl=0,hl30=0;for(const k in D){if(k.startsWith('ht_'))ht+=D[k];if(k.startsWith('hl_')){hl+=D[k];if(+k[4]>=3)hl30+=D[k]}}
     rows.push({lg,ps:(st.pass&&st.pass[s])?st.pass[s][0]+st.pass[s][1]:0,ht:ht/2,hl:hl/2,hl30:hl30/2,dir:ti[4],tmp:ti[3],lgP:(st.lg||[0,0])[s],clr,pa,trL,trC,trI,trF,trCt,build,start,startLong})}}
  return rows},[lg,N]);out[lg]=r;
  const agg=(f)=>{const R=r.filter(f);const o={n:R.length};['ps','ht','hl','hl30','lgP','clr','pa','trL','trC','trI','trF','trCt','build','start','startLong'].forEach(k=>o[k]=+(R.reduce((a,b)=>a+(b[k]||0),0)/Math.max(1,R.length)).toFixed(1));return o};
  console.log(lg,'all',JSON.stringify(agg(()=>1)));[1,2,3,4,5].forEach(d=>{const o=agg(y=>Math.round(y.dir)===d);if(o.n)console.log(lg,'dir'+d,JSON.stringify(o))})}
fs.writeFileSync(process.env.OUT,JSON.stringify(out));if(errs.length)console.error('ERR',errs.slice(0,3));process.exit(0)})().catch(e=>{console.log('E',e.message);process.exit(1)});
