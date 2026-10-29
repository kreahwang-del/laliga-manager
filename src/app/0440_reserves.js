// ================= 2군(리저브 스쿼드, v136 — C방식 1단계) =================
// 실제 규정: 라리가 1군은 등번호 1~25번 등록, 2군(필리알)에 등록된 23세 미만 선수는 1~25번 없이 1군 경기에 나설 수 있음
//   → 2군의 23세 미만은 1군 소집 가능, 23세 이상은 1군으로 올려야 1군 경기 출전
// 2군 경기: 시즌 중 매주 토요일(1군 리그 기간) 2군 선수끼리 경기 → 2군 순위권 11명 선발 90분, 다음 5명은 절반 확률로 교체 30분
// 성장 반영: 출전 비율(playShare)에 2군 출전 비율 × RES_W를 더함(1군 출전이 적을수록 비중↑). RES_W 0.5 — 2군 리그(스페인 3~4부) 수준이 1군보다 낮아 1군 출전의 절반으로 봄(설정값)
// AI 구단: 여름·겨울 이적시장 직후 22세 이하이면서 팀 내 능력치 23위 밖 선수를 2군으로, 그 외는 1군으로 자동 배정. 유스 입단 선수는 모든 구단 2군에서 시작
const RES_W=.5,RES_AGE=23,RES_REG=25;
function resOf(id){const q=S.ps[id];return !!(q&&q.res)}
function resList(c){return squadOf(c).filter(p=>resOf(p.id))}
function resFirstReg(c){return squadOf(c).filter(p=>!resOf(p.id)).length}
function resAssignAI(c){const sq=squadOf(c).slice().sort((a,b)=>b.ovr-a.ovr);sq.forEach((p,i)=>{const q0=S.ps[p.id];const want=!(q0&&q0.loanFrom!=null&&q0.loanFrom!==c)&&ageOf(p)<=22&&i>=23;if(want){(S.ps[p.id]=S.ps[p.id]||{}).res=true}else if(q0&&q0.res)delete q0.res})}
// 1군 출전 제한: 2군의 23세 이상은 1군 선발·교체 불가(우리 팀 선발 화면·자동 선발)
{const _cu=canUse;canUse=function(p){if(S&&clubOf(p.id)===S.club&&resOf(p.id)&&ageOf(p)>=RES_AGE)return false;return _cu.apply(this,arguments)}}
// 2군 경기(매주 토요일, 8~5월): 시뮬레이션되는 리그의 모든 구단
function resMatchday(){S.resDays=(S.resDays||0)+1;const by={};for(const id in S.ps){const q=S.ps[id];if(!q.res)continue;const c=clubOf(+id);if(c==null||c<0||!CLUBS[c])continue;(by[c]=by[c]||[]).push(+id)}
  const recent=addD(S.date,-2);for(const c in by){const L=by[c].map(pl).filter(p=>!(p.injD>0)&&!((S.ps[p.id].played||'')>=recent)).sort((a,b)=>b.ovr-a.ovr);
    L.forEach((p,i)=>{const q=S.ps[p.id];let m=0;if(i<11)m=90;else if(i<16&&hsh(S.date+'r'+p.id)<.5)m=30;if(m){q.rmins=(q.rmins||0)+m;q.rapps=(q.rapps||0)+1}})}}
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);try{if(!S)return r;const mo=+S.date.slice(5,7);
  if((mo>=8||mo<=5)&&D(S.date).getUTCDay()===6)resMatchday();
  if(S.date.endsWith('-07-02')||S.date.endsWith('-09-02')||S.date.endsWith('-02-02')){CLUBS.forEach(c=>{if(c.i!==S.club&&c.i!=null)try{resAssignAI(c.i)}catch(e){}});
    if(!(typeof unemp==='function'&&unemp())){const old=resList(S.club).filter(p=>ageOf(p)>=RES_AGE);const n1=resFirstReg(S.club);
      if(old.length||n1>RES_REG)inbox('board','',`1군 등록 점검`,`1군 등록 ${n1}명 / ${RES_REG}명(2군의 23세 미만 제외).${n1>RES_REG?' 등록 한도를 넘었습니다 — 2군으로 내리거나 정리하세요.':''}${old.length?` 2군의 23세 이상 ${old.length}명(${old.map(p=>esc(p.name)).join(', ')})은 1군에 올려야 1군 경기에 나설 수 있습니다.`:''}`)}}}catch(e){console.error(e)}return r}}
// 성장용 출전 비율에 2군 출전 반영
{const _ps=playShare;playShare=function(p){const b=_ps.apply(this,arguments);try{const q=S.ps[p.id];if(q&&q.rmins&&S.resDays){const rs=Math.min(1,q.rmins/(S.resDays*90));return Math.min(1,b+RES_W*rs*(1-b))}}catch(e){}return b}}
// 시즌 종료: 2군 기록은 성장 반영 뒤 초기화
{const _ro=rollover;rollover=function(){const r=_ro.apply(this,arguments);try{for(const id in S.ps){const q=S.ps[id];if(q.rmins||q.rapps){q.rmins=0;q.rapps=0}}S.resDays=0}catch(e){console.error(e)}return r}}
// 유스 입단 선수는 2군에서 시작
{const _my=makeYouth;makeYouth=function(c){const p=_my.apply(this,arguments);try{if(p&&p.id!=null&&ageOf(p)<=19){const q=S.ps[p.id]=S.ps[p.id]||{};q.res=true}}catch(e){}return p}}
// 선수 화면: 2군으로 내리기 / 1군으로 올리기
{const _ps2=playerSheet;playerSheet=function(id){const r=_ps2.apply(this,arguments);try{if(clubOf(id)===S.club){const b=document.querySelector('[data-act="loanout"]');const row=b&&b.parentElement;if(row&&!document.querySelector('[data-res]')){const p=pl(id),on=resOf(id);
  const div=document.createElement('div');div.className='row2';div.innerHTML=`<button class="btn ghost" data-res="${id}">${on?'1군으로 올리기':'2군으로 내리기'}</button><span class="note" style="align-self:center">${on?`2군 ${S.ps[id].rapps||0}경기 ${S.ps[id].rmins||0}분${ageOf(p)<RES_AGE?' · 23세 미만이라 1군 소집 가능':' · 23세 이상: 1군 출전 불가'}`:`1군 등록 ${resFirstReg(S.club)}/${RES_REG}`}</span>`;row.after(div)}}}catch(e){console.error(e)}return r}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-res]');if(!b||!S)return;e.stopPropagation();e.preventDefault();const id=+b.dataset.res,q=S.ps[id]=S.ps[id]||{},p=pl(id);
  if(!q.res&&q.loanFrom!=null&&q.loanFrom!==S.club){toast('임대 온 선수는 2군으로 내릴 수 없습니다');return}
  q.res=!q.res;if(q.res&&ageOf(p)>=RES_AGE&&S.xi)S.xi=S.xi.filter(x=>x!==id);save();playerSheet(id);render();toast(q.res?`${p.name}을 2군으로 내렸습니다${ageOf(p)<RES_AGE?'(23세 미만이라 1군 소집은 가능)':''}`:`${p.name}을 1군으로 올렸습니다`)},true);
// 스쿼드 화면: 2군 명단·기록
{const _sv=squadView;squadView=function(){let h=_sv.apply(this,arguments);try{if(UI.sqv==='trn'||UI.sqv==='mgmt')return h;const R=resList(S.club).sort((a,b)=>b.ovr-a.ovr);
  h+=`<h2>2군 (${R.length}명) · 1군 등록 ${resFirstReg(S.club)}/${RES_REG}</h2><p class="note">2군 경기는 시즌 중 매주 토요일 열리고, 출전 시간은 성장에 1군 출전의 절반 비중으로 반영됩니다. 23세 미만은 2군 소속이어도 1군 소집 가능.</p><div class="card list">${R.map(p=>rowP(p,`<span class="pill">${ageOf(p)<RES_AGE?'U23':'23+'} · ${S.ps[p.id].rapps||0}경기 ${S.ps[p.id].rmins||0}분</span>`)).join('')||'<div class="li note">2군 선수가 없습니다. 선수 화면에서 \'2군으로 내리기\'를 누르세요. 유스 입단 선수는 2군에서 시작합니다.</div>'}</div>`}catch(e){console.error(e)}return h}}
// 첫 적용(기존 저장 포함): AI 구단 배정이 없으면 한 번 배정
{const _dl=devLoad;devLoad=function(){_dl.apply(this,arguments);try{if(S&&!S.resInit){S.resInit=1;CLUBS.forEach(c=>{if(c.i!==S.club&&c.i!=null)try{resAssignAI(c.i)}catch(e){}})}}catch(e){console.error(e)}}}

