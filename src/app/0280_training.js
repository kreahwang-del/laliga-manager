// ================= 훈련·코치진(v77) =================
// 훈련: 주간 초점(균형·공격·수비·피지컬·전술·세트피스·회복) + 강도(낮음·보통·높음) → 우리 팀 성장 속도·체력 회복·부상 위험·전술 숙련
// 코치진: 수석코치·공격·수비·피지컬·GK·유스 코치·의무팀장(능력 1~20) → 담당 능력치 성장 배율 1+(능력−10)×2%, 의무팀장은 부상 기간 단축
// 크기는 게임 설계 가정(실측 근거 없음): 평균 코치(10)·균형·보통 = 기존과 동일(배율 1)
const TR_FOC={bal:['균형',{}],att:['공격',{tech:1.15,def:.95,phys:.95}],def:['수비',{def:1.15,tech:.95,phys:.95}],phys:['피지컬',{phys:1.18,tech:.95,def:.95}],tac:['전술',{tech:.95,def:.95,phys:.95}],sp:['세트피스',{sp:1.25,tech:.97,def:.97}],rec:['회복',{tech:.9,def:.9,phys:.9,gk:.9}]};
const TR_INT=[['낮음',.9],['보통',1],['높음',1.1]];
const TR_GRP={pace:'phys',stamina:'phys',str:'phys',shoot:'tech',pass:'tech',drib:'tech',offball:'tech',cross:'sp',fk:'sp',pen:'sp',tackle:'def',posit:'def',aerial:'def',comp:'tech',gk_save:'gk',gk_air:'gk',gk_sweep:'gk',gk_dist:'gk'};
const ST_ROLE={AST:['수석코치','전술 숙련·전체 성장(절반)'],ATT:['공격 코치','슈팅·패스·드리블·침투'],DEF:['수비 코치','태클·위치 선정·공중볼'],FIT:['피지컬 코치','속도·지구력·힘, 체력 회복'],GK:['GK 코치','골키퍼 능력'],YTH:['유스 코치','유망주 입단 등급'],MED:['의무팀장','부상 기간 단축']};
const ST_KEYS={ATT:['shoot','pass','drib','offball','cross','fk','pen','comp'],DEF:['tackle','posit','aerial'],FIT:['pace','stamina','str'],GK:['gk_save','gk_air','gk_sweep','gk_dist']};
function stName(c,h){const nat=(typeof LG_NAT!=='undefined'&&LG_NAT[CLUBS[c].lg])||'ESP';const N=(typeof NAMES!=='undefined'&&(NAMES[nat]||NAMES.ESP))||{f:['Luis'],l:['García']};return N.f[Math.floor(h(1)*N.f.length)]+' '+N.l[Math.floor(h(2)*N.l.length)]}
function stWage(r,role){return Math.round(1.2e5*Math.pow(1.28,r-8)*(role==='AST'?1.6:role==='MED'?.8:1)/1e4)*1e4}
function stMake(c,role,r,seed){const h=k=>hsh(seed+':'+role+':'+k);r=Math.max(4,Math.min(20,Math.round(r)));return {id:seed+role,role,n:stName(c,h),r,age:36+Math.floor(h(3)*28),w:stWage(r,role)}}
function stInit(){if(!S||S.staff&&S.staffClub===S.club)return;const c=S.club;if(c==null||c<0)return;const rep=CLUBS[c].rep||40;
  S.staff=Object.keys(ST_ROLE).map(role=>stMake(c,role,7+rep/12+(hsh(c+role+S.season)-.5)*4,'s'+c+S.season));S.staffClub=c;S.staffPool=null;S.trn=S.trn||{f:'bal',i:1}}
function stOf(role){stInit();const s=(S.staff||[]).find(x=>x.role===role);return s?s.r:10}
function stReq(r){return Math.max(0,(r-6)*7)}
function stPool(){if(S.staffPool&&S.staffPool.m===S.date.slice(0,7))return S.staffPool;const rep=(S.me&&S.me.rep)||50,c=S.club;const L={m:S.date.slice(0,7),c:{}};
  Object.keys(ST_ROLE).forEach(role=>{L.c[role]=[0,1,2].map(k=>{const h=hsh('pool'+role+k+L.m);return stMake(c,role,6+rep/9+(h-.45)*8+k*.6,'p'+L.m+k)})});S.staffPool=L;return L}
// 배율
function trMult(k){const g=TR_GRP[k]||'tech';const F=(TR_FOC[(S.trn||{}).f]||TR_FOC.bal)[1];const fo=F[g]??(g==='sp'?F.tech??1:g==='gk'?1:1);
  const it=TR_INT[(S.trn||{i:1}).i??1][1];let co=1;for(const role in ST_KEYS)if(ST_KEYS[role].includes(k))co=1+(stOf(role)-10)*.02;co+=(stOf('AST')-10)*.01;return fo*it*co}
function trInjF(){const t=S.trn||{f:'bal',i:1};return [.8,1,1.3][t.i??1]*(t.f==='phys'?1.15:t.f==='rec'?.8:1)}
function trRec(){const t=S.trn||{f:'bal',i:1};return [1,0,-1][t.i??1]+(t.f==='rec'?1:0)+(stOf('FIT')-10)*.08}
// 성장(annualDelta: 월별로 1/10씩 반영되므로 초점 변경이 그달부터 반영)
/* v170 AI 구단도 코치 효과: 우리 팀만 훈련·코치 가산을 받아 젊은 선수 성장이 앞서던 문제. AI 코치 능력 = 7+평판/12(우리 팀 코치진 생성식과 같음, 평판 80 → 13.7) → 성장분 × (1+0.03×(코치−10)), 피지컬 하락 × max(.7, 1−0.02×(코치−10)). 훈련 초점·강도는 균형·보통(×1) */
{const _ad0=annualDelta;annualDelta=function(p,season){const d=_ad0(p,season);try{const c=p&&clubOf(p.id);if(S&&c!=null&&c>=0&&c!==S.club&&CLUBS[c]){const cr=7+(CLUBS[c].rep||50)/12,up=1+.03*(cr-10),dn=Math.max(.7,1-.02*(cr-10));
  for(const k in d){if(k==='_ev'||typeof d[k]!=='number')continue;if(d[k]>0)d[k]*=up;else if(ST_KEYS.FIT.includes(k))d[k]*=dn}}}catch(e){}return d}}
{const _ad=annualDelta;annualDelta=function(p,season){const d=_ad(p,season);try{if(S&&p&&clubOf(p.id)===S.club&&S.staff){for(const k in d){if(k==='_ev'||typeof d[k]!=='number')continue;
  if(d[k]>0)d[k]*=trMult(k);else if(ST_KEYS.FIT.includes(k))d[k]*=Math.max(.7,1-(stOf('FIT')-10)*.02)}}}catch(e){}return d}}
// 체력 회복·전술 숙련·코치 후보 갱신(daily 이후)
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);try{if(S&&S.club>=0&&!(typeof unemp==='function'&&unemp())){stInit();const ex=trRec();
  if(ex)squadOf(S.club).forEach(p=>{const q=S.ps[p.id];if(q&&q.fit!=null&&q.fit<100&&q.played!==S.date)q.fit=Math.max(30,Math.min(100,Math.round(q.fit+ex)))});
  if(D(S.date).getUTCDay()===1&&S.tac){const m=famMapInit(),k=famKey(S.tac.preset,S.tac.form.base);m[k]=Math.min(100,Math.max(FAM0,m[k]??FAM0)+Math.max(0,.4+(stOf('AST')-10)*.08+((S.trn||{}).f==='tac'?1.6:0)));famSync()}}}catch(e){console.error(e)}return r}}
// 부상: 훈련 강도·초점에 따른 위험 배율, 의무팀장 → 기간 단축
{const _am=applyMatch;applyMatch=function(H,Aw,res,counts){const mine=S&&(H.club===S.club||Aw.club===S.club);const before={};if(mine)squadOf(S.club).forEach(p=>{before[p.id]=(S.ps[p.id]||{}).injD||0});
  const out=_am.apply(this,arguments);if(!mine||!S.staff)return out;const f=trInjF(),med=stOf('MED');
  squadOf(S.club).forEach(p=>{const q=S.ps[p.id];if(!q)return;if(q.injD>0&&!before[p.id]){if(f<1&&Math.random()>f){q.injD=0;const i=S.inbox.findIndex(m=>m.type==='부상'&&m.title===`${p.name} 부상`&&m.d===S.date);if(i>=0)S.inbox.splice(i,1);return}
      q.injD=Math.max(1,Math.round(q.injD*Math.max(.6,1-(med-10)*.03)));const m=S.inbox.find(m=>m.type==='부상'&&m.title===`${p.name} 부상`&&m.d===S.date);if(m)m.body=`약 ${Math.max(1,Math.round(q.injD/7))}주 결장 예상입니다.`}
    else if(f>1&&!q.injD&&q.played===S.date&&Math.random()<(f-1)*.01){q.injD=4+Math.floor(Math.random()*10);inbox('부상','',`${p.name} 부상`,`훈련 강도 영향 · 약 ${Math.max(1,Math.round(q.injD/7))}주 결장 예상입니다.`)}});return out}}
// 유스 코치: 우리 구단 유망주 등급 배율
{const _my=makeYouth;makeYouth=function(c,y,o={}){if(!S||c!==S.club||o.grade||o.pa||!S.staff)return _my.apply(this,arguments);const nm=CLUBS[c].name,had=Object.prototype.hasOwnProperty.call(YOUTH_MULT,nm),old=YOUTH_MULT[nm];
  YOUTH_MULT[nm]=(old||1)*(1+(stOf('YTH')-10)*.04);try{return _my.apply(this,arguments)}finally{if(had)YOUTH_MULT[nm]=old;else delete YOUTH_MULT[nm]}}}
// 구단 이동 시 코치진 새로(새 구단 기존 코치진)
// ---- 화면 ----
function trView(){stInit();const t=S.trn,pool=UI.stHire?stPool():null;const me=S.me||{rep:50};
  const grp=[['tech','기술(슈팅·패스·드리블)','shoot'],['def','수비(태클·위치·공중볼)','tackle'],['phys','피지컬(속도·지구력·힘)','pace'],['sp','세트피스(크로스·프리킥·PK)','fk'],['gk','골키퍼','gk_save']];
  const pct=k=>{const v=Math.round((trMult(k)-1)*100);return `<b style="color:${v>0?'var(--good)':v<0?'var(--bad)':'var(--muted)'}">${v>0?'+':''}${v}%</b>`};
  const stRow=s=>`<div class="li"><span class="nm"><span class="av"><b>${esc(s.n[0])}</b></span><span><b>${esc(s.n)}</b><span>${ST_ROLE[s.role][0]} · ${s.age}세 · 연봉 ${money(s.w)}</span></span></span><span class="num ovr ${s.r>=15?'hi':s.r>=10?'':'lo'}" style="font-size:15px">${s.r}</span><button class="btn sm ghost" data-sthire="${s.role}">교체</button></div>`;
  let hire='';if(pool){const role=UI.stHire,cur=S.staff.find(s=>s.role===role);
    hire=`<h2>${ST_ROLE[role][0]} 후보 <span class="note">· ${ST_ROLE[role][1]}</span></h2><div class="card list">${pool.c[role].map(s=>{const req=stReq(s.r),ok=me.rep>=req;const fee=Math.round(s.w*.25)+(cur?Math.round(cur.w*.5):0);
      return `<div class="li"><span class="nm"><span class="av"><b>${esc(s.n[0])}</b></span><span><b>${esc(s.n)}</b><span>${s.age}세 · 연봉 ${money(s.w)} · 계약금+위약금 ${money(fee)}${ok?'':` · 요구 평판 ${req}`}</span></span></span><span class="num" style="font-size:15px">${s.r}</span>${ok?`<button class="btn sm" data-stsign="${s.id}">영입</button>`:'<span class="note">관심 없음</span>'}</div>`}).join('')}</div>
      <button class="btn sm ghost" data-sthire="" style="margin-top:8px">닫기</button><p class="note">후보는 매달 1일 바뀝니다. 영입 시 새 코치 계약금(연봉의 25%)과 기존 코치 위약금(연봉의 50%)을 이적 예산에서 냅니다.</p>`}
  return `${sqTabs()}<h2>훈련 초점</h2><div class="chips">${Object.entries(TR_FOC).map(([k,v])=>`<button class="chip" data-trf="${k}" aria-pressed="${t.f===k}">${v[0]}</button>`).join('')}</div>
    <h2>훈련 강도</h2><div class="chips">${TR_INT.map((v,i)=>`<button class="chip" data-tri="${i}" aria-pressed="${(t.i??1)===i}">${v[0]}</button>`).join('')}</div>
    <div class="card list" style="margin-top:10px">${grp.map(([g,l,k])=>`<div class="li"><span class="nm"><span><b>${l}</b><span>성장 속도 · 기본 대비</span></span></span>${pct(k)}</div>`).join('')}
    <div class="li"><span class="nm"><span><b>체력 회복</b><span>훈련·체력 코치 보정 · 기본 회복(하루 +3 + 남은 피로의 22%)에 더해짐</span></span></span><b>${(trRec()>=0?'+':'')+trRec().toFixed(1)}/일</b></div>
    <div class="li"><span class="nm"><span><b>부상 위험</b><span>훈련 강도·초점</span></span></span><b style="color:${trInjF()>1?'var(--bad)':trInjF()<1?'var(--good)':'var(--muted)'}">×${trInjF().toFixed(2)}</b></div>
    <div class="li"><span class="nm"><span><b>전술 숙련(현재 전술)</b><span>매주 월요일 · 경기 출전과 별도</span></span></span><b>+${Math.max(0,.4+(stOf('AST')-10)*.08+(t.f==='tac'?1.6:0)).toFixed(1)}/주</b></div></div>
    <p class="note" style="margin-top:8px;line-height:1.55">성장 속도 %는 기본(초점 균형·강도 보통·코치 능력 10) 대비 빠르기입니다. −는 성장이 줄어든다는 뜻이 아니라 덜 빨리 자란다는 뜻이고, 나이에 따른 하락은 따로 계산합니다(체력 코치가 좋으면 피지컬 하락이 완만).</p>
    ${hire}
    <h2>코치진</h2><div class="card list">${S.staff.map(stRow).join('')}</div>
    <p class="note" style="margin-top:10px;line-height:1.55">성장 배율은 그 능력치가 오를 때만 적용되고(나이로 떨어지는 폭은 피지컬 코치만 일부 완화), 월마다 반영됩니다. 코치 능력 10·균형·보통이면 이전과 같습니다. 효과 크기는 게임 설계 가정입니다(코치·훈련 효과의 공개 실측 자료가 없음).</p>`}
function sqTabs(){const v=UI.sqv||'sq';return `<div class="chips" style="margin-top:14px"><button class="chip" data-sqv="sq" aria-pressed="${v==='sq'}">선수단</button><button class="chip" data-sqv="trn" aria-pressed="${v==='trn'}">훈련·코치진</button></div>`}
{const _sv=squadView;squadView=function(){if(UI.sqv==='trn')return trView();return sqTabs()+_sv()}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-sqv],[data-trf],[data-tri],[data-sthire],[data-stsign]');if(!b||!S)return;e.stopPropagation();const d=b.dataset;
  if(d.sqv){UI.sqv=d.sqv;render();return}stInit();
  if(d.trf){S.trn.f=d.trf;save();render();return}
  if(d.tri!=null){S.trn.i=+d.tri;save();render();return}
  if(d.sthire!=null){UI.stHire=d.sthire||null;render();return}
  if(d.stsign){const role=UI.stHire,pool=stPool();const s=pool.c[role].find(x=>x.id===d.stsign);if(!s)return;const cur=S.staff.find(x=>x.role===role);const fee=Math.round(s.w*.25)+(cur?Math.round(cur.w*.5):0);
    if(S.fin.budget<fee){toast('이적 예산이 부족합니다');return}S.fin.budget-=fee;S.fin.log.unshift({d:S.date,t:`${ST_ROLE[role][0]} ${s.n} 영입`,v:-fee});
    S.staff=S.staff.filter(x=>x.role!==role).concat([Object.assign({},s,{since:S.date})]);pool.c[role]=pool.c[role].filter(x=>x.id!==s.id);UI.stHire=null;save();render();toast(`${s.n} ${ST_ROLE[role][0]} 부임`)}},true);

// ---- 부상 빈도·기간 실데이터 보정(v87) ----
// UEFA Elite Club Injury Study(Ekstrand 2011, BJSM): 선수당 시즌 2.0건(25명 팀 약 50건), 경기 57%·훈련 43%,
// 경기 27.5건/1,000시간(팀당 경기 약 0.45건), 기간 1~3일 22%·4~7일 26%·8~28일 37%·29일+ 16%(평균 약 18일)
// 경기 중 교체될 정도의 부상(엔진 부상 교체 0.39/경기, 실제 부상 교체 수치 기준)은 무거운 쪽, 경기 후·훈련 중 발견되는 부상은 가벼운 쪽으로 나눠 전체 분포를 맞춤
const INJ_DIST={m:[.05,.20,.50,.25],k:[.33,.31,.27,.09],t:[.35,.30,.27,.08],a:[.22,.26,.37,.16]};
function injDays(kind,rnd){const r=rnd||Math.random;const D=INJ_DIST[kind]||INJ_DIST.a;let u=r(),b=0;while(b<3&&u>=D[b]){u-=D[b];b++}const v=r();
  return b===0?1+Math.floor(v*3):b===1?4+Math.floor(v*4):b===2?8+Math.floor(v*21):Math.min(240,29+Math.round(-Math.log(Math.max(1e-6,1-v))*35))}
function injMsg(p,d,why){return d<=3?null:`${why?why+' · ':''}약 ${d<7?d+'일':Math.max(1,Math.round(d/7))+'주'} 결장 예상입니다.`}
// 훈련 부상: 시즌 중(6월 제외) 선수당 하루 0.0038(팀당 시즌 약 22건 — 이미 부상 중인 기간·측정 누락 감안해 상향) × 부상 성향 × (우리 팀) 훈련 강도·초점
function injTrainDaily(){const mo=+S.date.slice(5,7);if(mo===6)return;const mine=new Set(squadOf(S.club).map(p=>p.id));const f=trInjF();
  if(!SQC)buildSQ();for(const c in SQC)for(const id of SQC[c]){const b=BASE[id];if(!b)continue;const q0=S.ps[id];if(q0&&q0.injD>0)continue;const k=.0038*(1+((b.inj||8)-8)*.06)*(mine.has(+id)||mine.has(id)?f:1);
    if(Math.random()<k){const q=S.ps[id]=S.ps[id]||{};q.injD=injDays('t');if(q.injD>=30)q.injLong=S.season;if((mine.has(+id)||mine.has(id))&&!(typeof unemp==='function'&&unemp())){const m=injMsg(b,q.injD,'훈련 중 부상');if(m)inbox('부상','',`${b.name} 부상`,m)}}}}
{const _d=daily;daily=function(){const o=_d.apply(this,arguments);try{injTrainDaily()}catch(e){console.error(e)}return o}}

const STAD=__DATA__("STAD");
