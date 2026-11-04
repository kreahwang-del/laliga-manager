// ================= v287 이적시장 기록 필터: 지난 시즌 기록 보관(사용자 지적 2026-11-04) =================
// 문제: 새 시즌 시작(newSeason) 때 골·도움·평점·세부 기록(ss)을 0으로 지우고 지난 시즌 기록을 남기지 않음
//       → 선수 영입이 가장 많은 여름 이적시장에서 기록 필터를 걸면 항상 0명
// 수정: ① 시즌을 넘기기 직전에 리그 기록이 있는 선수만 지난 시즌 기록(lsr)을 남김(필터에 쓰는 항목만, 저장 용량 최소)
//       ② 이번 시즌 리그 5경기 미만 선수는 지난 시즌 기록으로 필터
const LSR_K=['kp','bc','at','aw','crc','cr','tkw','ta','dw','da','pc','pa','it'];
{const _ns=newSeason;newSeason=function(y,first){if(!first&&S&&S.ps){try{for(const id in S.ps){const q=S.ps[id];if(!q)continue;delete q.lsr;if(!(q.apps>0))continue;
  const ss={};if(q.ss)LSR_K.forEach(k=>{if(q.ss[k])ss[k]=q.ss[k]});q.lsr={y:S.season,apps:q.apps,gl:q.gl||0,as:q.as||0,rs:+(q.rs||0).toFixed(2),ss}}}catch(e){console.error(e)}}
  return _ns.apply(this,arguments)}}
{const _ok=srchStatOK;srchStatOK=function(p,f){if(p&&(p.apps||0)<5&&p.lsr)p=Object.assign({},p,{apps:p.lsr.apps,gl:p.lsr.gl,as:p.lsr.as,rs:p.lsr.rs,ss:p.lsr.ss||{}});return _ok(p,f)}}
{const _sv=searchView;searchView=function(){return _sv.apply(this,arguments).replace('이번 시즌 기록 (리그 경기)','이번 시즌 기록 (리그 경기, 5경기 미만 선수는 지난 시즌 기록)')}}
