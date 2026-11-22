// ================= v310 v309 점검 버그 수정(에이전트 5명 의견 2026-11-23, 사용자 승인 '1번부터 순서대로') =================
// ① 출전 자격 통일(elig): 2군 선수 중 23세 이상·외국인(1군 외국인 한도 우회 방지)은 1군 경기에 못 나옴 — 사용자(canUse)·AI(teamFor) 같은 기준
//   (이전: AI teamFor가 전체 선수단에서 골라 2군 외국인 26명·23세 이상 7명이 출전, 사우디·튀르키예 외국인 한도 무력화)
// ② 사용자 '1군으로 올리기': 1군 등록 30명·1군 외국인 한도 확인
// ③ 새 게임 시작 때 사용자 구단 초과(외국인·1군 등록·계약 선수) 안내
// ④ 임대 보낸 수 캐시(LOUT): 같은 동기 처리 안에서만 유지(소속을 직접 바꾸는 경로 4곳에서 갱신 안 되던 문제)
// ⑤ 임대 보낸 우리 선수는 정보 수준 '완전'
// ⑥ 이적 기록은 게임 시작일(2026-07-01) 이전만 표시
// ⑦ 새 게임: 선수 18명 미만 AI 구단은 자유계약으로 보충(하부 리그 6명 구단 → 전술 화면 오류)
// ⑧ 시즌 넘김(임대 복귀) 직후 AI 구단 2군 재배정(7월 1일 63구단 일시 초과)
function elig(p,c){if(!p)return false;if(!resOf(p.id))return true;if(ageOf(p)>=RES_AGE)return false;if(sqrOn()&&typeof isFor==='function'&&c!=null&&c>=0&&CLUBS[c]&&isFor(p,c))return false;return true}
{const _cu=canUse;canUse=function(p){if(S&&p&&clubOf(p.id)===S.club&&!elig(p,S.club))return false;return _cu.apply(this,arguments)}}
{const _tf=teamFor;teamFor=function(c){if(c===S.club||!S)return _tf.apply(this,arguments);const _sq=squadOf;let r=null;
  try{squadOf=function(cc){const L=_sq(cc);return cc===c?L.filter(p=>elig(p,c)):L};r=_tf.apply(this,arguments)}catch(e){console.error(e)}finally{squadOf=_sq}
  return r||_tf.apply(this,arguments)/* 자격 선수로 11명이 안 되면 예전처럼 */}}
// ② 1군으로 올리기 확인(0440 클릭 처리보다 먼저: window 캡처)
window.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-res]');if(!b||!S)return;const id=+b.dataset.res,q=S.ps[id];if(!q||!q.res)return;const p=pl(id);
  let why=null;if(regSize(S.club)>=SQMAX)why=`1군 등록이 ${SQMAX}명으로 꽉 찼습니다. 다른 선수를 2군으로 내린 뒤 올리세요.`;
  else if(sqrOn()&&isFor(p,S.club)){const R=sqrRule(S.club);const cap=R&&R.h;if(cap&&forCnt(S.club)>=cap)why=`1군 외국인이 한도(${cap}명)입니다. 외국인 선수를 2군으로 내린 뒤 올리세요.`}
  if(why){e.stopImmediatePropagation();e.preventDefault();toast(why)}},true);
// ③ 시작 안내
function startWarn(){try{if(!S||S.club==null||S.club<0)return;const c=S.club,a=[];const R=sqrRule(c),cap=R&&R.h;
  if(cap&&forCnt(c)>cap)a.push(`1군 외국인 ${forCnt(c)}명 / 한도 ${cap}명 — ${forCnt(c)-cap}명을 2군으로 내리거나 내보내야 합니다(2군 외국인은 1군 경기 출전 불가).`);
  if(regSize(c)>SQMAX)a.push(`1군 등록 ${regSize(c)}명 / ${SQMAX}명 — ${regSize(c)-SQMAX}명을 2군으로 내려야 합니다.`);
  if(ownSize(c)>OWNMAX)a.push(`계약 선수(1군+2군+임대 보낸 선수) ${ownSize(c)}명 / ${OWNMAX}명 — 줄일 때까지 새 영입 제안을 할 수 없습니다.`);
  if(a.length)inbox('board','','선수단 규정 점검',`시작 시점 선수단이 규정을 넘습니다(실제 선수단·임대 반영).\n${a.join('\n')}\n선수 화면의 '2군으로 내리기'·임대·판매로 정리하세요.`)}catch(e){console.error(e)}}
{const _sg=startGame;startGame=function(){const r=_sg.apply(this,arguments);try{
  /* ⑦ 소규모 구단 보충: 자유계약 중 구단 수준에 가까운 선수(외국인 한도 지킴), 포지션 부족분 먼저 */const y=S.season;let fa=null;
  for(const C of CLUBS){if(!C||C.i<0||C.i===S.club||!S.aiBudget||S.aiBudget[C.i]===undefined)continue;let n=sqSize(C.i);if(n>=18)continue;
    fa=fa||squadOf(FA).filter(p=>ageOf(p)>=18&&ageOf(p)<=33);const sq=squadOf(C.i);const lvl=sq.length?sq.reduce((a,p)=>a+p.ovr,0)/sq.length:60;
    const need=()=>{const cnt=g=>squadOf(C.i).filter(p=>(g==='GK'?p.g==='GK':LINE[p.g]===g)).length;return cnt('GK')<2?'GK':cnt('DF')<6?'DF':cnt('MF')<6?'MF':cnt('FW')<3?'FW':null};
    while(n<18&&fa.length){const g=need();let pool=fa.filter(p=>clubOf(p.id)===FA&&aiFAok(p,C.i)&&(!g||(g==='GK'?p.g==='GK':LINE[p.g]===g)));if(!pool.length)pool=fa.filter(p=>clubOf(p.id)===FA&&aiFAok(p,C.i));if(!pool.length)break;
      pool.sort((a,b)=>Math.abs(a.ovr-lvl+3)-Math.abs(b.ovr-lvl+3));const p=pool[0];setP(p.id,{club:C.i,cEnd:`${y+2}-06-30`,faS:0});n++}}
  startWarn()}catch(e){console.error(e)}return r}}
// ④ LOUT 캐시: 동기 처리 묶음이 끝나면 비움
{const _os=ownSize;ownSize=function(c){const r=_os.apply(this,arguments);if(!ownSize._q){ownSize._q=1;Promise.resolve().then(()=>{LOUT=null;ownSize._q=0})}return r}}
// ⑤ 임대 보낸 선수 정보
{const _k=know;know=function(id){const q=S&&S.ps&&S.ps[id];if(q&&q.loanFrom===S.club)return 3;return _k.apply(this,arguments)}}
// ⑥ 이적 기록 날짜
if(typeof tfhHTML==='function'){const _h=tfhHTML;tfhHTML=function(id){const H=G.tfh&&G.tfh.h&&G.tfh.h[id];if(!H)return '';const keep=H.filter(x=>x[0]<SEASON_START);if(!keep.length)return '';const o=G.tfh.h[id];G.tfh.h[id]=keep;try{return _h.call(this,id)}finally{G.tfh.h[id]=o}}}
// ⑧ 시즌 넘김 직후 재배정
{const _ro=rollover;rollover=function(){const r=_ro.apply(this,arguments);try{CLUBS.forEach(c=>{if(c&&c.i>=0&&c.i!==S.club)try{resAssignAI(c.i)}catch(e){}});SQC=null;
  const c=S.club;if(c!=null&&c>=0&&!(typeof unemp==='function'&&unemp())){const R=sqrRule(c),cap=R&&R.h;const over=regSize(c)>SQMAX||(cap&&forCnt(c)>cap);if(over)inbox('board','','임대 복귀 후 선수단 점검',`임대 복귀로 1군 등록 ${regSize(c)}/${SQMAX}명${cap?`, 1군 외국인 ${forCnt(c)}/${cap}명`:''}입니다. 이적시장 마감 전까지 2군 배정·임대·판매로 맞추세요.`)}}catch(e){console.error(e)}return r}}
// ⑨ 성능(엔진 의견): 선수 소속이 바뀔 때마다 선수단 캐시 전체를 다시 만들던 것(1회 약 4ms × 수십~수백 번)을 바뀐 선수만 옮기도록
{const _sp=setP;setP=function(id,o){if(!o||!('club' in o)||!SQC)return _sp.apply(this,arguments);const keep=SQC;const old=clubOf(id);const r=_sp.apply(this,arguments);const nw=clubOf(id);
  if(SQC===null&&keep){if(old!==nw){const L=keep[old];if(L){const i=L.indexOf(+id);if(i>=0)L.splice(i,1)}(keep[nw]=keep[nw]||[]).push(+id)}SQC=keep;LOUT=null}return r}}
