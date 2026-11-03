// ================= v286 리그 DNA(dev, 미배포 — 사용자 확인 후 배포) =================
// 사용자 방향(2026-11-04): 리그별 득점 배율 없이, 리그 고유의 경기 문화(템포·압박·직선성·중거리·개방성·심판 기준)를 넣고 골은 결과로 나오게
// ① v285 결정력 배율(ENGF3, finK·finK5·xgDisp × 계수) 제거 → 엔진 기본값(finK 1, finK5 1, xgDisp 1, 박스 안 운반·슈팅 선택 재보정, PK·자책골·핸드볼)이 모든 리그에 똑같이 적용
// ② 리그 DNA = 같은 리그 국내 경기에만 적용(국가 간·대륙 대회는 중립)
//    - 환경(두 팀 공통, 사용자 팀 포함): 심판 파울·경고·퇴장 기준, 중거리 슈팅 선호, 수비 조직 느슨함(커버 강도)
//    - 전술 성향(AI 팀만): AI 감독이 고른 전술(상대 맞춤 포함) 위에 리그 공통 강세만 더함. 실제 명문 정체성 팀은 절반만
// 점수 −2..+2(0 = 라리가와 같음). 출처: 축구 전문가 표(실측 FBref 2024-25·StatsBomb 2015-16·축구 상식), 레버 폭은 엔진 민감도 실측(ES N=200)으로 정함
// 열: [tempo, press, line, direct, longShot, open, refF, refC, refR]
const LG_DNA={
  ES:[0,0,0,0,0,0,0,0,0],
  EN:[2,1,1,0,1,0,-1,0,-1],DE:[2,2,1,1,-1,1,-1,0,-1],IT:[0,1,-1,-1,2,-1,0,-1,0],FR:[0,1,0,0,1,1,0,-1,0],
  PT:[0,0,0,-1,1,0,1,1,0],NL:[2,1,1,-1,0,0,-2,-1,-1],BE:[1,1,0,0,1,-1,-1,0,-1],TR:[1,-1,0,0,1,1,0,0,0],
  SC:[1,0,0,1,0,1,0,0,0],CH:[1,1,1,0,0,1,0,0,0],AT:[1,2,1,1,-1,0,0,0,0],DK:[1,1,1,0,0,1,0,0,0],
  EN2:[1,0,0,2,1,0,0,0,0],DE2:[2,1,1,1,-1,2,-1,0,0],IT2:[-1,0,-1,0,1,-1,1,0,0],FR2:[0,0,0,1,0,0,0,0,0],
  ES2:[-1,0,-1,1,0,-1,1,1,0],ES3A:[-1,0,-1,1,0,-1,1,1,0],ES3B:[-1,0,-1,1,0,-1,1,1,0],ES3:[-1,0,-1,1,0,-1,1,1,0],
  SA:[0,-1,0,0,1,1,-1,0,1],MX:[1,0,0,0,1,1,1,1,0],US:[1,0,0,1,0,2,-1,-1,0],BR:[-1,-1,0,0,1,0,2,1,0],
  AR:[-2,0,-1,1,0,-2,2,2,1],JP:[0,1,1,-2,-1,0,-2,-2,-1],CN:[0,-1,0,1,1,1,0,0,0],KR:[1,1,0,1,0,0,1,0,0]};
// 점수 1당 폭(엔진 민감도 실측 기준): 전술 지시 ±0.5칸, 심판 파울 ±8%·경고 ±10%·퇴장 ±25%, 중거리 슈팅 선택 ±0.15(박스 안 선택 ∓0.15 → 슈팅 수는 유지, 비중만 이동), 커버 강도 ∓15%
const DNA_K={ti:.5,refF:.08,refC:.10,refR:.25,ls:.15,open:.15,ident:.5};
function lgDna(lg){if(!lg)return null;return LG_DNA[lg]||LG_DNA[typeof baseLg==='function'?baseLg(lg):lg]||null}
{const _cfg=engCfg;engCfg=function(H,Aw){let c=null;try{c=_cfg(H,Aw)}catch(e){}try{const k=engLg(H,Aw);if(!k)return c;if(c){c=Object.assign({},c);delete c.finK;delete c.finK5;delete c.xgDisp}/* v285 배율 제거(DNA 표에 없는 리그 포함, QA 지적) */const d=lgDna(k);if(!d||k==='ES')return c;
  const o=Object.assign({},c||{});
  o.refF=+(1.35*(1+DNA_K.refF*d[6])).toFixed(3);o.refFB=1.35;/* PK 판정은 리그 공통 */o.refC=+(.95*(1+DNA_K.refC*d[7])).toFixed(3);o.refR=+(1.3*Math.max(.25,1+DNA_K.refR*d[8])).toFixed(3);
  if(d[5])o.dcK=+Math.max(.5,1-DNA_K.open*d[5]).toFixed(3);
  if(d[4]){const ls=DNA_K.ls*d[4];o.d5ShBand={'ib<12':+(.9-ls).toFixed(3),'ib12-18':+(.9-ls).toFixed(3),'ob12-18':+(.1+ls).toFixed(3),'ob18-25':+(.5+ls).toFixed(3),'ob25-32':+(.5+ls).toFixed(3),'ob32+':+(-.3+ls).toFixed(3)}}
  o._dna=k;return o}catch(e){return c}}}
// 실제 명문 정체성(aiTacFor에 이름으로 고정된 팀)은 성향 강세 절반
const DNA_IDENT=(()=>{try{const s=String(aiTacFor),m=s.match(/name===['"]([^'"]+)['"]/g)||[];return new Set(m.map(x=>x.replace(/name===['"]|['"]$/g,'')))}catch(e){return new Set()}})();
{const _sh=engShift;engShift=function(T,lg){const R=_sh(T,lg);try{if(!R||!R.ti||!S||R.club===S.club)return R;const d=lgDna(lg);if(!d||lg==='ES')return R;
  const C=CLUBS[R.club];const f=DNA_K.ti*(C&&DNA_IDENT.has(C.name)?DNA_K.ident:1);const ti=R.ti.slice();
  const W={3:d[0]+.5*d[5]+.5*d[1],5:.5*d[1],4:.5*d[3]};for(const i in W){const v=W[i];if(v)ti[i]=Math.max(1,Math.min(5,(ti[i]??3)+f*v))}/* 3차(전문가 검토): 개방성·압박은 템포에 절반 반영(실제 고압박 리그 = 다득점, 엔진 압박 단독은 골 감소), 압박 지시는 절반만, 직선성 절반, 라인은 근거 약하고 효과 없어 제외 */
  return R===T?Object.assign({},T,{ti}):Object.assign(R,{ti})}catch(e){return R}}}
