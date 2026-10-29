// ================= 시상·명예의 전당(v76) =================
// 시즌 종료 시점(S.seasonDone) 한 번 계산: 우리 리그 시상(득점왕·도움왕·MVP·영플레이어·사모라·감독상·베스트 11), 발롱도르(전 리그 상위 10), 골든보이(21세 이하)
// 감독 시즌 기록(S.me.seasons): 시즌·구단·리그·순위·트로피 → 명예의 전당 탭(트로피 진열장·시즌별 경력·역대 수상)
const AW_STR={ES:1,EN:1,DE:1,IT:1,FR:1,PT:.82,NL:.8,BE:.74,TR:.74,SC:.68,CH:.7,AT:.7,DK:.68,BR:.78,AR:.74,US:.66,MX:.68,SA:.66,JP:.64,KR:.62,CN:.6,EN2:.66,DE2:.62,IT2:.6,FR2:.6,ES2:.62};
function awLgOf(c){if(typeof LIGA!=='undefined'&&LIGA.includes(c))return hl();if(typeof LIGA2!=='undefined'&&LIGA2.includes(c))return hl2();return CLUBS[c].lg}
function awPos(c){try{const lg=awLgOf(c);const tb=lg===hl()?(typeof tableOf==='function'?tableOf(1):table()):lg===hl2()&&typeof tableOf==='function'?tableOf(2):tableLg(lg);const i=tb.findIndex(t=>t.id===c);return {pos:i+1,n:tb.length,ga:i>=0?tb[i].ga/Math.max(1,tb[i].p):1.4,p:i>=0?tb[i].p:38}}catch(e){return {pos:10,n:20,ga:1.4,p:38}}}
function awTrophies(c,y){const t=[];const pp=awPos(c);const lg=awLgOf(c);if(pp.pos===1&&!/2$/.test(lg))t.push({k:'lg',n:(LGN[lg]||lg)+' 우승'});
  (S.cupHist||[]).filter(h=>h.y===y&&h.w===c).forEach(h=>t.push({k:'cup',n:(typeof CUPS!=='undefined'&&CUPS[h.lg]?CUPS[h.lg][0]:'컵')+' 우승'}));
  (S.euHist||[]).filter(h=>h.y===y&&h.w===c).forEach(h=>t.push({k:'eu',n:(typeof EUC!=='undefined'&&EUC[h.k]?EUC[h.k].n:'유럽대항전')+' 우승',e:h.k}));return t}
function awScore(p,q,pp){const apps=q.apps||0;if(!apps)return -99;const avg=(q.rs||0)/apps;
  const att=p.g==='ST'||p.g==='W'||p.g==='AM'?1:p.g==='CM'||p.g==='DM'?.7:.45;
  return ((avg-6.5)*12+(q.gl||0)*.32*att+(q.as||0)*.2+(pp.n-pp.pos)/Math.max(1,pp.n-1)*3)*Math.min(1,apps/28)}
function awPack(id,extra){const p=pl(id),c=clubOf(id);return Object.assign({id,n:p.name,c,g:p.g},extra||{})}
function seasonAwards(){if(!S||!S.me)return;const y=S.season;S.awards=S.awards||{};if(S.awards[y])return;
  const home=new Set(typeof LIGA!=='undefined'?LIGA:[]);const PP={};const ppOf=c=>PP[c]||(PP[c]=awPos(c));
  const rows=[];for(const id in S.ps){const q=S.ps[id];if(!q||!(q.apps>0)||!BASE[id])continue;const c=clubOf(+id);if(c==null||c<0||!CLUBS[c])continue;const p=pl(+id);const pp=ppOf(c);rows.push({id:+id,p,q,c,pp,age:ageOf(p,`${y+1}-06-30`),sc:awScore(p,q,pp)})}
  const H=rows.filter(r=>home.has(r.c));const elig=r=>(r.q.apps||0)>=Math.max(12,r.pp.p*.5);
  const by=(a,f)=>a.slice().sort((x,z)=>f(z)-f(x))[0];
  const A={lg:hl()};
  const gb=by(H,r=>(r.q.gl||0)*100-(r.q.apps||0)*.1);if(gb&&gb.q.gl)A.top=awPack(gb.id,{v:gb.q.gl});
  const ab=by(H,r=>(r.q.as||0)*100-(r.q.apps||0)*.1);if(ab&&ab.q.as)A.ast=awPack(ab.id,{v:ab.q.as});
  const HE=H.filter(elig);
  const mvp=by(HE.filter(r=>r.p.g!=='GK'),r=>r.sc);if(mvp)A.mvp=awPack(mvp.id,{v:+((mvp.q.rs/mvp.q.apps).toFixed(2)),gl:mvp.q.gl||0,as:mvp.q.as||0});
  const yp=by(HE.filter(r=>r.age<=21),r=>r.sc);if(yp)A.yp=awPack(yp.id,{v:+((yp.q.rs/yp.q.apps).toFixed(2)),age:yp.age});
  const gk=by(HE.filter(r=>r.p.g==='GK'),r=>-r.pp.ga+(r.q.rs/r.q.apps)*.05);if(gk)A.gk=awPack(gk.id,{v:+gk.pp.ga.toFixed(2)});
  // 베스트 11(4-3-3): GK1 · CB2 · FB2 · 중원3(DM/CM/AM) · 공격3(W/ST)
  const pickN=(gs,n,used)=>HE.filter(r=>gs.includes(r.p.g)&&!used.has(r.id)).sort((a,b)=>b.sc-a.sc).slice(0,n);const used=new Set();const xi=[];
  [[['GK'],1],[['CB'],2],[['FB'],2],[['DM','CM','AM'],3],[['W','ST'],3]].forEach(([gs,n])=>pickN(gs,n,used).forEach(r=>{used.add(r.id);xi.push(awPack(r.id,{v:+((r.q.rs/r.q.apps).toFixed(2))}))}));A.xi=xi;
  // 감독상: 기대 순위 대비 성과(우승 가산)
  const mgr=[...home].map(c=>{const ex=S.exp&&S.exp[c];const pp=ppOf(c);return {c,v:(ex?ex.ep-pp.pos:0)+(pp.pos===1?2.5:0)-pp.pos*.05,pos:pp.pos}}).sort((a,b)=>b.v-a.v)[0];
  if(mgr){const m=mgr.c===S.club&&!(typeof unemp==='function'&&unemp())?{n:S.me.name,me:1}:(typeof mgrOf==='function'&&mgrOf(mgr.c))||null;A.mgr={c:mgr.c,n:m?m.n||m.name:'',me:m&&m.me?1:0,pos:mgr.pos}}
  // 발롱도르: 전 리그, 리그 수준 × 개인 성적 + 우승 가산
  const euW={};(S.euHist||[]).filter(h=>h.y===y).forEach(h=>{euW[h.w]=(euW[h.w]||0)+(h.k==='UCL'?7:h.k==='UEL'?2.5:1.2);euW[h.r]=(euW[h.r]||0)+(h.k==='UCL'?3:.8)});
  const cupW={};(S.cupHist||[]).filter(h=>h.y===y).forEach(h=>{cupW[h.w]=(cupW[h.w]||0)+1.2});
  const bal=rows.filter(r=>(r.q.apps||0)>=18&&r.p.g!=='GK'||r.p.g==='GK'&&(r.q.apps||0)>=25).map(r=>{const lg=awLgOf(r.c);const st=AW_STR[lg]??.6;const t=(r.pp.pos===1&&!/2$/.test(lg)?4*st:0)+(euW[r.c]||0)+(cupW[r.c]||0);
    const avg=r.q.rs/r.q.apps;const ind=((avg-6.6)*14+(r.q.gl||0)*.38*(r.p.g==='GK'?0:1)+(r.q.as||0)*.2)*Math.min(1,r.q.apps/30);return {r,v:ind*st+t-(r.p.g==='GK'?3:0)}}).sort((a,b)=>b.v-a.v).slice(0,10);
  A.bal=bal.map(x=>awPack(x.r.id,{gl:x.r.q.gl||0,as:x.r.q.as||0,v:+(x.r.q.rs/x.r.q.apps).toFixed(2),lg:awLgOf(x.r.c)}));
  const boy=rows.filter(r=>r.age<=21&&(r.q.apps||0)>=15).map(r=>({r,v:awScore(r.p,r.q,r.pp)*(AW_STR[awLgOf(r.c)]??.6)})).sort((a,b)=>b.v-a.v)[0];if(boy)A.boy=awPack(boy.r.id,{age:boy.r.age,gl:boy.r.q.gl||0,as:boy.r.q.as||0});
  S.awards[y]=A;
  // 감독 시즌 기록
  S.me.seasons=S.me.seasons||[];if(!(typeof unemp==='function'&&unemp())&&!S.me.seasons.some(s=>s.y===y)){const c=S.club,pp=awPos(c);S.me.seasons.push({y,c,lg:awLgOf(c),pos:pp.pos,n:pp.n,tr:awTrophies(c,y),mgr:A.mgr&&A.mgr.me?1:0})}
  // 알림
  const mine=[];const lab={top:'득점왕',ast:'도움왕',mvp:'MVP',yp:'영플레이어',gk:'사모라(최소 실점 GK)'};
  for(const k in lab)if(A[k]&&A[k].c===S.club)mine.push(`${lab[k]} ${A[k].n}`);if(A.xi)A.xi.forEach(x=>{if(x.c===S.club)mine.push(`베스트 11 ${x.n}`)});
  if(A.bal[0]&&A.bal[0].c===S.club)mine.unshift(`발롱도르 ${A.bal[0].n}`);
  if(A.mgr&&A.mgr.me){mine.unshift('올해의 감독 '+S.me.name);S.me.rep=Math.min(99,(S.me.rep||50)+2);S.me.trust=Math.min(100,(S.me.trust||60)+4)}
  const lgn=LGN[A.lg]||A.lg;const b0=A.bal[0];
  inbox('award','',`${y}-${String(y+1).slice(2)} 시즌 시상`,`${lgn} MVP ${A.mvp?A.mvp.n:'-'} · 득점왕 ${A.top?A.top.n+' '+A.top.v+'골':'-'} · 발롱도르 ${b0?b0.n+' ('+CLUBS[b0.c].short+')':'-'}${mine.length?' · 우리 팀: '+mine.join(', '):''}`);
  if(b0)S.news.unshift({d:S.date,t:`발롱도르 ${b0.n} (${CLUBS[b0.c].name})`,b:`${b0.gl}골 ${b0.as}도움 · 평점 ${b0.v}`,v:0,big:true});
  if(typeof hlPush==='function'&&mine.length)hlPush({key:'aw'+y,pri:6,tone:'good',c:S.club,t:'시즌 시상',b:mine.slice(0,3).join(' · ')});
}
// 이전 저장 보정: 리그 우승 기록을 시즌 기록으로
function awBackfill(){if(!S||!S.me||S.me.seasons)return;S.me.seasons=[];(S.champs||[]).forEach(x=>{if(x.m&&x.m===S.me.name)S.me.seasons.push({y:x.y,c:x.c,lg:CLUBS[x.c].lg,pos:1,n:20,tr:[{k:'lg',n:(LGN[CLUBS[x.c].lg]||'리그')+' 우승'}],old:1})})}
// 훅: 시즌 종료 감지(daily 이후), 롤오버 직전 안전장치
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);try{if(S&&S.seasonDone&&S.me&&!(S.awards&&S.awards[S.season]))seasonAwards()}catch(e){console.error(e)}return r}}
{const _ro=rollover;rollover=function(){try{if(S&&S.me&&!(S.awards&&S.awards[S.season]))seasonAwards()}catch(e){console.error(e)}return _ro.apply(this,arguments)}}
// 받은 소식
{const _mh=msgHTML;msgHTML=function(m){if(m.type!=='award')return _mh(m);
  return `<div class="msg ${m.read?'':'new'}"><div class="h"><span>${fmtD(m.d)}</span><span>시상</span></div><b>${esc(m.title)}</b><p>${esc(m.body)}</p><div class="acts"><button class="btn sm ghost" data-hof="aw">시상 보기</button></div></div>`}}
// ---- 화면 ----
const AW_IC={lg:'🏆',cup:'🥇',eu:'⭐',mgr:'🎖️'};
function awRow(lab,x,sub){if(!x)return '';const p=BASE[x.id]?pl(x.id):{name:x.n};return `<button class="li" data-player="${x.id}">${avatar(p)}<span class="nm"><span><b>${esc(x.n)}</b><span>${lab} · ${esc(CLUBS[x.c]?CLUBS[x.c].short:'')}${sub?' · '+sub:''}</span></span></span>${crest(x.c)}</button>`}
function hofView(){S.awards=S.awards||{};awBackfill();const me=S.me,ss=(me.seasons||[]).slice().sort((a,b)=>b.y-a.y);
  const ys=Object.keys(S.awards).map(Number).sort((a,b)=>b-a);const sy=UI.awy&&S.awards[UI.awy]?UI.awy:ys[0];const A=sy!=null?S.awards[sy]:null;
  const cnt={lg:0,cup:0,eu:0,mgr:0};ss.forEach(s=>{(s.tr||[]).forEach(t=>cnt[t.k]=(cnt[t.k]||0)+1);if(s.mgr)cnt.mgr++});
  const cab=`<div class="card pad" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center">${[['lg','리그 우승'],['cup','컵 우승'],['eu','유럽대항전'],['mgr','올해의 감독']].map(([k,l])=>`<div><div style="font-size:26px;${cnt[k]?'':'filter:grayscale(1);opacity:.35'}">${AW_IC[k]}</div><b class="num" style="font-size:20px">${cnt[k]}</b><div class="note" style="font-size:11px">${l}</div></div>`).join('')}</div>`;
  const car=ss.length?ss.map(s=>`<div class="li"><span class="nm">${crest(s.c)}<span><b>${s.y}-${String(s.y+1).slice(2)} ${esc(CLUBS[s.c].name)}</b><span>${esc(LGN[s.lg]||s.lg)} ${s.old?'우승':s.pos+'위'}${(s.tr||[]).length?' · '+s.tr.map(t=>AW_IC[t.k]+' '+esc(t.n)).join(' '):''}${s.mgr?' · 🎖️ 올해의 감독':''}</span></span></span></div>`).join(''):'<div class="li"><span class="note">첫 시즌이 끝나면 기록이 쌓입니다.</span></div>';
  let aw='';if(A){const lgn=LGN[A.lg]||A.lg;
    aw=`${ys.length>1?`<div class="chips">${ys.map(y=>`<button class="chip" data-awy="${y}" aria-pressed="${y===sy}">${y}-${String(y+1).slice(2)}</button>`).join('')}</div>`:''}
    <h2>${esc(lgn)} 시상 · ${sy}-${String(sy+1).slice(2)}</h2><div class="card list">
    ${awRow('MVP',A.mvp,A.mvp?`평점 ${A.mvp.v} · ${A.mvp.gl}골 ${A.mvp.as}도움`:'')}${awRow('득점왕',A.top,A.top?A.top.v+'골':'')}${awRow('도움왕',A.ast,A.ast?A.ast.v+'도움':'')}${awRow('영플레이어',A.yp,A.yp?`${A.yp.age}세 · 평점 ${A.yp.v}`:'')}${awRow('사모라',A.gk,A.gk?`경기당 실점 ${A.gk.v}`:'')}
    ${A.mgr?`<div class="li"><span class="nm">${crest(A.mgr.c)}<span><b>${esc(A.mgr.n||'-')}${A.mgr.me?' (나)':''}</b><span>올해의 감독 · ${esc(CLUBS[A.mgr.c].short)} ${A.mgr.pos}위</span></span></span></div>`:''}</div>
    <h2>베스트 11</h2><div class="card list">${(A.xi||[]).map(x=>awRow(PSHORT[x.g]||x.g,x,'평점 '+x.v)).join('')}</div>
    <h2>발롱도르</h2><div class="card list">${(A.bal||[]).map((x,i)=>awRow(`${i+1}위`,x,`${esc(LGN[x.lg]||x.lg)} · ${x.gl}골 ${x.as}도움 · 평점 ${x.v}`)).join('')}</div>
    ${A.boy?`<h2>골든보이 (21세 이하)</h2><div class="card list">${awRow('골든보이',A.boy,`${A.boy.age}세 · ${A.boy.gl}골 ${A.boy.as}도움`)}</div>`:''}`}
  const ballonHist=ys.filter(y=>S.awards[y].bal&&S.awards[y].bal[0]).map(y=>{const b=S.awards[y].bal[0];return `<div class="li"><span class="nm">${crest(b.c)}<span><b>${y}-${String(y+1).slice(2)} ${esc(b.n)}</b><span>${esc(CLUBS[b.c].name)} · ${b.gl}골 ${b.as}도움</span></span></span></div>`}).join('');
  return `${hofTabs()}<h2>트로피 진열장 · ${esc(me.name)}</h2>${cab}<h2>시즌별 경력</h2><div class="card list">${car}</div>
    ${aw||'<p class="note" style="margin-top:14px">시즌이 끝나면(최종 라운드 이후) 리그 시상과 발롱도르가 발표됩니다.</p>'}
    ${ballonHist&&ys.length>1?`<h2>역대 발롱도르</h2><div class="card list">${ballonHist}</div>`:''}
    <p class="note" style="margin-top:14px;line-height:1.55">선정 기준: 리그 경기의 절반 이상 출전 선수 중 평균 평점·득점·도움·팀 순위를 합산(MVP·베스트 11·영플레이어 21세 이하). 사모라는 소속팀 경기당 실점이 가장 적은 주전 GK, 감독상은 시즌 전 기대 순위 대비 성과. 발롱도르는 전 리그 대상으로 리그 수준을 반영한 개인 성적에 리그·컵·유럽대항전 우승을 더합니다.</p>`}
function hofTabs(){const v=UI.cv||'mgr';return `<div class="chips" style="margin-top:14px"><button class="chip" data-hof="mgr" aria-pressed="${v==='mgr'}">감독</button><button class="chip" data-hof="hof" aria-pressed="${v!=='mgr'}">명예의 전당·시상</button></div>`}
{const _cv=careerView;careerView=function(){if(UI.cv&&UI.cv!=='mgr')return hofView();return hofTabs()+_cv()}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-hof],[data-awy]');if(!b||!S)return;e.stopPropagation();
  if(b.dataset.awy){UI.awy=+b.dataset.awy;render();return}
  const v=b.dataset.hof;UI.cv=v==='aw'?'hof':v;UI.tab='career';render();window.scrollTo(0,0)},true);

