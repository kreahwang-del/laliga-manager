const {chromium}=require('playwright');const SP='/tmp/claude-0/-home-claude/143ab34f-cae9-5cd6-8a3a-5ca97cda876d/scratchpad/';
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis/,r=>r.abort());
await pg.goto('file:///home/claude/work/cur.html');await pg.waitForTimeout(500);
await pg.evaluate(()=>{let x=33;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};UI.mode='club';UI.nm='t';startGame(LIGA[0]);const fx=S.fixtures.filter(f=>!f.res&&(f.h===S.club||f.a===S.club)).sort((a,b)=>a.d<b.d?-1:1)[0];S.date=fx.d;
 const _w=decWant;decWant=(k,s)=>k==='corner'&&_w(k,s);
 const _cm=checkMoments;checkMoments=(min,st,T,api)=>{if(min===79){const me=M.me;if(st.sc[me]>=st.sc[1-me])st.sc[1-me]=st.sc[me]+1}return _cm(min,st,T,api)};
 startMatch(fx);M.speed=16});
const t0=Date.now();const seen=[];let nC=0,nG=0,last=0;
while(Date.now()-t0<560000){await pg.waitForTimeout(200);
 const st=await pg.evaluate(()=>{const sh=document.querySelector('#scrim .sheet');let txt=null,kind=null;
  const dec=sh&&sh.querySelector('[data-mo^="dec:"]');const g=sh&&sh.querySelector('[data-mo="g_all"]');
  if(dec||g){txt=sh.innerText.slice(0,600);kind=dec?'corner':'gamble'}
  else if(M&&M.paused&&sh){const b2=sh.querySelector('[data-mo="resume"],[data-close],button.x,[data-subin]');if(b2)b2.click()}
  return {done:M&&M.done,txt,kind,min:M&&M.m.min}});
 if(st.txt){seen.push(st.min+"' "+st.txt.replace(/\n/g,' / '));
   if(st.kind==='corner'){nC++;if(nC===1)await pg.screenshot({path:'/home/claude/work/qa/out255/ui_corner.png'});await pg.evaluate(()=>document.querySelector('[data-mo="dec:cn"]').click())}
   else{nG++;await pg.screenshot({path:'/home/claude/work/qa/out255/ui_gamble.png'});await pg.evaluate(()=>document.querySelector('[data-mo="g_all"]').click());await pg.waitForTimeout(400);await pg.screenshot({path:'/home/claude/work/qa/out255/ui_gamble_ov.png'})}}
 if(st.done)break;last=st.min}console.log("last",last,(Date.now()-t0)/1000,JSON.stringify(await pg.evaluate(()=>({p:M.paused,an:M.animating,pend:M.pending,pd:!!M.m.st.pendingDec,sh:(document.querySelector("#scrim .sheet")||{}).innerText,tm:!!M.timer,spd:M.speed}))));
await pg.waitForTimeout(800);
const rep=await pg.evaluate(()=>{const R=S.reports&&S.reports[0];if(!R)return null;reportSheet(R);const el=document.querySelector('#scrim .sheet');return el?el.innerText.slice(0,900):''});
await pg.screenshot({path:'/home/claude/work/qa/out255/ui_rep.png'});
const feed=await pg.evaluate(()=>[...document.querySelectorAll('#mfd *')].map(e=>e.innerText).filter(t=>/분석관|승부수/.test(t)).slice(0,6));
console.log(JSON.stringify({nC,nG,seen,rep},null,1),errs.slice(0,3));await b.close()})();
