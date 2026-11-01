// ================= v275 감독 능력(1단계, 사용자 결정 2026-11-02: "1·2번 결합 — 능력치는 실제 행동 기록으로만 오름", 디자인·엔진 에이전트 의견) =================
// 전술판단: 벤치 지시 등급(좋은 판단 − 아쉬운 판단) / 동기부여: 하프타임 팀토크가 상황에 맞았는지(앞설 때 칭찬·접전 침착·뒤질 때 질책+프로의식 등)
// 최근 20경기(직접 치른 경기) 기록 비율로 0~20, 표본이 적으면 10 쪽으로 당김 → 반복으로 쌓을 수 없고 쉬면 자연히 내려감. 자동 선택(시간 초과)은 제외
// 효과(작게): 전술판단 → 선수가 지시를 따를 확률 ±4%p(엔진 decFol) / 동기부여 → 팀토크·'정신 차려!' 집중 효과 ±20~30%. 10이면 효과 0(기존과 동일)
// 칭호: 15 이상을 10경기 유지 → '전술가'·'동기부여가', 15 밑으로 내려가면 '휴면'
const MGA={tac:{n:'전술판단',t:'전술가',why:'벤치 지시 판단(좋은 판단 − 아쉬운 판단)',fx:'선수가 지시를 따를 확률'},mot:{n:'동기부여',t:'동기부여가',why:'하프타임 팀토크가 상황에 맞았는지',fx:'팀토크·정신 차려! 효과'}};
function mgaRec(){const L=((S.me&&S.me.mlog)||[]).slice(-20);const o={tac:{g:0,b:0,n:0},mot:{g:0,b:0,n:0},m:L.length};L.forEach(x=>{o.tac.g+=x.dg||0;o.tac.b+=x.db||0;o.tac.n+=x.dn||0;o.mot.g+=x.tg||0;o.mot.b+=x.tb||0;o.mot.n+=x.tn||0});return o}
function mgaVal(r){const n=r.n;if(!n)return 10;const s=(r.g-r.b)/n;return Math.max(0,Math.min(20,10+10*s*n/(n+6)))}
function mgaAll(){const R=mgaRec();return {tac:mgaVal(R.tac),mot:mgaVal(R.mot),R}}
/* 우리 팀 객체에 감독 능력(-1~1)을 붙여 엔진에 전달 */
{const _tf=teamFor;teamFor=function(c){const T=_tf.apply(this,arguments);try{if(T&&c===S.club&&S.me&&!(typeof unemp==='function'&&unemp())){const A=mgaAll();T.mgr={tac:+((A.tac-10)/10).toFixed(3),mot:+((A.mot-10)/10).toFixed(3)}}}catch(e){}return T}}
/* 경기 끝: 기록 1줄 + 칭호 갱신 */
{const _fi=finish;finish=function(){let rec=null;try{if(M&&!M.done&&!M.skipStart){const L=(M.decLog||[]).filter(x=>x.ch&&x.ch!=='auto');rec={d:S.date,dn:L.length,dg:L.filter(x=>x.grade==='좋은 판단').length,db:L.filter(x=>x.grade==='아쉬운 판단').length,tn:M.talkG!=null?1:0,tg:M.talkG===1?1:0,tb:M.talkG===-1?1:0}}}catch(e){}
  const r=_fi.apply(this,arguments);
  try{if(rec&&S.me){const ml=S.me.mlog=S.me.mlog||[];ml.push(rec);if(ml.length>40)ml.splice(0,ml.length-40);const A=mgaAll();const ts=S.me.mts=S.me.mts||{},tl=S.me.mtl=S.me.mtl||{};
    for(const k of ['tac','mot']){const v=A[k];ts[k]=v>=15?(ts[k]||0)+1:0;const was=tl[k];if(ts[k]>=10)tl[k]='on';else if(was==='on'&&v<15)tl[k]='rest';
      if(tl[k]==='on'&&was!=='on'){try{S.news.unshift({d:S.date,t:`감독 칭호 '${MGA[k].t}' 획득 — ${MGA[k].fx} 상승`,v:0,big:true})}catch(e){}}}}}catch(e){console.error(e)}return r}}
/* '결과 보기'로 처음부터 넘긴 경기는 기록 제외(불이익 없음) */
{const _sm=startMatch;startMatch=function(){const r=_sm.apply(this,arguments);try{if(M){M.skipStart=false;M.talkG=null}}catch(e){}return r}}
{const _fn=finish;finish=function(){try{if(M&&!M.done&&(M.m&&M.m.min<=1))M.skipStart=true}catch(e){}return _fn.apply(this,arguments)}}
/* 경기 시작 중계에 칭호 */
{const _sm2=startMatch;startMatch=function(){const r=_sm2.apply(this,arguments);try{const tl=(S.me&&S.me.mtl)||{};const on=Object.keys(MGA).filter(k=>tl[k]==='on');if(on.length)setTimeout(()=>{try{feed({m:0,t:'sys',txt:`🎖 감독 칭호: ${on.map(k=>MGA[k].t).join('·')} — ${on.map(k=>MGA[k].fx).join(', ')} 상승`})}catch(e){}},120)}catch(e){}return r}}
/* 감독 탭: 감독 기록 카드 */
function mgaCard(){const A=mgaAll(),R=A.R,tl=(S.me&&S.me.mtl)||{},ts=(S.me&&S.me.mts)||{};
  const row=k=>{const v=A[k],r=R[k];const pct=Math.round(v/20*100);const fx=k==='tac'?`${v>=10?'+':''}${((v-10)/10*4).toFixed(1)}%p`:`${v>=10?'+':''}${Math.round((v-10)/10*(k==='mot'?30:20))}%`;
    const badge=tl[k]==='on'?`<span class="pill" style="margin-left:6px">🎖 ${MGA[k].t}</span>`:tl[k]==='rest'?`<span class="note" style="display:inline;margin-left:6px">${MGA[k].t}(휴면)</span>`:'';
    return `<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;align-items:baseline"><b>${MGA[k].n}${badge}</b><b class="num">${r.n?Math.round(v):'평가 중'}</b></div>
     <div style="height:6px;background:var(--line);margin:4px 0"><i style="display:block;height:6px;width:${r.n?pct:50}%;background:${v>=15?'var(--good)':v<8?'var(--bad)':'var(--amber,#F5D547)'}"></i></div>
     <div class="note" style="margin:0">${MGA[k].why} · ${r.n?`좋음 ${r.g} · 아쉬움 ${r.b} / ${r.n}회`:'기록 없음'} · ${MGA[k].fx} ${r.n?fx:'±0'}${v>=15&&tl[k]!=='on'?` · 칭호까지 ${Math.max(0,10-(ts[k]||0))}경기`:''}</div></div>`};
  return `<h2>감독 기록 <span class="note" style="display:inline">최근 ${R.m}경기(최대 20) · 직접 치른 경기만</span></h2><div class="card pad">${row('tac')}${row('mot')}<p class="note" style="margin:6px 0 0">10이 기본(효과 없음). 최근 경기의 판단으로만 오르내립니다. 15 이상을 10경기 유지하면 칭호가 붙습니다.</p></div>`}
{const _cv=careerView;careerView=function(){const h=_cv.apply(this,arguments);try{if((!UI.cv||UI.cv==='mgr'||UI.cv==='me'||UI.cv==='career')&&!(typeof unemp==='function'&&unemp())){const k=h.indexOf('<h2>');return k>=0?h.slice(0,k)+mgaCard()+h.slice(k):mgaCard()+h}}catch(e){console.error(e)}return h}}
/* 경기 전 분석: 상대 감독 성향 한 줄(판단력 aiQ 기준) */
{const _bs=bpStaff;bpStaff=function(pr){let h=_bs.apply(this,arguments);try{if(!h||!pr||!pr.them)return h;const c=pr.them.club;const q=aiQ(c,true);const m=typeof mgrOf==='function'?mgrOf(c):null;const nm=m?shortName(m.n):'상대 감독';
  const t=q>=.75?`${esc(nm)}: 상대에 맞춰 전술을 자주 바꾸는 유형(판단력 높음)`:q>=.5?`${esc(nm)}: 상황에 따라 대응하는 유형`:`${esc(nm)}: 자기 전술을 고수하는 유형`;
  const tile=`<div><small>상대 감독</small><p>${t}</p></div>`;const k=h.lastIndexOf('</div>');return k>0?h.slice(0,k)+tile+h.slice(k):h}catch(e){return h}}}
/* v275 사용자 요청: '계속'을 누르면 다음이 경기인지 휴식일인지 헷갈림 → 버튼에 오늘 경기면 '경기 시작 · 상대', 아니면 '다음 경기 N일 뒤 · 상대'(그 사이 휴식, 소식이 오면 중간에 멈춤) */
function goLbl(){try{if(typeof unemp==='function'&&unemp())return '계속';const f=typeof nextFxAll==='function'?nextFxAll():myNext();if(!f)return '계속';const oc=f.h===S.club?f.a:f.h;const on=CLUBS[oc]?CLUBS[oc].short:'';const dd=Math.round((new Date(f.d)-new Date(S.date))/864e5);
  if(dd<=0)return `<span style="display:flex;flex-direction:column;align-items:flex-start;line-height:1.15"><span>경기 시작</span><small style="font-size:11px;font-weight:700;opacity:.8">${f.h===S.club?'홈':'원정'} vs ${esc(on)}</small></span>`;
  return `<span style="display:flex;flex-direction:column;align-items:flex-start;line-height:1.15"><span>계속</span><small style="font-size:11px;font-weight:700;opacity:.8">${dd===1?'내일 경기':`휴식 ${dd-1}일 후 경기`} · ${f.d.slice(5).replace('-','/')} vs ${esc(on)}</small></span>`}catch(e){return '계속'}}
