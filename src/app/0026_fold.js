/* v262 사용성 점검(UX Heuristics: 선택지 과다·긴 목록) — 긴 목록은 중요한 줄만 먼저 보이고 나머지는 '보기' 버튼으로 펼침. 정보·버튼은 그대로(접힘만) */
function foldRows(key,shown,hidden,label){UI.fold=UI.fold||{};const open=!!UI.fold[key];if(!hidden.length)return shown.join('');
  return shown.join('')+(open?hidden.join(''):'')+`<button class="li foldbtn" data-fold="${key}" aria-expanded="${open}"><span class="note" style="color:var(--amber);font-weight:700">${open?'접기 ▲':label+' ▼'}</span></button>`}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-fold]');if(!b)return;e.preventDefault();UI.fold=UI.fold||{};const k=b.dataset.fold;UI.fold[k]=!UI.fold[k];const y=scrollY;render();scrollTo(0,y)});
