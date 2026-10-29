// handoff/ms/msim.js 사본: playwright-core+Chrome, 경로 환경변수, 저장 항목별 크기(sk) 추가
// node msim.js NS out.jsonl [PRE]
const {chromium}=require('playwright-core');const NS=+process.argv[2]||10,OUT=process.argv[3],PRE=process.argv[4]||'';const fs=require('fs');
(async()=>{const b=await chromium.launch({channel:'chrome'});const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('crash',()=>{console.log('PAGE CRASH');fs.appendFileSync(OUT,JSON.stringify({crash:true})+'\n');process.exit(2)});await pg.route(/tmssl|transfermarkt|googleapis/,r=>r.abort());
await pg.goto(require('url').pathToFileURL(process.env.HTML||require('path').resolve(__dirname,'../../handoff/cur.html')).href);await pg.waitForTimeout(400);
await pg.evaluate(PRE=>{eval(PRE);UI.mode='club';UI.nm='t';startGame(LIGA[0]);goUnemployed('t',0);S.vac=[];window.save=()=>{};
 let x=12345;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};
 window.TF=[];const _ct=completeTransfer;completeTransfer=function(id,to,fee,o){try{const fr=clubOf(id),p=pl(id);TF.push({s:S.season,fl:CLUBS[fr]?CLUBS[fr].lg:(fr===FA?'FA':'?'),tl:CLUBS[to]?CLUBS[to].lg:'?',fee:fee||0,ovr:p.ovr,age:ageOf(p),loan:!!(o&&o.loan)})}catch(e){}return _ct.apply(this,arguments)};
 window.LGL=['EN','ES','DE','IT','FR','PT','NL','BE','TR','SA','BR','EN2'];
 window.snap=()=>{const r={s:S.season,d:S.date};const fa=squadOf(FA);r.fa80=fa.filter(p=>p.ovr>=80).length;r.fa75=fa.filter(p=>p.ovr>=75).length;{const f8=fa.filter(p=>p.ovr>=80);r.fa80age=f8.length?+(f8.reduce((a,p)=>a+ageOf(p),0)/f8.length).toFixed(1):0}
  r.lg={};LGL.forEach(lg=>{const cl=CLUBS.filter(c=>c&&c.lg===lg);const t16=cl.map(c=>{const q=squadOf(c.i).map(p=>p.ovr).sort((a,b)=>b-a).slice(0,16);return q.reduce((a,v)=>a+v,0)/Math.max(1,q.length)});const bud=cl.reduce((a,c)=>a+(S.aiBudget[c.i]||0),0);const thin=cl.filter(c=>squadOf(c.i).length<20).length;
   let scr=null,over=0;if(typeof scrRatio==='function'){const rs=cl.map(c=>scrRatio(c.i));scr=+(rs.reduce((a,v)=>a+v,0)/rs.length).toFixed(2);over=cl.filter(c=>scrRatio(c.i)>scrLim(c.i)).length}
   const wb=cl.reduce((a,c)=>a+wageBill(c.i),0);r.lg[lg]={c16:+(t16.reduce((a,v)=>a+v,0)/Math.max(1,t16.length)).toFixed(2),budM:Math.round(bud/1e6),thin,scr,over,wbM:Math.round(wb/1e6)}});
  r.pen=S.pen?JSON.stringify(S.pen[S.season]||{}):'';r.scrN=(S.scrLog||[]).slice(-1).map(x=>x.n)[0]||0;return r};
 window.daySim=()=>{const todays=S.fixtures.filter(f=>f.d===S.date&&!f.res);todays.forEach(f=>fastMatch(f));try{divFastToday()}catch(e){}
  if(!S.seasonDone&&S.fixtures.every(f=>f.res)&&S.date>=S.fixtures[S.fixtures.length-1].d)S.seasonDone=true;
  S.date=addD(S.date,1);RSEED=Math.floor(hsh(S.date+'x')*1e9);if(S.date.endsWith('-07-01')&&S.seasonDone)rollover();daily()};
},PRE);
const t0=Date.now();
for(let y=0;y<NS;y++){
 const r=await pg.evaluate(()=>{const s0=S.season;let g=0;let mid=null;while(S.season===s0&&g<420){g++;daySim();if(S.date.endsWith('-09-02')&&!mid)mid=snap()}
  const T=TF.filter(t=>t.s===s0||t.s===s0+1);TF=[];const L={};const add=(k,f,v)=>{L[k]=L[k]||{buy:0,sell:0,n:0,free:0,loan:0};L[k][f]+=v};
  T.forEach(t=>{if(t.loan){add(t.tl,'loan',1);return}add(t.tl,'n',1);if(!t.fee)add(t.tl,'free',1);add(t.tl,'buy',t.fee);add(t.fl,'sell',t.fee)});
  const out={};LGL.forEach(k=>{const v=L[k]||{buy:0,sell:0,n:0,free:0,loan:0};out[k]=[Math.round(v.buy/1e6),Math.round((v.buy-v.sell)/1e6),v.n,v.free,v.loan]});
  let ssz=0,sk={};try{ssz=JSON.stringify(S).length;for(const k in S){try{const n=JSON.stringify(S[k]).length;if(n>20000)sk[k]=n}catch(e){}}}catch(e){}const mem=performance.memory?Math.round(performance.memory.usedJSHeapSize/1e6):0;return {season:s0,mid,mkt:out,ssz,sk,mem}});
 r.sec=Math.round((Date.now()-t0)/1000);r.errs=errs.slice(0,2);fs.appendFileSync(OUT,JSON.stringify(r)+'\n');console.log('season',r.season,r.sec,'S',r.ssz,'heap',r.mem)}
await b.close()})();
