// ================= 전술 화면 =================
const TI=['수비라인','수비 폭','공격 폭','템포','패스 길이','압박 강도','역습 전환'];
const TI_END=[['낮게','높게'],['좁게','넓게'],['좁게','넓게'],['느리게','빠르게'],['짧게','길게'],['약하게','강하게']];
const TAC={phase:'base',showZones:false,sel:null,bsel:null};
const slotKeys=(ph)=>E3.phaseSlots(S.tac,ph).map(q=>q.key);
const grpAt=i=>{const bk=E3.FORMS[S.tac.form.base][i],ek=E3.effKey(S.tac,i);return ((ek!==bk?E3.SLOT[ek]:null)||E3.SLOT[bk]||[pl(S.xi[i]).g])[0]};
const SLOTNM=k=>{const g=(E3.SLOT[k]||[''])[0];if(g==='W')return /M$/.test(k)?'측면 MF':'윙어';if(g==='FB')return /WB$/.test(k)?'윙백':'풀백';return {DM:'수비형 MF',CM:'중앙 MF',AM:'공격형 MF',ST:'스트라이커',CB:'센터백',GK:'골키퍼'}[g]||k};
/* v197 공격·수비 대형 점 = 그 국면에 실제로 서는 위치(공격: 공이 상대 진영 70m 지점, 수비: 우리 진영 35m 지점일 때 실측 위치표). 드래그한 점도 '실제로 설 위치'로 해석됨 */
/* v199 공격·수비 탭: 가로 경기장 + 선수들이 모인 구간 확대 + 공 위치 슬라이더 */
/* v202 구간별 위치: 공이 우리 진영(25m)·중앙(52m)·상대 진영(80m)에 있을 때 위치를 각각 지정, 사이는 이어서 움직임. 지정 안 한 구간은 실측 기본 */
const ZN=[['D',25,'우리 진영'],['M',52,'중앙'],['A',80,'상대 진영']];const HZREF={atk:80,def:25};function hzOn(){return TAC.phase==='atk'||TAC.phase==='def'}
function hzBx(ph){return (TAC.bx&&TAC.bx[ph]!=null)?TAC.bx[ph]:HZREF[ph]}
function posZMig(){const T=S&&S.tac;if(!T||!window.E4||!E4.refCoords)return;T.posZ=T.posZ||{};for(const [ph,ob] of [['atk',70],['def',35]]){const L=T.pos&&T.pos[ph];if(!L||!Object.keys(L).length||T.posZ[ph])continue;try{const R0=E4.refCoords(T,ph,ob);const Z={};for(const [k,b] of ZN){const R=E4.refCoords(T,ph,b);Z[k]={};for(const i in L)Z[k][i]=[Math.round(L[i][0]+R[i][0]-R0[i][0]),Math.round(L[i][1]+R[i][1]-R0[i][1])]}T.posZ[ph]=Z;delete T.pos[ph]}catch(e){}}}
function zHas(ph,k){const Z=S.tac.posZ&&S.tac.posZ[ph];return !!(Z&&Z[k]&&Object.keys(Z[k]).length)}
function hzCoordsAt(ph,bx){const R=E4.refCoords(S.tac,ph,bx);const Z=(S.tac.posZ&&S.tac.posZ[ph])||{};const RZ={};ZN.forEach(([k,b])=>{if(Z[k]&&Object.keys(Z[k]).length)RZ[k]=E4.refCoords(S.tac,ph,b)});
  return R.map((c,i)=>{if(i===0)return c;const pts=ZN.map(([k,b])=>{const v=Z[k]&&Z[k][i];return v&&RZ[k]?[b,v[0]-RZ[k][i][0],v[1]-RZ[k][i][1]]:[b,0,0]});let ox,oy;if(bx<=25){ox=pts[0][1];oy=pts[0][2]}else if(bx>=80){ox=pts[2][1];oy=pts[2][2]}else{const j=bx<52?0:1,t=(bx-pts[j][0])/(pts[j+1][0]-pts[j][0]);ox=pts[j][1]+(pts[j+1][1]-pts[j][1])*t;oy=pts[j][2]+(pts[j+1][2]-pts[j][2])*t}return [c[0]+ox,c[1]+oy]})}
function hzCoords(ph){return hzCoordsAt(ph,hzBx(ph))}
function zNear(bx){let b=ZN[0];ZN.forEach(z=>{if(Math.abs(z[1]-bx)<Math.abs(b[1]-bx))b=z});return b}
function zoneStore(ph,i,x,y){const bx=hzBx(ph),z=zNear(bx);const P1=hzCoordsAt(ph,bx)[i],P0=hzCoordsAt(ph,z[1])[i];const T=S.tac;T.posZ=T.posZ||{};T.posZ[ph]=T.posZ[ph]||{};T.posZ[ph][z[0]]=T.posZ[ph][z[0]]||{};
  T.posZ[ph][z[0]][i]=[Math.round(Math.min(96,Math.max(4,x-(P1[0]-P0[0])))*10)/10,Math.round(Math.min(97,Math.max(3,y-(P1[1]-P0[1])))*10)/10];TAC.bx=TAC.bx||{};TAC.bx[ph]=z[1];return z}
function zPosTxt(c){const d=(100-c[1])*1.05,w=(c[0]-50)*.68;return `우리 골문에서 ${Math.round(d)}m · 중앙에서 ${Math.abs(w)<.5?'0m':(w<0?'왼쪽 ':'오른쪽 ')+Math.round(Math.abs(w))+'m'}`}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-znudge],[data-zsel],[data-zreset]');if(!b)return;e.stopPropagation();e.preventDefault();const ph=TAC.phase;
  if(b.dataset.zsel){TAC.bx=TAC.bx||{};TAC.bx[ph]=+b.dataset.zsel;render();return}
  if(b.dataset.zreset){const k=b.dataset.zreset;if(S.tac.posZ&&S.tac.posZ[ph])delete S.tac.posZ[ph][k];save();render();toast('이 구간 위치를 기본으로 되돌렸습니다');return}
  if(b.dataset.znudge){const i=TAC.sel;if(i==null)return;const [dx,dy]=b.dataset.znudge.split(',').map(Number);const z=zNear(hzBx(ph));TAC.bx=TAC.bx||{};TAC.bx[ph]=z[1];const c=hzCoordsAt(ph,z[1])[i];zoneStore(ph,i,c[0]+dx/.68,c[1]-dy/1.05);save();render()}},true);
function hzLayout(ph){const C=hzCoords(ph),bx=hzBx(ph);const disp=C.map(c=>[Math.max(4,Math.min(96,c[0])),Math.max(3,Math.min(97,c[1])),false]);
  /* 화면 표시 전용 겹침 풀기(저장 위치는 그대로): 점 중심 거리 36px 미만이면 서로 밀어냄 */{const pw=Math.max(280,Math.min(560,(document.getElementById('app')||document.body).clientWidth-32)),phh=pw*88/68,MIN=36;for(let it=0;it<6;it++)for(let i=1;i<disp.length;i++)for(let j=i+1;j<disp.length;j++){const a=disp[i],b=disp[j];let dx=(b[0]-a[0])/100*pw,dy=(b[1]-a[1])/100*phh;const dd=Math.hypot(dx,dy);if(dd>=MIN)continue;if(dd<.01){dx=1;dy=0}const k=(MIN-dd)/2/(dd||1);a[0]-=dx*k/pw*100;b[0]+=dx*k/pw*100;a[1]-=dy*k/phh*100*.4;b[1]+=dy*k/phh*100*.4}}
  return {disp,bx,ballT:100-bx/1.05}}
function hzLines(){return `<rect x="0" y="0" width="105" height="68"/><line x1="52.5" y1="0" x2="52.5" y2="68"/><circle cx="52.5" cy="34" r="9.15"/><rect x="0" y="13.84" width="16.5" height="40.32"/><rect x="0" y="24.84" width="5.5" height="18.32"/><rect x="88.5" y="13.84" width="16.5" height="40.32"/><rect x="99.5" y="24.84" width="5.5" height="18.32"/><circle cx="11" cy="34" r=".4"/><circle cx="94" cy="34" r=".4"/>`}
function hzApply(){if(!hzOn())return;const ph=TAC.phase,Ly=hzLayout(ph);const pc=$('#pitch');if(!pc)return;
  pc.querySelectorAll('.slot').forEach(n=>{const d=Ly.disp[+n.dataset.slot];if(!d)return;n.style.left=d[0]+'%';n.style.top=d[1]+'%'});const b=$('#hzball');if(b)b.style.top=Ly.ballT+'%';pc.querySelectorAll('svg.chemlines line').forEach(l=>{const i=+l.dataset.ci,j=+l.dataset.cj,A=Ly.disp[i],B=Ly.disp[j];if(!A||!B)return;l.setAttribute('x1',A[0]);l.setAttribute('y1',A[1]);l.setAttribute('x2',B[0]);l.setAttribute('y2',B[1])});{const od=oppDots(ph);pc.querySelectorAll('.oslot').forEach(n=>{const d=od[+n.dataset.os];if(!d)return;n.style.left=Math.max(3,Math.min(97,d.x))+'%';n.style.top=Math.max(2,Math.min(98,d.y))+'%'})}const lb=$('#hzbxl');if(lb)lb.textContent=Math.round(Ly.bx)+'m';const sb=pc.querySelector('.sbub');if(sb&&TAC.sel!=null){const d=Ly.disp[TAC.sel];sb.style.left=Math.min(80,Math.max(20,d[0]))+'%';sb.style.top=d[1]+'%'}}
document.addEventListener('input',e=>{const t=e.target;if(!t||!t.dataset||t.dataset.hzbx==null)return;TAC.bx=TAC.bx||{};TAC.bx[TAC.phase]=+t.value;hzApply()});
/* v209 예상 상대 대형을 우리 경기장 위에 연하게: 기본 탭 = 상대 기본 배치도, 공격·수비 탭 = 슬라이더 공 위치에서 상대의 실제 위치(우리가 공격이면 상대는 수비, 공 위치는 상대 기준 105−m) */
function oppAccum(){/* v216 경기 중 상대 대형: 매분 프레임(재시작 제외)을 국면별로 누적 — 최근 10분 평균 */try{if(typeof M==='undefined'||!M||!M.m||!M.m.st)return;const fr=M.m.st.frames;if(!fr||!fr.length)return;const o=1-M.me;const ids=new Set(M.m.T[o].xi.map(p=>String(p.id)));const mn={a:{},d:{},z:{}};
  /* v237 공 위치별 누적(사용자 요청): 공이 우리 골문에서 얼마나 떨어졌는지(경기장 길이 %)로 D(<38.5)·M·A(≥66) 구간 → 전술판 공 위치 구간과 같은 상황의 상대 실측 위치 */
  const gkU=(M.m.T[M.me].xi.find(p=>p.g==='GK')||{}).id;
  for(const f of fr){if(f.rs||f.ps==null)continue;const ph=f.ps===o?'a':'d';let zk=null;try{const g=f.p[String(gkU)];if(g&&f.b){const og=g[0]<52.5?0:105;const pc=Math.abs(f.b[0]-og)/1.05;zk=ph+(pc<38.5?'D':pc<66?'M':'A')}}catch(e){}
    for(const id in f.p){if(!ids.has(id))continue;let [x,y]=f.p[id];if(f.h2){x=105-x;y=68-y}const q=mn[ph][id]||(mn[ph][id]=[0,0,0]);q[0]+=x;q[1]+=y;q[2]++;if(zk){const Z=mn.z[zk]||(mn.z[zk]={});const w=Z[id]||(Z[id]=[0,0,0]);w[0]+=x;w[1]+=y;w[2]++}}}
  const A=M.oppAcc||(M.oppAcc=[]);A.push(mn);while(A.length>10)A.shift()}catch(e){}}
function oppLiveDots(ph){/* v216: 일시정지 순간 위치 대신 최근 10분 평균(오픈플레이). base=전체, atk 탭=우리 공격 중 상대(수비), def 탭=우리 수비 중 상대(공격) */try{if(typeof M==='undefined'||!M||!M.edit||!M.m||!M.m.P)return null;const me=M.me,PU=M.m.P[me],PO=M.m.P[1-me],O=M.m.T[1-me];if(!PU||!PO||!PU[0])return null;const gk=PU.find(a=>a.gk)||PU[0];const dir=gk.x<52.5?1:-1,og=dir===1?0:105;const ks=O.k?O.k('base'):[];
  const A=M.oppAcc||[];const want=ph==='atk'?['d']:ph==='def'?['a']:['a','d'];
  if(!A.length)return null;const avg=(a,W,mn0)=>{let sx=0,sy=0,n=0;for(const mn of A)for(const w of W){const q=mn[w][String(a.p.id)];if(q){sx+=q[0];sy+=q[1];n+=q[2]}}return n>=mn0?[sx/n,sy/n]:null};
  const zk=ph==='base'?null:(ph==='atk'?'d':'a')+zNear(hzBx(ph))[0];const avgZ=(a,mn0)=>{if(!zk)return null;let sx=0,sy=0,n=0;for(const mn of A){const Z=mn.z&&mn.z[zk];const q=Z&&Z[String(a.p.id)];if(q){sx+=q[0];sy+=q[1];n+=q[2]}}return n>=mn0?[sx/n,sy/n]:null};
  /* v237: 공 위치 구간이 맞는 프레임이 충분하면(선수당 8프레임+) 그 평균, 아니면 국면 전체 평균 */const zOK=zk&&PO.every(a=>avgZ(a,8));TAC.oppZ=zOK?zk:null;
  const pts=PO.map(a=>(zOK&&avgZ(a,8))||avg(a,want,20)||avg(a,['a','d'],10)||[a.x,a.y]);
  return PO.map((a,i)=>{const [x,y]=pts[i];return {x:100-(dir===1?(68-y):y)/68*100,y:100-Math.abs(x-og)/1.05,k:(ks[i]&&ks[i].slotKey)||(a.p&&a.p.g)||'',n:a.p&&a.p.name}})}catch(e){return null}}
function oppDots(ph){const O=oppTeam();if(!O||TAC.showOpp===false)return [];try{{const lv=oppLiveDots(ph);if(lv)return lv}if(ph==='base'){return oppCoords('base').map(q=>({x:q.x,y:q.y,k:q.key,n:q.p&&q.p.name}))}
  if(!window.E4||!E4.refCoords)return [];const oph=ph==='atk'?'def':'atk';const R=E4.refCoords(O,oph,105-hzBx(ph));const keys=E3.phaseSlots(Object.assign({},O,{pos:{}}),oph).map(q=>q.key);return R.map((c,i)=>({x:100-c[0],y:100-c[1],k:keys[i],n:O.xi[i]&&O.xi[i].name}))}catch(e){return []}}
function oppDotsHTML(ph){return oppDots(ph).map((d,i)=>`<div class="oslot${TAC.showOpp==='lbl'?' on':''}" data-os="${i}" style="left:${Math.max(3,Math.min(97,d.x))}%;top:${Math.max(2,Math.min(98,d.y))}%"><i></i><span>${esc(d.k||'')}</span></div>`).join('')}
function coordsOf(ph){const L=E3.phaseSlots(S.tac,ph).map(q=>[q.x,q.y]);if(ph==='base'||!window.E4||!E4.refCoords)return L;try{posZMig();return hzCoordsAt(ph,HZREF[ph])}catch(e){return L}}
function nextFxAll(){return (typeof prNextMine==='function'?prNextMine():null)||myNext()}
function nextFxLabel(f){if(!f)return '';try{if(f.eu)return (EUC[f.eu]&&EUC[f.eu].n)||f.eu;if(f.cup!=null&&typeof cupLabel==='function')return cupLabel(f);if(f.po)return '승격 플레이오프';return '리그'}catch(e){return ''}}
function oppNext(){if(typeof M!=='undefined'&&M&&M.edit)return M.me===0?M.fx.a:M.fx.h;const f=nextFxAll();if(!f)return null;return f.h===S.club?f.a:f.h}
function oppTeam(){if(typeof M!=='undefined'&&M&&M.edit)return M.m.T[1-M.me];const o=oppNext();if(o==null)return null;return teamFor(o)}
function oppCoords(ph){const O=oppTeam();if(!O)return [];const oph=ph==='atk'?'def':ph==='def'?'atk':'base';const f=O.form[oph];const m=oph==='base'?null:E3.mapSlots(O.form.base,f);
  return O.xi.map((p,i)=>{const c=E3.COORD[f][m?m[i]:i];return {p,x:100-c[0],y:100-c[1],key:E3.FORMS[f][m?m[i]:i]}})}
function superiority(ph,ours){const oc=oppCoords(ph);const g=(pts)=>{const z=Array.from({length:3},()=>Array(5).fill(0));pts.forEach(q=>{if(q.key==='GK')return;const [r,l]=E3.cell(q.x,q.y);z[r][l]+=1;[[r-1,l],[r+1,l],[r,l-1],[r,l+1]].forEach(([a,b])=>{if(a>=0&&a<3&&b>=0&&b<5)z[a][b]+=.45})});return z};
  const A=g(ours.map((c,i)=>({x:c[0],y:c[1],key:slotKeys(ph)[i]}))),B=g(oc);return A.map((row,r)=>row.map((v,l)=>v-B[r][l]))}
function tendOf(p){if(p.tend!==null&&p.tend!==undefined)return {v:p.tend,src:'data'};const d=((p.offball||0)+(p.drib||0))/2-((p.tackle||0)+(p.posit||0))/2;return {v:d>=3?1:d<=-3?-1:0,src:'est'}}
function rangeFor(i,p){const key=slotKeys('base')[i];const [g,side]=E3.SLOT[key];const L=side==='R'?{w:4,h:3,c:2}:{w:0,h:1,c:2};
  const B={GK:{A:[[2,2]],E:[[2,1],[2,3]]},CB:{A:[[2,1],[2,2],[2,3],[1,2]],E:[[1,1],[1,3],[2,0],[2,4]]},FB:{A:[[2,L.w],[1,L.w],[2,L.h]],E:[[0,L.w],[1,L.h]]},
    DM:{A:[[1,1],[1,2],[1,3],[2,2]],E:[[2,1],[2,3],[1,0],[1,4],[0,2]]},CM:{A:[[1,1],[1,2],[1,3],[0,2]],E:[[0,1],[0,3],[2,2],[1,0],[1,4]]},AM:{A:[[0,1],[0,2],[0,3],[1,2]],E:[[1,1],[1,3],[0,0],[0,4]]},
    W:{A:[[0,L.w],[1,L.w],[0,L.h]],E:[[1,L.h],[0,L.c]]},ST:{A:[[0,1],[0,2],[0,3],[1,2]],E:[[1,1],[1,3],[0,0],[0,4]]}}[g];
  const m=new Map();B.A.forEach(([r,l])=>m.set(r+','+l,2));B.E.forEach(([r,l])=>{if(!m.has(r+','+l))m.set(r+','+l,1)});if(g==='GK')return m;
  const role=(E3.ROLES[grpAt(i)]||E3.ROLES.CM)[S.tac.roles[i]||0];const tr=role?role[2]:{};let fwd=tendOf(p).v,inward=0;
  if(tr.fwd>=.9||tr.wide)fwd+=1;if(tr.drop)fwd-=1;if(tr.inside)inward+=1;
  if(side&&p.foot&&((side==='R'&&p.foot==='left')||(side==='L'&&p.foot==='right'))&&g==='W')inward+=1;
  const add=(dr,dl,lvl)=>{[...m.entries()].filter(([k,v])=>v===2).forEach(([k])=>{const [r,l]=k.split(',').map(Number);const r2=r+dr,l2=l+dl;if(r2<0||r2>2||l2<0||l2>4)return;const kk=r2+','+l2;m.set(kk,Math.max(m.get(kk)||0,lvl))})};
  if(fwd>0)add(-1,0,fwd>=2?2:1);if(fwd<0)add(1,0,fwd<=-2?2:1);if(inward>0&&side)add(0,side==='R'?-1:1,inward>=2?2:1);return m}
function duel(m,t){const ms=(m.pace*1.2+m.tackle+m.posit)/3.2,ts=(t.pace*1.2+t.drib+t.offball)/3.2,d=ms-ts;return d>=1.5?['up','유리 ▲']:d<=-1.5?['dn','불리 ▼']:['eq','비슷 ●']}
function defSlots(){return slotKeys('base').map((k,i)=>[k,i]).filter(([k])=>LINE[E3.SLOT[k][0]]==='DF'||E3.SLOT[k][0]==='DM').map(([k,i])=>i)}
function expectedFor(i){const oc=oppCoords('def').filter(q=>q.key!=='GK');if(!oc.length)return null;const my=coordsOf('def')[i];let best=null,bd=1e9;oc.forEach(q=>{const d=(q.x-my[0])**2+(q.y-my[1])**2*.6;if(d<bd){bd=d;best=q}});return best}
function fitTag(f){return f>=.95?['g','최적']:f>=.85?['y','가능']:f>=.7?['r','어색']:['r','부적합']}
const stars5=n=>`<span class="stars">${'★'.repeat(n)}<span class="off">${'★'.repeat(5-n)}</span></span>`;
const roleStars=(p,role)=>{const v=E3.roleFit(p,role);return v>=17?5:v>=15?4:v>=13?3:v>=11?2:1};
function strengths(p){const keys=p.g==='GK'?['gk_save','gk_air','gk_sweep','gk_dist']:OUTA;return keys.map(k=>[k,p[k]]).sort((a,b)=>b[1]-a[1]).slice(0,2).map(x=>AN[x[0]])}
function effSlot(p,key){return (p.injD>0||p.ban>0)?-1:p.ovr*E3.fitOf(p,key)*E3.COND_M[p.cond??2]*(.72+.28*(p.fit??100)/100)}
function recTactics(){const O=oppTeam();const xi=S.xi.map(pl).slice(1);const os=O?O.preset:'균형';
  const sm=E3.styleMap(S.xi.map(pl));
  return Object.keys(E3.PRESETS).map(k=>{const fitv=sm[k]||0;const counter=(E3.BEATS[k]||[]).includes(os)?1:(E3.BEATS[os]||[]).includes(k)?-1:0;
    const fam=S.tac.preset===k?S.tac.fam:Math.min(S.tac.fam,35);const score=fitv*2+counter*.8+fam*.01;const why=[fitv>0?`선발 구성과 잘 맞음(${E3.NEEDS[k].map(n=>AN[n]).join('·')}가 상대적 강점) · 보너스 ${Math.round(fitv*100)}%`:fitv<0?`선발 구성과 안 맞음(${E3.NEEDS[k].map(n=>AN[n]).join('·')}가 상대적 약점) · 불이익 ${Math.round(-fitv*100)}%`:(k==='균형'?'보너스·불이익 없는 기본 전술':'선발 구성 적합도 보통(보너스·불이익 없음)')];
    if(counter>0)why.push(`상대 ${O?CLUBS[O.club].short:''}의 ${os}에 상성 우위`);if(counter<0)why.push(`상대의 ${os}에 상성 불리`);if(S.tac.preset===k)why.push(`숙련도 ${Math.round(S.tac.fam)}`);return {k,score,why}}).sort((a,b)=>b.score-a.score)}
function recLineup(){const sq=squadOf(S.club).filter(canUse),keys=E3.FORMS[S.tac.form.base],used=new Set(),xi=[];const ds=new Set(defSlots());
  const bonus=(p,i)=>{if(!ds.has(i))return 0;const q=expectedFor(i);if(!q)return 0;const [c]=duel(p,q.p);return c==='up'?2:c==='dn'?-2:0};
  const order=keys.map((k,i)=>i).sort((a,b)=>(keys[a]==='GK'?-1:0)-(keys[b]==='GK'?-1:0));
  order.forEach(i=>{let b=null,bv=-1e9;sq.forEach(p=>{if(used.has(p.id)||p.injD>0||p.ban>0)return;const v=effSlot(p,keys[i])+bonus(p,i);if(v>bv){bv=v;b=p}});xi[i]=b.id;used.add(b.id)});return xi}
/* v201 층위 분리: 1단계 포메이션(자리·역할·선수) / 세트피스, 2단계 '공격·수비 위치 세부 조정'(포메이션 화면에서 들어감) */
function tacSeg(ph){if(ph==='atk'||ph==='def')return `<div class="subhd"><button class="chip" data-phase="base">‹ 포메이션으로</button><b>공격·수비 위치 세부 조정</b></div><div class="seg" style="grid-template-columns:1fr 1fr">${[['atk','공격 시 (공 가졌을 때)'],['def','수비 시 (공 잃었을 때)']].map(([k,l])=>`<button data-phase="${k}" aria-pressed="${ph===k}">${l}</button>`).join('')}</div>`;
  return `<div class="seg" style="grid-template-columns:1fr 1fr">${[['base','포메이션'],['sp','세트피스']].map(([k,l])=>`<button data-phase="${k}" aria-pressed="${ph===k}">${l}</button>`).join('')}</div>`}
function tacFineHTML(){posZMig();const T=S.tac,n=ph=>{const Z=(T.posZ&&T.posZ[ph])||{};return ZN.filter(([k])=>Z[k]&&Object.keys(Z[k]).length).map(([k,b,l])=>l).join('·')};const fa=T.form.atk!==T.form.base,fd=T.form.def!==T.form.base;const sub=[fa?`공격 시 대형 ${T.form.atk}`:'',fd?`수비 시 대형 ${T.form.def}`:'',n('atk')?`공격 시 ${n('atk')} 위치 지정`:'',n('def')?`수비 시 ${n('def')} 위치 지정`:''].filter(Boolean);
  return `<button class="finebtn" data-phase="atk"><span><b>공격·수비 위치 세부 조정</b><small>${sub.length?esc(sub.join(' · ')):'조정 없음 · 실제 데이터 기준 기본 위치로 뜁니다'}</small></span><span class="go">›</span></button>`}
function tacView(){
  if(TAC.phase==='sp'){ensureXI();const on=oppNext(),O=oppTeam();return `${on!=null?`<div class="banner closed" style="margin-top:12px"><span>다음 상대 <b style="color:var(--text)">${esc(CLUBS[on].name)}</b>${typeof lgRankTxt==='function'&&lgRankTxt(on,1)?` <span class="note" style="display:inline">(${lgRankTxt(on,1)}${lgRankTxt(S.club,1)?` · 우리 ${lgRankTxt(S.club,1)}`:''})</span>`:''} <span class="note" style="display:inline">${esc(nextFxLabel(typeof M!=='undefined'&&M&&M.edit?M.fx:nextFxAll()))}</span> · ${O.preset} · ${O.form.base}</span><span class="num">숙련도 ${Math.round(S.tac.fam)}</span></div>`:''}${tacSeg('sp')}${spView()}`}
  ensureXI();const T=S.tac,ph=TAC.phase,xi=S.xi,keys=slotKeys(ph),coords=coordsOf(ph),O=oppTeam(),on=oppNext();const HZL=hzOn()&&window.E4&&E4.refCoords?hzLayout(ph):null;const disp=HZL?HZL.disp:coords;
  const pv=E3.PRESETS[T.preset],devs=T.ti.map((v,i)=>Math.abs(v-pv[i])).filter(d=>d>1).length;
  const sup=O?superiority(ph,coords):null;const bench=squadOf(S.club).filter(p=>!xi.includes(p.id)&&canUse(p)).sort((a,b)=>b.ovr-a.ovr);const shp=E3.shapeOf(T,ph);
  const note={base:'점은 자리·역할 배치도입니다(실제 경기 위치는 아래 「공격·수비 위치 세부 조정」). 한 번 누르면 정보·교체 버튼, 길게 눌러 끌면 선수끼리 교체하거나 다른 자리로 옮깁니다.',atk:'점 = 공 위치별 실제 서는 자리. 길게 눌러 끌거나, 선수를 누르고 화살표로 1m씩 옮깁니다.',def:'점 = 공 위치별 실제 서는 자리. 길게 눌러 끌거나, 선수를 누르고 화살표로 1m씩 옮깁니다.'}[ph];
  return `${on!=null?`<div class="banner closed" style="margin-top:12px"><span>다음 상대 <b style="color:var(--text)">${esc(CLUBS[on].name)}</b>${typeof lgRankTxt==='function'&&lgRankTxt(on,1)?` <span class="note" style="display:inline">(${lgRankTxt(on,1)}${lgRankTxt(S.club,1)?` · 우리 ${lgRankTxt(S.club,1)}`:''})</span>`:''} <span class="note" style="display:inline">${esc(nextFxLabel(typeof M!=='undefined'&&M&&M.edit?M.fx:nextFxAll()))}</span> · ${O.preset} · ${O.form.base}</span><span class="num">숙련도 ${Math.round(T.fam)}</span></div>`:''}
  ${tacSeg(ph)}
  ${(()=>{const fo=tacFold(ph);return `<button class="chip" data-tfold="1" style="margin-top:8px;width:100%;justify-content:space-between;display:flex"><span>대형 <b>${T.form[ph]}</b> · 저장·상대 대형·자동 선발</span><span>${fo?'펼치기 ▼':'접기 ▲'}</span></button>`})()}<div ${tacFold(ph)?'hidden':''}>
  ${typeof M!=='undefined'&&M&&M.edit&&TAC.showOpp!==false&&O?`<div class="note" style="margin:6px 0 0;color:#ffb4b4">경기 중: 상대 점은 최근 10분(재시작 제외) ${ph==='base'?'평균 위치':ph==='atk'?'우리가 공을 가졌을 때 상대 평균 위치':'상대가 공을 가졌을 때 평균 위치'}입니다. 버튼을 한 번 더 누르면 포지션 글자를 표시합니다.</div>`:''}${ph!=='base'?`<div class="lbl" style="margin-top:10px">${ph==='atk'?'공격 시':'수비 시'} 대형 (기본 ${T.form.base}과 다르게 둘 수 있음)</div>`:''}<div class="chips">${Object.keys(E3.FORMS).map(k=>`<button class="chip" data-shape="${k}" aria-pressed="${T.form[ph]===k}">${k}</button>`).join('')}</div>
  <div class="tools"><button class="chip" data-tsets>전술 저장·불러오기</button>${O?`<button class="chip" data-showopp aria-pressed="${TAC.showOpp!==false}">${typeof M!=='undefined'&&M&&M.edit?'상대 대형 (최근 10분 · 공 위치별 실측)':'상대 대형 (예상)'}${TAC.showOpp==='lbl'?' · 글자':''}</button>`:''}${HZL?'':`<button class="chip" data-zones aria-pressed="${TAC.showZones}">15칸 수적 우위</button>`}${(ph==='base'?T.pos[ph]:(T.posZ&&T.posZ[ph]&&Object.keys(T.posZ[ph]).length))?'<button class="chip" data-resetpos>위치 초기화</button>':''}<button class="chip" data-act="auto">자동 선발</button><button class="chip" data-pickm title="자동 선발 기준">기준: ${({pos:'포지션',ovr:'능력치'})[S.pickMode]||'균형'}</button></div>
  ${shp!==T.form[ph]?`<div class="okline" style="margin-top:8px">배치 기준 대형 <b>${shp}</b> (${T.form[ph]}에서 위치를 옮김)</div>`:''}<div class="phase-note">${note}</div></div>
  ${HZL?`<div class="hzctl"><span class="note" style="margin:0">공 위치 · 우리 골문에서 <b id="hzbxl">${Math.round(HZL.bx)}m</b></span><input type="range" min="5" max="98" step="1" value="${Math.round(HZL.bx)}" data-hzbx aria-label="공 위치"></div><div class="zchips">${ZN.map(([k,b,l])=>`<button class="chip" data-zsel="${b}" aria-pressed="${Math.round(HZL.bx)===b}">${l} ${b}m${zHas(ph,k)?' <span class="zdot">●</span>':''}</button>`).join('')}</div><div class="note" style="margin:4px 0 0">● 직접 지정한 구간 · 구간 사이는 자연스럽게 이어집니다${ZN.some(([k,b])=>b===Math.round(HZL.bx)&&zHas(ph,k))?` <button class="chip" style="padding:2px 8px;font-size:11px" data-zreset="${zNear(HZL.bx)[0]}">이 구간 초기화</button>`:''}</div>`:''}
  <div class="pitch" id="pitch"><svg class="lines" viewBox="0 0 68 90" preserveAspectRatio="none" fill="none" stroke="rgba(255,255,255,.28)" stroke-width=".4"><rect x="2" y="2" width="64" height="86"/><line x1="2" y1="45" x2="66" y2="45"/><circle cx="34" cy="45" r="7"/><rect x="16" y="72" width="36" height="16"/><rect x="26" y="82" width="16" height="6"/><rect x="16" y="2" width="36" height="16"/><rect x="26" y="2" width="16" height="6"/></svg>${HZL?`<div class="hzball" id="hzball" style="top:${HZL.ballT}%"></div>`:''}${HZL&&TAC.sel!=null&&TAC.sel>0&&xi[TAC.sel]!=null?(()=>{const low=HZL.disp.slice(1).filter(c=>c[1]>50).length;const top=low>=5;const z=zNear(HZL.bx);return `<div class="znud" style="${top?'top:8px':'bottom:8px'}"><div class="zt"><b>${esc(shortName(pl(xi[TAC.sel]).name))}</b> · ${zPosTxt(hzCoordsAt(ph,z[1])[TAC.sel])}</div><div class="zb"><span></span><button data-znudge="0,1" aria-label="앞으로 1m">▲</button><span></span><button data-znudge="-1,0" aria-label="왼쪽 1m">◀</button><button data-znudge="0,-1" aria-label="뒤로 1m">▼</button><button data-znudge="1,0" aria-label="오른쪽 1m">▶</button></div><small>1m씩 · ${z[2]} 구간에 저장</small></div>`})():''}
    ${oppDotsHTML(ph)}<div class="zones" id="zones" ${TAC.showZones&&sup&&!HZL?'':'hidden'}>${sup?zonesHTML(sup,null):''}</div>
    ${xi.map((id,i)=>{const p=pl(id),k=keys[i],f=E3.fitOf(p,k),c=cnd(p);const [r,l]=E3.cell(...coords[i]);const lvl=ph==='base'?rangeFor(i,p).get(r+','+l):2;const custom=!!(T.pos[ph]&&T.pos[ph][i]);const ext=custom&&lvl===1;const mk=T.marks[i]&&T.marks[i].on;
      return `<button class="slot${TAC.sel===i?' sel':''}" data-slot="${i}" style="left:${disp[i][0]}%;top:${disp[i][1]}%" aria-label="${k} ${esc(p.name)}"><span class="dot" style="border-color:${ext?'var(--ok)':f>=.95?'var(--good)':f>=.85?'var(--ok)':'var(--bad)'}">${p.ovr}<span class="cd" style="color:${c.c}">${c.a}</span>${mk?'<span class="mbadge">M</span>':''}${piSum(p).length?'<span class="mbadge pib">'+piSum(p).length+'</span>':''}</span><span class="lb">${esc(shortName(p.name))}</span><span class="sl">${k+' · '+(p.fit??100)+'%'}${ext?'<span style="color:var(--ok)"> · 범위 밖</span>':''}</span></button>`}).join('')}
  ${TAC.sel!=null&&xi[TAC.sel]!=null?(()=>{const c=disp[TAC.sel];const up=c[1]>70;return `<div class="sbub" style="left:${Math.min(80,Math.max(20,c[0]))}%;top:${c[1]}%;transform:translate(-50%,${up?'calc(-100% - 34px)':'40px'})"><button data-pinfo="${xi[TAC.sel]}">ⓘ 선수 정보</button><button data-slotopen="${TAC.sel}">교체·역할</button></div>`})():''}
  </div>
  ${ph==='base'?tacFineHTML():''}<div class="legend"><span><i style="background:var(--good)"></i>최적</span><span><i style="background:var(--ok)"></i>가능·활동 범위 밖(적합도 −5%)</span><span><i style="background:var(--bad)"></i>어색</span><span>↑↗→↘↓ 컨디션</span><span>% 체력</span><span><i style="background:#5EC2E8"></i>M 맨마킹</span></div>
  <h2>교체 명단 · 눌러서 정보, 길게 눌러 경기장으로 끌기</h2>
  <div class="bench">${bench.map(p=>`<div class="bch" data-bench="${p.id}"><span class="bpos">${posTags(p)}</span><small>${esc(shortName(p.name))}</small><span class="ovr">${p.ovr}</span><span class="cond" style="color:${cnd(p).c};font-size:13px">${cnd(p).a}</span>${p.injD?(typeof injTag==='function'?injTag(p):'<span class="inj">부상</span>'):''}${p.ban>0?`<span class="inj">정지 ${p.ban}</span>`:''}${TAC.bsel===p.id?`<button class="ib" data-pinfo="${p.id}">ⓘ 정보</button>`:''}</div>`).join('')}</div>
  ${O?`<section class="card pad"><h2 style="margin-top:0">추천 · ${esc(CLUBS[on].name)}전</h2>${recHTML()}</section>
  <section class="card pad"><h2 style="margin-top:0">예상 수비 매치업 · 상대 공격 대형 기준</h2>${defSlots().map(i=>{const me=pl(xi[i]),mk=T.marks[i];const q=mk&&mk.on&&mk.t?{p:pl(mk.t)}:expectedFor(i);if(!q)return'';const [c,t]=duel(me,q.p);
    return `<button class="mu" data-mslot="${i}"><span class="k">${keys[i]}</span><span><b>${esc(shortName(me.name))} ↔ ${esc(shortName(q.p.name))}</b>${mk&&mk.on?' <span class="mbadge" style="position:static;display:inline-grid">M</span>':''}<div class="meta">속도 ${me.pace} vs ${q.p.pace} · 태클 ${me.tackle} vs 드리블 ${q.p.drib}</div></span><span class="vd ${c}">${t}</span></button>`}).join('')}
  <p class="note">줄을 누르면 맨마킹을 설정할 수 있습니다.</p></section>`:''}
  <section class="card pad"><h2 style="margin-top:0">세트피스 키커</h2>${[['cornerL','왼쪽 코너',p=>(p.cross*.5+(p.fk??10)*.5)*(p.foot==='right'?1.06:1)],['cornerR','오른쪽 코너',p=>(p.cross*.5+(p.fk??10)*.5)*(p.foot==='left'?1.06:1)],['fk','프리킥',p=>p.fk??10],['pen','페널티킥',p=>(p.pen??10)*.7+(p.comp??12)*.3]].map(([k,l,f])=>{const cur=T.setp&&T.setp[k]&&xi.includes(T.setp[k])?pl(T.setp[k]):null;const auto=xi.map(pl).filter(p=>p.g!=='GK').sort((a,b)=>f(b)-f(a))[0];
    return `<button class="mu" data-kick="${k}"><span class="k">${l}</span><span><b>${esc((cur||auto).name)}</b><div class="meta">${cur?'직접 지정':'자동 선택'} · ${k.startsWith('corner')?`크로스 ${(cur||auto).cross} · ${({right:'오른발',left:'왼발',both:'양발'})[(cur||auto).foot]||''}${((k==='cornerL'&&(cur||auto).foot==='right')||(k==='cornerR'&&(cur||auto).foot==='left'))?' · 인스윙':''}`:k==='fk'?`프리킥 ${(cur||auto).fk??'-'}`:`페널티 ${rnd0((cur||auto).pen)} · 침착성 ${rnd0((cur||auto).comp)}`}</div></span><span class="vd eq">변경</span></button>`}).join('')}</section>
  <section class="card pad"><h2 style="margin-top:0">전술 성향 · 숙련도 ${Math.round(T.fam)}</h2>
    ${(()=>{const sm=E3.styleMap(xi.map(pl));const up=Object.keys(sm).filter(k=>sm[k]>0),dn=Object.keys(sm).filter(k=>sm[k]<0);
      return `<div class="chips" style="margin-top:0">${Object.keys(E3.PRESETS).map(k=>`<button class="chip" data-preset="${k}" aria-pressed="${T.preset===k}">${k}${sm[k]>0?' <b style="color:var(--good)">▲</b>':sm[k]<0?' <b style="color:var(--bad)">▼</b>':''}</button>`).join('')}</div>
      <p class="note" style="margin:4px 0 0">선수 구성 적합도 · ▲ 잘 맞음: ${up.join(', ')||'없음'} · ▼ 안 맞음: ${dn.join(', ')||'없음'}${sm[T.preset]?` · 현재 전술 ${sm[T.preset]>0?'보너스':'불이익'} ${Math.round(Math.abs(sm[T.preset])*100)}%`:''}</p>`})()}
    ${TI.map((t,i)=>i<6?`<div class="ti"><span>${t}</span><div><div class="steps">${[1,2,3,4,5].map(v=>`<button data-ti="${i}" data-v="${v}" class="${pv[i]===v?'def':''}" aria-pressed="${T.ti[i]===v}" aria-label="${t} ${v}단계"></button>`).join('')}</div><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--faint);margin-top:3px"><span>${TI_END[i][0]}</span><span>${TI_END[i][1]}</span></div></div></div>`
      :`<div class="ti"><span>${t}</span><div class="seg" style="grid-template-columns:1fr 1fr;margin:0"><button data-ti="6" data-v="0" aria-pressed="${T.ti[6]===0}">끄기</button><button data-ti="6" data-v="1" aria-pressed="${T.ti[6]===1}">켜기</button></div></div>`).join('')}
    <div class="ti"><span>공격 집중 방향</span><div class="seg" style="grid-template-columns:repeat(5,1fr);margin:0">${[[null,'자동'],[0,'왼쪽'],[2,'중앙'],[4,'오른쪽'],['W','양측면']].map(([v,l])=>`<button data-tfocus="${v}" aria-pressed="${(T.focus??null)===v}">${l}</button>`).join('')}</div></div>
    <div class="ti"><span>상대 공략 지시</span><div class="seg" style="grid-template-columns:repeat(5,1fr);margin:0">${AF_OPTS.map(([v,l])=>`<button data-taf="${v}" aria-pressed="${(T.af||'')===v}">${l}</button>`).join('')}</div></div>
    <p class="note" style="margin:2px 0 8px">${esc((AF_OPTS.find(x=>x[0]===(T.af||''))||AF_OPTS[0])[2])}</p>
    <div class="ti"><span>기본 성향</span><div class="seg" style="grid-template-columns:repeat(3,1fr);margin:0">${['수비적','균형','공격적'].map(m=>`<button data-ment="${m}" aria-pressed="${T.ment===m}">${m}</button>`).join('')}</div></div>
    ${devs?`<div class="warnline">${devs}개 항목이 ${T.preset} 기본값에서 2단계 이상 벗어나 성향 보너스가 줄어듭니다.</div>`:`<div class="okline">${T.preset} 성향 보너스 적용 중. 점 표시가 기본값입니다. 성향을 바꾸면 숙련도가 떨어지고, 경기를 치를수록 오릅니다.</div>`}
  </section>`;
}
function zonesHTML(sup,range){let h='';for(let r=0;r<3;r++)for(let l=0;l<5;l++){const v=sup?sup[r][l]:0;const lv=range?range.get(r+','+l):undefined;const cls=range?(lv===2?'a':lv===1?'e':'x'):'';h+=`<div class="${cls}">${sup?`<b class="${v>0.4?'p':v<-0.4?'m':'z'}">${v>0?'+':''}${Math.round(v*2)/2}</b>`:''}</div>`}return h}
function recHTML(){const rt=recTactics().slice(0,2),cur=S.xi,rx=recLineup();const ch=rx.map((id,i)=>[i,cur[i],id]).filter(([i,a,b])=>a!==b);const keys=slotKeys('base');
  const why=(i,b)=>{const p=pl(b),o=pl(cur[i]);const r=[];if((p.cond??2)<(o.cond??2))r.push('컨디션');if((p.fit??100)>(o.fit??100)+5)r.push('체력');if(E3.fitOf(p,keys[i])>E3.fitOf(o,keys[i]))r.push('포지션 적합');if(defSlots().includes(i))r.push('매치업');return r.slice(0,2).join('·')||'종합'};
  return `${rt.map((t,j)=>`<div class="rec ${j===0?'best':''}"><div class="rh"><b>${j===0?'추천 전술 · ':''}${t.k}</b>${S.tac.preset===t.k?'<span class="vd eq">적용 중</span>':`<button class="chip" data-preset="${t.k}">적용</button>`}</div><ul>${t.why.map(w=>`<li>${w}</li>`).join('')}</ul></div>`).join('')}
  <div class="rec"><div class="rh"><b>추천 라인업</b>${ch.length?`<button class="chip" data-applyxi>적용</button>`:'<span class="vd eq">현재와 같음</span>'}</div>${ch.length?ch.map(([i,a,b])=>`<div class="chg"><span>${keys[i]} ${esc(shortName(pl(a).name))} → <b>${esc(shortName(pl(b).name))}</b></span><span class="meta" style="margin:0">${why(i,b)}</span></div>`).join(''):'<p class="note">컨디션·체력·포지션·매치업을 따져도 지금 선발이 가장 좋습니다.</p>'}</div>`}
// ---- 슬롯 시트: 선수 선택 / 역할·임무 / 맨마킹 / 비교 ----
let SH={slot:0,tab:'p',sort:'fit',open:null,cmp:[]};
function openSlot(i,tab='p'){SH={slot:i,tab,sort:'fit',open:null,cmp:[]};drawSlot()}
function drawSlot(){const keys=slotKeys('base'),key=keys[SH.slot],cur=pl(S.xi[SH.slot]);
  const list=squadOf(S.club).filter(p=>p.id!==cur.id&&canUse(p));const kf={fit:p=>effSlot(p,key),ovr:p=>p.ovr,fitness:p=>p.fit??100,cond:p=>-(p.cond??2)}[SH.sort];list.sort((a,b)=>kf(b)-kf(a));
  const isDef=defSlots().includes(SH.slot);
  const body=SH.tab==='p'?`<div class="sorts">${[['fit','적합도순'],['ovr','능력치순'],['fitness','체력순'],['cond','컨디션순']].map(([k,l])=>`<button class="chip" data-sort="${k}" aria-pressed="${SH.sort===k}">${l}</button>`).join('')}</div>
    <div class="pinned"><div class="tag">현재 선발</div>${rowSlot(cur,key,true)}</div><div>${list.map(p=>rowSlot(p,key,false,S.xi.indexOf(p.id))).join('')}</div>`
    :SH.tab==='r'?roleHTML(key,cur):SH.tab==='i'?piHTML(cur):markHTML(cur);
  const names=SH.cmp.map(id=>shortName(pl(id).name));
  sheet(`<div class="sh-head" style="padding:0"><button class="x" data-close>닫기</button><div class="note" style="margin:0">${key}</div><h3 style="display:flex;align-items:center;gap:8px">${esc(cur.name)}<button class="chip" data-pinfo="${cur.id}" style="font-size:12px">ⓘ 정보</button></h3>
    <div class="tabs" style="margin-top:8px"><button data-stab="p" aria-selected="${SH.tab==='p'}">선수 선택</button><button data-stab="r" aria-selected="${SH.tab==='r'}">역할·임무</button><button data-stab="i" aria-selected="${SH.tab==='i'}">지시${piSum(cur).length?' ●':''}</button>${isDef?`<button data-stab="m" aria-selected="${SH.tab==='m'}">맨마킹</button>`:''}</div></div>
    <div id="shbody" style="padding-top:10px">${body}</div>
    ${SH.tab==='p'?`<div class="tray" style="margin:10px -16px -20px;padding-bottom:calc(12px + env(safe-area-inset-bottom,0px))"><span class="who">${SH.cmp.length?`비교: ${esc(shortName(cur.name))} vs ${names.map(esc).join(', ')}`:'체크해서 최대 2명까지 현재 선수와 비교'}</span><button class="btn sm" data-compare ${SH.cmp.length?'':'disabled'}>비교하기</button></div>`:''}`)}
function rowSlot(p,key,pinned,inXI=-1){const f=E3.fitOf(p,key),[fc,fl]=fitTag(f),c=cnd(p),open=SH.open===p.id&&!pinned,cur=pl(S.xi[SH.slot]);
  return `<div class="row"><div class="rmain">${pinned?'<span></span>':`<button class="chk" data-chk="${p.id}" role="checkbox" aria-checked="${SH.cmp.includes(p.id)}" aria-label="비교에 추가">${SH.cmp.includes(p.id)?'✓':''}</button>`}
    <button class="nm" data-open="${p.id}" style="text-align:left;min-width:0"><b>${esc(p.name)}</b><span class="meta">${posTags(p)}<span class="pill ${fc}">${fl}</span><span>${ageOf(p)}세</span>${strengths(p).map(t=>`<span class="st">${t}</span>`).join('')}${p.injD?(typeof injTag==='function'?injTag(p):'<span class="inj">부상</span>'):''}${p.ban>0?`<span class="inj">정지 ${p.ban}</span>`:''}${inXI>=0?`<span>${slotKeys('base')[inXI]} 선발</span>`:''}</span></button>
    <span class="right"><span class="fb"><div class="bar"><i style="left:0;width:${p.fit??100}%;background:${(p.fit??100)>=85?'var(--good)':(p.fit??100)>=70?'var(--ok)':'var(--bad)'}"></i></div><small>${p.fit??100}%</small></span><span class="cond" style="color:${c.c}">${c.a}</span><span class="ovr num ${ovrCls(p.ovr)}">${p.ovr}</span></span></div>${open?diffHTML(p,cur,key):''}</div>`}
function diffHTML(p,cur,key){const keys=E3.SLOT[key][0]==='GK'?['gk_save','gk_air','gk_sweep','gk_dist','pass']:OUTA;
  return `<div class="diff"><div class="meta" style="margin-bottom:6px">현재 선발 ${esc(shortName(cur.name))}와 비교</div><div class="dgrid">${keys.map(k=>{const d=p[k]-cur[k];return `<div><small>${AN[k]}</small><b>${p[k]}</b> <span class="${d>0?'up':d<0?'dn':'eq'}" style="font-size:12px">${d>0?'+'+d:d<0?d:'='}</span></div>`}).join('')}</div>
    <div class="act"><button class="btn" data-pick="${p.id}" data-i="${SH.slot}" ${p.injD||p.ban?'disabled':''}>${p.injD?'부상으로 출전 불가':p.ban?'출장정지로 출전 불가':'선발로 넣기'}</button><button class="btn ghost" data-chk="${p.id}">${SH.cmp.includes(p.id)?'비교에서 빼기':'비교에 추가'}</button></div></div>`}
const PI_HINT={sh:p=>`슈팅 ${p.shoot}`,dr:p=>`드리블 ${p.drib} · 속도 ${p.pace}`,cr:p=>`크로스 ${p.cross}`,rn:p=>`침투 ${p.offball} · 속도 ${p.pace}`,ov:p=>`판단(패스·침투·침착) ${Math.round((p.pass+p.offball+(p.comp??12))/3)}`,wd:p=>`드리블 ${p.drib} · 크로스 ${p.cross}`,pr:p=>`체력 ${p.stamina} · 태클 ${p.tackle}`,tk:p=>`태클 ${p.tackle} · 위치선정 ${p.posit}`};
const PI_DESC={sh:'자주: 중거리·박스 안에서 먼저 쏨(슈팅 질 −5%). 자제: 동료에게 넘김(+4%)',dr:'자주: 볼을 더 많이 잡고 돌파 시도(체력 소모 +4%)',cr:'자주: 이른 크로스·크로스 마무리 비중 ↑. 자제: 컷백·연계 위주',rn:'자주: 뒷공간 침투 ↑(오프사이드 +2%p, 체력 +6%)',ov:'상황 판단: 측면 소유 동료가 안쪽이면 바깥(오버), 터치라인 쪽이면 안쪽(언더)으로 앞지름. 지시하면 그쪽을 3배 자주 고르되, 자리가 막히면 판단력 높은 선수는 바꿈. 같은 쪽 윙어 "넓게"와 오버래핑은 겹침',wd:'넓게: 터치라인 쪽 4m에 서서 측면에서 볼을 더 받음. 안쪽: 하프스페이스·중앙으로 30% 좁힘(같은 쪽 풀백의 오버래핑 공간이 열림)',pr:'강하게: 팀 압박 강도에 20% 더 기여(체력 소모 +12%)',tk:'강하게: 1대1 수비 +0.6, 파울 확률 1.45배. 신중: 파울 0.6배, 수비 −0.6'};
function piGet(id){return (S.tac.pi||{})[id]||{}}
/* v195 골키퍼 개인 지시(0/1/2 · 1=자동) */
const GK_PIK=['gkk','gkh','gkd','gks'];Object.assign(E3.PI,{gkk:['골킥 짧게','자동','골킥 길게'],gkh:['빠른 배급','자동','천천히 배급'],gkd:['짧게 굴리기','자동','길게 차기'],gks:['스위핑 자제','보통','스위핑 적극']});
Object.assign(PI_HINT,{gkk:p=>`킥 ${p.gk_dist??'-'}`,gkh:p=>`킥 ${p.gk_dist??'-'}`,gkd:p=>`킥 ${p.gk_dist??'-'}`,gks:p=>`스위핑 ${p.gk_sweep??'-'}`});
Object.assign(PI_DESC,{gkk:'짧게: 센터백이 박스 옆으로 벌려 받는 빌드업 대형(92%). 길게: 최전방 경합으로 바로 차 넣음(94%). 자동: 팀 전술(패스 길이·스타일)에 따름',
 gkh:'공을 잡은 뒤(선방·캐치·루즈볼 회수) 배급까지 걸리는 시간. 빠르게: 0.4배(상대가 정렬하기 전에 역습 시작). 천천히: 1.8배(리드 중 시간 관리·대형 정비)',
 gkd:'인플레이 배급 거리(골킥 제외). 짧게 굴리기: 20m 이내 수비수·미드필더에게 연결. 길게 차기: 40m 이상 전방으로. 상대 압박이 바로 앞이면 짧은 배급도 위험',
 gks:'적극: 뒷공간·박스 앞 루즈볼과 높은 공을 더 멀리 나와 처리(범위 1.3배), 1대1 선방 +1.2 · 중거리 선방 −1.2. 자제: 골문을 지킴(범위 0.75배), 1대1 −1 · 중거리 +0.6'});
const PI_LB={sh:'슈팅',dr:'드리블',cr:'크로스',rn:'전진 침투',ov:'앞지르는 길',wd:'활동 폭',pr:'압박',tk:'태클',gkk:'골킥',gkh:'잡은 뒤 배급',gkd:'배급 거리',gks:'스위퍼 성향'};
function piSum(p){const o=piGet(p.id);return E3.PIK.concat(GK_PIK).filter(k=>o[k]!=null&&o[k]!==1).map(k=>E3.PI[k][o[k]])}
function piHTML(cur){const o=piGet(cur.id);const gk=cur.g==='GK';const keys=gk?GK_PIK:E3.PIK.filter(k=>k!=='ov'||['FB','CM','DM'].includes(grpAt(SH.slot)));
  return `<div class="meta" style="margin-bottom:6px">개인 지시 · ${esc(shortName(cur.name))}</div>
  ${keys.map(k=>`<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:13.5px">${PI_LB[k]}</b><span class="note">${PI_HINT[k](cur)}</span></div>
    <div class="duty" style="margin:4px 0 2px">${[0,1,2].map(v=>`<button data-pi="${k}" data-v="${v}" aria-pressed="${(o[k]??1)===v}">${E3.PI[k][v]}</button>`).join('')}</div><div class="note" style="font-size:11.5px">${PI_DESC[k]}</div></div>`).join('')}
  <div class="act"><button class="btn sm ghost" data-pireset="${cur.id}">모두 보통으로</button></div>
  <p class="note">지시는 선수에게 붙어 교체·포지션 이동 후에도 유지됩니다. 능력치를 올리는 것이 아니라 시도 빈도와 그 대가를 바꿉니다.</p>`}
function roleHTML(key,cur){const rs=E3.ROLES[grpAt(SH.slot)]||E3.ROLES.CM,ri=S.tac.roles[SH.slot]||0,du=S.tac.duties[SH.slot]??1;const t=tendOf(cur);const bk=E3.FORMS[S.tac.form.base][SH.slot],ek=E3.effKey(S.tac,SH.slot),alts=E3.slotAlt(bk).concat(E3.slotAlt(bk).includes(ek)?[]:[ek]);
  return `${alts.length>1?`<div class="meta" style="margin-bottom:6px">이 자리에서의 위치</div><div class="duty" style="grid-template-columns:repeat(${alts.length},1fr)">${alts.map(k=>{const [fc,fl]=fitTag(E3.fitOf(cur,k));return `<button data-slotas="${k}" aria-pressed="${ek===k}">${SLOTNM(k)}<br><span class="pill ${fc}" style="font-size:10px">${fl}</span></button>`}).join('')}</div>`:''}<div class="meta" style="margin-bottom:6px">임무</div><div class="duty">${E3.DUTY.map((d,i)=>`<button data-duty="${i}" aria-pressed="${du===i}">${d}</button>`).join('')}</div>
  ${rs.map((r,i)=>`<button class="role" data-role="${i}" aria-pressed="${ri===i}"><div class="rh"><b>${r[0]}</b>${cur.pst&&E3.ROLES[cur.g]&&E3.ROLES[cur.g][cur.pst[0]]&&E3.ROLES[cur.g][cur.pst[0]][0]===r[0]?' <span class="ptag m" style="font-size:10px">원래 스타일</span>':''}${stars5(roleStars(cur,r))}</div><div class="keys">${Object.keys(r[1]).slice(0,3).map(k=>`<span class="st">${AN[k]} <span class="num" style="font-size:14px">${cur[k]}</span></span>`).join('')}</div></button>`).join('')}
  <div class="rec"><b>이동 성향</b><p class="meta" style="margin:4px 0 0">${t.v>0?'전진형 · 앞쪽 범위 확장':t.v<0?'후방형 · 뒤쪽 범위 확장':'균형형'} (${t.src==='data'?`근거: 2024-25 공격 3분의 1 볼터치 비중 ${cur.attSh}%`:'근거: 세부 기록이 없어 능력치로 추정'}). 역할과 주발에 따라 범위가 더 넓어집니다.</p></div>`}
function markHTML(cur){const mk=S.tac.marks[SH.slot],ex=expectedFor(SH.slot),O=oppTeam();const opp=O?O.xi.filter(p=>['W','ST','AM','CM'].includes(p.g)).sort((a,b)=>b.ovr-a.ovr):[];
  const cmp=t=>`<div class="dgrid" style="grid-template-columns:repeat(4,1fr);margin-top:6px">${[['pace','pace','속도'],['tackle','drib','태클/드리블'],['posit','offball','위치/침투'],['aerial','aerial','공중볼']].map(([a,b,l])=>{const d=cur[a]-t[b];return `<div><small>${l}</small><b>${cur[a]}</b><span style="color:var(--muted)"> : </span><b>${t[b]}</b> <span class="${d>0?'up':d<0?'dn':'eq'}" style="font-size:12px">${d>0?'▲':d<0?'▼':'='}</span></div>`}).join('')}</div>`;
  if(!O)return '<p class="note">다음 상대가 정해지면 예상 매치업이 표시됩니다.</p>';
  return `<div class="seg" style="grid-template-columns:1fr 1fr;margin:0 0 10px"><button data-mk="off" aria-pressed="${!mk.on}">지역 방어</button><button data-mk="on" aria-pressed="${mk.on}">맨마킹</button></div>
  ${mk.on?`<div class="duty" style="grid-template-columns:1fr 1fr"><button data-mkt="0" aria-pressed="${!mk.tight}">일반 마크</button><button data-mkt="1" aria-pressed="${mk.tight}">밀착 마크</button></div>`:''}
  ${ex?`<div class="rec best"><div class="rh"><b>예상 매치업 · ${esc(ex.p.name)}</b><span class="vd ${duel(cur,ex.p)[0]}">${duel(cur,ex.p)[1]}</span></div><p class="meta" style="margin:4px 0 0">상대 공격 대형에서 이 구역에 서는 선수입니다.</p>${cmp(ex.p)}${mk.on?(mk.t===ex.p.id?'<p class="okline">이 선수를 마크 중입니다.</p>':`<div class="act"><button class="btn" data-mtar="${ex.p.id}">이 선수 마크</button></div>`):''}</div>`:''}
  ${mk.on?`<div class="meta" style="margin:14px 0 4px">다른 상대 선택 · 위협도 순</div>${opp.map(q=>{const [c,v]=duel(cur,q);return `<button class="mu" data-mtar="${q.id}"><span class="k">${q.g}</span><span><b>${esc(q.name)}</b><div class="meta">능력치 ${q.ovr} · 속도 ${q.pace} · 드리블 ${q.drib}</div></span><span class="vd ${mk.t===q.id?'up':c}">${mk.t===q.id?'마크 중':v}</span></button>`}).join('')}
  <p class="meta" style="margin-top:10px">효과: 대상의 맞대결 성공률 −9% (밀착 −16%). 대가: 원래 구역이 비고 체력 소모 증가, 밀착 시 경고 위험.</p>`:'<p class="meta" style="margin-top:10px">지역 방어는 자기 구역에 들어오는 선수를 막습니다. 상대 에이스를 따라다니게 하려면 맨마킹을 고르세요.</p>'}`}
function drawCompare(){const key=slotKeys('base')[SH.slot],cur=pl(S.xi[SH.slot]),ps=[cur,...SH.cmp.map(pl)],cols=['var(--c1)','var(--c2)','var(--c3)'];const keys=E3.SLOT[key][0]==='GK'?GKA:OUTA;const role=(E3.ROLES[grpAt(SH.slot)]||E3.ROLES.CM)[S.tac.roles[SH.slot]||0];
  const N=keys.length,R=110,cx=170,cy=140;const pt=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/N,r=R*v/20;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]};
  const grid=[5,10,15,20].map(v=>`<polygon points="${keys.map((k,i)=>pt(i,v).join(',')).join(' ')}" fill="none" stroke="var(--line)"/>`).join('');
  const axes=keys.map((k,i)=>{const [x,y]=pt(i,20),[lx,ly]=pt(i,24.5);return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/><text x="${lx}" y="${ly+4}" text-anchor="middle" fill="var(--muted)" font-size="11">${AN[k]}</text>`}).join('');
  const polys=ps.map((p,j)=>`<polygon points="${keys.map((k,i)=>pt(i,p[k]).join(',')).join(' ')}" fill="${cols[j]}" fill-opacity=".14" stroke="${cols[j]}" stroke-width="2"/>`).join('');
  const rows=keys.map(k=>{const mx=Math.max(...ps.map(p=>p[k]));return `<tr><td>${AN[k]}</td>${ps.map(p=>`<td class="${p[k]===mx&&ps.filter(q=>q[k]===mx).length<ps.length?'best':''}">${p[k]}</td>`).join('')}</tr>`}).join('');
  sheet(`<button class="x" data-back>뒤로</button><div class="note" style="margin:0">${key} 후보 비교</div><h3>선수 비교</h3>
   <div class="cmp-head" style="grid-template-columns:repeat(${ps.length},1fr)">${ps.map((p,j)=>{const [fc,fl]=fitTag(E3.fitOf(p,key)),c=cnd(p);return `<div class="pc" style="border-top-color:${cols[j]}"><b>${esc(shortName(p.name))}</b><span class="big">${p.ovr}</span> <small>${ageOf(p)}세</small><div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:4px"><span class="pill ${fc}">${fl}</span><span class="st" style="color:${c.c}">${c.a} ${c.n}</span></div><small style="display:block;margin-top:4px">체력 ${p.fit??100}%${j===0?' · 현재 선발':''}</small></div>`}).join('')}</div>
   <svg class="radar" viewBox="0 0 340 290" role="img" aria-label="능력치 레이더 차트">${grid}${axes}${polys}</svg>
   <table class="ctab"><tbody><tr><td>${esc(role[0])} 적합도</td>${ps.map(p=>`<td>${stars5(roleStars(p,role))}</td>`).join('')}</tr>${rows}
   <tr><td>최근 평점</td>${ps.map(p=>{const rr=(S.ps[p.id]||{}).recentR||[];return `<td>${rr.length?(rr.reduce((a,b)=>a+b,0)/rr.length).toFixed(2):'-'}</td>`}).join('')}</tr></tbody></table>
   <div class="act" style="margin-top:14px">${ps.slice(1).map(p=>`<button class="btn" data-pick="${p.id}" data-i="${SH.slot}" ${p.injD||p.ban?'disabled':''}>${esc(shortName(p.name))} 선발</button>`).join('')}</div>`)}
// ---- 드래그 ----
let DG=null,suppressClick=false;
function pitchXY(cx,cy){const r=$('#pitch').getBoundingClientRect();const fx=(cx-r.left)/r.width,fy=(cy-r.top)/r.height;return [fx*100,fy*100]}
document.addEventListener('pointerdown',e=>{const el=e.target.closest('.slot,.bch');if(!el||e.button>0||UI.tab!=='tac')return;
  const from=el.classList.contains('slot')?{type:'slot',i:+el.dataset.slot}:{type:'bench',id:+el.dataset.bench};
  DG={from,el,x0:e.clientX,y0:e.clientY,active:false,timer:setTimeout(()=>startDrag(e.clientX,e.clientY),280)}});
function startDrag(x,y){if(!DG)return;DG.active=true;suppressClick=true;const p=DG.from.type==='slot'?pl(S.xi[DG.from.i]):pl(DG.from.id);DG.p=p;DG.el.classList.add('lift');
  const g=document.createElement('div');g.className='dragghost';g.textContent=p.ovr;g.style.left=x+'px';g.style.top=y+'px';document.body.appendChild(g);DG.g=g;
  if(navigator.vibrate)try{navigator.vibrate(15)}catch(_){}
  if(DG.from.type==='slot'&&TAC.phase==='base'){const z=$('#zones');DG.range=rangeFor(DG.from.i,p);const O=oppTeam();z.innerHTML=zonesHTML(O?superiority('base',coordsOf('base')):null,DG.range);z.hidden=false}}
document.addEventListener('pointermove',e=>{if(!DG)return;if(!DG.active){if(Math.hypot(e.clientX-DG.x0,e.clientY-DG.y0)>10){clearTimeout(DG.timer);DG=null}return}
  e.preventDefault();DG.g.style.left=e.clientX+'px';DG.g.style.top=e.clientY+'px';document.querySelectorAll('.slot.hov').forEach(n=>n.classList.remove('hov'));
  const t=document.elementFromPoint(e.clientX,e.clientY);const sl=t&&t.closest('.slot');if(sl&&!(DG.from.type==='slot'&&+sl.dataset.slot===DG.from.i))sl.classList.add('hov')},{passive:false});
function endDrag(e,cancel){if(!DG)return;clearTimeout(DG.timer);if(!DG.active){DG=null;return}const d=DG;DG=null;d.g.remove();d.el.classList.remove('lift');setTimeout(()=>{suppressClick=false},60);
  if(cancel){render();return}
  const t=document.elementFromPoint(e.clientX,e.clientY);const sl=t&&t.closest('.slot');const xi=S.xi,T=S.tac;
  if(sl){const j=+sl.dataset.slot;
    if(d.from.type==='slot'&&j!==d.from.i){[xi[d.from.i],xi[j]]=[xi[j],xi[d.from.i]];[T.roles[d.from.i],T.roles[j]]=[T.roles[j],T.roles[d.from.i]];save();render();toast(`${shortName(pl(xi[j]).name)} ↔ ${shortName(pl(xi[d.from.i]).name)} 위치 교체`);return}
    if(d.from.type==='bench'){if(d.p.injD){render();toast('부상 선수는 투입할 수 없습니다');return}if(d.p.ban>0){render();toast('출장정지 선수는 투입할 수 없습니다');return}const out=xi[j];xi[j]=d.p.id;T.roles[j]=E3.defaultRoles([d.p],T.form.base)[0];save();render();toast(`${shortName(d.p.name)} 투입 · ${shortName(pl(out).name)} 벤치로`);return}}
  if(d.from.type==='slot'){const [x,y]=pitchXY(e.clientX,e.clientY);
    if(x>=0&&x<=100&&y>=0&&y<=100){let nx=x,ny=y;
      if(TAC.phase==='base'){let [cr,cl]=E3.cell(x,y),lv=d.range.get(cr+','+cl);
        if(!lv){let best=null,bd=1e9;d.range.forEach((v,k)=>{const [rr,ll]=k.split(',').map(Number);const px=Math.min(Math.max(x,ll*20+3),ll*20+17),py=Math.min(Math.max(y,rr*33.34+3),rr*33.34+30);const dd=(px-x)**2+(py-y)**2;if(dd<bd){bd=dd;best=[px,py]}});[nx,ny]=best;toast('이동 범위 밖이라 가장 가까운 허용 위치로 옮겼습니다')}
        else if(lv===1)toast('평소 활동 범위 밖 위치 · 적합도 −5%')}
      if(hzOn()){const z=zoneStore(TAC.phase,d.from.i,nx,ny);save();render();toast(`${z[2]}(공 ${z[1]}m) 구간 위치로 저장`);return}nx=Math.min(95,Math.max(5,nx));ny=Math.min(95,Math.max(4,ny));T.pos[TAC.phase]=T.pos[TAC.phase]||{};T.pos[TAC.phase][d.from.i]=[Math.round(nx),Math.round(ny)];
      if(TAC.phase==='base'){const i=d.from.i,bk=E3.FORMS[T.form.base][i],g0=grpAt(i),nk=E3.keyFromPos(nx,ny,bk);T.slotAs=T.slotAs||{};if(nk===bk)delete T.slotAs[i];else T.slotAs[i]=nk;if(grpAt(i)!==g0){const rs=E3.ROLES[grpAt(i)]||E3.ROLES.CM,p=pl(S.xi[i]);let bi=0,bv=-1;rs.forEach((r,j2)=>{const v=E3.roleFit(p,r);if(v>bv){bv=v;bi=j2}});T.roles[i]=bi}if(nk!==E3.effKey({form:T.form,slotAs:{}},i))toast(`${shortName(pl(S.xi[i]).name)} → ${SLOTNM(nk)}(${nk}) · 대형 ${E3.shapeOf(T)}`)}
      save()}}
  render()}
document.addEventListener('pointerup',e=>endDrag(e,false));document.addEventListener('pointercancel',e=>endDrag(e,true));
document.addEventListener('contextmenu',e=>{if(e.target.closest('.slot,.bch'))e.preventDefault()});

function kickSheet(kind){const f={cornerL:p=>(p.cross*.5+(p.fk??10)*.5)*(p.foot==='right'?1.06:1),cornerR:p=>(p.cross*.5+(p.fk??10)*.5)*(p.foot==='left'?1.06:1),fk:p=>p.fk??10,pen:p=>(p.pen??10)*.7+(p.comp??12)*.3}[kind];const L={cornerL:'왼쪽 코너킥',cornerR:'오른쪽 코너킥',fk:'프리킥',pen:'페널티킥'}[kind];
  const list=S.xi.map(pl).filter(p=>p.g!=='GK').sort((a,b)=>f(b)-f(a));
  sheet(`<button class="x" data-close>닫기</button><h3>${L} 키커</h3><button class="li" data-kickset="${kind}" data-v=""><span class="nm"><b>자동 선택</b><span>경기마다 가장 적합한 선수</span></span></button>
   ${list.map(p=>`<button class="li" data-kickset="${kind}" data-v="${p.id}">${avatar(p,'sm')}<span class="pos ${p.g}">${p.g}</span><span class="nm"><b>${esc(p.name)}</b><span>${kind.startsWith('corner')?`크로스 ${p.cross} · ${({right:'오른발',left:'왼발',both:'양발'})[p.foot]||''}${((kind==='cornerL'&&p.foot==='right')||(kind==='cornerR'&&p.foot==='left'))?' · 인스윙':''}`:kind==='fk'?`프리킥 ${p.fk??'-'} · ${({right:'오른발',left:'왼발',both:'양발'})[p.foot]||''}`:`페널티 ${rnd0(p.pen)} · 침착성 ${rnd0(p.comp)}`}</span></span><span class="ovr num">${Math.round(f(p))}</span></button>`).join('')}`)}

document.addEventListener('click',e=>{if(UI.tab!=='tac'||suppressClick)return;if(e.target.closest('[data-pinfo]'))return;const b=e.target.closest('.bch');
  if(b){const id=+b.dataset.bench;TAC.bsel=TAC.bsel===id?null:id;TAC.sel=null;render();return}
  if(!e.target.closest('.slot,.sbub,.znud,.hzctl,.zchips')&&(TAC.sel!=null||TAC.bsel!=null)&&!e.target.closest('#scrim')){TAC.sel=null;TAC.bsel=null;render()}});

// ---- 전술 세트(저장·불러오기) ----
const TSN=['A','B','C'];
function tacSnap(){const T=S.tac;return {af:T.af||null,form:{...T.form},preset:T.preset,ti:[...T.ti],focus:T.focus??null,ment:T.ment,slotAs:{...(T.slotAs||{})},pos:JSON.parse(JSON.stringify(T.pos||{})),posZ:JSON.parse(JSON.stringify(T.posZ||{})),duties:[...(T.duties||[])],roles:[...(T.roles||[])],d:S.date}}
function tsetDesc(x){return x?`${x.form.base}${x.form.def!==x.form.base?`/수비 ${x.form.def}`:''} · ${x.preset}${x.focus!=null?' · 집중 '+({0:'왼쪽',2:'중앙',4:'오른쪽',W:'양측면'}[x.focus]||''):''}${Object.keys(x.slotAs||{}).length?' · 위치 변형 '+Object.keys(x.slotAs).length:''}`:'비어 있음'}
function tsetSheet(){S.tsets=S.tsets||[null,null,null];
  sheet(`<button class="x" data-close>닫기</button><h3>전술 저장·불러오기</h3><p class="note">대형(기본·공격·수비), 성향·세부 지시, 공격 집중, 자리별 위치 변형, 선수 위치를 묶어 저장합니다. 경기 중 '전술 변경'에서도 바로 바꿀 수 있습니다.</p>
  ${S.tsets.map((x,i)=>`<div class="rec"><div class="rh"><b>전술 ${TSN[i]}</b><span class="note">${x?fmtD(x.d):''}</span></div><p class="meta" style="margin:4px 0 8px">${esc(tsetDesc(x))}</p><div class="act" style="margin-top:0"><button class="btn sm ghost" data-tsave="${i}">현재 전술 저장</button><button class="btn sm" data-tload="${i}" ${x?'':'disabled'}>불러오기</button></div></div>`).join('')}`)}
function tsetApply(x){const T=S.tac;const nb=x.form.base!==T.form.base;
  T.form={...x.form};T.preset=x.preset;T.ti=[...x.ti];T.focus=x.focus;T.af=x.af||null;T.ment=x.ment;T.slotAs={...x.slotAs};T.pos=JSON.parse(JSON.stringify(x.pos||{}));T.posZ=JSON.parse(JSON.stringify(x.posZ||{}));
  if(nb){const ps=S.xi.map(pl);if(ps.length===11&&ps.every(Boolean))S.xi=E3.bestAssign(ps,T.form.base);T.roles=x.roles&&x.roles.length===11?[...x.roles]:E3.defaultRoles(S.xi.map(pl),T.form.base);T.duties=x.duties&&x.duties.length===11?[...x.duties]:S.xi.map(()=>1)}
  T.fam=famGet(T.preset,T.form.base);ensureXI()}

function canUse(p){if(typeof M!=='undefined'&&M&&M.edit){if(M.edit.out.has(p.id))return false;if(p.injD>0&&!M.edit.xi0.includes(p.id))return false}return true}

