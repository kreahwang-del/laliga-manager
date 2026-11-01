// ================= v270 상대 감독의 맞춤 대비 보이기 + '연구당함'(사용자 요청 2026-11-01, 디자인·플레이테스트 에이전트 의견) =================
// 기존(0540 aiPlan·aiPlan2): 경기 직전 AI가 사용자 그 경기 전술 상성을 보고 확률 q로 상성 전술로 바꾸고, 전력 차 크면 대형 조정, 사용자 에이스(84+) 전담 마크 → 화면에 안 보였음
// ① 경기 시작 첫 중계와 경기 후 리포트에 상대의 실제 대비를 공개 ② 경기 전 분석 칸에 '가능성'만 예고(실제 선택은 숨김, 킥오프 때 최종 전술로 다시 판단)
// ③ 연구당함: 같은 성향 리그 3연승(또는 최근 5경기 같은 성향 4승+)부터 1~3단계. 단계당 사용자 상대 q +0.08, 상성 아닐 때 대응 확률 q×(0.5+0.1×단계), 대응 숙련도 감점 −(10−2×단계)
//    풀림: 다른 성향으로 2경기 → 1단계↓, 패배 → 1단계↓. 대형만 바꾸면 안 풀림. 단계 변화는 소식·분석 칸으로 미리 알림
function aigStudyLv(pre){const s=S&&S.aigStudy;return s&&s.lv>0&&(pre==null||s.pre===pre)?s.lv:0}
{const _q=aiQ;aiQ=function(c,vsUser){let q=_q.apply(this,arguments);try{if(vsUser&&S.tac){const lv=aigStudyLv(S.tac.preset);if(lv)q=Math.min(.98,q+.08*lv)}}catch(e){}return q}}
function aigStudyUpdate(pre,r){try{if(!pre)return;const H=S.aigHist=S.aigHist||[];H.push({d:S.date,pre,r});if(H.length>10)H.shift();const st=S.aigStudy=S.aigStudy||{pre:null,lv:0,other:0};const lv0=st.lv,pre0=st.pre;
  if(st.lv>0&&r==='L')st.lv--;
  if(st.lv>0&&pre!==st.pre){st.other=(st.other||0)+1;if(st.other>=2){st.lv--;st.other=0}}else if(pre===st.pre)st.other=0;
  if(r==='W'){let k=0;for(let i=H.length-1;i>=0&&H[i].pre===pre&&H[i].r==='W';i--)k++;const L5=H.slice(-5);const trig=k>=3||(L5.length===5&&L5.every(x=>x.pre===pre)&&L5.filter(x=>x.r==='W').length>=4);
    if(trig){if(st.pre!==pre||st.lv===0){st.pre=pre;st.lv=1;st.other=0}else st.lv=Math.min(3,st.lv+1)}}
  if(st.lv<=0){st.lv=0;st.pre=null}
  const nm=CLUBS[S.club]&&CLUBS[S.club].short||'';
  if(st.lv>lv0||(st.pre&&st.pre!==pre0&&st.lv>0)){S.news.unshift({d:S.date,t:st.lv>=3?`상대 감독들 "${nm}의 '${st.pre}'은 이제 익숙하다"`:`리그가 ${nm}의 '${st.pre}'을(를) 연구하기 시작(${st.lv}/3단계)`,v:0,big:st.lv>=3})}
  else if(lv0>0&&st.lv<lv0){S.news.unshift({d:S.date,t:st.lv?`${nm} 전술 변화에 상대들 대비 약해짐(연구 ${st.lv}/3단계)`:`새 전술에 상대들이 아직 적응하지 못함 — ${nm} 연구 해제`,v:0})}}catch(e){console.error(e)}}
/* 경기 시작: 상대의 실제 대비 공개(첫 중계) */
function aigPlanOf(T,c){if(!T)return null;const base=S.aiTac&&S.aiTac[c];const o={};if(T._plan&&base&&T._plan!==base.preset)o.pre=[base.preset,T._plan];if(T._planF&&base&&base.form&&T._planF!==base.form.base)o.form=[base.form.base,T._planF];
  if(T._planM){let d=null;try{const i=(T.marks||[]).findIndex(m=>m&&m.on);if(i>=0)d=T.xi[i].name}catch(e){}o.mk=[T._planM,d]}return (o.pre||o.form||o.mk)?o:null}
function aigPlanTxt(o){const a=[];if(o.pre)a.push(`평소 '${o.pre[0]}' 대신 우리에 강한 '${o.pre[1]}'로 나왔습니다`);if(o.form)a.push(`대형을 ${o.form[0]} → ${o.form[1]}로 바꿨습니다`);if(o.mk)a.push(`${shortName(o.mk[0])}에게 ${o.mk[1]?shortName(o.mk[1])+'의 ':''}전담 마크`);return a}
{const _sm=startMatch;startMatch=function(fx){const r=_sm.apply(this,arguments);try{if(M&&M.H&&M.Aw){const T=M.me===0?M.Aw:M.H,c=T.club;const o=aigPlanOf(T,c);M.aigPlan=o;if(o)setTimeout(()=>{try{feed({m:0,t:'sys',txt:`🧠 상대 감독의 대비: ${aigPlanTxt(o).join(' · ')}`})}catch(e){}},80)}}catch(e){console.error(e)}return r}}
/* 경기 종료: 연구당함 갱신(리그 경기) + 리포트에 대비 기록 */
{const _fi=finish;finish=function(){let info=null;try{if(M&&!M.done&&M.H&&M.Aw){const us=M.me===0?M.H:M.Aw;info={pre:us.preset,league:!!M.league}}}catch(e){}const r=_fi.apply(this,arguments);
  try{if(info&&info.league&&M&&M.res){const sc=M.res.sc,me=M.me;const res=sc[me]>sc[1-me]?'W':sc[me]<sc[1-me]?'L':'D';aigStudyUpdate(info.pre,res)}}catch(e){console.error(e)}return r}}
{const _br=buildReport;buildReport=function(res,me,fx){const R=_br.apply(this,arguments);try{if(R&&M&&M.aigPlan){R.aigPlan=M.aigPlan;const o=M.aigPlan;if(o.mk){const id=(Object.values(M.m.P[me]||[]).find(a=>a.p&&a.p.name===o.mk[0])||{}).p;const rt=id&&res.ratings&&res.ratings[id.id];R.aigPlan.mkR=rt!=null?+(+rt).toFixed(1):null}}}catch(e){}return R}}
{const _rh=reportHTML;reportHTML=function(R){let h=_rh.apply(this,arguments);try{if(R&&R.aigPlan){const a=aigPlanTxt(R.aigPlan);if(R.aigPlan.mkR!=null)a.push(`전담 마크 당한 ${shortName(R.aigPlan.mk[0])} 평점 ${R.aigPlan.mkR}`);
  h+=`<h2>상대 감독의 대비</h2><div class="card pad"><ul class="note" style="margin:0;padding-left:18px;line-height:1.7">${a.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div>`}}catch(e){}return h}}
/* 경기 전 분석 칸: 가능성만 예고 */
function aigLab(p){return p>=.6?'높음':p>=.3?'있음':'낮음'}
{const _bs=bpStaff;bpStaff=function(pr){let h=_bs.apply(this,arguments);try{if(!h||!pr||!pr.them||!S.tac)return h;const c=pr.them.club;const base=(S.aiTac&&S.aiTac[c])||pr.them;const their=base.preset,mine=S.tac.preset;const B=E3.BEATS;const q=aiQ(c,true),lv=aigStudyLv(mine);const t=[];
  if((B[their]||[]).includes(mine))t.push(`상대 평소 전술 '${their}'은(는) 우리 '${mine}'에 강한 상성입니다`);
  else{const opts=Object.keys(B).filter(k=>(B[k]||[]).includes(mine));if(opts.length){const p=(B[mine]||[]).includes(their)?q:q*(.5+.1*lv);t.push(`상대 감독이 우리 '${mine}'에 강한 '${opts.join("'·'")}' 쪽으로 바꿀 가능성 <b>${aigLab(p)}</b>`)}}
  const star=(pr.us&&pr.us.xi||[]).filter(p=>['ST','W','AM'].includes(p.g)).sort((a,b)=>b.ovr-a.ovr)[0];if(star&&star.ovr>=84)t.push(`${esc(shortName(star.name))} 전담 마크 가능성 <b>${aigLab(q)}</b>`);
  if(lv)t.push(`리그가 우리 '${mine}'을(를) 연구 중 <b>${lv}/3단계</b> — 성향을 바꾸면 풀립니다`);
  if(!t.length)return h;const tile=`<div><small>상대 분석</small><p>${t.join('<br>')}</p></div>`;const k=h.lastIndexOf('</div>');return k>0?h.slice(0,k)+tile+h.slice(k):h}catch(e){return h}}}
