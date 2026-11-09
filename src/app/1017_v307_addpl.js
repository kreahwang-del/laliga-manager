// ================= v307 빠진 선수 2,501명 추가(사용자 결정 2026-11-10) =================
// 근거: 사용자 제공 선수 목록(트랜스퍼마르크트 기반, 개인용)에 있으나 게임에 없던 1군 선수. 구단당 30명까지, 시장가치 높은 순
// 능력치: 기존 '추정 선수' 방식 — OVR = 리그별 추정식(시장가치·나이·GK, 기존 선수로 학습), 세부 = 새 선수 생성 틀(est=1). 스크립트 work/addpl/
// 기존 세이브: 사용자 구단에 새로 생긴 선수는 자유계약으로 보냄(갑자기 인원·연봉이 늘지 않게). AI 구단은 그대로(30명 넘으면 이적시장 정리 규칙이 처리)
function mig307(){if(!S||S.mig307)return;S.mig307=1;const L=G.add307||[];let n=0;
  for(const id of L){if(!BASE[id])continue;const q=S.ps[id];if(q&&q.club!==undefined)continue;if(BASE[id].club===S.club){S.ps[id]=Object.assign(q||{},{club:FA});n++}}
  if(n)SQC=null;return n}
{const _dl=devLoad;devLoad=function(){const r=_dl.apply(this,arguments);try{mig307()}catch(e){console.error(e)}return r}}
{const _sg=startGame;startGame=function(){const r=_sg.apply(this,arguments);try{if(S)S.mig307=1}catch(e){}return r}}
