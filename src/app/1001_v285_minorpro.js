// v285 2부가 없는 유럽 리그 간이 승강(사용자 요청 2026-11-03 B안)
// 대상: 포르투갈·네덜란드·벨기에·터키·스코틀랜드·스위스·오스트리아. 각 리그의 '하부'(lg+'L', 2025-26 실제 강등 구단) 묶음과 맞교환.
// 1부 최하위 N팀 ↔ 하부 상위 N팀. 하부는 경기 일정이 없어 '빠른 계산' 대신 스쿼드 상위 16명 평균 + 시즌별 난수(±3)로 순위 결정.
// 우리 구단은 하부 리그 경기가 없어 강등 제외(바로 위 팀이 대신 강등). 강등팀 상위 20% 선수는 50% 확률로 같은 리그 구단에 이적(4대 리그 승강과 같음)
const MINOR_PRO={PT:2,NL:2,BE:1,TR:3,SC:1,CH:1,AT:1};
function proRelMinor(){const msgs=[];S.clubB=S.clubB||{};
  const str=c=>{const s=squadOf(c).slice().sort((a,b)=>b.ovr-a.ovr).slice(0,16);return s.length?s.reduce((a,p)=>a+p.ovr,0)/16:0};
  const setLg=(c,lg)=>{const C=CLUBS[c];C.lg=lg;S.clubB[c]=Object.assign(S.clubB[c]||{},{b1:C.b1,budget:C.budget,rep:C.rep,lg})};
  for(const lg in MINOR_PRO){const pool=lgClubs(lg+'L');if(!pool.length)continue;const t1=tableLg(lg);if(t1.length<8||!t1.some(t=>t.p>0))continue;
    const n=Math.min(MINOR_PRO[lg],pool.length);
    const down=t1.map(t=>t.id).filter(c=>c!==S.club).slice(-n);
    const up=pool.map(c=>[c,str(c)+(hsh('mpro'+c+S.season)-.5)*6]).sort((a,b)=>b[1]-a[1]).slice(0,n).map(x=>x[0]);
    const top=lgClubs(lg).flatMap(c=>squadOf(c).map(p=>p.ovr)).sort((a,b)=>b-a);const thr=top[Math.floor(top.length*.2)]||80;
    down.forEach(c=>{const C=CLUBS[c];C.b1=C.b1??C.budget;C.budget=Math.round(C.b1*.5*10)/10;C.rep=Math.max(10,C.rep-5);
      squadOf(c).filter(p=>p.ovr>=thr).forEach(p=>{if(hsh(p.id+'mrel'+S.season)<.5){const buyers=lgClubs(lg).filter(b=>!down.includes(b)&&b!==S.club);if(buyers.length){const b=buyers[Math.floor(hsh(p.id+'mrb'+S.season)*buyers.length)];try{completeTransfer(p.id,b,Math.round(p.val*.8),{cEnd:`${S.season+4}-06-30`})}catch(e){}}}});
      setLg(c,lg+'L')});
    const minB=Math.min(...lgClubs(lg).filter(c=>!down.includes(c)).map(c=>CLUBS[c].budget));
    up.forEach(c=>{const C=CLUBS[c];if(C.b1==null)C.b1=Math.max(minB,Math.round(C.budget*1.5*10)/10);C.budget=C.b1;C.rep=Math.min(95,C.rep+5);setLg(c,lg)});
    msgs.push(`${LGN[lg]||lg} 승격 ${up.map(c=>CLUBS[c].short||CLUBS[c].name).join('·')} · 강등 ${down.map(c=>CLUBS[c].short||CLUBS[c].name).join('·')}`)}
  if(msgs.length){S.news.unshift({d:S.date,t:'유럽 중소 리그 승강',b:msgs.join(' / '),v:0,big:true});SQC=null}
  return msgs}
{const _nsM=newSeason;newSeason=function(y,first){if(!first&&S.fxE){try{proRelMinor()}catch(e){console.error(e)}}return _nsM(y,first)}}
