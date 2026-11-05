const {chromium}=require('playwright');const fs=require('fs');(async()=>{const b=await chromium.launch();const pg=await b.newPage();
await pg.route(/tmssl|transfermarkt|googleapis|gstatic|githubusercontent/,r=>r.abort());await pg.goto('file://'+process.env.HTML,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(1200);
await pg.evaluate(t=>{window.__SV=t},fs.readFileSync(process.env.SV,'utf8'));
const r=await pg.evaluate(()=>{S=JSON.parse(window.__SV);psUnpack(S.ps);devLoad();careerLoad();SQC=null;save=()=>{};const o={rows:[],tot:0,viol:0,violNoBench:0,noDomLine:0};
  for(const c of CLUBS){if(!c||!SQR[c.lg]||!SQR[c.lg].m||c.i===S.club)continue;const m=SQR[c.lg].m;const T=teamFor(c.i);o.tot++;const xf=T.xi.filter(p=>isFor(p,c.i)).length;if(xf<=m)continue;o.viol++;
    // 벤치를 후보에 포함하면 맞출 수 있나
    const xi=T.xi.slice();const used=new Set(xi.map(p=>p.id));let n=xf;while(n>m){let wi=-1;xi.forEach((p,i)=>{if(isFor(p,c.i)&&(wi<0||p.ovr<xi[wi].ovr))wi=i});const sq=squadOf(c.i).filter(q=>!used.has(q.id)&&!isFor(q,c.i)&&sqrAvail(q,c.i));const g=xi[wi].g;
      const q=sq.filter(x=>x.g===g)[0]||sq.filter(x=>LINE[x.g]===LINE[g])[0]||(g==='GK'?null:sq.filter(x=>x.g!=='GK')[0]);if(!q)break;used.add(q.id);xi[wi]=q;n--}
    if(n>m)o.violNoBench++;
    if(o.rows.length<6)o.rows.push({c:c.short,lg:c.lg,xf,bench:(T.bench||[]).length,benchDom:(T.bench||[]).filter(p=>!isFor(p,c.i)).length,sq:squadOf(c.i).length,dom:squadOf(c.i).filter(p=>!isFor(p,c.i)).length,afterFixWithBench:n})}
  return o});console.log(JSON.stringify(r));await b.close();process.exit(0)})();
