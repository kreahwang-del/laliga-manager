// ================= v147: 잉글랜드·독일·이탈리아·프랑스 3부(시뮬레이션 대기 명단) =================
// 3부 리그 경기는 돌리지 않고, 2부 강등 팀과 실제 2026/27 3부 구단 명단으로 '대기 명단(EN3X 등)'을 둔 뒤 시즌 말 전력+난수로 승격 팀을 뽑음
// 명단 출처: 영어 위키백과 '2026–27 EFL League One', DFB '3. Liga 2026/27 Teilnehmerfeld', calcioefinanza 'Gironi Serie C 2026/27', liguesdefoot.fr 'Ligue 3 2026/2027'
// 규정(2025/26~): 챔피언십 22~24위 강등 ↔ 리그 원 1·2위+3~6위 PO 1팀 / 2.분데스 17·18위 강등, 16위–3.리가 3위 승강 PO / 세리에B 18~20위 강등+16·17위 플레이아웃(승점 차 5 이상이면 17위 바로 강등) ↔ 세리에C 3개 조 1위+PO 1팀 / 리그2 17·18위 강등, 16위–리그3 PO(3~6위) 승자 승강 PO
// 2군·U23 팀(슈투트가르트 II·유벤투스 넥스트젠 등)은 2부 승격 불가라 명단에서 뺌. 선수는 가상(구단 수준 추정: 2부 하위 평균보다 2~6 낮게). 처음 승격·PO 때 생성
const X3={EN2:{lg:'EN3X',nm:'리그 원(시뮬)',lv:[67,65,63],fin:[[5,40],[3,36],[2,33]],
    rows:[['Leicester City','LEI',1],['Sheffield Wednesday','SHW',1],['Luton Town','LUT',1],['Plymouth Argyle','PLY',1],['Huddersfield Town','HUD',1],['Oxford United','OXF',1],['Reading','REA',2],['Wigan Athletic','WIG',2],['Barnsley','BNS',2],['Bradford City','BRA',2],['Stockport County','STK',2],['Peterborough United','PET',2],['Blackpool','BLP',2],['Wycombe Wanderers','WYC',2],['Doncaster Rovers','DON',3],['Mansfield Town','MAN',3],['Cambridge United','CAM',3],['Leyton Orient','LEY',3]]},
  DE2:{lg:'DE3X',nm:'3. 리가(시뮬)',lv:[65,63,61],fin:[[4,38],[2.5,35],[1.5,32]],
    rows:[['Fortuna Düsseldorf','F95',1],['Preußen Münster','SCP',1],['Hansa Rostock','FCH',1],['MSV Duisburg','MSV',1],['Rot-Weiss Essen','RWE',2],['Alemannia Aachen','AAC',2],['Waldhof Mannheim','SVW',2],['SV Wehen Wiesbaden','SWW',2],['FC Ingolstadt 04','FCI',2],['Jahn Regensburg','SSV',2],['1. FC Saarbrücken','FCS',2],['SC Verl','VER',3],['Viktoria Köln','VIK',3],['Würzburger Kickers','FWK',3]]},
  IT2:{lg:'IT3X',nm:'세리에 C(시뮬)',lv:[65,63,61],fin:[[4,38],[2.5,35],[1.5,32]],
    rows:[['Spezia','SPE',1],['Pescara','PES',1],['Reggiana','REG',1],['Bari','BRI',1],['Salernitana','SAL',1],['Catania','CAT',1],['Cosenza','COS',2],['Crotone','CRO',2],['Perugia','PER',2],['Cittadella','CIT',2],['Novara','NOV',2],['Foggia','FOG',2],['Ravenna','RAV',2],['Livorno','LIV',3],['Lecco','LEC',3],['Audace Cerignola','CER',3]]},
  FR2:{lg:'FR3X',nm:'리그 3(시뮬)',lv:[62,60,58],fin:[[3,35],[1.8,32],[1.2,30]],
    rows:[['Amiens SC','ASC',1],['SC Bastia','BAS',1],['SM Caen','SMC',1],['Valenciennes FC','VAF',2],['FC Rouen','ROU',2],['US Concarneau','CON',2],['US Quevilly-Rouen','QRM',2],['US Orléans','ORL',2],['FC Versailles 78','VRS',3],['AS Cannes','CAN',3],['Paris 13 Atletico','P13',3],['FC Villefranche','VIL',3]]}};
for(const k in X3){LGN[X3[k].lg]=X3[k].nm;if(typeof LGP!=='undefined'&&LGP[k])LGP[X3[k].lg]=LGP[k]}
// 대기 명단 후보: 이미 3부로 내려간 구단(실제 선수단) + 아직 만들지 않은 명단 구단(가상 전력)
function x3Cands(k){const R=X3[k];const out=[];CLUBS.forEach(C=>{if(C&&C.lg===R.lg){const s=squadOf(C.i).map(p=>p.ovr).sort((a,b)=>b-a);while(s.length<16)s.push(R.lv[2]-3);out.push({c:C.i,st:s.slice(0,16).reduce((a,x)=>a+x,0)/16,nm:C.name})}});
  R.rows.forEach(r=>{if(!CLUBS.some(C=>C&&C.name===r[0]))out.push({row:r,st:R.lv[r[2]-1],nm:r[0]})});
  out.forEach(o=>{o.sc=o.st+gauss(hsh(S.season+R.lg+o.nm+'a'),hsh(S.season+R.lg+o.nm+'b'))*2.5});return out.sort((a,b)=>b.sc-a.sc)}
function x3Club(k,o){if(o.c!=null)return o.c;const R=X3[k],t=o.row[2];const C=es3MakeClub(o.row[0],o.row[1],t,null,R.lg,{lv:R.lv[t-1],fin:R.fin[t-1]});o.c=C.i;return C.i}
function x3Exchange(k,t2){const R=X3[k];if(!R||!t2||t2.length<12||!t2.some(t=>t.p>0))return;S.genC3=S.genC3||[];const n=t2.length,id=i=>t2[i].id;
  const cand=x3Cands(k);if(cand.length<7)return;let down=[],up=[],po='';const nm=a=>a.map(c=>CLUBS[c].short).join('·');
  const poW=(a,b)=>cand.slice(a,b+1)[Math.floor(hsh(S.season+R.lg+'po')*(b-a+1))];
  if(k==='EN2'){down=[id(n-3),id(n-2),id(n-1)];const w=poW(2,5);up=[x3Club(k,cand[0]),x3Club(k,cand[1]),x3Club(k,w)];po=`3부 PO 승자 ${w.nm}`}
  else if(k==='IT2'){down=[id(n-3),id(n-2),id(n-1)];const a=t2[n-5],b=t2[n-4];if(b.pts<=a.pts-5){down.push(b.id);po=`플레이아웃 없음(승점 차 ${a.pts-b.pts}) ${CLUBS[b.id].short} 강등`}else{const m=legs2(b.id,a.id);const lo=m.w===a.id?b.id:a.id;down.push(lo);po=`플레이아웃 ${CLUBS[a.id].short}–${CLUBS[b.id].short} ${m.sc} → ${CLUBS[lo].short} 강등`}
    const w=poW(3,6);up=[0,1,2].map(i=>x3Club(k,cand[i])).concat(x3Club(k,w));po+=` · 3부 PO 승자 ${w.nm}`}
  else{down=[id(n-2),id(n-1)];up=[x3Club(k,cand[0]),x3Club(k,cand[1])];const z=id(n-3);const o3=k==='DE2'?cand[2]:poW(2,5);const c3=x3Club(k,o3);const m=legs2(c3,z);if(m.w===c3){up.push(c3);down.push(z)}po=`승강 PO ${CLUBS[c3].short}–${CLUBS[z].short} ${m.sc} → ${CLUBS[m.w].short}`}
  const setLg=(c,lg)=>{CLUBS[c].lg=lg;S.clubB=S.clubB||{};S.clubB[c]=Object.assign(S.clubB[c]||{},{lg,budget:CLUBS[c].budget,rep:CLUBS[c].rep,b2:CLUBS[c].b2})};
  const minB=Math.min(...t2.map(t=>CLUBS[t.id].budget));
  down.forEach(c=>{const C=CLUBS[c];C.b2=C.budget;C.budget=Math.round(C.budget*.5*10)/10;C.rep=Math.max(8,C.rep-4);setLg(c,R.lg)});
  up.forEach(c=>{const C=CLUBS[c];C.budget=Math.max(C.b2||0,minB*.85,C.budget);C.budget=Math.round(C.budget*10)/10;C.rep=Math.min(60,C.rep+4);setLg(c,k);if(S.aiBudget)S.aiBudget[c]=Math.max(S.aiBudget[c]||0,C.budget*1e6);try{squadFill(c,S.season+1)}catch(e){}});
  if(down.includes(S.club))S.relSack={c:S.club,lg:k};SQC=null;
  S.news.unshift({d:S.date,t:`${LGN[k]||k} ↔ 3부: 승격 ${nm(up)} · 강등 ${nm(down)}`,b:po,v:0,big:false});return {up,down}}
// 2부에서 강등되면 시즌 전환 직후 경질(3부는 맡을 수 없음)
{const _ro=rollover;rollover=function(){const r=_ro.apply(this,arguments);try{const x=S.relSack;if(x){delete S.relSack;if(S.club===x.c){const C=CLUBS[x.c];sackMe(`${LGN[x.lg]||x.lg}에서 강등돼 ${C.name}은(는) 3부로 내려갑니다. 3부 구단은 맡을 수 없어 계약이 해지됐습니다`);save&&save()}}}catch(e){console.error(e)}return r}}
// 2부 이사회 목표의 '잔류' 기준을 리그별 강등 규정에 맞춤(이전엔 모두 18위)
const X2SAFE={ES2:18,EN2:21,DE2:15,IT2:15,FR2:15};
{const _cs=careerSeasonStart;careerSeasonStart=function(){const r=_cs.apply(this,arguments);try{const lg=hl2(),sf=X2SAFE[lg];if(sf&&S.exp)for(const c in S.exp){const e=S.exp[c];if(e.dv===2&&e.tp===18){e.tp=sf;e.lb=`잔류권 유지(${sf}위 이내)`}}}catch(e){console.error(e)}return r}}

