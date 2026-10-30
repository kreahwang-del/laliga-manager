// ===================== 경기 엔진 v4: 연속 시뮬레이션(0.5초 단위, 22명 위치 기반) =====================
// 결과는 위치에서 나옴: 패스 길·차단 확률은 실제 수비 위치로, 슈팅 xG는 거리·각도로, 압박은 거리로 계산
// 인터페이스는 E3.createMatch와 동일(step/finalize/api/st/T) + 프레임 기록(opt.record)
(function(root){
const E3=root.E3||(typeof require!=='undefined'?require('./engine3.js').E3:null);
const {FORMS,PRESETS,BEATS,fitOf,posMul,effKey,bestAssign,defaultRoles,styleMap,styleOf,prep,COND_M}=E3;
const L=105,W=68,DT=.5,TPM=120;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const F=(s,v)=>s?L-v:v, Lt=(s,v)=>s?W-v:v;
const hyp=Math.hypot, sig=z=>1/(1+Math.exp(-z));
// 근거 기반 기본값(E3과 같음): StatsBomb 라리가 15-16 유형별 xG, 공중볼 흐름
const XG={through:.226,cutback:.165,combo:.126,longshot:.033,solo:.179,rebound:.179,lowcross:.174,spfoot:.134,cross:.126,corner:.098,fkx:.104,fk:.040,gkErr:.2,pen:.78};
const AER={cross:{win:.37,shot:.42},corner:{win:.38,shot:.62},fkx:{win:.36,shot:.58}};
const ONT={through:.1,cross:-.05,corner:-.05,fkx:-.05,longshot:-.08,fk:-.1};
// 거리·각도 xG(팀 기준 좌표: fx 0 우리 골라인 → 105 상대 골라인, fy 0 왼쪽 → 68 오른쪽)
function xgGeo(fx,fy){const dx=L-fx,dy=Math.abs(fy-34);if(dx<=.3)return .02;const d=hyp(dx,dy);
  const ang=Math.abs(Math.atan2(dy+3.66,dx)-Math.atan2(dy-3.66,dx));return sig(-.13+1.5*ang-.1616*d)}
const Vv=(fx,fy)=>.85*xgGeo(fx,fy)+.1*Math.pow(clamp(fx,0,L)/L,3)+.02*fx/L; // 위치 가치
const laneOfFy=fy=>clamp(Math.floor(fy/13.6),0,4);
const COND=COND_M||[1.08,1.04,1,.96,.92];
const RW={goal:[.85,.65,.5,.4],ast:.45,kp:.08,pOk:.002,pProg:.6,pMiss:.02,pMiss3:.04,pLost:.02,sot:.04,miss:.02,bigMiss:.12,drib:.07,drib3:.05,dribL:.04,tkw:.08,intc:.07,blk:.1,airW:.05,airL:.03,lost:.04,foul:.08,yel:.35,save:.18,saveX:.8,gkCon:.14,win:.25,loss:.2,cs:.55,conD:.15,gfA:.08}; /* 평점 가중치(WhoScored식: 6.0 시작, 위치·결과 가중, 팀 득실은 포지션·출전시간 비례) */
const PK0={'균형':0,'티키타카':0,'게겐프레싱':0,'두 줄 수비':0,'선수비 후 역습':0,'다이렉트':0,'측면 공략':0}; /* v60: 프리셋 일괄 보너스 제거(강팀일수록 이득이 커져 쏠림 원인) */ /* 성향 균형 보정(같은 전력 라운드로빈 기준) */
const NPS=()=>({g:0,a:0,r:6.0,sh:0,so:0,kp:0,tk:0,duelW:0,duelL:0,tc:0,pa:0,pc:0,at:0,aw:0,ta:0,tkw:0,da:0,dw:0,it:0,fc:0,fd:0,sv:0,cr:0,crc:0,xg:0,xa:0,rn:0,tb:0,ca:0});

/* 포지션별 활동량 계수(경기당 뛴 거리 기준: GK 약 5~6km, CB 약 9.5~10km, 미드필더·풀백 약 10.5~11.5km) */
const POSF={GK:.3,CB:.8,FB:1.05,DM:1.05,CM:1.1,AM:1,W:1.05,ST:.95};
/* 패스 대상 선택 모델(StatsBomb 360 라리가·분데스 3.7만 패스, 조건부 로짓): [거리/10, (거리/10)^2, 전진/10, 후방여부, 받는선수 열림/5, 패스길 여유/3, 목표x/35, GK여부, 공격진영 측면여부] */
const CLW={"D": [-2.014, 0.029, 0.564, -0.007, 1.453, 0.523, 0.161, 0.382, 0.019], "M": [-1.318, -0.183, 0.438, -0.251, 1.26, 0.5, 0.125, 0.059, -0.172], "A": [-1.292, -0.302, 0.369, -0.192, 1.175, 0.339, 0.105, -0.042, -0.479]};
/* ---- 세트피스 추천(우리 선수 구성 + 상대 분석). UI 추천 버튼과 '경기마다 자동' 공용 ---- */
function spRec(me,op){const air=p=>Math.max(1,Math.min(20,((p.h||180)-165)/35*19+1))*.3+(p.aerial??10)*.45+(p.str??10)*.25;
  const out=t=>(t.xi||[]).filter(p=>p&&p.g!=='GK'),gkOf=t=>(t.xi||[]).find(p=>p&&p.g==='GK')||{};
  const top=(L,n)=>{const a=L.map(air).sort((x,y)=>y-x).slice(0,n);return a.length?a.reduce((x,y)=>x+y,0)/a.length:10};
  const M=out(me),O=out(op),myA=top(M,5),opA=top(O,5),edge=myA-opA,oGk=gkOf(op).gk_air??12,myGk=gkOf(me).gk_air??12;
  const osp=op.sp||{},og=osp.g||{},oMark=og.dMark||osp.dMark||'mixed',oOut=og.outlet??osp.outlet??1,oStay=osp.stay??2;
  const why=[],sp={g:{}};const f1=x=>(x>=0?'+':'')+x.toFixed(1);
  const insw=(p,side)=>(side==='L'&&p.foot==='right')||(side==='R'&&p.foot==='left');
  const cs=(p,side)=>(p.cross??10)*.5+(p.fk??10)*.5;
  why.push(`공중볼 상위 5명 평균 우리 ${myA.toFixed(1)} vs 상대 ${opA.toFixed(1)} (${f1(edge)})`);
  /* 목표 지점: 엔진 상성(지역 방어는 니어·중앙 강함/파포스트 약함, 대인은 니어 약함) */
  const tgt=oMark==='zonal'?'far':oMark==='man'?'near':oGk>=15?'center':'near';
  const atk=Math.max(4,Math.min(7,Math.round(5+edge*.6))),stay=Math.max(1,Math.min(3,oOut+1));
  const tgtL={far:'파포스트',near:'니어',center:'페널티 스폿 부근'}[tgt];
  why.push(`상대 세트피스 수비 ${({zonal:'지역 방어',man:'대인 방어',mixed:'혼합'})[oMark]} → 목표 ${tgtL}${oGk>=15?` (상대 GK 공중볼 ${oGk})`:''}`);
  why.push(`박스 안 ${atk}명(공중볼 ${edge>=.8?'우위 → 인원 늘림':edge<=-.8?'열세 → 인원 줄임':'비슷 → 기본'}) · 남는 수비 ${stay}명(상대 역습 대기 ${oOut}명)`);
  const short=edge<=-1.8;
  ['L','R'].forEach(side=>{const L=M.slice().sort((a,b)=>cs(b,side)*(insw(b,side)?1.06:1)-cs(a,side)*(insw(a,side)?1.06:1));const tk=L[0];
    let type=short?'short':tk&&insw(tk,side)?'in':'out';
    if(!short&&oGk>=15&&type==='in'){const alt=L.find(p=>!insw(p,side)&&cs(p,side)>=cs(tk,side)-1.5);if(alt){sp['c'+side]={taker:alt.id,type:'out',target:tgt,atk,stay};return}type='out'}
    sp['c'+side]={taker:tk?tk.id:null,type,target:tgt,atk,stay}});
  if(short)why.push('공중볼 열세가 커서 코너는 숏코너로 공을 지키는 쪽 추천');else if(oGk>=15)why.push('상대 GK가 공중볼에 강해 골키퍼에서 멀어지는 아웃스윙 우선');
  const fkT=M.slice().sort((a,b)=>((b.fk??10)*.8+(b.shoot??10)*.2)-((a.fk??10)*.8+(a.shoot??10)*.2))[0];const fkv=fkT?(fkT.fk??10):10;
  const fnMode=fkv>=15?'shot':fkv>=12?'auto':'cross';
  ['L','R'].forEach(side=>{sp['fn'+side]={taker:fkT?fkT.id:null,mode:fnMode};
    const L=M.slice().sort((a,b)=>((b.cross??10)*.6+(b.fk??10)*.4)*(insw(b,side)?1.05:1)-((a.cross??10)*.6+(a.fk??10)*.4)*(insw(a,side)?1.05:1));
    sp['fw'+side]={taker:L[0]?L[0].id:null,mode:'cross',target:tgt,atk,stay};
    sp['ff'+side]={taker:L[0]?L[0].id:null,mode:edge>=.5?'cross':'short',target:tgt,atk,stay}});
  if(fkT)why.push(`직접 프리킥 키커 ${fkT.name}(프리킥 ${fkv}) → ${fnMode==='shot'?'직접 슈팅':fnMode==='auto'?'상황에 따라':'크로스'}`);
  why.push(`중·장거리 프리킥 ${edge>=.5?'박스 투입(공중볼 우위)':'짧게 연결(공중볼 우위 없음)'}`);
  /* 수비 */
  const myD=top(M,6),opT=top(O,4);const dMark=myD-opT>=1?'man':myD-opT<=-1?'zonal':'mixed';
  const fast=M.filter(p=>['ST','W','AM'].includes(p.g)&&(p.pace??10)>=15).length;
  const ofk=Math.max(10,...O.map(p=>p.fk??10));
  sp.g={dMark,posts:myGk<12?1:0,outlet:Math.min(2,fast?(oStay<=1?2:1):0),wall:ofk>=16?5:ofk>=13?4:3};
  why.push(`수비: 우리 공중볼 상위 6명 ${myD.toFixed(1)} vs 상대 타깃 ${opT.toFixed(1)} → ${({man:'대인',zonal:'지역',mixed:'혼합'})[dMark]} 방어, 수비벽 ${sp.g.wall}명(상대 최고 프리킥 ${ofk})${sp.g.posts?', 골포스트 1명(우리 GK 공중볼 약함)':''}, 역습 대기 ${sp.g.outlet}명`);
  const th=M.filter(p=>(p.str??0)>=16).sort((a,b)=>(b.str??0)-(a.str??0))[0];
  if(th&&edge>=-.5){sp.g.longThrow=true;sp.g.thrower=th.id;why.push(`롱 스로인 사용: ${th.name}(힘 ${th.str})`)}else sp.g.longThrow=false;
  return {sp,why}}
function spAuto(t,o){const sp=t.sp;if(!sp)return;const ks=Object.keys(sp).filter(k=>sp[k]&&sp[k].auto);if(!ks.length)return;const rc=spRec(t,o).sp;t.sp=Object.assign({},sp);ks.forEach(k=>{t.sp[k]=Object.assign({},rc[k]||{},{auto:true})})}
/* v197 사용자 지정 위치 = 실제 서는 위치: 기준 공 위치(공격 cuRefA·수비 cuRefD m)에서의 실측 위치표 값 */
const P5G=(typeof POS5!=='undefined')?{T:POS5,XC:POS5_XC,YC:POS5_YC}:(()=>{const m=require('./pos_table.js');return {T:m.POS5,XC:m.POS5_XC,YC:m.POS5_YC}})();
function p5lookG(role,ph,bx,by){const P5=P5G;const RT=P5.T[role]||P5.T.CM;const G=RT[ph]||RT.in;const XC=P5.XC,YC=P5.YC;let i=0;while(i<XC.length-2&&bx>XC[i+1])i++;let j=0;while(j<YC.length-2&&by>YC[j+1])j++;
    const tx=clamp((bx-XC[i])/(XC[i+1]-XC[i]),0,1),ty=clamp((by-YC[j])/(YC[j+1]-YC[j]),0,1);const c00=G[i][j],c10=G[i+1][j],c01=G[i][j+1],c11=G[i+1][j+1];
    const L_=(a,b,k)=>a+(b-a)*k;return [L_(L_(c00[0],c10[0],tx),L_(c01[0],c11[0],tx),ty),L_(L_(c00[1],c10[1],tx),L_(c01[1],c11[1],tx),ty),L_(L_(c00[2],c10[2],tx),L_(c01[2],c11[2],tx),ty),L_(L_(c00[3],c10[3],tx),L_(c01[3],c11[3],tx),ty)]}
function p5roleG(sg,fy,slots,sgs){const n=g=>sgs.filter(x=>x===g).length;const c=Math.abs(fy-34);
    if(sg==='GK')return 'GK';if(sg==='CB')return n('CB')>=3&&c<4?'CBc':'CB';if(sg==='FB')return n('CB')>=3?'WB':'FB';if(sg==='DM')return n('DM')>=2?'DMw':'DM';
    if(sg==='AM')return c>14?'W':'AM';if(sg==='CM')return 'CM';if(sg==='W')return 'W';return 'CF'}
/* v200 폭 순위 보정: DFL 폭 순위(공 중앙 65-75m, 가장 넓은 선수부터 |y|) 공격 28.5/24.5/19.0/15.7/12.9/10.4/8.4/6.2/3.7, 수비 22/19.4/16.4/14/11/8.8/6.9/5/3.2 — 바깥 선수는 그대로, 안쪽 선수일수록 더 벌림 */
function p5WnF(fy,inP){const d=Math.abs(fy-34);const f=inP?1.42-.42*Math.min(1,(d/28.6)**2):1.33-.36*Math.min(1,(d/22.6)**2);return 34+Math.sign(fy-34)*Math.min(32.5,d*f)}
/* v201 역할별 평균 폭 보정: DFL 원본 재변환(선수별 평균 위치, 공 중앙 58-82m) — 공격 시 풀백 17~22m·윙어 13~15m·중앙 미드 11~14m·센터백 5~10m, 수비 시 풀백 12~16m·윙어 12~17m·센터백 2~7m. 엔진은 풀백·센터백이 넓고 윙어·미드가 좁았음 */
const P5RW={in:{FB:-7,WB:-4,CB:-5,DMw:6,CM:10,W:11},out:{FB:-5,WB:-3,CB:-2.5,DMw:3,CM:5,W:8}};
function p5RWF(fy,role,inP){const a=P5RW[inP?'in':'out'][role];if(!a)return fy;const d=fy-34;if(Math.abs(d)<.3)return fy;return 34+Math.sign(d)*clamp(Math.abs(d)+a,.5,32.5)}
let P5W=1.4;/* v200 표시 보정: 위치표 기준값 → 실제 경기 평균 위치(이후 동작·제약 반영) 차이. [깊이 m(+면 상대 골 쪽), 중앙에서의 거리 m(+면 바깥)] — 기본 위치 다수 대형 측정값 */
const P5CAL={"in":{"FB":[-6.4,0.7],"CB":[-8.8,0.8],"DMw":[-5.5,-7.5],"AM":[-3.9,-0.5],"W":[-2.1,-19.8],"CF":[-2,-0.9],"DM":[-6.5,-1.4],"CM":[-3.9,-8.5],"CBc":[-6.8,0.2],"WB":[-5.5,-0.3]},"out":{"FB":[2.6,0.5],"CB":[2,0.5],"DMw":[1.6,-2.7],"AM":[1.7,-1.5],"W":[6.5,-12.3],"CF":[10,-0.6],"DM":[2.5,-0.1],"CM":[3.2,-3.9],"CBc":[0.9,-0.3],"WB":[3,-0.5]}};function p5refPos(role,ph,refB,an,raw){const left=an.fy>34+0.5,center=Math.abs(an.fy-34)<=0.5;let fx,fy;if(center&&/^(CB|FB|WB|DMw|CM|W|Fw)$/.test(role)){const q=p5lookG(role,ph,refB,34);fx=q[0];fy=34}else{const q=p5lookG(role,ph,refB,left?34:34);fx=q[0];fy=left?68-q[1]:q[1]}if(P5W)fy=34+(fy-34)*P5W;fy=p5WnF(fy,ph!=='out');fy=p5RWF(fy,role,ph!=='out');if(role==='CF'||role==='CBc'||role==='DM'||role==='AM')fy+=(an.fy-34)*.5;if(!raw){const c=(P5CAL[ph==='out'?'out':'in']||{})[role];if(c){fx+=c[0];const d=fy-34;fy=34+(Math.abs(d)<.5?0:Math.sign(d)*Math.max(0,Math.abs(d)+c[1]))}}return [fx,fy]}
/* UI용: 기본(드래그 안 한) 슬롯이 그 국면에 실제로 서는 위치(%, x 0-100 좌→우, y 0 상대 골문~100 우리 골문) */
function slotRoles(T,ph){const L=E3.phaseSlots(Object.assign({},T,{pos:{}}),ph);const an=L.map(q=>({fx:(100-q.y)*1.05,fy:q.x*.68,key:q.key}));const sgs=an.map(q=>(E3.SLOT[q.key]||[])[0]);return an.map((q,i)=>sgs[i]==='GK'?'GK':p5roleG(sgs[i],q.fy,an,sgs))}
function refCoords(T,ph,refB,raw){const L=E3.phaseSlots(Object.assign({},T,{pos:{}}),ph);const an=L.map(q=>({fx:(100-q.y)*1.05,fy:q.x*.68,key:q.key}));const sgs=an.map(q=>(E3.SLOT[q.key]||[])[0]);
  const ti=T.ti||[3,3,3,3,3,3,0],ment=(T.ment==='공격적'?1:T.ment==='수비적'?-1:0),inP=ph==='atk';const lineK=2*(ti[0]-3)+ment*1.5,wk=[0,.86,.93,1,1.07,1.14][inP?ti[2]:(ti[1]??3)]||1;
  return an.map((q,i)=>{if(sgs[i]==='GK')return raw?[L[i].x,L[i].y]:[50,ph==='atk'?82:93];const role=p5roleG(sgs[i],q.fy,an,sgs);const r=p5refPos(role,ph==='atk'?'in':'out',refB??(ph==='atk'?70:35),q,raw);if(!raw){r[0]+=!inP?lineK-4*Math.max(0,3-(ti[5]??3)):(/^(CB|CBc|FB|WB|DM|DMw)$/.test(role)?lineK*.5:0);r[1]=34+(r[1]-34)*wk}return [Math.round(clamp(r[1]/.68,2,98)),Math.round(clamp(100-r[0]/1.05,3,97))]})}
function createMatch(H,A,opt={}){
  if(opt.rw)Object.assign(RW,opt.rw);
  const r=opt.rnd||Math.random, home=opt.home!==false, rec=!!opt.record;
  const T=[prep(H,0),prep(A,1)];spAuto(T[0],T[1]);spAuto(T[1],T[0]);
  const hooks=opt.hooks||{};
  const CFG=Object.assign({defW:[1,1.09,1.02],defAd:.12,defWA:.25,defLA:.12,defL:1.18,defSB:.22,defPI:.9,defPS:4,defW2:1,decF0:.755,decTmSh:1.5,decDur:6,decGB:.04,decGQ:1.5,tw:1,tkWin:0.3368,boxMark:0.0079,cmpD:0.39,gamma:0.965,gammaB:0.3692,keepV:0.0948,laneK:1.0124,cd0:1.4613,dens:0.439,densS:0.423,homeK:0.065,tau:0.0526,shotCost:0.046,fwdB:0.003,tackle:0.0445,foulTk:0.66,foulDuel:.09,cardPerFoul:0.19,ctL:.25,ctR:.3,redD:.0038,ylC:.15,pfI:.75,piTA:.15,piTF:.15,ncInj:.0008,
    fkdSet:1,pressCal:1,dibK:.16,dibM:5,dCover:1,dcR:18,dcG:2.5,dcK:1,dcDan:6,dcL:.15,dcLift:0,dcAnt:.8,dcU:.9,dcLeash:[14,6],p5Wd:1.4,p5Wn:1,p5RW:1,wHold:8,p5PrB:2.5,prOwnK:1,cuAbs:1,cuRefA:70,cuRefD:35,gkhK:[.4,1.8],gksK:[.8,1.15],gkkP:[.92,.06],gkdK:[.3,.05,.14,.14],gksSv:[[.8,-.8],[-.8,.5]],bmKeep:1,dFloor:[1,.45,3,9.5],dLift:[[8,1.2],[20,2.3],[30,2],[43,.6],[52,0]],holdFw:[38,.55,30,.6],saveCorner:.33,rebound:.1,blkCorner:.3,missCorner:.1,aerCorner:.25,refShoot:11.098,refSave:13.5,refComp:10.8,boxPen:1,fkDirect:.6,runP:0.0731,offErr:0.09,takeon:2.2,crossB:3.1,lsK:0.8562,gkHigh:1,brk:0,lnLo:25.3472,lnHi:17.3629,keepB:-0.0002,blkK:1.3,accE:0.8163,turnT:.9,finK:1.25,gapK:0,toB:.40,toK:.015,toP:.005,toA:.08,beatC:8,beatCB:3,finS:.03,finC:13,presD:2.5,oneK:1.0498,dribK:0.7002,oneAcc:.92,wideRun:.004,crossX:66,outP:0.5887,tScale:2.1384,thrPen:0.21,hScale:1.6377,longPen:-0.01,clrD:2.2,clrV:.5,backPen:0.0152,airZ:0.0347,backK:0.3573,lzD:1.4,lzM:0.5814,lzA:0.2173,offT:0.95,blindT:1,supN:2.7598,supK:0.1659,cbCarry:0.013,farK:1.3857,wallP:.18,wallLate:.5,wallOne:3,wallB:.035,habE:.7,layK:2,tempoT:.25,pSk0:1.7286,pSk1:1.7172,pSk2:1.5455,ctlSk:0.0916,dSk:0.0148,keepSk:1.8504,panicK:0.4593,kvA:0.5,edgeMark:0.2247,stA:-0.3048,dlK:0.2324,dropU:3.348,lnMid:17.4269,trD:.6,cntRun:2.5,beatK:.12,pressFat:.25,dlMin:14.5032,beatT:1.2,fwdD:0.9328,gkLong:0,talK:.5,bsK:0.4065,hsY:-0.7249,swB:0.0049,retPen:.006,ppMax:3,ffX:.33,fkOff:.04,sitOn:1,capA:19,dhOn:1,dhE:1.2,dhM:1,dsE:1,dsI:1,dhF:.6,tkRole:{ST:.35,W:.8,AM:1.2,CM:1.1,DM:1.1,CB:1.15,FB:1.25},dsG:{CB:1,FB:1,DM:.6,CM:.6,AM:.5,W:.5,ST:.35},itRole:{ST:.055,W:.21,AM:.3,CM:.78,DM:1.24,CB:2,FB:2,GK:1},pstOn:1,trSoT:.12,trFin:.08,trDr:.05,trCq:.15,trFk:.15,sigH:1.2,fitB:.015,fitM:.05,fitK:.025,lk0:.15,lk1:.15,sigK:1.6,trAir:.8,trLs:.6,trBox:.7,trLine:.8,trSw:1.5,trCm:.006,trPr:.4,trTk:.05,trInt:.25,trFwd:1,trFld:.35,thrD:1.5,thrB:.02,sitL:3,ftX:.5,ftC:.012,ftW:.5,boxEngX:18,boxEngT:.3,cx0:0.002,cxA:0.014,xEarly:0.25,sitXd:85,xRdy:6,clrB:2,clrE:0.21,sitM:1,xgV2:1,xg0:0.05,hBox:0.305,lsD:1.85,lsM:0.2,lsR:24.45,mkBs:0.765,ctlB:0.22,sitC:1,sitX:1,sitK:1,sitTrk:1,sitBox:1,sitA:1,spCC:0.2,sp2:1,spGK:1,spA:1.2,spS:.6,spSN:.55,spSE:.45,spX:0.85,clLd:2.0,pTi:.15,pTh:.15,tlZ:9.7334,hdK:0.32,lcK:0.4147,clK:0.418,gkX:45,vK:0.3151,opK:2.0513,wideB:0.0091,mkK:0.1375,shD:15.3007,pv2:1,pEngD:0.4445,pEngM:0.5,pEngA:0.4733,engM:0.6,holdD:6.9152,linkK:0.3766,linkN:2,lenK:0.0037,lenD:5.5602,lenA:0.8731,rsB:0,rsT:.7,inG:6,dG:10,gkB:0,ftLat:0.0107,ctl0:0.965,ctlP:.05,boxF:0.12,talV:.5,engT:3,ox0:3.1306,oxA:4,wFar:1,bkP:67,bkMax:72.0701,spK:0.40,lsh:0.1114,bsX:0,fwY:17.5117,dsh:0.4835,dlBox:3.8134,showLr:0.2,showK:0.3,wDrop:0.8,midDrop:0,lgR:3.9628,lgT:0.4371,accL:0.8375,bkAcc:0.8519,ftBack:0,ftIn:0.0075,cbLat:0.0095,rkG:{ST:1,W:1,AM:1,CM:1},fbUp:22,fbB:.65,fbD:.25,fbF:.3,fbFar:.6,fbX0:-25,wTb:.6,wTo:2,rcvG:{AM:.016,CM:.004,W:.004,ST:.002,FB:-.004,DM:-.003},drG:{AM:1.9},flPr:0,flPrZ:[.15,0,0],flPrD:99,flMove:1,spReach:.85,swAcc:.8,swDy:28,dshM:.15,lat2:1,latC:.6,latW:.35,cbW:1.7,zoneOn:1,zR:{CB:4,FB:6,DM:6,CM:7,AM:8,W:7,ST:6},thrLob:62,thrLobN:4,thrLobA:.6,brV:.7,xgNoGK:1,adB:.6,adT:14,adA:.6,cAuto:.5,cAutoH:1,thrDense:.45,afAll:0,afLs:.02,afTo:.4,afTh:.6,afCr:.8,afWall:2,afWL:1.6,afRun:1,afSh:.004,lineFat:.2,fatEng:.9,lbC:.7,lbW:.25,pbLate:1,pcRun:.8,hiLate:0,gkRush:3,d5Thr:1,d5ThrD:7,d5ThrB:-2.85,d5ThrDd:3,d5ThrDx:75,d5ThrBox:2,crLowP:.45,crShotP:.53,thrAcc:.65,thrLr:1.2,g2gPen:.8,d5ThrSh:5,d5ThrR:1.5,d5ThrMin:.4,d5CL:1,d5CLK:.08,d5CFwd:.06,d5CVal:2,d5CBoxSp:5,d5CBoxP:1.5,d5CFwdA:.08,ab5P:1,ab5I:1,ab5E:.5,d5GkK:.12,d5Brk:1,d5BrkSh:2,d5OneSh:.8,d5ShBand:{'ib<12':-1.1,'ib12-18':0,'ob12-18':.1,'ob18-25':1,'ob25-32':1.05,'ob32+':.4},d5BoxCarry:5,d5Box12:2,d5BoxSh:-1,p5BoxMk:1,p5BoxMkX:30,p5BoxMkN:5,p5BoxMkR:14,p5BoxMkK:1,p5MkN:5,p5MkL:7,p5Noise:.5,p5NoiseT:6,p5TeamX:6,p5TeamY:3,p5TeamT:8,d5:1,d5ShB:-.7,d5EngD:2.2,d5Box1:1,d5BoxT:.4,d5GkLead:3,d5GkHold:1,d5GkB:1.2,d5Gk0:.18,d5Gk1:.24,d5GkK0:.12,d5GkK1:.13,d5CarryB:.7,d5ClrCtl:2.5,tlK:1,rlK:1,hdClr:1,ftClrK:1,d5CarryZ:[0,-.6,-.4],dExitP:.7,oPass:.15,rsWaitReal:1,oEnd:.35,oInt:.25,oTk:.6,oTl:.25,oClr:.5,d5LatCA:-1.1,d5BackCA:.4,tlA:.06,d5TkStun:.8,d5LsStun:.6,d5LsR:1.6,d5LsP:.6,d5LsX:85,d5RegCtl:1,d5IntA:.32,d5IntB:.15,d5Ctl:.45,d5Fwd:.8,d5Back:1.3,d5Rst:0,p5LineRun:.08,fbRun:1,ovSit:1,ovK:3,ovOcc:.85,ovOccR:7,ovOccU:.3,cmUnder:.06,wdW:4,fbIn:3,gkCandX:35,cntF:.2,cntT:6,cntH:.6,cpN:0,cpT:4,cpX:50,cpR:3,cpE:1,clrV2:1,airConv:1,airNs:1,airNd:1,airSlack:-.38,airHd:1,airMis:.04,airClr:.13,airHf:1,airHl:.35,airHb:.2,airHok:.38,airSlackG:-.1,airSBg:-.08,airUnH:1,hdClrP:.45,boxZ:[7,5,1],boxA:[4,3,1],missOpp:.85,missR:18,missTo:.85,gkSet:1,gkShortP:.6,restDef:1,swA2:.15,swHold:20,aiGs:1,gsP:3,gsH:3,xgDisp:1.1,rotOn:1,rotK:11,rotMin:40,rotMean:90,rotR:{cw:3.3,ww:1.1,cc:.6,aw:1,mw:.8,fw:.3},restO:2,restM:-2,gsRestT:2.5,gsRestM:2,gsRestN:1,gsRec:.45,gsRecT:6,dhT:.5,dhP:.5,outKeep:.6,chemK:.15,momK:.08,latPD:6,latPM:2,swOn:1,bkT:.55,bkF:.7,d5SwC:1.6,airHfo:.5,airUnHs:.35,airUnHo:.5,xrOn:1,xrOut:.11,xrRec:.18,xrBlk:.06,xrCor:.05,xrWinD:-.02,xrGk:.10,airSBp:.13,airRs:3,airRd:2,d5MtoD:.6,d5MBack:.3,d5MPr:.5,d5MtoA:0,d5MFwdA:0,clrBF:[.20,.25,.21,.175,.10,.04,.025],clrBH:[.18,.35,.335,.105,.025,.005],clrBlk:4,clrK:.85,clrW:.4,oClr2:.12,clrAir:12,clrHdF:.6,clrCtlD:4,d5CrossB:0,pinK:.9,pinW:.5,pinNP:1,pinR:40,pinDr:.75,pinD:1,runKeep:1,bhOn:1,bhNear:6,bhMinD:6,bhG:['ST','W','AM','FB','CM'],bhL0:3,bhL1:7,bhEnd:2,bhRe:.3,bhMin:.25,bhB:-1.9,bhZ:[-.6,-.2,1.4],d5LenC:{"d2":4.507,"m1":0.175,"m0":-0.665,"d3s":7.3,"m2":0.855,"d3":6.0,"d4":10.5,"a1":-5,"a0":-5,"d5":15,"d0":3.127,"m3":2.609,"d1":3.829,"m4s":6.082,"a2":-4.407,"m5":8,"m4":5.571,"d5s":15,"m5s":8,"a3s":-1.852,"m3s":2.935,"m2s":2.962,"a3":-2.251,"a4s":2.197,"d4s":10,"d2s":6.931,"a2s":-3.78},d5HtC:{"d2":0.137,"m1":0.96,"m0":2.567,"d3":0.825,"m2":0.257,"d4":0.474,"a1w":1.11,"a0":2.151,"a1":0.791,"d0":3.171,"m3":0.59,"d1":1.204,"m4":3.337,"a2w":1.616,"a2":0.748,"a3":1.49,"a3w":2.277,"a0w":1.612,"a4":1.002},d5CmpC:{"d2G":1.058,"m1L":0.292,"m0L":0.765,"m0G":-0.657,"d3L":-0.8,"m2G":1.138,"d4L":-0.841,"a1L":0.873,"a0G":-0.7,"m1G":0.535,"d2L":-0.235,"a1G":1.038,"d0G":-1.28,"a0L":-0.116,"m2L":0.143,"d0L":-0.957,"m3L":-0.013,"d1L":0.33,"d1G":0.085,"m3G":0.433,"m4L":-2.479,"a2G":0.495,"a2L":-0.242,"a3L":-0.74,"a3G":-1.102,"d3G":0.827,"m4G":-2.795},afCrossB:3,crPiB:1.5,d5LatA:.4,d5BackA:.3,d5LofA:0,wdI:.3,d5WideF:0,p5Chan:3,p5ChanF:4,d5RstX:60,d5Long:0,d5Sh:.05,d5Dr:.06,d5DrB:0,d5DrR:4.5,d5DrZ:[-2.8,-2.5,-2.5],d5DrK:.12,d5Len:.25,d5GkLong:.9,d5Run:.3,d5Ret:.3,d5Tau:1,d5PassK:.08,d5CrossAir:1,d5OnK:.05,d5FinK:.05,finK5:1.12,p5Opp:1,p5Ant:.8,p5UrgD:.7,p5UrgB:.2,p5Line:2,p5Ment:1.5,p5Dup:.5,p5Cu:1,p5Mark:.05,p5Sit:0,cnA:.85,cnB:.4,cnD:.35,cDeep:0,cDeepL:38,lgDeep:0,bsq:0,bsqR:30,bsqM:6,clrT:8,sitFl:0,bzN:0,bzK:.45,bzB:1,bzL:5,bxD:0,bxR:35,bxS:13,cCnt:1,cHs:8,cH0:37,cL0:30,cLs:.012,cTo:.6,cTh:.9,cCr:.3,cWall:1,cRun:2,thrBh:.05,brOn:1,brCl:10,brX:93,brU:.95,brLate:.9,brOne:.05,brDrib:2.5,brPass:.05,brShot:.06,brCarry:.025,thrDep:0,laneAtk:1,zOpen:.6,zHold:1,zK:.7,zPk:4.5,zRc:1.6,zRcG:{AM:1,ST:1.1},cuK:0,cuB:1,pkK:.8,lbB:.006,lbAM:1.5,pkX:3,pkD:6,pkY:12,dl2:1,dlB:36,dlS:2,dlK2:.5,bk0:5,bkP2:0,wNar:.3},opt.cfg||{});
  if(opt.derby){CFG.foulTk*=1.1;CFG.foulDuel*=1.1;CFG.cardPerFoul*=1.1}
  const st={tu:[{},{}],supA:[0,1].map(()=>({g:[[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],n:0})),min:0,tk:0,sec:0,sc:[0,0],sh:[0,0],sot:[0,0],xg:[0,0],pos:[0,0],ev:[],lane:[[0,0,0,0,0],[0,0,0,0,0]],duels:{},
    pr:{},fatigue:[{},{}],mom:0,cards:{},subs:[[],[]],hurt:{},inj:[],fouls:[0,0],blk:[0,0],cross:[0,0],off:[0,0],corner:[0,0],ref:{n:0,ns:0,sh:0,sv:0,cp:0},frames:[],pass:[[0,0],[0,0]],trSh:0,trXg:0};
  T.forEach((t,s)=>t.xi.forEach(p=>{st.pr[p.id]=NPS();st.pr[p.id].in0=0;st.fatigue[s][p.id]=0}));
  /* v74 전력 차 감쇠(실측 근거): 라리가 21~25 상위 3팀이 4~20위 상대로 낸 득점(1.94·2.21골) 대비 엔진이 15~18% 많아, 공격 팀 선발 평균이 수비 팀보다 높을수록 마무리 확률을 낮춤(1점당 CFG.gapK). 비슷한 팀끼리·약팀 공격엔 영향 없음 */
  const XSTR=[0,1].map(q=>{const x=(T[q].xi||[]).filter(p=>p);return x.length?x.reduce((a,p)=>a+(p.ovr||70),0)/x.length:75});const gapF=q=>1-Math.min(.3,(CFG.gapK||0)*Math.max(0,XSTR[q]-XSTR[1-q]));
  const counter=[0,0];[0,1].forEach(s=>{if(BEATS[T[s].preset].includes(T[1-s].preset))counter[s]=CFG.beatK*Math.max(0,.5+.5*T[s].styleBonus)});
  // ---- 능력 실효값(분 단위 캐시) ----
  const fitF=p=>.72+.28*Math.min(1,(p.fit??100)/100);
  const EF=[{},{}],FITM=[{},{}];const TVc=(a,n,k)=>((a&&a.p&&(a.p[k]??0)>=CFG.capA)?TV(a,n):0);/* 성공률 특성: 능력치가 상한 근처(19+)라 차이를 더 담을 수 없을 때만 효과 */
  const DH=(a,i)=>(CFG.dhOn&&a.p.dh)?Math.pow(a.p.dh[i],CFG.dhE):1;const TV=(a,n)=>(a&&a.trv&&a.trv[n])||0;
  function effOf(p,s){const f=st.fatigue[s][p.id]||0;return (FITM[s][p.id]||1)*COND[p.cond??2]*fitF(p)*posMul(T[s].fm[p.id]??1)*(1-Math.min(.25,f/100*.25))*(st.hurt[p.id]?.8:1)*(home&&s===0?1+CFG.homeK:1)*(1+counter[s]*.4)*(1+T[s].styleBonus*.02)*(1+((CFG.pk||PK0)[T[s].preset]||0))}
  const eff=(p,s)=>EF[s][p.id]??(EF[s][p.id]=effOf(p,s));
  const VC={pace:1,comp:1,str:1};const V=(p,k,d)=>{const v=p[k]??d;return VC[k]&&typeof CFG!=='undefined'?12+(v-12)*CFG.talV:v};
  const attr=(p,k,s)=>(12+(V(p,k,10)-12)*CFG.talK)*eff(p,s);
  const hN=p=>Math.max(1,Math.min(20,((p.h||180)-165)/35*19+1));
  const HSIG=['드리블 돌파','중거리 선호','크로스','라인 줄타기','스루패스','볼 운반'];/* v109 흐른 공·세컨드볼 역할 가중: 실제로는 미드필더가 세컨드볼을 가장 많이 줍고 공격수는 적음 → 체감 거리 배수(작을수록 먼저 도달) */const LRD=a=>(CFG.lrd&&CFG.lrd[a.g])||({DM:.7,CM:.75,AM:.95,FB:.95,CB:1,W:1.5,ST:1.6,GK:1}[a.g]||1);const HB=(a,i)=>(a.p.hab?Math.pow(a.p.hab[i],CFG.habE):1)*(TV(a,HSIG[i])>1?CFG.sigH:1); /* 실제 기록 기반 개인 성향: 0 드리블 1 슈팅 2 크로스 3 침투 4 스루패스 5 운반 */
  const airZ=fx=>fx<35?CFG.airZ:fx>70?-CFG.airZ:0; /* 공중볼 위치 보정: 우리 진영 +, 상대 진영 − (SB 15-16: 58/50/42%) */
  const airC=(p,s)=>hN(p)*.3+attr(p,'aerial',s)*.45+V(p,'str',10)*eff(p,s)*.25+(p._air||0);
  const wfMul=p=>p.foot==='both'?1:.75+.0625*(V(p,'wf',3)-1);
  const tw=s=>CFG.tw*(clamp(T[s].fam??60,0,100)-60)/40; // 팀 호흡(숙련도)
  const pick=(list,wf)=>{const ws=list.map(wf),t=ws.reduce((a,b)=>a+b,0);if(t<=0)return list[0];let x=r()*t;for(let i=0;i<list.length;i++){x-=ws[i];if(x<=0)return list[i]}return list[list.length-1]};
  // ---- 에이전트 ----
  const P=[[],[]];
  function mk(p,s,i){return {p,s,i,x:52.5,y:34,vx:0,vy:0,tx:52.5,ty:34,urg:.6,stun:0,run:0,vm:7,fl:{},duty:1}}
  function sync(s){const old=new Map(P[s].map(a=>[a.p.id,a]));P[s]=T[s].xi.map((p,i)=>{let a=old.get(p.id);if(!a){a=mk(p,s,i);const prev=P[s][i];if(prev){a.x=prev.x;a.y=prev.y}}a.i=i;a.p=p;return a});SH[s]=null}
  const SH=[null,null];
  function shape(s){if(SH[s])return SH[s];const t=T[s];const mkS=ph=>t.k(ph).map(q=>({fx:(100-q.y)*1.05,fy:q.x*.68,key:q.slotKey}));
    const o={atk:mkS('atk'),def:mkS('def'),base:mkS('base')};const back=a=>Math.min(...a.slice(1).map(q=>q.fx));o.bA=back(o.atk);o.bD=back(o.def);const SG=k=>((E3.SLOT[k]||[])[0]);{const cu=ph=>{const f=t.form[ph]||t.form.base,cp=(t.pos&&t.pos[ph])||{},m=E3.mapSlots(t.form.base,f),C=E3.COORD[f];return o[ph].map((q,i)=>{if(!cp[i]||!C)return null;const j=m?m[i]:i,c=C[j];if(!c)return null;return {fx:q.fx-(100-c[1])*1.05,fy:q.fy-c[0]*.68}})};o.cuA=cu('atk');o.cuD=cu('def');/* v202 구간별 지정 위치(공 위치 우리 진영 25·중앙 52·상대 진영 80m) */{const kz=ph=>{const Z=(t.posZ&&t.posZ[ph])||null;if(!Z)return null;return o[ph].map((q,i)=>{const L=[];for(const [k,b] of [['D',25],['M',52],['A',80]]){const c=Z[k]&&Z[k][i];if(c)L.push({b,fx:(100-c[1])*1.05,fy:c[0]*.68})}return L.length?L:null})};o.kzA=kz('atk');o.kzD=kz('def')}const b0=(L,C)=>Math.min(...L.slice(1).map((q,i)=>q.fx-((C[i+1]&&C[i+1].fx)||0)));o.bA0=b0(o.atk,o.cuA);o.bD0=b0(o.def,o.cuD)}o.sgA=o.atk.map(q=>SG(q.key));o.sgD=o.def.map(q=>SG(q.key));P[s].forEach((a,i)=>{a.sgA=o.sgA[Math.min(i,o.sgA.length-1)];a.sgB=SG((o.base[Math.min(i,o.base.length-1)]||{}).key)});{const ms=o.def.map((q,i)=>[q,o.sgD[i]]).filter(x=>x[1]==='CM'||x[1]==='DM').map(x=>x[0].fx-o.bD);const al=o.def.slice(1).map(q=>q.fx-o.bD).sort((x,y)=>x-y);o.mD=ms.length?ms.reduce((x,y)=>x+y,0)/ms.length:al[Math.floor(al.length/2)]}
    P[s].forEach((a,i)=>{const rl=t.roleOf(i);a.pwd=undefined;a.fl=a.fl0=rl[2]||{};a.role=rl[0];a.duty=t.dutyOf(i);a.g=t.grpOf(i);a.gk=i===0;
      /* 선수 유형(원래 스타일) vs 감독 지정 역할: 맞으면 소폭 보너스, 다르면 원래 습관이 일부 남음(leak)·수행 소폭 감소 */
      a.leak=0;a.afl=null;FITM[s][a.p.id]=1;const ps=a.p.pst;if(CFG.pstOn&&ps&&a.p.g===a.g&&E3.ROLES[a.g]){const rs=E3.ROLES[a.g],ti=ps[0],ri=rs.findIndex(x=>x[0]===a.role),sc=ps[1]||[];
        if(ri>=0&&rs[ti]){const diff=Math.max(0,(sc[ti]??0)-(sc[ri]??0));if(ti===ri)FITM[s][a.p.id]=1+CFG.fitB;else{a.leak=clamp(CFG.lk0+CFG.lk1*diff,0,.5);a.afl=rs[ti][2]||{};FITM[s][a.p.id]=1-Math.min(CFG.fitM,CFG.fitK*diff)}}}
      a.trv={};if(CFG.pstOn&&ps){(ps[2]||[]).forEach(n=>a.trv[n]=1);(ps[3]||[]).forEach(n=>a.trv[n]=CFG.sigK)}a.p._air=(a.trv['공중볼']||0)*CFG.trAir*.5+((a.p.aerial??0)>=CFG.capA?(a.trv['공중전 강자']||0)*CFG.trAir*1.25:0)});return SH[s]=o}
  /* v122 상황 판단 적응도: 모든 선수 기본기 adB(0.6) + 판단 능력(패스·오프더볼·침착 평균)이 adT(14) 넘는 만큼 최대 +adA(0.6). 자동 적응 전체는 cAuto(0.5)배 — 나머지는 감독의 '상대 공략 지시'로 */
  function iqF(a){const q=(attr(a.p,'pass',a.s)+attr(a.p,'offball',a.s)+V(a.p,'comp',12)*eff(a.p,a.s))/3;return CFG.adB+(q>CFG.adT?Math.min(1,(q-CFG.adT)/(20-CFG.adT))*CFG.adA:0)}
  function afOf(s){return CFG.afAll||T[s].af||null}
  const momOf=s=>st.fm?st.fm[s]:0;/* v248 정신 차려!(경기당 2번): 그 팀만 짧게 속도·패스 정확도 소폭 상승, 분당 10% 감소. 골 기세(st.mom)는 계산에 쓰지 않음(보정 유지) */function vmOf(a){const p=a.p;return (5.7+V(p,'pace',10)*.17)*Math.min(1.04,.85+.15*eff(p,a.s))*(1-Math.min(.12,(st.fatigue[a.s][p.id]||0)/100*.12))*(1+.02*Math.min(1,momOf(a.s)))}
  // ---- 공 ----
  const ball={x:52.5,y:34,h:0,own:null,fl:null,lo:null,last:0,rs:null};
  let possS=0, cur=null; // 현재 소유 팀, 현재 소유 추적(trace)
  const ev=(o)=>{o.m=st.min;o.sec=+st.sec.toFixed(1);st.ev.push(o);return o};
  function beginPoss(s,a,how){endPoss();if(a&&a.p&&how!=='sp'&&how!=='keep'){const W=st.pw||(st.pw={});const k=a.p.id;const e=W[k]||(W[k]={});e[how]=(e[how]||0)+1}if(CFG.pstOn)for(const q of P[s]){q.fl=q.leak>0&&q.afl&&r()<q.leak?Object.assign({},q.fl0,q.afl):(q.fl0||q.fl||{})}const o=1-s;const bx=F(s,ball.x);if(how!=='sp'&&how!=='keep'){const LT=st.lossT||(st.lossT=[-99,-99]),LX=st.lossX||(st.lossX=[0,0]);LT[o]=st.sec;LX[o]=100-bx}if(opt.possLog)(st.pl2||(st.pl2=[])).push([s,bx,how,st.sec]);let ahead=0;P[o].forEach(b=>{if(F(s,b.x)<bx)ahead++});
    let l1c=0,l2c=0;for(const b of P[o]){const f=F(s,b.x);if(f>l1c){l2c=l1c;l1c=f}else if(f>l2c)l2c=f}const hiL=CFG.cCnt&&L-l2c>=42;let gsd=0;if(CFG.cDeep)P[o].forEach(b=>{if(!b.gk&&F(s,b.x)>bx)gsd++});/* v124 깊은 곳 역습: 공보다 우리 골 반대쪽(상대 골문 쪽)에 남은 상대 필드플레이어가 cDeep명 이하이고 상대 최종 수비가 높으면(뒷공간) 자기 진영 깊은 탈취도 역습으로 */const deepC=CFG.cDeep&&(how==='regain'||how==='second')&&bx>8&&bx<=18+30&&gsd<=CFG.cDeep&&L-l2c>=CFG.cDeepL;const isC=deepC||(how==='regain'||(hiL&&how==='second'))&&ahead>=(hiL?4:5)&&bx>18&&bx<78;const st0={k:'start',p:a?a.p.name:'',tr:isC||undefined,sec:how==='second'||undefined,sp:how==='sp'||undefined};
    {const D=st.dbg||(st.dbg={});D.poss=(D.poss||0)+1;D['ph_'+how]=(D['ph_'+how]||0)+1}
    if(how==='regain'||how==='second'){const hl=CFG.hiLate?clamp((L-l2c-38)/12,0,1)*clamp((bx-25)/25,0,1):0;for(const b of P[1-s]){if(b.gk)continue;b.late=Math.max(b.late||0,st.sec+CFG.trD*(1+CFG.hiLate*hl)*(counter[s]>0?1+CFG.beatT:1)*(1.25-attr(b.p,'posit',1-s)/20*.5))}}
    cur={s,tr:Object.assign([st0],{s}),e0:st.ev.length,t0:st.sec,acts:0,lane:null,cnt:isC?st.sec+9:0,ft:false,how};possS=s;if(isC)cur.counter=true;if(opt.hlLog){const dx=P[1-s].filter(b=>!b.gk).map(b=>F(1-s,b.x)).sort((x,y)=>x-y);(st.hl||(st.hl=[])).push(cur.hl=[F(s,ball.x),(dx[0]+dx[1]+dx[2]+dx[3])/4,isC?1:0,0,how]);{const off0=offLine(s);const fw=P[s].filter(q=>!q.gk).map(q=>F(s,q.x)).sort((x,y)=>y-x);cur.hl[13]=+(fw[0]-off0).toFixed(1);cur.hl[14]=P[s].filter(q=>!q.gk&&F(s,q.x)>F(s,ball.x)+5).length;cur.hl[15]=s;cur.hl[16]=P[1-s].filter(b=>!b.gk&&F(s,b.x)>F(s,ball.x)).length}}}
  function endPoss(){if(!cur)return;const tr=cur.tr;const keep=cur.acts>=2||cur.lane!=null||tr.some(x=>x.k==='shot'||x.k==='sp');
    if(keep){let any=false;for(let i=cur.e0;i<st.ev.length;i++){const e=st.ev[i];if(e.s===cur.s&&!e.tr&&!['yellow','red','sub','injury','shout','sys'].includes(e.t)){e.tr=tr;any=true}}if(!any)st.ev.push({m:st.min,sec:+st.sec.toFixed(1),s:cur.s,t:'attack',tr})}
    cur=null}
  const XGD=CFG.xgDisp??1;
  const TR=(o)=>{if(o.k==='lost'&&CFG.gkDbg){if([0,1].some(q=>P[q].some(x=>x.gk&&x.p.name===o.p))){const D=st.gkd||(st.gkd={});D[o.how]=(D[o.how]||0)+1;D.t=D.t||[];D.t.push([st.sec,o.how])}}if(cur)cur.tr.push(o);return o};
  function give(a,how,cd){const s=a.s;/* v184 도움 오류: 패스를 받아서가 아니라 루스볼·가로채기·리바운드 등으로 공을 잡아도 예전에 마지막으로 패스 받은 사람(recvFrom)이 남아, 4초 안 득점 시 엉뚱한 선수에게 도움 → 이번 틱 패스 수신이 아니면 지움 */if(a.recvAt!==st.sec)a.recvFrom=null;if(st.sbTrk&&st.sbTrk.a!==a){const T_=st.sbTrk;const D=st.dbg||(st.dbg={});const k='sF_'+T_.z+'_'+(st.sec-T_.t>8?'late':a.s===T_.a.s?'pass':'lost');D[k]=(D[k]||0)+1;st.sbTrk=null}if(st.thrTrk&&st.thrTrk.a!==a){const T_=st.thrTrk;const D=st.dbg||(st.dbg={});const k='tF_'+T_.z+'_'+(st.sec-T_.t>8?'late':a.s===T_.a.s?'pass':'lost');D[k]=(D[k]||0)+1;st.thrTrk=null}pr(a.p).tc++;if(opt.hlLog&&how==='keep'){const [nd]=nearestOpp(a);(st.rcv||(st.rcv=[])).push([F(s,a.x),nd])}{const fx=F(s,a.x);const z=st.tz||(st.tz=[[0,0,0,0],[0,0,0,0]]);z[s][fx<35?0:fx<70?1:2]++;if(fx>88.5&&Math.abs(Lt(s,a.y)-34)<20.2){z[s][3]++;const D=st.dbg||(st.dbg={});D.brx=(D.brx||0)+fx;D.br99=(D.br99||0)+(fx>99?1:0);D.br95=(D.br95||0)+(fx>95?1:0);D.bry9=(D.bry9||0)+(Math.abs(Lt(s,a.y)-34)<9?1:0);D.brn=(D.brn||0)+1;const k='bt_'+(how||'regain')+(how==='keep'?'_'+(ball.lastKind||'?'):'');D[k]=(D[k]||0)+1}}if(!cur||cur.s!==s)beginPoss(s,a,how||'regain');ball.own=a;ball.fl=null;ball.lo=null;ball.h=0;ball.last=s;ball.x=a.x;ball.y=a.y;a.mode=null;a.carry=null;a.carried=0;a.recvAt=st.sec;a.rcvD=hyp(L-F(s,a.x),34-Lt(s,a.y));a.tlDone=(how==='keep'||(CFG.rlK&&(how==='regain'||how==='second')))?0:1;a.rgT=(how==='regain'||how==='second')?1:0;{let md=99;for(const b of P[1-s]){if(b.stun>0)continue;const d=hyp(b.x-a.x,b.y-a.y);if(d<md)md=d}a.rcvNd=md}a.c5done=0;a.ctrl5=(how==='keep'||(CFG.d5RegCtl&&how==='regain'))?1:0;a.hands=(a.gk&&cd!=null&&cd>2)?1:0;a.how5=how;a.cd0=cd;a.cd=cd??((a.gk&&CFG.d5GkHold)?gkHold(how==='keep'?'keep':'rec'):(holdTime(a)+(CFG.d5Ctl||0)*(F(s,a.x)>80?.4:1)))}
  function loose(x,y,vx,vy){if(opt.lsDbg){const ln=(new Error().stack.split('\n')[2]||'').match(/:(\d+):/);const k='L'+(ln?ln[1]:'?')+(F(possS??0,x)<35?'D':'');const D=st.dbg||(st.dbg={});D[k]=(D[k]||0)+1}ball.own=null;ball.fl=null;const e=Math.min(y,W-y);
    if(r()<CFG.outP*clamp(1-e/18,0,1)){vy=(y<W/2?-1:1)*(10+r()*6);vx=(vx||0)+(r()-.5)*6}
    ball.lo={vx:vx||0,vy:vy||0,t0:st.sec};ball.x=x;ball.y=y;ball.h=0}
  // ---- 재시작(세트피스·스로인·골킥·킥오프) ----
  function restart(k,s,x,y,extra){{const D=st.dbg||(st.dbg={});D['rs_'+k]=(D['rs_'+k]||0)+1;if(opt.rsDbg){const ln=(new Error().stack.split('\n')[2]||'').match(/:(\d+):/);const kk='rsl_'+k+'_'+(ln?ln[1]:'?');D[kk]=(D[kk]||0)+1}}ball.own=null;ball.fl=null;ball.lo=null;ball.x=clamp(x,0,L);ball.y=clamp(y,0,W);ball.h=0;endPoss();possS=s;
    const wait=(CFG.rsWaitReal?{throw:14,gk:26,corner:27,fk:26,fkd:35,kick:34,pen:60,free:23}:{throw:24,gk:38,corner:48,fk:42,fkd:60,kick:80,pen:70,free:32})[k]||16;/* 실측 SB 재개 전 정지 시간 평균(스로인 14·골킥 26·코너 27·프리킥 26·킥오프 34초) */ball.rs=Object.assign({k,s,x:ball.x,y:ball.y,t:wait},extra||{});
    // 키커 지정
    const cands=P[s].filter(a=>!st.hurt[a.p.id]||true);let tk=null;
    if(k==='gk')tk=P[s][0];else if(k==='kick')tk=P[s].slice(1).sort((a,b)=>hyp(a.x-52.5,a.y-34)-hyp(b.x-52.5,b.y-34))[0];
    else if(k==='corner'||k==='fk'||k==='fkd'||k==='pen')tk=extra&&extra.taker?P[s].find(a=>a.p.id===extra.taker.id):null;
    if(k==='throw'&&CFG.sp2&&F(s,ball.x)>72){const c=spCfg(s);if(c.longThrow&&r()<.75){const th=(c.thrower&&P[s].find(a=>a.p.id===c.thrower))||P[s].filter(a=>!a.gk).sort((a,b)=>V(b.p,'str',10)-V(a.p,'str',10))[0];if(th){tk=th;ball.rs.longT=1;ball.rs.t=wait+16}}}
    if(!tk)tk=cands.filter(a=>!a.gk).sort((a,b)=>hyp(a.x-ball.x,a.y-ball.y)-hyp(b.x-ball.x,b.y-ball.y))[0];
    ball.rs.tk=tk}
  // ---- 사건 기록 보조 ----
  const pr=p=>st.pr[p.id]||(st.pr[p.id]=NPS());
  function duelRec(att,def,s,win,lane,air){const k=att.p.id+(air?'^':'>')+def.p.id;const d=st.duels[k]=st.duels[k]||{a:att.p.name,d:def.p.name,w:0,l:0,lane,s,air:air?1:undefined};if(win)d.w++;else d.l++}
  // ---- 카드·부상·파울(E3 근거 유지) ----
  function card(s,p){const c=st.cards[p.id]=(st.cards[p.id]||0)+1;if(c===1){ev({s,t:'yellow',p:p.name,pid:p.id});pr(p).r-=RW.yel}
    else if(c===2){ev({s,t:'red',p:p.name,pid:p.id,dr:st._dr?1:0});pr(p).r-=1.5;const i=T[s].xi.findIndex(q=>q.id===p.id);if(i>0){T[s].xi.splice(i,1);T[s].roles&&T[s].roles.splice(i,1);T[s].duties&&T[s].duties.splice(i,1);T[s].sentOff=(T[s].sentOff||0)+1;sync(s);if(hooks.onRed)hooks.onRed(s,p)}}}
  function injure(s,p,why){if(!p||st.hurt[p.id])return;st.hurt[p.id]=1;EF[s]={};st.inj.push({s,id:p.id,m:st.min,why});ev({s,t:'injury',p:p.name,pid:p.id,why});
    if(hooks.onInjury&&hooks.onInjury(s,p))return;const b=T[s].bench;if(b&&b.length&&st.subs[s].length<5){const c=b.filter(q=>!st.pr[q.id]).sort((a,x)=>((x.g===p.g)*20+x.ovr)-((a.g===p.g)*20+a.ovr))[0];if(c)api.sub(s,p.id,c)}}
  const aggr=a=>a.fl&&a.fl.aggr?1:0;
  function foul(att,def,how){ // att(공격 팀)이 def에게 파울 당함
    if(rec)(st.tg||(st.tg=[])).push(['fo',def.p.id,att.p.id]);
    const s=att.s,o=def.s;st.fouls[o]++;pr(def.p).r-=RW.foul;pr(def.p).fc++;pr(att.p).fd++;const fx=F(s,att.x),fy=Lt(s,att.y),row=fx>70?0:fx>35?1:2;
    const pC=clamp(CFG.cardPerFoul*(1+aggr(def)*.4)*(1+(12-attr(def.p,'tackle',o))*.05)*(row===0?1.3:row===2?.85:1),.04,.5);if(r()<CFG.redD*(1+aggr(def)*.4)*(row===0?1.5:1)){st.cards[def.p.id]=1;st._dr=1;card(o,def.p);st._dr=0}else if(r()<pC*(st.cards[def.p.id]?CFG.ylC:1))card(o,def.p);
    const pI=clamp(.012*(1+aggr(def)*.6)*(1+(V(def.p,'str',10)-V(att.p,'str',10))*.03)*(1+(V(att.p,'inj',8)-8)*.04),.002,.05);if(r()<pI)injure(s,att.p,'foul');
    ev({s,t:'foul',p:att.p.name,d:def.p.name,how});
    const inBox=fx>=88.5&&fy>=13.8&&fy<=54.2;
    if(inBox&&r()<CFG.boxPen){TR({k:'sp',kind:'pen',p:att.p.name});return setPen(s)}
    /* 프리킥 상황: 직접 가능(fn: 80m+ 중앙) / 측면(fw: 70m+ 측면) / 중·장거리(ff: 58m+ 중앙권) */
    {const side=fy<34?'L':'R';const sit=fx>=80&&Math.abs(fy-34)<=16?'fn'+side:fx>=70&&Math.abs(fy-34)>16?'fw'+side:fx>=58?'ff'+side:null;
     if(sit&&CFG.sp2){const c=spCfg(s,sit),fm=c.fkMode;if(fm==='short'){restart('free',s,att.x,att.y);return}
       if(sit.slice(0,2)==='fn'&&hooks.wantDec&&hooks.wantDec('fk',s)){const tp0=c.taker&&P[s].find(a=>a.p.id===c.taker);const tk0=tp0||kicker(s,'fk',fy<22?'L':fy>46?'R':'C');st.pendingDec={k:'fk',s,x:att.x,y:att.y,sit,lane:laneOfFy(fy),tk:(tk0.p||tk0),info:{d:+hyp(L-fx,34-fy).toFixed(1),ang:+Math.abs(fy-34).toFixed(1)}};ball.own=null;ball.fl=null;ball.lo=null;endPoss();return}const lane=laneOfFy(fy);const kind=sit.slice(0,2);let direct=false,cross=true;
       if(kind==='fn'){direct=fm==='shot'?r()<.95:fm==='cross'?false:r()<CFG.fkDirect*1.4}
       else if(kind==='fw'){cross=fm==='cross'?true:r()<.85}
       else{cross=fm==='cross'?true:r()<CFG.ffX}
       if(!direct&&!cross){restart('free',s,att.x,att.y);return}
       const tp=c.taker&&P[s].find(a=>a.p.id===c.taker);const tk=tp||kicker(s,'fk',fy<22?'L':fy>46?'R':'C');restart(direct?'fkd':'fk',s,att.x,att.y,{taker:tk.p||tk,lane,sit});return}}
    if(fx>=76&&!inBox){const fm=CFG.sp2?spCfg(s).fkMode:'auto';if(fm==='short'){restart('free',s,att.x,att.y);return}const lane=laneOfFy(fy);const inR=fx>=80&&fy>18&&fy<50;const direct=inR&&(fm==='shot'?r()<.9:fm==='cross'?false:r()<CFG.fkDirect*1.4);const tk=kicker(s,'fk',fy<22?'L':fy>46?'R':'C');restart(direct?'fkd':'fk',s,att.x,att.y,{taker:tk.p||tk,lane});return}
    restart('free',s,att.x,att.y)}
  // ---- 세트피스 키커 ----
  const footSide=p=>p.foot==='right'?'R':p.foot==='left'?'L':'B';
  /* 반대발(인버티드): 측면 쪽과 주발이 반대(오른쪽 측면의 왼발잡이 등) */
  const invF=(p,fy)=>{const fs=footSide(p);return fs!=='B'&&fs!==(fy<34?'L':'R')};
  const swing=(p,side)=>{const fs=footSide(p);if(side==='C'||fs==='B')return 'n';return fs!==side?'in':'out'};
  function kicker(s,kind,side){const t=T[s];const key=kind==='corner'&&side&&side!=='C'?'corner'+side:kind;const id=t.setp&&(t.setp[key]||t.setp[kind]);const p=id&&t.xi.find(q=>q.id===id);if(p)return P[s].find(a=>a.p===p)||P[s][1];
    const f={corner:q=>(q.cross*.5+V(q,'fk',10)*.5)*(swing(q,side)==='in'?1.06:1),fk:q=>V(q,'fk',10)*(swing(q,side)==='in'?1.08:1),pen:q=>V(q,'pen',10)*.7+V(q,'comp',12)*.3}[kind];
    return P[s].filter(a=>!a.gk).sort((a,b)=>f(b.p)-f(a.p))[0]}
  // 수비 밀도 반영 위치 가치: 그 지점보다 골문 쪽에 있는 상대(골문까지 통로 안) 수만큼 할인
  function goalSide(s,fx,fy,excl){let n=0;const o=1-s;for(const b of P[o]){if(b.gk||b===excl)continue;const bfx=F(s,b.x);if(bfx<=fx-.5||bfx>fx+18)continue;const bfy=Lt(s,b.y);const k=(bfx-fx)/Math.max(1,L-fx);const cy=fy+(34-fy)*k;if(Math.abs(bfy-cy)<4+ (bfx-fx)*.25)n++}return n}
  const Vd=(s,fx,fy,excl)=>{const v=Vv(fx,fy);if(fx<55)return v;const n=goalSide(s,fx,fy,excl);return v*Math.exp(-CFG.dens*n)+(n===0?CFG.brk*clamp((fx-55)/40,0,1):0)};
  // ---- 슈팅 ----
  /* 슈팅 xG v2: StatsBomb 360 오픈플레이 슈팅 1,655개로 학습(위치 기하 + 가장 가까운 수비 거리 + 슈팅 삼각형 안 수비 수 + 헤더) */
  function shotXG(a,fx,fy,nd,type){if(CFG.xgNoGK){let m=99;for(const b of P[1-a.s]){if(b.gk)continue;const d=hyp(b.x-a.x,b.y-a.y);if(d<m)m=d}nd=m}if(CFG.xgV2){const g=clamp(xgGeo(fx,fy),.001,.999);let cn=0;for(const b of P[1-a.s]){if(b.gk)continue;const x=F(a.s,b.x);if(x<=fx)continue;const k=(x-fx)/Math.max(1e-6,L-fx),y=Lt(a.s,b.y),lo=fy+(30.34-fy)*k,hi=fy+(37.66-fy)*k;if(y>=lo-.5&&y<=hi+.5)cn++}
      const z=CFG.xg0+.75*Math.log(g/(1-g))-(nd<1?.531:nd<2?.4:nd<3.5?.149:0)-((CFG.cnA??.264)*Math.min(cn,1)+(CFG.cnB??.264)*clamp(cn-1,0,2))*(CFG.cnD?clamp((25-hyp(L-fx,34-fy))/13,CFG.cnD,1):1)-(type==='header'?.984:0);return clamp(sig(z),.01,.8)}
    let x=xgGeo(fx,fy);x*=nd<1?.6:nd<2?.78:nd<3.5?.9:1.05;x*=Math.exp(-CFG.densS*goalSide(a.s,fx,fy));
    if(type==='header')x*=.55;return clamp(x,.01,.8)}
  function gkOf(o){return P[o][0]}
  function shoot(a,type,xg,assist){if(CFG.sbTrk&&type!=='pen'&&type!=='fk'){const D=st.dbg||(st.dbg={});const sp=cur&&cur.tr&&cur.tr.some(x=>x.k==='sp');if(!sp){const k=(type==='header'||type==='lowcross')?'cross':(assist&&st.lpB&&st.lpB.m===a&&st.sec-st.lpB.t<6)?(st.lpB.b?'behind':'other'):'none';D['sH_'+k]=(D['sH_'+k]||0)+1;D['sHx_'+k]=(D['sHx_'+k]||0)+xg;D['sH_'+k+'_'+type]=(D['sH_'+k+'_'+type]||0)+1}}if(st.sbTrk&&st.sbTrk.a===a){const D=st.dbg||(st.dbg={});const k='sF_'+st.sbTrk.z+'_'+(st.sec-st.sbTrk.t>8?'late':'shot');D[k]=(D[k]||0)+1;if(st.sec-st.sbTrk.t<=8){D.sXg=(D.sXg||0)+xg}st.sbTrk=null}if(st.thrTrk&&st.thrTrk.a===a){const D=st.dbg||(st.dbg={});const k='tF_'+st.thrTrk.z+'_'+(st.sec-st.thrTrk.t>8?'late':'shot');D[k]=(D[k]||0)+1;st.thrTrk=null}if(a.sh5){const D=st.dbg||(st.dbg={});const s=a.s,o=1-s;const g0=st.sc[s],b0=st.blk[o],t0=st.sot[s];const r_=shoot_(a,type,xg,assist);D.r5g=(D.r5g||0)+(st.sc[s]>g0?1:0);D.r5b=(D.r5b||0)+(st.blk[o]>b0?1:0);D.r5on=(D.r5on||0)+(st.sot[s]>t0?1:0);return r_}return shoot_(a,type,xg,assist)}
  function shoot_(a,type,xg,assist){if(opt.shotLog){const b0=st.blk[1-a.s],g0=st.sc[a.s],n0=(st.shl||[]).length;const r_=shoot0(a,type,xg,assist);const e=st.shl&&st.shl[n0];if(e){e[10]=st.sc[a.s]>g0?'goal':st.blk[1-a.s]>b0?'block':'other'}return r_}return shoot0(a,type,xg,assist)}
  /* v169 표시용 xG 배율: 엔진 xG 모델이 실제 골보다 낮게 나와(리그 득점/xG 1.10) 기록·화면 xG만 ×XGD — 판정에는 영향 없음 */
  function shoot0(a,type,xg,assist){const s=a.s,o=1-s,p=a.p,gk=gkOf(o);const sh5=a.sh5;a.sh5=null;if(sh5){const D=st.dbg||(st.dbg={});D.m5xg=(D.m5xg||0)+sh5.xg;D.m5n=(D.m5n||0)+1;D.m5pb=(D.m5pb||0)+sh5.pBlock;D.m5on=(D.m5on||0)+(1-sh5.pBlock)*sh5.pOn;const g0=st.sc[s],b0=st.blk[o],t0=st.sot[s];st.after5=()=>{};queueMicrotask?0:0;D._pend=[s,g0,b0,t0]}const fx=F(s,a.x),fy=Lt(s,a.y);if(opt.hlLog&&cur&&cur.hl&&cur.s===s){cur.hl[3]=1;cur.hl[18]=(cur.hl[18]||0)+xg;(cur.hl[12]||(cur.hl[12]=[])).push(type+(fx<L-18?'_far':''))}if(opt.hlLog&&type==='through'){const [nd1]=nearestOpp(a);(st.thS||(st.thS=[])).push([+fx.toFixed(1),+fy.toFixed(1),+xg.toFixed(3),+nd1.toFixed(1),+(st.sec-a.recvAt).toFixed(1)])}if(opt.hlLog&&st.tbS===s&&st.sec-st.tbT<8){const D=st.dbg||(st.dbg={});D.tbShot=(D.tbShot||0)+1;D['tbS_'+s]=(D['tbS_'+s]||0)+1;st.tbS=-1;if(st.tbL&&st.tbL.length)st.tbL[st.tbL.length-1][4]=1}if(opt.shotLog){let nd2=99,nb=0;for(const b of P[o]){if(b.gk)continue;const d=hyp(b.x-a.x,b.y-a.y);if(d<nd2)nd2=d;const bx=F(s,b.x),by=Lt(s,b.y);if(bx>L-16.5&&Math.abs(by-34)<20.16)nb++}let na=0;for(const b of P[s]){const bx=F(s,b.x),by=Lt(s,b.y);if(bx>L-16.5&&Math.abs(by-34)<20.16)na++}let cn=0;for(const b of P[o]){if(b.gk)continue;const x=F(s,b.x);if(x<=fx)continue;const k=(x-fx)/Math.max(1e-6,L-fx),y=Lt(s,b.y),lo=fy+(30.34-fy)*k,hi=fy+(37.66-fy)*k;if(y>=lo&&y<=hi)cn++}(st.shl||(st.shl=[])).push([fx,fy,type,xg,p.name,nd2,nb,na,cur&&cur.counter?1:0,cur?cur.tr.length:0,null,cn,(a.lastBeat&&st.sec-a.lastBeat<3)?'takeon':a.carried?'carry':(a.how5==='second'||a.how5==='regain')?'loose':(a.recvKind||'pass'),+(st.sec-(a.recvAt||st.sec)).toFixed(1),+(a.rcvD||0).toFixed(1)])}
    if(fx<L-20&&type!=='fk'&&type!=='pen'&&type!=='header')type='longshot';
    const ty=type==='header'?(cur&&cur.tr.some(x=>x.k==='sp')?'corner':'cross'):type;
    TR({k:'shot',p:p.name,type:ty,xg:+(xg*XGD).toFixed(2)});st.xg[s]+=xg*XGD;st.sh[s]++;pr(p).sh++;pr(p).xg+=xg*XGD;if(assist&&assist!==a){pr(assist.p).xa+=xg;/* v237 빅찬스 메이킹: 도움 패스로 만들어진 '빅 찬스' 슈팅. Opta 빅 찬스는 정성 판정이라 표시 xG 기준으로 근사 — 엔진 xG 분포에서 0.15 이상이 팀·경기당 약 2.2회(EPL 상위 팀 빅 찬스 생성 경기당 2.2~3.0, Opta/football365 24-25)라 0.15 */if(xg*XGD>=(CFG.bcX??.15))pr(assist.p).bc=(pr(assist.p).bc||0)+1}if(cur&&cur.counter){st.trSh++;st.trXg+=xg*XGD;(st.trS||(st.trS=[0,0]))[s]++;(st.trX||(st.trX=[0,0]))[s]+=xg}
    if(type!=='pen'){st.ref.ns++;st.ref.sh+=attr(p,'shoot',s)}
    const gx=F(s,L),gy=34+(r()-.5)*6;
    // (1) 블록: 슈팅 길 위 수비수 위치
    let keep=1,blocker=null,bp=0;if(type!=='pen'&&type!=='fk'){const dx=gx-a.x,dy=34-a.y,d2=dx*dx+dy*dy;
      for(const b of P[o]){if(b.gk)continue;const t=((b.x-a.x)*dx+(b.y-a.y)*dy)/d2;if(t<=.02||t>=1)continue;const along=Math.sqrt(d2)*t;if(along>14)continue;const px=a.x+dx*t,py=a.y+dy*t,dp=hyp(b.x-px,b.y-py);const w=1.1+along*.05;if(dp>w)continue;
        const q=.42*CFG.blkK*(1-dp/w)*(.85+attr(b.p,'posit',o)*.012)*(along<1.5?.7:1);keep*=1-q;if(q>bp){bp=q;blocker=b}}}
    let pB=Math.min(.6,1-keep);if(sh5&&CFG.d5){pB=sh5.pBlock;if(!blocker){let bd=99;for(const b of P[o]){if(b.gk)continue;const x=F(s,b.x);if(x<=fx)continue;const k=(x-fx)/Math.max(1e-6,L-fx),y=Lt(s,b.y),lo=fy+(30.34-fy)*k,hi=fy+(37.66-fy)*k;if(y>=lo-.5&&y<=hi+.5){const d=hyp(b.x-a.x,b.y-a.y);if(d<bd){bd=d;blocker=b}}}}if(!blocker){let bd=6;for(const b of P[o]){if(b.gk)continue;if(F(s,b.x)<=fx-.5)continue;const d=hyp(b.x-a.x,b.y-a.y);if(d<bd){bd=d;blocker=b}}if(!blocker)pB*=.3}}
    if(r()<pB&&blocker){st.blk[o]++;pr(blocker.p).r+=RW.blk;if(rec)(st.tg||(st.tg=[])).push(['bk',blocker.p.id,a.p.id]);ev({s,t:'block',p:p.name,d:blocker.p.name,type:ty,lane:(cur&&cur.lane!=null&&CFG.laneAtk?cur.lane:laneOfFy(fy)),sl:laneOfFy(fy)});flight(a.x,a.y,blocker.x,blocker.y,.25,0);
      const x=r();if(x<CFG.blkCorner){ball.last=o;const rv=setCorner(s,fy<34?'L':'R');deflOut(blocker.x,blocker.y,s?-1.5:L+1.5,clamp(blocker.y+(blocker.y<34?-1:1)*(5+r()*9),1,W-1),.35);return rv}
      const ang=Math.atan2(a.y-blocker.y,a.x-blocker.x)+(r()-.5)*2;loose(blocker.x,blocker.y,Math.cos(ang)*7,Math.sin(ang)*7);ball.last=o;return 'block'}
    // (2) 유효슈팅
    const weak=type!=='pen'&&type!=='fk'&&footSide(p)!=='B'&&r()<(fy<22||fy>46?(footSide(p)===(fy<34?'L':'R')?.45:.15):.3);
    const baseOn=.46+(ONT[ty]||0);
    const onT=type==='pen'?r()<.93:(sh5&&CFG.d5)?r()<clamp(sig(Math.log(sh5.pOn/(1-sh5.pOn))+ab5(a,'shoot',CFG.d5OnK))*(weak?wfMul(p):1),.08,.95):r()<clamp(baseOn+(attr(p,'shoot',s)-CFG.refShoot)*.012,.15,.85)*(weak?wfMul(p):1.05)*(1+TVc(a,'정확한 슈팅','shoot')*CFG.trSoT);
    if(!onT){pr(p).r-=xg>=.3?RW.bigMiss:RW.miss;ev({s,t:'miss',p:p.name,type:ty,lane:(cur&&cur.lane!=null&&CFG.laneAtk?cur.lane:laneOfFy(fy)),sl:laneOfFy(fy),weak,xg:+(xg*XGD).toFixed(2)});flight(a.x,a.y,gx+(s?-2:2),34+(r()<.5?-6:6)*(1+r()*.5),.6,type==='longshot'?.6:.2);ball.last=s;
      if(type!=='pen'&&type!=='fk'&&r()<CFG.missCorner){ball.last=o;return setCorner(s,fy<34?'L':'R')}restartLater('gk',o,F(o,5.5),34);return 'miss'}
    st.sot[s]++;pr(p).so++;pr(p).r+=RW.sot;{const D=st.dbg||(st.dbg={});D.sotN=(D.sotN||0)+1}
    let sv=type==='through'?attr(gk.p,'gk_save',o)*.6+attr(gk.p,'gk_sweep',o)*.4:type==='header'?attr(gk.p,'gk_save',o)*.7+attr(gk.p,'gk_air',o)*.3:attr(gk.p,'gk_save',o);
    /* v195 스위퍼 성향 대가: 적극=1대1(스루) 선방↑·먼 거리 슈팅 선방↓(앞으로 나와 있음), 자제=반대 */{const g=T[o].pi?T[o].pi(gk.p,'gks'):1;if(g!==1){const k=CFG.gksSv[g===2?0:1];sv+=type==='through'?k[0]:type==='longshot'?k[1]:0}}
    let pG;const cp=V(p,'comp',12)*eff(p,s);
    if(type==='pen')pG=clamp(.8+(V(p,'pen',12)-13)*.012+(cp-13)*.008-(sv-13)*.01,.55,.93);
    else if(sh5&&CFG.d5){pG=clamp(sig(Math.log(sh5.pGoal/(1-sh5.pGoal))+ab5(a,'shoot',CFG.d5FinK)+ab5(a,'comp',CFG.d5FinK*.5)-(sv-13.5)*CFG.d5GkK)*CFG.finK5,.02,.95);st.ref.n++;st.ref.sv+=sv;st.ref.cp+=cp}
    else{pG=xg/((1-pB)*baseOn)*(1-(sv-CFG.refSave)*.03)*(1+(cp-CFG.refComp)*.02*(xg>.2?1.6:1));st.ref.n++;st.ref.sv+=sv;st.ref.cp+=cp;
      if(st.min>75&&Math.abs(st.sc[0]-st.sc[1])<=1)pG*=1+(cp-CFG.refComp)*.012;pG=clamp(pG*CFG.finK*(1+TVc(a,'결정력','shoot')*CFG.trFin)*gapF(s)*Math.max(.5,1+(V(p,'shoot',10)-(CFG.finC??13))*(CFG.finS??0)),.03,.92)}
    {const D=st.dbg||(st.dbg={});D.pgSum=(D.pgSum||0)+pG;D.pgN=(D.pgN||0)+1;if(sh5){D.pgM=(D.pgM||0)+sh5.pGoal;D.onM=(D.onM||0)+sh5.pOn;D.onN=(D.onN||0)+1}}if(r()<pG){st.sc[s]++;pr(p).g++;pr(p).r+=RW.goal[Math.min(3,pr(p).g-1)];if(assist&&assist!==a){pr(assist.p).a++;pr(assist.p).r+=RW.ast;pr(assist.p).kp++}pr(gk.p).r-=RW.gkCon*(1.2-Math.min(1,xg*1.5));st.mom=s===0?.6:-.6;
      (cur&&cur.counter?((st.trG||(st.trG=[0,0]))[s]++):0),ev({s,t:'goal',p:p.name,pid:p.id,a:assist&&assist!==a?assist.p.name:null,type:ty,lane:(cur&&cur.lane!=null&&CFG.laneAtk?cur.lane:laneOfFy(fy)),sl:laneOfFy(fy),xg:+(xg*XGD).toFixed(2),sc:[...st.sc],weak});flight(a.x,a.y,gx+(s?-1:1),gy,.5,type==='header'?.4:.15);
      restartLater('kick',o,52.5,34,true);return 'goal'}
    pr(gk.p).r+=RW.save+xg*RW.saveX;pr(gk.p).sv++;ev({s,t:'save',p:p.name,gk:gk.p.name,type:ty,lane:(cur&&cur.lane!=null&&CFG.laneAtk?cur.lane:laneOfFy(fy)),sl:laneOfFy(fy),xg:+(xg*XGD).toFixed(2),weak});
    const sx=gx+(s?1.2:-1.2);flight(a.x,a.y,sx,gy,.45,.2);
    if(type==='pen'){restartLater('gk',o,F(o,5.5),34);return 'save'}
    const x=r();if(x<CFG.saveCorner){ball.last=o;const rv=setCorner(s,gy<34?'L':'R',.5);deflOut(sx,gy,gx+(s?-1.5:1.5),clamp(gy+(gy<34?-1:1)*(3+r()*5),1,W-1),.9);return rv}
    if(x<CFG.saveCorner+CFG.rebound&&attr(gk.p,'gk_save',o)<r()*20+4){ev({s,t:'rebound',p:p.name});{const ol=offLine(s);st.offRb={s,t:st.sec,set:new Set(P[s].filter(q=>q!==a&&!q.gk&&F(s,q.x)>ol+.3))}}st.after=()=>loose(F(s,L-6-r()*5),34+(r()-.5)*14,0,0);return 'save'}
    st.after=()=>give(gk,'regain',CFG.d5GkHold?gkHold('save',gk):1.2);return 'save'}
  // 연출용 공 이동(결과는 이미 결정): 짧은 시간 동안 다른 판정 없음
  /* v162 막힘·선방 뒤 코너: 0.5초 단위 기록에서 공이 수비수/골키퍼에 닿는 모습 없이 바로 코너로 순간이동하던 것 → 맞은 지점에서 골라인 밖으로 굴절되는 비행을 한 번 더 보여준 뒤 코너 재개 */
  function deflOut(x0,y0,x1,y1,h){const fin=st.after;st.after=()=>{flight(x0,y0,x1,y1,.6,h);st.after=fin}}
  function flight(x0,y0,x1,y1,dur,h){ball.own=null;ball.lo=null;ball.fl={x0,y0,x1,y1,t:0,T:dur,h:h||0,show:1}}
  function restartLater(k,s,x,y,kick){st.after=()=>{if(kick)[0,1].forEach(q=>P[q].forEach(a=>{a.run=0;a.stun=0}));restart(k,s,x,y)}}
  function resolveDec(ch0){const d=st.pendingDec;st.pendingDec=null;if(!d)return;const ch=ch0||d.ch||null;let fo=null,pn=null;if(d.k==='fk'){let k2;if(ch==='shot')k2='fkd';else if(ch==='cross')k2='fk';else if(ch==='short')k2='free';else k2=r()<CFG.fkDirect*1.4?'fkd':'fk';if(k2==='free')restart('free',d.s,d.x,d.y);else restart(k2,d.s,d.x,d.y,{taker:d.tk,lane:d.lane,sit:d.sit})}else if(d.k==='corner'){const m={cc:{ty:'auto2',t:'center'},cn:{ty:'auto2',t:'near'},cs:{ty:'short'}}[ch];if(m)st.cornOv=Object.assign({s:d.s},m)}else if(d.k==='def'){const at=P[1-d.s].find(q=>q.p.id===d.atk),df=P[d.s].find(q=>q.p.id===d.aid);if(df)pn=df.p.name;let res='T';if(ch&&df){fo=decFol(df,ch);if(r()<fo.p){fo.ok=1;res=DEF_M[ch][d.intent]}else fo.ok=0;(st.defH||(st.defH=[])).push(ch)}if(at)at.defI={intent:d.intent,res,b:d.aid,t:st.sec+6};d.res=res}else if(d.k==='wide'||d.k==='box'||d.k==='cross'){const a=P[d.s].find(q=>q.p.id===d.aid);if(a){pn=a.p.name}if(a&&ch){fo=decFol(a,ch);if(r()<fo.p){a.decB=ch;a.decF=1;a.decG=d.good?1:0;a.decN=null;(st.decTmA||(st.decTmA=[]))[d.s]={s:d.s,o:ch,until:st.sec+CFG.decDur}}else{a.decN=ch;a.decB=null;a.decF=0;a.decG=0}a.decT=st.sec+6;fo.ok=a.decF?1:0}}ev({s:d.s,t:'dec',k:d.k,ch:ch||'auto',auto:!ch,pn,intent:d.intent||null,res:d.res||null,fol:fo?fo.ok:null,fp:fo?+fo.p.toFixed(3):null,why:fo?fo.why:null,good:d.good?1:0})}/* v252 지시 이행 판정(에이전트 합의안): 기본 .73, 프로의식 ±.10, 컨디션 ±.05, 평소 성향 ±.08, 길 막힘 −.15, .60~.88 */function decOK(b,c,fx,fy){if(b==='bpass')return c.tfx>=fx-14&&hyp(L-c.tfx,34-c.tfy)<hyp(L-fx,34-fy)+2&&Math.abs(c.tfy-34)<14;if(b==='low')return c.tfx>88.5&&Math.abs(c.tfy-34)<20.16;if(b==='high')return c.tfx>88.5&&Math.abs(c.tfy-34)<20.16;if(b==='bshot'||b==='bdrib'||b==='carry')return false;return b==='switch'?(Math.abs(c.tfy-fy)>25&&c.d>=25):b==='inside'?(Math.abs(c.tfy-34)<Math.abs(fy-34)-8&&c.tfx>=fx-8):(c.tfx>=88.5&&Math.abs(c.tfy-34)<20.16)}function decFol(a,ch){const s=a.s,fx=F(s,a.x),fy=Lt(s,a.y);let p=CFG.decF0;const why=[];const dp=clamp((V(a.p,'pro',12)-12)/6,-1,1)*.10;p+=dp;if(dp<=-.04)why.push('pro');const dm=clamp((V(a.p,'cond',2)-2)/2,-1,1)*.05;p+=dm;if(dm<0)why.push('cond');const hb=a.p.hab,lg=i=>hb&&hb[i]>0?clamp(Math.log(hb[i])/Math.log(2),-1,1):null;let tm;if(ch==='tackle'){tm=clamp((V(a.p,'tackle',10)-12)/6,-1,1)}else if(ch==='follow'||ch==='block'){tm=clamp((V(a.p,'posit',10)-12)/6,-1,1)}else if(ch==='bshot'){const u=lg(1);tm=u!=null?u:clamp((V(a.p,'shoot',10)-12)/6,-1,1)}else if(ch==='bdrib'||ch==='carry'){const u=lg(0),v=lg(5);tm=u!=null?Math.max(u,v!=null?v:-1):clamp((V(a.p,'drib',10)-12)/6,-1,1)}else if(ch==='high'){const u=lg(2);tm=u!=null?u:clamp((V(a.p,'cross',10)-12)/6,-1,1)}else if(ch==='wide'){const u=lg(0),v=lg(2);tm=u!=null?Math.max(u,v):clamp((Math.max(V(a.p,'cross',10),V(a.p,'drib',10))-12)/6,-1,1)}else if(ch==='inside'){const u=lg(4);tm=u!=null?u:clamp((V(a.p,'pass',10)-12)/6,-1,1)}else tm=clamp((V(a.p,'pass',10)-12)/6,-1,1);p+=tm*.08;if(tm<-.4)why.push('tend');const oN=(x,y)=>{let m=99;for(const b of P[1-s]){const q=hyp(b.x-x,b.y-y);if(q<m)m=q}return m};let ok=false;if(ch==='follow'||ch==='tackle'||ch==='block'){ok=true}else if(ch==='bshot'||ch==='bdrib'||ch==='carry'){ok=ch==='bshot'?coneCount(s,fx,fy)<3:ch==='bdrib'?true:oN(F(s,Math.min(fx+5,L-9)),Lt(s,fy+(34-fy)*.5))>=2.5}else for(const m of P[s]){if(m===a||m.gk)continue;const c={tfx:F(s,m.x),tfy:Lt(s,m.y),d:hyp(m.x-a.x,m.y-a.y)};if(decOK(ch,c,fx,fy)&&oN(m.x,m.y)>=(ch==='switch'?5:ch==='inside'?3:2)){ok=true;break}}if(ch==='wide'&&!ok&&oN(a.x,a.y)>=4)ok=true;if(!ok){p-=.15;why.push('blk')}p=clamp(p,.60,.88);return {p,why:why.join(','),blk:!ok}}/* v251 승부처 감독 지시: 측면 공격 중 반대쪽이 빈 순간(우리 팀만, hooks.wantDec가 허락할 때만 → AI·워커 경기 영향 없음) */function decWide(a){if(!hooks.wantDec||a.gk||a.decB||(st.decCool||0)>st.sec)return false;const s=a.s,fx=F(s,a.x),fy=Lt(s,a.y);if(fx<66||fx>98||Math.abs(fy-34)<15)return false;let nd=99;for(const b of P[1-s]){const q=hyp(b.x-a.x,b.y-a.y);if(q<nd)nd=q}if(nd<2.5)return false;let best=0;for(const m of P[s]){if(m===a||m.gk)continue;if(Math.abs(Lt(s,m.y)-fy)<25)continue;let od=99;for(const b of P[1-s]){const q=hyp(b.x-m.x,b.y-m.y);if(q<od)od=q}if(od>best)best=od}if(best<8)return false;let bA=0,bD=0;for(const m of P[s]){if(m===a)continue;const x=F(s,m.x),y=Lt(s,m.y);if(x>88.5&&Math.abs(y-34)<20.16)bA++}for(const b of P[1-s]){if(b.gk)continue;const x=F(s,b.x),y=Lt(s,b.y);if(x>88.5&&Math.abs(y-34)<20.16)bD++}if(!hooks.wantDec('wide',s))return false;st.decCool=st.sec+90;st.pendingDec={k:'wide',s,aid:a.p.id,info:{far:+best.toFixed(1),bA,bD,nd:+nd.toFixed(1)}};a.cd=.3;return true}/* v253 승부처 장면 1단계: 박스 안(바로 슈팅·패스/컷백·돌파) · 크로스 위치(낮은 크로스/컷백·높은 크로스·안쪽 운반). 우리 팀만(hooks.wantDec), 판정 중 r() 사용 안 함 */function decScene(a){if(!hooks.wantDec||a.gk||a.decB||a.decN||(st.decCool||0)>st.sec)return false;if(st.sec-(a.recvAt||-9)>1.2)return false;const s=a.s,fx=F(s,a.x),fy=Lt(s,a.y);const inBox=fx>88.5&&Math.abs(fy-34)<20.16;const cz=!inBox&&fx>=84&&Math.abs(fy-34)>=16;const dist=hyp(L-fx,34-fy);if(!(inBox&&dist>=9)&&!cz)return false;let nd=99;for(const b of P[1-s]){const q=hyp(b.x-a.x,b.y-a.y);if(q<nd)nd=q}let bA=0,bD=0;for(const m of P[s]){if(m===a)continue;const x=F(s,m.x),y=Lt(s,m.y);if(x>88.5&&Math.abs(y-34)<20.16)bA++}for(const b of P[1-s]){if(b.gk)continue;const x=F(s,b.x),y=Lt(s,b.y);if(x>88.5&&Math.abs(y-34)<20.16)bD++}let mo=0;for(const m of P[s]){if(m===a||m.gk)continue;const x=F(s,m.x),y=Lt(s,m.y);if(x<84.5||Math.abs(y-34)>14)continue;let od=99;for(const b of P[1-s]){const q=hyp(b.x-m.x,b.y-m.y);if(q<od)od=q}if(od>mo)mo=od}if(inBox){if(nd<.8||!hooks.wantDec('box',s))return false;st.decCool=st.sec+60;st.pendingDec={k:'box',s,aid:a.p.id,info:{dist:+dist.toFixed(1),ang:+Math.abs(fy-34).toFixed(1),nd:+nd.toFixed(1),cone:coneCount(s,fx,fy),bA,bD,mo:+Math.min(mo,20).toFixed(1)}};a.cd=.3;return true}if(nd<1.5||!hooks.wantDec('cross',s))return false;st.decCool=st.sec+60;st.pendingDec={k:'cross',s,aid:a.p.id,info:{nd:+nd.toFixed(1),bA,bD,mo:+Math.min(mo,20).toFixed(1),fx:+fx.toFixed(1)}};a.cd=.3;return true}/* v254 수비 1대1 가위바위보: 상대 의도(돌파·패스·슈팅)를 엔진이 먼저 정해 숨기고, 우리 수비 선택(따라가기·태클·길목 차단)과 상성으로 승·무·패. 우리 팀이 수비할 때만(hooks.wantDec) */const DEF_M={follow:{drib:'W',pass:'L',shot:'T'},tackle:{drib:'L',pass:'T',shot:'W'},block:{drib:'T',pass:'W',shot:'L'}};function decDef(a){if(!hooks.wantDec||a.gk||a.defI||(st.decCool||0)>st.sec)return false;if(st.sec-(a.recvAt||-9)>1.2)return false;const s=a.s,d=1-s,fx=F(s,a.x),fy=Lt(s,a.y);const dist=hyp(L-fx,34-fy);if(fx<72||dist>32)return false;let b=null,bd=99;for(const q of P[d]){if(q.gk||q.stun>0)continue;const dd=hyp(q.x-a.x,q.y-a.y);if(dd<bd){bd=dd;b=q}}if(!b||bd>4.5||F(s,b.x)<fx-.5)return false;if(!hooks.wantDec('def',d))return false;const hb=a.p.hab,lg=i=>hb&&hb[i]>0?clamp(Math.log(hb[i])/Math.log(2),-1,1):0;let w=[CFG.defW[0]*Math.exp(.5*Math.max(lg(0),lg(5))),CFG.defW[1]*Math.exp(.5*lg(4)),CFG.defW[2]*Math.exp(.5*lg(1))*(dist<22?1.15:dist<27?.95:.75)];const H=st.defH||(st.defH=[]);if(H.length>=2&&H[H.length-1]===H[H.length-2]){const beat={follow:1,tackle:0,block:2}[H[H.length-1]];if(beat!=null)w[beat]*=1+CFG.defAd*Math.min(3,H.length)}const tw=w[0]+w[1]+w[2];const pr=w.map(x=>x/tw);let u=r(),ix=0;while(ix<2&&u>pr[ix]){u-=pr[ix];ix++}const intent=['drib','pass','shot'][ix];st.decCool=st.sec+60;st.pendingDec={k:'def',s:d,aid:b.p.id,atk:a.p.id,intent,info:{an:a.p.name,dn:b.p.name,dist:+dist.toFixed(1),pr:pr.map(x=>+x.toFixed(2))}};a.cd=.4;return true}function decOK2(b,ch,a){if(b==='bshot')return ch.k==='shot'?1:0;if(b==='bdrib')return (ch.k==='takeon'||a.decC)?1:0;if(b==='carry')return (a.decC||ch.k==='takeon')?1:0;if(b==='high'||b==='low')return ch.k==='cross'?1:0;return null}function setPen(s){ball.own=null;ball.fl=null;ball.lo=null;endPoss();if(hooks.wantPen&&hooks.wantPen(s)){st.pendingPen={s};return 'pen'}restart('pen',s,F(s,L-11),34,{taker:kicker(s,'pen').p});return 'pen'}
  function takePen(s,id){const tk=id?P[s].find(a=>a.p.id===id):kicker(s,'pen');st.pendingPen=null;const a=tk||kicker(s,'pen');a.x=F(s,L-12);a.y=34;ball.x=F(s,L-11);ball.y=34;
    beginPoss(s,a,'sp');cur.tr.push({k:'sp',kind:'pen',p:a.p.name});const e0=st.ev.length;ev({s,t:'penAward',p:a.p.name});shoot(a,'pen',XG.pen,null);const tr=cur?cur.tr:null;endPoss();return st.ev.slice(e0)}
  function setCorner(s,side,delay){st.corner[s]++;st.cornOv=null;const sd=side==='L'?'L':'R';const sit='c'+sd;const ct=CFG.sp2&&spCfg(s,sit).taker;const pt=ct&&P[s].find(a=>a.p.id===ct);const tk=pt||kicker(s,'corner',sd);st.after=()=>restart('corner',s,F(s,L),Lt(s,sd==='L'?.5:W-.5),{taker:tk.p,side:sd,sit});/* v255 코너킥 약속 플레이(우리 팀만, hooks.wantDec): 킥 전에 멈추고 감독이 중앙·니어·짧게 중 선택 → st.cornOv로 이번 킥만 설정 덮어씀 */if(hooks.wantDec&&hooks.wantDec('corner',s)){st.pendingDec={k:'corner',s,info:{side:sd,tk:tk.p.name}}}return 'corner'}

  /* ===== 세트피스 v2: 실측(StatsBomb 360·이벤트) 기반 배치·킥 종류·낙하지점·경합 ===== */
  function spCfg(s,sit){const sp=T[s].sp||{};const c=Object.assign({cType:'auto',cTarget:'auto',cAtk:5,stay:2,fkMode:'auto',longThrow:false,dMark:'mixed',posts:0,outlet:1,wall:4,taker:null},sp);const g=sp.g||{};['dMark','posts','outlet','wall','longThrow','thrower'].forEach(k=>{if(g[k]!=null)c[k]=g[k]});
    const x=sit&&sp[sit];if(x){if(x.type!=null)c.cType=x.type;if(x.mode!=null)c.fkMode=x.mode;if(x.target!=null)c.cTarget=x.target;if(x.atk!=null)c.cAtk=x.atk;if(x.stay!=null)c.stay=x.stay;c.taker=x.taker||null}if(st.cornOv&&st.cornOv.s===s&&sit&&sit[0]==='c'){if(st.cornOv.ty)c.cType=st.cornOv.ty;if(st.cornOv.t)c.cTarget=st.cornOv.t}return c}
  /* 공격팀 s 좌표계(상대 골 x=105). nsg: 가까운 포스트 쪽 y 부호 */
  const SP_A=n=>[[100.5,2.5],[94.5,1],[98,-4.5],[93,-2],[91,.5],[99.5,5.5],[103.3,0]].slice(0,n);
  const SP_Z={zonal:[[101,3],[101,0],[101,-3],[98,1.5],[98,-1.5],[94.5,0]],mixed:[[101,3],[101,0],[98.5,-2]],man:[[101,3]]};
  function spSetup(rs,kind){const s=rs.s,o=1-s,c=spCfg(s,rs.sit),cd=spCfg(o);const ly=Lt(s,rs.y);const nsg=kind==='fk'?(ly<34?-1:1):(ly<34?-1:1);
    const X=fx=>F(s,fx),Y=(fy0,off)=>Lt(s,clamp(34+nsg*off,1,W-1));
    const pool=P[s].filter(a=>!a.gk&&a!==rs.tk);const byAir=pool.slice().sort((a,b)=>airC(b.p,s)-airC(a.p,s));
    const nStay=clamp(c.stay,1,3),nAtk=clamp(c.cAtk,3,7);
    /* 남는 수비: 발 빠르고 공중볼 약한 수비수 우선 */
    const stayers=pool.filter(a=>a.g==='CB'||a.g==='FB'||a.g==='DM').sort((a,b)=>airC(a.p,s)-airC(b.p,s)+(V(b.p,'pace',10)-V(a.p,'pace',10))*.2).slice(0,nStay);
    const rest=byAir.filter(a=>!stayers.includes(a));const atk=rest.slice(0,nAtk),others=rest.slice(nAtk);
    const short=(c.cType==='short'||(c.cType==='auto'&&kind==='corner'&&r()<.17))&&others.length?others.shift():null;rs.short=short;
    const slots=SP_A(atk.length);atk.forEach((a,i)=>{a.tx=X(slots[i][0]);a.ty=Y(0,slots[i][1]);a.urg=.85;a.spSlot=i});
    others.forEach((a,i)=>{a.tx=X(84-(i>1?6:0));a.ty=Y(0,(i%2?1:-1)*(5+i*2));a.urg=.8});
    stayers.forEach((a,i)=>{a.tx=X(52+i*3);a.ty=Lt(s,34+(i-1)*12);a.urg=.7});
    /* 프리킥: 수비 라인을 올리고 공격수는 온사이드 위치에서 대기(오프사이드 적용) */
    const fkL=kind==='fk'?Math.max(clamp(92-(88-F(s,rs.x))*.33,85,93),F(s,rs.x)-1):null;rs.fkL=fkL;
    if(fkL!=null)atk.forEach((a,i)=>{a.tx=X(Math.min(slots[i][0],fkL-.7-(i%3)*.5));a.ty=Y(0,slots[i][1]*2.2)});
    if(short){short.tx=X(kind==='corner'?99:F(s,rs.x)+6);short.ty=Lt(s,kind==='corner'?(nsg<0?7:W-7):clamp(ly+6,3,W-3));short.urg=.9}
    /* 수비 */
    const D=P[o].filter(b=>!b.gk);const gk=P[o][0];gk.tx=X(104.3);gk.ty=Y(0,-.5);gk.urg=.9;
    const nOut=clamp(cd.outlet,0,2),nPost=fkL!=null?0:clamp(cd.posts,0,2);if(fkL!=null)gk.tx=X(102.5);const outl=D.slice().sort((a,b)=>(['ST','W'].includes(b.g)?1:0)-(['ST','W'].includes(a.g)?1:0)||V(b.p,'pace',10)-V(a.p,'pace',10)).slice(0,nOut);
    let left=D.filter(b=>!outl.includes(b));outl.forEach((b,i)=>{b.tx=X(60);b.ty=Lt(s,34+(i?8:-8));b.urg=.7});
    const posts=left.slice().sort((a,b)=>airC(a.p,o)-airC(b.p,o)).slice(0,nPost);left=left.filter(b=>!posts.includes(b));posts.forEach((b,i)=>{b.tx=X(104.6);b.ty=Y(0,i?-3.2:3.2);b.urg=.9});
    const zs=SP_Z[cd.dMark]||SP_Z.mixed;const byAirD=left.slice().sort((a,b)=>airC(b.p,o)-airC(a.p,o));
    const zon=byAirD.slice(0,Math.min(zs.length,byAirD.length));zon.forEach((b,i)=>{b.tx=X(fkL!=null?fkL+.4:zs[i][0]);b.ty=Y(0,zs[i][1]*(fkL!=null?2.5:1));b.urg=.9;b.spZ=1});
    let mk=byAirD.slice(zon.length);const tg=atk.slice().sort((a,b)=>airC(b.p,s)-airC(a.p,s));
    mk.forEach((b,i)=>{b.spZ=0;const a=tg[i];if(a&&i<tg.length){b.tx=a.tx+(s?-1:1)*.9;b.ty=a.ty+(a.ty<Lt(s,34)?.6:-.6);b.mk=a}else if(i===tg.length){b.tx=X(86);b.ty=Lt(s,34)}else{const e=others[i-tg.length-1];if(e){b.tx=e.tx+(s?-1:1)*1.2;b.ty=e.ty}else{b.tx=X(80);b.ty=Lt(s,34+(i%2?6:-6))}}b.urg=.9})}
  /* 낙하지점 구역 확률(실측: 6야드 30%·페널티스폿 부근 39%·박스 측면 17%·박스 밖 세컨볼) */
  function spLand(s,kind,sw,c){const w={near:.33,center:.42,far:.18,edge:.07};
    if(kind==='fk'){w.near=.2;w.center=.45;w.far=.25;w.edge=.1}
    if(sw==='in'){w.near+=.08;w.far-=.04}else if(sw==='out'){w.center+=.04;w.edge+=.03;w.near-=.07}else if(sw==='n'){w.near+=.05;w.edge-=.02}
    const tgt=c.cTarget;if(tgt&&tgt!=='auto'&&w[tgt]!=null)w[tgt]+=.7;let t=0;for(const k in w){w[k]=Math.max(.01,w[k]);t+=w[k]}let x=r()*t;for(const k in w){if((x-=w[k])<=0)return k}return 'center'}
  function spPoint(z,nsg){if(z==='near')return [100+r()*3.5,34+nsg*(1+r()*4.5)];if(z==='center')return [92+r()*4.5,34+(r()-.5)*7];if(z==='far')return [95.5+r()*5.5,34-nsg*(4+r()*5.5)];return [83+r()*5,34+(r()-.5)*12]}
  function spDeliver(s,tk,q,kind,sw,nsg,sit){const o=1-s,gk=gkOf(o),c=spCfg(s,sit),cd=spCfg(o);st.cross[s]++;/* v238 세트피스 크로스도 시도(cr)로 셈 — 이전엔 성공(crc)만 세서 코너 키커 크로스 성공률이 100%를 넘음 */if(tk&&kind!=='throw')pr(tk.p).cr++;if(CFG.laneAtk&&cur&&cur.s===s&&cur.lane==null)setLane(Lt(s,ball.y));
    const z=spLand(s,kind,sw,c);let [lx,ly]=spPoint(z,nsg);if(kind==='throw'){lx=clamp(lx-2,88,101)}
    let px=F(s,lx),py=Lt(s,ly);const qk=(q-12)*.012;
    /* GK 처리 */
    const pC=clamp((.05+(z==='near'?.12:z==='center'?.05:z==='far'?.03:0)+(sw==='in'&&z==='near'?.05:0))*(1+(attr(gk.p,'gk_air',o)-13)*.06)*CFG.spGK-qk,.005,.35);
    if(z!=='edge'&&r()<pC){TR({k:'claim',p:gk.p.name});pr(gk.p).r+=.06;ev({s,t:'claim',gk:gk.p.name,type:kind});flight(ball.x,ball.y,px,py,.9,1);st.after=()=>{gk.x=px;gk.y=py;give(gk,'regain',CFG.d5GkHold?gkHold('save',gk):1.5)};return 'claim'}
    /* 프리킥은 킥 순간 라인에서 뛰어들어감: 비행 중 이동거리만큼 당겨서 경합 판정 */
    const run=kind==='fk'?(a,k)=>{const d=hyp(a.x-px,a.y-py);return Math.max(0,d-k)}:a=>hyp(a.x-px,a.y-py);
    const A=P[s].filter(a=>!a.gk&&a!==tk&&run(a,7.5)<5.5),Dd=P[o].filter(b=>!b.gk&&run(b,6.5)<5.5);
    const near=A.slice().sort((a,b)=>run(a,7.5)-run(b,7.5)-(airC(b.p,s)-airC(a.p,s))*.15)[0];
    const dn=Dd.slice().sort((a,b)=>run(a,6.5)-run(b,6.5)-(airC(b.p,o)-airC(a.p,o))*.15)[0];
    /* v115 비행 중 도달 가능한 지점으로 낙하점 보정: 이전엔 경합 승자(near)를 착지 순간 낙하점으로 순간이동(최대 13m) → 리플레이에서 낮은 자세로 미끄러짐.
       이제 near가 비행 시간(1.2초) 동안 달려 닿는 곳으로 낙하점을 당기고, 경합자·주변 수비·공격수가 실제로 뛰어들어감 */
    if(near&&CFG.spReach){const T=kind==='throw'?1.1:1.2,rc=vmOf(near)*T*CFG.spReach,d0=hyp(near.x-px,near.y-py);if(d0>rc){const k=rc/d0;px=near.x+(px-near.x)*k;py=near.y+(py-near.y)*k;lx=F(s,px);ly=Lt(s,py)}
      near.tx=px;near.ty=py;near.urg=near.urg0=1;near.run=0;
      if(dn){const gx=F(o,0);const ux=gx-px,uy=34-py,ud=hyp(ux,uy)||1;dn.tx=px+ux/ud*.8;dn.ty=py+uy/ud*.8;dn.urg=dn.urg0=1}
      for(const a of P[s])if(a!==near&&a!==tk&&!a.gk&&hyp(a.x-px,a.y-py)<24){const ang=r()*6.283,rr=3+r()*6;a.tx=px+Math.cos(ang)*rr;a.ty=clamp(py+Math.sin(ang)*rr,2,W-2);a.urg=a.urg0=.95}
      for(const b of P[o])if(b!==dn&&!b.gk&&hyp(b.x-px,b.y-py)<26){let nb=null,nd=99;for(const a of P[s]){if(a.gk||a===tk)continue;const dd=hyp(a.tx-b.x,a.ty-b.y);if(dd<nd){nd=dd;nb=a}}const gx=F(o,0);
        if(nb&&nd<9){const ux=gx-nb.tx,uy=34-nb.ty,ud=hyp(ux,uy)||1;b.tx=nb.tx+ux/ud*1.1;b.ty=nb.ty+uy/ud*1.1}else{b.tx=b.x+(gx-b.x)*.18+(px-b.x)*.12;b.ty=b.y+(py-b.y)*.25}b.urg=b.urg0=.95}}
    if(kind==='fk'&&!CFG.spReach){A.concat(Dd).forEach(a=>{a.tx=px+(r()-.5)*3;a.ty=py+(r()-.5)*3;a.urg=1})}
    if(kind==='fk'){
      /* 오프사이드: 킥 순간 받는 선수 위치(+조기 침투 실수) */
      if(near&&(F(s,near.x)>offLine(s)+.3||r()<CFG.fkOff)){st.off[s]++;TR({k:'off',p:near.p.name});ev({s,t:'offside',p:near.p.name});flight(ball.x,ball.y,px,py,1.2,1);st.after=()=>restart('free',o,px,py);return 'off'}}
    flight(ball.x,ball.y,px,py,kind==='throw'?1.1:1.2,1);
    if(!near){/* 아무도 없음: 수비 처리 또는 흐른 공 */st.after=()=>{if(dn){dn.x=px;dn.y=py;clearSP(s,dn,px,py)}else loose(px,py,(r()-.5)*6,(r()-.5)*6)};return 'none'}
    const zm=cd.dMark==='zonal'?(z==='near'||z==='center'?-2:1):cd.dMark==='man'?(z==='near'?1:-1):0;
    const dS=dn?airC(dn.p,o):6,aS=airC(near.p,s)+zm*.8+(A.length-Dd.length)*1.2;
    const pW=clamp((.42+(aS-dS)*.035+qk+(z==='edge'?.15:z==='far'?.05:0))*CFG.spA,.06,.85);pr(near.p).at++;if(dn)pr(dn.p).at++;
    if(r()>pW){if(dn){pr(dn.p).aw++;pr(dn.p).r+=RW.airW;duelRec(near,dn,s,false,2,true)}TR({k:'air',p:near.p.name,vs:dn?dn.p.name:'',won:false});ev({s,t:'aerialLost',p:near.p.name,d:dn?dn.p.name:'',type:kind});
      st.after=()=>{const w=dn||near;w.x=px;w.y=py;if(dn&&r()<CFG.aerCorner){ball.last=o;setCorner(s,r()<.5?'L':'R');return}clearSP(s,dn||near,px,py)};return 'lost'}
    pr(near.p).aw++;if(dn)duelRec(near,dn,s,true,2,true);if(tk&&kind!=='throw')pr(tk.p).crc=(pr(tk.p).crc||0)+1;
    const shotP=z==='edge'?CFG.spSE:z==='near'?CFG.spSN:CFG.spS;
    if(r()<shotP){const foot=z==='edge';const xg=foot?clamp(xgGeo(lx,ly)*.6,.01,.12):clamp(xgGeo(lx,ly)*CFG.hdK*CFG.spX*(1+(airC(near.p,s)-12)*.03)*(dn&&!foot?.85:1),.01,.5);
      TR({k:'air',p:near.p.name,vs:dn?dn.p.name:'',won:true});st.after=()=>{near.x=px;near.y=py;ball.x=px;ball.y=py;shoot(near,foot?'combo':'header',xg,tk)};return 'shot'}
    TR({k:'air',p:near.p.name,vs:dn?dn.p.name:'',won:true,held:true});ev({s,t:'aerialWon',p:near.p.name,type:kind});
    st.after=()=>{near.x=px;near.y=py;if(r()<.35){near.recvFrom=tk;near.recvAt=st.sec;give(near,'keep',.4)}else loose(px,py,(s?1:-1)*(-3-r()*4),(r()-.5)*8)};return 'held'}
  function clearSP(s,d,px,py){const o=1-s;if(r()<CFG.spCC){ball.last=o;flight(px,py,F(s,L),py<Lt(s,34)?Lt(s,1):Lt(s,W-1),.6,.5);st.after=()=>setCorner(s,Lt(s,py)<34?'L':'R');return}const tx=F(s,clamp(F(s,px)-14-r()*14,55,92)),ty=clamp(py+(r()-.5)*24,3,W-3);pr(d.p).r+=.02;ev({s:o,t:'clear',p:d.p.name});if(opt.debug&&d.s===o)opt.debug(st.sec,d,{k:'clear',sp:1},F(o,px));flight(px,py,tx,ty,.9,.8);st.after=()=>loose(tx,ty,(r()-.5)*4,(r()-.5)*4)}
  // ---- 크로스·세트피스 공중볼(E3 확률 구조 + 실제 박스 안 인원) ----
  function aerial(s,dl,q,type){const o=1-s,gk=gkOf(o);st.cross[s]++;if(rec&&type==='cross'&&dl&&dl.a&&dl.a.p)(st.tg||(st.tg=[])).push(['kk',dl.a.p.id,'cross',1]);/* v216 크로스도 분석 패스 지도에 크로스(점선)로 기록 */{const D=st.dbg||(st.dbg={});D['airX_'+type]=(D['airX_'+type]||0)+1}
    const lastSw=dl.sw;
    if(r()<clamp(((CFG.xrOn&&type==='cross'?CFG.xrGk:.065)+(attr(gk.p,'gk_air',o)-13)*.01+(hN(gk.p)-10)*.004)*(lastSw==='in'?.85:lastSw==='out'?1.1:1)*(type==='cross'?1:1.4),.02,.2)){TR({k:'claim',p:gk.p.name});pr(gk.p).r+=.06;ev({s,t:'claim',gk:gk.p.name,type});flight(ball.x,ball.y,gk.x,gk.y,.8,1);st.after=()=>give(gk,'regain',CFG.d5GkHold?gkHold('save',gk):1.5);return 'claim'}
    const low=type==='cross'&&(dl.lowF===1?true:dl.lowF===0?false:r()<(CFG.crLowP??.55));
    let As=P[s].filter(a=>!a.gk&&a!==dl.a&&F(s,a.x)>84&&Lt(s,a.y)>12&&Lt(s,a.y)<56);if(!As.length)As=P[s].filter(a=>!a.gk&&a!==dl.a).sort((a,b)=>F(s,b.x)-F(s,a.x)).slice(0,2);
    const ta=T[s];const tg=pick(As,a=>low?Math.pow(attr(a.p,'offball',s)+attr(a.p,'shoot',s)*.5,2)*(['ST','W','AM'].includes(a.g)?1.5:.4):Math.pow(airC(a.p,s),3)*(['CB','ST'].includes(a.g)?1.5:1)*(a.fl.target?1.4:1)*(a.run>st.sec&&a.rk==='far'?CFG.farK:1));
    let Ds=P[o].filter(b=>!b.gk&&F(o,b.x)<20);const nearD=Ds.length?Ds.slice().sort((a,b)=>hyp(a.x-tg.x,a.y-tg.y)-hyp(b.x-tg.x,b.y-tg.y)).slice(0,3):P[o].filter(b=>!b.gk).slice(0,3);
    const dm=pick(nearD,b=>low?attr(b.p,'posit',o):airC(b.p,o));const free=hyp(dm.x-tg.x,dm.y-tg.y)>4;
    pr(tg.p).at++;pr(dm.p).at++;
    const diff=(low?(attr(tg.p,'offball',s)-attr(dm.p,'posit',o))*.8:airC(tg.p,s)-airC(dm.p,o))+(free?3:0)+(As.length-Ds.length)*.4;
    const Ae=AER[type];flight(ball.x,ball.y,tg.x,tg.y,low?.7:1.1,low?.3:1);
    const tdi=T[o].ti;
    const gA=ta.gmbAir&&type==='cross'&&!low?clamp((ta.gmbAirD||0)*(CFG.gmbAirK||0),-.15,.15):0;/* v256 막판 승부수 '공중볼 폭격'(유저 전용 ta.gmbAir): 높은 크로스 경합 승률에 경기 단위 공중볼 우열(화면의 decAir 우리−상대 = ta.gmbAirD)×gmbAirK를 더함 → 우위면 더 이기고 열세면 더 짐(QA 의견: 개별 경합 diff는 free·인원·낮은 크로스가 섞여 증폭 대상으로 부적합). AI는 이 값을 쓰지 않음 */
    if(r()>clamp(Ae.win+(CFG.xrOn&&type==='cross'?CFG.xrWinD:0)+((q-13)*.012+diff*.035*(tdi[0]<=2?1.3:1)+gA),.1,.75)){pr(dm.p).aw++;if(gA<0||(ta.gmbAir&&(ta.gmbAirD||0)<0&&type==='cross')){ta.gmbExpT=st.sec+(CFG.gsRecT||6);ta.gmbExpS=Math.min(1,-(ta.gmbAirD||0)/2)}TR({k:'air',p:tg.p.name,vs:dm.p.name,won:false});ev({s,t:'aerialLost',p:tg.p.name,d:dm.p.name,type});pr(dm.p).r+=RW.airW;pr(tg.p).r-=RW.airL;duelRec(tg,dm,s,false,2,true);
      if(CFG.xrOn&&type==='cross'){/* v135 크로스 실패 갈래(실측 오픈플레이 크로스 22.4회/경기 중 공격 실패 71%: 걷어내기 51%·수비 회수 18%·라인 밖 11%·블록 6%·코너 일부) */const u=r();
        if(u<CFG.xrOut){ball.last=s;st.after=()=>restart('gk',o,F(o,5.5),34);return 'lost'}
        if(u<CFG.xrOut+CFG.xrRec){st.after=()=>{dm.x=tg.x;dm.y=tg.y;give(dm,'regain',.5)};return 'lost'}
        if(u<CFG.xrOut+CFG.xrRec+CFG.xrBlk){st.after=()=>{loose(tg.x+(r()-.5)*4,tg.y+(r()-.5)*4,(s?1:-1)*(3+r()*5),(r()-.5)*8);ball.last=o};return 'lost'}
        if(u<CFG.xrOut+CFG.xrRec+CFG.xrBlk+CFG.xrCor){ball.last=o;st.after=()=>setCorner(s,r()<.5?'L':'R');return 'lost'}}
      else if(r()<CFG.aerCorner){ball.last=o;st.after=()=>setCorner(s,r()<.5?'L':'R');return 'lost'}
      if(CFG.clrV2){/* v134 크로스 걷어내기: 실측 박스 안 걷어내기 12.9회/팀(헤딩 절반) — 착지 분포 공통 */st.after=()=>{dm.x=tg.x;dm.y=tg.y;const hd=!low||r()<.25;if(opt.debug)opt.debug(st.sec,dm,{k:'clear',air:hd?1:0,xc:1},F(o,dm.x));ev({s:o,t:'clear',p:dm.p.name});clrFly(dm,o,hd,0)};return 'lost'}
      st.after=()=>{const ang=(r()-.5)*1.6;loose(tg.x,tg.y,(s?1:-1)*Math.cos(ang)*14,Math.sin(ang)*14);ball.last=o};return 'lost'}
    duelRec(tg,dm,s,true,2,true);pr(tg.p).aw++;if(dl.a&&type==='cross')pr(dl.a.p).crc++;
    if(r()>(type==='cross'&&CFG.crShotP?CFG.crShotP:Ae.shot)){TR({k:'air',p:tg.p.name,vs:dm.p.name,won:true,held:true});ev({s,t:'aerialWon',p:tg.p.name,type});st.after=()=>{if(r()<.5){tg.recvFrom=dl.a;tg.recvAt=st.sec;give(tg,'keep',.4)}else loose(tg.x,tg.y,(s?1:-1)*-6,(r()-.5)*8)};return 'held'}
    const t=low?'lowcross':type;TR({k:'air',p:tg.p.name,vs:dm.p.name,won:true,low});
    let sx=F(s,tg.x),sy=Lt(s,tg.y);{const lx=low?86+r()*9:91.5+r()*5.5,ly=29+r()*10;if(sx<lx-1||Math.abs(sy-34)>9){sx=lx;sy=ly}}
    const xg=CFG.hdK?clamp(xgGeo(sx,sy)*(low?CFG.lcK:CFG.hdK)*(1+(q-13)*.05)*(1+diff*.05),.02,.45):clamp(XG[t]*(1+(q-13)*.05)*(1+diff*.05),.02,.45);
    st.after=()=>{tg.x=F(s,sx);tg.y=Lt(s,sy);ball.x=tg.x;ball.y=tg.y;shoot(tg,low?'lowcross':'header',xg,dl.a)};return 'shot'}
  // ---- 패스 차단 위험(실제 수비 위치) ----
  function laneRisk(o,x0,y0,x1,y1,sp,lofted){const dx=x1-x0,dy=y1-y0,d2=dx*dx+dy*dy||1,d=Math.sqrt(d2);let keep=1,best=null,bp=0,bt=1;
    for(const b of P[o]){let t=((b.x-x0)*dx+(b.y-y0)*dy)/d2;if(t<0)continue;if(t>1)t=1;if(lofted&&t>.12&&t<.9)continue;
      const px=x0+dx*t,py=y0+dy*t,dp=hyp(b.x-px,b.y-py);if(dp>9)continue;
      const tb=t*d/sp+.15,tk=dp/(b.vm*.95)+(b.stun>0?b.stun:0)+.35;
      let p=Math.min(.97,sig((tb-tk)*4.5)*.85*(1+(attr(b.p,'posit',o)-12)*CFG.dSk)*CFG.laneK*(CFG.itRole[b.g]??1)*DH(b,1));if(lofted&&t>=.9)p*=.5;if(b.gk&&t<1)p*=.8;
      keep*=1-p;if(p>bp){bp=p;best=b;bt=t}}
    return {p:1-keep,best,bt}}
  const nearestOpp=(a)=>{let nd=99,nb=null;for(const b of P[1-a.s]){const d=hyp(b.x-a.x,b.y-a.y);if(d<nd){nd=d;nb=b}}return [nd,nb]};
  /* v124: 상대 수비 4명 평균 높이(그들 골문 기준) */function oppLn4(s){const D=P[1-s].filter(b=>!b.gk).map(b=>L-F(s,b.x)).sort((a,b)=>a-b);return (D[0]+D[1]+D[2]+D[3])/4}
  function offLine(s){let l1=0,l2=0;for(const b of P[1-s]){const f=F(s,b.x);if(f>l1){l2=l1;l1=f}else if(f>l2)l2=f}return Math.max(l2,F(s,ball.x),52.5)}
  // ---- 볼 소유자 판단 ----
  /* 터치 계획: 공 받는 순간 원터치/1터치/2터치/3터치+(드리블) 결정.
     기본 비율 근거: StatsBomb 라리가 15-16 80경기, 받은 위치(수비·중원·공격 3분할) × 압박 여부.
     조정: 지금 열린 동료 수, 앞 공간, 패스·드리블 능력, 역할, 템포, 드리블 개인 지시, 역습 중, 체력 */
  const TB=[[[.10,.36,.27,.27],[.20,.27,.38,.15]],[[.14,.32,.27,.27],[.16,.28,.35,.20]],[[.19,.30,.26,.25],[.16,.24,.35,.24]]];
  function touchPlan(a){const s=a.s,o=1-s,t=T[s],fx=F(s,a.x);const [nd]=nearestOpp(a);
    const p=TB[fx<35?0:fx<70?1:2][nd<CFG.presD?1:0].slice();
    let open=0;for(const m of P[s]){if(m===a||m.gk)continue;const d=hyp(m.x-a.x,m.y-a.y);if(d<5||d>30)continue;if(F(s,m.x)<fx-6)continue;const lr=laneRisk(o,a.x,a.y,m.x,m.y,d<12?12:15,false);if(lr.p<.2)open++}
    let front=99;for(const b of P[o]){if(F(s,b.x)<F(s,a.x)-1)continue;const d=hyp(b.x-a.x,b.y-a.y);if(d<front)front=d}
    const cntr=cur&&cur.cnt>st.sec;
    let k1=(open>=2?1.5:open===1?1.1:.45)*(1+(attr(a.p,'pass',s)-12)*.04)*(a.fl.create||a.fl.build?1.2:1)*(a.fl.target?1.4:1)*(1+(t.ti[3]-3)*.15)*CFG.oneK;
    const k3=(front>10?1.6:front>6?1.15:front<3?.55:.85)*(1+(attr(a.p,'drib',s)-12)*.05)*(a.fl.wide||a.fl.inside?1.3:1)*(a.fl.create||a.fl.build?.85:1)*(1+(t.pi(a.p,'dr')-1)*.45)*(1-(t.ti[3]-3)*.08)*(cntr?1.4:1)*CFG.dribK*HB(a,0)*((CFG.drG&&CFG.drG[a.g])||1);
    if(a.wallFrom&&st.sec<a.wallT&&a.wallFrom.run>st.sec)k1*=CFG.wallOne;
    p[0]*=k1;p[3]*=k3;if(a.gk){p[0]*=.3;p[3]*=.15}
    /* v118 침투 후 단독 돌파: 스루패스를 받은 직후(4초)엔 원터치로 되돌려주지 않고 몰고 들어감(실측: 스루패스 성공 후 8초 안 슈팅 70%) */if(CFG.brOn&&a.recvKind==='through'&&st.sec-a.recvAt<4&&fx>55){p[0]*=CFG.brOne;p[1]*=.6;p[3]*=CFG.brDrib}
    const sum=p[0]+p[1]+p[2]+p[3];let x=r()*sum,i=0;while(i<3&&(x-=p[i])>0)i++;
    const slow=1+((st.fatigue[s][a.p.id]||0)/100)*.25;a.mode=['one','t1','t2','drib'][i];
    {const D=st.dbg||(st.dbg={});D['tp_'+a.mode]=(D['tp_'+a.mode]||0)+1}
    if(i===3)a.dribEnd=st.sec+1.8+r()*1.6;
    return (i===0?.15:i===1?(.45+r()*.5)*slow:i===2?(.9+r()*.55)*slow:.3)*CFG.tScale*(1+(3-t.ti[3])*CFG.tempoT)}
  /* ===== 엔진5 선수 능력 2단계 가중 =====
     1단계(포지션 계층): 포지션 평균(μ_pos, 라리가 선수 데이터) − 그 행동을 주로 하는 선수들의 평균(μ_sit) → 센터백의 슈팅은 공격수보다 낮은 출발점
     2단계(선수 등급): 같은 포지션 안에서 (능력 − μ_pos) 비례 + 포지션 표준편차를 넘는 특출함에 +α
     모든 결과·판단 모델은 "그 상황의 평균 선수" 기준이므로 μ_sit 기준으로 로짓 이동량을 만든다 */
  const MU5={GK:{pass:8.3,shoot:1.3,comp:7.2,drib:3.8,tackle:2.9,pace:4.7,aerial:12.8},FB:{pass:12.2,shoot:7.8,comp:10.5,drib:12.1,tackle:13.6,pace:13.7,aerial:10},CB:{pass:12.3,shoot:6.6,comp:10.5,drib:9,tackle:14.4,pace:9.9,aerial:14.9},DM:{pass:12.8,shoot:9.1,comp:11,drib:10.4,tackle:14.4,pace:8.9,aerial:11.9},AM:{pass:14.9,shoot:13.4,comp:12.6,drib:13.9,tackle:7.9,pace:12,aerial:8.9},CM:{pass:14.3,shoot:10,comp:11.3,drib:12.1,tackle:11.8,pace:10.6,aerial:10.2},W:{pass:12.5,shoot:12.3,comp:10.8,drib:14.9,tackle:8.2,pace:14.8,aerial:8.8},ST:{pass:11.3,shoot:15,comp:12,drib:12.3,tackle:7.5,pace:11.2,aerial:12.5}};
  const SD5={pass:1.9,shoot:2.1,comp:2.4,drib:1.9,tackle:1.8,pace:2.3,aerial:2.1};
  const MUSIT5={pass:12.9,shoot:13.3,comp:11.6,drib:13.5,tackle:13.6,pace:12.5,aerial:12.5};
  /* a: 선수 객체, key: 능력, k: 1점당 로짓 → 이동량 */
  function ab5(a,key,k){const g=a.gk?'GK':(a.g||'CM');const mu=(MU5[g]||MU5.CM)[key]??12,sd=SD5[key]||2;const v=V(a.p,key,mu)*eff(a.p,a.s);const d=v-mu;
    return k*(CFG.ab5P*(mu-(MUSIT5[key]??12))+CFG.ab5I*d+CFG.ab5E*Math.max(0,d-sd))}
  /* ===== 엔진5 판단 모델 =====
     터치 = 받음 → [운반] → 종료 행동. 실측(StatsBomb 360) 적합:
       A) 받은 직후 운반 여부 P(carry≥5m) 로지스틱 + 운반 거리 분위수(구역×압박)
       B) 종료 행동 소프트맥스 {pass, shot, dribble(1대1), clear} — 위치·골문 각·압박·주변 상대 수·열린 동료 수·길목
       패스 대상: 조건부 로짓(거리·전진·열림·경로·위치) / 패스 높이 로지스틱 / 성공 확률·슈팅 결과는 결과 모델(OC)
     선수 능력은 각 로짓에 이동량으로만 들어감(평균 12 기준). 전술 지시는 로짓 이동(템포·패스 길이·멘탈리티) */
  const D5=(typeof DEC5!=='undefined')?DEC5:require('./decide_table.js').DEC5;const OC5=(typeof OC!=='undefined')?OC:require('./outcome.js').OC;
  function q5sample(q){/* 분위수(25·50·75·90) → 표본 */const u=r();if(u<.25)return q[0]*(u/.25);if(u<.5)return q[0]+(q[1]-q[0])*((u-.25)/.25);if(u<.75)return q[1]+(q[2]-q[1])*((u-.5)/.25);if(u<.9)return q[2]+(q[3]-q[2])*((u-.75)/.15);return q[3]*(1+(u-.9)*3)}
  /* GK 보유 시간(실측 SB 라리가: 받음→패스 분위수 25/50/75/90 — 백패스 받음 0.1/1.4/2.0/4.6초, 루즈볼 회수 2.1/5.7/10.2/15.0, 선방·캐치 3.5/8.4/13.2/17.6) */
  const GKQ5={keep:[.3,1.4,2.0,4.6],rec:[2.1,5.7,10.2,15.0],save:[3.5,8.4,13.2,17.6]};
  function gkHold(k,a){const pi=a&&T[a.s]&&T[a.s].pi?T[a.s].pi(a.p,'gkh'):1;const t=q5sample(GKQ5[k]||GKQ5.rec)*(CFG.d5GkHold||1)*(pi===0?CFG.gkhK[0]:pi===2?CFG.gkhK[1]:1);const r0=clamp(t,.3,18);if(a){const D=st.dbg||(st.dbg={});D['gkH'+a.s]=(D['gkH'+a.s]||0)+r0;D['gkHn'+a.s]=(D['gkHn'+a.s]||0)+1}return r0}
  /* v195 GK 개인 지시: 스위퍼 성향(0 자제·1 보통·2 적극) → 뒷공간 커버 범위 배수 */
  function gkSw(q){const g=P[q]&&P[q][0];if(!g||!g.gk||!T[q].pi)return 1;const v=T[q].pi(g.p,'gks');return v===0?CFG.gksK[0]:v===2?CFG.gksK[1]:1}
  /* 역습 전환 지시: 탈취(태클·가로채기·루즈볼) 직후 cntT초 동안 전진 패스 선호·빠른 처리 */
  function cnt5(t){return !!(t.ti[6]&&cur&&cur.s===T.indexOf(t)&&/regain|second/.test(cur.how||'')&&st.sec-cur.t0<CFG.cntT)}
  function lz5(a,how){const D=st.dbg||(st.dbg={});const fx=F(a.s,a.x);const k='lz_'+how+'_'+(fx<35?'d':fx<70?'m':'a');D[k]=(D[k]||0)+1}
  /* 밖으로 나감(실측 스로인 23.4회/팀 출처: 패스 6.9·경합 3.4·걷어내기 3.4·블록 3.1·굴절 2.2·컨트롤 실수 2.1) → 가장 가까운 터치라인 너머 지점·속도 */
  const sideOut=(y)=>y<W/2?-1.5:W+1.5;
  function looseOut(x,y,lastS){const dl=y<W/2?y:W-y;const v=(dl+3)/1.67;const ang=(y<W/2?-1:1)*Math.PI/2+(r()-.5)*.8;ball.last=lastS;loose(x,y,Math.cos(ang)*v,Math.sin(ang)*v);ball.last=lastS;{const D=st.dbg||(st.dbg={});D.outForced=(D.outForced||0)+1}}
  /* 끊는 순간 바로 걷어내기(실측 SB: 상대 실패 패스 중 수비가 바로 걷어낸 비율 — 박스 땅볼 19%·띄움 43%, 자기진영 땅볼 4%·띄움 14%, 중원 띄움 5%) */
  /* v134 걷어내기 착지 분포: 실측 SB 80경기 자기 1/3 걷어내기 → 다음 온볼 지점까지 전진 거리(발 중앙값 12m·헤딩 9m, 20%는 뒤로·막힘).
     10m 구간 확률표에서 뽑아 짧으면 막힘/빗맞음(근처 루즈볼), 길면 비행(측면 쪽으로 치우침) */
  function clrFly(a,s,hd,ctl){const fx=F(s,a.x),fy=Lt(s,a.y);const B=hd?CFG.clrBH:CFG.clrBF;let u=r(),i=0;for(;i<B.length-1;i++){u-=B[i];if(u<0)break}
    let dx=(i-1)*10+r()*10;if(ctl)dx=Math.max(dx,12+r()*25);ball.own=null;ball.last=s;
    if(dx<CFG.clrBlk){const vx=dx*.9,vy=(r()-.5)*10;loose(a.x,a.y,F(s,vx)-F(s,0),Lt(s,vy)-Lt(s,0));ball.last=s;{const D=st.dbg||(st.dbg={});D.clrBlk=(D.clrBlk||0)+1}return}
    const tfx=Math.min(84,fx+dx*CFG.clrK);let tfy=fy+(fy<34?-1:1)*r()*(dx*CFG.clrW+4)+(r()-.5)*8;if(r()<CFG.oClr2)tfy=fy<34?-2:W+2;
    const ex=F(s,tfx),ey=Lt(s,tfy);const d=hyp(ex-a.x,ey-a.y);ball.fl={x0:a.x,y0:a.y,x1:ex,y1:ey,t:0,T:d/21+.3,h:dx>CFG.clrAir?1.3:0,res:'loose',s,from:a,kind:'clear'}}
  function firstClear(b,lof){const s=b.s,fx=F(s,b.x),fy=Lt(s,b.y);const box=fx<16.5&&Math.abs(fy-34)<20.16;const p=(box?(lof?.43:.19):fx<35?(lof?.14:.04):fx<70?(lof?.05:0):0)*CFG.ftClrK;if(!(r()<p))return false;
    if(opt.debug)opt.debug(st.sec,b,{k:'clear',ft:1},fx);{const D=st.dbg||(st.dbg={});D.ftClr=(D.ftClr||0)+1}
    if(CFG.clrV2){clrFly(b,s,lof&&r()<CFG.clrHdF,0);return true}
    let ex=F(s,Math.min(84,fx+30+r()*25)),ey=clamp(b.y+(r()-.5)*30,1,W-1);if(r()<CFG.oClr)ey=sideOut(b.y);const d=hyp(ex-b.x,ey-b.y);
    ball.own=null;ball.fl={x0:b.x,y0:b.y,x1:ex,y1:ey,t:0,T:d/22+.4,h:1.3,res:'loose',s,from:b,kind:'clear'};ball.last=s;return true}
  function holdTime(a){const s=a.s,fx=F(s,a.x);const [nd]=nearestOpp(a);const z=fx<35?'d':fx<70?'m':'a';const q=D5.time_q[z+(nd<3?'P':'F')];let t=q5sample(q);const ti=T[s].ti;t*=1+(3-ti[3])*CFG.tempoT;/* 박스 근처: 실측 받음→슈팅 중앙값 0.54초(61%가 1초 안) → 빠른 판단 */if(fx>80)t*=CFG.d5BoxT;if(a.brk5){t*=.4}if(cnt5(T[s]))t*=CFG.cntH;return clamp(t,.1,4)}
  function coneCount(s,fx,fy,excl){let cn=0;for(const b of P[1-s]){if(b.gk||b===excl)continue;const x=F(s,b.x);if(x<=fx)continue;const k=(x-fx)/Math.max(1e-6,L-fx),y=Lt(s,b.y),lo=fy+(30.34-fy)*k,hi=fy+(37.66-fy)*k;if(y>=lo&&y<=hi)cn++}return cn}
  function decide(a){const s=a.s,o=1-s,t=T[s],ti=t.ti,fx=F(s,a.x),fy=Lt(s,a.y);const restr=a.restr;a.restr=null;if(restr==='throw')a.thrT=st.sec;const AF=afOf(s);
    const ds=[];for(const b of P[o]){if(CFG.d5&&b.stun>0)continue;ds.push([hyp(b.x-a.x,b.y-a.y),b])}ds.sort((u,v)=>u[0]-v[0]);const nd=ds.length?ds[0][0]:10,nb=ds.length?ds[0][1]:null;const n5=ds.filter(x=>x[0]<5).length;
    let fwdN=0,fwdSp=20;for(const [d,b] of ds){const bx=F(s,b.x),by=Lt(s,b.y);const ang=Math.atan2(by-fy,bx-fx);if(bx>fx&&d<15&&Math.abs(ang)<Math.PI/6)fwdN++;if(bx>fx+1&&Math.abs(ang)<Math.PI/5&&d<fwdSp)fwdSp=d}
    const oppXY=P[o].map(b=>[b.x,b.y]);const minOpp=(x,y)=>{let m=10;for(const q of oppXY){const d=hyp(q[0]-x,q[1]-y);if(d<m)m=d}return m};
    /* ---- 돌파 상황(뒷공간 침투 성공·앞이 비었을 때): 슈팅 거리까지 곧장 몰고 감 ---- */
    if(CFG.d5Brk&&!a.gk&&restr!=='throw'&&fx>52&&fx<88){let gsd=0;for(const b of P[o]){if(b.gk)continue;const bx=F(s,b.x);if(bx>fx-1&&Math.abs(Lt(s,b.y)-fy)<8)gsd++}
      if(opt.thrDbg&&a.recvKind==='through'&&st.sec-a.recvAt<1)opt.thrDbg(fx,fy,nd,gsd,fwdSp);
      const thrNow=a.recvKind==='through'&&st.sec-a.recvAt<2;if((gsd===0&&(thrNow||(nd>2.5&&fwdSp>=12)))||(thrNow&&gsd<=1&&nd>3)){const len=thrNow?Math.max(6,L-9-fx):Math.min(L-9-fx,Math.max(6,fwdSp-2));const gy=34+(fy-34)*.35,gxx=F(s,Math.min(L-9,fx+len)),gyy=Lt(s,gy);const ang=Math.atan2(gyy-a.y,gxx-a.x);a.brk5=1;{const D=st.dbg||(st.dbg={});D.brk5=(D.brk5||0)+1}
        return {k:'carry',x:clamp(a.x+Math.cos(ang)*len,1,L-1),y:clamp(a.y+Math.sin(ang)*len,1.5,W-1.5),len,brk:1}}}
    /* ---- A) 받은 직후 운반 ---- */
    if(!a.gk&&!a.carried&&!a.c5done&&restr!=='throw'&&!(a.decB&&a.decB!=='wide')){a.c5done=1;const w=D5.A.w;const z=[1,fx/35,(fx/35)**2,Math.min(nd,8)/4,Math.min(fwdSp,20)/10,n5,0];let lg=0;for(let i=0;i<w.length;i++)lg+=w[i]*z[i];
      lg+=(CFG.d5CarryB||0)+(CFG.d5CarryZ?CFG.d5CarryZ[fx<35?0:fx<70?1:2]:0)+(attr(a.p,'drib',s)>14?.2:0);lg+=(a.fl.carry||a.fl.run?.4:0)+(cur&&cur.counter?.5:0)+(ti[3]-3)*.1;
      if(r()<sig(lg)){const zn=fx<35?'d':fx<70?'m':'a';let len=Math.max(5,q5sample(D5.carry_q[zn+(nd<3?"P":"F")]));/* 박스 안 운반은 짧게(실측 박스 안 운반 평균 3.6m, 5m+ 25%) */if(fx>88.5&&Math.abs(fy-34)<20.16)len=Math.min(len,CFG.d5BoxCarry);
        /* 방향: 전방 위주, 상대와 가장 멀어지는 쪽 */let best=null,bv=-99;for(const th of [0,.35,-.35,.8,-.8,1.4,-1.4]){const ang=(s?Math.PI:0)+th;const nx=clamp(a.x+Math.cos(ang)*len,1,L-1),ny=clamp(a.y+Math.sin(ang)*len,1.5,W-1.5);const sp=minOpp(nx,ny);const nfx=F(s,nx),nfy=Lt(s,ny);const inb=nfx>88.5&&Math.abs(nfy-34)<20.16;const v=Math.min(sp,8)*.5+(nfx-fx)*CFG.d5CFwd-Math.abs(th)*.3+Vv(nfx,nfy)*CFG.d5CVal-(inb?(sp<CFG.d5CBoxSp?3:0)+CFG.d5CBoxP:0)-(fx>70?Math.max(0,nfx-fx)*CFG.d5CFwdA:0);if(v>bv){bv=v;best=[nx,ny]}}
        return {k:'carry',x:best[0],y:best[1],len}}}
    /* ---- B) 종료 행동 ---- */
    const dist=hyp(L-fx,34-fy),ang=OC5.goalAngle(fx,fy),cone=coneCount(s,fx,fy);
    let open=0,fopen=0;for(const m of P[s]){if(m===a||m.gk)continue;const d=hyp(m.x-a.x,m.y-a.y);if(d>25||d<3)continue;if(minOpp(m.x,m.y)>3){open++;if(F(s,m.x)>fx+5)fopen++}}
    const fB=[1,fx/35,(fx/35)**2,Math.abs(fy-34)/20,Math.log(Math.max(dist,1)),ang,Math.min(nd,8)/4,n5,fwdN,Math.min(open,6),Math.min(fopen,4),Math.min(cone,3),(fx>88.5&&Math.abs(fy-34)<20.16)?1:0];
    const WB5=D5.B.W;const z=[0,0,0,0];for(let i=0;i<fB.length;i++)for(let k=0;k<4;k++)z[k]+=WB5[i][k]*fB[i];
    /* 능력·역할·지시 이동: 슈팅(중거리 선호·결정력), 돌파(드리블), 걷어내기(침착 낮을수록) */
    z[1]+=(CFG.d5ShB||0)+(CFG.d5ShBand[(fx>88.5&&Math.abs(fy-34)<20.16?'ib':'ob')+(dist<12?'<12':dist<18?'12-18':dist<25?'18-25':dist<32?'25-32':'32+')]||0)+(a.brk5?CFG.d5BrkSh:(cone===0&&nd>2&&dist<22&&fwdN===0)?CFG.d5OneSh:0)+(CFG.d5ThrSh&&a.recvKind==='through'&&st.sec-(a.recvAt||0)<6&&dist<25?CFG.d5ThrSh:0)+ab5(a,'shoot',CFG.d5Sh)+(a.fl.shoot?.5:0)+(AF==='long'&&dist>20?.6:0)+(ment5(t))*.15;/* 돌파(1대1): 360 프리즈프레임에서 돌파 상대가 빠져 있어 적합 계수가 왜곡됨(nd>=4.5에만 몰림) → 엔진 규칙으로 대체. 조건: 전방(상대 골 쪽) d5DrR m 안에 수비수. 기준율 구역별 d5DrZ, 능력·역할·지시 가산 */
    {const tk=nb&&nd<CFG.d5DrR&&F(s,nb.x)>fx-1&&Math.abs(Lt(s,nb.y)-fy)<nd+1;if(!tk||a.gk)z[2]=-99;else z[2]=(CFG.d5DrZ[fx<35?0:fx<70?1:2])+Math.log(Math.exp(z[0])+Math.exp(z[1])+Math.exp(z[3]))+ab5(a,'drib',CFG.d5Dr)+(a.fl.drib||a.fl.wide?.4:0)+(t.pi(a.p,'dr')-1)*.6+(nd<1.5?-.5:0)}z[3]+=(12-V(a.p,'comp',12)*eff(a.p,s))*.08+(3-ti[4])*.15;
    if(a.gk||restr==='throw'){z[1]=-99;z[2]=-99;if(restr==='throw'||(a.gk&&(a.hands||nd>1.5)))z[3]=-99}if(fx<L-45)z[1]=-99;/* 걷어내기는 주로 흐른 공·태클 직후(통제 없는 터치)에서: 패스로 받아 통제한 공이면 크게 감소 */if(a.ctrl5&&nd>1.2)z[3]-=CFG.d5ClrCtl;
    if(a.defI&&st.sec<a.defI.t){const it=a.defI.intent;if(it==='drib')z[2]=Math.max(z[2],0)+8;else if(it==='pass')z[0]+=8;else if(z[1]>-90)z[1]+=8}const dTm=st.decTmA&&st.decTmA[s];if(dTm&&st.sec<dTm.until&&!a.decB&&!a.gk&&fx>88.5&&Math.abs(fy-34)<20.16&&(dTm.o==='low'||dTm.o==='bpass'||dTm.o==='bdrib')&&z[1]>-90)z[1]+=(dTm.sh||CFG.decTmSh);if(a.decB&&{bshot:1,bpass:1,bdrib:1,low:1,high:1,carry:1}[a.decB]){const k=a.decB,f=a.decF?1:.3;if(k==='bshot'){if(z[1]>-90)z[1]+=8*f}else if(k==='bdrib'||k==='carry'){if(!a.decC)z[2]=Math.max(z[2],0)+6*f}else z[0]+=6*f}else if(a.decB){if(a.decB==='wide'){if(a.decF){const bx=P[s].some(m=>m!==a&&!m.gk&&F(s,m.x)>=88.5&&Math.abs(Lt(s,m.y)-34)<20.16);if(bx)z[0]+=5;else z[2]+=5}else z[2]+=1.2}else z[0]+=a.decF?6:1.5}const mx=Math.max(...z);const ex=z.map(v=>Math.exp(v-mx));const tot=ex.reduce((u,v)=>u+v,0);let u=r()*tot,ci=0;for(;ci<3;ci++){u-=ex[ci];if(u<=0)break}
    const kind=['pass','shot','dribble','clear'][ci];a.brk5=0;{const D=st.dbg||(st.dbg={});if(kind==='pass'&&!a.gk){const zb=fx<25?'0':fx<35?'1':fx<45?'2':fx<55?'3':fx<70?'4':'5';D['op_'+zb]=(D['op_'+zb]||0)+open;D['fop_'+zb]=(D['fop_'+zb]||0)+fopen;D['fop0_'+zb]=(D['fop0_'+zb]||0)+(fopen===0?1:0);D['nd_'+zb]=(D['nd_'+zb]||0)+nd;D['fwo_'+zb]=(D['fwo_'+zb]||0)+fwdN;D['n_'+zb]=(D['n_'+zb]||0)+1}{const nk='nd'+(nd<1?'0':nd<2?'1':nd<3?'2':nd<4.5?'3':'4')+(fx>70?'A':'');D[nk]=(D[nk]||0)+1;if(fx>70&&nd>=4.5)D['A4_'+kind]=(D['A4_'+kind]||0)+1}const zk=(fx>88.5&&Math.abs(fy-34)<20.16)?'ib_':fx>70?'ao_':'';if(zk){D[zk+kind]=(D[zk+kind]||0)+1;{const kb=(zk==='ib_'?'ib':'ob')+(dist<12?'<12':dist<18?'12-18':dist<25?'18-25':dist<32?'25-32':'32+');D['dd_'+kb]=(D['dd_'+kb]||0)+1;if(kind==='shot')D['ds_'+kb]=(D['ds_'+kb]||0)+1}if(zk==='ib_'){D['ibd12_'+(dist<12?'y':'n')]=(D['ibd12_'+(dist<12?'y':'n')]||0)+1;if(kind==='shot')D['ibs12_'+(dist<12?'y':'n')]=(D['ibs12_'+(dist<12?'y':'n')]||0)+1}D[zk+'cone'+Math.min(2,cone)]=(D[zk+'cone'+Math.min(2,cone)]||0)+1}}
    if(kind==='shot'){const gk=gkOf(o);const gkd=hyp(F(s,gk.x)-L,Lt(s,gk.y)-34);const oneone=cone===0&&nd>2&&dist<22;const o5=OC5.shot({dist,ang,cone,nd,header:0,oneone,firstT:st.sec-a.recvAt<.5,gkFar:gkd>5});if(CFG.dibK){/* v207 박스 안 수비 인원: 실측 SB 3,444슈팅 — 거리·각도·슈팅길 수비·최근접·헤더를 통제해도 박스 안 수비 1명당 득점 로그오즈 −0.161±0.032 → xG·득점확률에 반영(기준 dibM명) */let dib=0;for(const b of P[o]){if(b.gk)continue;const x2=F(s,b.x),y2=Lt(s,b.y);if(x2>L-16.5&&Math.abs(y2-34)<20.16)dib++}const sh=-CFG.dibK*(dib-CFG.dibM);const lg=v=>Math.log(v/(1-v)),sg=v=>1/(1+Math.exp(-v));if(o5.xg>0&&o5.xg<1)o5.xg=sg(lg(o5.xg)+sh);if(o5.pGoal>0&&o5.pGoal<1)o5.pGoal=sg(lg(o5.pGoal)+sh*.75)}a.sh5=o5;{const D=st.dbg||(st.dbg={});D.s5n=(D.s5n||0)+1;D.s5far=(D.s5far||0)+(gkd>5?1:0);D.s5oo=(D.s5oo||0)+(oneone?1:0);D.s5d=(D.s5d||0)+dist;D.s5d10=(D.s5d10||0)+(dist<10?1:0);D.s5d15=(D.s5d15||0)+(dist<15?1:0)}return {k:'shot',xg:o5.xg,o5}}
    if(kind==='dribble'){{const D=st.dbg||(st.dbg={});D.drK=(D.drK||0)+1;D.drNear=(D.drNear||0)+(nb&&nd<CFG.d5DrR?1:0)}if(a.decB==='carry'&&a.decF){/* v253 안쪽 운반: 1대1 돌파 대신 안쪽 빈 공간으로 짧게 몰고 들어감 */let bp=null,bv=-1;for(const t of [.15,.3,.45,.6]){const tx=Math.min(fx+5,L-8),ty=fy+(34-fy)*t;const sp=minOpp(F(s,tx),Lt(s,ty));if(sp>bv){bv=sp;bp=[tx,ty]}}return {k:'carry',x:F(s,bp[0]),y:Lt(s,bp[1]),len:hyp(bp[0]-fx,bp[1]-fy)}}if(nb&&nd<CFG.d5DrR){const dr=attr(a.p,'drib',s),tk=attr(nb.p,'tackle',o);const pW=OC5.dribbleOk({shift:ab5(a,'drib',CFG.d5DrK)-ab5(nb,'tackle',CFG.d5DrK)+(ab5(a,'pace',.03)-ab5(nb,'pace',.03))});return {k:'takeon',b:nb,pW}}
      if(a.decB==='carry'&&a.decF){const tx=Math.min(fx+6,L-8),ty=fy+(34-fy)*.45;return {k:'carry',x:F(s,tx),y:Lt(s,ty),len:hyp(tx-fx,ty-fy)}}const ang2=(s?Math.PI:0);const l7=(fx>88.5&&Math.abs(fy-34)<20.16)?Math.min(7,CFG.d5BoxCarry):7;return {k:'carry',x:clamp(a.x+Math.cos(ang2)*l7,1,L-1),y:clamp(a.y+(fy<34?-1:1)*(s?-1:1)*2,1.5,W-1.5),len:l7}}
    if(kind==='clear'){const tfx=clamp(fx+30+r()*25,40,80),tfy=r()<.5?8+r()*12:48+r()*12;return {k:'clear',x:F(s,tfx),y:Lt(s,tfy)}}
    /* ---- 패스: 대상 선택(조건부 로짓) ---- */
    const zoneK=fx<35?'D':fx<70?'M':'A';const cw=D5.target[zoneK];const off=offLine(s);const cands=[];
    if(a.gk){const pl=ti[4]-3;const gkK=a.spP==='gk';let p0=(gkK?CFG.d5GkK0:CFG.d5Gk0)-pl*.08-(nd<5?.1:0),p1=gkK?CFG.d5GkK1:CFG.d5Gk1;if(t.preset==='티키타카'||t.preset==='점유')p0+=.15;{const gd=t.pi?t.pi(a.p,'gkd'):1;if(gd===0){p0+=CFG.gkdK[0];p1+=CFG.gkdK[1]}else if(gd===2){p0-=CFG.gkdK[2];p1-=CFG.gkdK[3]}}p0=clamp(p0,.03,.85);p1=clamp(p1,.05,.6);const u=r();a.gkCls=u<p0?0:u<p0+p1?1:2;if(gkK&&a.gkF!=null){a.gkCls=a.gkF;a.gkF=null}}
    const CL=P[s].map(m=>[m,0]);if(CFG.bhOn&&!a.gk&&fx>(CFG.bhFx??30)){for(const m of P[s]){if(m===a||m.gk||m.run>st.sec)continue;const mf=F(s,m.x);if(mf>off+.3||mf<off-CFG.bhNear||off>L-CFG.bhMinD||mf<fx-5)continue;if(!CFG.bhG.includes(m.g))continue;CL.push([m,1])}}for(const [m,bhm] of CL){if(m===a)continue;if(m.gk&&!(fx<CFG.gkCandX||nd<4))continue;if(st.hurt[m.p.id]&&r()<.3)continue;
      /* 도착점: 받는 선수 현재 위치 + 진행(달리는 선수는 앞 공간) */const run=m.run>st.sec;const lead=run?Math.min(m.rk==='line'?14:10,hyp(m.tx-m.x,m.ty-m.y)):Math.min(3,hyp(m.vx||0,m.vy||0)*.4);const ux=run?(m.tx-m.x):(m.vx||0),uy=run?(m.ty-m.y):(m.vy||0);const un=hyp(ux,uy)||1;
      let tx=clamp(m.x+ux/un*lead,.5,L-.5),ty=clamp(m.y+uy/un*lead,.5,W-.5);let race=1,deep=0;
      if(CFG.d5Thr&&run&&m.rk!=='line'&&F(s,m.x)>off-8&&F(s,m.x)>45&&off<L-14){/* 뒷공간 스루: 달리는 동료는 오프사이드 라인 d5ThrD m 뒤 지점을 목표로 → 받는 선수와 가장 가까운 수비의 도달 시간 경쟁(뒤돌아 뛰는 수비는 턴 지연) */const dfx=Math.min(off+(CFG.d5ThrDd!=null&&off>CFG.d5ThrDx?CFG.d5ThrDd:CFG.d5ThrD)+r()*4,L-6);const dir=ux/un,diy=uy/un;const px2=F(s,dfx);const py2=clamp(m.y+diy*Math.abs(px2-m.x)/Math.max(.3,Math.abs(dir)),4,W-4);
        const tR=hyp(px2-m.x,py2-m.y)/m.vm+.1;let tD=9;for(const b of P[o]){const q=hyp(px2-b.x,py2-b.y)/b.vm+(b.gk?(dfx>88?.15:1):F(s,b.x)<dfx-2?.3+CFG.turnT:.3);if(q<tD)tD=q}
        race=sig((tD-tR)*2.4);if(race>CFG.d5ThrMin){tx=px2;ty=py2;deep=1}}if(bhm){const lead=CFG.bhL0+r()*CFG.bhL1;const dfx=Math.min(off+lead,L-CFG.bhEnd);const mfy=Lt(s,m.y);const wide=Math.abs(mfy-34)>14;const dfy=clamp(wide?mfy+(mfy<34?-1:1)*2:mfy+(34-mfy)*.3,3,W-3);const px2=F(s,dfx),py2=Lt(s,dfy);const tR=hyp(px2-m.x,py2-m.y)/m.vm+CFG.bhRe;let tD=9;for(const b of P[o]){const q=hyp(px2-b.x,py2-b.y)/b.vm+(b.gk?(dfx>88?.15:1):F(s,b.x)<dfx-2?.3+CFG.turnT:.3);if(q<tD)tD=q}race=sig((tD-tR)*2.4);if(race<CFG.bhMin)continue;tx=px2;ty=py2;deep=2}if(a.gk&&a.gkCls===2&&F(s,m.x)>38){/* GK 롱킥: 전방 선수 앞 공간으로 */tx=clamp(m.x+(s?-1:1)*CFG.d5GkLead,.5,L-.5)}const tfx=F(s,tx),tfy=Lt(s,ty);
      if(F(s,m.x)>off+.3&&F(s,m.x)>52.5&&r()>CFG.offErr)continue;
      const d=hyp(tx-a.x,ty-a.y);if(d<3||d>(restr==='throw'?28:a.gk?75:60))continue;
      const openR=minOpp(tx,ty);let ln=6;const dx=tx-a.x,dy=ty-a.y,L2=dx*dx+dy*dy||1;for(const q of oppXY){const tt=((q[0]-a.x)*dx+(q[1]-a.y)*dy)/L2;if(tt<=.05||tt>=.95)continue;const pd=hyp(a.x+dx*tt-q[0],a.y+dy*tt-q[1]);if(pd<ln)ln=pd}
      const back=tfx<fx-3?1:0;const f=[d/10,(d/10)**2,(tfx-fx)/10,back,Math.min(openR,12)/5,ln/3,tfx/35,m.gk?1:0,(Math.abs(tfy-34)>20&&tfx>66)?1:0];
      let sc=cw.dist*f[0]+cw.dist2*f[1]+cw.fwd*f[2]+cw.back*f[3]+cw.open*f[4]+cw.lane*f[5]+cw.targetX*f[6]+cw.gk*f[7]+cw.wideA*f[8];
      /* 지시·성향: 패스 길이(짧게↔길게), 역습 중 전진, GK 롱킥 성향, 상대 공략 지시 */
      sc+=(deep?(deep===2?CFG.bhB+(CFG.bhZ?CFG.bhZ[fx<60?0:fx<75?1:2]:0):CFG.d5ThrB)+(CFG.d5ThrBox&&tfx>88.5?CFG.d5ThrBox:0)+CFG.d5ThrR*Math.log(Math.max(.05,race))-cw.open*Math.max(0,Math.min(openR,12)-6)/5:0)+(ti[4]-3)*CFG.d5Len*Math.max(0,d-18)/10+(cur&&cur.counter?.3*(tfx-fx)/10:0)+(cnt5(t)?CFG.cntF*Math.max(0,tfx-fx)/10:0)+(a.gk&&tfx-fx>35?CFG.d5GkLong:0)+(run&&tfx>fx+8?CFG.d5Run:0)+(AF==='behind'&&run?.5:0)+(AF==='cross'&&tfx>88&&Math.abs(tfy-34)<20&&Math.abs(fy-34)>14?.5:0)+(m.fl.target&&d>25?.4:0);
      if(m===a.recvFrom&&st.sec-a.recvAt<2.5)sc-=CFG.d5Ret;if(CFG.dExitP&&!a.gk&&fx<35&&tfx>=35)sc-=CFG.dExitP;/* v134 중원에서 막히면 뒤로 돌리기(실측 중원→수비진영 16.5회/팀·중원 내 백패스 42.9회, 엔진 8.8·34.8): 압박(가까운 상대 4m 안)일수록 더 */if(fx>=35&&fx<70&&!a.gk&&tfx<fx-3){const pk=1+(nd<4?CFG.d5MPr:0);sc+=(tfx<35?CFG.d5MtoD:CFG.d5MBack)*pk}/* 패스 길이·전환 보정표(SB 80경기 전 이벤트 분포에 맞춘 구역×길이×전환 로그 보정). 360 적합 모델은 화면 밖 먼 동료가 빠져 긴 패스를 과소평가 */if(CFG.d5LenC&&!a.gk&&!(m.gk&&d>=40)){const k=(fx<35?'d':fx<70?'m':'a')+(d<10?0:d<20?1:d<30?2:d<40?3:d<50?4:5)+(Math.abs(tfy-fy)>28?'s':'');sc+=CFG.d5LenC[k]||0}/* 크로스: 측면 공격진영에서 박스 안 동료(실측 오픈플레이 크로스 11.2회/팀·성공 28%, 엔진 4회) */if(CFG.d5LatA&&fx>70&&Math.abs(tfx-fx)<=3&&!a.gk)sc-=CFG.d5LatA;if(CFG.d5BackA&&fx>70&&tfx<fx-3&&tfx>=70&&!a.gk)sc-=CFG.d5BackA;{const cb=CFG.d5CrossB+(AF==='cross'?CFG.afCrossB:0)+(t.pi(a.p,'cr')-1)*CFG.crPiB;if(cb&&!a.gk&&fx>66&&Math.abs(fy-34)>15&&tfx>88.5&&Math.abs(tfy-34)<20.16&&Math.abs(tfy-fy)>6)sc+=cb}/* 골문 12m 안 지상 패스는 드묾(실측 성공 0.7회/팀, 엔진 1.3회) */if(hyp(L-tfx,34-tfy)<12&&!a.gk)sc-=CFG.d5Box12;/* 측면 전진(실측: 와이드 바이라인 구역 x>=88 도착 패스 17회/팀, 대부분 같은 측면 10m 내 직진) */if(CFG.d5WideF&&tfx>=86&&Math.abs(tfy-34)>19&&tfx>fx+4&&(tfy<34)===(fy<34)&&fx>60){sc+=CFG.d5WideF;const D=st.dbg||(st.dbg={});D.wcand=(D.wcand||0)+1}/* 리셋 패스(실측: 모든 구역에서 10m+ 백패스가 11%): 열린 전방 동료가 적을수록 깊은 되돌림 선호 */if(tfx<fx-10&&!m.gk&&fx>28&&fx<CFG.d5RstX)sc+=CFG.d5Rst*(fopen===0?1:fopen===1?.75:.5);sc+=CFG.d5Fwd*Math.max(0,tfx-fx)/10-(tfx<fx-5&&!m.gk?CFG.d5Back:0)+(tfx-fx>22?CFG.d5Long:0)+(m.gk?CFG.d5GkB*(nd<4?1.5:1):0);
      /* GK 배급: 실측(라리가) 오픈플레이 GK 패스 길이 <20m 23%·20-40m 29%·40m+ 48% → 길이 등급을 먼저 뽑고 그 등급 안에서 열린 동료 선택 */
      if(a.gk){const cls=a.gkCls;const dc=d<20?0:d<40?1:2;if(dc!==cls)sc-=6;else sc=Math.min(openR,12)/5*1.4+ln/3*.5+(tfx-fx)/10*.3-(m.gk?9:0)}
      if(CFG.g2gPen&&m===a.recvFrom&&st.sec-(a.recvAt||0)<4){if(F(s,m.x)>fx+3)sc-=CFG.g2gPen;else sc+=CFG.retBon||0}/* v212 2대1(앞으로 나간 패서에게 되돌려주기) 실측 연속 패스의 5.2%(엔진 8.4%) */if(a.decB)sc+=a.decB==='switch'?((Math.abs(tfy-fy)>25&&d>=25)?4:0):a.decB==='inside'?((Math.abs(tfy-34)<Math.abs(fy-34)-8&&tfx>=fx-8)?3:0):((tfx>=88.5&&Math.abs(tfy-34)<20.16)?2.5:0);if(CFG.latPD&&!a.gk&&fx<70&&d>=35&&Math.abs(tfy-fy)>30)sc-=fx<35?CFG.latPD:CFG.latPM;/* v250 수비·중앙 진영 긴 횡패스(폭 30m+·35m+) 과다 보정: 엔진 폭 37m+ 패스 수비13·중앙13회 vs 실측(StatsBomb 분데스23-24·리그1 22-23, 132팀경기, 오픈플레이) 1.1·3.0회 */cands.push({m,tx,ty,d,tfx,tfy,openR,ln,sc,run,race,deep})}
    if(!cands.length){const tfx=clamp(fx+25,40,80);return {k:'clear',x:F(s,tfx),y:Lt(s,34+(r()-.5)*30)}}
    const tau=CFG.d5Tau*(1-(attr(a.p,'pass',s)-12)*.03);let m2=-99;for(const c of cands)if(c.sc>m2)m2=c.sc;const ws=cands.map(c=>Math.exp((c.sc-m2)/tau));const tw2=ws.reduce((u,v)=>u+v,0);let u2=r()*tw2,ci2=0;for(;ci2<cands.length-1;ci2++){u2-=ws[ci2];if(u2<=0)break}if(a.decF&&a.decB){let bi=-1,bv=-1e9;for(let i=0;i<cands.length;i++){const c=cands[i];if(decOK(a.decB,c,fx,fy)&&c.sc>bv){bv=c.sc;bi=i}}if(bi>=0)ci2=bi}
    if(CFG.sbTrk&&!a.gk){const D=st.dbg||(st.dbg={});const z=fx<60?'<60':fx<75?'60-75':'75+';let hb=0,wb=0;cands.forEach((q,i)=>{if(q.tfx>off+.5&&fx<off&&q.tfx>fx+2){hb++;wb+=ws[i]}});D['pdN_'+z]=(D['pdN_'+z]||0)+1;for(const m of P[s]){if(m===a||m.gk)continue;if(m.run>st.sec){D['pdR_'+z]=(D['pdR_'+z]||0)+1;if(F(s,m.tx)>off+.5)D['pdRB_'+z]=(D['pdRB_'+z]||0)+1;if(F(s,m.x)>off+.3)D['pdRO_'+z]=(D['pdRO_'+z]||0)+1}else if(F(s,m.x)>off+.3)D['pdSO_'+z]=(D['pdSO_'+z]||0)+1}if(hb){D['pdB_'+z]=(D['pdB_'+z]||0)+1;D['pdK_'+z]=(D['pdK_'+z]||0)+hb}D['pdW_'+z]=(D['pdW_'+z]||0)+wb/tw2}const c=cands[ci2];if(opt.d5dump)opt.d5dump(a,cands,c,fx,fy,nd);
    /* 높이: 로지스틱 */const hw=D5.height.w;const hf=[1,c.d/10,(c.d/10)**2,(c.tfx-fx)/10,c.ln/3,Math.min(nd,10)/5,Math.min(c.openR,10)/5,(fx>70&&Math.abs(fy-34)>14&&c.tfx>88.5&&Math.abs(c.tfy-34)<20.16)?1:0,a.gk?1:0,fx<35?1:0,Math.abs(c.tfy-fy)>28?1:0];let hz=0;for(let i=0;i<hw.length;i++)hz+=hw[i]*hf[i];hz+=(ti[4]-3)*.3;if(CFG.d5LofA&&fx>70&&c.tfx>fx+3&&!a.gk)hz+=CFG.d5LofA;/* 높이 보정표(SB 80경기: 구역×길이×측면→박스) */let hk=null;if(!a.gk){hk=(fx<35?'d':fx<70?'m':'a')+Math.min(4,Math.floor(c.d/10))+(hf[7]?'w':'');if(CFG.d5HtC)hz+=CFG.d5HtC[hk]||0}
    let lofted=r()<sig(hz);if(a.decF&&(a.decB==='low'||a.decB==='high')&&hf[7]===1)lofted=true;const isCross=hf[7]===1&&lofted;if(hk){const D=st.dbg||(st.dbg={});D['ht_'+hk]=(D['ht_'+hk]||0)+1;if(lofted)D['hl_'+hk]=(D['hl_'+hk]||0)+1}
    /* 성공 확률(결과 모델) → 부정확/차단 분리 */
    const intoBox=(c.tfx>88.5&&Math.abs(c.tfy-34)<20.16&&!(fx>88.5&&Math.abs(fy-34)<20.16))?1:0;const b2b=(c.tfx>88.5&&Math.abs(c.tfy-34)<20.16&&fx>88.5&&Math.abs(fy-34)<20.16)?1:0;const pOk0=OC5.passOk({d:c.d,dx:c.tfx-fx,pressP:nd,openR:c.openR,lane:c.ln,lofted:lofted?1:0,cross:isCross?1:0,intoBox,b2b,px:fx,gk:a.gk?1:0,dy:c.tfy-fy,shift:((intoBox||b2b)?CFG.d5BoxSh:0)+(CFG.d5CmpC&&!a.gk?(CFG.d5CmpC[(fx<35?'d':fx<70?'m':'a')+Math.min(4,Math.floor(c.d/10))+(lofted?'L':'G')]||0):0)+(fx>70&&!a.gk?(Math.abs(c.tfx-fx)<=3?CFG.d5LatCA:(c.tfx<fx-3?CFG.d5BackCA:0)):0)+(fx>=35&&fx<70&&!a.gk?(c.tfx>=70?CFG.d5MtoA:c.tfx>fx+3?CFG.d5MFwdA:0):0)+(CFG.d5SwC&&!a.gk&&c.d>=40&&Math.abs(c.tfy-fy)>28?CFG.d5SwC:0)+ab5(a,'pass',CFG.d5PassK)+(nd<2?ab5(a,'comp',.04):0)+(T[s].preset==='티키타카'&&c.d<18?.15:0)});
    const pOk=clamp(pOk0,.03,.99);const lr=laneRisk(o,a.x,a.y,c.tx,c.ty,lofted?20:15,lofted);const q=1-pOk;const share=lr.best?(c.ln<2?CFG.d5IntA:CFG.d5IntB):0;lr.p=Math.min(.9,q*share);const acc=clamp(pOk/(1-lr.p),.02,1);
    const through=c.deep===1;a.lastC5=[+c.openR.toFixed(1),+c.ln.toFixed(1),+nd.toFixed(1)];if(a.gk){const D=st.dbg||(st.dbg={});const dc=c.d<20?0:c.d<40?1:2;D['gkd'+s+'_'+dc]=(D['gkd'+s+'_'+dc]||0)+1;D['gkc'+a.gkCls+'_'+dc]=(D['gkc'+a.gkCls+'_'+dc]||0)+1;const mx=Math.max(...P[s].filter(m=>m!==a).map(m=>hyp(m.x-a.x,m.y-a.y)));D['gkMax'+(mx<40?'<40':mx<55?'40-55':'55+')]=(D['gkMax'+(mx<40?'<40':mx<55?'40-55':'55+')]||0)+1}
    if(isCross&&CFG.d5CrossAir)return {k:'cross',m:c.m,d:c.d};
    if(through&&CFG.thrTrk){const D=st.dbg||(st.dbg={});const ob=off<70?'<70':off<80?'70-80':off<88?'80-88':'88+';D['tO_'+ob]=(D['tO_'+ob]||0)+1;const pb=fx<60?'<60':fx<75?'60-75':'75+';D['tP_'+pb]=(D['tP_'+pb]||0)+1;const tb=F(s,c.tx);D['tT_'+(tb<88.5?'out':'box')]=(D['tT_'+(tb<88.5?'out':'box')]||0)+1}if(through)return {k:'through',m:c.m,px:c.tx,py:c.ty,d:c.d,pOk,acc,lr,race:c.deep?c.race:1,lob:lofted&&c.d>30};
    return {k:lofted?'long':'pass',m:c.m,d:c.d,pOk,acc,lr,lob:lofted&&c.d<30,px:c.tx,py:c.ty}}
  function ment5(t){return (t.ment==='공격적'?1:t.ment==='수비적'?-1:0)+(t.gsx||0)}
  // ---- 행동 실행 ----
  /* 터치 상실(실측 SB 360 56,852 받기: 받은 뒤 다음 행동 전 컨트롤 실수·뺏김 3.8%, 압박 1m 안 19%·4m+ 1.3%, 공격진영 ↑). 받을 때 한 번 판정 */
  const TL5=[-1.5321, -1.8406, 0.2016, -0.0122, 0.4054, -0.1053, 0.1417];
  /* 되찾은 직후 다시 잃음(SB 360 5,311 회수: 5.9%, 압박 1m 안 11%·4m+ 2%) */
  const RL5=[-1.8658, -1.3686, -0.3237, 0.2446, 0.0462, -0.106];
  function touchLoss(a){if(!CFG.tlK||a.gk||a.tlDone)return false;a.tlDone=1;const s=a.s,fx=F(s,a.x);const nd=a.rcvNd??nearestOpp(a)[0];let n3=0;for(const b of P[1-s])if(!(b.stun>0)&&hyp(b.x-a.x,b.y-a.y)<3)n3++;
    let z=0;if(a.rgT){const f=[1,Math.min(nd,8)/4,Math.max(0,1.5-nd),n3,fx>70?1:0,fx<35?1:0];for(let i=0;i<f.length;i++)z+=RL5[i]*f[i];z+=Math.log(CFG.rlK||1e-9)}else{const f=[1,Math.min(nd,8)/4,Math.max(0,1.5-nd),n3,fx>70?1:0,fx<35?1:0,a.carried?1:0];for(let i=0;i<f.length;i++)z+=TL5[i]*f[i]}z+=-ab5(a,'drib',CFG.tlA)-ab5(a,'comp',CFG.tlA*.5);
    if(r()>=sig(z)*CFG.tlK)return false;const [nd0,nb0]=nearestOpp(a);pr(a.p).r-=RW.lost;TR({k:'lost',p:a.p.name,by:nb0?nb0.p.name:'',how:'touch'});lz5(a,'touch');a.carry=null;
    const ang=nb0?Math.atan2(nb0.y-a.y,nb0.x-a.x)+(r()-.5)*1.6:r()*6.28,sp=3+r()*4;a.stun=Math.max(a.stun||0,.4);if(r()<CFG.oTl){looseOut(a.x,a.y,r()<.6?s:1-s);return true}loose(a.x+Math.cos(ang)*.8,a.y+Math.sin(ang)*.8,Math.cos(ang)*sp,Math.sin(ang)*sp);return true}
  function act(a){if((a.decB||a.decN)&&st.sec>a.decT){a.decB=null;a.decF=0;a.decG=0;a.decN=null;a.decC=0}if(a.defI&&st.sec>a.defI.t)a.defI=null;if(touchLoss(a))return;if(decScene(a))return;if(decDef(a))return;const s=a.s,o=1-s,ch=decide(a);const dG=!!(a.decG&&ch.k!=='carry'&&ch.k!=='hold');const dLow=a.decF?(a.decB==='low'?1:a.decB==='high'?0:-1):-1;let dfx=null;if(a.defI&&ch.k!=='carry'&&ch.k!=='hold'){dfx=a.defI;a.defI=null;ev({s:1-s,t:'decAct',k:'def',pn:a.p.name,ak:ch.k,intent:dfx.intent,res:dfx.res})}if(dfx&&dfx.res==='W'&&(ch.k==='shot'?r()<CFG.defSB:(ch.m&&ch.k!=='cross'&&r()<CFG.defPI))){const bb=P[1-s].find(q=>q.p.id===dfx.b);if(bb){TR({k:'lost',p:a.p.name,by:bb.p.name,how:'block'});lz5(a,'duel');give(bb,'regain');return}}if(dfx&&dfx.res==='L'&&ch.k==='shot'){ch.xg=Math.min(.9,ch.xg*CFG.defL);if(a.sh5){a.sh5.xg=Math.min(.9,a.sh5.xg*CFG.defL);if(a.sh5.pGoal)a.sh5.pGoal=Math.min(.9,a.sh5.pGoal*CFG.defL)}}if(a.decB||a.decN){const fin=ch.k!=='carry'&&ch.k!=='hold';if(ch.k==='carry'&&['wide','carry','bdrib'].includes(a.decB||a.decN))a.decC=1;if(fin||st.sec>a.decT){if(fin)ev({s,t:'decAct',pn:a.p.name,fol:a.decF?1:0,ch:a.decB||a.decN,k:ch.k,good:a.decG?1:0,ok:decOK2(a.decB||a.decN,ch,a)!=null?decOK2(a.decB||a.decN,ch,a):(ch.k==='takeon'||((ch.k==='cross'||a.decC)&&(a.decB||a.decN)==='wide'))?((a.decB||a.decN)==='wide'?1:0):ch.m?(decOK(a.decB||a.decN,{tfx:F(s,ch.m.x),tfy:Lt(s,ch.m.y),d:ch.d||hyp(ch.m.x-a.x,ch.m.y-a.y)},F(s,a.x),Lt(s,a.y))?1:0):0,lat:ch.m?+Math.abs(Lt(s,ch.m.y)-Lt(s,a.y)).toFixed(1):null,tx:ch.m?+F(s,ch.m.x).toFixed(1):null});a.decB=null;a.decF=0;a.decG=0;a.decN=null;a.decC=0}}const fx=F(s,a.x),fy=Lt(s,a.y);
    if(opt.debug)opt.debug(st.sec,a,ch,fx,fy);if(opt.hlLog&&cur&&cur.hl){if(ch.k==='through')cur.hl[5]=1;cur.hl[7]=st.sec-cur.t0;cur.hl[10]=ch.k+':'+Math.round(F(s,a.x));cur.hl[11]=(cur.hl[11]||0)+1;cur.hl[9]=(cur.hl[9]||[]);if(cur.hl[9].length<3)cur.hl[9].push(((ch.k==='long'||ch.k==='pass')&&ch.d!=null?(ch.d>30?'long':'pass'):ch.k)+(F(s,a.x)<F(s,a.x)?'':'')+':'+Math.round(F(s,a.x)))}if(opt.hlLog&&a.recvKind==='through'&&st.sec-a.recvAt<8){const D=st.dbg||(st.dbg={});const k='ta_'+ch.k+'_'+(st.sec-a.recvAt<1?'0':st.sec-a.recvAt<3?'1':'2');D[k]=(D[k]||0)+1}
    const spP=a.spP;if(ch.k!=='hold')a.spP=null;
    if(ch.k==='pass'||ch.k==='long'||ch.k==='through'){const D=st.dbg;const k='pm_'+(a.mode||'none')+(a.gk?'GK':'');D[k]=(D[k]||0)+1}
    {const D=st.dbg||(st.dbg={});const k=ch.k+(fx>70?'3':fx>35?'2':'1');D[k]=(D[k]||0)+1}
    if(a.mode!=='drib'||st.sec>=a.dribEnd)a.mode=null;
    if(ch.k==='hold'){a.cd=(.5+r()*.4)*CFG.hScale*(1+(3-T[s].ti[3])*CFG.tempoT);a.carry=null;return}
    if(ch.k==='clear'){cur&&cur.acts++;TR({k:'long',from:a.p.name,to:'',clear:true,won:false});ev({s,t:'clear',p:a.p.name});if(CFG.clrV2){clrFly(a,s,0,nearestOpp(a)[0]>CFG.clrCtlD);return}let ex=ch.x+(r()-.5)*12;let ey=clamp(ch.y+(r()-.5)*12,1,W-1);if(r()<CFG.oClr)ey=sideOut(a.y);ex=F(s,Math.min(84,F(s,ex)));const d=hyp(ex-a.x,ey-a.y);
      ball.fl={x0:a.x,y0:a.y,x1:ex,y1:ey,t:0,T:d/22+.4,h:1.3,res:'loose',s,from:a,kind:'clear'};ball.own=null;return}
    if(ch.k==='carry'){a.carry={x:ch.x,y:ch.y};if(CFG.d5CL){/* 운반 중 상실(실측: 압박 <1m 13%·1-2m 9%·2-4m 4%·그 외 0.6%, 공격 진영 +, 거리 비례) */const [ndc]=nearestOpp(a);let n3=0;for(const b of P[o]){if(hyp(b.x-a.x,b.y-a.y)<3)n3++}const len=hyp(ch.x-a.x,ch.y-a.y);const pL=OC5.carryLoss({pressD:ndc,n3,px:fx,len,shift:-ab5(a,'drib',CFG.d5CLK)});if(r()<pL){a.cLoss=st.sec+Math.max(.3,len/(a.vm*.85))*(.3+r()*.6)}else a.cLoss=0}{const D=st.dbg||(st.dbg={});const ex=F(s,ch.x),ey=Lt(s,ch.y);if(ex>88.5&&Math.abs(ey-34)<20.16&&!(fx>88.5&&Math.abs(fy-34)<20.16)){D.cBox=(D.cBox||0)+1;D['cBox_'+(ch.brk?'brk':ch.len>=5?'A':'d')]=(D['cBox_'+(ch.brk?'brk':ch.len>=5?'A':'d')]||0)+1;D.cBoxW=(D.cBoxW||0)+(Math.abs(ey-34)>9?1:0)}}if(opt.hlLog&&cur&&cur.hl)cur.hl[20]=(cur.hl[20]||0)+Math.max(0,F(s,ch.x)-fx);{const D=st.dbg||(st.dbg={});D.cN=(D.cN||0)+1;D.cFwd=(D.cFwd||0)+(F(s,ch.x)-fx);D.cLen=(D.cLen||0)+hyp(ch.x-a.x,ch.y-a.y)}if(F(s,ch.x)>fx+2)pr(a.p).ca++;a.cd=Math.max(.4,hyp(ch.x-a.x,ch.y-a.y)/(a.vm*(ch.brk?.98:.85)))+(ch.brk?0:r()*.3);if(!a.carried){pr(a.p).tc++;a.carried=1}return}
    if(ch.k==='shot'){const type=a.recvKind==='through'&&st.sec-a.recvAt<7?'through':a.lastBeat&&st.sec-a.lastBeat<3?'solo':a.recvKind&&st.sec-a.recvAt<2.5?a.recvKind:'combo';cur&&cur.acts++;
      if(cur&&cur.lane==null)setLane(fy);return shoot(a,type,ch.xg,a.recvFrom&&st.sec-a.recvAt<4?a.recvFrom:null)}
    if(ch.k==='cross'){cur&&cur.acts++;pr(a.p).cr++;if(cur&&cur.lane==null)setLane(fy);TR({k:'cross',from:a.p.name,lane:(cur&&cur.lane!=null&&CFG.laneAtk?cur.lane:laneOfFy(fy)),sl:laneOfFy(fy)});const sw=swing(a.p,fy<34?'L':'R');
      const q=attr(a.p,'cross',s)*(footSide(a.p)==='B'?1:invF(a.p,fy)?(r()<CFG.ftW*(.6+.1*V(a.p,'wf',3))?(1+wfMul(a.p))/2:.97):(r()<.04?(1+wfMul(a.p))/2:1))-1.5+(T[o].ti[1]<=2?3:0)+(T[s].ti[2]>=4?1:0);
      pr(a.p).kp+=0;{const rr=aerial(s,{a,sw,lowF:dLow},q+(dG?CFG.decGQ:0),'cross');const D=st.dbg||(st.dbg={});D['xr_'+rr]=(D['xr_'+rr]||0)+1;return rr}}
    if(ch.k==='takeon'){cur&&cur.acts++;const b=ch.b;const win=dfx&&dfx.res==='W'?r()<Math.max(0,2*ch.pW-1):dfx&&dfx.res==='L'?r()<ch.pW+(1-ch.pW)*.8:r()<ch.pW+(dG?CFG.decGB:0);pr(a.p).da++;if(win)pr(a.p).dw++;const lane=laneOfFy(fy);TR({k:'duel',p:a.p.name,vs:b.p.name,win});duelRec(a,b,s,win,lane);
      if(win){pr(a.p).duelW++;pr(a.p).r+=RW.drib+(fx>70?RW.drib3:0);pr(b.p).duelL++;pr(b.p).ta++;if(rec&&((Math.floor(st.sec*10)+b.p.id)%5)<3)(st.tg||(st.tg=[])).push(['tm',b.p.id,a.p.id]);if(r()<CFG.foulDuel*(1+aggr(b)*.5)*(fx>88.5&&Math.abs(fy-34)<20.2?CFG.boxF:1)){cur.tr[cur.tr.length-1].foul=true;return foul(a,b,'duel')}
        b.stun=1.1;a.lastBeat=st.sec;const ang=(s?Math.PI:0)+(fy<34?.25:-.25)*(fx>80?1:0);const cl=fx>88.5?(CFG.beatCB??8):(CFG.beatC??8);a.carry={x:clamp(a.x+Math.cos(ang)*cl,1,L-1),y:clamp(a.y+Math.sin(ang)*cl,1,W-1)};a.cd=.6;ev({s,t:'dribble',p:a.p.name,d:b.p.name});return}
      pr(a.p).duelL++;pr(b.p).duelW++;pr(b.p).tkw++;pr(b.p).ta++;if(rec)(st.tg||(st.tg=[])).push(['tk',b.p.id,a.p.id]);/* v227 1대1 돌파를 막은 태클도 3D 태클 동작 */pr(b.p).r+=RW.tkw;pr(a.p).r-=RW.dribL;TR({k:'lost',p:a.p.name,by:b.p.name,how:'duel'});lz5(a,'duel');
      if(r()<.65)give(b,'regain');else loose(b.x,b.y,(r()-.5)*8,(r()-.5)*8);return}
    // 패스 계열
    const m=ch.m;cur&&cur.acts++;let tx,ty,sp,kind=ch.k;pr(a.p).pa++;
    if(kind==='through'){tx=ch.px;ty=ch.py;sp=ch.lob?20:16;pr(a.p).tb++}else{/* 목표점: 판단 단계의 후보 도착점(달리는 동료 앞 공간·GK 롱킥 선행) */if(CFG.d5&&ch.px!=null){tx=ch.px;ty=ch.py}else{tx=clamp(m.x+(m.vx||0)*.4,.5,L-.5);ty=clamp(m.y+(m.vy||0)*.4,.5,W-.5)}sp=CFG.d5?(kind==='long'?18:ch.d<12?10:ch.d<25?12.5:14.5):(kind==='long'?20:ch.d<12?12:ch.d<25?15:18)}
    const d=hyp(tx-a.x,ty-a.y),dur=Math.max(.35,d/sp+(kind==='long'?.5:0));if(kind==='long'){(st.lg||(st.lg=[0,0]))[s]++}
    const mfx=F(s,m.x),mfy=Lt(s,m.y),tfx=F(s,tx),tfy=Lt(s,ty);
    // 오프사이드(패스 순간 받는 선수 위치)
    const off=offLine(s);if(mfx>off+.3&&mfx>52.5){st.off[s]++;TR({k:'off',p:m.p.name});ev({s,t:'offside',p:m.p.name});flight(a.x,a.y,tx,ty,dur,(kind==='long'||ch.lob)?1:0);st.after=()=>restart('free',o,m.x,m.y);return}
    // 마지막 패스 표시
    const isFinal=tfx>80&&xgGeo(tfx,tfy)>.045;let ftype=null;if(isFinal){ftype=kind==='through'?'through':fx>90&&(fy<22||fy>46)&&tfx<fx?'cutback':'combo';TR({k:'final',type:ftype,from:a.p.name,to:m.p.name});if(cur&&cur.lane==null)setLane(tfy)}
    // 결과 결정: 부정확 → 흐른 공 / 차단 → 가로챔 / 성공
    const D=st.dbg||(st.dbg={});D['p_'+kind]=(D['p_'+kind]||0)+1;D['pk_'+kind+'_'+s]=(D['pk_'+kind+'_'+s]||0)+1;st.pAcc=[ch.acc,ch.lr?ch.lr.p:0,a.mode,nearestOpp(a)[0],spP||0];if(opt.ctx){let t10=0,t15=0,o5=0,o10=0,ro=99;for(const q of P[s])if(q!==a&&!q.gk){const d=hyp(q.x-a.x,q.y-a.y);if(d<10)t10++;if(d<15)t15++}for(const q of P[o]){const d=hyp(q.x-a.x,q.y-a.y);if(d<5)o5++;if(d<10)o10++;const e=hyp(q.x-tx,q.y-ty);if(e<ro)ro=e}st.pAcc.push(t10,t15,o5,o10,ro,F(s,a.x),hyp(tx-a.x,ty-a.y))}
    if(CFG.sbTrk&&!a.gk){const bh=tfx>off+.5&&fx<off&&tfx>fx+2;st.lpB={m,b:bh,t:st.sec};if(bh){const lat=Math.abs(tfy-34)>20.16?'wide':'cent';D['sW_'+lat]=(D['sW_'+lat]||0)+1;const Lp=hyp(tx-a.x,ty-a.y);D['sL_'+(Lp<15?'<15':Lp<30?'15-30':'30+')]=(D['sL_'+(Lp<15?'<15':Lp<30?'15-30':'30+')]||0)+1;const rd=hyp(m.x-tx,m.y-ty);D['sD_'+(rd<3?'<3':rd<8?'3-8':'8+')]=(D['sD_'+(rd<3?'<3':rd<8?'3-8':'8+')]||0)+1;st.sbLat=lat}}if(CFG.sbTrk&&!a.gk&&tfx>off+.5&&fx<off&&tfx>fx+2){const pb=fx<60?'<60':fx<75?'60-75':'75+';D['sA_'+pb]=(D['sA_'+pb]||0)+1;D['sT_'+(tfx<88.5?'out':'box')]=(D['sT_'+(tfx<88.5?'out':'box')]||0)+1;D['sK_'+kind]=(D['sK_'+kind]||0)+1;st.sbPend={m,t:st.sec}}let acc=ch.acc;if(dG&&CFG.decGB)acc=Math.min(.99,acc+CFG.decGB);if(dfx&&dfx.res==='W')acc=Math.max(.2,acc-CFG.defWA);else if(dfx&&dfx.res==='L'){acc=Math.min(.98,acc+CFG.defLA);(st.decTmA||(st.decTmA=[]))[s]={s,o:'bpass',until:st.sec+6,sh:CFG.defPS}}if(kind==='through'&&CFG.thrAcc)acc*=CFG.thrAcc;/* v212 스루패스 성공률 실측 35%(SB) */if(CFG.chemK&&T[s].chem){const cm=T[s].chem[a.p.id];const cv=cm&&cm[m.p.id];if(cv)acc=1-(1-acc)*(1-CFG.chemK*cv)}/* v156 선수 호흡(-1~1): 빗나갈 확률을 최대 chemK만큼 줄이거나 늘림 */if(CFG.momK){const mm=momOf(s);if(mm>0)acc=1-(1-acc)*(1-CFG.momK*Math.min(1,mm))}
    if(r()>acc){D['pm_'+kind]=(D['pm_'+kind]||0)+1;const err=3+d*.14;let ex=tx+(r()-.5)*2*err;let ey=ty+(r()-.5)*2*err;if(CFG.missTo&&r()<CFG.missTo){/* v143 빗나간 패스는 대개 상대 발밑·앞으로(실측 실패 패스 뒤 상대 소유 64~82%) */let b=null,bd=err+6;for(const q of P[o]){if(q.gk)continue;const dd=hyp(q.x-tx,q.y-ty);if(dd<bd){bd=dd;b=q}}if(b){ex=b.x+(r()-.5)*2.5;ey=b.y+(r()-.5)*2.5}}let exx=ex;if(F(s,tx)>86&&r()<CFG.oEnd)exx=s?-1.5:L+1.5;else if(r()<CFG.oPass)ey=sideOut(ey);const trM=TR({k:kind==='long'?'long':'pass',from:a.p.name,to:m.p.name,miss:true,won:false});
      ball.fl={x0:a.x,y0:a.y,x1:exx,y1:ey,t:0,T:dur,h:(kind==='long'||ch.lob)?1:0,res:'loose',s,from:a,trL:kind==='long'?trM:null};ball.own=null;pr(a.p).r-=RW.pMiss+(fx<35?RW.pMiss3:0);st.pass[s][1]++;return}
    const lr=ch.lr;if(lr.best&&r()<(ch.k==='through'?lr.p*(CFG.thrLr??.8):lr.p)*(1+TV(lr.best,'가로채기')*CFG.trInt)*(isFinal?1-TVc(a,'찬스의 질','pass')*CFG.trCq:1)){D['pi_'+kind]=(D['pi_'+kind]||0)+1;if(kind==='long')TR({k:'long',from:a.p.name,to:m.p.name,won:false,int:true});const b=lr.best;const ix=a.x+(tx-a.x)*lr.bt,iy=a.y+(ty-a.y)*lr.bt;
      if(isFinal)TR({k:'intercept',p:b.p.name,type:ftype});else TR({k:'lost',p:a.p.name,by:b.p.name,how:F(s,a.x)<60&&hyp(b.x-a.x,b.y-a.y)<6?'press':'intc'});
      if(r()<CFG.oInt){ball.fl={x0:a.x,y0:a.y,x1:ix,y1:sideOut(iy),t:0,T:Math.max(.25,dur*lr.bt)+.4,h:0,res:'loose',s,from:a,lastS:o};ball.own=null;st.pass[s][1]++;return}ball.fl={x0:a.x,y0:a.y,x1:ix,y1:iy,t:0,T:Math.max(.25,dur*lr.bt),h:kind==='long'?.6:0,res:'int',to:b,s,from:a};ball.own=null;b.tx=ix;b.ty=iy;pr(b.p).r+=RW.intc;pr(a.p).r-=RW.pLost*(fx<35?2:fx<70?1:.5);if(lr.bt<.85)pr(b.p).it++;else pr(b.p).rc=(pr(b.p).rc||0)+1;st.pass[s][1]++;
      if(isFinal)ev({s,t:'intercept',p:b.p.name,type:ftype});return}
    if(kind==='through'&&r()>ch.race){st.pass[s][1]++;TR({k:'final',type:'through',from:a.p.name,to:m.p.name,lost:true});const b=nearestOpp({x:tx,y:ty,s})[1];
      ball.fl={x0:a.x,y0:a.y,x1:tx,y1:ty,t:0,T:dur,h:0,res:'int',to:b,s,from:a};ball.own=null;return}
    if(kind==='long'&&!CFG.d5){const [rd,rb]=nearestOpp({x:tx,y:ty,s});if(rd<CFG.lgR+CFG.lgT*d/20&&rb){const won=r()<clamp(.5+airZ(tfx)+(airC(m.p,s)-airC(rb.p,o))*.04,.15,.85);TR({k:'long',from:a.p.name,to:m.p.name,vs:rb.p.name,won});{const D=st.dbg||(st.dbg={});const z=tfx<35?'D':tfx<70?'M':'A';D['air'+z]=(D['air'+z]||0)+1;D['airW'+z]=(D['airW'+z]||0)+(won?1:0)}pr(m.p).at++;pr(rb.p).at++;pr((won?m:rb).p).aw++;duelRec(m,rb,s,won,laneOfFy(tfy),true);
        const lres=won?(r()<.55?'ok':'loose'):(r()<.5?'int':'loose');st.pass[s][lres==='ok'?0:1]++;ball.fl={x0:a.x,y0:a.y,x1:tx,y1:ty,t:0,T:dur,h:1,res:lres,to:won?m:rb,s,from:a,kind};ball.own=null;m.tx=tx;m.ty=ty;return}
      TR({k:'long',from:a.p.name,to:m.p.name,won:true,free:true})}
    else TR(kind==='long'?{k:'long',from:a.p.name,to:m.p.name,won:true}:{k:'pass',from:a.p.name,to:m.p.name});/* v158 d5 엔진에서 롱볼 성공이 'pass'로만 기록돼 롱볼 경합 승이 늘 0이던 문제 */
    if(isFinal){pr(a.p).kp++;pr(a.p).r+=RW.kp}
    ball.fl={x0:a.x,y0:a.y,x1:tx,y1:ty,t:0,T:dur,h:(kind==='long'||ch.lob)?1:0,res:'ok',to:m,s,from:a,kind:ftype||kind};ball.own=null;m.tx=tx;m.ty=ty;/* v123 압박 회피: 공을 막 압박하던 수비수는 패스가 자기 뒤(받는 사람이 골문 쪽 앞)로 빠지면 몸을 돌려야 해 반응 지연 — 압박이 강할수록 많이 달려들어 대가도 큼 */if(CFG.pbLate&&tfx>fx+3){const ti5=T[o].ti[5]||3;for(const b of P[o]){if(b.gk||!(b.press>=st.sec-1))continue;if(F(s,b.x)<tfx-2)b.late=Math.max(b.late||0,st.sec+CFG.pbLate*(1+.25*(ti5-3)))}}
    if(kind==='pass'&&!a.gk&&fx>40&&ch.d<18){const [nd2,nb2]=nearestOpp(a);const t=T[s];const oLw=(()=>{let l1=0,l2=0;for(const b of P[o]){const f=F(s,b.x);if(f>l1){l2=l1;l1=f}else if(f>l2)l2=f}return L-l2})();const wk=(1+CFG.cWall*clamp((CFG.cL0-oLw)/12,0,1)*CFG.cAuto*iqF(a))*(afOf(s)==='combo'?1+CFG.afWall:1)*CFG.wallP*(1+(attr(a.p,'offball',s)-12)*.05)*(a.fl.create||a.fl.inside||a.role==='메짤라'?1.4:1)*(t.preset==='티키타카'?1.3:1)*(1+(t.ti[3]-3)*.1)*(1+(3-t.ti[4])*.15)*(1+tw(s)*.2);
      const lay=a.g==='ST'&&tfx<=fx+3&&['W','AM','CM','ST'].includes(m.g)&&nd2<4.5;
      if(lay&&r()<wk*CFG.layK*(a.fl.target||a.fl.hold?1.4:1)){a.rk='str';a.rfy=Lt(s,a.y);a.run=st.sec+3.4;a.runGo=st.sec+.35;a.wallDef=nb2;m.wallFrom=a;m.wallT=st.sec+2.8;if(nb2)nb2.late=st.sec+CFG.wallLate*(afOf(s)==='combo'?CFG.afWL:1)*(1.3-attr(nb2.p,'posit',1-s)/20*.6);{const D=st.dbg||(st.dbg={});D.layStart=(D.layStart||0)+1}}
      else if(nd2<4&&nb2&&F(s,nb2.x)>=fx-1&&r()<wk){a.rk='wall';{const D=st.dbg||(st.dbg={});D.run_wall=(D.run_wall||0)+1}a.run=st.sec+2.6;a.runGo=st.sec;a.wallDef=nb2;m.wallFrom=a;m.wallT=st.sec+2.4;nb2.late=st.sec+CFG.wallLate*(afOf(s)==='combo'?CFG.afWL:1)*(1.3-attr(nb2.p,'posit',1-s)/20*.6);{const D=st.dbg||(st.dbg={});D.wallStart=(D.wallStart||0)+1}}}st.pass[s][0]++;{const D=st.dbg||(st.dbg={});if(a.wallFrom===m&&st.sec<(a.wallT||0)+1.5)D['g2g_'+s]=(D['g2g_'+s]||0)+1;if(CFG.plog)(st.plog||(st.plog=[])).push([st.sec,s,a.p.id,m.p.id,+fx.toFixed(1),+tfx.toFixed(1)]);if(tfx>88.5&&Math.abs(tfy-34)<20.16&&!(fx>88.5&&Math.abs(fy-34)<20.16))D['boxin_'+s]=(D['boxin_'+s]||0)+1}pr(a.p).r+=RW.pOk+Math.max(0,Vv(tfx,tfy)-Vv(fx,fy))*RW.pProg}
  function setLane(fy){if(opt.hlLog&&cur&&cur.hl)cur.hl[6]=1;{const D=st.dbg||(st.dbg={});D.f3=(D.f3||0)+1}const l=laneOfFy(fy);cur.lane=l;cur.tr.push({k:'lane',lane:l});st.lane[cur.s][l]++}
  // ---- 대형 목표 위치 ----
  /* ---- 상황별 자리 채우기(측면 크로스·컷백·역습 / 박스 수비·침투 추적) ----
     상황마다 채울 자리 목록(우선순위)을 두고, 가까운 선수부터 역할·능력·체력·임무·무작위 편차를 반영한 비용으로 채움.
     같은 상황이 이어지는 동안은 배정을 유지(1.5초마다 재평가) → 매번 같은 사람이 같은 자리에 가지 않음 */
  const SITS=[{},{}];
  const SROLE={near:{ST:0,W:.6,AM:.8,CM:1.4,DM:3,FB:3},far:{W:0,ST:.4,AM:.7,CM:1.3,DM:3,FB:2.2},box:{ST:.1,AM:.3,W:.5,CM:.8,DM:2.5,FB:3},edge:{CM:0,AM:.2,DM:.5,W:1,ST:1.5,FB:1.2},lane:{W:0,ST:0,AM:.2,CM:.8,FB:1.5,DM:2},
    zone:{CB:0,FB:.2,DM:.3,CM:.8,W:1.6,AM:1.6,ST:4},mark:{CB:0,FB:.2,DM:.2,CM:.6,W:1.2,AM:1.3,ST:4},dedge:{DM:0,CM:.2,AM:.6,W:1,FB:1.5,CB:3,ST:3}};
  function sitFill(q,s,key,mkSlots,elig,frame){let S_=SITS[q][s===q?'a':'d'];if(!S_||S_.key!==key||st.sec>S_.until){const slots=mkSlots();const used=new Set(),asg=[];const jit=S_&&S_.key===key?S_.jit:new Map();
      for(const sl of slots){let best=null,bc=sl.lim||5;for(const a of P[q]){if(used.has(a)||!elig(a,sl))continue;if(!jit.has(a))jit.set(a,r()*.9);const rp=(SROLE[sl.k]||{})[a.g];if(rp==null)continue;
          const d=hyp(a.x-F(frame,sl.x),a.y-Lt(frame,sl.y))/a.vm;const c=d+rp+jit.get(a)+(sl.bonus?sl.bonus(a):0)+(st.fatigue[q][a.p.id]||0)/120-(sl.k==='near'||sl.k==='far'||sl.k==='box'?(TV(a,'박스 침투')+TV(a,'박스 포식자'))*CFG.trBox:0)-(sl.k==='lane'?TV(a,'라인 줄타기')*CFG.trLine:0);if(c<bc){bc=c;best=a}}
        if(best){{const D=st.dbg||(st.dbg={});D.bm5=(D.bm5||0)+1}used.add(best);best.bm=st.sec;asg.push([best,sl])}}
      S_=SITS[q][s===q?'a':'d']={key,until:st.sec+(s===q?1.5:.8),asg,jit}}
    return S_.asg}
  function sitAtk(s,off){const c=ball.own;if(!c||c.s!==s){SITS[s].a=null;return}const t=T[s],cfx=F(s,c.x),cfy=Lt(s,c.y),side=cfy<34?-1:1;const ay=Math.abs(cfy-34);
    let key=null,mk=null;const tilt=(t.preset==='측면 공략'?1:0)+(t.ment==='공격적'?1:t.ment==='수비적'?-1:0)+(t.gsx||0);
    if(CFG.sitC&&cfx>=93&&ay>4&&ay<20.16){key='cut'+side;mk=()=>{const nb=clamp(3+tilt+(r()<.3?-1:r()>.8?1:0),2,4);const B=[{x:92,y:34-side,k:'box'},{x:100.5,y:34+side*2,k:'near'},{x:97.5,y:34-side*5,k:'far'},{x:89.5,y:34+side*6,k:'box'}].slice(0,nb);return B.concat([{x:86,y:34-side*3,k:'edge'}])}}
    else if(CFG.sitX&&cfx>=72&&ay>=14){const [cnd]=nearestOpp(c);const deep=cfx>=CFG.sitXd||(cnd>CFG.xRdy&&st.sec-(c.recvAt||0)>.6);key='x'+side+(deep?'d':'s');
      if(!deep)mk=()=>{const B=[{x:98,y:34-side*6,k:'far',lim:5}].slice(0,(tilt>0?1:0)+(r()<.45?1:0));return B.concat([{x:85,y:34+side*5,k:'near',lim:5},{x:85.5,y:34-side*7,k:'box',lim:5}].slice(0,r()<.5?1:2),[{x:84,y:34+side*2,k:'edge'}])};
      else mk=()=>{const nb=clamp(4+tilt-(r()<.4?1:0),2,4);
        const B=[{x:99.5,y:34+side*4,k:'near',lim:6.5,bonus:a=>-(airC(a.p,s)-12)*.05},{x:98.5,y:34-side*6,k:'far',lim:6.5,bonus:a=>a.run>st.sec&&a.rk==='far'?-1:0},{x:93.5,y:34-side,k:'box',lim:6.5},{x:95.5,y:34+side*8,k:'box',lim:6.5,bonus:a=>-(airC(a.p,s)-12)*.05}].slice(0,nb);
        return B.concat([{x:85,y:34+side*2,k:'edge'},{x:87.5,y:34-side*12,k:'edge'}].slice(0,r()<.55?1:2))}}
    else if(CFG.sitK&&cur&&cur.counter&&cur.s===s&&st.sec-cur.t0<8&&cfx>35&&cfx<85&&P[1-s].filter(b=>!b.gk&&F(s,b.x)>cfx).length<=6){key='cnt';mk=()=>{const lanes=[34-13,34,34+13].filter(y=>Math.abs(y-cfy)>7);return lanes.map(y=>({x:Math.min(cfx+13,off-.7),y,k:'lane',lim:4}))}}
    else if(CFG.sitL&&cfx>=40&&cfx<80&&ay<22&&!(cur&&cur.counter&&st.sec-cur.t0<8)){/* 라인 고정: 전방 2명이 오프사이드 라인에 서서 수비 라인을 묶고 뒷공간을 노림 */
      key='line';mk=()=>{const sd=cfy<34?1:-1;return [{x:off-.8,y:34+sd*(1+r()*4),k:'lane',lim:3.5},{x:off-1,y:34-sd*(10+r()*5),k:'lane',lim:3.5},{x:off-1.2,y:34+sd*(12+r()*5),k:'lane',lim:3.5}].slice(0,CFG.sitL)}}
    if(!key){SITS[s].a=null;return}
    const asg=sitFill(s,s,key,mk,(a,sl)=>a!==c&&!a.gk&&a.g!=='CB'&&!(CFG.runKeep&&a.run>st.sec&&st.sec>=a.runGo)&&!(sl.k!=='edge'&&sl.k!=='lane'&&(a.g==='DM'||a.g==='FB'))&&!(a.duty===0&&sl.k!=='edge'),s);
    for(const [a,sl] of asg){let fx=sl.x;if(sl.k!=='lane')fx=Math.min(fx,Math.max(off-.6,cfx-1));a.tx=F(s,clamp(fx,2,L-2));a.ty=Lt(s,clamp(sl.y+(a.jy??(a.jy=(r()-.5)*2)),2,W-2));a.urg=a.urg0=(a.g==='CM'||a.g==='DM')&&sl.k!=='edge'?.8:1}}
  function sitDef(d){const s=1-d;let c=ball.own;/* v124: 패스가 날아가는 동안(공 소유자 없음)에도 도착 지점 기준으로 박스 수비 배치를 유지. 이전엔 패스마다 수비가 기본 라인 위치로 튀어나갔다가 받은 뒤 0.5초 지나서야 박스로 돌아옴 */if(!c&&CFG.sitFl&&ball.fl&&!ball.fl.show&&ball.fl.s===s)c={x:ball.fl.x1,y:ball.fl.y1,s,recvAt:st.sec,vx:0,vy:0,p:null,gk:0};if(!c||c.s!==s){SITS[d].d=null;return}const cfx=F(s,c.x),cfy=Lt(s,c.y),side=cfy<34?-1:1,ay=Math.abs(cfy-34);
    /* 침투 추적: 뛰기 시작한 공격수에게 가장 가까운 수비 1명이 따라붙음 */
    const tracked=new Set();if(CFG.sitTrk)for(const x of P[s]){if(x.gk||!(x.run>st.sec&&st.sec>=x.runGo)||!x.rk)continue;let bb=null,bd=12;for(const b of P[d]){if(b.gk||tracked.has(b))continue;if(F(s,b.x)<F(s,x.x)-6)continue;const dd=hyp(b.x-x.x,b.y-x.y);if(dd<bd){bd=dd;bb=b}}
      if(bb){tracked.add(bb);const gx=F(s,L);bb.tx=clamp(x.x+(x.vx||0)*.5+(gx>x.x?1:-1)*1.2,1,L-1);bb.ty=clamp(x.y+(x.vy||0)*.5+(34-x.y)*.05,1,W-1);bb.urg=bb.urg0=1}}
    let key=null;if(!CFG.sitBox)return;if(cfx>=90&&ay<20.16)key='dc'+side;else if(ay>=14&&cfx>=70&&(cfx>=CFG.sitXd||(nearestOpp(c)[0]>CFG.xRdy&&st.sec-(c.recvAt||0)>.6)))key='dx'+side;else if(cfx>=70&&ay>=14)key='dw'+side;
    if(!key&&CFG.sitM&&cfx>=62){/* 중앙 공격 진영: 박스 근처 공격수 대인 마크 + 페널티 스폿 커버 */
      const asg=sitFill(d,s,'dm',()=>{const A=P[s].filter(a=>a!==c&&!a.gk&&F(s,a.x)>78&&Math.abs(Lt(s,a.y)-34)<24).sort((a,b)=>xgGeo(F(s,b.x),Lt(s,b.y))-xgGeo(F(s,a.x),Lt(s,a.y))).slice(0,4);
          const BZ=[];if(CFG.bzN&&cfx<92){/* v124 박스 지키기: 실측(SkillCorner) 공이 박스 앞 16.5~25m일 때 수비 3.4명이 박스 안(8~16m 깊이에 2.8명). 공격수가 없어도 박스 안 구역을 먼저 채움. 낮은 라인일수록 1명 더 */const ti0=T[d].ti[0]||3,nz=CFG.bzN+(ti0<=2?1:0)+(ti0>=4?-1:0),dz=clamp(CFG.bzK*(L-cfx)+CFG.bzB,8,17),yc=34+(cfy-34)*.35;const OY=[0,-8,8,-15,15];for(let k=0;k<nz&&k<OY.length;k++)BZ.push({x:L-dz-(k?1.5:0),y:clamp(yc+OY[k],22,46),k:'zone',lim:CFG.bzL})}
          return A.map(a=>({x:F(s,a.x)+.7,y:Lt(s,a.y),k:'mark',lim:4,tg:a})).concat([{x:Math.max(92,cfx+4),y:34,k:'zone',lim:4}],BZ)},(b,sl)=>!b.gk&&!tracked.has(b),s);
      for(const [b,sl] of asg){let x=sl.x,y=sl.y;if(sl.tg){const ax=F(s,sl.tg.x),ay2=Lt(s,sl.tg.y),ux=cfx-ax,uy=cfy-ay2,ud=hyp(ux,uy)||1;x=ax+.7+ux/ud*CFG.mkBs;y=ay2+(34-ay2)*.06+uy/ud*CFG.mkBs}b.tx=F(s,clamp(x,1,L-1));b.ty=Lt(s,clamp(y,1,W-1));b.urg=b.urg0=1}return}
    if(!key){SITS[d].d=null;return}
    const asg=sitFill(d,s,key,()=>{const shal=key.startsWith('dw');const Z=shal?[{x:88,y:34+side*3,k:'zone'},{x:88,y:34-side*5,k:'zone'}]:[{x:100.5,y:34+side*3.5,k:'zone'},{x:100,y:34-side,k:'zone'},{x:99,y:34-side*5.5,k:'zone'},{x:92.5,y:34-side*.5,k:'zone'},{x:95,y:34-side*10,k:'zone',lim:4.5}];
        const A=P[s].filter(a=>a!==c&&!a.gk&&(F(s,a.x)>82||F(s,a.tx)>88)&&Math.abs(Lt(s,a.y)-34)<22).sort((a,b)=>airC(b.p,s)-airC(a.p,s)).slice(0,4);
        const M_=A.map(a=>({x:F(s,a.x)+.9,y:Lt(s,a.y)+(34-Lt(s,a.y))*.08,k:'mark',lim:4.5,tg:a}));return Z.concat(M_,[{x:84.5,y:34+side*2,k:'dedge',lim:4}])},
      (b,sl)=>!b.gk&&!tracked.has(b),s);
    for(const [b,sl] of asg){let x=sl.x,y=sl.y;if(sl.tg){const ax=F(s,sl.tg.x),ay2=Lt(s,sl.tg.y),ux=cfx-ax,uy=cfy-ay2,ud=hyp(ux,uy)||1;x=ax+.7+ux/ud*CFG.mkBs;y=ay2+(34-ay2)*.06+uy/ud*CFG.mkBs}b.tx=F(s,clamp(x,1,L-1));b.ty=Lt(s,clamp(y,1,W-1));b.urg=b.urg0=1}}
  /* ===== 엔진5 위치 모델: 실측 테이블(POS5) 기반 =====
     역할×국면×공 위치(x 7구간·y 5구간) 평균 위치를 이중선형 보간. 왼쪽 슬롯은 거울. 전술 지시(라인·폭·멘탈리티)는 테이블 위에 가감.
     테이블이 라인 높이·공 쪽 쏠림·풀백 전진·윙 복귀·낮은 블록 밀집을 한꺼번에 담고 있으므로 v112~v124의 개별 보정은 모두 제거 */
  const P5=(typeof POS5!=='undefined')?{T:POS5,XC:POS5_XC,YC:POS5_YC}:require('./pos_table.js') && {T:require('./pos_table.js').POS5,XC:require('./pos_table.js').POS5_XC,YC:require('./pos_table.js').POS5_YC};
  function p5look(role,ph,bx,by){const RT=P5.T[role]||P5.T.CM;const G=RT[ph]||RT.in;const XC=P5.XC,YC=P5.YC;let i=0;while(i<XC.length-2&&bx>XC[i+1])i++;let j=0;while(j<YC.length-2&&by>YC[j+1])j++;
    const tx=clamp((bx-XC[i])/(XC[i+1]-XC[i]),0,1),ty=clamp((by-YC[j])/(YC[j+1]-YC[j]),0,1);const c00=G[i][j],c10=G[i+1][j],c01=G[i][j+1],c11=G[i+1][j+1];
    const L_=(a,b,k)=>a+(b-a)*k;return [L_(L_(c00[0],c10[0],tx),L_(c01[0],c11[0],tx),ty),L_(L_(c00[1],c10[1],tx),L_(c01[1],c11[1],tx),ty),L_(L_(c00[2],c10[2],tx),L_(c01[2],c11[2],tx),ty),L_(L_(c00[3],c10[3],tx),L_(c01[3],c11[3],tx),ty)]}
  /* 슬롯 → 테이블 역할. 같은 국면의 슬롯 구성(센터백 3명·더블 피벗 등)에 따라 변형 선택 */
  function p5role(sg,fy,slots,sgs){const n=g=>sgs.filter(x=>x===g).length;const c=Math.abs(fy-34);
    if(sg==='GK')return 'GK';if(sg==='CB')return n('CB')>=3&&c<4?'CBc':'CB';if(sg==='FB')return n('CB')>=3?'WB':'FB';if(sg==='DM')return n('DM')>=2?'DMw':'DM';
    if(sg==='AM')return c>14?'W':'AM';if(sg==='CM')return 'CM';if(sg==='W')return 'W';return 'CF'}
  /* v161 지속 로테이션(자리 바꿈): 두 동료가 서로의 자리(위치표 슬롯)를 20초~2분 맡음. 실측(SkillCorner 20경기, 13초 평활 위치가 20초 이상 좌우로 뒤바뀜) 팀당 경기 약 8.9회 —
     중앙 공격수↔윙어 2.5·윙어끼리(좌우 전환) 0.8·투톱끼리 0.4·공격형 미드↔윙어/공격수 0.75·중앙 미드↔윙어 0.65·같은 쪽 풀백↔윙어 0.2. rotR = 경기(90분)당 시작 횟수, rotK 전체 배수 */
  function rotTick(s,t,sh,ags){const R=t.rots||(t.rots=[]);for(let k=R.length-1;k>=0;k--){const x=R[k];if(x.until<st.sec||ags.indexOf(x.a)<0||ags.indexOf(x.b)<0)R.splice(k,1)}
    const now=st.sec,dt=Math.max(0,Math.min(5,now-(t.rotT??now)));t.rotT=now;
    if(!ball.rs&&R.length<2&&dt>0){const S2=sh.sgA,A=sh.atk,rl=ags.map((a,i)=>a.gk?'GK':p5role(S2[Math.min(i,S2.length-1)],A[Math.min(i,A.length-1)].fy,A,S2)),fy=i=>A[Math.min(i,A.length-1)].fy;
      const busy=new Set(R.flatMap(x=>[x.a,x.b]));const typ=(i,j)=>{const a=rl[i],b=rl[j],has=(x,y)=>(a===x&&b===y)||(a===y&&b===x);
        if(has('CF','W'))return 'cw';if(a==='W'&&b==='W')return (fy(i)<34)!==(fy(j)<34)?'ww':null;if(a==='CF'&&b==='CF')return 'cc';if(has('AM','W')||has('AM','CF'))return 'aw';
        if(has('CM','W')||has('DM','W')||has('DMw','W'))return 'mw';if((has('FB','W')||has('WB','W'))&&(fy(i)<34)===(fy(j)<34))return 'fw';return null};
      const RR=CFG.rotR||{};const pairs={};for(let i=1;i<ags.length;i++)for(let j=i+1;j<ags.length;j++){if(busy.has(ags[i])||busy.has(ags[j]))continue;const k=typ(i,j);if(k)(pairs[k]=pairs[k]||[]).push([i,j])}
      for(const k in pairs){const rate=(RR[k]||0)*(CFG.rotK??1);if(r()<rate*dt/5400){const [i,j]=pairs[k][Math.floor(r()*pairs[k].length)];st.rotN=(st.rotN||0)+1;R.push({a:ags[i],b:ags[j],until:now+(CFG.rotMin??20)-Math.log(1-r()*.999)*(CFG.rotMean??40),k});break}}}
    if(!R.length)return null;const M=new Map();for(const x of R){const i=ags.indexOf(x.a),j=ags.indexOf(x.b);if(i>=0&&j>=0){M.set(i,j);M.set(j,i)}}return M}
  function targets(s){const t=T[s],o=1-s,sh=shape(s),ti=t.ti,inP=possS===s&&!ball.rs||(ball.rs&&ball.rs.s===s);
    let bx=F(s,ball.x),by=Lt(s,ball.y);if(!inP&&CFG.p5Ant){/* 수비 국면: 공의 진행을 p5Ant초 앞질러 읽고 자리 잡음(실측에선 공이 박스로 올 때 수비가 이미 내려와 있음) */const vx=ball.fl?(ball.fl.x1-ball.fl.x0)/Math.max(.3,ball.fl.T):(ball.vx||0),vy=ball.fl?(ball.fl.y1-ball.fl.y0)/Math.max(.3,ball.fl.T):(ball.vy||0);const ax=F(s,ball.x+vx*CFG.p5Ant),ay=Lt(s,ball.y+vy*CFG.p5Ant);bx=clamp(Math.min(bx,ax),0,L);by=clamp(by+(ay-by)*.5,0,W)}const ment=(t.ment==='공격적'?1:t.ment==='수비적'?-1:0)+(t.gsx||0);const ags=P[s];const ph=inP?'in':'out';
    const slots=inP?sh.atk:sh.def,sgs=inP?sh.sgA:sh.sgD,cus=inP?sh.cuA:sh.cuD,kzs=inP?sh.kzA:sh.kzD;const off=inP?offLine(s):0;const phK=inP&&CFG.p5Opp?(()=>{const ol=oppLn4(s);const b=ol<26?0:ol<32?1:2;return 'in'+b})():ph;
    const lineK=(CFG.p5Line??2)*(ti[0]-3)+ment*(CFG.p5Ment??1.5),wk=[0,.86,.93,1,1.07,1.14][inP?ti[2]:(ti[1]??3)]||1;
    {const dt=.5,tau=CFG.p5TeamT||8,k=Math.sqrt(2*dt/tau);const g=()=>{let u=0;for(let q=0;q<4;q++)u+=r();return (u-2)*1.73};t.cnx=(t.cnx||0)*(1-dt/tau)+k*g();t.cny=(t.cny||0)*(1-dt/tau)+k*g()}
    const RM=CFG.rotOn?rotTick(s,t,sh,ags):null;const DCV=new Set();
    ags.forEach((a,i0)=>{const i=RM&&RM.has(i0)?RM.get(i0):i0;const an=slots[Math.min(i,slots.length-1)],sg=sgs[Math.min(i,sgs.length-1)],cu=cus&&cus[Math.min(i,cus.length-1)];
      const role=a.gk?'GK':p5role(sg,an.fy,slots,sgs);/* v161 좌우 거울 수정: 위치표(POS5)는 '오른쪽 변형'인데 표의 오른쪽은 y가 작은 쪽, 엔진(공격 +x, y 아래)의 오른쪽은 y가 큰 쪽 → 이전엔 오른쪽 슬롯 선수가 왼쪽에서 뛰었음(양 팀 모두 좌우 반대: 라이트백이 왼쪽 측면). 엔진 기준 오른쪽(fy>34) 슬롯을 표에서 거울로 읽음 */const left=an.fy>34+0.5,center=Math.abs(an.fy-34)<=0.5;
      let fx,fy,sx,sy;
      if(center&&/^(CB|FB|WB|DMw|CM|W|Fw)$/.test(role)){const q1=p5look(role,phK,bx,by),q2=p5look(role,phK,bx,68-by);fx=(q1[0]+q2[0])/2;fy=34;sx=q1[2];sy=q1[3]}
      else{const q=p5look(role,phK,bx,left?68-by:by);fx=q[0];fy=left?68-q[1]:q[1];sx=q[2];sy=q[3]}
      /* v198 폭 보정: 위치표(SkillCorner 중계 영상)는 화면 밖 측면 선수가 빠져 폭이 좁음. DFL 전체 추적 대비 공격 폭 49 vs 37.7m, 수비 폭 36.7 vs 27.8m → 중앙에서의 거리 ×p5Wd */if(CFG.p5Wd)fy=34+(fy-34)*CFG.p5Wd;if(CFG.p5Wn)fy=p5WnF(fy,inP);if(CFG.p5RW)fy=p5RWF(fy,role,inP);
      /* 같은 역할 슬롯이 둘 이상 같은 쪽에 있을 때(4-4-2 투톱 등): 슬롯의 가로 차이를 절반 반영 */
      if(role==='CF'||role==='CBc'||role==='DM'||role==='AM'){fy+=(an.fy-34)*(CFG.p5Dup??.5)}
      /* 실측 분산 재현: 평균 위치만 쓰면 선수들이 공 주위에 과하게 모임(10m 안 수비 2.6명 vs 실측 1.8). 역할·국면·공 위치별 표준편차(sx,sy)를 가진 느린 무작위 편차(OU 과정, 시정수 p5NoiseT초)를 더함 */
      if(CFG.p5Noise){const dt=.5,tau=CFG.p5NoiseT||6,k=Math.sqrt(2*dt/tau);const g=()=>{let u=0;for(let q=0;q<4;q++)u+=r();return (u-2)*1.73};a.nx=(a.nx||0)*(1-dt/tau)+k*g();a.ny=(a.ny||0)*(1-dt/tau)+k*g();if(!a.gk){/* 실측 분해(SkillCorner): 팀 공통 편차 x 9m·y 3m(블록 전체가 함께 움직임), 개인 편차 x 6m·y 8m(역할 혼재로 과대) */fx+=a.nx*sx*CFG.p5Noise+t.cnx*CFG.p5TeamX;fy+=a.ny*sy*CFG.p5Noise+t.cny*CFG.p5TeamY}}
      /* 전술 지시: 수비 라인(수비 국면 전원, 공격 국면은 후방만)·폭·멘탈리티 */
      if(!a.gk){if(!inP)fx+=lineK-(CFG.p5PrB||0)*Math.max(0,3-(ti[5]??3));else if(/^(CB|CBc|FB|WB|DM|DMw)$/.test(role))fx+=lineK*.5;fy=34+(fy-34)*wk}
      /* 측면 채널 지원(실측 SC: 공이 측면 62-88m일 때 같은 채널 동료 4.4명·공보다 앞 1.3명, 엔진 3.8·0.8) → 같은 쪽 윙어·풀백은 더 넓고(윙어는 더 앞) */
      if(inP&&!a.gk&&CFG.p5Chan&&bx>60&&bx<88&&Math.abs(by-34)>14&&(fy<34)===(by<34)&&/^(W|FB|WB|AM)$/.test(role)&&ball.own!==a){fy+=(fy<34?-1:1)*CFG.p5Chan;if(role==='W')fx+=CFG.p5ChanF;{const D=st.dbg||(st.dbg={});D.chan=(D.chan||0)+1}}
      /* 동료가 터치라인 쪽에서 공을 가지면 같은 쪽 풀백은 그 안쪽에 섬(바깥은 오버래핑 런일 때만). 위치표 평균엔 풀백 자신이 소유한 장면이 섞여 너무 넓음 */
      if(inP&&!a.gk&&CFG.fbIn&&/^(FB|WB)$/.test(role)&&ball.own&&ball.own!==a&&!(a.run>st.sec)&&Math.abs(by-34)>22&&(fy<34)===(by<34)&&bx>45){const mw=Math.abs(by-34)-CFG.fbIn;if(Math.abs(fy-34)>mw)fy=34+(fy<34?-1:1)*mw}
      /* 사용자 지정 위치(드래그) 오프셋 */
      const kz=kzs&&kzs[Math.min(i,kzs.length-1)];if(kz&&!a.gk){/* 구간별 지정 위치: 각 구간 기준에서 (지정 위치 − 기준 위치표) 차이를 공 위치로 선형 보간(지정 안 한 구간은 0) */const lk=!inP?lineK-(CFG.p5PrB||0)*Math.max(0,3-(ti[5]??3)):(/^(CB|CBc|FB|WB|DM|DMw)$/.test(role)?lineK*.5:0);const pts=[25,52,80].map(b=>{const k=kz.find(q=>q.b===b);if(!k)return [b,0,0];const rf=p5refPos(role,phK,b,an,true);return [b,k.fx-(rf[0]+lk),k.fy-(34+(rf[1]-34)*wk)]});let ox,oy;if(bx<=25){ox=pts[0][1];oy=pts[0][2]}else if(bx>=80){ox=pts[2][1];oy=pts[2][2]}else{const j=bx<52?0:1,t2=(bx-pts[j][0])/(pts[j+1][0]-pts[j][0]);ox=pts[j][1]+(pts[j+1][1]-pts[j][1])*t2;oy=pts[j][2]+(pts[j+1][2]-pts[j][2])*t2}fx+=ox;fy+=oy}
      else if(cu&&CFG.p5Cu){if(CFG.cuAbs&&!a.gk){const rf=p5refPos(role,phK,inP?CFG.cuRefA:CFG.cuRefD,an,true);/* 전술 지시(라인·압박·폭)는 이미 fx·fy에 들어 있으므로 기준에도 같은 보정을 넣어 상쇄 → 놓은 자리 = 실제 자리 */const lk=!inP?lineK-(CFG.p5PrB||0)*Math.max(0,3-(ti[5]??3)):(/^(CB|CBc|FB|WB|DM|DMw)$/.test(role)?lineK*.5:0);fx+=(an.fx-(rf[0]+lk))*CFG.p5Cu;fy+=(an.fy-(34+(rf[1]-34)*wk))*CFG.p5Cu}else{fx+=cu.fx*CFG.p5Cu;fy+=cu.fy*CFG.p5Cu}}
      /* 역할 성향 */
      const f=a.fl;if(inP&&!a.gk){fx+=(a.duty-1)*3+(f.fwd||0)*2+(f.box?2:0)-(f.drop?5:0)-(f.hold?2:0);if(f.wide)fy+=(fy<34?-1:1)*4;if(f.inside)fy+=(34-fy)*.3;/* 개인 지시 활동 폭: 넓게=터치라인 쪽 4m, 안쪽=중앙으로 30% */const wd=t.pi(a.p,'wd');if(wd===2)fy+=(fy<34?-1:1)*CFG.wdW;else if(wd===0)fy+=(34-fy)*CFG.wdI}
      if(inP&&!a.gk){if(a.run>st.sec){const q=runTarget(a,s,fx,fy,off,bx,by);fx=q[0];fy=q[1]}else fx=Math.min(fx,off-.7);if(CFG.pinK&&!(a.run>st.sec)){const pk=a.g==='ST'?CFG.pinK*(f.drop?(CFG.pinDr??0):1):a.g==='W'?(CFG.pinW||0):0;const pt=off-(CFG.pinD??1.5);if(a.g==='ST'&&CFG.lnTrk){const D=st.dbg||(st.dbg={});const k='pin_'+(f.drop?'drop':!pk?'nopk':fx>=pt?'ahead':fx<=pt-(CFG.pinR??18)?'far':'ok');D[k]=(D[k]||0)+1;D.pinGap=(D.pinGap||0)+(pt-fx)}if(pk&&fx<pt&&fx>pt-(CFG.pinR??18))fx+=(pt-fx)*pk}
        /* 빈 공간 찾기: 테이블 표준편차 안에서 가까운 수비수에게서 떨어짐 */
        let nd=99,nb=null;for(const b of P[o]){const d=hyp(b.x-F(s,fx),b.y-Lt(s,fy));if(d<nd){nd=d;nb=b}}
        if(nb&&nd<5){const ux=(F(s,fx)-nb.x)/(nd||1),uy=(Lt(s,fy)-nb.y)/(nd||1);const k=(5-nd)*.5*(.6+attr(a.p,'offball',s)*.03);const dfx_=(s?-ux:ux)*Math.min(k,sx*.5);fx+=(CFG.pinNP&&(a.g==='ST'||a.g==='W')&&dfx_<0)?0:dfx_;fy+=(s?-uy:uy)*Math.min(k,sy*.5)}}
      if(!inP&&!a.gk&&CFG.dCover){/* v205 상황 우선 수비: 기본 위치(대형) 주변 dcR m 안의 가장 위험한 상대를 골대 쪽에서 막고(dcG m), 공→그 상대 패스길 쪽으로 dcL만큼 당김. 기본 위치보다 우선(가중 dcK, 우리 진영일수록 강함). 실측 DFL: 공보다 앞 상대 중 6m 안에 골대 쪽 수비가 있는 비율 0.49, 공 30m 안 패스길 2m 안 차단 0.38 */
        const tx0=fx,ty0=fy;let best=null,bs=-1e9;for(const b of P[o]){if(b.gk||b===ball.own)continue;const ant=CFG.dcAnt||0;const bfx=F(s,b.x+(b.vx||0)*ant),bfy=Lt(s,b.y+(b.vy||0)*ant);const d0=hyp(bfx-tx0,bfy-ty0);if(d0>CFG.dcR)continue;if(DCV.has(b)&&d0>CFG.dcR*.5)continue;const dan=clamp(1-bfx/75,0,1)*(1-Math.min(1,Math.abs(bfy-34)/34)*.4);const sc=-d0+dan*CFG.dcDan-(DCV.has(b)?4:0);if(sc>bs){bs=sc;best=[b,bfx,bfy]}}
        if(best){DCV.add(best[0]);a.dcv=st.sec;const [b,bfx,bfy]=best;const gd=hyp(bfx,bfy-34)||1;let gx=bfx-bfx/gd*CFG.dcG,gy=bfy-(bfy-34)/gd*CFG.dcG;const lx=bx,ly=by;const t3=CFG.dcL;gx=gx+(lx+(bfx-lx)*.55-gx)*t3;gy=gy+(ly+(bfy-ly)*.55-gy)*t3;const k=CFG.dcK*clamp((80-bx)/45,.25,1);let nfx=fx+(gx-fx)*k,nfy=fy+(gy-fy)*k;if(CFG.dcLeash){/* v209 공이 상대 진영일수록 기본 위치에서 덜 벗어남(구간별 지정 위치 존중): 허용 거리 우리 진영 dcLeash[0] → 상대 진영 dcLeash[1] m */const lim=CFG.dcLeash[0]+(CFG.dcLeash[1]-CFG.dcLeash[0])*clamp((bx-35)/45,0,1);const dd=hyp(nfx-fx,nfy-fy);if(dd>lim){nfx=fx+(nfx-fx)*lim/dd;nfy=fy+(nfy-fy)*lim/dd}}fx=nfx;fy=nfy}}
      else if(!inP&&!a.gk&&CFG.p5Mark){/* 수비 국면: 가까운 상대에게 일부 붙기(수비 진영일수록 강하게) */let nd=10,tg=null;const tx0=F(s,fx),ty0=Lt(s,fy);for(const b of P[o]){if(b.gk)continue;const d=hyp(b.x-tx0,b.y-ty0);if(d<nd){nd=d;tg=b}}
        if(tg){const k=CFG.p5Mark*clamp((45-bx)/30,0,1);let mx=F(s,tg.x),my=Lt(s,tg.y);if(CFG.p5MarkG){const dd=hyp(mx,my-34)||1;mx-=mx/dd*CFG.p5MarkG;my-=(my-34)/dd*CFG.p5MarkG}fx+=(mx-fx)*k;fy+=(my-fy)*k}}
      a.tx=F(s,clamp(fx,1,L-1));a.ty=Lt(s,clamp(fy,1,W-1));a.zx=a.tx;a.zy=a.ty;a.bx0=a.tx;a.urg=a.urg0=inP?(a.run>st.sec?(st.sec<a.runGo?.7:1):.62):Math.max((CFG.p5UrgD??.7)+(CFG.p5UrgB??.15)*clamp((40-bx)/25,0,1),a.dcv===st.sec&&CFG.dcU?CFG.dcU:0);/* v256 공세 중 공을 잃은 직후(gsRecT초) 공보다 앞에 있던 선수는 늦게 복귀(강도 3에서 gsRec만큼 느림) → 역습 노출 */if(!inP&&CFG.gsRec){const g=Math.max(0,ment5(T[s]));const lt=(st.lossT||[])[s];const xT=T[s].gmbExpT;const gmR2=T[s].gmbRest&&g<(CFG.gsRestT||99)?(T[s].gmbRestK??.5):0;if(g>=(CFG.gsRestT||99)&&lt!=null&&st.sec-lt<CFG.gsRecT&&F(s,a.x)>bx+3){a.urg=a.urg0=a.urg*(1-CFG.gsRec*Math.min(1,g/3))}else if(gmR2&&lt!=null&&st.sec-lt<CFG.gsRecT&&F(s,a.x)>bx+3){a.urg=a.urg0=a.urg*(1-CFG.gsRec*gmR2)}else if(xT!=null&&st.sec<xT&&F(s,a.x)>bx+3){/* v256 승부수 공중볼: 공중볼 열세 팀이 크로스 경합에서 진 직후 박스에 몰린 선수 복귀 지연(유저 전용) */a.urg=a.urg0=a.urg*(1-CFG.gsRec*(T[s].gmbExpS||1))}}});
    if(inP){support(s,off);showMove(s,off);linkMove(s,off);if(CFG.sitOn&&CFG.sitA)sitAtk(s,off);if(CFG.boxA)boxFillA(s,bx,by,off)
      if(CFG.restO){/* v148 뒤에 남는 수비: 상대 최전방 선수보다 restM m 넘게 앞으로 나가지 않는 수비 restO명(실측 SkillCorner: 공이 공격 3분의 1일 때 상대 선수가 우리 최후방보다 5m 넘게 뒤에 있는 비율 1.3%, 엔진 9.4%) */
        let fw=L;for(const b of P[o])if(!b.gk&&!b.off){const x=F(s,b.x);if(x<fw)fw=x}/* v256 공세 강도(성향+점수 상황 gsx)가 gsRestT 이상이면 뒤에 남는 수비를 gsRestN명 줄이고, 남은 수비도 강도만큼 앞으로(gsRestM m/단계) → 기회와 함께 역습 노출이 생김(실측: 지는 팀이 슈팅은 늘지만 이기는 팀의 득점 효율이 더 높음, StatsBomb Score Effects) */const g5=Math.max(0,ment5(T[s]));const gOn=g5>=(CFG.gsRestT||99);const gmR=!gOn&&T[s].gmbRest?(T[s].gmbRestK??.5):0;/* v256 승부수 공중볼(유저 전용): 비용을 gmbRestK(기본 절반)만큼 — 강도 2.5 기준 라인 전진·복귀 지연의 일부 */const cap=fw+CFG.restM+(gOn?g5*(CFG.gsRestM||0):gmR?2.5*gmR*(CFG.gsRestM||0):0);const rN=Math.max(0,CFG.restO-(gOn||T[s].gmbRest?(CFG.gsRestN||0):0));/* v256 승부수 공중볼(유저 전용 gmbRest): 박스에 사람을 더 넣는 대가로 뒤에 남는 수비만 1명 줄임(라인 전진·복귀 지연은 없음) → 위험 중간 */
        const D=P[s].filter(a=>!a.gk&&a!==ball.own&&!(a.run>st.sec)).sort((u,v)=>F(s,u.tx)-F(s,v.tx)).slice(0,rN);for(const a of D)if(F(s,a.tx)>cap){a.tx=F(s,clamp(cap,1,L-1));a.zx=a.tx}}}else{if(CFG.p5BoxMk&&bx<CFG.p5BoxMkX)boxMark5(s,bx);if(CFG.sitOn&&CFG.p5Sit)sitDef(s);if(CFG.boxZ&&bx<30)boxFillD(s,bx,by);if(CFG.holdFw)holdFw(s,bx);if(CFG.dFloor)dFloor(s,bx)}}
  /* v184 수비 국면 최전방 잔류(역습 출구): 실측 DFL 추적(분데스리가 3경기) — 공이 우리 골문에서 16.5m 안·16~25m·25~35m일 때 가장 앞 선수 43·50·54m, 두 번째 36·42·48m / 엔진 35·40·45, 25·32·38(8~10m 깊음 → 상대가 몰아붙일 때 전원 수비, 걷어낸 공을 받을 선수가 없음).
     공격형 선수(ST·W·AM 우선) 1·2번째를 공 거리에 비례한 높이 이상으로 둠(공에서 너무 멀면 상한 60m) */
  /* v184 골라인 수비 하한: 실측 DFL — 공이 골문 16~25m일 때 골라인 6m 안 수비(GK 제외) 0.07명·3m 안 0.03, 박스 안이면 0.8·0.2 / 엔진 0.32·0.14, 1.37·0.53(대부분 센터백: 위치표 평균 + 개인·팀 무작위 편차가 골라인 쪽으로 튀는 경우). 박스 마크 중(골문 쪽 붙기)·압박 중인 선수 빼고 공 거리 비례 하한 */
  function dFloor(s,bx){const fl=clamp(CFG.dFloor[0]+CFG.dFloor[1]*bx,CFG.dFloor[2],CFG.dFloor[3]);
    /* 수비 3분의 1 블록 높이: 실측 DFL 가장 깊은 4명 평균 — 공 박스 안 13.9·16~25m 21.7·25~35m 27.0m / 엔진 10.4·15.2·21.4(중원 35~70m는 31~41로 실측과 같음). 위치표(SkillCorner 중계 추적 기반)가 화면 밖 선수 누락으로 골문 쪽에 치우친 탓 → 공 거리별 끌어올림(보간) */
    let lift=0;if(CFG.dLift){const K=CFG.dLift;for(let i=0;i<K.length-1;i++){const [x0,y0]=K[i],[x1,y1]=K[i+1];if(bx>=x0&&bx<=x1){lift=y0+(y1-y0)*(bx-x0)/(x1-x0);break}}if(bx<K[0][0])lift=K[0][1]}
    for(const a of P[s]){if(a.gk||a===ball.own||a.press>=st.sec-DT*1.5)continue;const mk=a.bm===st.sec;let fx=F(s,a.tx);if(lift&&!mk&&!(CFG.dcLift===0&&a.dcv===st.sec))fx+=lift;if(!mk&&fx<fl)fx=fl;if(fx!==F(s,a.tx)){a.tx=F(s,clamp(fx,1,L-1));a.zx=a.tx}}}
  function holdFw(s,bx){if(bx>45)return;const A=P[s].filter(a=>!a.gk&&a!==ball.own&&!(a.press>=st.sec-DT*1.5)&&a.bm!==st.sec);const pr=a=>a.g==='ST'?0:a.g==='W'?1:a.g==='AM'?2:a.g==='CM'?4:9;
    A.sort((u,v)=>pr(u)-pr(v)||F(s,v.tx)-F(s,u.tx));const H=[CFG.holdFw[0]+CFG.holdFw[1]*bx,CFG.holdFw[2]+CFG.holdFw[3]*bx];
    for(let i=0;i<2&&i<A.length;i++){const a=A[i];if(pr(a)>4)break;const h=Math.min(60,H[i]);if(F(s,a.tx)<h){a.tx=F(s,h);a.zx=a.tx;a.urg=Math.min(a.urg||.7,.7)}}}
  /* v143 박스 인원(실측 SkillCorner: 공이 박스 앞 16.5~25m일 때 수비 3.4·공격 1.8명, 박스 안이면 5.7·3.5명, 25~30m면 1.5·0.7명 / 엔진 2.4·0.9, 4.5·2.9, 1.2·0.5) */
  const inBoxT=(s,a,own)=>{const fx=F(s,a.tx),fy=Lt(s,a.ty);return Math.abs(fy-34)<20.16&&(own?fx<16.5:fx>88.5)};
  function boxFillD(s,bx,by){if(st.mkClr&&st.sec>st.mkClr){st.mkClr=0;P[0].concat(P[1]).forEach(a=>{a.mk=null})}const need=bx<16.5?CFG.boxZ[0]:bx<25?CFG.boxZ[1]:CFG.boxZ[2];let have=P[s].filter(a=>!a.gk&&inBoxT(s,a,1)).length;if(have>=need)return;
    const dz=clamp(.45*bx+1,6,13),yc=34+(by-34)*.35,OY=[0,-8,8,-15,15,-4,4];const C=P[s].filter(a=>!a.gk&&!inBoxT(s,a,1)&&a!==ball.own&&!(a.press>=st.sec-DT*1.5)&&!a.mk&&!(CFG.bmKeep&&a.bm===st.sec));
    for(let k=0;have<need&&k<OY.length&&C.length;k++){const sx=dz+(k>2?1.5:0),sy=clamp(yc+OY[k],20,48);let bi=-1,bd=1e9;C.forEach((a,i)=>{const d=hyp(F(s,a.x)-sx,Lt(s,a.y)-sy)+(a.g==='CB'||a.g==='FB'?0:a.g==='DM'?3:8);if(d<bd){bd=d;bi=i}});if(bi<0||bd>40)break;const a=C.splice(bi,1)[0];a.tx=F(s,sx);a.ty=Lt(s,sy);a.urg=Math.max(a.urg||0,.9);have++}}
  function boxFillA(s,bx,by,off){const c=ball.own;if(!c||c.s!==s||bx<75||Math.abs(by-34)>30)return;const need=bx>=88.5?CFG.boxA[0]:bx>=79?CFG.boxA[1]:CFG.boxA[2];let have=P[s].filter(a=>a!==c&&!a.gk&&inBoxT(s,a,0)).length;if(have>=need)return;
    const sd=by<34?-1:1,SL=[[95,34+sd*5],[96.5,34-sd*6],[92,34],[94,34+sd*11],[92.5,34-sd*12]];const pref={ST:0,W:1,AM:1,CM:3,DM:9,FB:9,CB:12};const C=P[s].filter(a=>a!==c&&!a.gk&&!inBoxT(s,a,0)&&!(CFG.runKeep&&a.run>st.sec&&st.sec>=a.runGo)&&(a.duty!==0)&&(pref[a.g]??5)<9);
    for(let k=0;have<need&&k<SL.length&&C.length;k++){const sx=Math.min(SL[k][0],off-.6),sy=SL[k][1];if(sx<88.6)break;let bi=-1,bd=1e9;C.forEach((a,i)=>{const d=hyp(F(s,a.x)-sx,Lt(s,a.y)-sy)+(pref[a.g]??5)*3;if(d<bd){bd=d;bi=i}});if(bi<0||bd>45)break;const a=C.splice(bi,1)[0];a.tx=F(s,sx);a.ty=Lt(s,sy);a.urg=Math.max(a.urg||0,.85);have++}}
  /* 박스 대인 마크(실측: 공이 공격 3분의 1에 있을 때 박스 안 공격수의 최근접 수비 <2m 40%·평균 2.9m): 박스(+여유) 안 공격수를 위험도 순으로, 가장 가까운 수비수를 1:1 고유 배정. 마커는 공격수의 골문 쪽 1.2m */
  function boxMark5(s,bx){const o=1-s;{const D=st.dbg||(st.dbg={});D.bm5c=(D.bm5c||0)+1}const gx=F(s,0);const A=P[o].filter(b=>!b.gk&&b!==ball.own&&F(s,b.x)<CFG.p5BoxMkX-2&&Math.abs(Lt(s,b.y)-34)<22).map(b=>[b,xgGeo(L-F(s,b.x),Lt(s,b.y))]).sort((u,v)=>v[1]-u[1]).slice(0,CFG.p5BoxMkN);
    const used=new Set();for(const [b] of A){let best=null,bd=CFG.p5BoxMkR;for(const a of P[s]){if(a.gk||used.has(a)||a.press>=st.sec-DT*1.5)continue;const d=hyp(a.tx-b.x,a.ty-b.y)*.6+hyp(a.x-b.x,a.y-b.y)*.4;if(d<bd){bd=d;best=a}}
      if(best){{const D=st.dbg||(st.dbg={});D.bm5=(D.bm5||0)+1}used.add(best);best.bm=st.sec;const dx=gx-b.x,dy=34-b.y,dd=hyp(dx,dy)||1;const k=CFG.p5BoxMkK;best.tx=clamp(best.tx+(b.x+dx/dd*1.2-best.tx)*k,1,L-1);best.ty=clamp(best.ty+(b.y+dy/dd*1.2-best.ty)*k,1,W-1);best.urg=best.urg0=.9}}}
  // 압박·커버·볼 추적
  function pressing(d){const s=1-d,t=T[d],ti=t.ti,c=ball.own;
    if(ball.lo){[0,1].forEach(q=>{const L2=P[q].filter(a=>!a.gk||F(q,ball.x)<Math.min(20,16*gkSw(q))).sort((a,b)=>hyp(a.x-ball.x,a.y-ball.y)*LRD(a)-hyp(b.x-ball.x,b.y-ball.y)*LRD(b)).slice(0,2);L2.forEach(a=>{a.tx=ball.x;a.ty=ball.y;a.urg=1})});return}
    if(ball.fl&&!ball.fl.show&&CFG.airConv&&ball.fl.h>=.9){/* v135 높은 공 낙하지점 경합: 양 팀에서 도착 가능한 가까운 선수(공 보낸 팀 airNs명·상대 airNd명)가 낙하지점으로(실측 공중볼 경합 42.6회/경기) */const f=ball.fl;const rem=Math.max(.3,f.T-f.t);
      for(const q of [0,1]){const own=q===f.s;const L3=P[q].filter(a=>(!a.gk||F(q,f.x1)<12*gkSw(q))&&a.stun<=0&&a!==f.from).map(a=>[a,hyp(a.x-f.x1,a.y-f.y1)/a.vm]).sort((x,y)=>x[1]-y[1]);
        let nn=own?CFG.airNs:CFG.airNd;if(own&&CFG.missOpp&&f.res==='loose'&&f.from&&!f.kind)nn=0;if(own&&f.to){f.to.tx=f.x1;f.to.ty=f.y1;f.to.urg=1;nn--}
        for(let k=0,c=0;k<L3.length&&c<nn;k++){const [a,t]=L3[k];if(a===f.to)continue;if(t>rem+(f.from&&f.from.gk?CFG.airSlackG:CFG.airSlack))break;a.tx=f.x1;a.ty=f.y1;a.urg=1;c++}}
      return}
    if(ball.fl&&!ball.fl.show){const f=ball.fl;if(f.to){f.to.tx=f.x1;f.to.ty=f.y1;f.to.urg=1}const b=P[d].filter(q=>!q.gk).sort((a,b)=>hyp(a.x-f.x1,a.y-f.y1)-hyp(b.x-f.x1,b.y-f.y1))[0];const zf=F(s,f.x1);const fp=CFG.flPrZ?(zf<35?CFG.flPrZ[0]:zf<70?CFG.flPrZ[1]:CFG.flPrZ[2]):(CFG.flPr??1);if(b&&b!==f.to&&fp>0){const dd=hyp(b.x-f.x1,b.y-f.y1);if(dd<(CFG.flPrD??99)){const k=fp;b.tx=b.x+(f.x1-b.x)*k;b.ty=b.y+(f.y1-b.y)*k;b.urg=.9}}return}
    if(!c||c.s!==s)return;const cfx=F(d,c.x);
    {const gk=P[d][0];const cfy=Lt(d,c.y);const gsw=gkSw(d);if(cfx<18*gsw&&cfy>10&&cfy<58){const dd=hyp(cfx,cfy-34);const k=Math.min((CFG.gkRush??6)*gsw,dd*.35*gsw)/dd;gk.tx=F(d,cfx*k);gk.ty=Lt(d,34+(cfy-34)*k);gk.urg=1}}const zone=[0,42,52,62,74,86][ti[5]]||62;
    const L2=P[d].filter(a=>!a.gk&&a.stun<=0).map(a=>[a,hyp(a.x-c.x,a.y-c.y)/a.vm/Math.pow(DH(a,0),CFG.dsE*(CFG.dsG[a.g]??1)*(CFG.dhP??1))]).sort((x,y)=>x[1]-y[1]);
    let n=(cfx<=zone||L2.length&&L2[0][1]<.9)?(ti[5]>=5&&cfx<zone?2:1)+(cfx<22&&!CFG.d5Box1?1:0):0;const cpW=CFG.cpN&&st.lossT&&st.sec-st.lossT[d]<CFG.cpT*(1+(ti[5]-3)*.25)&&st.lossX[d]>=CFG.cpX;if(cpW)n=Math.max(n,CFG.cpN+(ti[5]>=4?1:0)-(ti[5]<=1?1:0));if(CFG.p5NoPress)return;
    for(let k=0;k<Math.min(n,L2.length);k++){const a=L2[k][0];const gx=F(d,0);const pi=t.pi(a.p,'pr');if(k>0&&L2[k][1]>(cpW?CFG.cpR:2.4)*(1+(pi-1)*.3))break;
      if(!(a.press>=st.sec-DT*1.5))a.pS=st.sec;let ox;if(CFG.pv2&&k===0){if(st.pC!==c||st.pD!==a){st.pC=c;st.pD=a;const zz=cfx<35?CFG.pEngA:cfx<70?CFG.pEngM:CFG.pEngD;const pz=CFG.prOwnK?clamp((cfx-30)/20,0,1):1;st.pE=r()<clamp(zz*(1+(ti[5]-3)*CFG.pTi*pz)*(1+TV(a,'전방 압박')*CFG.trPr)*DH(a,0)*(1-CFG.fatEng*Math.min(100,st.fatigue[d][a.p.id]||0)/100),.05,.97);st.pT=st.sec-Math.log(1-r()*.999)*CFG.engM*(1-(ti[5]-3)*.12*pz);if(cfx<CFG.boxEngX){st.pE=true;st.pT=Math.min(st.pT,st.sec+CFG.boxEngT)}}if(cpW&&CFG.cpE){st.pE=true;st.pT=Math.min(st.pT,st.sec)}ox=st.pE&&st.sec>=st.pT?(cfx<25&&CFG.d5EngD?CFG.d5EngD:1.1):CFG.holdD*(1-(ti[5]-3)*CFG.pTh*(CFG.prOwnK?clamp((cfx-30)/20,0,1):1))*(cfx<35?clamp((cfx-12)/23,CFG.hBox,1):1)+CFG.oxA*clamp((40-cfx)/25,0,1)*0}else ox=k===0?(st.sec-a.pS>=CFG.engT?1.1:CFG.ox0+CFG.oxA*clamp((40-cfx)/25,0,1)):5;const px=c.x+(c.vx||0)*.6,py=c.y+(c.vy||0)*.6,dx=gx-px,dy=34-py,dd=hyp(dx,dy)||1;a.tx=px+dx/dd*ox;a.ty=py+dy/dd*ox;a.urg=clamp(.85+(ti[5]-3)*.04+(pi-1)*.06,.7,1);a.press=st.sec}}
  function move(a){if(a.stun>0){a.stun-=DT;a.vx=a.vy=0;return}let tx=a.tx,ty=a.ty,u=a.urg;if(a.late>st.sec)u*=.35;
    if(ball.own===a&&a.carry){tx=a.carry.x;ty=a.carry.y;u=CFG.brOn&&a.recvKind==='through'&&st.sec-a.recvAt<5?CFG.brU:.82;if(hyp(tx-a.x,ty-a.y)<1)a.carry=null;else{const ux=tx-a.x,uy=ty-a.y,ud=hyp(ux,uy);for(const b of P[1-a.s]){const bx=b.x-a.x,by=b.y-a.y,bd=hyp(bx,by);if(bd<1.6&&(bx*ux+by*uy)/(bd*ud||1)>.3){u=.3;break}}}}
    else if(ball.own===a){tx=a.x;ty=a.y}
    const dx=tx-a.x,dy=ty-a.y,d=hyp(dx,dy);const step=Math.min(d,a.vm*u*DT);const k=d>0?step/d:0;a.vx=dx*k/DT;a.vy=dy*k/DT;a.x+=dx*k;a.y+=dy*k}
  // 침투 시작
  /* 침투: 종류별(뒷공간 직선·대각선 안/밖·블라인드사이드·반대편 파포스트·오버래핑·언더래핑).
     빈도 = 기본률 × 역할 × 임무 × 오프더볼 × 침투 개인 지시 × 전술. 타이밍 실수면 일찍 출발해 오프사이드 위험.
     블라인드사이드면 마크하던 수비수 반응 지연 */
  function runTarget(a,s,fx,fy,off,bx,by){const k=a.rk,go=st.sec>=a.runGo;
    if(k==='wall'){const d=a.wallDef;const dfx=d?F(s,d.x):fx;return [Math.min(dfx+8,off-.3),d?Lt(s,d.y)+(Lt(s,a.y)<Lt(s,d.y)?-3:3):fy]}
    if(k==='over')return [CFG.ovBey&&off>CFG.ovBx&&st.sec-a.runSt>CFG.ovBt?Math.min(off+CFG.ovBey,101):Math.min(bx+14,off-.7),by<34?3:W-3];if(k==='line')return [go?Math.min(off+8,98):Math.min(bx+14,off-.7),a.rfy<34?5:W-5];
    if(k==='under')return [CFG.unBey&&off>CFG.ovBx&&st.sec-a.runSt>CFG.ovBt?Math.min(off+CFG.unBey,99):Math.min(bx+12,off-.7),by<34?19:W-19];
    if(k==='far')return [Math.min(97,go?97:off-.5),by<34?42:26];
    const tfx=go?Math.min(off+10,100):Math.min(fx,off-.5);
    const tfy=k==='din'?34+(a.rfy<34?-5:5):k==='dout'?(a.rfy<34?15:W-15):fy+(34-fy)*.2;return [tfx,tfy]}
  function runs(s){const c=ball.own;if(!c||c.s!==s)return;const cfx=F(s,c.x),cfy=Lt(s,c.y);if(cfx<30)return;const [nd]=nearestOpp(c);const t=T[s];
    const ti=t.ti;const sty=(t.preset==='다이렉트'||t.preset==='선수비 후 역습'?(CFG.styC??1.3):t.preset==='티키타카'?.7:1)*(1+(ti[4]-3)*.15);const tmp=1+(ti[3]-3)*.1;const off=offLine(s);
    for(const a of P[s]){if(a===c||a.gk||a.run>st.sec)continue;const f=a.fl,g=a.g;const afx=F(s,a.x),afy=Lt(s,a.y);
      const cw=cur&&cur.s===s&&st.sec-cur.t0<7&&(cur.counter||t.ti[6])?CFG.cntRun*(t.ti[6]?1:.6):1;
      const rest=(g==='FB'||g==='CM'||g==='DM')&&CFG.ctR?Math.max(.2,1-CFG.ctR*Math.max(0,3-T[1-s].ti[0])*(T[1-s].ti[6]?1:.5)):1;
      const oLr=L-off;const dP=P[1-s].filter(b=>!b.gk).sort((x,y)=>F(s,y.x)-F(s,x.x)).slice(0,2);const dPace=dP.length?dP.reduce((q,b)=>q+attr(b.p,'pace',1-s),0)/dP.length:12;const base=(1+CFG.cRun*clamp((oLr-CFG.cH0)/CFG.cHs,0,1)*(CFG.cAutoH?1:CFG.cAuto)*iqF(a))*(afOf(s)==='behind'?1+CFG.afRun*clamp((oLr-28)/16,0,1):1)*rest*cw*tmp*HB(a,3)*(1+(t.pi(a.p,'rn')-1)*.6)*(.6+attr(a.p,'offball',s)/20*.8)*(a.duty===2?1.4:a.duty===0?.25:1)*CFG.runP/.12;
      const cands=[];
      if(nd>2.2&&cfx>35){
        const pm=CFG.pcRun?clamp((attr(a.p,'pace',s)-dPace)/6,-1,1)*clamp((L-off-30)/20,0,1):0;if(g==='ST'&&!f.drop&&!f.target)cands.push(['str',.10*(CFG.stRunK??1)*(f.run||f.box?1.5:1)*sty*clamp((L-off)/25,.4,1.6)*(1+TV(a,'라인 줄타기')*.4)*(1+CFG.pcRun*pm)],['dout',.05]);
        if(g==='W'||g==='AM'){cands.push(['din',(f.inside?.09:.04)]);if(a.duty===2)cands.push(['str',.03*sty])}
        if(g==='AM'||g==='CM')cands.push(['str',f.fwd?.03:.012])}
      if(g==='W'&&cfx>62&&(cfy<22&&afy>40||cfy>46&&afy<28))cands.push(['far',.25*(f.inside?1.2:1)]);/* 공 쪽 윙어의 측면 돌파 런(실측: 90+ 도달의 44%가 와이드 채널) */if(g==='W'&&cfx>55&&cfx<88&&Math.abs(cfy-afy)<24&&(cfy<34)===(afy<34)&&afx>cfx-8&&afx<off-2&&a!==c)cands.push(['line',CFG.p5LineRun*(f.wide?1.3:1)]);
      if(g==='FB'&&CFG.fbRun&&cfx>40&&cfx<88&&Math.abs(cfy-afy)<22&&afx<cfx){const wing=f.wide||a.role==='윙백';const aw=ti[2]-3;let ro=(wing?.08:.04)*(1+aw*.2)*(t.preset==='측면 공략'?1.3:1),ru=(f.inside?.14:.04)*(1-aw*.2);
          /* 오버/언더래핑 선택(실측 SC 20경기: 소유자가 안쪽이면 풀백 오버 2.4·언더 .23회, 터치라인 쪽이면 언더 1.27·오버 .57회) */
          if(CFG.ovSit){const cw=clamp((Math.abs(cfy-34)-14)/12,0,1);ro*=1.8-1.3*cw;ru*=.3+1.5*cw}
          /* 감독 지시(가중치, 절대명령 아님) */const ov=t.pi(a.p,'ov');if(ov===0){ru*=CFG.ovK;ro/=CFG.ovK}else if(ov===2){ro*=CFG.ovK;ru/=CFG.ovK}
          /* 목표 공간 점검: 그 자리에 이미 동료(소유자·본인 제외)가 서 있으면 판단력 높은 선수일수록 다른 쪽을 고름. 판단력 낮으면 지시대로 달려 겹침 */
          if(CFG.ovOcc){const iq=clamp(((attr(a.p,'pass',s)+attr(a.p,'offball',s)+V(a.p,'comp',12)*eff(a.p,s))/3-8)/10,0,1);const occ=(tx,ty)=>{for(const m of P[s]){if(m===a||m===c||m.gk)continue;const mx=F(s,m.x),my=Lt(s,m.y),qx=F(s,m.tx),qy=Lt(s,m.ty);if(Math.min(hyp(mx-tx,my-ty),hyp(qx-tx,qy-ty))<CFG.ovOccR)return 1}return 0};const side=cfy<34?-1:1;
            const oO=occ(Math.min(cfx+14,off-.7),cfy<34?3:W-3),oU=occ(Math.min(cfx+12,off-.7),cfy<34?19:W-19);if(oO){ro*=1-CFG.ovOcc*iq;ru*=1+iq}if(oU){ru*=1-CFG.ovOccU*iq}if(oO||oU){const D=st.dbg||(st.dbg={});D['ovOcc'+(oO?'O':'')+(oU?'U':'')]=(D['ovOcc'+(oO?'O':'')+(oU?'U':'')]||0)+1}}
          cands.push(['over',ro],['under',ru])}
      /* 중앙 MF 하프스페이스 언더래핑: 지시(언더래핑)를 받았을 때만 추가 런(기본 움직임은 위치 모델이 이미 실측 수준으로 만듦) */
      if((g==='CM'||g==='DM')&&t.pi(a.p,'ov')===0&&cfx>45&&cfx<88&&Math.abs(cfy-34)>14&&(cfy<34)===(afy<34)&&afx<cfx)cands.push(['under',CFG.cmUnder]);
      for(const [k,rate] of cands){if(r()<rate*base*DT){a.rk=k;a.rfy=afy;const mis=r()<CFG.offT*(1.5-(attr(a.p,'offball',s)+V(a.p,'comp',12)*eff(a.p,s))/28);
          a.runSt=st.sec;a.runGo=st.sec+(k==='over'||k==='under'||k==='line'?0:mis?0:.6+r()*.8);a.run=st.sec+(k==='far'?4:k==='line'?3.8:3.4);
          if(k==='str'||k==='din'||k==='dout'){let nb=null,bd=6;for(const b of P[1-s]){if(b.gk)continue;const d=hyp(b.x-a.x,b.y-a.y);if(d<bd){bd=d;nb=b}}
            if(nb&&Math.abs(cfy-afy)>Math.abs(cfy-Lt(s,nb.y))+1){nb.late=st.sec+CFG.blindT*(1.3-attr(nb.p,'posit',1-s)/20*.6);a.blind=1}else a.blind=0}
          {const D=st.dbg||(st.dbg={});D['run_'+k]=(D['run_'+k]||0)+1}(st.runs||(st.runs=[])).push([s,k]);pr(a.p).rn++;break}}}}
  /* 공 주변 지원: 가까운 동료 2명이 패스 각도(전후좌우 대각) 중 빈 곳으로 이동해 삼각형을 만듦 */
  /* 미드필더 '받으러 오기': 수비수·풀백이 공을 잡으면 가까운 중앙 미드필더 2명이 패스 길이 열린 지점을 찾아 1.5~3초마다 위치를 바꿔가며 받아줌. 같은 쪽 윙어는 압박받으면 내려와 받음 */
  function showMove(s,off){const c=ball.own;if(!c||c.s!==s||!CFG.showK)return;const o=1-s;const cfx=F(s,c.x),cfy=Lt(s,c.y);if(cfx>62||!(c.gk||c.g==='CB'||c.g==='FB'||c.g==='DM'))return;
    let mlS=99;if(CFG.zoneOn){const oq=P[o].filter(b=>!b.gk).map(b=>F(s,b.x)).sort((x,y)=>y-x);if(oq.length>=8)mlS=(oq[4]+oq[5]+oq[6]+oq[7])/4}const ms=P[s].filter(a=>a!==c&&(a.g==='CM'||a.g==='DM'||a.g==='AM')&&!(!CFG.zoneOn&&CFG.pkK&&a.sgA==='AM')&&!(CFG.zoneOn&&a.zx!=null&&F(s,a.zx)>mlS)&&!(a.run>st.sec)).map(a=>[a,hyp(a.x-c.x,a.y-c.y)]).sort((x,y)=>x[1]-y[1]).slice(0,2);const used=[];
    for(const [a] of ms){if(!(a.showT>st.sec&&a.showC===c&&a.showP)){let best=null,bv=-99;
        for(const dist of [CFG.shD,CFG.shD+4,CFG.shD+8])for(const ang of [0,.45,-.45,.9,-.9,1.4,-1.4]){const pfx=cfx+Math.cos(ang)*dist,pfy=cfy+Math.sin(ang)*dist;if(pfx<4||pfy<3||pfy>W-3||pfx>off-1)continue;
          const px=F(s,pfx),py=Lt(s,pfy);let md=99;for(const b of P[o]){const d=hyp(b.x-px,b.y-py);if(d<md)md=d}const lr=laneRisk(o,c.x,c.y,px,py,dist<12?12:15,false).p;
          let crowd=0;for(const u of used)if(hyp(u[0]-px,u[1]-py)<7)crowd++;for(const m of P[s])if(m!==a&&m!==c&&hyp(m.x-px,m.y-py)<5)crowd++;
          const v=Math.min(md,7)*.6-lr*8+(pfx-cfx)*.08-Math.abs(pfy-34)*.04-crowd*3-hyp(px-a.x,py-a.y)*.12+(r()-.5)*1.5;if(v>bv){bv=v;best=[px,py]}}
        if(best){a.showP=best;a.showC=c;a.showT=st.sec+1.5+r()*1.5}}
      if(a.showP&&a.showC===c){used.push(a.showP);const k=CFG.showK;a.tx+=(a.showP[0]-a.tx)*k;a.ty+=(a.showP[1]-a.ty)*k;a.urg=a.urg0=.85}}
    if(c.g==='FB'&&CFG.wDrop){const w=P[s].find(a=>a.g==='W'&&(Lt(s,a.y)<34)===(cfy<34)&&!(a.run>st.sec));if(w){const [wd]=nearestOpp(w);if(wd<4){const pfx=Math.min(F(s,w.x),cfx+13),pfy=cfy<34?Math.max(3,Math.min(cfy,10)):Math.min(W-3,Math.max(cfy,W-10));const k=CFG.wDrop;w.tx+=(F(s,pfx)-w.tx)*k;w.ty+=(Lt(s,pfy)-w.ty)*k;w.urg=w.urg0=.85}}}}
  /* 라인 사이 연결: 중원에서 공을 잡으면 가까운 공격 자원(AM·W·ST) 2명이 9~16m 앞, 수비 라인 사이 빈틈을 찾아 짧은 전진 패스 길을 열어줌(1.5~3초마다 갱신) */
  function linkMove(s,off){const c=ball.own;if(!c||c.s!==s||!CFG.linkK)return;const o=1-s;const cfx=F(s,c.x),cfy=Lt(s,c.y);if(cfx<30||cfx>80)return;
    const ms=P[s].filter(a=>a!==c&&(a.g==='AM'||((a.g==='W'||(CFG.cmHold&&a.g==='CM'))&&!(CFG.wHold&&!(a.fl&&a.fl.inside)&&!((Lt(s,a.y)<34)===(cfy<34)&&Math.abs(cfy-34)>CFG.wHold)))||a.g==='ST'||a.g==='CM')&&!(!CFG.zoneOn&&CFG.pkK&&a.sgA==='AM')&&!(a.run>st.sec)&&F(s,a.x)>cfx-2&&a.showC!==c).map(a=>[a,hyp(a.x-c.x,a.y-c.y)]).sort((x,y)=>x[1]-y[1]).slice(0,CFG.linkN);const used=[];
    for(const [a] of ms){if(!(a.lkT>st.sec&&a.lkC===c&&a.lkP)){let best=null,bv=-99;
        for(const dist of [9,12.5,16])for(const ang of [0,.35,-.35,.7,-.7]){const pfx=cfx+Math.cos(ang)*dist,pfy=cfy+Math.sin(ang)*dist;if(pfy<3||pfy>W-3||pfx>off-1)continue;
          const px=F(s,pfx),py=Lt(s,pfy);let md=99;for(const b of P[o]){const d=hyp(b.x-px,b.y-py);if(d<md)md=d}const lr=laneRisk(o,c.x,c.y,px,py,dist<12?12:15,false).p;
          let crowd=0;for(const u of used)if(hyp(u[0]-px,u[1]-py)<7)crowd++;for(const m of P[s])if(m!==a&&m!==c&&hyp(m.x-px,m.y-py)<5)crowd++;
          const v=Math.min(md,6)*.7-lr*8-crowd*3-hyp(px-a.x,py-a.y)*.1+(r()-.5)*1.5;if(v>bv){bv=v;best=[px,py]}}
        if(best){a.lkP=best;a.lkC=c;a.lkT=st.sec+1.5+r()*1.5}}
      if(a.lkP&&a.lkC===c){used.push(a.lkP);const k=CFG.linkK;a.tx+=(a.lkP[0]-a.tx)*k;a.ty+=(a.lkP[1]-a.ty)*k;a.urg=a.urg0=.85}}}
  /* v113 공격형 미드필더 '라인 사이' 자리잡기(실측 SkillCorner: 중원 소유 시 AM 68%가 상대 미드필더 줄과 수비 줄 사이, 미드필더 줄보다 3m 앞·수비 줄보다 8m 앞, 중앙선에서 12~13m 하프스페이스, 가장 가까운 수비 4.7m)
     공격 대형 슬롯이 AM인 선수: 상대 두 줄 사이 + 공 쪽 하프스페이스 후보 중 가장 비어 있고 패스길 열린 곳으로(1.5~3초마다 갱신). 빌드업 때도 내려오지 않고 라인 사이에 남음 */
  /* v116 모든 선수의 '활동 반경 안에서 빈자리 찾기': 대형(직접 옮긴 위치 포함)이 정한 기준점 주변 반경(포지션별 CB 4·FB 6·DM 6·CM 7·AM 8·W 7·ST 6m × 오프더볼 능력) 안에서
     가장 비어 있고 패스길 열린 곳으로 1.5~3초마다 갱신. 포지션별 선호: AM·CM 상대 두 줄 사이, DM 상대 미드필더 줄 뒤(빌드업 연결), W·ST 상대 최종 라인 근처, CB·FB 넓고 열린 각도.
     공 주변 지원·받으러 오기·라인 사이 연결 동작도 이 반경(×1.6)을 크게 벗어나지 않게 제한 → 대형을 바꾸면 선수 성향은 그대로, 움직이는 반경이 바뀜 */
  function zoneR(a){return (CFG.zR[a.sgA]||6)*(.8+attr(a.p,'offball',a.s)/20*.4)}
  function zoneMove(s,off){const c=ball.own;if(!c||c.s!==s)return;const o=1-s;const cfx=F(s,c.x),cfy=Lt(s,c.y);
    const opp=P[o].filter(b=>!b.gk).map(b=>F(s,b.x)).sort((x,y)=>y-x);if(opp.length<8)return;const dl=(opp[0]+opp[1]+opp[2]+opp[3])/4,ml=(opp[4]+opp[5]+opp[6]+opp[7])/4,fl=opp.length>=10?(opp[8]+opp[9])/2:ml-10;
    for(const a of P[s]){if(a===c||a.gk||a.run>st.sec||a.zx==null)continue;const g=a.sgA||a.g;
      if(!(a.zT>st.sec&&a.zC===c&&a.zP)){const R=zoneR(a),zx=F(s,a.zx),zy=Lt(s,a.zy);let best=null,bv=-99;
        for(const [ux,uy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[.7,.7],[.7,-.7],[-.7,.7],[-.7,-.7]])for(const rr of (ux||uy)?[.5,1]:[0]){let pfx=clamp(zx+ux*R*rr,3,off-.8),pfy=clamp(zy+uy*R*rr,2,W-2);
          const px=F(s,pfx),py=Lt(s,pfy);let md=99;for(const b of P[o]){const d=hyp(b.x-px,b.y-py);if(d<md)md=d}const dd=hyp(px-c.x,py-c.y);const lr=dd>4?laneRisk(o,c.x,c.y,px,py,dd<12?12:15,false).p:0;
          let crowd=0;for(const m of P[s])if(m!==a&&m!==c&&hyp(m.x-px,m.y-py)<6)crowd++;
          let rp=0;if(g==='AM'||g==='CM'){const w=g==='AM'?1:.4;rp=(pfx>ml+1&&pfx<dl-2?CFG.zPk:-Math.max(0,ml+1-pfx)*.35)*w}else if(g==='DM')rp=pfx<ml-1&&pfx>fl-2?.6:0;else if(g==='W'||g==='ST')rp=-Math.abs(pfx-(off-1.5))*.05;else if(g==='FB'||g==='CB')rp=Math.abs(pfy-34)*.02;
          const v=Math.min(md,7)*CFG.zOpen-lr*6-crowd*2.5+rp-hyp(pfx-zx,pfy-zy)*.05+(r()-.5)*1.2;if(v>bv){bv=v;best=[px,py]}}
        if(best){a.zP=best;a.zC=c;a.zT=st.sec+1.5+r()*1.5}}
      if(a.zP&&a.zC===c){const k=CFG.zK;a.tx+=(a.zP[0]-a.tx)*k;a.ty+=(a.zP[1]-a.ty)*k;a.urg=a.urg0=Math.max(a.urg0||.6,.75)}}}
  function zoneClamp(s){const o=1-s;let ml=-99;const oq=P[o].filter(b=>!b.gk).map(b=>F(s,b.x)).sort((x,y)=>y-x);if(oq.length>=8)ml=(oq[4]+oq[5]+oq[6]+oq[7])/4;for(const a of P[s]){if(a.gk||a.zx==null||a.run>st.sec||a===ball.own)continue;const R=zoneR(a)*(CFG.zRcG[a.sgA]??CFG.zRc),dx=a.tx-a.zx,dy=a.ty-a.zy,d=hyp(dx,dy);if(d>R){a.tx=a.zx+dx*R/d;a.ty=a.zy+dy*R/d}if(CFG.zHold&&(a.sgA==='AM'||a.sgA==='CM')&&F(s,a.zP&&a.zC===ball.own?a.zP[0]:a.zx)>ml+1&&F(s,a.tx)<ml+1)a.tx=F(s,ml+1)}}
  function pocketMove(s,off){if(!CFG.pkK)return;const c=ball.own;if(!c||c.s!==s)return;const o=1-s;const cfx=F(s,c.x),cfy=Lt(s,c.y);if(cfx<15||cfx>88)return;
    const opp=P[o].filter(b=>!b.gk).map(b=>F(s,b.x)).sort((x,y)=>y-x);if(opp.length<8)return;const dl=(opp[0]+opp[1]+opp[2]+opp[3])/4,ml=(opp[4]+opp[5]+opp[6]+opp[7])/4;
    for(const a of P[s]){if(a===c||a.gk||a.sgA!=='AM'||a.run>st.sec)continue;
      if(!(a.pkT>st.sec&&a.pkC===c&&a.pkP)){const lo=Math.min(ml+CFG.pkX,dl-4),hi=Math.max(lo,Math.min(dl-CFG.pkD,off-1));let best=null,bv=-99;
        for(const fx of [lo,(lo+hi)/2,hi])for(const dy of [0,6,10,13,-6,-10,-13]){const side=cfy<34?-1:1;const pfy=clamp(34+dy*side,4,W-4);const pfx=clamp(fx,cfx-6,off-1);
          const px=F(s,pfx),py=Lt(s,34+(pfy-34));let md=99;for(const b of P[o]){const d=hyp(b.x-px,b.y-py);if(d<md)md=d}const dd=hyp(px-c.x,py-c.y);const lr=dd>4?laneRisk(o,c.x,c.y,px,py,dd<12?12:15,false).p:0;
          let crowd=0;for(const m of P[s])if(m!==a&&m!==c&&hyp(m.x-px,m.y-py)<6)crowd++;
          const v=Math.min(md,7)*.7-lr*6-crowd*2.5-Math.abs(Math.abs(pfy-34)-CFG.pkY)*.5+((pfy-34)*(cfy-34)>0?.8:0)-hyp(px-a.x,py-a.y)*.06+(r()-.5)*1.2;if(v>bv){bv=v;best=[px,py]}}
        if(best){a.pkP=best;a.pkC=c;a.pkT=st.sec+1.5+r()*1.5}}
      if(a.pkP&&a.pkC===c){const k=CFG.pkK;a.tx+=(a.pkP[0]-a.tx)*k;a.ty+=(a.pkP[1]-a.ty)*k;a.urg=a.urg0=.85}}}
  function support(s,off){const c=ball.own;if(!c||c.s!==s)return;const o=1-s;const cfx=F(s,c.x),cfy=Lt(s,c.y);
    const wh=a=>CFG.wHold&&(a.g==='W'||(CFG.cmHold&&(a.g==='CM'||a.g==='DM')&&!(a.fl&&(a.fl.create||a.fl.build))))&&!(a.fl&&a.fl.inside)&&!((Lt(s,a.y)<34)===(cfy<34)&&Math.abs(cfy-34)>CFG.wHold);/* v201 윙어 폭 유지: 공이 반대쪽·중앙이면 지원·연결 움직임으로 중앙에 들어오지 않음(실측 윙어 평균 13~15m) */
    const L2=P[s].filter(a=>a!==c&&!a.gk&&!(a.run>st.sec)&&!wh(a)).map(a=>[a,hyp(a.x-c.x,a.y-c.y)]).filter(x=>x[1]<28).sort((x,y)=>x[1]-y[1]).slice(0,CFG.supN+(cfx>68?1:0));
    if(CFG.midDrop&&cfx<50&&(c.gk||c.g==='CB'||c.g==='FB')){const ms=P[s].filter(a=>(a.g==='DM'||a.g==='CM')&&!(a.run>st.sec)&&!L2.some(x=>x[0]===a)).map(a=>[a,hyp(a.x-c.x,a.y-c.y)]).sort((x,y)=>x[1]-y[1]).slice(0,CFG.midDrop);for(const x of ms)L2.push(x)}
    const R=cfx<35?14:cfx<70?12:10;const used=[];
    for(const [a] of L2){let best=null,bv=-99;for(const ang of [.6,-.6,1.4,-1.4,2.3,-2.3,0]){const pfx=cfx+Math.cos(ang)*R,pfy=cfy+Math.sin(ang)*R*(cfy<34?1:1);if(pfx<3||pfy<2||pfy>W-2||pfx>off-.7)continue;
        const px=F(s,pfx),py=Lt(s,pfy);let md=99;for(const b of P[o]){const d=hyp(b.x-px,b.y-py);if(d<md)md=d}let crowd=0;for(const u of used)if(hyp(u[0]-px,u[1]-py)<6)crowd++;for(const m of P[s])if(m!==a&&m!==c&&hyp(m.x-px,m.y-py)<4)crowd++;
        const v=Math.min(md,8)+(pfx-cfx)*.12-crowd*3-hyp(px-a.x,py-a.y)*.08;if(v>bv){bv=v;best=[px,py]}}
      if(best){used.push(best);const k=CFG.supK;a.tx=a.tx+(best[0]-a.tx)*k;a.ty=a.ty+(best[1]-a.ty)*k;a.urg=a.urg0=.75}}}
  // 태클
  function tackles(){const c=ball.own;if(!c||ball.rs)return;/* v166 골키퍼: 자기 박스 안에선 공을 손으로 잡고 있어 태클 불가(이전 경기당 0.02회 GK가 공을 들고 있다 뺏겨 실점 위기 — 실제론 거의 없음), 박스 밖 발밑 공은 뺏길 확률 ×0.2 */if(c.gk&&F(c.s,c.x)<16.5&&Math.abs(Lt(c.s,c.y)-34)<20.16)return;const d=1-c.s;for(const b of P[d]){if(b.gk||b.stun>0)continue;const dist=hyp(b.x-c.x,b.y-c.y);if(dist>1.7)continue;
      const pi=T[d].pi(b.p,'tk');const gs=F(d,b.x)<F(d,c.x)?1.5:1;const bk=st.cards[b.p.id]===1;/* v152 경고 받은 선수는 태클을 아낌(bkT·bkF), 수비 성향(dh)의 태클 빈도 영향은 dhT 지수로 완화 — 성향 높은 센터백이 압박 전술에서 경기당 파울 4~5개(실제 상위권 약 2개) */const pA=CFG.tackle*gs*(CFG.tkRole[b.g]??1)*Math.pow(DH(b,0),CFG.dhT??1)*(1+(pi-1)*(CFG.piTA??.35))*(1+TV(b,'태클')*.2)*(aggr(b)?1.25:1)*(b.press===st.sec?1:.6)*(bk?CFG.bkT??1:1);if(r()>pA)continue;
      let pF=CFG.foulTk*(1+aggr(b)*.4)*(1+(12-attr(b.p,'tackle',d))*.04)*(1+(pi-1)*(CFG.piTF??.4))*(b.press===st.sec?(CFG.pfPr??1)*Math.min(1,Math.pow(CFG.pfI??1,((T[d].ti||[])[5]??3)-3)):1)*(1+Math.max(0,(st.fatigue[d][b.p.id]||0)-45)/55*.15);
      {const D=st.dbg||(st.dbg={});D.tka=(D.tka||0)+1}/* v240 기록 정의: 압박 접근 실패는 태클 시도로 세지 않음(Opta 태클 시도 = 태클 성공 + 돌파 허용) → 성공했을 때만 시도·성공 */
      {const cfx=F(c.s,c.x),cfy=Lt(c.s,c.y);if(cfx>88.5&&Math.abs(cfy-34)<20.2)pF*=CFG.boxF}pF*=(1+TV(c,'파울 유도')*CFG.trFld)*Math.pow(DH(b,0),-CFG.dhF);
      if(bk)pF*=CFG.bkF??1;if(r()<pF){foul(c,b,'tackle');return}
      const pW=clamp(CFG.tkWin+TVc(b,'태클 장인','tackle')*CFG.trTk+(attr(b.p,'tackle',d)-attr(c.p,'drib',c.s)*.85)*.03+(V(b.p,'str',10)-V(c.p,'str',10))*.01+tw(d)*.02,.12,.8);
      if(r()<pW*(c.gk?.2:1)){if(rec)(st.tg||(st.tg=[])).push(['tk',b.p.id,c.p.id]);pr(b.p).tk++;pr(b.p).tkw++;pr(b.p).ta++;pr(b.p).r+=RW.tkw;pr(c.p).r-=RW.lost*(F(c.s,c.x)<35?2:1);const how=F(c.s,c.x)<60&&b.press&&st.sec-b.press<1.5?'press':'tackle';TR({k:'lost',p:c.p.name,by:b.p.name,how});lz5(c,how);
        c.stun=Math.max(c.stun||0,CFG.d5TkStun);if(r()<.62)give(b,'regain',.5);else if(r()<CFG.oTk)looseOut(c.x,c.y,r()<.5?c.s:d);else loose(c.x,c.y,(r()-.5)*9,(r()-.5)*9);return}
      else{b.stun=.6;if(rec)(st.tg||(st.tg=[])).push(['tm',b.p.id,c.p.id])}}}
  // ---- 공 갱신 ----
  function ballStep(){
    if(ball.own){const a=ball.own;ball.x=a.x+(a.vx||0)*.08;ball.y=a.y+(a.vy||0)*.08;ball.h=0;return}
    if(ball.fl){const f=ball.fl;f.t+=DT;const k=Math.min(1,f.t/f.T);ball.x=f.x0+(f.x1-f.x0)*k;ball.y=f.y0+(f.y1-f.y0)*k;ball.h=f.h?Math.sin(k*Math.PI)*f.h:0;
      if(k>=1){ball.fl=null;if(f.show){const fn=st.after;st.after=null;if(fn)fn();return}
        if(opt.plog&&f.from&&f.kind!=='clear'&&f.kind!=='head')(st.plog||(st.plog=[])).push([f.s,f.from.gk?'GK':f.from.g,F(f.s,f.x0),F(f.s,f.x1),f.res==='ok'?1:0,f.from.p.id,f.to?f.to.p.id:0,st.sec,f.res,f.kind||'',f.from.gk?1:0,st.pAcc,f.h||0,Lt(f.s,f.y0),Lt(f.s,f.y1),f.from.lastC5||[0,0,0]]);
        if(CFG.outKeep&&f.res==='loose'&&f.kind!=='clear'&&(f.y1<0||f.y1>W)&&f.x1>0&&f.x1<L&&r()<CFG.outKeep){/* v154 빗나간 패스가 터치라인 밖에 떨어지는 비율 보정(실측 SB: 패스가 사이드라인 밖으로 14.6회/경기 중 롱패스 5.7·골킥 0.5 / 엔진 32회, 롱볼 15) → 일부는 라인 안쪽에 떨어져 흐르는 공 */const d=2.5+r()*4.5;f.y1=f.y1<0?d:W-d}
        if(opt.rsDbg)st._ock='fl_'+(f.kind||f.res||'?')+(f.from&&f.from.gk?'_GK':'')+(hyp(f.x1-f.x0,f.y1-f.y0)>32?'_L':'_S')+(f.h>=.9?'_air':'');if(outCheck(f.x1,f.y1,f.lastS??f.s))return;if(opt.rsDbg)st._ock=null;
        if(f.res==='ok'){const m=f.to;/* v240 기록 정의: 패스가 받는 선수에게 닿으면 성공(Opta 기준). 그 뒤 첫 터치 실수는 받는 선수 볼 손실 */if(f.from)pr(f.from.p).pc++;ball.lastKind=(f.kind||'pass')+(f.x0!=null&&F(f.s,f.x0)>88.5?'@inbox':'');if(opt.hlLog&&cur&&cur.hl&&cur.s===f.s)cur.hl[19]=(cur.hl[19]||0)+Math.max(0,F(f.s,f.x1)-F(f.s,f.x0));m.x=f.x1*.6+m.x*.4;m.y=f.y1*.6+m.y*.4;const [nd]=nearestOpp(m);const ctl=CFG.ctl0-(nd<1.5?CFG.ctlP+(F(m.s,m.x)>88.5&&Math.abs(Lt(m.s,m.y)-34)<20.16?CFG.ctlB:0):0)-(nd<2.5?Math.max(0,(13-attr(m.p,'drib',m.s)*.6-V(m.p,'comp',12)*eff(m.p,m.s)*.4))*CFG.ctlSk:0)+(attr(m.p,'drib',m.s)-12)*.003;
          if(r()<ctl){if(f.from&&cur){const k2=[f.from.p.id,m.p.id].sort().join('-');cur.pairN=cur.pair===k2?(cur.pairN||1)+1:1;cur.pair=k2}if(f.from){const pp=st.pp||(st.pp={}),kq=f.from.p.id+'>'+m.p.id;pp[kq]=(pp[kq]||0)+1}if(f.from&&f.from.wallFrom===m&&st.sec<f.from.wallT+1){pr(m.p).w2=(pr(m.p).w2||0)+1;{const wp=st.wp||(st.wp={}),kq=[f.from.p.id,m.p.id].sort().join('-');wp[kq]=(wp[kq]||0)+1}pr(f.from.p).w2a=(pr(f.from.p).w2a||0)+1;TR({k:'wall',p:m.p.name,by:f.from.p.name});ev({s:m.s,t:'wall',p:m.p.name,a:f.from.p.name});f.from.wallFrom=null;pr(f.from.p).r+=.04}m.recvKind=f.kind==='through'||f.kind==='cutback'?f.kind:f.kind==='combo'?'combo':null;m.recvFrom=f.from;m.recvAt=st.sec;give(m,'keep');if(st.sbPend&&st.sbPend.m===m&&st.sec-st.sbPend.t<6){const D=st.dbg||(st.dbg={});D['sS_'+st.sbLat]=(D['sS_'+st.sbLat]||0)+1;const rx=F(m.s,m.x);const zb=rx<70?'a':rx<88.5?'b':'c';st.sbTrk={a:m,t:st.sec,z:zb};D['sR_'+zb]=(D['sR_'+zb]||0)+1;st.sbPend=null}if(CFG.thrTrk&&f.kind==='through'){const D=st.dbg||(st.dbg={});const rx=F(m.s,m.x);const [nd]=nearestOpp(m);const zb=rx<70?'a':rx<88.5?'b':'c';st.thrTrk={a:m,t:st.sec,z:zb};D['tR_'+zb]=(D['tR_'+zb]||0)+1;D['tN_'+(nd<2?'<2':nd<5?'2-5':'5+')]=(D['tN_'+(nd<2?'<2':nd<5?'2-5':'5+')]||0)+1}if(CFG.brLate&&f.kind==='through'){const mf=F(m.s,m.x);for(const q of P[1-m.s])if(!q.gk&&F(m.s,q.x)<mf+1)q.late=Math.max(q.late||0,st.sec+CFG.brLate*(1.25-attr(q.p,'pace',1-m.s)/20*.5))}m.recvKind=f.kind==='through'||f.kind==='cutback'?f.kind:f.kind==='combo'?'combo':null;m.recvFrom=f.from;m.recvAt=st.sec;if(opt.hlLog&&f.kind==='through'){const D=st.dbg||(st.dbg={});D.tbRecv=(D.tbRecv||0)+1;D['tbR_'+m.s]=(D['tbR_'+m.s]||0)+1;if(cur&&cur.hl)cur.hl[8]=1;st.tbT=st.sec;st.tbS=m.s;st.tbX=F(m.s,m.x);const [nd0]=nearestOpp(m);let gd=99;{const g=gkOf(1-m.s);gd=hyp(g.x-m.x,g.y-m.y)}(st.tbL||(st.tbL=[])).push([+F(m.s,m.x).toFixed(1),+Lt(m.s,m.y).toFixed(1),+nd0.toFixed(1),+gd.toFixed(1),0,m.g])}}else{if(f.from&&f.kind!=='clear'&&!f.from.gk&&f.kind!=='long'){st.pass[f.s][0]--;st.pass[f.s][1]++}loose(f.x1,f.y1,(r()-.5)*6,(r()-.5)*6);ball.loFrom='rcv';ball.loSide=f.s}}
        else if(f.res==='int'&&f.to){const b=f.to;b.x=f.x1*.7+b.x*.3;b.y=f.y1*.7+b.y*.3;if(rec&&!b.gk&&!(f.h>0)&&((Math.floor(st.sec*10)+b.p.id)%2)===0)(st.tg||(st.tg=[])).push(['bk',b.p.id,f.from&&f.from.p?f.from.p.id:0]);if(CFG.ftClrK&&!b.gk&&firstClear(b,f.h>0))return;give(b,'regain',.5)}
        else if(f.h>=.9){airLand(f)}
        else {/* v143 빗나간 패스: 실측 SB 실패 패스 뒤 다음 소유 상대 64~82%·같은 팀 0~6% (엔진은 같은 팀 34~51%) → 가까운 상대 쪽으로 흐름 */
          if(CFG.missOpp&&f.from&&!f.kind&&f.res==='loose'){let b=null,bd=CFG.missR;for(const q of P[1-f.s]){if(q.gk&&F(1-f.s,f.x1)>16)continue;const d=hyp(q.x-f.x1,q.y-f.y1);if(d<bd){bd=d;b=q}}
            if(b&&r()<CFG.missOpp){const v=bd/1.67;loose(f.x1,f.y1,(b.x-f.x1)/(bd||1)*v,(b.y-f.y1)/(bd||1)*v);ball.last=f.s;ball.loFrom='miss';ball.loSide=f.s;return}}
          loose(f.x1,f.y1,(r()-.5)*4,(r()-.5)*4);if(f.from){ball.loFrom=f.kind==='clear'?'clr':'miss';ball.loSide=f.s}}}return}
    if(ball.lo){const lo=ball.lo;ball.x+=lo.vx*DT;ball.y+=lo.vy*DT;lo.vx*=.7;lo.vy*=.7;if(outCheck(ball.x,ball.y,ball.last))return;
      const near=[];for(const q of [0,1])for(const a of P[q]){if(a.stun>0)continue;const d=hyp(a.x-ball.x,a.y-ball.y);if(d<1.3)near.push([a,d])}
      if(near.length){const w=pick(near,x=>1/(x[1]+.3)*(x[0].s===ball.last?1:1.1)*(.8+attr(x[0].p,'posit',x[0].s)*.02)/LRD(x[0]));const how=cur&&cur.s===w[0].s?'keep':'second';if(ball.loFrom!=null){const D=st.dbg||(st.dbg={});const k='lf_'+ball.loFrom+'_'+(w[0].s===ball.loSide?'own':'opp');D[k]=(D[k]||0)+1;ball.loFrom=null}
        /* 선방 리바운드: 슈팅 순간 오프사이드 위치였던 선수가 잡으면 오프사이드 */
        {const rb=st.offRb;st.offRb=null;if(rb&&rb.s===w[0].s&&st.sec-rb.t<5&&rb.set.has(w[0])){const s=rb.s;st.off[s]++;TR({k:'off',p:w[0].p.name});ev({s,t:'offside',p:w[0].p.name});restart('free',1-s,w[0].x,w[0].y);return}}
        if(how==='second'&&cur)ev({s:w[0].s,t:'secondBall',p:w[0].p.name});/* 루즈볼 경합에서 진 상대는 잠시 재정비(실측: 회수 순간 1.5m 내 상대 23%) */if(CFG.d5LsStun&&F(w[0].s,ball.x)<CFG.d5LsX){for(const q of P[1-w[0].s]){if(q.stun<=0&&r()<CFG.d5LsP&&hyp(q.x-ball.x,q.y-ball.y)<CFG.d5LsR)q.stun=Math.max(q.stun,CFG.d5LsStun)}}give(w[0],how,(w[0].gk&&CFG.d5GkHold)?gkHold('rec',w[0]):.35)}}}
  /* 높은 공 착지: 양 팀 가까운 선수가 공중볼 경합 → 이긴 쪽 헤더로 떨굼(자기 공격 방향) */
  /* v135 헤더 결과(실측 SB 80경기, 골킥·인플레이 공중볼 경합 승자 행동): 헤딩 패스 80~84%(앞 58%·옆 12~17%·뒤 10%, 성공 41~52%, 평균 13m),
     걷어내기 12~15%(자기 진영), 컨트롤 실수 4%. 실패한 헤딩 패스는 목표 근처 루즈볼(세컨드볼 다툼) */
  function headOut(w,x,y,dir){const s=w.s,wfx=F(s,x);const u=r();
    if(u<CFG.airMis){loose(x+(r()-.5)*4,y+(r()-.5)*4,(r()-.5)*6,(r()-.5)*6);ball.last=s;return true}
    if(wfx<52.5&&u<CFG.airMis+CFG.airClr){w.x=x;w.y=y;if(opt.debug)opt.debug(st.sec,w,{k:'clear',air:1,hx:1},wfx);clrFly(w,s,1,0);return true}
    const C=[];for(const m of P[s]){if(m===w||m.gk)continue;const dx=F(s,m.x)-wfx,d=hyp(m.x-x,m.y-y);if(d<5||d>26)continue;const dirk=dx>3?'f':dx<-3?'b':'l';
      C.push([m,(dirk==='f'?CFG.airHf:dirk==='b'?CFG.airHb:CFG.airHl)*Math.exp(-Math.abs(d-13)/8)*(1+Math.min(nearestOpp(m)[0],6)/6)])}
    if(!C.length)return false;const m=pick(C,c=>c[1])[0];const ok=r()<clamp(CFG.airHok+(attr(w.p,'aerial',s)-12)*.01+(Math.min(nearestOpp(m)[0],6)-3)*.04,.15,.8);
    let tx=m.x+(m.vx||0)*.5,ty=m.y+(m.vy||0)*.5;if(!ok){const [,o2]=nearestOpp(m);if(o2&&r()<CFG.airHfo){tx=o2.x+(r()-.5)*3;ty=o2.y+(r()-.5)*3}else{const a=r()*Math.PI*2,rr=4+r()*7;tx+=Math.cos(a)*rr;ty+=Math.sin(a)*rr}}tx=clamp(tx,-1,L+1);ty=clamp(ty,-1,W+1);
    const d=hyp(tx-x,ty-y);{const D=st.dbg||(st.dbg={});D['hp_'+(ok?'ok':'no')]=(D['hp_'+(ok?'ok':'no')]||0)+1}
    ball.own=null;ball.last=s;ball.fl={x0:x,y0:y,x1:tx,y1:ty,t:0,T:d/15+.2,h:ok?.5:.6,res:ok?'ok':'loose',s,from:w,to:ok?m:null,kind:'head'};if(ok){m.tx=tx;m.ty=ty;m.urg=1}return true}
  function airLand(f){const x=f.x1,y=f.y1;if(outCheck(x,y,f.s))return;const near=q=>{let b=null,bd=CFG.airConv?(q===f.s?CFG.airRs:CFG.airRd):4;for(const a of P[q]){if(a.gk&&F(q,x)>Math.min(20,16*gkSw(q)))continue;const d=hyp(a.x-x,a.y-y)*(q===f.s?1:LRD(a));if(d<bd){bd=d;b=a}}return b};
    const miss=CFG.missOpp&&f.res==='loose'&&f.from&&!f.kind;/* v143 빗나간 높은 패스는 받는 쪽이 공을 읽지 못함: 실측 실패 패스 뒤 같은 팀 회수 0~6% */const A=miss&&r()<CFG.missOpp?null:near(f.s),B=near(1-f.s);{const D=st.dbg||(st.dbg={});const k='airLand_'+(A&&B?'both':A?'own':B?'opp':'none');D[k]=(D[k]||0)+1}if(!A||!B){const w=A||B;if(w&&CFG.airUnH&&!w.gk&&r()<(w.s===f.s?CFG.airUnHs:CFG.airUnHo)){/* v137 경합 없는 높은 공도 상당수는 헤딩으로 처리(실측 헤딩 행동 36.7회/팀 중 경합 승리분 약 17회) */w.x=x;w.y=y;const wfx=F(w.s,x),dir=w.s===0?1:-1;
      if(w.s!==f.s&&wfx<35){if(opt.debug)opt.debug(st.sec,w,{k:'clear',air:1},wfx);clrFly(w,w.s,1,0);return}if(opt.debug)opt.debug(st.sec,w,{k:'head',air:1,un:1},wfx);if(headOut(w,x,y,dir))return}
    if(f.trL)f.trL.won=!!(w&&w.s===f.s);if(w){w.x=x;w.y=y;give(w,w.s===f.s?'keep':'second',(w.gk&&CFG.d5GkHold)?gkHold('rec',w):.4)}else loose(x,y,(r()-.5)*4,(r()-.5)*4);return}
    if(B.gk&&F(B.s,x)<6){give(B,'regain',1);return}
    {const D=st.dbg||(st.dbg={});const k='airK_'+(f.from&&f.from.gk?'gk':(f.kind||'pass'))+(f.sp?'_'+f.sp:'');D[k]=(D[k]||0)+1}
    const fxA=F(f.s,x);const pA=clamp(.5+airZ(fxA)+(airC(A.p,A.s)-airC(B.p,B.s))*.04+(CFG.airConv?(f.from&&f.from.gk?CFG.airSBg:f.kind==='clear'?0:CFG.airSBp):0),.15,.85);const w=r()<pA?A:B,l=w===A?B:A;if(f.trL)f.trL.won=w.s===f.s;{const D=st.dbg||(st.dbg={});const k='airW_'+(f.from&&f.from.gk?'gk':(f.kind||'pass'))+'_'+(w===A?'s':'o');D[k]=(D[k]||0)+1}
    pr(A.p).at++;pr(B.p).at++;pr(w.p).aw++;pr(w.p).r+=RW.airW;pr(l.p).r-=RW.airL;duelRec(A,B,f.s,w===A,laneOfFy(Lt(f.s,y)),true);{const D=st.dbg||(st.dbg={});D.airL=(D.airL||0)+1}
    const dir=w.s===0?1:-1;const wfx=F(w.s,x);const hc=CFG.hdClr&&w.s!==f.s&&wfx<35&&(wfx<16.5||r()<CFG.hdClrP);/* v143 자기 진영 공중볼: 박스 밖이면 일부는 헤딩 패스(실측 수비 진영 헤딩 패스 6.9·헤딩 걷어내기 9회/팀) */if(opt.debug)opt.debug(st.sec,w,{k:hc?'clear':'head',air:1},wfx);
    if(hc){/* 수비 진영 헤딩 걷어내기(실측 헤딩 걷어내기 9회/팀): 20~30m 앞으로 */if(CFG.clrV2){w.x=x;w.y=y;clrFly(w,w.s,1,0);return}loose(x+dir*(8+r()*6),y+(r()-.5)*14,dir*(12+r()*6),(r()-.5)*6);ball.last=w.s;return}
    if(CFG.airHd&&headOut(w,x,y,dir))return;
    loose(x+dir*(6+r()*6),y+(r()-.5)*10,dir*6,(r()-.5)*4);ball.last=w.s}
  function outCheck(x,y,lastS){if(x>=0&&x<=L&&y>=0&&y<=W)return false;if(opt.rsDbg){const D=st.dbg||(st.dbg={});const ln=(new Error().stack.split('\n')[2]||'').match(/:(\d+):/);const kk='oc_'+(st._ock?st._ock:ball.fl?('fl_'+(ball.fl.kind||ball.fl.res)):ball.lo?'loose':'other')+'_'+(ln?ln[1]:'?')+'_'+((y<0||y>W)?'side':'end');D[kk]=(D[kk]||0)+1}
    if(y<0||y>W){const s=1-lastS;restart('throw',s,clamp(x,1,L-1),y<0?.3:W-.3);return true}
    const atGoal0=x<0;const defS=atGoal0?0:1;const attS=1-defS; // 공이 나간 골라인의 수비 팀
    if(lastS===attS)restart('gk',defS,F(defS,5.5),34);else setCorner(attS,Lt(attS,clamp(y,0,W))<34?'L':'R');return true}
  // ---- 재시작 진행 ----
  function rsTargets(){const rs=ball.rs;if(!rs)return;const s=rs.s,o=1-s;
    if(CFG.sp2&&(rs.k==='corner'||rs.k==='fk'||rs.longT)){if(!rs.spDone){rs.spDone=1;spSetup(rs,rs.k==='fk'?'fk':'corner');rs.spT=[];P[0].concat(P[1]).forEach(a=>{if(a!==rs.tk)rs.spT.push([a,a.tx,a.ty,a.urg])})}else rs.spT.forEach(([a,x,y,u])=>{a.tx=x;a.ty=y;a.urg=u})}
    else if(rs.k==='corner'||rs.k==='fk'){const box=P[s].filter(a=>!a.gk&&a!==rs.tk).sort((a,b)=>airC(b.p,s)-airC(a.p,s));
      box.forEach((a,i)=>{if(i<6){a.tx=F(s,rs.k==='corner'?94+(i%3)*2.5:88+(i%3)*2);a.ty=Lt(s,27+i*2.6)}else if(i<8){a.tx=F(s,78);a.ty=Lt(s,22+i*3)}else{a.tx=F(s,50);a.ty=Lt(s,20+i*4)}a.urg=.8});
      P[o].forEach((b,i)=>{if(b.gk){b.tx=F(s,104.3);b.ty=34;return}if(i<9){const m=box[i-1];if(m){b.tx=m.tx+(s?-1:1);b.ty=m.ty+.8}else{b.tx=F(s,99);b.ty=30}}else{b.tx=F(s,70);b.ty=34}b.urg=.8})}
    else if(rs.k==='fkd'){const wx=rs.x+(F(s,L)-rs.x)*9.15/hyp(F(s,L)-rs.x,34-rs.y),wy=rs.y+(34-rs.y)*9.15/hyp(F(s,L)-rs.x,34-rs.y);
      const nw=CFG.sp2?clamp(spCfg(o).wall,2,5):4;
      if(CFG.fkdSet){/* v184 직접 프리킥 대형: 예전엔 수비 벽만 세우고 나머지는 평소 위치(공격팀 미드필더가 하프라인에 남고, 수비는 벽 뒤 골문 앞까지 내려감). 실제처럼 공격 3~5명이 박스 안 리바운드 자리(수비 라인 바로 앞, 온사이드), 1~2명은 박스 앞 세컨볼, 수비는 라인(골문에서 약 12~16m)에서 대인 마크·지역, 1명은 역습 대비 */
        const fx=F(s,rs.x),c=spCfg(s);const dl=clamp(fx+12,89,93.5);const X=v=>F(s,v),Y=v=>Lt(s,clamp(v,1,W-1));
        const pool=P[s].filter(a=>!a.gk&&a!==rs.tk);const stayN=Math.max(2,clamp(c.stay,1,3));const stay=pool.slice().sort((a,b)=>((a.g==='CB'?0:a.g==='FB'||a.g==='DM'?1:3)-(b.g==='CB'?0:b.g==='FB'||b.g==='DM'?1:3))||airC(a.p,s)-airC(b.p,s)).slice(0,stayN);
        const rest=pool.filter(a=>!stay.includes(a)).sort((a,b)=>(airC(b.p,s)+V(b.p,'shoot',10)*.5)-(airC(a.p,s)+V(a.p,'shoot',10)*.5));const nA=clamp((c.cAtk||5)-1,3,5);const atk=rest.slice(0,nA),edge=rest.slice(nA);
        const AY=[34,28,40,23,45];atk.forEach((a,i)=>{a.tx=X(dl-.8-(i%2)*.4);a.ty=Y(AY[i]);a.urg=.85});edge.forEach((a,i)=>{a.tx=X(Math.min(fx-2,84)-(i>1?5:0));a.ty=Y(34+(i%2?1:-1)*(6+i*3));a.urg=.8});
        const D=P[o].filter(b=>!b.gk);const gk=P[o][0];gk.tx=F(s,104.3);gk.ty=34+(rs.y-34)*.15;gk.urg=.9;
        const out=D.slice().sort((a,b)=>(['ST','W'].includes(b.g)?1:0)-(['ST','W'].includes(a.g)?1:0)||V(b.p,'pace',10)-V(a.p,'pace',10))[0];
        let left=D.filter(b=>b!==out);if(out){out.tx=F(s,62);out.ty=34;out.urg=.7}
        const wall=left.slice().sort((a,b)=>((['CB'].includes(a.g)?1:0)-(['CB'].includes(b.g)?1:0))||airC(a.p,o)-airC(b.p,o)).slice(0,nw);left=left.filter(b=>!wall.includes(b));
        wall.forEach((b,i)=>{b.tx=wx;b.ty=wy+(i-(nw-1)/2)*.75;b.urg=.85});
        const used=new Set();atk.forEach(a=>{let bi=null,bd=1e9;for(const b of left){if(used.has(b))continue;const d=Math.abs(Lt(s,b.y)-Lt(s,a.ty))+Math.abs(F(s,b.x)-dl)*.3-airC(b.p,o)*.2;if(d<bd){bd=d;bi=b}}if(bi){used.add(bi);bi.tx=X(dl+.5);bi.ty=a.ty+(Lt(s,a.ty)<34?.5:-.5);bi.urg=.9}});
        left.filter(b=>!used.has(b)).forEach((b,i)=>{b.tx=X(i===0?Math.min(fx-3,85):dl+.5);b.ty=Y(i===0?34+(rs.y>34?-6:6):34+(i%2?1:-1)*(9+i*2));b.urg=.85});rs.fkL=dl}
      else P[o].forEach((b,i)=>{if(b.gk){b.tx=F(s,104.5);b.ty=34+(rs.y-34)*.1;return}if(i<=nw){b.tx=wx;b.ty=wy+(i-nw/2-.5)*.8;b.urg=.8}})}
    if(CFG.restDef&&(rs.k==='fkd'||rs.k==='free'||(rs.k==='throw'&&!rs.longT))&&F(s,rs.x)>70){/* v140 공격 진영 직접 프리킥·일반 프리킥·스로인: 뒤에 남는 수비(실측 공이 상대 진영 깊을 때 공격팀 최후방 평균 58m·하위 10% 48m) — 세트피스 설정(남는 인원 1~3, 최소 2)만큼 센터백 우선·발 빠르고 공중볼 약한 선수 */
      const n=Math.max(2,clamp(spCfg(s).stay,1,3));const R=P[s].filter(a=>!a.gk&&a!==rs.tk).sort((a,b)=>((a.g==='CB'?0:a.g==='FB'||a.g==='DM'?1:3)-(b.g==='CB'?0:b.g==='FB'||b.g==='DM'?1:3))||(rs.k==='fkd'?airC(a.p,s)-airC(b.p,s):F(s,a.x)-F(s,b.x))).slice(0,n);
      const bx=F(s,rs.x);R.forEach((a,i)=>{const lim=clamp(bx-36,46,58)+i*3;if(F(s,a.x)>lim-1||F(s,a.tx)>lim){a.tx=F(s,lim);a.ty=Lt(s,34+(i-(n-1)/2)*14);a.urg=.8}})}
    if(CFG.gkSet&&rs.k==='gk'){/* v140 골킥 대형(실측 SkillCorner 골킥 88회: 차는 팀 센터백 중앙값 12.6m·좌우 ±10m, 풀백 30m, 최전방 54m / 상대 가장 가까운 선수 18.3m·박스 안 0.2명) — 짧게(빌드업)·길게(경합) 대형, 상대는 박스 밖. 압박 강한 상대는 박스 앞에서 센터백을 막고, 아니면 자기 진영으로 물러남 */
      if(rs.gkShort==null){const t=T[s],ti=t.ti||[3,3,3,3,3,3,0];{const gkk=t.pi?t.pi(P[s][0].p,'gkk'):1;rs.gkShort=r()<(gkk===0?CFG.gkkP[0]:gkk===2?CFG.gkkP[1]:clamp(CFG.gkShortP+(3-ti[4])*.15+((t.preset==='티키타카'||t.preset==='점유')?.2:t.preset==='다이렉트'?-.2:0),.08,.92))}P[s][0].gkF=rs.gkShort?0:2;{const D=st.dbg||(st.dbg={});const k='gkS'+s+(rs.gkShort?'s':'l');D[k]=(D[k]||0)+1}}
      const X=fx=>F(s,fx),Yl=fy=>Lt(s,fy);const mine=P[s].filter(a=>!a.gk&&a!==rs.tk),grp=g=>mine.filter(a=>a.g===g);const sh=rs.gkShort;
      const put=(L,xs,ys)=>L.forEach((a,i)=>{a.tx=X(xs[Math.min(i,xs.length-1)]);a.ty=Yl(ys[Math.min(i,ys.length-1)]);a.urg=.8});
      put(grp('CB'),sh?[9,9,14]:[30,30,28],sh?[19,49,34]:[26,42,34]);put(grp('FB'),sh?[25,25]:[33,33],[6,62]);put(grp('DM'),sh?[20,24]:[42,42],[34,28]);put(grp('CM'),sh?[32,32]:[46,46],[26,42]);put(grp('AM'),sh?[42]:[52],[34]);put(grp('W'),sh?[45,45]:[55,55],[8,60]);put(grp('ST'),sh?[54,52]:[60,58],[32,38]);
      const tO=T[o],pr=(tO.ti&&tO.ti[5]>=4)||tO.preset==='게겐프레싱';const opp=P[o].filter(b=>!b.gk);const fw=opp.filter(b=>['ST','W','AM'].includes(b.g)),md=opp.filter(b=>['CM','DM'].includes(b.g)),df=opp.filter(b=>['CB','FB'].includes(b.g));
      const tgt=mine.slice().sort((a,b)=>F(s,a.tx)-F(s,b.tx));
      const pl0=(tO.ti?tO.ti[5]:3);const nP=pl0>=4||pr?3:pl0>=3?2:1;fw.slice().sort((a,b)=>(a.g==='ST'?0:1)-(b.g==='ST'?0:1)).forEach((b,i)=>{const m=tgt[i];if(i<nP&&m&&F(s,m.tx)<30){b.tx=X(Math.max(17.5,F(s,m.tx)+(pr?2.5:6)));b.ty=m.ty}else{b.tx=X((pr?30:42)+i*2);b.ty=Yl(20+i*14)}b.urg=.8});
      md.forEach((b,i)=>{b.tx=X(pr?36+i*3:54+i*2);b.ty=Yl(24+i*10);b.urg=.8});df.forEach((b,i)=>{b.tx=X(pr?55:66);b.ty=Yl(10+i*48/Math.max(1,df.length-1));b.urg=.8});
      P[o].forEach(b=>{if(b.gk)return;const fx=F(s,b.tx),fy=Lt(s,b.ty);if(fx<17&&Math.abs(fy-34)<20.6){b.tx=X(17.2)}})}
    else if(rs.k==='kick'){[0,1].forEach(q=>{const sh=shape(q);P[q].forEach((a,i)=>{const an=sh.base[Math.min(i,sh.base.length-1)];a.tx=F(q,Math.min(an.fx*.5,50));a.ty=Lt(q,an.fy);a.urg=.8})})}
    else if(rs.k==='pen'){P[s].concat(P[o]).forEach(a=>{if(a===rs.tk||a===P[o][0])return;a.tx=F(s,80);a.ty=clamp(a.ty,20,48)});P[o][0].tx=F(s,104.8);P[o][0].ty=34}
    if(rs.tk){rs.tk.tx=rs.x+(rs.k==='corner'||rs.k==='pen'?0:0);rs.tk.ty=rs.y;rs.tk.urg=1}}
  /* v184 세트피스 대인 마크 표시(mk)가 한 번 붙으면 경기 내내 남아 그 수비수가 박스 채우기(boxFillD) 후보에서 계속 빠지던 문제 → 세트피스 공이 처리되고 6초 뒤 해제 */
  function setTimeoutMk(){st.mkClr=st.sec+6}
  function rsExec(){const rs=ball.rs;ball.rs=null;if(CFG.fkdSet)setTimeoutMk();const s=rs.s,tk=rs.tk||P[s][1];tk.x=rs.x;tk.y=rs.y;ball.x=rs.x;ball.y=rs.y;
    if(rec&&(rs.k==='corner'||rs.k==='fk'||rs.k==='fkd'))(st.tg||(st.tg=[])).push(['kk',tk.p.id,rs.k==='fkd'?'fkd':'cross',1,0,rs.k]);
    if(rs.k==='corner'){beginPoss(s,tk,'sp');const sw=swing(tk.p,rs.side);cur.tr.push({k:'sp',kind:'corner',p:tk.p.name,side:rs.side});ev({s,t:'corner',p:tk.p.name,side:rs.side,sw});
      const q=(attr(tk.p,'cross',s)*.5+V(tk.p,'fk',10)*.5*eff(tk.p,s))*(sw==='in'?1.06:1);
      if(CFG.sp2){const c=spCfg(s,rs.sit);const nsg=Lt(s,rs.y)<34?-1:1;if(rs.short&&(c.cType==='short'||c.cType==='auto')){st.cornOv=null;ev({s,t:'cornerShort',p:tk.p.name});const m=rs.short;flight(tk.x,tk.y,m.x,m.y,.6,0);st.after=()=>give(m,'keep',.5);return}
        const ty=c.cType==='in'?'in':c.cType==='out'?'out':c.cType==='driven'?'n':sw;spDeliver(s,tk,q*(ty==='n'?.97:1),'corner',ty,nsg,rs.sit);st.cornOv=null;return}
      aerial(s,{a:tk,sw},q,'corner');return}
    if(rs.k==='fk'){beginPoss(s,tk,'sp');const side=rs.lane<=1?'L':rs.lane>=3?'R':'C';const sw=swing(tk.p,side);cur.tr.push({k:'sp',kind:'fk',p:tk.p.name,side});ev({s,t:'fkCross',p:tk.p.name,side,sw});
      const fk=V(tk.p,'fk',10)*eff(tk.p,s);if(CFG.sp2){spDeliver(s,tk,(fk*.6+attr(tk.p,'cross',s)*.4)*(sw==='in'?1.05:1)*(rs.sit&&rs.sit[1]==='f'?.94:1),'fk',sw,Lt(s,rs.y)<34?-1:1,rs.sit);return}aerial(s,{a:tk,sw},(fk*.6+attr(tk.p,'cross',s)*.4)*(sw==='in'?1.05:1),'fkx');return}
    if(rs.k==='fkd'){beginPoss(s,tk,'sp');const fy=Lt(s,rs.y);const side=fy<22?'L':fy>46?'R':'C';const sw=swing(tk.p,side);cur.tr.push({k:'sp',kind:'fk',p:tk.p.name,side,direct:true});ev({s,t:'fkShot',p:tk.p.name,side,sw});
      const fk=V(tk.p,'fk',10)*eff(tk.p,s);const fx=F(s,rs.x);const wM=CFG.sp2?({2:1.25,3:1.1,4:1,5:.92}[clamp(spCfg(1-s).wall,2,5)]||1):1;const xg=clamp((1+TVc(tk,'프리킥 스페셜리스트','fk')*CFG.trFk)*XG.fk*wM*(1+(fk-13)*.07)*(sw==='in'?1.12:sw==='out'?.95:1)*clamp(1.4-(L-fx-16)*.04,.6,1.4),.01,.15);shoot(tk,'fk',xg,null);return}
    if(rs.k==='pen'){takePen(s,tk.p.id);return}
    if(CFG.sp2&&rs.longT){beginPoss(s,tk,'sp');cur.tr.push({k:'sp',kind:'throw',p:tk.p.name});ev({s,t:'longThrow',p:tk.p.name});spDeliver(s,tk,8+V(tk.p,'str',10)*.4,'throw','n',Lt(s,rs.y)<34?-1:1);return}
    give(tk,rs.k==='free'||rs.k==='throw'?'sp':'keep',rs.k==='gk'?.8:.4);if(rs.k==='throw')tk.restr='throw';tk.spP=rs.k;if(rs.k==='kick'||rs.k==='gk')cur.tr[0].sp=undefined}
  function kickoffPos(){[0,1].forEach(q=>{const sh=shape(q);P[q].forEach((a,i)=>{const an=sh.base[Math.min(i,sh.base.length-1)];a.x=F(q,Math.min(an.fx*.5,50));a.y=Lt(q,an.fy);a.run=0;a.stun=0})})}
  // ---- 1틱 ----
  function tick(){st.sec+=DT;if(CFG.vTrk){const k5=Math.floor(st.sec*5);if(k5!==st.vK){st.vK=k5;const H=st.vH||(st.vH=[]);const os=ball.own?ball.own.s:(CFG.vFl&&ball.fl&&ball.fl.s!=null?ball.fl.s:null);H.push(os!=null&&!ball.rs?{s:os,bx:F(os,ball.x),off:offLine(os),pos:new Map(P[os].map(q=>[q,[F(os,q.x),Lt(os,q.y)]]))}:null);if(H.length>16)H.shift();
if(H.length===16){const c=H[10],fu=H[15],p1=H[5];if(c&&fu&&p1&&c.bx>=60&&fu.s===c.s&&H.slice(0,11).every(h=>h&&h.s===c.s)){const D=st.dbg||(st.dbg={});const LS=st.vLS||(st.vLS=new Map());for(const [q,[x,y]] of c.pos){if(q.g!=='ST'&&q.g!=='W')continue;if(!(x>c.off-5&&x<=c.off+.3))continue;const f=fu.pos.get(q);if(!f||f[0]-x<4)continue;const pp=p1.pos.get(q);if(!pp||H.slice(0,10).some(h=>!h.pos.get(q)))continue;if(x-pp[0]>=3)continue;if((LS.get(q)??-99)>k5-20)continue;LS.set(q,k5);D.vN=(D.vN||0)+1;const xs=H.slice(0,10).map(h=>h.pos.get(q)[0]);const back=Math.max(...xs)-x;const lat=y-pp[1],ldx=x-pp[0];const k=back>=1.5?'V':Math.abs(lat)>=2&&Math.abs(lat)>Math.abs(ldx)?'arc':'straight';D['v_'+k]=(D['v_'+k]||0)+1;const ry=f[1]-y;D[Math.abs(ry)>Math.abs(f[0]-x)*.27?'v_diag':'v_fwd']=(D[Math.abs(ry)>Math.abs(f[0]-x)*.27?'v_diag':'v_fwd']||0)+1}}}}}if(CFG.lnTrk){const sk=Math.floor(st.sec);if(sk!==st.lnK){st.lnK=sk;const D=st.dbg||(st.dbg={});const S=st.lnSnap;if(S){const s=S.s;let run=0,bey=0,near=0;for(const [a,x] of S.pos){if(a.gk)continue;const v=F(s,a.x)-x;if(x>S.off+.3)bey++;if(x>S.off-5&&v>=4)run++;if(a.g==='ST'){if(a.run>st.sec&&st.sec>=a.runGo){D['lnSr_'+S.z]=(D['lnSr_'+S.z]||0)+1;D['lnSrv_'+S.z]=(D['lnSrv_'+S.z]||0)+v;D['lnSrd_'+S.z]=(D['lnSrd_'+S.z]||0)+(S.off-x);D['lnSrt_'+S.z]=(D['lnSrt_'+S.z]||0)+(F(s,a.tx)-S.off);D['lnSrb_'+S.z]=(D['lnSrb_'+S.z]||0)+(F(s,a.bx0??a.tx)-S.off);D['lnSru_'+S.z]=(D['lnSru_'+S.z]||0)+(a.urg||0);D['lnSrk_'+a.rk]=(D['lnSrk_'+a.rk]||0)+1}}if(x>S.off-5&&x<=S.off+.3){const vb=v<0?'neg':v<2?'0-2':v<4?'2-4':'4+';D['lnV_'+S.z+'_'+vb]=(D['lnV_'+S.z+'_'+vb]||0)+1;if(v>=4)D['lnVg_'+S.z+'_'+a.g]=(D['lnVg_'+S.z+'_'+a.g]||0)+1;if(a.run>st.sec-1)D['lnVr_'+S.z]=(D['lnVr_'+S.z]||0)+1}if(x>S.off-3){near++;D['lnG_'+S.z+'_'+a.g]=(D['lnG_'+S.z+'_'+a.g]||0)+1}}D['lnN_'+S.z]=(D['lnN_'+S.z]||0)+1;{const lv=offLine(s)-S.off;D['lnLv_'+S.z]=(D['lnLv_'+S.z]||0)+lv;if(lv>=2)D['lnL2_'+S.z]=(D['lnL2_'+S.z]||0)+1;D['lnBv_'+S.z]=(D['lnBv_'+S.z]||0)+(F(s,ball.x)-S.bx);for(const [q,x] of S.pos)if(q.g==='ST'){const v=F(s,q.x)-x;D['lnSv_'+S.z]=(D['lnSv_'+S.z]||0)+v;D['lnSn_'+S.z]=(D['lnSn_'+S.z]||0)+1;if(v>=4)D['lnS4_'+S.z]=(D['lnS4_'+S.z]||0)+1}}for(const [a] of S.pos){if(a.g==='ST'){D['lnST_'+S.z]=(D['lnST_'+S.z]||0)+1;D['lnSTt_'+S.z]=(D['lnSTt_'+S.z]||0)+(S.off-F(s,a.tx));D['lnSTx_'+S.z]=(D['lnSTx_'+S.z]||0)+(S.off-F(s,a.x));{const dd=S.off-F(s,a.x);const b=dd<0?'<0':dd<1?'0-1':dd<3?'1-3':dd<6?'3-6':dd<10?'6-10':'10+';D['lnSH_'+S.z+'_'+b]=(D['lnSH_'+S.z+'_'+b]||0)+1}}if(a.g==='W'){D['lnW_'+S.z]=(D['lnW_'+S.z]||0)+1;D['lnWx_'+S.z]=(D['lnWx_'+S.z]||0)+(S.off-F(s,a.x));D['lnSTb_'+S.z]=(D['lnSTb_'+S.z]||0)+(S.off-F(s,a.bx0??a.tx));if(a.run>st.sec)D['lnSTr_'+S.z]=(D['lnSTr_'+S.z]||0)+1}}D['lnR_'+S.z]=(D['lnR_'+S.z]||0)+run;D['lnB_'+S.z]=(D['lnB_'+S.z]||0)+bey;D['lnC_'+S.z]=(D['lnC_'+S.z]||0)+near;D['lnX_'+S.z]=(D['lnX_'+S.z]||0)+S.off}st.lnSnap=null;const os_=ball.own?ball.own.s:(CFG.vFl&&ball.fl&&ball.fl.s!=null?ball.fl.s:null);if(os_!=null&&!ball.rs){const s=os_,bx=F(s,ball.x);st.lnSnap={s,bx,z:bx<60?'<60':bx<75?'60-75':'75+',off:offLine(s),pos:P[s].map(q=>[q,F(s,q.x)])}}}}{const px=ball.px??ball.x,py=ball.py??ball.y;ball.vx=(ball.x-px)/DT;ball.vy=(ball.y-py)/DT;ball.px=ball.x;ball.py=ball.y}{const D=st.dbg||(st.dbg={});const k=ball.rs?'t_rs':ball.fl&&ball.fl.show?'t_show':ball.own?'t_own':ball.fl?'t_fl':ball.lo?'t_lo':'t_x';D[k]=(D[k]||0)+DT/60}
    [0,1].forEach(s=>P[s].forEach(a=>{a.urg=.6}));
    if(ball.fl&&ball.fl.show){/* v115: 결과가 정해진 비행(세트피스·크로스·슛 등) 중에도 선수는 마지막 목표로 계속 이동(이전엔 전원 정지 → 리플레이에서 수비가 제자리, 착지 순간 순간이동) */if(CFG.flMove)[0,1].forEach(q=>P[q].forEach(a=>{a.urg=a.urg0||.6;move(a)}));ballStep();record();return} // 연출(결과 확정) 중
    if(st.after&&!ball.fl){const fn=st.after;st.after=null;fn()}
    if((st.tk&1)===0||st.retg!==possS){targets(0);targets(1);st.retg=possS}else{[0,1].forEach(q=>P[q].forEach(a=>{a.urg=a.urg0||.6}))}
    if(ball.rs){rsTargets();[0,1].forEach(s=>P[s].forEach(move));ball.rs.t-=DT;if(ball.rs.t<=0){if(ball.rs.tk&&hyp(ball.rs.tk.x-ball.rs.x,ball.rs.tk.y-ball.rs.y)>3&&ball.rs.t>-3){}else rsExec()}record();return}
    const ds=ball.own?1-ball.own.s:1-possS;pressing(ds);runs(1-ds);
    [0,1].forEach(s=>P[s].forEach(move));
    tackles();
    if(ball.own){const a=ball.own;if(!Number.isFinite(a.cd))a.cd=0;if(a.cLoss&&st.sec>=a.cLoss){a.cLoss=0;a.carry=null;const [nd0,nb0]=nearestOpp(a);{const D=st.dbg||(st.dbg={});D.cLoss=(D.cLoss||0)+1}pr(a.p).r-=RW.lost;TR({k:'lost',p:a.p.name,by:nb0?nb0.p.name:'',how:'carry'});lz5(a,'carry');if(nb0&&nd0<3&&r()<.6){pr(nb0.p).tk++;if(rec)(st.tg||(st.tg=[])).push(['tk',nb0.p.id,a.p.id]);give(nb0,'regain',.5)}else loose(a.x,a.y,(r()-.5)*8,(r()-.5)*8);return}/* v107: 소유자 결정 대기값이 없거나 NaN이면 영원히 행동하지 않아 경기가 멈췄음 */a.cd-=DT;const [nd]=nearestOpp(a);if(a.cd<=0||(nd<1.6&&!a.hands&&a.cd>.25&&r()<.4))act(a);
      if(cur&&ball.own&&cur.lane==null&&F(ball.own.s,ball.own.x)>70)setLane(Lt(ball.own.s,ball.own.y))}
    if(opt.hlLog&&cur&&cur.hl&&ball.own&&ball.own.s===cur.s){const f=F(cur.s,ball.x);if(!(cur.hl[17]>=f))cur.hl[17]=f}
    ballStep();
    const ps=ball.own?ball.own.s:ball.fl&&ball.fl.s!=null?ball.fl.s:possS;st.pos[ps]++;
    if((st.tk&3)===0&&ball.own){const s=ball.own.s,o=1-s,g=st.supA[s];g.n++;const z=[[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]];
      const cellOf=(fx,fy)=>[fx>70?0:fx>35?1:2,laneOfFy(fy)];P[s].forEach(a=>{if(a.gk)return;const [rw,ln]=cellOf(F(s,a.x),Lt(s,a.y));z[rw][ln]++});P[o].forEach(b=>{if(b.gk)return;const [rw,ln]=cellOf(F(s,b.x),Lt(s,b.y));z[rw][ln]--});
      for(let i=0;i<3;i++)for(let j=0;j<5;j++)g.g[i][j]+=z[i][j]}
    record()}
  let lastFl=null;function swapTrack(){/* v161 스위칭 판정을 '지속된 자리 바꿈'으로: 순간 위치 대신 약 13초 평활 위치(swA2 .15/2초)로, 20초 이상 유지(swHold). 실측(SkillCorner 20경기, 같은 정의) 경기당 17.8회 — 공격수끼리·측면끼리가 대부분, 풀백-공격수 1.7·반대편 측면 풀백 0.55. 이전 정의(순간 4초)는 실측도 105회로, 수비 이동 중 잠깐 엇갈리는 것까지 셌음 */ /* v156 위치 스위칭: 각 선수의 경기 평균 가로 위치(지수평균) 순서와 지금 순서가 바뀐 채 4초 이상 유지되면(세로 15m 안, 가로 6m 이상 떨어짐, 4초 이상, 재개 중·재개 뒤 8초 제외, 센터백 제외) 1회 — 원래 순서로 돌아와야 다시 셈 */const sw=st.swp||(st.swp={c:{},on:{},my:{},rs:0});if(ball.rs){sw.rs=st.sec;return}if(st.sec-sw.rs<8)return;
    for(const q of [0,1]){const A=P[q].filter(a=>!a.gk&&a.g!=='CB');const A2=CFG.swA2??1,cu=sw.cu||(sw.cu={});for(const a of A){const y=Lt(q,a.y),fx=F(q,a.x);const o=sw.my[a.p.id];sw.my[a.p.id]=o==null?y:o+(y-o)*.01;const c=cu[a.p.id];cu[a.p.id]=c?[c[0]+(fx-c[0])*A2,c[1]+(y-c[1])*A2]:[fx,y]}
      for(let i=0;i<A.length;i++)for(let j=i+1;j<A.length;j++){const a=A[i],b=A[j];const ma=sw.my[a.p.id],mb=sw.my[b.p.id];if(Math.abs(ma-mb)<8)continue;const k=a.p.id<b.p.id?a.p.id+'-'+b.p.id:b.p.id+'-'+a.p.id;
        const ca=cu[a.p.id],cb=cu[b.p.id],ya=ca[1],yb=cb[1];const inv=Math.abs(ca[0]-cb[0])<15&&Math.abs(ya-yb)>6&&((ma<mb)!==(ya<yb));const t0=sw.on[k];
        if(inv){if(t0==null)sw.on[k]=st.sec;else if(t0>=0&&st.sec-t0>=(CFG.swHold??4)){sw.c[k]=(sw.c[k]||0)+1;sw.on[k]=-1}}else if(t0!=null&&(t0>=0||(Math.abs(ya-yb)>6&&(ma<mb)===(ya<yb))))delete sw.on[k]}}}
  let recN=0;function record(){if(opt.tick)opt.tick();if(CFG.swOn&&(++recN)%4===0&&st.min>=5)try{swapTrack()}catch(e){}/* v157 위치 스위칭은 중계 기록 없이 계산하는 경기에서도 셈 */if(!rec)return;const f={t:+st.sec.toFixed(1),b:[+ball.x.toFixed(1),+ball.y.toFixed(1),+ball.h.toFixed(2)],o:ball.own?ball.own.p.id:null,ps:possS,rs:ball.rs?1:0,rk:ball.rs?ball.rs.k:undefined,p:{}};
    if(ball.fl&&ball.fl!==lastFl&&ball.fl.from&&ball.fl.from.p){const fr0=ball.fl.from,th=(fr0.thrT!=null&&st.sec-fr0.thrT<2)||ball.fl.kind==='throw';if(th)fr0.thrT=null;(st.tg||(st.tg=[])).push(th?['kk',fr0.p.id,ball.fl.kind||'',+(ball.fl.h||0),null,'thr']:['kk',fr0.p.id,ball.fl.kind||'',+(ball.fl.h||0)])}/* v160 스로인 표시(3D 손 동작) */;lastFl=ball.fl;if(st.tg&&st.tg.length){f.g=st.tg;st.tg=[]}
    for(const q of [0,1])for(const a of P[q])f.p[a.p.id]=[+a.x.toFixed(1),+a.y.toFixed(1)];try{anaRec(f)}catch(e){}/* v124 후반 진영 교체(표시용): 엔진 내부 좌표는 팀0이 늘 오른쪽 공격이지만, 중계 프레임은 후반에 좌우·상하를 뒤집어 기록 → 2D·3D 모두 후반엔 양 팀이 진영을 바꿔 보임 */if(st.min>45&&!opt.noFlip){f.b[0]=+(105-f.b[0]).toFixed(1);f.b[1]=+(68-f.b[1]).toFixed(1);for(const id in f.p){const q=f.p[id];q[0]=+(105-q[0]).toFixed(1);q[1]=+(68-q[1]).toFixed(1)}f.h2=1}st.frames.push(f)}
  /* v106 선수별 경기 분석: 히트맵(16×10)·패스(출발→도착·성공)·슈팅·수비 행동·드리블 — 좌표는 각 팀 공격 방향 기준(→, 왼쪽에서 오른쪽) */
  function anaRec(f){const A=st.ana||(st.ana={H:{},P:{},S:{},D:{},K:{},e0:0,cur:null});const N=(s,x,y)=>s===0?[+x.toFixed(1),+y.toFixed(1)]:[+(105-x).toFixed(1),+(68-y).toFixed(1)];const push=(o,id,v)=>{const L=o[id]||(o[id]=[]);if(L.length<150)L.push(v)};
    const byN=(nm)=>{for(const q of [0,1])for(const a of P[q])if(a.p.name===nm)return a;return null},byI=(id)=>{for(const q of [0,1])for(const a of P[q])if(a.p.id===id)return a;return null};
    if(!ball.rs)for(const q of [0,1])for(const a of P[q]){const [x,y]=N(q,a.x,a.y);const gi=Math.min(15,Math.max(0,Math.floor(x/105*16))),gj=Math.min(9,Math.max(0,Math.floor(y/68*10)));(A.H[a.p.id]||(A.H[a.p.id]=new Array(160).fill(0)))[gj*16+gi]++}
    let shotBy=null,goal=false;
    for(let i=A.e0;i<st.ev.length;i++){const e=st.ev[i];
      if(e.t==='goal'||e.t==='save'||e.t==='miss'||e.t==='block'){const ag=byN(e.p);if(ag){push(A.S,ag.p.id,[...N(ag.s,ag.x,ag.y),e.xg!=null?+e.xg:null,e.t[0]]);shotBy=ag.p.id;const c=A.cur;if(c&&c.id!==ag.p.id&&c.s===ag.s&&!c.shot&&f.t-c.t<8){push(A.P,c.id,[c.x,c.y,...N(ag.s,ag.x,ag.y),1,c.k||'']);A.cur=null}}if(e.t==='goal')goal=true}
      else if(e.t==='dribble'){const ag=byN(e.p);if(ag)push(A.K,ag.p.id,N(ag.s,ag.x,ag.y))}
      else if(e.t==='clear'||e.t==='intercept'||e.t==='aerialWon'||e.t==='aerialLost'){const ag=byN(e.p);if(ag)push(A.D,ag.p.id,[...N(ag.s,ag.x,ag.y),{clear:'cl',intercept:'it',aerialWon:'aw',aerialLost:'al'}[e.t]])}
      else if(e.t==='foul'){const ag=byN(e.d);if(ag)push(A.D,ag.p.id,[...N(ag.s,ag.x,ag.y),'fo'])}}
    A.e0=st.ev.length;let tk=new Set();
    (f.g||[]).forEach(g=>{if(g[0]==='tk'||g[0]==='tm'){const ag=byI(g[1]);if(ag){push(A.D,ag.p.id,[...N(ag.s,ag.x,ag.y),g[0]]);if(g[0]==='tk')tk.add(ag.p.id)}}else if(g[0]==='kk'&&A.cur&&A.cur.id===g[1])A.cur.k=g[2]});
    if(ball.rs){/* 재시작(스로인·골킥·코너·프리킥·킥오프) 중엔 소유 이어짐을 끊음 — 재시작으로 받은 공을 '볼 탈취'로 세던 문제. 상대 재시작으로 끝난 마지막 패스는 실패로 기록 */
      const c=A.cur;if(c&&!c.shot&&!goal&&ball.rs.s!==c.s&&['throw','gk','corner'].includes(ball.rs.k)&&f.t-c.t<8){const to=N(c.s,ball.rs.x,ball.rs.y);push(A.P,c.id,[c.x,c.y,to[0],to[1],0,c.k||''])}A.cur=null;return}
    const o=ball.own;
    if(o){const [ox,oy]=N(o.s,o.x,o.y);if(A.cur&&A.cur.id!==o.p.id){const c=A.cur;if(!goal&&!c.shot&&f.t-c.t<8&&!(f.rs&&o.s!==c.s&&ball.rs)){const to=N(c.s,o.x,o.y);push(A.P,c.id,[c.x,c.y,to[0],to[1],o.s===c.s?1:0,c.k||'']);if(o.s!==c.s&&!o.gk&&!tk.has(o.p.id))push(A.D,o.p.id,[ox,oy,'rc',c.k||'',+(f.t-c.t).toFixed(1)])}}
      if(!A.cur||A.cur.id!==o.p.id)A.cur={id:o.p.id,s:o.s,x:ox,y:oy,t:f.t,k:null,shot:false};else{A.cur.x=ox;A.cur.y=oy;A.cur.t=f.t}}
    if(shotBy&&A.cur&&A.cur.id===shotBy)A.cur.shot=true;if(goal)A.cur=null}
  // ---- 인터페이스 ----
  let total=90+(opt.added||3);
  const api={
    sub:(s,outId,inP)=>{const i=T[s].xi.findIndex(p=>p.id===outId);if(i<0||!inP)return false;if(T[s].xi.some(p=>p.id===inP.id)||st.ev.some(e=>e.t==='red'&&e.pid===inP.id)||st.subs[s].some(x=>x.out.id===inP.id))return false;const out=T[s].xi[i];T[s].xi[i]=inP;T[s].fm[inP.id]=fitOf(inP,effKey(T[s],Math.min(i,10)));st.fatigue[s][inP.id]=0;
      st.pr[inP.id]=st.pr[inP.id]||Object.assign(NPS(),{in0:st.min});st.subs[s].push({m:st.min,out,inP});if(st.pr[out.id])st.pr[out.id].out0=st.min;ev({s,t:'sub',out:out.name,inP:inP.name});
      const oa=P[s][i];const na=mk(inP,s,i);if(oa){na.x=oa.x;na.y=oa.y}if(ball.own===oa)ball.own=na;P[s][i]=na;SH[s]=null;EF[s]={};return true},
    setTactic:(s,patch)=>{const X=T[s],ob=X.form.base;Object.assign(X,patch);
      if(patch.form&&patch.form.base&&patch.form.base!==ob&&!patch.keepXI&&X.xi.length===11){const ids=bestAssign(X.xi,patch.form.base);const byId={};X.xi.forEach((p,i)=>byId[p.id]=i);const nx=ids.map(id=>X.xi[byId[id]]);
        if(nx.every(Boolean)){const nd=nx.map(p=>(X.duties||[])[byId[p.id]]??1),nk=nx.map(p=>(X.marks||[])[byId[p.id]]||{on:false});X.xi.splice(0,11,...nx);X.duties=nd;X.marks=nk}X.pos={};if(!patch.slotAs)X.slotAs={};X.roles=defaultRoles(X.xi,patch.form.base)}
      if(patch.form||patch.slotAs)X.refit();if(patch.pi)X.pi_=patch.pi;
      if(patch.ti||patch.preset){X.ti=patch.ti||PRESETS[patch.preset]||X.ti;X.preset=patch.preset||X.preset}
      X.dev=X.ti.reduce((a,v,i)=>a+Math.max(0,Math.abs(v-PRESETS[X.preset][i])-1),0);X.styleBonus=styleOf(styleMap(X.xi)[X.preset],X.fam,X.dev);
      sync(s);EF[s]={};[0,1].forEach(q=>{counter[q]=BEATS[T[q].preset].includes(T[1-q].preset)?CFG.beatK*Math.max(0,.5+.5*T[q].styleBonus):0})},
    shout:(s,kind)=>{const t=T[s];if(kind==='push')t.ment='공격적';if(kind==='hold')t.ment='수비적';if(kind==='calm')t.ment='균형';if(kind==='fire'){st.mom+=s===0?.5:-.5;st.fm=st.fm||[0,0];st.fm[s]=Math.min(1.2,st.fm[s]+.6)}ev({s,t:'shout',kind})},
    momentum:()=>st.mom,state:st,teams:T,
    takePen:(id)=>{if(!st.pendingPen)return [];const b=st.ev.length;takePen(st.pendingPen.s,id);return st.ev.slice(b)},decide:(ch,good)=>{if(st.pendingDec){st.pendingDec.ch=ch;st.pendingDec.good=!!good}}};
  sync(0);sync(1);kickoffPos();restart('kick',0,52.5,34);ball.rs.t=.5;
  function minuteStart(){st.min++;[0,1].forEach(q=>{const k=T[q].preset+'|'+T[q].form.base;st.tu[q][k]=(st.tu[q][k]||0)+1});
    if(hooks.beforeMinute)hooks.beforeMinute(st.min,st,T,api);
    if(st.min===46){if(!st.htDone&&hooks.halftime)hooks.halftime(st,T,api);ball.fl=null;st.after=null;kickoffPos();restart('kick',1,52.5,34);ball.rs.t=1}
    [0,1].forEach(s=>{const ti=T[s].ti;const rate=(.55+(ti[3]-3)*.05+Math.max(0,ti[5]-3)*CFG.pressFat+Math.min(0,ti[5]-3)*.08+Math.max(0,ti[0]-3)*CFG.lineFat+(ti[6]?.06:0))*(st.min>70?1.25:1);
      T[s].xi.forEach(p=>{const pim=1+(T[s].pi(p,'pr')-1)*.12+(T[s].pi(p,'rn')-1)*.06+(T[s].pi(p,'dr')-1)*.04;st.fatigue[s][p.id]=Math.min(100,(st.fatigue[s][p.id]||0)+rate*pim*(1-(p.stamina-10)/25)*(POSF[p.g]||1))})});
    EF[0]={};EF[1]={};[0,1].forEach(s=>P[s].forEach(a=>a.vm=vmOf(a)));st.mom*=.9;if(st.fm){st.fm[0]*=.9;st.fm[1]*=.9}
    [0,1].forEach(s=>{autoSubs(s);try{aiGame(s)}catch(e){}});
    [0,1].forEach(s=>{if(r()<CFG.ncInj){const c=T[s].xi.filter(q=>q.g!=='GK'&&!st.hurt[q.id]);if(c.length){const p=pick(c,q=>1+(st.fatigue[s][q.id]||0)/40+(V(q,'inj',8)-8)*.08);injure(s,p,'nc')}}})}
  /* 자동 교체(AI 팀 + '결과 보기'로 넘긴 우리 팀): 교체 창 3번(56~66분·68~76분·78~86분), 팀당 평균 약 4명.
     지친 선수·평점 낮은 선수·경고 받은 선수 우선, 같은 자리 적합도×능력이 가장 좋은 벤치 선수 투입 */
  const SW=[0,1].map(()=>{const k1=r()<.55?2:1,k2=r()<.45?2:1,k3=r()<.6?1:(r()<.5?2:0);return [{m:56+Math.floor(r()*11),k:k1},{m:68+Math.floor(r()*9),k:k2},{m:78+Math.floor(r()*9),k:k3}]});
  /* v164 AI 경기 운영(점수 상황): 실측(StatsBomb 라리가 80경기) 65분 이후 지는 팀 슈팅 13.7/90·이기는 팀 11.3(+21%), 패스 451·410.
     지고 있으면 55~70분 사이 공격적으로 전환(감독 역량 q가 높을수록 확실), 60분 이후엔 수비형 1명 → 공격수 투입 + 공격형 대형(전방 1명 추가).
     1골 앞선 76~84분엔 공격수 1명 → 수비수/수비형 미드 투입 + 수비 대형(5백·4-1-4-1). 동점이 되면 멘탈리티 원래대로 */
  const AIF_ATK={'5-4-1':'4-4-2','5-3-2':'3-5-2','4-1-4-1':'4-4-2','4-2-3-1':'4-4-2','4-3-3':'3-4-3','4-4-2':'3-4-3','3-5-2':'3-4-3'},AIF_DEF={'4-3-3':'4-1-4-1','4-2-3-1':'4-1-4-1','4-4-2':'5-4-1','3-4-3':'5-4-1','3-5-2':'5-3-2','4-1-4-1':'5-4-1'};
  function aiSwap(s,outG,inG){const t=T[s];if(st.subs[s].length>=5)return false;const xi=t.xi.map((p,i)=>({p,i})).filter(o=>o.p.g!=='GK'&&outG.includes(o.p.g)).map(o=>{const q=st.pr[o.p.id]||{};o.sc=(st.fatigue[s][o.p.id]||0)+Math.max(0,6.8-(q.r??6.5))*20+(st.cards[o.p.id]?15:0);return o}).sort((a,b)=>b.sc-a.sc)[0];
    const bn=(t.bench||[]).filter(q=>q&&q.g!=='GK'&&!st.pr[q.id]&&inG.includes(q.g)).sort((a,b)=>b.ovr-a.ovr)[0];if(!xi||!bn)return false;return api.sub(s,xi.p.id,bn)}
  function aiGame(s){const t=T[s];if(!CFG.aiGs||!t.aiGs||t.sentOff)return;const G=t.aiG||(t.aiG={}),q=t.aiGs.q??.6,d=st.sc[s]-st.sc[1-s],m=st.min,b=t.form.base;
    if(d<0&&!G.push){if(G.pm==null)G.pm=55+Math.floor(r()*15)-(d<=-2?8:0);if(m>=G.pm){G.push=1;if(r()<.55+.4*q){t.ment='공격적';ev({s,t:'aiTac',k:'push'})}}}
    if(d<0&&G.push&&!G.atk&&m>=60&&m<=82&&r()<.08+.08*q){G.atk=1;/* 대형을 공격형으로 바꾸면(4-3-3→3-4-3 등) 엔진에선 슈팅은 거의 안 늘고 역습 실점만 늘어 경기당 골 +0.24 → 지친 공격수 교체 + 템포·공격 폭 한 단계 */if(aiSwap(s,['ST','W','AM'],['ST','W','AM'])||true){const ti=[...t.ti];ti[3]=Math.min(5,ti[3]+1);ti[2]=Math.min(5,ti[2]+1);api.setTactic(s,{ti});ev({s,t:'aiTac',k:'atk',f:''})}}
    if(d>=0&&G.push&&t.ment==='공격적'&&!(d===0&&t.aiGs.fav)){t.ment=t.aiGs.ment0||'균형'}
    /* 점수 상황 강도 gsx(멘탈리티 위에 더함, gsP·gsH 3: 320경기 검증 65분 이후 지는 팀/이기는 팀 슈팅 비 0.72(끔)→1.00(2)→1.28(3.5), 실측 1.21): 지면 공세 +gsP, 65분 이후 앞서면 −gsH(내려앉아 지키기), 강팀이 75분 이후 비기고 있으면 +gsP/2 */
    t.gsx=d<0&&G.push?(CFG.gsP??0)*(.6+.4*q):d>0&&m>=65?-(CFG.gsH??0)*(.6+.4*q)*(d>=2?.6:1):d===0&&m>=75&&t.aiGs.fav?(CFG.gsP??0)*.5:0;
    if(d===1&&!G.hold){if(G.hm==null)G.hm=76+Math.floor(r()*8);if(m>=G.hm){G.hold=1;if(r()<.35+.45*q){const nf=AIF_DEF[b];if(nf&&aiSwap(s,['ST','W','AM'],nf[0]==='5'?['CB','FB']:['DM','CM'])){api.setTactic(s,{form:{base:nf,atk:nf,def:nf}});ev({s,t:'aiTac',k:'def',f:nf})}}}}}
  function autoSubs(s){if(T[s].autoSub===false)return;if(hooks.noAuto&&hooks.noAuto(s)){const wh=SW[s].find(x=>!x.hint&&!x.done&&x.m===st.min);if(wh){wh.hint=1;if(hooks.subHint)hooks.subHint(s)}return}const ws=SW[s].filter(x=>!x.done&&x.m<=st.min);if(!ws.length)return;ws.forEach(x=>x.done=1);const w={k:ws.reduce((a,x)=>a+x.k,0)};
    const d=st.sc[s]-st.sc[1-s];let k=w.k+((st.min>=66&&d<0)?1:0)+((st.min>=78&&d>=2)?1:0);
    const used=st.subs[s].length;k=Math.min(k,5-used);if(k<=0)return;
    const xi=T[s].xi,cand=xi.map((p,i)=>({p,i})).filter(({p})=>p.g!=='GK'&&!(st.pr[p.id]&&st.pr[p.id].in0>0)).map(o=>{const q=st.pr[o.p.id]||{};o.sc=(st.fatigue[s][o.p.id]||0)+Math.max(0,6.8-(q.r??6.5))*20+(st.cards[o.p.id]?12:0)+(st.hurt[o.p.id]?50:0);return o}).sort((a,b)=>b.sc-a.sc);
    for(const o of cand.slice(0,k)){const bench=(T[s].bench||[]).filter(q=>q&&q.g!=='GK'&&!st.pr[q.id]);if(!bench.length)break;const key=effKey(T[s],Math.min(o.i,10));
      const b=bench.map(q=>{const f=fitOf(q,key);return [q,(q.ovr||60)*f*(f>=.85?1:.8)]}).sort((x,y)=>y[1]-x[1])[0];if(b&&b[1]>0)api.sub(s,o.p.id,b[0])}}
  function step(){if(st.min>=total&&st.tk===0&&!st.pendingPen&&!st.pendingDec)return null;st.frames=[];const before=st.ev.length;
    if(st.pendingPen){takePen(st.pendingPen.s,null)}else if(st.pendingDec){resolveDec(null);if(st.tk===0)minuteStart()}
    else if(st.tk===0&&st.min===45&&!st.htDone){/* v124 하프타임을 별도 단계로: 이전엔 46분 첫 1분(후반 킥오프·순간이동 포함)을 다 돌린 뒤에야 하프타임 창이 떠서 전반 끝 무렵 화면이 끊기며 건너뛰는 것처럼 보였음 */st.htDone=1;if(hooks.halftime)hooks.halftime(st,T,api);return []}
    else if(st.tk===0)minuteStart();
    while(st.tk<TPM){tick();st.tk++;if(st.pendingPen||st.pendingDec)break}
    if(st.tk>=TPM){st.tk=0;if(hooks.afterMinute)hooks.afterMinute(st.min,st,T,api)}
    return st.ev.slice(before)}
  function finalize(){endPoss();
    const tot=Math.max(90,st.min);
    [0,1].forEach(s=>{const gf=st.sc[s],ga=st.sc[1-s],d=gf-ga;T[s].xi.concat(st.subs[s].map(x=>x.out)).forEach(p=>{const x=st.pr[p.id];if(!x||x.done)return;x.done=1;
      const mins=Math.max(0,(x.out0??tot)-(x.in0||0));x.mins=mins;const f=Math.min(1,mins/90);const g=p.g;const DEF=g==='GK'||g==='CB'||g==='FB',MID=g==='DM'||g==='CM';
      let adj=(d>0?RW.win:d<0?-RW.loss:0);
      if(DEF)adj+=ga===0?RW.cs:-RW.conD*ga;else if(g==='DM')adj+=ga===0?RW.cs*.4:-RW.conD*.5*ga;else adj+=RW.gfA*gf-(MID?RW.conD*.3*ga:0);
      x.r+=adj*f;x.nr=mins<10?1:0;x.r=Math.max(3,Math.min(10,+x.r.toFixed(1)))})});
    const tp=st.pos[0]+st.pos[1]||1;
    const iv={};[0,1].forEach(q=>T[q].xi.concat(st.subs[q].map(x=>x.out)).forEach(p=>{const x=st.pr[p.id];if(x)iv[p.id]=[x.in0||0,x.out0??tot]}));
    return {plog:st.plog||null,dbg:st.dbg||{},gkd:st.gkd||null,rotN:st.rotN||0,pp:st.pp||{},wp:st.wp||{},swp:st.swp?st.swp.c:{},iv,trS:st.trS||[0,0],trX:st.trX||[0,0],trG:st.trG||[0,0],sc:st.sc,ev:st.ev,stats:{shots:st.sh,sot:st.sot,xg:st.xg.map(v=>+v.toFixed(2)),poss:[Math.round(st.pos[0]/tp*100),100-Math.round(st.pos[0]/tp*100)],lane:st.lane,fouls:st.fouls,blk:st.blk,cross:st.cross,off:st.off,corner:st.corner,pass:st.pass},inj:st.inj,ref:st.ref,trSh:st.trSh,trXg:st.trXg,supA:st.supA,tu:st.tu,
      duels:Object.values(st.duels).filter(d=>d.w+d.l>=2).sort((a,b)=>(b.w+b.l)-(a.w+a.l)).slice(0,12),ratings:st.pr,fatigue:st.fatigue,subs:st.subs,T,shl:st.shl}}
  return {step,finalize,api,st,T,P,ball,derby:!!opt.derby,get done(){return st.min>=total&&st.tk===0&&!st.pendingPen&&!st.pendingDec},get min(){return st.min},total,v:4};
}
function simulate(H,A,opt={}){const m=createMatch(H,A,opt);while(!m.done)m.step();return m.finalize()}
root.E4={refCoords,slotRoles,P5CAL,createMatch,simulate,xgGeo,L,W,spRec};
})(typeof module!=='undefined'?module.exports:window);
