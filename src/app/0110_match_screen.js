// ================= 경기 화면(실시간 진행·결정적 순간) =================
let M=null;
function startMatch(fx){
  const H=teamFor(fx.h),Aw=teamFor(fx.a); if(!H||!Aw){fx.res={sc:[0,0],ev:[]};render();return}
  const league=!!fx.r, me=fx.h===S.club?0:1;
  M={fx,H,Aw,me,league,speed:(UI.mspd>1?1:(UI.mspd||.5)),/* v258: 기본 보통(½), 예전 3배속 저장값은 빠르게(1)로 */timer:null,done:false,paused:false,subsLeft:5,prompts:{},talkDone:false,shoutCd:0};
  try{M.pos0=posOf(S.club)}catch(e){}
  M.m=runMatch(H,Aw,{
    halftime:(st,T,api)=>{if(!M.skipping)pause('half')},
    afterMinute:(min,st,T,api)=>{checkMoments(min,st,T,api)},
    onRed:(s,p)=>{if(s===me&&!M.skipping)M.pending='red'},
    wantPen:(s)=>s===me&&!M.skipping,     wantDec:(k,s)=>decWant(k,s),
    noAuto:(s)=>s===me&&!M.skipping&&S.autoSubLive!==true,
    subHint:(s)=>{if(s!==me||M.skipping||M.subsLeft<=0)return;try{const qs=quickSubs();if(qs.length)feed({m:M.m.min,t:'sys',txt:`교체 추천 · ${qs.slice(0,2).map(x=>`${shortName(x.out.name)} → ${shortName(x.inP.name)} (${x.why})`).join(', ')} — '전술·교체'에서 바로 교체할 수 있습니다`})}catch(e){}},
    onInjury:(s,p)=>{if(s===me&&!M.skipping&&!M.pending){M.pending={k:'inj',p};return true}return false}
  });
  const d=document.createElement('div');d.className='match';d.id='match';
  d.innerHTML=`<div class="in"><div class="board"><div class="team">${crest(fx.h)}${esc(CLUBS[fx.h].name)}</div>
    <div><div class="score num" id="msc">0 : 0</div><div class="clock" id="mck">${league?`${fx.r}라운드`:(fx.cup||fx.po||fx.eu)?esc(cupLabel(fx)):'친선경기'}${derbyOf(fx.h,fx.a)?` · <b style="color:var(--amber)">${derbyOf(fx.h,fx.a)}</b>`:''}</div></div>
    <div class="team">${crest(fx.a)}${esc(CLUBS[fx.a].name)}</div></div>
    <div class="m2dw">${pitchSVG()}<div class="mcap" id="mcap">&nbsp;</div></div>
    <div class="mstats" id="mst"></div><div class="feed" id="mfd"></div><div class="mptab" id="mptab">${[["feed","중계만"],["0","우리 기록"],["1","상대 기록"]].map(([k,l])=>`<button data-mpst="${k}" aria-pressed="${(UI.mpst??"0")===k}">${l}</button>`).join("")}</div><div class="mpst" id="mpst"${(UI.mpst??"0")==="feed"?" hidden":""}></div>
    <div class="mctl" id="mct">
      <button class="btn ghost" data-act="speed">${spdLbl(M.speed)}</button><button class="btn ghost" data-act="mshout">지시</button><button class="btn ghost" data-act="msubs">전술·교체 <span id="msl">5</span></button><button class="btn" data-act="skip">결과 보기</button></div></div>`;
  document.body.appendChild(d);
  feed({m:0,t:'sys',txt:`킥오프 · ${CLUBS[S.club].short} ${S.tac.form.base} · ${S.tac.preset}`});
  drawPlayers(); mstats(); mpst(); tick();
}
function pause(kind,data){if(M.animating){M.deferred=[kind,data];return}M.paused=true;clearTimeout(M.timer);momentSheet(kind,data)}
function afterPlay(){if(!M||M.done)return;M.animating=false;
  if(M.paused)return;
  if(M.m.st.pendingPen&&!M.skipping){pause('pen');return}   if(M.m.st.pendingDec&&!M.m.st.pendingDec.done&&!M.skipping){pause('dec');return}
  if(M.pending){const k=M.pending;M.pending=null;pause(k);return}
  if(M.deferred){const d=M.deferred;M.deferred=null;pause(d[0],d[1]);return}
  if(M.m.min===45&&!M.m.st.htDone)feed({m:45,t:'sys',txt:'전반 종료'});
  M.timer=setTimeout(tick,90/M.speed)}
function resume(){closeSheet();M.paused=false;M.inSubs=false;UI.subOut=null;if(M.done)return;
  if(M.m.st.pendingPen&&!M.skipping){pause('pen');return}   if(M.m.st.pendingDec&&!M.m.st.pendingDec.done&&!M.skipping){pause('dec');return}
  if(M.pending){const k=M.pending;M.pending=null;pause(k);return}
  if(M.deferred){const d=M.deferred;M.deferred=null;pause(d[0],d[1]);return}
  tick()}
function tick(){
  if(!M||M.done||M.paused)return;
  /* v140 경기 중 전술 화면을 열었다 돌아올 때 이전 재생이 끝나기 전에 다시 tick이 불려 진행 고리가 2개가 되던 문제(재생이 서로 끊겨 뚝뚝 끊기고 시간이 2배로 흐름): 재생 중이면 그 재생이 끝난 뒤 이어서 진행 */
  if(M.animating)return;
  M.animating=true;const id=M.chain=(M.chain||0)+1;
  M.min0=M.m.min;const evs=M.m.step(); if(evs===null){M.animating=false;finish();return}if(typeof oppAccum==='function')oppAccum();
  /* v155 중계 동기화: 이전엔 1분 단위 계산 직후 문자 중계·점수·시계를 먼저 바꾸고 그 1분을 재생 → 느린 속도에서 골 표시가 장면보다 수십 초 먼저 나왔음. 이제 시각(sec)이 있는 이벤트는 재생 시점에 표시 */
  const v4=!M.skipping&&M.m.v===4&&(M.m.st.frames||[]).length;M.evQ=v4?evs.filter(e=>e.sec!=null):[];M.clk=v4?M.m.st.frames[0].t:null;
  evs.forEach(e=>{if(!M.evQ.includes(e))feed(e)}); updateBoard();
  if(M.skipping){evFlush();afterPlay();return}
  playEvents(evs).then(()=>{evFlush();if(M&&M.chain===id)afterPlay()});
}
function evFlush(t){if(!M||!M.evQ)return;let ch=false;while(M.evQ.length&&(t==null||M.evQ[0].sec<=t)){feed(M.evQ.shift());ch=true}if(t==null){M.evQ=[];M.clk=null}else M.clk=t;if(ch||t==null)updateBoard();else{const el=$('#mck');if(el)el.textContent=`${clkMin()}'`}}
function clkMin(){const m=M.m.min;if(M.clk==null||M.min0==null)return m;return Math.min(m,M.min0)}
function updateBoard(){const st=M.m.st;M.subsLeft=Math.max(0,5-st.subs[M.me].length);{const el=$('#msl');if(el)el.textContent=M.subsLeft}{const q=M.evQ||[],g=x=>st.sc[x]-q.filter(e=>e.t==='goal'&&e.s===x).length;$('#msc').textContent=`${g(0)} : ${g(1)}`}$('#mck').textContent=`${clkMin()}'`;mstats();mpst()}
function mstats(){const st=M.m.st,tp=st.pos[0]+st.pos[1]||1,po=[Math.round(st.pos[0]/tp*100)];po[1]=100-po[0];
  const row=(l,a,b,f=x=>x)=>{const m=Math.max(a,b,.01);return `<div class="cmp"><div class="row"><span class="v">${f(a)}</span><div class="bar l"><i style="width:${a/m*100}%;background:${a>=b?'var(--amber)':'var(--faint)'}"></i></div><span class="lab">${l}</span><div class="bar"><i style="width:${b/m*100}%;background:${b>=a?'var(--amber)':'var(--faint)'}"></i></div><span class="v">${f(b)}</span></div></div>`};
  $('#mst').innerHTML=row('점유율',po[0],po[1])+row('슈팅',st.sh[0],st.sh[1])+row('xG',st.xg[0],st.xg[1],x=>x.toFixed(2))}
function feed(e){const fd=$('#mfd');if(!fd)return;const nm=s=>CLUBS[s===0?M.fx.h:M.fx.a].short;let t='',cls='ev';
  const TY={cross:'크로스 헤더',lowcross:'낮은 크로스',cutback:'컷백',through:'스루패스',longshot:'중거리',combo:'연계',solo:'개인 돌파',rebound:'리바운드',spfoot:'세트피스 세컨드볼',gkErr:'빌드업 실수 틈탄',corner:'코너킥 헤더',fkx:'프리킥 헤더',fk:'직접 프리킥',pen:'페널티킥'};
  if(e.t==='corner')t=`${e.side==='L'?'왼쪽':'오른쪽'} 코너킥 · ${esc(e.p)}${e.sw==='in'?' (인스윙)':e.sw==='out'?' (아웃스윙)':''}`;else if(e.t==='fkShot')t=`<span class="tag" style="background:var(--surf2);color:var(--text)">프리킥</span>${e.side==='L'?'왼쪽':e.side==='R'?'오른쪽':'정면'}에서 ${esc(e.p)}의 직접 슈팅${e.sw==='in'?' (감아 차기)':''}`;else if(e.t==='fkCross')t=`프리킥 크로스 · ${esc(e.p)}`;else if(e.t==='penAward'){cls+=' goal';t=`<span class="tag" style="background:var(--bad);color:#fff">PK</span>${nm(e.s)} 페널티킥! 키커 ${esc(e.p)}`}else if(e.t==='offside')t=`오프사이드 · ${esc(e.p)}`;else if(e.t==='claim')t=`${esc(e.gk)}가 크로스를 잡아냅니다`;else if(e.t==='aerialLost'||e.t==='aerialWon'||e.t==='secondBall'||e.t==='longWon'||e.t==='longLost'||e.t==='intercept'){return}
  else if(e.t==='block')t=`${esc(e.p)}의 ${TY[e.type]||''} 슈팅, ${esc(e.d)}가 몸으로 막아냅니다`;else if(e.t==='rebound')t=`흘러나온 공! ${esc(e.p)}가 달려듭니다`;else if(e.t==='recover')t=`${esc(e.p)}가 전력 복귀해 ${esc(e.a)}의 역습을 끊습니다`;
  else if(e.t==='gkErr'){cls+=' sys';t=`압박에 걸린 ${esc(e.p)}의 빌드업 실수! ${esc(e.by)}에게 기회`}else if(e.t==='injury'){cls+=' sys';t=`<span class="tag" style="background:var(--bad);color:#fff">부상</span>${esc(e.p)} (${nm(e.s)})${e.why==='foul'?' — 거친 태클':''}`}
  else if(e.t==='dec'){if(e.fol==null||e.s!==M.me)return;cls+=' sys';t=decFolTxt(e)}else if(e.t==='decAct'&&e.k==='def'){if(e.s!==M.me)return;cls+=' sys';const it=DEF_IT[e.intent]||'';const an=esc(shortName(e.pn||''));t=e.res==='W'?`🛡 수 읽기 성공! ${an}의 ${it}을(를) 막아냅니다`:e.res==='L'?`⚠ 수 읽힘 — ${an}의 ${it}에 당했습니다`:`팽팽한 1대1 — ${an}이(가) ${it}을(를) 시도합니다`}else if(e.t==='decAct'){if(e.fol||e.s!==M.me)return;cls+=' sys';t=decActTxt(e)}   else if(e.t==='sys'){cls+=' sys';t=e.txt}
  else if(e.t==='goal'){cls+=' goal';t=decHit(e)+`<span class="tag">골</span><b>${esc(e.p)}</b> (${nm(e.s)}) · ${TY[e.type]||''}${e.a?` · ${esc(e.a)} 도움`:''} <span style="color:var(--muted)">xG ${e.xg}</span>`}
  else if(e.t==='save')t=e.type==='pen'?`${esc(e.gk)}가 ${esc(e.p)}의 페널티킥을 막아냅니다!`:`${esc(e.p)}의 ${TY[e.type]||''} 슈팅, ${esc(e.gk)} 선방`;
  else if(e.t==='miss')t=e.type==='pen'?`${esc(e.p)}의 페널티킥이 빗나갑니다!`:`${esc(e.p)}의 ${TY[e.type]||''} 슈팅이 벗어납니다${e.weak?' (약발)':''}`;
  else if(e.t==='yellow')t=`<span class="tag" style="background:#E8C547;color:#231C02">경고</span>${esc(e.p)} (${nm(e.s)})`;
  else if(e.t==='red')t=`<span class="tag" style="background:var(--bad);color:#fff">퇴장</span>${esc(e.p)} (${nm(e.s)})${e.dr===1?' · 직접 퇴장':e.dr===0?' · 경고 누적':''}`;
  else if(e.t==='sub')t=`<span class="tag" style="background:var(--info);color:#062230">교체</span>${esc(e.inP)} ⟵ ${esc(e.out)} (${nm(e.s)})`;
  else if(e.t==='aiTac'){cls+=' sys';t=e.k==='push'?`${esc(nm(e.s))}, 라인을 올리고 공세로 전환`:`${esc(nm(e.s))} 감독 ${e.k==='atk'?'승부수: 템포를 올리고 측면을 넓게':'리드 지키기: 수비 보강 · '+e.f}`}
  else if(e.t==='shout'){cls+=' sys';t={push:'"더 올라가!" — 공격적으로 전환',hold:'"라인 내려!" — 수비적으로 전환',calm:'"침착하게" — 균형 운영',fire:'"정신 차려!" — 선수들을 독려'}[e.kind]}
  else return;
  const el=document.createElement('div');el.className=cls;el.innerHTML=`<span class="m">${e.m?e.m+"'":''}</span><span class="t">${t}</span>`;fd.prepend(el)}
// ---- 결정적 순간 ----
function checkMoments(min,st,T,api){
  const me=M.me,o=1-me,d=st.sc[me]-st.sc[o];
  if(M.skipping)return;
  /* v255 막판 승부수: 80~86분에 지고 있으면 한 번 */if(typeof GMB_ON!=='undefined'&&GMB_ON&&min>=80&&min<=86&&d<0&&!M.prompts.gamble){M.prompts.gamble=true;M.pending='gamble';return}
  if(min>=60&&min<=75&&d<0&&!M.prompts.behind){M.prompts.behind=true;M.pending='behind';return}
  if(min>=70&&d>0&&!M.prompts.lead&&Math.random()<.15){M.prompts.lead=true;M.pending='lead';return}
  // 상대 에이스가 매치업을 지배
  if(!M.prompts.ace&&min>=20){const dom=Object.values(st.duels).find(x=>x.w>=3&&x.w-x.l>=2&&T[o].xi.some(p=>p.name===x.a));if(dom){M.prompts.ace=true;M.pending={k:'ace',d:dom};return}}
  // 경기 중 부상(우리 팀)
}
function momentSheet(kind,data){
  const st=M.m.st,me=M.me,o=1-me,d=st.sc[me]-st.sc[o];const k=typeof kind==='string'?kind:kind.k;
  const opt=(id,l,sub)=>`<button class="btn ghost" data-mo="${id}" style="text-align:left;display:block"><b>${l}</b>${sub?`<div class="note" style="margin:2px 0 0">${sub}</div>`:''}</button>`;
  let h='';
  if(k==='pen'){const T=M.m.T[me];const c=T.xi.filter(p=>p.g!=='GK').sort((a,b)=>((b.pen??10)*.7+(b.comp??12)*.3)-((a.pen??10)*.7+(a.comp??12)*.3));const d0=S.tac.setp&&S.tac.setp.pen;
    h=`<div class="note" style="margin:0">${M.m.min}' · 페널티킥을 얻었습니다</div><h3>키커를 고르세요</h3>${c.slice(0,6).map(p=>`<button class="li" data-pk="${p.id}">${avatar(p,'sm')}<span class="pos ${p.g}">${p.g}</span><span class="nm"><b>${esc(p.name)}${p.id===d0?' <span style="color:var(--amber);font-size:11px">지정 키커</span>':''}</b><span>페널티 ${rnd0(p.pen)} · 침착성 ${rnd0(p.comp)} · 오늘 평점 ${(M.m.st.pr[p.id]||{r:6.5}).r.toFixed(1)}</span></span></button>`).join('')}`}
  else if(k==='half'){M.halfOpen=true;h=`<div class="note" style="margin:0">하프타임 · ${st.sc[0]} : ${st.sc[1]}</div><h3>팀토크</h3>
    ${opt('t_praise','칭찬','"잘하고 있다, 이대로 가자" — 앞서고 있을 때 효과적')}${opt('t_calm','침착','"서두르지 말고 우리 플레이" — 접전에서 안정')}${opt('t_angry','질책','"이 정도로는 안 된다" — 뒤질 때 프로의식 높은 팀에 효과, 반발 위험')}
    <div class="row2" style="margin-top:12px"><button class="btn ghost" data-act="msubs">교체</button><button class="btn ghost" data-act="mtac">전술 변경</button></div>
    <button class="btn" data-mo="resume">후반 시작</button>`}
  else if(k==='behind'){h=`<div class="note" style="margin:0">${M.m.min}' · ${d}점 뒤지고 있습니다</div><h3>어떻게 할까요?</h3>
    ${M.m.T[M.me].ment==='공격적'?'<p class="note">이미 공격 전환(공격적 성향) 적용 중입니다.</p>':opt('push','공격 전환','공격적 성향 · 라인 +1 · 템포 +1 → 득점 기회 ↑, 역습 허용 ↑')}${opt('sub','공격수 투입','교체 화면 열기')}${opt('resume','현 상태 유지','')}`}
  else if(k==='gamble'){h=gambleSheetHTML(d,opt)}
  else if(k==='lead'){h=`<div class="note" style="margin:0">${M.m.min}' · ${d}점 앞서고 있습니다</div><h3>지킬까요, 더 갈까요?</h3>
    ${M.m.T[M.me].ment==='수비적'?'<p class="note">이미 지키기(수비적 성향) 적용 중입니다.</p>':opt('hold','지키기','수비적 성향 · 라인 −1 → 실점 위험 ↓, 상대 점유 ↑')}${opt('resume','그대로 진행','')}`}
  else if(k==='red'){h=`<div class="note" style="margin:0">${M.m.min}' · 우리 선수 퇴장</div><h3>대형을 조정할까요?</h3>
    ${opt('compact','수비 대형 5-4-1로 전환','수비 시 대형을 낮은 블록으로')}${opt('hold','수비적 성향으로','')}${opt('resume','그대로 진행','')}`}
  else if(k==='ace'){const dm=kind.d;h=`<div class="note" style="margin:0">${M.m.min}' · 상대 ${esc(dm.a)}이(가) ${esc(dm.d)}을(를) ${dm.w}번 제쳤습니다</div><h3>전담 마크를 붙일까요?</h3>
    ${opt('mark:'+dm.a,'밀착 맨마킹','가장 가까운 수비수가 따라붙음 · 공간 노출 위험')}${opt('resume','그대로 진행','')}`}
  else if(k==='inj'){const p=kind.p;const key=(M.m.T[M.me].k('base').find(q=>q.p.id===p.id)||{}).slotKey||p.g;const bench=benchList().sort((a,b)=>E3.fitOf(b,key)*b.ovr-E3.fitOf(a,key)*a.ovr);h=`<div class="note" style="margin:0">${M.m.min}' · ${esc(p.name)} 부상</div><h3>교체 선수를 고르세요</h3>
    ${M.subsLeft>0?bench.slice(0,8).map(b=>`<button class="li" data-subin="${b.id}" data-subout="${p.id}">${avatar(b,'sm')}<span class="pos ${b.g}">${b.g}</span><span class="nm"><b>${esc(b.name)}</b><span>${GN[b.g]} · 컨디션 ${cnd(b).a}</span></span><span class="ovr num ${ovrCls(b.ovr)}">${b.ovr}</span></button>`).join(''):'<p class="note">교체 카드가 없어 부상 선수가 계속 뜁니다(능력 20% 저하).</p><button class="btn" data-mo="resume">계속</button>'}`}
  sheet(`<div class="note" style="text-align:right;margin:0"><span class="pill n">경기 일시정지</span></div>${h}`);
}
function benchList(){const inXI=new Set(M.m.T[M.me].xi.map(p=>p.id));const red=new Set(M.m.st.ev.filter(e=>e.t==='red'&&e.pid!=null).map(e=>e.pid));return squadOf(S.club).filter(p=>!inXI.has(p.id)&&!red.has(p.id)&&!(p.injD>0)&&!M.m.st.subs[M.me].some(x=>x.out.id===p.id)).sort((a,b)=>b.ovr-a.ovr)}
function subsSheet(){const T=M.m.T[M.me],st=M.m.st;const ks=T.k('base');M.inSubs=true;
  const out=UI.subOut?ks.find(q=>q.p.id===UI.subOut):null;
  const dots=ks.map(q=>{const p=q.p,f=Math.round(st.fatigue[M.me][p.id]||0),r=st.pr[p.id],sel=UI.subOut===p.id,subIn=st.subs[M.me].some(x=>x.inP.id===p.id);
    const sta=Math.max(0,100-f);const col=sta>=65?'var(--good)':sta>=45?'var(--ok)':'var(--bad)';
    return `<button class="mp${sel?' sel':''}" data-subout="${p.id}" style="left:${q.x}%;top:${q.y}%"><span class="d" style="border-color:${col}">${r?r.r.toFixed(1):'-'}${st.cards[p.id]?'<i class="yc"></i>':''}${subIn?'<i class="si">↑</i>':''}</span><span class="n">${esc(shortName(p.name))}</span><span class="k">${q.slotKey} · ${sta}%</span></button>`}).join('');
  let list='';
  if(out){const key=out.slotKey;const bl=benchList().map(b=>({b,f:E3.fitOf(b,key)})).sort((a,b)=>(b.f>=.85)-(a.f>=.85)||b.f*b.b.ovr-a.f*a.b.ovr);
    list=`<div class="meta" style="margin:10px 0 4px;color:var(--muted);font-size:12px">나갈 선수 <b style="color:var(--text)">${esc(out.p.name)}</b> (${key}) → 들어올 선수 · 같은 포지션 우선</div>
    <div class="list">${bl.map(({b,f})=>{const [fc,fl]=fitTag(f);return `<button class="li" data-subin="${b.id}" data-subout="${out.p.id}">${avatar(b,'sm')}<span class="nm"><b>${esc(b.name)}</b><span class="meta">${posTags(b)}<span class="pill ${fc}">${key} ${fl}</span><span>컨디션 ${cnd(b).a} · 체력 ${b.fit??100}%</span></span></span><span class="ovr num ${ovrCls(b.ovr)}">${b.ovr}</span></button>`}).join('')||'<p class="note">교체할 수 있는 선수가 없습니다.</p>'}</div>`}
  else{const qs=M.subsLeft>0?quickSubs():[];list=(qs.length?`<div class="lbl">빠른 교체 추천</div>${qs.map(x=>`<div class="qs">${avatar(x.out,'sm')}<div class="qsn"><b>${esc(shortName(x.out.name))}</b><span>${esc(x.why)}</span></div><span class="qa">→</span>${avatar(x.inP,'sm')}<div class="qsn"><b>${esc(shortName(x.inP.name))}</b><span>${x.key} ${fitTag(x.f)[1]} · ${x.inP.ovr}</span></div><button class="btn sm" data-qsub="${x.out.id}:${x.inP.id}">교체</button></div>`).join('')}${qs.length>1?`<button class="btn ghost" data-qsuball="1" style="margin-top:6px">추천 ${qs.length}명 한 번에 교체</button>`:''}`:'')+`<p class="note" style="margin-top:8px">경기장에서 뺄 선수를 누르세요. 점 안 숫자는 평점, 아래는 자리·남은 체력(${'<'}45% 빨강).</p>`}
  const subs=st.subs[M.me].map(x=>`<span class="st">${x.m}' ${esc(shortName(x.inP.name))} ⟵ ${esc(shortName(x.out.name))}</span>`).join(' ');
  sheet(`<button class="x" data-mo="resume">경기 재개</button><div class="note" style="margin:0">${M.m.min}' · ${st.sc[0]}:${st.sc[1]} · 교체 ${M.subsLeft}장 남음${T.xi.length<11?` · <b style="color:var(--bad)">퇴장 ${11-T.xi.length}명(${T.xi.length}명으로 경기 중)</b>`:''}</div><h3>전술·교체</h3><div class="chips" style="margin:2px 0 6px"><button class="chip" data-mo="autosub" aria-pressed="${S.autoSubLive===true}">경기 중 자동 교체 ${S.autoSubLive===true?'켬':'끔'}</button><span class="note" style="margin:0;align-self:center">기본은 끔: 보는 동안엔 추천만, '결과 보기'를 누르면 남은 시간 자동 교체</span></div>
   <div class="note">${esc(T.form.base)} · ${esc(T.preset)}${T.form.def!==T.form.base?` · 수비 시 ${esc(T.form.def)}`:''}${T.form.atk!==T.form.base?` · 공격 시 ${esc(T.form.atk)}`:''}</div>
   <div class="mpitch">${dots}</div>${subs?`<div class="keys" style="margin-top:6px">${subs}</div>`:''}
   ${M.subsLeft>0?list:'<p class="note" style="margin-top:8px">교체 카드를 모두 썼습니다.</p>'}
   <button class="btn" data-medit="open" style="margin-top:10px">전체 전술 화면 (경기 전과 같은 설정)${T.xi.length<11?` · 퇴장 ${11-T.xi.length}명 표시`:''}</button>
   <div class="act"><button class="btn ghost" data-act="mtac">성향·대형 빠른 변경</button><button class="btn ghost" data-act="mshout">터치라인 지시</button></div>`);
  if(out){const s=$('#scrim .sheet');if(s)setTimeout(()=>{const l=s.querySelector('.list');if(l)l.scrollIntoView({block:'nearest'})},0)}}
function doSub(outId,inId){if(M.subsLeft<=0){toast('교체 카드를 다 썼습니다');return}
  const inP=pl(inId);const ok=M.m.api.sub(M.me,outId,inP);if(!ok)return;M.subsLeft--;const el=$('#msl');if(el)el.textContent=M.subsLeft;
  M.m.st.ev.slice(-1).forEach(feed);UI.subOut=null;toast(`${inP.name} 투입`);
  if(M.inSubs&&M.subsLeft>0){subsSheet();return}
  M.inSubs=false;resume()}
function shoutSheet(){sheet(`<button class="x" data-mo="resume">닫기</button><h3>터치라인 지시</h3>
  ${(()=>{const T0=M.m.T[M.me],cm=T0.ment||'균형',fl=2-(M.m.fireN||0);return [['push','더 올라가!','공격적 성향','공격적'],['hold','라인 내려!','수비적 성향','수비적'],['calm','침착하게','균형 성향','균형'],['fire','정신 차려!',`기세 + · 경기당 2번 (남은 ${fl}번)`,null]].map(([k,l,s,mv])=>{const on=mv&&cm===mv,off=on||(k==='fire'&&fl<=0);return `<button class="btn ${on?'':'ghost'}" data-mo="shout:${k}" style="text-align:left" ${off?'disabled':''} aria-pressed="${!!on}"><b>${l}</b> <span class="note" style="display:inline;margin-left:6px">${on?'적용 중 · ':''}${s}</span></button>`}).join('')})()}
  <div class="lbl">공격 집중 레인</div><div class="seg" style="grid-template-columns:repeat(5,1fr)">${[[null,'자동'],[0,'왼쪽'],[2,'중앙'],[4,'오른쪽'],['W','양측면']].map(([v,l])=>`<button data-mo="focus:${v}" aria-pressed="${(M.m.T[M.me].focus??null)===v}">${l}</button>`).join('')}</div>`)}
function mtacSheet(){const T=M.m.T[M.me];const sets=(S.tsets||[]).map((x,i)=>x?`<button class="btn ghost" data-mo="tset:${i}" style="text-align:left"><b>전술 ${['A','B','C'][i]}</b> <span class="note" style="display:inline;margin-left:6px">${esc(tsetDesc(x))}</span></button>`:'').join('');
  sheet(`<button class="x" data-mo="resume">닫기</button><h3>전술 변경</h3>
  ${sets?`<div class="lbl">저장한 전술</div>${sets}`:''}
  <div class="lbl">기본 대형 <span style="font-weight:400">(선수는 적합도 기준 자동 재배치)</span></div><div class="chips" style="margin-top:4px">${Object.keys(E3.FORMS).map(k=>`<button class="chip" data-mo="base:${k}" aria-pressed="${T.form.base===k}" ${T.xi.length<11?'disabled':''}>${k}</button>`).join('')}</div>
  <div class="lbl">성향</div>
  <div class="chips" style="margin-top:4px">${Object.keys(E3.PRESETS).map(k=>`<button class="chip" data-mo="preset:${k}" aria-pressed="${T.preset===k}">${k}</button>`).join('')}</div>
  <div class="lbl">상대 공략 지시</div><div class="chips" style="margin-top:4px">${(typeof AF_OPTS!=='undefined'?AF_OPTS:[]).map(([v,l])=>`<button class="chip" data-mo="af:${v}" aria-pressed="${(T.af||'')===v}">${l}</button>`).join('')}</div>
  <div class="lbl">수비 대형</div><div class="chips" style="margin-top:4px">${Object.keys(E3.FORMS).map(k=>`<button class="chip" data-mo="def:${k}" aria-pressed="${T.form.def===k}">${k}</button>`).join('')}</div>
  <div class="lbl">공격 대형</div><div class="chips" style="margin-top:4px">${Object.keys(E3.FORMS).map(k=>`<button class="chip" data-mo="atk:${k}" aria-pressed="${T.form.atk===k}">${k}</button>`).join('')}</div>
  <p class="note">경기 중 변경은 이번 경기에만 적용됩니다. 숙련도는 성향·기본 대형 조합마다 따로 쌓이며(기본 50), 바꾸면 그 조합의 숙련도로 뜁니다.</p>`)}
function takePK(id){const evs=M.m.api.takePen(id);evs.forEach(feed);updateBoard();resume()}
function handleMoment(id){const api=M.m.api,me=M.me,T=M.m.T[me],st=M.m.st;
  if(id==='autosub'){S.autoSubLive=S.autoSubLive!==true;toast(S.autoSubLive?'경기 중 자동 교체 켬':'경기 중 자동 교체 끔 — 추천만 표시, 결과 보기 때만 자동');subsSheet();return}
  if(id==='resume'){if(M.halfOpen&&!M.talkDone){M.talkDone=true}M.halfOpen=false;resume();return}
  if(id.startsWith('t_')){const d=st.sc[me]-st.sc[1-me];const pro=T.xi.reduce((a,p)=>a+p.pro,0)/T.xi.length;let dm=0,msg='';
    if(id==='t_praise'){dm=d>0?.5:d===0?.15:-.2;msg=d>0?'선수들이 자신감을 얻었습니다':'뒤진 상황에서의 칭찬에 선수들이 어리둥절합니다'}
    if(id==='t_calm'){dm=.25;msg='선수들이 차분하게 후반을 준비합니다'}
    if(id==='t_angry'){dm=d<0?(pro>=11?.7:-.4):-.3;msg=d<0&&pro>=11?'선수들이 이를 악뭅니다':'질책에 분위기가 가라앉았습니다'}
    st.mom+=me===0?dm:-dm;M.talkDone=true;toast(msg);momentSheet('half');return}
  if(id==='push'){api.shout(me,'push');const ti=[...T.ti];ti[0]=Math.min(5,ti[0]+1);ti[3]=Math.min(5,ti[3]+1);api.setTactic(me,{ti});feed(st.ev[st.ev.length-1]);resume();return}
  if(id.startsWith('g_')){gamblePick(id);resume();return}
  if(id==='hold'){api.shout(me,'hold');const ti=[...T.ti];ti[0]=Math.max(1,ti[0]-1);api.setTactic(me,{ti});feed(st.ev[st.ev.length-1]);resume();return}
  if(id==='compact'){api.setTactic(me,{form:{...T.form,def:'5-4-1'}});api.shout(me,'hold');feed(st.ev[st.ev.length-1]);resume();return}
  if(id==='sub'){subsSheet();return}
  if(id.startsWith('shout:')){const k=id.slice(6);const MV={push:'공격적',hold:'수비적',calm:'균형'};if(MV[k]&&(T.ment||'균형')===MV[k]){toast('이미 적용 중인 지시입니다');return}if(k==='fire'){if((M.m.fireN||0)>=2){toast('정신 차려!는 경기당 2번까지 쓸 수 있습니다');return}M.m.fireN=(M.m.fireN||0)+1}api.shout(me,k);if(k!=='fire')T.gsx=T.gmbGsx||0;/* v256: 막판 승부수로 켠 공세 강도는 이후 외침에도 유지(사용자 결정 2026-10-30) */feed(st.ev[st.ev.length-1]);resume();return}
  if(id.startsWith('focus:')){const v=id.slice(6);T.focus=v==='null'?null:v==='W'?'W':+v;toast(v==='null'?'공격 방향 자동':'공격 집중 레인 변경');shoutSheet();return}
  if(id.startsWith('preset:')){const k=id.slice(7);api.setTactic(me,{preset:k,ti:[...E3.PRESETS[k]],fam:famGet(k,T.form.base)});toast(`${k}(으)로 전환`);mtacSheet();return}
  if(id.startsWith('def:')){api.setTactic(me,{form:{...T.form,def:id.slice(4)}});mtacSheet();return}
  if(id.startsWith('base:')){const k=id.slice(5);if(T.xi.length<11){toast('퇴장 중에는 기본 대형을 바꿀 수 없습니다');return}api.setTactic(me,{form:{base:k,atk:k,def:k},fam:famGet(T.preset,k)});feed({m:st.min,t:'sys',txt:`기본 대형 ${k}로 변경`});toast(`${k}로 변경 · 선수 재배치`);mtacSheet();return}
  if(id.startsWith('tset:')){const x=(S.tsets||[])[+id.slice(5)];if(!x)return;if(x.form.base!==T.form.base&&T.xi.length<11){toast('퇴장 중에는 기본 대형이 다른 전술로 바꿀 수 없습니다');return}
    const pat={form:{...x.form},slotAs:{...x.slotAs},focus:x.focus};if(x.preset!==T.preset){pat.preset=x.preset}pat.ti=[...x.ti];pat.keepFam=1;pat.fam=famGet(x.preset,x.form.base);api.setTactic(me,pat);feed({m:st.min,t:'sys',txt:`전술 ${['A','B','C'][+id.slice(5)]}로 전환 · ${x.form.base} ${x.preset}`});toast('전술 전환');resume();return}
  if(id.startsWith('af:')){const v=id.slice(3)||null;api.setTactic(me,{af:v});toast(v?`공략 지시: ${(AF_OPTS.find(x=>x[0]===v)||[])[1]}`:'공략 지시 자동');mtacSheet();return}
  if(id.startsWith('atk:')){api.setTactic(me,{form:{...T.form,atk:id.slice(4)}});mtacSheet();return}
  if(id.startsWith('mark:')){const nm=id.slice(5);const tp=M.m.T[1-me].xi.find(p=>p.name===nm);if(tp){let bi=-1,bv=-1;T.xi.forEach((p,i)=>{if(LINE[p.g]==='DF'&&p.pace+p.tackle>bv){bv=p.pace+p.tackle;bi=i}});if(bi>=0){T.marks[bi]={on:true,tight:true,t:tp.id};feed({m:M.m.min,t:'sys',txt:`${T.xi[bi].name}이(가) ${nm}을(를) 밀착 마크합니다`})}}resume();return}
}
function finish(){
  clearTimeout(M.timer);stopAnim();M.done=true;M.skipping=true;M.paused=false;M.animating=false;closeSheet();cap('경기 종료');
  while(!M.m.done)M.m.step();
  const res=M.m.finalize();M.res=res;
  updateBoard();$('#mck').textContent='경기 종료';feed({m:90,t:'sys',txt:'경기 종료'});
  const {fx,H,Aw,league,me}=M;
  applyMatch(H,Aw,res,league);fx.res=pack(res);
  try{hlFromMatch(fx,res,me,M.pos0)}catch(e){console.error(e)}
  const mine=me===0?H:Aw;
  const rts=mine.xi.concat(res.subs[me].map(x=>x.out)).map(p=>({p,r:res.ratings[p.id]})).filter(x=>x.r).sort((a,b)=>b.r.r-a.r.r);
  const TY={cross:'크로스',cutback:'컷백',through:'스루패스',longshot:'중거리',combo:'연계'};
  const lanes=res.stats.lane[me];const lt=lanes.reduce((a,b)=>a+b,0)||1;
  const el=document.createElement('div');el.className='ev sys';el.innerHTML=`<span></span><span class="t" style="color:var(--text)">
   <div style="color:var(--muted);margin-bottom:4px">우리 팀 평점 · 최우수 ${esc(rts[0]?rts[0].p.name:'')}</div><div class="rt">${rts.map(x=>`<div><span>${esc(shortName(x.p.name))}${x.r.g?` <b style="color:var(--amber)">${x.r.g}골</b>`:''}</span><span class="num" style="color:${x.r.r>=7.5?'var(--amber)':x.r.r<6?'var(--bad)':'var(--text)'}">${x.r.r.toFixed(1)}</span></div>`).join('')}</div>
   <div style="color:var(--muted);margin:10px 0 4px">공격 방향 비중</div><div class="rt"><div><span>왼쪽</span><span class="num">${Math.round((lanes[0]+lanes[1])/lt*100)}%</span></div><div><span>중앙</span><span class="num">${Math.round(lanes[2]/lt*100)}%</span></div><div><span>오른쪽</span><span class="num">${Math.round((lanes[3]+lanes[4])/lt*100)}%</span></div></div>
   ${(()=>{const row=du=>{const air=du.air?' <span style="color:var(--muted);font-size:11px">공중볼</span>':'';const atk=du.s===me;const good=atk?du.w>du.l:du.l>du.w,bad=atk?du.w<du.l:du.l<du.w;return `<div class="chg"><span>${esc(shortName(du.a))} ▶ ${esc(shortName(du.d))}${air}</span><span class="num" style="color:${good?'var(--good)':bad?'var(--bad)':'var(--text)'}">${atk?`${du.w}승 ${du.l}패`:`${du.l}막음 ${du.w}뚫림`}</span></div>`};
     const A=res.duels.filter(d=>d.s===me).slice(0,5),D=res.duels.filter(d=>d.s!==me).slice(0,5);
     return (A.length?`<div style="color:var(--muted);margin:10px 0 4px">우리 공격 1대1 (우리 선수 ▶ 상대 수비)</div>${A.map(row).join('')}`:'')+(D.length?`<div style="color:var(--muted);margin:10px 0 4px">우리 수비 1대1 (상대 공격수 ▶ 우리 수비)</div>${D.map(row).join('')}`:'')})()}
  </span>`;
  $('#mfd').prepend(el);
  {const mt=document.getElementById('match');if(mt)mt.classList.remove('mp-on');const bx=document.getElementById('mpst');if(bx)bx.hidden=true;document.querySelectorAll('#mptab [data-mpst]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.mpst==='feed'));}
  try{const R=buildReport(res,me,fx);S.reports=[R].concat(S.reports||[]).slice(0,5)}catch(e){console.error(e)}
  $('#mct').innerHTML=`<button class="btn ghost" data-act="mreport">경기 리포트</button><button class="btn" data-act="closematch">확인</button>`;
  save();
}

// ---- 빠른 교체 추천 ----
function quickSubs(){const T=M.m.T[M.me],st=M.m.st;const ks=T.k('base');const bench=benchList();const used=new Set(),out=[];
  const subIn=new Set(st.subs[M.me].map(x=>x.inP.id));const cand=ks.filter(q=>(q.slotKey!=='GK'||(st.hurt&&st.hurt[q.p.id]))&&(!subIn.has(q.p.id)||(st.hurt&&st.hurt[q.p.id]))).map(q=>{const p=q.p,sta=Math.max(0,100-(st.fatigue[M.me][p.id]||0)),r=st.pr[p.id]?st.pr[p.id].r:6.5;let need=0,why='';
    if(st.hurt&&st.hurt[p.id]){need=4;why='부상'}else if(sta<60){need=2+(60-sta)/15;why=`체력 ${Math.round(sta)}%`}else if(M.m.min>=65&&sta<70&&r<6.8){need=1.1;why=`체력 ${Math.round(sta)}% · 평점 ${r.toFixed(1)}`}
    else if(st.cards[p.id]&&M.m.min>=55&&['CB','FB','DM'].includes(p.g)){need=1.2;why='경고 1장 · 퇴장 위험'}else if(M.m.min>=60&&r<6.0){need=1;why=`평점 ${r.toFixed(1)}`}
    return {q,need,why,sta}}).filter(x=>x.need>0).sort((a,b)=>b.need-a.need);
  cand.forEach(c=>{if(out.length>=Math.min(3,M.subsLeft))return;const key=c.q.slotKey;let best=null,bv=0,bf=0;
    bench.forEach(b=>{if(used.has(b.id))return;const f=E3.fitOf(b,key);if(f<.85)return;const v=b.ovr*f*(.72+.28*(b.fit??100)/100);if(v>bv){bv=v;best=b;bf=f}});
    if(!best)return;const cur=c.q.p.ovr*(T.fm[c.q.p.id]??1)*(.72+.28*c.sta/100);if(c.need<2&&bv<cur*.97)return;
    used.add(best.id);out.push({out:c.q.p,inP:best,why:c.why,key,f:bf})});
  return out}
// ---- 경기 중 전체 전술 화면 ----
// 퇴장(v87): 퇴장 선수는 화면에서 마지막 자리에 '퇴장' 표시로 남겨 11칸을 유지, 적용할 때 빼고 엔진에는 10명만 전달
function meReds(){return M.m.st.ev.filter(e=>e.t==='red'&&e.s===M.me&&e.pid!=null).map(e=>e.pid).filter(id=>!M.m.T[M.me].xi.some(p=>p.id===id))}
function matchEditOpen(){const T=M.m.T[M.me];const reds=meReds();if(T.xi.length+reds.length<11){toast(`퇴장으로 ${T.xi.length}명 — 대형·성향 빠른 변경을 엽니다`);M.paused=true;clearTimeout(M.timer);mtacSheet();return}
  closeSheet();M.paused=true;clearTimeout(M.timer);
  M.edit={bk:{tac:JSON.parse(JSON.stringify(S.tac)),xi:[...(S.xi||[])],tab:UI.tab,phase:TAC.phase},xi0:T.xi.map(p=>p.id).concat(reds),reds:new Set(reds),out:new Set(M.m.st.subs[M.me].map(x=>x.out.id))};
  S.tac=Object.assign(JSON.parse(JSON.stringify(S.tac)),{form:{...T.form},pos:JSON.parse(JSON.stringify(T.pos||{})),roles:[...(T.roles||[])],duties:[...(T.duties||[])],marks:(T.marks||[]).map(x=>({...x})),preset:T.preset,ti:[...T.ti],fam:T.fam,focus:T.focus??null,ment:T.ment||'균형',slotAs:{...(T.slotAs||{})},pi:JSON.parse(JSON.stringify(T.pi_||{}))});
  S.xi=T.xi.map(p=>p.id).concat(reds);if(reds.length){const pad=a=>{const x=[...(a||[])];while(x.length<11)x.push(x.length?x[x.length-1]:null);return x};S.tac.roles=pad(S.tac.roles);S.tac.duties=pad(S.tac.duties).map(v=>v??1);S.tac.marks=pad(S.tac.marks).map(v=>v||{on:false})}UI.tab='tac';TAC.phase='base';TAC.sel=null;TAC.bsel=null;$('#match').style.display='none';render();scrollTo(0,0)}
function matchEditClose(){const E=M.edit;S.tac=E.bk.tac;S.xi=E.bk.xi;UI.tab=E.bk.tab;TAC.phase=E.bk.phase;M.edit=null;$('#match').style.display='';closeSheet();render()}
function matchEditApply(){const T=M.m.T[M.me],api=M.m.api,E=M.edit,t=S.tac;const nx=[...S.xi];
  if(nx.length!==11||nx.some(id=>id==null)){toast('선발 11명을 채워 주세요');return}
  const RD=E.reds||new Set();if([...RD].some(id=>!nx.includes(id))){toast('퇴장 선수는 경기장에서 뺄 수 없습니다(자리만 바꿀 수 있음)');return}
  const keep=nx.map((id,i)=>RD.has(id)?-1:i).filter(i=>i>=0);
  const inc=nx.filter(id=>!E.xi0.includes(id)),outg=E.xi0.filter(id=>!nx.includes(id));
  if(inc.length>M.subsLeft){toast(`교체 카드가 ${M.subsLeft}장 남았습니다 (${inc.length}명 교체 시도)`);return}
  inc.forEach((id,k)=>{if(api.sub(M.me,outg[k],pl(id))){M.subsLeft--}});
  const byId={};T.xi.forEach(p=>byId[p.id]=p);const ord=keep.map(i=>byId[nx[i]]);if(ord.every(Boolean))T.xi.splice(0,T.xi.length,...ord);
  const sel=a=>RD.size?keep.map(i=>(a||[])[i]):[...(a||[])];
  const pat={form:{...t.form},pos:JSON.parse(JSON.stringify(t.pos||{})),roles:sel(t.roles),duties:sel(t.duties),marks:sel(t.marks).map(x=>({...(x||{on:false})})),ti:[...t.ti],focus:t.focus??null,ment:t.ment,slotAs:{...(t.slotAs||{})},pi_:JSON.parse(JSON.stringify(t.pi||{})),keepXI:true};
  if(t.preset!==T.preset)pat.preset=t.preset;pat.fam=famGet(t.preset,t.form.base);pat.keepFam=1;
  api.setTactic(M.me,pat);if(T.refit)T.refit();
  const evs=M.m.st.ev.filter(e=>e.t==='sub'&&e.m===M.m.min&&e.s===M.me).slice(-inc.length);
  matchEditClose();if(inc.length)evs.forEach(feed);feed({m:M.m.min,t:'sys',txt:`전술 변경 · ${E3.shapeOf(T)} ${t.preset}${inc.length?` · 교체 ${inc.length}명`:''}`});const el=$('#msl');if(el)el.textContent=M.subsLeft;toast('전술을 적용했습니다');resume()}
{const _rd=render;render=function(){if(typeof M!=='undefined'&&M&&M.edit){const st=M.m.st;$('#app').innerHTML=`<header class="top"><div class="in" style="gap:8px"><div style="flex:1;min-width:0"><h1 style="font-size:17px">경기 중 전술</h1><div class="sub">${M.m.min}' · ${st.sc[0]}:${st.sc[1]} · 교체 ${M.subsLeft}장 · 벤치에서 끌어 넣으면 교체</div></div><button class="btn sm ghost" data-medit="cancel">취소</button><button class="btn sm" data-medit="apply">적용</button></div></header><main class="wrap" style="padding-bottom:40px" id="meMain">${meTabs()}${M.edit.view==='opp'?oppView():tacView()}</main>`;return}_rd()}}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!M)return;const d=b.dataset;
  if(d.medit==='open'){matchEditOpen();return}if(d.medit==='apply'){matchEditApply();return}if(d.medit==='cancel'){matchEditClose();resume();return}
  if(d.qsub){const [o,i]=d.qsub.split(':').map(Number);M.inSubs=true;doSub(o,i);return}
  if(d.qsuball){const qs=quickSubs();M.inSubs=true;qs.forEach(x=>{if(M.subsLeft>0){const ok=M.m.api.sub(M.me,x.out.id,x.inP);if(ok){M.subsLeft--;feed(M.m.st.ev[M.m.st.ev.length-1])}}});const el=$('#msl');if(el)el.textContent=M.subsLeft;toast(`${qs.length}명 교체`);if(M.subsLeft>0)subsSheet();else{M.inSubs=false;resume()}return}});
// 경기 중 전체 전술 화면: 체력은 '현재 경기 체력'(경기 전 체력 − 경기 중 소모)으로 표시
{const _pl=pl;pl=function(id){const p=_pl(id);if(M&&M.edit&&M.m){const f=M.m.st.fatigue[M.me][id];if(f!=null)p.fit=Math.max(0,Math.round(Math.min(p.fit??100,100-f)));if(M.edit.reds&&M.edit.reds.has(id)){p.name=p.name+'·퇴장';p.fit=0;p.redOff=1}}return p}}

// ---- 경기 중 전술: 우리 전술 ↔ 상대 포메이션(좌우 슬라이드) ----
function meTabs(){const v=M.edit.view||'us';return `<div class="metab"><button data-mev="us" aria-pressed="${v==='us'}">우리 전술</button><button data-mev="opp" aria-pressed="${v==='opp'}">상대 포메이션</button></div><div class="note" style="text-align:center;margin:-2px 0 8px">좌우로 밀어서 전환</div>`}
function oppView(){const o=1-M.me,T=M.m.T[o],st=M.m.st,ph=M.edit.oppPh||'base';const club=o===0?M.fx.h:M.fx.a;
  const ks=T.k(ph);const nameF=E3.shapeOf?E3.shapeOf(T,ph):T.form[ph];const rt=st.pr;
  const dots=ks.map(q=>{const p=q.p;const sta=Math.max(0,Math.round(100-(st.fatigue[o][p.id]||0)));const r=rt[p.id]?rt[p.id].r:null;const left=100-q.x,top=100-q.y;
    return `<div class="od" style="left:${left}%;top:${top}%"><span class="dot num">${p.ovr}</span><span class="lb">${esc(shortName(p.name))}</span><span class="sl">${q.slotKey} · ${sta}%${r!=null?` · ${r.toFixed(1)}`:''}</span></div>`}).join('');
  const star=T.xi.slice().sort((a,b)=>((rt[b.id]||{}).r||0)-((rt[a.id]||{}).r||0)).slice(0,3);
  return `<div class="card pad"><div style="display:flex;align-items:center;gap:8px">${crest(club)}<div><b>${esc(CLUBS[club].name)}</b><div class="note">${esc(T.preset)} · 기본 ${esc(T.form.base)} · 공격 ${esc(T.form.atk||T.form.base)} · 수비 ${esc(T.form.def||T.form.base)}${T.ment&&T.ment!=='균형'?` · ${esc(T.ment)}`:''}</div></div></div>
   <div style="display:flex;gap:6px;margin:10px 0 8px">${[['base','기본'],['atk','공격 시'],['def','수비 시']].map(([k,l])=>`<button class="chip" data-oph="${k}" aria-pressed="${ph===k}">${l}</button>`).join('')}<span class="note" style="margin-left:auto;align-self:center">실제 배치 ${esc(nameF)}</span></div>
   <div class="opitch"><div class="half"></div>${dots}</div>
   <div class="note" style="margin-top:6px">위쪽이 상대 골문(우리가 공격하는 방향) · 숫자=능력치 · 자리 · 체력% · 경기 평점</div></div>
   <div class="card pad" style="margin-top:10px"><b>상대 오늘 활약</b>${star.map(p=>{const q=rt[p.id]||{};return `<div class="li" style="padding:6px 0"><span class="nm"><b>${esc(p.name)}</b><span>${q.g?q.g+'골 ':''}${q.a?q.a+'도움 ':''}슈팅 ${q.sh||0} · 드리블 ${q.dw||0}/${q.da||0} · 패스 ${q.pc||0}/${q.pa||0}</span></span><span class="num" style="font-weight:700">${q.r!=null?q.r.toFixed(1):'–'}</span></div>`}).join('')}
   <div class="note" style="margin-top:6px">상대 슈팅 ${st.sh[o]} · xG ${st.xg[o].toFixed(2)} · 점유 ${Math.round(st.pos[o]/Math.max(1,st.pos[0]+st.pos[1])*100)}%</div></div>`}
document.addEventListener('click',e=>{const b=e.target.closest('[data-mev],[data-oph]');if(!b||!M||!M.edit)return;if(b.dataset.mev)M.edit.view=b.dataset.mev;if(b.dataset.oph)M.edit.oppPh=b.dataset.oph;render();scrollTo(0,0)});
{let sx=null,sy=null;document.addEventListener('touchstart',e=>{if(!M||!M.edit)return;const t=e.touches[0];sx=t.clientX;sy=t.clientY},{passive:true});
 document.addEventListener('touchend',e=>{if(!M||!M.edit||sx==null)return;const t=e.changedTouches[0];const dx=t.clientX-sx,dy=t.clientY-sy;sx=null;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5&&!e.target.closest('.pitch,.slot,.bench,.opitch .od,[draggable],.chips,input,select')&&!(()=>{for(let el=e.target;el&&el!==document.body;el=el.parentElement){if(el.scrollWidth>el.clientWidth+4){const ox=getComputedStyle(el).overflowX;if(ox==='auto'||ox==='scroll')return true}}return false})()){M.edit.view=dx<0?'opp':'us';render();scrollTo(0,0)}},{passive:true})}

/* ---- 경기 중 실시간 선수 기록(중계 아래, 우리/상대 탭) ---- */
function mpst(){const box=document.getElementById('mpst');if(!box||!M||!M.m)return;const v=UI.mpst??'0';const mt=document.getElementById('match');if(mt)mt.classList.toggle('mp-on',v!=='feed');if(v==='feed'){box.hidden=true;return}box.hidden=false;
  const side=v==='0'?M.me:1-M.me,st=M.m.st,T=M.m.T[side];const outs=(st.subs[side]||[]).map(x=>x.out).filter(Boolean);const inIds=new Set((st.subs[side]||[]).map(x=>x.inP&&x.inP.id));
  const seen=new Set(),L=T.xi.concat(outs).filter(p=>p&&!seen.has(p.id)&&seen.add(p.id));const outIds=new Set(outs.map(p=>p.id));
  const fr=(a,b)=>b?`${a}/${b}`:'–';const goals={},asts={};st.ev.forEach(e=>{if(e.t==='goal'&&e.s===side){if(e.pid)goals[e.pid]=(goals[e.pid]||0)+1}});
  const rows=L.map(p=>{const q=st.pr[p.id]||{};const fat=st.fatigue[side][p.id]||0,sta=Math.max(0,Math.round(100-fat));const out=outIds.has(p.id);const card=st.cards[p.id];
    const col=out?'var(--faint)':sta>=65?'var(--good)':sta>=45?'var(--ok)':'var(--bad)';
    return `<tr style="${out?'opacity:.5':''}"><td class="n">${esc(shortName(p.name))}${(()=>{try{const t=M.m.T[side];const ks=slotKeysLR(t);const i=t.xi.findIndex(x=>x&&x.id===p.id);const k=i>=0&&ks&&ks[i]?ks[i]:p.g;return ` <span class="note" style="font-size:10px">${esc(String(k||p.g))}</span>`}catch(e){return ''}})()}${inIds.has(p.id)?' <span class="note">↑교체</span>':''}${out?' <span class="note">↓아웃</span>':''}${card?` <i class="yc" style="display:inline-block;width:7px;height:10px;background:${card>=2?'var(--bad)':'#F0B429'};border-radius:1px;vertical-align:-1px"></i>`:''}</td>
      <td>${q.r!=null?q.r.toFixed(1):'–'}</td><td>${q.g?`<b style="color:var(--amber)">${q.g}</b>`:'<span class="note">0</span>'}</td><td>${q.a?`<b style="color:var(--amber)">${q.a}</b>`:'<span class="note">0</span>'}</td>
      <td>${p.g==='GK'?`<b>${q.sv||0}</b>`:'<span class="note">–</span>'}</td><td>${fr(q.so||0,q.sh||0)}</td><td>${(q.xg||0).toFixed(2)}</td><td>${fr(q.pc||0,q.pa||0)}</td><td>${q.kp||0}</td><td>${q.bc||0}</td><td>${fr(q.dw||0,q.da||0)}</td><td>${fr(q.tkw||0,q.ta||0)}</td><td>${fr(q.aw||0,q.at||0)}</td><td>${q.it||0}</td><td>${q.fc||0}</td><td style="color:${col}">${out?'–':sta+'%'}</td></tr>`}).join('');
  /* v194 갱신 때마다 표가 맨 위·맨 왼쪽으로 돌아가던 문제: 스크롤 위치 저장·복원, 내용이 같으면 다시 그리지 않음 */const _st=box.scrollTop,_pw=box.querySelector('.pstw'),_sl=_pw?_pw.scrollLeft:0,_pt=_pw?_pw.scrollTop:0,_sy=window.scrollY;
  const _html=`<div class="pstw"><table class="pst"><thead><tr><th class="n">${esc(CLUBS[side===0?M.fx.h:M.fx.a].short)}</th><th>평점</th><th>골</th><th>도움</th><th>선방</th><th>슈팅<small>유효/전체</small></th><th>xG</th><th>패스</th><th>키패스</th><th>빅찬스<small>만듦</small></th><th>드리블</th><th>태클</th><th>공중볼</th><th>차단</th><th>파울</th><th>체력</th></tr></thead><tbody>${rows}</tbody></table></div>`;if(box._h===_html)return;box._h=_html;box.innerHTML=_html;box.scrollTop=_st;const _pw2=box.querySelector('.pstw');if(_pw2){_pw2.scrollLeft=_sl;_pw2.scrollTop=_pt};if(Math.abs(window.scrollY-_sy)>2)window.scrollTo(0,_sy)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-mpst]');if(!b)return;UI.mpst=b.dataset.mpst;document.querySelectorAll('#mptab [data-mpst]').forEach(x=>x.setAttribute('aria-pressed',x===b));mpst()});
{const cs=document.createElement('style');cs.textContent=`.mptab{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:6px 0 4px;border-top:1px solid var(--line)}
.mptab button{font:inherit;font-size:12px;padding:6px 0;border-radius:8px;border:1px solid var(--line);background:transparent;color:var(--muted)}
.mptab button[aria-pressed="true"]{background:var(--amber);color:#111;border-color:var(--amber);font-weight:700}
.mpst{flex:1.25;min-height:0;overflow:auto;font-size:12px}.mpst .pst td,.mpst .pst th{padding:4px 5px;white-space:nowrap}.mpst .pst td.n{text-align:left;position:sticky;left:0;background:var(--bg)}
.mpst .pst th.n{position:sticky;left:0;background:var(--bg);text-align:left}/*v232: 맨 윗줄(평점·골·도움…) 고정 — 표 상자가 가로·세로 스크롤을 함께 맡아 머리행이 위에 붙음*/.mpst{overflow:hidden;display:flex;flex-direction:column}.mpst .pstw{flex:1;min-height:0;overflow:auto;margin:0}.mpst .pst thead th{position:sticky;top:0;background:var(--bg);z-index:2;box-shadow:0 1px 0 var(--line)}.mpst .pst thead th.n{left:0;z-index:3}.mpst[hidden]{display:none}.match .feed{min-height:64px}.match.mp-on .feed{display:none}.mpst{flex:1}`;document.head.appendChild(cs)}

