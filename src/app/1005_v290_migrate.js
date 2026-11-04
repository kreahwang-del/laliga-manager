// ================= v290 능력치 재점검: 기존 세이브 이전(사용자 결정 2026-11-04: 기존 세이브에도 적용, 성장분 보존) =================
// v290에서 5대 리그 밖 선수 능력치·OVR·시장가치를 데이터(players.json)에서 다시 산정(팀 격차·공수 균형·공격수 슈팅·KR 수준·리그 최상위 상한, CN 득점 상위 5명)
// 기존 세이브는 성장 기록(S.ps[id].af 절대값·ovrF)이 있어 데이터만 바꾸면 화면 능력치는 옛 값 그대로인데, 월간 가치 계산은 새 기준 OVR을 써서 가치가 크게 깎임
// → 불러올 때 한 번, 선수별 변화량(v290 − v289 데이터, data/mig290.json)을 성장 기록에 더함. 성장분은 그대로 보존. 새 게임은 표시만 하고 건너뜀
const MIG290=__DATA__("mig290");
const MIG290_K=['shoot','pass','drib','cross','tackle','posit','offball','aerial','pace','stamina','gk_save','gk_air','gk_sweep','gk_dist','str','comp','fk','pen'];
function mig290(){if(!S||S.mig290)return 0;let n=0;
  for(const id in MIG290){const q=S.ps&&S.ps[id];if(!q)continue;const d=MIG290[id];let hit=0;
    if(q.af){MIG290_K.forEach((k,i)=>{const v=d[1+i];if(!v||q.af[k]==null)return;q.af[k]=Math.max(1,Math.min(20,q.af[k]+v));q[k]=Math.round(q.af[k]);hit=1})}
    else{MIG290_K.forEach((k,i)=>{const v=d[1+i];if(v&&typeof q[k]==='number'){q[k]=Math.max(1,Math.min(20,q[k]+v));hit=1}})}
    if(d[0]){if(typeof q.ovrS==='number')q.ovrS=Math.max(40,Math.min(95,q.ovrS+d[0]));/* 시즌 시작 OVR도 같이 옮겨 '이번 시즌 성장'이 부풀지 않게(QA 지적) */if(q.ovrF!=null){q.ovrF=Math.max(40,Math.min(95,q.ovrF+d[0]));q.ovr=Math.round(q.ovrF);hit=1}else if(typeof q.ovr==='number'){q.ovr=Math.max(40,Math.min(95,q.ovr+d[0]));hit=1}
      if(typeof q.pa==='number')q.pa=Math.max(q.pa+d[0],q.ovr||0);if(typeof q.val==='number')q.val=Math.round(q.val*Math.pow(10,.06*d[0]))}
    n+=hit}
  S.mig290=1;try{S.news=S.news||[];S.news.unshift({d:S.date,t:`리그 능력치 재조정(v291): 5대 리그 밖 리그 선수 ${n.toLocaleString()}명의 능력치·OVR을 실제 리그 수준에 맞춰 조정했습니다. 지금까지의 성장은 그대로 유지됩니다.`})}catch(e){}
  return n}
{const _dl=devLoad;devLoad=function(){const r=_dl.apply(this,arguments);try{mig290()}catch(e){console.error(e)}return r}}
{const _sg=startGame;startGame=function(){const r=_sg.apply(this,arguments);try{if(S)S.mig290=1}catch(e){}return r}}
