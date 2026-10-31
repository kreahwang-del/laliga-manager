// ================= v170 홈앤어웨이 합산 스코어 표기: 2차전 중계 점수판·경기 리포트·홈 다음 경기 카드 =================
function legFirst(f){try{if(!f||f.leg!==2)return null;let t=null;if(f.eu&&S.eu&&S.eu.comp&&S.eu.comp[f.eu]&&f.ko!=null){const C=S.eu.comp[f.eu];t=C.ko&&C.ko[f.ko]&&C.ko[f.ko].ties[f.ti]}else if(f.cup!=null&&typeof cupTie==='function')t=cupTie(f);
  const l1=t&&t.f&&t.f[0];return l1&&l1!==f&&l1.res?l1:null}catch(e){return null}}
function aggOf(f,sc){const l1=legFirst(f);if(!l1)return null;const g=c=>l1.h===c?l1.res.sc[0]:l1.res.sc[1];return [g(f.h)+(sc?sc[0]:0),g(f.a)+(sc?sc[1]:0),l1]}
function aggTxt(f,sc){const a=aggOf(f,sc);if(!a)return '';return `합계 ${CLUBS[f.h].short} ${a[0]}-${a[1]} ${CLUBS[f.a].short}`}
{const _ub=updateBoard;updateBoard=function(){const r=_ub.apply(this,arguments);try{if(!M||!M.fx||M.fx.leg!==2)return r;const el=$('#msc');if(!el)return r;const m=el.textContent.match(/(\d+)\s*:\s*(\d+)/);const sc=m?[+m[1],+m[2]]:[0,0];
  let ag=$('#magg');if(!ag){ag=document.createElement('div');ag.id='magg';ag.className='note';ag.style.cssText='margin:2px 0 0;font-size:12px;text-align:center;color:var(--amber);font-weight:700';const ck=$('#mck');if(ck)ck.insertAdjacentElement('afterend',ag)}
  const a=aggOf(M.fx,sc);ag.textContent=a?`합계 ${a[0]} : ${a[1]} · 1차전 ${CLUBS[a[2].h].short} ${a[2].res.sc[0]}-${a[2].res.sc[1]} ${CLUBS[a[2].a].short}`:''}catch(e){}return r}}
{const _br=buildReport;buildReport=function(res,me,fx){const R=_br.apply(this,arguments);try{if(fx&&fx.leg===2){const t=aggTxt(fx,res.sc);if(t)R.agg=t}}catch(e){}return R}}
{const _rh=reportHTML;reportHTML=function(R){let h=_rh.apply(this,arguments);try{if(R&&R.agg)h=`<div class="banner closed" style="margin:0 0 8px;justify-content:center"><b style="color:var(--amber)">${esc(R.agg)}</b></div>`+h}catch(e){}return h}}
{const _hv=homeView;homeView=function(){let h=_hv.apply(this,arguments);try{const mn=myNext(),cn=typeof cupNextMine==='function'?cupNextMine():null;const up=[mn,cn].filter(Boolean).sort((a,b)=>a.d<b.d?-1:1)[0];
  if(up&&up.leg===2){const l1=legFirst(up);if(l1){const mk='<!--hintmk-->';/* v267: v262에서 '계속' 안내를 첫 경기 전에만 보이게 바꾼 뒤 이 자리표가 사라져 최근 5경기(·1차전 결과)가 안 보였음 → 항상 남는 표식 사용 */const i=h.indexOf(mk);const row=`<div class="note" style="text-align:center;margin:4px 0;color:var(--amber);font-weight:700">2차전 · 1차전 ${esc(CLUBS[l1.h].short)} ${l1.res.sc[0]}-${l1.res.sc[1]} ${esc(CLUBS[l1.a].short)}</div>`;if(i>=0)h=h.slice(0,i)+row+h.slice(i)}}}catch(e){console.error(e)}return h}}

