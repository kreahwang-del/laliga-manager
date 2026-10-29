// ================= v151: 체력 회복을 남은 피로에 비례해 빠르게 =================
// 이전: 하루 +3 고정(경기 하락 9~15) → 주 2경기 뛰는 주전이 쉬어도 못 따라가 시즌 중 39 수준까지 계속 하락(주 1경기면 완전 회복)
// 실제 경기 후 회복 72시간 안팎 → 추가 회복 (100-체력)×0.05/일: 같은 11명이 주 2경기를 계속 뛰어도 90 안팎에서 멈춤(이전엔 주마다 약 2씩 계속 하락), 주 1경기면 100
const FIT_RK=.22; /* v179: .05 → .22. 사흘 간격 연전(주 2경기)에서 체력이 50~70%대로 계속 내려가 있던 문제(사용자 로마 세이브: 경기 직후 32~60). 실제 회복 연구(경기 후 72시간이면 경기력 지표 대부분 회복, Nédélec 2012)와 FM 수준에 맞춰 경기 직후 약 75~80 → 이틀 뒤 약 92 → 사흘 뒤 약 97 */
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);try{if(S&&S.ps)for(const id in S.ps){const q=S.ps[id];if(q&&q.fit!=null&&q.fit<100&&q.played!==S.date)q.fit=Math.min(100,Math.round(q.fit+(100-q.fit)*FIT_RK))}}catch(e){console.error(e)}return r}}

