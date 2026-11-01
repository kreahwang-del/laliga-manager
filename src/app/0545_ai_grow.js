// ================= v270 AI 감독·구단 성장(사용자 요청 2026-11-01: "시즌을 거듭할수록 잘한 팀을 따라하고 성장해 난이도도 올라가야") =================
// 네 장치, 각각 켜고 끌 수 있음(AIG). 시즌 넘김(rollover) 직전 지난 시즌 리그 성적으로 정산
//  ① 감독 성장: 기대 승점 대비 성적(ppg−xp)으로 감독 평판 ±3/시즌 → 판단력(aiQ)에 감독 평판 40% 반영(이전엔 구단 평판만)
//  ② 유행 따라하기: 지난 시즌 기대보다 잘한 전술 성향(2팀 이상 사용, 평균 +0.10 이상)을 부진 팀(−0.15 이하)이 확률로 따라함. 쏠림 방지: 이미 40% 이상 쓰는 성향은 안 따라함, 선수 구성에 안 맞으면 안 따라함
//  ③ 사용자 대응: 사용자가 최근 리그 10경기 중 같은 전술 성향으로 6경기 이상 치르고 승률이 높을수록 AI가 그 상성을 노리는 확률(aiQ) 가산(최대 +0.25)
//  ④ 구단 평판: 기대 순위보다 높으면 +, 낮으면 −(시즌당 최대 ±3) + 원래 평판으로 15% 되돌림 → 판도 변화. 이적 예산도 평판 차 1점당 ±2%
const AIG_DEF={grow:0,trend:0,user:0,rep:0};
function aig(k){try{const o=(typeof window!=='undefined'&&window.AIG_OPT)||(S&&S.aig)||AIG_DEF;return !!o[k]}catch(e){return false}}
function aigXP(c){const e=S.exp&&S.exp[c];if(!e)return null;if(e.xp!=null)return e.xp;const EP=typeof EPPG!=='undefined'?EPPG:null;return EP?EP[Math.min(EP.length-1,(e.ep||10)-1)]:null}
/* 구단 평판 변화는 CLUBS(고정 자료)에 덮어씀 → 저장(S.aigRep)에서 불러올 때마다 다시 적용 */
function aigRepApply(){try{if(!S||!S.aigRep)return;S.aigRep0=S.aigRep0||{};for(const c in S.aigRep){const C=CLUBS[c];if(!C)continue;if(S.aigRep0[c]==null)S.aigRep0[c]={rep:C.rep,budget:C.budget};const b=S.aigRep0[c];C.rep=S.aigRep[c];C.budget=Math.max(0,+(b.budget*(1+(C.rep-b.rep)*.02)).toFixed(1))}}catch(e){console.error(e)}}
function aigSeasonEnd(){try{const t=table(),n=t.length;if(!n)return;const G=t[0].p||1;const rows=t.map((r,i)=>{const c=r.id;const xp=aigXP(c);const tac=S.aiTac&&S.aiTac[c];return {c,pos:i+1,ppg:r.pts/Math.max(1,r.p),xp,perf:xp==null?0:r.pts/Math.max(1,r.p)-xp,ep:(S.exp&&S.exp[c]&&S.exp[c].ep)||null,pre:c===S.club?(S.tac&&S.tac.preset):(tac&&tac.preset)}});
  const log=S.aigLog=S.aigLog||[];const L={season:S.season,grow:[],trend:[],rep:[]};
  /* ① 감독 성장 */if(aig('grow')&&S.mg){rows.forEach(r=>{if(r.c===S.club)return;const m=typeof mgrOf==='function'?mgrOf(r.c):null;if(!m)return;const d=Math.max(-3,Math.min(3,Math.round(r.perf*8)));if(d){m.rep=Math.max(10,Math.min(95,(m.rep||50)+d));L.grow.push([m.n,r.c,d])}})}
  /* ② 유행 따라하기 */if(aig('trend')){const by={};rows.forEach(r=>{if(!r.pre||r.c===S.club)return;(by[r.pre]=by[r.pre]||[]).push(r.perf)});let best=null,bv=.10;for(const k in by){if(by[k].length<2)continue;const v=by[k].reduce((a,x)=>a+x,0)/by[k].length;if(v>bv){bv=v;best=k}}
    S.aigTrend={};if(best){const share=(by[best]||[]).length/n;if(share<.4)rows.forEach(r=>{if(r.c===S.club||r.pre===best||r.perf>-.15)return;try{const sm=E3.styleMap(squadOf(r.c).sort((a,b)=>b.ovr-a.ovr).slice(0,11));if((sm[best]??0)<0)return}catch(e){return}if(hsh('aigt'+r.c+S.season)<.35){S.aigTrend[r.c]=best;L.trend.push([r.c,r.pre,best])}})}L.best=best;L.bestV=+bv.toFixed(2)}
  /* ④ 구단 평판 */if(aig('rep')){S.aigRep=S.aigRep||{};S.aigRep0=S.aigRep0||{};rows.forEach(r=>{const C=CLUBS[r.c];if(!C||!r.ep)return;if(S.aigRep0[r.c]==null)S.aigRep0[r.c]={rep:C.rep,budget:C.budget};const b0=S.aigRep0[r.c].rep;const d=Math.max(-3,Math.min(3,Math.round((r.ep-r.pos)*.25)));const nr=Math.max(5,Math.min(99,Math.round(C.rep+d+(b0-C.rep)*.15)));if(nr!==C.rep){S.aigRep[r.c]=nr;L.rep.push([r.c,C.rep,nr])}});aigRepApply()}
  log.push(L);if(log.length>8)log.shift()}catch(e){console.error(e)}}
{const _ro=rollover;rollover=function(){aigSeasonEnd();return _ro.apply(this,arguments)}}
/* ② 새 시즌 전술에 유행 반영(감독이 바뀌지 않았고 선수 구성에 맞을 때) */
{const _af=aiTacFor;aiTacFor=function(c){const T=_af.apply(this,arguments);try{const k=aig('trend')&&S.aigTrend&&S.aigTrend[c];if(T&&k&&T.preset!==k&&E3.PRESETS[k]){T.preset=k;T.ti=[...E3.PRESETS[k]];T.fam=Math.max(45,(T.fam||60)-10);T._trend=1}}catch(e){}return T}}
/* ①·③ 판단력: 감독 평판 40% 반영 + 사용자 상대 가산 */
function aigUserBonus(){try{const my=(S.fixtures||[]).filter(f=>f.res&&(f.h===S.club||f.a===S.club)).slice(-10);if(my.length<6)return 0;const P=S.aigUP||{};const cnt={};my.forEach(f=>{const p=P[f.d];if(p)cnt[p]=(cnt[p]||0)+1});const top=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0];if(!top||cnt[top]<6||top!==(S.tac&&S.tac.preset))return 0;
  const w=my.filter(f=>{const [a,b]=f.res.sc;return f.h===S.club?a>b:b>a}).length/my.length;return Math.max(0,Math.min(.25,(w-.5)*.6))}catch(e){return 0}}
{const _q=aiQ;aiQ=function(c,vsUser){let q=_q.apply(this,arguments);try{if(aig('grow')){const m=typeof mgrOf==='function'?mgrOf(c):null;if(m&&m.rep!=null){const cr=(CLUBS[c]&&CLUBS[c].rep)||50;const base=Math.min(.98,Math.max(.25,(cr-30)/55));const mix=Math.min(.98,Math.max(.25,(cr*.6+m.rep*.4-30)/55));q+=mix-base}}if(vsUser&&aig('user'))q+=aigUserBonus()}catch(e){}return Math.min(.98,Math.max(.25,q))}}
/* ③ 사용자 경기마다 쓴 전술 성향 기록(날짜별) */
{const _sm=startMatch;startMatch=function(fx){try{if(fx&&S.tac){S.aigUP=S.aigUP||{};S.aigUP[fx.d]=S.tac.preset;const ks=Object.keys(S.aigUP).sort();if(ks.length>40)ks.slice(0,ks.length-40).forEach(k=>delete S.aigUP[k])}}catch(e){}return _sm.apply(this,arguments)}}
/* ④ 불러오기 때 평판 다시 적용 */
{const _dl=devLoad;devLoad=function(){const r=_dl.apply(this,arguments);try{aigRepApply()}catch(e){}return r}}
