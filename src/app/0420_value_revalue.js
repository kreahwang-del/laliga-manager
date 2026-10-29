// ================= 시즌 성과 → 시장가치 재산정(v132) =================
// 근거: Transfermarkt 공개 데이터(9개 리그 2014~2023, 33,070 선수-시즌) 회귀 log(다음 여름 가치/이번 여름 가치)
//   리그 출전시간 비율 +1.738·비율² −0.718, (골+도움)/90 포지션 평균 대비 × 공격 가중 +0.558, 우승 +0.196, 2~4위 +0.132,
//   강등권 −0.214, 유럽대회 출전 비율 +0.193, log 가치 −0.201(평균 회귀) — 나이·능력치 변화는 기존 월간 공식(능력치·나이 곡선)이 담당
//   평균 선수의 성과항 0.5848을 빼서 '보통 시즌 = 가치 유지'. 성과 배수 pm은 해마다 0.8배로 옅어지고(평균 회귀) 새 시즌 성과가 더해짐
const MV_W={sh:1.738,sh2:-.718,ga:.558,ch:.196,top:.132,rel:-.214,eu:.193,c0:.5848,keep:.8};
// v136 성과항 기대치를 가치 수준별로 중심화: 같은 회귀 표본에서 성과항 평균이 가치가 높을수록 큼(€0.2M대 .31 → €50M+ 1.15).
//   이전엔 전체 평균(.5848)만 빼서 스타(높은 가치·주전·상위팀)가 매년 크게 부풀었음(음바페 €138M→€322M). 회귀의 log가치 −0.201 평균회귀 역할을 대신함
const MV_EP=[[-1.5,.314],[-.5,.449],[.5,.53],[1.5,.638],[2.5,.765],[3.5,.929],[4.5,1.154],[5.5,1.35]];
function mvExpPerf(v){const x=Math.log(Math.max(1e5,v)/1e6);if(x<=MV_EP[0][0])return MV_EP[0][1];for(let i=1;i<MV_EP.length;i++)if(x<=MV_EP[i][0]){const [x0,y0]=MV_EP[i-1],[x1,y1]=MV_EP[i];return y0+(y1-y0)*(x-x0)/(x1-x0)}return MV_EP[MV_EP.length-1][1]}
/* v161 성과항 나이 중심화: 게임 1시즌 실측 평균 성과항이 <21 −.29·21~23 −.10·24~26 0·27~29 +.07·30~32 +.22·33+ +.41(노장 출전 비중이 가치 대비 큼)
   → 나이 효과는 가치 나이 경로(valAge2)가 맡고 pm은 '나이 대비 잘한 시즌'만 반영 */
function mvAgeAdj(a){return a<21?-.285:a<24?-.099:a<27?-.003:a<30?.073:a<33?.224:.408}
const MV_GA={Attack:.525,Midfield:.244,Defender:.107,Goalkeeper:.003};
function mvGrp(g){return g==='GK'?'Goalkeeper':(g==='ST'||g==='W')?'Attack':(g==='CB'||g==='FB')?'Defender':'Midfield'}
function mvLgTable(c){try{const lg=CLUBS[c].lg;const fx=(typeof fxLg==='function'?fxLg(lg):null)||[];const t={};
  for(const f of fx){if(!f.res||f.cup!=null||f.eu||f.po)continue;const [a,b]=f.res.sc;for(const id of [f.h,f.a])t[id]=t[id]||{p:0,gf:0,ga:0,n:0};t[f.h].n++;t[f.a].n++;t[f.h].gf+=a;t[f.h].ga+=b;t[f.a].gf+=b;t[f.a].ga+=a;
    if(a>b)t[f.h].p+=3;else if(a<b)t[f.a].p+=3;else{t[f.h].p++;t[f.a].p++}}
  const ids=Object.keys(t).sort((x,y)=>t[y].p-t[x].p||(t[y].gf-t[y].ga)-(t[x].gf-t[x].ga));const i=ids.indexOf(String(c));return i<0?null:{rank:i+1,n:ids.length,games:t[c].n}}catch(e){return null}}
function mvEuGames(c){let n=0;try{const seen=new Set();const walk=o=>{if(!o||typeof o!=='object'||seen.has(o))return;seen.add(o);if(Array.isArray(o)){o.forEach(walk);return}
  if(o.h!=null&&o.a!=null&&o.res){if(o.h===c||o.a===c)n++;return}for(const k in o)if(typeof o[k]==='object')walk(o[k])};if(S.eu&&S.eu.comp)walk(S.eu.comp)}catch(e){}return n}
function mvSeasonEnd(){if(!S||!S.ps)return;const y=S.season,tbl={},eu={},rep=[];
  for(const id in BASE){const c=clubOf(+id);if(c==null||c<0||!CLUBS[c])continue;const q=S.ps[id];if(!q||q.mvY===y)continue;
    if(!(c in tbl)){tbl[c]=mvLgTable(c);eu[c]=mvEuGames(c)}const T=tbl[c];if(!T||T.games<10)continue;
    const p=pl(+id);const sh=Math.min(1.1,(q.mins||0)/(T.games*90));const g=mvGrp(p.g);const att=g==='Attack'?1:g==='Midfield'?.6:g==='Defender'?.2:0;
    const ga90=(q.mins||0)>=450?((q.gl||0)+(q.as||0))/((q.mins||0)/90):0;const gaRel=sh>.15?(ga90-MV_GA[g])*att:0;
    const euSh=Math.min(1.2,sh*eu[c]/10);
    const term=MV_W.sh*sh+MV_W.sh2*sh*sh+MV_W.ga*gaRel+(T.rank===1?MV_W.ch:0)+(T.rank>=2&&T.rank<=4?MV_W.top:0)+(T.rank>T.n-3?MV_W.rel:0)+MV_W.eu*euSh-mvExpPerf(q.val??BASE[id].val)-mvAgeAdj(ageOf(p));
    const lp0=Math.log(q.pm||1),lp=Math.max(-1.2,Math.min(1.1,MV_W.keep*lp0+term)),pm=Math.exp(lp);const v0=q.val??BASE[id].val;
    q.pm=+pm.toFixed(4);q.mvY=y;if(v0){q.val=Math.round(v0*pm/Math.exp(lp0))}
    q.mvLast={y,d:+(Math.exp(lp-lp0)-1).toFixed(3),sh:+sh.toFixed(2),ga:+ga90.toFixed(2),rank:T.rank,eu:eu[c]};
    if(c===S.club)rep.push([p,q.mvLast.d,v0,q.val])}
  if(rep.length&&typeof inbox==='function'){rep.sort((a,b)=>b[1]-a[1]);const fmt=r=>`${esc(r[0].name)} ${r[1]>=0?'+':''}${Math.round(r[1]*100)}% (${money(r[2])} → ${money(r[3])})`;
    const up=rep.filter(r=>r[1]>=.05).slice(0,5),dn=rep.filter(r=>r[1]<=-.05).slice(-5).reverse();
    inbox('board','',`시즌 성과 반영 시장가치 재평가`,`리그 출전 시간·공격 포인트·팀 순위·유럽대회 출전을 반영해 선수 가치를 다시 매겼습니다(실제 이적시장 변동 경향 기준).${up.length?'<br><b>상승</b><br>'+up.map(fmt).join('<br>'):''}${dn.length?'<br><b>하락</b><br>'+dn.map(fmt).join('<br>'):''}`)}}
{const _roMV=rollover;rollover=function(){try{mvSeasonEnd()}catch(e){console.error(e)}return _roMV.apply(this,arguments)}}
// v145 빠른 경기(다른 리그) 출전 시간 현실화: 교체 없이 선발 11명 90분만 기록되던 것을 실제 분포에 가깝게
//  (실측 5대 리그: 교체 5명 시대 경기당 팀 교체 약 4.5명, 교체 투입 평균 약 25분) — 선발 중 4~5명을 60~80분으로, 그 시간을 벤치 상위 선수에게
{const _fm=fastMatch;fastMatch=function(f){const lgM=f.cup==null&&!f.eu&&!f.po&&!f.ko&&!f.md;if(!lgM||!S)return _fm.apply(this,arguments);const snap={};
  [f.h,f.a].forEach(c=>{if(c===S.club||!CLUBS[c])return;squadOf(c).forEach(p=>{const q=S.ps[p.id];snap[p.id]=q?(q.mins||0):0})});const r=_fm.apply(this,arguments);
  try{[f.h,f.a].forEach(c=>{if(c===S.club||!CLUBS[c])return;const sq=squadOf(c);const st=sq.filter(p=>((S.ps[p.id]||{}).mins||0)-(snap[p.id]||0)===90&&p.g!=='GK');if(st.length<8)return;
    const bench=sq.filter(p=>((S.ps[p.id]||{}).mins||0)===(snap[p.id]||0)&&!(p.injD>0)&&p.g!=='GK'&&!((S.ps[p.id]||{}).res&&ageOf(p)>=23)).sort((a,b)=>b.ovr-a.ovr).slice(0,7);if(!bench.length)return;
    const k=4+(hsh(f.d+':'+c+'n')<.5?1:0);const w=p=>(p.g==='ST'||p.g==='W'||p.g==='AM'?3:p.g==='CM'||p.g==='DM'?2:1);const pick=st.slice().sort((a,b)=>w(b)*hsh(f.d+b.id)-w(a)*hsh(f.d+a.id)).slice(0,Math.min(k,bench.length));
    pick.forEach((p,i)=>{const off=Math.round(60+hsh(f.d+':o'+p.id)*25);const sub=bench[i];const q=S.ps[p.id];q.mins-=90-off;const qb=S.ps[sub.id]=S.ps[sub.id]||{};qb.mins=(qb.mins||0)+(90-off);qb.apps=(qb.apps||0)+1;{/* v216 교체 출전에도 평점 기록(이전엔 출전 수만 늘어 시즌 평균 평점이 4점대로 깎임) */const sc=f.res&&f.res.sc;const me=c===f.h?0:1;const gf=sc?sc[me]:0,ga=sc?sc[1-me]:0;let rr=6.35+(gf>ga?.2:gf<ga?-.2:0)+gN(hsh('sr1'+sub.id+f.d),hsh('sr2'+sub.id+f.d))*.25;qb.rs=(qb.rs||0)+Math.round(Math.max(5.5,Math.min(8,rr))*10)/10}qb.played=S.date})})}catch(e){console.error(e)}return r}}

