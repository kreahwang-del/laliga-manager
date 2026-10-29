// ================= 해외 구단 직접 지원 · 희망 국가(v171) =================
//  · 감독 탭 '해외 구단' 카드: 나라 탭 → 그 나라 1부 구단 목록, 요구 평판 ≤ 내 평판+8 이면 지원 가능
//  · 지원 후 3~7일 뒤 결과: 성공 확률 = .55 + (내 평판 − 요구 평판)×.04 (5~85%), 동시 지원 3곳, 한 구단은 시즌당 1번
//  · 성공하면 기존 해외 제안과 같은 메일(수락 시 7월 1일 부임)
//  · 희망 국가(S.abPref): 6월 해외 제안 확률 +15%p, 무소속 3주 제안 확률 55→70%, 제안 1곳은 희망 국가 구단 우선(요구 평판 범위 −25~+5)
const AB_MAX=3;
function abLgs(){const cur=hl();return ABROAD_LG.filter(l=>l!==cur&&CLUBS.some(c=>c&&c.i>=0&&c.lg===l))}
function abChance(c){const d=(S.me.rep||0)-reqRep(c);return Math.max(.05,Math.min(.85,.55+d*.04))}
function abOfferMsg(c,tag){const ex=expFor(c.i);S.exp=S.exp||{};S.exp[c.i]=ex;
  inbox('job','',`[해외] ${c.name} 감독직 제안 (${LGN[c.lg]||c.lg})`,`${c.name}이(가) ${S.me.name} 감독을 원합니다. 목표: ${ex.lb}(리그 전력 ${ex.ep}위). ${abWhen()}.${tag||''}`,{club:c.i,abroad:1})}
/* 해외 제안: 희망 국가 우선 */
abroadOffer=function(tag,maxN){if(!S.me||!S.mg)return 0;const rep=S.me.rep,cur=hl(),pref=S.abPref&&S.abPref!==cur?S.abPref:null;
  const ok=c=>c&&c.i>=0&&ABROAD_LG.includes(c.lg)&&c.lg!==cur&&c.i!==S.club;let n=0;const used=new Set();
  if(pref){const pp=CLUBS.filter(c=>ok(c)&&c.lg===pref).filter(c=>{const q=reqRep(c.i);return q<=rep+5&&q>=rep-25});
    if(pp.length){const c=pp.map(c=>[hsh(tag+'p'+c.i)*(.6+c.rep/150),c]).sort((a,b)=>b[0]-a[0])[0][1];abOfferMsg(c,' (희망 국가)');used.add(c.i);n++}}
  if(n<maxN){const pool=CLUBS.filter(c=>ok(c)&&!used.has(c.i)).filter(c=>{const q=reqRep(c.i);return q<=rep+2&&q>=rep-22});
    pool.map(c=>[hsh(tag+c.i)*(.6+c.rep/150),c]).sort((a,b)=>b[0]-a[0]).slice(0,maxN-n).forEach(([_,c])=>{abOfferMsg(c);n++})}
  return n};
/* 희망 국가: 무소속 3주 주기 추가 확률(55% 기본 + 15%p) — 기본 판정에서 빠진 경우 한 번 더 굴림 */
{const _dy=daily;daily=function(){const before=S&&S.abroadD;_dy();try{if(!S||!S.me||!S.mg)return;
  if(S.abPref&&unemp()&&!S.pendJob&&S.abroadD===S.date&&before!==S.date){const got=S.inbox.some(x=>x.abroad&&x.d===S.date);if(!got&&hsh('abp'+S.date)<.34)abroadOffer('abp'+S.date,1)}
  (S.abApp||[]).forEach(a=>{if(a.res||S.date<a.due)return;const c=CLUBS[a.c];if(!c){a.res='취소';return}
    if(S.pendJob){a.res='취소';return}
    if(hsh('aba'+a.c+a.d)<abChance(a.c)){a.res='합격';abOfferMsg(c,' (지원 결과)')}
    else{a.res='탈락';inbox('eval','',`[해외] ${c.name} 지원 결과`,`이사회는 다른 후보를 선택했습니다. (요구 평판 ${reqRep(a.c)} · 내 평판 ${S.me.rep})`)}});
  if(S.abApp&&S.abApp.length>30)S.abApp=S.abApp.slice(-30)}catch(e){console.error(e)}}}
/* 감독 탭 카드 */
function abCard(){if(!S.me)return '';const lgs=abLgs();if(!lgs.length)return '';const pref=S.abPref||'';
  const lg=lgs.includes(UI.abLg)?UI.abLg:(lgs.includes(pref)?pref:lgs[0]);const rep=S.me.rep;
  const apps=(S.abApp||[]).filter(a=>!a.res),napp=apps.length;
  const tried=c=>(S.abApp||[]).find(a=>a.c===c&&a.s===S.season);
  const rows=CLUBS.filter(c=>c&&c.i>=0&&c.lg===lg).map(c=>({c,q:reqRep(c.i)})).sort((a,b)=>b.q-a.q).map(({c,q})=>{
    const t=tried(c.i),p=abChance(c.i),lab=p>=.6?'가능성 높음':p>=.3?'보통':'낮음';let btn;
    if(t)btn=`<span class="note">${t.res||'지원함'}</span>`;else if(S.pendJob)btn='<span class="note">-</span>';
    else if(q>rep+8)btn='<span class="note">평판 부족</span>';else if(napp>=AB_MAX)btn='<button class="btn sm ghost" disabled>지원</button>';
    else btn=`<button class="btn sm ${p>=.3?'':'ghost'}" data-abapp="${c.i}">지원</button>`;
    return `<div class="li"><span class="nm">${crest(c.i)}<span><b>${esc(c.name)}</b><span>요구 평판 ${q}${q<=rep+8?' · '+lab:''}</span></span></span>${btn}</div>`}).join('');
  return `<h2>해외 구단</h2><section class="card pad">
    <div class="tabs" style="margin-bottom:8px;overflow-x:auto;white-space:nowrap">${lgs.map(x=>`<button data-ablg="${x}" aria-selected="${x===lg}">${x===pref?'★ ':''}${esc(LGN[x]||x)}</button>`).join('')}</div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="note">희망 국가: <b style="color:var(--text)">${pref?esc(LGN[pref]||pref):'없음'}</b></span>
      ${pref===lg?`<button class="btn sm ghost" data-abpref="">희망 해제</button>`:`<button class="btn sm ghost" data-abpref="${lg}">${esc(LGN[lg]||lg)}를 희망 국가로</button>`}</div>
    <p class="note" style="margin-top:6px;line-height:1.55">${S.pendJob?`부임 예정: ${esc(CLUBS[S.pendJob.c].name)}(${abNextJul()}). 그 전에는 지원할 수 없습니다.`:`지원 중 ${napp}/${AB_MAX}곳 · 결과는 3~7일 뒤 메일로 옵니다. 무소속이거나 리그 개막 전이면 수락 즉시 부임, 시즌 중이면 시즌을 마치고 7월 1일 부임.`} 희망 국가를 정하면 6월 시즌 종료 제안과 무소속 제안에서 그 나라 구단이 먼저 오고 제안 확률도 오릅니다.</p></section>
    <div class="card list" style="margin-top:8px">${rows||'<div class="li"><span class="note">구단 없음</span></div>'}</div>`}
{const _cv=careerView;careerView=function(){const h=_cv.apply(this,arguments);try{if(UI.cv&&UI.cv!=='mgr')return h;const k=h.indexOf('<h2>경력');const c=abCard();return k>=0?h.slice(0,k)+c+h.slice(k):h+c}catch(e){console.error(e);return h}}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-ablg],[data-abpref],[data-abapp]');if(!b||!S)return;const d=b.dataset;
  if(d.ablg!==undefined){UI.abLg=d.ablg;render();return}
  if(d.abpref!==undefined){S.abPref=d.abpref||null;save();render();toast(d.abpref?`희망 국가: ${LGN[d.abpref]||d.abpref}`:'희망 국가 해제');return}
  if(d.abapp!==undefined){const c=+d.abapp;S.abApp=S.abApp||[];if(S.pendJob||S.abApp.filter(a=>!a.res).length>=AB_MAX||S.abApp.some(a=>a.c===c&&a.s===S.season))return;
    S.abApp.push({c,d:S.date,s:S.season,due:addD(S.date,3+Math.floor(hsh('abd'+c+S.date)*5)),res:null});save();render();toast(`${CLUBS[c].name}에 지원서를 냈습니다`)}},true);

/* v173: 해외 부임 시점 — 예전엔 수락하면 항상 '다음 7월 1일 시즌 전환' 때 부임이라, 7월 1일 이후 무소속으로 수락하면 1년 가까이 무소속이 됨
   무소속이거나 이번 시즌 리그 경기가 아직 없으면 즉시 부임: 지금 '우리 리그'(2D 엔진) 일정 ↔ 새 나라 리그 빠른 계산 일정(S.fxE)을 맞바꿈(이미 치른 결과는 그대로) */
function abNow(){return unemp()||!fxOf(myDiv()).some(f=>f.res)}
function abNextJul(){const y=+S.date.slice(0,4)+(+S.date.slice(5,7)>=7?1:0);return `${y}년 7월 1일`}
function abWhen(){return unemp()?'수락하면 바로 부임합니다':abNow()?'수락하면 바로 부임합니다 — 지금 구단을 떠납니다':`수락하면 이번 시즌을 마치고 ${abNextJul()}에 부임합니다`}
function abMoveNow(c){const newL=baseLg(CLUBS[c].lg),newL2=HL2[newL]||null,oldL=S.fxHL||hl(),oldL2=S.fxHL2||hl2();S.fxE=S.fxE||{};
  if(newL!==oldL){const f1=fxOf(1),f2=LIGA2.length?fxOf(2):[];
    S.fxE[oldL]=f1.map(f=>{f.lg=oldL;return f});if(oldL2&&f2&&f2.length)S.fxE[oldL2]=f2.map(f=>{f.lg=oldL2;return f});
    const n1=(S.fxE[newL]||euroFixtures(newL,S.season)).map(f=>{delete f.lg;return f}),n2=newL2&&S.fxE[newL2]?S.fxE[newL2].map(f=>{delete f.lg;return f}):[];
    delete S.fxE[newL];if(newL2)delete S.fxE[newL2];
    S.hlg=newL;setHomeLeague(newL);S.fxHL=newL;S.fxHL2=newL2;S.vac=[];
    if(CLUBS[c].lg===newL2){S.myDiv=2;S.fixtures=n2;S.fixO=n1}else{S.myDiv=1;S.fixtures=n1;S.fixO=n2}}
  S.pendJob=null;S.exp=S.exp||{};S.exp[c]=S.exp[c]||expFor(c);moveTo(c);try{careerSeasonStart()}catch(e){console.error(e)}
  if(S.exp&&!S.exp[c])S.exp[c]=expFor(c);SQC=null;try{ensureXI()}catch(e){}
  S.news.unshift({d:S.date,t:`${S.me.name} 감독, ${CLUBS[c].name} 부임`,b:`${LGN[newL]||''} 새 도전`,v:0,big:true});save();render()}
/* 이미 '7월 1일 부임 예정'으로 기다리는 무소속 세이브도 바로 부임 */
{const _dy=daily;daily=function(){try{if(S&&S.me&&S.pendJob&&unemp())abMoveNow(S.pendJob.c)}catch(e){console.error(e)}_dy()}}
/* v175: 같은 날 같은 선수 부상 메일이 두 번 오지 않게 — 이미 있으면 내용만 갱신 */
{const _ib=inbox;inbox=function(type,a,title,body,extra){try{if(type==='부상'&&S&&S.inbox){const m=S.inbox.find(x=>x.type==='부상'&&x.title===title&&x.d===S.date);if(m){m.body=body;m.read=false;return m}}}catch(e){}return _ib.apply(this,arguments)}}
/* v176: 구단 색 — COLORS 표(일부 라리가 구단)에 없는 구단은 이름 해시로 임의 색이 나와 로마가 보라색 등으로 보였음 → 3D 유니폼 데이터(KITS3D 홈 킷)의 상의 색을 1색, 무늬색·하의·양말 중 다른 색을 2색으로 */
{const _cc=clubCol;clubCol=function(c){try{const n=CLUBS[c]&&CLUBS[c].name;if(n&&COLORS[n])return COLORS[n];const K=typeof KITS3D!=='undefined'&&KITS3D[c]&&KITS3D[c][0];
  if(K&&K[0]){const b=K[0].toLowerCase(),alt=[K[4]?K[5]:null,K[2],K[3],K[1]].map(x=>x&&String(x).toLowerCase()).find(x=>x&&x!==b);
    const dk=h=>{const v=parseInt(h,16);const r=(v>>16)&255,g=(v>>8)&255,bl=v&255;return '#'+[r,g,bl].map(x=>Math.round(x*.55).toString(16).padStart(2,'0')).join('')};
    return ['#'+b,alt?'#'+alt:dk(b)]}}catch(e){}return _cc(c)}}
/* v181: 라리가 외 리그 더비 — 예전엔 DERBY 표가 라리가 7개뿐이라 로마–라치오 등은 더비로 처리 안 됨(점수판 표시·과열·기자회견·결과 뉴스 모두 빠짐). 구단 이름으로 주요 더비 추가 + 경기 이틀 전 예고·무승부 뉴스 */
const DERBY_N=[['Roma','Lazio','로마 더비'],['Inter','Milan','밀라노 더비'],['Juventus','Torino','토리노 더비'],['Genoa','Sampdoria','제노바 더비'],['Juventus','Inter','데르비 디탈리아'],
 ['Liverpool','Everton','머지사이드 더비'],['Manchester City','Manchester Utd','맨체스터 더비'],['Arsenal','Tottenham','북런던 더비'],['Liverpool','Manchester Utd','노스웨스트 더비'],['Newcastle','Sunderland','타인-위어 더비'],['Aston Villa','Birmingham City','세컨드 시티 더비'],
 ['Dortmund','Schalke 04','레비어 더비'],['Bayern Munich','Dortmund','데어 클라시커'],['Hamburger SV','FC St. Pauli','함부르크 더비'],['Köln','Gladbach','라인 더비'],
 ['Paris SG','Marseille','르 클라시크'],['Lyon','AS Saint-Étienne','론 더비'],['Nice','Monaco','코트다쥐르 더비'],
 ['SL Benfica','Sporting CP','리스본 더비'],['SL Benfica','FC Porto','오 클라시쿠'],['AFC Ajax','Feyenoord Rotterdam','데 클라시커'],['Celtic FC','Rangers FC','올드 펌'],
 ['Galatasaray','Fenerbahce','이스탄불 더비'],['Fenerbahce','Beşiktaş Jimnastik Kulübü','이스탄불 더비'],['Galatasaray','Beşiktaş Jimnastik Kulübü','이스탄불 더비'],
 ['Club Atlético Boca Juniors','Club Atlético River Plate','수페르클라시코'],['Clube de Regatas do Flamengo','Fluminense Football Club','플라-플루'],['Sport Club Corinthians Paulista','Sociedade Esportiva Palmeiras','파울리스타 더비'],
 ['Club América','Club Guadalajara','수페르 클라시코'],['Al Hilal','Al Nassr','리야드 더비'],['Los Angeles Galaxy','Los Angeles Football Club','엘 트라피코'],['RSC Anderlecht','Club Brugge KV','벨기에 클라시코'],['RSC Anderlecht','Standard Liège','벨기에 클라시코'],
 ['Rapid Vienna','Austria Vienna','빈 더비'],['Shanghai Port FC','Shanghai Shenhua','상하이 더비'],
 ['Ulsan Hyundai Football Club','Jeonbuk Hyundai Motors','현대가 더비'],['Ulsan Hyundai Football Club','Football Club Pohang Steelers','동해안 더비'],['Football Club Seoul','Football Club Anyang','연고지 더비'],
 ['Suwon Samsung Bluewings','Football Club Seoul','슈퍼매치'],['Suwon Samsung Bluewings','Suwon FC','수원 더비'],['Suwon Samsung Bluewings','Football Club Anyang','지지대 더비'],
 ['Gamba Osaka','Cerezo Osaka','오사카 더비'],['Kawasaki Frontale','Tokyo Football Club','다마가와 클라시코'],['Yokohama Marinos','Kawasaki Frontale','가나가와 더비'],['Tokyo Football Club','Tokyo Verdy','도쿄 더비'],
 ['Hitachi Kashiwa Reysol','JEF United','지바 더비'],['Kashima Antlers FC','Football Club Mito HollyHock','이바라키 더비'],['S-Pulse','Júbilo Iwata','시즈오카 더비']];
const DERBY_M={};DERBY_N.forEach(([a,b,n])=>{DERBY_M[a+'|'+b]=n;DERBY_M[b+'|'+a]=n});
{const _do=derbyOf;derbyOf=function(h,a){const r=_do(h,a);if(r)return r;const x=CLUBS[h]&&CLUBS[h].name,y=CLUBS[a]&&CLUBS[a].name;return (x&&y&&DERBY_M[x+'|'+y])||null}}
{const _dy=daily;daily=function(){const r=_dy.apply(this,arguments);try{if(!S||!S.club||S.club<0||(typeof unemp==='function'&&unemp()))return r;const lim=addD(S.date,2);
  const all=[...(S.fixtures||[]),...(typeof cupAll==='function'?cupAll():[]),...(typeof euAll==='function'?euAll():[])];
  all.forEach(f=>{if(f.res||f.d<S.date||f.d>lim||(f.h!==S.club&&f.a!==S.club))return;const der=derbyOf(f.h,f.a);if(!der)return;S.derbyP=S.derbyP||{};const k=f.d+f.h+'-'+f.a;if(S.derbyP[k])return;S.derbyP[k]=1;
    const opp=f.h===S.club?f.a:f.h;const tb=typeof table==='function'?table():[];const pos=c=>{const i=tb.findIndex(t=>t.id===c);return i>=0?i+1:null};const pm=pos(S.club),po=pos(opp);
    S.news.unshift({d:S.date,t:`${der} 임박 — ${CLUBS[f.h].name} vs ${CLUBS[f.a].name}`,b:`${fmtD(f.d)} ${f.h===S.club?'홈':'원정'}${pm&&po?` · 순위 ${pm}위 vs ${po}위`:''} · 도시가 들끓고 있습니다`,v:0,big:true});
    if(typeof hlPush==='function')hlPush({key:'derp'+k,pri:3,tone:'info',c:opp,t:`${der} D-${Math.round(daysBetween(S.date,f.d))||'day'}`,b:`${CLUBS[opp].name}전 · ${fmtD(f.d)}`})});
  const ks=Object.keys(S.derbyP||{});if(ks.length>40)ks.slice(0,ks.length-40).forEach(k=>delete S.derbyP[k])}catch(e){console.error(e)}return r}}
/* v186: 컨디션 기준 평점 오류(6.7 → 6.35)로 바닥까지 떨어져 있던 기존 세이브의 우리 선수단 컨디션을 한 번 '보통'(50)으로 되돌림 */
{const _dl=devLoad;devLoad=function(){const r=_dl.apply(this,arguments);try{if(S&&S.ps&&!S.cndFix186&&S.club>=0){squadOf(S.club).forEach(p=>{const q=S.ps[p.id]=S.ps[p.id]||{};if((q.cndv??50)<50){q.cndv=50;q.cnd=2}});S.cndFix186=1}}catch(e){console.error(e)}return r}}
/* v187: AI 팀 컨디션 — 예전엔 우리 선수단만 주간 컨디션 갱신(평점·경기 감각·팀 분위기·만족도·무작위·평균 회귀), AI는 늘 '보통'. 이제 엔진으로 경기하는 구단(우리 리그 1·2부 + 이번 시즌 유럽대항전 참가 구단)도 같은 식으로 갱신
   팀 분위기 = 최근 5경기(리그·컵·유럽) 승−패, 경기 기록이 없는 선수는 평점 항(기준 6.35)·경기 감각 항 0 */
function clubForm5(c){const L=[...(S.fixtures||[]),...(S.fixO||[]),...(typeof cupAll==='function'?cupAll():[]),...(typeof euAll==='function'?euAll():[])].filter(f=>f.res&&(f.h===c||f.a===c)).sort((a,b)=>a.d<b.d?-1:1).slice(-5);
  return L.reduce((a,f)=>{const [x,y]=f.res.sc,d=f.h===c?x-y:y-x;return a+(d>0?1:d<0?-1:0)},0)}
function aiCondUpdate(){const set=new Set([...LIGA,...(LIGA2||[])]);try{(typeof euAll==='function'?euAll():[]).forEach(f=>{set.add(f.h);set.add(f.a)})}catch(e){}
  set.delete(S.club);set.forEach(c=>{if(c==null||c<0||!CLUBS[c])return;const tf=clubForm5(c);squadOf(c).forEach(p=>{const q=S.ps[p.id]=S.ps[p.id]||{};let v=q.cndv??50;const rr=q.recentR||[];
    if(rr.length)v+=(rr.slice(-3).reduce((a,b)=>a+b,0)/Math.min(3,rr.length)-6.35)*CND_K[0];if(q.played){const gap=daysBetween(q.played,S.date);v+=gap>21?-6:gap>10?-2:2}
    if(q.injD>0)v-=4;v+=tf*CND_K[1]+(Math.random()-.5)*8+(50-v)*CND_K[2];q.cndv=Math.max(0,Math.min(100,v));q.cnd=v>=72?0:v>=58?1:v>=42?2:v>=28?3:4})})}
{const _uc=updateConditions;updateConditions=function(){const r=_uc.apply(this,arguments);try{if(S&&S.ps)aiCondUpdate()}catch(e){console.error(e)}return r}}
/* v188: AI 숙련도 — 예전엔 시즌 시작 때 무작위 60~90(일부 감독 고정값)으로 정해져 시즌 내내 그대로. 이제 우리 팀과 같은 규칙: 포메이션(기본)+프리셋 조합별로 쌓임
   경기마다 쓴 조합 +2·안 쓴 조합 +0.2, 매주 지금 조합 +0.4. 처음 보는 구단은 지금 조합을 기존 값(50~85)에서 시작(기존 균형 유지), 감독 교체·전술 재검토로 조합이 바뀌면 새 조합은 50부터 */
function aiFamKey(T){return (T.preset||'균형')+'|'+((T.form&&T.form.base)||'4-3-3')}
function aiFamGet(c,T){S.aiFam=S.aiFam||{};const m=S.aiFam[c]||(S.aiFam[c]={});const k=aiFamKey(T);if(m[k]==null)m[k]=Object.keys(m).length?50:Math.max(50,Math.min(85,T.fam??60));return m[k]}
{const _tf=teamFor;teamFor=function(c){const t=_tf.apply(this,arguments);try{if(t&&c!==S.club&&S.aiTac&&S.aiTac[c]){t.fam=aiFamGet(c,S.aiTac[c])}}catch(e){console.error(e)}return t}}
{const _am=applyMatch;applyMatch=function(H,Aw,res,counts){const o=_am.apply(this,arguments);try{if(counts)[H,Aw].forEach(T=>{const c=T&&T.club;if(c==null||c===S.club||!S.aiTac||!S.aiTac[c])return;aiFamGet(c,S.aiTac[c]);const m=S.aiFam[c],k=aiFamKey(S.aiTac[c]);
  for(const x in m)m[x]=Math.min(100,m[x]+(x===k?2:.2))})}catch(e){console.error(e)}return o}}
{const _dy=daily;daily=function(){const r=_dy.apply(this,arguments);try{if(S&&S.aiFam&&D(S.date).getUTCDay()===1)for(const c in S.aiFam){const T=S.aiTac&&S.aiTac[c];if(!T)continue;const k=aiFamKey(T),m=S.aiFam[c];if(m[k]!=null)m[k]=Math.min(100,m[k]+.4)}}catch(e){console.error(e)}return r}}
/* v189: 화면에 앱 버전 표시(홈·시작 화면 맨 아래, 감독 탭) — 빌드 때 version.json의 v를 APPV로 넣음 */
function verTag(){return typeof APPV!=='undefined'?`<p class="note" style="text-align:center;margin:18px 0 6px;opacity:.65">월드 풋볼 매니저 · 버전 v${APPV}</p>`:''}
{const _hv=homeView;homeView=function(){return _hv.apply(this,arguments)+verTag()}}
{const _sv=startView;startView=function(){const h=_sv.apply(this,arguments);const k=h.lastIndexOf('</main>');return k>=0?h.slice(0,k)+verTag()+h.slice(k):h+verTag()}}
{const _cv=careerView;careerView=function(){return _cv.apply(this,arguments)+verTag()}}
/* v190: 화폐 표시 — 한국 구단이면 원, 일본 구단이면 엔(내부 계산은 유로 그대로). 환율 2026.10 기준 1€ = 1,490원·186엔(고정) */
const CUR_RATE={KR:[1490,'원'],JP:[186,'엔']};
function curLg(){try{const c=S&&S.club>=0&&CLUBS[S.club];const lg=c?baseLg(c.lg):(typeof hl==='function'?hl():'ES');return CUR_RATE[lg]?lg:null}catch(e){return null}}
function krwFmt(w){const a=Math.abs(w),sg=w<0?'-':'';if(a>=1e8){const e=a/1e8;return sg+(e>=100?Math.round(e).toLocaleString():e.toFixed(e>=10?0:1))+'억원'}if(a>=1e4)return sg+Math.round(a/1e4).toLocaleString()+'만원';return sg+Math.round(a).toLocaleString()+'원'}
function jpyFmt(y){const a=Math.abs(y),sg=y<0?'-':'';if(a>=1e8){const e=a/1e8;return sg+(e>=100?Math.round(e).toLocaleString():e.toFixed(e>=10?0:1))+'억엔'}if(a>=1e4)return sg+Math.round(a/1e4).toLocaleString()+'만엔';return sg+Math.round(a).toLocaleString()+'엔'}
{const _m=money,_mm=mM;money=v=>{const L=curLg();if(!L)return _m(v);const x=(+v||0)*CUR_RATE[L][0];return L==='KR'?krwFmt(x):jpyFmt(x)};mM=m=>{const L=curLg();if(!L)return _mm(m);const x=(+m||0)*1e6*CUR_RATE[L][0];return L==='KR'?krwFmt(x):jpyFmt(x)}}
/* v193: 동시 스카우트 인원 3명 고정 → 구단 평판에 따라 5~10명(빅클럽일수록 스카우트망이 큼) */
function scoutMax(){return 10} /* v194 사용자 요청: 모든 구단 10명 */
/* v196 관심 목록 전체 삭제(스카우팅 중인 선수는 유지) — 실수 방지로 두 번 눌러 확정 */
{const _wv=watchView;watchView=function(){let h=_wv.apply(this,arguments);try{const n=S.watch.filter(id=>!S.scouts.some(s=>s.id===id)).length;
  if(n)h=h.replace('<div class="card list"',`<div class="act" style="margin-top:6px"><button class="btn sm ghost" data-wclr="1">관심 목록 비우기 (스카우팅 중 제외 ${n}명)</button></div><div class="card list"`)}catch(e){}return h}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-wclr]');if(!b)return;e.stopPropagation();e.preventDefault();
  const keep=S.watch.filter(id=>S.scouts.some(s=>s.id===id)),n=S.watch.length-keep.length;
  if(!b._arm){b._arm=1;b.textContent=`한 번 더 누르면 ${n}명 삭제`;b.style.color='var(--bad,#d33)';setTimeout(()=>{if(b.isConnected){b._arm=0;b.textContent=`관심 목록 비우기 (스카우팅 중 제외 ${n}명)`;b.style.color=''}},4000);return}
  S.watch=keep;save();render();toast(`관심 목록에서 ${n}명을 삭제했습니다${keep.length?` · 스카우팅 중 ${keep.length}명 유지`:''}`)},true);

