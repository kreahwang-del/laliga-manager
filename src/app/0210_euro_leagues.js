// ================= 유럽 리그 확장(v66): 12개 리그 1부 정식 운영(빠른 결과 계산) =================
//  우리 리그는 엔진, 다른 리그는 빠른 결과. 리그별 득점 수준 = Transfermarkt 2023~25 시즌 실제 경기당 골
/* v67: 비유럽(한국·일본·중국·사우디·미국·멕시코·아르헨티나·브라질)과 4대 리그 2부(챔피언십·2.분데스·세리에B·리그2) 추가. 시즌은 게임 편의상 모두 8월~5월 */
const EUL=['EN','IT','DE','FR','PT','NL','BE','TR','SC','CH','AT','DK','EN2','DE2','IT2','FR2','KR','JP','CN','SA','US','MX','AR','BR'];const OTL=EUL;
/* 빠른 결과 리그별 [a,b]: 게임 안 선발 평균 능력 분포로 '실제 리그 경기당 골(Transfermarkt 2023~25)'과 '시즌 승점 편차(경기당 승점 표준편차)'를 함께 맞춘 값
   (2부·중국은 실측 없음 → 경기당 골 2.2~3.0·편차 0.40~0.45 추정). 이전(v66)은 라리가 엔진 회귀 b .044를 모든 리그에 써서 우승 승점이 실제보다 낮았음 */
const LGP={ES:[0.167,0.08],EN:[0.298,0.13],IT:[0.124,0.085],DE:[0.384,0.08],FR:[0.275,0.08],PT:[0.168,0.08],NL:[0.346,0.065],BE:[0.219,0.08],TR:[0.238,0.07],SC:[0.25,0.07],CH:[0.393,0.06],AT:[0.224,0.105],DK:[0.322,0.085],KR:[0.204,0.165],JP:[0.065,0.195],US:[0.346,0.12],AR:[-0.119,0.115],BR:[0.171,0.08],SA:[0.28,0.055],MX:[0.295,0.085],CN:[0.354,0.123],EN2:[0.239,0.059],DE2:[0.342,0.055],IT2:[0.184,0.05],FR2:[0.188,0.055],ES2:[0.235,0.03]}; /* v68: b를 파이썬 보정값(독립 포아송)으로 복원 — v67에서 낮춘 건 난수 상관 버그 탓. v69: 2부 4개·라리가2·중국은 실제 최근 2시즌 순위표(영어 위키백과)의 경기당 골·승점 편차에 맞춤 */
const LG_GOAL={};
function lgClubs(lg){return CLUBS.filter(c=>c&&c.lg===lg).map(c=>c.i)}
function euroFixtures(lg,y){const cl=lgClubs(lg).sort(()=>0).sort((a,b)=>hsh(y+lg+a)-hsh(y+lg+b));if(cl.length<4)return [];const T=cl.length%2?[...cl,null]:cl;
  let r=roundRobin(T);if(cl.length<=12)r=r.concat(r.slice(0,T.length-1)); /* 12팀 이하 리그(스코틀랜드·스위스·오스트리아·덴마크·한국): 실제처럼 33라운드 안팎이 되게 3회전 */
  if(cl.length>=26)r=r.slice(0,34); /* 30팀 리그(MLS·아르헨티나): 실제 경기 수(34)에 맞춰 1회전 + 일부 */
  const ds=datesN(y,r.length),R=r.length,out=[];r.forEach((ms,i)=>{const d=ds[i];ms.forEach(([h,a])=>{if(h!=null&&a!=null)out.push({d,r:i+1,h,a,res:null,lg})})});return out}
function fastLgs(){return ['ES','ES2',...EUL].filter(lg=>lg!==hl()&&lg!==hl2())}
function euroBuild(y){S.fxE={};fastLgs().forEach(lg=>{const f=euroFixtures(lg,y);if(f.length)S.fxE[lg]=f});lgClubsAll().forEach(c=>{try{squadFill(c,y)}catch(e){}});fastLgs().forEach(lg=>lgClubs(lg).forEach(c=>{if(S.aiBudget&&S.aiBudget[c]==null)S.aiBudget[c]=CLUBS[c].budget*1e6}))}
function lgClubsAll(){return fastLgs().flatMap(lgClubs)}
/* R라운드 날짜: 38 이하면 주말 38일에 고르게, 넘으면(챔피언십 46) 주중 경기 추가 */
function datesN(y,R){const w=leagueDates(y);if(R<=38)return Array.from({length:R},(_,i)=>w[Math.round(i*(w.length-1)/Math.max(1,R-1))]);const x=R-38,ex=[];for(let k=0;k<x;k++)ex.push(addD(w[Math.min(37,Math.round((k+.5)*37/x))],3));return [...w,...ex].sort()}
function fxLg(lg){if(S.fxE&&S.fxE[lg])return S.fxE[lg];if(lg===(S.fxHL||'ES'))return fxOf(1);if(lg===(S.fxHL2||'ES2'))return fxOf(2);return []}
function tableLg(lg){const t={};lgClubs(lg).forEach(id=>t[id]={id,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});fxLg(lg).forEach(f=>{if(!f.res)return;const [a,b]=f.res.sc,H=t[f.h],Aw=t[f.a];if(!H||!Aw)return;H.p++;Aw.p++;H.gf+=a;H.ga+=b;Aw.gf+=b;Aw.ga+=a;
  if(a>b){H.w++;Aw.l++;H.pts+=3}else if(a<b){Aw.w++;H.l++;Aw.pts+=3}else{H.d++;Aw.d++;H.pts++;Aw.pts++}});return Object.values(t).sort((x,y)=>y.pts-x.pts||(y.gf-y.ga)-(x.gf-x.ga)||y.gf-x.gf)}
/* 리그별 홈 이점(Transfermarkt 2023~ 리그 경기: ½·log(홈 평균골/원정 평균골)). 이전엔 모든 리그 .2(라리가 엔진 값)로 실제(.02~.2)보다 컸음. 2부 등 실측 없는 리그 .1. 총 득점은 유지되게 a 보정 */
const LGH={ES:.134,EN:.08,IT:.066,DE:.088,FR:.092,PT:.105,NL:.12,BE:.131,TR:.12,SC:.14,CH:.104,AT:.096,DK:.07,KR:.016,JP:.083,US:.118,AR:.158,BR:.198,SA:.057,MX:.135};
function lgHome(lg){return LGH[lg]??.1}
{const _fm=fastMatch;fastMatch=function(f){const lg=f.lg||(CLUBS[f.h]&&CLUBS[f.h].lg);const P=LGP[lg];if(P){const a0=FASTM.a,a2=FASTM.a2,b0=FASTM.b,h0=FASTM.h;const h=lgHome(lg),aa=P[0]+Math.log(Math.cosh(.2)/Math.cosh(h));FASTM.a=aa;FASTM.a2=aa;FASTM.b=P[1];FASTM.h=h;try{return _fm(f)}finally{FASTM.a=a0;FASTM.a2=a2;FASTM.b=b0;FASTM.h=h0}}return _fm(f)}}
{const _ft=divFastToday;divFastToday=function(){_ft();if(!S.fxE)return;for(const lg in S.fxE)for(const f of S.fxE[lg])if(f.d===S.date&&!f.res)fastMatch(f)}}
{const _od=divOtherDone;divOtherDone=function(){if(!_od())return false;if(!S.fxE)return true;for(const lg in S.fxE)if(S.fxE[lg].some(f=>!f.res))return false;return true}}
{const _ps2=playShare;playShare=function(p){const c=clubOf(p.id);if(c>=0&&CLUBS[c]&&S.fxE&&S.fxE[CLUBS[c].lg]){const fx=S.fxE[CLUBS[c].lg],q=S.ps[p.id]||{};const played=fx.filter(f=>f.res&&(f.h===c||f.a===c)).length;return played<3?rankShare(p):Math.min(1,(q.mins||0)/(played*90))}return _ps2(p)}}
// ---- 4대 리그 승강(v67): 1부 하위 ↔ 2부 상위. 규정 단순화: 잉글랜드·이탈리아 3강등/2자동+3~6위 PO, 독일·프랑스 2강등/2자동 + 1부 16위 vs 2부 3위 승강 PO(홈앤어웨이) ----
const PRO={ES:{d2:'ES2',down:3,auto:2,po:'4'},EN:{d2:'EN2',down:3,auto:2,po:'4'},IT:{d2:'IT2',down:3,auto:2,po:'4'},DE:{d2:'DE2',down:2,auto:2,po:'rel'},FR:{d2:'FR2',down:2,auto:2,po:'rel'}};
function proRel(){const msgs=[];S.clubB=S.clubB||{};
  for(const lg in PRO){if(lg==='ES'&&(S.fxHL||'ES')==='ES')continue;const R=PRO[lg],t1=tableLg(lg),t2=tableLg(R.d2).filter(t=>!isB(t.id));if(t1.length<10||t2.length<6||!t2.some(t=>t.p>0))continue;
    let down=t1.slice(-R.down).map(t=>t.id),up=t2.slice(0,R.auto).map(t=>t.id);let po='';
    if(R.po==='4'){const s1=legs2(t2[5].id,t2[2].id),s2=legs2(t2[4].id,t2[3].id),fin=legs2(s2.w,s1.w);up.push(fin.w);po=`PO 결승 ${CLUBS[fin.w].short} 승격`}
    else{const z=t1[t1.length-R.down-1].id,c3=t2[R.auto].id,m=legs2(c3,z);if(m.w===c3){up.push(c3);down.push(z)}po=`승강 PO ${CLUBS[z].short}–${CLUBS[c3].short} ${m.sc} → ${CLUBS[m.w].short}`}
    const top=lgClubs(lg).flatMap(c=>squadOf(c).map(p=>p.ovr)).sort((a,b)=>b-a);const thr=top[Math.floor(top.length*.2)]||80;
    down.forEach(c=>{const C=CLUBS[c];C.b1=C.b1??C.budget;C.budget=Math.round(C.b1*.5*10)/10;C.rep=Math.max(10,C.rep-5);C.lg=R.d2;S.clubB[c]={b1:C.b1,budget:C.budget,rep:C.rep,lg:C.lg};
      if(c!==S.club)squadOf(c).filter(p=>p.ovr>=thr).forEach(p=>{if(hsh(p.id+'rel'+S.season)<.5){const buyers=lgClubs(lg).filter(b=>!down.includes(b)&&b!==S.club);if(buyers.length){const b=buyers[Math.floor(hsh(p.id+'rb'+S.season)*buyers.length)];completeTransfer(p.id,b,Math.round(p.val*.8),{cEnd:`${S.season+4}-06-30`})}}})});
    const minB=Math.min(...lgClubs(lg).filter(c=>!down.includes(c)).map(c=>CLUBS[c].budget));
    up.forEach(c=>{const C=CLUBS[c];if(C.b1==null)C.b1=Math.max(minB,Math.round(C.budget*2.5*10)/10);C.budget=C.b1;C.rep=Math.min(95,C.rep+5);C.lg=lg;S.clubB[c]={b1:C.b1,budget:C.budget,rep:C.rep,lg:C.lg}});
    msgs.push(`${LGN[lg]} 승격 ${up.map(c=>CLUBS[c].short).join('·')} · 강등 ${down.map(c=>CLUBS[c].short).join('·')} (${po})`)}
  if(msgs.length){S.news.unshift({d:S.date,t:'유럽 4대 리그 승강',b:msgs.join(' / '),v:0,big:true});SQC=null}}
// 시즌 말: 리그별 우승 뉴스 → 새 일정
{const _ns2=newSeason;newSeason=function(y,first){if(!first&&S.fxE){const ch=[];for(const lg in S.fxE){const t=tableLg(lg);if(t.length&&t[0].p>0)ch.push(`${LGN[lg]||lg} ${CLUBS[t[0].id].short}`)}if(ch.length){S.news.unshift({d:S.date,t:`유럽 리그 우승: ${ch.join(' · ')}`,v:0,big:true});S.euroCh=(S.euroCh||[]).concat([{y:S.season,ch:Object.keys(S.fxE).map(lg=>[lg,(tableLg(lg)[0]||{}).id])}]).slice(-30)}}
  if(!first&&S.fxE){try{proRel()}catch(e){console.error(e)}}_ns2(y,first);if(S.d2||!first)euroBuild(y)}}
{const _sg2=startGame;startGame=function(club){_sg2(club);euroBuild(S.season);save();render()}}
// 화면: 리그 탭에 다른 유럽 리그 보기
UI.elg=UI.elg||'';
function euroView(lg){const t=tableLg(lg);const ids=new Set(lgClubs(lg));const sc=Object.keys(S.ps).filter(id=>(S.ps[id].gl||0)>0&&ids.has(clubOf(+id))).map(id=>pl(+id)).sort((a,b)=>(b.gl-a.gl)||((b.as||0)-(a.as||0))).slice(0,10);
  return `<div class="card" style="margin-top:12px"><div class="tbl-wrap"><table><thead><tr><th>#</th><th style="text-align:left">구단</th><th>경기</th><th>승</th><th>무</th><th>패</th><th>득실</th><th>승점</th></tr></thead><tbody>${t.map((r,i)=>`<tr><td>${i+1}</td><td class="t">${esc(CLUBS[r.id].name)}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf-r.ga>0?'+':''}${r.gf-r.ga}</td><td class="pts">${r.pts}</td></tr>`).join('')}</tbody></table></div></div>
  <h2>득점 순위</h2><div class="card list">${sc.map((p,i)=>`<button class="li" data-player="${p.id}"><span class="num" style="width:18px;color:var(--muted)">${i+1}</span>${crest(clubOf(p.id))}<span class="nm"><b>${esc(p.name)}</b><span>${p.apps||0}경기 ${p.as||0}도움</span></span><span class="num" style="font-size:22px;font-weight:700">${p.gl}</span></button>`).join('')||'<div class="li note">아직 기록이 없습니다.</div>'}</div>
  <div class="note" style="margin-top:6px">다른 리그 경기는 빠른 결과 계산(리그별 실제 경기당 골 수준 반영)</div>`}
{const _lv3=leagueView;leagueView=function(){const lgs=S.fxE?Object.keys(S.fxE):[];if(!lgs.length)return _lv3();const sel=UI.elg;
  const chips=`<div class="tabs" style="margin-bottom:8px;overflow-x:auto;white-space:nowrap"><button data-elg="" aria-selected="${!sel}">${esc(LGN[hl()]||"우리 리그")}</button>${lgs.map(lg=>`<button data-elg="${lg}" aria-selected="${sel===lg}">${esc(LGN[lg]||lg)}</button>`).join('')}</div>`;
  return chips+(sel&&S.fxE[sel]?euroView(sel):_lv3())}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-elg]');if(!b)return;UI.elg=b.dataset.elg;render()},true);

