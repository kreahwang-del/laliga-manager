// ================= 이적시장 세부 검색(v138): 세부 포지션·주발 =================
// 데이터: Transfermarkt 세부 포지션(sub: Centre-Forward·Second Striker·Left/Right Winger·Left/Right-Back 등, 일부 선수만), 실제 출전 위치(pos2: W-L·W-R·FB-L·FB-R·AM 등), 주발(foot: left/right/both)
// 세부 포지션 판정 순서: 세부 포지션 기록 → 실제 출전 위치 비중 → (공격수) 능력치 유형
//  · 세컨드 스트라이커: 기록이 'Second Striker'이거나, 공격형 미드필더 출전 비중 25% 이상, 또는 (패스+드리블)/2 − (공중볼+몸싸움)/2 ≥ 3인 공격수
//  · 측면(윙어·풀백): 기록의 Left/Right → 출전 위치 왼/오 비중 → 둘 다 없으면 주발 반대쪽(윙어)·같은 쪽(풀백)
const SPN={CF:'센터포워드',SS:'세컨드 스트라이커',LW:'왼쪽 윙어',RW:'오른쪽 윙어',AM:'공격형 미드필더',CM:'중앙 미드필더',DM:'수비형 미드필더',CB:'센터백',LB:'왼쪽 풀백',RB:'오른쪽 풀백',GK:'골키퍼'};
const SP_OF={FW:['CF','SS','LW','RW'],MF:['DM','CM','AM'],DF:['CB','LB','RB'],GK:['GK']};
const FTN={left:'왼발',right:'오른발',both:'양발'};
function spSide(p,pre){const s=p.sub||'';if(/Left/.test(s))return 'L';if(/Right/.test(s))return 'R';const n=(p.pos2&&p.pos2.n)||{};const l=(n[pre+'-L']||0),r=(n[pre+'-R']||0);if(l||r)return l>=r?'L':'R';return null}
function subPos(p){const g=p.g;if(g==='GK')return 'GK';if(g==='CB')return 'CB';if(g==='DM'||g==='CM'||g==='AM')return g;
  if(g==='FB'){const sd=spSide(p,'FB')||(p.foot==='left'?'L':'R');return sd==='L'?'LB':'RB'}
  if(g==='W'){const sd=spSide(p,'W')||(p.foot==='left'?'R':'L');return sd==='L'?'LW':'RW'}
  if(g==='ST'){if(/Second Striker/.test(p.sub||''))return 'SS';if(/Centre-Forward/.test(p.sub||''))return 'CF';const n=(p.pos2&&p.pos2.n)||{};const tot=Object.values(n).reduce((a,b)=>a+b,0);if(tot>=10&&(n.AM||0)/tot>=.25)return 'SS';
    const v=k=>p[k]||10;return ((v('pass')+v('drib'))/2-(v('aerial')+v('str'))/2>=3)?'SS':'CF'}return g}
/* v237 기록 필터(사용자 요청): 이번 시즌 리그 기록 기준 최솟값. 골·도움·평점은 모든 리그(빠른 결과 포함), 키패스·빅찬스·공중볼은 경기 엔진 리그(q.ss)만 있음 → 없으면 조건 불충족
   공중볼 승률은 경합 10회 이상, 경기당 값과 평점은 3경기 이상 출전한 선수만 */
const SRST=['sgl','sas','srt','skp','sbc','saw','scr','stk','sdr','sdw','spp','sit'];
const SRST_O={sgl:[['ALL','골 무관'],['1','1골+'],['3','3골+'],['5','5골+'],['10','10골+']],sas:[['ALL','도움 무관'],['1','1도움+'],['3','3도움+'],['5','5도움+']],
  srt:[['ALL','평점 무관'],['6.8','평점 6.8+'],['7.0','평점 7.0+'],['7.3','평점 7.3+']],skp:[['ALL','키패스 무관'],['1','경기당 키패스 1+'],['1.5','1.5+'],['2','2+']],
  sbc:[['ALL','빅찬스 무관'],['0.2','경기당 빅찬스 메이킹 0.2+'],['0.4','0.4+']],saw:[['ALL','공중볼 무관'],['50','공중볼 승률 50%+'],['60','60%+'],['70','70%+']],
  scr:[['ALL','크로스 무관'],['30','크로스 성공률 30%+'],['40','40%+'],['50','50%+']],stk:[['ALL','태클 무관'],['45','태클 성공률 45%+'],['55','55%+'],['65','65%+']],
  sdr:[['ALL','드리블% 무관'],['60','드리블 성공률 60%+'],['70','70%+'],['80','80%+']],sdw:[['ALL','돌파 무관'],['1','경기당 돌파 1+'],['2','2+'],['3','3+']],
  spp:[['ALL','패스% 무관'],['75','패스 성공률 75%+'],['80','80%+'],['85','85%+']],sit:[['ALL','차단 무관'],['1','경기당 차단 1+'],['1.5','1.5+'],['2','2+']]};
function srchStatOK(p,f){const on=k=>f[k]&&f[k]!=='ALL';if(!SRST.some(on))return true;const ap=p.apps||0,ss=p.ss||{};
  if(on('sgl')&&(p.gl||0)<+f.sgl)return false;if(on('sas')&&(p.as||0)<+f.sas)return false;
  if(on('srt')&&(ap<3||(p.rs||0)/ap<+f.srt))return false;if(on('skp')&&(ap<3||(ss.kp||0)/ap<+f.skp))return false;if(on('sbc')&&(ap<3||(ss.bc||0)/ap<+f.sbc))return false;
  if(on('saw')&&((ss.at||0)<10||(ss.aw||0)/(ss.at||1)*100<+f.saw))return false;
  /* v238 성공률 단계는 엔진 기록 분포 기준(라리가 3라운드, 세트피스 크로스 시도 집계 수정 후: 크로스 중앙값 37%·상위10% 50%, 태클 27%·46%, 드리블 64%·80%, 패스 71%·76%) → v240 기록 정의 보정 뒤 태클 50%·67%, 패스 78%·84% — 엔진의 시도 정의가 Opta와 달라 실제 수치(태클 약 60%, 패스 약 80%)와 다름. 성공률은 시도 횟수 하한(크로스·태클·드리블 10회, 패스 100회), 경기당 값은 3경기 이상 */const pct=(w,t,mn,th)=>(ss[t]||0)>=mn&&(ss[w]||0)/(ss[t]||1)*100>=th;
  if(on('scr')&&!pct('crc','cr',10,+f.scr))return false;if(on('stk')&&!pct('tkw','ta',10,+f.stk))return false;if(on('sdr')&&!pct('dw','da',10,+f.sdr))return false;if(on('spp')&&!pct('pc','pa',100,+f.spp))return false;
  if(on('sdw')&&(ap<3||(ss.dw||0)/ap<+f.sdw))return false;if(on('sit')&&(ap<3||(ss.it||0)/ap<+f.sit))return false;return true}
searchView=function(){const f=UI.f;SRST.forEach(k=>{if(f[k]==null)f[k]='ALL'});if(f.sp==null)f.sp='ALL';if(f.ft==null)f.ft='ALL';if(f.sp!=='ALL'&&!(SP_OF[f.g]||[]).includes(f.sp))f.sp='ALL';
  let L=[];for(const id in BASE){const c=clubOf(+id);if(c===S.club||c===RET)continue;const p=pl(+id);
    if(f.g!=='ALL'&&LINE[p.g]!==f.g)continue;if(f.lg!=='ALL'&&(f.lg==='FA'?c!==FA:f.lg==='OUT'?(c===FA||LG5.has(CLUBS[c].lg)):(c===FA||!CLUBS[c]||CLUBS[c].lg!==f.lg)))continue;
    if(f.sp!=='ALL'&&subPos(p)!==f.sp)continue;if(f.ft!=='ALL'&&(p.foot||'right')!==f.ft)continue;
    const a=ageOf(p);if(f.age==='U21'&&a>21||f.age==='22-27'&&(a<22||a>27)||f.age==='28+'&&a<28)continue;
    const v=valueNow(p);if(f.price!=='ALL'&&v>+f.price*1e6)continue;
    if(f.q&&!p.name.toLowerCase().includes(f.q.toLowerCase()))continue;if(!srchStatOK(p,f))continue;L.push(p)}
  const shownMid=p=>{const k=know(p.id);if(k>=3)return p.ovr;const r=[7,4,2][k];const o=Math.round(hsh(p.id+'r'+k)*r*2);return p.ovr+r-o};
  const sk={ovr:p=>-shownMid(p),val:p=>-p.val,age:p=>ageOf(p),exp:p=>p.cEnd}[f.sort];L.sort((a,b)=>sk(a)<sk(b)?-1:sk(a)>sk(b)?1:0);
  const ch=(k,opts)=>`<div class="chips">${opts.map(([v,l])=>`<button class="chip" data-f="${k}" data-v="${v}" aria-pressed="${f[k]===v}">${k==='lg'&&IMG.on&&lgLogo(v)?`<img class="lgi" src="${lgLogo(v)}" loading="lazy" alt="" onerror="this.remove()">`:''}${l}</button>`).join('')}</div>`;
  const row=p=>{const h=rowP(p);const i=h.indexOf('</span></span>');return i<0?h:h.slice(0,i)+` · ${SPN[subPos(p)]||p.g}·${FTN[p.foot]||'오른발'}`+h.slice(i)};
  return `<input class="search" id="q" placeholder="선수 이름 검색" value="${esc(f.q)}" autocomplete="off">
  ${ch('g',[['ALL','전체'],['GK','GK'],['DF','수비'],['MF','미드필더'],['FW','공격']])}
  ${SP_OF[f.g]&&f.g!=='GK'?ch('sp',[['ALL','세부 전체'],...SP_OF[f.g].map(k=>[k,SPN[k]])]):''}
  ${(()=>{const O={ft:[['ALL','주발 무관'],['left','왼발'],['right','오른발'],['both','양발']],lg:[['ALL','전체 리그'],['ES','라리가'],['EN','EPL'],['IT','세리에A'],['DE','분데스'],['FR','리그1'],['OUT','5대 리그 밖'],['FA','자유계약']],age:[['ALL','전 연령'],['U21','21세 이하'],['22-27','22~27세'],['28+','28세 이상']],price:[['ALL','가격 무관'],['10','€10M 이하'],['30','€30M 이하'],['60','€60M 이하']],sort:[['ovr','능력치순'],['val','가치순'],['age','나이순'],['exp','계약 만료 임박순']],...SRST_O};
    /* v216 필터 접기: 포지션만 항상 보이고 나머지는 '필터' 버튼 안으로. 적용 중인 조건은 버튼에 요약 */
    const lab=k=>{const o=(O[k]||[]).find(x=>x[0]===f[k]);if(o)return o[1];if(k==='lg'&&LGN[f[k]])return LGN[f[k]];return null};
    const act=['ft','lg','age','price',...SRST].filter(k=>f[k]&&f[k]!=='ALL').map(lab).filter(Boolean);if(f.sort&&f.sort!=='ovr')act.push(lab('sort'));
    const body=UI.fOpen?`${ch('ft',O.ft)}${ch('lg',O.lg)}${UI.f.lg==='OUT'||(UI.f.lg&&!LG5.has(UI.f.lg)&&!['ALL','FA'].includes(UI.f.lg))?ch('lg',Object.keys(LGN).filter(k=>!LG5.has(k)).map(k=>[k,LGN[k]])):''}${ch('age',O.age)}${ch('price',O.price)}${ch('sort',O.sort)}<div class="note" style="margin:8px 0 2px">이번 시즌 기록 (리그 경기) — 골·도움·평점 외 지표는 경기 엔진으로 치른 리그만 기록(설정 '다른 리그 경기 계산'이 켜져 있으면 모든 리그)</div>${SRST.map(k=>ch(k,O[k])).join('')}`:'';
    return `<div class="chips"><button class="chip" data-fopen="1" aria-pressed="${!!UI.fOpen||act.length>0}">필터${act.length?' · '+esc(act.join(' · ')):''} ${UI.fOpen?'▲':'▼'}</button></div>${body}`})()}
  <p class="note">${L.length}명 · 능력치 범위는 정보 부족으로 인한 추정치입니다. 세부 포지션은 기록된 포지션·실제 출전 위치·능력치 유형으로 판정합니다.</p>
  <div class="card list" style="margin-top:6px">${L.slice(0,UI.lim).map(row).join('')||'<div class="li note">조건에 맞는 선수가 없습니다.</div>'}</div>
  ${L.length>UI.lim?`<button class="btn ghost" data-act="more">더 보기 (${L.length-UI.lim}명)</button>`:''}`};
// 선수 화면: 상단 정보 줄(포지션 · 나이 · 국적 · 주발 · 키) 앞에 세부 포지션 표시
{const _ps=playerSheet;playerSheet=function(id){const r=_ps.apply(this,arguments);try{const p=pl(id),a=ageOf(p)+'세 ·';const el=[...document.querySelectorAll('.sheet div,.sheet p,.sheet span')].find(e=>e.childElementCount===0&&e.textContent.includes(a));
  if(el&&!el.dataset.sp){el.dataset.sp=1;const parts=el.textContent.split(' · ');parts[0]=SPN[subPos(p)]||parts[0];el.textContent=parts.join(' · ')}}catch(e){}return r}}
