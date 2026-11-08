// ================= v299 업데이트 확인 버튼(사용자 요청 2026-11-06: 배포했는데 앱에 안 들어옴) =================
// 원인: APK(v258)는 앱으로 돌아올 때 '마지막 확인 뒤 10분이 지났을 때만' GitHub version.json을 확인 → 배포 직후 GitHub 캐시가 옛 버전을 주면 10분 동안 다시 안 봄
// 버튼: GitHub의 최신 버전 번호를 직접 확인. APK에 즉시 확인 기능(AndroidApp.checkUpdate, 다음 APK)이 있으면 바로 받기, 없으면 받는 방법 안내. 웹(아티팩트)은 새로고침
const UPD_RAW='https://raw.githubusercontent.com/kreahwang-del/laliga-manager/main/version.json';
function updCheck(){toast('최신 버전 확인 중…');const A=window.AndroidApp;
  if(A&&typeof A.checkUpdate==='function'){try{A.checkUpdate();return}catch(e){}}
  fetch(UPD_RAW+'?t='+Date.now(),{cache:'no-store'}).then(r=>r.json()).then(j=>{const v=+j.v,cur=typeof APPV!=='undefined'?+APPV:0;
    if(!(v>cur)){toast(`최신 버전입니다(v${cur})`);return}
    if(A){sheet(`<button class="x" data-close>닫기</button><h3>새 버전 v${v}</h3><p class="note" style="margin:8px 0">${esc(j.note||'')}</p><p class="note" style="margin:8px 0">지금 앱은 v${cur}입니다. 앱이 새 버전을 받으려면 <b>홈 화면으로 나갔다가 다시 들어오세요</b>. 앱은 마지막 확인 뒤 10분이 지나야 다시 확인하므로, 바로 안 되면 10분 뒤에 한 번 더 해 보세요. 위쪽에 '새 버전 준비 완료'가 뜨면 '지금 적용'을 누르면 됩니다.</p><p class="note" style="margin:8px 0;opacity:.7">다음 앱 설치 파일(APK)부터는 이 버튼으로 바로 받습니다.</p>`)}
    else{try{save()}catch(e){}toast(`새 버전 v${v} — 새로고침합니다`);setTimeout(()=>location.reload(),800)}})
  .catch(()=>toast('확인 실패(인터넷 연결 확인)'))}
{const _vt=verTag;verTag=function(){const h=_vt.apply(this,arguments);return h?h.replace('</p>',' · <button class="chip" data-updchk style="padding:2px 10px;font-size:12px">업데이트 확인</button></p>'):h}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-updchk]');if(!b)return;e.preventDefault();e.stopPropagation();updCheck()},true);
// v303 받은 소식 본문에 <br>·<b>가 글자로 보이던 문제(사용자 지적: 시장가치 재평가·선수단 비용·임대 리포트): 본문은 안전하게 이스케이프되는데 일부 메시지가 <br><b>로 작성됨
// → 모든 소식 카드(msgHTML 최종 결과)에서 이 두 태그만 되살리고, 본문의 줄바꿈(\n)도 표시
{const _mh=msgHTML;msgHTML=function(m){const h=_mh.apply(this,arguments);return typeof h==='string'?h.replace(/&lt;br\s*\/?&gt;/g,'<br>').replace(/&lt;(\/?)b&gt;/g,'<$1b>').replace(/<p>/g,'<p style="white-space:pre-line">'):h}}
// v304 프리시즌 친선경기 상대가 우리 팀 자신으로 잡히던 문제(사용자 지적: Sanfrecce vs Sanfrecce)
// 원인: 0100 친선 상대 = '라리가 아닌 구단' 아무나(라리가만 있던 시절 코드) → 다른 리그 감독은 자기 팀·같은 리그 팀이 뽑힘. 이직하면 옛 팀 기준 일정이 남기도 함
// → 우리 팀·같은 리그·2군·자유계약 제외하고 다시 고름. 새 시즌 일정과 기존 세이브(아직 안 치른 친선) 모두
function frOpp(i){const my=CLUBS[S.club];const ml=my?(typeof baseLg==='function'?baseLg(my.lg):my.lg):null;
  const L=CLUBS.filter(c=>c&&c.i!==S.club&&c.i!==FA&&c.i!==RET&&c.par==null&&(typeof baseLg==='function'?baseLg(c.lg):c.lg)!==ml&&!/^ES3/.test(c.lg));return L.length?L[Math.floor(hsh(S.season+'f'+i+S.club)*L.length)].i:null}
function frFix(){try{if(!S||!S.friendlies||typeof unemp==='function'&&unemp())return;const my=CLUBS[S.club];if(!my)return;const ml=typeof baseLg==='function'?baseLg(my.lg):my.lg;
  S.friendlies.forEach((f,i)=>{if(f.res)return;f.h=S.club;const o=CLUBS[f.a];if(!o||f.a===S.club||(typeof baseLg==='function'?baseLg(o.lg):o.lg)===ml){const n=frOpp(i);if(n!=null)f.a=n}})}catch(e){console.error(e)}}
{const _ns=newSeason;newSeason=function(){const r=_ns.apply(this,arguments);frFix();return r}}
{const _dl=devLoad;devLoad=function(){const r=_dl.apply(this,arguments);frFix();return r}}
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);frFix();return r}}
