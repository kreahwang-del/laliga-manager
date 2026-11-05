// ================= v295 AI 구단 자국 선수 확보(사용자 결정 2026-11-05) =================
// 문제(사용자 세이브 2028-08): AI가 국적을 보지 않고 영입·방출 → 중국 CHO 30명 중 외국인 28명, 중국 선수 55명 자유계약·77명 은퇴. 중국·사우디·멕시코 유스는 스페인 국적으로 생성(0070 버그, v295에서 수정)
// ① AI 외국인 보유 한도 = 리그 보유 한도(있으면) 또는 경기 명단 한도+2(K리그·J1 7, 브라질 11). 실제 구단도 못 쓰는 외국인은 사지 않음. 더 나은 외국인이면 영입하고 가장 약한 외국인 해지
// ② 이미 넘긴 AI 구단은 이적시장 기간에 하루 1명씩 가장 약한 외국인과 계약 해지, 인원이 모자라면 자유계약 자국 선수를 먼저 영입
// ③ 기존 세이브: 중국·사우디·멕시코 구단이 만든 유스 중 스페인 국적(버그)을 그 나라 국적으로
function aiCap(c){const R=sqrRule(c);if(!R)return null;return R.h||(R.m?R.m+2:null)}
{const _q=quotaOK;quotaOK=function(p,to,ai){const isAI=ai??(to!==S.club);if(!isAI||!sqrOn()||to==null||to<0||!CLUBS[to])return _q(p,to,ai);
  const cap=aiCap(to);if(!cap||!isFor(p,to)||clubOf(p.id)===to)return true;if(forCnt(to,p.id)<cap)return true;const w=sqrWeakFor(to,p.id);return !!w&&p.ovr>=w.ovr+3}}
{const _ct=completeTransfer;completeTransfer=function(id,to,fee,o){const p=pl(id);const r=_ct.apply(this,arguments);
  try{if(sqrOn()&&p&&to!==S.club&&to>=0&&CLUBS[to]&&clubOf(id)===to&&isFor(p,to)){const cap=aiCap(to);if(cap&&forCnt(to)>cap){const w=sqrWeakFor(to,id);if(w)_ct(w.id,FA,0,{wage:w.wage})}}}catch(e){console.error(e)}return r}}
function aiDomDay(){if(!sqrOn()||!S||!winNow())return;if(S.aiDomD===S.date)return;S.aiDomD=S.date;
  let fa=null;const faDom=c=>{fa=fa||squadOf(FA);const L=LGNAT[sqrLg(c)]||[];return fa.filter(p=>L.includes(p.nat)&&clubOf(p.id)===FA&&ageOf(p)<=33).sort((a,b)=>b.ovr-a.ovr)[0]||null};
  for(const C of CLUBS){if(!C||C.i===S.club||C.i===FA||C.i===RET||!S.aiBudget||S.aiBudget[C.i]===undefined)continue;const cap=aiCap(C.i);if(!cap)continue;if(forCnt(C.i)<=cap)continue;
    try{if(sqSize(C.i)<=21){const d=faDom(C.i);if(d){completeTransfer(d.id,C.i,0,{wage:d.wage,cEnd:`${S.season+2}-06-30`});fa=null}}
      if(sqSize(C.i)>=19){const w=sqrWeakFor(C.i);if(w)completeTransfer(w.id,FA,0,{wage:w.wage})}}catch(e){console.error(e)}}}
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);try{aiDomDay()}catch(e){console.error(e)}return r}}
// ③ 세이브 이전
function mig295y(){if(!S||S.mig295y||!S.gen)return;let n=0;for(const id in S.gen){const p=S.gen[id];if(!p||p.nat!=='ESP'||!p.youth)continue;const c0=p.youth.c!=null?p.youth.c:p.club;const C=CLUBS[c0];if(!C)continue;
  const lg=typeof baseLg==='function'?baseLg(C.lg):C.lg;const nat={CN:'CHN',SA:'KSA',MX:'MEX'}[lg];if(nat){p.nat=nat;if(BASE[id])BASE[id].nat=nat;n++}}S.mig295y=1;if(n)SQC=null;return n}
{const _dl=devLoad;devLoad=function(){const r=_dl.apply(this,arguments);try{mig295y()}catch(e){console.error(e)}return r}}
{const _sg=startGame;startGame=function(){const r=_sg.apply(this,arguments);try{if(S)S.mig295y=1}catch(e){}return r}}
// v296 원인 분석(새 게임 2시즌 추적): 이적 관문을 거치지 않는 외국인 유입 3경로 — 시즌 시작 선수단 보충(squadFill, 시즌당 115명)·시즌 말 인원 보충(0070, 20명)·유스 외국 국적(22%, 27명)
// → 보충은 한도가 차면 자국 선수만(aiFAok), 한도 리그 유스는 외국 국적 5%
function aiFAok(p,c){if(!sqrOn()||c==null||c<0||c===S.club||!CLUBS[c])return true;const cap=aiCap(c);if(!cap||!isFor(p,c))return true;return forCnt(c)<cap}
{const _my=makeYouth;makeYouth=function(c,y,o){try{if(sqrOn()&&aiCap(c)&&!(o&&o.nat)){const lg=sqrLg(c);const n0=LG_NAT[lg];if(n0){const id=9000000+(S.genSeq||0)+1;if(hsh(id+':nat5:'+y)>=.05)o=Object.assign({},o||{},{nat:n0})}}}catch(e){}return _my.call(this,c,y,o)}}
// v296 AI 1군 30명 초과 정리(QA 지적·새 게임 3시즌 검증: 레알 35·바르사 33 — 유스 입단·임대 복귀로 늘고 줄이는 장치가 없음)
// 이적시장 기간에 하루 1명씩 24세 이상 가장 약한 선수(임대 온 선수 제외)와 계약 해지. 유망주는 남김
function aiSqTrimDay(){if(!sqrOn()||!S||!winNow())return;if(S.aiSqD===S.date)return;S.aiSqD=S.date;
  for(const C of CLUBS){if(!C||C.i===S.club||C.i===FA||C.i===RET||!S.aiBudget||S.aiBudget[C.i]===undefined)continue;if(sqSize(C.i)<=SQMAX)continue;
    try{const sq=squadOf(C.i).filter(p=>!p.loanFrom);const old=sq.filter(p=>ageOf(p)>=24).sort((a,b)=>a.ovr-b.ovr);const young=sq.filter(p=>ageOf(p)<24).sort((a,b)=>a.ovr-b.ovr);
      /* 24세 이상 하위권(팀 내 22위 밖)은 해지, 아니면 가장 약한 유망주를 하위 구단으로 임대(빅클럽 방식) */const rk=sq.slice().sort((a,b)=>b.ovr-a.ovr);const w=old.find(p=>rk.indexOf(p)>=22);
      if(w){completeTransfer(w.id,FA,0,{wage:w.wage});continue}const y=young[0];if(!y)continue;
      const to=CLUBS.find(b=>b&&b.i!==C.i&&b.i!==S.club&&b.i!==FA&&b.i!==RET&&S.aiBudget[b.i]!==undefined&&b.par==null&&(b.rep||0)<(C.rep||0)&&(b.rep||0)>=(C.rep||0)-30&&sqSize(b.i)<26&&quotaOK(y,b.i,true));
      if(to){completeTransfer(y.id,to.i,0,{loan:true});const q=S.ps[y.id];if(q){q.lnRole=1;q.res=false;(S.aiLn=S.aiLn||[]).push(y.id)}}else completeTransfer(y.id,FA,0,{wage:y.wage})}catch(e){console.error(e)}}}
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);try{aiSqTrimDay()}catch(e){console.error(e)}return r}}
