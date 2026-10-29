// ================= 다른 리그 구단 시작 · 해외 감독 커리어(v72) =================
//  · 시작 화면에서 모든 운영 리그 구단(1·2부) 선택 가능 → 그 나라 리그가 '우리 리그'(2D 엔진), 스페인 포함 나머지는 빠른 계산
//  · 해외 제안: 시즌이 끝난 6월(성적·평판 따라) 또는 무소속일 때 3주마다, 평판에 맞는 다른 나라 1부 구단이 제안 → 수락하면 7월 1일 새 시즌부터 부임
//  · 국내(같은 나라) 감독 시장·공석·경질은 기존 방식 그대로(우리 리그 구단 대상)
{const _sg=startGame;startGame=function(club){const lg=baseLg(CLUBS[club].lg);PEND_HL=lg;setHomeLeague(lg);try{_sg(club)}finally{PEND_HL=null}
  S.hlg=lg;S.fxHL=lg;S.fxHL2=HL2[lg]||null;save();render()}}
/* 우리 리그 구단 중 감독이 없는 곳(스페인 외 리그는 실제 감독 데이터가 없음) → 생성 감독 배정 */
function hlCoaches(){if(!S.mg||hl()==='ES')return;LIGA.forEach(c=>{if(c===S.club||mgrOf(c))return;const m=newCoach(reqRep(c));m.rep=Math.max(m.rep,Math.min(90,reqRep(c)+Math.round(rnd()*8)));m.c=c;m.out=false;m.since=S.date;m.free=null})}
{const _ci=careerInit;careerInit=function(mode,name,club){_ci(mode,name,club);try{hlCoaches()}catch(e){console.error(e)}}}
/* 스페인 외 리그의 기대 승점: 그 리그 실제 수준에 맞춘 빠른 결과 모형(득점·전력 차 민감도·홈 이점)으로 전력표에서 계산(라리가 엔진 기준표 EPPG는 우승팀 2.4점이라 다른 리그엔 과함) */
function xpTable(ids,lg){const P=LGP[lg]||LGP.EN,h=(typeof lgHome==='function'?lgHome(lg):.1),st={};ids.forEach(c=>st[c]=euStr(c));const pm=l=>{const o=[];let p=Math.exp(-l);for(let k=0;k<9;k++){o.push(p);p*=l/(k+1)}return o};
  const pts=(d,hh)=>{const A=pm(Math.exp(P[0]+P[1]*d+hh)),B=pm(Math.exp(P[0]-P[1]*d-hh));let w=0,dr=0;for(let i=0;i<9;i++)for(let j=0;j<9;j++){const q=A[i]*B[j];if(i>j)w+=q;else if(i===j)dr+=q}return 3*w+dr};
  const o={};ids.forEach(c=>{let t=0,n=0;ids.forEach(x=>{if(x===c)return;const d=st[c]-st[x];t+=pts(d,h)+pts(d,-h);n+=2});o[c]=n?t/n:1.35});return o}
{const _cs=careerSeasonStart;careerSeasonStart=function(){try{hlCoaches()}catch(e){console.error(e)}const r=_cs();try{if(hl()!=='ES'&&S.exp){const x1=xpTable(LIGA,hl());LIGA.forEach(c=>{if(S.exp[c])S.exp[c].xp=+x1[c].toFixed(2)});if(LIGA2.length&&hl2()){const x2=xpTable(LIGA2,hl2());LIGA2.forEach(c=>{if(S.exp[c])S.exp[c].xp=+x2[c].toFixed(2)})}}}catch(e){console.error(e)}return r}}
/* 이사회 목표: 리그 팀 수·유럽 출전권(나라별)에 맞춤 */
{const _t=tgtOf;tgtOf=function(ep,c){const H=hl();if(H==='ES')return _t(ep,c);const n=LIGA.length||20,sc=n/20,ucl=(typeof EU_UCL!=='undefined'&&EU_UCL[H])||0,eu=ucl?ucl+((typeof EU_UEL!=='undefined'&&EU_UEL[H])||0)+1:0;
  if(ep===1)return [1,'리그 우승'];if(ep===2&&CLUBS[c].rep>=85)return [2,'우승 경쟁(2위 이내)'];if(ucl&&ep<=ucl)return [ucl,`챔피언스리그 진출(${ucl}위 이내)`];if(eu&&ep<=eu)return [eu,`유럽대항전 진출(${eu}위 이내)`];
  const top=Math.max(2,Math.round(4*sc));if(!ucl&&ep<=top)return [top,`상위권(${top}위 이내)`];const mid=Math.round(12*sc);if(ep<=mid)return [mid,`중위권(${mid}위 이내)`];const sv=n-(HL2[H]?(PRO[H]?PRO[H].down:3):1);return [sv,`잔류(${sv}위 이내)`]}}
function expFor(c){const lg=CLUBS[c].lg,ids=lgClubs(lg).map(i=>[i,euStr(i)]).sort((a,b)=>b[1]-a[1]);const ep=ids.findIndex(x=>x[0]===c)+1,n=ids.length;
  const lb=ep===1?'리그 우승':ep<=Math.max(2,Math.round(n*.2))?`상위권(${Math.max(2,Math.round(n*.2))}위 이내)`:ep<=Math.round(n*.6)?`중위권(${Math.round(n*.6)}위 이내)`:`잔류`;return {ep,tp:ep===1?1:ep<=Math.round(n*.2)?Math.round(n*.2):ep<=Math.round(n*.6)?Math.round(n*.6):n-2,lb}}
// ---- 해외 제안 ----
const ABROAD_LG=['ES','EN','IT','DE','FR','PT','NL','BE','TR','SC','CH','AT','DK','KR','JP','CN','SA','US','MX','AR','BR'];
function abroadOffer(tag,maxN){if(!S.me||!S.mg)return 0;const rep=S.me.rep,cur=hl();
  const pool=CLUBS.filter(c=>c&&c.i>=0&&ABROAD_LG.includes(c.lg)&&c.lg!==cur&&c.i!==S.club).filter(c=>{const q=reqRep(c.i);return q<=rep+2&&q>=rep-22});if(!pool.length)return 0;
  const pick=pool.map(c=>[hsh(tag+c.i)*(.6+c.rep/150),c]).sort((a,b)=>b[0]-a[0]).slice(0,maxN);
  pick.forEach(([_,c])=>{const ex=expFor(c.i);S.exp=S.exp||{};S.exp[c.i]=ex;
    inbox('job','',`[해외] ${c.name} 감독직 제안 (${LGN[c.lg]||c.lg})`,`${c.name}이(가) ${S.me.name} 감독을 원합니다. 목표: ${ex.lb}(리그 전력 ${ex.ep}위). 수락하면 7월 1일 새 시즌부터 부임합니다${unemp()?'':' — 지금 구단과는 시즌이 끝나면 결별'}.`,{club:c.i,abroad:1})});return pick.length}
{const _dy=daily;daily=function(){_dy();try{if(!S.me||!S.mg)return;
  if(S.seasonDone&&S.abroadY!==S.season&&S.date.slice(5,7)==='06'&&S.date.slice(8)>='03'){S.abroadY=S.season;const t=S.me.trust||50;const p=Math.min(.95,(unemp()?.9:Math.min(.85,.25+(S.me.rep||30)/150+(t>=70?.15:0)))+(S.abPref?.15:0));if(hsh('ab'+S.season+S.date)<p)abroadOffer('ab'+S.season,1+(hsh('abn'+S.season)<.4?1:0))}
  if(unemp()&&!S.pendJob){const last=S.abroadD||S.me.free||S.date;if(daysBetween(last,S.date)>=21){S.abroadD=S.date;if(hsh('abu'+S.date)<.55)abroadOffer('abu'+S.date,1)}}}catch(e){console.error(e)}}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-job]');if(!b||!S)return;const m=S.inbox.find(x=>x.id===+b.dataset.msg);if(!m||!m.abroad)return;e.stopPropagation();e.preventDefault();if(m.done)return;m.done=true;m.read=true;
  if(b.dataset.job==='accept'){m.result='수락';S.inbox.forEach(x=>{if(x.abroad&&x!==m&&!x.done){x.done=true;x.result='다른 제안 수락'}});
    if(abNow()){abMoveNow(m.club);UI.tab='home';toast(`${CLUBS[m.club].name} 감독 부임!`)}
    else{S.pendJob={c:m.club};inbox('board','',`${CLUBS[m.club].name} 부임 확정`,`${abNextJul()} 새 시즌부터 ${LGN[CLUBS[m.club].lg]||''} ${CLUBS[m.club].name}을(를) 지휘합니다. 이번 시즌 남은 일정은 지금 구단에서 마칩니다.`);toast(`${CLUBS[m.club].name} 부임 확정(${abNextJul()})`)}}
  else m.result='거절';save();render()},true);
/* 7월 1일 시즌 전환: 해외 부임 처리 → 우리 리그 교체 */
{const _ns=newSeason;newSeason=function(y,first){if(!first&&S.pendJob){const c=S.pendJob.c;S.pendJob=null;try{S.exp=S.exp||{};S.exp[c]=S.exp[c]||expFor(c);moveTo(c);S.hlg=baseLg(CLUBS[c].lg);S.news.unshift({d:S.date,t:`${S.me.name} 감독, ${CLUBS[c].name} 부임`,b:`${LGN[CLUBS[c].lg]||''} 새 도전`,v:0,big:true})}catch(e){console.error(e)}}
  _ns(y,first);try{hlCoaches()}catch(e){}}}
// ---- 시작 화면: 다른 리그 구단 ----
const START_LG=['EN','IT','DE','FR','PT','NL','BE','TR','SC','CH','AT','DK','KR','JP','CN','SA','US','MX','AR','BR'];UI.slg=UI.slg||'EN';
{const _sv=startView;startView=function(){let h=_sv();if((UI.mode||'club')!=='club')return h;const lg=START_LG.includes(UI.slg)?UI.slg:'EN';
  const row=c=>{const sq=squadOfBase(c).sort((a,b)=>b.ovr-a.ovr).slice(0,16);const avg=sq.length?Math.round(sq.reduce((a,p)=>a+p.ovr,0)/sq.length):60;return {i:c,avg,star:sq[0]}};
  const list=ids=>ids.map(row).sort((a,b)=>b.avg-a.avg).map(t=>`<button data-new="${t.i}">${crest(t.i)}<span><b>${esc(CLUBS[t.i].name)}</b><small>${t.star?'에이스 '+esc(t.star.name)+' · ':''}이적 예산 ${mM(CLUBS[t.i].budget)}</small></span><span class="ovr num ${ovrCls(t.avg)}">${t.avg}</span></button>`).join('');
  const l2=HL2[lg];const c1=CLUBS.filter(c=>c&&c.lg===lg).map(c=>c.i),c2=l2?CLUBS.filter(c=>c&&c.lg===l2).map(c=>c.i):[];
  const sec=`<h2>다른 리그에서 시작</h2><p class="note" style="margin:-4px 0 6px">고른 나라 리그가 2D 엔진으로 진행되고, 라리가를 포함한 나머지 리그는 빠른 계산으로 돌아갑니다. 스페인 외 리그 감독은 게임이 만든 감독입니다.</p>
   <div class="tabs" style="margin-bottom:8px;overflow-x:auto;white-space:nowrap">${START_LG.map(x=>`<button data-slg="${x}" aria-selected="${x===lg}">${esc(LGN[x]||x)}</button>`).join('')}</div>
   <div class="pick">${list(c1)}</div>${c2.length?`<h2>${esc(LGN[l2]||l2)}</h2><div class="pick">${list(c2)}</div>`:''}`;
  const k=h.lastIndexOf('<p class="note" style="margin-top:18px');return k>0?h.slice(0,k)+sec+h.slice(k):h+sec}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-slg]');if(!b)return;UI.slg=b.dataset.slg;render()},true);

