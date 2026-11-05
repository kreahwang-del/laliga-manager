// ================= v295 리그별 실제 시즌 방식(사용자 요청 2026-11-05: 모든 리그를 자기 리그 규정대로, 기존 세이브는 다음 시즌부터) =================
// 근거(2026-27 시즌 규정, 웹 검색 2026-11-05):
//  · K리그1(2026)·스코티시 프리미어십·스위스 슈퍼리그: 12팀 3회전 33라운드 → 상위 6·하위 6 스플릿, 그룹 안 1회씩 5경기(총 38), 승점 그대로. 하위 그룹 팀은 승점이 많아도 7위 이하
//  · 덴마크 수페르리가: 22라운드(2회전) → 챔피언십·강등 라운드 6팀씩 2회전 10경기(총 32), 승점 그대로
//  · 오스트리아 분데스리가: 22라운드 → 6팀씩 2회전 10경기(총 32), 스플릿 때 승점 반(내림, 내림당한 팀이 동률 때 앞)
//  · 리가 MX: 18팀, 아페르투라 17라운드 → 상위 8팀 리기야(8강·4강·결승 홈앤어웨이, 4강 재배정) / 클라우수라 17라운드 → 리기야. 합계 동점이면 상위 시드(결승은 연장·승부차기). 강등 없음
//  · 아르헨티나 리가 프로페시오날(2027 개편안): 30팀 단일 리그 30라운드(29팀과 1회 + 라이벌 재대결), 1~15 아페르투라·16~30 클라우수라(각각 0점부터),
//    각 대회 상위 16팀 단판 토너먼트(1v16…, 상위 팀 홈). 시즌 전체 합산표(연간표) 1위가 리그 우승
//  · MLS(2027-28 가을-봄 시즌): 동·서부 15팀씩 34경기(같은 콘퍼런스 2회 28경기 + 다른 콘퍼런스 6경기), 콘퍼런스 상위 8팀 단판 플레이오프 → MLS컵
//  · 벨기에(2026-27부터 18팀 34라운드, 플레이오프 폐지)·일본 J1(2026-27 20팀 38라운드)·나머지 리그는 단일 리그(기존 그대로)
//  · 하부 리그가 게임에 없는 리그의 승강 PO·유럽 진출 PO는 생략. K리그1 2027 14팀 39라운드 개편은 구단 데이터가 12팀이라 반영 못 함
const LGF={KR:{t:'split',p1:33,p2:1,n:38,gs:6},SC:{t:'split',p1:33,p2:1,n:38,gs:6},CH:{t:'split',p1:33,p2:1,n:38,gs:6},
  DK:{t:'split',p1:22,p2:2,n:32,gs:6},AT:{t:'split',p1:22,p2:2,n:32,gs:6,half:1},MX:{t:'mx'},AR:{t:'ar'},US:{t:'us'}};
const LGF_NM={A:'아페르투라',C:'클라우수라',P:'플레이오프'};
function lfSt(lg,y){const s=S&&S.lgf&&S.lgf[lg];return s&&s.y===(y??S.season)?s:null}
function lfFx(lg){if(S.fxE&&S.fxE[lg])return S.fxE[lg];if(lg===(S.fxHL||'ES')&&(S.myDiv||1)===1)return S.fixtures;return null}
function lfIds(lg){return lg===(S.fxHL||'ES')&&!(S.fxE&&S.fxE[lg])?LIGA.slice():lgClubs(lg)}
function lfRows(ids,fx,ok){const t={};ids.forEach(id=>t[id]={id,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});(fx||[]).forEach(f=>{if(!f.res||(ok&&!ok(f)))return;const [a,b]=f.res.sc,H=t[f.h],Aw=t[f.a];if(!H||!Aw)return;H.p++;Aw.p++;H.gf+=a;H.ga+=b;Aw.gf+=b;Aw.ga+=a;
  if(a>b){H.w++;Aw.l++;H.pts+=3}else if(a<b){Aw.w++;H.l++;Aw.pts+=3}else{H.d++;Aw.d++;H.pts++;Aw.pts++}});return t}
const lfSort=(x,y)=>y.pts-x.pts||(y.hb||0)-(x.hb||0)||(y.gf-y.ga)-(x.gf-x.ga)||y.gf-x.gf;
// 스플릿 리그 순위: 그룹이 나뉜 뒤에는 상위 그룹 6팀이 항상 1~6위
function lfTable(lg,ids,fx){const st=lfSt(lg),C=LGF[lg];const t=lfRows(ids,fx);if(!st||!st.grp||C.t!=='split')return Object.values(t).sort(lfSort);
  if(C.half){const p1=lfRows(ids,fx,f=>f.r<=C.p1),p2=lfRows(ids,fx,f=>f.r>C.p1);for(const id in t){const a=p1[id].pts;t[id].pts=Math.floor(a/2)+p2[id].pts;t[id].hb=a%2}}
  return st.grp.flatMap(g=>g.filter(id=>t[id]).map(id=>t[id]).sort(lfSort))}
// ---- 일정 생성 ----
function lfRR1(T){return roundRobin(T).slice(0,T.length-1)}/* 1회전 */
const MLS_E=/Atlanta|Charlotte|Chicago|Cincinnati|Columbus|D\.C\.|Miami|Montr|Nashville|New England|New York|Orlando|Philadelphia|Toronto/;
function lfGen(lg,y,cl){const C=LGF[lg];const st={y,lg,t:C.t};const out=[];const push=(ds,rounds,r0,tag)=>rounds.forEach((ms,i)=>ms.forEach(([h,a])=>{if(h!=null&&a!=null)out.push(Object.assign({d:ds[i],r:r0+i+1,h,a,res:null,lg},tag||{}))}));
  if(C.t==='split'){const T=cl.length%2?[...cl,null]:cl;let r=roundRobin(T);if(C.p1>r.length)r=r.concat(r.slice(0,C.p1-r.length));r=r.slice(0,C.p1);const ds=datesN(y,C.n);push(ds,r,0);st.ds2=ds.slice(C.p1)}
  else if(C.t==='mx'){const T=cl.length%2?[...cl,null]:cl;const rr=roundRobin(T),n=T.length-1;const W=leagueDates(y);
    push(W.slice(0,n),rr.slice(0,n),0,{st:'A'});push(W.slice(n+3,n+3+n),rr.slice(n),n,{st:'C'});
    /* 아페르투라 W0~16 → 리기야(목·일 3주) → 클라우수라 W20~36 → 리기야 */const L=k=>[addD(W[k],4),W[k+1],addD(W[k+1],4),W[k+2],addD(W[k+2],4),W[k+3]];const z=W[W.length-2];
    st.dq={A:L(n-1),C:[addD(z,4),W[W.length-1],addD(W[W.length-1],4),addD(W[W.length-1],7),addD(W[W.length-1],11),addD(W[W.length-1],14)]}}
  else if(C.t==='ar'){const T=cl.length%2?[...cl,null]:cl;const rr=lfRR1(T);const n=rr.length;/* 29라운드 */const W=leagueDates(y);
    const RIV=[[/Boca/,/River/],[/Racing/,/Independiente de Avellaneda/],[/San Lorenzo/,/Hurac/],[/Newell/,/Rosario Central/],[/Estudiantes de La Plata/,/Gimnasia y Esgrima La Plata/],[/Banf/,/Lan[uú]s/],[/Talleres/,/Belgrano/]];
    const nm=id=>CLUBS[id].name;const used=new Set(),rv=[];for(const [x,z] of RIV){const a=cl.find(i=>x.test(nm(i))&&!used.has(i)),b=cl.find(i=>z.test(nm(i))&&!used.has(i));if(a!=null&&b!=null&&a!==b){used.add(a);used.add(b);rv.push([a,b])}}
    const rest=cl.filter(i=>!used.has(i));for(let i=0;i+1<rest.length;i+=2)rv.push([rest[i],rest[i+1]]);
    /* 재대결은 1회전 때 반대 홈으로 */const hm={};rr.forEach(ms=>ms.forEach(([h,a])=>{if(h!=null&&a!=null)hm[h+':'+a]=1}));const rvr=rv.map(([a,b])=>hm[a+':'+b]?[b,a]:[a,b]);
    const rounds=rr.slice(0,15).concat(rr.slice(15),[rvr]);/* 1~15 아페르투라, 16~30 클라우수라 */
    push(W.slice(0,15),rounds.slice(0,15),0,{st:'A'});push(W.slice(19,34),rounds.slice(15),15,{st:'C'});st.dq={A:W.slice(15,19),C:W.slice(34,38)}}
  else if(C.t==='us'){let E=cl.filter(i=>MLS_E.test(CLUBS[i].name)),Wc=cl.filter(i=>!E.includes(i));if(E.length!==Wc.length){const s=cl.slice();E=s.slice(0,s.length>>1);Wc=s.slice(s.length>>1)}
    st.conf={E,W:Wc};const rE=roundRobin(E.length%2?[...E,null]:E),rW=roundRobin(Wc.length%2?[...Wc,null]:Wc);const R=Math.max(rE.length,rW.length);const rounds=[];
    for(let i=0;i<R;i++){const m=[],by=[];for(const rr of [rE,rW])(rr[i]||[]).forEach(([h,a])=>{if(h==null||a==null)by.push(h==null?a:h);else m.push([h,a])});if(by.length===2)m.push(i%2?[by[1],by[0]]:[by[0],by[1]]);rounds.push(m)}
    const k=E.length;for(let j=1;rounds.length<34&&j<=k;j++){const m=[];for(let q=0;q<k;q++){const a=E[q],b=Wc[(q+j*3)%k];if(b!=null)m.push((q+j)%2?[a,b]:[b,a])}rounds.push(m)}
    const ds=datesN(y,38);push(ds,rounds.slice(0,34),0);st.dq={P:ds.slice(34,38)}}
  return {f:out,st}}
{const _ef=euroFixtures;euroFixtures=function(lg,y){if(!LGF[lg])return _ef(lg,y);const cl=lgClubs(lg).sort(()=>0).sort((a,b)=>hsh(y+lg+a)-hsh(y+lg+b));if(cl.length<8)return _ef(lg,y);
  try{const g=lfGen(lg,y,cl);S.lgf=S.lgf||{};const old=S.lgf[lg];if(!(old&&old.y===y&&(old.grp||old.po)))S.lgf[lg]=g.st;return g.f}catch(e){console.error(e);return _ef(lg,y)}}}
// ---- 스플릿 2단계 일정(1단계가 끝나면 그 시점 순위로) ----
function lfSplit(lg,st,fx){const C=LGF[lg];if(st.grp)return false;const p1=fx.filter(f=>f.r<=C.p1);if(!p1.length||!p1.every(f=>f.res))return false;
  const ids=lfIds(lg);const tb=Object.values(lfRows(ids,fx)).sort(lfSort).map(t=>t.id);st.grp=[tb.slice(0,C.gs),tb.slice(C.gs)];const rk=id=>tb.indexOf(id);
  const home=(a,b)=>{const ha=p1.filter(f=>f.h===a&&f.a===b).length,hb=p1.filter(f=>f.h===b&&f.a===a).length;return ha<hb?[a,b]:hb<ha?[b,a]:(rk(a)<rk(b)?[a,b]:[b,a])};
  const isHome=lg===(S.fxHL||'ES')&&!(S.fxE&&S.fxE[lg]);let k0=0;const R=[];
  st.grp.forEach((g,gi)=>{const T=g.length%2?[...g,null]:g;let rr=roundRobin(T);if(C.p2===1)rr=rr.slice(0,T.length-1).map(ms=>ms.map(([a,b])=>a==null||b==null?[a,b]:home(a,b)));rr.forEach((ms,i)=>{R[i]=(R[i]||[]).concat(ms)})});
  R.forEach((ms,i)=>{let d=st.ds2[i]||addD(S.date,7*(i+1));if(d<=S.date)d=addD(S.date,3+7*i);ms.forEach(([h,a])=>{if(h==null||a==null)return;const f={d,r:C.p1+i+1,h,a,res:null,grp:st.grp[0].includes(h)?0:1};if(!isHome)f.lg=lg;fx.push(f)})});
  fx.sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);
  const nm=c=>CLUBS[c].short;S.news.unshift({d:S.date,t:`${LGN[lg]||lg} 스플릿 확정`,b:`상위 그룹: ${st.grp[0].map(nm).join('·')}${C.half?' (승점 반으로)':''}`,v:0,big:lg===(S.fxHL||'')});
  if(isHome&&!(typeof unemp==='function'&&unemp())){const up=st.grp[0].includes(S.club);inbox('board','',`스플릿: ${up?'상위':'하위'} 그룹`,`${C.p1}라운드 종료 순위로 ${up?'상위 그룹(1~6위 경쟁)':'하위 그룹(7위 이하)'}에 들어갔습니다. 같은 그룹 팀과 ${C.p2===1?'1번씩':'홈·원정 2번씩'} 더 경기합니다.${C.half?' 승점은 반으로 줄어듭니다(내림).':''}`)}
  return true}
// ---- 플레이오프(리기야·아르헨티나·MLS) ----
function lfPoAll(lg){const st=lfSt(lg);return st&&st.po?st.po:[]}
function lfMk(st,lg,stg,rd,ti,h,a,d,leg,seedH,seedA){const f={d,h,a,res:null,ko:1,lgpo:lg,stg,rd,ti,leg,lg,sh:seedH,sa:seedA};st.po=st.po||[];st.po.push(f);return f}
function lfStageTable(lg,stg){const fx=lfFx(lg)||[];return Object.values(lfRows(lfIds(lg),fx,f=>f.st===stg)).sort(lfSort)}
function lfConfTable(lg,cf){const st=lfSt(lg);const fx=lfFx(lg)||[];return Object.values(lfRows(st.conf[cf],fx)).sort(lfSort)}
function lfTies(st,stg,rd){const m={};(st.po||[]).filter(f=>f.stg===stg&&f.rd===rd).forEach(f=>{(m[f.ti]=m[f.ti]||[]).push(f)});return Object.keys(m).sort((a,b)=>a-b).map(k=>m[k].sort((x,y)=>x.leg-y.leg))}
function lfPen(f){const u=hsh('pk'+S.season+f.lgpo+f.stg+f.rd+f.ti+f.h);return u<.5?f.h:f.a}
// 승자 결정: 홈앤어웨이(합계 → 동점이면 상위 시드, 결승은 연장·승부차기) / 단판(동점이면 연장(결승·MLS)·승부차기)
function lfWin(lg,ties,two,final,et){const L=ties[ties.length-1];if(!L.res)return null;if(ties.some(f=>!f.res))return null;if(L.w!=null)return L.w;
  let A=ties[0].h,B=ties[0].a;let ga=0,gb=0;ties.forEach(f=>{const [x,y]=f.res.sc;if(f.h===A){ga+=x;gb+=y}else{ga+=y;gb+=x}});
  const sA=ties[0].h===A?ties[0].sh:ties[0].sa,sB=ties[0].h===A?ties[0].sa:ties[0].sh;let w=ga>gb?A:gb>ga?B:null;
  if(w==null&&two&&!final)w=sA<sB?A:B,L.seedW=1;
  if(w==null&&(final||et)){const H=teamFor(L.h),Aw=teamFor(L.a);const Lm=cupLamT(L,H,Aw),k=S.season+lg+L.stg+L.rd+L.ti;const e=[poisR(Lm[0]/3,hsh('eh'+k)),poisR(Lm[1]/3,hsh('ea'+k))];L.et=e;const eh=e[0],ea=e[1];
    if(L.h===A){ga+=eh;gb+=ea}else{ga+=ea;gb+=eh}w=ga>gb?A:gb>ga?B:null}
  if(w==null){w=lfPen(L);L.pk=1}L.w=w;L.agg=[A,ga,gb,B];return w}
function lfNews(lg,t,b,big){S.news.unshift({d:S.date,t,b,v:0,big:!!big})}
function lfChamp(lg,c,what){const st=lfSt(lg);st.ch=st.ch||{};st.ch[what]=c;const home=lg===(S.fxHL||'');lfNews(lg,`${LGN[lg]||lg} ${what} 우승: ${CLUBS[c].name}`,'',home);
  if(home&&c===S.club&&!(typeof unemp==='function'&&unemp())){S.me&&(S.me.titles=(S.me.titles||0)+1);if(typeof hlPush==='function')hlPush({key:'lf'+lg+what+S.season,pri:7,tone:'good',c,t:`${what} 우승!`,b:LGN[lg]||lg})}}
function lfPoTick(lg,st){const C=LGF[lg];const fx=lfFx(lg);if(!fx)return false;let ch=false;
  const stages=C.t==='us'?['P']:['A','C'];
  for(const stg of stages){const lgF=C.t==='us'?fx:fx.filter(f=>f.st===stg);if(!lgF.length||!lgF.every(f=>f.res))continue;const dq=st.dq[stg];const fd=k=>{let d=dq[k]||addD(S.date,4*(k+1));return d<=S.date?addD(S.date,2+3*k):d};
    const has=(st.po||[]).some(f=>f.stg===stg);
    if(C.t==='mx'){/* 리기야: 8강(1v8,2v7,3v6,4v5) → 4강 재배정 → 결승, 홈앤어웨이(상위 시드 2차전 홈) */
      if(!has){const tb=lfStageTable(lg,stg).slice(0,8);const p=[[0,7],[1,6],[2,5],[3,4]];p.forEach(([i,j],ti)=>{const H=tb[i].id,A=tb[j].id;lfMk(st,lg,stg,0,ti,A,H,fd(0),1,j,i);lfMk(st,lg,stg,0,ti,H,A,fd(1),2,i,j)});
        lfNews(lg,`${LGN[lg]} ${LGF_NM[stg]} 리기야 대진`,tb.map((t,i)=>`${i+1}.${CLUBS[t.id].short}`).join(' '),lg===(S.fxHL||''));ch=true;continue}
      for(let rd=0;rd<3;rd++){const ties=lfTies(st,stg,rd);if(!ties.length)break;const ws=ties.map(t=>lfWin(lg,t,true,rd===2));if(ws.some(w=>w==null))break;if(rd===2){if(!(st.ch&&st.ch[LGF_NM[stg]]))lfChamp(lg,ws[0],LGF_NM[stg]);break}
        if(lfTies(st,stg,rd+1).length)continue;const sd=ties.map((t,i)=>{const w=ws[i];return {w,s:t[0].h===w?t[0].sh:t[0].sa}}).sort((a,b)=>a.s-b.s);
        const pr=rd===0?[[sd[0],sd[3]],[sd[1],sd[2]]]:[[sd[0],sd[1]]];pr.forEach(([x,z],ti)=>{lfMk(st,lg,stg,rd+1,ti,z.w,x.w,fd(2*(rd+1)),1,z.s,x.s);lfMk(st,lg,stg,rd+1,ti,x.w,z.w,fd(2*(rd+1)+1),2,x.s,z.s)});ch=true}}
    else{/* 단판: 아르헨티나 16강(상위 팀 홈) / MLS 콘퍼런스 8강 → 4강 → 결승 → MLS컵 */
      if(!has){if(C.t==='ar'){const tb=lfStageTable(lg,stg).slice(0,16);const P=[[0,15],[7,8],[4,11],[3,12],[2,13],[5,10],[6,9],[1,14]];P.forEach(([i,j],ti)=>lfMk(st,lg,stg,0,ti,tb[i].id,tb[j].id,fd(0),1,i,j));
          lfNews(lg,`${LGN[lg]} ${LGF_NM[stg]} 16강 대진`,P.slice(0,4).map(([i,j])=>`${CLUBS[tb[i].id].short}–${CLUBS[tb[j].id].short}`).join(' · ')+' …',lg===(S.fxHL||''))}
        else{['E','W'].forEach((cf,ci)=>{const tb=lfConfTable(lg,cf).slice(0,8);const P=[[0,7],[3,4],[2,5],[1,6]];P.forEach(([i,j],q)=>lfMk(st,lg,stg,0,ci*4+q,tb[i].id,tb[j].id,fd(0),1,i,j))});
          lfNews(lg,'MLS 플레이오프 대진','동·서부 콘퍼런스 상위 8팀 단판 토너먼트',lg===(S.fxHL||''))}ch=true;continue}
      const nR=C.t==='ar'?4:4;for(let rd=0;rd<nR;rd++){const ties=lfTies(st,stg,rd);if(!ties.length)break;const fin=rd===nR-1;const ws=ties.map(t=>lfWin(lg,t,false,fin,C.t==='us'));if(ws.some(w=>w==null))break;
        if(fin){const what=C.t==='us'?'MLS컵':LGF_NM[stg];if(!(st.ch&&st.ch[what]))lfChamp(lg,ws[0],what);break}if(lfTies(st,stg,rd+1).length)continue;
        const sd=ties.map((t,i)=>({w:ws[i],s:t[0].h===ws[i]?t[0].sh:t[0].sa}));const nx=[];for(let i=0;i+1<sd.length;i+=2)nx.push([sd[i],sd[i+1]]);
        let ov=null;if(C.t==='us'&&rd===2){const T=lfRows(lfIds(lg),fx);ov=id=>T[id]?T[id].pts*1000+(T[id].gf-T[id].ga):0}
        nx.forEach(([x,z],ti)=>{const xs=ov?-ov(x.w):x.s,zs=ov?-ov(z.w):z.s;const [h,a,sh,sa]=xs<=zs?[x.w,z.w,x.s,z.s]:[z.w,x.w,z.s,x.s];lfMk(st,lg,stg,rd+1,ti,h,a,fd(rd+1),1,sh,sa)});ch=true}}}
  if(C.t==='ar'&&st.po&&(st.po||[]).some(f=>f.stg==='C')&&fx.every(f=>f.res)&&!(st.ch&&st.ch['리그(연간표)'])){const T=Object.values(lfRows(lfIds(lg),fx)).sort(lfSort);lfChamp(lg,T[0].id,'리그(연간표)')}
  if(C.t==='us'&&fx.every(f=>f.res)&&!(st.ch&&st.ch['서포터스 실드'])){const T=Object.values(lfRows(lfIds(lg),fx)).sort(lfSort);lfChamp(lg,T[0].id,'서포터스 실드')}
  return ch}
function lfMineOn(){return !(typeof unemp==='function'&&unemp())}
function lfTick(){if(!S||!S.lgf)return;for(const lg in S.lgf){const st=lfSt(lg);if(!st||!LGF[lg])continue;const fx=lfFx(lg);if(!fx)continue;
  try{if(LGF[lg].t==='split')lfSplit(lg,st,fx);else{lfPoTick(lg,st);
    for(const f of (st.po||[])){if(f.res||f.d>S.date)continue;if(lfMineOn()&&f.d===S.date&&(f.h===S.club||f.a===S.club))continue;fastMatch(f);if(f.res)f.res.ev=[]}
    lfPoTick(lg,st)}}catch(e){console.error(e)}}}
function lfDone(){if(!S||!S.lgf)return true;for(const lg in S.lgf){const st=lfSt(lg);if(!st||!LGF[lg])continue;const fx=lfFx(lg);if(!fx)continue;const C=LGF[lg];
  if(C.t==='split'){if(!st.grp)return false;continue}
  const need=C.t==='us'?['MLS컵']:C.t==='mx'?['아페르투라','클라우수라']:['아페르투라','클라우수라','리그(연간표)'];if(!need.every(k=>st.ch&&st.ch[k]!=null)){/* 안전장치: 시즌 말 날짜를 한참 넘기면 끝냄 */if(S.date>=`${S.season+1}-06-28`)continue;return false}}return true}
{const _ft=divFastToday;divFastToday=function(){_ft();lfTick()}}
{const _od=divOtherDone;divOtherDone=function(){lfTick();return _od()&&lfDone()}}
// 순위표
{const _tl=tableLg;tableLg=function(lg){if(LGF[lg]&&lfSt(lg)&&LGF[lg].t==='split'){const fx=fxLg(lg);return lfTable(lg,lgClubs(lg),fx)}return _tl(lg)}}
{const _to=tableOf;tableOf=function(d){const lg=S&&(S.fxHL||'ES');if(d===1&&LGF[lg]&&LGF[lg].t==='split'&&lfSt(lg))return lfTable(lg,LIGA.slice(),fxOf(1));return _to(d)}}
// 우리 팀 플레이오프 경기: 컵 경기와 같은 경로(엔진)로
function lfMine(){if(!lfMineOn()||!S.lgf)return null;const lg=S.fxHL;const st=lfSt(lg);if(!st)return null;return (st.po||[]).find(f=>f.d===S.date&&!f.res&&(f.h===S.club||f.a===S.club))||null}
{const _cm=cupMine;cupMine=function(){return _cm()||lfMine()}}
{const _cn=cupNextMine;cupNextMine=function(){const a=_cn();if(!lfMineOn())return a;const st=lfSt(S.fxHL);const b=st&&(st.po||[]).filter(f=>!f.res&&(f.h===S.club||f.a===S.club)).sort((x,y)=>x.d<y.d?-1:1)[0];return [a,b].filter(Boolean).sort((x,y)=>x.d<y.d?-1:1)[0]||null}}
function lfLabel(f){const C=LGF[f.lgpo];const n=C&&C.t==='us'?['콘퍼런스 8강','콘퍼런스 4강','콘퍼런스 결승','MLS컵 결승'][f.rd]:C&&C.t==='ar'?`${LGF_NM[f.stg]} `+['16강','8강','4강','결승'][f.rd]:`${LGF_NM[f.stg]} 리기야 `+['8강','4강','결승'][f.rd]+(f.leg?` ${f.leg}차전`:'');return n}
{const _cl=cupLabel;cupLabel=function(f){if(f&&f.lgpo)return lfLabel(f);return _cl(f)}}
{const _nl=nextFxLabel;nextFxLabel=function(f){if(f&&f.lgpo)return lfLabel(f);return _nl(f)}}
{const _fi=finish;finish=function(){const fx=M&&M.fx;_fi();if(!fx||!fx.lgpo)return;try{const st=lfSt(fx.lgpo);lfPoTick(fx.lgpo,st);
  if(fx.et)feed({m:120,t:'sys',txt:`연장전 ${fx.et[0]} : ${fx.et[1]}`});if(fx.pk)feed({m:120,t:'sys',txt:`승부차기 → ${CLUBS[fx.w].short} 승리`});
  if(fx.w!=null)feed({m:0,t:'sys',txt:fx.w===S.club?'다음 라운드 진출':'탈락'+(fx.seedW?' (합계 동점, 상위 시드 진출)':'')});else if(fx.leg===1)feed({m:0,t:'sys',txt:'1차전 종료 · 2차전에서 승부'});save()}catch(e){console.error(e)}}}
// 시즌 말 우승 기록: 플레이오프 리그는 플레이오프 우승팀
{const _ns=newSeason;newSeason=function(y,first){const prev=S&&S.lgf?JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(S.lgf).filter(([k,v])=>v&&v.ch).map(([k,v])=>[k,v.ch])))):{};_ns(y,first);
  try{const e=S.euroCh&&S.euroCh[S.euroCh.length-1];if(e&&!first)e.ch=e.ch.map(([lg,id])=>{const c=prev[lg];if(!c)return [lg,id];const w=c['MLS컵']??c['클라우수라']??c['리그(연간표)'];return [lg,w!=null?w:id]})}catch(er){console.error(er)}}}
// ---- 화면 ----
function lfTblHtml(rows,cut){return `<div class="tbl-wrap"><table><thead><tr><th>#</th><th style="text-align:left">구단</th><th>경기</th><th>득실</th><th>승점</th></tr></thead><tbody>${rows.map((r,i)=>`<tr${cut&&i===cut-1?' style="border-bottom:2px solid var(--line)"':''}><td>${i+1}</td><td class="t">${esc(CLUBS[r.id].name)}</td><td>${r.p}</td><td>${r.gf-r.ga>0?'+':''}${r.gf-r.ga}</td><td class="pts">${r.pts}</td></tr>`).join('')}</tbody></table></div>`}
function lfPoHtml(st,stg){const C=LGF[st.lg];const rows=[];const nR=C.t==='mx'?3:4;for(let rd=0;rd<nR;rd++){const ties=lfTies(st,stg,rd);if(!ties.length)break;rows.push(`<div class="li note"><b>${lfLabel(Object.assign({},ties[0][0],{leg:0})).replace(/^\S+ (리기야 )?/,'')}</b></div>`);
  ties.forEach(t=>{const L=t[t.length-1];rows.push(`<div class="li"><span class="nm"><b>${esc(CLUBS[t[0].h].short)} vs ${esc(CLUBS[t[0].a].short)}</b><span>${t.map(f=>f.res?`${CLUBS[f.h].short} ${f.res.sc[0]}-${f.res.sc[1]} ${CLUBS[f.a].short}`:fmtD(f.d)).join(' / ')}${L.w!=null?` → <b>${esc(CLUBS[L.w].short)}</b>${L.pk?' (승부차기)':L.seedW?' (상위 시드)':L.et?' (연장)':''}`:''}</span></span></div>`)})}
  return rows.length?`<div class="card list">${rows.join('')}</div>`:''}
function lfView(lg){const st=lfSt(lg),C=LGF[lg];if(!st||!C)return '';let h='';
  if(C.t==='split')h=`<div class="note" style="margin-top:6px">${C.p1}라운드 뒤 상위 6팀·하위 6팀으로 나눠 ${C.p2===1?'1번씩(5경기)':'2번씩(10경기)'} 더 경기${C.half?', 나눌 때 승점 반(내림)':''}. ${st.grp?'스플릿 완료: 1~6위 상위 그룹':'아직 1단계'}</div>`;
  else if(C.t==='us'){h=`<h2>콘퍼런스 순위 (상위 8팀 플레이오프)</h2>`+['E','W'].map(cf=>`<div class="note" style="margin:6px 0 2px">${cf==='E'?'동부':'서부'}</div><div class="card">${lfTblHtml(lfConfTable(lg,cf),8)}</div>`).join('')+(st.po?`<h2>MLS 플레이오프</h2>`+lfPoHtml(st,'P'):'')}
  else{const cur=(lfFx(lg)||[]).some(f=>f.st==='C'&&f.res)?'C':'A';h=`<div class="note" style="margin-top:6px">위 표는 시즌 전체 합산${C.t==='ar'?'(연간표, 1위 = 리그 우승)':''}. 대회마다 0점부터 시작</div><h2>${LGF_NM[cur]} 순위 (상위 ${C.t==='mx'?8:16}팀 ${C.t==='mx'?'리기야':'토너먼트'})</h2><div class="card">${lfTblHtml(lfStageTable(lg,cur),C.t==='mx'?8:16)}</div>`;
    ['A','C'].forEach(s=>{const p=lfPoHtml(st,s);if(p)h+=`<h2>${LGF_NM[s]} ${C.t==='mx'?'리기야':'토너먼트'}</h2>`+p})}
  if(st.ch)h+=`<div class="note" style="margin-top:6px">우승: ${Object.entries(st.ch).map(([k,v])=>`${k} ${esc(CLUBS[v].short)}`).join(' · ')}</div>`;return h}
{const _ev=euroView;euroView=function(lg){return _ev(lg)+lfView(lg)}}
{const _lv=leagueView;leagueView=function(){const h=_lv();try{if(!UI.elg&&LGF[S.fxHL]&&lfSt(S.fxHL)&&(UI.lt||'table')==='table')return h+lfView(S.fxHL)}catch(e){}return h}}
