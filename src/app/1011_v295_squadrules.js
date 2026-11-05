// ================= v295 현실 선수단 규정 1단계(사용자 결정 2026-11-05: 에이전트·플레이어 의견 종합) =================
// 원칙: 몰수패·강제 방출 없음. 영입 전에 막고(이유 표시), 경기 전에는 자동으로 맞춤. AI 구단도 똑같이. 처음 DB 선수단(이미 초과)은 인정하고 새 영입만 검사. 감독 탭에서 끌 수 있음(AI도 같이 꺼짐)
// 외국인 = 리그 나라 국적(FIFA 코드)이 아닌 선수. 이중국적 데이터가 없어 유럽 비EU 규정은 2단계
// 리그 규정(2026·2026-27, 축구 전문가 조사): m = 경기 명단(선발+벤치) 외국인 상한, h = 1군 외국인 보유 상한
//  K리그1 출전 5(2026 보유 한도 폐지) · J1 경기 명단 5 · 중국 경기 명단 5·등록 6 · 리가MX 동시 출전 7·등록 9 · 브라질 경기 명단 9 · 사우디 1군 외국인 10 · 튀르키예 외국인 14
//  아르헨티나 계약 6·출전 5는 확인 필요(추정)
const SQR={KR:{m:5},JP:{m:5},CN:{m:5,h:6},MX:{m:7,h:9},BR:{m:9},AR:{m:5,h:6},SA:{h:10},TR:{h:14}};
const SQMAX=30;/* 1군 최대 인원(선수 사재기 방지) */
/* QA 지적: 경기 날만 끄는 식의 공략 방지 → 시즌 첫 리그 경기 전(또는 무소속)에만 바꿀 수 있음 */
function sqrCanToggle(){try{return (typeof unemp==='function'&&unemp())||!S.fixtures.some(f=>f.res)}catch(e){return true}}
function sqrOn(){return !!S&&S.sqr!==false}
function sqrLg(c){const C=CLUBS[c];if(!C)return null;return typeof baseLg==='function'?baseLg(C.lg):C.lg}
function sqrRule(c){const lg=sqrLg(c);return lg?SQR[lg]||null:null}
function isFor(p,c){const lg=sqrLg(c);const L=LGNAT[lg];return !!(L&&p&&p.nat&&!L.includes(p.nat))}
function forCnt(c,ex){return squadOf(c).filter(q=>q.id!==ex&&isFor(q,c)).length}
function sqrWeakFor(c,ex){return squadOf(c).filter(q=>q.id!==ex&&isFor(q,c)&&!q.loanFrom).sort((a,b)=>a.ovr-b.ovr)[0]||null}
/* AI 구단은 한도가 차 있어도 더 나은 외국인이면 영입하고 가장 약한 외국인과 계약 해지(실제 사우디·튀르키예 구단 방식). 사용자 구단은 먼저 내보내야 함 */
function quotaOK(p,to,ai){if(!sqrOn()||to==null||to<0||!CLUBS[to])return true;const R=sqrRule(to);if(!R||!R.h||!isFor(p,to)||clubOf(p.id)===to)return true;if(forCnt(to,p.id)<R.h)return true;
  if(ai??(to!==S.club)){const w=sqrWeakFor(to,p.id);return !!w&&p.ovr>=w.ovr+3}return false}
function sizeOK(p,to){if(!sqrOn()||to==null||to<0||!CLUBS[to]||clubOf(p.id)===to)return true;return sqSize(to)<SQMAX}
// ---- 영입 관문: AI ----
{const _lm=lgMoveOK;lgMoveOK=function(p,to){return _lm(p,to)&&quotaOK(p,to)&&sizeOK(p,to)}}
{const _ct=completeTransfer;completeTransfer=function(id,to,fee,o){let fr=null,p=null;try{fr=clubOf(id);p=pl(id);if(fr!==S.club&&to!==S.club&&p&&!quotaOK(p,to,true))return}catch(e){}
  const r=_ct.apply(this,arguments);
  try{const R=to!==S.club&&to>=0&&CLUBS[to]?sqrRule(to):null;if(sqrOn()&&R&&R.h&&p&&isFor(p,to)&&forCnt(to)>R.h){const w=sqrWeakFor(to,id);if(w&&w.id!==id)_ct(w.id,FA,0,{wage:w.wage})}}catch(e){console.error(e)}
  return r}}
// ---- 영입 관문: 사용자(제안 시트를 열 때 이유와 함께 막음) ----
{const _os=offerSheet;offerSheet=function(id){try{const p=pl(id);if(p&&clubOf(id)!==S.club){const R=sqrRule(S.club);
  if(!quotaOK(p,S.club)){sheet(`<button class="x" data-close>닫기</button><h3>${esc(p.name)}</h3><p class="note" style="margin:8px 0">${esc(LGN[sqrLg(S.club)]||'리그')} 규정상 1군 외국인은 ${R.h}명까지입니다(지금 ${forCnt(S.club)}명). 외국인 선수를 내보낸 뒤 제안할 수 있습니다.</p><button class="btn ghost" data-player="${id}" style="display:block;width:100%">선수 보기</button>`);return}
  if(!sizeOK(p,S.club)){sheet(`<button class="x" data-close>닫기</button><h3>${esc(p.name)}</h3><p class="note" style="margin:8px 0">1군은 ${SQMAX}명까지입니다(지금 ${sqSize(S.club)}명). 선수를 내보내거나 임대 보낸 뒤 제안할 수 있습니다.</p><button class="btn ghost" data-player="${id}" style="display:block;width:100%">선수 보기</button>`);return}}}catch(e){console.error(e)}return _os.apply(this,arguments)}}
// ---- 경기 명단 외국인 상한: 넘으면 가장 약한 외국인을 같은 포지션 자국 선수로 ----
function sqrAvail(p,c){return p&&!((S.ps[p.id]||{}).injD>0)&&!(p.ban>0)}
function sqrRepl(c,out,used){const sq=squadOf(c).filter(q=>!used.has(q.id)&&!isFor(q,c)&&sqrAvail(q,c));const g=out.g,ln=LINE[out.g];
  const pick=f=>sq.filter(f).sort((a,b)=>b.ovr-a.ovr)[0];return pick(q=>q.g===g)||pick(q=>LINE[q.g]===ln)||(g==='GK'?null:pick(q=>q.g!=='GK'))||null}
function sqrFix(c,xi,bench){const R=sqrRule(c);const sw=[];if(!sqrOn()||!R||!R.m||!xi)return sw;const used=new Set(xi.filter(Boolean).map(p=>p.id));/* QA 지적: 벤치 자국 선수도 선발 교체 후보로(벤치에서 빼고 올림) */
  let n=xi.filter(p=>p&&isFor(p,c)).length;
  while(n>R.m){let wi=-1;xi.forEach((p,i)=>{if(p&&isFor(p,c)&&(wi<0||p.ovr<xi[wi].ovr))wi=i});if(wi<0)break;const q=sqrRepl(c,xi[wi],used);if(!q)break;sw.push([xi[wi],q]);used.add(q.id);xi[wi]=q;n--;
    if(bench){const bi=bench.findIndex(b=>b.id===q.id);if(bi>=0)bench.splice(bi,1)}}
  if(bench)bench.forEach(b=>used.add(b.id));
  if(bench){let left=Math.max(0,R.m-n);for(let i=0;i<bench.length;i++){if(!isFor(bench[i],c))continue;if(left>0){left--;continue}const q=squadOf(c).filter(x=>!used.has(x.id)&&!isFor(x,c)&&sqrAvail(x,c)).sort((a,b)=>b.ovr-a.ovr)[0];
    if(q){used.add(q.id);bench[i]=q}else{bench.splice(i,1);i--}}}
  return sw}
{const _tf=teamFor;teamFor=function(c){const T=_tf(c);try{if(!T||!sqrOn()||!sqrRule(c))return T;const sc=typeof banScope==='function'?banScope(c):'lg';if(sc==='eu')return T;
  if(c===S.club){if(T.bench)sqrFix(c,T.xi.slice(),T.bench);return T}/* 우리 팀 선발은 경기 시작 때 맞춤(아래), 벤치만 여기서 */
  const xi=T.xi.slice(),bench=T.bench?T.bench.slice():null;const sw=sqrFix(c,xi,bench);if(sw.length||bench)return Object.assign({},T,{xi,bench:bench||T.bench})}catch(e){console.error(e)}return T}}
function sqrMyCheck(){const R=sqrRule(S.club);if(!sqrOn()||!R||!R.m||!S.xi)return null;const xi=S.xi.map(id=>id!=null?pl(id):null);const n=xi.filter(p=>p&&isFor(p,S.club)).length;return {n,m:R.m,xi}}
function sqrAutoFix(silent){const k=sqrMyCheck();if(!k||k.n<=k.m)return [];const sw=sqrFix(S.club,k.xi,null);if(sw.length){S.xi=k.xi.map(p=>p?p.id:null);SQC=null;
  if(!silent)toast(`외국인 한도(${k.m}명)에 맞춰 ${sw.map(([a,b])=>`${shortName(a.name)}→${shortName(b.name)}`).join(', ')}`)}return sw}
{const _sm=startMatch;startMatch=function(fx){try{if(fx&&!fx.eu&&(fx.h===S.club||fx.a===S.club)){const sw=sqrAutoFix(true);if(sw.length)inbox('news','',`외국인 출전 한도로 선발 조정`,`${LGN[sqrLg(S.club)]||'리그'} 규정(경기 명단 외국인 ${sqrRule(S.club).m}명)에 맞춰 ${sw.map(([a,b])=>`${a.name} 대신 ${b.name}`).join(', ')} 선발.`)}}catch(e){console.error(e)}return _sm.apply(this,arguments)}}
// ---- 화면: 전술 탭 카운터·자동 맞춤, 규정 안내, 감독 탭 켜기/끄기 ----
function sqrRuleTxt(c){const R=sqrRule(c);const a=[];if(R&&R.m)a.push(`경기 명단(선발+벤치) 외국인 ${R.m}명`);if(R&&R.h)a.push(`1군 외국인 보유 ${R.h}명`);a.push(`1군 최대 ${SQMAX}명`);return a.join(' · ')}
{const _tv=tacView;tacView=function(){const h=_tv.apply(this,arguments);try{if(!sqrOn()||!S||unemp())return h;const k=sqrMyCheck();const R=sqrRule(S.club);
  const box=`<div class="card pad" style="margin-bottom:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span class="note" style="margin:0;flex:1;min-width:160px">${esc(LGN[sqrLg(S.club)]||'리그')} 규정: ${sqrRuleTxt(S.club)}</span>${k?`<b class="num" style="color:${k.n>k.m?'var(--bad)':'var(--text)'}">선발 외국인 ${k.n}/${k.m}</b>${k.n>k.m?'<button class="chip" data-sqrfix="1">자동 맞춤</button>':''}`:''}${R&&R.h?`<span class="note" style="margin:0">보유 ${forCnt(S.club)}/${R.h}</span>`:''}</div>`;
  return box+h}catch(e){return h}}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-sqrfix],[data-sqron]');if(!b)return;e.preventDefault();e.stopPropagation();
  if(b.dataset.sqrfix){sqrAutoFix(false);save();render();return}if(!sqrCanToggle()){toast('규정 켜기·끄기는 시즌 첫 리그 경기 전에만 바꿀 수 있습니다');return}S.sqr=S.sqr===false?true:false;save();render();toast(S.sqr!==false?'현실 선수단 규정을 켰습니다(AI 구단 포함)':'현실 선수단 규정을 껐습니다(AI 구단 포함)')},true);
{const _cv=careerView;careerView=function(){let h=_cv();try{h+=`<h2>현실 선수단 규정</h2><div class="card pad"><p class="note" style="margin:0 0 8px">리그별 외국인 출전·보유 한도와 1군 최대 인원(${SQMAX}명). 영입 전에 막고, 경기 전에는 선발을 자동으로 맞춥니다. AI 구단에도 똑같이 적용됩니다. 처음 선수단은 그대로 인정합니다. 켜기·끄기는 시즌 첫 리그 경기 전에만 바꿀 수 있습니다.</p><button class="chip" data-sqron="1" aria-pressed="${S.sqr!==false}">${S.sqr!==false?'켜짐':'꺼짐'}</button></div>`}catch(e){}return h}}
// 리그 규정 안내: 그 리그 구단을 처음 맡았을 때 한 번
function sqrIntro(){try{if(!S||unemp()||!sqrOn())return;const lg=sqrLg(S.club);if(!lg)return;S.sqrSeen=S.sqrSeen||{};if(S.sqrSeen[lg])return;S.sqrSeen[lg]=1;
  inbox('news','',`${LGN[lg]||lg} 선수단 규정`,`${sqrRuleTxt(S.club)}. 전술 탭 위에서 현재 인원을 볼 수 있고, 넘으면 경기 전에 자동으로 맞춥니다. 감독 탭에서 끌 수 있습니다.`)}catch(e){}}
{const _sg=startGame;startGame=function(){const r=_sg.apply(this,arguments);sqrIntro();return r}}
{const _dl=devLoad;devLoad=function(){const r=_dl.apply(this,arguments);try{if(S&&!S.sqrSeen){S.sqrSeen={}}sqrIntro()}catch(e){}return r}}
