// 세이브 리그별 경기당 득점 + US 리그 AI 대진 엔진 재현(득점 원인 분해)
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1500);
await pg.evaluate(sv=>{window.__SV=sv},fs.readFileSync(process.env.SAVE,'utf8'));
const r=await pg.evaluate(()=>{S=JSON.parse(window.__SV);save=()=>{};devLoad();careerLoad();SQC=null;
 const by={};const all=[...(S.fixtures||[]),...Object.values(S.fxE||{}).flat?.()||[]];
 (S.fixtures||[]).forEach(f=>{if(!f.res)return;const lg=CLUBS[f.h].lg;const o=by[lg]=by[lg]||{n:0,g:0,d:0,h:0,me:0};o.n++;o.g+=f.res.sc[0]+f.res.sc[1];o.d+=f.res.sc[0]===f.res.sc[1];o.h+=f.res.sc[0]>f.res.sc[1];if(f.h===S.club||f.a===S.club)o.me++});
 const fxE=S.fxE||{};const byE={};for(const k in fxE){const L=fxE[k];if(!Array.isArray(L))continue;L.forEach(f=>{if(!f||!f.res)return;const o=byE[k]=byE[k]||{n:0,g:0};o.n++;o.g+=f.res.sc[0]+f.res.sc[1]})}
 // US 리그 AI끼리 엔진 재현 60경기
 const us=CLUBS.filter(c=>c&&c.lg==='US'&&c.i!==S.club);let x=7;Math.random=()=>{x=(x*16807)%2147483647;return x/2147483647};const R=[];const pre={};
 for(let k=0;k<60;k++){const h=us[(k*7)%us.length],a=us[(k*11+3)%us.length];if(h===a)continue;const H=teamFor(h.i),A=teamFor(a.i);pre[H.preset]=(pre[H.preset]||0)+1;const m=runMatch(H,A,{});while(!m.done)m.step();const st=m.st;
  R.push({g:st.sc[0]+st.sc[1],xg:st.xg[0]+st.xg[1],sh:st.sh[0]+st.sh[1],ty:st.ev.filter(e=>e.t==='goal').map(e=>e.type)})}
 const gk=CLUBS.filter(c=>c&&c.lg==='US').map(c=>{const sq=squadOf(c.i);const g=sq.filter(p=>p.g==='GK').sort((a,b)=>b.ovr-a.ovr)[0];const d=sq.filter(p=>['CB','FB'].includes(p.g)).sort((a,b)=>b.ovr-a.ovr).slice(0,4);const f=sq.filter(p=>['ST','W','AM'].includes(p.g)).sort((a,b)=>b.ovr-a.ovr).slice(0,3);return [g?g.ovr:0,d.reduce((s,p)=>s+p.ovr,0)/4,f.reduce((s,p)=>s+p.ovr,0)/3]});
 const es=CLUBS.filter(c=>c&&c.lg==='ES').map(c=>{const sq=squadOf(c.i);const g=sq.filter(p=>p.g==='GK').sort((a,b)=>b.ovr-a.ovr)[0];const d=sq.filter(p=>['CB','FB'].includes(p.g)).sort((a,b)=>b.ovr-a.ovr).slice(0,4);const f=sq.filter(p=>['ST','W','AM'].includes(p.g)).sort((a,b)=>b.ovr-a.ovr).slice(0,3);return [g?g.ovr:0,d.reduce((s,p)=>s+p.ovr,0)/4,f.reduce((s,p)=>s+p.ovr,0)/3]});
 const av=A=>[0,1,2].map(i=>+(A.reduce((s,v)=>s+v[i],0)/A.length).toFixed(1));
 const tys={};R.forEach(o=>o.ty.forEach(t=>tys[t]=(tys[t]||0)+1));
 return {by,byE,sim:{n:R.length,g:+(R.reduce((s,o)=>s+o.g,0)/R.length).toFixed(2),xg:+(R.reduce((s,o)=>s+o.xg,0)/R.length).toFixed(2),sh:+(R.reduce((s,o)=>s+o.sh,0)/R.length).toFixed(1),tys,pre},gkdfUS:av(gk),gkdfES:av(es)}});
console.log(JSON.stringify(r,null,1));if(errs.length)console.error(errs.slice(0,3));process.exit(0)})();
