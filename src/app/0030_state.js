// ================= 상태 =================
let S=null;
const KEY='laliga-manager-v2';
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function loadSave(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.v===3)return s}catch(e){}return null}
// 선수 현재 정보 = 기본 + 변경분
function pl(id){const b=BASE[id],d=S.ps[id]||{};return Object.assign({},b,d,{id,cond:d.cnd??2,fit:d.fit??100})}
function setP(id,o){if('club' in o&&o.club>=0&&S.ps[id]&&S.ps[id].club!==undefined&&S.ps[id].club!==o.club)S.ps[id].tapps=0;S.ps[id]=Object.assign(S.ps[id]||{},o);if('club' in o)SQC=null}
const ageOf=(p,date)=>p.dob?Math.floor((D(date||S.date)-D(p.dob))/(365.25*864e5)):25;
let SQC=null;
function buildSQ(){SQC={};for(const id in BASE){const c=clubOf(+id);(SQC[c]=SQC[c]||[]).push(+id)}}
function squadOf(c){if(!SQC)buildSQ();return (SQC[c]||[]).map(pl)}
function sqSize(c){if(!SQC)buildSQ();return (SQC[c]||[]).length}
function clubOf(id){const p=S.ps[id];return p&&p.club!==undefined?p.club:BASE[id].club}
function know(id){if(clubOf(id)===S.club)return 3;const k=S.know[id];if(k!==undefined)return k;return CLUBS[clubOf(id)]&&CLUBS[clubOf(id)].lg==='ES'?1:0}

