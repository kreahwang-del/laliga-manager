// ================= 화면 =================
const UI={tab:'home',sq:'ALL',tt:'search',f:{g:'ALL',lg:'ALL',age:'ALL',price:'ALL',sort:'ovr',q:''},lim:40,lt:'table'};
function render(){
  const app=$('#app');
  if(!S){app.innerHTML=startView();return}
  const w=winNow(),unread=S.inbox.filter(m=>!m.read).length;
  app.innerHTML=`<header class="top"><div class="in">${crest(S.club)}<div><h1>${esc(CLUBS[S.club].name)}</h1><div class="sub">${fmtD(S.date)} · ${S.season}-${String(S.season+1).slice(2)} 시즌${w?' · <span style="color:var(--good)">이적시장</span>':''}</div></div>
    ${unemp()?'<span class="money" style="opacity:.7">평판<b>'+S.me.rep+'</b></span>':'<button class="money" data-act="fin">이적 예산<b>'+money(S.fin.budget)+'</b></button>'}</div></header>
  <main class="wrap">${({home:homeView,squad:squadView,tac:tacView,trans:transView,league:leagueView,career:careerView})[unemp()&&['squad','tac','trans'].includes(UI.tab)?'home':UI.tab]()}</main>
  <div class="go"><div class="in"><button data-act="advance">계속 <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 5l8 7-8 7"/></svg></button></div></div>
  <nav class="nav"><div class="in">
   ${nb('home','홈','<path d="M3 11l9-7 9 7v9H3z"/><path d="M9 20v-6h6v6"/>',unread)}
   ${unemp()?'':nb('squad','스쿼드','<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14c2.8 0 5 2.2 5 5"/>')}${unemp()?'':nb('tac','전술','<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18"/><circle cx="12" cy="12" r="3"/>')}${unemp()?'':nb('trans','이적','<path d="M4 8h13l-3-3M20 16H7l3 3"/>')}
   ${nb('league','리그','<path d="M7 4h10v4a5 5 0 01-10 0z"/><path d="M12 13v4M8 20h8"/>')}
   ${nb('career','감독','<circle cx="12" cy="7" r="3.5"/><path d="M5 21v-2a7 7 0 0114 0v2"/><path d="M12 14l-1.5 4 1.5 1.5 1.5-1.5z"/>')}
  </div></nav>`;
}
function nb(t,l,svg,badge){return `<button data-tab="${t}" aria-current="${UI.tab===t}"><svg viewBox="0 0 24 24">${svg}</svg>${l}${badge?'<span class="dotn"></span>':''}</button>`}
function startView(){const saved=loadSave();
  const teams=LIGA.map(i=>{const sq=squadOfBase(i).sort((a,b)=>b.ovr-a.ovr).slice(0,16);return {i,avg:Math.round(sq.reduce((a,p)=>a+p.ovr,0)/sq.length),star:sq[0]}}).sort((a,b)=>b.avg-a.avg);
  return `<main class="wrap"><section class="hero"><div class="eyebrow">${IMG.on&&lgLogo('ES')?`<img class="lgi big" src="${lgLogo('ES')}" alt="" onerror="this.remove()">`:''}LaLiga · 2026-27</div><h1>라리가 매니저</h1>
  <p>2026년 7월 1일 프리시즌부터 시작합니다. 전술은 3단계 엔진(15칸 매치업)으로 돌아갑니다. 첫 시즌은 여름 이적시장이 없고, 2027년 1월 겨울 이적시장부터 영입·판매가 가능합니다.</p></section>
  ${saved?`<button class="btn" data-act="resume">이어하기 · ${esc(CLUBS[saved.club].name)} · ${fmtD(saved.date)}</button><p class="note">아래에서 구단을 고르면 새 게임이 시작되고 저장된 진행은 지워집니다.</p>`:''}
  <div class="pick">${teams.map(t=>`<button data-new="${t.i}">${crest(t.i)}<span><b>${esc(CLUBS[t.i].name)}</b><small>에이스 ${esc(t.star.name)} · 이적 예산 ${mM(CLUBS[t.i].budget)}</small></span><span class="ovr num ${ovrCls(t.avg)}">${t.avg}</span></button>`).join('')}</div>
  <div class="chips" style="margin-top:14px"><button class="chip" data-imgtog aria-pressed="${IMG.on}">선수 사진·로고 표시 ${IMG.on?'켬':'끔'}</button></div><p class="note" style="margin-top:10px;line-height:1.6">사진·로고는 Transfermarkt 이미지 주소를 인터넷으로 불러옵니다(오프라인이면 이니셜 배지). 숫자는 상위 16명 평균 능력치. 선수 기록: FBref 기반 5대 리그 데이터(2024-25 세부, 2025-26·2026-27 기본). 시장가치·계약: Transfermarkt 기반 공개 데이터셋. 매출: 딜로이트 풋볼 머니 리그 2026(상위 구단), 나머지는 스쿼드 가치로 추정. 연봉·바이아웃은 추정치입니다.</p></main>`}
function squadOfBase(c){return Object.values(BASE).filter(p=>p.club===c)}

function homeView(){
  const w=winNow(),nw=nextWin(),nx=nextEvent(),mn=myNext();
  const fr=S.friendlies.find(x=>!x.res);const up=[fr,mn,(typeof cupNextMine==='function'?cupNextMine():null)].filter(Boolean).sort((a,b)=>a.d<b.d?-1:1)[0];
  const tb=table(),pos=tb.findIndex(t=>t.id===S.club)+1;
  const msgs=S.inbox.slice(0,25);
  setTimeout(()=>{S.inbox.forEach(m=>{if(!['offer','request','clause'].includes(m.type)||m.done)m.read=true});save()},0);
  return `${w?`<div class="banner open"><span><b>${w.k==='winter'?'겨울':'여름'} 이적시장</b> · ${fmtD(w.to)} 마감</span><span class="num" style="font-size:17px">D-${daysBetween(S.date,w.to)}</span></div>`
    :nw?`<div class="banner closed"><span>다음 이적시장 ${fmtD(nw.from)} 개장</span><span class="num" style="font-size:17px">D-${daysBetween(S.date,nw.from)}</span></div>`:''}
  ${up?`<section class="card fixture"><div class="md"><span>${up.r?`${up.r}라운드`:(up.cup||up.po||up.eu)?esc(cupLabel(up)):'프리시즌 친선경기'} · ${fmtD(up.d)}</span><span>${up.h===S.club?'홈':'원정'}</span></div>
    <div class="vs"><div class="team">${crest(up.h)}${esc(CLUBS[up.h].name)}</div><div class="mid">VS</div><div class="team">${crest(up.a)}${esc(CLUBS[up.a].name)}</div></div>
    <p class="note" style="text-align:center">오른쪽 아래 '계속'을 누르면 경기일까지 진행합니다. 도중에 처리할 소식이 생기면 멈춥니다.</p></section>`
   :`<section class="card pad" style="margin-top:14px">남은 경기가 없습니다. '계속'을 눌러 다음 시즌으로 넘어가세요.</section>`}
  <h2>받은 소식</h2><div class="card inbox">${msgs.length?msgs.map(msgHTML).join(''):'<div class="msg"><p>새 소식이 없습니다.</p></div>'}</div>
  ${S.fixtures.some(x=>x.res)?`<h2>순위 · ${pos}위</h2><div class="card">${tableHTML(tb.slice(Math.max(0,pos-3),Math.max(5,pos+2)),true)}</div>`:''}`;
}
function msgHTML(m){let acts='';
  if(!m.done){
    if(m.type==='offer')acts=`<button class="btn sm" data-msg="${m.id}" data-do="accept">수락</button><button class="btn sm ghost" data-msg="${m.id}" data-do="counter">역제안 ${money(Math.round(m.fee*1.2/1e5)*1e5)}</button><button class="btn sm ghost" data-msg="${m.id}" data-do="reject">거절</button>`;
    if(m.type==='request')acts=`<button class="btn sm ghost" data-msg="${m.id}" data-do="list">판매 명단에 올림</button><button class="btn sm ghost" data-msg="${m.id}" data-do="promise">출전 약속</button><button class="btn sm ghost" data-msg="${m.id}" data-do="deny">이적 불가 통보</button>`;
    if(m.type==='clause')acts=`<button class="btn sm ghost" data-msg="${m.id}" data-do="persuade">잔류 설득</button><button class="btn sm ghost" data-msg="${m.id}" data-do="letgo">보내기</button>`;
  }
  if(m.type==='scout')acts=`<button class="btn sm ghost" data-player="${m.pid}">선수 보기</button>`;
  return `<div class="msg ${m.read?'':'new'}"><div class="h"><span>${fmtD(m.d)}</span><span>${{offer:'영입 제안',request:'선수 면담',clause:'바이아웃',scout:'스카우트',window:'이적시장',board:'이사회',contract:'계약','부상':'의료진'}[m.type]||''}</span></div>
    <b>${esc(m.title)}</b><p>${esc(m.body)}${m.result?` <span style="color:var(--text)">→ ${esc(m.result)}</span>`:''}</p>${acts?`<div class="acts">${acts}</div>`:''}</div>`}

function squadView(){
  const f=UI.sq, sq=squadOf(S.club).filter(p=>f==='ALL'||LINE[p.g]===f).sort((a,b)=>b.ovr-a.ovr), xi=new Set(S.xi||[]);
  const tot=wageBill(S.club),cap=CLUBS[S.club].wageCap*1e6;
  return `<div class="chips">${['ALL','GK','DF','MF','FW'].map(k=>`<button class="chip" data-sq="${k}" aria-pressed="${f===k}">${k==='ALL'?'전체':k}</button>`).join('')}</div>
  <p class="note">연봉 총액 ${money(tot)} / 한도 ${money(cap)} · 선수를 누르면 상세 정보, 재계약, 판매 설정을 할 수 있습니다.</p>
  <div class="card list" style="margin-top:8px">${sq.map(p=>{const h=p.happy??60;
    return `<button class="li" data-player="${p.id}">${avatar(p,'sm')}<span class="nm"><b>${esc(p.name)}${xi.has(p.id)?' <span style="color:var(--amber);font-size:11px">선발</span>':''}</b>
    <span class="sub2">${posTags(p)}${ageOf(p)}세 · ${money(p.wage)}/년 · ~${p.cEnd.slice(0,4)}${p.injD?` · <span style="color:var(--bad)">부상 ${typeof injLeft==='function'?injLeft(p.injD)+' · '+injRet(p.injD)+' 복귀':Math.ceil(p.injD/7)+'주'}</span>`:''}</span></span>
    ${p.listed?'<span class="pill y">판매</span>':''}${h<60?`<span class="pill ${h>=35?'n':'r'}">${h>=35?'보통':'불만'}</span>`:''}
    <span class="rcol"><span class="ovr num ${ovrCls(p.ovr)}">${p.ovr}</span><small><b style="color:${cnd(p).c}">${cnd(p).a}</b> ${p.fit??100}%</small></span></button>`}).join('')}</div>`}

