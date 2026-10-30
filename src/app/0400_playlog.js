// ================= 플레이 로그 · 분석실 · 로그 내보내기(v110) =================
// ① 경기마다 S.plog에 요약 기록(최근 150경기, 경기당 약 1~2KB): 대회·상대·결과·xG·슈팅·점유·전술·선발·교체·경기 중 전술 변경·득실점 방식·15분 구간 xG·이상 징후
// ② 분석실: 시뮬레이션 점검(리그 평균 vs 실제 범위, 이상 징후) + 전술 분석(성향×대형 성적, 실점 지역·방식, 시간대, 전술 변경 효과, 상대 성향별)
// ③ 내보내기: 로그 JSON을 클립보드로 복사(안 되면 텍스트 상자에서 직접 복사)
const LANES=['좌','좌중','중앙','우중','우'];
function lgSide(fx){return fx.h===S.club?0:1}
// 경기 중: 전술 변경·교체·이상 징후 수집
{const _sm=startMatch;startMatch=function(fx){const r=_sm.apply(this,arguments);try{if(typeof M==='undefined'||!M||!M.m||M.fx!==fx||M._lg)return r;const me=M.me,api=M.m.api,st=M.m.st;M._lg={chg:[],an:{freeze:0,tele:0,nan:0},last:null,stat:0};
  const _st=api.setTactic;api.setTactic=function(s,patch){try{if(s===me){const T=M.m.T[me];const d=[];if(patch.preset&&patch.preset!==T.preset)d.push('성향 '+T.preset+'→'+patch.preset);if(patch.form){if(patch.form.base&&patch.form.base!==T.form.base)d.push('대형 '+T.form.base+'→'+patch.form.base);if(patch.form.def&&patch.form.def!==T.form.def)d.push('수비 대형 '+patch.form.def);if(patch.form.atk&&patch.form.atk!==T.form.atk)d.push('공격 대형 '+patch.form.atk)}
    if(patch.ti&&!patch.preset){const o=T.ti||[];patch.ti.forEach((v,i)=>{if(v!==o[i])d.push(`지시${i}:${o[i]}→${v}`)})}if(d.length)M._lg.chg.push([st.min,d.join(', ')])}}catch(e){}return _st.apply(this,arguments)};
  const _sh=api.shout;if(_sh)api.shout=function(s,k){try{if(s===me)M._lg.chg.push([st.min,'외침 '+k])}catch(e){}return _sh.apply(this,arguments)};
  const _step=M.m.step;M.m.step=function(){const out=_step.apply(this,arguments);try{const L=M._lg;for(const f of st.frames||[]){const ps=Object.values(f.p);if(ps.some(p=>!Number.isFinite(p[0])||!Number.isFinite(p[1]))){L.an.nan++;continue}
      if(f.rs)L.rsT=f.t;if(L.last&&!f.rs&&!L.last.rs&&!(L.rsT!=null&&f.t-L.rsT<4)){let mx=0;for(const id in f.p){const a=L.last.p[id];if(!a)continue;const d=Math.hypot(f.p[id][0]-a[0],f.p[id][1]-a[1]);if(d>mx)mx=d}if(mx>15&&!(Math.abs(f.b[0]-52.5)<.1&&Math.abs(f.b[1]-34)<.1))L.an.tele++;
        const same=Math.abs(f.b[0]-L.last.b[0])+Math.abs(f.b[1]-L.last.b[1])<.01&&f.o===L.last.o;L.stat=same?L.stat+.5:0;if(L.stat===60)L.an.freeze++}L.last=f}}catch(e){}return out};
}catch(e){console.error(e)}return r}}
function lgGoals(st,s){const out=[];const A=st.ana;(st.ev||[]).forEach(e=>{if(e.t!=='goal'||e.s!==s)return;let dist=null;try{const ag=A&&Object.keys(A.S).find(id=>(A.S[id]||[]).some(x=>x[3]==='g'));}catch(er){}
  const cnt=!!(e.tr&&e.tr[0]&&e.tr[0].tr);out.push({m:e.m,t:e.type||'',l:e.lane??null,c:cnt?1:0,x:e.xg??null})});return out}
function lgStore(R,res,me,fx){try{if(typeof M==='undefined'||!M||!M.m||M.fx!==fx)return;const st=M.m.st,T=M.m.T,o=1-me;
  const xgT=Array.from({length:7},()=>[0,0]),gT=Array.from({length:7},()=>[0,0]);(st.ev||[]).forEach(e=>{if(!['goal','save','miss','block'].includes(e.t)||e.xg==null)return;const k=Math.min(6,Math.floor((e.m-1)/15));xgT[k][e.s===me?0:1]+=+e.xg;if(e.t==='goal')gT[k][e.s===me?0:1]++});
  const L=M._lg||{chg:[],an:{}};const rat=(R.pst&&R.pst[0]||[]).filter(x=>!x.nr).map(x=>x.r);
  const rec={v:1,d:S.date,ss:S.season,comp:fx.eu?'eu':fx.cup!=null?'cup':fx.po?'po':fx.r?'lg':'fr',cn:(typeof matchTheme==='function'&&matchTheme(fx)||{}).n||'',opp:CLUBS[me===0?fx.a:fx.h].name,oppR:CLUBS[me===0?fx.a:fx.h].rep,home:me===0?1:0,
    sc:[st.sc[me],st.sc[o]],xg:[+st.xg[me].toFixed(2),+st.xg[o].toFixed(2)],sh:[st.sh?st.sh[me]:0,st.sh?st.sh[o]:0],sot:[st.sot?st.sot[me]:0,st.sot?st.sot[o]:0],poss:R.poss||null,
    t:{f:T[me].form.base,pr:T[me].preset,ti:[...(T[me].ti||[])],mt:T[me].ment||''},ot:{f:T[o].form.base,pr:T[o].preset},xi:(R.pst&&R.pst[0]||[]).filter(x=>!x.sub).map(x=>x.id),
    subs:(st.subs[me]||[]).map(x=>[x.m,x.out.name,x.inP.name]),chg:L.chg.slice(0,20),gf:lgGoals(st,me),ga:lgGoals(st,o),xgT:xgT.map(a=>[+a[0].toFixed(2),+a[1].toFixed(2)]),gT,
    cd:[(st.ev||[]).filter(e=>e.s===me&&e.t==='yellow').length,(st.ev||[]).filter(e=>e.s===me&&e.t==='red').length],rd:(st.ev||[]).filter(e=>e.t==='red').map(e=>[e.s===me?1:0,e.m||0,e.p,e.dr===1?'D':e.dr===0?'2Y':'?']),an:L.an,rt:rat.length?+(rat.reduce((a,b)=>a+b,0)/rat.length).toFixed(2):null,sp:[st.corner?st.corner[me]:0,st.fouls?st.fouls[me]:0]};
  S.plog=(S.plog||[]).concat([rec]).slice(-150)}catch(e){console.error(e)}}
{const _br=buildReport;buildReport=function(res,me,fx){const R=_br.apply(this,arguments);try{lgStore(R,res,me,fx)}catch(e){}return R}}
// ---- 분석 ----
function lgRes(x){return x.sc[0]>x.sc[1]?'W':x.sc[0]<x.sc[1]?'L':'D'}
function lgAgg(L){const n=L.length;if(!n)return null;const w=L.filter(x=>lgRes(x)==='W').length,d=L.filter(x=>lgRes(x)==='D').length;const s=k=>L.reduce((a,x)=>a+k(x),0)/n;
  return {n,w,d,l:n-w-d,ppg:(w*3+d)/n,gf:s(x=>x.sc[0]),ga:s(x=>x.sc[1]),xf:s(x=>x.xg[0]),xa:s(x=>x.xg[1])}}
function lgSim(){const fx=(typeof fxLg==='function'?fxLg(CLUBS[S.club].lg):S.fixtures||[]).filter(f=>f.res&&f.res.sc);const n=fx.length;const out=[];
  if(n>=20){const g=fx.reduce((a,f)=>a+f.res.sc[0]+f.res.sc[1],0)/n,hw=fx.filter(f=>f.res.sc[0]>f.res.sc[1]).length/n,dr=fx.filter(f=>f.res.sc[0]===f.res.sc[1]).length/n;
    {/* v234: 기준 = 그 리그 실제 경기당 골(FBref, LGGPM) ±0.35 — 이전엔 모든 리그에 라리가 기준 2.4~3.0 */const lg0=CLUBS[S.club].lg,t0=(typeof LGGPM!=='undefined'&&LGGPM[lg0])||2.7,lo=+(t0-.35).toFixed(1),hi=+(t0+.35).toFixed(1);out.push(['경기당 골',g.toFixed(2),`${lo}~${hi}`,g>=lo&&g<=hi])}out.push(['홈 승률',Math.round(hw*100)+'%','40~48%',hw>=.4&&hw<=.48]);out.push(['무승부 비율',Math.round(dr*100)+'%','22~30%',dr>=.22&&dr<=.3])}
  const P=(S.plog||[]).filter(x=>x.ss===S.season&&x.comp!=='fr');if(P.length>=10){const y=P.reduce((a,x)=>a+x.cd[0],0)/P.length;out.push(['우리 팀 경기당 경고',y.toFixed(1),'1.5~3.0',y>=1.5&&y<=3]);
    const xr=P.reduce((a,x)=>a+x.sc[0],0)/Math.max(.01,P.reduce((a,x)=>a+x.xg[0],0));out.push(['우리 득점 / xG',xr.toFixed(2),'0.8~1.25',xr>=.8&&xr<=1.25]);
    const xa=P.reduce((a,x)=>a+x.sc[1],0)/Math.max(.01,P.reduce((a,x)=>a+x.xg[1],0));out.push(['우리 실점 / 상대 xG',xa.toFixed(2),'0.8~1.25',xa>=.8&&xa<=1.25])}
  return {n,rows:out}}
function lgInsights(P){const ins=[];if(P.length<5){ins.push(['note',`경기 기록 ${P.length}개 — 5경기 이상부터 분석합니다.`]);return ins}
  const ga=P.flatMap(x=>x.ga),gf=P.flatMap(x=>x.gf);
  if(ga.length>=5){const byL=[0,0,0,0,0];ga.forEach(g=>{if(g.l!=null)byL[4-g.l]++});const mx=Math.max(...byL),i=byL.indexOf(mx);if(mx/ga.length>=.35)ins.push(['bad',`실점의 ${Math.round(mx/ga.length*100)}%가 우리 ${LANES[i]} 쪽에서 나옴(${mx}/${ga.length}) — 그쪽 측면 수비·풀백 지시 점검`]);
    const byT={};ga.forEach(g=>byT[g.t]=(byT[g.t]||0)+1);const top=Object.entries(byT).sort((a,b)=>b[1]-a[1])[0];if(top&&top[1]/ga.length>=.3)ins.push(['bad',`실점 방식 1위: ${lgTN(top[0])} ${top[1]}골(${Math.round(top[1]/ga.length*100)}%)`]);
    const cnt=ga.filter(g=>g.c).length;if(cnt/ga.length>=.3)ins.push(['bad',`역습 실점 ${cnt}골(${Math.round(cnt/ga.length*100)}%) — 수비 라인·전방 압박 강도 조정 고려`])}
  const late=P.reduce((a,x)=>a+(x.gT[5]?x.gT[5][1]:0)+(x.gT[6]?x.gT[6][1]:0),0),early=P.reduce((a,x)=>a+x.gT.slice(0,5).reduce((b,y)=>b+y[1],0),0);const tot=late+early;
  if(tot>=6&&late/tot>=.4)ins.push(['bad',`76분 이후 실점 ${late}/${tot}골(${Math.round(late/tot*100)}%) — 체력 관리·교체 시점을 앞당겨 보세요`]);
  const sf=P.reduce((a,x)=>a+x.sc[0],0),xf=P.reduce((a,x)=>a+x.xg[0],0);if(xf>3){const r=sf/xf;if(r<.8)ins.push(['bad',`득점이 xG보다 적음(${sf}골/xG ${xf.toFixed(1)}) — 결정력 낮은 선수에게 슈팅이 몰리는지 확인`]);else if(r>1.25)ins.push(['good',`득점이 xG보다 많음(${sf}골/xG ${xf.toFixed(1)}) — 결정력이 좋거나 운이 따르는 중, 유지된다고 보장되진 않음`])}
  const xa=P.reduce((a,x)=>a+x.xg[1],0)/P.length;if(xa<.9)ins.push(['good',`경기당 상대 xG ${xa.toFixed(2)} — 수비가 단단함`]);else if(xa>1.6)ins.push(['bad',`경기당 상대 xG ${xa.toFixed(2)} — 기회를 많이 내줌`]);
  if(gf.length>=5){const sp=gf.filter(g=>['corner','fkx','fk','pen'].includes(g.t)).length;if(sp/gf.length>=.35)ins.push(['note',`득점의 ${Math.round(sp/gf.length*100)}%가 세트피스 — 오픈 플레이 득점력 보강 여지`])}
  // 전술 변경 효과
  const ch=P.flatMap(x=>x.chg.filter(c=>c[0]>=15&&c[0]<=80).map(c=>({x,m:c[0],d:c[1]})));if(ch.length>=4){let b=0,a=0;ch.forEach(({x,m})=>{const k=Math.floor((m-1)/15);const bef=x.xgT.slice(0,k).reduce((s,y)=>s+y[0]-y[1],0)/Math.max(1,k),aft=x.xgT.slice(k+1).reduce((s,y)=>s+y[0]-y[1],0)/Math.max(1,6-k);b+=bef;a+=aft});
    ins.push([a>b?'good':'bad',`경기 중 전술 변경 ${ch.length}회: 변경 전 15분당 xG 차 ${(b/ch.length).toFixed(2)} → 변경 후 ${(a/ch.length).toFixed(2)}`])}
  return ins}
function lgTN(t){return {through:'스루패스',cutback:'컷백',combo:'연계',longshot:'중거리',solo:'개인 돌파',rebound:'리바운드',lowcross:'낮은 크로스',cross:'크로스 헤더',corner:'코너킥',fkx:'프리킥 크로스',fk:'직접 프리킥',pen:'페널티킥',gkErr:'골키퍼 실수',spfoot:'세트피스 슈팅'}[t]||t||'기타'}
function lgView(){const P=(S.plog||[]).filter(x=>x.comp!=='fr');const PS=P.filter(x=>x.ss===S.season);const sim=lgSim();const tab=UI.lgT||'tac';
  const row=(a,b,c,ok)=>`<div style="display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px solid var(--line)"><span>${a}</span><span class="num"><b>${b}</b> <span class="note" style="display:inline">실제 ${c}</span> ${ok==null?'':ok?'<span style="color:var(--good)">✓ 정상</span>':'<span style="color:var(--warn)">! 범위 밖</span>'}</span></div>`;
  const an=P.reduce((a,x)=>({f:a.f+(x.an.freeze||0),t:a.t+(x.an.tele||0),n:a.n+(x.an.nan||0)}),{f:0,t:0,n:0});
  let body='';
  if(tab==='sim'){body=`<div class="lbl">리그 결과 (이번 시즌 ${sim.n}경기)</div>${sim.rows.length?sim.rows.map(r=>row(...r)).join(''):'<p class="note">리그 경기가 20경기 이상 끝나면 점검합니다.</p>'}
    <div class="lbl">엔진 이상 징후 (기록된 내 경기 ${P.length}경기)</div>${row('30초 이상 멈춤',an.f+'회','0',an.f===0)}${row('선수 위치 점프(0.5초 15m+)',an.t+'회','경기당 1회 이하',an.t<=Math.max(1,P.length))}${row('좌표 오류',an.n+'회','0',an.n===0)}
    <p class="note">위치 점프: 엔진이 공중볼·세트피스 경합 뒤 선수를 공 위치로 옮기는 처리(3D 리플레이에선 달려오는 모습으로 보정)라 경기당 1회 이하는 정상입니다. 실제 범위: 유럽 주요 리그 최근 시즌 평균 근처의 대략적인 범위입니다. 범위 밖이 계속되면 로그를 내보내 주세요.</p>`}
  else if(tab==='tac'){const ins=lgInsights(PS.length>=5?PS:P);
    const byT={};PS.forEach(x=>{const k=x.t.pr+' · '+x.t.f;(byT[k]=byT[k]||[]).push(x)});const byO={};PS.forEach(x=>{(byO[x.ot.pr]=byO[x.ot.pr]||[]).push(x)});
    const tb=(o)=>Object.entries(o).map(([k,L])=>[k,lgAgg(L)]).sort((a,b)=>b[1].n-a[1].n).map(([k,a])=>`<tr><td style="text-align:left">${esc(k)}</td><td>${a.n}</td><td>${a.w}-${a.d}-${a.l}</td><td>${a.ppg.toFixed(2)}</td><td>${a.xf.toFixed(2)}</td><td>${a.xa.toFixed(2)}</td></tr>`).join('');
    const th='<tr><th style="text-align:left">구분</th><th>경기</th><th>승-무-패</th><th>승점/경기</th><th>xG</th><th>상대 xG</th></tr>';
    const gaL=[0,0,0,0,0],gfL=[0,0,0,0,0];PS.forEach(x=>{x.ga.forEach(g=>{if(g.l!=null)gaL[4-g.l]++});x.gf.forEach(g=>{if(g.l!=null)gfL[g.l]++})});
    const tm=Array.from({length:7},(_,k)=>PS.reduce((a,x)=>[a[0]+(x.gT[k]?x.gT[k][0]:0),a[1]+(x.gT[k]?x.gT[k][1]:0)],[0,0]));
    body=`<div class="lbl">자동 진단</div><ul class="rnotes">${ins.map(([k,t])=>`<li class="${k}">${esc(t)}</li>`).join('')||'<li>특이사항 없음</li>'}</ul>
     <div class="lbl">성향 · 대형별 (이번 시즌)</div>${PS.length?`<div class="pstw"><table class="pst">${th}${tb(byT)}</table></div>`:'<p class="note">기록 없음</p>'}
     <div class="lbl">상대 성향별</div>${PS.length?`<div class="pstw"><table class="pst">${th}${tb(byO)}</table></div>`:''}
     <div class="lbl">득점 · 실점 공격 방향 <span class="note">(공격 지역 진입·크로스 위치, 코너킥은 찬 쪽 · 우리 공격 기준 좌→우, 실점은 우리 수비 쪽 기준 · v117 이전 경기는 슈팅 위치라 대부분 중앙)</span></div><div class="lanes">${LANES.map((l,i)=>`<div><small>${l}</small><b>${gfL[i]}</b><span>실점 ${gaL[i]}</span></div>`).join('')}</div>
     <div class="lbl">시간대별 득점 · 실점</div><div class="lanes" style="grid-template-columns:repeat(7,1fr)">${tm.map((v,k)=>`<div><small>${k<6?`${k*15+1}-${k*15+15}`:'추가'}</small><b>${v[0]}</b><span>${v[1]}</span></div>`).join('')}</div>`}
  else{body=`<p class="note">로그 ${P.length}경기(약 ${Math.round(JSON.stringify(P).length/1024)}KB). 복사한 뒤 Claude 대화창에 붙여넣으면 정밀 분석·엔진 점검에 씁니다.</p>
    <button class="btn" data-lgcopy="1">로그 복사</button><textarea id="lgTxt" readonly style="width:100%;height:140px;margin-top:8px;font:11px/1.3 monospace;background:var(--bg2,#0e1218);color:var(--muted);border:1px solid var(--line);border-radius:8px;display:none"></textarea>`}
  sheet(`<button class="x" data-close>닫기</button><h3>분석실</h3><div class="seg" style="grid-template-columns:repeat(3,1fr);margin-bottom:8px">${[['tac','전술 분석'],['sim','시뮬레이션 점검'],['exp','로그 내보내기']].map(([k,l])=>`<button data-lgt="${k}" aria-pressed="${tab===k}">${l}</button>`).join('')}</div>${body}`)}
function lgExport(){const P=S.plog||[];return JSON.stringify({app:'WFM',ver:(typeof APPV!=='undefined'?APPV:null),club:CLUBS[S.club].name,date:S.date,season:S.season,sim:lgSim(),log:P})}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-lgt],[data-lgcopy],[data-lgopen]');if(!b)return;e.stopPropagation();e.preventDefault();
  if(b.dataset.lgt){UI.lgT=b.dataset.lgt;lgView();return}if(b.dataset.lgopen){lgView();return}
  if(b.dataset.lgcopy){const txt=lgExport();const ta=document.getElementById('lgTxt');const show=()=>{if(ta){ta.style.display='block';ta.value=txt;ta.focus();ta.select()}};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(()=>{toast('로그를 복사했습니다. 대화창에 붙여넣어 주세요');show()}).catch(()=>{show();toast('자동 복사가 막혀 있어요. 아래 상자를 길게 눌러 복사해 주세요')});else{show();toast('아래 상자를 길게 눌러 복사해 주세요')}}},true);
// 진입점: 경력 탭 위 카드, 경기 리포트 아래 버튼
{const _cv=careerView;careerView=function(){const h=_cv.apply(this,arguments);try{if(!UI.cv||UI.cv==='mgr'||UI.cv==='me'||UI.cv==='career'){const n=(S.plog||[]).length;return `<section class="card pad" style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:10px"><div><h2 style="margin:0">분석실</h2><p class="note" style="margin:2px 0 0">플레이 로그 ${n}경기 · 전술 진단 · 시뮬레이션 점검 · 로그 내보내기</p></div><button class="btn sm" data-lgopen="1" style="white-space:nowrap;flex:none">열기</button></section>`+h}}catch(e){}return h}}
{const _rh=reportHTML;reportHTML=function(R){let h=_rh.apply(this,arguments);try{h+=`<button class="btn ghost" data-lgopen="1" style="margin-top:12px">분석실(누적 전술 진단)</button>`}catch(e){}return h}}
// ---- 체력 표시 소수점 정리(v110): 회복 코치 보너스가 소수(예 +1.6)라 92.4799… 같은 값이 저장돼 있던 기존 저장도 반올림 ----
{const _pl=pl;pl=function(id){const p=_pl(id);if(p&&p.fit!=null&&p.fit%1)p.fit=Math.round(p.fit);return p}}
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);try{for(const id in S.ps){const q=S.ps[id];if(q&&q.fit!=null&&q.fit%1)q.fit=Math.round(q.fit)}}catch(e){}return r}}
// ---- 홈 화면 미확인 표시(v110): 내비 빨간 점(읽지 않은 소식)의 원인을 홈 맨 위에 '확인할 소식'으로 모아 보여 줌 ----
{const _hv=homeView;homeView=function(){const U=(S&&S.inbox||[]).filter(m=>!m.read);const h=_hv();try{if(!U.length)return h;
  const sec=`<h2 style="display:flex;align-items:center;gap:8px"><span style="width:8px;height:8px;border-radius:50%;background:var(--bad);display:inline-block"></span>확인할 소식 ${U.length}건</h2><div class="card inbox unrd">${U.map(msgHTML).join('')}</div>`;
  const i=h.indexOf('<h2>받은 소식</h2>');return i>=0?h.slice(0,i)+sec+h.slice(i):sec+h}catch(e){return h}}}
(function(){const s=document.createElement('style');s.textContent='.msg.new b::before{background:var(--bad)!important}.inbox.unrd{border-color:color-mix(in srgb,var(--bad) 45%,var(--line))}';document.head.appendChild(s)})();

