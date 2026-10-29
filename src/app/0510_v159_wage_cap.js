// ================= v159: 연봉 총액 한도 조정 =================
// 사용자 선택: 둘 다
// ① 시즌 결산 때 재계산(실제 라리가 선수단 비용 한도처럼 매출 연동): 목표 = 게임 시작 때 한도 × (이번 시즌 실제 매출 ÷ 구단 기준 매출, 0.75~1.35) × (2부면 0.55)
//    새 한도 = 지금 한도와 목표의 중간(한 해에 크게 출렁이지 않게). 성적·관중·상금·시설로 매출이 늘면 오르고, 부진·강등이면 줄어듦
// ② 시즌 중 이사회 요청(시즌 1회): 이적 예산을 연봉 한도로 전환 — 한도 +5%는 늘어나는 연봉의 3년치(=증가분×3)를, +10%도 같은 비율로 예산에서 뺌
//    이사회 신뢰도 60 이상이면 +10%까지, 45~59면 +5%만, 45 미만이면 거절
// v160: 리그 기준은 '게임 시작 때 리그 대비'(1부 1·2부 .55·3부 .3의 비율) — 2부에서 시작한 구단이 이중으로 깎이지 않게
// v160 AI 구단도 같은 방식(공평): 재정 기록이 없어 시즌 매출 비율을 순위로 추정 = 1 + 중계권 비중×0.3×(순위 위치−0.5) + 0.15×(기대 순위−실제 순위)/팀 수 + 우승 시 상업 비중×0.05 (우리 구단 결산과 같은 항목·규모, 관중 효과는 기대 대비 성적으로 근사)
function wcTier(c){const lg=CLUBS[c]&&CLUBS[c].lg||'';return /^(ES3|X3)|3X$/.test(lg)?3:/^(ES|EN|DE|IT|FR)2$/.test(lg)?2:1}
const WC_TF={1:1,2:.55,3:.3};
function wcBase(c){S.wc0=S.wc0||{};S.wcT0=S.wcT0||{};if(S.wc0[c]==null){S.wc0[c]=CLUBS[c].wageCap;S.wcT0[c]=wcTier(c)}}
function wcDivF(c){wcBase(c);return WC_TF[wcTier(c)]/WC_TF[S.wcT0[c]||1]}
function wcInit(){if(!S||S.club==null||S.club<0)return;wcBase(S.club);S.wcap=S.wcap||{}}
function wcApply(){if(!S||!S.wcap)return;for(const c in S.wcap)if(CLUBS[c])CLUBS[c].wageCap=S.wcap[c]}
function wcSet(c,v){wcInit();v=Math.round(v*10)/10;CLUBS[c].wageCap=v;S.wcap[c]=v}
{const _dl=devLoad;devLoad=function(){_dl.apply(this,arguments);try{wcApply()}catch(e){console.error(e)}}}
// ① 시즌 결산 재계산
{const _fe=finSeasonEnd;finSeasonEnd=function(){const done0=S&&S.fin&&S.fin.ps&&S.fin.ps.done;const r=_fe.apply(this,arguments);try{const ps=S.fin.ps;if(done0||!ps||!ps.done||S.club<0)return r;wcInit();
  const b=finBase(),inc=Object.values(ps.inc).reduce((a,v)=>a+v,0);const ratio=Math.max(.75,Math.min(1.35,inc/Math.max(1,b.R)));const c=S.club;const d2=wcDivF(c);
  const cur=CLUBS[c].wageCap,tgt=S.wc0[c]*ratio*d2,nv=(cur+tgt)/2;wcSet(c,nv);
  inbox('board','',`다음 시즌 연봉 총액 한도 ${money(cur*1e6)} → ${money(CLUBS[c].wageCap*1e6)}`,`이번 시즌 매출 ${money(inc)}(기준 대비 ${Math.round(inc/b.R*100)}%)${d2<1?' · 하위 리그 기준 적용':d2>1?' · 상위 리그 승격 반영':''}. 한도는 매출에 따라 시즌마다 다시 정해집니다(실제 라리가 선수단 비용 한도처럼). 시즌 중에는 재정 화면에서 이사회에 증액을 요청할 수 있습니다.`)}catch(e){console.error(e)}return r}}
// ② 이사회 요청
function wcReqOpts(){const t=S.me?S.me.trust:60;const used=S.wreq===S.season;const cap=CLUBS[S.club].wageCap*1e6;
  return [5,10].map(pc=>{const add=cap*pc/100,cost=add*3;const ok=!used&&(pc===5?t>=45:t>=60)&&S.fin.budget>=cost;
    return {pc,add,cost,ok,why:used?'이번 시즌 이미 요청함':t<(pc===5?45:60)?`이사회 신뢰도 ${pc===5?45:60} 이상 필요(지금 ${Math.round(t)})`:S.fin.budget<cost?'이적 예산 부족':''}})}
{const _fs=finSheet;finSheet=function(){const r=_fs.apply(this,arguments);try{if(S.club<0)return r;wcInit();const sh=document.querySelector('#scrim .sheet');if(!sh)return r;const O=wcReqOpts();
  const div=document.createElement('div');div.className='card pad';div.style.marginTop='10px';
  div.innerHTML=`<div class="lbl">연봉 총액 한도 늘리기</div><p class="note" style="margin:4px 0 8px">한도는 시즌 결산 때 매출에 따라 다시 정해집니다(지금 ${money(CLUBS[S.club].wageCap*1e6)} · 게임 시작 때 ${money(S.wc0[S.club]*1e6)}). 시즌 중에는 이사회에 이적 예산 일부를 연봉 한도로 돌려 달라고 요청할 수 있습니다(시즌 1회, 늘어나는 연봉 3년치를 예산에서 차감).</p>
  ${O.map(o=>`<button class="btn ghost" data-wreq="${o.pc}" ${o.ok?'':'disabled'} style="display:block;width:100%;text-align:left;margin-top:6px"><b>한도 +${o.pc}%</b> (+${money(o.add)}/년) · 이적 예산 −${money(o.cost)}${o.why?`<div class="note" style="margin:2px 0 0">${o.why}</div>`:''}</button>`).join('')}`;
  sh.appendChild(div)}catch(e){console.error(e)}return r}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-wreq]');if(!b||b.disabled)return;const pc=+b.dataset.wreq;const o=wcReqOpts().find(x=>x.pc===pc);if(!o||!o.ok)return;
  const c=S.club,cur=CLUBS[c].wageCap;wcSet(c,cur*(1+pc/100));S.fin.budget-=o.cost;S.fin.log.unshift({d:S.date,t:`연봉 한도 +${pc}% (이사회 승인)`,v:-o.cost});S.wreq=S.season;
  inbox('board','',`이사회, 연봉 총액 한도 증액 승인`,`${money(cur*1e6)} → ${money(CLUBS[c].wageCap*1e6)}. 이적 예산에서 ${money(o.cost)}를 돌렸습니다.`);save();closeSheet();finSheet();toast(`연봉 한도 +${pc}% 승인`)},true);
// 감독 이직: 새 구단 기준으로
if(typeof moveTo==='function'){const _mt=moveTo;moveTo=function(){const r=_mt.apply(this,arguments);try{wcInit()}catch(e){}return r}}

// ---- v160 AI 구단 시즌 정산 ----
{const _ro=rollover;rollover=function(){const pre={};try{if(S&&S.seasonDone){S.wcap=S.wcap||{};const lgs=new Set(CLUBS.filter(c=>c&&c.lg&&c.i!==S.club&&c.wageCap>0).map(c=>c.lg));
  for(const lg of lgs){let t;try{t=tableLg(lg)}catch(e){continue}if(!t||t.length<6||!t.some(r=>r.p>0))continue;const n=t.length;
    const st=t.map(r=>{const sq=squadOf(r.id).map(p=>p.ovr).sort((a,b)=>b-a).slice(0,16);return [r.id,sq.length?sq.reduce((a,v)=>a+v,0)/sq.length:0]}).sort((a,b)=>b[1]-a[1]);const er={};st.forEach(([id],i)=>er[id]=i+1);
    t.forEach((r,i)=>{const c=r.id;if(c===S.club||!CLUBS[c]||!(CLUBS[c].wageCap>0))return;const deloitte=/딜로이트/.test(CLUBS[c].revSrc||'');const mix=FIN_MIX(deloitte);const pos=i+1;
      const ratio=Math.max(.75,Math.min(1.35,1+mix.tv*.3*((n-pos)/Math.max(1,n-1)-.5)+.15*(er[c]-pos)/n+(pos===1?mix.com*.05:0)));pre[c]=ratio})}}}catch(e){console.error(e)}
  const r=_ro.apply(this,arguments);
  try{for(const c in pre){wcBase(c);const cur=CLUBS[c].wageCap,tgt=S.wc0[c]*pre[c]*wcDivF(c);const v=Math.round((cur+tgt)/2*10)/10;CLUBS[c].wageCap=v;S.wcap[c]=v}}catch(e){console.error(e)}return r}}
// ---- v160 이적 협상 화면: 이적 예산·연봉 한도 남은 액과 이 제안 뒤 남는 액 ----
{const _os=offerSheet;offerSheet=function(id){const r=_os.apply(this,arguments);try{const O=UI.off;const sh=document.querySelector('#scrim .sheet');const fa=sh&&sh.querySelector('.facts');if(!O||!fa||O.id!==id)return r;const p=pl(id);
  const B=spendable(),cap=CLUBS[S.club].wageCap*1e6,room=cap-wageBill(S.club);const fee=O.loan?0:(O.fee||0)/(O.inst||1);const w=O.loan?(p.wage||0)*(O.share||100)/100:(O.wage||0);
  const col=v=>v<0?'var(--bad)':'var(--text)';const div=document.createElement('div');div.className='card pad';div.style.margin='8px 0';
  div.innerHTML=`<div class="li" style="padding:3px 0"><span class="nm"><b>이적 예산</b><span>남음 ${money(B)}${O.loan?' · 임대는 이적료 없음':` · 이번 지불 ${money(fee)}`}</span></span><span class="num" style="color:${col(B-fee)}">제안 뒤 ${money(B-fee)}</span></div>
   <div class="li" style="padding:3px 0"><span class="nm"><b>연봉 한도</b><span>여유 ${money(room)} / 한도 ${money(cap)} · 이 선수 ${O.loan?`연봉 ${O.share||100}% 부담`:'연봉'} ${money(w)}</span></span><span class="num" style="color:${col(room-w)}">계약 뒤 ${money(room-w)}</span></div>
   ${room-w<0?`<p class="note" style="margin:4px 0 0;color:var(--bad)">연봉 한도를 넘습니다 — 선수 판매·방출·임대로 줄이거나, 재정 화면에서 이사회에 한도 증액을 요청하세요.</p>`:''}`;
  fa.after(div)}catch(e){console.error(e)}return r}}
// ---- v160 연봉 시장가 연동(여러 시즌 시뮬 점검 결과) ----
// 점검(상위 5개 리그, 3시즌): 시장가치 총액 31.4→30.9B(안정)인데 연봉 총액 12.6→10.0B, 선수 1인 평균 5.9→3.9M(−35%), 24세 중앙값 4.6→2.5M, 연봉/한도 중앙값 0.76→0.57
//  원인: AI 재계약·자유계약 영입 때 연봉을 그대로 두고 계약 기간만 늘림 → 성장한 유망주가 유스 시절 연봉(수만 유로)으로 계속 뜀
// 시장 연봉 = 시작 데이터의 가치-연봉 관계(가치 구간별 중앙값을 로그 회귀: 2M→1.57M, 기울기 0.725, 0.5M→0.6M·32M→11.7M·75M→22M)
function mktWage(p){const v=Math.max(2e5,valueNow?valueNow(p):p.val||0);return 1.57e6*Math.pow(v/2e6,.725)}
// 사용자 구단 재계약·영입 요구 연봉: 이전엔 '지금 연봉×1.15~1.4'(재계약할 때마다 복리로 오름) 또는 가치×12% → 시장 연봉과 지금 연봉 중 큰 쪽 × 1.0~1.15
{const _wd=wageDemand;wageDemand=function(p,club){try{const h=hsh(p.id+'w'+S.season);const base=Math.max(mktWage(p)*(.95+.2*h),p.wage*(1+.15*h));const fromRep=CLUBS[clubOf(p.id)]?.rep||40,diff=fromRep-CLUBS[club].rep;return Math.round(base*(1+Math.max(0,diff)/100)/1e4)*1e4}catch(e){return _wd.apply(this,arguments)}}}
// AI 구단: 시즌 전환 때 계약이 새로 정해진 선수(재계약·자유계약 영입·이적)는 시장 연봉(±15%), 계약 중이라도 시장 연봉의 45% 밑이면 중간값으로 재협상
{const _ro=rollover;rollover=function(){const before={};try{for(const id in BASE){const q=S.ps[id];const c=clubOf(+id);if(c>=0&&c!==S.club){const p=pl(+id);before[id]=[c,p.cEnd]}}}catch(e){console.error(e)}
  const r=_ro.apply(this,arguments);
  try{let n1=0,n2=0;const chg={};for(const id in BASE){const c=clubOf(+id);if(c<0||c===S.club||c===FA||c===RET)continue;const p=pl(+id);if(!p||ageOf(p)<17)continue;const b=before[id];const mw=mktWage(p);const q=S.ps[+id]=S.ps[+id]||{};
    if(!b||b[0]!==c||b[1]!==p.cEnd){const w=Math.round(mw*(.85+.3*hsh(id+'mw'+S.season))/1e4)*1e4;if(Math.abs(w-p.wage)>1e4){setP(+id,{wage:w});(chg[c]=chg[c]||[]).push(+id);n1++}}
    else if(p.wage<mw*.45){setP(+id,{wage:Math.round((p.wage+mw)/2/1e4)*1e4});(chg[c]=chg[c]||[]).push(+id);n2++}}
    /* 연봉 한도를 넘게 되면 이번에 새로 정한 계약만 비율로 낮춤(최대 40%까지) — 구단이 한도 안에서 협상 */
    for(const c in chg){const cap=(CLUBS[c].wageCap||0)*1e6;if(!cap)continue;const bill=wageBill(+c);if(bill<=cap)continue;const L=chg[c];const sub=L.reduce((a,id)=>a+pl(id).wage,0);if(!sub)continue;
      const f=Math.max(.6,(sub-(bill-cap))/sub);L.forEach(id=>setP(id,{wage:Math.round(pl(id).wage*f/1e4)*1e4}))}
    S.wRe={y:S.season,n1,n2}}catch(e){console.error(e)}return r}}

