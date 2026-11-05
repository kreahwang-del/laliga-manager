// ================= v293 '계속' 버튼(사용자 요청 2026-11-05) =================
// ① 너무 큼 → 가로 전체 폭(56px 높이) 대신 오른쪽 아래 작은 버튼(내용 폭, 최대 240px, 높이 46px)
// ② 전술·감독 탭에서 스크롤해도 안 사라짐(사용자 기기) → 창 스크롤 이벤트 외에 터치 이동 방향으로도 숨김/표시, 다시 그려질 때(render) 숨김 상태 유지
{const st=document.createElement('style');st.textContent='.go .in{justify-content:flex-end!important;padding:0 12px 8px!important}.go button{width:auto!important;max-width:240px;min-height:46px!important;padding:6px 18px!important;font-size:14px}.go button small{font-size:10.5px!important}';document.head.appendChild(st)}
{let hid=false,ty=null,acc=0;const set=h=>{hid=h;const g=document.querySelector('.go');if(g)g.classList.toggle('gohide',h)};
 addEventListener('touchstart',e=>{ty=e.touches&&e.touches[0]?e.touches[0].clientY:null;acc=0},{passive:true});
 addEventListener('touchmove',e=>{try{if(ty==null||!e.touches||!e.touches[0])return;const y=e.touches[0].clientY,dy=ty-y;ty=y;const end=innerHeight+scrollY>=document.documentElement.scrollHeight-24;if(end||scrollY<40){set(false);acc=0;return}acc=(acc>0)===(dy>0)?acc+dy:dy;if(acc>24)set(true);else if(acc<-12)set(false)}catch(err){}},{passive:true});
 addEventListener('scroll',()=>{try{const g=document.querySelector('.go');if(g)hid=g.classList.contains('gohide')}catch(e){}},{passive:true});
 const _r=render;render=function(){const r=_r.apply(this,arguments);try{if(hid&&scrollY>=40){const g=document.querySelector('.go');if(g)g.classList.add('gohide')}}catch(e){}return r}}
