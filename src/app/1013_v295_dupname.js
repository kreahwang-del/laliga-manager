// ================= v295 같은 팀 같은 짧은 이름 구분(사용자 지적 2026-11-05: 광주 Jack Iredale·John Iredale이 둘 다 'Iredale') =================
// 짧은 이름(성, 한국 선수는 이름)이 같은 팀 안에서 겹치면 그 선수들은 '이름 성' 전체로 표시. 이적으로 팀이 바뀌므로 선수단 캐시를 다시 만들 때마다 다시 계산
const DUPN={};let DUPN_D=null;/* DUPN[이름] = 덮어쓰기 전 원래 값(없으면 null) */
function dupNameBuild(){try{const K=window.__KRS;if(!K||!SQC||!S)return;if(DUPN_D===S.date)return;DUPN_D=S.date;/* 하루 한 번(성능) */for(const n in DUPN){if(DUPN[n]==null)delete K[n];else K[n]=DUPN[n];delete DUPN[n]}
  for(const c in SQC){if(+c<0)continue;const L=SQC[c];if(!L||L.length<2)continue;const m={};for(const id of L){const p=BASE[id];if(!p||!p.name)continue;const s=shortName(p.name);(m[s]=m[s]||[]).push(p.name)}
    for(const s in m){const a=[...new Set(m[s])];if(a.length<2)continue;for(const n of a){if(n===s)continue;if(!(n in DUPN))DUPN[n]=K[n]??null;K[n]=n}}}}catch(e){}}
{const _b=buildSQ;buildSQ=function(){const r=_b.apply(this,arguments);dupNameBuild();return r}}
