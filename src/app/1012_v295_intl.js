// ================= v295 A매치·대륙 대회 소집(사용자 결정 2026-11-05) =================
// 날짜: FIFA 국제경기 일정(2026~2030, 남자). 2026-27부터 9·10월이 합쳐진 4경기 기간. 그 뒤 시즌은 같은 패턴으로
//  출처: FIFA International Match Calendar(위키백과 정리), 아시안컵 2027 사우디 1/7~2/5(AFC 발표). 6월 기간·여름 대회(유로·코파·네이션스컵·골드컵)는 비시즌이라 결장 없음
// 소집: 나라별 능력치 상위 23명(대회는 26명). 리그는 A매치 기간에 쉼(리그 일정의 주말을 그 기간에서 뺌)
// 효과: A매치 = 기간 동안 소속팀 경기 불가 + 복귀 때 피로(다른 대륙 왕복이면 더 큼) + 작은 부상 확률. 대륙 대회 = 탈락할 때까지 결장(나라 전력 순위로 탈락 시점 추정)
// 대표팀 경기 결과는 계산하지 않음(소집·복귀 소식만)
const INTL_T={2026:[['2026-09-21','2026-10-06'],['2026-11-09','2026-11-17'],['2027-03-22','2027-03-30']],2027:[['2027-09-20','2027-10-05'],['2027-11-08','2027-11-16'],['2028-03-20','2028-03-28']],
  2028:[['2028-09-18','2028-10-03'],['2028-11-13','2028-11-21'],['2029-03-19','2029-03-27']],2029:[['2029-09-24','2029-10-09'],['2029-11-12','2029-11-20'],['2030-03-18','2030-03-26']]};
const AFC27='KSA AUS IRQ IRN UZB QAT UAE JPN KOR OMA PLE BHR JOR CHN IDN PRK KUW KGZ SYR SIN VIE PHI TJK LBN YEM THA TKM'.split(' ');
const INTL_TOUR={2026:[{k:'아시안컵',from:'2027-01-07',to:'2027-02-05',nat:AFC27}]};
const CONF={AFC:'KSA AUS IRQ IRN UZB QAT UAE JPN KOR OMA PLE BHR JOR CHN IDN PRK KUW KGZ SYR SIN VIE PHI TJK LBN YEM THA TKM IND MAS HKG',
  CAF:'SEN CIV CMR MLI GHA NGA ALG MAR TUN EGY GUI GNB BFA COD CGO GAB TOG BEN CPV GAM SLE LBR ZAM ZIM RSA ANG MOZ MAD COM MTN CTA KEN UGA TAN RWA BDI NAM EQG CHA LBA SDN NIG',
  CONMEBOL:'ARG BRA URU COL CHI PAR PER ECU VEN BOL',CONCACAF:'USA MEX CAN CRC HON JAM PAN HAI TTO SLV GUA CUW SUR DOM PUE GLP MTQ SKN LCA BRB GUY NCL'};
const NAT_CONF={};for(const k in CONF)CONF[k].split(' ').forEach(c=>NAT_CONF[c]=k);
const LG_CONF={KR:'AFC',JP:'AFC',CN:'AFC',SA:'AFC',US:'CONCACAF',MX:'CONCACAF',AR:'CONMEBOL',BR:'CONMEBOL'};
function natConf(n){return NAT_CONF[n]||'UEFA'}
function clubConf(c){const lg=CLUBS[c]&&(typeof baseLg==='function'?baseLg(CLUBS[c].lg):CLUBS[c].lg);return LG_CONF[lg]||'UEFA'}
function monNear(s){const d=new Date(s+'T00:00:00Z');const w=d.getUTCDay();const off=((1-w)+7)%7;const o=off>3?off-7:off;d.setUTCDate(d.getUTCDate()+o);return d.toISOString().slice(0,10)}
function intlWins(y){if(INTL_T[y])return INTL_T[y];const a=monNear(`${y}-09-21`),b=monNear(`${y}-11-10`),c=monNear(`${y+1}-03-21`);return [[a,addD(a,15)],[b,addD(b,8)],[c,addD(c,8)]]}
function intlTours(y){return INTL_TOUR[y]||[]}
// 리그 일정: A매치 기간의 주말을 뺌(기존: 10/11·11/15·3/28 고정)
/* v296(새 게임 2시즌째 시즌 종료 지연 수정): 주말만으로는 휴식 주가 늘어 6월 중순까지 밀려 승격 PO·리기야가 6월 30일 안에 못 끝남
   → 5월 31일까지 주말로 모자라면 A매치 기간 밖 주중(+3일) 라운드를 고르게 넣음(실제 리그와 같은 방식) */
{const _ld=leagueDates;leagueDates=function(y){try{const W=intlWins(y);const inW=d=>W.some(([a,b])=>d>=a&&d<=b);const end=`${y+1}-05-31`;let d=`${y}-08-16`;{const w=new Date(d+'T00:00:00Z').getUTCDay();if(w)d=addD(d,7-w)}/* 시작을 일요일로(8/16이 월요일인 해는 월요일 라운드가 A매치 기간과 겹쳐 많이 빠짐) */const wk=[];let g=0;
  while(d<=end&&g++<80){if(!inW(d))wk.push(d);d=addD(d,7)}if(wk.length>=38)return wk.slice(0,38);
  const need=38-wk.length;const mid=wk.slice(2,-2).map(x=>addD(x,3)).filter(x=>!inW(x)&&!wk.includes(x));const add=[];for(let k=0;k<need&&mid.length;k++)add.push(mid[Math.min(mid.length-1,Math.round((k+.5)*mid.length/need))]);
  return [...new Set(wk.concat(add))].sort().slice(0,38)}catch(e){return _ld(y)}}}
// ---- 소집 ----
function intlPool(){const by={};for(const c of CLUBS){if(!c||c.i===FA||c.i===RET)continue;for(const p of squadOf(c.i)){if(!p.nat||((S.ps[p.id]||{}).injD>0))continue;(by[p.nat]=by[p.nat]||[]).push(p)}}for(const n in by)by[n].sort((a,b)=>b.ovr-a.ovr);return by}
function intlStr(list){const t=list.slice(0,11);return t.reduce((a,p)=>a+p.ovr,0)/Math.max(1,t.length)}
function intlCall(ev){const by=intlPool();const mine=[];let n=0;
  const nats=ev.nat||Object.keys(by);/* 대회: 전력 순위로 탈락 시점(상위 4 결승권·5~8 8강·9~16 16강·나머지 조별) */
  const rk=ev.nat?nats.filter(x=>by[x]&&by[x].length>=11).sort((a,b)=>intlStr(by[b])-intlStr(by[a])):null;
  for(const nat of nats){const L=by[nat];if(!L||L.length<11)continue;const sz=ev.nat?26:23;let to=ev.to;
    if(rk){const i=rk.indexOf(nat);to=i<4?ev.to:i<8?addD(ev.to,-8):i<16?addD(ev.to,-12):addD(ev.to,-17)}
    for(const p of L.slice(0,sz)){const q=S.ps[p.id]=S.ps[p.id]||{};q.nt={from:addD(ev.from,ev.nat?-3:0),to,k:ev.k||'A매치',far:natConf(nat)!==clubConf(clubOf(p.id))?1:0};n++;if(clubOf(p.id)===S.club)mine.push(p)}}
  if(!(typeof unemp==='function'&&unemp())&&mine.length)inbox('news','',`${ev.k||'A매치'} 대표 소집: 우리 선수 ${mine.length}명`,`${mine.map(p=>`${p.name}(${p.nat})`).join(', ')} — ${fmtD(ev.from)}~${fmtD(ev.to)}. 소집 기간에는 소속팀 경기에 나설 수 없고, 복귀 직후에는 피로가 남습니다.${ev.nat?' 대회는 탈락하면 일찍 돌아옵니다.':''}`);
  return n}
function intlBack(){/* 복귀: 피로·부상 */let mine=[];for(const id in S.ps){const q=S.ps[id];if(!q||!q.nt||q.nt.to>=S.date)continue;const nt=q.nt;delete q.nt;
  q.fit=Math.max(45,Math.round((q.fit??100)-(nt.far?18:9)-(nt.k!=='A매치'?6:0)));
  const p=pl(+id);if(p&&!(q.injD>0)&&hsh('ntinj'+id+S.date)<(nt.k!=='A매치'?.05:.025)){q.injD=7+Math.floor(hsh('ntd'+id+S.date)*15);if(clubOf(+id)===S.club)mine.push(`${p.name} 부상(약 ${Math.max(1,Math.round(q.injD/7))}주)`)}
  else if(p&&clubOf(+id)===S.club&&nt.far)mine.push(`${p.name} 장거리 이동 피로`)}
  if(mine.length&&!(typeof unemp==='function'&&unemp()))inbox('news','',`대표팀 복귀`,mine.join(', '))}
function intlDay(){if(!S)return;S.intl=S.intl||{};const y=S.season;const evs=intlWins(y).map(([a,b],i)=>({id:y+'w'+i,from:a,to:b,k:'A매치'})).concat(intlTours(y).map((t,i)=>Object.assign({id:y+'t'+i},t)));
  for(const ev of evs){const start=ev.nat?addD(ev.from,-3):ev.from;if(S.date===start&&!S.intl[ev.id]){S.intl[ev.id]=1;try{intlCall(ev);S.news.unshift({d:S.date,t:`${ev.k==='A매치'?'A매치 기간':ev.k} 시작`,b:`${fmtD(ev.from)}~${fmtD(ev.to)}${ev.k==='A매치'?' · 리그 휴식':''}`,v:0})}catch(e){console.error(e)}}}
  try{intlBack()}catch(e){console.error(e)}}
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);intlDay();return r}}
// ---- 결장 처리 ----
{const _pl=pl;pl=function(id){const p=_pl(id);if(!p)return p;const q=S&&S.ps&&S.ps[id];p.ntAway=!!(q&&q.nt&&q.nt.from<=S.date&&q.nt.to>=S.date);return p}}
{const _ap=E3.autoPick;E3.autoPick=function(players,form){try{const f=players.filter(p=>!(p&&p.ntAway));if(f.length>=11)return _ap.call(this,f,form)}catch(e){}return _ap.apply(this,arguments)}}
{const _tf=teamFor;teamFor=function(c){const T=_tf(c);try{if(T&&T.bench&&T.bench.some(p=>p&&p.ntAway))return Object.assign({},T,{bench:T.bench.filter(p=>!(p&&p.ntAway))})}catch(e){}return T}}
{const _sm=startMatch;startMatch=function(fx){try{if(S.xi&&(fx.h===S.club||fx.a===S.club)){const sw=[];const used=new Set(S.xi);S.xi=S.xi.map(id=>{const p=id!=null?pl(id):null;if(!p||!p.ntAway)return id;
    const cand=squadOf(S.club).filter(q=>!used.has(q.id)&&!q.ntAway&&!((S.ps[q.id]||{}).injD>0)&&!(q.ban>0));const r=cand.filter(q=>q.g===p.g).sort((a,b)=>b.ovr-a.ovr)[0]||cand.filter(q=>LINE[q.g]===LINE[p.g]).sort((a,b)=>b.ovr-a.ovr)[0]||cand.filter(q=>(q.g==='GK')===(p.g==='GK')).sort((a,b)=>b.ovr-a.ovr)[0];
    if(!r)return id;used.add(r.id);sw.push(`${p.name} 대신 ${r.name}`);return r.id});if(sw.length){SQC=null;inbox('news','','대표팀 차출로 선발 조정',sw.join(', '))}}}catch(e){console.error(e)}return _sm.apply(this,arguments)}}
// 전술 탭: 차출 중 선수 표시
{const _tv=tacView;tacView=function(){const h=_tv.apply(this,arguments);try{if(!S||unemp())return h;const a=squadOf(S.club).filter(p=>p.ntAway);if(!a.length)return h;const nt=S.ps[a[0].id].nt;
  return `<div class="card pad" style="margin-bottom:8px"><span class="note" style="margin:0">대표팀 차출(${esc(nt.k)}): ${a.map(p=>esc(shortName(p.name))).join(', ')} · 경기 전에 자동으로 다른 선수로 바뀝니다</span></div>`+h}catch(e){return h}}}
