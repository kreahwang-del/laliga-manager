// ================= v272 리그별 결정력 보정(사용자 승인 2026-11-02 "엔진 수정까지 해서 한꺼번에 배포") =================
// 세이브 검증: MLS 경기당 3.63골(실제 3.12)·중국 등 과다, EPL 등 과소. 엔진 슈팅 결정이 절대 능력 기준이라 리그마다 득점 수준이 실제와 어긋남
// → 팀 객체에 리그 보정값(lgF, 득점 확률 배수)을 붙이고 엔진이 두 팀 기하평균을 씀(리그 경기는 그 리그 값, 국제전은 중간). 값 = 실제 2024-25 경기당 득점 ÷ 엔진 실측(세이브 상태, AI끼리) — work/sim/lgnorm.js
const LGF_TAB={};
{const _tf=teamFor;teamFor=function(c){const T=_tf.apply(this,arguments);try{if(T){const C=CLUBS[c];const lg=C&&(C.lg||'');const base=lg.replace(/[0-9]+[AB]?$/,m=>m);T.lgF=LGF_TAB[lg]??LGF_TAB[base]??1}}catch(e){}return T}}
