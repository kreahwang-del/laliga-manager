// ================= 저장 압축·대용량 저장(v67) =================
// 리그 확장으로 선수 상태(S.ps)가 1시즌 7MB 이상 → 브라우저 localStorage 한도(약 5MB) 초과 위험
//  1) 선수 세부 능력치(af 소수점)는 18개 항목을 2글자 36진수(0.05 단위) 문자열로, 반올림 능력치(q.pace 등)는 저장하지 않고 불러올 때 다시 계산
//  2) 저장 문자열이 크면 IndexedDB에 저장(용량 한도 큼), localStorage엔 표식만. 시작 시 IndexedDB 저장을 미리 읽어 둠
const SV_K=typeof DEV_KEYS!=='undefined'?DEV_KEYS:['pace','stamina','str','shoot','pass','drib','cross','fk','pen','offball','tackle','posit','comp','aerial','gk_save','gk_air','gk_sweep','gk_dist'];
function psPack(ps){const o={};for(const id in ps){const q=ps[id];if(!q)continue;const c={};for(const k in q){if(SV_K.includes(k)&&q.af)continue;c[k]=q[k]}
  if(q.af){c.af=SV_K.map(k=>{const v=q.af[k];return v==null?'--':Math.max(0,Math.min(1295,Math.round(v*20))).toString(36).padStart(2,'0')}).join('')}
  if(typeof c.ovrF==='number')c.ovrF=Math.round(c.ovrF*100)/100;o[id]=c}return o}
function psUnpack(ps){for(const id in ps){const q=ps[id];if(q&&typeof q.af==='string'){const s=q.af,af={};SV_K.forEach((k,i)=>{const t=s.substr(i*2,2);if(t!=='--'){af[k]=parseInt(t,36)/20;q[k]=Math.round(af[k])}});q.af=af}}return ps}
function svSerialize(){const ps=S.ps;S.ps=psPack(ps);try{return JSON.stringify(S)}finally{S.ps=ps}}
const IDB={db:null,cache:null,ready:false};
(function(){try{const r=indexedDB.open('laliga-manager',1);r.onupgradeneeded=()=>r.result.createObjectStore('s');r.onsuccess=()=>{IDB.db=r.result;try{const tx=IDB.db.transaction('s','readonly').objectStore('s').get(KEY);tx.onsuccess=()=>{IDB.cache=tx.result||null;IDB.ready=true;try{if(typeof render==='function'&&!S)render()}catch(e){}};tx.onerror=()=>{IDB.ready=true}}catch(e){IDB.ready=true}};r.onerror=()=>{IDB.ready=true}}catch(e){IDB.ready=true}})();
save=function(){try{const str=svSerialize();let ok=false;if(str.length<2e6){try{localStorage.setItem(KEY,str);ok=true}catch(e){}}
  if(!ok){IDB.cache=str;if(IDB.db){try{IDB.db.transaction('s','readwrite').objectStore('s').put(str,KEY)}catch(e){}}try{localStorage.setItem(KEY,JSON.stringify({v:3,idb:1,date:S.date,club:S.club}))}catch(e){}}}catch(e){console.error(e)}};
loadSave=function(){try{let raw=localStorage.getItem(KEY);if(!raw)return null;let s=JSON.parse(raw);if(s&&s.idb){if(!IDB.cache)return null;s=JSON.parse(IDB.cache)}if(s&&s.v===3){if(s.ps)psUnpack(s.ps);return s}}catch(e){console.error(e)}return null};
// ---- 저장 백업(v71): 파일로 내보내기·불러오기 (앱 재설치·기기 변경 대비) ----
function svExport(){try{const str=svSerialize();const name=`laliga-save-${S.date}-${(CLUBS[S.club]&&CLUBS[S.club].short)||'x'}.json`;
  if(window.AndroidApp&&AndroidApp.saveFile){const m=AndroidApp.saveFile(name,str);toast(m||'저장 파일을 내보냈습니다');return}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([str],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);toast('저장 파일을 내려받았습니다')}catch(e){console.error(e);toast('내보내기 실패')}}
function svImport(){const inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json,text/plain';inp.onchange=()=>{const f=inp.files&&inp.files[0];if(!f)return;const rd=new FileReader();
  rd.onload=()=>{try{const o=JSON.parse(rd.result);if(!o||o.v!==3||o.club==null||!o.date){toast('월드 풋볼매니저 저장 파일이 아닙니다');return}
    psUnpack(o.ps||{});S=o;save();toast(`불러오는 중… ${fmtD(o.date)}`);setTimeout(()=>location.reload(),1200)}catch(e){console.error(e);toast('파일을 읽지 못했습니다')}};rd.readAsText(f)};document.body.appendChild(inp);inp.click();setTimeout(()=>inp.remove(),60000)}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-sv]');if(!b)return;e.stopPropagation();if(b.dataset.sv==='exp')svExport();else svImport()},true);
const SV_BOX=()=>`<h2>저장 백업</h2><div class="card pad"><p class="note" style="margin:0 0 8px">앱을 지우거나 기기를 바꿀 때를 대비해 저장을 파일로 보관합니다. 앱에서는 '다운로드' 폴더에 저장됩니다.</p><div style="display:flex;gap:8px;flex-wrap:wrap">${S?'<button class="btn sm" data-sv="exp">저장 내보내기</button>':''}<button class="btn sm ghost" data-sv="imp">저장 파일 불러오기</button></div></div>`;
{const _cv=careerView;careerView=function(){return _cv()+SV_BOX()}}
{const _sv=startView;startView=function(){const h=_sv();const k=h.lastIndexOf('</main>');const box=`<h2>저장 파일 불러오기</h2><div class="card pad"><button class="btn sm ghost" data-sv="imp">백업 파일에서 이어하기</button></div>`;return k>0?h.slice(0,k)+box+h.slice(k):h+box}}

