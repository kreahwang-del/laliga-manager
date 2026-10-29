// ================= v164 AI 감독 운영: 선수 구성에 맞는 대형·역할·개인 지시, 상대별 경기 계획, 경기 중 점수 대응(엔진 aiGame), 부진 시 전술 재검토 =================
// 감독 역량 q(0.25~0.95): 구단 평판 기반, 우리 팀 상대일 땐 분석을 더 해 +0.15. 결정은 날짜·구단 시드(같은 경기 다시 계산해도 같은 선택)
const AIP={on:1,form:1,pi:1,plan:1,line:0,pf:1,mk:1};/* line: 상대 속도에 따른 라인 조정 — 엔진 검증에서 약팀이 라인을 내리면 오히려 약해져(상위팀 원정 승 .56→.66) 꺼 둠 */
function aiQ(c,vsUser){const rep=(CLUBS[c]&&CLUBS[c].rep)||50;return Math.min(.98,Math.max(.25,(rep-30)/55)+(vsUser?.15:0))}
function mgrFD(m){if(!m)return null;try{const g=(typeof MG0!=='undefined'?MG0:[]).find(x=>x.n===m.n);const fd=(g&&g.fd)||(m.form?[[m.form,1]]:null);return fd}catch(e){return null}}
function aiFitScore(c,form){try{const sq=squadOf(c).filter(p=>!((S.ps[p.id]||{}).injD>0));const ids=E3.autoPick(sq,form);const keys=E3.FORMS[form];let s=0;ids.forEach((id,i)=>{if(id==null)return;const p=pl(id);s+=(p.ovr||60)*E3.fitOf(p,keys[i])});return s}catch(e){return 0}}
/* ① 시즌(또는 새 감독) 전술: 성향 후보 대형 중 선수 구성 적합도(선발 11명 능력×포지션 적합도 합) 1위를 75%, 2위 20%. 전술 성향은 구성에 가장 잘 맞는 것 70%·두 번째 20%·성향 후보 무작위 10%. 새 감독이 오면 다시 고름(이전엔 같은 시즌 시드라 감독이 바뀌어도 같은 전술) */
{const _af=aiTacFor;aiTacFor=function(c){const m=typeof mgrOf==='function'?mgrOf(c):null;const name=CLUBS[c].name;if(!AIP.form||(m&&['Hansi Flick','Diego Simeone','Álvaro Arbeloa'].includes(m.n))||(!m&&(name==='Barcelona'||name==='Real Madrid'||name==='Atlético Madrid')))return _af.apply(this,arguments);const sd=c+':'+S.season+':'+(m?m.n:'')+':'+(S.aiRevN&&S.aiRevN[c]||0);const H=k=>hsh('aim'+k+sd);const rep=CLUBS[c].rep||50;
  const P=rep>=80?['티키타카','게겐프레싱','균형','측면 공략']:rep>=55?['균형','측면 공략','선수비 후 역습','게겐프레싱']:['두 줄 수비','선수비 후 역습','균형','다이렉트'];
  /* 대형: 리그 흔한 대형 비중(4-4-2·4-2-3-1 각 25%, 4-3-3 20%, 4-1-4-1·5-3-2·5-4-1 각 10% — 상위권(평판 70+)은 5백 제외·3-4-3 포함)으로 후보 3개를 뽑고 그중 선수 구성 적합도 1위.
     성향: 평판대별 후보 중 2개를 뽑아 구성에 더 맞는 쪽. (처음엔 평판대 후보 전체에서 적합도 1위만 골랐더니 라리가 19팀 중 14팀이 4-1-4-1·5-4-1, 8팀이 두 줄 수비로 몰리고 경기당 골 2.56→2.90) */
  const FW=rep>=70?[['4-3-3',.3],['4-2-3-1',.3],['4-4-2',.2],['3-4-3',.1],['4-1-4-1',.1]]:[['4-4-2',.25],['4-2-3-1',.25],['4-3-3',.2],['4-1-4-1',.1],['5-3-2',.1],['5-4-1',.1]];
  const pickW2=(L,u)=>{const t=L.reduce((a,x)=>a+x[1],0);let v=u*t;for(const x of L){v-=x[1];if(v<=0)return x[0]}return L[L.length-1][0]};
  let form;const fd=mgrFD(m);
  if(fd&&fd.length){/* v165 감독 선호 대형(실제 Transfermarkt 2023~ 경기 기록 비중): 비중 × (선수 구성 적합도/최고)^10 으로 가중 추첨 — 감독 습관을 따르되 선수 구성과 너무 안 맞으면 다른 선호 대형 */
    const sc=fd.filter(x=>E3.FORMS[x[0]]).map(x=>[x[0],x[1],aiFitScore(c,x[0])]);const mx=Math.max(...sc.map(x=>x[2]),1);form=pickW2(sc.map(x=>[x[0],x[1]*Math.pow(x[2]/mx,10)]),H('mf'))}
  if(!form){const cand=[];let L2=FW.slice();for(let k=0;k<3&&L2.length;k++){const f=pickW2(L2,H('f'+k));cand.push(f);L2=L2.filter(x=>x[0]!==f)}
    form=cand.map(f=>[f,aiFitScore(c,f)]).sort((a,b)=>b[1]-a[1])[0][0]}
  const sm=E3.styleMap(E3.autoPick(squadOf(c),form).map(id=>id!=null?pl(id):null).filter(Boolean));const p1=P[Math.floor(H('p1')*P.length)],P2=P.filter(x=>x!==p1),p2=P2[Math.floor(H('p2')*P2.length)];
  let preset=(sm[p2]??0)>(sm[p1]??0)?p2:p1;if((sm[preset]??0)<0){const ok=P.filter(k=>(sm[k]??0)>=0);if(ok.length)preset=ok.sort((a,b)=>(sm[b]||0)-(sm[a]||0))[0]}
  const t=defaultTac(form,preset);if(preset==='두 줄 수비'||preset==='선수비 후 역습')t.form.def=rep<55?'5-4-1':'4-4-2';t.fam=60+Math.floor(H('fam')*30);if(S.aiRevN&&S.aiRevN[c])t.fam=Math.max(50,t.fam-12);return t}}
/* ② 개인 지시: 압박 성향 전술의 체력·활동량 좋은 공격·미드 → 압박 강하게, 태클 낮은 수비수 → 태클 신중, 크로스형 윙어 → 넓게·드리블·슈팅형 → 안쪽 */
function aiPI(xi,preset){const pi={};const press=preset==='게겐프레싱'||preset==='티키타카',deep=preset==='두 줄 수비'||preset==='선수비 후 역습';
  xi.forEach(p=>{const o={};if(p.g==='GK')return;const att=p.g==='ST'||p.g==='W'||p.g==='AM'||p.g==='CM';
    if(press&&att&&(p.stamina||10)>=15)o.pr=2;else if(deep&&att&&(p.stamina||10)<11)o.pr=0;
    if((p.g==='CB'||p.g==='FB'||p.g==='DM')&&(p.tackle||10)<=9)o.tk=0;
    if(p.g==='W'){if((p.cross||10)>=15&&(p.cross||10)>=(p.shoot||10))o.wd=2;else if((p.drib||10)+(p.shoot||10)>=31)o.wd=0}
    if(Object.keys(o).length)pi[p.id]=o});return pi}
{const _tf=teamFor;teamFor=function(c){const T=_tf.apply(this,arguments);try{if(T&&c!==S.club&&T._aiMark&&AIP.on&&AIP.pi&&!T.pi)T.pi=aiPI(T.xi,T.preset)}catch(e){}return T}}
/* ③ 상대별 경기 계획: 상대 전술이 우리 전술을 이기는 상성이면 확률 q로, 아니어도 q×0.5로 상대를 이기는 전술 중 선수 구성에 맞는 것(적합도 0 이상)으로 바꿈.
   평소 전술이 아니라 숙련도 −10. 경기 중 점수 대응용 정보(aiGs)도 여기서 붙임 */
function aiPlan(T,O,home){if(!AIP.on||!AIP.plan||!T||!O||!T._aiMark||T.club===S.club||T._pl)return;T._pl=1;const vsU=O.club===S.club,q=aiQ(T.club,vsU);
  const av=x=>x.xi.reduce((a,p)=>a+(p.ovr||70),0)/Math.max(1,x.xi.length);const d=av(T)-av(O)+(home?1:-1);T.aiGs={q,ment0:T.ment||'균형',fav:d>=3};
  try{const beatsMe=(E3.BEATS[O.preset]||[]).includes(T.preset);if((E3.BEATS[T.preset]||[]).includes(O.preset))return;const sm=E3.styleMap(T.xi);
    const opts=Object.keys(E3.BEATS).filter(k=>(E3.BEATS[k]||[]).includes(O.preset)&&(sm[k]??0)>=0).sort((a,b)=>(sm[b]||0)-(sm[a]||0));
    if(opts.length&&hsh('apl'+T.club+':'+O.club+':'+S.date)<(beatsMe?q:q*.5)){const k=opts[0];T.preset=k;T.ti=[...E3.PRESETS[k]];T.fam=Math.max(40,(T.fam||60)-10);T.pi=aiPI(T.xi,k);T._plan=k}}catch(e){}}
/* v165 상대별 세부 계획: ① 전력 차가 크면(선발 평균 ±4) 감독 선호 대형 중 수비 숫자가 가장 많은/적은 대형으로(확률 q) ② 상대 최전방 최고 속도 17+면 수비 라인 한 칸 내림, 12 이하면 한 칸 올림 ③ 상대 최고 공격수(84+)를 가장 빠른 수비수가 전담 마크(확률 q, 이전엔 87+ 50%) */
function aiPlan2(T,O,home){if(!AIP.on||!AIP.plan||!T||!O||!T._aiMark||T.club===S.club||T._pl2)return;T._pl2=1;const q=aiQ(T.club,O.club===S.club);const av=x=>x.xi.reduce((a,p)=>a+(p.ovr||70),0)/Math.max(1,x.xi.length);const d=av(T)-av(O)+(home?1:-1);
  try{const m=typeof mgrOf==='function'?mgrOf(T.club):null;const fd=(mgrFD(m)||[]).map(x=>x[0]).filter(f=>E3.FORMS[f]);
    if(AIP.pf&&fd.length>=2&&Math.abs(d)>=4&&hsh('apf'+T.club+':'+O.club+':'+S.date)<q){const dfN=f=>E3.FORMS[f].filter(k=>{const g=E3.SLOT[k][0];return g==='CB'||g==='FB'||g==='DM'}).length;const pick=fd.slice().sort((a,b)=>d<0?dfN(b)-dfN(a):dfN(a)-dfN(b))[0];
      if(pick&&pick!==T.form.base){const pool=T.xi.concat(T.bench||[]);const ids=E3.autoPick(pool,pick);const xi=ids.map(id=>pool.find(p=>p&&p.id===id)).filter(Boolean);
        if(xi.length===11){T.xi=xi;T.bench=pool.filter(p=>p&&!xi.includes(p)).slice(0,9);T.form={base:pick,atk:pick,def:pick};T.roles=E3.defaultRoles(xi,pick);T.duties=xi.map(()=>1);T.marks=xi.map(()=>({on:false,tight:false,t:null}));T._planF=pick;if(T.pi)T.pi=aiPI(xi,T.preset)}}}
    const fwP=Math.max(0,...O.xi.filter(p=>p.g==='ST'||p.g==='W').map(p=>p.pace||10));T.ti=[...T.ti];if(!AIP.line);else if(fwP>=17)T.ti[0]=Math.max(1,T.ti[0]-1);else if(fwP<=12)T.ti[0]=Math.min(5,T.ti[0]+1);
    const star=O.xi.filter(p=>p.g==='ST'||p.g==='W'||p.g==='AM').sort((a,b)=>b.ovr-a.ovr)[0];if(AIP.mk&&star&&star.ovr>=84&&hsh('amk'+T.club+':'+S.date)<q){let bi=-1,bv=-1;T.xi.forEach((p,i)=>{if((p.g==='CB'||p.g==='FB')&&(p.pace||0)+(p.tackle||0)>bv){bv=(p.pace||0)+(p.tackle||0);bi=i}});if(bi>=0){T.marks=T.marks.map(x=>x&&x.on?{on:false,tight:false,t:null}:x);T.marks[bi]={on:true,tight:false,t:star.id};T._planM=star.name}}}catch(e){console.error(e)}}
{const _am=aiMarking;aiMarking=function(T,opp){if(AIP.on&&AIP.plan&&T&&T._aiMark)return;return _am.apply(this,arguments)}}
{const _rm=runMatch;runMatch=function(H,A){aiPlan(H,A,true);aiPlan(A,H,false);aiPlan2(H,A,true);aiPlan2(A,H,false);return _rm.apply(this,arguments)}}
{const _sa=simAsync;simAsync=function(H,A){aiPlan(H,A,true);aiPlan(A,H,false);aiPlan2(H,A,true);aiPlan2(A,H,false);return _sa.apply(this,arguments)}}
/* ④ 부진 시 전술 재검토(매주 월요일, 우리 리그): 최근 리그 6경기 1승 이하·승점 4 이하이고 마지막 재검토 뒤 6경기 이상이면 새로 고름(시드 변경). 소식란에 알림 */
function aiReview(){try{if(!S||!S.fixtures)return;const dw=new Date(S.date+'T00:00:00').getDay();if(dw!==1)return;S.aiRevN=S.aiRevN||{};S.aiRevG=S.aiRevG||{};
  for(const c of (typeof LIGA!=='undefined'?LIGA:[])){if(c===S.club||!S.aiTac||!S.aiTac[c])continue;const fx=S.fixtures.filter(f=>f.res&&f.cup==null&&!f.eu&&(f.h===c||f.a===c)).sort((a,b)=>a.d<b.d?-1:1);if(fx.length<8)continue;
    if(fx.length-(S.aiRevG[c]||0)<6)continue;const L6=fx.slice(-6);let w=0,pts=0;L6.forEach(f=>{const me=f.h===c?0:1,s=f.res.sc;if(s[me]>s[1-me]){w++;pts+=3}else if(s[me]===s[1-me])pts++});
    if(w<=1&&pts<=4){const old=S.aiTac[c];S.aiRevN[c]=(S.aiRevN[c]||0)+1;S.aiRevG[c]=fx.length;let nt=aiTacFor(c);for(let k=0;k<6&&nt.form.base===old.form.base&&nt.preset===old.preset;k++){S.aiRevN[c]++;nt=aiTacFor(c)}if(nt.form.base===old.form.base&&nt.preset===old.preset){const alt=['균형','측면 공략','선수비 후 역습','두 줄 수비','다이렉트'].find(k=>k!==old.preset);nt.preset=alt;nt.ti=[...E3.PRESETS[alt]]}
      S.aiTac[c]=nt;if(typeof aiPhase==='function'){nt._ph=0;aiPhase(nt,c)}const m=typeof mgrOf==='function'?mgrOf(c):null;
      S.news.unshift({d:S.date,t:`${CLUBS[c].name}${m?' '+m.n+' 감독':''}, 최근 6경기 ${w}승 부진에 전술 변경 (${old.form.base} ${old.preset} → ${nt.form.base} ${nt.preset})`,v:0})}}}catch(e){console.error(e)}}
{const _d=daily;daily=function(){const o=_d.apply(this,arguments);aiReview();return o}}

