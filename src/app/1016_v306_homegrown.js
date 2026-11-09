// ================= v306 홈그로운(사용자 결정 2026-11-10) =================
// 규정: 15~21세 사이 3시즌 이상 등록 — 같은 구단이면 '구단 육성(HG)', 같은 나라 협회 소속 구단이면 '협회 육성(HG협)'. 구단 육성은 협회 육성에도 포함
// 데이터: 실제 선수의 유스 이력이 없음 → 시작 시점은 근사치(리그 나라 국적·두 번째 국적이면 협회 육성, 유스 입단 선수는 그 구단 육성)
//  게임 진행 중에는 매 시즌 말 15~20세 선수의 소속(구단·나라)을 기록해 3시즌이 되면 실제 기준으로 인정(S.hgT). 유스 이력 자료가 생기면 시작값을 덮어씀
// 지금은 표시만(프리미어리그·세리에 A 명단 규정은 다음 단계)
const HG_RULE={EN:'프리미어리그: 25인 명단 중 홈그로운 8명(아직 표시만)',IT:'세리에 A: 구단 육성 4명+협회 육성 4명(아직 표시만)'};
function hgCountry(c){const lg=typeof sqrLg==='function'?sqrLg(c):null;const L=lg&&LGNAT[lg];return L?L[0]:null}
function hgStat(p,c){if(!p||c==null||c<0||!CLUBS[c])return null;const T=(S&&S.hgT&&S.hgT[p.id])||null;
  const yc=p.youth?(p.youth.c!=null?p.youth.c:(BASE[p.id]&&BASE[p.id].club)):null;
  const A=G.hgAcad&&G.hgAcad[p.id];/* 유스 출신 목록(work/hg/acad.txt, Claude가 아는 범위 165명) */
  if((T&&(T.c[c]||0)>=3)||(yc===c&&!p.imported)||(A&&A[0]===c))return 'c';
  const cc=hgCountry(c);if(!cc)return null;if(A&&A[1]===cc)return 'a';
  if(T&&(T.a[cc]||0)>=3)return 'a';
  if(!p.imported&&(p.nat===cc||p.nat2===cc))return 'a';/* 근사치: 그 나라 국적이면 그 나라에서 자랐다고 봄 */
  return null}
function hgTick(y){/* 끝난 시즌(y-1 → y) 기록: 시즌 시작일에 15~20세였던 선수 */if(!S)return;S.hgT=S.hgT||{};const d0=`${y-1}-07-01`;
  for(const C of CLUBS){if(!C||C.i===FA||C.i===RET)continue;const cc=hgCountry(C.i);for(const p of squadOf(C.i)){const a=ageAt(p,d0);if(a<15||a>=21)continue;
    const T=S.hgT[p.id]=S.hgT[p.id]||{c:{},a:{}};T.c[C.i]=(T.c[C.i]||0)+1;if(cc)T.a[cc]=(T.a[cc]||0)+1}}}
{const _ns=newSeason;newSeason=function(y,first){try{if(!first&&S&&S.hgY!==y){S.hgY=y;hgTick(y)}}catch(e){console.error(e)}return _ns.apply(this,arguments)}}
