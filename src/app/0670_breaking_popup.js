// ================= 속보 팝업: 특별한 일이 있을 때만 =================
// 큐 S.hl에 쌓아 두었다가 경기 종료 화면을 닫을 때(또는 '계속' 진행이 멈출 때) 한 번에 보여줌
function hlPush(o){S.hl=(S.hl||[]);if(S.hl.some(x=>x.key&&x.key===o.key))return;S.hl.push(Object.assign({d:S.date},o));if(S.hl.length>12)S.hl=S.hl.slice(-12)}
function hlShow(){if(M||document.querySelector('#scrim')||document.querySelector('.busy'))return false;const L=(S.hl||[]).slice().sort((a,b)=>(b.pri||1)-(a.pri||1)).slice(0,5);if(!L.length)return false;S.hl=[];save();
  sheet(`<button class="x" data-close>닫기</button><div class="eyebrow" style="color:var(--amber)">속보</div><h3 style="margin-bottom:6px">${esc(L[0].t)}</h3>
   ${L.map((x,i)=>`<div class="hl ${x.tone||''}">${x.pid?avatar(pl(x.pid),'sm'):x.c!=null?crest(x.c):'<span class="av sm"><b>!</b></span>'}<div style="min-width:0">${i?`<b>${esc(x.t)}</b>`:''}<div class="note" style="margin-top:${i?2:0}px">${esc(x.b||'')}</div></div></div>`).join('')}`);
  return true}
// 1) 내 경기 결과에서 뽑기
function hlFromMatch(fx,res,me,pos0){if(!fx.r)return;const o=1-me,mine=fx.h===S.club?fx.h:fx.a,opp=mine===fx.h?fx.a:fx.h,g=[res.sc[me],res.sc[o]];
  const der=derbyOf(fx.h,fx.a);const W=g[0]>g[1],L=g[0]<g[1];
  if(der&&W)hlPush({key:'der'+S.date,pri:4,tone:'good',c:opp,t:`${der} 승리!`,b:`${CLUBS[mine].short} ${g[0]}-${g[1]} ${CLUBS[opp].short} · 팬들이 열광합니다`});
  if(der&&L)hlPush({key:'der'+S.date,pri:3,tone:'bad',c:opp,t:`${der} 패배`,b:`${g[0]}-${g[1]} · 팬들의 실망이 큽니다`});if(der&&!W&&!L)hlPush({key:'der'+S.date,pri:2,tone:'info',c:opp,t:`${der} 무승부`,b:`${g[0]}-${g[1]} · 승부는 다음 맞대결로`});
  if(Math.abs(g[0]-g[1])>=4)hlPush({key:'big'+S.date,pri:3,tone:W?'good':'bad',c:opp,t:W?`${CLUBS[opp].name}에 ${g[0]}-${g[1]} 대승`:`${CLUBS[opp].name}에 ${g[0]}-${g[1]} 대패`,b:W?'시즌 최고의 경기력':'충격적인 결과, 이사회가 주목합니다'});
  const pos=posOf(S.club),rd=S.fixtures.filter(f=>f.res&&(f.h===S.club||f.a===S.club)&&f.r).length;
  if(rd>=3&&pos===1&&pos0!==1)hlPush({key:'top'+S.date,pri:5,tone:'good',c:S.club,t:'리그 1위 등극!',b:`${rd}라운드 기준 선두 · 2위 ${CLUBS[table()[1].id].short}와 ${table()[0].pts-table()[1].pts}점 차`});
  if(rd>=3&&pos0===1&&pos!==1)hlPush({key:'top'+S.date,pri:3,tone:'bad',c:table()[0].id,t:'선두 자리를 내줬습니다',b:`새 1위 ${CLUBS[table()[0].id].name}`});
  if((typeof myDiv!=='function'||myDiv()===1)&&rd>=8&&pos>=18&&pos0<18)hlPush({key:'rel'+S.date,pri:3,tone:'bad',c:S.club,t:'강등권 추락',b:`${pos}위 · 이사회 신뢰도에 영향`});
  const all=(me===0?res.T[0]:res.T[1]).xi.concat(res.subs[me].map(x=>x.inP));
  all.forEach(p=>{const r=res.ratings[p.id];if(!r)return;
    if(r.g>=3)hlPush({key:'ht'+p.id+S.date,pri:4,tone:'good',pid:p.id,t:`${shortName(p.name)} 해트트릭!`,b:`${CLUBS[opp].name}전 ${r.g}골`});
    const q=S.ps[p.id]||{};const age=ageOf(pl(p.id));if(r.g>=1&&r.g<3&&age<=20&&(q.gl||0)===r.g)hlPush({key:'fg'+p.id,pri:3,tone:'good',pid:p.id,t:`${age}세 ${shortName(p.name)} 시즌 첫 골`,b:'유망주가 이름을 알립니다'});
    if(r.g>=1&&(q.gl||0)>=10&&(q.gl||0)-r.g<10)hlPush({key:'g10'+p.id+S.season,pri:2,tone:'good',pid:p.id,t:`${shortName(p.name)} 시즌 ${q.gl}호 골`,b:'두 자릿수 득점 달성'})});
  // 연승·연패
  const rec=recOf(S.club,`${S.season}-07-01`);let w=0,l=0,u=0;for(let i=rec.length-1;i>=0&&rec[i]===3;i--)w++;for(let i=rec.length-1;i>=0&&rec[i]===0;i--)l++;for(let i=rec.length-1;i>=0&&rec[i]>0;i--)u++;
  if(w===5||w===8)hlPush({key:'ws'+w+S.date,pri:3,tone:'good',c:S.club,t:`${w}연승 질주`,b:'팀 분위기 최고조'});
  if(l===4)hlPush({key:'ls'+S.date,pri:3,tone:'bad',c:S.club,t:'4연패 수렁',b:`이사회 신뢰도 ${Math.round(S.me?S.me.trust:0)}`});
  if(u===15)hlPush({key:'ub'+S.date,pri:3,tone:'good',c:S.club,t:'15경기 무패',b:'리그에서 가장 긴 무패 행진'})}
// 2) 이적: 관심 선수·대형 이적
{const _ct=completeTransfer;completeTransfer=function(id,to,fee,o){const from=clubOf(id);const r=_ct(id,to,fee,o);try{const p=pl(id);
  if(to!==S.club&&from!==S.club){
    if(S.watch&&S.watch.includes(id))hlPush({key:'w'+id+S.date,pri:4,pid:id,t:`관심 선수 ${shortName(p.name)} 이적`,b:`${from===FA?'자유계약':CLUBS[from].name} → ${CLUBS[to].name}${fee?` · ${money(fee)}`:''}`});
    else if(fee>=6e7)hlPush({key:'bt'+id,pri:2,pid:id,t:`${shortName(p.name)}, ${money(fee)}에 ${CLUBS[to].short} 이적`,b:`${from===FA?'자유계약':CLUBS[from].name} → ${CLUBS[to].name}`});
    else if(CLUBS[to].lg==='ES'&&(p.ovr>=85||fee>=3e7)&&S.exp&&S.exp[to]&&S.exp[to].ep<=6)hlPush({key:'rv'+id,pri:2,pid:id,t:`라이벌 ${CLUBS[to].short}, ${shortName(p.name)} 영입`,b:`${fee?money(fee):'자유계약'} · 능력치 ${p.ovr}`})}}catch(e){}return r}}
// 3) 감독 경질·선임(라리가)
if(typeof sackAI==='function'){const _sa=sackAI;sackAI=function(m,why){const c=m.c;_sa(m,why);try{hlPush({key:'sk'+c+S.date,pri:3,c,t:`${CLUBS[c].short} ${m.n} 감독 경질`,b:`${CLUBS[c].name} · 공석 요구 평판 ${reqRep(c)}${S.me&&S.me.rep>=reqRep(c)-10?' — 지원 가능':''}`})}catch(e){}}}
// 4) 시즌 종료: 우승
{const _ro2=rollover;rollover=function(){try{const tb=typeof tableOf==='function'?tableOf(1):table();const ch=tb[0].id;hlPush({key:'ch'+S.season,pri:6,tone:ch===S.club?'good':'',c:ch,t:ch===S.club?`${S.season}-${String(S.season+1).slice(2)} ${esc((typeof LGN!=='undefined'&&typeof hl==='function'&&LGN[hl()])||'라리가')} 우승!`:`${CLUBS[ch].name} ${esc((typeof LGN!=='undefined'&&typeof hl==='function'&&LGN[hl()])||'라리가')} 우승`,b:`승점 ${tb[0].pts}${ch===S.club||S.club<0?'':` · 우리 ${typeof divOf==='function'&&divOf(S.club)===2?'2부 '+posOf(S.club):tb.findIndex(t=>t.id===S.club)+1}위`}`})}catch(e){}_ro2()}}

render();
