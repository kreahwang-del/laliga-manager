// ================= 시즌 목표·이사회 평가(v90) =================
// 리그 목표(기존 S.exp, 신뢰도는 기존 주간 평가가 담당) + 국내 컵·유럽대항전 단계 목표(리그 내 전력 순위 기준: 1~2위 결승·4강, 3~4위 4강·8강 …) + 재정(운영 손익 ≥ 기대) + 젊은 선수 기용(21세 이하 리그 출전 분)
// 시즌 시작 때 받은편지함으로 공지, 경력 탭 위에 진행 카드, 6월 15일 평가: 컵·유럽·재정·육성 목표 달성 1개당 신뢰도 +2·이적 예산 +매출 1.5%, 미달성 −2. 전부 달성 시 평판 +1
const BD_EU=['리그 페이즈 통과','16강','8강','4강','결승','우승'];
function bdCupLv(){const lg=hl&&hl();const cu=S.cups&&S.cups[lg];if(!cu)return null;let lv=-1;cu.rounds.forEach((r,ri)=>{if(r.ties.some(t=>t.h===S.club||t.a===S.club))lv=ri});
  const fin=cu.rounds[cu.R-1],won=fin&&fin.ties[0]&&fin.ties[0].w===S.club;const BN={1:'결승',2:'4강',3:'8강',4:'16강',5:'32강',6:'64강'};return {lv:won?cu.R:lv,R:cu.R,nm:cu.n,rn:Array.from({length:cu.R},(_,i)=>(cu.rounds[i]&&cu.rounds[i].nm)||BN[cu.R-i]||`${i+1}라운드`)}}
function bdEuLv(){if(!S.eu||S.eu.y!==S.season)return null;for(const k in S.eu.comp){const C=S.eu.comp[k];if(!C.teams.includes(S.club))continue;let lv=0;
  if(C.rank&&C.rank.indexOf(S.club)>=0&&C.rank.indexOf(S.club)<24)lv=1;if(C.rank&&C.rank.indexOf(S.club)>=0&&C.rank.indexOf(S.club)<8)lv=2;
  (C.ko||[]).forEach((r,ri)=>{if(r&&r.ties.some(t=>t.h===S.club||t.a===S.club))lv=Math.max(lv,ri===0?1:ri+1)});if(C.champ===S.club)lv=6;return {k,lv,n:EUC[k].n,done:C.champ!=null||(C.rank&&C.rank.indexOf(S.club)>=24)}}return null}
function bdYoungMins(){return squadOf(S.club).filter(p=>ageOf(p)<=21).reduce((a,p)=>a+((S.ps[p.id]||{}).mins||0),0)}
function bdMake(){const ex=S.exp&&S.exp[S.club];const ep=ex?ex.ep:10;const G=[];
  if(ex)G.push({k:'lg',t:`리그 ${ex.lb}`,tp:ex.tp});
  const cu=bdCupLv();if(cu){const back=ep<=2?1:ep<=4?2:ep<=8?3:ep<=14?4:5;const tgt=Math.max(0,cu.R-back);G.push({k:'cup',t:`${cu.nm} ${cu.rn[tgt]||'본선'} 진출`,tgt})}
  const eu=bdEuLv();if(eu){const lv=eu.k==='UCL'?(ep<=2?4:ep<=4?3:ep<=7?2:1):(ep<=6?4:ep<=10?3:2);G.push({k:'eu',t:`${eu.n} ${BD_EU[lv-1]}${lv>=2&&lv<6?' 진출':''}`,tgt:lv})}
  G.push({k:'fin',t:'운영 손익 기대치 이상'});const ym=ep<=4?1200:ep<=10?2500:3500;G.push({k:'yth',t:`21세 이하 선수 리그 ${ym.toLocaleString()}분 이상 기용`,tgt:ym});
  S.goals={y:S.season,c:S.club,items:G,ev:false};
  if(!(typeof unemp==='function'&&unemp()))inbox('board','',`${S.season}-${String(S.season+1).slice(2)} 시즌 이사회 목표`,G.map(g=>'· '+g.t).join(' ')+' — 리그 외 목표는 달성 1개당 신뢰도 +2·이적 예산 보너스, 미달성 시 신뢰도 −2.')}
function bdStat(g){if(g.k==='lg'){const pos=posOf(S.club);return {ok:pos<=g.tp,txt:`현재 ${pos}위 / 목표 ${g.tp}위 이내`}}
  if(g.k==='cup'){const c=bdCupLv();if(!c)return {ok:false,txt:'-'};return {ok:c.lv>=g.tgt,txt:c.lv>=c.R?'우승':c.lv>=0?`${c.rn[c.lv]} 진출`:'아직 시작 전'}}
  if(g.k==='eu'){const e=bdEuLv();if(!e)return {ok:false,txt:'-'};return {ok:e.lv>=g.tgt,txt:e.lv>=6?'우승':e.lv>=1?BD_EU[e.lv-1]+' 진출':'리그 페이즈'}}
  if(g.k==='fin'){const ps=S.fin&&S.fin.ps;if(!ps||!ps.inc)return {ok:false,txt:'-'};const inc=Object.values(ps.inc).reduce((a,v)=>a+v,0),ex=Object.values(ps.exp).reduce((a,v)=>a+v,0);const net=ps.done?ps.net:inc-ex;
    const mo=ps.done?12:Math.max(1,Math.min(12,(D(S.date)-D(`${S.season}-07-01`))/2.63e9));const exp=(ps.expNet||0)*(ps.done?1:mo/12);return {ok:net>=exp,txt:ps.done?`${money(net)} / 기대 ${money(exp)}`:`시즌 말 결산(현재 ${money(net)}, 시즌 기대 ${money(ps.expNet||0)})`}}
  if(g.k==='yth'){const m=bdYoungMins();return {ok:m>=g.tgt,txt:`${m.toLocaleString()}분 / ${g.tgt.toLocaleString()}분`}}return {ok:false,txt:''}}
function bdEval(){const G=S.goals;if(!G||G.ev||G.y!==S.season||G.c!==S.club)return;G.ev=true;let ok=0,no=0;const lines=[];
  G.items.forEach(g=>{const s=bdStat(g);g.res=s.ok;lines.push(`${s.ok?'○':'×'} ${g.t} (${s.txt})`);if(g.k==='lg')return;if(s.ok)ok++;else no++});
  const rev=CLUBS[S.club].rev*1e6;const bonus=Math.round(rev*.015*ok/1e5)*1e5;S.me.trust=Math.max(0,Math.min(100,(S.me.trust||60)+2*ok-2*no));if(bonus>0){S.fin.budget+=bonus;S.fin.log.unshift({d:S.date,t:`이사회 목표 달성 보너스(${ok}개)`,v:bonus})}
  const all=G.items.every(g=>g.res);if(all){S.me.rep=Math.min(100,(S.me.rep||50)+1)}
  inbox('board','',`이사회 시즌 목표 평가 · ${ok}/${ok+no}`,lines.join(' / ')+` → 신뢰도 ${2*ok-2*no>=0?'+':''}${2*ok-2*no}${bonus?` · 이적 예산 +${money(bonus)}`:''}${all?' · 모든 목표 달성: 평판 +1':''}`)}
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);try{if(S&&S.club>=0&&S.me&&!(typeof unemp==='function'&&unemp())){
  if((!S.goals||S.goals.y!==S.season||S.goals.c!==S.club)&&S.date>=`${S.season}-07-01`&&S.date<`${S.season}-09-01`)bdMake();
  if(S.date>=`${S.season+1}-06-15`)bdEval()}}catch(e){console.error(e)}return r}}
function bdCard(){const G=S.goals;if(!G||G.y!==S.season||G.c!==S.club)return '';
  return `<section class="card pad" style="margin-bottom:12px"><h2 style="margin-top:0">이사회 시즌 목표</h2>${G.items.map(g=>{const s=bdStat(g);return `<div class="li" style="padding:6px 0;border-bottom:1px solid var(--line)"><span class="nm"><span style="color:${s.ok?'var(--good)':'var(--muted)'};font-weight:700;width:18px;display:inline-block">${s.ok?'✓':'·'}</span><span><b>${esc(g.t)}</b><span>${esc(s.txt)}</span></span></span></div>`}).join('')}<p class="note" style="margin:8px 0 0">리그 외 목표는 6월 중순 평가: 달성 1개당 신뢰도 +2·이적 예산 +매출 1.5%, 미달성 −2.</p></section>`}
{const _cv=careerView;careerView=function(){const h=_cv.apply(this,arguments);try{if(!UI.cv||UI.cv==='mgr'||UI.cv==='me'||UI.cv==='career'){return bdCard()+h}}catch(e){}return h}}

