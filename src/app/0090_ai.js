// ================= AI =================
function aiDay(){
  const w=winNow(); if(!w)return;
  // AI 구단 간 이적(하루 평균 약 3건)
  const n=typeof aiBuyDay==='function'?(aiBuyDay(),0):Math.floor(rnd()*6);
  for(let k=0;k<n;k++){
    const buyers=CLUBS.filter(c=>c.i!==S.club&&(S.aiBudget[c.i]||0)>3e6);
    if(!buyers.length)break; const b=pickW(buyers,c=>S.aiBudget[c.i],rnd);
    const sq=squadOf(b.i); const byLine={GK:[],DF:[],MF:[],FW:[]}; sq.forEach(p=>byLine[LINE[p.g]].push(p.ovr));
    const need=Object.entries({GK:1,DF:4,MF:3,FW:3}).map(([L,n])=>[L,(byLine[L].sort((a,b)=>b-a)[n-1]||50)]).sort((a,b)=>a[1]-b[1])[0];
    const target=need[1]+1+Math.floor(rnd()*3);
    const cands=[];for(const id in BASE){const c=clubOf(+id);if(c===b.i||c===S.club||c===RET)continue;if(c!==FA&&sqSize(c)<=18)continue;const p=pl(+id);if(LINE[p.g]!==need[0]||p.ovr<target||p.ovr>target+6)continue;
      const cr=c===FA?30:CLUBS[c].rep;if(cr>b.rep+8)continue;cands.push(p);if(cands.length>40)break}
    if(!cands.length)continue; const p=cands[Math.floor(rnd()*cands.length)];
    const fee=clubOf(p.id)===FA?0:asking(p,b.i); if(fee>S.aiBudget[b.i])continue;
    if(clubOf(p.id)!==FA&&RIVAL(clubOf(p.id),b.i))continue;
    completeTransfer(p.id,b.i,fee,{cEnd:`${S.season+3}-06-30`,wage:Math.round(p.wage*1.2)});
  }
  // 우리 선수에 대한 제안
  const mine=squadOf(S.club);
  mine.forEach(p=>{
    const listed=p.listed; const star=p.ovr>=84; const pr=listed?.12:star?.006:.0015;
    if(rnd()>pr)return; if(S.inbox.some(m=>m.type==='offer'&&m.pid===p.id&&!m.done))return;
    const rich=CLUBS.filter(c=>c.i!==S.club&&(S.aiBudget[c.i]||0)>=p.val*.6&&c.rep>=Math.min(95,CLUBS[S.club].rep-25));
    if(!rich.length)return; const b=rich[Math.floor(rnd()*rich.length)];
    const base=listed&&p.askList?p.askList:p.val*AGEK(ageOf(p));
    const fee=Math.round(base*(.8+.3*rnd())/1e5)*1e5;
    if(p.clause&&fee>=p.clause*1e6*.999){}
    inbox('offer','',`${CLUBS[b.name?b.i:b.i].name}의 ${p.name} 영입 제안`,`이적료 ${money(fee)} 제안이 들어왔습니다.${listed?'':' (판매 명단에 없는 선수)'}`,{pid:p.id,from:b.i,fee,max:Math.round(p.val*AGEK(ageOf(p))*1.15*(CLUBS[b.i].rep>85?1.1:1))});
  });
  // 바이아웃 발동(드묾): 부유한 구단이 우리 라리가 스타의 바이아웃을 지불
  mine.filter(p=>p.clause&&p.ovr>=86).forEach(p=>{if(rnd()>.0008)return;const b=CLUBS.find(c=>c.i!==S.club&&c.rep>CLUBS[S.club].rep&&(S.aiBudget[c.i]||0)>=p.clause*1e6);
    if(!b)return;inbox('clause','',`${CLUBS[b.i].name}, ${p.name} 바이아웃 지불`,`${money(p.clause*1e6)}를 지불했습니다. 선수가 동의하면 이적이 확정됩니다.`,{pid:p.id,from:b.i,fee:p.clause*1e6})});
}
function weekly(){ // 매주: 선수 만족도·이적 요청
  squadOf(S.club).forEach(p=>{const q=S.ps[p.id]=S.ps[p.id]||{};
    const exp=q.promise??expectRole(p,S.club);const recent=(q.recentApps||[]).slice(-6);const share=recent.length?recent.reduce((a,b)=>a+b,0)/recent.length:.5;
    const want=exp===2?.75:exp===1?.4:.05; let h=q.happy??65; h+= (share-want)*5 + (p.pro-10)*.2 + (q.promise!=null&&share<want-.25?-4:0) + (h<60?.8:0); h=Math.max(0,Math.min(100,h)); q.happy=Math.round(h);
    if(h<20&&!q.reqAt&&ageOf(p)<33&&rnd()<.25){q.reqAt=S.date;inbox('request','',`${p.name} 면담 요청: 이적 희망`,`출전 기회가 부족하다며 이적을 원합니다. (만족도 ${q.happy})`,{pid:p.id})}});
}
function daily(){
  if(S.date.endsWith('-01')){const mo=+S.date.slice(5,7);if(mo>=8||mo<=5)devMonthly()}
  // 체력 회복·부상 회복
  for(const id in S.ps){const q=S.ps[id];if(q.fit!==undefined&&q.fit<100)q.fit=Math.min(100,q.fit+(q.played===S.date?0:3));if(q.injD>0){q.injD--;if(q.injD===0)q.retFlag=true}}
  // 스카우트
  S.scouts.forEach(s=>{if(S.date>=s.next){S.know[s.id]=Math.min(3,(S.know[s.id]??know(s.id))+1);s.next=addD(S.date,7);
    if(S.know[s.id]>=3){s.done=true;const p=pl(s.id);const rec=p.ovr>=ourLevel(p)+2?'영입 추천':p.pa>=ourLevel(p)+4?'잠재력 보고 영입 추천':'보류';
      inbox('scout','',`스카우트 보고: ${p.name}`,`능력치 ${p.ovr}, 잠재력 ${stars(p.pa)} · ${rec}`,{pid:s.id})}}});
  S.scouts=S.scouts.filter(s=>!s.done);
  aiDay();
  // 분할금·시즌 이벤트
  S.fin.later=S.fin.later.filter(x=>{if(S.date>=x.d){S.fin.budget-=x.v;S.fin.log.unshift({d:S.date,t:x.t,v:-x.v});return false}return true});
  S.windows.forEach(w=>{if(S.date===w.from)inbox('window','',`${w.k==='winter'?'겨울':'여름'} 이적시장 개장`,`${fmtD(w.to)}까지 영입·판매할 수 있습니다. 이적 예산 ${money(S.fin.budget)}.`);
    if(S.date===w.to)inbox('window','',`이적시장 마감일`,`오늘 자정에 이적시장이 닫힙니다.`)});
  if(D(S.date).getUTCDay()===1){weekly();updateConditions()}
}
function ourLevel(p){const sq=squadOf(S.club).filter(q=>LINE[q.g]===LINE[p.g]).sort((a,b)=>b.ovr-a.ovr);const n={GK:1,DF:4,MF:3,FW:3}[LINE[p.g]];return (sq[n-1]||{ovr:70}).ovr}
const stars=pa=>{const n=pa>=90?5:pa>=85?4.5:pa>=80?4:pa>=76?3.5:pa>=72?3:pa>=68?2.5:2;return '★'.repeat(Math.floor(n))+(n%1?'½':'')};
function inbox(type,_,title,body,extra={}){S.inbox.unshift(Object.assign({id:(S.mid=(S.mid||0)+1),type,d:S.date,title,body,done:false,read:false},extra));S.inbox=S.inbox.slice(0,120)}

