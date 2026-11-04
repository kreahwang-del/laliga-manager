// ================= v292 리그 공격·수비 균형 보정(사용자 결정 2026-11-05 "진행해봐") =================
// 경기 성향(DNA)으로는 리그 득점이 움직이지 않던 4개 리그를 선수 능력치 데이터로 조정: SC·CN 공격 +0.5/수비 −0.5, CH +0.4/−0.4, AR −0.5/+0.5(20점 척도, 정수 디더링, OVR은 포지션 가중치로 재계산, 가치 ×10^(0.06ΔOVR))
// 근거가 '리그 득점을 실제에 맞추기'인 결과 맞춤 조정이라 폭을 ±0.5로 제한하고 공개(work/attrfix/tx_v292.json)
// 기존 세이브: 불러올 때 1회 선수별 변화량(data/mig292.json)을 성장 기록에 더함(1005와 같은 방식)
const MIG292=__DATA__("mig292");
const MIGK292=['shoot','pass','drib','cross','tackle','posit','offball','aerial','pace','stamina','gk_save','gk_air','gk_sweep','gk_dist','str','comp','fk','pen'];
function mig292(){if(!S||S.mig292)return 0;let n=0;
  for(const id in MIG292){const q=S.ps&&S.ps[id];if(!q)continue;const d=MIG292[id];let hit=0;
    if(q.af){MIGK292.forEach((k,i)=>{const v=d[1+i];if(!v||q.af[k]==null)return;q.af[k]=Math.max(1,Math.min(20,q.af[k]+v));q[k]=Math.round(q.af[k]);hit=1})}
    else{MIGK292.forEach((k,i)=>{const v=d[1+i];if(v&&typeof q[k]==='number'){q[k]=Math.max(1,Math.min(20,q[k]+v));hit=1}})}
    if(d[0]){if(typeof q.ovrS==='number')q.ovrS=Math.max(40,Math.min(95,q.ovrS+d[0]));/* 시즌 시작 OVR도 같이 옮겨 '이번 시즌 성장'이 부풀지 않게(QA 지적) */if(q.ovrF!=null){q.ovrF=Math.max(40,Math.min(95,q.ovrF+d[0]));q.ovr=Math.round(q.ovrF);hit=1}else if(typeof q.ovr==='number'){q.ovr=Math.max(40,Math.min(95,q.ovr+d[0]));hit=1}
      if(typeof q.pa==='number')q.pa=Math.max(q.pa+d[0],q.ovr||0);if(typeof q.val==='number')q.val=Math.round(q.val*Math.pow(10,.06*d[0]))}
    n+=hit}
  S.mig292=1;try{S.news=S.news||[];S.news.unshift({d:S.date,t:`리그 능력치 재조정(v292): 스코틀랜드·스위스·중국·아르헨티나 리그 선수 ${n.toLocaleString()}명의 공격·수비 능력치를 실제 리그 득점 수준에 맞춰 조정했습니다. 지금까지의 성장은 그대로 유지됩니다.`})}catch(e){}
  return n}
{const _dl=devLoad;devLoad=function(){const r=_dl.apply(this,arguments);try{mig292()}catch(e){console.error(e)}return r}}
{const _sg=startGame;startGame=function(){const r=_sg.apply(this,arguments);try{if(S)S.mig292=1}catch(e){}return r}}
