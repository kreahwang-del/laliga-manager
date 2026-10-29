// ================= 대회별 경기 화면 테마(v100): 리그·컵·유럽대항전마다 배경·강조색, 3D 경기장 광고판도 같은 색 =================
// 실제 대회 대표색(로고 없이 색만): 챔스 남색·은청, 유로파 주황, 컨퍼런스 초록, 라리가 코랄 레드, EPL 보라·형광 초록, 세리에A 파랑, 분데스리가 빨강·흑회색, 리그1 남색·라임 옐로
// 국내 컵은 금색(트로피) 강조 + 해당 리그 배경. 2부는 1부 색을 낮춰 사용. 대표색을 정하지 않은 리그는 리그 코드로 색상환에서 고르게 배정
const MT_EU={UCL:{n:'챔피언스리그',a:'#9cc2ff',b:'#0a1747',a2:'#ffffff'},UEL:{n:'유로파리그',a:'#ff7a1a',b:'#2b1405',a2:'#ffb37a'},UECL:{n:'컨퍼런스리그',a:'#33e05a',b:'#05230d',a2:'#9df2ae'}};
const MT_LG={ES:{a:'#ff4b44',b:'#2b0b0f'},EN:{a:'#00ff85',b:'#2c0634'},IT:{a:'#2fa8ff',b:'#061b30'},DE:{a:'#ff2a3a',b:'#1c1c20'},FR:{a:'#d7e22b',b:'#0b1838'},
  PT:{a:'#3cc8ff',b:'#08203a'},NL:{a:'#ff8a1f',b:'#1f1408'},TR:{a:'#ff3b5c',b:'#26090f'},SC:{a:'#7f8cff',b:'#0f1230'},KR:{a:'#2ec4ff',b:'#06192a'},JP:{a:'#ff3d3d',b:'#220808'},US:{a:'#5aa9ff',b:'#0a1428'},BR:{a:'#ffd93d',b:'#06200f'},AR:{a:'#7ccfff',b:'#0b1a2c'},SA:{a:'#2fe08a',b:'#062016'},MX:{a:'#2fe0a0',b:'#06201a'}};
function mtHsl(h,s,l){s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1));const x=v=>Math.round(v*255).toString(16).padStart(2,'0');return '#'+x(f(0))+x(f(8))+x(f(4))}
function mtLg(lg){const base=(lg||'').replace(/2$/,'');let t=MT_LG[base];if(!t){const h=Math.floor(hsh('lgc'+base)*360);t={a:mtHsl(h,75,60),b:mtHsl(h,45,10)}}
  if(base!==lg)t={a:mtMix(t.a,'#9aa3ad',.35),b:mtMix(t.b,'#0e1218',.35)};return t}
function mtMix(c1,c2,w){const p=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));const a=p(c1),b=p(c2);return '#'+a.map((v,i)=>Math.round(v*(1-w)+b[i]*w).toString(16).padStart(2,'0')).join('')}
function mtLum(c){const v=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255).map(x=>x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4));return .2126*v[0]+.7152*v[1]+.0722*v[2]}
function mtLgName(lg){try{if(typeof LGN!=='undefined'&&LGN[lg])return LGN[lg]}catch(e){}const N={ES:'라리가',ES2:'라리가 2',EN:'프리미어리그',EN2:'챔피언십',IT:'세리에A',IT2:'세리에B',DE:'분데스리가',DE2:'2. 분데스리가',FR:'리그1',FR2:'리그2'};return N[lg]||lg}
function matchTheme(fx){if(!fx)return null;let t;
  if(fx.eu&&MT_EU[fx.eu])t={...MT_EU[fx.eu],k:'eu'};
  else if(fx.cup!=null){const L=mtLg(String(fx.cup));t={n:(typeof cupLabel==='function'?cupLabel(fx):'컵').split('·')[0].trim(),a:'#e7c35a',b:mtMix(L.b,'#2a2108',.45),a2:L.a,k:'cup'}}
  else if(fx.r||fx.po){const lg=CLUBS[fx.h]&&CLUBS[fx.h].lg;const L=mtLg(lg);t={n:mtLgName(lg)+(fx.po?' 승강 PO':''),a:L.a,b:L.b,a2:L.a,k:'lg'}}
  else return null;
  t.on=mtLum(t.a)>.35?'#0b0f14':'#ffffff';return t}
let MTH=null;
(function(){const s=document.createElement('style');s.textContent=`
#match.mth{background:linear-gradient(180deg,var(--mtb) 0%,color-mix(in srgb,var(--mtb) 45%,var(--bg)) 34%,var(--bg) 78%)}
#match.mth .board{border-bottom:2px solid var(--mta);padding-bottom:8px}
#match.mth .clock{color:var(--mta)}
#match.mth .mtbadge{display:flex;align-items:center;justify-content:center;gap:6px;margin:6px 0 2px;font:700 11px/1 sans-serif;letter-spacing:.06em;color:var(--mta);text-transform:uppercase}
#match.mth .mtbadge i{width:7px;height:7px;border-radius:50%;background:var(--mta);box-shadow:0 0 8px var(--mta)}
#match.mth .mctl .btn:not(.ghost){background:var(--mta);color:var(--mton);border-color:var(--mta)}
#match.mth .mctl .btn.ghost{border-color:color-mix(in srgb,var(--mta) 55%,transparent)}
#match.mth .mptab button[aria-pressed="true"]{background:var(--mta);color:var(--mton)}
#match.mth .mstats i,#match.mth .mstats .bar>i{background:var(--mta)}`;document.head.appendChild(s)})();
function mtApply(){const d=document.getElementById('match');if(!d||!M||!M.fx)return;const t=MTH=matchTheme(M.fx);if(!t)return;d.classList.add('mth');d.style.setProperty('--mta',t.a);d.style.setProperty('--mtb',t.b);d.style.setProperty('--mton',t.on);
  const inn=d.querySelector('.in');if(inn&&!inn.querySelector('.mtbadge'))inn.insertAdjacentHTML('afterbegin',`<div class="mtbadge"><i></i>${esc(t.n)}</div>`)}
{const _sm=startMatch;startMatch=function(fx){MTH=null;const r=_sm.apply(this,arguments);try{mtApply()}catch(e){console.error(e)}return r}}
// ---- 순위 표시(v104): 경기 화면 팀 이름 아래·전술 화면 다음 상대 배너에 리그 순위 ----
function lgRank(c){try{const lg=CLUBS[c]&&CLUBS[c].lg;if(!lg)return null;const fx=typeof fxLg==='function'?fxLg(lg):[];const T={};let any=0;
  for(const f of fx){if(!f.res||!f.res.sc)continue;any=1;[[f.h,0],[f.a,1]].forEach(([id,s])=>{const t=T[id]=T[id]||{id,pts:0,gd:0,gf:0,p:0};const g=f.res.sc[s],o=f.res.sc[1-s];t.p++;t.gf+=g;t.gd+=g-o;t.pts+=g>o?3:g===o?1:0})}
  if(!any)return null;fx.forEach(f=>{[f.h,f.a].forEach(id=>{if(!T[id])T[id]={id,pts:0,gd:0,gf:0,p:0}})});
  const L=Object.values(T).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);const i=L.findIndex(t=>t.id===c);return i<0?null:{r:i+1,n:L.length,pts:L[i].pts,lg}}catch(e){return null}}
function lgRankTxt(c,short){const k=lgRank(c);if(!k)return '';const lgn=typeof mtLgName==='function'?mtLgName(k.lg):k.lg;return short?`${k.r}위`:`${lgn} ${k.r}위 · ${k.pts}점`}
(function(){const s=document.createElement('style');s.textContent=`#match .board .team .mrk{display:block;font:600 11px/1.2 sans-serif;color:var(--muted);margin-top:2px}`;document.head.appendChild(s)})();
{const _sm=startMatch;startMatch=function(fx){const r=_sm.apply(this,arguments);try{const d=document.getElementById('match');if(d&&M&&M.fx){const ts=d.querySelectorAll('.board .team');[M.fx.h,M.fx.a].forEach((c,i)=>{const t=lgRankTxt(c);if(ts[i]&&t&&!ts[i].querySelector('.mrk'))ts[i].insertAdjacentHTML('beforeend',`<small class="mrk">${esc(t)}</small>`)})}}catch(e){console.error(e)}return r}}

