// ================= v293 5대 리그 밖 GK 능력 교정(데이터 구조 규칙, 사용자 결정 2026-11-05 "2"=넘치는 리그 다듬은 뒤 배포) =================
// 근거: 5대 리그 밖 GK 능력치는 EA 70% 혼합으로 만들어져 '팀 수준 대비 GK'가 5대 리그보다 0.4~1.3점 낮음 → 엔진 GK 효과 대칭화(gkSvM 2) 후 JP·BR·EN2·SC·AR 득점 과다
// 규칙: 리그별 부족분(0.3 초과)만큼 GK 4항목 + (work/attrfix/tx_gk_full.json), OVR은 GK 가중치로 재계산, 가치 동반. 기존 세이브: 불러올 때 1회(data/mig293.json)
const MIG293=__DATA__("mig293");
const MIGK293=['shoot','pass','drib','cross','tackle','posit','offball','aerial','pace','stamina','gk_save','gk_air','gk_sweep','gk_dist','str','comp','fk','pen'];
function mig293(){if(!S||S.mig293)return 0;let n=0;
  for(const id in MIG293){const q=S.ps&&S.ps[id];if(!q)continue;const d=MIG293[id];let hit=0;
    if(q.af){MIGK293.forEach((k,i)=>{const v=d[1+i];if(!v||q.af[k]==null)return;q.af[k]=Math.max(1,Math.min(20,q.af[k]+v));q[k]=Math.round(q.af[k]);hit=1})}
    else{MIGK293.forEach((k,i)=>{const v=d[1+i];if(v&&typeof q[k]==='number'){q[k]=Math.max(1,Math.min(20,q[k]+v));hit=1}})}
    if(d[0]){if(typeof q.ovrS==='number')q.ovrS=Math.max(40,Math.min(95,q.ovrS+d[0]));/* 시즌 시작 OVR도 같이 옮겨 '이번 시즌 성장'이 부풀지 않게(QA 지적) */if(q.ovrF!=null){q.ovrF=Math.max(40,Math.min(95,q.ovrF+d[0]));q.ovr=Math.round(q.ovrF);hit=1}else if(typeof q.ovr==='number'){q.ovr=Math.max(40,Math.min(95,q.ovr+d[0]));hit=1}
      if(typeof q.pa==='number')q.pa=Math.max(q.pa+d[0],q.ovr||0);if(typeof q.val==='number')q.val=Math.round(q.val*Math.pow(10,.06*d[0]))}
    n+=hit}
  S.mig293=1;try{S.news=S.news||[];S.news.unshift({d:S.date,t:`골키퍼 능력치 재조정(v293): 5대 리그 밖 골키퍼 ${n.toLocaleString()}명의 능력치를 같은 팀 선수 수준에 맞게 올렸습니다. 지금까지의 성장은 그대로 유지됩니다.`})}catch(e){}
  return n}
{const _dl=devLoad;devLoad=function(){const r=_dl.apply(this,arguments);try{mig293()}catch(e){console.error(e)}return r}}
{const _sg=startGame;startGame=function(){const r=_sg.apply(this,arguments);try{if(S)S.mig293=1}catch(e){}return r}}
