// ================= 라리가2 시작 · 승격 플레이오프 직접 경기(v69) =================
//  · 시작 화면에 라리가2 구단(B팀 제외) 추가
//  · 2부 정규리그가 끝나면 3~6위 플레이오프 일정을 실제 경기로 생성(3v6·4v5, 하위 팀 1차전 홈, 홈앤어웨이 → 결승 홈앤어웨이)
//    합계 동점이면 연장(빠른 계산) → 그래도 동점이면 정규리그 상위 팀 진출(실제 규정). 우리 팀 경기는 2D 엔진, 나머지는 빠른 계산
//  · 시즌 종료는 플레이오프가 끝난 뒤. 승강 처리(promoteRelegate)는 이 결과를 그대로 사용
{const _sv=startView;startView=function(){let h=_sv();if((UI.mode||'club')!=='club')return h;
  const c2=CLUBS.filter(c=>c&&c.lg==='ES2'&&!/ B$|\(B\)/.test(c.name)).map(c=>{const sq=squadOfBase(c.i).sort((a,b)=>b.ovr-a.ovr).slice(0,16);return {i:c.i,avg:sq.length?Math.round(sq.reduce((a,p)=>a+p.ovr,0)/sq.length):60,star:sq[0]}}).sort((a,b)=>b.avg-a.avg);
  if(!c2.length)return h;const sec=`<h2>라리가2 (2부)</h2><p class="note" style="margin:-4px 0 6px">1·2위 자동 승격, 3~6위 플레이오프. 선수 수가 적은 구단은 시작 시 20명까지 보충됩니다.</p><div class="pick">${c2.map(t=>`<button data-new="${t.i}">${crest(t.i)}<span><b>${esc(CLUBS[t.i].name)}</b><small>${t.star?'에이스 '+esc(t.star.name)+' · ':''}이적 예산 ${mM(CLUBS[t.i].budget)}</small></span><span class="ovr num ${ovrCls(t.avg)}">${t.avg}</span></button>`).join('')}</div>`;
  const k=h.lastIndexOf('<p class="note" style="margin-top:18px');return k>0?h.slice(0,k)+sec+h.slice(k):h+sec}}
function poAll(){const P=S.pof;if(!P||P.y!==S.season)return [];const o=[];P.ties.forEach(t=>t.f.forEach(f=>o.push(f)));if(P.fin)P.fin.f.forEach(f=>o.push(f));return o}
function poMine(){if(typeof unemp==='function'&&unemp())return null;return poAll().find(f=>f.d===S.date&&!f.res&&(f.h===S.club||f.a===S.club))||null}
function poSeed(c){const P=S.pof;return P?P.seeds.indexOf(c):9}
function poMk(lo,hi,d1,d2,rd,ti){const m=(d,h,a,leg)=>({d,h,a,res:null,po:1,rd,ti,leg,lg:'ES2',dv:2});return {h:hi,a:lo,w:null,f:[m(d1,lo,hi,1),m(d2,hi,lo,2)]}}
function poCreate(){const t2=tableOf(2).filter(t=>!isB(t.id));if(t2.length<6)return;const s=t2.slice(2,6).map(t=>t.id);
  S.pof={y:S.season,seeds:s,ties:[poMk(s[3],s[0],addD(S.date,3),addD(S.date,7),0,0),poMk(s[2],s[1],addD(S.date,3),addD(S.date,7),0,1)],fin:null,w:null};
  const nm=c=>CLUBS[c].short;S.news.unshift({d:S.date,t:'라리가2 승격 플레이오프 대진',b:`${nm(s[0])}–${nm(s[3])} · ${nm(s[1])}–${nm(s[2])} (홈앤어웨이, 동점이면 정규리그 상위 팀)`,v:0,big:true});
  if(s.includes(S.club)&&!(typeof unemp==='function'&&unemp())){const t=S.pof.ties.find(x=>x.h===S.club||x.a===S.club),o=t.h===S.club?t.a:t.h;inbox('board','',`승격 플레이오프 진출 (${s.indexOf(S.club)+3}위)`,`준결승 상대 ${CLUBS[o].name} · 1차전 ${fmtD(t.f[0].d)}(${t.f[0].h===S.club?'홈':'원정'}), 2차전 ${fmtD(t.f[1].d)}. 합계 동점이면 연장, 그래도 같으면 정규리그 상위 팀이 올라갑니다.`)}}
/* 2차전 후: 합계 → 동점이면 연장(빠른 계산) → 그래도 동점이면 상위 시드 */
function poPost(f){const P=S.pof;if(!P)return;const t=f.rd===1?P.fin:P.ties[f.ti];if(!t||t.w!=null||f.leg!==2||!t.f[0].res)return;
  const a=t.f[0].res.sc,b=t.f[1].res.sc;let gh=a[1]+b[0],ga=a[0]+b[1]; /* t.h = 상위 시드(2차전 홈) */
  if(gh===ga){const L=cupLamT(f,teamFor(f.h),teamFor(f.a)),k=S.season+':po'+f.rd+f.ti;const e=[poisR(L[0]/3,hsh('h'+k)),poisR(L[1]/3,hsh('a'+k))];f.et=e;gh+=e[0];ga+=e[1]}
  t.w=gh>ga?t.h:gh<ga?t.a:(poSeed(t.h)<poSeed(t.a)?t.h:t.a);t.agg=`${CLUBS[t.h].short} ${gh}-${ga} ${CLUBS[t.a].short}`;t.seedWin=gh===ga;
  const mine=(t.h===S.club||t.a===S.club)&&!(typeof unemp==='function'&&unemp());
  if(f.rd===0&&P.ties.every(x=>x.w!=null)&&!P.fin){const w=P.ties.map(x=>x.w).sort((x,y)=>poSeed(x)-poSeed(y));const d=addD(S.date,4);P.fin=poMk(w[1],w[0],d,addD(d,4),1,0);
    if(P.fin.h===S.club||P.fin.a===S.club){const o=P.fin.h===S.club?P.fin.a:P.fin.h;inbox('board','',`승격 플레이오프 결승 진출`,`상대 ${CLUBS[o].name} · 1차전 ${fmtD(P.fin.f[0].d)}, 2차전 ${fmtD(P.fin.f[1].d)}`)}}
  if(f.rd===1){P.w=t.w;S.news.unshift({d:S.date,t:`${CLUBS[t.w].name} 플레이오프 승격`,b:`결승 합계 ${t.agg}${f.et?` (연장 ${f.et[0]}-${f.et[1]})`:''}${t.seedWin?' · 동점, 정규리그 상위 팀 승격':''}`,v:0,big:true})}
  if(mine&&t.w!==S.club&&typeof hlPush==='function')hlPush({key:'po'+S.season,pri:4,tone:'bad',c:t.w,t:'승격 플레이오프 탈락',b:`합계 ${t.agg}`});
  if(mine&&f.rd===1&&t.w===S.club&&typeof hlPush==='function')hlPush({key:'poW'+S.season,pri:6,tone:'good',c:S.club,t:'플레이오프 승리 · 1부 승격!',b:`결승 합계 ${t.agg}`})}
function poToday(){if(hl()!=='ES'||!LIGA2.length||!S.fixO)return;const f2=fxOf(2);if(!f2.length||!f2.every(f=>f.res))return;
  if(!S.pof||S.pof.y!==S.season){poCreate();return}
  const mineOn=!(typeof unemp==='function'&&unemp());
  for(const f of poAll()){if(f.res||f.d>S.date)continue;if(mineOn&&f.d===S.date&&(f.h===S.club||f.a===S.club))continue;fastMatch(f);if(f.res)f.res.ev=[];poPost(f)}}
function poDone(){if(hl()!=='ES'||!LIGA2.length||!S.fixO||!S.fixO.length)return true;const f2=fxOf(2);if(!f2.length||!f2.every(f=>f.res))return true;
  if(S.pof&&S.pof.y===S.season&&S.pof.w!=null)return true;if(S.pof&&S.pof.y===S.season&&S.pof.fin&&S.date>addD(S.pof.fin.f[1].d,7))return true;return false}
{const _ft=divFastToday;divFastToday=function(){_ft();try{poToday()}catch(e){console.error(e)}}}
{const _od=divOtherDone;divOtherDone=function(){return _od()&&poDone()}}
/* 시즌 말 승강: 플레이오프 결과 사용(없으면 기존 빠른 계산) */
{const _pr=promoteRelegate;promoteRelegate=function(){const P=S.pof;if(!(P&&P.y===S.season&&P.w!=null))return _pr();
  /* 기존 함수의 3~6위 대진 계산(legs2 3회: 준결승 2 + 결승)을 실제 결과로 대체 */
  const _l2=legs2;let call=0;legs2=function(h,a){call++;if(call<3){const t=P.ties.find(x=>[x.h,x.a].includes(h)&&[x.h,x.a].includes(a));if(t)return {w:t.w,sc:t.agg}}if(call===3)return {w:P.w,sc:P.fin.agg};return _l2(h,a)};
  try{return _pr()}finally{legs2=_l2}}}
/* 우리 플레이오프 경기(엔진) 종료 후 */
{const _fi=finish;finish=function(){const fx=M&&M.fx;_fi();if(!fx||!fx.po)return;try{poPost(fx);const P=S.pof,t=fx.rd===1?P.fin:P.ties[fx.ti];
  if(fx.et)feed({m:120,t:'sys',txt:`연장전 ${fx.et[0]} : ${fx.et[1]}`});
  if(t&&t.w!=null)feed({m:0,t:'sys',txt:`${t.w===S.club?(fx.rd===1?'1부 승격 확정!':'결승 진출'):'탈락'} (합계 ${t.agg}${t.seedWin?' · 동점, 정규리그 상위 팀':''})`});else if(fx.leg===1)feed({m:0,t:'sys',txt:'1차전 종료 · 2차전에서 승부'});save()}catch(e){console.error(e)}}}
/* 표기: 경기 화면·홈 카드·일정 */
{const _cl=cupLabel;cupLabel=function(f){if(f.po)return `승격 플레이오프 ${f.rd?'결승':'준결승'} ${f.leg}차전`;return _cl(f)}}
{const _cn=cupNextMine;cupNextMine=function(){const a=_cn();if(typeof unemp==='function'&&unemp())return a;const b=poAll().filter(f=>!f.res&&(f.h===S.club||f.a===S.club)).sort((x,y)=>x.d<y.d?-1:1)[0];return [a,b].filter(Boolean).sort((x,y)=>x.d<y.d?-1:1)[0]||null}}
{const _cm=cupMine;cupMine=function(){return _cm()||poMine()}}
{const _lv=leagueView;leagueView=function(){let h=_lv();const P=S.pof;if(!P||P.y!==S.season||UI.elg||(UI.ldv||myDiv())!==2||UI.lt!=='table')return h;
  const row=t=>`<div class="li"><span class="nm"><b>${esc(CLUBS[t.h].short)} vs ${esc(CLUBS[t.a].short)}</b><span>${t.f.map(f=>f.res?`${CLUBS[f.h].short} ${f.res.sc[0]}-${f.res.sc[1]} ${CLUBS[f.a].short}`:fmtD(f.d)).join(' / ')}${t.w!=null?` → <b>${esc(CLUBS[t.w].short)}</b>${t.seedWin?' (상위 시드)':''}`:''}</span></span></div>`;
  return h+`<h2>승격 플레이오프</h2><div class="card list">${P.ties.map(row).join('')}${P.fin?row(P.fin):''}</div>`}}
/* 2부 구단으로 시작: 이사회 목표 계산 전에 2부 구성(genDiv2)을 먼저 만듦 */
{const _ci=careerInit;careerInit=function(mode,name,club){if(CLUBS[club]&&hl2()&&CLUBS[club].lg===hl2()&&!LIGA2.length){try{genDiv2()}catch(e){console.error(e)}}return _ci(mode,name,club)}}

