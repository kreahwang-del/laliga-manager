// ================= 2D 중계 v4: 연속 시뮬레이션 프레임 재생(22명 전원 실시간) =================
// 기본 1배속 = 경기 1분을 약 3초에(20배), 슈팅 장면은 앞 4초부터 느리게(골 1.2배, 슈팅 2배 = 거의 실제 속도)
const P4={ids:'',el:{},lastCap:0};
function draw4Init(fr){const g=$('#m2dP');if(!g||!M)return;const ids=[0,1].map(s=>M.m.P[s].map(a=>a.p.id).join(',')).join('|');if(ids===P4.ids&&g.childElementCount)return;P4.ids=ids;P4.el={};let h='';
  const KP=p2kits();h+=`<defs>${KP.map((k,s)=>k.pat&&k.pc?`<pattern id="kp${s}" patternUnits="objectBoundingBox" patternContentUnits="objectBoundingBox" width="1" height="1"><rect width="1" height="1" fill="${k.col}"/>${(k.pat===1?[.12,.44,.76].map(x=>`<rect x="${x}" y="0" width=".16" height="1" fill="${k.pc}"/>`):[.12,.44,.76].map(y=>`<rect x="0" y="${y}" width="1" height=".16" fill="${k.pc}"/>`)).join('')}</pattern>`:'').join('')}</defs>`;
  [0,1].forEach(s=>{const k=KP[s],col=k.pat&&k.pc?`url(#kp${s})`:k.col;M.m.P[s].forEach(a=>{const q=fr&&fr.p[a.p.id]||[a.x,a.y];
    h+=`<g class="pl" data-pid="${a.p.id}" transform="translate(${q[0].toFixed(2)} ${q[1].toFixed(2)})"><circle r="1.7" fill="${a.gk?(s===0?'#E8C547':'#9C6ADE'):col}" stroke="${s===M.me?'#F0B429':'rgba(0,0,0,.45)'}" stroke-width="${s===M.me?.45:.3}"/><text y="4" text-anchor="middle" font-size="2.1" fill="#fff" stroke="rgba(0,0,0,.6)" stroke-width=".25" paint-order="stroke">${esc(shortN(a.p.name))}</text></g>`})});
  g.innerHTML=h;g.querySelectorAll('.pl').forEach(e=>P4.el[e.dataset.pid]=e)}
function draw4(f0,f1,k){for(const id in P4.el){const a=f0.p[id],b=(f1&&f1.p[id])||a;if(!a)continue;const x=a[0]+(b[0]-a[0])*k,y=a[1]+(b[1]-a[1])*k;P4.el[id].setAttribute('transform',`translate(${x.toFixed(2)} ${y.toFixed(2)})`)}
  const bl=$('#m2dBall');if(bl){const B0=f0.b,B1=(f1||f0).b;const x=B0[0]+(B1[0]-B0[0])*k,y=B0[1]+(B1[1]-B0[1])*k,h=B0[2]+(B1[2]-B0[2])*k;bl.setAttribute('cx',x.toFixed(2));bl.setAttribute('cy',(y-h*1.2).toFixed(2));bl.setAttribute('r',(1+h*.9).toFixed(2))}
  const o=f0.o;if(o!==P4.own){if(P4.own&&P4.el[P4.own])P4.el[P4.own].querySelector('circle').removeAttribute('filter');P4.own=o;const e=o&&P4.el[o];if(e)e.querySelector('circle').setAttribute('filter','url(#m2dGlow)')}}
const HL4={goal:1.2,save:2,miss:2,block:2.2,penAward:1.5,claim:3,aerialWon:3,intercept:6,fkShot:1.5};
function capOf4(e){const nm=x=>`<b>${esc(shortN(x))}</b>`,tn=s=>CLUBS[s===0?M.fx.h:M.fx.a].short;
  switch(e.t){case 'goal':return [`<span class="tag">골</span> ${nm(e.p)}${e.a?` · 도움 ${nm(e.a)}`:''} (xG ${e.xg})`,'goal'];case 'save':return [`${nm(e.p)} 슈팅 — ${nm(e.gk)} 선방!`,'hot'];
    case 'miss':return [`${nm(e.p)} 슈팅 — 골문 벗어남`,'hot'];case 'block':return [`${nm(e.p)} 슈팅 — ${nm(e.d)} 블록`,'hot'];case 'corner':return [`코너킥 · ${nm(e.p)}`,''];
    case 'fkShot':return [`직접 프리킥 · ${nm(e.p)}`,'hot'];case 'fkCross':return [`프리킥 · ${nm(e.p)}`,''];case 'penAward':return [`페널티킥! · ${nm(e.p)}`,'hot'];
    case 'offside':return [`오프사이드 · ${nm(e.p)}`,'sys'];case 'yellow':return [`경고 · ${nm(e.p)}`,'sys'];case 'red':return [`퇴장 · ${nm(e.p)}`,'sys'];
    case 'sub':return [`교체 · ${nm(e.inP)} ⟵ ${nm(e.out)}`,'sys'];case 'injury':return [`부상 · ${nm(e.p)}`,'sys'];case 'dribble':return [`${nm(e.p)} 돌파!`,''];
    case 'intercept':return [`${nm(e.p)} 차단`,''];case 'claim':return [`GK ${nm(e.gk)} 캐치`,''];case 'foul':return [`파울 · ${nm(e.d)} → ${nm(e.p)}`,'sys'];case 'aerialWon':return [`${nm(e.p)} 공중볼 따냄`,''];case 'wall':return [`${nm(e.a)} ↔ ${nm(e.p)} 2대1 패스!`,''];
    default:return null}}
function play4(frames,evs){return new Promise(res=>{if(!M||M.skipping||!frames.length)return res();const tok=++A2.token;A2.busy=true;draw4Init(frames[0]);
  const hl=evs.filter(e=>HL4[e.t]&&e.sec!=null).map(e=>({a:e.sec-(e.t==='goal'?5:3.5),b:e.sec+(e.t==='goal'?2.5:1.2),r:HL4[e.t]}));
  const caps=evs.filter(e=>e.sec!=null).map(e=>({t:e.sec,c:capOf4(e)})).filter(x=>x.c);
  const t0=frames[0].t-.5,t1=frames[frames.length-1].t;let gt=t0,last=performance.now(),ci=0;
  const rsAt=t=>{let i=0;while(i<frames.length-1&&frames[i+1].t<t)i++;return frames[i].rs};
  const rate=t=>{const base=20*(M.speed||1);let r=base;for(const w of hl)if(t>=w.a&&t<=w.b)r=Math.min(r,w.r*Math.sqrt(M.speed||1));if(r===base&&rsAt(t))r=base*((M.speed||1)<1?2:4); /* v152 느린 속도에선 재개 구간 빨리감기를 2배로만 */return r};
  const loop=now=>{if(A2.token!==tok||!M){A2.busy=false;return res()}const dt=Math.min(.1,(now-last)/1000);last=now;gt+=dt*rate(gt);
    if(M.skipping){A2.busy=false;return res()}
    if(M.evQ&&M.evQ.length&&typeof evFlush==='function')evFlush(gt);else if(M.clk!=null&&typeof evFlush==='function'&&(gt-M.clk)>2)evFlush(gt);
    while(ci<caps.length&&caps[ci].t<=gt){const c=caps[ci++].c;cap(c[0],c[1])}
    if(gt>=t1){const f=frames[frames.length-1];draw4(f,null,0);A2.busy=false;return res()}
    let i=0;while(i<frames.length-1&&frames[i+1].t<gt)i++;const f0=frames[i],f1=frames[i+1];const k=f1?Math.max(0,Math.min(1,(gt-f0.t)/(f1.t-f0.t||1))):0;draw4(f0,f1,k);
    requestAnimationFrame(loop)};requestAnimationFrame(loop)})}
// 기존 함수 교체: v4 경기면 프레임 재생
{const _pe=playEvents;playEvents=function(evs){if(M&&M.m&&M.m.v===4)return play4(M.m.st.frames||[],evs);return _pe(evs)}}
{const _dp=drawPlayers;drawPlayers=function(){if(M&&M.m&&M.m.v===4){P4.ids='';const fr=M.m.st.frames&&M.m.st.frames[M.m.st.frames.length-1];draw4Init(fr||null);if(fr)draw4(fr,null,0);return}return _dp()}}
{const _ps=pitchSVG;pitchSVG=function(){return _ps().replace('<rect x="0" y="0"','<defs><filter id="m2dGlow" x="-1" y="-1" width="3" height="3"><feDropShadow dx="0" dy="0" stdDeviation=".6" flood-color="#fff" flood-opacity=".95"/></filter></defs><rect x="0" y="0"')}}

/* v177: 2D 선수 원 = 실제 유니폼(KITS3D) 상의 색 + 줄무늬(세로 1)·가로줄(2). 두 팀 색이 비슷하면 원정팀 원정 킷 → 그래도 비슷하면 홈 원정 킷 → 흰색(3D 화면과 같은 규칙) */
function p2kits(){const hc=M.fx.h,ac=M.fx.a;const hx=v=>{if(!v)return null;v=String(v).replace('#','').toLowerCase();return /^[0-9a-f]{6}$/.test(v)?'#'+v:null};
  const raw=(c,i)=>{const K=typeof KITS3D!=='undefined'&&KITS3D[c]&&KITS3D[c][i];if(!K||!hx(K[0]))return null;return {col:hx(K[0]),pat:K[4]||0,pc:hx(K[5])}};
  const fb=(c,s)=>({col:clubCol(c)[0],pat:0,pc:null});
  const rgb=h=>{const v=parseInt(h.slice(1),16);return [(v>>16&255)/255,(v>>8&255)/255,(v&255)/255]};
  const toHex=c=>{if(/^#[0-9a-f]{6}$/i.test(c))return c;const m=/hsl\((\d+)\s+(\d+)%\s+(\d+)%/.exec(c);if(!m)return '#808080';const H=+m[1]/360,S=+m[2]/100,L=+m[3]/100;const f=n=>{const k=(n+H*12)%12,a=S*Math.min(L,1-L);return L-a*Math.max(-1,Math.min(k-3,9-k,1))};return '#'+[f(0),f(8),f(4)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('')};
  const cd=(a,b)=>{const x=rgb(toHex(a)),y=rgb(toHex(b));return Math.abs(x[0]-y[0])+Math.abs(x[1]-y[1])+Math.abs(x[2]-y[2])};
  let H=raw(hc,0)||fb(hc,0),A=raw(ac,0)||{col:clubCol(ac)[0],pat:0,pc:null};
  if(cd(H.col,A.col)<.9){const A2=raw(ac,1);if(A2&&cd(H.col,A2.col)>=.9)A=A2;else{const H2=raw(hc,1);if(H2&&cd(H2.col,A.col)>=.9)H=H2;else A={col:'#F2F2F2',pat:0,pc:null}}}
  if(cd(H.col,A.col)<.55)A={col:H.col==='#F2F2F2'?'#1e4f9c':'#F2F2F2',pat:0,pc:null};return [H,A]}
{const _p2=p2col;p2col=function(s){try{if(M&&M.fx){const k=p2kits()[s];const v=k.col;const x=/^#[0-9a-f]{6}$/i.test(v)?parseInt(v.slice(1),16):null;const lum=x==null?0:((x>>16&255)*.299+(x>>8&255)*.587+(x&255)*.114);return [v,lum>170?'#111':'#fff']}}catch(e){}return _p2(s)}}

