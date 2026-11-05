// 능력치 재점검 시험 변환(페이지 안에서 BASE를 직접 바꿈) — 시뮬 측정용. 같은 규칙을 bake 스크립트가 players.json에 적용
// TX = {lg:{k:팀 격차 배율, a:공격-수비 재배분(공격 항목 +a, 수비 항목 -a)}}
// ① 팀 격차: 구단별 상위 16명(ovr) 필드 평균의 리그 평균 대비 편차를 k배로 → 선수 전원(필드·GK 항목) +(k-1)×편차, ovr +같은 폭×4.15
// ③ 공격수 결정력(fs): 공격수·윙어·공격형 MF 슈팅 +fs — 5대 리그 밖 데이터는 EA 프로필 평행 이동 과정에서 '팀 공격 수준 대비 공격수 슈팅'이 5대 리그보다 약 1점 낮게 들어감(OVR은 그대로, 프로필만 교정)
// ② 공수 재배분: 리그 필드 선수 공격(슈팅·드리블·침투·패스·침착성) +a, 수비(태클·위치선정·공중볼) −a (리그 평균 수준 유지)
const ATT=['shoot','drib','offball','pass','comp'],DEF=['tackle','posit','aerial'];
const FK=['shoot','pass','drib','cross','tackle','posit','offball','aerial','pace','stamina','str','comp','fk','pen'],GKK=['gk_save','gk_air','gk_sweep','gk_dist'];
const cl=v=>Math.max(1,Math.min(20,v));const rep={};
for(const lg in TX){const t=TX[lg];const C=CLUBS.filter(c=>c&&c.lg===lg).map(c=>c.i);if(!C.length)continue;
  const byC={};for(const id in BASE){const c=clubOf(+id);if(C.includes(c))(byC[c]=byC[c]||[]).push(+id)}
  const cm={};for(const c of C){const ps=(byC[c]||[]).map(id=>BASE[id]).filter(p=>p.g!=='GK').sort((a,b)=>b.ovr-a.ovr).slice(0,16);if(!ps.length)continue;let s=0,n=0;ps.forEach(p=>['shoot','pass','drib','tackle','posit','offball','aerial','pace','comp'].forEach(k=>{if(typeof p[k]==='number'){s+=p[k];n++}}));cm[c]=s/n}
  const vals=Object.values(cm);const lm=vals.reduce((a,b)=>a+b,0)/vals.length;let cut=0,tot=0;
  for(const c in cm){const d=((t.k||1)-1)*(cm[c]-lm);for(const id of byC[c]){const p=BASE[id];tot++;
    for(const k of (p.g==='GK'?GKK:FK)){if(typeof p[k]!=='number')continue;let v=p[k]+d;if(p.g!=='GK'&&t.a){if(ATT.includes(k))v+=t.a;if(DEF.includes(k))v-=t.a}if(v>20||v<1)cut++;p[k]=cl(v)}
    if(t.gk&&p.g==='GK'){for(const k of GKK)if(typeof p[k]==='number'){const v=p[k]+t.gk;if(v>20)cut++;p[k]=cl(v)}}/* ⑥ GK 능력(gk): 5대 리그 밖 GK는 EA 70% 혼합 과정에서 팀 수준 대비 5대 리그보다 낮게 들어감 */
    if(t.fs&&['ST','W','AM'].includes(p.g)&&typeof p.shoot==='number'){const v=p.shoot+t.fs;if(v>20)cut++;p.shoot=cl(v)}
    if(typeof p.ovr==='number')p.ovr=Math.max(40,Math.min(95,p.ovr+d*4.15))}}
  // ④ 리그 수준(lv): 리그 전원 능력치 +lv(OVR +lv×4.15) — EA 비교로 리그 전체가 낮게 들어간 리그(KR)
  // ⑤ 최상위 상한 열기(topT): 리그 상위 3명 평균 OVR이 '라리가 상위 10명(90.2) + topT'에 못 미치면, 리그 90백분위 위 선수만 거리에 비례해 끌어올림
  {const ids=[].concat(...C.map(c=>byC[c]||[]));if(t.lv){for(const id of ids){const p=BASE[id];for(const k of (p.g==='GK'?GKK:FK))if(typeof p[k]==='number')p[k]=cl(p[k]+t.lv);p.ovr=Math.max(40,Math.min(95,p.ovr+t.lv*4.15))}}
   if(t.topT!=null){const ps=ids.map(id=>BASE[id]).sort((a,b)=>b.ovr-a.ovr);const top3=(ps[0].ovr+ps[1].ovr+ps[2].ovr)/3,p90=ps[Math.floor(ps.length*.1)].ovr;const need=(90.2+t.topT)-top3;
    if(need>0&&top3>p90){for(const p of ps){if(p.ovr<=p90)break;const d=need*Math.min(1,(p.ovr-p90)/(top3-p90));for(const k of (p.g==='GK'?GKK:FK))if(typeof p[k]==='number')p[k]=cl(p[k]+d/4.15);p.ovr=Math.max(40,Math.min(95,p.ovr+d))}}
    t._top={top3:+top3.toFixed(1),p90,need:+need.toFixed(1)}}}
  rep[lg]={top:t._top,clubs:vals.length,lm:+lm.toFixed(2),sd0:+Math.sqrt(vals.reduce((a,b)=>a+(b-lm)**2,0)/vals.length).toFixed(3),cut,tot}}
for(const k in LGM)delete LGM[k];try{for(const k in LGOFF)delete LGOFF[k]}catch(e){}SQC=null;
return rep;
