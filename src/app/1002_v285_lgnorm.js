// ================= v285 리그 보정 개편(사용자 승인 2026-11-03 "3단계까지 쭉 진행해서 한번에 배포") =================
// 문제: ① engShift가 능력치를 항목별로 라리가 평균에 맞춰 리그 고유 구조(MLS GK 약세 등)를 지움 → ② 지운 만큼을 결정력 배율(ENGF2 0.81~1.74 × v272 LGF)로 골만 채움
//       → 표시 xG와 득점이 어긋남(MLS 득점/xG 약 1.3), 시즌이 지나며 리그 득점 흔들림, LGF는 국제전에도 걸림, 라리가 외 중거리 결정력 기본값 1.16(엔진 1.12)
// 개편: ① 리그 하나의 오프셋(필드 항목 평균 차이)으로 모든 항목·GK를 같은 폭 이동 → 리그 내부 구조 유지
//       ② 보정표 하나(ENGF3, 실제 2024-25 경기당 득점 ÷ 엔진 실측)로 통합, v272 LGF 제거(국제전은 보정 없음)
//       ③ 표시 xG에도 같은 계수(xgDisp) → 리그 공통 득점/xG 1 근처 유지 ④ 중거리 결정력 기본값 1.12로 통일
// 라리가(ES) 경기는 이동·계수 없음(기준선 불변)
// 계수 = (실제 2024-25 경기당 득점 ÷ 엔진 실측(신규·진행 세이브 각 120경기 평균))^(1/0.964), 0.75~1.35 제한, ±4% 이내는 1
const ENGF3={US:1.27,EN:1.06,DE:1.18,FR:1.19,PT:1.16,NL:1.35,BE:1.19,TR:1.14,SC:1.35,CH:1.35,AT:1.35,DK:1.35,EN2:1.3,DE2:1.35,IT2:1.11,FR2:1.28,ES2:1.06,ES3B:.93,SA:1.17,MX:1.25,BR:.92,JP:1.11,CN:1.35,KR:1.28};
function engF3(k){const f=ENGF3[k];return f==null?1:f}
engShift=function(T,lg){if(!lg||lg==='ES'||!T||!T.xi)return T;const d=lgOff(lg);if(!d)return T;
  const sh=p=>{if(!p)return p;const q=Object.assign({},p);ENG_K.forEach(k=>{if(typeof q[k]==='number')q[k]=Math.max(1,Math.min(20,q[k]+d))});return q};
  return Object.assign({},T,{xi:T.xi.map(sh),bench:(T.bench||[]).map(sh)})};
const LGOFF={};
function lgOff(lg){const key=lg+':'+(S&&S.season);if(LGOFF[key]!=null)return LGOFF[key];const L=lgMean(lg),E=lgMean('ES');let s=0,n=0;
  ENG_K.forEach(k=>{if(k.startsWith('gk')||k==='fk'||k==='pen')return;const kk='f:'+k;if(L[kk]!=null&&E[kk]!=null){s+=E[kk]-L[kk];n++}});return LGOFF[key]=n?s/n:0}
engCfg=function(H,Aw){try{const k=engLg(H,Aw);if(!k||k==='ES')return null;const f=engF3(k);return {finK:1.25*f,finK5:1.12*f,xgDisp:1.1*f}}catch(e){return null}};
// v272 리그 결정력(LGF) 제거: ENGF3로 통합
try{for(const k in LGF_TAB)LGF_TAB[k]=1}catch(e){}
