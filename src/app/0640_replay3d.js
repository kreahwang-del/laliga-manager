// ================= 3D 다시보기(v81): 골·빅찬스(xG 0.2 이상 슈팅) 장면을 three.js로 재생 =================
// 엔진 4가 0.5초마다 기록하는 22명·공 위치(st.frames)를 직전 9초 ~ 직후 2.5초만 잘라 저장 → 경기장·골대·선수 인형·공 궤적을 3D로 재생
// 카메라: 자동(중계 → 마지막 순간 골대 뒤)·중계·골대 뒤·추적, 슈팅 순간 슬로모션. three.js r158(MIT)은 HTML에 내장, 처음 열 때만 로드
const R3={buf:[],pend:[],key:{}};
function r3Keep(f){if(!f||!f.length)return;const last=R3.buf.length?R3.buf[R3.buf.length-1].t:-1;for(const x of f)if(x.t>last)R3.buf.push(x);if(R3.buf.length>300)R3.buf=R3.buf.slice(-300)}
function r3Big(e){return e.t==='goal'||((e.t==='save'||e.t==='miss')&&(e.xg||0)>=.2)}
function r3Roster(){const R={};[0,1].forEach(s=>{(M.m.P[s]||[]).forEach(a=>{R[a.p.id]={s,gk:!!a.gk,n:a.p.name}})});return R}
function r3Capture(evs){if(!M||!M.m||M.m.v!==4)return;if(M.r3fx!==M.fx){M.r3fx=M.fx;R3.buf=[];R3.pend=[];M.reps=[]}r3Keep(M.m.st.frames);
  (evs||[]).forEach(e=>{if(!r3Big(e)||e.sec==null)return;const k=e.t+e.sec+e.p;if(R3.key[k])return;R3.key[k]=1;R3.pend.push({e,t0:e.sec-9,t1:e.sec+2.5,ros:r3Roster()})});r3Flush(false)}
function r3Flush(all){const bufT=R3.buf.length?R3.buf[R3.buf.length-1].t:-1;/* v265: 3D 다시보기 칩(예: '골 · 부앙가')이 1분 계산 직후 바로 떠 2D보다 먼저 득점을 알려 버림 → 2D 재생 시각(M.clk)이 장면 끝을 지난 뒤에만 추가 */const lastT=(!all&&typeof M!=='undefined'&&M&&M.clk!=null)?Math.min(bufT,M.clk):bufT;R3.pend=R3.pend.filter(p=>{if(!all&&lastT<p.t1)return true;const fr=R3.buf.filter(f=>f.t>=p.t0&&f.t<=p.t1);
    if(fr.length>=6){Object.assign(p.ros,r3Roster());M.reps=(M.reps||[]).concat([{e:p.e,fr,ros:p.ros,sc:M.m.st?[...M.m.st.sc]:null}]).slice(-16);r3Bar()}return false})}
{const _pe=playEvents;playEvents=function(evs){try{r3Capture(evs)}catch(e){console.error(e)}return _pe.apply(this,arguments)}}
{const _ef=evFlush;evFlush=function(t){const o=_ef.apply(this,arguments);try{if(R3.pend&&R3.pend.length)r3Flush(false)}catch(e){}return o}}
{const _fin=finish;finish=function(){try{if(M&&M.m&&M.m.v===4){r3Keep(M.m.st.frames);r3Flush(true)}}catch(e){}return _fin.apply(this,arguments)}}
{const _r=render;render=function(){const o=_r.apply(this,arguments);try{if(typeof M!=='undefined'&&M&&M.reps&&M.reps.length)r3Bar()}catch(e){}return o}}
function r3Lab(e){return e.t==='goal'?'골':e.t==='save'?'선방':'빅찬스'}
function r3Bar(){const fd=$('#mfd');if(!fd||!M||!M.reps||!M.reps.length)return;let bar=$('#r3dbar');if(!bar){bar=document.createElement('div');bar.id='r3dbar';bar.className='chips';bar.style.cssText='margin:6px 0';fd.parentNode.insertBefore(bar,fd)}
  bar.innerHTML=`<span class="note" style="flex:none;align-self:center">🎥 3D</span>`+M.reps.map((r,i)=>`<button class="chip" data-r3d="${i}" style="${r.e.t==='goal'?'border-color:var(--amber);color:var(--text)':''}">${r.e.m}' ${r3Lab(r.e)} · ${esc(shortN(r.e.p))}</button>`).join('')}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-r3d]');if(!b||!M||!M.reps)return;e.stopPropagation();e.preventDefault();r3Open(M.reps[+b.dataset.r3d])},true);
// ---- 3D 재생 ----
function r3LoadThree(){if(window.THREE)return true;const src=document.getElementById('threeSrc');if(!src)return false;const s=document.createElement('script');s.textContent=src.textContent;document.head.appendChild(s);return !!window.THREE}
function r3PitchTex(T){const c=document.createElement('canvas'),K=10,W0=115*K,H0=78*K;c.width=W0;c.height=H0;const g=c.getContext('2d');
  for(let i=0;i<23;i++){g.fillStyle=i%2?'#2f7d3a':'#358a40';g.fillRect(i*W0/23,0,W0/23+1,H0)}
  g.strokeStyle='rgba(255,255,255,.92)';g.lineWidth=.14*K;const X=x=>(x+5)*K,Y=y=>(y+5)*K;const R=(x,y,w,h)=>g.strokeRect(X(x),Y(y),w*K,h*K);
  R(0,0,105,68);g.beginPath();g.moveTo(X(52.5),Y(0));g.lineTo(X(52.5),Y(68));g.stroke();g.beginPath();g.arc(X(52.5),Y(34),9.15*K,0,7);g.stroke();
  [[0,1],[105,-1]].forEach(([gx,d])=>{R(d>0?0:105-16.5,34-20.16,16.5,40.32);R(d>0?0:105-5.5,34-9.16,5.5,18.32);g.fillStyle='#fff';g.beginPath();g.arc(X(gx+d*11),Y(34),.25*K,0,7);g.fill();
    g.beginPath();const a=Math.acos(5.5/9.15);if(d>0)g.arc(X(11),Y(34),9.15*K,-a,a);else g.arc(X(94),Y(34),9.15*K,Math.PI-a,Math.PI+a);g.stroke()});
  g.fillStyle='#fff';g.beginPath();g.arc(X(52.5),Y(34),.3*K,0,7);g.fill();const t=new T.CanvasTexture(c);t.anisotropy=4;return t}
function r3Label(T,txt,col){const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');g.font='bold 30px sans-serif';g.textAlign='center';g.lineWidth=6;g.strokeStyle='rgba(0,0,0,.75)';g.strokeText(txt,128,42);g.fillStyle=col||'#fff';g.fillText(txt,128,42);
  const s=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),depthTest:false,transparent:true}));s.scale.set(3.2,.8,1);s.renderOrder=9;return s}
const R3NC={white:'ffffff',black:'151515',red:'d2122e',blue:'1e4f9c',navy:'0f1d42',skyblue:'6fb4e8',yellow:'f2d124',gold:'d4af37',green:'0a7d33',darkgreen:'06512a',orange:'e8611a',purple:'5b2a86',violet:'5b2a86',maroon:'7b1b2e',claret:'7b1b2e',grey:'8a8f98',gray:'8a8f98',silver:'c6cbd2',pink:'f2a0c0',brown:'6b4a2b',cream:'f2ead8',bordeaux:'6d1f33',crimson:'c21e3a',scarlet:'d2122e',amber:'f0b429',azure:'2d7dd2',garnet:'6d1f33'};
function r3Hex(v){if(!v)return null;v=(''+v).trim().replace(/^#/,'').toLowerCase();if(/^[0-9a-f]{6}$/.test(v))return '#'+v;if(/^[0-9a-f]{3}$/.test(v))return '#'+v.split('').map(c=>c+c).join('');return R3NC[v]?'#'+R3NC[v]:null}
function r3KitRaw(c,i){const K=typeof KITS3D!=='undefined'&&KITS3D[c];const k=K&&K[i];if(!k)return null;const [b,ar,sh,so,pt,pc]=k;const body=r3Hex(b);if(!body)return null;
  return {body,arms:r3Hex(ar)||body,shorts:r3Hex(sh)||'#ffffff',socks:r3Hex(so)||body,pat:pt||0,patCol:r3Hex(pc)}}
function r3CDist(T,a,b){const x=new T.Color(a),y=new T.Color(b);return Math.abs(x.r-y.r)+Math.abs(x.g-y.g)+Math.abs(x.b-y.b)}
function r3Kits(T,hc,ac){const fall=c=>({body:p2col(c===hc?0:1)[0],arms:null,shorts:c===hc?'#f2f2f2':'#20252c',socks:null,pat:0,patCol:null});
  let H=r3KitRaw(hc,0)||fall(hc);let A=r3KitRaw(ac,0)||fall(ac);
  if(r3CDist(T,H.body,A.body)<.9){const A2=r3KitRaw(ac,1);if(A2&&r3CDist(T,H.body,A2.body)>=.9)A=A2;else{const H2=r3KitRaw(hc,1);if(H2&&r3CDist(T,H2.body,A.body)>=.9)H=H2;else if(!A2)A=fall(ac)}}
  [H,A].forEach(k=>{if(!k.arms)k.arms=k.body;if(!k.socks)k.socks=k.body});
  if(r3CDist(T,H.body,A.body)<.55)A={body:'#1e4f9c',arms:'#1e4f9c',shorts:'#ffffff',socks:'#1e4f9c',pat:0,patCol:null};return [H,A]}
function r3ShirtMat(T,kit){if(!kit.pat||!kit.patCol)return new T.MeshStandardMaterial({color:kit.body,roughness:.72});
  const c=document.createElement('canvas');c.width=64;c.height=64;const g=c.getContext('2d');g.fillStyle=kit.body;g.fillRect(0,0,64,64);g.fillStyle=kit.patCol;
  if(kit.pat===1){for(let i=0;i<4;i++)g.fillRect(i*16+4,0,8,64)}else{for(let i=0;i<4;i++)g.fillRect(0,i*16+4,64,8)}
  const tx=new T.CanvasTexture(c);tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.repeat.set(2,1);return new T.MeshStandardMaterial({map:tx,roughness:.72})}
function r3Look(id){const L=typeof LOOK3D!=='undefined'&&LOOK3D[id];if(!L||L.length<13)return {skin:'#d9a77f',hair:'#2a2420',st:1};
  /* v111: 경기장 조명(특히 야간·녹색 반사광)에서 피부·머리색이 어둡고 비슷하게 보여 표시용으로 보정 — 피부 8단계 간격을 넓히고 밝게, 머리색은 명도 ×1.35(검은 머리는 유지) */
  const SK={'f6d7c4':'#fff0e6','ecc3a5':'#ffe6d2','dcae8a':'#ffdcbf','c5976e':'#f0c39c','a87a55':'#cf9a6c','8a5f3f':'#9d6a44','6e462c':'#6a3f24','50301d':'#40240f'};const sk=SK[L.slice(0,6)]||'#'+L.slice(0,6);
  const hx=L.slice(6,12);let r=parseInt(hx.slice(0,2),16)/255,g=parseInt(hx.slice(2,4),16)/255,b=parseInt(hx.slice(4,6),16)/255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,sat=0,l=(mx+mn)/2;
  if(mx!==mn){const d=mx-mn;sat=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h/=6}
  if(l>.1){l=Math.min(.82,l*1.35);sat=Math.min(1,sat*1.1)}const f=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p};const q2=l<.5?l*(1+sat):l+sat-l*sat,p2=2*l-q2;
  const to=v=>Math.round(v*255).toString(16).padStart(2,'0');const hair=sat===0?'#'+to(l)+to(l)+to(l):'#'+to(f(p2,q2,h+1/3))+to(f(p2,q2,h))+to(f(p2,q2,h-1/3));
  return {skin:sk,hair,st:+L[12]||0}}
function r3Player(T,kit,gk,look,shirtMat){const G=new T.Group();const gkc=gk?(kit.gkc||'#E8C547'):null;
  const shirt=gk?new T.MeshStandardMaterial({color:gkc,roughness:.72}):shirtMat;
  const sleeve=gk?shirt:new T.MeshStandardMaterial({color:kit.arms,roughness:.72});
  const sk=new T.MeshStandardMaterial({color:look.skin,roughness:.85});
  const sh=new T.MeshStandardMaterial({color:gk?'#20252c':kit.shorts,roughness:.8});
  const sock=new T.MeshStandardMaterial({color:gk?gkc:kit.socks,roughness:.8});
  const hairM=new T.MeshStandardMaterial({color:look.hair,roughness:.95});
  const boot=new T.MeshStandardMaterial({color:'#17191d',roughness:.6});
  const torso=new T.Mesh(new T.CylinderGeometry(.26,.21,.5,10),shirt);torso.position.y=1.22;torso.castShadow=true;G.add(torso);
  const hip=new T.Mesh(new T.CylinderGeometry(.215,.225,.24,10),sh);hip.position.y=.88;G.add(hip);
  const head=new T.Mesh(new T.SphereGeometry(.15,12,10),sk);head.position.y=1.66;head.castShadow=true;G.add(head);
  if(look.st>0){const hr=new T.Mesh(new T.SphereGeometry(.157,12,8,0,Math.PI*2,0,1.45),hairM);hr.position.y=1.675;hr.rotation.z=.12;G.add(hr);
    if(look.st===2){const bk=new T.Mesh(new T.CylinderGeometry(.11,.13,.3,8),hairM);bk.position.set(-.07,1.52,0);G.add(bk)}}
  const legs=[-1,1].map(d=>{const Hp=new T.Group();Hp.position.set(0,.84,d*.115);G.add(Hp);
    const th=new T.Mesh(new T.CylinderGeometry(.085,.07,.34,8),sk);th.position.y=-.17;th.castShadow=true;Hp.add(th);
    const Kn=new T.Group();Kn.position.y=-.34;Hp.add(Kn);
    const cf=new T.Mesh(new T.CylinderGeometry(.065,.055,.36,8),sock);cf.position.y=-.18;cf.castShadow=true;Kn.add(cf);
    const bt=new T.Mesh(new T.BoxGeometry(.2,.08,.1),boot);bt.position.set(.05,-.38,0);Kn.add(bt);return {hip:Hp,knee:Kn}});
  const arms=[-1,1].map(d=>{const A=new T.Group();A.position.set(0,1.44,d*.3);G.add(A);
    const sl=new T.Mesh(new T.CylinderGeometry(.055,.05,.2,6),sleeve);sl.position.y=-.1;A.add(sl);
    const fa=new T.Mesh(new T.CylinderGeometry(.047,.04,.32,6),gk?sleeve:sk);fa.position.y=-.34;A.add(fa);return A});
  G.userData={legs,arms,ph:Math.random()*6};return G}

// ---- Mixamo 사커 팩(X Bot + 동작) 스켈레탈 모델 ----
function r3LoadModel(cb){if(R3.model||R3.mfail)return cb();if(!r3LoadThree()||!window.THREE_X){R3.mfail=1;R3.err=!window.THREE?'three 로드 실패':'GLTFLoader 없음';return cb()}const el=document.getElementById('plGlb');if(!el){R3.mfail=1;R3.err='모델 데이터 없음';return cb()}
  try{const bin=atob(el.textContent.trim());const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
    new THREE_X.GLTFLoader().parse(u.buffer,'',g=>{const T=THREE;let mesh=null;g.scene.traverse(o=>{if(o.isSkinnedMesh&&!mesh)mesh=o});
      const bb=new T.Box3();g.scene.traverse(o=>{if(o.isSkinnedMesh){o.geometry.computeBoundingBox();bb.union(o.geometry.boundingBox)}});
      const sz=new T.Vector3();bb.getSize(sz);const clips={};g.animations.forEach(c=>clips[c.name]=c);
      const wb=new T.Box3().setFromObject(g.scene),ws=new T.Vector3();wb.getSize(ws);
      const dv=clips.gkDive&&clips.gkDive.tracks.find(t=>t.name.endsWith('Hips.position'));const dsx=dv?Math.sign(dv.values[dv.values.length-3]-dv.values[0])||1:1;
      const hbn=g.scene.getObjectByName('mixamorigHead');let head=null;if(hbn){g.scene.updateMatrixWorld(true);const hp=new T.Vector3(),hs=new T.Vector3();hbn.getWorldPosition(hp);hbn.getWorldScale(hs);head={k:(wb.max.y-hp.y)/hs.y}}
      const J={};const wp=new T.Vector3();['Hips','Spine2','Neck','Head','LeftUpLeg','LeftLeg','LeftFoot','LeftArm','LeftForeArm','LeftHand'].forEach(k=>{const o=g.scene.getObjectByName('mixamorig'+k);if(o){o.getWorldPosition(wp);J[k]=[Math.abs(wp.x-(wb.min.x+ws.x/2))/ws.y,(wp.y-wb.min.y)/ws.y]}});
      {const RS={tackle:.5,trip:0,standup:0,fallen:0,scissor:.3};for(const [k,sc] of Object.entries(RS)){const c=clips[k];if(!c)continue;c.tracks.filter(t=>t.name.endsWith('Hips.position')).forEach(t=>{const v=t.values,x0=v[0],z0=v[2];for(let i=0;i<v.length;i+=3){v[i]=x0+(v[i]-x0)*sc;v[i+2]=z0+(v[i+2]-z0)*sc}})}}
      R3.model={scene:g.scene,clips,bbMin:bb.min.clone(),bbSize:sz,scale:1.8/Math.max(ws.y,1e-6),diveSign:dsx,head,J};cb()},er=>{console.error(er);R3.mfail=1;R3.err=String(er&&er.message||er).slice(0,80);cb()})}catch(e){console.error(e);R3.mfail=1;R3.err=String(e&&e.message||e).slice(0,80);cb()}}
function r3DigTex(T){if(R3.dig)return R3.dig;const c=document.createElement('canvas');c.width=640;c.height=96;const g=c.getContext('2d');g.font='bold 84px Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#fff';
  for(let i=0;i<10;i++)g.fillText(String(i),i*64+32,52);const t=new T.CanvasTexture(c);t.flipY=false;R3.dig=t;return t}
function r3Trim(T,hex){const c=new T.Color(hex);return (.3*c.r+.59*c.g+.11*c.b)>.55?'#15171c':'#f4f4f4'}
function r3SkinMat(T,kit,gk,look,num){const m=new T.MeshStandardMaterial({roughness:.75,metalness:0});const C=h=>new T.Color(h);const mo=R3.model;const body=gk?(kit.gkc||'#E8C547'):kit.body;
  const trim=kit.pat&&kit.patCol?kit.patCol:r3Trim(T,body);const n=Math.max(1,Math.min(99,num||7));
  const U={uShirt:{value:C(body)},uSleeve:{value:C(gk?body:kit.arms)},uShorts:{value:C(gk?'#20252c':kit.shorts)},uSocks:{value:C(gk?body:kit.socks)},uTrim:{value:C(trim)},uNumC:{value:C(r3Trim(T,body))},
    uSkin:{value:C(look.skin)},uHair:{value:C(look.hair)},uHairSt:{value:look.st},uPat:{value:gk?0:(kit.pat||0)},uPatCol:{value:C(kit.patCol||kit.body)},uGk:{value:gk?1:0},uMin:{value:mo.bbMin},uSize:{value:mo.bbSize},
    uDig:{value:r3DigTex(T)},uNum:{value:new T.Vector2(n>=10?Math.floor(n/10):-1,n%10)}};
  const J=mo.J||{},jy=(k,d)=>J[k]?J[k][1]:d,jx=(k,d)=>J[k]?J[k][0]:d;const yF=jy('LeftFoot',.05),yK=jy('LeftLeg',.28),yH=jy('LeftUpLeg',.52),yS=jy('Spine2',.7),yN=jy('Neck',.83),xS=jx('LeftArm',.11),xE=jx('LeftForeArm',.28),xW=jx('LeftHand',.43);
  const yW=yH+(yS-yH)*.3;U.uB1={value:new T.Vector4(yF+.012,yK-.012,yK+(yH-yK)*.5,yW)};U.uB2={value:new T.Vector4(yN-.004,xS*.95,xS+(xE-xS)*.5,xW-.01)};U.uB3={value:new T.Vector4(yW+(yN-yW)*.28,yW+(yN-yW)*.78,yS-.06,0)};
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
    sh.vertexShader='varying vec3 vBP;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBP=position;');
    sh.fragmentShader='varying vec3 vBP;uniform vec3 uShirt,uSleeve,uShorts,uSocks,uSkin,uHair,uPatCol,uTrim,uNumC,uMin,uSize;uniform float uHairSt,uPat,uGk;uniform sampler2D uDig;uniform vec2 uNum;uniform vec4 uB1,uB2,uB3;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 n=(vBP-uMin)/uSize;float y=n.y;float H=uSize.y;float xs=(vBP.x-(uMin.x+uSize.x*.5))/H;float x=abs(xs);float z=(vBP.z-(uMin.z+uSize.z*.5))/H;vec3 c=uShirt;
      float bS=uB2.y,bSl=uB2.z,bW=uB2.w,yNk=uB2.x;
      if(y>uB3.z&&x>bS){ if(x>bW)c=uGk>.5?vec3(.95):uSkin; else if(x>bSl+.012)c=uGk>.5?uSleeve:uSkin; else if(x>bSl)c=uTrim; else c=uSleeve; }
      else if(y>=yNk){ c=uSkin; float hh=1.-yNk;
        if(z>.015){float ey=yNk+hh*.56;float ex=abs(x-.0);float dx=abs(x)-.019;
          if((dx*dx)/(.0062*.0062)+((y-ey)*(y-ey))/(.0042*.0042)<1.)c=vec3(.96);
          if((dx*dx)/(.0034*.0034)+((y-ey)*(y-ey))/(.0034*.0034)<1.)c=vec3(.12,.09,.07);
          if(abs(dx+.001)<.0085&&abs(y-(ey+hh*.085))<.0022)c=uHair*.8;
          if(x<.0105&&abs(y-(yNk+hh*.31))<.0016)c=uSkin*.55;
          if(x<.004&&y>yNk+hh*.38&&y<yNk+hh*.5)c=uSkin*.88;}
        if(uHairSt>.5&&(y>yNk+hh*.62||(y>yNk+hh*.3&&z<-.035)))c=uHair; if(uHairSt>1.5&&y>yNk+hh*.15&&z<.0)c=uHair; }
      else if(y<uB1.x)c=vec3(.08); else if(y<uB1.y-.015)c=uSocks; else if(y<uB1.y)c=uTrim; else if(y<uB1.z)c=uSkin;
      else if(y<uB1.w){ c=uShorts; if(x>.088&&x<.1)c=uTrim; }
      else { c=uShirt; if(uPat>.5&&uPat<1.5&&mod(floor((vBP.x-uMin.x)/H/.042),2.)>.5)c=uPatCol; if(uPat>1.5&&mod(floor(y/.035),2.)>.5)c=uPatCol;
        if(y>yNk-.022&&x<.07)c=uTrim;
        if(z<-.02&&y>uB3.x&&y<uB3.y&&x<.078){float u=(.078-xs)/.156;float v=(uB3.y-y)/(uB3.y-uB3.x);float two=uNum.x>=0.?1.:0.;float d=two>.5?(u<.5?uNum.x:uNum.y):uNum.y;float lu=two>.5?fract(u*2.):u;
          vec2 tuv=vec2((d+.1+lu*.8)/10.,v);if(lu>.02&&lu<.98&&texture2D(uDig,tuv).a>.5)c=uNumC;}
        if(z>.03&&y>uB3.y-.02&&y<uB3.y+.02&&xs>.035&&xs<.065)c=uTrim; }
      diffuseColor.rgb=c;`)};m.customProgramCacheKey=()=>'r3skin4';return m}
/* v160 스로인 손 동작: 모델에 던지기 클립이 없어 양팔 뼈를 직접 돌림(뼈 축 실측: 위팔 로컬 X −90° = 머리 위, 로컬 Z = 앞뒤)
   내림 → 머리 위 → 머리 뒤로 젖힘(접촉 순간) → 앞으로 내던짐 → 유지 */
const R3T={Q:null};
function r3ThrowQ(){if(R3T.Q)return R3T.Q;const T=THREE,Q=(ax,a)=>new T.Quaternion().setFromAxisAngle(new T.Vector3(...ax),a);R3T.Q={};
  [['Left',1],['Right',-1]].forEach(([sd,s])=>{R3T.Q[sd]={down:Q([1,0,0],1.3),over:Q([1,0,0],-1.57),back:Q([1,0,0],-1.57).multiply(Q([0,0,1],-.5*s)),fwd:Q([0,0,1],1.57*s).multiply(Q([1,0,0],-.6))}});return R3T.Q}
function r3Throw(u,k,imp){const T=THREE;const A=u.arms,PQ=r3ThrowQ();const ss=(x)=>x<=0?0:x>=1?1:x*x*(3-2*x);
  ['Left','Right'].forEach(sd=>{const B=A[sd+'Arm'];if(!B)return;const P=PQ[sd];const q=new T.Quaternion();
    if(k<imp*.4)q.slerpQuaternions(P.down,P.over,ss(k/(imp*.4)));else if(k<imp)q.slerpQuaternions(P.over,P.back,ss((k-imp*.4)/(imp*.6)));else q.slerpQuaternions(P.back,P.fwd,ss((k-imp)/Math.max(.05,(1-imp)*.35)));
    B.o.quaternion.copy(B.q).multiply(q);const F=A[sd+'ForeArm'];if(F)F.o.quaternion.copy(F.q)})}
function r3PlayerSk(T,kit,gk,look,num){const mo=R3.model;const G=new T.Group();const inner=THREE_X.SkeletonUtils.clone(mo.scene);inner.scale.setScalar(mo.scale);inner.rotation.y=Math.PI/2;G.add(inner);
  const mat=r3SkinMat(T,kit,gk,look,num);inner.traverse(o=>{if(o.isSkinnedMesh){o.material=mat;o.castShadow=true;o.frustumCulled=false}});
  r3Hair(T,inner,look);const mixer=new T.AnimationMixer(inner);const arms={};['LeftArm','RightArm','LeftForeArm','RightForeArm','Spine2'].forEach(k=>{const o=inner.getObjectByName('mixamorig'+k);if(o)arms[k]={o,q:o.quaternion.clone()}});G.userData={sk:true,mixer,inner,acts:{},cur:null,gk,arms};return G}
// 머리 모양 메시(머리 뼈에 부착): 0 삭발(없음) 1 짧은 머리(캡) 2 긴 머리(캡+뒷머리) 3 윗머리 볼륨 4 아프로
function r3Hair(T,inner,look){const H=R3.model.head;if(!H||!look.st)return;const hb=inner.getObjectByName('mixamorigHead');if(!hb)return;const hs=H.k,r=hs*.47,cY=hs*.52;
  const m=new T.MeshStandardMaterial({color:look.hair,roughness:.95});const g=new T.Group();const add=(geo,x,y,z,rx,sx,sy,sz)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.rotation.x=rx||0;o.scale.set(sx||1,sy||1,sz||1);o.castShadow=true;g.add(o);return o};
  if(look.st===4){add(new T.SphereGeometry(r*1.42,14,10),0,cY+r*.28,-r*.12,0,1,.92,1)}
  else{add(new T.SphereGeometry(r*1.07,14,8,0,Math.PI*2,0,Math.PI*.56),0,cY+r*.02,-r*.1,-.32);
    if(look.st===3)add(new T.SphereGeometry(r*.8,12,8),0,cY+r*.72,r*.05,-.2,1,.55,1.1);
    if(look.st===2){add(new T.CylinderGeometry(r*1.03,r*1.15,r*2.1,14,1,true,Math.PI*.55,Math.PI*.9),0,cY-r*.75,-r*.04,0,1,1,1).material=m;}}
  g.traverse(o=>{if(o.material)o.material.side=T.DoubleSide});hb.add(g)}
function r3Act(u,name,opt){const T=THREE;const clip=R3.model.clips[name];if(!clip)return null;let a=u.acts[name];if(!a){a=u.acts[name]=u.mixer.clipAction(clip);if(opt&&opt.once){a.setLoop(T.LoopOnce,1);a.clampWhenFinished=true}}
  if(u.cur!==name){const prev=u.cur&&u.acts[u.cur];a.reset();a.enabled=true;a.setEffectiveWeight(1);a.play();if(prev)prev.crossFadeTo(a,opt&&opt.fade!=null?opt.fade:.18,false);u.cur=name}return a}
// ---- 경기장(v87): 수용 인원(STAD, Transfermarkt)에 따라 관중석 1~3층·지붕, 관중은 홈 유니폼 색 위주, 광고판(가상 문구), 야간 경기는 조명탑 ----
function r3Night(fx){const d=fx&&fx.d||'';const dow=new Date(d+'T12:00:00').getDay();if(fx&&(fx.eu||(dow>=2&&dow<=4)))return true;return hsh('nt'+d+(fx&&fx.h))<.45}
function r3Crowd(T,kits,seed){const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d');g.fillStyle='#1d232c';g.fillRect(0,0,512,128);
  const H=kits[0],A=kits[1],pal=[H.body,H.body,H.body,H.arms||H.body,H.patCol||H.shorts,'#e9e9e9','#2a2d33','#c9a27c','#8a5a3c'];
  for(let y=0;y<16;y++)for(let x=0;x<64;x++){const r=hsh(seed+'c'+x+'_'+y);const col=x>54&&y<9&&r<.75?A.body:pal[Math.floor(hsh(seed+'p'+x+'_'+y)*pal.length)];g.fillStyle=col;g.fillRect(x*8+1+r*1.5,y*8+2,5,5);g.fillStyle=r<.5?'#c9a27c':'#8a5a3c';g.fillRect(x*8+2+r*1.5,y*8,3,2.5)}
  const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t}
function r3Ads(T,kits){const c=document.createElement('canvas');c.width=1024;c.height=64;const g=c.getContext('2d');const TH=typeof MTH!=='undefined'&&MTH;const cols=TH?[TH.b,kits[0].body,TH.a,'#10151c']:[kits[0].body,'#10151c',kits[0].body,'#f2f2f2'];const txt=TH?[TH.n,'WORLD FOOTBALL MANAGER',TH.n,'WFM 26/27']:['WORLD FOOTBALL MANAGER','월드 풋볼매니저','WFM 26/27','FOOTBALL · DATA · PASSION'];
  for(let i=0;i<4;i++){g.fillStyle=cols[i];g.fillRect(i*256,0,256,64);g.fillStyle=r3Trim(T,cols[i]);g.font='bold 26px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(txt[i],i*256+128,33)}
  const t=new T.CanvasTexture(c);t.wrapS=T.RepeatWrapping;return t}
function r3Stadium(T,sc,kits,seats,night){const tiers=seats<15000?1:seats<38000?2:3;const roof=seats>=42000;const cr=r3Crowd(T,kits,'h'+seats);
  const conM=new T.MeshStandardMaterial({color:'#3a414b',roughness:.95}),roofM=new T.MeshStandardMaterial({color:night?'#1a1f27':'#cfd6de',roughness:.8,side:T.DoubleSide});
  // 변: [중심 x,z, 길이, 회전(바깥 방향)]
  const sides=[[0,-38.5,116,0],[0,38.5,116,Math.PI],[-60.5,0,72,Math.PI/2],[60.5,0,72,-Math.PI/2]];
  sides.forEach(([x,z,len,ry],si)=>{const G=new T.Group();G.position.set(x,0,z);G.rotation.y=ry;sc.add(G);
    for(let i=0;i<tiers;i++){const d0=1.5+i*7.5,h0=.8+i*6;const m=cr.clone();m.needsUpdate=true;m.repeat.set(len/26,1);const seat=new T.MeshStandardMaterial({map:m,roughness:1});
      const pl=new T.Mesh(new T.PlaneGeometry(len,8.2),seat);pl.position.set(0,h0+2.3,-(d0+3.4));pl.rotation.x=-Math.PI/2+.62;G.add(pl);
      const fr=new T.Mesh(new T.BoxGeometry(len,1,.4),conM);fr.position.set(0,h0+.2,-d0);G.add(fr)}
    const top=.8+tiers*6,back=1.5+tiers*7.5;const w=new T.Mesh(new T.BoxGeometry(len,top+2,1),conM);w.position.set(0,(top+2)/2,-(back+.5));G.add(w);
    if(roof){const rf=new T.Mesh(new T.PlaneGeometry(len,back+4),roofM);rf.position.set(0,top+5,-(back/2-1));rf.rotation.x=Math.PI/2-.08;G.add(rf)}
    // 광고판
    if(si<2||true){const ad=r3Ads(T,kits);ad.repeat.set(len/40,1);const b=new T.Mesh(new T.BoxGeometry(len-6,.9,.12),new T.MeshStandardMaterial({map:ad,roughness:.6,emissive:night?'#ffffff':'#000000',emissiveMap:night?ad:null,emissiveIntensity:night?.35:0}));b.position.set(0,.45,si<2?3:5.5);G.add(b)}});
  // 코너: 낮은 콘크리트 블록
  [[-60.5,-38.5],[60.5,-38.5],[-60.5,38.5],[60.5,38.5]].forEach(([x,z])=>{const m=new T.Mesh(new T.BoxGeometry(8,4+tiers*3,8),conM);m.position.set(x+Math.sign(x)*2,(4+tiers*3)/2,z+Math.sign(z)*2);sc.add(m)});
  if(night){const lm=new T.MeshStandardMaterial({color:'#ffffff',emissive:'#fffbe8',emissiveIntensity:1.6}),pm=new T.MeshStandardMaterial({color:'#59606b',roughness:.7});const H=Math.max(28,10+tiers*9);
    [[-62,-43],[62,-43],[-62,43],[62,43]].forEach(([x,z])=>{const p=new T.Mesh(new T.CylinderGeometry(.35,.5,H,8),pm);p.position.set(x,H/2,z);sc.add(p);const pn=new T.Mesh(new T.BoxGeometry(5,3,.4),lm);pn.position.set(x*.985,H+1,z*.985);pn.lookAt(0,0,0);sc.add(pn)})}}
function r3LeftFoot(id,weak){let p=null;try{p=pl(+id)}catch(e){}const f=p&&p.foot;const left=f==='left'?true:f==='both'?hsh('ft'+id)<.5:false;return weak?!left:left}
function r3Open(rep){if(!rep)return;if(!r3LoadThree()){toast('3D 엔진을 불러오지 못했습니다');return}if(!R3.model&&!R3.mfail){toast('3D 선수 모델 준비 중…');setTimeout(()=>r3LoadModel(()=>r3Open(rep)),30);return}const T=window.THREE;const wasP=M.paused;M.paused=true;clearTimeout(M.timer);
  const ov=document.createElement('div');ov.id='r3ov';const TH=typeof MTH!=='undefined'&&MTH;ov.style.cssText=`position:fixed;inset:0;z-index:9999;background:${TH?TH.b:'#05080d'};touch-action:none`;document.body.appendChild(ov);
  const e=rep.e,sideN=s=>CLUBS[s===0?M.fx.h:M.fx.a].short;
  ov.innerHTML=`<div style="position:absolute;left:0;right:0;top:0;padding:10px 14px;z-index:2;background:linear-gradient(#000c,#0000);color:#fff;font:600 15px/1.3 sans-serif;pointer-events:none">${TH?`<div style="display:inline-flex;align-items:center;gap:5px;font:700 10px/1 sans-serif;letter-spacing:.06em;color:${TH.a};margin-bottom:4px"><i style="width:6px;height:6px;border-radius:50%;background:${TH.a}"></i>${esc(TH.n)}</div>`:''}<div style="font-size:12px;opacity:.75">${e.m}' · ${sideN(e.s)}${rep.sc?` · ${rep.sc[0]}-${rep.sc[1]}`:''}</div>${r3Lab(e)} · ${esc(e.p)}${e.a?` <span style="opacity:.75;font-weight:400">(도움 ${esc(e.a)})</span>`:''}${e.gk?` <span style="opacity:.75;font-weight:400">— ${esc(e.gk)}</span>`:''}${e.xg!=null?` <span style="opacity:.6;font-weight:400">xG ${e.xg}</span>`:''}</div>
   <div id="r3diag" style="position:absolute;left:10px;bottom:96px;z-index:2;color:#9aa6b5;font:500 10px/1.3 sans-serif;pointer-events:none;opacity:.8"></div>
   <div id="r3slow" style="position:absolute;right:14px;top:${TH?76:58}px;z-index:2;color:${TH?TH.a:'#F0B429'};font:700 12px sans-serif;display:none">슬로모션</div>
   <div style="position:absolute;left:0;right:0;bottom:0;padding:10px 10px calc(10px + env(safe-area-inset-bottom));z-index:2;display:flex;gap:6px;flex-wrap:wrap;justify-content:center;background:linear-gradient(#0000,#000c)">
   ${[['auto','자동'],['tv','중계'],['goal','골대 뒤'],['chase','추적'],['sky','공중']].map(([k,l])=>`<button class="chip" data-r3cam="${k}" aria-pressed="${k==='auto'}" style="color:#fff">${l}</button>`).join('')}
   <button class="chip" data-r3spd style="color:#fff">1배속</button><button class="chip" data-r3re style="color:#fff">다시</button><button class="chip" data-r3x style="color:#fff;border-color:${TH?TH.a:'#F0B429'}">닫기</button></div>`;
  const ren=new T.WebGLRenderer({antialias:true});let fpsN=0,fpsT=performance.now(),fpsV=0;ren.setPixelRatio(Math.min(window.devicePixelRatio||1,2));ren.setSize(innerWidth,innerHeight);ren.shadowMap.enabled=true;ren.shadowMap.type=T.PCFSoftShadowMap;ov.appendChild(ren.domElement);
  const night=r3Night(M.fx);const SKY=night?'#070d18':'#9cc3e6';const sc=new T.Scene();sc.background=new T.Color(SKY);sc.fog=new T.Fog(SKY,110,230);
  const cam=new T.PerspectiveCamera(45,innerWidth/innerHeight,.1,400);
  const envOn=typeof chEnv==='function'&&chEnv(T,ren,sc,night);sc.add(new T.HemisphereLight(night?'#c9d8ff':'#dfeeff','#2a4a2c',night?.75:envOn?.5:1.15));const sun=new T.DirectionalLight(night?'#f4f8ff':'#ffffff',night?1.15:1.35);sun.position.set(night?-20:30,60,night?-30:25);if(night){[[60,40],[-60,40],[60,-40]].forEach(([x,z])=>{const L=new T.DirectionalLight('#eef3ff',.28);L.position.set(x,45,z);sc.add(L)})}sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-70,right:70,top:50,bottom:-50,near:10,far:160});sc.add(sun);
  const pitchM=new T.MeshStandardMaterial({map:r3PitchTex(T),roughness:.95});if(typeof chPitch==='function')chPitch(T,pitchM);const pitch=new T.Mesh(new T.PlaneGeometry(115,78),pitchM);pitch.rotation.x=-Math.PI/2;pitch.receiveShadow=true;sc.add(pitch);
  // 관중석
  const stM=new T.MeshStandardMaterial({color:'#18222e',roughness:1}),crM=new T.MeshStandardMaterial({color:'#2a3646',roughness:1});
  // 골대
  const wm=new T.MeshStandardMaterial({color:'#ffffff',roughness:.4}),net=new T.MeshBasicMaterial({color:'#ffffff',wireframe:true,transparent:true,opacity:.35});
  [[0,-1],[105,1]].forEach(([gx,d])=>{const X=gx-52.5;[-3.66,3.66].forEach(z=>{const p=new T.Mesh(new T.CylinderGeometry(.06,.06,2.44,8),wm);p.position.set(X,1.22,z);p.castShadow=true;sc.add(p)});
    const cb=new T.Mesh(new T.CylinderGeometry(.06,.06,7.32,8),wm);cb.rotation.x=Math.PI/2;cb.position.set(X,2.44,0);sc.add(cb);
    const back=new T.Mesh(new T.PlaneGeometry(7.32,2.44,14,5),net);back.position.set(X+d*1.6,1.22,0);back.rotation.y=Math.PI/2;sc.add(back);
    const top=new T.Mesh(new T.PlaneGeometry(1.6,7.32,3,14),net);top.rotation.x=-Math.PI/2;top.position.set(X+d*.8,2.44,0);sc.add(top);
    [-3.66,3.66].forEach(z=>{const sd=new T.Mesh(new T.PlaneGeometry(1.6,2.44,3,5),net);sd.position.set(X+d*.8,1.22,z);sc.add(sd)})});
  // 선수
  const lum=c=>{const x=new T.Color(c);return .3*x.r+.59*x.g+.11*x.b};const kits=r3Kits(T,M.fx.h,M.fx.a);kits[0].gkc='#E8C547';kits[1].gkc='#9C6ADE';
  const shirtMats=[r3ShirtMat(T,kits[0]),r3ShirtMat(T,kits[1])];r3Stadium(T,sc,kits,typeof finSeats==='function'?finSeats(M.fx.h):30000,night);
  const P={};const ids=Object.keys(rep.fr[0].p);let actors={sh:null,gk:null,as:null};
  ids.forEach(id=>{const r=rep.ros[id]||{s:0,gk:false,n:''};const g=R3.model?r3PlayerSk(T,kits[r.s],r.gk,r3Look(+id),r.gk?1:2+Math.floor(hsh('no'+id)*27)):r3Player(T,kits[r.s],r.gk,r3Look(+id),shirtMats[r.s]);sc.add(g);P[id]={g,r};
    if(r.n===e.p)actors.sh=P[id];if(e.a&&r.n===e.a)actors.as=P[id];if(e.gk&&r.n===e.gk)actors.gk=P[id];
    if(r.n===e.p||r.n===e.a||(e.gk&&r.n===e.gk)){const lb=r3Label(T,shortN(r.n),r.n===e.p?'#F0B429':'#fff');lb.position.y=2.35;g.add(lb)}});
  if(!actors.gk){const gid=ids.find(id=>rep.ros[id]&&rep.ros[id].gk&&rep.ros[id].s!==e.s);if(gid)actors.gk=P[gid]}
  const bm=new T.MeshStandardMaterial({color:'#f2f2f2',roughness:.45});bm.onBeforeCompile=sh=>{sh.vertexShader='varying vec3 vON;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvON=normalize(position);');
    sh.fragmentShader='varying vec3 vON;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float g=1.618034;vec3 V[12];V[0]=vec3(0.,1.,g);V[1]=vec3(0.,1.,-g);V[2]=vec3(0.,-1.,g);V[3]=vec3(0.,-1.,-g);V[4]=vec3(1.,g,0.);V[5]=vec3(1.,-g,0.);V[6]=vec3(-1.,g,0.);V[7]=vec3(-1.,-g,0.);V[8]=vec3(g,0.,1.);V[9]=vec3(g,0.,-1.);V[10]=vec3(-g,0.,1.);V[11]=vec3(-g,0.,-1.);
    float m1=-2.,m2=-2.,m3=-2.;for(int i=0;i<12;i++){float d=dot(normalize(vON),normalize(V[i]));if(d>m1){m3=m2;m2=m1;m1=d;}else if(d>m2){m3=m2;m2=d;}else if(d>m3)m3=d;}
    float q=m1-m2;if(q>.3)diffuseColor.rgb=vec3(.05);else if(q>.285||(q<.3&&m2-m3<.012))diffuseColor.rgb=vec3(.45);`)};
  const ball=new T.Mesh(new T.SphereGeometry(.2,24,18),bm);ball.castShadow=true;sc.add(ball);
  const bsh=new T.Mesh(new T.CircleGeometry(.24,16),new T.MeshBasicMaterial({color:'#000',transparent:true,opacity:.35}));bsh.rotation.x=-Math.PI/2;bsh.position.y=.02;sc.add(bsh);
  // 보간(캣멀롬)
  let fr=rep.fr;const es=e.sec;const H2D=fr.some(f=>f.h2);/* v124 후반 장면은 진영이 바뀌어 기록됨 → 공격 방향 반전 */let cel=null;
  // v105: ① 세트피스 대기 등으로 몇 초간 아무도 안 움직이는 앞부분은 1.5초만 남기고 자름
  try{const same=(f,g)=>Object.keys(f.p).every(id=>!g.p[id]||Math.abs(f.p[id][0]-g.p[id][0])+Math.abs(f.p[id][1]-g.p[id][1])<.05)&&Math.abs(f.b[0]-g.b[0])+Math.abs(f.b[1]-g.b[1])<.05;
    let i=1;while(i<fr.length&&fr[i].t<es-1&&same(fr[0],fr[i]))i++;if(i>4&&fr[i-1].t-fr[0].t>2){fr=fr.slice(Math.max(0,i-4))}}catch(er){}
  // ② 순간이동 보정: 엔진이 세트피스·경합에서 선수를 목표 지점으로 바로 옮기는 경우(0.5초에 4.5m 초과 = 9m/s 초과) 이전 프레임들에 나눠 달려오게 함(슈팅 순간까지만)
  try{fr=fr.map(f=>Object.assign({},f,{p:Object.assign({},f.p)}));const ids0=Object.keys(fr[0].p);
    for(const id of ids0){for(let i=1;i<fr.length;i++){if(fr[i].t>es)break;const a=fr[i-1].p[id],c=fr[i].p[id];if(!a||!c)continue;const d=Math.hypot(c[0]-a[0],c[1]-a[1]),dt=fr[i].t-fr[i-1].t||.5;if(d<=9*dt||d>40)continue;
      const k=Math.min(i,Math.ceil(d/(7*dt)));const j=i-k;const s0=fr[j].p[id];if(!s0)continue;for(let q=j+1;q<i;q++){const u=(q-j)/k;fr[q].p[id]=[s0[0]+(c[0]-s0[0])*u,s0[1]+(c[1]-s0[1])*u]}}}}catch(er){console.error(er)}
  // 페널티킥(v87): 엔진은 키커만 순간이동시키므로(주변 선수는 파울 위치 그대로) 장면을 합성 — 다른 선수는 박스 밖, GK는 골라인, 키커는 2.6m 도움닫기
  if(e.type==='pen'){const f0=fr.filter(f=>f.t<es);const lf=f0[f0.length-1]||fr[0];const dg=((e.s===0)!==H2D?1:-1);const spot=dg>0?94:11,gl=dg>0?105:0;const ros=rep.ros;
    const ids0=Object.keys(lf.p);const kId=ids0.find(id=>ros[id]&&ros[id].n===e.p);const kS=kId?ros[kId].s:e.s;const gkId=ids0.find(id=>ros[id]&&ros[id].gk&&ros[id].s!==kS);
    const out=ids0.filter(id=>id!==kId&&id!==gkId&&!(ros[id]&&ros[id].gk)).sort((a,b)=>hsh('pk'+a)-hsh('pk'+b));const base={};
    out.forEach((id,i)=>{const y=17+i*(34/Math.max(1,out.length-1));const inArc=Math.abs(y-34)<8;base[id]=[gl-dg*((inArc?22.5:18.8)+(i%2)*1.4),y]});
    ids0.forEach(id=>{if(base[id])return;const r=ros[id]||{};if(id===kId)base[id]=[spot-dg*2.6,34.6];else if(id===gkId)base[id]=[gl-dg*.3,34];else base[id]=[dg>0?6:99,34]});
    const syn=[];for(let k=8;k>=0;k--){const tt=es-k*.5;const P2={};ids0.forEach(id=>{const q=base[id];let x=q[0],y=q[1];if(id===kId&&tt>es-1.05){const u=Math.min(1,(tt-(es-1.05))/1.05);x=q[0]+dg*2.3*u;y=q[1]-.5*u}else if(id!==gkId){x+=(hsh(id+'jx'+k)-.5)*.08;y+=(hsh(id+'jy'+k)-.5)*.08}P2[id]=[+x.toFixed(2),+y.toFixed(2)]});syn.push({t:tt,b:[spot,34,0],o:null,p:P2})}
    if(e.t!=='goal'){const sv=e.t==='save';const side=hsh('pks'+es)<.5?-1:1;for(let k=1;k<=5;k++){const tt=es+k*.5,u=Math.min(1,k*.5/.45);const P2=Object.assign({},syn[syn.length-1].p);
      const tx=sv?gl-dg*(.6+k*.9):gl+dg*2.5,ty=sv?34+side*(2.2+k*.5):34+side*(4.6+k*.4);syn.push({t:tt,b:[spot+(tx-spot)*u,34+(ty-34)*u,sv?(k<2?.7:.1):1.3*(1-k*.15)],o:null,p:P2})}}
    fr=syn}
  // v97: 크로스·코너 헤더/발리 — 엔진 프레임은 0.5초 간격이라 크로스가 슈터 머리를 거치지 않고 바로 골로 감 → 마지막 배달(킥 태그 또는 소유 프레임)에서 슈터의 접촉점(머리 2.05m, 낮은 크로스는 0.45m)까지 포물선을 합성하고, es에 접촉 프레임을 둠
  const aerK=/^(header|corner|cross|fkx|lowcross)$/.test(e.type||'');let aerC=null;
  if(aerK){try{const fE=fr.find(f=>f.t>=es);const shI=fE&&Object.keys(fE.p).find(id=>rep.ros[id]&&rep.ros[id].n===e.p);const C=shI&&fE.p[shI];
    if(C){const hc=e.type==='lowcross'?.45:2.05;let di=-1;for(let i=fr.length-1;i>=0;i--){const f=fr[i];if(f.t>=es)continue;if(f.t<es-4.5)break;if((f.o!=null&&String(f.o)!==shI)||(f.g||[]).some(g=>g[0]==='kk'&&String(g[1])!==shI)){di=i;break}}
      if(di<0){di=fr.findIndex(f=>f.t>=es-1.5);if(di<0)di=0}
      const f0=fr[di],b0=f0.b,ta=f0.t,T=Math.max(.5,es-ta),dist=Math.hypot(C[0]-b0[0],C[1]-b0[1]);const pk=e.type==='lowcross'?Math.min(.9,dist*.04):Math.max(2.5,Math.min(7,dist*.2));
      if(f0.o!=null&&!(f0.g||[]).some(g=>g[0]==='kk')){fr[di]=Object.assign({},f0,{g:(f0.g||[]).concat([['kk',f0.o,'cross',1,0]])})}
      fr=fr.map((f,i)=>{if(i<=di||f.t>es)return f;const u=Math.min(1,(f.t-ta)/T);const b=f.t>=es?[C[0],C[1],hc]:[b0[0]+(C[0]-b0[0])*u,b0[1]+(C[1]-b0[1])*u,(b0[2]||0)*(1-u)+hc*u+4*pk*u*(1-u)];return Object.assign({},f,{b,o:null})});
      if(!fr.some(f=>f.t===es)){const i=fr.findIndex(f=>f.t>es);const cf={t:es,b:[C[0],C[1],hc],o:null,p:fE.p};if(i<0)fr.push(cf);else fr.splice(i,0,cf)}
      aerC={x:C[0],y:C[1],h:hc,p:fr.find(f=>f.t===es).p,ta,k0:[b0[0]-52.5,b0[1]-34],cn:Math.abs(b0[1]-34)>29&&Math.abs(b0[0]-52.5)>46}}}catch(er){console.error(er)}}
  // v94: 골 순간(es) 프레임은 엔진이 이미 킥오프 위치로 공을 되돌린 뒤라 공이 센터(52.5,34)에 있음 → 이전엔 그 위치에서 '센터 기준 가까운 골대(항상 x=0)'로 공을 날려
  // 반대편 골문으로 들어가는 장면이 나옴. 이제 슛 직전 프레임(t<es)의 공·슈터 위치에서, 득점 팀의 공격 방향(팀0 → x=105, 팀1 → x=0, 엔진은 하프타임에 진영 안 바꿈)으로
  if(e.t==='goal'){const pre=fr.filter(f=>f.t<es);const lf=pre[pre.length-1]||fr[0];const shI=Object.keys(lf.p).find(id=>rep.ros[id]&&rep.ros[id].n===e.p);const fE=fr.find(f=>f.t>=es);const sp=shI&&fE&&fE.p[shI];
    const pb=e.type==='pen'?(fr.find(f=>f.t===es)||{}).b:null;const sx=pb?pb[0]:sp?sp[0]:lf.b[0],sy=pb?pb[1]:sp?sp[1]:lf.b[1];const dg=((e.s===0)!==H2D?1:-1);const gx=dg>0?105.7:-.7,gy=e.type==='pen'?34+(hsh('pks'+es)<.5?-1:1)*(1.6+hsh('pky'+es)*1.7):Math.max(30.8,Math.min(37.2,sy+(34-sy)*.25+(hsh(e.p+es)-.5)*4)),hh=.4+hsh(es+'h')*1.6;
    const dist=Math.hypot(gx-sx,gy-sy),dur=Math.max(.5,dist/26);
    // 골 세리머니(v86): 득점자는 가까운 코너 쪽으로 달려가고, 같은 팀 동료는 득점자에게 모여듦. 상대 선수는 멈춤
    const ros=rep.ros;const shId=Object.keys(lf.p).find(id=>ros[id]&&ros[id].n===e.p);const myS=shId?ros[shId].s:e.s;const cx=dg>0?100:5,cy=sy<34?4:64;
    const pos={};Object.keys(lf.p).forEach(id=>pos[id]=[...((aerC&&aerC.p[id])||lf.p[id])]);const mv=(p,tx,ty,st)=>{const dx=tx-p[0],dy=ty-p[1],d=Math.hypot(dx,dy);if(d>.05){const k=Math.min(d,st)/d;p[0]+=dx*k;p[1]+=dy*k}};
    const syn=[];for(let k=1;k<=11;k++){const tt=es+k*.5,u=Math.min(1,k*.5/dur);
      if(shId&&k>=2)mv(pos[shId],cx,cy,k<4?2.4:3.3);
      Object.keys(pos).forEach(id=>{const r=ros[id];if(!r||id===shId||r.gk)return;if(r.s===myS&&shId&&k>=3){const q=pos[shId];const a=hsh('c'+id)*6.283,rr=1.1+hsh('r'+id)*1.4;mv(pos[id],q[0]+Math.cos(a)*rr,q[1]+Math.sin(a)*rr,2.9)}
        else if(r.s!==myS&&k<=2){const p0=pre.length>1?pre[pre.length-2].p[id]:null;if(p0){const p=pos[id];p[0]+=(lf.p[id][0]-p0[0])*.35/k;p[1]+=(lf.p[id][1]-p0[1])*.35/k}}});
      const P2={};Object.keys(pos).forEach(id=>P2[id]=[+pos[id][0].toFixed(2),+pos[id][1].toFixed(2)]);
      syn.push({t:tt,b:[sx+(gx-sx)*u,sy+(gy-sy)*u,u<1?(aerC?aerC.h*(1-u)+hh*.4*u:hh*4*u*(1-u)+hh*u*u*.5):(aerC?hh*.3:hh*.5)],o:null,p:P2,cel:1})}
    const fEs=fr.find(f=>f.t===es);const kb=e.type==='pen'&&fEs?fEs.b:[sx,sy,0];const kp=(fE&&!(Math.abs(fE.b[0]-52.5)<.01&&Math.abs(fE.b[1]-34)<.01)?fE.p:lf.p);fr=pre.concat(aerC?[{t:es,b:[aerC.x,aerC.y,aerC.h],o:null,p:aerC.p}]:[{t:es,b:[kb[0],kb[1],0],o:null,p:kp}],syn);cel={id:shId,s:myS}}
  // 빗나간 슛(v94): 엔진은 슛 직후 골킥 위치로 공을 옮겨 공이 순간이동 → 슈터 발끝에서 골대 옆으로 지나가는 궤적을 합성(이후 2.5초)
  if(e.t==='miss'&&e.type!=='pen'){const pre=fr.filter(f=>f.t<es);const lf=pre[pre.length-1]||fr[0];const shI=Object.keys(lf.p).find(id=>rep.ros[id]&&rep.ros[id].n===e.p);const fE=fr.find(f=>f.t>=es);const sp=shI&&fE&&fE.p[shI]||lf.b;
    const dg=((e.s===0)!==H2D?1:-1),gl=dg>0?106.5:-1.5,side=hsh('ms'+es)<.5?-1:1,over=hsh('mo'+es)<.35;const ty=over?34+side*(1+hsh('my'+es)*2.5):34+side*(4.4+hsh('my'+es)*3),hh=over?2.9:.4+hsh('mh'+es)*1.2;
    /* v249 크로스바 위로 넘어간 슛: 끝점이 골문 폭 안·골라인 뒤 낮은 높이라 3D에서 공이 골망 안에 있는 것처럼 보였음 → 골망 위로 넘어가 뒤쪽으로 빠지게 */const gl2=over?gl+dg*3.5:gl;const ul=Math.max(.3,Math.min(.95,Math.abs((dg>0?105:0)-sp[0])/Math.max(1,Math.abs(gl2-sp[0]))));const dur=Math.max(.45,Math.hypot(gl2-sp[0],ty-sp[1])/27);fr=pre.concat(fr.filter(f=>f.t>=es).map(f=>{const u=Math.min(1,(f.t-es)/dur);return Object.assign({},f,{o:null,g:null,b:[sp[0]+(gl2-sp[0])*u,sp[1]+(ty-sp[1])*u,u<1?(over?Math.max(aerC?aerC.h*(1-u):0,3.1*Math.min(1,u/ul)):(aerC?aerC.h*(1-u)+hh*u:hh*u+(e.type==='header'?1.5*(1-u):0))):(over?2.7:hh*.3)]})}))}
  const t0=fr[0].t,tE=fr[fr.length-1].t;const cr=(p0,p1,p2,p3,k)=>{const k2=k*k,k3=k2*k;return .5*((2*p1)+(-p0+p2)*k+(2*p0-5*p1+4*p2-p3)*k2+(-p0+3*p1-3*p2+p3)*k3)};
  const idxAt=t=>{let i=0;while(i<fr.length-2&&fr[i+1].t<=t)i++;return i};
  const at=(t,get)=>{const i=idxAt(t);const f1=fr[i],f2=fr[Math.min(fr.length-1,i+1)],f0=fr[Math.max(0,i-1)],f3=fr[Math.min(fr.length-1,i+2)];const k=f2.t>f1.t?Math.max(0,Math.min(1,(t-f1.t)/(f2.t-f1.t))):0;
    const a=get(f0),b=get(f1),c=get(f2),d=get(f3);if(!b)return null;return b.map((_,j)=>cr((a||b)[j],b[j],(c||b)[j],(d||c||b)[j],k))};
  // 공격 방향: 슈팅 순간 공 위치로 판정
  const bEnd=fr[fr.length-1].b,bS=at(es,f=>f.b)||bEnd;const dir=((e.s===0)!==H2D?1:-1),gX=(dir>0?105:0)-52.5;
  // 동작 일정(v86): 엔진이 남긴 킥(패스·롱패스·크로스·걷어내기)·태클·파울 태그 → 해당 선수가 공이 떠나는 순간에 맞춰 킥/태클/넘어짐 동작
  const SCH={};const addS=(id,o)=>{(SCH[id]||(SCH[id]=[])).push(o)};
  if(R3.model){const CL=R3.model.clips,OFF={pass:.47,shoot:.2,tackle:.62}/* v153 클립 발 속도 최고점(접촉) 실측: shoot .20·pass .47·shootRun .47초 */;
    fr.forEach((f,fi)=>{(f.g||[]).forEach(g=>{const tg=f.t,r=rep.ros[g[1]];
      if(g[0]==='kk'&&g[5]==='thr'){const imp=tg-.5;if(SCH[g[1]]&&SCH[g[1]].some(x=>Math.abs(x.imp-imp)<1))return;const nx=fr[Math.min(fr.length-1,fi+1)].b;addS(g[1],{k:'throw',s:imp-1.1,e:imp+.45,imp,tx:[nx[0]-52.5,nx[1]-34]});return}
      if(g[0]==='kk'){if(r&&r.n===e.p&&tg>es-1)return;const k=(g[2]==='long'||g[2]==='cross'||g[2]==='clear'||g[2]==='fkd'||g[3]>=.9)?'shoot':'pass';if(!CL[k])return;const imp=tg-(g[4]!=null?g[4]:.5);if(SCH[g[1]]&&SCH[g[1]].some(x=>Math.abs(x.imp-imp)<1))return;const nx=fr[Math.min(fr.length-1,fi+1)].b;addS(g[1],{k,s:imp-OFF[k],e:imp-OFF[k]+CL[k].duration,imp,tx:[nx[0]-52.5,nx[1]-34]})}
      else if(g[0]==='bk'&&CL.tackle){/* v228 몸으로 막기(슈팅 블록·패스 차단): 태클 클립 앞부분(다리를 뻗어 뛰어드는 0.2~0.55초)만 쓰고 그 자세로 잠깐 버팀 */if(SCH[g[1]]&&SCH[g[1]].some(x=>Math.abs(x.imp-tg)<1.5))return;addS(g[1],{k:'tackle',s:tg-.35,e:tg+.45,imp:tg,face:g[2],t0:.2,hold:.48})}
      else if((g[0]==='tk'||g[0]==='fo'||g[0]==='tm')&&CL.tackle){if(f.g.some(q=>q[0]==='kk'&&q[1]===g[1]))return;if(SCH[g[1]]&&SCH[g[1]].some(x=>Math.abs(x.imp-tg)<2))return;const imp=tg-.3;
        /* v228 서서 발 뻗는 태클: 슬라이딩은 성공 태클 30%·헛태클 15%·파울 50%만, 나머지는 패스 킥 동작의 스윙 부분(발로 공 찌르기) */const hz=((Math.floor(tg*10)*31+(+g[1]||0))%100)/100;const slide=g[0]==='fo'?hz<.5:g[0]==='tk'?hz<.3:hz<.15;
        if(!slide&&CL.pass&&g[0]!=='fo'){addS(g[1],{k:'pass',s:imp-OFF.pass,e:imp+.28,imp,face:g[2]});return}
        addS(g[1],{k:'tackle',s:imp-OFF.tackle,e:imp-OFF.tackle+Math.min(2.6,CL.tackle.duration-.02),imp,face:g[2]});
        if(g[0]==='fo'&&CL.trip){addS(g[2],{k:'trip',s:imp-.2,e:imp+2.4,imp});if(CL.standup)addS(g[2],{k:'standup',s:imp+2.4,e:imp+2.4+CL.standup.duration,imp:imp+2.4})}}})})}
  // 공중볼 경합(v87): 헤더 슈팅이면 슈터와 가장 가까운 상대 필드 선수도 같은 순간 점프 헤더
  const aerialE=/^(header|corner|cross|fkx)$/.test(e.type||'');let duelId=null;if(aerialE&&actors.sh){const shId=ids.find(id=>P[id]===actors.sh);const fE=fr[idxAt(es)];const q=shId&&fE.p[shId];if(q){let bd=4;ids.forEach(id=>{const r=rep.ros[id];if(!r||r.gk||r.s===e.s)return;const w=fE.p[id];if(!w)return;const d=Math.hypot(w[0]-q[0],w[1]-q[1]);if(d<bd){bd=d;duelId=id}})}}
  const evOf=(id,t)=>{const L=SCH[id];if(!L)return null;for(const x of L)if(t>=x.s&&t<=x.e)return x;return null};
  let mode='auto',spd=1,t=t0,last=performance.now(),raf=0,done=false;const cp=new T.Vector3(),lk=new T.Vector3(),cpS=new T.Vector3(),lkS=new T.Vector3();let first=true;
  const camFor=(m,bx,bz,by)=>{const fo=window.__r3&&window.__r3.focus;if(fo&&P[fo]){const o=P[fo].g.position;cp.set(o.x+4,2.2,o.z+4);lk.set(o.x,.9,o.z);return}
    const por=innerHeight>innerWidth*1.2;if(m==='auto'){if(cel&&cel.id&&P[cel.id]&&t>es+1.7)m='cel';else m=t>es-2.2&&!aerC?'goal':'tv'}
    if(m==='cel'){const o=P[cel.id].g.position;const L0=Math.hypot(o.x,o.z)||1;cp.set(o.x-o.x/L0*8,3.2,o.z-o.z/L0*8);lk.set(o.x,1.1,o.z)}
    // 공 중심(v92, 사용자 요청): 모든 카메라가 공을 화면 가운데에 두도록 바라보는 점 = 공
    else if(m==='tv'&&((Math.abs(bz)>29&&Math.abs(bx)>46&&by<.5)||(aerC&&aerC.cn&&t>=aerC.ta-.5&&t<es+1.6))){/* v97 코너킥 카메라: 코너 뒤 높은 곳에서 크로스가 향하는 접촉점(헤더 지점, 모르면 페널티 스폿 앞) 쪽을 바라봄 → 키커·공 궤적·박스·골대가 한 줄로 화면에 */const gx0=(bx>0?52.5:-52.5),dd=bx>0?1:-1;const k0=aerC&&aerC.cn?aerC.k0:[bx,bz];const cx=aerC&&aerC.cn?aerC.x-52.5:gx0-dd*4.5,cz=aerC&&aerC.cn?aerC.y-34:0;let vx=cx-k0[0],vz=cz-k0[1];const vl=Math.hypot(vx,vz)||1;vx/=vl;vz/=vl;cp.set(Math.max(-57,Math.min(57,k0[0]-vx*5)),por?10:9,Math.max(-37.5,Math.min(37.5,k0[1]-vz*5)));lk.set(k0[0]+(cx-k0[0])*.5,.6,k0[1]+(cz-k0[1])*.5)}
    else if(m==='tv'){const cl=(v,a,b)=>Math.max(a,Math.min(b,v));const D=por?26:40,zmax=por?35:37,h0=por?13:17,av=Math.max(0,zmax-bz);const back=Math.sqrt(Math.max(0,D*D-av*av));/* v97: 공이 가까운 터치라인(코너킥 등)이면 관중석 쪽으로 더 물러날 수 없으므로 경기장 안쪽(공격 반대 방향)으로 비켜서 대각선으로 봄 */
      cp.set(cl(bx*(por?.92:.85)-dir*back,-48,48),h0+Math.max(0,(D-av))*.08,Math.min(zmax,bz+D));lk.set(bx,.3+by*.4,bz)}
    else if(m==='goal'){/* v97: 크로스 비행 중엔 공과 헤더 접촉점의 중간을 봐서 공이 높이 떠도 관중석만 보이지 않게 */let lx=bx,lz=bz,ly=.8+Math.min(by,3)*.5;if(aerC&&t<es){const w=.55;lx=bx*(1-w)+(aerC.x-52.5)*w;lz=bz*(1-w)+(aerC.y-34)*w;ly=.8+Math.min(by,3)*.3}cp.set(gX+dir*8.5,4.6,lz*.3);lk.set(lx,ly,lz)}
    /* v233 공중(사용자 요청): 전체 위치 파악용 높은 비스듬한 시점 — 가로 화면은 관중석 위 높은 곳에서 경기장 전체, 세로 화면은 경기장 길이가 화면 세로로 오도록 거의 위에서 */
    else if(m==='sky'){const asp=innerWidth/innerHeight;if(por){const h=Math.max(130,88/Math.max(.3,asp));cp.set(-h*.3,h,0);lk.set(0,0,0)}else{const k=Math.max(1,1.9/Math.max(1,asp));cp.set(bx*.1,82*k,44*k);lk.set(bx*.1,0,5)}}
    else{cp.set(bx-dir*11,5.5,bz*.85+(bz>0?-3:3));lk.set(bx+dir*4,.8+by*.3,bz)}};
  const RP={},RV={},CEN=[0,0];const SEP=.8;
  // 공 위치: 공을 가진 선수가 있으면 그 선수 발 앞(드리블 터치), 없으면 엔진 공 궤적
  const feet=id=>{const o=P[id]&&P[id].g;if(!o)return null;const ry=o.rotation.y,u=o.userData;const dr=.36+((u.dv||0)>1.2?.28*(.5+.5*Math.sin(t*9+(+id%7))):0);return [o.position.x+Math.cos(ry)*dr+52.5,o.position.z-Math.sin(ry)*dr+34,0]};
  const anc=j=>{const f=fr[Math.max(0,Math.min(fr.length-1,j))];if(f.o!=null&&P[f.o])return feet(f.o)||f.b;return f.b};
  /* v153 슈터가 슈팅 직전(es-1~es)에 공을 가진 경우만(원터치·헤더·PK 제외) */
  const kick=(()=>{try{if(e.type==='pen'||aerC||/^(header|corner|cross|fkx|lowcross)$/.test(e.type||''))return null;const id=ids.find(x=>rep.ros[x]&&rep.ros[x].n===e.p);if(!id)return null;let t0=null;for(const f of fr){if(f.t>=es)break;if(f.t>=es-1&&String(f.o)===String(id))t0=t0==null?f.t:t0}return t0==null?null:{id,t0,last:null}}catch(er){return null}})();
  const ballAt=tt=>{const i=idxAt(tt),f1=fr[i],f2=fr[Math.min(fr.length-1,i+1)];const k=f2.t>f1.t?Math.max(0,Math.min(1,(tt-f1.t)/(f2.t-f1.t))):0;
    if(f1.o!=null&&f1.o===f2.o&&P[f1.o])return feet(f1.o)||f1.b;const A=anc(i),B=anc(i+1);
    if(Math.abs(A[0]-B[0])+Math.abs(A[1]-B[1])+Math.abs((A[2]||0)-(B[2]||0))<.03)return A;
    if(f1.o!=null||f2.o!=null)return A.map((v,j)=>v+(B[j]-v)*k);const A0=anc(i-1),B3=anc(i+2);return A.map((v,j)=>cr(A0[j],v,B[j],B3[j],k))};
  const loop=now=>{if(done)return;raf=requestAnimationFrame(loop);let dt=Math.min(.05,(now-last)/1000);last=now;const slow=t>es-1.8&&t<es+1.2;$('#r3slow').style.display=slow?'block':'none';
    t+=dt*spd*(slow?.42:1);if(t>tE+.6){t=tE+.6}
    const tt=Math.min(t,tE);const dA=dt*spd*(slow?.42:1);const fi=idxAt(tt),psN=fr[fi].ps;
    // 1) 위치·속도(경기 시간 기준) 계산 후 겹침 방지
    ids.forEach(id=>{const q=at(tt,f=>f.p[id]);if(!q){RP[id]=null;return}const q2=at(Math.max(t0,tt-.15),f=>f.p[id])||q;RP[id]=[q[0]-52.5,q[1]-34];const vx=(q[0]-q2[0])/.15,vz=(q[1]-q2[1])/.15;RV[id]=[vx,vz,tt-.15<t0?0:Math.hypot(vx,vz)]});
    for(let it=0;it<3;it++)for(let a=0;a<ids.length;a++){const A=RP[ids[a]];if(!A)continue;for(let b2=a+1;b2<ids.length;b2++){const Bq=RP[ids[b2]];if(!Bq)continue;const dx=Bq[0]-A[0],dz=Bq[1]-A[1],d=Math.hypot(dx,dz);if(d<SEP){const kk=d>1e-4?(SEP-d)/2/d:0;const ux=d>1e-4?dx:.3,uz=d>1e-4?dz:.2;const k2=d>1e-4?kk:SEP/2/Math.hypot(ux,uz);A[0]-=ux*k2;A[1]-=uz*k2;Bq[0]+=ux*k2;Bq[1]+=uz*k2}}}
    const B0=at(tt,f=>f.b)||[52.5,34,0];{let sx=0,sz=0,n=0;ids.forEach(id=>{const R=RP[id];if(R&&!(rep.ros[id]&&rep.ros[id].gk)){sx+=R[0];sz+=R[1];n++}});if(n){CEN[0]=sx/n;CEN[1]=sz/n}}
    ids.forEach(id=>{const R=RP[id];if(!R)return;const o=P[id].g,X=R[0],Z=R[1];const [vx,vz,v]=RV[id];
      o.position.set(X,0,Z);const u=o.userData;u.dv=v;const r=rep.ros[id]||{};
      const isSh0=actors.sh&&actors.sh.g===o,isGk0=actors.gk&&actors.gk.g===o;const sx=evOf(id,t);
      // 바라보는 방향: 킥은 공이 갈 곳, 태클은 상대, 이동 중이면 이동 방향, 서 있으면 공
      const tbx=(B0[0]-52.5)-X,tbz=(B0[1]-34)-Z;let fx,fz,back=false;
      /* v161 슈팅하는 선수는 차기 전 1.2초~직후까지 공이 날아갈 곳을 봄(이전엔 발밑 공 쪽을 봐서 공이 몸 뒤에 있으면 뒤돌았다가 참) */
      const shB=isSh0&&t>es-1.2&&t<es+.3?at(Math.min(es+.6,tE),f=>f.b):null;
      if(shB&&Math.hypot((shB[0]-52.5)-X,(shB[1]-34)-Z)>1.5){fx=(shB[0]-52.5)-X;fz=(shB[1]-34)-Z}
      else if(sx&&sx.tx&&t<sx.imp+.1){fx=sx.tx[0]-X;fz=sx.tx[1]-Z}
      else if(sx&&sx.face&&RP[sx.face]){fx=RP[sx.face][0]-X;fz=RP[sx.face][1]-Z}
      else if(v>.6){fx=vx;fz=vz;if(!r.gk&&r.s!==psN&&v<4.6&&!(cel&&t>es)){const bl=Math.hypot(tbx,tbz)||1;if((vx*tbx+vz*tbz)/(v*bl)<-.25){back=true;fx=tbx;fz=tbz}}}
      else{fx=tbx;fz=tbz}
      if(Math.abs(fx)+Math.abs(fz)>.01){const ang=Math.atan2(-fz,fx);let d=ang-o.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));o.rotation.y+=d*Math.min(1,dt*(sx?14:8))}
      if(u.sk){let ev=null;
        if(isSh0){const hd=/^(header|corner|cross|fkx)$/.test(e.type||'');const k=hd?'header':e.type==='pen'?'pen':v>2.2?'shootRun':'shoot';const imp={header:.95,pen:.72,shootRun:.47,shoot:.2}[k];const st=es-imp,cl=R3.model.clips[k];const w0=k==='header'?es-.45:st,w1=k==='header'?es+.5:st+(cl?cl.duration:0)+.3;/* v104: 헤더 동작은 접촉 전후 0.45~0.5초만 — 그 밖에는 속도에 맞는 달리기 동작(저자세로 미끄러지던 문제) */if(cl&&t>=w0&&t<=w1)ev={k,time:t-st}}
        if(isGk0&&e.t!=='miss'){const bl=at(Math.min(es+.5,tE),f=>f.b)||[52.5,34,0];const dz=(bl[1]-34)-o.position.z;const hb=(at(Math.min(es+.35,tE),f=>f.b)||[0,0,0])[2];const k=e.t==='save'&&aerialE&&hb>1?'gkBlock':e.t==='save'&&Math.abs(dz)<1.3?'gkCatch':'gkDive';const st=es+.02,cl=R3.model.clips[k];
          if(cl&&t>=st&&t<=st+cl.duration){ev={k,time:t-st};if(k==='gkDive'){const want=dz>=0?1:-1;const lx=-Math.sin(o.rotation.y);const sideNow=R3.model.diveSign*(lx>=0?1:-1);u.inner.scale.x=Math.abs(u.inner.scale.x)*(sideNow===want?1:-1)}}}
        if(!ev&&id===duelId){const cl=R3.model.clips.header,st=es-.95-.06;if(cl&&t>=es-.5&&t<=es+.45)ev={k:'header',time:t-st}}
        if(!ev&&sx&&sx.k==='throw'){ev={k:'idle',time:0,thr:Math.max(0,Math.min(1,(t-sx.s)/(sx.e-sx.s))),thrImp:(sx.imp-sx.s)/(sx.e-sx.s)}}
        if(!ev&&sx){const cl=R3.model.clips[sx.k];if(cl)ev={k:sx.k,time:sx.hold!=null?Math.min(sx.hold,(sx.t0||0)+Math.max(0,t-sx.s)):Math.max(0,Math.min(t-sx.s,cl.duration-.001))}}
        if(ev){const a=r3Act(u,ev.k,{once:true,fade:.1});if(a){a.timeScale=0;a.time=Math.min(ev.time,a.getClip().duration-.001)}}
        /* v167 주발: 차는 동작(오른발 클립)을 왼발잡이는 좌우 반전, 슈팅은 엔진이 약발로 찼다고 기록하면 반대 발. 양발잡이는 선수별 고정 */
        if(ev&&/^(pass|shoot|shootRun|pen)$/.test(ev.k)&&!isGk0){const lf=r3LeftFoot(id,isSh0&&!!e.weak);u.inner.scale.x=Math.abs(u.inner.scale.x)*(lf?-1:1)}
        else{if(!isGk0)u.inner.scale.x=Math.abs(u.inner.scale.x);
          if(v>.6){const a=r3Act(u,back?'jogB':'jog',{fade:.22});if(a)a.timeScale=Math.max(.5,Math.min(3.2,v/(back?1.7:2)))}else{const a=r3Act(u,u.gk?'gkIdle':'idle',{fade:.3});if(a)a.timeScale=1}}
        try{u.mixer.update(dA)}catch(er){R3.aerr=String(er.message||er).slice(0,60)}o.position.y=0;/* v168 헤딩 점프: 접촉 0.35초 전~0.35초 뒤 포물선. 높이 = 접촉 순간 공 높이 − 1.6m(0.3~0.65m, 실제 공중볼 경합 점프 대략 0.3~0.7m), 헤딩 클립엔 점프가 없음 */if(ev&&ev.k==='header'&&t>es-.35&&t<es+.35){const hb=.2+Math.max(0,((at(es,f=>f.b)||[0,0,0])[2]||0))*1.05;const jh=Math.max(.3,Math.min(.65,hb-1.6));o.position.y=jh*Math.sin(Math.PI*(t-(es-.35))/.7)}
        // 득점자 비행기 세리머니: 팔을 옆으로 쭉 편 기본 자세로 서서히 덮어씀
        if(ev&&ev.thr!=null&&u.arms)r3Throw(u,ev.thr,ev.thrImp);
        if(cel&&id===cel.id&&t>es+1.1&&u.arms){const w=Math.min(1,(t-es-1.1)/.5);['LeftArm','RightArm','LeftForeArm','RightForeArm'].forEach(k=>{const A=u.arms[k];if(A)A.o.quaternion.slerp(A.q,w)})}
        return}
      const run=Math.min(1,v/6);u.ph+=dA*(4+v*1.7);
      let sw=Math.sin(u.ph)*.8*run;
      const isSh=isSh0,isGk=isGk0;
      u.legs.forEach((L,li)=>{const s0=li?sw:-sw;L.hip.rotation.z=s0;L.knee.rotation.z=Math.max(0,-s0)*1.1+run*.3});
      u.arms[0].rotation.z=sw*.7;u.arms[1].rotation.z=-sw*.7;u.arms[0].rotation.x=u.arms[1].rotation.x=0;
      o.rotation.x=0;o.position.y=Math.abs(Math.sin(u.ph))*.05*run;o.rotation.order='ZYX';o.rotation.z=0;
      // 킥(슈팅·패스 공통)
      const kk=isSh&&t>es-.5&&t<es+.35?{s:es-.5}:(sx&&(sx.k==='pass'||sx.k==='shoot')&&t>sx.imp-.5&&t<sx.imp+.35?{s:sx.imp-.5}:null);
      if(kk){const k=(t-kk.s)/.85;const L=u.legs[1];
        L.hip.rotation.z=k<.45?.9*(k/.45):.9-3*((k-.45)/.55)*1.6;L.knee.rotation.z=k<.45?1.3*(k/.45):Math.max(0,1.3-(k-.45)*4);
        u.legs[0].hip.rotation.z=-.15;u.legs[0].knee.rotation.z=.15;u.arms[0].rotation.z=.9;u.arms[1].rotation.z=-.9}
      // GK 다이빙(선방·실점 공통, 슈팅 직후)
      if(isGk&&t>es+.08&&t<es+1.6&&e.t!=='miss'){const k=Math.min(1,(t-es-.08)/.45);const side=((at(Math.min(es+.6,tE),f=>f.b)||[52.5,34])[1]-34)>=o.position.z?1:-1;
        o.rotation.x=side*1.25*k;o.position.y=Math.max(0,.25-.35*k);u.arms[0].rotation.x=side*2.4*k;u.arms[1].rotation.x=side*2.4*k;u.arms[0].rotation.z=u.arms[1].rotation.z=.3}
      // 골 세리머니
      if(e.t==='goal'&&t>es+.55&&(isSh||actors.as&&actors.as.g===o)){u.arms[0].rotation.z=2.6;u.arms[1].rotation.z=-2.6;if(isSh)o.position.y=Math.abs(Math.sin((t-es)*7))*.22}
    });
    let B=ballAt(tt);/* v160 스로인: 던지기 전에는 공을 머리 위 두 손에 */for(const tid in SCH){const th=SCH[tid].find(x=>x.k==='throw'&&t>=x.s&&t<x.imp);if(th&&P[tid]){const o=P[tid].g,kk=(t-th.s)/(th.imp-th.s);const hgt=kk<.4?.9+kk/.4*.95:1.85;B=[o.position.x+52.5+Math.cos(o.rotation.y)*(kk<.4?.3:-.15),o.position.z+34-Math.sin(o.rotation.y)*(kk<.4?.3:-.15),hgt];th.hand=B;break}
      const tr=SCH[tid].find(x=>x.k==='throw'&&x.hand&&t>=x.imp&&t<x.imp+.5);if(tr){const B1=ballAt(Math.min(tE,tr.imp+.5));const u=(t-tr.imp)/.5;B=tr.hand.map((v,j)=>v+((B1[j]||0)-v)*u);break}}/* v153 슈팅 공 타이밍: 엔진 프레임은 0.5초 간격이라 공이 마지막 소유 프레임(es-0.5)부터 이미 날아가기 시작해 슈팅 동작(접촉 = es)보다 먼저 출발했음 → es까지 슈터 발에 붙여 두고, es부터 0.5초 동안 발→다음 궤적 지점으로 */
    if(kick&&kick.id&&P[kick.id]){if(tt<es&&tt>=kick.t0){const q=feet(kick.id);if(q){B=q;kick.last=q}}else if(tt>=es&&tt<es+.5&&kick.last){const B1=ballAt(Math.min(tE,es+.5));const u=(tt-es)/.5;B=kick.last.map((v,j)=>v+((B1[j]||0)-v)*u)}}
    const bx=B[0]-52.5,bz=B[1]-34,by=Math.max(0,B[2]);const pb=ball.position;const mvb=Math.hypot(bx-pb.x,bz-pb.z);ball.position.set(bx,.2+by*1.05,bz);ball.rotation.x+=mvb*5;bsh.position.set(bx,.02,bz);
    fpsN++;if(now-fpsT>1000){fpsV=Math.round(fpsN*1000/(now-fpsT));fpsN=0;fpsT=now;const dg=document.getElementById('r3diag');if(dg){let ani='';try{const u=Object.values(P)[0].g.userData;ani=u.sk?(u.cur||'-'):'인형'}catch(e){}dg.textContent=`${R3.model?'선수 모델 OK':'단순 인형'+(R3.err?' ('+R3.err+')':'')} · ${ren.capabilities.isWebGL2?'WebGL2':'WebGL1'}${ren.capabilities.floatVertexTextures?'':' · 뼈텍스처X'} · ${fpsV}fps · 동작 ${ani}${R3.aerr?' · 오류 '+R3.aerr:''}`}}
    camFor(mode,bx,bz,by);if(sc.fog){const sk=mode==='sky';sc.fog.near=sk?260:110;sc.fog.far=sk?460:230}if(first){cpS.copy(cp);lkS.copy(lk);first=false}cpS.lerp(cp,Math.min(1,dt*(mode==='sky'?5:2.6)));lkS.lerp(lk,Math.min(1,dt*7));cam.position.copy(cpS);cam.lookAt(lkS);ren.render(sc,cam)};
  window.__r3={setT:x=>{t=x},getT:()=>t,setSpd:x=>{spd=x},SCH,fr,es,t0,tE,P,cam,ball};
  raf=requestAnimationFrame(loop);
  const onR=()=>{ren.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};addEventListener('resize',onR);
  const close=()=>{done=true;window.__r3=null;cancelAnimationFrame(raf);removeEventListener('resize',onR);sc.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(m.map)m.map.dispose();m.dispose()})}});ren.dispose();ov.remove();
    if(M&&!wasP){M.paused=false;if(!M.animating&&!M.done)tick()}};
  ov.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;ev.stopPropagation();
    if(b.dataset.r3cam){mode=b.dataset.r3cam;ov.querySelectorAll('[data-r3cam]').forEach(x=>x.setAttribute('aria-pressed',x===b));return}
    if(b.dataset.r3spd!=null){spd=spd===1?.5:spd===.5?2:1;b.textContent=spd===1?'1배속':spd===.5?'0.5배속':'2배속';return}
    if(b.dataset.r3re!=null){t=t0;first=true;return}if(b.dataset.r3x!=null)close()});
  if(typeof window.appBack!=='undefined'){const pb=window.appBack;window.appBack=()=>{if(document.getElementById('r3ov')){close();window.appBack=pb;return true}return pb&&pb()}}}

