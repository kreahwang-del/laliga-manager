/* 앱 뒤로가기(안드로이드 앱이 호출): 열린 창 닫기 → 경기 화면 유지 → 홈 탭 아니면 홈으로 → 홈이면 false(앱이 백그라운드로)
   v257: 예전에는 APK에 묶인 index.html에만 있어 GitHub 자동 업데이트본에서 빠져 있었음 → 게임 코드에 포함 */
window.appBack=function(){try{
 if(document.getElementById('scrim')){if(typeof M!=='undefined'&&M&&M.paused&&!M.done)return true;closeSheet();return true}
 if(document.getElementById('match'))return true;
 if(typeof UI!=='undefined'&&typeof S!=='undefined'&&S&&UI.tab&&UI.tab!=='home'){UI.tab='home';render();return true}
}catch(e){}return false};
