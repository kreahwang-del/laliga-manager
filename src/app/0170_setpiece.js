// ================= 세트피스 전술 탭 =================
const SP_SIT={cL:['왼쪽 코너킥','corner'],cR:['오른쪽 코너킥','corner'],fnL:['직접 프리킥 · 왼쪽','fn'],fnR:['직접 프리킥 · 오른쪽','fn'],fwL:['측면 프리킥 · 왼쪽','fw'],fwR:['측면 프리킥 · 오른쪽','fw'],ffL:['중·장거리 프리킥 · 왼쪽','ff'],ffR:['중·장거리 프리킥 · 오른쪽','ff']};
const SP_POS={cL:[2,2],cR:[66,2],fnL:[27,21],fnR:[41,21],fwL:[5,15],fwR:[63,15],ffL:[24,36],ffR:[44,36]};
const SP_TYPE={corner:[['auto','자동'],['in','인스윙'],['out','아웃스윙'],['short','숏코너'],['driven','낮고 빠르게']],fn:[['auto','자동'],['shot','직접 슈팅'],['cross','크로스'],['short','짧게']],fw:[['auto','자동'],['cross','크로스'],['short','짧게']],ff:[['auto','자동'],['cross','박스로 띄우기'],['short','짧게']]};
const SP_TGT=[['auto','자동'],['near','니어 포스트'],['center','페널티 스폿'],['far','파포스트'],['edge','박스 앞 세컨볼']];
const FOOT={right:'오른발',left:'왼발',both:'양발'};
function spGet(sit){const sp=S.tac.sp=S.tac.sp||{};return sp[sit]=sp[sit]||{}}
function spG(){const sp=S.tac.sp=S.tac.sp||{};return sp.g=sp.g||{}}
/* 상대 맞춤 추천(엔진 E4.spRec과 동일 계산). 화면 그릴 때마다 한 번 계산 */
let SPR=null;const SP_KEYS=['cL','cR','fnL','fnR','fwL','fwR','ffL','ffR'];
function spRecNow(){if(SPR)return SPR.v;let v=null;try{const O=oppTeam();if(O&&window.E4&&E4.spRec)v=E4.spRec({xi:S.xi.map(pl).filter(Boolean),sp:S.tac.sp},O)}catch(e){v=null}SPR={v};return v}
function spEff(sit){const x=spGet(sit);if(!x.auto)return x;const r=spRecNow();return r?Object.assign({},r.sp[sit],{auto:true}):x}
function spGEff(){const g=spG();if(!g.auto)return g;const r=spRecNow();return r?Object.assign({},r.sp.g,{auto:true}):g}
function spAutoN(){return SP_KEYS.filter(k=>spGet(k).auto).length+(spG().auto?1:0)}
function spKickScore(sit,p){const k=SP_SIT[sit][1],side=sit.slice(-1);const insw=(side==='L'&&p.foot==='right')||(side==='R'&&p.foot==='left');
  if(k==='corner')return (p.cross*.5+(p.fk??10)*.5)*(insw?1.06:1);if(k==='fn')return (p.fk??10)*.8+(p.shoot||10)*.2;return p.cross*.6+(p.fk??10)*.4}
function spTaker(sit){const x=spEff(sit);const xi=S.xi.map(pl).filter(p=>p&&p.g!=='GK');const cur=x.taker&&S.xi.includes(x.taker)?pl(x.taker):null;return [cur||xi.sort((a,b)=>spKickScore(sit,b)-spKickScore(sit,a))[0],!!cur]}
function spLabel(sit){const x=spEff(sit),k=SP_SIT[sit][1];const t=(SP_TYPE[k].find(q=>q[0]===(x.type||x.mode||'auto'))||['','자동'])[1];return x.auto?t.replace(/ \(기본\)/,'')+'·맞춤':t}
function spPitch(sel,preview){/* 상대 진영 절반: 폭 68, 깊이 52.5, 골문 위쪽 */
  let h=`<svg viewBox="-2 -3 72 57" class="sppitch" style="width:100%;display:block;background:var(--pitch,#2c6e3f);border-radius:12px">
  <g fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".35"><rect x="0" y="0" width="68" height="52.5"/><rect x="13.84" y="0" width="40.32" height="16.5"/><rect x="24.84" y="0" width="18.32" height="5.5"/><path d="M25.7 16.5 A9.15 9.15 0 0 0 42.3 16.5"/><path d="M24.85 52.5 A9.15 9.15 0 0 1 43.15 52.5"/><rect x="30.34" y="-1.6" width="7.32" height="1.6"/></g><circle cx="34" cy="11" r=".4" fill="#fff"/>`;
  if(preview)h+=preview;
  else Object.keys(SP_POS).forEach(sit=>{const [x,y]=SP_POS[sit];const [tk]=spTaker(sit);const on=sel===sit;
    h+=`<g data-spsit="${sit}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="3.2" fill="${on?'#F0B429':'rgba(0,0,0,.45)'}" stroke="#F0B429" stroke-width=".5"/><text x="${x}" y="${y+1.1}" text-anchor="middle" font-size="2.8" fill="${on?'#111':'#fff'}" font-weight="700">${sit[0]==='c'?'C':sit[1]==='n'?'D':sit[1]==='w'?'W':'L'}</text>
      <text x="${Math.min(60,Math.max(8,x))}" y="${y+(y<5?6.4:5.6)}" text-anchor="middle" font-size="2.1" fill="#fff" stroke="rgba(0,0,0,.6)" stroke-width=".3" paint-order="stroke">${esc(tk?shortName(tk.name):'-')} · ${spLabel(sit)}</text></g>`});
  return h+'</svg>'}
function spView(){SPR=null;const g=spGEff(),sp=S.tac.sp;const an=spAutoN(),rc=spRecNow();const lt=g.longThrow,thr=g.thrower&&S.xi.includes(g.thrower)?pl(g.thrower):null;
  const pens=S.tac.setp&&S.tac.setp.pen&&S.xi.includes(S.tac.setp.pen)?pl(S.tac.setp.pen):null;const pauto=S.xi.map(pl).filter(p=>p.g!=='GK').sort((a,b)=>((b.pen??10)*.7+(b.comp??12)*.3)-((a.pen??10)*.7+(a.comp??12)*.3))[0];
  const ML={zonal:'지역 방어',mixed:'혼합(지역+대인)',man:'대인 방어'};
  return `<section class="card pad"><h2 style="margin-top:0">상대 맞춤 추천</h2><div class="note" style="margin-top:0">${rc?'우리 선수 구성과 다음 상대의 세트피스 수비·공중볼·골키퍼를 비교해 상황별 설정을 추천합니다.':'다음 상대가 정해지면 추천할 수 있습니다.'}</div>
   ${rc?`<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn sm" data-sprec="show">추천 보기·적용</button><button class="btn sm ${an===9?'':'ghost'}" data-sprec="${an===9?'off':'auto'}">${an===9?'경기마다 자동: 켜짐':an?`경기마다 자동: ${an}/9개`:'경기마다 자동: 꺼짐'}</button></div>`:''}</section>
  <section class="card pad"><h2 style="margin-top:0">공격 세트피스</h2><div class="note" style="margin-top:0">상황을 누르면 키커·킥 종류·목표 지점·가담 인원을 정할 수 있습니다. C 코너 · D 직접 프리킥(약 20m) · W 측면 프리킥 · L 중·장거리 프리킥</div>${spPitch(null)}</section>
  <section class="card pad"><h2 style="margin-top:0">수비 세트피스</h2>
   <button class="mu" data-spdef="1"><span class="k">마크 방식</span><span><b>${ML[g.dMark||'mixed']}${g.auto?' <span class="note">경기마다 자동</span>':''}</b><div class="meta">골포스트 ${g.posts??0}명 · 역습 대기 ${g.outlet??1}명 · 프리킥 수비벽 ${g.wall??4}명</div></span><span class="vd eq">변경</span></button></section>
  <section class="card pad"><h2 style="margin-top:0">스로인·페널티킥</h2>
   <button class="mu" data-splt="1"><span class="k">롱 스로인</span><span><b>${lt?'사용':'사용 안 함'}</b><div class="meta">${lt?`상대 진영 3분의 1 스로인을 박스로 · 투척 ${esc((thr||{name:'자동(힘 최고)'}).name)}`:'상대 진영 3분의 1에서 스로인을 박스 안으로 던집니다'}</div></span><span class="vd eq">변경</span></button>
   <button class="mu" data-kick="pen"><span class="k">페널티킥</span><span><b>${esc((pens||pauto).name)}</b><div class="meta">${pens?'직접 지정':'자동 선택'} · 페널티 ${rnd0((pens||pauto).pen)} · 침착성 ${rnd0((pens||pauto).comp)}</div></span><span class="vd eq">변경</span></button></section>`}
function spPreview(sit){const x=spEff(sit),k=SP_SIT[sit][1],side=sit.slice(-1),nsg=side==='L'?-1:1;const atk=x.atk??5;
  /* 공격 배치 슬롯(엔진과 동일): [골라인에서 거리, 니어 방향 오프셋] */
  const sl=[[4.5,2.5],[10.5,1],[7,-4.5],[12,-2],[14,.5],[5.5,5.5],[1.7,0]].slice(0,atk);const P=(d,o)=>[34+nsg*o,d];
  let h='';const tg=x.target||'auto';const zone={near:[[34+nsg*3.2,3],5],center:[[34,8.5],4.5],far:[[34-nsg*7,6.5],5],edge:[[34,19],5]};
  if((x.type||x.mode)!=='short'&&!(k==='fn'&&(x.mode||'auto')==='shot')){Object.entries(zone).forEach(([z,[[cx,cy],r]])=>{h+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${tg===z?'rgba(240,180,41,.45)':'rgba(255,255,255,.08)'}"/>`})}
  /* 프리킥 크로스: 수비 라인(엔진과 동일 공식)에 맞춰 온사이드 대기 */
  const kp0=SP_POS[sit];let fkD=null;if(k!=='corner'){const fx=105-kp0[1];fkD=105-Math.max(Math.min(93,Math.max(85,92-(88-fx)*.33)),fx-1);
    h+=`<line x1="0" y1="${fkD}" x2="68" y2="${fkD}" stroke="#ff6b6b" stroke-width=".3" stroke-dasharray="1.2 .8"/><text x="66" y="${fkD-.8}" text-anchor="end" font-size="2" fill="#ff9b9b">오프사이드 라인</text>`}
  sl.forEach(([d0,o],i)=>{const d=fkD!=null?Math.max(d0,fkD+.7+(i%3)*.5):d0;const [px,py]=P(d,fkD!=null?o*2.2:o);h+=`<circle cx="${px}" cy="${py}" r="1.3" fill="#fff" stroke="#111" stroke-width=".25"/>`});
  [[22,4],[22,-4]].slice(0,atk>=6?1:2).forEach(([d,o])=>{const [px,py]=P(d,o);h+=`<circle cx="${px}" cy="${py}" r="1.2" fill="rgba(255,255,255,.7)"/>`});
  const kp=SP_POS[sit];h+=`<circle cx="${kp[0]}" cy="${kp[1]}" r="1.5" fill="#F0B429"/>`;
  if((x.type||x.mode)==='short'){const sx=k==='corner'?(side==='L'?7:61):kp[0]+(side==='L'?5:-5),sy=k==='corner'?6:kp[1]+5;h+=`<circle cx="${sx}" cy="${sy}" r="1.3" fill="#fff"/><line x1="${kp[0]}" y1="${kp[1]}" x2="${sx}" y2="${sy}" stroke="#F0B429" stroke-width=".4" stroke-dasharray="1 .8"/>`}
  else if(k==='fn'&&(x.mode||'auto')==='shot'){h+=`<line x1="${kp[0]}" y1="${kp[1]}" x2="34" y2="0" stroke="#F0B429" stroke-width=".5"/>`}
  else if(tg!=='auto'){const [[cx,cy]]=zone[tg];h+=`<path d="M${kp[0]} ${kp[1]} Q ${(kp[0]+cx)/2} ${Math.min(kp[1],cy)-6} ${cx} ${cy}" fill="none" stroke="#F0B429" stroke-width=".5"/>`}
  return h}
function spSheet(sit){SPR=null;const [lab,k]=SP_SIT[sit];const x=spEff(sit);const [tk,fixed0]=spTaker(sit);const fixed=fixed0&&!x.auto;
  const chips=(key,opts,cur)=>`<div class="chips" style="margin:4px 0 10px">${opts.map(([v,l])=>`<button class="chip" data-spset="${sit}|${key}|${v}" aria-pressed="${String(cur)===String(v)}">${l}</button>`).join('')}</div>`;
  const ty=x.type||x.mode||'auto';const isCross=!(ty==='short'||(k==='fn'&&ty==='shot'));
  const list=S.xi.map(pl).filter(p=>p&&p.g!=='GK').sort((a,b)=>spKickScore(sit,b)-spKickScore(sit,a)).slice(0,6);
  const rcS=spRecNow();
  sheet(`<button class="x" data-close>닫기</button><h3>${lab}</h3>${rcS?`<div class="chips" style="margin:2px 0 8px"><button class="chip" data-spset="${sit}|auto|0" aria-pressed="${!x.auto}">직접 설정</button><button class="chip" data-spset="${sit}|auto|1" aria-pressed="${!!x.auto}">경기마다 자동 (상대 맞춤)</button></div>${x.auto?'<div class="note" style="margin:-2px 0 8px">아래는 다음 상대 기준 추천값입니다. 항목을 직접 바꾸면 자동이 꺼집니다.</div>':''}`:''}${spPitch(null,spPreview(sit))}
   <div class="lbl" style="margin-top:10px">키커</div><div class="list">${[`<button class="li" data-spset="${sit}|taker|" aria-pressed="${!fixed}"><span class="nm"><b>자동 선택</b><span>경기마다 가장 적합한 선수${x.auto?'':` · 현재 ${esc(tk?tk.name:'-')}`}</span></span></button>`].concat(list.map(p=>{const insw=(sit.slice(-1)==='L'&&p.foot==='right')||(sit.slice(-1)==='R'&&p.foot==='left');
     return `<button class="li" data-spset="${sit}|taker|${p.id}" aria-pressed="${(fixed||x.auto)&&tk&&tk.id===p.id}">${avatar(p,'sm')}<span class="pos ${p.g}">${p.g}</span><span class="nm"><b>${esc(p.name)}</b><span>${k==='fn'?`프리킥 ${p.fk??'-'} · 슈팅 ${p.shoot}`:`크로스 ${p.cross} · 프리킥 ${p.fk??'-'}`} · ${FOOT[p.foot]||''}${k!=='fn'&&insw?' · 인스윙':''}</span></span><span class="ovr num">${Math.round(spKickScore(sit,p))}</span></button>`})).join('')}</div>
   <div class="lbl" style="margin-top:12px">${k==='corner'?'킥 종류':'방식'}</div>${chips(k==='corner'?'type':'mode',SP_TYPE[k],ty)}
   ${isCross?`<div class="lbl">목표 지점</div>${chips('target',SP_TGT,x.target||'auto')}
   <div class="lbl">박스 안 공격 가담</div>${chips('atk',[[3,'3명'],[4,'4명'],[5,'5명 (기본)'],[6,'6명'],[7,'7명']],x.atk??5)}
   <div class="lbl">뒤에 남는 수비</div>${chips('stay',[[1,'1명'],[2,'2명 (기본)'],[3,'3명']],x.stay??2)}`:''}
   <div class="note">${k==='corner'?'실측: 인스윙 37% · 아웃스윙 37% · 숏코너 12~20%. 공은 페널티 스폿 부근(39%)과 6야드 박스(30%)에 가장 많이 떨어집니다.':k==='fn'?'직접 슈팅은 수비벽 인원과 키커의 프리킥 능력에 따라 득점 확률이 달라집니다.':'가담 인원을 늘리면 득점 기회는 늘지만 역습에 약해집니다.'}</div>`)}
function spRecSheet(){SPR=null;const r=spRecNow();if(!r){toast&&toast('다음 상대가 없습니다');return}const O=oppTeam();const P=id=>{const p=id&&pl(id);return p?shortName(p.name):'자동'};
  const T=(sit,k)=>{const x=r.sp[sit];const ty=(SP_TYPE[k].find(q=>q[0]===(x.type||x.mode))||['','자동'])[1].replace(/ \(기본\)/,'');const tg=(SP_TGT.find(q=>q[0]===x.target)||['',''])[1];return `${P(x.taker)} · ${ty}${x.target&&(x.type||x.mode)!=='short'?' · '+tg:''}${x.atk&&(x.type||x.mode)!=='short'?` · ${x.atk}명`:''}`};
  const g=r.sp.g,ML={zonal:'지역 방어',mixed:'혼합',man:'대인 방어'};
  sheet(`<button class="x" data-close>닫기</button><h3>세트피스 추천 · ${esc(O&&CLUBS[O.club]?CLUBS[O.club].name:'다음 상대')}전</h3>
   <div class="lbl">판단 근거</div><ul class="note" style="margin:4px 0 10px;padding-left:18px">${r.why.map(w=>`<li>${esc(w)}</li>`).join('')}</ul>
   <div class="lbl">추천 설정</div><div class="list">${[['cL','왼쪽 코너','corner'],['cR','오른쪽 코너','corner'],['fnL','직접 프리킥권 · 왼쪽','fn'],['fnR','직접 프리킥권 · 오른쪽','fn'],['fwL','측면 프리킥 · 왼쪽','fw'],['fwR','측면 프리킥 · 오른쪽','fw'],['ffL','중·장거리 · 왼쪽','ff'],['ffR','중·장거리 · 오른쪽','ff']].map(([s,l,k])=>`<div class="li"><span class="nm"><b>${l}</b><span>${esc(T(s,k))}</span></span></div>`).join('')}
   <div class="li"><span class="nm"><b>수비</b><span>${ML[g.dMark]} · 골포스트 ${g.posts}명 · 역습 대기 ${g.outlet}명 · 수비벽 ${g.wall}명 · 롱 스로인 ${g.longThrow?P(g.thrower):'안 함'}</span></span></div></div>
   <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn" data-sprec="apply">이번 추천 한 번 적용</button><button class="btn ghost" data-sprec="autoS">경기마다 자동으로</button></div>
   <div class="note" style="margin-top:8px">'한 번 적용'은 지금 값으로 고정합니다. '경기마다 자동'은 매 경기 상대에 맞춰 다시 계산합니다(시뮬레이션 비교: 기본 설정 대비 세트피스 실점 약 −0.07/경기, 표본오차 범위 근처).</div>`)}
function spDefSheet(){SPR=null;const g=spGEff();const chips=(key,opts,cur)=>`<div class="chips" style="margin:4px 0 10px">${opts.map(([v,l])=>`<button class="chip" data-spg="${key}|${v}" aria-pressed="${String(cur)===String(v)}">${l}</button>`).join('')}</div>`;
  sheet(`<button class="x" data-close>닫기</button><h3>수비 세트피스</h3>${spRecNow()?`<div class="chips" style="margin:2px 0 8px"><button class="chip" data-spg="auto|0" aria-pressed="${!g.auto}">직접 설정</button><button class="chip" data-spg="auto|1" aria-pressed="${!!g.auto}">경기마다 자동 (상대 맞춤)</button></div>${g.auto?'<div class="note" style="margin:-2px 0 8px">다음 상대 기준 추천값입니다(롱 스로인 포함). 항목을 바꾸면 자동이 꺼집니다.</div>':''}`:''}
   <div class="lbl">마크 방식</div>${chips('dMark',[['zonal','지역 방어'],['mixed','혼합 (기본)'],['man','대인 방어']],g.dMark||'mixed')}
   <div class="note" style="margin-top:-4px">지역 방어는 니어·중앙에, 대인 방어는 파포스트로 도는 선수에 강합니다.</div>
   <div class="lbl">골포스트 수비</div>${chips('posts',[[0,'없음 (기본)'],[1,'1명'],[2,'2명']],g.posts??0)}
   <div class="lbl">역습 대기 (상대 코너 때 위에 남는 공격수)</div>${chips('outlet',[[0,'없음'],[1,'1명 (기본)'],[2,'2명']],g.outlet??1)}
   <div class="lbl">프리킥 수비벽</div>${chips('wall',[[2,'2명'],[3,'3명'],[4,'4명 (기본)'],[5,'5명']],g.wall??4)}`)}
function spLtSheet(){SPR=null;const g=spGEff();const list=S.xi.map(pl).filter(p=>p&&p.g!=='GK').sort((a,b)=>(b.str||0)-(a.str||0)).slice(0,6);
  sheet(`<button class="x" data-close>닫기</button><h3>롱 스로인</h3>${g.auto?'<div class="note" style="margin:2px 0 8px">수비 세트피스가 경기마다 자동이라 롱 스로인도 상대에 맞춰 정해집니다. 바꾸면 자동이 꺼집니다.</div>':''}<div class="chips" style="margin:4px 0 10px"><button class="chip" data-splt2="on" aria-pressed="${!!g.longThrow}">사용</button><button class="chip" data-splt2="off" aria-pressed="${!g.longThrow}">사용 안 함</button></div>
   <div class="lbl">투척 선수</div><div class="list"><button class="li" data-spthr=""><span class="nm"><b>자동</b><span>힘이 가장 좋은 선수</span></span></button>${list.map(p=>`<button class="li" data-spthr="${p.id}" aria-pressed="${g.thrower===p.id}">${avatar(p,'sm')}<span class="pos ${p.g}">${p.g}</span><span class="nm"><b>${esc(p.name)}</b><span>힘 ${p.str??'-'}</span></span></button>`).join('')}</div>`)}
document.addEventListener('click',e=>{const t=e.target.closest('[data-spsit],[data-spset],[data-spdef],[data-spg],[data-splt],[data-splt2],[data-spthr],[data-sprec]');if(!t)return;const d=t.dataset;
  if(d.spsit){spSheet(d.spsit);return}
  if(d.sprec){const r=spRecNow();if(d.sprec==='show'){spRecSheet();return}if(d.sprec==='auto'||d.sprec==='autoS'){SP_KEYS.forEach(k=>spGet(k).auto=true);spG().auto=true;save();closeSheet&&d.sprec==='autoS'&&closeSheet();render();return}
    if(d.sprec==='off'){SP_KEYS.forEach(k=>delete spGet(k).auto);delete spG().auto;save();render();return}
    if(d.sprec==='apply'&&r){const sp=S.tac.sp;SP_KEYS.forEach(k=>{sp[k]=Object.assign({},r.sp[k])});sp.g=Object.assign({},r.sp.g);save();closeSheet&&closeSheet();render();toast&&toast('추천 설정을 적용했습니다');return}return}
  if(d.spset&&d.spset.split('|')[1]==='auto'){const [sit,,v]=d.spset.split('|');const x=spGet(sit);if(v==='1')x.auto=true;else{const e=spEff(sit);delete x.auto;Object.assign(x,e);delete x.auto}save();spSheet(sit);render();return}
  if(d.spset){const [sit,key,v]=d.spset.split('|');const x=spGet(sit);if(x.auto){Object.assign(x,spEff(sit));delete x.auto}if(key==='taker')x.taker=v?+v:null;else if(key==='atk'||key==='stay')x[key]=+v;else x[key]=v;save();spSheet(sit);render();return}
  if(d.spdef){spDefSheet();return}
  if(d.spg){const [k,v]=d.spg.split('|');const g=spG();if(k==='auto'){if(v==='1')g.auto=true;else{Object.assign(g,spGEff());delete g.auto}save();spDefSheet();render();return}if(g.auto){Object.assign(g,spGEff());delete g.auto}g[k]=k==='dMark'?v:+v;save();spDefSheet();render();return}
  if(d.splt){spLtSheet();return}
  if(d.splt2){const g=spG();if(g.auto){Object.assign(g,spGEff());delete g.auto}g.longThrow=d.splt2==='on';save();spLtSheet();return}
  if(d.spthr!==undefined){const g=spG();if(g.auto){Object.assign(g,spGEff());delete g.auto}g.thrower=d.spthr?+d.spthr:null;save();spLtSheet();return}});
document.addEventListener('click',e=>{if(e.target.closest('#scrim'))return;},true);

// v122 상대 공략 지시: 선수들은 기본기 수준으로만 상대 라인에 맞춰 바꾸고(판단 능력 좋은 선수는 더), 감독 지시를 고르면 그 방향이 크게 강해짐
const AF_OPTS=[['','자동','선수들이 상대 수비 라인을 보고 스스로 공략법을 고릅니다(판단 능력이 좋은 선수일수록 잘 바꿈).'],['behind','뒷공간','스루패스·침투·띄운 롱볼로 수비 뒤를 노립니다. 라인이 높은 상대에 효과적, 내려앉은 상대엔 공간이 없어 효과가 줄어듭니다.'],['long','중거리','압박이 없을 때 박스 밖 슈팅을 적극적으로 시도합니다. 내려앉은 상대를 끌어내는 방법이지만 무리하면 공을 잃습니다.'],['cross','크로스','측면에서 크로스를 많이 올립니다. 공중볼에 강한 공격수가 있을 때 유리합니다.'],['combo','2:1 연계','짧은 패스와 2:1 패스로 박스 근처를 뚫습니다. 돌파·연계 능력이 좋은 선수가 많을 때 유리합니다.']];
document.addEventListener('click',e=>{const b=e.target.closest('[data-taf]');if(!b||UI.tab!=='tac')return;S.tac.af=b.dataset.taf||null;save();render();toast(S.tac.af?`공략 지시: ${(AF_OPTS.find(x=>x[0]===S.tac.af)||[])[1]}`:'공략 지시 자동')});
/* v200 대형 화면: 공 위치 표시·슬라이더 */
(function(){try{const st=document.createElement('style');st.textContent=`.hzball{position:absolute;left:50%;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:#fff;box-shadow:0 0 0 2px rgba(0,0,0,.35);z-index:1;pointer-events:none}
.oslot{position:absolute;transform:translate(-50%,-50%);z-index:1;pointer-events:none;display:flex;flex-direction:column;align-items:center;opacity:.55}.oslot i{width:22px;height:22px;border-radius:50%;background:rgba(232,90,90,.35);border:2px solid rgba(255,120,120,.85)}.oslot span{font-size:9px;font-weight:700;color:#ffd0d0;text-shadow:0 0 3px #000;margin-top:1px}
.subhd{display:flex;align-items:center;gap:10px;margin:12px 0 8px}.subhd b{font-size:14px}.finebtn{display:flex;width:100%;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surf);color:var(--text);text-align:left}.finebtn small{display:block;color:var(--muted);font-size:12px;margin-top:2px}.finebtn .go{font-size:22px;color:var(--muted)}
.zchips{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.zdot{color:var(--amber)}.znud{position:absolute;left:50%;transform:translateX(-50%);z-index:7;background:rgba(10,15,20,.9);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:6px 10px;font-size:11.5px;text-align:center;width:min(300px,88%)}.znud .zb{display:grid;grid-template-columns:repeat(3,46px);gap:5px;justify-content:center;margin:5px 0 3px}.znud button{width:46px;height:36px;font-size:16px;border-radius:8px;background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.18)}.znud button:active{background:var(--amber);color:#111}.znud small{color:var(--muted)}
.hzctl{display:flex;align-items:center;gap:8px;margin-top:10px}.hzctl input{flex:1;accent-color:var(--amber)}#pitch .slot{z-index:2}`;document.head.appendChild(st)}catch(e){}})();
/* v201 세부 조정 들어가기/나오기 때 화면 맨 위(탭 위치)로 */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.finebtn,.subhd [data-phase]');if(!b)return;setTimeout(()=>{const t=document.querySelector('.subhd')||document.querySelector('.seg');if(t)t.scrollIntoView({block:'start'})},30)});
/* v202 위치 초기화(공격·수비): 구간별 위치도 함께 삭제 */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-resetpos]');if(!b||!hzOn())return;if(S.tac.posZ)delete S.tac.posZ[TAC.phase]},true);
/* v202 대형 바꾸면 그 국면(기본이면 전체) 구간별 위치도 삭제 */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-shape]');if(!b||UI.tab!=='tac')return;const T=S.tac;if(!T.posZ)return;if(TAC.phase==='base')T.posZ={};else delete T.posZ[TAC.phase]},true);
/* v209 상대 대형 표시 켜기/끄기 */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-showopp]');if(!b)return;e.stopPropagation();TAC.showOpp=TAC.showOpp===false?true:TAC.showOpp==='lbl'?false:'lbl';render()},true);

/* v229 대형·도구 줄 접기: 세부 조정(공격·수비)은 기본 접힘, 기본 대형은 기본 펼침 — 한 화면에 경기장까지 보이게. 선택은 국면별로 기억 */
function tacFold(ph){const F=TAC.fold||(TAC.fold={});return F[ph]!=null?F[ph]:ph!=='base'}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-tfold]');if(!b)return;e.stopPropagation();const ph=TAC.phase||'base';const F=TAC.fold||(TAC.fold={});F[ph]=!tacFold(ph);render()},true);

// ---- 이적 ----
function transView(){
  const w=winNow(),t=UI.tt;
  const negN=Object.keys(S.negs).filter(id=>S.negs[id].stage!=='broken'||S.date<S.negs[id].until).length;
  const tabs=[['search','선수 검색'],['watch',`관심 목록`,S.watch.length],['neg','협상',negN],['sell','판매·제안',squadOf(S.club).filter(p=>p.listed).length],['news','이적 소식']];
  return `${w?`<div class="banner open"><span>이적시장 열림 · ${fmtD(w.to)} 마감</span><span class="num">D-${daysBetween(S.date,w.to)}</span></div>`
    :`<div class="banner closed"><span>이적시장 닫힘 · 검색·스카우트·관심 목록·재계약은 지금도 가능</span></div>`}
  <div class="tabs">${tabs.map(([k,l,n])=>`<button data-tt="${k}" aria-selected="${t===k}">${l}${n?`<span class="cnt">${n}</span>`:''}</button>`).join('')}</div>
  ${({search:searchView,watch:watchView,neg:negView,sell:sellView,news:newsView})[t]()}`}
function ovrShown(p){const k=know(p.id);if(k>=3)return {t:String(p.ovr),cls:ovrCls(p.ovr)};const r=[7,4,2][k];const a=Math.round(hsh(p.id+'r'+k)*r*2);return {t:`${Math.max(40,p.ovr-a)}-${Math.min(99,p.ovr+2*r-a)}`,cls:'rng'}}
function rowP(p,right=''){const o=ovrShown(p),c=clubOf(p.id);
  return `<button class="li" data-player="${p.id}">${avatar(p,'sm')}<span class="pos ${p.g}">${p.g}</span><span class="nm"><b>${esc(p.name)}</b><span>${c===FA?'자유계약':esc(CLUBS[c].name)} · ${ageOf(p)}세 · ${money(valueNow(p))} · ~${p.cEnd.slice(0,4)}</span></span>${right}<span class="ovr num ${o.cls}">${o.t}</span></button>`}
function searchView(){const f=UI.f;
  let L=[];for(const id in BASE){const c=clubOf(+id);if(c===S.club||c===RET)continue;const p=pl(+id);
    if(f.g!=='ALL'&&LINE[p.g]!==f.g)continue;if(f.lg!=='ALL'&&(f.lg==='FA'?c!==FA:f.lg==='OUT'?(c===FA||LG5.has(CLUBS[c].lg)):(c===FA||CLUBS[c].lg!==f.lg)))continue;
    const a=ageOf(p);if(f.age==='U21'&&a>21||f.age==='22-27'&&(a<22||a>27)||f.age==='28+'&&a<28)continue;
    const v=valueNow(p);if(f.price!=='ALL'&&v>+f.price*1e6)continue;
    if(f.q&&!p.name.toLowerCase().includes(f.q.toLowerCase()))continue;L.push(p)}
  const shownMid=p=>{const k=know(p.id);if(k>=3)return p.ovr;const r=[7,4,2][k];const o=Math.round(hsh(p.id+'r'+k)*r*2);return p.ovr+r-o};
  const sk={ovr:p=>-shownMid(p),val:p=>-p.val,age:p=>ageOf(p),exp:p=>p.cEnd}[f.sort];L.sort((a,b)=>sk(a)<sk(b)?-1:sk(a)>sk(b)?1:0);
  const ch=(k,opts)=>`<div class="chips">${opts.map(([v,l])=>`<button class="chip" data-f="${k}" data-v="${v}" aria-pressed="${f[k]===v}">${k==='lg'&&IMG.on&&lgLogo(v)?`<img class="lgi" src="${lgLogo(v)}" loading="lazy" alt="" onerror="this.remove()">`:''}${l}</button>`).join('')}</div>`;
  return `<input class="search" id="q" placeholder="선수 이름 검색" value="${esc(f.q)}" autocomplete="off">
  ${ch('g',[['ALL','전체'],['GK','GK'],['DF','수비'],['MF','미드필더'],['FW','공격']])}
  ${ch('lg',[['ALL','전체 리그'],['ES','라리가'],['EN','EPL'],['IT','세리에A'],['DE','분데스'],['FR','리그1'],['OUT','5대 리그 밖'],['FA','자유계약']])}${UI.f.lg==='OUT'||(UI.f.lg&&!LG5.has(UI.f.lg)&&!['ALL','FA'].includes(UI.f.lg))?ch('lg',Object.keys(LGN).filter(k=>!LG5.has(k)).map(k=>[k,LGN[k]])):''}
  ${ch('age',[['ALL','전 연령'],['U21','21세 이하'],['22-27','22~27세'],['28+','28세 이상']])}
  ${ch('price',[['ALL','가격 무관'],['10','€10M 이하'],['30','€30M 이하'],['60','€60M 이하']])}
  ${ch('sort',[['ovr','능력치순'],['val','가치순'],['age','나이순'],['exp','계약 만료 임박순']])}
  <p class="note">${L.length}명 · 능력치 범위는 정보 부족으로 인한 추정치입니다. 스카우트를 보내면 정확해집니다.</p>
  <div class="card list" style="margin-top:6px">${L.slice(0,UI.lim).map(p=>rowP(p)).join('')||'<div class="li note">조건에 맞는 선수가 없습니다.</div>'}</div>
  ${L.length>UI.lim?`<button class="btn ghost" data-act="more">더 보기 (${L.length-UI.lim}명)</button>`:''}`}
function watchView(){const L=S.watch.map(pl).filter(p=>clubOf(p.id)!==S.club);
  return `<p class="note">관심 목록 선수는 스카우트 진행 상태와 함께 볼 수 있습니다. 동시에 ${scoutMax()}명까지 스카우트를 보낼 수 있습니다.</p><div class="card list" style="margin-top:8px">${L.map(p=>rowP(p,S.scouts.some(s=>s.id===p.id)?'<span class="pill b">스카우팅</span>':know(p.id)>=3?'<span class="pill g">파악 완료</span>':'')).join('')||'<div class="li note">관심 목록이 비어 있습니다. 선수 상세 화면에서 추가하세요.</div>'}</div>`}
function negView(){const ids=Object.keys(S.negs).map(Number);
  return `<div class="card list" style="margin-top:12px">${ids.map(id=>{const n=S.negs[id],p=pl(id);const st=n.stage==='club'?'구단 협상 중':n.stage==='player'?'개인 조건 협상':'결렬';return rowP(p,`<span class="pill ${n.stage==='player'?'g':n.stage==='broken'?'r':'y'}">${st}</span>`)}).join('')||'<div class="li note">진행 중인 협상이 없습니다.</div>'}</div>`}
function sellView(){const L=squadOf(S.club).filter(p=>p.listed);const offers=S.inbox.filter(m=>['offer','clause'].includes(m.type)&&!m.done);
  return `<h2>받은 제안</h2><div class="card inbox">${offers.map(msgHTML).join('')||'<div class="msg"><p>대기 중인 제안이 없습니다. 이적시장 기간에 판매 명단 선수에게 제안이 들어옵니다.</p></div>'}</div>
  <h2>판매 명단</h2><div class="card list">${L.map(p=>rowP(p,`<span class="pill y">${money(p.askList||p.val)}</span>`)).join('')||'<div class="li note">판매 명단이 비어 있습니다. 스쿼드에서 선수를 눌러 등록하세요.</div>'}</div>`}
function newsView(){const L=S.news.slice(0,80);
  return `<div class="chips"><button class="chip" data-act="newsf" aria-pressed="${!UI.allNews}">주요 소식</button><button class="chip" data-act="newsa" aria-pressed="${!!UI.allNews}">전체</button></div>
  <div class="card list" style="margin-top:6px">${L.filter(n=>UI.allNews||n.big).map(n=>`<div class="li"><span class="nm"><b style="white-space:normal">${esc(n.t)}</b><span>${fmtD(n.d)}</span></span><span class="num" style="font-size:16px">${n.mg?'감독':n.v?money(n.v):'자유'}</span></div>`).join('')||'<div class="li note">아직 이적 소식이 없습니다.</div>'}</div>`}

function leagueView(){const tb=table();const t=UI.lt;
  const all=Object.keys(S.ps).map(Number).filter(id=>(S.ps[id].apps||0)>0).map(pl).filter(p=>LIGA.includes(clubOf(p.id)));
  const sc=all.filter(p=>p.gl>0).sort((a,b)=>(b.gl-a.gl)||(b.as-a.as)).slice(0,10);
  return `<div class="tabs"><button data-lt="table" aria-selected="${t==='table'}">순위표</button><button data-lt="fix" aria-selected="${t==='fix'}">일정·결과</button><button data-lt="sc" aria-selected="${t==='sc'}">득점 순위</button></div>
  ${t==='table'?`<div class="card" style="margin-top:12px">${tableHTML(tb,false)}</div>`:''}
  ${t==='fix'?`<div class="card list" style="margin-top:12px">${S.fixtures.filter(f=>f.h===S.club||f.a===S.club).map(f=>`<div class="li"><span class="num" style="width:30px;color:var(--muted)">R${f.r}</span><span class="nm"><b>${esc(CLUBS[f.h].short)} ${f.res?`${f.res.sc[0]} : ${f.res.sc[1]}`:'vs'} ${esc(CLUBS[f.a].short)}</b><span>${fmtD(f.d)}</span></span></div>`).join('')}</div>`:''}
  ${t==='sc'?`<div class="card list" style="margin-top:12px">${sc.map((p,i)=>`<button class="li" data-player="${p.id}"><span class="num" style="width:18px;color:var(--muted)">${i+1}</span>${crest(clubOf(p.id))}<span class="nm"><b>${esc(p.name)}</b><span>${p.apps}경기 ${p.as||0}도움</span></span><span class="num" style="font-size:22px;font-weight:700">${p.gl}</span></button>`).join('')||'<div class="li note">아직 기록이 없습니다.</div>'}</div>`:''}`}
function tableHTML(rows,compact){const tb=table();return `<div class="tbl-wrap"><table><thead><tr><th>#</th><th style="text-align:left">구단</th><th>경기</th>${compact?'':'<th>승</th><th>무</th><th>패</th>'}<th>득실</th><th>승점</th></tr></thead><tbody>
  ${rows.map(r=>{const i=tb.findIndex(x=>x.id===r.id)+1;return `<tr class="${r.id===S.club?'me':''}"><td>${i}</td><td class="t">${esc(CLUBS[r.id].name)}</td><td>${r.p}</td>${compact?'':`<td>${r.w}</td><td>${r.d}</td><td>${r.l}</td>`}<td>${r.gf-r.ga>0?'+':''}${r.gf-r.ga}</td><td class="pts">${r.pts}</td></tr>`}).join('')}</tbody></table></div>`}

// ---- 선수 상세 ----
function sheet(html){closeSheet();const d=document.createElement('div');d.className='scrim';d.id='scrim';d.innerHTML=`<div class="sheet" role="dialog">${html}</div>`;document.body.appendChild(d)}
function closeSheet(){const s=$('#scrim');if(s)s.remove()}
function playerSheet(id){
  const p=pl(id),c=clubOf(id),mine=c===S.club,k=know(id),w=winNow();
  const keys=p.g==='GK'?GKA:OUTA; const r=[7,4,2,0][k];
  const attr=a=>{const v=p[a];const lo=Math.max(1,v-Math.round(r/2)),hi=Math.min(20,v+Math.round(r/2));
    return `<div class="attr"><span>${AN[a]}</span><div class="bar">${k>=3?`<i style="left:0;width:${v/20*100}%;background:${v>=16?'var(--amber)':v>=12?'var(--good)':'var(--faint)'}"></i>`:`<i style="left:${(lo-1)/20*100}%;width:${(hi-lo+1)/20*100}%;background:var(--faint)"></i>`}</div><span class="num">${k>=3?v:`${lo}-${hi}`}</span></div>`};
  const o=ovrShown(p), neg=S.negs[id], inW=S.watch.includes(id), sc=S.scouts.some(s=>s.id===id);
  const ml=monthsLeft(p), pre=!mine&&c!==FA&&ml<=6;
  let actions='';
  if(mine){actions=`<div class="row2"><button class="btn ghost" data-act="renew" data-id="${id}">재계약</button><button class="btn ghost" data-act="listtog" data-id="${id}">${p.listed?'판매 명단에서 제외':'판매 명단에 올림'}</button></div>
    <div class="row2"><button class="btn ghost" data-act="loanout" data-id="${id}" ${w?'':'disabled'}>임대 보내기</button><button class="btn ghost" data-act="talk" data-id="${id}">면담</button></div>`}
  else{actions=`<div class="row2"><button class="btn ghost" data-act="watch" data-id="${id}">${inW?'관심 목록에서 빼기':'관심 목록에 추가'}</button><button class="btn ghost" data-act="scout" data-id="${id}" ${k>=3||sc?'disabled':''}>${k>=3?'파악 완료':sc?'스카우트 진행 중':'스카우트 파견'}</button></div>
    ${w||pre?`<button class="btn" data-act="offer" data-id="${id}">${neg&&neg.stage==='player'?'개인 조건 협상 계속':c===FA?'자유계약 영입 협상':pre&&!w?'사전 계약 협상(7월 1일 합류)':'이적 제안'}</button>`:`<p class="note">이적시장이 열리면 제안할 수 있습니다${ml<=6?'':`. 계약 만료 6개월 전부터는 사전 계약도 가능합니다`}.</p>`}`}
  sheet(`<button class="x" data-close>닫기</button><div class="note" style="margin:0">${GN[p.g]} · ${ageOf(p)}세 · ${esc(p.nat)}${p.foot?` · ${({right:'오른발',left:'왼발',both:'양발'})[p.foot]}`:''}${p.h?` · ${p.h}cm`:''}</div>
    <div class="phead">${avatar(p,'lg')}<div style="min-width:0"><h3>${esc(p.name)}${p.est===2?' <small class="note">(추정)</small>':''}</h3><div class="note" style="margin-top:2px">${c>=0?crest(c,'xs')+' ':''}${c===FA?'자유계약':c===RET?(p.retWhy||'은퇴'):esc(CLUBS[c].name)+' · '+LGN[CLUBS[c].lg]}</div></div></div>${posLine(p)}${devLine(p)}
    <div class="facts"><div><small>능력치</small><b class="${o.cls==='rng'?'':''}">${o.t}</b></div><div><small>잠재력</small><b style="color:var(--amber)">${k>=3?stars(p.pa):'?'}</b></div><div><small>시장가치</small><b>${money(valueNow(p))}</b></div>
      <div><small>연봉(추정)</small><b>${money(p.wage)}</b></div><div><small>계약 만료</small><b>${p.cEnd.slice(0,7)}</b></div><div><small>바이아웃</small><b>${p.clause?mM(p.clause):'없음'}</b></div></div>
    ${k<3?`<p class="note">정보 수준 ${['없음','낮음','보통','완전'][k]} · 능력치는 범위로 표시됩니다.</p>`:''}
    <h2>능력치 (20점 만점)</h2>${keys.map(attr).join('')}
    <h2>추가 능력치</h2>${(()=>{const ex=[['str','몸싸움'],['comp','침착성'],['fk','프리킥'],['pen','페널티']];return ex.map(([k2,l])=>{const v=p[k2]??10;const lo=Math.max(1,v-Math.round(r/2)),hi=Math.min(20,v+Math.round(r/2));
      return `<div class="attr"><span>${l}</span><div class="bar">${k>=3?`<i style="left:0;width:${v/20*100}%;background:${v>=16?'var(--amber)':v>=12?'var(--good)':'var(--faint)'}"></i>`:`<i style="left:${(lo-1)/20*100}%;width:${(hi-lo+1)/20*100}%;background:var(--faint)"></i>`}</div><span class="num">${k>=3?v:`${lo}-${hi}`}</span></div>`}).join('')})()}
    <div class="facts"><div><small>주발</small><b>${({right:'오른발',left:'왼발',both:'양발'})[p.foot]||'?'}</b></div><div><small>약발</small><b style="color:var(--amber)">${k>=2?'★'.repeat(p.wf||3)+'<span style="color:var(--faint)">'+'★'.repeat(5-(p.wf||3))+'</span>':'?'}</b></div><div><small>키</small><b>${p.h?p.h+'cm':'?'}</b></div></div>
    <h2>이번 시즌</h2><div class="facts"><div><small>출전</small><b>${p.apps||0}경기${p.starts!=null?` <span style="font-size:12px;color:var(--muted)">(선발 ${p.starts})</span>`:''}</b></div><div><small>출전 시간</small><b>${(p.mins||0).toLocaleString()}분</b></div><div><small>평균 평점</small><b style="color:var(--amber)">${p.apps?(p.rs/p.apps).toFixed(2):'-'}</b></div>
      <div><small>골</small><b>${p.gl||0}</b></div><div><small>도움</small><b>${p.as||0}</b></div><div><small>공격포인트</small><b>${(p.gl||0)+(p.as||0)}</b></div></div>
    ${(p.recentR||[]).length?`<div class="note">최근 ${p.recentR.length}경기 평점 ${p.recentR.map(v=>v.toFixed(1)).join(' · ')}${p.fit!=null?` · 체력 ${p.fit}%`:''}</div>`:''}
    ${p.s27&&p.s27.min?`<div class="note">실제 2026-27 기록(데이터 기준): ${p.s27.mp}경기 ${p.s27.min.toLocaleString()}분 ${p.s27.g}골 ${p.s27.a}도움</div>`:''}
    <h2>숨은 정보</h2><div class="facts"><div><small>부상 위험</small><b>${k>=3?(p.inj>=12?'높음':p.inj>=7?'보통':'낮음'):'?'}</b></div><div><small>프로의식</small><b>${k>=3?(p.pro>=14?'높음':p.pro>=9?'보통':'낮음'):'?'}</b></div><div><small>시장가치</small><b>${money(valueNow(p))}</b></div></div>
    ${p.est?'<p class="note">세부 기록이 적어 능력치 추정 비중이 큰 선수입니다.</p>':''}
    <div style="margin-top:14px;display:grid;gap:0">${actions}</div>`)}
const PGN={GK:'골키퍼',CB:'센터백','FB-R':'라이트백','FB-L':'레프트백',DM:'수비형 MF',CM:'중앙 MF',AM:'공격형 MF','W-R':'오른쪽 윙','W-L':'왼쪽 윙',ST:'스트라이커'};
function posLine(p){if(!p.pos2)return `<div class="note">포지션: ${GN[p.g]} (출전 기록 부족 · 주 포지션만)</div>`;const f=p.pos2.f,n=p.pos2.n;
  const items=Object.keys(f).map(k=>`<span class="pill ${f[k]>=1?'g':f[k]>=.93?'g':'y'}" style="margin:2px 4px 0 0;display:inline-block">${PGN[k]||k} ${Math.round(f[k]*100)}%<span style="font-weight:400;opacity:.8"> · ${n[k]}경기</span></span>`).join('');
  return `<div class="note" style="line-height:1.9">가능 포지션(최근 3시즌 선발 기준) ${items}</div>`}
// ---- 제안 시트 ----
function offerSheet(id,step){
  const p=pl(id),c=clubOf(id),n=S.negs[id],ask=c===FA?0:asking(p,S.club);
  const O=UI.off&&UI.off.id===id?UI.off:(UI.off={id,fee:Math.round(valueNow(p)*.8/1e6)*1e6,inst:1,sellOn:0,loan:false,share:75,wage:wageDemand(p,S.club),years:ageOf(p)<=27?5:ageOf(p)<=30?3:2,role:expectRole(p,S.club),resp:null});
  const pre=c!==FA&&monthsLeft(p)<=6&&!winNow();
  const clubStage=!(n&&n.stage==='player')&&c!==FA&&!pre;
  const B=spendable();
  if(clubStage){
    sheet(`<button class="x" data-close>닫기</button><div class="note" style="margin:0">${esc(CLUBS[c].name)}에 제안</div><h3>${esc(p.name)}</h3>
    <div class="facts"><div><small>시장가치</small><b>${money(valueNow(p))}</b></div><div><small>우리 예산</small><b>${money(B)}</b></div><div><small>바이아웃</small><b>${p.clause?mM(p.clause):'없음'}</b></div></div>
    <div class="seg" style="grid-template-columns:1fr 1fr"><button data-o="loan" data-v="0" aria-pressed="${!O.loan}">완전 이적</button><button data-o="loan" data-v="1" aria-pressed="${O.loan}">임대</button></div>
    ${O.loan?`<div class="lbl">연봉 부담 비율</div><div class="seg" style="grid-template-columns:repeat(3,1fr)">${[50,75,100].map(v=>`<button data-o="share" data-v="${v}" aria-pressed="${O.share===v}">${v}%</button>`).join('')}</div>`
    :`<div class="lbl">이적료</div><div class="stepper"><button data-o="fee" data-v="-5">-5</button><div class="v">${money(O.fee)}</div><button data-o="fee" data-v="5">+5</button></div>
      <div class="row2" style="margin-top:6px"><button class="btn sm ghost" data-o="fee" data-v="-1">-1M</button><button class="btn sm ghost" data-o="fee" data-v="1">+1M</button><button class="btn sm ghost" data-o="feeset" data-v="${valueNow(p)}">시장가치로</button></div>
      <div class="lbl">지급 방식</div><div class="seg" style="grid-template-columns:repeat(3,1fr)">${[[1,'일시불'],[2,'2회 분할'],[3,'3회 분할']].map(([v,l])=>`<button data-o="inst" data-v="${v}" aria-pressed="${O.inst===v}">${l}</button>`).join('')}</div>
      <div class="lbl">셀온 조항(재판매 수익 분배)</div><div class="seg" style="grid-template-columns:repeat(3,1fr)">${[0,10,20].map(v=>`<button data-o="sellOn" data-v="${v}" aria-pressed="${O.sellOn===v}">${v?v+'%':'없음'}</button>`).join('')}</div>
      <p class="note">지금 지불: ${money(O.fee/O.inst)}${O.inst>1?` · 나머지는 다음 시즌부터 분할`:''}. 분할 지급은 상대가 조금 낮게 평가하고, 셀온은 조금 높게 평가합니다.</p>`}
    ${O.resp?`<div class="resp ${O.resp.k}">${esc(O.resp.msg)}</div>`:''}
    <button class="btn" data-act="sendOffer" ${!O.loan&&O.fee/O.inst>B?'disabled':''}>${!O.loan&&O.fee/O.inst>B?'예산 부족':'제안 보내기'}</button>
    ${p.clause&&!O.loan?`<button class="btn ghost" data-act="payClause" ${p.clause*1e6>B?'disabled':''}>바이아웃 ${mM(p.clause)} 지불 (구단 동의 불필요)</button>`:''}`);
    return}
  // 개인 조건
  const exp=expectRole(p,S.club),dem=wageDemand(p,S.club);
  sheet(`<button class="x" data-close>닫기</button><div class="note" style="margin:0">${pre?'사전 계약 · 7월 1일 합류':c===FA?'자유계약 협상':'구단 합의 완료 · 개인 조건'}</div><h3>${esc(p.name)}</h3>
   <div class="facts"><div><small>현재 연봉</small><b>${money(p.wage)}</b></div><div><small>기대 역할</small><b>${ROLE_N[exp]}</b></div><div><small>연봉 여유</small><b>${money(CLUBS[S.club].wageCap*1e6-wageBill(S.club))}</b></div></div>
   <div class="lbl">연봉(연)</div><div class="stepper"><button data-o="wage" data-v="-1">-</button><div class="v">${money(O.wage)}</div><button data-o="wage" data-v="1">+</button></div>
   <div class="lbl">계약 기간</div><div class="seg" style="grid-template-columns:repeat(5,1fr)">${[1,2,3,4,5].map(v=>`<button data-o="years" data-v="${v}" aria-pressed="${O.years===v}">${v}년</button>`).join('')}</div>
   <div class="lbl">출전 약속</div><div class="seg" style="grid-template-columns:repeat(3,1fr)">${[0,1,2].map(v=>`<button data-o="role" data-v="${v}" aria-pressed="${O.role===v}">${ROLE_N[v]}</button>`).join('')}</div>
   <p class="note">약속을 기대보다 낮게 하면 연봉 요구가 오릅니다. 약속을 어기면 만족도가 떨어집니다.</p>
   ${O.resp?`<div class="resp ${O.resp.k}">${esc(O.resp.msg)}</div>`:''}
   <button class="btn" data-act="sendTerms">조건 제시</button>`)}
// ---- 재계약·면담 ----
function renewSheet(id){const p=pl(id);const dem=Math.round(p.wage*(1.1+.2*((p.happy??60)<40?1:0)+(ageOf(p)<24&&p.pa>p.ovr+4?.2:0))/1e4)*1e4;
  UI.ren=UI.ren&&UI.ren.id===id?UI.ren:{id,wage:dem,years:ageOf(p)<=28?4:2,resp:null};const R=UI.ren;
  sheet(`<button class="x" data-close>닫기</button><div class="note" style="margin:0">재계약</div><h3>${esc(p.name)}</h3>
  <div class="facts"><div><small>현재 연봉</small><b>${money(p.wage)}</b></div><div><small>계약 만료</small><b>${p.cEnd.slice(0,7)}</b></div><div><small>만족도</small><b>${p.happy??60}</b></div></div>
  <div class="lbl">연봉(연)</div><div class="stepper"><button data-r="wage" data-v="-1">-</button><div class="v">${money(R.wage)}</div><button data-r="wage" data-v="1">+</button></div>
  <div class="lbl">계약 기간</div><div class="seg" style="grid-template-columns:repeat(5,1fr)">${[1,2,3,4,5].map(v=>`<button data-r="years" data-v="${v}" aria-pressed="${R.years===v}">${v}년</button>`).join('')}</div>
  ${R.resp?`<div class="resp ${R.resp.k}">${esc(R.resp.msg)}</div>`:''}<button class="btn" data-act="sendRenew">제시</button>`)}
function talkSheet(id){const p=pl(id);
  sheet(`<button class="x" data-close>닫기</button><div class="note" style="margin:0">면담 · 만족도 ${p.happy??60}</div><h3>${esc(p.name)}</h3>
  <div style="display:grid;gap:0">${[['praise','칭찬하기'],['encourage','독려하기'],['criticize','비판하기'],['promise2','주전 약속'],['promise1','로테이션 약속']].map(([k,l])=>`<button class="btn ghost" data-talk="${k}" data-id="${id}">${l}</button>`).join('')}</div>
  <p class="note">경기력·팀 운영 대화의 세부 효과(컨디션 5단계)는 3단계에서 강화됩니다. 지금은 만족도에 반영됩니다.</p>`)}

