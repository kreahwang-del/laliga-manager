// ================= 선수별 경기 분석(v106): 히트맵·패스 맵·패스 방향·슈팅·수비 행동·드리블 + 시즌 누적 + 스카우트 분석 =================
// 데이터: 엔진(engine4 anaRec)이 내 경기마다 0.5초 프레임으로 기록 → 경기 끝(buildReport)에 최근 3경기 저장(S.anaM), 시즌 누적(S.anaAcc: 우리 선수는 전체, 상대 선수는 히트맵·횟수만)
// 좌표는 그 선수 팀의 공격 방향(→) 기준. 리포트 선수 기록표의 이름, 선수 정보 화면 버튼에서 열림
const ANA_C={ok:'var(--good)',no:'var(--bad)',g:'var(--amber)',s:'var(--info)',m:'#8a94a3',b:'#5b6472'};
function anaStore(R,res,me,fx){try{if(typeof M==='undefined'||!M||!M.m||M.fx!==fx||!M.m.st.ana)return;const A=M.m.st.ana;S.anaSeq=(S.anaSeq||0)+1;const k=S.anaSeq;
  const ids=new Set();(R.pst||[]).forEach(L=>L.forEach(x=>ids.add(x.id)));const pick=o=>{const r={};ids.forEach(id=>{if(o[id])r[id]=o[id]});return r};
  const rec={k,d:S.date,fx:{h:fx.h,a:fx.a,eu:fx.eu||null,cup:fx.cup??null},me,H:pick(A.H),P:pick(A.P),S:pick(A.S),D:pick(A.D),K:pick(A.K)};
  S.anaM=[rec].concat(S.anaM||[]).slice(0,3);R.ak=k;
  if(S.anaAccY!==S.season){S.anaAcc={};S.anaAccY=S.season}
  ids.forEach(id=>{const mine=clubOf(id)===S.club;const a=S.anaAcc[id]||(S.anaAcc[id]={n:0,H:new Array(160).fill(0),c:{p:0,po:0,s:0,g:0,d:0,k:0}});a.n++;
    const h=A.H[id]||[];for(let i=0;i<160;i++)a.H[i]+=(h[i]||0);const P=A.P[id]||[],Sx=A.S[id]||[],D=A.D[id]||[],K=A.K[id]||[];
    a.c.p+=P.length;a.c.po+=P.filter(x=>x[4]).length;a.c.s+=Sx.length;a.c.g+=Sx.filter(x=>x[3]==='g').length;a.c.d+=D.length;a.c.k+=K.length;
    if(mine){a.P=(a.P||[]).concat(P).slice(-300);a.S=(a.S||[]).concat(Sx).slice(-80);a.D=(a.D||[]).concat(D).slice(-200);a.K=(a.K||[]).concat(K).slice(-80)}})}catch(e){console.error(e)}}
{const _br=buildReport;buildReport=function(res,me,fx){const R=_br.apply(this,arguments);try{anaStore(R,res,me,fx)}catch(e){}return R}}
// ---- 그림 ----
function anaPitch(inner,h){return `<svg viewBox="-2 -2 109 75" style="width:100%;display:block;background:var(--pitch);border-radius:10px" role="img" aria-label="경기장 분석 그림">
  <g fill="none" stroke="rgba(255,255,255,.45)" stroke-width=".35"><rect x="0" y="0" width="105" height="68"/><line x1="52.5" y1="0" x2="52.5" y2="68"/><circle cx="52.5" cy="34" r="9.15"/>
  <rect x="0" y="13.84" width="16.5" height="40.32"/><rect x="88.5" y="13.84" width="16.5" height="40.32"/><rect x="0" y="24.84" width="5.5" height="18.32"/><rect x="99.5" y="24.84" width="5.5" height="18.32"/></g>
  ${inner}<text x="103" y="71.6" font-size="2.6" fill="rgba(255,255,255,.7)" text-anchor="end">공격 방향 →</text></svg>`}
function anaHeat(H){if(!H)return '';const b=[];for(let j=0;j<10;j++)for(let i=0;i<16;i++){let s=0,w=0;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>15||jj>9)continue;const ww=di||dj?.5:1;s+=(H[jj*16+ii]||0)*ww;w+=ww}b.push(s/w)}
  const mx=Math.max(...b,1);return b.map((v,n)=>{const i=n%16,j=Math.floor(n/16),a=Math.sqrt(v/mx);return a<.06?'':`<rect x="${(i*105/16).toFixed(2)}" y="${(j*6.8).toFixed(2)}" width="${(105/16+.05).toFixed(2)}" height="6.85" fill="var(--amber)" fill-opacity="${(a*.85).toFixed(2)}"/>`}).join('')}
function anaPass(P){if(!P||!P.length)return '';return `<defs><marker id="anaA1" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0L6,3L0,6z" fill="var(--good)"/></marker><marker id="anaA0" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0L6,3L0,6z" fill="var(--bad)"/></marker></defs>`+
  P.map(x=>`<line x1="${x[0]}" y1="${x[1]}" x2="${x[2]}" y2="${x[3]}" stroke="${x[4]?ANA_C.ok:ANA_C.no}" stroke-width="${x[5]==='long'||x[5]==='cross'?.55:.4}" stroke-opacity=".85" ${x[5]==='cross'?'stroke-dasharray="1.2 .8"':''} marker-end="url(#anaA${x[4]?1:0})"/>`).join('')}
function anaShots(Sx){return (Sx||[]).map(x=>{const r=1+(x[2]||.05)*5;return `<circle cx="${x[0]}" cy="${x[1]}" r="${r.toFixed(2)}" fill="${ANA_C[x[3]]||ANA_C.m}" fill-opacity=".9" stroke="var(--pitch)" stroke-width=".4"><title>${{g:'골',s:'선방',m:'빗나감',b:'막힘'}[x[3]]} · xG ${x[2]!=null?x[2].toFixed(2):'-'}</title></circle>`}).join('')}
const ANA_DT={tk:['태클 성공',ANA_C.ok],tm:['태클 실패',ANA_C.no],it:['패스 차단','var(--info)'],rc:['볼 탈취','var(--info)'],cl:['걷어내기','#c9d1db'],aw:['공중볼 승','var(--amber)'],al:['공중볼 패','#8a94a3'],fo:['파울','var(--warn)']};
function anaDef(D){return (D||[]).map(x=>{const t=ANA_DT[x[2]]||['','#fff'];return x[2]==='tm'||x[2]==='fo'?`<path d="M${x[0]-1},${x[1]-1}L${x[0]+1},${x[1]+1}M${x[0]-1},${x[1]+1}L${x[0]+1},${x[1]-1}" stroke="${t[1]}" stroke-width=".55"><title>${t[0]}</title></path>`:`<circle cx="${x[0]}" cy="${x[1]}" r="1.05" fill="${t[1]}" stroke="var(--pitch)" stroke-width=".3"><title>${t[0]}</title></circle>`}).join('')}
function anaDrib(K){return (K||[]).map(x=>`<path d="M${x[0]-1.2},${x[1]+1}L${x[0]+1.4},${x[1]}L${x[0]-1.2},${x[1]-1}z" fill="var(--good)"><title>돌파 성공</title></path>`).join('')}
// 패스 방향 8분할(앞=→)
function anaRose(P){if(!P||!P.length)return '';const n=new Array(8).fill(0),o=new Array(8).fill(0);P.forEach(x=>{const a=Math.atan2(x[3]-x[1],x[2]-x[0]);const k=((Math.round(a/(Math.PI/4))%8)+8)%8;n[k]++;if(x[4])o[k]++});const mx=Math.max(...n,1);
  const lab=['앞','앞·오른쪽','오른쪽','뒤·오른쪽','뒤','뒤·왼쪽','왼쪽','앞·왼쪽'];
  const wedge=(k,r,col,op)=>{const a0=(k-.42)*Math.PI/4,a1=(k+.42)*Math.PI/4;return `<path d="M50,50L${50+r*Math.cos(a0)},${50+r*Math.sin(a0)}A${r},${r} 0 0 1 ${50+r*Math.cos(a1)},${50+r*Math.sin(a1)}z" fill="${col}" fill-opacity="${op}"><title>${lab[k]} ${n[k]}회 · 성공 ${o[k]}</title></path>`};
  return `<svg viewBox="0 0 100 100" style="width:150px;height:150px;flex:none" role="img" aria-label="패스 방향 분포"><circle cx="50" cy="50" r="40" fill="none" stroke="var(--line)" stroke-width=".6"/><circle cx="50" cy="50" r="20" fill="none" stroke="var(--line)" stroke-width=".4"/>
   ${n.map((v,k)=>v?wedge(k,8+32*v/mx,'var(--faint)',1):'').join('')}${o.map((v,k)=>v?wedge(k,8+32*v/mx,'var(--good)',.9):'').join('')}
   <text x="96" y="52" font-size="7" fill="var(--muted)" text-anchor="end">앞</text><text x="4" y="52" font-size="7" fill="var(--muted)">뒤</text></svg>`}
function anaPassStats(P){if(!P||!P.length)return '<p class="note">패스 기록이 없습니다.</p>';const t=P.length,ok=P.filter(x=>x[4]).length,len=x=>Math.hypot(x[2]-x[0],x[3]-x[1]);
  const fwd=P.filter(x=>x[2]-x[0]>=8).length,lng=P.filter(x=>len(x)>=30).length,fin=P.filter(x=>x[0]<70&&x[2]>=70&&x[4]).length,box=P.filter(x=>x[2]>=88.5&&x[3]>13.8&&x[3]<54.2&&x[4]).length,cr=P.filter(x=>x[5]==='cross').length,avg=P.reduce((a,x)=>a+len(x),0)/t;
  const row=(l,v)=>`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--line)"><span class="note" style="margin:0">${l}</span><b class="num">${v}</b></div>`;
  return `<div style="flex:1;min-width:0">${row('성공 / 시도',`${ok}/${t} (${Math.round(ok/t*100)}%)`)}${row('전진 패스(8m+)',`${fwd} (${Math.round(fwd/t*100)}%)`)}${row('평균 거리',`${avg.toFixed(1)}m`)}${row('롱패스(30m+)',lng)}${row('공격 3분의 1 진입 성공',fin)}${row('박스 안 연결',box)}${cr?row('크로스',cr):''}</div>`}
function anaLegend(items){return `<div style="display:flex;flex-wrap:wrap;gap:4px 12px;margin:6px 0 2px;font-size:12px;color:var(--muted)">${items.map(([c,l,sh])=>`<span style="display:inline-flex;align-items:center;gap:5px"><i style="width:10px;height:${sh==='line'?3:10}px;border-radius:${sh==='line'?1:5}px;background:${c};display:inline-block"></i>${l}</span>`).join('')}</div>`}
function anaCount(L,f){return (L||[]).filter(f).length}
// ---- 시트 ----
function anaData(id,src){if(src==='acc'){const a=S.anaAcc&&S.anaAcc[id];if(!a)return null;return {H:a.H,P:a.P,S:a.S,D:a.D,K:a.K,c:a.c,n:a.n,ttl:`${S.season}-${String(S.season+1).slice(2)} 시즌 누적 · 우리 경기 ${a.n}경기`}}
  const m=(S.anaM||[]).find(x=>x.k===+src);if(!m)return null;const opp=m.fx.h===S.club?m.fx.a:m.fx.h;return {H:m.H[id],P:m.P[id],S:m.S[id],D:m.D[id],K:m.K[id],ttl:`${fmtD(m.d)} · ${CLUBS[m.fx.h].short} vs ${CLUBS[m.fx.a].short}`}}
function anaSheet(id,src,tab){const p=pl(id);const d=anaData(id,src);if(!d){toast('분석 기록이 없습니다');return}UI.anaT=tab||UI.anaT||'heat';const T=UI.anaT;
  const tabs=[['heat','히트맵'],['pass','패스'],['shot','슈팅'],['def','수비'],['drib','돌파']];let body='';
  if(T==='heat')body=anaPitch(anaHeat(d.H))+`<p class="note">진할수록 오래 머문 곳입니다(0.5초마다 위치 기록, 주변 칸과 부드럽게 합침).</p>`;
  else if(T==='pass')body=(d.P&&d.P.length?anaPitch(anaPass(d.P))+anaLegend([[ANA_C.ok,'성공','line'],[ANA_C.no,'실패','line'],['repeating-linear-gradient(90deg,#ccc 0 3px,transparent 3px 5px)','크로스(점선)','line']])+`<div style="display:flex;gap:12px;align-items:center;margin-top:8px">${anaRose(d.P)}${anaPassStats(d.P)}</div><p class="note">원형 그림: 패스 방향별 시도(회색)와 성공(초록). 오른쪽이 상대 골문 쪽입니다.</p>`
    :d.c?`<p class="note">패스 ${d.c.p}회 · 성공률 ${d.c.p?Math.round(d.c.po/d.c.p*100):0}% (상대 선수는 횟수만 기록)</p>`:'<p class="note">패스 기록이 없습니다.</p>');
  else if(T==='shot')body=d.S&&d.S.length?anaPitch(anaShots(d.S))+anaLegend([[ANA_C.g,`골 ${anaCount(d.S,x=>x[3]==='g')}`],[ANA_C.s,`선방 ${anaCount(d.S,x=>x[3]==='s')}`],[ANA_C.m,`빗나감 ${anaCount(d.S,x=>x[3]==='m')}`],[ANA_C.b,`막힘 ${anaCount(d.S,x=>x[3]==='b')}`]])+`<p class="note">원 크기 = xG. 합계 xG ${(d.S.reduce((a,x)=>a+(x[2]||0),0)).toFixed(2)}</p>`:`<p class="note">${d.c?`슈팅 ${d.c.s}회 · ${d.c.g}골`:'슈팅이 없습니다.'}</p>`;
  else if(T==='def'){const L=d.D||[];body=L.length?anaPitch(anaDef(L))+anaLegend(Object.entries(ANA_DT).map(([k,[l,c]])=>[c,`${l} ${anaCount(L,x=>x[2]===k)}`]).filter(x=>!/ 0$/.test(x[1])))+`<p class="note">× 표시는 태클 실패·파울입니다.</p>`:`<p class="note">${d.c?`수비 행동 ${d.c.d}회`:'수비 행동 기록이 없습니다.'}</p>`}
  else body=d.K&&d.K.length?anaPitch(anaDrib(d.K))+`<p class="note">1대1 돌파 성공 ${d.K.length}회 위치</p>`:`<p class="note">${d.c?`돌파 성공 ${d.c.k}회`:'돌파 성공 기록이 없습니다.'}</p>`;
  const srcs=[...(S.anaM||[]).filter(m=>m.H[id]).map(m=>[String(m.k),`${fmtD(m.d)} ${CLUBS[m.fx.h===S.club?m.fx.a:m.fx.h].short}전`]),...(S.anaAcc&&S.anaAcc[id]?[['acc','시즌 누적']]:[])];
  sheet(`${UI.anaBack?'<button class="x" data-anaback="1">뒤로</button>':'<button class="x" data-close>닫기</button>'}<div class="note" style="margin:0">${esc(d.ttl)}</div><h3>${esc(p.name)} <span class="note" style="display:inline">${posList(p)[0]||''}</span></h3>
   ${srcs.length>1?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">${srcs.map(([k,l])=>`<button class="chip" data-anasrc="${k}" data-anaid="${id}" aria-pressed="${String(src)===k}">${esc(l)}</button>`).join('')}</div>`:''}
   <div class="seg" style="grid-template-columns:repeat(5,1fr);margin-bottom:8px">${tabs.map(([k,l])=>`<button data-anatab="${k}" data-anaid="${id}" data-anasrc0="${src}" aria-pressed="${T===k}">${l}</button>`).join('')}</div>${body}`)}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-pana],[data-anatab],[data-anasrc],[data-anabtn],[data-scana],[data-anaback]');if(!b)return;e.stopPropagation();e.preventDefault();
  if(b.dataset.anaback){const B=UI.anaBack;UI.anaBack=null;/* v195 돌아갈 때 원래 보던 위치로 */const rs=()=>{if(B&&B.st!=null){const go=()=>{const sh=document.querySelector('#scrim .sheet');if(sh)sh.scrollTop=B.st};go();requestAnimationFrame(go)}};if(B&&B.t==='rep'){const R=(S.reports||[]).find(x=>x.ak===B.ak);if(R){reportSheet(R);rs();return}}if(B&&B.t==='ps'){playerSheet(B.id);rs();return}closeSheet();return}
  const _sh=document.querySelector('#scrim .sheet'),_st=_sh?_sh.scrollTop:0;
  if(b.dataset.pana){UI.anaBack={t:'rep',ak:+b.dataset.rk,st:_st};anaSheet(+b.dataset.pana,b.dataset.rk||'acc');return}
  if(b.dataset.anatab){anaSheet(+b.dataset.anaid,b.dataset.anasrc0,b.dataset.anatab);return}
  if(b.dataset.anasrc){anaSheet(+b.dataset.anaid,b.dataset.anasrc);return}
  if(b.dataset.anabtn){const id=+b.dataset.anabtn;UI.anaBack={t:'ps',id,st:_st};const m=(S.anaM||[]).find(x=>x.H[id]);anaSheet(id,m?String(m.k):'acc');return}
  if(b.dataset.scana){UI.anaBack={t:'ps',id:+b.dataset.scana,st:_st};scoutAna(+b.dataset.scana);return}},true);
// 리포트 선수 기록표: 이름을 누르면 분석
{const _ph=pstHTML;pstHTML=function(R,side){let h=_ph.apply(this,arguments);try{const L=R.pst&&R.pst[side];if(!L||!R.ak||!(S.anaM||[]).some(m=>m.k===R.ak))return h;let i=0;
  h=h.replace(/<td class="n">/g,()=>{const x=L[i++];return x?`<td class="n" data-pana="${x.id}" data-rk="${R.ak}" style="cursor:pointer;text-decoration:underline;text-decoration-color:var(--faint);text-underline-offset:3px">`:'<td class="n">'});
  h=`<p class="note" style="margin:0 0 4px">선수 이름을 누르면 히트맵·패스 맵 등 상세 분석을 볼 수 있습니다.</p>`+h}catch(e){}return h}}
// ---- 스카우트 분석: 능력치·포지션으로 예상 활동 지도와 성향, 맞대결 기록이 있으면 실제 데이터 ----
function scoutHeat(p){const side=/Left/i.test(p.sub||'')?-1:/Right/i.test(p.sub||'')?1:0;const C={GK:[5,34,3,6],CB:[22,34+side*9,10,8],FB:[45,side>0?60:8,22,7],DM:[42,34,14,12],CM:[55,34+side*7,18,14],AM:[72,34+side*6,16,14],W:[78,side>0?59:side<0?9:34,18,10],ST:[88,34,12,10]}[p.g]||[52,34,20,15];
  const sta=(p.stamina||10)/10,off=(p.offball||10);let [cx,cy,sx,sy]=C;sx*=.75+sta*.25;if(p.g==='FB'&&off+(p.cross||10)>=28)cx+=8;if(p.g==='CM'&&off>=15)cx+=6;if(p.g==='ST'&&(p.drib||10)>=15)sy+=4;if(side===0&&p.g==='W'){sy=24}
  const H=[];for(let j=0;j<10;j++)for(let i=0;i<16;i++){const x=(i+.5)*105/16,y=(j+.5)*6.8;H.push(Math.round(100*Math.exp(-((x-cx)**2/(2*sx*sx)+(y-cy)**2/(2*sy*sy)))))}return H}
function scoutTraits(p){const t=[];const a=k=>p[k]||10;if(p.g==='GK'){if(a('gk_sweep')>=14)t.push('골문을 비우고 나와 뒷공간 처리');if(a('gk_dist')>=14)t.push('빌드업 배급이 좋음 — 롱킥 전환 가능');if(a('gk_air')>=15)t.push('크로스 처리 강함');return t}
  if(a('pass')>=15&&['CB','DM','CM'].includes(p.g))t.push('후방에서 전진·롱패스로 배급');else if(a('pass')>=15)t.push('짧은 패스 정확도 높음 — 연계 중심');
  if((p.toc||0)>.3||a('drib')>=16)t.push('1대1 돌파를 자주 시도');if(a('cross')>=14&&['W','FB'].includes(p.g))t.push('측면에서 크로스 자주');if(a('shoot')>=15)t.push('박스 밖 중거리 슈팅도 위협');
  if(a('offball')>=15&&['ST','W','AM'].includes(p.g))t.push('수비 뒷공간 침투 잦음');if(a('aerial')>=15)t.push('공중볼 경합 강함');if(a('tackle')>=15)t.push('적극적인 태클로 볼 탈취');if(a('posit')>=15&&['CB','DM','FB'].includes(p.g))t.push('위치 선정으로 패스 차단');
  if(a('pace')>=16)t.push('스피드가 빨라 역습·뒷공간에 위협');if(a('stamina')>=16)t.push('활동량 많음 — 넓은 범위를 움직임');if(!t.length)t.push('특별한 성향 없이 포지션 역할 수행');
  try{(p.pst&&p.pst[2]||[]).forEach(n=>t.push(`플레이 특성: ${n}`))}catch(e){}return t}
function scoutAna(id){const p=pl(id),k=know(id);const acc=S.anaAcc&&S.anaAcc[id];
  sheet(`${UI.anaBack?'<button class="x" data-anaback="1">뒤로</button>':'<button class="x" data-close>닫기</button>'}<div class="note" style="margin:0">스카우트 분석 · 정보 수준 ${k}/3</div><h3>${esc(p.name)} <span class="note" style="display:inline">${esc(CLUBS[clubOf(id)]?CLUBS[clubOf(id)].name:'')} · ${posList(p)[0]||''}</span></h3>
   ${k<1?'<p class="note">정보가 없습니다. 스카우트를 보내면 활동 범위와 성향을 알 수 있습니다.</p>':`<div class="lbl">예상 활동 범위</div>${anaPitch(anaHeat(scoutHeat(p)))}<p class="note">포지션·체력·침투 능력으로 추정한 활동 지도입니다.</p>`}
   ${k>=2?`<div class="lbl">플레이 성향</div><ul class="rnotes">${scoutTraits(p).slice(0,k>=3?8:3).map(t=>`<li>${esc(t)}</li>`).join('')}</ul>${k<3?'<p class="note">스카우트를 더 보내면(정보 3단계) 성향을 더 자세히 알 수 있습니다.</p>':''}`:k>=1?'<p class="note">정보 2단계부터 플레이 성향이 보입니다.</p>':''}
   ${acc?`<div class="lbl">우리와의 경기 실제 기록 · ${acc.n}경기</div>${anaPitch(anaHeat(acc.H))}<p class="note">패스 ${acc.c.p}회(성공 ${acc.c.p?Math.round(acc.c.po/acc.c.p*100):0}%) · 슈팅 ${acc.c.s}회 ${acc.c.g}골 · 수비 행동 ${acc.c.d}회 · 돌파 성공 ${acc.c.k}회</p>`:''}`)}
// 선수 정보 화면에 버튼
{const _ps=playerSheet;playerSheet=function(id){const r=_ps.apply(this,arguments);try{const mine=clubOf(id)===S.club;const has=(S.anaM||[]).some(m=>m.H[id])||(S.anaAcc&&S.anaAcc[id]);
  const h=document.querySelector('.sheet h3');if(!h||document.getElementById('anaBtns'))return r;const bt=[];
  if(has)bt.push(`<button class="btn sm ghost" data-anabtn="${id}">경기 분석 (히트맵·패스)</button>`);if(!mine)bt.push(`<button class="btn sm ghost" data-scana="${id}">스카우트 분석</button>`);
  if(bt.length)h.insertAdjacentHTML('afterend',`<div id="anaBtns" style="display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 8px">${bt.join('')}</div>`)}catch(e){console.error(e)}return r}}

