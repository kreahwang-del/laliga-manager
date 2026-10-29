// ================= 이적료 할인 요인(v103): 마감 임박·이적 요청·재정 압박·AI 판매 명단·협상 양보 =================
// 기존 희망가(asking) × 할인 계수. 바이아웃 상한은 기존대로(할인 후 값이 더 낮으면 그 값)
// ① 마감 임박: 이적시장 마지막 14일, 남은 일수에 비례해 계획 밖 선수(팀 내 12위 이하) 최대 15%, 주전급 최대 5%
// ② 이적 요청·불만: 만족도 35 미만 15%, 50 미만 7% / AI 선수는 출전이 적은 22~30세(팀 내 15위 이하)를 '출전 원함'으로 보고 8%
// ③ 재정 압박: 파는 구단 이적 예산이 마이너스면 12%, 연봉 총액이 한도의 95% 이상이면 7%
// ④ AI 판매 명단: 시즌마다 구단별로 팀 내 17위 이하, 또는 31세 이상이면서 12위 이하 → 20%
// ⑤ 협상 양보: 상대가 역제안(희망가의 80% 이상 제시)할 때마다 희망가를 3~5%씩 낮춤(누적 최대 10%), 협상 결렬 시 초기화
// 할인은 곱해서 적용하되 합계 최대 40%
function prWage(c){S._prw=S._prw&&S._prw.d===S.date?S._prw:{d:S.date,v:{}};if(S._prw.v[c]==null){const cap=CLUBS[c]&&CLUBS[c].wageCap?CLUBS[c].wageCap*1e6:0;S._prw.v[c]=cap?wageBill(c)/cap:0}return S._prw.v[c]}
function prListed(p,c){const rk=rankInClub(p);return rk>=17||(ageOf(p)>=31&&rk>=12)}
function prFactors(p,buyer){const c=clubOf(p.id);const out=[];if(c==null||c<0||c===S.club||c===FA||!CLUBS[c])return out;const rk=rankInClub(p);
  const w=winNow();if(w){const left=daysBetween(S.date,w.to);if(left<=14){const k=(14-left)/14;const d=(rk>=12?.15:.05)*k;if(d>.005)out.push([d,`이적시장 마감 ${left}일 전`])}}
  const q=S.ps[p.id]||{};const hp=q.happy;if(hp!=null&&hp<35)out.push([.15,'선수가 이적 원함']);else if(hp!=null&&hp<50)out.push([.07,'선수 불만']);
  else if(rk>=15&&ageOf(p)>=22&&ageOf(p)<=30)out.push([.08,'출전 기회 원함']);
  if((S.aiBudget[c]??1)<0)out.push([.12,'구단 재정 압박(예산 적자)']);else if(prWage(c)>=.95)out.push([.07,'연봉 총액 부담']);
  if(prListed(p,c))out.push([.2,'판매 명단']);
  if(buyer===S.club){const n=S.negs[p.id];if(n&&n.cd>0)out.push([n.cd,'협상 양보'])}
  return out}
function prDisc(p,buyer){const f=prFactors(p,buyer);let m=1;f.forEach(([d])=>m*=1-d);return Math.max(.6,m)}
{const _as=asking;asking=function(p,buyer){const a=_as.apply(this,arguments);try{if(!a)return a;const m=prDisc(p,buyer);return m<1?Math.round(a*m/1e5)*1e5:a}catch(e){return a}}}
// 협상 양보: 역제안 단계에서 상대가 내려옴
{const _cr=clubRespond;clubRespond=function(p,o){const n0=S.negs[p.id];const r=_cr.apply(this,arguments);try{const n=S.negs[p.id];if(!n)return r;
  if(r.k==='mid'&&!(o&&o.loan)){const step=.03+.02*hsh(p.id+'cd'+n.tries);n.cd=Math.min(.10,(n.cd||0)+step);const na=asking(p,S.club);n.counter=na;/* v218 양보한 새 희망가가 이미 우리 제안 이하이면 그 자리에서 수락(예전엔 '제시액보다 낮은 희망가'를 다시 요구) */{const tr=n.tries,ctr=n.counter;if(effOffer(o)>=na||(o&&o.tp&&o.tp.length)){const r2=_cr.apply(this,arguments);if(r2&&r2.k==='ok'){r2.msg=`${CLUBS[clubOf(p.id)].name}이 한 발 물러서 제안을 수락했습니다(협상으로 ${Math.round(n.cd*100)}% 양보). 이제 선수와 개인 조건을 협상하세요.`;return r2}n.tries=tr;n.counter=ctr;n.stage=n.stage==='broken'&&tr<3?'club':n.stage}}
    r.msg=`${CLUBS[clubOf(p.id)].name}이 한 발 물러섰습니다. 새 희망가 ${money(na)} (일시불 기준, 협상으로 ${Math.round(n.cd*100)}% 양보). 이 금액 이상이면 수락합니다.${o&&o.tp&&o.tp.length?' (현금 + 포함 선수 평가액 합계 기준)':''}`}
  if(n.stage==='broken')n.cd=0;
  if(r.k==='no'&&n.stage!=='broken'){const f=prFactors(p,S.club).filter(x=>x[1]!=='협상 양보');if(f.length)r.msg+=` 할인 요인: ${f.map(x=>`${x[1]} −${Math.round(x[0]*100)}%`).join(', ')}.`}}catch(e){console.error(e)}return r}}
// 제안 화면에 할인 요인 표시
{const _os=offerSheet;offerSheet=function(id,step){const r=_os.apply(this,arguments);try{const bo=document.querySelector('[data-act="sendOffer"]');if(!bo)return r;const p=pl(id);const f=prFactors(p,S.club);if(!f.length)return r;
  bo.insertAdjacentHTML('beforebegin',`<p class="note" style="color:var(--good)">가격 협상 여지: ${f.map(x=>`${esc(x[1])} −${Math.round(x[0]*100)}%`).join(' · ')} (합계 최대 40%)</p>`)}catch(e){console.error(e)}return r}}

