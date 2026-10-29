// ===== 엔진5 결과 모델 (실측 적합 계수) =====
// 패스 성공·슈팅 3단계(블록/골문/골)·운반 중 상실·돌파 기본값. 좌표: 공격 방향 x 0→105, y 0→68. 모든 함수는 리그 평균 선수 기준 확률을 주고,
// 선수 능력은 로짓 이동(attrShift)으로 더한다. 계수 출처: /home/claude/fm/e5/fit/*.json (StatsBomb 360 라리가·분데스 63,002 패스 / 라리가 15-16 + 360 3,444 슈팅 / 56,670 운반)
const OC=(()=>{
const sig=z=>1/(1+Math.exp(-z));
const PASS={"names": ["bias", "dist10", "dist10sq", "fwdR", "back", "pressP", "openR", "lane", "lofted", "lofted_dist", "cross", "zoneA", "gkFrom", "switch", "openTight", "pressTight", "lofted_open", "fwd_dist", "intoBox", "intoBoxLof", "b2b"], "w": [0.7361, -0.4924, 0.0214, -0.6294, 0.2179, 0.8982, 1.454, 0.3935, -1.4119, 0.6214, -0.9894, -0.2803, 0.2903, 0.2112, -0.4722, -0.1898, -0.8858, -0.1422, -0.836, 0.4575, -1.0813]};
const SHOT={names:["bias","logd","angle","cone1","cone2","nd15","nd3","header","oneone","firstT","gkFar"],
  block:[-0.122,-0.524,-1.172,1.327,1.973,0.199,0.52,-1.285,-1.5,-0.531,-0.282],
  ontarget:[1.22,-0.482,0.72,-0.29,-0.609,-0.044,0.03,-1.272,0.097,-0.294,0.585],
  goal:[0.503,-0.91,1.886,-0.141,0.376,-0.346,0.011,-0.627,0.249,0.019,0.68]};
const CARRY={w:[-1.491,-1.894,0.193,-0.275,0.221,-1.167]};
/** 패스 성공 확률. o={d:거리m, dx:전진거리m(+앞), pressP:패서 최근접 상대 m, openR:도착점 최근접 상대 m, lane:경로 최소 수직거리 m, lofted:0/1, cross:0/1, px:패서 x, gk:0/1, dy:가로 이동 m, shift:로짓 이동} */
function passOk(o){const d=Math.max(o.d,1),lof=o.lofted?1:0,pp=Math.min(o.pressP,10),op=Math.min(o.openR,10);
  const f=[1,d/10,(d/10)**2,o.dx/d,o.dx<-3?1:0,pp/5,op/5,Math.min(o.lane,6)/3,lof,lof*d/10,o.cross?1:0,o.px>70?1:0,o.gk?1:0,Math.abs(o.dy||0)>28?1:0,Math.max(0,2.5-op),Math.max(0,2-pp),lof*op/5,Math.max(0,o.dx)/10*(d/10),o.intoBox?1:0,(o.intoBox?1:0)*lof,o.b2b?1:0];
  let z=0;for(let i=0;i<f.length;i++)z+=PASS.w[i]*f[i];return sig(z+(o.shift||0))}
/** 슈팅: o={dist, ang(골문 각 rad), cone(길목 수비수 수), nd(최근접 수비 m), header, oneone, firstT, gkFar(GK가 골라인에서 5m+), shiftB/shiftT/shiftG} → {pBlock,pOn,pGoal,xg} */
function shot(o){const f=[1,Math.log(Math.max(o.dist,1)),o.ang,o.cone===1?1:0,o.cone>=2?1:0,o.nd<1.5?1:0,o.nd<3?1:0,o.header?1:0,o.oneone?1:0,o.firstT?1:0,o.gkFar?1:0];
  const dot=w=>{let z=0;for(let i=0;i<f.length;i++)z+=w[i]*f[i];return z};
  const pB=sig(dot(SHOT.block)+(o.shiftB||0)),pT=sig(dot(SHOT.ontarget)+(o.shiftT||0)),pG=sig(dot(SHOT.goal)+(o.shiftG||0));
  return {pBlock:pB,pOn:pT,pGoal:pG,xg:(1-pB)*pT*pG}}
/** 골문 각(rad): 공격 방향 기준 (x,y) */
function goalAngle(x,y){const gx=105-x,gy=34-y;return Math.abs(Math.atan2(gy+3.66,gx)-Math.atan2(gy-3.66,gx))}
/** 운반 중 소유 상실 확률(운반 1회당). o={pressD:최근접 상대 m, n3:3m 내 상대 수, px, len:운반 거리 m} */
function carryLoss(o){const f=[1,Math.min(o.pressD,8)/4,o.n3,o.px<35?1:0,o.px>70?1:0,Math.min(o.len,30)/10];let z=0;for(let i=0;i<f.length;i++)z+=CARRY.w[i]*f[i];return sig(z+(o.shift||0))}
/** 돌파(1대1 시도) 기본 성공률: 실측 59% (StatsBomb). 능력차는 shift로 */
function dribbleOk(o){return sig(0.37+(o.shift||0))}
/** 능력치(1~20, 평균 12)를 로짓 이동으로. k: 능력 1점당 로짓 */
function attrShift(v,k){return (v-12)*k}
return {passOk,shot,goalAngle,carryLoss,dribbleOk,attrShift,sig,PASS,SHOT};
})();
if(typeof module!=='undefined')module.exports={OC};

