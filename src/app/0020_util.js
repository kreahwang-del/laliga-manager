// ================= 유틸 =================
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function hsh(s){let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0)/4294967295}
let RSEED=1;function rnd(){RSEED=(RSEED*1664525+1013904223)>>>0;return RSEED/4294967296}
let money=v=>{v=+v||0;const a=Math.abs(v);return (v<0?'-':'')+(a>=1e8?`€${(a/1e6).toFixed(0)}M`:a>=1e6?`€${(a/1e6).toFixed(1)}M`:`€${Math.round(a/1e3)}K`)};
let mM=m=>`€${(+m).toFixed(m>=100?0:1)}M`;
const D=s=>new Date(s+'T12:00:00Z');
const iso=d=>d.toISOString().slice(0,10);
const addD=(s,n)=>{const d=D(s);d.setUTCDate(d.getUTCDate()+n);return iso(d)};
const fmtD=s=>{const d=D(s);return `${d.getUTCFullYear()}.${d.getUTCMonth()+1}.${d.getUTCDate()}`};
const daysBetween=(a,b)=>Math.round((D(b)-D(a))/864e5);
const IMG={on:(()=>{try{return localStorage.getItem('lm-img')!=='0'}catch(e){return true}})()};
const clubLogo=(c,big)=>c>=0&&CLUBS[c]&&CLUBS[c].tm?`https://tmssl.akamaized.net/images/wappen/${big?'big':'head'}/${CLUBS[c].tm}.png`:null;
const lgLogo=k=>G.lgTm&&G.lgTm[k]?`https://tmssl.akamaized.net/images/logo/header/${G.lgTm[k].toLowerCase()}.png`:null;
const faceUrl=(p,med)=>p&&p.img?`https://img.a.transfermarkt.technology/portrait/${med?'medium':'header'}/${/\.(jpg|png)$/.test(p.img)?p.img:p.img+'.jpg'}?lm=1`:null;
function avatar(p,cls=''){const u=IMG.on&&faceUrl(p,cls==='lg');return `<span class="av ${cls}">${u?`<img src="${u}" loading="lazy" alt="" onerror="this.remove()">`:''}<b>${esc(String(p&&p.name||'?').replace(/^\S+\s+/,'')[0]||'?')}</b></span>`}
function crest(c,cls=''){const [a,b,ink]=clubCol(c);const u=IMG.on&&clubLogo(c);return `<span class="crest ${cls}${u?' img':''}" style="background:linear-gradient(135deg,${a} 50%,${b} 50%);color:${ink||'#fff'}">${u?`<img src="${u}" loading="lazy" alt="" onerror="this.parentNode.classList.remove('img');this.remove()">`:''}<b>${CLUBS[c].short}</b></span>`}
const shortName=n=>{const w=n.split(' ');const l=w[w.length-1];if(w.length>1&&['Júnior','Junior','Jr.'].includes(l))return w[0];const pre=(w[w.length-2]||'').toLowerCase();return w.length>2&&['de','van','ter','da','di','dos'].includes(pre)?w[w.length-2]+' '+l:l};
const ovrCls=o=>o>=85?'hi':o>=75?'':'lo';
function toast(t){const o=$('.toast');if(o)o.remove();const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2800)}
const GN={GK:'골키퍼',CB:'센터백',FB:'풀백',DM:'수비형 MF',CM:'중앙 MF',AM:'공격형 MF',W:'윙어',ST:'스트라이커'};
const AN={shoot:'슈팅',pass:'패스',drib:'드리블',cross:'크로스',tackle:'태클',posit:'위치선정',offball:'침투',aerial:'공중볼',pace:'속도',stamina:'체력',gk_save:'선방',gk_air:'공중장악',gk_sweep:'스위핑',gk_dist:'배급'};
const OUTA=['shoot','pass','drib','cross','tackle','posit','offball','aerial','pace','stamina'],GKA=['gk_save','gk_air','gk_sweep','gk_dist','pass','stamina'];

