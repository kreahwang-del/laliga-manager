// ================= v156: 선수 관계(호흡) =================
// 사용자 선택: 보여주기 + 시너지, 사생활 관계는 넣지 않음(실존 선수 사생활을 지어내지 않음), 표시 위치 = 전술 화면 선·선수 화면·경기 리포트
// 호흡(0~100) = 기본 30 + 같은 국적 12 / 같은 언어권 6 + 함께 뛴 시간 최대 35(1-e^(-분/1500)) + 패스 주고받기 최대 10(1-e^(-패스/150)) + 2대1·합작 골 최대 5
// 게임 시작(또는 이 기능이 처음 켜질 때) 우리 팀에 있던 선수끼리는 이미 손발을 맞춘 사이로 보고 함께 뛴 시간 1800분에서 출발, 이후 영입 선수는 0분에서 출발
// 시너지(엔진 chemK .15): 호흡 55를 기준으로 -1~1 → 두 선수 사이 패스가 빗나갈 확률을 최대 15% 줄이거나 늘림(성공률로 약 ±2%p). v157부터 AI 팀도 같은 팀에서 보낸 기간으로 추정한 호흡 적용
const REL_LANG={ES:'ESP ARG URU COL MEX CHI PER VEN ECU PAR BOL CRC HON GUA SLV PAN CUB DOM PUR NCA EQG',PT:'POR BRA ANG MOZ CPV GNB STP',FR:'FRA SEN CIV CMR MLI GUI BFA COD CGO GAB TOG BEN NIG ALG MAR TUN HAI MAD COM MTN CTA',EN:'ENG SCO WAL NIR IRL USA CAN AUS NZL NGA GHA JAM GAM SLE LBR ZAM ZIM RSA',DE:'GER AUT',IT:'ITA SMR',NL:'NED SUR'};
const REL_LG={};for(const k in REL_LANG)REL_LANG[k].split(' ').forEach(c=>REL_LG[c]=k);
function relKey(a,b){a=String(a);b=String(b);return a<b?a+'-'+b:b+'-'+a}
function relInit(){if(!S||S.club==null||S.club<0)return;if(!S.rel){S.rel={};const ids=squadOf(S.club).map(p=>p.id);for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)S.rel[relKey(ids[i],ids[j])]={m:1800,p:0,w:0,sw:0,g:0}}}
function relGet(a,b){return (S.rel&&S.rel[relKey(a,b)])||null}
function relScore(a,b){const pa=pl(a),pb=pl(b);if(!pa||!pb)return 30;const r=relGet(a,b)||{m:0,p:0,w:0,g:0};let c=30;
  if(pa.nat&&pa.nat===pb.nat)c+=12;else if(REL_LG[pa.nat]&&REL_LG[pa.nat]===REL_LG[pb.nat])c+=6;
  c+=35*(1-Math.exp(-(r.m||0)/1500))+10*(1-Math.exp(-(r.p||0)/150))+5*(1-Math.exp(-((r.w||0)+3*(r.g||0))/10));return Math.round(c)}
function relWhy(a,b){const pa=pl(a),pb=pl(b),r=relGet(a,b)||{};const w=[];if(pa&&pb&&pa.nat&&pa.nat===pb.nat)w.push('같은 국적');else if(pa&&pb&&REL_LG[pa.nat]&&REL_LG[pa.nat]===REL_LG[pb.nat])w.push('같은 언어권');
  if(r.m)w.push(`함께 ${Math.round(r.m)}분`);if(r.p)w.push(`패스 ${r.p}회`);if(r.w)w.push(`2대1 ${r.w}회`);if(r.g)w.push(`합작 골 ${r.g}`);if(r.sw)w.push(`위치 스위칭 ${r.sw}회`);return w.join(' · ')}
function relCv(a,b){return Math.max(-1,Math.min(1,(relScore(a,b)-55)/35))}
function relLbl(c){return c>=75?'찰떡':c>=62?'좋음':c>=48?'보통':c>=38?'어색':'낯섦'}
function relCol(c){return c>=62?'var(--good)':c>=48?'var(--muted)':'var(--bad)'}
// 엔진에 호흡 전달(우리 팀만)
{const _tf=teamFor;teamFor=function(c){const T=_tf.apply(this,arguments);try{if(T&&S&&c===S.club&&c>=0){relInit();const ids=T.xi.concat(T.bench||[]).filter(Boolean).map(p=>p.id);const ch={};
  for(const a of ids){ch[a]={};for(const b of ids)if(a!==b)ch[a][b]=+relCv(a,b).toFixed(3)}T.chem=ch}}catch(e){console.error(e)}return T}}
// 경기 뒤 기록: 함께 뛴 시간·패스·2대1·위치 스위칭·합작 골
{const _am=applyMatch;applyMatch=function(H,Aw,res,counts){const r=_am.apply(this,arguments);try{if(S&&res&&res.iv&&(H.club===S.club||Aw.club===S.club)){relInit();const s=H.club===S.club?0:1,T=s?Aw:H;
  const all=T.xi.concat((res.subs&&res.subs[s]||[]).map(x=>x.out),(res.subs&&res.subs[s]||[]).map(x=>x.inP)).filter(Boolean);const ids=[...new Set(all.map(p=>p.id))].filter(id=>clubOf(id)===S.club);const byName={};all.forEach(p=>byName[p.name]=p.id);
  const R=k=>S.rel[k]||(S.rel[k]={m:0,p:0,w:0,sw:0,g:0});
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const a=res.iv[ids[i]],b=res.iv[ids[j]];if(!a||!b)continue;const ov=Math.min(a[1],b[1])-Math.max(a[0],b[0]);if(ov>0)R(relKey(ids[i],ids[j])).m+=ov}
  const has=new Set(ids.map(String));
  for(const k in res.pp||{}){const [a,b]=k.split('>');if(has.has(a)&&has.has(b))R(relKey(a,b)).p+=res.pp[k]}
  for(const k in res.wp||{}){const [a,b]=k.split('-');if(has.has(a)&&has.has(b))R(relKey(a,b)).w+=res.wp[k]}
  for(const k in res.swp||{}){const [a,b]=k.split('-');if(has.has(a)&&has.has(b))R(relKey(a,b)).sw+=res.swp[k]}
  (res.ev||[]).forEach(e=>{if(e.t==='goal'&&e.s===s&&e.a&&byName[e.a]&&byName[e.p])R(relKey(byName[e.a],byName[e.p])).g++})}}catch(e){console.error(e)}return r}}
// 시즌 전환: 팀을 떠난 선수의 관계 정리(저장 용량)
{const _ro=rollover;rollover=function(){const r=_ro.apply(this,arguments);try{if(S&&S.rel&&S.club>=0){for(const k in S.rel){const [a,b]=k.split('-');if(clubOf(+a)!==S.club||clubOf(+b)!==S.club)delete S.rel[k]}}}catch(e){console.error(e)}return r}}
// 감독 이직: 새 팀 선수끼리는 이미 손발을 맞춘 사이로 다시 시작
if(typeof moveTo==='function'){const _mt=moveTo;moveTo=function(){const r=_mt.apply(this,arguments);try{if(S){S.rel=null;relInit()}}catch(e){}return r}}
// ---- 화면 1: 전술 화면 포메이션 위 호흡 선 ----
TAC.chemOn=TAC.chemOn??false;
{const _tv=tacView;tacView=function(){let h=_tv.apply(this,arguments);try{if(TAC.phase==='sp')return h;
  h=h.replace('<button class="chip" data-tsets>전술 저장·불러오기</button>',`<button class="chip" data-tsets>전술 저장·불러오기</button><button class="chip" data-chem aria-pressed="${!!TAC.chemOn}">호흡 선</button>`);
  if(TAC.chemOn&&S.xi){relInit();const ph=TAC.phase,xi=S.xi;/* v210 화면에 그려진 선수 위치(공격·수비 탭은 슬라이더 공 위치·겹침 풀기 반영)로 선을 그림 — 이전엔 기준 위치로 그려 선수와 선이 따로 놀았음 */const co=(typeof hzOn==='function'&&hzOn()&&typeof hzLayout==='function')?hzLayout(ph).disp:coordsOf(ph);const L=[];
    for(let i=0;i<xi.length;i++)for(let j=i+1;j<xi.length;j++){if(xi[i]==null||xi[j]==null)continue;const d=Math.hypot(co[i][0]-co[j][0],(co[i][1]-co[j][1])*1.3);if(d>34)continue;const c=relScore(xi[i],xi[j]);L.push([i,j,c])}
    const svg=`<svg class="chemlines" viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none">${L.map(([i,j,c])=>`<line data-ci="${i}" data-cj="${j}" x1="${co[i][0]}" y1="${co[i][1]}" x2="${co[j][0]}" y2="${co[j][1]}" stroke="${c>=62?'#4CB782':c>=48?'#ffffff':'#E0685A'}" stroke-width="${c>=75?3.5:c>=62?2.4:c>=48?1.2:1.8}" ${c<48?'stroke-dasharray="5 4"':''} stroke-linecap="round" opacity="${c>=48&&c<62?.35:.9}" vector-effect="non-scaling-stroke"/>`).join('')}</svg>`;
    h=h.replace('<div class="zones" id="zones"',svg+'<div class="zones" id="zones"');
    h=h.replace('<div class="legend">',`<div class="note" style="margin:6px 0 0">호흡 선: <b style="color:var(--good)">초록</b> 호흡 좋음(굵을수록 찰떡) · 흐린 흰색 보통 · <b style="color:var(--bad)">빨간 점선</b> 아직 어색함(새로 합류·함께 뛴 시간이 적음). 가까운 자리끼리만 표시. 호흡이 좋은 두 선수 사이의 패스는 덜 빗나갑니다.</div><div class="legend">`)}}catch(e){console.error(e)}return h}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-chem]');if(!b)return;TAC.chemOn=!TAC.chemOn;render()},true);
// ---- 화면 2: 선수 화면에 호흡 좋은 동료·자주 패스하는 동료 ----
{const _ps=playerSheet;playerSheet=function(id){const r=_ps.apply(this,arguments);try{if(!S||clubOf(id)!==S.club)return r;relInit();const sh=document.querySelector('#scrim .sheet');if(!sh)return r;
  const mates=squadOf(S.club).filter(p=>p.id!==id).map(p=>({p,c:relScore(id,p.id),r:relGet(id,p.id)||{}}));if(!mates.length)return r;
  const top=mates.slice().sort((a,b)=>b.c-a.c).slice(0,3),low=mates.filter(x=>x.c<45).sort((a,b)=>a.c-b.c).slice(0,2),pas=mates.filter(x=>x.r.p).sort((a,b)=>b.r.p-a.r.p).slice(0,3);
  const row=x=>`<div class="li" style="padding:6px 0"><span class="nm"><b>${esc(x.p.name)}</b><span>${esc(relWhy(id,x.p.id)||'기록 없음')}</span></span><span class="num" style="color:${relCol(x.c)};font-weight:700">${x.c} <small style="font-weight:400">${relLbl(x.c)}</small></span></div>`;
  const div=document.createElement('div');div.className='card pad';div.style.marginTop='10px';
  div.innerHTML=`<div class="lbl">호흡</div>${top.map(row).join('')}${low.length?`<div class="note" style="margin:6px 0 2px">아직 어색한 동료</div>${low.map(row).join('')}`:''}${pas.length?`<div class="note" style="margin:6px 0 2px">패스를 가장 많이 주고받은 동료</div><div class="note" style="margin:0">${pas.map(x=>`${esc(x.p.name)} ${x.r.p}회`).join(' · ')}</div>`:''}<p class="note" style="margin:6px 0 0">함께 뛴 시간·국적/언어·패스·2대1·합작 골로 정해지고, 높을수록 두 선수 사이 패스가 덜 빗나갑니다.</p>`;
  sh.appendChild(div)}catch(e){console.error(e)}return r}}
// ---- 화면 3: 경기 리포트에 패스 연결·위치 스위칭 ----
{const _br=buildReport;buildReport=function(res,me,fx){const R=_br.apply(this,arguments);try{if(res&&res.pp&&res.T){const T=res.T[me];const all=T.xi.concat((res.subs&&res.subs[me]||[]).map(x=>x.inP),(res.subs&&res.subs[me]||[]).map(x=>x.out)).filter(Boolean);const nm={};all.forEach(p=>nm[p.id]=p.name);
  const pair={};for(const k in res.pp){const [a,b]=k.split('>');if(!nm[a]||!nm[b])continue;const q=relKey(a,b);pair[q]=(pair[q]||0)+res.pp[k]}
  R.rel={pp:Object.entries(pair).sort((x,y)=>y[1]-x[1]).slice(0,5).map(([k,n])=>{const [a,b]=k.split('-');return [nm[a],nm[b],n]}),
    sw:Object.entries(res.swp||{}).filter(([k])=>k.split('-').every(i=>nm[i])).sort((x,y)=>y[1]-x[1]).slice(0,3).map(([k,n])=>{const [a,b]=k.split('-');return [nm[a],nm[b],n]})}}}catch(e){console.error(e)}return R}}
{const _rh=reportHTML;reportHTML=function(R){let h=_rh.apply(this,arguments);try{if(R&&R.rel&&(R.rel.pp.length||R.rel.sw.length)){const sn=n=>esc(typeof shortN==='function'?shortN(n):n);
  h+=`<div class="card pad" style="margin-top:10px"><div class="lbl">패스 연결 상위</div>${R.rel.pp.map(([a,b,n])=>`<div class="li" style="padding:4px 0"><span class="nm"><b>${sn(a)} ↔ ${sn(b)}</b></span><span class="num">${n}회</span></div>`).join('')||'<div class="note">기록 없음</div>'}
  ${R.rel.sw.length?`<div class="lbl" style="margin-top:8px">위치 스위칭</div>${R.rel.sw.map(([a,b,n])=>`<div class="li" style="padding:4px 0"><span class="nm"><b>${sn(a)} ⇄ ${sn(b)}</b><span>자리를 바꿔 4초 이상 유지</span></span><span class="num">${n}회</span></div>`).join('')}`:''}</div>`}}catch(e){console.error(e)}return h}}
// ---- v157: AI 팀 호흡 — 경기 기록 없이 같은 팀에서 보낸 기간으로 추정(저장 없음) ----
// 함께 뛴 시간 추정 = 두 선수가 지금 팀에 함께 있은 날수 × 9분(주전 기준 주 1경기·출전 70% 근사). 게임 시작 전부터 있던 선수는 시작 시점에 200일(약 1800분) 함께한 것으로 봄 → 우리 팀 기존 선수 시작값과 같음
// 패스 항목은 시작값(1800분)을 넘는 함께 뛴 시간 40분당 1회로 근사(시작 시점엔 우리 팀과 같은 조건), 2대1·합작 골 항목은 0. 국적·언어 항목은 같음
function relTen(id){if(!S.gameStart)S.gameStart=S.date;const q=S.ps[id]||{};return q.joined&&q.joined>S.gameStart?Math.max(0,daysBetween(q.joined,S.date)):200+Math.max(0,daysBetween(S.gameStart,S.date))}
function relScoreAI(a,b){const pa=pl(a),pb=pl(b);if(!pa||!pb)return 30;let c=30;if(pa.nat&&pa.nat===pb.nat)c+=12;else if(REL_LG[pa.nat]&&REL_LG[pa.nat]===REL_LG[pb.nat])c+=6;
  const m=Math.min(relTen(a),relTen(b))*9;c+=35*(1-Math.exp(-m/1500))+10*(1-Math.exp(-Math.max(0,m-1800)/40/150));return Math.round(c)}
{const _rm=runMatch;runMatch=function(H,Aw){try{for(const T of [H,Aw]){if(!T||T.chem||!S||T.club===S.club)continue;const ids=T.xi.concat(T.bench||[]).filter(Boolean).map(p=>p.id);const sc={};for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)sc[relKey(ids[i],ids[j])]=relScoreAI(ids[i],ids[j]);
  const ch={};for(const a of ids){ch[a]={};for(const b of ids)if(a!==b)ch[a][b]=+Math.max(-1,Math.min(1,(sc[relKey(a,b)]-55)/35)).toFixed(3)}T.chem=ch}}catch(e){console.error(e)}return _rm.apply(this,arguments)}}

