// ================= v216: UI 정리·평점 보정 마이그레이션 =================
/* 기존 세이브: AI 팀 교체 출전(blk_mv)이 평점 없이 출전 수만 늘려 시즌 평균 평점이 깎여 있었음 → 이번 시즌 교체 출전 수(출전−선발)만큼 평균 수준 평점을 한 번 보충 */
{const _dl=devLoad;devLoad=function(){const r=_dl.apply(this,arguments);try{if(S&&S.ps&&!S.rsFix216&&S.club!=null){for(const id in S.ps){const q=S.ps[id];if(!q.apps)continue;if(clubOf(+id)===S.club)continue;const miss=Math.max(0,(q.apps||0)-(q.starts||0));if(!miss)continue;const avg=(q.rs||0)/q.apps;if(avg>=6)continue;q.rs=Math.round(((q.rs||0)+miss*6.35)*10)/10}S.rsFix216=1}}catch(e){console.error(e)}return r}}
{const st=document.createElement('style');st.textContent=`
.finebtn .go{position:static;left:auto;right:auto;bottom:auto;z-index:auto}
.oslot span{display:none}.oslot.on span{display:block}
.lbtn-nw{white-space:nowrap;writing-mode:horizontal-tb}
`;document.head.appendChild(st)}
/* 상대 점: 글자는 누를 때만 */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-fopen]');if(b){UI.fOpen=!UI.fOpen;render();e.stopPropagation()}},true);
/* 스쿼드 목록: 포지션은 2개까지만(3개면 계약 연도가 잘림) · 오른쪽 숫자 설명 */
{const _sv=squadView;squadView=function(){let h=_sv.apply(this,arguments);try{if(UI.sqv==='trn'||UI.sqv==='mgmt')return h;
  h=h.replace(/(<span class="sub2">)((?:<span class="ptag[^"]*">[^<]*<\/span>)+)/g,(m,a,tags)=>{const T=tags.match(/<span class="ptag[^"]*">[^<]*<\/span>/g)||[];return a+T.slice(0,2).join('')+(T.length>2?`<span class="ptag">+${T.length-2}</span>`:'')});
  h=h.replace('선수를 누르면 상세 정보, 재계약, 판매 설정을 할 수 있습니다.','오른쪽: 능력치 · 컨디션(화살표) · 체력%. 선수를 누르면 상세 정보, 재계약, 판매 설정을 할 수 있습니다.')}catch(e){console.error(e)}return h}}
/* 원본 데이터에서 잘린 구단 이름 보정(표시용) */
try{CLUBS.forEach(c=>{if(c&&c.name==='Racing Sant')c.name='Racing Santander'})}catch(e){}
