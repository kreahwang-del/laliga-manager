// ================= 언론 이슈(v90): 이적설 · 불만 선수의 언론 플레이 =================
// 이적설: 매주 월요일 약 12%로 우리 팀 핵심(팀 내 능력 상위)·불만 선수에 대한 빅클럽 관심 보도 → 대응에 따라 선수 만족도와 실제 제안 가능성이 달라짐
// 언론 플레이: 만족도 30 미만 선수가 주당 6% 확률로 언론에 불만 토로(최근 30일 안에 했으면 제외) → 감싸기/내부 처리/공개 비판
function mdCand(){const sq=squadOf(S.club).slice().sort((a,b)=>b.ovr-a.ovr);return sq.slice(0,8).map((p,i)=>{const q=S.ps[p.id]||{};return [p,(8-i)*(1+Math.max(0,60-(q.happy??65))/30)*(ageOf(p)<30?1.2:.7)]}).filter(([p])=>!(S.ps[p.id]||{}).rumor&&!p.loanFrom)}
function mdRumor(){const C=mdCand();if(!C.length)return;const tot=C.reduce((a,x)=>a+x[1],0);let u=Math.random()*tot,p=C[0][0];for(const [q,w] of C){u-=w;if(u<=0){p=q;break}}
  const my=CLUBS[S.club].rep;const big=CLUBS.filter(c=>c.i!==S.club&&c.rep>=Math.min(96,my+3)&&(S.aiBudget[c.i]||0)>=p.val*.5);if(!big.length)return;const b=big[Math.floor(Math.random()*big.length)];
  const src=['현지 유력지','이적 전문 기자',`${({ES:'스페인',EN:'잉글랜드',IT:'이탈리아',DE:'독일',FR:'프랑스',PT:'포르투갈',NL:'네덜란드',BE:'벨기에',TR:'튀르키예',SC:'스코틀랜드',CH:'스위스',AT:'오스트리아',DK:'덴마크',KR:'한국',JP:'일본',CN:'중국',SA:'사우디',US:'미국',MX:'멕시코',AR:'아르헨티나',BR:'브라질'})[baseLg(CLUBS[S.club]&&CLUBS[S.club].lg||'ES')]||'현지'} 스포츠 일간지`,'상대 구단 측 소식통'][Math.floor(Math.random()*4)];
  const q=S.ps[p.id]=S.ps[p.id]||{};q.rumor={c:b.i,d:S.date};
  inbox('media','',`이적설 · ${b.name}, ${p.name} 관심`,`${src}에 따르면 ${b.name}이(가) ${p.name}(${ageOf(p)}세)을 주시하고 있습니다. 기자들이 감독의 입장을 묻습니다.`,{md:{k:'rumor',pid:p.id,c:b.i,opts:[['block','"절대 팔지 않는다"'],['none','"노코멘트"'],['open','"좋은 제안이면 들어보겠다"']]}})}
function mdMoan(){const sq=squadOf(S.club).filter(p=>{const q=S.ps[p.id]||{};return (q.happy??65)<30&&!(q.injD>0)&&!(q.moanAt&&daysBetween(q.moanAt,S.date)<30)});if(!sq.length)return;const p=sq[Math.floor(Math.random()*sq.length)];if(Math.random()>.06*sq.length)return;
  const q=S.ps[p.id];q.moanAt=S.date;const why=(q.apps||0)<5&&!(q.injLong===S.season)?'출전 시간':'팀 내 대우';
  inbox('media','',`${p.name}, 언론에 불만 토로`,`${p.name}이(가) 인터뷰에서 "${why}에 만족하지 못한다. 미래를 고민하겠다"고 말했습니다. 선수단과 언론이 감독의 반응을 지켜봅니다.`,{md:{k:'moan',pid:p.id,opts:[['back','공개적으로 감싸기'],['quiet','내부 문제로 처리'],['crit','공개 비판']]}})}
function mdAnswer(m,o){const md=m.md,p=pl(md.pid),q=S.ps[md.pid]=S.ps[md.pid]||{};let res='';const amb=(p.ovr>=CLUBS[S.club].rep-2)||ageOf(p)<=24;
  if(md.k==='rumor'){if(o==='block'){mgHappy(amb?-6:3,[md.pid]);q.rumor=null;res=amb?`${p.name}은(는) 기회를 막았다며 서운해합니다(만족도 −6)`:`${p.name}이(가) 신뢰에 감사해합니다(만족도 +3)`}
    else if(o==='none'){mgHappy(-2,[md.pid]);if(Math.random()<.35)q.rumor={c:md.c,at:addD(S.date,7+Math.floor(Math.random()*8))};else q.rumor=null;res='소문은 당분간 이어질 전망입니다(만족도 −2)'}
    else{mgHappy(amb?5:-1,[md.pid]);mgHappy(-1);q.rumor={c:md.c,at:addD(S.date,5+Math.floor(Math.random()*8))};res=`${p.name}의 마음이 흔들립니다. 선수단 분위기가 조금 어수선해졌습니다(선수단 만족도 −1)`}}
  else{if(o==='back'){mgHappy(6,[md.pid]);mgHappy(-1,squadOf(S.club).filter(x=>x.id!==md.pid).map(x=>x.id));res='선수는 누그러졌지만 다른 선수들은 특별 대우로 봅니다(본인 +6, 나머지 −1)'}
    else if(o==='quiet'){mgHappy(3,[md.pid]);res='면담으로 수습했습니다(만족도 +3)'}
    else{mgHappy(-10,[md.pid]);mgHappy(1,squadOf(S.club).filter(x=>x.id!==md.pid).map(x=>x.id));if(typeof mgMorale==='function')try{mgMorale(-2)}catch(e){};res='기강을 잡았지만 선수와의 관계가 크게 틀어졌습니다(본인 −10, 나머지 +1)'}}
  m.done=true;m.read=true;m.result=res;mlog(`${m.title} → ${res}`);save();render();toast(res)}
// 실제 제안으로 이어짐(대응에 따라 확률)
function mdOffers(){squadOf(S.club).forEach(p=>{const q=S.ps[p.id];if(!q||!q.rumor||!q.rumor.at||q.rumor.at>S.date)return;const c=q.rumor.c;q.rumor=null;if(S.inbox.some(m=>m.type==='offer'&&m.pid===p.id&&!m.done))return;
  const fee=Math.round(p.val*AGEK(ageOf(p))*(.95+.25*Math.random())/1e5)*1e5;if((S.aiBudget[c]||0)<fee*.8)return;
  mlog(`이적설 현실화 · ${CLUBS[c].name}, ${p.name} 공식 제안`);inbox('offer','',`${CLUBS[c].name}의 ${p.name} 영입 제안`,`이적설이 현실이 됐습니다. 이적료 ${money(fee)} 제안이 들어왔습니다.`,{pid:p.id,from:c,fee,max:Math.round(p.val*AGEK(ageOf(p))*1.2)})})}
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);try{if(S&&S.club>=0&&!(typeof unemp==='function'&&unemp())){mdOffers();if(D(S.date).getUTCDay()===1){if(Math.random()<.12)mdRumor();mdMoan()}}}catch(e){console.error(e)}return r}}
{const _mh=msgHTML;msgHTML=function(m){if(m.type!=='media')return _mh(m);const md=m.md;return `<div class="msg ${m.read?'':'new'}"><div class="h"><span>${fmtD(m.d)}</span><span>언론</span></div><b>${esc(m.title)}</b><p>${esc(m.body)}${m.result?` <span style="color:var(--text)">→ ${esc(m.result)}</span>`:''}</p>${m.done?'':`<div class="acts" style="flex-wrap:wrap">${md.opts.map(([k,l])=>`<button class="btn sm ghost" data-md="${k}" data-msg="${m.id}">${esc(l)}</button>`).join('')}</div>`}</div>`}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-md]');if(!b||!S)return;e.stopPropagation();e.preventDefault();const m=S.inbox.find(x=>x.id===+b.dataset.msg);if(!m||m.done)return;mdAnswer(m,b.dataset.md)},true);

// 기록: 언론 대응·유스 이정표 모아 보기(선수 관리 화면 아래)
function mlog(t){S.mlog=S.mlog||[];S.mlog.unshift({d:S.date,t});S.mlog=S.mlog.slice(0,80)}
{const _mv=mgView;mgView=function(){const h=_mv.apply(this,arguments);try{const L=S.mlog||[];return h+`<section class="card pad" style="margin-top:12px"><h2 style="margin-top:0">언론·이정표 기록</h2>${L.length?L.slice(0,40).map(x=>`<div class="li" style="padding:6px 0;border-bottom:1px solid var(--line)"><span class="nm"><span><b style="font-weight:600">${esc(x.t)}</b><span>${fmtD(x.d)}</span></span></span></div>`).join(''):'<p class="note">아직 기록이 없습니다. 이적설 대응, 선수 불만 대응, 유스 출신 데뷔·첫 골 등이 여기에 쌓입니다.</p>'}</section>`}catch(e){return h}}}

