// ================= 포지션 표시 · 경기 리포트 =================
const PSHORT={GK:'GK',CB:'CB','FB-R':'RB','FB-L':'LB',FB:'FB',DM:'DM',CM:'CM',AM:'AM','W-R':'RW','W-L':'LW',W:'W',ST:'ST'};
function posList(p){if(p.pos2&&p.pos2.f){const e=Object.entries(p.pos2.f).filter(([k,v])=>v>=.85).sort((a,b)=>b[1]-a[1]||((p.pos2.n[b[0]]||0)-(p.pos2.n[a[0]]||0))).slice(0,3).map(([k])=>PSHORT[k]||k);if(e.length)return e}
  const sd=/Left/.test(p.sub||'')?'L':/Right/.test(p.sub||'')?'R':null;return [p.g==='W'?(sd==='L'?'LW':sd==='R'?'RW':'W'):p.g==='FB'?(sd==='L'?'LB':sd==='R'?'RB':'FB'):p.g]}
function posTags(p){const l=posList(p);return `<span class="ptag m">${l[0]}</span>${l.slice(1).map(x=>`<span class="ptag">${x}</span>`).join('')}`}
// ---- 리포트 계산 ----
const LANE_N=['왼쪽 측면','왼쪽 하프스페이스','중앙','오른쪽 하프스페이스','오른쪽 측면'];
const ROW_N=['상대 진영','중원','우리 진영'];
function traceStats(res,s){const set=new Set();res.ev.forEach(e=>{if(e.tr&&e.tr.s===s)set.add(e.tr)});
  const o={n:0,wall:0,build:0,pressLost:0,tackleLost:0,long:0,longWon:0,duel:0,duelWon:0,final:0,intc:0,off:0,cross:0,airWon:0,airLost:0,claim:0,shots:0,xg:0,big:0,bigMiss:0,counter:0,sp:0,
    lane:[0,1,2,3,4].map(()=>({n:0,sh:0,xg:0,g:0}))};
  const goalsBy=new Set(res.ev.filter(e=>e.t==='goal'&&e.s===s&&e.tr).map(e=>e.tr));
  set.forEach(tr=>{o.n++;let lane=null;const st=tr[0]||{};if(st.tr)o.counter++;if(tr.some(x=>x.k==='sp'))o.sp++;
    const isB=st.k==='start'&&!st.tr&&!st.sec&&!st.sp&&!tr.some(x=>x.k==='long');if(isB)o.build++;
    tr.forEach(x=>{switch(x.k){case 'lane':lane=x.lane;o.lane[lane].n++;break;
      case 'lost':if(x.how==='press'){if(isB)o.pressLost++}else if(x.how==='tackle')o.tackleLost++;break;
      case 'long':o.long++;if(x.won)o.longWon++;break;
      case 'duel':o.duel++;if(x.win)o.duelWon++;break;
      case 'wall':o.wall++;break;case 'final':o.final++;break;case 'intercept':o.intc++;break;case 'off':o.off++;break;
      case 'cross':o.cross++;break;case 'air':if(x.won)o.airWon++;else o.airLost++;break;case 'claim':o.claim++;break;
      case 'shot':o.shots++;o.xg+=x.xg||0;if((x.xg||0)>=.3){o.big++}if(lane!=null){o.lane[lane].sh++;o.lane[lane].xg+=x.xg||0}break}});
    if(goalsBy.has(tr)&&lane!=null)o.lane[lane].g++;
    const lastShot=[...tr].reverse().find(x=>x.k==='shot');if(lastShot&&(lastShot.xg||0)>=.3&&!goalsBy.has(tr))o.bigMiss++});
  return o}
function supGrid(res,s){const A=res.supA&&res.supA[s];if(!A||!A.n)return null;return A.g.map(r=>r.map(v=>v/A.n))}
function buildReport(res,me,fx){const o=1-me,T=res.T,st=res.stats,sc=res.sc;
  const my=traceStats(res,me),op=traceStats(res,o);
  const R={d:S.date,fx:{h:fx.h,a:fx.a,r:fx.r||null},me,sc:[sc[me],sc[o]],xg:[st.xg[me],st.xg[o]],sh:[st.shots[me],st.shots[o]],sot:[st.sot[me],st.sot[o]],poss:[st.poss[me],st.poss[o]],
    pre:[T[me].preset,T[o].preset],form:[T[me].form.base,T[o].form.base],sb:[+(T[me].styleBonus||0).toFixed(2),+(T[o].styleBonus||0).toFixed(2)],
    my,op,supAtk:supGrid(res,me),supDef:supGrid(res,o),notes:[],tips:[],ppl:[]};
  {const mine=x=>x===me?0:1;R.log=res.ev.filter(e=>['goal','yellow','red','sub','injury'].includes(e.t)||(e.type==='pen'&&(e.t==='save'||e.t==='miss'))).map(e=>({m:e.m,w:mine(e.s),t:e.t,p:e.p||null,a:e.a||null,out:e.out||null,inP:e.inP||null,type:e.type||null,pen:e.type==='pen'}));
   const cnt=(t,x)=>res.ev.filter(e=>e.t===t&&e.s===x).length;R.fouls=[st.fouls?st.fouls[me]:0,st.fouls?st.fouls[o]:0];R.corner=[st.corner?st.corner[me]:0,st.corner?st.corner[o]:0];R.off=[st.off?st.off[me]:0,st.off?st.off[o]:0];R.yel=[cnt('yellow',me),cnt('yellow',o)];R.red=[cnt('red',me),cnt('red',o)];
   const all=[0,1].flatMap(x=>T[x].xi.concat((res.subs&&res.subs[x]||[]).flatMap(q=>[q.out,q.inP]).filter(Boolean)).map(p=>({p,x})));const seen=new Set();R.rat=all.filter(q=>{if(seen.has(q.p.id)||!res.ratings[q.p.id])return false;seen.add(q.p.id);return true}).map(q=>({id:q.p.id,n:q.p.name,w:mine(q.x),r:res.ratings[q.p.id].r,g:res.ratings[q.p.id].g,a:res.ratings[q.p.id].a})).sort((a,b)=>b.r-a.r);}
  {const rt=res.ratings;const has=Object.values(rt).some(x=>x.tc!=null);if(has){const subIn=new Set([0,1].flatMap(x=>(res.subs&&res.subs[x]||[]).map(q=>q.inP.id)));
    R.pst=[0,1].map(x=>{const seen=new Set();return T[x].xi.concat((res.subs&&res.subs[x]||[]).flatMap(q=>[q.out,q.inP]).filter(Boolean)).filter(p=>{if(seen.has(p.id)||!rt[p.id])return false;seen.add(p.id);return true}).map(p=>{const q=rt[p.id];return {id:p.id,n:p.name,g:p.g,sub:subIn.has(p.id),r:q.r,nr:q.nr,s:[q.tc,q.pc,q.pa,q.so,q.sh,q.dw,q.da,q.tkw,q.ta,q.aw,q.at,q.it,q.fc,q.g,q.a,q.kp,q.sv,q.crc,q.cr,q.xg||0,q.xa||0]}})}).map((L,x)=>x===me?L:L).slice();R.pst=[R.pst[me],R.pst[o]]}}
  /* v223 선수별 경기 포지션(선발 자리, 교체 투입은 나간 선수 자리) */try{R.pos={};[0,1].forEach(x=>{const t=T[x];let ks=null;try{ks=slotKeysLR(t)}catch(e){console.error(e)}if(!ks){try{const k2=t.k?t.k('base'):null;if(k2)ks=k2.map(q=>q.slotKey||q.key)}catch(e){}}t.xi.forEach((p,i)=>{if(p)R.pos[p.id]=(ks&&ks[i])||p.g});(res.subs&&res.subs[x]||[]).forEach(q=>{if(q.out&&q.inP)R.pos[q.out.id]=R.pos[q.inP.id]||q.out.g})})}catch(e){console.error(e)}
  const beats=(a,b)=>(E3.BEATS[a]||[]).includes(b);
  R.matchup=beats(R.pre[0],R.pre[1])?1:beats(R.pre[1],R.pre[0])?-1:0;
  // 한 줄 평가
  const dx=R.xg[0]-R.xg[1],dg=R.sc[0]-R.sc[1];
  R.head=dx>=.6&&dg<=0?'경기는 주도했지만 마무리에서 졌습니다':dx<=-.6&&dg>=0?'밀린 경기를 결정력·선방으로 버텼습니다':dx>=.6?'내용과 결과 모두 앞섰습니다':dx<=-.6?'내용에서도 밀렸습니다':dg>0?'팽팽한 경기를 잡았습니다':dg<0?'팽팽한 경기를 놓쳤습니다':'팽팽한 무승부';
  const N=R.notes,P=R.tips;
  // 전술
  if(R.matchup>0)N.push(['good',`성향 상성 우위: ${R.pre[0]}가 ${R.pre[1]}에 강함(돌파·빌드업 보너스)`]);
  if(R.matchup<0)N.push(['bad',`성향 상성 열세: 상대 ${R.pre[1]}가 우리 ${R.pre[0]}에 강함`]);
  if(R.sb[0]<=-.25)N.push(['bad',`선수 구성이 ${R.pre[0]}와 잘 안 맞음(적합도 ▼)`]);else if(R.sb[0]>=.25)N.push(['good',`선수 구성이 ${R.pre[0]}와 잘 맞음(적합도 ▲)`]);
  // 빌드업·압박
  if(my.build>=6){const pr=my.pressLost/my.build;if(pr>=.18){N.push(['bad',`빌드업 ${my.build}회 중 ${my.pressLost}회 압박에 걸려 탈취(${Math.round(pr*100)}%)`]);P.push('상대 압박이 강함 → 패스 길이를 늘리거나(롱볼), 배급 좋은 골키퍼·볼 플레잉 수비수 기용')}
    else if(pr<=.06&&my.build>=10)N.push(['good',`빌드업 안정: 압박 탈취 ${my.pressLost}/${my.build}`])}
  if(my.long>=5){const w=my.longWon/my.long;if(w<.4){N.push(['bad',`롱볼 공중 경합 ${my.longWon}/${my.long} 승 — 타깃이 밀림`]);P.push('롱볼이 통하지 않음 → 짧은 패스로 전환하거나 공중볼 강한 공격수(타깃맨)')}}
  // 돌파
  if(my.duel>=6){const w=my.duelWon/my.duel;if(w>=.6)N.push(['good',`1대1 돌파 ${my.duelWon}/${my.duel} 성공 — 측면·드리블이 먹힘`]);else if(w<=.35){N.push(['bad',`1대1 돌파 ${my.duelWon}/${my.duel} 성공에 그침`]);P.push('돌파가 막힘 → 드리블 자제·연계 위주 지시, 또는 속도 빠른 선수를 상대 느린 수비수 쪽에')}}
  // 마지막 패스
  if(my.final>=5&&my.intc/my.final>=.35){N.push(['bad',`마지막 패스 ${my.final}회 중 ${my.intc}회 차단`]);P.push('박스 앞 패스가 자주 끊김 → 패스·침착성 좋은 플레이메이커 기용 또는 중거리·크로스 비중 ↑')}
  if(my.off>=4){N.push(['bad',`오프사이드 ${my.off}회`]);P.push('침투 타이밍이 이르다 → 공격수 침투 자주 지시 해제')}
  // 크로스
  if(my.cross>=8){const w=my.airWon/Math.max(1,my.airWon+my.airLost+my.claim);if(w<.35){N.push(['bad',`크로스 ${my.cross}회, 경합 승률 ${Math.round(w*100)}% — 공중전에서 밀림`]);P.push('크로스 효율 낮음 → 크로스 자제·컷백 위주, 또는 공중볼 강한 선수 투입')}
    else if(w>=.55)N.push(['good',`크로스 ${my.cross}회, 경합 승률 ${Math.round(w*100)}%`])}
  // 마무리
  const gx=R.sc[0]-R.xg[0];
  if(R.xg[0]>=1.2&&gx<=-1){N.push(['bad',`기회 창출은 충분(xG ${R.xg[0].toFixed(2)})했지만 ${R.sc[0]}골 — 결정력 부족`+(my.bigMiss?` · 빅찬스 ${my.bigMiss}회 놓침`:'')]);P.push('마무리 부족 → 슈팅 좋은 선수에게 슈팅 자주, 약한 선수는 슈팅 자제 지시')}
  else if(gx>=1)N.push(['good',`결정력: xG ${R.xg[0].toFixed(2)}로 ${R.sc[0]}골`]);
  if(R.xg[0]<.6&&R.sh[0]>=8){N.push(['bad',`슈팅 ${R.sh[0]}개지만 xG ${R.xg[0].toFixed(2)} — 질 낮은 슈팅(먼 거리) 위주`]);P.push('슈팅 질이 낮음 → 중거리 줄이고 박스 안 침투·컷백 늘리기')}
  if(R.xg[0]<.7&&R.sh[0]<8){N.push(['bad',`기회 창출 부족(슈팅 ${R.sh[0]}, xG ${R.xg[0].toFixed(2)})`])}
  // 레인
  const lx=my.lane.map((l,i)=>({i,...l})).filter(l=>l.n>=3);
  if(lx.length){const best=lx.slice().sort((a,b)=>b.xg-a.xg)[0],worst=lx.slice().sort((a,b)=>(a.xg/a.n)-(b.xg/b.n))[0];
    if(best.xg>=.4)N.push(['good',`가장 위협적인 방향: ${LANE_N[best.i]} (${best.n}회 전개 · 슈팅 ${best.sh} · xG ${best.xg.toFixed(2)})`]);
    if(worst.n>=6&&worst.xg/worst.n<.03&&worst.i!==best.i){N.push(['bad',`${LANE_N[worst.i]}으로 ${worst.n}회 전개했지만 xG ${worst.xg.toFixed(2)}`]);if(best.xg>=.4)P.push(`공격 집중 방향을 ${LANE_N[best.i].includes('왼')?'왼쪽':LANE_N[best.i].includes('오른')?'오른쪽':'중앙'}으로`)}}
  const olx=op.lane.map((l,i)=>({i,...l})).filter(l=>l.n>=3).sort((a,b)=>b.xg-a.xg)[0];
  if(olx&&olx.xg>=.5){const ours=['오른쪽','오른쪽','중앙','왼쪽','왼쪽'][olx.i];N.push(['bad',`실점 위험 방향: 상대 ${LANE_N[olx.i]} = 우리 ${ours} (xG ${olx.xg.toFixed(2)})`]);P.push(`우리 ${ours} 수비 보강 → 그쪽 풀백 임무 '수비', 또는 태클 강한 선수 배치`)}
  // 15칸
  const Z=(g,sign)=>{if(!g)return [];const L=[];g.forEach((row,r)=>{if(r>1)return;row.forEach((v,l)=>{if(sign*v>=.6)L.push({r,l,v})})});return L.sort((a,b)=>sign*(b.v-a.v)).slice(0,2)};
  const za=Z(R.supAtk,-1),zd=Z(R.supDef,1);
  za.forEach(z=>N.push(['bad',`공격 시 수적 열세: ${ROW_N[z.r]} ${LANE_N[z.l]} (${z.v.toFixed(1)}명)`]));
  zd.forEach(z=>{const ours=['오른쪽 측면','오른쪽 하프스페이스','중앙','왼쪽 하프스페이스','왼쪽 측면'][z.l];N.push(['bad',`수비 시 수적 열세: 우리 ${['수비 진영','중원'][z.r]} ${ours} (상대 +${z.v.toFixed(1)}명)`])});
  if(za.length||zd.length)P.push('수적 열세 구역이 있음 → 전술 화면 15칸 우위에서 해당 칸 확인 후 포메이션·선수 위치 조정');
  if(!za.length&&R.supAtk){const zb=Z(R.supAtk,1)[0];if(zb)N.push(['good',`공격 시 수적 우위: ${ROW_N[zb.r]} ${LANE_N[zb.l]} (+${zb.v.toFixed(1)}명)`])}
  // 역습
  if(op.counter>=4&&op.shots>=3)N.push(['bad',`상대 역습 ${op.counter}회 허용`]);
  if(my.counter>=4)N.push(['good',`우리 역습 ${my.counter}회`]);
  // 개인
  const all=T[me].xi.concat(res.subs[me].map(x=>x.out)).filter((p,i,a)=>a.findIndex(q=>q.id===p.id)===i);
  const pr=id=>res.ratings[id]||{};const fat=id=>(res.fatigue[me]||{})[id]||0;
  const rated=all.filter(p=>pr(p.id).r!=null).sort((a,b)=>pr(b.id).r-pr(a.id).r);
  if(rated[0])R.ppl.push(['good',rated[0].id,`최고 평점 ${pr(rated[0].id).r.toFixed(1)}${pr(rated[0].id).g?` · ${pr(rated[0].id).g}골`:''}${pr(rated[0].id).a?` · ${pr(rated[0].id).a}도움`:''}`]);
  const low=rated[rated.length-1];if(low&&pr(low.id).r<6.2)R.ppl.push(['bad',low.id,`최저 평점 ${pr(low.id).r.toFixed(1)}`]);
  (res.duels||[]).forEach(du=>{const a=all.find(p=>p.name===du.a),d=all.find(p=>p.name===du.d);
    if(a&&du.w+du.l>=3&&du.w/(du.w+du.l)>=.67)R.ppl.push(['good',a.id,`${shortName(du.d)} 상대 돌파 ${du.w}-${du.l}`]);
    if(a&&du.w+du.l>=3&&du.l/(du.w+du.l)>=.67)R.ppl.push(['bad',a.id,`${shortName(du.d)}에게 막힘 ${du.w}-${du.l}`]);
    if(d&&du.w+du.l>=3&&du.w/(du.w+du.l)>=.67)R.ppl.push(['bad',d.id,`${shortName(du.a)}에게 돌파 허용 ${du.w}-${du.l}`]);
    if(d&&du.w+du.l>=3&&du.l/(du.w+du.l)>=.67)R.ppl.push(['good',d.id,`${shortName(du.a)} 봉쇄 ${du.l}-${du.w}`])});
  const shotXg={};res.ev.forEach(e=>{if(e.s!==me||!['goal','save','miss','block'].includes(e.t)||!e.tr)return;const sh=[...e.tr].reverse().find(x=>x.k==='shot');if(!sh)return;const p=all.find(q=>q.name===sh.p);if(!p)return;const k=shotXg[p.id]=shotXg[p.id]||{xg:0,g:0,n:0};if(!k.seen)k.seen=new Set();if(k.seen.has(e.tr))return;k.seen.add(e.tr);k.xg+=sh.xg||0;k.n++;if(e.t==='goal')k.g++});
  Object.entries(shotXg).forEach(([id,k])=>{if(k.xg>=.7&&k.g===0)R.ppl.push(['bad',+id,`슈팅 ${k.n}개 xG ${k.xg.toFixed(2)} 무득점`]);else if(k.g>=1&&k.g-k.xg>=.8)R.ppl.push(['good',+id,`xG ${k.xg.toFixed(2)}로 ${k.g}골`])});
  all.forEach(p=>{if(fat(p.id)>=70)R.ppl.push(['warn',p.id,`피로 ${Math.round(fat(p.id))} — 다음 경기 로테이션 고려`]);const fm=(T[me].fm||{})[p.id];if(fm!=null&&fm<.9&&T[me].xi.some(q=>q.id===p.id))R.ppl.push(['warn',p.id,`포지션 적합도 ${Math.round(fm*100)}% — 익숙하지 않은 자리`])});
  res.ev.forEach(e=>{if(e.s===me&&(e.t==='yellow'||e.t==='red')){const p=all.find(q=>q.id===e.pid||q.name===e.p);if(p)R.ppl.push(['warn',p.id,e.t==='red'?'퇴장':'경고'])}});
  if(res.inj)res.inj.forEach(x=>{if(x.s===me){const p=all.find(q=>q.id===x.id);if(p)R.ppl.push(['bad',p.id,`${x.m}분 부상${x.why==='foul'?'(파울)':''}`])}});
  // 사람별 묶기(최대 8명)
  R.duels=(res.duels||[]).map(d=>({a:d.a,d:d.d,w:d.w,l:d.l,air:d.air?1:0,atk:d.s===me?1:0}));
  const byP={};R.ppl.forEach(([k,id,t])=>{(byP[id]=byP[id]||{id,items:[]}).items.push([k,t])});R.ppl=Object.values(byP).slice(0,8);
  if(!P.length)P.push(R.sc[0]>R.sc[1]?'큰 문제 없음 → 같은 틀 유지, 피로 누적 선수만 교체':'뚜렷한 약점 신호는 없음 → 상대 전력 차이·운의 영향이 큼');
  return R}
// ---- 다음 상대 ----
function nextOppInfo(){const nx=typeof nextFxAll==='function'?nextFxAll():myNext();if(!nx)return null;const oc=nx.h===S.club?nx.a:nx.h;const T=teamFor(oc);if(!T)return null;
  const my=S.tac.preset,op=T.preset;const counters=Object.keys(E3.BEATS).filter(k=>(E3.BEATS[k]||[]).includes(op));
  const star=T.xi.slice().sort((a,b)=>b.ovr-a.ovr)[0];const m=mgrOf&&mgrOf(oc);
  return {oc,home:nx.h===S.club,d:nx.d,r:nx.r,pre:op,form:T.form.base,counters,myBeaten:(E3.BEATS[op]||[]).includes(my),star,mgr:m?m.n:null}}
// ---- 화면 ----
function zoneMini(g,title,flip){if(!g)return '';let h='';for(let r=0;r<3;r++)for(let l=0;l<5;l++){const v=g[r][l];const c=v>=.6?'p':v<=-.6?'m':'z';h+=`<div class="${c}">${v>0?'+':''}${(Math.round(v*2)/2).toFixed(1).replace('.0','')}</div>`}
  return `<div class="zmini"><div class="zt">${title}</div><div class="zg">${h}</div></div>`}
function reportHTML(R){const H=R.fx.h,A=R.fx.a,me=R.me;const us=me===0?H:A,them=me===0?A:H;
  const li=(k,t)=>`<li class="${k}">${esc(t)}</li>`;
  const bar=(l,a,b,f=x=>x)=>{const m=Math.max(a,b,.01);return `<div class="cmp"><div class="row"><span class="v">${f(a)}</span><div class="bar l"><i style="width:${a/m*100}%;background:${a>=b?'var(--amber)':'var(--faint)'}"></i></div><span class="lab">${l}</span><div class="bar"><i style="width:${b/m*100}%;background:${b>=a?'var(--amber)':'var(--faint)'}"></i></div><span class="v">${f(b)}</span></div></div>`};
  const my=R.my,op=R.op;
  const nx=nextOppInfo();
  return `<button class="x" data-close>닫기</button><div class="note" style="margin:0">${R.fx.r?`${R.fx.r}라운드`:'친선경기'} · ${fmtD(R.d)}</div>
  <h3 style="display:flex;align-items:center;gap:8px">${crest(us)}<span class="num" style="font-size:26px">${R.sc[0]} : ${R.sc[1]}</span>${crest(them)}<span style="font-size:14px;font-weight:600">${esc(CLUBS[them].name)}</span></h3>
  <p style="margin:4px 0 10px;font-weight:600">${esc(R.head)}</p>
  ${R.log?logHTML(R):''}
  ${bar('xG',R.xg[0],R.xg[1],x=>x.toFixed(2))}${bar('슈팅',R.sh[0],R.sh[1])}${bar('유효슈팅',R.sot[0],R.sot[1])}${bar('점유율',R.poss[0],R.poss[1])}
  ${R.fouls?bar('파울',R.fouls[0],R.fouls[1])+bar('경고',R.yel[0],R.yel[1])+(R.red[0]+R.red[1]?bar('퇴장',R.red[0],R.red[1]):'')+bar('코너킥',R.corner[0],R.corner[1])+bar('<span style="white-space:nowrap;letter-spacing:-.06em;font-size:.9em">오프사이드</span>',R.off[0],R.off[1]):''}
  ${R.pst?`<div class="lbl">선수 기록 <span class="note">(성공/시도)</span></div><div style="display:flex;gap:6px;margin-bottom:6px"><button class="chip" data-pstside="0" aria-pressed="${!UI.pstSide}">우리</button><button class="chip" data-pstside="1" aria-pressed="${!!UI.pstSide}">상대</button></div><div id="pstBox">${pstHTML(R,UI.pstSide?1:0)}</div>${(()=>{const top=R.rat&&R.rat[0];return top?`<div class="note" style="margin-top:6px">경기 최우수 <b style="color:var(--amber)">${esc(shortName(top.n))}</b> ${top.r.toFixed(1)}${top.w?' (상대)':''}</div>`:''})()}`:(R.rat?ratHTML(R):'')}
  <div class="lbl">전술</div><div class="note">우리 ${esc(R.form[0])} · ${esc(R.pre[0])} vs 상대 ${esc(R.form[1])} · ${esc(R.pre[1])} — ${R.matchup>0?'<b style="color:var(--good)">상성 우위</b>':R.matchup<0?'<b style="color:var(--bad)">상성 열세</b>':'상성 중립'}</div>
  <div class="lbl">공격 전개 (우리 / 상대)</div>
  <div class="rt2">
   <div><span>빌드업 중 압박 탈취</span><b>${my.pressLost}/${my.build}</b><b>${op.pressLost}/${op.build}</b></div>
   <div><span>1대1 돌파 성공</span><b>${my.duelWon}/${my.duel}</b><b>${op.duelWon}/${op.duel}</b></div>
   <div><span>마지막 패스 차단</span><b>${my.intc}/${my.final}</b><b>${op.intc}/${op.final}</b></div>
   <div><span>크로스(경합 승)</span><b>${my.cross}(${my.airWon})</b><b>${op.cross}(${op.airWon})</b></div>
   <div><span>롱볼 경합 승</span><b>${my.longWon}/${my.long}</b><b>${op.longWon}/${op.long}</b></div>
   <div><span>2대1 패스 성공</span><b>${my.wall}</b><b>${op.wall}</b></div>
   <div><span>역습</span><b>${my.counter}</b><b>${op.counter}</b></div>
   <div><span>빅찬스(놓침)</span><b>${my.big}(${my.bigMiss})</b><b>${op.big}(${op.bigMiss})</b></div>
  </div>
  <div class="lbl">방향별 전개 (우리 공격)</div>
  <div class="lanes">${my.lane.map((l,i)=>`<div><small>${['좌','좌중','중앙','우중','우'][i]}</small><b>${l.n}</b><span>xG ${l.xg.toFixed(2)}${l.g?` · ${l.g}골`:''}</span></div>`).join('')}</div>
  <div class="lbl">15칸 평균 수적 차이</div><div class="zrow">${zoneMini(R.supAtk,'우리 공격 시 (위=상대 골문)')}${zoneMini(R.supDef?R.supDef.map(r=>r.map(v=>-v)):null,'상대 공격 시 (아래=우리 골문)')}</div>
  <div class="lbl">분석</div><ul class="rnotes">${R.notes.map(([k,t])=>li(k,t)).join('')||'<li>특이사항 없음</li>'}</ul>
  ${R.duels&&R.duels.length?(()=>{const row=du=>{const good=du.atk?du.w>du.l:du.l>du.w,bad=du.atk?du.w<du.l:du.l<du.w;return `<div class="chg" style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--line)"><span>${esc(shortName(du.a))} ▶ ${esc(shortName(du.d))}${du.air?' <span class="note">공중볼</span>':''}</span><span class="num" style="color:${good?'var(--good)':bad?'var(--bad)':'var(--text)'}">${du.atk?`${du.w}승 ${du.l}패`:`${du.l}막음 ${du.w}뚫림`}</span></div>`};
    const A=R.duels.filter(d=>d.atk).slice(0,5),D=R.duels.filter(d=>!d.atk).slice(0,5);
    return `<div class="lbl">1대1 매치업 <span class="note">(2회 이상 맞붙은 조합)</span></div>${A.length?`<div class="note" style="margin:2px 0">우리 공격 (우리 선수 ▶ 상대 수비)</div>${A.map(row).join('')}`:''}${D.length?`<div class="note" style="margin:8px 0 2px">우리 수비 (상대 공격수 ▶ 우리 수비)</div>${D.map(row).join('')}`:''}`})():''}
  <div class="lbl">선수</div>${R.ppl.map(x=>{const p=pl(x.id);return `<div class="rp">${avatar(p,'sm')}<div><b>${esc(shortName(p.name))}</b> <span class="note">${posList(p)[0]}</span><ul class="rnotes">${x.items.map(([k,t])=>li(k,t)).join('')}</ul></div></div>`}).join('')||'<p class="note">특이사항 없음</p>'}
  <div class="lbl">다음 경기 준비</div><ul class="rnotes tips">${R.tips.map(t=>li('tip',t)).join('')}</ul>
  ${nx?`<div class="nxo">${crest(nx.oc)}<div><b>다음 상대 · ${esc(CLUBS[nx.oc].name)}</b> <span class="note">${nx.home?'홈':'원정'} · ${fmtD(nx.d)}</span>
    <div class="note">${esc(nx.form)} · ${esc(nx.pre)}${nx.mgr?` · 감독 ${esc(nx.mgr)}`:''} · 핵심 ${esc(nx.star?nx.star.name:'')}</div>
    <div class="note">${nx.myBeaten?`<b style="color:var(--bad)">현재 우리 성향(${esc(S.tac.preset)})은 이 상대에 불리</b> · `:''}${nx.counters.length?`상성 우위 성향: <b style="color:var(--good)">${nx.counters.map(esc).join(', ')}</b>`:'상성으로 이길 성향 없음 — 선수 구성에 맞는 성향 권장'}</div></div></div>`:''}`}
// 기본 정보: 득점·도움·카드·교체·부상 타임라인, 평점
function logHTML(R){if(!R.log.length)return '';const ic={goal:'⚽',yellow:'<i class="cd y"></i>',red:'<i class="cd r"></i>',sub:'⇄',injury:'✚',save:'✋',miss:'✕'};
  const tx=e=>e.t==='goal'?`<b>${esc(shortName(e.p))}</b>${e.pen?' (PK)':''}${e.a?`<span class="note"> 도움 ${esc(shortName(e.a))}</span>`:''}`:e.t==='sub'?`<b>${esc(shortName(e.inP))}</b><span class="note"> ⟵ ${esc(shortName(e.out))}</span>`:e.t==='injury'?`${esc(shortName(e.p))} <span class="note">부상</span>`:e.pen?`${esc(shortName(e.p))} <span class="note">PK ${e.t==='save'?'선방에 막힘':'실축'}</span>`:esc(shortName(e.p));
  return `<div class="tl">${R.log.map(e=>`<div class="${e.w?'r':'l'}${e.t==='goal'?' g':''}"><span class="m num">${e.m}'</span><span class="i">${ic[e.t]||''}</span><span class="t">${tx(e)}</span></div>`).join('')}</div>`}
/* 같은 이름 자리가 둘 이상이면(예: 4-2-3-1의 AM 둘, 수비형 미드필더 둘) 화면 좌우로 L/R을 붙임 */
function slotKeysLR(t){const sl=E3.phaseSlots(t,'base');const keys=sl.map(q=>q.key);const cnt={};keys.forEach(k=>cnt[k]=(cnt[k]||0)+1);return sl.map((q,i)=>{const k=keys[i];if(cnt[k]<2||/^[LR]/.test(k)||k==='GK')return k;return (q.x<50?'L':'R')+k})}
function repPos(R,id,g,_d){let k=R.pos&&R.pos[id];/* v226 예전 리포트의 교체 투입 선수: 경기 기록(교체 이벤트)에서 나간 선수를 찾아 그 자리로 */if(!k&&!(R.pos&&Object.keys(R.pos).length)&&!_d){try{const all=(R.pst||[]).flat();const me=all.find(x=>x.id===id);if(me&&me.sub){const ev=(R.log||[]).find(e=>e.t==='sub'&&e.inP===me.n);const o=ev&&all.find(x=>x.n===ev.out);if(o){const r=repPos(R,o.id,o.g,1);if(r)return r}}}catch(e){}}/* v225 자리 기록이 없는 예전 리포트: 우리 선수가 지금 선발 명단에 있으면 현재 전술의 자리로 대신 표시 */if(!k&&!(R.pos&&Object.keys(R.pos).length)){try{const i=(S.xi||[]).indexOf(id);if(i>=0){const tt=teamFor(S.club);const ks=slotKeysLR(tt);const j=tt.xi.findIndex(p=>p&&p.id===id);if(j>=0&&ks[j])k=ks[j]}}catch(e){}}if(!k){try{k=g||(BASE[id]&&pl(id).g)}catch(e){}}return k?` <span class="note" style="font-size:10px">${esc(String(k))}</span>`:''}
function ratHTML(R){const top=R.rat[0];const us=R.rat.filter(x=>!x.w);
  return `<div class="lbl">평점</div><div class="note" style="margin-bottom:6px">경기 최우수 <b style="color:var(--amber)">${esc(shortName(top.n))}</b> ${top.r.toFixed(1)}${top.w?' (상대)':''}</div>
  <div class="rt">${us.map(x=>`<div><span>${esc(shortName(x.n))}${repPos(R,x.id)}${x.g?` <b style="color:var(--amber)">${x.g}골</b>`:''}${x.a?` <span class="note">${x.a}도움</span>`:''}</span><span class="num" style="color:${x.r>=7.5?'var(--good)':x.r<6?'var(--bad)':'inherit'}">${x.r.toFixed(1)}</span></div>`).join('')}</div>`}
// 선수별 기록표(v4 엔진): 터치·패스·슈팅·드리블·태클·공중볼·차단·파울
function pstHTML(R,side){const L=R.pst&&R.pst[side];if(!L)return '';const fr=(a,b)=>b?`${a}/${b}`:'–';
  const rows=L.map(x=>{const s=x.s;return `<tr><td class="n">${esc(shortName(x.n))}${repPos(R,x.id,x.g)}${x.sub?' <span class="note">교체</span>':''}</td><td>${x.nr?'<span class="note">–</span>':x.r.toFixed(1)}</td><td>${s[13]?`<b style="color:var(--amber)">${s[13]}</b>`:'<span class="note">0</span>'}</td><td>${s[14]?`<b style="color:var(--amber)">${s[14]}</b>`:'<span class="note">0</span>'}</td><td>${x.g==='GK'?`<b>${s[16]||0}</b>`:'<span class="note">–</span>'}</td><td>${s[0]}</td><td>${fr(s[1],s[2])}</td><td>${fr(s[3],s[4])}</td><td>${s[19].toFixed(2)}</td><td>${s[20].toFixed(2)}</td><td>${s[15]||0}</td><td>${fr(s[5],s[6])}</td><td>${fr(s[7],s[8])}</td><td>${fr(s[9],s[10])}</td><td>${s[11]||0}</td><td>${s[12]||0}</td>${x.g==='GK'?'':''}</tr>`}).join('');
  return `<div class="pstw"><table class="pst"><thead><tr><th class="n">선수</th><th>평점</th><th>골</th><th>도움</th><th>선방</th><th>터치</th><th>패스</th><th>슈팅<small>유효/전체</small></th><th>xG</th><th>xA</th><th>키패스</th><th>드리블</th><th>태클</th><th>공중볼</th><th>차단</th><th>파울</th></tr></thead><tbody>${rows}</tbody></table></div>`}
function reportSheet(R){if(!R){toast('리포트가 없습니다');return}sheet(reportHTML(R))}
{const _hv0=homeView;homeView=function(){const h=_hv0();const R=S.reports&&S.reports[0];if(!R)return h;const mine=R.me===0?R.fx.h:R.fx.a;if(mine!==S.club||(S.me&&S.me.since&&R.d&&R.d<S.me.since))return h;/* v192 새 구단 부임 뒤엔 예전 구단 경기 리포트 카드 숨김 */const them=R.me===0?R.fx.a:R.fx.h;
  const card=`<section class="card pad" style="margin-top:12px;display:flex;align-items:center;gap:10px">${crest(them)}<div style="flex:1;min-width:0"><b>지난 경기 ${R.sc[0]}:${R.sc[1]}</b> <span class="note">xG ${R.xg[0].toFixed(2)}-${R.xg[1].toFixed(2)}</span><div class="note" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(R.head)}</div></div><button class="btn sm ghost" data-act="lastrep" data-i="0">리포트</button></section>`;
  const i=h.indexOf('<h2>받은 소식</h2>');return i>=0?h.slice(0,i)+card+h.slice(i):h+card}}
// ---- 리그: 도움 순위 탭 ----
{const _lv=leagueView;leagueView=function(){const t=UI.lt;let h=_lv();
  h=h.replace('득점 순위</button></div>',`득점 순위</button><button data-lt="as" aria-selected="${t==='as'}">도움 순위</button></div>`);
  if(t==='as'){const all=Object.keys(S.ps).map(Number).filter(id=>(S.ps[id].apps||0)>0).map(pl).filter(p=>LIGA.includes(clubOf(p.id)));
    const L=all.filter(p=>(p.as||0)>0).sort((a,b)=>(b.as-a.as)||((b.gl||0)-(a.gl||0))||((a.mins||0)-(b.mins||0))).slice(0,10);
    h+=`<div class="card list" style="margin-top:12px">${L.map((p,i)=>`<button class="li" data-player="${p.id}"><span class="num" style="width:18px;color:var(--muted)">${i+1}</span>${crest(clubOf(p.id))}<span class="nm"><b>${esc(p.name)}</b><span>${p.apps}경기 ${p.gl||0}골</span></span><span class="num" style="font-size:22px;font-weight:700">${p.as}</span></button>`).join('')||'<div class="li note">아직 기록이 없습니다.</div>'}</div>`}
  return h}}

document.addEventListener('click',e=>{const b=e.target.closest('[data-pstside]');if(!b)return;UI.pstSide=b.dataset.pstside==='1';const box=document.getElementById('pstBox');const R=UI.curReport;if(box&&R){box.innerHTML=pstHTML(R,UI.pstSide?1:0);b.parentNode.querySelectorAll('[data-pstside]').forEach(x=>x.setAttribute('aria-pressed',x===b))}});
{const _rs=reportSheet;reportSheet=function(R){UI.curReport=R;UI.pstSide=false;return _rs(R)}}
// ---- 시즌 선수 기록(리그 경기 누적) ----
const PSK=['xg','xa','so','kp','bc','crc','pa','pc','da','dw','ta','tkw','it','at','aw','fc','tc','cr','rn','tb','ca','sv'];
{const _am=applyMatch;applyMatch=function(H,Aw,res,counts){_am(H,Aw,res,counts);if(!counts||!res||!res.ratings)return;
  const cards={};(res.ev||[]).forEach(e=>{if((e.t==='yellow'||e.t==='red')&&e.pid){cards[e.pid]=cards[e.pid]||{y:0,r:0};cards[e.pid][e.t==='yellow'?'y':'r']++}});
  for(const id in res.ratings){const r=res.ratings[id];if(r.tc==null)continue;const q=S.ps[id]=S.ps[id]||{};const ss=q.ss=q.ss||{};PSK.forEach(k=>{ss[k]=+((ss[k]||0)+(r[k]||0)).toFixed(3)});
    const c=cards[id];if(c){ss.yc=(ss.yc||0)+c.y;ss.rc=(ss.rc||0)+c.r}}}}
{const _ns=newSeason;newSeason=function(y,first){_ns(y,first);for(const id in S.ps){const q=S.ps[id];if(q.ss)q.ss={};q.mins=0;q.starts=0;q.shs=0}}}
const PSCOL=[['gl','골'],['as','도움'],['xg','xG',2],['xa','xA',2],['shs','슈팅'],['so','유효'],['kp','키패스'],['bc','빅찬스'],['pp','패스%'],['pa','패스'],['dw','드리블'],['tkw','태클'],['it','차단'],['aw','공중볼'],['fc','파울'],['yc','경고'],['sv','선방'],['avg','평점',2]];
const PSCOL_GK=[['sv','선방'],['pa','패스'],['pp','패스%'],['aw','공중볼'],['it','차단'],['fc','파울'],['yc','경고'],['avg','평점',2]];
function psRows(){const all=Object.keys(S.ps).map(Number).filter(id=>(S.ps[id].apps||0)>0).map(pl).filter(p=>LIGA.includes(clubOf(p.id)));
  return all.map(p=>{const ss=p.ss||{};const v={gl:p.gl||0,as:p.as||0,shs:p.shs||0,avg:p.apps?(p.rs||0)/p.apps:0};PSK.forEach(k=>v[k]=ss[k]||0);v.yc=ss.yc||0;v.pp=v.pa?v.pc/v.pa*100:0;return {p,v,min:p.mins||0,apps:p.apps||0}})}
function psHTML(){const f=UI.psf||{sort:'gl',p90:false,pos:'ALL',club:'ALL'};UI.psf=f;
  const LN={GK:'GK',CB:'DF',FB:'DF',DM:'MF',CM:'MF',AM:'MF',W:'FW',ST:'FW'};
  let L=psRows().filter(x=>(f.pos==='ALL'||LN[x.p.g]===f.pos)&&(f.club==='ALL'||clubOf(x.p.id)===+f.club));
  if(f.p90)L=L.filter(x=>x.min>=270);
  const val=(x,k)=>{if(k==='pp'||k==='avg')return x.v[k];return f.p90?x.v[k]/Math.max(1,x.min)*90:x.v[k]};
  L.sort((a,b)=>val(b,f.sort)-val(a,f.sort)||b.min-a.min);L=L.slice(0,60);
  const fmt=(x,k,d)=>{const v=val(x,k);return k==='pp'?(x.v.pa?Math.round(v)+'%':'–'):(f.p90||d)?v.toFixed(d||2):Math.round(v)};
  const chip=(k,v,l)=>`<button class="chip" data-psf="${k}:${v}" aria-pressed="${String(f[k])===String(v)}">${l}</button>`;
  return `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:12px 0 6px">${chip('p90',false,'누적')}${chip('p90',true,'90분당')}<span style="width:6px"></span>${['ALL','GK','DF','MF','FW'].map(x=>chip('pos',x,x==='ALL'?'전체':x)).join('')}</div>
  <div style="margin-bottom:8px"><select id="psClub" style="background:var(--surf2,#1b242e);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:6px 8px;font-size:13px"><option value="ALL">전체 구단</option>${LIGA.map(c=>`<option value="${c}" ${String(f.club)===String(c)?'selected':''}>${esc(CLUBS[c].name)}</option>`).join('')}</select> <span class="note">${f.p90?'270분 이상 출전':''} · 열 제목을 누르면 정렬</span></div>
  <div class="card" style="padding:4px"><div class="pstw"><table class="pst"><thead><tr><th class="n">선수</th><th>경기</th><th>분</th>${(f.pos==='GK'?PSCOL_GK:PSCOL).map(([k,l])=>`<th data-pss="${k}" style="cursor:pointer;${f.sort===k?'color:var(--amber)':''}">${l}${f.sort===k?' ▼':''}</th>`).join('')}</tr></thead>
  <tbody>${L.map(x=>`<tr data-player="${x.p.id}"><td class="n">${crest(clubOf(x.p.id))} ${esc(shortName(x.p.name))} <span class="note">${posList(x.p)[0]}</span></td><td>${x.apps}</td><td>${x.min}</td>${(f.pos==='GK'?PSCOL_GK:PSCOL).map(([k,l,d])=>`<td style="${f.sort===k?'color:var(--amber);font-weight:700':''}">${fmt(x,k,d)}</td>`).join('')}</tr>`).join('')||'<tr><td class="n" colspan="19">아직 기록이 없습니다.</td></tr>'}</tbody></table></div></div>`}
{const _lv2=leagueView;leagueView=function(){const t=UI.lt;let h=_lv2();h=h.replace('도움 순위</button></div>',`도움 순위</button><button data-lt="ps" aria-selected="${t==='ps'}">선수 기록</button></div>`);h=h.replace('>득점 순위</button>','>득점</button>').replace('>도움 순위</button>','>도움</button>');if(t==='ps')h+=psHTML();return h}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-psf],[data-pss]');if(!b)return;const f=UI.psf||(UI.psf={sort:'gl',p90:false,pos:'ALL',club:'ALL'});
  if(b.dataset.pss)f.sort=b.dataset.pss;else{const [k,v]=b.dataset.psf.split(':');f[k]=v==='true'?true:v==='false'?false:v}e.stopPropagation();render()},true);
document.addEventListener('change',e=>{if(e.target&&e.target.id==='psClub'){const f=UI.psf||(UI.psf={sort:'gl',p90:false,pos:'ALL',club:'ALL'});f.club=e.target.value;render()}});

// ---- 게임 안 성향 변화: 시즌이 끝나면 그 시즌 게임 기록(90분당, 같은 포지션 평균 대비)으로 성향을 조금씩 이동 ----
const HAB_ALPHA=.35,HAB_NM=['드리블','슈팅','크로스','침투','스루패스','전진 드리블'];
/* 성향 변화 보정: 엔진 기록은 성향 차이를 그대로 다 드러내지 않음(탄력성 β<1). 그대로 쓰면 시즌마다 개성이 평균 쪽으로 깎이므로
   리그 전체에서 log(기록비)~β·log(성향)을 추정해 기록비를 β로 나눠 '그 기록이 뜻하는 성향'으로 환산 */
function evoBeta(rows,key,avgOf,mOf,n){const B=[];for(let i=0;i<n;i++){let sxy=0,sxx=0;rows.forEach(r=>{const a=avgOf(r);if(!a||a.n<5)return;const m=mOf(a,i);if(!(m>0))return;const x=Math.log(r[key][i]),y=Math.log(Math.max(.35,Math.min(2.8,r.v[i]/m)));sxy+=x*y;sxx+=x*x});B.push(sxx>.5?Math.max(.35,Math.min(1.2,sxy/sxx)):1)}return B}
/* 평균 유지: 기록비의 로그 평균은 늘 0보다 작아(산술평균 대비 비율) 그대로 쓰면 포지션 전체 성향이 해마다 내려감 → 포지션별로 '성향 로그 평균'이 유지되게 오프셋 */
function evoOff(rows,key,avgOf,B,n){const O={};const acc={};rows.forEach(r=>{const a=avgOf(r);if(!a||a.n<5)return;const q=acc[r.g]=acc[r.g]||{n:0,h:Array(n).fill(0),t:Array(n).fill(0)};q.n++;for(let i=0;i<n;i++){const m=a.s[i]/a.n;const ratio=m>0?Math.max(.35,Math.min(2.8,r.v[i]/m)):1;q.h[i]+=Math.log(r[key][i]);q.t[i]+=Math.log(ratio)/B[i]}});
  for(const g in acc){const q=acc[g];O[g]=q.h.map((h,i)=>(h-q.t[i])/q.n)}return O}
function dhEvolve(){const rows=[];for(const id in S.ps){const q=S.ps[id];if(!q.ss||(q.mins||0)<900)continue;const p=pl(+id);if(!p||p.g==='GK'||!p.dh||!LIGA.includes(clubOf(+id)))continue;
    rows.push({id:+id,g:p.g,v:[(q.ss.ta||0)/q.mins*90,(q.ss.it||0)/q.mins*90],mins:q.mins,dh:p.dh})}
  const avg={};rows.forEach(r=>{const a=avg[r.g]=avg[r.g]||{n:0,s:[0,0]};a.n++;r.v.forEach((x,i)=>a.s[i]+=x)});
  const B=evoBeta(rows,'dh',r=>avg[r.g],(a,i)=>a.s[i]/a.n,2);let n=0;const O=evoOff(rows,'dh',r=>avg[r.g],B,2);
  rows.forEach(r=>{const a=avg[r.g];if(!a||a.n<5)return;const al=HAB_ALPHA*r.mins/(r.mins+2000);
    const nd=r.dh.map((h,i)=>{const m=a.s[i]/a.n;if(m<=0)return h;const ratio=Math.max(.35,Math.min(2.8,r.v[i]/m));return +Math.max(.4,Math.min(2.5,Math.exp((1-al)*Math.log(h)+al*(Math.log(ratio)/B[i]+((O[r.g]||[])[i]||0))))).toFixed(2)});
    const q=S.ps[r.id];q.dhPrev=r.dh;q.dh=nd;n++});return n}
{const _ro5=rollover;rollover=function(){try{dhEvolve()}catch(e){console.error(e)}_ro5()}}
function habEvolve(){const rows=[];for(const id in S.ps){const q=S.ps[id];if(!q.ss||(q.mins||0)<900)continue;const p=pl(+id);if(!p||p.g==='GK'||!p.hab||!LIGA.includes(clubOf(+id)))continue;
    const v=[q.ss.da||0,q.shs||0,q.ss.cr||0,q.ss.rn||0,q.ss.tb||0,q.ss.ca||0].map(x=>x/q.mins*90);rows.push({id:+id,g:p.g,v,mins:q.mins,hab:p.hab})}
  const avg={};rows.forEach(r=>{const a=avg[r.g]=avg[r.g]||{n:0,s:[0,0,0,0,0,0]};a.n++;r.v.forEach((x,i)=>a.s[i]+=x)});let n=0;
  const B=evoBeta(rows,'hab',r=>avg[r.g],(a,i)=>a.s[i]/a.n,6);const O=evoOff(rows,'hab',r=>avg[r.g],B,6);
  rows.forEach(r=>{const a=avg[r.g];if(!a||a.n<5)return;const al=HAB_ALPHA*r.mins/(r.mins+2000);
    const nh=r.hab.map((h,i)=>{const m=a.s[i]/a.n;if(m<=0)return h;const ratio=Math.max(.35,Math.min(2.8,r.v[i]/m));return +Math.max(.35,Math.min(2.8,Math.exp((1-al)*Math.log(h)+al*(Math.log(ratio)/B[i]+((O[r.g]||[])[i]||0))))).toFixed(2)});
    const q=S.ps[r.id];q.habPrev=r.hab;q.hab=nh;n++});return n}
{const _ro3=rollover;rollover=function(){try{habEvolve()}catch(e){console.error(e)}_ro3()}}
// 선수 정보에 성향 표시(평균 1.0 기준, 1.3 이상 '많음', 0.75 이하 '적음', 지난 시즌 대비 변화 화살표)
function habLine(p){const h=p&&p.hab;if(!h)return '';const q=S.ps[p.id]||{},pv=q.habPrev;const tags=h.map((v,i)=>{if(v<1.3&&v>.75)return '';const d=pv?v-pv[i]:0;return `<span class="ptag${v>=1.3?' m':''}">${HAB_NM[i]} ${v>=1.3?'많음':'적음'}${Math.abs(d)>=.05?(d>0?' ▲':' ▼'):''}</span>`}).filter(Boolean);if(p.dh){const pd=q.dhPrev;p.dh.forEach((v,i)=>{if(v<1.3&&v>.75)return;const d=pd?v-pd[i]:0;tags.push(`<span class="ptag${v>=1.3?' m':''}">${['태클 시도','가로채기'][i]} ${v>=1.3?'많음':'적음'}${Math.abs(d)>=.05?(d>0?' ▲':' ▼'):''}</span>`)})}
  return tags.length?`<div class="note" style="margin-top:4px">플레이 성향 ${tags.join(' ')}</div>`:''}
if(typeof devLine==='function'){const _dl=devLine;devLine=function(p){return _dl(p)+habLine(p)}}

// ---- 선수 유형·개인 특성·시그니처(실제 기록 기반, 시즌마다 게임 기록으로 특성 변화) ----
const SIGN={'스루패스':'킬패스 장인','볼 운반':'폭주 기관차','방향 전환':'대각 전환 스페셜리스트','가로채기':'패스길 사냥꾼','박스 침투':'박스 습격자','파울 유도':'파울 유도 장인','크로스':'크로스 장인','공중볼':'제공권 지배자','태클':'태클 머신','찬스 메이커':'찬스 공장','전방 압박':'압박 사냥개','박스 포식자':'골 냄새','드리블 돌파':'드리블 마법사','중거리 선호':'중거리 대포','라인 줄타기':'라인 브레이커','전진 패스':'전진 패스 장인','공중전 강자':'공중전 지배자','태클 장인':'태클 마스터','드리블 장인':'드리블 마스터','정확한 슈팅':'정밀 타격','찬스의 질':'결정적 패스','결정력':'원샷 원킬','프리킥 스페셜리스트':'프리킥 마스터'};
const TR_DESC={'중거리 선호':'박스 밖에서 슈팅을 더 자주 시도','박스 침투':'크로스·컷백 때 박스 안 자리를 우선 맡음','라인 줄타기':'오프사이드 라인에 붙어 뒷공간 침투','드리블 돌파':'1대1 돌파 시도 많음','볼 운반':'공을 몰고 전진','크로스':'크로스 시도 많음','스루패스':'스루패스 시도 많음','방향 전환':'반대편으로 길게 전환','찬스 메이커':'박스 안 동료에게 주는 패스 선호','전방 압박':'공 잡은 상대에게 적극적으로 달려듦','공중볼':'공중볼 경합에 강함','태클':'태클 성공률 높음','가로채기':'패스길 차단에 강함','전진 패스':'앞으로 찔러주는 패스 선호','파울 유도':'파울을 잘 얻어냄','박스 포식자':'박스 안 마무리 자리를 잘 잡음','공중전 강자':'공중볼 경합 승률이 높음 — 능력치에 이미 반영(관련 능력치 19 이상일 때만 추가 효과)','태클 장인':'1대1 수비(태클) 성공률이 높음 — 능력치에 이미 반영(관련 능력치 19 이상일 때만 추가 효과)','드리블 장인':'돌파 성공률이 높음 — 능력치에 이미 반영(관련 능력치 19 이상일 때만 추가 효과)','정확한 슈팅':'유효슈팅 비율이 높음 — 능력치에 이미 반영(관련 능력치 19 이상일 때만 추가 효과)','찬스의 질':'만들어 주는 찬스의 질이 높음(키패스당 기대도움) — 능력치에 이미 반영(관련 능력치 19 이상일 때만 추가 효과)','결정력':'기대득점보다 골을 더 넣음 — 능력치에 이미 반영(관련 능력치 19 이상일 때만 추가 효과)','프리킥 스페셜리스트':'직접 프리킥 득점력이 높음 — 능력치에 이미 반영(관련 능력치 19 이상일 때만 추가 효과)'};
/* 유형 기록이 없는 선수(새 유스 등): 능력치·키·주발로 역할 점수 예측(arche5와 같은 릿지식) → 유형, 특성은 비움(시즌 기록으로 생김) */
function pstPred(p){if(!p)return null;if(p.g==='GK')return [(p.gk_sweep||10)>=14?1:0,[0,0],[],[]];const M=G.pstM&&G.pstM[p.g];if(!M)return null;
  const sd=/Left/.test(p.sub||'')?'L':/Right/.test(p.sub||'')?'R':null;const inv=!sd||!['left','right'].includes(p.foot)?.5:((sd==='L')===(p.foot==='right')?1:0);
  const x=[...G.attrs.slice(0,10).map(k=>p[k]??10),p.h||180,inv].map((v,i)=>(v-M.mu[i])/M.sd[i]);const sc=M.W[0].map((_,j)=>{let v=M.W[0][j];x.forEach((z,i)=>v+=z*M.W[i+1][j]);return +v.toFixed(2)});
  const tr=[];if(p.hab||p.dh)YTR.forEach(([n,src,i,th])=>{const v=(src==='t'?p.hab:p.dh)||[];if(v[i]>=th&&tr.length<2)tr.push(n)});
  return [sc.indexOf(Math.max(...sc)),sc,tr,[]]}
/* 새 유스 초기 특성: 성향값이 기존 선수 보유율과 같은 비율이 되는 임계 이상이면 부여(최대 2개). v60 — 유스가 특성 없이 들어와 10시즌 뒤 리그 평균 특성 0.9→0.35개로 줄던 문제 */
const YTR=[['드리블 돌파','t',0,1.82],['중거리 선호','t',1,1.47],['크로스','t',2,2.19],['라인 줄타기','t',3,1.89],['스루패스','t',4,1.9],['볼 운반','t',5,1.96],['태클','d',0,1.48],['가로채기','d',1,1.92]];
function pstOf(p){if(!p)return null;const q=S.ps&&S.ps[p.id];return (q&&q.pst)||p.pst||null}
{const _pl1=pl;pl=function(id){const p=_pl1(id);if(p){const q=S.ps&&S.ps[id];if(q&&q.pst)p.pst=q.pst;else if(!p.pst){const b=BASE[id];if(b&&!b.pstC){b.pstC=1;b.pst=pstPred(Object.assign({},b,{id}))}p.pst=b?b.pst:pstPred(p)}}return p}}
function styleLine(p){const ps=pstOf(p);if(!ps||!E3.ROLES[p.g])return '';const rs=E3.ROLES[p.g],t=rs[ps[0]];const q=S.ps[p.id]||{},prev=q.pstPrev;
  const tr=(ps[2]||[]).map(n=>`<span class="ptag" data-trd="${esc(n)}" style="cursor:pointer">${esc(n)}${prev&&!(prev[2]||[]).includes(n)?' ▲':''}</span>`).join(' ');
  const sg=(ps[3]||[]).map(n=>`<span class="ptag m" data-trd="${esc(n)}" data-sig="1" style="cursor:pointer">★ ${esc(SIGN[n]||n)}</span>`).join(' ');
  const gone=prev?(prev[2]||[]).filter(n=>!(ps[2]||[]).includes(n)).map(n=>`<span class="ptag" style="opacity:.5;text-decoration:line-through">${esc(n)}</span>`).join(' '):'';
  return `<div class="note" style="margin-top:4px">선수 유형 <b style="color:var(--text)">${esc(t?t[0]:'-')}</b>${sg?' · '+sg:''}${tr||gone?`<div style="margin-top:3px">특성 ${tr}${gone?' '+gone:''}</div>`:''}</div>`}
if(typeof devLine==='function'){const _dl2=devLine;devLine=function(p){return _dl2(p)+styleLine(p)}}
/* 시즌 말 특성 변화: 1,500분 이상 뛴 라리가 선수의 그 시즌 기록(90분당, 같은 포지션 평균 대비 z)으로 특성 추가·제거(최대 4개) */
const TR_EVO={'드리블 돌파':'da','크로스':'cr','스루패스':'tb','찬스 메이커':'kp','공중볼':'aw','태클':'tkw','가로채기':'it','볼 운반':'ca','라인 줄타기':'rn'};
/* 시즌 말 특성 변화(v60): 이전 방식(추가 z≥1.4, 제거 z<−0.2)은 엔진 기록이 실제보다 잡음이 커서 매년 특성이 줄어듦(10시즌 0.9→0.57개)
   → 포지션·특성별 보유 비율을 첫 시즌 비율로 유지: 제거는 2시즌 연속 z<−0.5(시그니처 제외), 추가는 비율이 모자란 만큼 z≥1.0 상위부터
   새 시그니처: 같은 특성으로 3시즌 연속 z≥2.3(1,500분+)이면 시그니처로 승격(선수당 1개, 기존 보유자 제외) */
const SIG_Z=2.3,SIG_N=3;
function traitEvolve(){const rows=[];for(const id in S.ps){const q=S.ps[id];if(!q.ss||(q.mins||0)<1500)continue;const p=pl(+id);if(!p||p.g==='GK'||!LIGA.includes(clubOf(+id)))continue;const ps=pstOf(p);if(!ps)continue;
    rows.push({id:+id,g:p.g,ps,tr:[...(ps[2]||[])],sg:[...(ps[3]||[])],v:Object.fromEntries(Object.entries(TR_EVO).map(([n,k])=>[n,(q.ss[k]||0)/q.mins*90]))})}
  const st={};rows.forEach(r=>{for(const n in r.v){const a=((st[r.g]=st[r.g]||{})[n]=st[r.g][n]||[]);a.push(r.v[n])}});
  rows.forEach(r=>{r.z={};for(const n in r.v){const a=st[r.g][n];if(!a||a.length<6)continue;const m=a.reduce((x,y)=>x+y,0)/a.length,sd=Math.sqrt(a.reduce((x,y)=>x+(y-m)*(y-m),0)/a.length)||1;r.z[n]=(r.v[n]-m)/sd}});
  if(!S.trT){S.trT={};rows.forEach(r=>{const t=S.trT[r.g]=S.trT[r.g]||{_n:0};t._n++;r.tr.forEach(n=>{if(TR_EVO[n])t[n]=(t[n]||0)+1})});for(const g in S.trT){const t=S.trT[g];for(const n in t)if(n!=='_n')t[n]=+(t[n]/t._n).toFixed(3);delete t._n}}
  let ch=0;
  // 제거: 2시즌 연속 부진
  rows.forEach(r=>{const q=S.ps[r.id];const lo=q.trLo=q.trLo||{};for(const n in r.z){if(!r.tr.includes(n)){delete lo[n];continue}if(r.z[n]<-.5){lo[n]=(lo[n]||0)+1;if(lo[n]>=2&&!r.sg.includes(n)){r.tr.splice(r.tr.indexOf(n),1);delete lo[n];ch++}}else delete lo[n]}});
  // 추가: 포지션·특성별 목표 비율까지 z 상위부터
  const byG={};rows.forEach(r=>(byG[r.g]=byG[r.g]||[]).push(r));
  for(const g in byG){const R=byG[g],T=S.trT[g]||{};for(const n of Object.keys(TR_EVO)){const want=Math.round((T[n]||0)*R.length);let have=R.filter(r=>r.tr.includes(n)).length;if(have>=want)continue;
    const cand=R.filter(r=>!r.tr.includes(n)&&r.tr.length<4&&(r.z[n]??-9)>=1).sort((a,b)=>b.z[n]-a.z[n]);for(const r of cand){if(have>=want)break;r.tr.push(n);have++;ch++}}}
  // 시그니처 승격
  rows.forEach(r=>{const q=S.ps[r.id];const hi=q.trHi=q.trHi||{};for(const n in r.z){if(r.z[n]>=SIG_Z&&r.tr.includes(n))hi[n]=(hi[n]||0)+1;else delete hi[n];
      if(hi[n]>=SIG_N&&!r.sg.length){r.sg.push(n);q.sigNew=S.season;ch++;if(typeof inbox==='function'&&clubOf(r.id)===S.club)inbox('news','',`${pl(r.id).name}, 시그니처 '${n}' 획득`,`3시즌 연속 리그 최상위 수준의 기록으로 고유 플레이 스타일이 생겼습니다.`)}}});
  rows.forEach(r=>{const q=S.ps[r.id];q.pstPrev=r.ps;q.pst=[r.ps[0],r.ps[1],r.tr,r.sg]});return ch}
{const _ro4=rollover;rollover=function(){try{traitEvolve()}catch(e){console.error(e)}_ro4()}}

/* 휴대폰: 특성 태그를 누르면 설명 표시 */
document.addEventListener('click',e=>{const t=e.target.closest('[data-trd]');if(!t)return;const n=t.dataset.trd;const box=t.closest('.note');if(!box)return;let d=box.querySelector('.trdesc');if(!d){d=document.createElement('div');d.className='trdesc';d.style.cssText='margin-top:4px;padding:6px 8px;border-radius:8px;background:var(--line);color:var(--text);font-size:12px';box.appendChild(d)}
  const txt=(t.dataset.sig?`★ ${SIGN[n]||n} — 시그니처(같은 포지션 상위 약 1%), 효과 1.6배 · `:'')+`${n}: ${TR_DESC[n]||''}`;if(d.dataset.k===n&&d.style.display!=='none'){d.style.display='none';return}d.dataset.k=n;d.textContent=txt;d.style.display=''});

