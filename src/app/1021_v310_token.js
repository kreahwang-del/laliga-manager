// ================= v310 업데이트 토큰 입력(공개 노출 차단 준비, 사용자 결정 2026-11-23) =================
// 저장소를 비공개로 바꾸면 앱(APK v260+)이 업데이트를 받으려면 GitHub 읽기 전용 토큰이 필요 → 게임 '업데이트 확인' 옆 '토큰' 버튼으로 입력(앱 설정에만 저장, 세이브·화면에 남지 않음)
function tokSheet(){const A=window.AndroidApp;if(!A||typeof A.setToken!=='function'){toast('이 기능은 앱(APK v260 이상)에서만 씁니다');return}
  sheet(`<button class="x" data-close>닫기</button><h3>업데이트 토큰</h3><p class="note" style="margin:8px 0">저장소가 비공개라 앱이 새 버전을 받으려면 GitHub 읽기 전용 토큰이 필요합니다. 토큰은 이 기기 앱 설정에만 저장되고 게임 저장 파일에는 들어가지 않습니다.${A.hasToken&&A.hasToken()?' · 지금 저장된 토큰이 있습니다(새로 넣으면 바뀝니다).':''}</p>
  <input id="tokIn" type="password" autocomplete="off" placeholder="github_pat_…" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--line);background:var(--bg2);color:var(--fg);margin:6px 0">
  <div class="row2"><button class="btn" data-toksave>저장하고 업데이트 확인</button><button class="btn ghost" data-tokclear>토큰 지우기</button></div>`)}
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('[data-toksave],[data-tokclear],[data-tokopen]');if(!t)return;e.preventDefault();e.stopPropagation();const A=window.AndroidApp;
  if(t.dataset.tokopen!==undefined){tokSheet();return}
  if(!A||typeof A.setToken!=='function')return;
  if(t.dataset.tokclear!==undefined){A.setToken('');closeSheet();toast('토큰을 지웠습니다');return}
  const v=(document.getElementById('tokIn')||{}).value||'';if(v.trim().length<20){toast('토큰을 확인하세요');return}A.setToken(v.trim());closeSheet();toast('토큰 저장 — 업데이트를 확인합니다');try{A.checkUpdate()}catch(e2){}},true);
{const _vt=verTag;verTag=function(){const h=_vt.apply(this,arguments);const A=window.AndroidApp;if(!h||!A||typeof A.setToken!=='function')return h;return h.replace('</p>',' <button class="chip" data-tokopen style="padding:2px 10px;font-size:12px">토큰</button></p>')}}
// 토큰이 없을 때 비공개 저장소면 앱 배너가 '업데이트 토큰이 필요합니다'로 알려 줌(APK v260)
