// ===================== 경기 엔진 v2: 15칸 구역 매치업 =====================
// 의존: 선수 객체 {id,name,g,sub,foot,ovr,shoot,pass,drib,cross,tackle,posit,offball,aerial,pace,stamina,gk_*,cond(0-4),fit(0-100),inj}
// 팀 설정: {club, xi:[player x11], form:{base,atk,def}, pos:{base:{i:[x,y]},...}, roles:[idx], duties:[0|1|2], marks:[{on,tight,t}],
//           preset, ti:[line,defW,atkW,tempo,passLen,press,counter], fam(0-100), ment?}
(function(root){
const FORMS={
 '4-3-3':   ['GK','RB','RCB','LCB','LB','DM','RCM','LCM','RW','ST','LW'],
 '4-2-3-1': ['GK','RB','RCB','LCB','LB','RDM','LDM','AM','RW','ST','LW'],
 '4-4-2':   ['GK','RB','RCB','LCB','LB','RM','RCM','LCM','LM','RST','LST'],
 '3-5-2':   ['GK','RCB','CB','LCB','RWB','DM','RCM','LCM','LWB','RST','LST'],
 '3-4-3':   ['GK','RCB','CB','LCB','RWB','RCM','LCM','LWB','RW','ST','LW'],
 '4-1-4-1': ['GK','RB','RCB','LCB','LB','DM','RM','RCM','LCM','LM','ST'],
 '5-4-1':   ['GK','RWB','RCB','CB','LCB','LWB','RM','RCM','LCM','LM','ST'],
 '5-3-2':   ['GK','RWB','RCB','CB','LCB','LWB','RCM','DM','LCM','RST','LST']};
// 슬롯 → 포지션군, 좌우
const SLOT={GK:['GK'],RB:['FB','R'],LB:['FB','L'],RWB:['FB','R'],LWB:['FB','L'],RCB:['CB'],LCB:['CB'],CB:['CB'],DM:['DM'],RDM:['DM'],LDM:['DM'],
 RCM:['CM'],LCM:['CM'],CM:['CM'],AM:['AM'],RM:['W','R'],LM:['W','L'],RW:['W','R'],LW:['W','L'],ST:['ST'],RST:['ST'],LST:['ST']};
// 기본 좌표(x: 0 왼쪽~100 오른쪽, y: 0 상대 골문~100 우리 골문)
const COORD={
 '4-3-3':[[50,92],[84,72],[62,77],[38,77],[16,72],[50,60],[69,46],[31,46],[84,23],[50,14],[16,23]],
 '4-2-3-1':[[50,92],[84,72],[62,77],[38,77],[16,72],[62,58],[38,58],[50,38],[84,28],[50,13],[16,28]],
 '4-4-2':[[50,92],[84,72],[62,77],[38,77],[16,72],[84,46],[62,50],[38,50],[16,46],[62,17],[38,17]],
 '3-5-2':[[50,92],[70,76],[50,78],[30,76],[88,48],[50,60],[66,42],[34,42],[12,48],[62,17],[38,17]],
 '3-4-3':[[50,92],[70,76],[50,78],[30,76],[88,50],[62,52],[38,52],[12,50],[82,22],[50,13],[18,22]],
 '4-1-4-1':[[50,92],[84,72],[62,77],[38,77],[16,72],[50,62],[84,42],[62,45],[38,45],[16,42],[50,14]],
 '5-4-1':[[50,92],[86,70],[66,78],[50,80],[34,78],[14,70],[82,46],[60,50],[40,50],[18,46],[50,15]],
 '5-3-2':[[50,92],[86,70],[66,78],[50,80],[34,78],[14,70],[66,46],[50,58],[34,46],[62,17],[38,17]]};
// 대형 전환 시 슬롯 매핑(기본 슬롯 i → 다른 대형의 슬롯 j): 라인·좌우 유사도로 자동 매핑
function mapSlots(fromForm,toForm){
  const A=FORMS[fromForm],B=FORMS[toForm],ca=COORD[fromForm],cb=COORD[toForm];
  const used=new Set(),m=[];
  // GK 고정, 나머지는 좌표 거리 최소 매칭(탐욕, 거리순)
  m[0]=0;used.add(0);
  const pairs=[];for(let i=1;i<11;i++)for(let j=1;j<11;j++)pairs.push([Math.hypot((ca[i][0]-cb[j][0])*1.6,(ca[i][1]-cb[j][1])*.8),i,j]);
  pairs.sort((a,b)=>a[0]-b[0]);const done=new Set();
  for(const [d,i,j] of pairs){if(done.has(i)||used.has(j))continue;m[i]=j;done.add(i);used.add(j)}
  return m; // m[i]=j
}
const ROLES={
 GK:[['골키퍼',{gk_save:1,gk_air:.6,gk_dist:.4},{}],['스위퍼 키퍼',{gk_sweep:1,gk_dist:.7,gk_save:.8},{sweep:1,dist:1}]],
 CB:[['수비수',{tackle:1,posit:1,aerial:.8},{}],['볼 플레잉 수비수',{pass:1,posit:.9,tackle:.7},{build:1,fwd:.3}],['스토퍼',{tackle:1,aerial:.9,pace:.6},{aggr:1,fwd:.5}]],
 FB:[['풀백',{tackle:1,posit:.8,stamina:.7},{}],['윙백',{cross:1,pace:.9,stamina:1},{fwd:1,wide:1}],['인버티드 풀백',{pass:1,posit:.8,tackle:.7},{inside:1,build:.6}]],
 DM:[['앵커',{posit:1,tackle:.9,pass:.6},{hold:1}],['딥라잉 플레이메이커',{pass:1,posit:.7,stamina:.5},{build:1,hold:.5}],['볼 위닝 미드필더',{tackle:1,stamina:.9,pace:.6},{aggr:1,press:.6}]],
 CM:[['박스투박스',{stamina:1,pass:.7,tackle:.7},{fwd:.5,press:.4}],['메짤라',{drib:.9,offball:1,pass:.7},{fwd:.9,inside:1}],['플레이메이커',{pass:1,drib:.7,offball:.6},{build:1,create:1}]],
 AM:[['공격형 미드필더',{pass:.9,offball:.8,shoot:.7},{create:.8,fwd:.5}],['섀도 스트라이커',{offball:1,shoot:.9,pace:.6},{fwd:1,shoot:.6}],['전진형 플레이메이커',{pass:1,drib:.8,offball:.6},{create:1}]],
 W:[['윙어',{cross:1,pace:.9,drib:.8},{wide:1,cross:1}],['인사이드 포워드',{shoot:1,drib:.9,offball:.8},{inside:1,shoot:1}],['인버티드 윙어',{pass:.9,drib:.8,cross:.6},{inside:.7,create:.8}]],
 ST:[['포처',{shoot:1,offball:1,pace:.5},{box:1,shoot:1}],['타깃맨',{aerial:1,shoot:.7,stamina:.5},{target:1,hold:.5}],['폴스 9',{pass:1,drib:.8,offball:.6},{drop:1,create:.8}],['어드밴스드 포워드',{pace:1,offball:.9,shoot:.8},{run:1,press:.6}]]};
const DUTY=['수비','지원','공격'];
// 개인 지시(선수별, 3단계 0/1/2 · 기본 1). 효과는 능력치 배수가 아니라 '얼마나 자주 시도하는가'와 그 대가(체력·파울·슈팅 질)
const PI={sh:['슈팅 자제','보통','슈팅 자주'],dr:['드리블 자제','보통','드리블 자주'],cr:['크로스 자제','보통','크로스 자주'],rn:['침투 자제','보통','침투 자주'],ov:['언더래핑','상황 판단','오버래핑'],wd:['안쪽으로','보통','넓게'],pr:['압박 약하게','보통','압박 강하게'],tk:['태클 신중','보통','태클 강하게']};
const PIK=Object.keys(PI);
const PRESETS={'티키타카':[4,3,4,2,1,4,0],'게겐프레싱':[5,3,3,5,3,5,1],'두 줄 수비':[2,2,3,3,3,2,1],'선수비 후 역습':[1,3,3,4,4,2,1],'다이렉트':[3,3,3,4,5,3,1],'측면 공략':[3,4,5,3,3,3,0],'균형':[3,3,3,3,3,3,0]};
/* 상성 v63(사용자 결정): 균형 제외 모든 전술 2승 2패. 이전 표는 역습 2승 0패·측면 1승 0패·티키타카 1승 3패로 역습 일방 우위
   역습 > 게겐·티키타카(높은 라인 뒷공간) / 두 줄 수비·측면 공략에 약함(내려앉은 상대엔 역습 공간 없음, 측면 과부하에 수비 블록이 끌려 나감)
   티키타카 > 두 줄 수비·다이렉트(점유로 블록 흔들기, 긴 공 차단) / 게겐·역습에 약함
   게겐 > 티키타카·측면 공략(짧은 빌드업·측면 전개를 압박으로 끊음) / 역습·다이렉트에 약함(압박을 넘기는 긴 공)
   두 줄 수비 > 역습·다이렉트 / 티키타카·측면 공략에 약함
   다이렉트 > 게겐·측면 공략 / 두 줄 수비·티키타카에 약함
   측면 공략 > 두 줄 수비·역습 / 게겐·다이렉트에 약함 */
const BEATS={'선수비 후 역습':['게겐프레싱','티키타카'],'티키타카':['두 줄 수비','다이렉트'],'게겐프레싱':['티키타카','측면 공략'],'두 줄 수비':['선수비 후 역습','다이렉트'],'다이렉트':['게겐프레싱','측면 공략'],'측면 공략':['두 줄 수비','선수비 후 역습'],'균형':[]};
// 성향 적합도 = (필요 능력 평균 − 그 팀 전체 능력 평균) − 라리가 중앙값. 팀 전력 자체와 분리해 '상대적으로 맞는 성향'만 평가
// 기준값: 라리가 20팀 주전 10명(게임 능력치) 중앙값. 균형은 성향 보너스·불이익 없음
const NEED_REF={'티키타카':.46,'게겐프레싱':.83,'두 줄 수비':-.1,'선수비 후 역습':-.23,'다이렉트':-.69,'측면 공략':-.2,'균형':null};
const NEED_SD={'티키타카':.2,'게겐프레싱':.22,'두 줄 수비':.37,'선수비 후 역습':.33,'다이렉트':.18,'측면 공략':.24}; // 라리가 20팀(자동 선발) 중앙값·표준편차 → 성향 간 공정 비교
const CORE10=['shoot','pass','drib','cross','tackle','posit','offball','aerial','pace','stamina'];
const styleOf=(v,fam,dev)=>v*(0.5+0.5*fam/100)*Math.max(0,1-dev*.2);
const relFit=(xi,preset)=>{const o=xi.filter(p=>p.g!=='GK');const need=NEEDS[preset];return o.reduce((a,p)=>a+need.reduce((b,k)=>b+p[k],0)/need.length-CORE10.reduce((b,k)=>b+p[k],0)/10,0)/Math.max(1,o.length)};
// 성향 적합도(사용자 확정 방식): 6개 성향 중 상대적으로 가장 맞는 1~2개만 보너스, 가장 안 맞는 1~2개만 불이익, 나머지는 0
//  2순위는 1순위와 0.3 이내일 때만 포함, 크기가 0.2 미만이면 제외
/* 스타일 적합도 v61: 능력치 기반(40%) + 실제 플레이 데이터 기반(60%: 선수 유형·성향·특성). 이전 능력치만으로는 바르샤 티키타카 0·역습 1, 아틀레티코 두 줄 수비 −0.9처럼 실제 팀 색깔과 어긋남.
   데이터 기반 점수 = XI 평균(해당 역할 유형 +1, 관련 성향 log, 관련 특성 +0.5), 5대 리그 전 구단 XI의 평균·편차로 표준화 */
const STY_R={'티키타카':{r:['딥라잉 플레이메이커','플레이메이커','볼 플레잉 수비수','인버티드 풀백','메짤라','폴스 9','전진형 플레이메이커','인버티드 윙어'],h:[[4,1]],t:['스루패스','방향 전환','전진 패스']},
 '게겐프레싱':{r:['볼 위닝 미드필더','박스투박스','어드밴스드 포워드'],d:[[0,1]],t:['전방 압박','태클']},
 '두 줄 수비':{r:['스토퍼','앵커','수비수','풀백'],d:[[1,1]],t:['가로채기','공중볼']},
 '선수비 후 역습':{r:['어드밴스드 포워드','인사이드 포워드','섀도 스트라이커'],h:[[3,.6],[5,.6]],t:['라인 줄타기','볼 운반','드리블 돌파']},
 '다이렉트':{r:['타깃맨','스토퍼'],t:['공중볼','공중전 강자']},
 '측면 공략':{r:['윙어','윙백','풀백'],h:[[2,1]],t:['크로스']}};
const STY_REF={"티키타카":-0.2995,"게겐프레싱":0.0189,"두 줄 수비":0.0113,"선수비 후 역습":-0.2449,"다이렉트":0.0754,"측면 공략":-0.1754},STY_SD={"티키타카":0.297,"게겐프레싱":0.1276,"두 줄 수비":0.1519,"선수비 후 역습":0.3412,"다이렉트":0.0717,"측면 공략":0.1923};
function styData(xi,k){const c=STY_R[k];if(!c)return null;let v=0,n=0,has=0;for(const p of xi){if(!p)continue;n++;const ps=p.pst,rs=ROLES[p.g];if(ps||p.hab)has++;const role=ps&&rs?rs[ps[0]]:null;if(role&&c.r.includes(role))v+=1;
  (c.h||[]).forEach(([i,w])=>{if(p.hab)v+=w*Math.log(p.hab[i])});(c.d||[]).forEach(([i,w])=>{if(p.dh)v+=w*Math.log(p.dh[i])});(c.t||[]).forEach(t=>{if(ps&&((ps[2]||[]).includes(t)||(ps[3]||[]).includes(t)))v+=.5})}
  if(!n||has<n*.6)return null;return Math.max(-1,Math.min(1,(v/n-STY_REF[k])/STY_SD[k]/1.5))}
function styleMap(xi){const ps=Object.keys(NEED_REF).filter(p=>NEED_REF[p]!=null);const d=ps.map(p=>{const a=Math.max(-1,Math.min(1,(relFit(xi,p)-NEED_REF[p])/NEED_SD[p]/1.5));const q=styData(xi,p);return [p,q==null?a:.4*a+.6*q]}).sort((a,b)=>b[1]-a[1]);
  const out={};ps.forEach(p=>out[p]=0);out['균형']=0;
  const top=d.slice(0,2).filter(([p,v],k)=>v>=.25&&(k===0||d[0][1]-v<=.25));top.forEach(([p,v])=>out[p]=v);
  const bot=d.slice(-2).reverse().filter(([p,v],k)=>v<=-.25&&(k===0||v-d[d.length-1][1]<=.25));bot.forEach(([p,v])=>out[p]=v);
  return out}
const NEEDS={'티키타카':['pass','posit','drib'],'게겐프레싱':['stamina','pace','tackle'],'두 줄 수비':['posit','aerial','tackle'],'선수비 후 역습':['pace','offball','drib'],'다이렉트':['aerial','shoot','pace'],'측면 공략':['cross','pace','aerial'],'균형':['pass','posit','stamina']};
const COND_M=[1.08,1.04,1,.96,.92];
const ADJ={CB:{DM:.8,FB:.8},FB:{CB:.8,W:.75,DM:.7},DM:{CM:.9,CB:.8},CM:{DM:.9,AM:.9,W:.7},AM:{CM:.85,W:.85,ST:.8},W:{AM:.85,ST:.8,FB:.7},ST:{AM:.8,W:.8}};
const sideOf=p=>/Left/.test(p.sub||'')?'L':/Right/.test(p.sub||'')?'R':null;
function fitBase(p,sg,side){const pg=p.g;
  if(sg==='GK'||pg==='GK')return sg===pg?1:.2;
  if(sg===pg){if(side&&sideOf(p)&&sideOf(p)!==side)return .9;return 1}
  return (ADJ[sg]&&ADJ[sg][pg])||(ADJ[pg]&&ADJ[pg][sg])||.55}
// 적합도 = 주 포지션 기준 값과 실제 출전 기록(부 포지션)·게임 내 숙련 중 높은 값
function fitOf(p,slotKey){const [sg,side]=SLOT[slotKey];let v=fitBase(p,sg,side);
  const k=sg+(side?'-'+side:'');const f=p.pos2&&p.pos2.f;if(f){v=Math.max(v,f[k]||0);if(!side&&f[sg])v=Math.max(v,f[sg])}
  const x=p.posXp&&p.posXp[k];if(x)v=Math.max(v,Math.min(1,v+x));return v}
const posMul=f=>.55+.45*f; // 적합도 → 경기 능력 배수(100%→1.0, 90%→0.955, 75%→0.89, 55%→0.80)
const cell=(x,y)=>[y<33.34?0:y<66.67?1:2,Math.min(4,Math.max(0,Math.floor(x/20)))]; // [row(0=공격), lane]
const fitF=p=>.72+.28*Math.min(1,(p.fit??100)/100);
const condM=p=>COND_M[p.cond??2];
function roleFit(p,role){let s=0,w=0;for(const k in role[1]){s+=(p[k]||1)*role[1][k];w+=role[1][k]}let v=s/w;
  /* 선수 유형(실제 기록 기반) 반영: 원래 스타일 역할 +0.6, 다른 역할은 점수 차만큼 감점(최대 −3) */
  const ps=p.pst,rs=ROLES[p.g];if(ps&&rs){const j=rs.indexOf(role);if(j>=0&&ps[1]&&ps[1].length===rs.length){const mx=Math.max(...ps[1]);v+=j===ps[0]?.6:Math.max(-3,1.5*(ps[1][j]-mx))}}return v} // 0~20

// ---------- 팀 준비 ----------
// 슬롯 변형: 같은 자리에서 역할 높이만 바꿈(예: 중앙 MF 자리 → 수비형/중앙/공격형). 좌우는 유지
const SLOT_H={DM:60,CM:47,AM:36,M:46,W:25,B:72,WB:60,ST:15};
const hKey=k=>{const g=(SLOT[k]||['CM'])[0];if(g==='W')return /M$/.test(k)?'M':'W';if(g==='FB')return /WB$/.test(k)?'WB':'B';return g};
function slotAlt(k){const sd=/^[RL]/.test(k)&&!/^(RB|LB)$/.test(k)?k[0]:'';const g=(SLOT[k]||[''])[0];
  if(['DM','CM','AM'].includes(g))return [sd+'DM',sd+'CM',sd?sd+'AM':'AM'].map(x=>x==='DM'||x==='CM'||x==='AM'||SLOT[x]?x:x);
  if(g==='W')return [k[0]+'M',k[0]+'W'];
  if(g==='FB')return [k[0]+'B',k[0]+'WB'];
  if(g==='ST')return [k,sd?sd+'AM':'AM'];
  return [k]}
SLOT.RAM=['AM'];SLOT.LAM=['AM'];
function phaseSlots(T,ph){const f=T.form[ph]||T.form.base;const base=COORD[f];const m=ph==='base'?null:mapSlots(T.form.base,f);const custom=(T.pos&&T.pos[ph])||{};
  return FORMS[T.form.base].map((_,i)=>{const j=m?m[i]:i;let c=custom[i]||base[j];let key=FORMS[f][j];const bk=FORMS[T.form.base][i],ek=effKey(T,i);
    if(ek!==bk){const dy=(SLOT_H[hKey(ek)]-SLOT_H[hKey(bk)])*(ph==='def'?.5:1);if(!custom[i])c=[c[0],Math.max(8,Math.min(88,c[1]+dy))];if(ph==='base'||(SLOT[key]||[''])[0]===(SLOT[bk]||[''])[0])key=ek}
    return {i,key,x:c[0],y:c[1]}})}
function effKey(T,i){const b=FORMS[T.form.base][i];const a=T.slotAs&&T.slotAs[i];return a&&SLOT[a]&&(b==='GK')===(a==='GK')?a:b}
// 드래그한 좌표로 자리 판정(x: 0 왼쪽~100 오른쪽, y: 0 상대 골문~100 우리 골문)
function keyFromPos(x,y,bk){if(bk==='GK')return 'GK';const wide=x<28?'L':x>72?'R':'';
  if(wide)return wide+(y<36?'W':y<56?'M':y<67?'WB':'B');
  const c=x<43?'L':x>57?'R':'';
  if(y<25)return c?c+'ST':'ST';if(y<41)return c?c+'AM':'AM';if(y<55)return c?c+'CM':'CM';if(y<67)return c?c+'DM':'DM';return c?c+'CB':'CB'}
// 실제 배치 기준 대형 이름(수비·미드·공격 줄 수)
function shapeOf(T,ph){const ps=phaseSlots(T,ph||'base').filter(q=>q.key!=='GK');const b=[0,0,0,0,0];ps.forEach(q=>{const y=q.y;b[y>=64?0:y>=56?1:y>=40?2:y>=25?3:4]++});if(!(b[1]===1&&b[2]>=4)){b[2]+=b[1];b[1]=0}return b.filter(v=>v>0).join('-')}
function prep(T,side){ // side 0 홈(아래→위 공격) / 1 원정: 상대 좌표는 반전
  const out={...T};
  out.k=(ph)=>{const ps=phaseSlots(out,ph);return out.xi.map((p,i)=>{const q=ps[Math.min(i,ps.length-1)];return {p,i,slotKey:q.key,x:q.x,y:q.y}})};
  out.grpOf=(i)=>{const p=out.xi[i];const bk=FORMS[out.form.base][Math.min(i,10)];const ek=effKey(out,Math.min(i,10));return ((ek!==bk?SLOT[ek]:null)||SLOT[bk]||[p.g])[0]};/* v261 사용자 결정(2026-10-30): 움직임·역할 그룹은 선수 원래 포지션이 아니라 서 있는 자리 기준(능력 감소는 적합도로 따로 반영) */
  out.roleOf=(i)=>{const rs=ROLES[out.grpOf(i)]||ROLES.CM;return rs[Math.min((out.roles||[])[i]||0,rs.length-1)]};
  out.dutyOf=(i)=>(out.duties||[])[i]??1;
  out.pi=(p,k)=>{const o=out.pi_&&out.pi_[p.id];return o&&o[k]!=null?o[k]:1};out.pi_=T.pi||{};
  out.ti=T.ti||PRESETS[T.preset||'균형'];
  out.preset=T.preset||'균형';
  out.refit=()=>{out.fm={};out.xi.forEach((p,i)=>{out.fm[p.id]=fitOf(p,effKey(out,Math.min(i,10)))})};out.refit();
  out.fam=T.fam??50;
  out.dev=out.ti.reduce((a,v,i)=>a+Math.max(0,Math.abs(v-PRESETS[out.preset][i])-1),0);
  // 성향 보너스: 필요 능력치 평균(11명)과 숙련도, 이탈 정도
  out.styleBonus=T.styleFixed??styleOf(styleMap(out.xi)[out.preset],out.fam,out.dev); // −1~1: 선수 구성이 성향에 맞지 않으면 음수(불이익)
  return out;
}
// ---------- 구역 점유(수적 우위) ----------
function grid(pts,flip){ const z=Array.from({length:3},()=>Array(5).fill(0));
  pts.forEach(q=>{ if(q.slotKey==='GK')return; const x=flip?100-q.x:q.x,y=flip?100-q.y:q.y; const [r,l]=cell(x,y);
    const w=fitF(q.p)*posMul(fitOf(q.p,q.slotKey)); z[r][l]+=w; [[r-1,l],[r+1,l],[r,l-1],[r,l+1]].forEach(([a,b])=>{if(a>=0&&a<3&&b>=0&&b<5)z[a][b]+=.45*w})});
  return z}
// 상대 좌표는 반전해서 우리 관점 격자로: 우리 공격 row0 = 상대 수비 진영
// ---------- 시뮬레이션 ----------
function createMatch(H,A,opt={}){
  const r=opt.rnd||Math.random, home=opt.home!==false;
  const T=[prep(H,0),prep(A,1)];
  const st={tu:[{},{}],supA:[0,1].map(()=>({g:[[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],n:0})),min:0,sc:[0,0],sh:[0,0],sot:[0,0],xg:[0,0],pos:[0,0],ev:[],lane:[[0,0,0,0,0],[0,0,0,0,0]],duels:{},
    pr:{},fatigue:[{},{}],mom:0,cards:{},subs:[[],[]],logs:[],hurt:{},inj:[],fouls:[0,0],blk:[0,0],cross:[0,0],off:[0,0],corner:[0,0],ref:{n:0,ns:0,sh:0,sv:0,cp:0}};
  T.forEach((t,s)=>t.xi.forEach(p=>{st.pr[p.id]={g:0,a:0,r:6.4+r()*.5,sh:0,kp:0,tk:0,duelW:0,duelL:0};st.fatigue[s][p.id]=0}));
  const hooks=opt.hooks||{};
  // 빈도 보정값(직접 근거가 없는 '얼마나 자주' 값). 결과 평균은 검증용으로만 보고, 조정 이력은 design.md에 기록
  const CFG=Object.assign({tw:1,skill:1,supW:.5,ticks:2,ncInj:.0008,att:.4,longBase:.12,longShot:.18,recover:.35,offBase:.07,duelFoul:.09,forcedCross:.3,cardPerFoul:.2,boxPen:.6,fkDirect:.38,
    blkCorner:.3,missCorner:.1,saveCorner:.33,rebound:.1,aerCorner:.25,earlyCross:.6,wideW:1.6,refShoot:11.43,refSave:13.5,refComp:10.8,homeAdv:.18,bgFoul:.13,intc:{through:.45,cutback:.25,combo:.2}},opt.cfg||{});
  const K=CFG.skill;
  if(opt.derby){CFG.bgFoul*=1.1;CFG.duelFoul*=1.1;CFG.cardPerFoul*=1.1} // 더비 과열: 실측 카드 +22%(파울 ×1.1, 파울당 카드 ×1.1), 홈 이점은 일반 경기와 같음
  // 팀 상성
  const counter=[0,0];[0,1].forEach(s=>{const o=1-s;if(BEATS[T[s].preset].includes(T[o].preset))counter[s]+=.05*Math.max(0,.5+.5*T[s].styleBonus);});
  function live(s){return T[s].xi} // 교체 반영된 배열(prep이 참조 공유)
  function eff(p,s){const f=st.fatigue[s][p.id]||0;return condM(p)*fitF(p)*posMul(T[s].fm[p.id]??1)*(1-Math.min(.25,f/100*.25))*(st.hurt[p.id]?.8:1)}
  function attr(p,k,s){return p[k]*eff(p,s)}
  function pick(list,wf){const ws=list.map(wf),t=ws.reduce((a,b)=>a+b,0);if(t<=0)return list[0];let x=r()*t;for(let i=0;i<list.length;i++){x-=ws[i];if(x<=0)return list[i]}return list[list.length-1]}
  function laneOf(q,flip){const x=flip?100-q.x:q.x;return Math.min(4,Math.floor(x/20))}
  const V=(p,k,d)=>p[k]??d;
  const hN=p=>Math.max(1,Math.min(20,((p.h||180)-165)/35*19+1));             // 키 → 20점 척도
  function airC(p,s){return hN(p)*.3+attr(p,'aerial',s)*.45+V(p,'str',10)*eff(p,s)*.25} // 공중볼 경합
  const wfMul=p=>p.foot==='both'?1:.75+.0625*(V(p,'wf',3)-1);                // 약발 정확도 배수
  const laneSide=l=>l>=3?'R':l<=1?'L':'C';
  const footSide=p=>p.foot==='right'?'R':p.foot==='left'?'L':'B';
  function weakUse(p,lane,act){const fs=footSide(p),sd=laneSide(lane);if(fs==='B')return false;
    let pw=.25; if(act==='cross')pw=sd==='C'?.3:(fs===sd?.1:.65); else if(act==='shot')pw=sd==='C'?.3:(fs===sd?.45:.15);
    return r()<pw}
  function comp(p,s){return V(p,'comp',12)*eff(p,s)}
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const fatOf=(p,s)=>st.fatigue[s][p.id]||0;
  // 피로 실수: 근거(StatsBomb 라리가 15-16) 15분 구간별 패스 실패율이 23.3%→23.1%로 거의 평평 → 효과를 작게 둠
  const slip=(p,s)=>Math.max(0,fatOf(p,s)-45)/55*.03;
  const aggrOf=(t,p)=>{const i=t.xi.indexOf(p);return i>=0&&t.roleOf(i)[2].aggr?1:0};
  const gkOf=t=>t.xi.find(q=>q.g==='GK')||t.xi[0];
  // ---- 근거 기반 기본값: StatsBomb 오픈데이터 라리가 2015-16 전 경기(380) 슈팅 유형별 평균 xG·블록률 ----
  const XG={through:.226,cutback:.165,combo:.126,longshot:.033,solo:.179,rebound:.179,lowcross:.174,spfoot:.134,cross:.126,corner:.098,fkx:.104,fk:.040,gkErr:.2,pen:.78};
  const BLK={through:.06,cutback:.33,combo:.23,longshot:.29,solo:.24,rebound:.24,lowcross:.17,spfoot:.29,cross:.08,corner:.12,fkx:.10,fk:.29,gkErr:.1,pen:0};
  const ONT={through:.1,cross:-.05,corner:-.05,fkx:-.05,longshot:-.08,fk:-.1}; // 유형별 유효슈팅 보정(추정)
  function injure(s,p,why){if(!p||st.hurt[p.id])return;st.hurt[p.id]=1;st.inj.push({s,id:p.id,m:st.min,why});st.ev.push({m:st.min,s,t:'injury',p:p.name,pid:p.id,why});
    if(hooks.onInjury&&hooks.onInjury(s,p))return;
    const b=T[s].bench;if(b&&b.length&&st.subs[s].length<5){const cand=b.filter(q=>!st.pr[q.id]).sort((a,c)=>((c.g===p.g)*20+c.ovr)-((a.g===p.g)*20+a.ovr))[0];if(cand)api.sub(s,p.id,cand)}}
  function secondBall(s,bonus=0){ // 세컨드볼: 주변 미드필더 위치선정·체력·속도
    const o=1-s;const sc=(t,side)=>{const m=t.xi.filter(q=>['DM','CM','AM'].includes(q.g));const L=m.length?m:t.xi.filter(q=>q.g!=='GK');return L.reduce((a,q)=>a+attr(q,'posit',side)*.5+attr(q,'stamina',side)*.3+attr(q,'pace',side)*.2,0)/L.length};
    const a=sc(T[s],s),d=sc(T[o],o);const pA=clamp(.5+bonus+(a-d)*.03*K,.2,.8);const win=r()<pA;
    const w=pick((win?T[s]:T[o]).xi.filter(q=>q.g!=='GK'),q=>attr(q,'posit',win?s:o)+(['DM','CM'].includes(q.g)?6:0));
    st.ev.push({m:st.min,s:win?s:o,t:'secondBall',p:w.name});st.pr[w.id].r+=.02;return win}
  // ---- 세트피스 ----
  // 인스윙: 왼쪽에서 오른발, 오른쪽에서 왼발(골문 쪽으로 휘어 들어감)
  const swing=(p,side)=>{const fs=footSide(p);if(side==='C'||fs==='B')return 'n';return fs!==side?'in':'out'};
  function kicker(t,kind,side){const key=kind==='corner'&&side&&side!=='C'?'corner'+side:kind;
    const id=t.setp&&(t.setp[key]||t.setp[kind]);const p=id&&t.xi.find(q=>q.id===id);if(p)return p;
    const f={corner:q=>(q.cross*.5+V(q,'fk',10)*.5)*(swing(q,side)==='in'?1.06:1),fk:q=>V(q,'fk',10)*(swing(q,side)==='in'?1.08:swing(q,side)==='out'?.96:1),pen:q=>V(q,'pen',10)*.7+V(q,'comp',12)*.3}[kind];
    return t.xi.filter(q=>q.g!=='GK').sort((a,b)=>f(b)-f(a))[0]}
  function finish(s,shooter,xg,type,assist,lane,gkMode,depth){ // 슈팅 → (블록) → 유효슈팅 → 선방
    const o=1-s,td=T[o],gk=gkOf(td);const TR=st.tr||(st.tr=Object.assign([],{s}));if(!(TR.length&&TR[TR.length-1].k==='shot'&&TR[TR.length-1].p===shooter.name&&TR[TR.length-1].type===type))TR.push({k:'shot',p:shooter.name,type,xg:+xg.toFixed(2)});
    st.xg[s]+=xg;st.sh[s]++;st.pr[shooter.id].sh++;if(st.curTr){st.trSh=(st.trSh||0)+1;st.trXg=(st.trXg||0)+xg}if(type!=='pen'){st.ref.ns++;st.ref.sh+=attr(shooter,'shoot',s)} // 기준점: 슈팅 시점 평균(유효슈팅만 세면 위로 치우침)
    const b0=BLK[type]??.2;
    if(b0>0){ // (1) 슈팅 블록: 유형별 실측 블록률 × 수비 위치선정 × 수비 블록 높이/폭
      const dfs=td.xi.filter(q=>['CB','FB','DM'].includes(q.g));const dp=dfs.length?dfs.reduce((a,q)=>a+attr(q,'posit',o),0)/dfs.length:12;
      const pB=clamp(b0*(1+(dp-13)*.04*K)*(td.ti[1]<=2?1.05:td.ti[1]>=4?.95:1)*(td.ti[0]<=2?1.05:1),0,.6);
      if(r()<pB){const bl=dfs.length?pick(dfs,q=>attr(q,'posit',o)):td.xi[1];st.blk[o]++;st.pr[bl.id].r+=.05;st.ev.push({m:st.min,s,t:'block',p:shooter.name,d:bl.name,type,lane});
        const x=r();if(x<CFG.blkCorner)return setPiece(s,'corner',lane);
        if(!depth&&x<CFG.blkCorner+.25&&secondBall(s)){const rb=pick(T[s].xi.filter(q=>q.g!=='GK'),q=>attr(q,'shoot',s)*(['AM','CM','W'].includes(q.g)?1.4:1));return finish(s,rb,XG.longshot*(1+(attr(rb,'shoot',s)-CFG.refShoot)*.04*K),'longshot',null,lane,'std',1)}
        return 'block'}}
    const weak=type!=='pen'&&type!=='fk'&&weakUse(shooter,lane??2,'shot');
    const baseOn=.46+(ONT[type]||0); // 근거: 블록 안 된 슈팅 중 유효슈팅 45.7%(SB 35.3%/(1-22.7%))
    const onT=type==='pen'?r()<.93:r()<clamp(baseOn+(attr(shooter,'shoot',s)-CFG.refShoot)*.012*K,.15,.85)*(weak?wfMul(shooter):1.05); // 강발 1.05·약발 배수: 평균이 1이 되도록(xG 의미 유지)
    if(!onT){st.ev.push({m:st.min,s,t:'miss',p:shooter.name,type,lane,weak});if(type!=='pen'&&type!=='fk'&&r()<CFG.missCorner)return setPiece(s,'corner',lane);return 'miss'}
    st.sot[s]++;
    const sv=gkMode==='1v1'?attr(gk,'gk_save',o)*.6+attr(gk,'gk_sweep',o)*.4:gkMode==='air'?attr(gk,'gk_save',o)*.7+attr(gk,'gk_air',o)*.3:attr(gk,'gk_save',o);
    let pG;
    if(type==='pen'){pG=Math.max(.55,Math.min(.93,.8+(V(shooter,'pen',12)-13)*.012+(comp(shooter,s)-13)*.008-(sv-13)*.01))}
    else{ // xG가 '슈팅 1개당 득점 기대값'이 되도록 블록·유효슈팅 기본 확률로 나눠 환산 → 능력치 보정만 곱함
      pG=xg/((1-b0)*baseOn)*(1-(sv-CFG.refSave)*.03*K)*(1+(comp(shooter,s)-CFG.refComp)*.02*K*(xg>.2?1.6:1));st.ref.n++;st.ref.sv+=sv;st.ref.cp+=comp(shooter,s);
      if(st.min>75&&Math.abs(st.sc[0]-st.sc[1])<=1)pG*=1+(comp(shooter,s)-CFG.refComp)*.012;
      pG=clamp(pG,.03,.9)}
    if(r()<pG){st.sc[s]++;st.pr[shooter.id].g++;st.pr[shooter.id].r+=1.0;if(assist&&st.pr[assist.id]){st.pr[assist.id].a++;st.pr[assist.id].r+=.55;st.pr[assist.id].kp++}
      st.pr[gk.id].r-=.15;st.mom=s===0?.6:-.6;
      st.ev.push({m:st.min,s,t:'goal',p:shooter.name,pid:shooter.id,a:assist?assist.name:null,type,lane,xg:+xg.toFixed(2),sc:[...st.sc],weak});return 'goal'}
    st.pr[gk.id].r+=.12;st.ev.push({m:st.min,s,t:'save',p:shooter.name,gk:gk.name,type,lane});
    if(type==='pen')return 'save';
    const x=r();if(x<CFG.saveCorner)return setPiece(s,'corner');
    if(!depth&&x<CFG.saveCorner+CFG.rebound&&attr(gk,'gk_save',o)<r()*20+4){ // 리바운드: 선방이 약할수록 문전에 흘림
      const rb=pick(T[s].xi.filter(q=>['ST','W','AM'].includes(q.g)&&q.id!==shooter.id),q=>attr(q,'offball',s))||shooter;st.ev.push({m:st.min,s,t:'rebound',p:rb.name});
      return finish(s,rb,XG.rebound*(1+(attr(rb,'shoot',s)-CFG.refShoot)*.04*K),'rebound',null,lane,'std',1)}
    return 'save'}
  // 크로스·세트피스 전달 후 흐름. 근거(SB 라리가 15-16): 크로스 성공(동료 도달) 27.6%, 크로스 1개당 슈팅 약 11.5%,
  // 오픈플레이 크로스 슈팅 중 발 55%·헤더 45%, GK 크로스 차단 6.3%(FBref 24-25). 코너 1개당 헤더 슈팅 약 17%.
  const AER={cross:{win:.37,shot:.42},corner:{win:.38,shot:.62},fkx:{win:.36,shot:.58}};
  function aerialShot(s,deliverer,q,type,lane){
    const o=1-s,ta=T[s],td=T[o],gk=gkOf(td);st.cross[s]++;const TR=st.tr||(st.tr=Object.assign([],{s}));if(!TR.some(x=>x.k==='cross'||x.k==='sp'))TR.push({k:'cross',from:deliverer.name,lane,type});
    if(r()<clamp((.065+(attr(gk,'gk_air',o)-13)*.01+(hN(gk)-10)*.004)*(st.lastSwing==='in'?.85:st.lastSwing==='out'?1.1:1)*(type==='cross'?1:1.4),.02,.2)){TR.push({k:'claim',p:gk.name});st.ev.push({m:st.min,s,t:'claim',gk:gk.name,type});return 'claim'}
    const low=type==='cross'&&r()<.55; // 낮은 크로스(발) vs 띄운 크로스(헤더)
    const tg=pick(ta.xi.filter(p=>p.g!=='GK'&&p.id!==deliverer.id),p=>low?Math.pow(attr(p,'offball',s)+attr(p,'shoot',s)*.5,2)*(['ST','W','AM'].includes(p.g)?1.5:.4):Math.pow(airC(p,s),3)*(['CB','ST'].includes(p.g)?1.5:1)*(ta.roleOf(ta.xi.indexOf(p))[2].target?1.4:1));
    const dd=td.xi.filter(p=>p.g!=='GK').sort((a,b)=>(low?attr(b,'posit',o)-attr(a,'posit',o):airC(b,o)-airC(a,o))).slice(0,3);const dm=pick(dd,p=>low?attr(p,'posit',o):airC(p,o));
    const diff=low?(attr(tg,'offball',s)-attr(dm,'posit',o))*.8:airC(tg,s)-airC(dm,o);
    const A=AER[type];
    if(r()>clamp(A.win+((q-13)*.012+diff*.035*(td.ti[0]<=2?1.3:1))*K,.1,.7)){ // 수비 클리어
      TR.push({k:'air',p:tg.name,vs:dm.name,won:false});st.ev.push({m:st.min,s,t:'aerialLost',p:tg.name,d:dm.name,type});st.pr[dm.id].r+=.03;
      if(r()<CFG.aerCorner)return setPiece(s,'corner',lane);
      if(secondBall(s)&&r()<(type==='cross'?.35:.6)){ // 세컨드볼 → 박스 밖/세트피스 2차 슈팅
        const sh=pick(ta.xi.filter(p=>p.g!=='GK'),p=>attr(p,'shoot',s)*(['AM','CM','W','DM'].includes(p.g)?1.5:.7));const t2=type==='cross'?'longshot':'spfoot';TR.push({k:'second',p:sh.name});
        return finish(s,sh,XG[t2]*(1+(attr(sh,'shoot',s)-CFG.refShoot)*.04*K),t2,null,lane,'std')}
      return 'lost'}
    if(r()>A.shot){TR.push({k:'air',p:tg.name,vs:dm.name,won:true,held:true});st.ev.push({m:st.min,s,t:'aerialWon',p:tg.name,type});return 'held'}
    const t=low?'lowcross':type;TR.push({k:'air',p:tg.name,vs:dm.name,won:true,low});
    const xg=clamp(XG[t]*(1+(q-13)*.05)*(1+diff*.05),.02,.45);
    return finish(s,tg,xg,t,deliverer,lane,low?'std':'air')}
  function setPiece(s,kind,lane,deep){const ta=T[s];
    if(kind==='corner'){let side=lane!=null?laneSide(lane):(r()<.5?'L':'R');if(side==='C')side=r()<.5?'L':'R';
      const k=kicker(ta,'corner',side);const sw=swing(k,side);const q=(attr(k,'cross',s)*.5+V(k,'fk',10)*.5*eff(k,s))*(sw==='in'?1.06:1);st.corner[s]++;
      (st.tr||(st.tr=Object.assign([],{s}))).push({k:'sp',kind:'corner',p:k.name,side});st.ev.push({m:st.min,s,t:'corner',p:k.name,side,sw});st.lastSwing=sw;const res=aerialShot(s,k,q,'corner',lane);st.lastSwing=null;return res}
    if(kind==='fk'){const side=r()<.35?'L':r()<.54?'C':'R';const k=kicker(ta,'fk',side);const sw=swing(k,side);const fk=V(k,'fk',10)*eff(k,s);
      if(!deep&&r()<CFG.fkDirect){const xg=Math.max(.01,Math.min(.15,XG.fk*(1+(fk-13)*.07)*(sw==='in'?1.12:sw==='out'?.95:1)));(st.tr||(st.tr=Object.assign([],{s}))).push({k:'sp',kind:'fk',p:k.name,side,direct:true});st.ev.push({m:st.min,s,t:'fkShot',p:k.name,side,sw});return finish(s,k,xg,'fk',null,side==='L'?1:side==='R'?3:2,'std')}
      (st.tr||(st.tr=Object.assign([],{s}))).push({k:'sp',kind:'fk',p:k.name,side});st.ev.push({m:st.min,s,t:'fkCross',p:k.name,side,sw});return aerialShot(s,k,(fk*.6+attr(k,'cross',s)*.4)*(sw==='in'?1.05:1)-(deep?2:0),'fkx',lane)}
    if(kind==='pen'){if(hooks.wantPen&&hooks.wantPen(s)){st.pendingPen={s};return 'pen'}return takePen(s,null)}}
  function takePen(s,id){const t=T[s];const k=(id&&t.xi.find(q=>q.id===id))||kicker(t,'pen');st.pendingPen=null;const tr=st.tr=Object.assign([{k:'sp',kind:'pen',p:k.name}],{s});const e0=st.ev.length;st.ev.push({m:st.min,s,t:'penAward',p:k.name});const res=finish(s,k,XG.pen,'pen',null,2,'std');for(let i=e0;i<st.ev.length;i++)st.ev[i].tr=tr;st.tr=null;return res}
  function foul(s,o,att,def,lane,row,bg){ // 공격자 s가 수비자 def에게 파울 당함
    st.fouls[o]++;st.pr[def.id].r-=.05;const ag=aggrOf(T[o],def);
    // 카드: 근거 FBref 24-25 라리가 경기당 파울 24.8·경고 4.5 → 파울당 약 18%. 공격적 역할·낮은 태클·피로·위험 지역일수록 ↑
    const pC=clamp(CFG.cardPerFoul*(1+ag*.4)*(1+(12-attr(def,'tackle',o))*.05)*(row===0?1.3:row===2?.85:1)*(1+slip(def,o)*5),.04,.5);
    if(r()<pC*(st.cards[def.id]?.4:1))card(o,def);
    // 거친 태클 부상: 근거 SB 15-16 부상 교체 0.39/경기 ÷ 파울 32/경기 ≈ 1.2%
    const pI=clamp(.012*(1+ag*.6)*(1+(V(def,'str',10)-V(att,'str',10))*.03)*(1+(V(att,'inj',8)-8)*.04),.002,.05);
    if(r()<pI)injure(s,att,'foul');
    if(row===0&&lane>=1&&lane<=3&&r()<(bg?.04:CFG.boxPen))return setPiece(s,'pen');
    if(row===0)return setPiece(s,'fk',lane);
    if(row===1&&r()<.3)return setPiece(s,'fk',lane,true); // 먼 거리 프리킥 → 크로스
    return 'foul'}
  // 한 번의 공격 시퀀스. from='second' → 세컨드볼 소유에서 시작(빌드업 생략)
  function attack(s,transition,from){
    const o=1-s, ta=T[s], td=T[o];
    const atk=ta.k('atk'); let def=transition?td.k('atk'):td.k('def'); // 전환 순간엔 상대가 공격 대형 상태
    const ga=grid(atk,false), gd=grid(def,true);
    const sup=ga.map((row,ri)=>row.map((v,li)=>(v-gd[ri][li])*CFG.supW)); // 구역 수적 우위(포메이션 효과) 강도
    {const SA=st.supA[s];SA.n++;ga.forEach((row,ri)=>row.forEach((v,li)=>{SA.g[ri][li]+=v-gd[ri][li]}))}
    const ti=ta.ti, tdi=td.ti;
    const twA=CFG.tw*(clamp(ta.fam??60,0,100)-60)/40, twD=CFG.tw*(clamp(td.fam??60,0,100)-60)/40; // 팀 호흡(숙련도): 빌드업·수비 조직·역습 복귀
    const mids=atk.filter(q=>q.slotKey!=='GK'&&cell(q.x,q.y)[0]>=1);
    const pass=mids.reduce((a,q)=>a+attr(q.p,'pass',s),0)/Math.max(1,mids.length);
    const press=tdi[5]; const pressPow=def.filter(q=>q.slotKey!=='GK').reduce((a,q)=>a+(attr(q.p,'tackle',o)*.5+attr(q.p,'stamina',o)*.3+attr(q.p,'pace',o)*.2)*[.8,1,1.2][td.pi(q.p,'pr')],0)/10;
    const midSup=(sup[1][1]+sup[1][2]+sup[1][3])/3;
    const mComp=mids.reduce((a,q)=>a+comp(q.p,s),0)/Math.max(1,mids.length), mStr=mids.reduce((a,q)=>a+V(q.p,'str',10),0)/Math.max(1,mids.length);
    const mSlip=mids.reduce((a,q)=>a+slip(q.p,s),0)/Math.max(1,mids.length);
    const gk=gkOf(ta), gkD=attr(gk,'gk_dist',s);
    let direct=!!from, bypass=0;
    const TR=st.tr=[];TR.s=s;const starter=transition?pick(ta.xi.filter(p=>['CB','DM','FB','CM'].includes(p.g)),p=>attr(p,'posit',s))||ta.xi[1]:from?(mids[Math.floor(r()*mids.length)]||ta.xi[1]).p:gk;TR.push({k:'start',p:starter.name,tr:!!transition,sec:!!from});
    if(!transition&&!from){
      // (4) GK 빌드업 vs 하이프레스: 강한 압박일수록, GK 킥 능력이 낮을수록 실수 → 상대 결정적 찬스
      //     근거: 슈팅으로 이어진 실수 FBref 24-25 팀당 0.55/경기(전 포지션). GK 몫은 그 일부로 추정
      if(press>=4){const pE=clamp((.004+(press-4)*.004-(gkD-13)*.0015+slip(gk,s))*(pressPow/13),.001,.015);
        if(r()<pE){const fw=pick(td.xi.filter(q=>['ST','W','AM'].includes(q.g)),q=>attr(q,'shoot',o)+attr(q,'offball',o))||td.xi[td.xi.length-1];
          TR.push({k:'gkErr',p:gk.name,by:fw.name});st.ev.push({m:st.min,s,t:'gkErr',p:gk.name,by:fw.name});st.pr[gk.id].r-=.5;
          return {sp:finish(o,fw,XG.gkErr*(1+(attr(fw,'shoot',o)-CFG.refShoot)*.04*K),'gkErr',null,2,'1v1')}}}
      // (3) 롱볼: 다이렉트 성향·강한 압박·낮은 GK 패스 능력일수록 선택 → 타깃 vs 센터백 공중볼 → (5) 세컨드볼
      const pLong=clamp(CFG.longBase+(ti[4]-3)*.06+(press>=4?.1+(13-gkD)*.01:0),.03,.7);
      if(r()<pLong){
        const fwd=atk.filter(q=>q.slotKey!=='GK'&&['ST','W','AM'].includes(q.p.g));
        const tg=pick(fwd.length?fwd:atk.slice(1),q=>Math.pow(airC(q.p,s),2)*(ta.roleOf(q.i)[2].target?2:1));
        const cbs=td.xi.filter(p=>['CB','FB'].includes(p.g));const cb=pick(cbs.length?cbs:td.xi.slice(1),p=>Math.pow(airC(p,o),2));
        const dq=Math.max(gkD,...ta.xi.filter(p=>p.g==='CB').map(p=>attr(p,'pass',s)),10);
        // 근거: 공중볼 승률 리그 전체 50.0%(FBref 24-25) → 기본 50%에서 키·공중볼·힘·킥 품질 차이만 반영. 타깃맨 +6%p(추정)
        const pW=clamp(.5+((airC(tg.p,s)-airC(cb,o))*.035+(dq-13)*.01)*K+(ta.roleOf(tg.i)[2].target?.06:0),.15,.85);
        const key=tg.p.id+'^'+cb.id;const du=st.duels[key]=st.duels[key]||{a:tg.p.name,d:cb.name,w:0,l:0,lane:2,air:1,s};
        TR.push({k:'long',from:gk.name,to:tg.p.name,vs:cb.name});if(r()<pW){TR[TR.length-1].won=true;du.w++;st.pr[tg.p.id].duelW++;st.pr[cb.id].duelL++;st.ev.push({m:st.min,s,t:'longWon',p:tg.p.name,d:cb.name});
          if(!secondBall(s,.12+(press>=4?(press-3)*.05:0)))return {lost:true,counter:r()<.05};bypass=press>=4?(press-3)*.5:0}
        else{du.l++;st.pr[cb.id].duelW++;st.pr[tg.p.id].duelL++;st.ev.push({m:st.min,s,t:'longLost',p:tg.p.name,d:cb.name});
          if(!secondBall(s,-.03+(press>=4?(press-3)*.05:0)))return {lost:true,counter:r()<.08}}
        direct=true}
    }
    if(!direct){ // 1) 빌드업: 중원 패스 vs 상대 압박 (+GK 패스 능력, 피로 실수)
      let pBuild=.66+((pass-13)*.011+(mComp-13)*.01*(press>=4?1:.4)+(mStr-11)*.004+(gkD-12)*.004)*K+midSup*.07-(press-3)*.05*(pressPow/13)*clamp(1+(pressPow-(pass*.6+mComp*.4))*.08,.4,1.6)+ta.styleBonus*.03+(ti[6]?-.07:0)+(ti[3]<=2?.04:0)-Math.max(0,tdi[0]-3)*.03+Math.max(0,3-tdi[0])*.015+counter[s]-counter[o]*.5-mSlip*2;
      pBuild+=twA*.02;
      if(transition)pBuild+=.15;
      if(ti[3]>=4)pBuild-=.02;
      if(press>=4)bypass=(press-3)*.5; // 압박을 뚫으면 전진한 압박 인원 뒤로 공간
      if(r()>clamp(pBuild,.25,.92)){
        const tk=pick(def.filter(q=>q.slotKey!=='GK'),q=>attr(q.p,'tackle',o)+attr(q.p,'posit',o));st.pr[tk.p.id].tk++;
        const lp=mids.length?pick(mids,q=>attr(q.p,'pass',s)).p:starter;TR.push({k:'pass',from:starter.name,to:lp.name});TR.push({k:'lost',p:lp.name,by:tk.p.name,how:press>=4?'press':'tackle'});
        return {lost:true,by:tk.p,counter:r()<(press>=4?.12:.03)+(tdi[6]?.16:0)+(tdi[0]<=2?.04:0)}}
      if(mids.length){const p1=pick(mids,q=>attr(q.p,'pass',s)).p;TR.push({k:'pass',from:starter.name,to:p1.name});const m2=mids.filter(q=>q.p!==p1);if(m2.length&&r()<.7){const p2=pick(m2,q=>attr(q.p,'pass',s)).p;TR.push({k:'pass',from:p1.name,to:p2.name})}}
    }
    // 2) 전진 레인 선택
    const laneW=[0,1,2,3,4].map(l=>{let w=(l===0||l===4?CFG.wideW:1)+Math.max(-0.8,sup[0][l])*.6+Math.max(-0.8,sup[1][l])*.3;
      if(l===0||l===4)w*= (ti[2]>=4?1.4:ti[2]<=2?.6:1)*(tdi[1]<=2?1.15:tdi[1]>=4?.9:1); if(l===2)w*=(ti[2]<=2?1.3:1); if(ta.focus!=null&&ta.focus===l)w*=1.8; if(ta.focus==='W'&&(l===0||l===4))w*=1.5; return Math.max(.1,w)});
    const lane=pick([0,1,2,3,4],l=>laneW[l]); st.lane[s][lane]++;TR.push({k:'lane',lane});
    { const fw=atk.filter(q=>q.slotKey!=='GK'&&cell(q.x,q.y)[0]===0);const rn=fw.length?fw[Math.floor(r()*fw.length)]:null;
      const pO=CFG.offBase+(tdi[0]-3)*.03+(ti[4]>=4?.02:0)-(rn?(attr(rn.p,'offball',s)-13)*.006-(ta.pi(rn.p,'rn')-1)*.02:0)+(transition?-.03:0);
      if(rn&&r()<Math.max(.02,pO)){st.off[s]++;TR.push({k:'off',p:rn.p.name});st.ev.push({m:st.min,s,t:'offside',p:rn.p.name});return {lost:true}} }
    // 3) 1대1 공격수 선택
    const attackers=atk.filter(q=>q.slotKey!=='GK'&&Math.abs(laneOf(q,false)-lane)<=1&&cell(q.x,q.y)[0]<=1);
    if(!attackers.length)return {lost:true};
    const car=pick(attackers,q=>{const role=ta.roleOf(q.i)[2];const wd=ta.pi(q.p,'wd');return Math.pow(attr(q.p,'drib',s)+attr(q.p,'offball',s),1.5)*(role.wide&&(lane===0||lane===4)?1.5:1)*(role.inside&&(lane===1||lane===3)?1.4:1)*(cell(q.x,q.y)[0]===0?1.4:1)*[.55,1,1.6][ta.pi(q.p,'dr')]*((lane===0||lane===4)?[.7,1,1.4][wd]:[1.25,1,.8][wd])});
    TR.push({k:'carry',p:car.p.name,lane});
    // (6) 역습 복귀 경합: 가장 빠른 복귀 수비수 속도 vs 볼 운반자 속도, 수비 라인 높이
    if(transition){const rec=td.xi.filter(p=>['CB','FB','DM'].includes(p.g));
      if(rec.length){const rf=rec.slice().sort((a,b)=>attr(b,'pace',o)-attr(a,'pace',o))[0];
        const pR=clamp(twD*.03+CFG.recover+Math.max(0,3-ti[0])*.04-(ti[3]-3)*.04+(attr(rf,'pace',o)-attr(car.p,'pace',s))*.03*K+(tdi[0]<=2?.1:tdi[0]>=4?-.1:0)+slip(car.p,s)*3,.08,.75);
        if(r()<pR){transition=false;def=td.k('def');TR.push({k:'recover',p:rf.name});st.ev.push({m:st.min,s:o,t:'recover',p:rf.name,a:car.p.name})}}}
    // 중거리 선택: 정돈된 수비 앞에서 박스 밖 슈팅(근거: 전체 슈팅의 33.6%가 박스 밖, 평균 xG 0.033)
    const lsCand=atk.filter(q=>q.slotKey!=='GK'&&cell(q.x,q.y)[0]<=1&&!['CB','GK'].includes(q.p.g));const lsMul=lsCand.length?lsCand.reduce((a,q)=>a+[.6,1,1.4][ta.pi(q.p,'sh')],0)/lsCand.length:1;
    if(!transition&&r()<CFG.longShot*lsMul*(tdi[1]<=2?1.3:1)*(tdi[0]<=2?1.3:1)*((lane===0||lane===4)?.4:1)){
      const cand=lsCand;
      const sh=pick(cand.length?cand:attackers,q=>Math.pow(attr(q.p,'shoot',s),2.5)*(ta.roleOf(q.i)[2].shoot?1.5:1)*[.4,1,1.6][ta.pi(q.p,'sh')]);
      const xg=XG.longshot*(1+(attr(sh.p,'shoot',s)-CFG.refShoot)*.06*K*(tdi[0]<=2?1.5:1))*(tdi[1]<=2?.9:1);
      if(sh.p!==car.p)TR.push({k:'pass',from:car.p.name,to:sh.p.name});TR.push({k:'shot',p:sh.p.name,type:'longshot',xg:+clamp(xg,.01,.09).toFixed(2)});
      return {shot:true,res:finish(s,sh.p,clamp(xg,.01,.09),'longshot',null,lane,'std')}}
    if((lane===0||lane===4)&&r()<CFG.earlyCross*[.6,1,1.25][ta.pi(car.p,'cr')]){ // 이른 크로스(수비 제치기 전, 품질 낮음)
      const cr=pick(attackers,q=>Math.pow(attr(q.p,'cross',s),2)*(['FB','W'].includes(q.p.g)?1.6:1)*[.4,1,1.7][ta.pi(q.p,'cr')]);
      if(cr.p!==car.p)TR.push({k:'pass',from:car.p.name,to:cr.p.name});TR.push({k:'cross',from:cr.p.name,lane,early:true});
      return {sp:aerialShot(s,cr.p,attr(cr.p,'cross',s)*(weakUse(cr.p,lane,'cross')?wfMul(cr.p):1)-1.5+(tdi[1]<=2?3:0)+(ti[2]>=4?1:0),'cross',lane)}}
    let defs=def.filter(q=>q.slotKey!=='GK'&&Math.abs(laneOf(q,true)-lane)<=1&&cell(100-q.x,100-q.y)[0]<=1&&cell(100-q.x,100-q.y)[0]>=0);
    let mk=null;(td.marks||[]).forEach((m,i)=>{if(m&&m.on&&m.t===car.p.id&&td.xi[i]&&!defs.some(q=>q.p.id===td.xi[i].id)){defs.push({p:td.xi[i],i,slotKey:'MK'})}if(m&&m.on&&m.t===car.p.id)mk=m});
    const dfd=defs.length?pick(defs,q=>(attr(q.p,'posit',o)+attr(q.p,'pace',o)*.5)*[.8,1,1.25][td.pi(q.p,'tk')]):null;
    const spaceBonus=Math.max(-1,Math.min(1.5,sup[0][lane]))*.06+bypass*.05;
    const highLine=tdi[0];
    const runner=Math.max(0,(ta.roleOf(car.i)[2].run||ta.roleOf(car.i)[2].fwd||0)+(ta.pi(car.p,'rn')-1)*.5);
    const wide=lane===0||lane===4;
    if(dfd){
      const a=attr(car.p,'drib',s)*.45+attr(car.p,'pace',s)*.25+attr(car.p,'offball',s)*.15+V(car.p,'str',10)*eff(car.p,s)*.15;
      const d=attr(dfd.p,'tackle',o)*.35+attr(dfd.p,'posit',o)*.3+attr(dfd.p,'pace',o)*.2+V(dfd.p,'str',10)*eff(dfd.p,o)*.15+(td.pi(dfd.p,'tk')-1)*.6;
      // 근거: 드리블 성공률 FBref 24-25 44% → 기본 .45
      let pBeat=-twD*.015+.45+(a-d)*.021*K*(tdi[0]<=2?1.3:1)+spaceBonus+counter[s]+((wide&&tdi[1]<=2)?.11:0)+((wide&&tdi[1]>=4)?-.04:0)+((!wide&&ti[2]<=2)?-.07:0)+(direct&&!from?.12:0)-Math.max(0,3-tdi[5])*.03+(transition?.16:0)+((highLine>=4)?(attr(car.p,'pace',s)-attr(dfd.p,'pace',o))*.025*K+.05:0)*(1+runner*.5)*(transition?1.6:1)+(slip(dfd.p,o)-slip(car.p,s))*2;
      if(mk){pBeat-=mk.tight?.16:.09; if(attr(dfd.p,'pace',o)<attr(car.p,'pace',s)-3)pBeat+=.05; st.fatigue[o][dfd.p.id]+=.4}
      pBeat=clamp(pBeat,.12,.85);
      const key=car.p.id+'>'+dfd.p.id;const du=st.duels[key]=st.duels[key]||{a:car.p.name,d:dfd.p.name,w:0,l:0,lane,s};
      const dtr={k:'duel',p:car.p.name,vs:dfd.p.name,lane};TR.push(dtr);
      if(r()<pBeat){dtr.win=true;du.w++;st.pr[car.p.id].duelW++;st.pr[dfd.p.id].duelL++;
        // (7) 파울: 공격적 역할·타이트 마킹·낮은 태클일수록 ↑
        const pF=CFG.duelFoul*(1+(mk&&mk.tight?.5:0)+aggrOf(td,dfd.p)*.35+(12-attr(dfd.p,'tackle',o))*.03)*[.6,1,1.45][td.pi(dfd.p,'tk')];
        if(r()<pF*(st.cards[dfd.p.id]?.6:1)){dtr.foul=true;const row=cell(car.x,car.y)[0];return {sp:foul(s,o,car.p,dfd.p,lane,row)}}}
      else{du.l++;st.pr[dfd.p.id].duelW++;st.pr[car.p.id].duelL++;st.pr[dfd.p.id].tk++;st.pr[dfd.p.id].r+=.04;
        if(wide&&r()<CFG.forcedCross){TR.push({k:'cross',from:car.p.name,lane,forced:true});const q=attr(car.p,'cross',s)*.8;return {sp:aerialShot(s,car.p,q,'cross',lane)}} // 압박 속 억지 크로스
        if(cell(car.x,car.y)[0]===0&&wide&&r()<.2){TR.push({k:'cornerWon',p:car.p.name});return {sp:setPiece(s,'corner',lane)}}
        TR.push({k:'lost',p:car.p.name,by:dfd.p.name,how:'duel'});return {lost:true,by:dfd.p,counter:r()<(tdi[6]?.22:.04)}}
    }
    // 4) 찬스 유형
    const inv=footSide(car.p)!=='B'&&laneSide(lane)!=='C'&&footSide(car.p)!==laneSide(lane);
    const x=r();
    // 근거(SB 15-16 슈팅 비중): 박스 안 패스 16%, 개인 돌파·리바운드 7%, 스루패스 3.6%, 컷백 2.1%, 크로스(헤더 5.4%+발 6.7%)
    const crT=[.7,.9,.95][ta.pi(car.p,'cr')];const rnB=atk.filter(q=>q.slotKey!=='GK'&&cell(q.x,q.y)[0]===0).reduce((a,q)=>Math.max(a,ta.pi(q.p,'rn')-1),-1)*.5;const type=wide?(x<(inv?crT-.1:crT)?'cross':'cutback'):lane===2?(x<.18*(1+rnB)?'through':x<.78?'combo':'solo'):(x<.12?'cutback':x<.12+.18*(1+rnB)?'through':x<.8?'combo':'solo');
    if(type==='cross'){TR.push({k:'cross',from:car.p.name,lane});const q=(ti[2]>=4?1:0)+attr(car.p,'cross',s)*(weakUse(car.p,lane,'cross')?wfMul(car.p):1)*(inv?.9:1.05);return {sp:aerialShot(s,car.p,q,'cross',lane)}}
    if(type==='through'&&!transition){ // 오프사이드 트랩 vs 라인 브레이킹
      const runner2=atk.filter(q=>q.slotKey!=='GK'&&cell(q.x,q.y)[0]===0).sort((a,b)=>attr(b.p,'offball',s)-attr(a.p,'offball',s))[0];
      const line=def.filter(q=>['CB','FB'].includes((q.p.g))).map(q=>attr(q.p,'posit',o));const lineAvg=line.length?line.reduce((a,b)=>a+b,0)/line.length:12;
      const pOff=.1+(tdi[0]-3)*.035+(lineAvg-13)*.012-(runner2?(attr(runner2.p,'offball',s)-13)*.012:0)+(td.fam-50)/1000;
      if(r()<clamp(pOff,.03,.3)){st.off[s]++;TR.push({k:'final',type,from:car.p.name,to:runner2?runner2.p.name:car.p.name});TR.push({k:'off',p:runner2?runner2.p.name:car.p.name});st.ev.push({m:st.min,s,t:'offside',p:runner2?runner2.p.name:car.p.name});return {lost:true}}}
    // (2) 마지막 패스 차단: 패서 패스·침착성(약발) vs 수비 위치선정. 근거: 스루패스 성공률 38%(SB 15-16)
    if(type!=='solo'){const pq=attr(car.p,'pass',s)*(weakUse(car.p,lane,'pass')?wfMul(car.p):1)*.8+comp(car.p,s)*.2;
      const dp=defs.length?defs.reduce((a,q)=>a+attr(q.p,'posit',o),0)/defs.length:11;
      const pI=clamp(twD*.015-twA*.01+CFG.intc[type]+(dp-pq)*.015*K+(tdi[1]<=2?.05:0)+slip(car.p,s)*2-(transition?.08:0),.05,.7);
      if(r()<pI){const ic=defs.length?pick(defs,q=>attr(q.p,'posit',o)).p:td.xi[1];st.pr[ic.id].tk++;st.pr[ic.id].r+=.04;TR.push({k:'final',type,from:car.p.name,to:null});TR.push({k:'intercept',p:ic.name,type});st.ev.push({m:st.min,s:o,t:'intercept',p:ic.name,type});
        return {lost:true,by:ic,counter:r()<.04+(tdi[6]?.12:0)+(tdi[6]&&tdi[0]<=2?.08:0)}}} // 내려앉아 끊어내면 앞 공간이 넓음
    // 5) 슈터 선택
    const boxmen=atk.filter(q=>q.slotKey!=='GK');
    const shooter=type==='solo'?car:pick(boxmen,q=>{const role=ta.roleOf(q.i)[2];let w=Math.pow(attr(q.p,'shoot',s)*.6+attr(q.p,'offball',s)*.4,2.2)*(cell(q.x,q.y)[0]===0?3:cell(q.x,q.y)[0]===1?1:.15);
      if(role.box||role.shoot)w*=1.4; if(q.p.id===car.p.id)w*=type==='combo'?.3:.1; return w*[.5,1,1.6][ta.pi(q.p,'sh')]});
    const assist=type==='solo'?null:car.p;TR.push({k:'final',type,from:car.p.name,to:shooter.p.name});
    // 6) xG: 유형별 실측 평균에 슈팅 능력·공간·전술 보정
    let xg=XG[type]*(1+(attr(shooter.p,'shoot',s)-CFG.refShoot)*.04*K)*(transition?1.4:direct&&!from?1.15:1)*(1+spaceBonus*2)*(1+ta.styleBonus*.06)*[1.04,1,.95][ta.pi(shooter.p,'sh')];
    if(!wide&&tdi[1]<=2)xg*=.98; if(!wide&&tdi[0]<=2&&!transition)xg*=.93; if(wide&&tdi[1]>=4)xg*=.9; if(!wide&&tdi[1]>=4)xg*=1.08; xg*=1+counter[s]*1.5; // 내려앉은 수비 박스 밀집·수비 폭·상성
    if(inv&&type==='cutback')xg*=1.08;
    xg=clamp(xg,.02,.6);
    return {shot:true,res:finish(s,shooter.p,xg,type,assist,lane,type==='through'?'1v1':'std')}
  }
  function card(s,p){const c=st.cards[p.id]=(st.cards[p.id]||0)+1;if(c===1){st.ev.push({m:st.min,s,t:'yellow',p:p.name,pid:p.id});st.pr[p.id].r-=.3}
    else if(c===2){st.ev.push({m:st.min,s,t:'red',p:p.name,pid:p.id});st.pr[p.id].r-=1.5;const i=T[s].xi.findIndex(q=>q.id===p.id);if(i>0){T[s].xi.splice(i,1);T[s].roles&&T[s].roles.splice(i,1);T[s].duties&&T[s].duties.splice(i,1);T[s].sentOff=(T[s].sentOff||0)+1;if(hooks.onRed)hooks.onRed(s,p)}}}
  // ---- 스테퍼 ----
  let nextPoss=null; st.min=0; const total=90+(opt.added||3);
  const api={
    sub:(s,outId,inP)=>{const i=T[s].xi.findIndex(p=>p.id===outId);if(i<0||!inP)return false;const out=T[s].xi[i];T[s].xi[i]=inP;T[s].fm[inP.id]=fitOf(inP,effKey(T[s],Math.min(i,10)));st.fatigue[s][inP.id]=0;st.pr[inP.id]=st.pr[inP.id]||{g:0,a:0,r:6.4+r()*.4,sh:0,kp:0,tk:0,duelW:0,duelL:0};st.subs[s].push({m:st.min,out,inP});st.ev.push({m:st.min,s,t:'sub',out:out.name,inP:inP.name});return true},
    setTactic:(s,patch)=>{const ob=T[s].form.base;Object.assign(T[s],patch);if(patch.form&&patch.form.base&&patch.form.base!==ob&&!patch.keepXI){const X=T[s];if(X.xi.length===11){const ids=bestAssign(X.xi,patch.form.base);const byId={};X.xi.forEach((p,i)=>byId[p.id]=i);const nx=ids.map(id=>X.xi[byId[id]]);if(nx.every(Boolean)){const nd=nx.map(p=>(X.duties||[])[byId[p.id]]??1),nk=nx.map(p=>(X.marks||[])[byId[p.id]]||{on:false});X.xi.splice(0,11,...nx);X.duties=nd;X.marks=nk}}X.pos={};if(!patch.slotAs)X.slotAs={};X.roles=defaultRoles(X.xi,patch.form.base);}if(patch.form||patch.slotAs)T[s].refit();{const X=T[s];X.dev=X.ti.reduce((a,v,i)=>a+Math.max(0,Math.abs(v-PRESETS[X.preset][i])-1),0);X.styleBonus=styleOf(styleMap(X.xi)[X.preset],X.fam,X.dev)}if(patch.ti||patch.preset){T[s].ti=patch.ti||PRESETS[patch.preset]||T[s].ti;T[s].preset=patch.preset||T[s].preset;const need=NEEDS[T[s].preset];const avg=T[s].xi.slice(1).reduce((a,p)=>a+need.reduce((b,k)=>b+p[k],0)/need.length,0)/10;T[s].dev=T[s].ti.reduce((a,v,i)=>a+Math.max(0,Math.abs(v-PRESETS[T[s].preset][i])-1),0);T[s].styleBonus=styleOf(styleMap(T[s].xi)[T[s].preset],T[s].fam,T[s].dev)}},
    shout:(s,kind)=>{ // 터치라인 지시: 짧은 모멘텀/성향 효과
      if(kind==='push')T[s].ment='공격적';if(kind==='hold')T[s].ment='수비적';if(kind==='calm')T[s].ment='균형';if(kind==='fire')st.mom+= s===0?.5:-.5;st.ev.push({m:st.min,s,t:'shout',kind})},
    momentum:()=>st.mom, state:st, teams:T,
    takePen:(id)=>{if(!st.pendingPen)return [];const b=st.ev.length;takePen(st.pendingPen.s,id);return st.ev.slice(b)}};
  function step(){
    if(st.min>=total&&!st.pendingPen)return null;
    if(st.pendingPen){const before0=st.ev.length;takePen(st.pendingPen.s,null);return st.ev.slice(before0)}
    st.min++;[0,1].forEach(q=>{const k=T[q].preset+'|'+T[q].form.base;st.tu[q][k]=(st.tu[q][k]||0)+1});
    const before=st.ev.length;
    if(hooks.beforeMinute)hooks.beforeMinute(st.min,st,T,api);
    if(st.min===46&&hooks.halftime)hooks.halftime(st,T,api);
    [0,1].forEach(s=>{const rate=(.55+(T[s].ti[3]-3)*.05+Math.max(0,T[s].ti[5]-3)*.12+Math.min(0,T[s].ti[5]-3)*.08+(T[s].ti[6]?.06:0))*(st.min>70?1.25:1);T[s].xi.forEach(p=>{const pim=1+(T[s].pi(p,'pr')-1)*.12+(T[s].pi(p,'rn')-1)*.06+(T[s].pi(p,'dr')-1)*.04;st.fatigue[s][p.id]=(st.fatigue[s][p.id]||0)+rate*pim*(1-(p.stamina-10)/25)})});
    const midp=[0,1].map(s=>{const k=T[s].k('atk');return k.slice(1).reduce((a,q)=>a+attr(q.p,'pass',s)*.6+attr(q.p,'posit',s)*.4,0)/Math.max(1,k.length-1)*(1+T[s].styleBonus*.05)*(T[s].preset==='티키타카'?1+.04*T[s].styleBonus:1)*(1-(T[s].sentOff||0)*.1)*(1+.025*(T[s].ti[5]-3)+.008*(3-T[s].ti[4])+.015*(T[s].ti[0]-3))}); // 전술에 따른 점유 성향(압박·짧은 패스·높은 라인 → 점유↑)
    const pe=1.1*K;let pH=Math.pow(midp[0]*(home?1.07:1),pe)/(Math.pow(midp[0]*(home?1.07:1),pe)+Math.pow(midp[1],pe))+st.mom*.03;
    st.mom*=.93;
    [0,1].forEach(s=>{ // 비접촉 부상(피로·부상 이력): 근거 SB 15-16 부상 교체 0.39/경기 중 파울 외 몫(추정)
      if(r()<CFG.ncInj){const p=pick(T[s].xi.filter(q=>q.g!=='GK'&&!st.hurt[q.id]),q=>1+fatOf(q,s)/40+(V(q,'inj',8)-8)*.08);if(p)injure(s,p,'nc')}});
    for(let tk=0;tk<CFG.ticks;tk++){ // 1분 안의 소유 단위 수(빈도 보정값)
    const np=nextPoss;nextPoss=null;
    const s=np?np.s:(r()<pH?0:1);
    const isCounter=!!(np&&np.tr), fromSecond=!!(np&&!np.tr);
    st.pos[s]++;
    const attRate=CFG.att+(T[s].ti[3]-3)*.025+0+(isCounter?.45:fromSecond?.25:0)+(T[s].ment==='공격적'?.05:T[s].ment==='수비적'?-.06:0)+((T[1-s].sentOff||0)?.05:0);
    const hA=home?(s===0?1+CFG.homeAdv:1-CFG.homeAdv*.5):1; // 홈 이점: 근거 라리가 22-24 홈 1.46골·원정 1.13골
    if(r()<attRate*hA){st.curTr=isCounter;const e0=st.ev.length;st.tr=null;const res=attack(s,isCounter,fromSecond?'second':null);st.curTr=false;const tr=st.tr;st.tr=null;if(tr&&tr.length){for(let i=e0;i<st.ev.length;i++)st.ev[i].tr=tr;if(st.ev.length===e0)st.ev.push({m:st.min,s,t:'attack',tr})}if(res&&res.next)nextPoss=res.next;else if(res&&res.lost&&res.counter)nextPoss={s:1-s,tr:true};}
    if(r()<CFG.bgFoul){ // (7) 중원 경합 파울: 공격적 역할·낮은 태클 선수가 더 자주
      const o=1-s;const df=pick(T[o].xi.filter(p=>p.g!=='GK'),p=>1+aggrOf(T[o],p)*.8+Math.max(0,13-attr(p,'tackle',o))*.08+(['DM','CM','CB'].includes(p.g)?.4:0));
      const at=pick(T[s].xi.filter(p=>p.g!=='GK'),p=>attr(p,'drib',s)+V(p,'str',10)*.3);
      if(df&&at){const x=r();const e0=st.ev.length;st.tr=null;foul(s,o,at,df,Math.floor(r()*5),x<.12?0:x<.4?1:2,true);const tr=st.tr;st.tr=null;if(tr&&tr.length)for(let i=e0;i<st.ev.length;i++)st.ev[i].tr=tr}}
    }
    if(hooks.afterMinute)hooks.afterMinute(st.min,st,T,api);
    return st.ev.slice(before);
  }
  function finalize(){
    [0,1].forEach(s=>{const d=st.sc[s]-st.sc[1-s];T[s].xi.concat(st.subs[s].map(x=>x.out)).forEach(p=>{const x=st.pr[p.id];if(!x)return;x.r+=d>0?.35:d<0?-.35:0;
      const g=p.g;if(['GK','CB','FB','DM'].includes(g))x.r+=st.sc[1-s]===0?.45:-.12*st.sc[1-s];x.r+=(x.duelW-x.duelL)*.05;x.r=Math.max(4.5,Math.min(10,+x.r.toFixed(1)))})});
    const tp=st.pos[0]+st.pos[1]||1;
    return {sc:st.sc,ev:st.ev,stats:{shots:st.sh,sot:st.sot,xg:st.xg.map(v=>+v.toFixed(2)),poss:[Math.round(st.pos[0]/tp*100),100-Math.round(st.pos[0]/tp*100)],lane:st.lane,fouls:st.fouls,blk:st.blk,cross:st.cross,off:st.off,corner:st.corner},inj:st.inj,ref:st.ref,trSh:st.trSh||0,trXg:st.trXg||0,supA:st.supA,tu:st.tu,
      duels:Object.values(st.duels).filter(d=>d.w+d.l>=2).sort((a,b)=>(b.w+b.l)-(a.w+a.l)).slice(0,12),ratings:st.pr,fatigue:st.fatigue,subs:st.subs,T};
  }
  return {step,finalize,api,st,T,derby:!!opt.derby,get done(){return st.min>=total&&!st.pendingPen},get min(){return st.min},total};
}
function simulate(H,A,opt={}){const m=createMatch(H,A,opt);while(!m.done)m.step();return m.finalize()}
// 자동 선발(대형 기준) — 체력·컨디션·적합도
// 정해진 11명을 새 대형 자리에 배치: 적합도×능력 합이 최대가 되도록(탐욕 후 2인 교환 개선)
function bestAssign(players,form){const keys=FORMS[form];const ids=autoPick(players,form);const P={};players.forEach(p=>P[p.id]=p);const v=(id,i)=>(P[id].ovr||60)*posMul(fitOf(P[id],keys[i]));
  let imp=true,g=0;while(imp&&g++<50){imp=false;for(let a=1;a<11;a++)for(let b=a+1;b<11;b++){if(v(ids[a],b)+v(ids[b],a)>v(ids[a],a)+v(ids[b],b)+1e-6){const t=ids[a];ids[a]=ids[b];ids[b]=t;imp=true}}}return ids}
// 자동 선발(v92): 슬롯 순서대로 고르던 탐욕 방식 → 헝가리안 알고리즘으로 11자리 전체 합이 최대가 되게 배정.
// 값 = 능력 × 엔진과 같은 배율(컨디션 COND_M × 체력 fitF × 포지션 posMul) × (1 + 주전 연속성 보너스 p._inc, 게임 쪽에서 부여)
/* v233 자동 선발 기준(우리 팀): PICKM.f가 있으면 포지션 적합도 배율을 그것으로 대체 */const PICKM={f:null};
function autoPick(players,form){const keys=FORMS[form];const C=players.filter(p=>p&&!((p.injD||0)>0)&&!((p.ban||0)>0));const n=Math.max(keys.length,C.length);
  const val=(p,k)=>{let v=(p.ovr||50)*condM(p)*fitF(p)*(PICKM.f?PICKM.f(fitOf(p,k)):posMul(fitOf(p,k)))*(1+(p._inc||0));if((k==='GK')!==(p.g==='GK'))v*=.3;return v};
  const A=[];for(let i=0;i<n;i++){A.push([]);for(let j=0;j<n;j++)A[i].push(i<keys.length&&j<C.length?-val(C[j],keys[i]):0)}
  const u=new Array(n+1).fill(0),w=new Array(n+1).fill(0),pp=new Array(n+1).fill(0),way=new Array(n+1).fill(0);
  for(let i=1;i<=n;i++){pp[0]=i;let j0=0;const minv=new Array(n+1).fill(Infinity),used=new Array(n+1).fill(false);
    do{used[j0]=true;const i0=pp[j0];let d=Infinity,j1=0;for(let j=1;j<=n;j++)if(!used[j]){const cur=A[i0-1][j-1]-u[i0]-w[j];if(cur<minv[j]){minv[j]=cur;way[j]=j0}if(minv[j]<d){d=minv[j];j1=j}}
      for(let j=0;j<=n;j++){if(used[j]){u[pp[j]]+=d;w[j]-=d}else minv[j]-=d}j0=j1}while(pp[j0]!==0);
    do{const j1=way[j0];pp[j0]=pp[j1];j0=j1}while(j0)}
  const xi=new Array(keys.length).fill(null);for(let j=1;j<=n;j++){const i=pp[j]-1;if(i>=0&&i<keys.length&&j-1<C.length)xi[i]=C[j-1].id}return xi}
function defaultRoles(xi,form){return xi.map((p,i)=>{const sk=FORMS[form]&&FORMS[form][Math.min(i,10)];const rs=ROLES[((sk&&SLOT[sk])||[p.g])[0]]||ROLES.CM;let bi=0,bv=-1;rs.forEach((rl,j)=>{const v=roleFit(p,rl);if(v>bv){bv=v;bi=j}});return bi})}
root.E3={PICKM,prep,styleOf,keyFromPos,shapeOf,bestAssign,slotAlt,effKey,phaseSlots,SLOT_H,styleMap,FORMS,SLOT,COORD,ROLES,DUTY,PI,PIK,PRESETS,BEATS,NEEDS,NEED_REF,COND_M,fitOf,posMul,roleFit,mapSlots,simulate,createMatch,autoPick,defaultRoles,grid,cell};
})(typeof module!=='undefined'?module.exports:window);

