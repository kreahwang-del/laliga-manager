// ================= v178 3D 선수 모델 교체: Mixamo Ch38(사용자 제공, 사실적 축구선수) =================
//  · vendor/ch38_opt.glb: 몸·상의·하의·양말·축구화 합친 'main'(속성 __PART 0~4) + 'hair'. 뼈 이름 mixamorig5→mixamorig로 맞춰 기존 동작 23개 그대로 사용(엉덩이 이동은 키 비율 0.89 보정)
//  · 텍스처: ch38_d.jpg(1024, 등번호 7 지움), ch38_n.jpg(노멀), ch38_h.png(머리카락 밝기+알파)
//  · 셰이더: 상의·하의·양말은 텍스처 밝기(주름 음영) × 팀 색, 몸통 줄무늬·가로줄, 등번호(숫자 아틀라스), 반소매(위팔 중간 아래를 피부색으로)·긴소매 섞음, 피부톤·머리색 선수별, GK 장갑
const CH={dig:null};
function chImg(id){return new Promise(res=>{const el=document.getElementById(id);if(!el)return res(null);const im=new Image();im.onload=()=>res(im);im.onerror=()=>res(null);im.src=el.textContent.trim()})}
{const _lm=r3LoadModel;r3LoadModel=function(cb){if(R3.model||R3.mfail)return cb();_lm(()=>{const mo=R3.model;if(!mo)return cb();let main=null,hair=null;mo.scene.traverse(o=>{if(o.isSkinnedMesh){if(o.name==='main')main=o;if(o.name==='hair')hair=o}});
  if(!main)return cb();const g=main.geometry;const pa=g.getAttribute('__part');if(pa&&!g.getAttribute('aPart')){g.setAttribute('aPart',pa);g.deleteAttribute('__part')}
  Promise.all([chImg('plTexD'),chImg('plTexN'),chImg('plTexH')]).then(([d,n,h])=>{const T=THREE;const mk=(im,srgb)=>{if(!im)return null;const t=new T.Texture(im);t.flipY=true;if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.needsUpdate=true;return t};
    mo.ch={tD:mk(d,1),tN:mk(n,0),tH:mk(h,1),hairMesh:!!hair};cb()})})}}
{const _rl=r3Look;r3Look=function(id){const L=_rl(id);try{L.id=id}catch(e){}return L}}
function chSleeveShort(look,gk){if(gk)return false;return hsh('slv'+(look&&look.id||0)+(S&&S.season||0))>.3} /* 필드 선수 약 70% 반소매(시즌마다 바뀜), GK 긴소매 */
function chMat(T,kit,gk,look,num){const mo=R3.model,ch=mo.ch;const C=h=>new T.Color(h);const body=gk?(kit.gkc||'#E8C547'):kit.body;
  const m=new T.MeshStandardMaterial({map:ch.tD,normalMap:ch.tN,roughness:.82,metalness:0});if(ch.tN)m.normalScale=new T.Vector2(.8,.8);
  const trim=kit.pat&&kit.patCol?kit.patCol:r3Trim(T,body);const n=Math.max(1,Math.min(99,num||7));const sk=C(look.skin||'#d9a77f'),df=C('#d9a77f');
  const U={uShirt:{value:C(body)},uSleeve:{value:C(gk?body:(kit.arms||body))},uShorts:{value:C(gk?'#20252c':kit.shorts)},uSocks:{value:C(gk?body:kit.socks)},uTrim:{value:C(trim)},uNumC:{value:C(r3Trim(T,body))},
    uSkin:{value:sk},uSkinR:{value:new T.Vector3(sk.r/df.r,sk.g/df.g,sk.b/df.b)},uPat:{value:gk?0:(kit.pat||0)},uPatCol:{value:C(kit.patCol||kit.body)},uGk:{value:gk?1:0},uShort:{value:chSleeveShort(look,gk)?1:0},
    uMin:{value:mo.bbMin},uSize:{value:mo.bbSize},uDig:{value:r3DigTex(T)},uNum:{value:new T.Vector2(n>=10?Math.floor(n/10):-1,n%10)},uNB:{value:new T.Vector4(CH.nb[0],CH.nb[1],CH.nb[2],CH.nb[3])},uBuild:{value:look.build||0},uJ:{value:chJ()}};
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
    sh.vertexShader='attribute float aPart;varying float vPart;varying vec3 vBP;uniform vec3 uMin,uSize;uniform float uBuild;uniform vec4 uJ;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBP=position;vPart=aPart;'+CH_BUILD_GLSL);
    sh.fragmentShader='varying float vPart;varying vec3 vBP;uniform vec3 uShirt,uSleeve,uShorts,uSocks,uTrim,uNumC,uSkin,uSkinR,uPatCol,uMin,uSize;uniform float uPat,uGk,uShort;uniform sampler2D uDig;uniform vec2 uNum;uniform vec4 uNB;\n'+sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      vec3 tx=diffuseColor.rgb;float L=dot(tx,vec3(.2126,.7152,.0722));float H=uSize.y;float xs=(vBP.x-(uMin.x+uSize.x*.5))/H;float x=abs(xs);float y=(vBP.y-uMin.y)/H;
      float sh=clamp(L/.56,.3,1.22);vec3 c=tx;int P=int(vPart+.5);
      if(P==1){
        if(x>.108){ if(uShort>.5&&x>.172)c=uSkin*clamp(L/.5,.55,1.1); else if(uShort>.5&&x>.164)c=uTrim*sh; else c=uSleeve*sh; if(uGk>.5&&x>.37)c=vec3(.93)*sh; }
        else{ vec3 k=uShirt; if(uPat>.5&&uPat<1.5&&mod(floor((xs+.5)/.042),2.)>.5)k=uPatCol; if(uPat>1.5&&mod(floor(y/.035),2.)>.5)k=uPatCol; c=k*sh;
          vec2 uv=vMapUv;if(uv.x>uNB.x&&uv.x<uNB.z&&uv.y>uNB.y&&uv.y<uNB.w){float u=(uv.x-uNB.x)/(uNB.z-uNB.x);float v=(uv.y-uNB.y)/(uNB.w-uNB.y);float two=uNum.x>=0.?1.:0.;
            float d=two>.5?(u<.5?uNum.x:uNum.y):uNum.y;float lu=two>.5?fract(u*2.):u;vec2 tuv=vec2((d+.1+lu*.8)/10.,1.-v);if(lu>.03&&lu<.97&&texture2D(uDig,tuv).a>.5)c=uNumC*sh;} } }
      else if(P==2)c=uShorts*sh;
      else if(P==3)c=uSocks*sh;
      else if(P==0){ float k=smoothstep(.5,.3,L);c=mix(tx,tx*uSkinR,k); if(uGk>.5&&x>.37&&y>.5)c=vec3(.93)*clamp(L/.2,.6,1.1); }
      diffuseColor.rgb=c;`)};m.customProgramCacheKey=()=>'ch38m2';return m}
CH.nb=[.528,.19,.578,.295];
/* v183 체격: 바인드 자세(T자) 정점을 스키닝 전에 부위별로 굵게/가늘게 — 몸통(엉덩이~목) 좌우·앞뒤, 다리 각자 축 기준, 팔은 팔 축(높이·앞뒤) 기준. 길이는 그대로(키는 전체 크기로). uJ = (팔 높이, 엉덩이 높이, 목 높이, 다리 중심 x) / 키 */
const CH_BUILD_GLSL=`{float Hh=uSize.y;vec3 q=transformed;float yn=(q.y-uMin.y)/Hh;float xc=uMin.x+uSize.x*.5,zc=uMin.z+uSize.z*.5;float xs=(q.x-xc)/Hh;float ax=abs(xs);float k=uBuild;
  if(ax>.105&&yn>uJ.x-.09){float w=smoothstep(.105,.13,ax)*(1.-smoothstep(.33,.37,ax));float s=1.+.07*k*w;float ay=uMin.y+uJ.x*Hh;q.y=ay+(q.y-ay)*s;q.z=zc+(q.z-zc)*s;}
  else if(yn>uJ.y-.03&&yn<uJ.z){float w=smoothstep(uJ.y-.03,uJ.y+.03,yn)*(1.-smoothstep(uJ.z-.05,uJ.z,yn));float s=1.+.085*k*w;q.x=xc+(q.x-xc)*s;q.z=zc+(q.z-zc)*(1.+.1*k*w);}
  else if(yn<=uJ.y+.03){float w=smoothstep(.06,.14,yn)*(1.-smoothstep(uJ.y-.02,uJ.y+.03,yn));float lc=xc+sign(q.x-xc)*uJ.w*Hh;float s=1.+.08*k*w;q.x=lc+(q.x-lc)*s;q.z=zc+(q.z-zc)*s;}
  transformed=q;}`;
function chJ(){const J=(R3.model&&R3.model.J)||{};const g=(k,i,d)=>J[k]?J[k][i]:d;return new THREE.Vector4(g('LeftArm',1,.8),g('LeftUpLeg',1,.49),g('Neck',1,.84),g('LeftUpLeg',0,.05))}
/* 키(cm): 데이터 있으면 그대로(150 미만 오류값 무시), 없으면 포지션 평균 ± 해시. 체격: 근력(1~20, 중앙값 9) + 포지션(CB·ST·GK 두껍게, W·AM 가늘게) → −1~1 */
const CH_HPOS={GK:189,CB:187,ST:183,DM:181,CM:179,FB:178,AM:176,W:175};
function chBody(id){let P=null;try{P=id!=null?pl(id):null}catch(e){}const g=P&&P.g||'CM';let h=P&&P.h>=150&&P.h<=210?P.h:(CH_HPOS[g]||180)+Math.round((hsh('ht'+id)-.5)*8);
  const st=P&&P.str!=null?P.str:9;const pb={CB:.2,ST:.15,GK:.1,DM:.05,W:-.2,AM:-.15,FB:-.05}[g]||0;const k=Math.max(-1,Math.min(1,(st-9)/6*.8+pb+(h-182)/40));return {h,k}}
function chHairMat(T,look){const ch=R3.model.ch;const m=new T.MeshStandardMaterial({color:look.hair||'#2a2420',map:ch.tH,alphaTest:.45,side:T.DoubleSide,roughness:.9,metalness:0});return m}
{const _ps=r3PlayerSk;r3PlayerSk=function(T,kit,gk,look,num){const mo=R3.model;if(!mo||!mo.ch)return _ps(T,kit,gk,look,num);
  const bd=chBody(look.id);look=Object.assign({},look,{build:bd.k});const G=new T.Group();const inner=THREE_X.SkeletonUtils.clone(mo.scene);inner.scale.setScalar(mo.scale*bd.h/180);inner.rotation.y=Math.PI/2;G.add(inner);G.userData_h=bd.h;
  const mat=chMat(T,kit,gk,look,num),hm=chHairMat(T,look);const st=look.st??1;
  inner.traverse(o=>{if(!o.isSkinnedMesh)return;o.castShadow=true;o.frustumCulled=false;if(o.name==='hair'){o.material=hm;o.visible=st>0&&st!==4;if(st===3)o.scale.multiplyScalar(1.04)}else o.material=mat});
  if(st===2||st===4)r3Hair(T,inner,Object.assign({},look,{st}));
  const mixer=new T.AnimationMixer(inner);const arms={};['LeftArm','RightArm','LeftForeArm','RightForeArm','Spine2'].forEach(k=>{const o=inner.getObjectByName('mixamorig'+k);if(o)arms[k]={o,q:o.quaternion.clone()}});
  G.userData={sk:true,mixer,inner,acts:{},cur:null,gk,arms};return G}}
/* v180: 주간 경기 환경광 — ambientCG DayEnvironmentHDRI057(CC0) 톤매핑 파노라마 512×256을 PMREM 환경맵으로(화면엔 안 보이고 반사·음영만). 반구광은 1.15 → .5로 낮춰 밝기 맞춤. 야간 경기는 사용 안 함 */
function chEnv(T,ren,sc,night){window.__chsc=sc;CH.dbg='env:'+night;if(night)return false;try{if(!CH.envImg){const el=document.getElementById('envDay');if(!el)return false;const im=new Image();im.src=el.textContent.trim();CH.envImg=im}
  if(!CH.envImg.complete||!CH.envImg.naturalWidth){const im=CH.envImg;(im.decode?im.decode():Promise.resolve()).then(()=>{try{chEnv(T,ren,sc,night)}catch(e){}}).catch(()=>{});return true}const tx=new T.Texture(CH.envImg);tx.mapping=T.EquirectangularReflectionMapping;tx.colorSpace=T.SRGBColorSpace;tx.needsUpdate=true;
  const pm=new T.PMREMGenerator(ren);const rt=pm.fromEquirectangular(tx);pm.dispose();tx.dispose();sc.environment=rt.texture;return true}catch(e){console.error(e);return false}}
{const _ci=chImg;chImg=function(id){if(id==='plTexD'&&!CH.envImg){const el=document.getElementById('envDay');if(el){const im=new Image();im.src=el.textContent.trim();CH.envImg=im}}return _ci(id)}}
/* v180: 잔디 질감 — ambientCG Grass003(CC0, 사용자 제공) 밝기 디테일(512 흑백)을 경기장 잔디 색(줄무늬·라인 캔버스) 위에 곱하고, 노멀맵(GL)으로 빛 반응. 3m마다 반복 */
function chTex(id,srgb){if(!CH['t_'+id]){const el=document.getElementById(id);if(!el)return null;const im=new Image();im.src=el.textContent.trim();CH['t_'+id]=im}const im=CH['t_'+id];if(!im.complete||!im.naturalWidth)return null;
  const T=THREE,t=new T.Texture(im);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;if(srgb)t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t}
function chPitch(T,m){window.__chpm=m;try{const d=chTex('grassD',0),n=chTex('grassN',0);if(!d||!n){const ims=['grassD','grassN'].map(id=>CH['t_'+id]).filter(Boolean);if(ims.length===2&&!m._gw){m._gw=1;Promise.all(ims.map(im=>im.decode?im.decode().catch(()=>{}):0)).then(()=>{chPitch(T,m);m.needsUpdate=true})}return}const rep=new T.Vector2(115/3,78/3);
  if(n){n.repeat.copy(rep);m.normalMap=n;m.normalScale=new T.Vector2(.6,.6)}
  if(d){m.onBeforeCompile=sh=>{sh.uniforms.uDet={value:d};sh.uniforms.uRep={value:rep};sh.fragmentShader='uniform sampler2D uDet;uniform vec2 uRep;\n'+sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      float dt=texture2D(uDet,vMapUv*uRep).r;float dp=texture2D(uDet,vMapUv*uRep*.11+.37).r;float ln=step(.6,dot(diffuseColor.rgb,vec3(.33)));diffuseColor.rgb*=mix((.62+dt*.76)*(.9+dp*.2),1.,ln);`)};m.customProgramCacheKey=()=>'pitchG2'}}catch(e){console.error(e)}}
/* 잔디·환경광 이미지를 미리 디코딩 */
setTimeout(()=>{try{['grassD','grassN','envDay'].forEach(id=>{if(id==='envDay'){if(!CH.envImg){const el=document.getElementById(id);if(el){const im=new Image();im.src=el.textContent.trim();CH.envImg=im}}}else chTex(id,0)})}catch(e){}},1500);

