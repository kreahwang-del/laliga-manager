// ================= 유스 아카데미 이야기(v90): 출신 구단 기록 · 1군 데뷔/첫 골/출전 이정표 · 시즌 유스 리포트 · 선수 정보 표시 =================
{const _my=makeYouth;makeYouth=function(c,y,o){const p=_my.apply(this,arguments);try{if(p&&p.youth)p.youth.c=c}catch(e){}return p}}
function ythOf(p){return p&&p.youth&&p.youth.c!=null?p.youth.c:null}
function ythMine(){return squadOf(S.club).filter(p=>ythOf(p)===S.club)}
// 경기 반영 전후로 우리 팀 유스 출신 선수의 출전·골 변화를 보고 소식 생성
{const _am=applyMatch;applyMatch=function(H,Aw,res,counts){const mineT=H.club===S.club||Aw.club===S.club;let snap=null;
  if(mineT&&counts&&!(typeof unemp==='function'&&unemp())){snap={};ythMine().forEach(p=>{const q=S.ps[p.id]||{};snap[p.id]=[q.apps||0,q.gl||0,(q.ythApps||0)]})}
  const r=_am.apply(this,arguments);
  try{if(snap){const opp=CLUBS[H.club===S.club?Aw.club:H.club];for(const id in snap){const q=S.ps[id]||{};const [a0,g0]=snap[id];const p=pl(+id);
    if((q.apps||0)>a0){q.ythApps=(q.ythApps||0)+1;
      if(!q.ythDebut){q.ythDebut=S.date;q.ythDebutVs=opp.short;S.yth=S.yth||{debuts:[]};S.yth.debuts.push({id:+id,n:p.name,d:S.date,age:ageOf(p),g:p.youth.grade});
        inbox('news','',`유스 출신 ${p.name} 1군 데뷔`,`${ageOf(p)}세 ${GN[p.g]} · ${opp.name}전. 아카데미 ${p.youth.y}년 입단(추정 등급 ${p.youth.est||p.youth.grade}).`);
        S.news.unshift({d:S.date,t:`${CLUBS[S.club].short} 유스 출신 ${p.name}(${ageOf(p)}세) 1군 데뷔`,v:0});if(typeof mlog==='function')mlog(`유스 출신 ${p.name} 1군 데뷔 (${ageOf(p)}세, ${opp.short}전)`)}
      if([50,100,200,300].includes(q.ythApps)){inbox('news','',`${p.name} 1군 ${q.ythApps}경기`,`유스 출신으로 우리 팀에서 ${q.ythApps}번째 경기를 뛰었습니다.`);if(typeof mlog==='function')mlog(`유스 출신 ${p.name} 1군 ${q.ythApps}경기`)}}
    if((q.gl||0)>g0&&!q.ythGoal){q.ythGoal=S.date;inbox('news','',`유스 출신 ${p.name} 1군 첫 골`,`${opp.name}전에서 데뷔 골을 넣었습니다.`);S.news.unshift({d:S.date,t:`${p.name}, 1군 데뷔 골`,v:0});if(typeof mlog==='function')mlog(`유스 출신 ${p.name} 1군 첫 골 (${opp.short}전)`)}}}}catch(e){console.error(e)}return r}}
// 시즌 끝(6월 1일): 유스 아카데미 리포트
{const _d=daily;daily=function(){const r=_d.apply(this,arguments);try{if(S.date.endsWith('-06-01')&&!(typeof unemp==='function'&&unemp())){const L=ythMine();if(L.length){
  const rows=L.map(p=>{const q=S.ps[p.id]||{};return {p,a:q.apps||0,g:q.gl||0,m:q.mins||0}}).sort((a,b)=>b.m-a.m);const deb=(S.yth&&S.yth.debuts||[]).filter(x=>x.d>=`${S.season}-07-01`);
  const best=rows[0];const fac=S.fac&&S.fac.c===S.club?S.fac.yo.l:null;
  inbox('news','',`${S.season}-${String(S.season+1).slice(2)} 유스 아카데미 리포트`,`1군 유스 출신 ${L.length}명 · 이번 시즌 데뷔 ${deb.length}명${deb.length?`(${deb.map(x=>x.n).join(', ')})`:''}. 가장 많이 뛴 선수: ${best.p.name} ${best.a}경기 ${best.g}골.${fac!=null?` 아카데미 시설 ${fac}단계.`:''}`)}}}catch(e){console.error(e)}return r}}
// 선수 정보: 유스 출신 표시
{const _ps=playerSheet;playerSheet=function(id){const r=_ps.apply(this,arguments);try{const p=pl(id),c=ythOf(p);if(c!=null){const q=S.ps[id]||{};const h=document.querySelector('.sheet h3')||document.querySelector('h3');
  if(h&&!document.getElementById('ythTag')){h.insertAdjacentHTML('afterend',`<div id="ythTag" class="note" style="margin:2px 0 8px"><span class="tag" style="background:var(--good);color:#06210f">유스</span> ${esc(CLUBS[c].name)} 아카데미 ${p.youth.y}년 입단${q.ythDebut?` · 1군 데뷔 ${fmtD(q.ythDebut)}${q.ythDebutVs?` ${esc(q.ythDebutVs)}전`:''} · 우리 팀 ${q.ythApps||0}경기`:c===S.club?' · 1군 데뷔 전':''}</div>`)}}}catch(e){}return r}}
// 이전 저장의 유스(출신 구단 기록 없음): 이적 기록이 없으면 현재 구단을 출신으로 간주
function ythBackfill(){if(!S||!S.gen||S.ythBF)return;for(const id in S.gen){const p=S.gen[id];if(p&&p.youth&&p.youth.c==null&&!(S.ps[id]&&S.ps[id].joined))p.youth.c=clubOf(+id)}S.ythBF=1}
{const _d=daily;daily=function(){try{ythBackfill()}catch(e){}return _d.apply(this,arguments)}}

