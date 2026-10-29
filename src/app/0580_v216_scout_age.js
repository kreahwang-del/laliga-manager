/* ================= v216 스카우트 보고서 노후화 =================
   스카우트로 파악 단계가 오를 때 그 시점 능력치·날짜를 보고서로 저장하고, 화면엔 보고서 값을 보여줌(선수의 현재 실제 능력치가 아님).
   보고서는 KAGE일(약 6개월)마다 파악 단계가 1씩 내려가 범위가 넓어지고, 기본 수준(라리가 1·그 외 0)까지 내려가면 공개 추정치로 돌아감. 다시 스카우트하면 갱신 */
const KAGE=182;
function kDef(id){const c=CLUBS[clubOf(id)];return c&&c.lg==='ES'?1:0}
know=function(id){if(clubOf(id)===S.club)return 3;let k=S.know[id];const def=kDef(id);if(k===undefined)return def;S.kSnap=S.kSnap||{};let sn=S.kSnap[id];
  if(!sn||k>sn.lv){sn=S.kSnap[id]={lv:k,o:BASE[id]?pl(id).ovr:0,r:S.date,d:S.date};return k}
  if(k<sn.lv)sn.lv=k;
  const age=(D(S.date)-D(sn.d))/864e5;if(age>=KAGE&&k>def){const dec=Math.min(k-def,Math.floor(age/KAGE));k-=dec;S.know[id]=k;sn.lv=k;sn.d=addD(sn.d,dec*KAGE)}
  return k};
{const _ovs=ovrShown;ovrShown=function(p){const k=know(p.id);const sn=S.kSnap&&S.kSnap[p.id];if(clubOf(p.id)===S.club||!sn||k<=kDef(p.id))return _ovs(p);const base=sn.o||p.ovr;
  if(k>=3)return {t:String(base),cls:ovrCls(base)};const r=[7,4,2][k];const a=Math.round(hsh(p.id+'r'+k)*r*2);return {t:`${Math.max(40,base-a)}-${Math.min(99,base+2*r-a)}`,cls:'rng'}}}
function kAgeTxt(id){const sn=S.kSnap&&S.kSnap[id];if(!sn||clubOf(id)===S.club)return '';const m=Math.floor((D(S.date)-D(sn.r))/864e5/30.4);return m<1?'이번 달':m+'개월 전'}
/* 선수 화면: 스카우트 보고서 날짜·상태 */
{const _ps=playerSheet;playerSheet=function(id){const r=_ps.apply(this,arguments);try{const sn=S.kSnap&&S.kSnap[id];if(sn&&clubOf(id)!==S.club){const k=know(id),def=kDef(id);const sh=document.querySelector('.sheet');const h3=sh&&sh.querySelector('h3');
  if(h3&&!sh.querySelector('.ksnap')){const st=k>def?`파악 단계 ${k}/3 · 보고서 값 기준(현재 실제 능력과 다를 수 있음)`:'보고서가 오래돼 공개 추정치로 돌아감';
    h3.insertAdjacentHTML('afterend',`<div class="note ksnap" style="margin:4px 0 8px">스카우트 보고서 ${fmtD(sn.r)} (${kAgeTxt(id)}) · ${st}. 약 6개월마다 1단계씩 흐려집니다. 다시 스카우트하면 갱신됩니다.</div>`)}}}catch(e){console.error(e)}return r}}
/* 관심 목록: 보고서 나이는 둘째 줄에, 오래된 보고서는 '재스카우트 필요' */
{const _wv=watchView;watchView=function(){let h=_wv.apply(this,arguments);try{h=h.replace(/<button class="li" data-player="(\d+)">([\s\S]*?)<\/button>/g,(m,id,inner)=>{id=+id;const t=kAgeTxt(id);if(!t||S.scouts.some(s=>s.id===id))return m;const stale=know(id)<=kDef(id);
  let x=inner.replace('</span></span>',` · 보고 ${t}</span></span>`);if(stale)x=x.replace(/<span class="pill g">파악 완료<\/span>/,'')+'';if(stale&&!/재스카우트/.test(x))x=x.replace('<span class="ovr','<span class="pill r" style="white-space:nowrap">재스카우트</span><span class="ovr');return `<button class="li" data-player="${id}">${x}</button>`})}catch(e){console.error(e)}return h}}
