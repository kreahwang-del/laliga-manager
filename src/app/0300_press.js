// ================= 기자회견·선수 관리(v79) =================
// 경기 전 기자회견(빅매치·더비·컵/유럽 + 그 외 35%): 답변 톤 → 선수단 사기(컨디션 점수)·결과에 따른 후폭풍·이사회 신뢰도
// 경기 후 기자회견(대패·대승·더비·이변): 선수 감싸기·질책·심판 탓·공 돌리기
// 선수 관리: 개인 면담(칭찬·격려·질책, 21일 쿨다운) — 최근 평점·프로의식에 따라 반응, 재계약 요청(계약 1년 이내 주요 선수)
// 효과 크기는 게임 설계 가정
function mgMorale(v,ids){const sq=ids||squadOf(S.club).map(p=>p.id);sq.forEach(id=>{const q=S.ps[id]=S.ps[id]||{};const x=Math.max(0,Math.min(100,(q.cndv??50)+v));q.cndv=x;q.cnd=x>=72?0:x>=58?1:x>=42?2:x>=28?3:4})}
function mgHappy(v,ids){(ids||squadOf(S.club).map(p=>p.id)).forEach(id=>{const q=S.ps[id]=S.ps[id]||{};q.happy=Math.max(0,Math.min(100,Math.round((q.happy??65)+v)))})}
function mgPro(id){return pl(id).pro??10}
function mgAvgR(id){const r=(S.ps[id]||{}).recentR||[];return r.length?r.slice(-3).reduce((a,b)=>a+b,0)/Math.min(3,r.length):null}
const PR_Q={
  strong:['상대가 전력상 한 수 위라는 평가입니다. 승산이 있습니까?',[['conf','이길 자신이 있습니다'],['calm','우리 경기에 집중하겠습니다'],['resp','최고의 팀입니다. 존중합니다']]],
  weak:['전력상 우위라는 평가입니다. 방심할 위험은 없습니까?',[['conf','반드시 이깁니다'],['calm','쉬운 경기는 없습니다'],['push','선수들이 증명해야 할 경기입니다']]],
  derby:['더비를 앞둔 각오를 말씀해 주십시오.',[['conf','팬들에게 승리를 바치겠습니다'],['calm','평소처럼 준비했습니다'],['push','이 경기의 무게를 선수들도 압니다']]],
  form:['최근 흐름을 어떻게 보십니까?',[['conf','지금 흐름이면 누구도 두렵지 않습니다'],['calm','결과보다 과정을 보고 있습니다'],['push','더 잘해야 합니다. 기준을 높이겠습니다']]]};
const PR_POST={
  loss:['완패였습니다. 원인을 어떻게 보십니까?',[['protect','책임은 감독인 저에게 있습니다'],['crit','선수들의 태도가 실망스러웠습니다'],['ref','판정이 경기를 바꿨습니다']]],
  win:['완승이었습니다. 소감을 말씀해 주십시오.',[['credit','선수들이 해낸 결과입니다'],['calm','아직 갈 길이 멉니다'],['conf','이게 우리의 진짜 실력입니다']]],
  dloss:['더비에서 졌습니다. 팬들에게 한마디 해 주십시오.',[['protect','책임은 감독인 저에게 있습니다'],['crit','이 유니폼의 무게를 모르는 선수가 있었습니다'],['ref','판정이 아쉬웠습니다']]],
  dwin:['더비 승리입니다. 소감은?',[['credit','팬과 선수들이 만든 승리입니다'],['conf','이 도시의 주인은 우리입니다'],['calm','승점 3점일 뿐입니다']]],
  upset:['이변을 만들었습니다. 비결은?',[['credit','선수들의 투지 덕분입니다'],['conf','이변이 아닙니다'],['calm','운도 따랐습니다']]]};
const PR_LAB={conf:'자신감',calm:'신중',resp:'상대 존중',push:'선수단 압박',protect:'선수 감싸기',crit:'질책',ref:'심판 탓',credit:'공 돌리기'};
function prNextMine(){const a=[typeof myNext==='function'?myNext():null,typeof cupNextMine==='function'?cupNextMine():null].filter(Boolean).sort((x,y)=>x.d<y.d?-1:1);return a[0]||null}
function prPre(){const f=prNextMine();if(!f||f.d!==addD(S.date,1))return;const key=f.d+':'+f.h+':'+f.a;S.prDone=S.prDone||{};if(S.prDone[key])return;S.prDone[key]=1;
  const opp=f.h===S.club?f.a:f.h;const der=typeof derbyOf==='function'&&derbyOf(f.h,f.a);const so=euStr(opp),sm=euStr(S.club);const big=der||f.cup||f.eu||f.po||so>sm+2;
  if(!big&&hsh('pr'+key)>.35)return;const k=der?'derby':so>sm+2?'strong':so<sm-3?'weak':'form';const [q,opts]=PR_Q[k];
  inbox('press','',`기자회견 · ${CLUBS[opp].name}전 앞두고`,q,{pr:{key,opp,ph:'pre',opts}})}
function prPost(H,Aw,res){const me=H.club===S.club?0:1,opp=me?H.club:Aw.club,gf=res.sc[me],ga=res.sc[1-me],key=S.date+':'+H.club+':'+Aw.club;
  // 경기 전 답변의 후폭풍
  const P=S.press&&S.press.key===key?S.press:null;let note='';
  if(P){const w=gf>ga,l=gf<ga;const T={conf:w?[4,1,'자신감 있는 발언대로 승리 — 분위기 상승']:l?[-5,-2,'호언장담 뒤 패배 — 비판 여론']:[0,0,''],calm:l?[-1,0,'']:[1,0,''],resp:w?[3,0,'존중 발언 뒤 승리 — 선수단 자신감 상승']:[0,0,''],push:w?[2,0,'']:l?[-3,0,'압박 발언 뒤 패배 — 선수단 위축']:[0,0,'']}[P.tone]||[0,0,''];
    mgMorale(T[0]);if(T[1]&&S.me)S.me.trust=Math.max(0,Math.min(100,(S.me.trust||60)+T[1]));note=T[2];S.press=null}
  if(note)S.news.unshift({d:S.date,t:note,v:0});
  const der=typeof derbyOf==='function'&&derbyOf(H.club,Aw.club);const up=gf>ga&&euStr(opp)>euStr(S.club)+3;let k=null;
  if(der&&gf<ga)k='dloss';else if(der&&gf>ga)k='dwin';else if(gf-ga<=-2)k='loss';else if(up)k='upset';else if(gf-ga>=3)k='win';if(!k)return;
  const [q,opts]=PR_POST[k];inbox('press','',`경기 후 기자회견 · ${CLUBS[opp].name}전 ${gf}-${ga}`,q,{pr:{key,opp,ph:'post',k,opts}})}
function prAnswer(m,tone){const pr=m.pr;const sq=squadOf(S.club);let res='';
  if(pr.ph==='pre'){S.press={key:pr.key,tone};if(tone==='conf'){mgMorale(3);res='선수단 사기 상승'}else if(tone==='push'){sq.forEach(p=>{mgMorale(mgPro(p.id)>=13?4:mgPro(p.id)<=9?-3:1,[p.id])});res='프로의식 높은 선수는 자극, 낮은 선수는 위축'}else if(tone==='resp'){res='차분한 분위기'}else{mgMorale(1);res='평정 유지'}}
  else{if(tone==='protect'){mgHappy(3);mgMorale(2);if(S.me)S.me.trust=Math.max(0,(S.me.trust||60)-1);res='선수단 신뢰 상승 · 이사회 신뢰도 −1'}
    else if(tone==='crit'){sq.forEach(p=>{const pro=mgPro(p.id);if(pro>=13)mgMorale(5,[p.id]);else{mgHappy(pro<=9?-6:-2,[p.id]);mgMorale(pro<=9?-3:1,[p.id])}});res='프로의식 높은 선수는 분발, 낮은 선수는 불만'}
    else if(tone==='ref'){mgMorale(2);if(S.me)S.me.trust=Math.max(0,(S.me.trust||60)-1);if(hsh(pr.key+'fine')<.3){const fine=3e4;S.fin.budget-=fine;S.fin.log.unshift({d:S.date,t:'심판 비판 벌금',v:-fine});res='선수단 결속 · 연맹 벌금 €30K'}else res='선수단 결속 · 이사회 신뢰도 −1'}
    else if(tone==='credit'){mgHappy(4);res='선수 만족도 상승'}else if(tone==='conf'){mgMorale(2);res='자신감 상승'}else{res='평정 유지'}}
  m.done=true;m.read=true;m.result=`${PR_LAB[tone]} — ${res}`;save();render();toast(m.result)}
// 재계약 요청(매주 월요일): 시즌 끝 계약 만료 + 팀 내 상위 14명
function mgRenew(){const y=S.season+1;squadOf(S.club).forEach(p=>{const q=S.ps[p.id]=S.ps[p.id]||{};if(!p.cEnd||p.cEnd>=`${y}-07-01`)return;if(rankInClub(p)>14||ageOf(p)>=34)return;
  if(!q.renReq){q.renReq=S.date;q.renCE=p.cEnd;inbox('renewreq','',`${p.name} 재계약 요청`,`계약이 ${fmtD(p.cEnd)}에 끝납니다. 미래를 확실히 하고 싶어 합니다. 8주 안에 답이 없으면 실망합니다.`,{pid:p.id})}
  else if(!q.renMiss&&daysBetween(q.renReq,S.date)>=56&&p.cEnd===q.renCE){q.renMiss=1;mgHappy(-10,[p.id]);inbox('request','',`${p.name} 재계약 지연에 실망`,`구단이 답을 주지 않아 만족도가 떨어졌습니다.`,{pid:p.id})}})}
// 훅
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);try{if(S&&S.club>=0&&!(typeof unemp==='function'&&unemp())){prPre();if(D(S.date).getUTCDay()===1)mgRenew()}}catch(e){console.error(e)}return r}}
{const _am=applyMatch;applyMatch=function(H,Aw,res,counts){const out=_am.apply(this,arguments);try{if(counts&&S&&(H.club===S.club||Aw.club===S.club)&&!(typeof unemp==='function'&&unemp()))prPost(H,Aw,res)}catch(e){console.error(e)}return out}}
{const _mh=msgHTML;msgHTML=function(m){if(m.type==='renewreq')return `<div class="msg ${m.read?'':'new'}"><div class="h"><span>${fmtD(m.d)}</span><span>재계약</span></div><b>${esc(m.title)}</b><p>${esc(m.body)}</p><div class="acts"><button class="btn sm ghost" data-player="${m.pid}">선수 보기 · 재계약</button></div></div>`;
  if(m.type!=='press')return _mh(m);const pr=m.pr;return `<div class="msg ${m.read?'':'new'}"><div class="h"><span>${fmtD(m.d)}</span><span>기자회견</span></div><b>${esc(m.title)}</b><p>“${esc(m.body)}”${m.result?` <span style="color:var(--text)">→ ${esc(m.result)}</span>`:''}</p>${m.done?'':`<div class="acts" style="flex-wrap:wrap">${pr.opts.map(([t,l])=>`<button class="btn sm ghost" data-pr="${t}" data-msg="${m.id}">${esc(l)}</button>`).join('')}</div>`}</div>`}}
// 받은 소식 자동 읽음 처리에서 기자회견·재계약은 답할 때까지 유지
{const _hv=homeView;homeView=function(){const keep=S.inbox.filter(m=>(m.type==='press'||m.type==='renewreq'||m.type==='media'||m.type==='loanopt')&&!m.done&&!m.read);const h=_hv();setTimeout(()=>{keep.forEach(m=>{if(!m.done)m.read=false})},5);return h}}
// ---- 선수 관리 화면 ----
const MG_TALK={praise:'칭찬',enc:'격려',crit:'질책'};
function mgTalk(id,k){const q=S.ps[id]=S.ps[id]||{};if(q.talkAt&&daysBetween(q.talkAt,S.date)<21){toast('최근에 면담했습니다(21일 후 가능)');return}const p=pl(id),pro=p.pro??10,r=mgAvgR(id),c0=q.cnd??2;let h=0,m=0,t='';
  if(k==='praise'){if(r!=null&&r>=7.0){h=6;m=8;t='기뻐하며 자신감이 붙었습니다'}else{h=2;m=1;t=r!=null&&r<6.5?'칭찬이 어색한 듯합니다':'고마워합니다'}}
  else if(k==='enc'){if(r!=null&&r<6.6||c0>=3){h=3;m=8;t='힘을 얻었습니다'}else{h=1;m=2;t='고개를 끄덕입니다'}}
  else{if(r!=null&&r<6.4){if(pro>=13){h=-1;m=10;t='자극을 받아 분발을 다짐합니다'}else if(pro<=9){h=-10;m=-5;t='반발하며 불만을 드러냅니다'}else{h=-4;m=3;t='말없이 받아들입니다'}}else{h=-12;m=-4;t='부당하다고 느끼고 크게 실망했습니다'}}
  mgHappy(h,[id]);mgMorale(m,[id]);q.talkAt=S.date;q.talkR=`${MG_TALK[k]} → ${t}`;save();render();toast(`${p.name}: ${t}`)}
function mgView(){const sq=squadOf(S.club);const hs=sq.map(p=>(S.ps[p.id]||{}).happy??65),cs=sq.map(p=>p.cond??2);const ah=Math.round(hs.reduce((a,b)=>a+b,0)/Math.max(1,hs.length));
  const cc=[0,1,2,3,4].map(i=>cs.filter(x=>x===i).length);const att=p=>{const q=S.ps[p.id]||{};return (q.happy??65)-((p.cond??2)>=3?15:0)};
  const rows=sq.slice().sort((a,b)=>att(a)-att(b)).map(p=>{const q=S.ps[p.id]||{},r=mgAvgR(p.id),cd=q.talkAt&&daysBetween(q.talkAt,S.date)<21,h=q.happy??65,C=cnd(p);
    return `<div class="li" style="flex-wrap:wrap"><button class="nm" data-player="${p.id}" style="flex:1;min-width:0">${avatar(p)}<span><b>${esc(p.name)}</b><span>${PSHORT[p.g]||p.g} · 만족 <b style="color:${h<35?'var(--bad)':h<55?'var(--amber)':'var(--good)'}">${h}</b> · 컨디션 <span style="color:${C.c}">${C.a}</span>${r!=null?` · 최근 평점 ${r.toFixed(1)}`:''} · 기대 ${ROLE_N[q.promise??expectRole(p,S.club)]}${p.cEnd?` · 계약 ${p.cEnd.slice(0,4)}`:''}${q.talkR&&cd?`<br>${esc(q.talkR)}`:''}</span></span></button>
      <span style="display:flex;gap:4px">${cd?'<span class="note">면담 완료</span>':Object.entries(MG_TALK).map(([k,l])=>`<button class="btn sm ghost" data-talk="${k}" data-pid="${p.id}">${l}</button>`).join('')}</span></div>`}).join('');
  return `${sqTabs()}<div class="card pad" style="margin-top:12px"><b>선수단 분위기</b><div class="note" style="margin-top:4px">평균 만족도 <b style="color:${ah<45?'var(--bad)':ah<60?'var(--amber)':'var(--good)'}">${ah}</b> · 컨디션 ${CONDS.map((x,i)=>`<span style="color:${x.c}">${x.a}${cc[i]}</span>`).join(' ')}</div>${tbar(ah,ah<45?'var(--bad)':ah<60?'var(--amber)':'var(--good)')}</div>
    <h2>개인 면담</h2><div class="card list">${rows}</div>
    <p class="note" style="margin-top:10px;line-height:1.55">칭찬은 최근 평점 7.0 이상일 때, 격려는 부진(6.6 미만)하거나 컨디션이 나쁠 때 효과가 큽니다. 질책은 부진한 선수에게만 통하며 프로의식 13 이상은 분발, 9 이하는 반발합니다. 선수별 21일에 한 번. 기자회견 답변은 받은 소식에서 고르며, 자신감 발언은 이기면 사기 상승·지면 비판을 받습니다.</p>`}
sqTabs=function(){const v=UI.sqv||'sq';return `<div class="chips" style="margin-top:14px">${[['sq','선수단'],['trn','훈련·코치진'],['mgmt','선수 관리']].map(([k,l])=>`<button class="chip" data-sqv="${k}" aria-pressed="${v===k}">${l}</button>`).join('')}</div>`};
{const _sv=squadView;squadView=function(){if(UI.sqv==='mgmt')return mgView();return _sv()}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-pr],[data-talk]');if(!b||!S)return;e.stopPropagation();e.preventDefault();
  if(b.dataset.talk){mgTalk(+b.dataset.pid,b.dataset.talk);return}const m=S.inbox.find(x=>x.id===+b.dataset.msg);if(!m||m.done)return;prAnswer(m,b.dataset.pr)},true);

// ---- 경기 전 기자회견 순서 보장(v89): 답하지 않은 채 경기를 시작하면 킥오프 전에 질문 창, 지난 경기의 미답변 질문은 만료 ----
function prPreFor(fx){const key=fx.d+':'+fx.h+':'+fx.a;return S.inbox.find(x=>x.type==='press'&&x.pr&&x.pr.ph==='pre'&&x.pr.key===key&&!x.done)}
let PR_FX=null;
{const _sm=startMatch;startMatch=function(fx){try{const m=fx&&!fx._pr&&prPreFor(fx);if(m){PR_FX=fx;sheet(`<h3>경기 전 기자회견</h3><div class="note" style="margin:0 0 6px">${esc(m.title)}</div><p style="line-height:1.55">“${esc(m.body)}”</p><div class="acts" style="flex-wrap:wrap;gap:6px">${m.pr.opts.map(([t,l])=>`<button class="btn sm ghost" data-prpre="${t}" data-msg="${m.id}">${esc(l)}</button>`).join('')}<button class="btn sm ghost" data-prpre="skip" data-msg="${m.id}">답하지 않고 경기 시작</button></div>`);return}}catch(e){console.error(e)}return _sm.apply(this,arguments)}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-prpre]');if(!b||!S)return;e.stopPropagation();e.preventDefault();const m=S.inbox.find(x=>x.id===+b.dataset.msg);const fx=PR_FX;PR_FX=null;
  if(m&&!m.done){if(b.dataset.prpre==='skip'){m.done=1;m.read=1;m.result='답변하지 않음'}else prAnswer(m,b.dataset.prpre)}closeSheet();if(fx){fx._pr=1;startMatch(fx)}},true);
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);try{(S.inbox||[]).forEach(m=>{if(m.type==='press'&&m.pr&&m.pr.ph==='pre'&&!m.done&&m.pr.key.slice(0,10)<S.date){m.done=1;m.read=1;m.result='경기가 지나 답변 기회가 사라졌습니다'}})}catch(e){}return r}}

