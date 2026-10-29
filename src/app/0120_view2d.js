// ================= 2D 중계(공격 전개 애니메이션) =================
// 엔진이 남긴 공격 추적(tr)을 따라 공을 움직이고, 슈팅·골 같은 결정적 장면은 천천히 보여줌
const PW=105,PH=68;
function tXY(s,x,y){return s===0?[(100-y)*PW/100,x*PH/100]:[y*PW/100,(100-x)*PH/100]}
function laneY(s,l){const y=(l+.5)*PH/5;return s===0?y:PH-y}
function goalX(s){return s===0?PW:0}
const shortN=n=>shortName(String(n||''));
function pitchSVG(){return `<svg id="m2d" viewBox="0 0 ${PW} ${PH}" preserveAspectRatio="xMidYMid meet">
  <rect x="0" y="0" width="${PW}" height="${PH}" fill="#1f6b3a"/>
  ${[0,1,2,3,4,5,6].map(i=>`<rect x="${i*15}" y="0" width="7.5" height="${PH}" fill="rgba(255,255,255,.035)"/>`).join('')}
  <g fill="none" stroke="rgba(255,255,255,.65)" stroke-width=".35">
   <rect x=".3" y=".3" width="${PW-.6}" height="${PH-.6}"/><line x1="52.5" y1="0" x2="52.5" y2="${PH}"/><circle cx="52.5" cy="34" r="9.15"/>
   <rect x="0" y="13.84" width="16.5" height="40.32"/><rect x="0" y="24.84" width="5.5" height="18.32"/><rect x="${PW-16.5}" y="13.84" width="16.5" height="40.32"/><rect x="${PW-5.5}" y="24.84" width="5.5" height="18.32"/>
   <path d="M16.5 26.7 A9.15 9.15 0 0 1 16.5 41.3"/><path d="M${PW-16.5} 26.7 A9.15 9.15 0 0 0 ${PW-16.5} 41.3"/>
   <rect x="-1.6" y="30.34" width="1.6" height="7.32" stroke-width=".5"/><rect x="${PW}" y="30.34" width="1.6" height="7.32" stroke-width=".5"/>
  </g><g id="m2dP"></g><g id="m2dB"><circle id="m2dBall" cx="52.5" cy="34" r="1.1" fill="#fff" stroke="#111" stroke-width=".25"/></g></svg>`}
const A2={token:0,busy:false,pos:{},last:null};
function hueOf(c){const m=/hsl\((\d+)/.exec(c);if(m)return +m[1];const x=c.replace('#','');if(x.length<6)return 0;const r=parseInt(x.slice(0,2),16)/255,g=parseInt(x.slice(2,4),16)/255,b=parseInt(x.slice(4,6),16)/255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);if(mx===mn)return -1;let h=mx===r?(g-b)/(mx-mn):mx===g?2+(b-r)/(mx-mn):4+(r-g)/(mx-mn);return ((h*60)+360)%360}
function p2col(s){const hc=clubCol(M.fx.h),ac=clubCol(M.fx.a);if(s===0)return [hc[0],'#fff'];const h1=hueOf(hc[0]),h2=hueOf(ac[0]);const close=(a,b)=>a<0||b<0?(a<0&&b<0):Math.min(Math.abs(a-b),360-Math.abs(a-b))<60;
  if(!close(h1,h2))return [ac[0],'#fff'];return ['#F2F2F2','#111']}
function drawPlayers(){const g=$('#m2dP');if(!g||!M)return;let h='';
  [0,1].forEach(s=>{const [col,ink]=p2col(s);const ph=A2.phase&&A2.phase[s]||'base';M.m.T[s].k(ph).forEach(q=>{const [X,Y]=A2.pos[q.p.id]||tXY(s,q.x,q.y);A2.pos[q.p.id]=[X,Y];
    h+=`<g class="pl" data-pid="${q.p.id}" transform="translate(${X.toFixed(2)} ${Y.toFixed(2)})"><circle r="1.9" fill="${col}" stroke="${s===M.me?'#F0B429':'rgba(0,0,0,.45)'}" stroke-width="${s===M.me?.5:.3}"/><text y="4.3" text-anchor="middle" font-size="2.3" fill="#fff" stroke="rgba(0,0,0,.6)" stroke-width=".25" paint-order="stroke">${esc(shortN(q.p.name))}</text></g>`})});
  g.innerHTML=h}
function homePos(s,name){const ph=A2.phase&&A2.phase[s]||'base';const q=M.m.T[s].k(ph).find(q=>q.p.name===name);return q?tXY(s,q.x,q.y):null}
function findP(name){for(const s of [0,1]){const p=M.m.T[s].xi.find(p=>p.name===name);if(p)return {s,p}}return null}
function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
function setPos(pid,X,Y){A2.pos[pid]=[X,Y];const el=document.querySelector(`#m2dP .pl[data-pid="${pid}"]`);if(el)el.setAttribute('transform',`translate(${X.toFixed(2)} ${Y.toFixed(2)})`)}
function setBall(X,Y,up){const b=$('#m2dBall');if(!b)return;b.setAttribute('cx',X.toFixed(2));b.setAttribute('cy',Y.toFixed(2));b.setAttribute('r',(1.1+(up||0)*1.2).toFixed(2))}
function cap(t,cls){const c=$('#mcap');if(!c)return;c.className='mcap'+(cls?' '+cls:'');c.innerHTML=t||'&nbsp;'}
// 한 프레임 = {ms, ball:[X,Y], arc, mv:{pid:[X,Y]}, cap, cls}
function playFrames(frames,tok){return new Promise(res=>{let i=0;
  const next=()=>{if(A2.token!==tok||!M){return res()}const f=frames[i++];if(!f)return res();
    const dur=Math.max(30,f.ms/(M.speed||1));const b0=[+$('#m2dBall').getAttribute('cx'),+$('#m2dBall').getAttribute('cy')];const m0={};Object.keys(f.mv||{}).forEach(pid=>m0[pid]=A2.pos[pid]||f.mv[pid]);
    if(f.cap!==undefined)cap(f.cap,f.cls);const t0=performance.now();
    const step=(now)=>{if(A2.token!==tok||!M)return res();const t=Math.min(1,(now-t0)/dur),e=ease(t);
      if(f.ball)setBall(b0[0]+(f.ball[0]-b0[0])*e,b0[1]+(f.ball[1]-b0[1])*e,f.arc?Math.sin(t*Math.PI)*f.arc:0);
      Object.keys(f.mv||{}).forEach(pid=>{const a=m0[pid],b=f.mv[pid];setPos(pid,a[0]+(b[0]-a[0])*e,a[1]+(b[1]-a[1])*e)});
      if(t<1)requestAnimationFrame(step);else next()};
    requestAnimationFrame(step)};next()})}
const TYK={cross:'크로스',lowcross:'낮은 크로스',cutback:'컷백',through:'스루패스',longshot:'중거리 슈팅',combo:'연계 플레이',solo:'개인 돌파',rebound:'리바운드',spfoot:'세컨드볼',corner:'코너킥',fkx:'프리킥 크로스',fk:'직접 프리킥',pen:'페널티킥',gkErr:'빌드업 실수'};
// 추적 → 프레임. slow=true면 결정적 장면(천천히)
function framesOf(e,slow){const tr=e.tr||[];const s=e.t==='intercept'||e.t==='recover'?(tr.length&&tr[0].k==='start'?(findP(tr[0].p)||{}).s:e.s):e.s;if(s==null)return [];
  const k=slow==='goal'?1:slow?.75:.18;const F=[];const o=1-s;A2.phase={[s]:'atk',[o]:tr[0]&&tr[0].tr?'atk':'def'};
  const P=(name)=>{const f=findP(name);if(!f)return null;return A2.pos[f.p.id]||homePos(f.s,name)};
  const mv=(name,X,Y)=>{const f=findP(name);if(!f)return {};return {[f.p.id]:[X,Y]}};
  const nm=n=>`<b>${esc(shortN(n))}</b>`;const tn=CLUBS[M.fx[s===0?'h':'a']].short;
  let lane=2,ballAt=null,carrier=null;const fwdX=(frac)=>s===0?PW*frac:PW*(1-frac);
  for(const x of tr){
    if(x.k==='start'){const p=P(x.p);if(p){F.push({ms:0,ball:p});ballAt=p}carrier=x.p;if(x.tr)F.push({ms:250*k,cap:`${tn} 역습!`,cls:'hot'});continue}
    if(x.k==='lane'){lane=x.lane;continue}
    if(x.k==='pass'){const p=P(x.to);if(p){F.push({ms:520*k,ball:p,cap:slow?`${nm(x.from)} → ${nm(x.to)}`:undefined});ballAt=p;carrier=x.to}continue}
    if(x.k==='long'){const p=P(x.to);if(p){F.push({ms:800*k,ball:p,arc:1.2,cap:`${nm(x.from)} 롱볼 → ${nm(x.to)} vs ${nm(x.vs)} 공중볼 ${x.won?'승리':'패배'}`});ballAt=p;carrier=x.to}continue}
    if(x.k==='gkErr'){const p=P(x.by);if(p){F.push({ms:600*k,ball:p,cap:`${nm(x.p)} 빌드업 실수! ${nm(x.by)} 가로채기`,cls:'hot'});ballAt=p}continue}
    if(x.k==='lost'){if(x.how==='duel')continue;F.push({ms:520*k,cap:x.how==='press'?`${nm(x.p)} 압박에 걸림 — ${nm(x.by)} 탈취`:x.how==='duel'?`${nm(x.by)} 수비 성공 — ${nm(x.p)} 돌파 실패`:`${nm(x.by)} 차단`});continue}
    if(x.k==='carry'){const f=findP(x.p);const tX=fwdX(.7),tY=laneY(s,lane);F.push({ms:700*k,ball:[tX,tY],mv:f?{[f.p.id]:[tX,tY]}:{},cap:slow?`${nm(x.p)} ${['왼쪽 측면','왼쪽 하프스페이스','중앙','오른쪽 하프스페이스','오른쪽 측면'][lane]} 전진`:undefined});ballAt=[tX,tY];carrier=x.p;continue}
    if(x.k==='recover'){F.push({ms:500*k,cap:`${nm(x.p)} 전력 복귀 — 역습 차단`});continue}
    if(x.k==='duel'){const f=findP(x.p),d=findP(x.vs);const dX=fwdX(.76),dY=laneY(s,lane);const m={};if(d)m[d.p.id]=[dX,dY];F.push({ms:450*k,mv:m,cap:`${nm(x.p)} vs ${nm(x.vs)}`});
      if(x.win){const wX=fwdX(.86),wY=dY+(s===0?1:-1)*(lane<2?3:lane>2?-3:2);const m2={};if(f)m2[f.p.id]=[wX,wY];F.push({ms:600*k,ball:[wX,wY],mv:m2,cap:x.foul?`${nm(x.p)} 돌파 — ${nm(x.vs)} 파울!`:`${nm(x.p)} 돌파 성공!`,cls:x.foul?'hot':undefined});ballAt=[wX,wY]}
      else F.push({ms:500*k,cap:`${nm(x.vs)} 수비 성공 — ${nm(x.p)} 막힘`});continue}
    if(x.k==='cross'){const bX=fwdX(.93),bY=PH/2+(lane<2?-3:lane>2?3:0);F.push({ms:750*k,ball:[bX,bY],arc:x.forced?.6:1,cap:`${nm(x.from)} ${x.early?'이른 ':x.forced?'억지 ':''}크로스`});ballAt=[bX,bY];continue}
    if(x.k==='air'){const f=findP(x.p),d=findP(x.vs);const m={};if(f&&ballAt)m[f.p.id]=[ballAt[0]-(s===0?2:-2),ballAt[1]-1.5];if(d&&ballAt)m[d.p.id]=[ballAt[0]-(s===0?1:-1),ballAt[1]+1.5];F.push({ms:500*k,mv:m,cap:x.won?(x.held?`${nm(x.p)} 경합 승리 — 슈팅 연결 실패`:`${nm(x.p)} 경합 승리 (vs ${nm(x.vs)})`):`${nm(x.vs)} 걷어냄`});continue}
    if(x.k==='claim'){const p=P(x.p);if(p)F.push({ms:500*k,ball:p,cap:`GK ${nm(x.p)} 캐치`});continue}
    if(x.k==='second'){const p=P(x.p);if(p){F.push({ms:500*k,ball:p,cap:`세컨드볼 ${nm(x.p)}`});ballAt=p}continue}
    if(x.k==='cornerWon'){F.push({ms:400*k,cap:`${nm(x.p)} 코너킥 유도`});continue}
    if(x.k==='sp'){let X,Y;if(x.kind==='corner'){X=goalX(s);Y=(x.side==='L')===(s===0)?1:PH-1}else if(x.kind==='pen'){X=fwdX(.895);Y=PH/2}else{X=fwdX(.78);Y=x.side==='L'?(s===0?18:50):x.side==='R'?(s===0?50:18):PH/2}
      const m=mv(x.p,X+(s===0?-2:2),Y);F.push({ms:0,ball:[X,Y],mv:m});F.push({ms:600*k,cap:`${x.kind==='corner'?'코너킥':x.kind==='pen'?'페널티킥':x.direct?'직접 프리킥':'프리킥'} · ${nm(x.p)}`});ballAt=[X,Y];continue}
    if(x.k==='final'){if(x.type==='solo')continue;const p=x.to?P(x.to):null;if(p){const f=findP(x.to);const tX=fwdX(.9),tY=Math.max(8,Math.min(PH-8,(p[1]+PH/2)/2));const m={};if(f)m[f.p.id]=[tX,tY];F.push({ms:600*k,ball:[tX,tY],mv:m,arc:x.type==='through'?0:x.type==='cutback'?0:.3,cap:`${nm(x.from)} ${TYK[x.type]||x.type} → ${nm(x.to)}`});ballAt=[tX,tY]}else F.push({ms:300*k,cap:`${nm(x.from)} ${TYK[x.type]||''}`});continue}
    if(x.k==='off'){F.push({ms:600*k,cap:`오프사이드 · ${nm(x.p)}`,cls:'sys'});continue}
    if(x.k==='intercept'){const p=P(x.p);if(p)F.push({ms:500*k,ball:p,cap:`${nm(x.p)} ${TYK[x.type]||'패스'} 차단`});continue}
    if(x.k==='shot'){const gY=PH/2+(Math.random()-.5)*5;const lastShot=tr[tr.length-1-[...tr].reverse().findIndex(y=>y.k==='shot')];const oc=x===lastShot?e.t:'block';const gk=M.m.T[o].xi[0];
      let txt=`${nm(x.p)} 슈팅!`,cls='hot';
      if(oc==='goal'){txt=`<span class="tag">골</span> ${nm(x.p)} — ${TYK[x.type]||''} (xG ${x.xg??e.xg??''})`;cls='goal'}
      else if(oc==='save')txt=`${nm(x.p)} 슈팅 — ${nm(e.gk||gk.name)} 선방!`;
      else if(oc==='miss')txt=`${nm(x.p)} 슈팅 — 골문 벗어남${e.weak?' (약발)':''}`;
      else if(oc==='block')txt=x===lastShot?`${nm(x.p)} 슈팅 — ${nm(e.d||'')} 몸으로 블록`:`${nm(x.p)} 슈팅 — 막힘, 다시 흐른 공`;
      const endX=oc==='block'?fwdX(.93):oc==='miss'?goalX(s)+(s===0?2:-2):goalX(s);const endY=oc==='miss'?(gY<PH/2?PH/2-6:PH/2+6):oc==='save'?PH/2+(gY<PH/2?-3:3):gY;
      F.push({ms:(oc==='goal'?700:550)*k,ball:[endX,endY],arc:x.type==='longshot'?.5:.2,cap:txt,cls});
      if(oc==='goal')F.push({ms:1300*k,cap:txt,cls});
      continue}
  }
  return F}
function isBig(e){return ['goal','save','miss','block','penAward'].includes(e.t)||(e.t==='claim')||(e.t==='attack'&&e.tr&&e.tr.some(x=>x.k==='duel'&&x.win))}
async function playEvents(evs){if(!M||M.skipping)return;const tok=++A2.token;A2.busy=true;
  const groups=[];evs.forEach(e=>{if(e.tr){const g=groups.find(g=>g.tr===e.tr);if(g)g.last=e;else groups.push({tr:e.tr,last:e,first:e})}else groups.push({e})});
  for(const g of groups){if(A2.token!==tok||!M||M.done)break;const e=g.e||g.last;
    if(g.tr){const slow=e.t==='goal'?'goal':isBig(e)&&e.t!=='attack';const F=framesOf(e,slow);if(F.length){drawPlayers();await playFrames(F,tok)}}
    else if(e.t==='yellow'||e.t==='red'||e.t==='sub'||e.t==='injury'){await playFrames([{ms:500,cap:{yellow:'경고 · ',red:'퇴장 · ',sub:'교체 · ',injury:'부상 · '}[e.t]+esc(e.t==='sub'?`${shortN(e.inP)} ⟵ ${shortN(e.out)}`:shortN(e.p)),cls:'sys'}],tok)}
  }
  if(A2.token===tok){A2.phase=null;A2.pos={};drawPlayers();const b=$('#m2dBall');if(b){b.setAttribute('cx',52.5);b.setAttribute('cy',34);b.setAttribute('r',1.1)}}
  A2.busy=false}
function stopAnim(){A2.token++;A2.busy=false}

