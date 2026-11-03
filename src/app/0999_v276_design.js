// ================= v276 디자인 정리(사용자 승인 2026-11-02 "A·B·C·D 다 바꿔보자", 디자인 디렉터·규칙 점검·플레이 흐름 에이전트 의견) =================
// 2D 경기장 이름 표시 축소(공 근처 3명만)는 사용자 보류로 제외
/* 구단 이름 줄임(헤더): 'Football Club'→'FC' 등 */
function clubDisp(n){if(!n)return n;let s=n.replace(/ Football Club$/,' FC').replace(/^Football Club /,'FC ').replace(/ Soccer Club$/,' SC').replace(/^Club Internacional de Fútbol /,'Inter ').replace(/^Club de Foot /,'CF ').replace(/^Club Atlético /,'Atlético ').replace(/^Real Club Deportivo /,'RCD ');return s}
/* 경기 후 '확인' 버튼에 다음 일정 */
function nextStepLbl(){try{const f=typeof nextFxAll==='function'?nextFxAll():myNext();if(!f)return '확인';const dd=Math.round((new Date(f.d)-new Date(S.date))/864e5);return dd<=0?'확인 · 다음 경기 오늘':dd===1?'확인 · 다음: 내일 경기':`확인 · 다음: 휴식 ${dd-1}일`}catch(e){return '확인'}}
/* 홈: 순위 미니표를 소식 위로, 스카우트 보고 묶기 */
{const _hv=homeView;homeView=function(){let h=_hv.apply(this,arguments);try{const a=h.indexOf('<h2>순위 · ');const ib=h.indexOf('<h2>받은 소식</h2>');if(a>ib&&ib>=0){const e=h.indexOf('</div></div>',a);let end=-1;{/* 순위 카드 끝: 다음 h2 또는 문자열 끝 */const nx=h.indexOf('<h2',a+5);end=nx>0?nx:h.length}const blk=h.slice(a,end);h=h.slice(0,a)+h.slice(end);h=h.slice(0,ib)+blk+h.slice(ib)}}catch(e){console.error(e)}return h}}
function dsScoutGroup(){try{const box=document.querySelector('.card.inbox');if(!box||box.dataset.sg)return;box.dataset.sg=1;const ms=[...box.querySelectorAll(':scope > .msg')].filter(m=>{const b=m.querySelector(':scope > b');return b&&/^스카우트 보고/.test(b.textContent)});if(ms.length<3)return;
  const open=!!(UI.fold&&UI.fold.scout);ms.forEach(m=>{m.classList.add('scg');if(!open)m.hidden=true});const b=document.createElement('button');b.className='foldbtn scgb';b.setAttribute('data-fold','scout');b.innerHTML=`<span>스카우트 보고 ${ms.length}건</span><span class="note" style="display:inline;margin-left:8px">${open?'접기 ▲':'펼치기 ▼'}</span>`;ms[0].before(b)}catch(e){console.error(e)}}
/* 리그 순위표 표시(구단명 줄임·승점 고정) */
function dsTables(){document.querySelectorAll('.tbl-wrap table').forEach(t=>{if(t.dataset.ds)return;const th=[...t.querySelectorAll('thead th')].map(x=>x.textContent.trim());if(th[1]==='구단'&&th.includes('경기')){t.dataset.ds=1;t.classList.add('lgt');t.querySelectorAll('tbody tr').forEach(r=>{const c=r.children[1];if(c){c.title=c.textContent.trim();const txt=c.childNodes;for(const n of txt)if(n.nodeType===3&&n.textContent.trim())n.textContent=clubDisp(n.textContent)}})}})}
/* 경기 하이라이트(3D 칩): 골을 앞에 */
{const _rb=r3Bar;r3Bar=function(){const r=_rb.apply(this,arguments);try{const bar=document.getElementById('r3dbar');if(bar&&M&&M.done){const first=bar.querySelector('[data-r3d]');const g=[...bar.querySelectorAll('[data-r3d]')].filter(b=>{const x=M.reps[+b.dataset.r3d];return x&&x.e.t==='goal'});g.forEach(b=>bar.insertBefore(b,first))}}catch(e){}return r}}
{const _r=render;render=function(){const o=_r.apply(this,arguments);try{dsScoutGroup();dsTables()}catch(e){}return o}}
{const st=document.createElement('style');st.textContent=`
/* B5 '계속': 탭바 위 고정 바, 본문이 가리지 않게 아래 여백 */
.go .in{justify-content:stretch;padding:0 12px 8px}.go button{width:100%;justify-content:space-between;min-height:56px;padding:8px 22px}
main.wrap{padding-bottom:calc(150px + env(safe-area-inset-bottom,0px))}
/* B6 순위표 */
table.lgt td:nth-child(2){max-width:40vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
table.lgt td:last-child,table.lgt th:last-child{font-weight:900;color:var(--text);position:sticky;right:0;background:var(--surf,#14161A)}
table.lgt td{padding-top:9px;padding-bottom:9px}
/* B7 경기 화면 강조색: 리그 색은 배지·점수판 테두리에만, 버튼·선택 탭은 앰버 */
#match.mth .mctl .btn:not(.ghost),#match .mctl .btn:not(.ghost),#mct .btn:not(.ghost){background:var(--amber);color:var(--amber-ink);border-color:var(--amber)}
#match.mth .mptab button[aria-pressed="true"],#match .mptab button[aria-pressed="true"]{background:var(--amber);color:var(--amber-ink);border-color:var(--amber)}
/* C12 경기 하단 버튼 5개: 글자 줄이고 비율 조정, 아이콘 */
.mctl:has(>[data-act="ffdec"]){display:grid!important;grid-template-columns:.95fr .75fr 1.2fr 1fr 1.15fr;gap:5px}
.mctl:has(>[data-act="ffdec"]) .btn{font-size:12.5px;letter-spacing:0;padding:11px 2px;white-space:nowrap;display:flex;align-items:center;justify-content:center;gap:3px;min-height:44px}
.mctl .btn .ic{flex:none}
/* B8 누르는 영역 44px(겉모양은 그대로, 보이지 않는 영역만 넓힘) */
.chip,.btn.sm,.mptab button,[data-elg],[data-tt],.seg button{position:relative}
.chip::after,.btn.sm::after,.mptab button::after,[data-elg]::after,[data-tt]::after{content:'';position:absolute;left:0;right:0;top:50%;height:44px;min-height:100%;transform:translateY(-50%)}
.pst td[data-lana]{cursor:pointer}
/* B9 작은 글자 11px 이상 */
.slot .sl{font-size:11px}.mbadge{font-size:11px}.mrk{font-size:11px}
#match .board small,#match .board .ab{font-size:11px}
/* B10 헤더 구단명 */
header.top h1{font-size:clamp(20px,6.4vw,28px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:56vw}
/* C13 스카우트 묶음 */
.scgb{justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--line);color:var(--text);font-weight:700;font-size:14px}
/* D 숫자 정렬 */
table td,.pst td,.num{font-variant-numeric:tabular-nums}
/* 하프타임 등 결정 창이 열려 있으면 알림은 위쪽에 */
body:has(#scrim) .toast{top:calc(12px + env(safe-area-inset-top,0px));bottom:auto}
`;document.head.appendChild(st)}
/* v277 사용자 지적: 아래 '계속' 바가 스크롤 중 글자를 가림 → 아래로 내리면 숨기고, 위로 올리거나 페이지 끝에 닿으면 다시 보임 */
{let ly=0,acc=0;addEventListener('scroll',()=>{try{const g=document.querySelector('.go');if(!g)return;const y=scrollY,dy=y-ly;ly=y;const end=innerHeight+y>=document.documentElement.scrollHeight-24;
  if(end||y<40){g.classList.remove('gohide');acc=0;return}acc=(acc>0)===(dy>0)?acc+dy:dy;if(acc>24)g.classList.add('gohide');else if(acc<-12)g.classList.remove('gohide')}catch(e){}},{passive:true});
 const st=document.createElement('style');st.textContent='.go{transition:transform .22s ease}.go.gohide{transform:translateY(calc(100% + 70px))}@media (prefers-reduced-motion:reduce){.go{transition:none}}';document.head.appendChild(st)}
/* v280 사용자 요청: 홈 경기 전 브리핑(수석코치·피지컬·분석관·상대 분석·상대 감독) 카드가 길어 한 화면에 안 들어옴 → 한 줄씩 요약해 한 카드로, 누르면 전체 내용 팝업 */
let BP_FULL='';
{const _bs=bpStaff;bpStaff=function(pr){const h=_bs.apply(this,arguments);try{if(!h)return h;const t=document.createElement('div');t.innerHTML=h;const box=t.querySelector('.bpstaff');if(!box)return h;BP_FULL=box.outerHTML;
  const rows=[...box.children].map(d=>{const w=(d.querySelector('small')||{}).textContent||'';const p=d.querySelector('p');let s=p?p.innerHTML.split(/<br\s*\/?>/i)[0]:'';if(w==='상대 분석'&&p){const L=p.innerHTML.split(/<br\s*\/?>/i).map(x=>{const t=x.replace(/<[^>]+>/g,'');const b=(x.match(/<b>([^<]*)<\/b>/)||[])[1]||'';if(/바꿀 가능성/.test(t))return `맞춤 전술 ${b}`;if(/전담 마크/.test(t))return `${t.split(' 전담')[0]} 마크 ${b}`;if(/연구 중/.test(t))return `연구 ${b}`;if(/기울어/.test(t)){const m=t.match(/'([^']+)' 쪽으로 (\d+)%/);return m?`${m[1]} ${m[2]}%`:''}if(/강한 상성/.test(t))return '상대가 상성 우위';return ''}).filter(Boolean);if(L.length)s=L.join(' · ')}return `<div class="r"><small>${w}</small><span>${s}</span></div>`}).join('');
  return `<div class="bpstaff bpc" data-bpsheet="1" role="button" tabindex="0" aria-label="경기 전 브리핑 자세히 보기"><div class="bph"><b>경기 전 브리핑</b><span>자세히 ›</span></div>${rows}</div>`}catch(e){return h}}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-bpsheet]');if(!b)return;e.preventDefault();sheet(`<button class="x" data-close>닫기</button><h3>경기 전 브리핑</h3>${BP_FULL}`)},true);
{const st=document.createElement('style');st.textContent=`.bpc{display:block;background:rgba(255,255,255,.035);border-left:3px solid var(--amber);padding:8px 12px;cursor:pointer}
.bpc>div{background:none;border-left:0;padding:0}.bpc>.r{display:grid;grid-template-columns:64px 1fr;gap:8px;align-items:baseline;padding:4px 0;border-top:1px solid rgba(255,255,255,.05)}.bpc>.r:first-of-type{border-top:0}
.bpc>.r small{font-size:11px;font-weight:900;letter-spacing:.02em;color:var(--amber);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bpc>.r span{font-size:13px;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bpc .bph{display:flex;justify-content:space-between;align-items:center;margin-bottom:2px}.bpc .bph b{font-size:13px}.bpc .bph span{font-size:12px;color:var(--muted);font-weight:700}
#scrim .bpstaff:not(.bpc){margin-top:4px}`;document.head.appendChild(st)}
