// ================= v311 리그별 실제 규정(사용자 결정 2026-11-23: 확정 ✓는 반영, △는 지금 값 유지 — ops/05_리그규정_조사.md) =================
// 등록 인원: 라리가·라리가2·EPL·세리에A·덴마크·사우디 25명, 그 밖 30명(게임 기본값)
// 홈그로운 몫(모자라면 명단 축소): EPL 25명 중 비홈그로운 17명까지 / 세리에A·덴마크 8명(그중 구단 육성 4명)
// 나이 예외(등록 인원에 안 셈): EPL·덴마크·사우디 21세 이하(시즌-21년 이후 출생), 세리에A 22세 이하(시즌-22년 이후 출생)
// 비EU 한도(1군 등록): 라리가 3·라리가2 2·리그1 4 — 이중국적(EU 여권) 반영, 처음부터 그 구단에 있던 선수·v311 이전 영입 선수는 한도에서 뺌(데이터에 없는 EU 여권 대신)
// 외국인 어린 선수 몫: 튀르키예 14명 중 4명은 2003년 이후 출생(시즌-23) / 사우디 10명 중 2명은 2004년 이후 출생(시즌-22), 사우디 경기 명단 외국인 8명
// 벤치: 라리가·라리가2·네덜란드·아르헨티나 12, 리그2 7, 그 밖 9
// 경고 누적: 아르헨티나 5장마다 / MLS 5장마다 + 5경기 연속 무경고면 누적 1장 감소(시즌 3번까지, 구단 리그 경기 수로 셈) / 스코틀랜드 6장마다 / 덴마크 5·9·13장, 이후 4장마다
// AI 구단도 같은 규정. 기존 세이브: 영입·1군 올리기 검사는 바로, AI 2군 배정은 다음 이적시장(7/2·9/2·2/2·시즌 넘김)부터
const LGR={ES:{reg:25,bench:12,eu:1},ES2:{reg:25,bench:12,eu:1},FR:{eu:1},FR2:{bench:7},
  EN:{reg:25,u:21,hg:{c:0,a:8}},IT:{reg:25,u:22,hg:{c:4,a:4}},DK:{reg:25,u:21,hg:{c:4,a:4}},
  SA:{reg:25,u:21,hy:{n:2,a:22}},TR:{hy:{n:4,a:23}},NL:{bench:12},AR:{bench:12}};
const LGR_EST={EN2:1,IT2:1,PT:1,CH:1,BE:1};/* 등록·외국인 규정을 공식 문서로 확인 못 함 → 기존 값 유지('추정') */
const BAN_EST={PT:1,AT:1,CN:1,BE:1,SA:1};
Object.assign(SQR,{ES:{h:3},ES2:{h:2},FR:{h:4},FR2:null/* 리그2 비EU 2명은 △ → 제한 없음 유지(리그1 규정을 물려받지 않게) */,SA:{h:10,m:8}});
Object.assign(BAN_R,{AR:{every:5},US:{every:5,gb:1},SC:{every:6},DK:{thr:[5,9,13],tail:4}});
function lgRaw(c){const C=CLUBS[c];return C?C.lg:null}
function lgR(c){return LGR[lgRaw(c)]||{}}
/* 라리가2는 baseLg로 라리가 규정을 물려받던 것 → 자기 리그 규정 먼저 */
{const _r=sqrRule;sqrRule=function(c){const lg=lgRaw(c);if(lg&&(lg in SQR))return SQR[lg];return _r.apply(this,arguments)}}
function regBase(c){return sqrOn()?(lgR(c).reg||30):99}
function regEx(p,c){const L=lgR(c);return !!(L.u&&p&&p.dob&&+p.dob.slice(0,4)>=S.season-L.u)}
function fyoung(p,c){const L=lgR(c);return !!(L.hy&&p&&p.dob&&+p.dob.slice(0,4)>=S.season-L.hy.a)}
function hgK(p,c){return typeof hgStat==='function'?hgStat(p,c):null}
function benchN(c){return lgR(c).bench||9}
// 비EU 모드(라리가·라리가2·리그1): '외국인' = EU·EEA·스위스 여권이 없고 규정 이전부터 있던 선수가 아닌 선수
function euGf(p,c){if(!p)return false;const q=S.ps[p.id];if(q&&q.gf===c)return true;const b=BASE[p.id];return !!(b&&b.club===c&&!(q&&q.loanFrom!=null&&q.loanFrom!==c))}
{const _f=isFor;isFor=function(p,c){if(lgR(c).eu){if(!p||!p.nat)return false;if(NT_EU_NAT.has(p.nat)||(p.nat2&&NT_EU_NAT.has(p.nat2)))return false;return !euGf(p,c)}return _f.apply(this,arguments)}}
// 등록 인원·홈그로운
{const _rs=regSize;regSize=function(c){if(!sqrOn())return _rs.apply(this,arguments);return squadOf(c).filter(p=>!resOf(p.id)&&!regEx(p,c)).length}}
function regList(c){return squadOf(c).filter(p=>!resOf(p.id)&&!regEx(p,c))}
function regFeas(c,list){const L=lgR(c),mx=regBase(c);if(list.length>mx)return false;if(!L.hg)return true;let a=0,ch=0,ah=0;for(const p of list){const k=hgK(p,c);if(k==='c')ch++;else if(k==='a')ah++;else a++}
  const co=Math.max(0,ch-L.hg.c),ao=Math.max(0,ah+co-L.hg.a);return a+ao<=mx-L.hg.c-L.hg.a}
function regCanAdd(c,p){if(!sqrOn())return true;if(regEx(p,c))return true;return regFeas(c,regList(c).filter(x=>x.id!==p.id).concat([p]))}
function regOver(c){return sqrOn()&&!regFeas(c,regList(c))}
function regMax(c){const L=lgR(c),mx=regBase(c);if(!L.hg)return mx;let ch=0,ah=0;for(const p of squadOf(c)){if(regEx(p,c))continue;const k=hgK(p,c);if(k==='c')ch++;else if(k==='a')ah++}
  return mx-L.hg.c-L.hg.a+Math.min(L.hg.c,ch)+Math.min(L.hg.a,ah+Math.max(0,ch-L.hg.c))}
function regTxt(c,short){const L=lgR(c);let t=`1군 등록 ${regSize(c)}/${regMax(c)}명`;if(L.hg&&!short){const list=regList(c);const non=list.filter(p=>!hgK(p,c)).length;t+=` (비홈그로운 ${non}/${regBase(c)-L.hg.c-L.hg.a})`}
  if(L.u&&!short)t+=` · ${S.season-L.u}년 이후 출생 ${squadOf(c).filter(p=>!resOf(p.id)&&regEx(p,c)).length}명 별도`;return t}
// 외국인 어린 선수 몫(튀르키예·사우디)
function forOldCnt(c,ex){return squadOf(c).filter(q=>q.id!==ex&&!resOf(q.id)&&isFor(q,c)&&!fyoung(q,c)).length}
function quotaY(p,c){if(!sqrOn()||c==null||c<0||!CLUBS[c])return true;const L=lgR(c),R=sqrRule(c);if(!L.hy||!R||!R.h||!isFor(p,c)||fyoung(p,c)||clubOf(p.id)===c)return true;return forOldCnt(c,p.id)<R.h-L.hy.n}
function quotaYTxt(c){const L=lgR(c),R=sqrRule(c);return `${LGN[lgRaw(c)]||'리그'} 규정상 1군 외국인 ${R.h}명 중 ${L.hy.n}명은 ${S.season-L.hy.a}년 이후 출생이어야 합니다(그보다 나이 많은 외국인 ${forOldCnt(c)}/${R.h-L.hy.n}명).`}
function lgQuotaOver(c){const R=sqrRule(c),L=lgR(c);if(!sqrOn()||!R||!R.h)return false;if(forCnt(c)>R.h)return true;return !!(L.hy&&forOldCnt(c)>R.h-L.hy.n)}
{const _q=quotaOK;quotaOK=function(p,to,ai){if(!_q.apply(this,arguments))return false;if(quotaY(p,to))return true;
  /* AI: 더 나은 선수면 영입 후 가장 약한 나이 많은 외국인을 2군으로(completeTransfer → resAssignAI) */if(ai??(to!==S.club)){const w=squadOf(to).filter(q=>q.id!==p.id&&!resOf(q.id)&&isFor(q,to)&&!fyoung(q,to)&&!q.loanFrom).sort((a,b)=>a.ovr-b.ovr)[0];return !!w&&p.ovr>=w.ovr+3}return false}}
{const _os=offerSheet;offerSheet=function(id){try{const p=pl(id);if(p&&clubOf(id)!==S.club&&!quotaY(p,S.club)){sheet(`<button class="x" data-close>닫기</button><h3>${esc(p.name)}</h3><p class="note" style="margin:8px 0">${esc(quotaYTxt(S.club))} 나이 많은 외국인을 2군으로 내리거나 내보낸 뒤 제안할 수 있습니다.</p><button class="btn ghost" data-player="${id}" style="display:block;width:100%">선수 보기</button>`);return}}catch(e){console.error(e)}return _os.apply(this,arguments)}}
// MLS 무경고 감경: 마지막 경고 뒤 구단 리그 경기 5경기마다 누적 1장 감소(시즌 3번까지, 이미 받은 징계 단계 아래로는 안 내려감)
{const _bp=banProc;banProc=function(sc,clubs,cards,f){try{if(sc==='lg')for(const x of cards||[]){if(!x.y)continue;const c=clubOf(x.pid);if(c==null||c<0||!BAN_R[lgRaw(c)]||!BAN_R[lgRaw(c)].gb)continue;const cd=S.ps[x.pid]&&S.ps[x.pid].cd;
    if(!cd||cd.s!==S.season||!(cd.lg>0)||!cd.ly)continue;const k=(typeof fxLg==='function'?fxLg(lgRaw(c)):[]).filter(g=>g.res&&(g.h===c||g.a===c)&&g.d>cd.ly&&g.d<S.date).length;
    const red=Math.min(Math.floor(k/5),3-(cd.gb||0),cd.lg%5);if(red>0){cd.lg-=red;cd.gb=(cd.gb||0)+red}}}catch(e){console.error(e)}
  const r=_bp.apply(this,arguments);try{for(const x of cards||[]){if(!x.y)continue;const q=S.ps[x.pid];if(q&&q.cd&&q.cd.s===S.season)q.cd.ly=S.date}}catch(e){}return r}}
// 규정 안내 문구
function banTxt(c){const R=banRule(c);if(R.en)return '경고 5·10·15장(정해진 기간 안) 1·2·3경기';let t=R.thr?`경고 ${R.thr.join('·')}장${R.tail?`, 이후 ${R.tail}장마다`:''}`:`경고 ${R.every}장마다`;t+=R.lens?' 1경기(두 번째부터 2경기)':' 1경기';if(R.gb)t+=' · 5경기 연속 무경고면 1장 감소(시즌 3번)';return t}
sqrRuleTxt=function(c){const R=sqrRule(c),L=lgR(c),lg=lgRaw(c),a=[];const fn=L.eu?'비EU':'외국인';
  if(R&&R.h)a.push(`1군 ${fn} ${R.h}명${L.hy?`(그중 ${L.hy.n}명은 ${S.season-L.hy.a}년 이후 출생)`:''}${L.eu?'(규정 이전 소속 선수 제외)':''}`);
  if(R&&R.m)a.push(`경기 명단(선발+벤치) 외국인 ${R.m}명`);
  a.push(`1군 등록 ${regBase(c)}명${L.hg?(L.hg.c?` 중 ${L.hg.c+L.hg.a}명은 홈그로운(구단 육성 ${L.hg.c}명), 모자라면 명단 축소`:` 중 비홈그로운 ${regBase(c)-L.hg.a}명까지`):''}${L.u?` · ${S.season-L.u}년 이후 출생은 등록 인원 밖`:''}`);
  a.push(`계약 선수 ${OWNMAX}명 · 벤치 ${benchN(c)}명 · ${banTxt(c)}${BAN_EST[lg]?'(추정)':''}`);if(LGR_EST[lg])a.push('외국인·등록 규정 일부 추정');return a.join(' · ')};
// 기존 세이브: v311 이전에 비EU 모드 리그 구단으로 온 비EU 선수는 인정(바로 불이익 없음) + 사용자 안내
function mig311(){if(!S||S.mig311)return;S.mig311=1;let n=0;for(const C of CLUBS){if(!C||C.i<0||!LGR[C.lg]||!LGR[C.lg].eu)continue;for(const p of squadOf(C.i)){if(NT_EU_NAT.has(p.nat)||(p.nat2&&NT_EU_NAT.has(p.nat2)))continue;if(euGf(p,C.i))continue;(S.ps[p.id]=S.ps[p.id]||{}).gf=C.i;n++}}
  try{if(S.club!=null&&S.club>=0&&!(typeof unemp==='function'&&unemp())){const c=S.club,w=[];if(regOver(c))w.push(`${regTxt(c)} — 다음 이적시장 마감 전까지 2군으로 내려 맞춰야 합니다.`);if(lgQuotaOver(c))w.push(lgR(c).hy?quotaYTxt(c):`1군 외국인 ${forCnt(c)}/${sqrRule(c).h}명`);
    inbox('board','',`${LGN[lgRaw(c)]||'리그'} 실제 규정 적용`,`리그별 실제 선수단 규정이 들어갔습니다: ${sqrRuleTxt(c)}.${w.length?'\n'+w.join('\n'):''}\nAI 구단도 같은 규정을 따르며, 다음 이적시장부터 2군 배정에 반영됩니다.`)}}catch(e){console.error(e)}return n}
{const _dl=devLoad;devLoad=function(){const r=_dl.apply(this,arguments);try{mig311()}catch(e){console.error(e)}return r}}
{const _sg=startGame;startGame=function(){const r=_sg.apply(this,arguments);try{if(S)S.mig311=1}catch(e){}return r}}
