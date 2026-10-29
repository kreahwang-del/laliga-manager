// ================= 출장정지(v99): 경고 누적·퇴장 → 다음 경기 결장, 리그별 실제 규정 =================
// 근거: 라리가·분데스리가·리그1(2025-26~)·기본값 = 경고 5장마다 1경기 / EPL = 5장(1월 1일 전) 1경기·10장(4월 14일 전) 2경기·15장 3경기(리그만), 레드 징계는 국내 모든 대회
// 세리에A = 5·10·14·17장 이후 매 장 / UEFA 2026-27 = 4·6·8·10장(이후 2장마다), 8강 종료 후 경고 소멸, 퇴장은 다음 UEFA 경기
// 리그1은 경고가 리그1+쿠프 드 프랑스 합산. 그 외 국내 컵은 레드만 다음 컵 경기 정지(컵 경고 누적은 별도로 셈하지 않음)
// 경고 2장 퇴장 = 1경기. 다이렉트 레드 = 1경기 50%·2경기 25%·3경기 25%(EPL 기준: 명백한 득점 기회 저지 1, 폭언 2, 폭력·심한 반칙 3), 분데스리가는 2경기 60%·3경기 40%
const BAN_R={ES:{every:5},DE:{every:5,red:[[2,.6],[3,.4]]},FR:{every:5,dom:1},IT:{thr:[5,10,14,17],tail:1},EN:{en:1,dom:1},def:{every:5}};
const BAN_RED={ES:.22,IT:.25,FR:.22,EN:.12,DE:.15}; // 경기당 레드(VAR 도입 후 시즌 평균, RunRepeat 2009/10~2019/20 분석) — 빠른 계산 경기용
const BAN_Y=2.2; // 빠른 계산 경기 팀당 경고 평균(유럽 주요 리그 경기당 약 4~5장)
function banRule(c){const lg=CLUBS[c]&&CLUBS[c].lg;return BAN_R[lg]||BAN_R.def}
function fxScope(f){if(!f)return 'lg';return f.eu?'eu':(f.cup!=null?'cup':'lg')}
let BANCTX=null;let _bsm={t:0,v:null,o:null};
function myScope(){const n=performance.now();if(n-_bsm.t>250){let f=null;try{f=typeof nextFxAll==='function'?nextFxAll():myNext()}catch(e){}_bsm={t:n,v:fxScope(f),o:f?(f.h===S.club?f.a:f.h):null}}return _bsm}
function banScope(c){if(BANCTX)return BANCTX;if(!S||S.club==null)return 'lg';const m=myScope();if(c===S.club||c===m.o)return m.v;return 'lg'}
function banLeft(id,sc){const q=S.ps[id];if(!q||!q.bn)return 0;const b=q.bn;return sc==='eu'?(b.eu||0):sc==='cup'?Math.max(b.cup||0,b.dom||0):Math.max(b.lg||0,b.dom||0)}
{const _pl=pl;pl=function(id){const p=_pl(id);if(!p)return p;const q=S&&S.ps&&S.ps[id];if(!q||!q.bn){p.ban=0;return p}p.ban=banLeft(id,banScope(clubOf(id)));return p}}
function banAdd(id,k,n,why){const q=S.ps[id]=S.ps[id]||{};q.bn=q.bn||{};q.bn[k]=(q.bn[k]||0)+n;
  if(clubOf(id)===S.club&&!(typeof unemp==='function'&&unemp())){const p=pl(id);const kn={lg:'리그',cup:'컵',dom:'국내 대회',eu:'유럽대항전'}[k];inbox('news','',`${p.name} 출장정지 ${n}경기`,`${why} → 다음 ${kn} ${n}경기에 나설 수 없습니다.`)}}
function banServe(c,sc){for(const id of (SQC&&SQC[c])||[]){const q=S.ps[id];if(!q||!q.bn)continue;const b=q.bn;
  if(sc==='eu'){if(b.eu>0)b.eu--}else if(sc==='cup'){if(b.cup>0)b.cup--;else if(b.dom>0)b.dom--}else{if(b.lg>0)b.lg--;else if(b.dom>0)b.dom--}
  if(!(b.lg>0||b.cup>0||b.dom>0||b.eu>0))delete q.bn}}
function banYThr(R,n,sc){if(sc==='eu')return n>=4&&n%2===0?1:0;if(R.en){const d=S.date,y=S.season;if(n===5&&d<`${y+1}-01-01`)return 1;if(n===10&&d<`${y+1}-04-14`)return 2;if(n===15)return 3;return 0}
  if(R.thr)return R.thr.includes(n)||(R.tail&&n>R.thr[R.thr.length-1])?1:0;return n%R.every===0?1:0}
function banRedLen(R,u){const L=R.red||[[1,.5],[2,.25],[3,.25]];let a=0;for(const [n,w] of L){a+=w;if(u<a)return n}return L[L.length-1][0]}
// cards: [{pid,y,r}] (y=경고 수, r=퇴장 여부) — sc: lg/cup/eu, f: 경기(UEFA 4강 이후 경고 소멸 판단용)
function banProc(sc,clubs,cards,f){try{clubs.forEach(c=>banServe(c,sc));
  for(const x of cards){const c=clubOf(x.pid);if(c==null||c<0)continue;const R=banRule(c);const q=S.ps[x.pid]=S.ps[x.pid]||{};
    if(!q.cd||q.cd.s!==S.season)q.cd={s:S.season};const cd=q.cd;
    if(sc==='eu'&&f&&f.ko>=3&&cd.euW!==S.season){cd.eu=0;cd.euW=S.season}
    if(x.r){const second=x.y>=1;const n=second?1:banRedLen(R,hsh('rl'+x.pid+S.date));const k=sc==='eu'?'eu':(R.dom?'dom':sc);banAdd(x.pid,k,n,second?'경고 2장 퇴장':'다이렉트 퇴장');continue}
    if(!x.y)continue;const ck=sc==='eu'?'eu':sc==='lg'?(R.dom?'dom':'lg'):(sc==='cup'&&R.dom?'dom':null);if(!ck)continue;
    for(let i=0;i<x.y;i++){cd[ck]=(cd[ck]||0)+1;const n=banYThr(R,cd[ck],sc);
      if(n)banAdd(x.pid,ck==='dom'?'dom':ck,n,`경고 누적 ${cd[ck]}장`);
      else if(clubOf(x.pid)===S.club&&banYThr(R,cd[ck]+1,sc)&&!(typeof unemp==='function'&&unemp())){const p=pl(x.pid);inbox('news','',`${p.name} 경고 ${cd[ck]}장`,`한 장 더 받으면 다음 ${sc==='eu'?'유럽대항전':'리그'} 경기 출장정지입니다.`)}}}}catch(e){console.error(e)}}
function banCardsEv(ev,H,A){const m={};(ev||[]).forEach(e=>{if((e.t==='yellow'||e.t==='red')&&e.pid!=null){const x=m[e.pid]=m[e.pid]||{pid:e.pid,y:0,r:0};if(e.t==='yellow')x.y++;else x.r=1}});return Object.values(m)}
// 빠른 계산 경기: 팀별 경고(포아송, 포지션 가중)·퇴장(리그별 경기당 레드 수의 절반을 팀당, 그중 절반은 경고 2장)
function banFastCards(T,k){if(!T||!T.xi)return [];const lg=CLUBS[T.club]&&CLUBS[T.club].lg;const W={GK:.15,CB:1.3,FB:1.2,DM:1.4,CM:1.1,AM:.8,W:.8,ST:.8};
  const xi=T.xi.filter(Boolean);const ny=poisR(BAN_Y,hsh('ny'+k));const used=new Set(),out=[];
  const pick=u=>{const ws=xi.map(p=>used.has(p.id)?0:(W[p.g]||1));const t=ws.reduce((a,b)=>a+b,0);if(t<=0)return null;let v=u*t;for(let i=0;i<xi.length;i++){v-=ws[i];if(v<=0)return xi[i]}return null};
  for(let i=0;i<Math.min(ny,6);i++){const p=pick(hsh('yp'+i+k));if(!p)break;used.add(p.id);out.push({pid:p.id,y:1,r:0})}
  const rr=(BAN_RED[lg]||.18)/2;if(hsh('rd'+k)<rr){if(hsh('r2'+k)<.5&&out.length){out[Math.floor(hsh('rw'+k)*out.length)].r=1}else{const p=pick(hsh('rp'+k));if(p)out.push({pid:p.id,y:0,r:1})}}return out}
function banFast(f,k){try{const sc=fxScope(f);BANCTX=sc;const H=teamFor(f.h),A=teamFor(f.a);BANCTX=null;if(!H||!A)return;banProc(sc,[f.h,f.a],banFastCards(H,'h'+k).concat(banFastCards(A,'a'+k)),f)}catch(e){BANCTX=null;console.error(e)}}
// 경기 처리 지점 연결
{const _fm=fastMatch;fastMatch=function(f){const sc=fxScope(f);BANCTX=sc;let r;try{r=_fm.apply(this,arguments)}finally{BANCTX=null}if(f.res)banFast(f,f.d+':'+f.h+':'+f.a+(f.leg||''));return r}}
{const _cf=cupFast;cupFast=function(f){const sc=fxScope(f);BANCTX=sc;let r;try{r=_cf.apply(this,arguments)}finally{BANCTX=null}if(f.res)banFast(f,'c'+f.d+':'+f.h+':'+f.a+(f.leg||''));return r}}
{const _sm=startMatch;startMatch=function(fx){BANCTX=fxScope(fx);try{return _sm.apply(this,arguments)}finally{BANCTX=null}}}
{const _am=applyMatch;applyMatch=function(H,Aw,res,counts){const r=_am.apply(this,arguments);try{let sc='lg',f=null;if(typeof M!=='undefined'&&M&&M.fx&&H&&Aw&&H.club===M.fx.h&&Aw.club===M.fx.a){f=M.fx;sc=fxScope(f)}
  banProc(sc,[H.club,Aw.club],banCardsEv(res&&res.ev),f)}catch(e){console.error(e)}return r}}
// 경기 중 교체 명단·선발 검증
{const _bl=benchList;benchList=function(){return _bl().filter(p=>!(p.ban>0))}}

