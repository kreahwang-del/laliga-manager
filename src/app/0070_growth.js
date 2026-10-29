// ================= 4단계: 성장·노쇠·은퇴·유망주·레전드 후계자 =================
// 근거
//  · 나이별 능력 변화: EA FC26→FC27 같은 선수 12,013명(2025-09 → 2026-09) 능력치 변화. FC 점수 ÷4.2 = 게임 20점 척도
//    나이 곡선은 OVR 70 기준(능력치가 높을수록 추가 하락: OVR 1점당 연 −0.08 → 절반은 평가 오차로 보고 −0.06 적용)
//  · 은퇴: Transfermarkt 5대 리그 2015~2022 선수의 '이후 3시즌 모든 대회 미출전' 비율(주전 1,500분+ / 백업 500분 미만)
//  · 유망주 등급·레전드 후계자 확률: 설계 확정값(게임 설정)
const RET=-2;
const DEV_C={ // 연간 변화(FC 점수). 23세 이하는 저평가 선수 반등이 섞여 ×0.8 적용
  speed:[1.9,.6,.9,1,1.2,.75,.7,.2,.3,-.5,-.6,-.9,-1,-1.25,-1.25,-2.5,-2.1,-3.1,-4.4,-5,-5],
  stamina:[4,2.7,2.4,3.2,3,2.2,1.4,1.3,.9,.2,-.2,-.5,-.1,-.5,-1.2,-2.2,-1.2,-3,-2.1,-3,-3],
  strength:[3.9,2,2.6,2.4,2.5,1.7,1.5,1.3,1.1,.8,.9,.4,.6,.7,.3,-.2,-.1,-.6,.2,-1,-1],
  tech:[3.5,3.1,2.7,2.5,2.2,1.7,1.3,1.1,.9,.6,.6,.2,.3,.2,-.1,-.3,-.1,-.3,-.7,-.9,-1.1],
  def:[2.5,2.8,2.5,2.6,2.4,2,1.5,1.2,1.2,.7,.75,.4,.3,.3,.35,0,-.1,-.15,-.45,-.6,-.7],
  mental:[4.2,3.2,3.1,2.7,2.2,1.9,1.5,1.25,1,.7,.56,.46,.43,.53,.25,.15,.3,0,-.2,0,-.2],
  aerial:[2.8,1.6,2,1.8,1.6,1.7,1.2,1.05,1.06,.7,.6,.6,.4,.4,.2,.15,0,.4,0,-.5,-.9],
  gk:[2.8,1.6,1.6,1.4,1.5,.9,1.1,.9,.9,.45,.67,.14,.4,-.06,-.06,-.31,-.17,-.39,-.41,-.37,-1.3]};
const DEV_G={pace:'speed',stamina:'stamina',str:'strength',shoot:'tech',pass:'tech',drib:'tech',cross:'tech',fk:'tech',pen:'tech',offball:'tech',tackle:'def',posit:'def',comp:'mental',aerial:'aerial',gk_save:'gk',gk_air:'gk',gk_sweep:'gk',gk_dist:'gk'};
const DEV_KEYS=Object.keys(DEV_G);
// 포지션별 OVR 가중치(능력치 산출식과 동일)
const DEV_W={ST:{shoot:.3,offball:.25,drib:.1,aerial:.1,pace:.15,pass:.1},W:{drib:.25,pace:.2,cross:.1,shoot:.15,pass:.15,offball:.15},AM:{pass:.3,drib:.2,shoot:.15,offball:.2,pace:.1,stamina:.05},
  CM:{pass:.3,tackle:.15,posit:.15,stamina:.15,drib:.1,shoot:.05,offball:.1},DM:{posit:.25,tackle:.25,pass:.25,stamina:.1,aerial:.1,pace:.05},FB:{tackle:.2,posit:.15,pace:.2,cross:.15,stamina:.15,pass:.15},
  CB:{posit:.3,tackle:.25,aerial:.25,pace:.1,pass:.1},GK:{gk_save:.55,gk_air:.15,gk_sweep:.15,gk_dist:.15}};
function curveAt(grp,a){const i=Math.max(0,Math.min(20,Math.round(a)-18));let v=DEV_C[grp][i];if(a<18)v=DEV_C[grp][0]*1.1;return a<=23&&v>0?v*.8:v}
function gauss(h1,h2){return Math.sqrt(-2*Math.log(Math.max(1e-9,h1)))*Math.cos(2*Math.PI*h2)}
function devParams(p){const id=p.id,g=p.gt||[.2,.6,.2];const h=hsh(id+'gt');const type=h<g[0]?-1:h<g[0]+g[1]?0:1; // 조숙/표준/대기만성
  return {type,shift:type*1.5+(hsh(id+'sh')-.5)*2,gr:.7+.6*hsh(id+'gr'),dr:.7+.7*hsh(id+'dr'),am:Object.fromEntries(DEV_KEYS.map(k=>[k,.8+.4*hsh(id+'am'+k)]))}}
function ageAt(p,date){return p.dob?(D(date)-D(p.dob))/(365.25*864e5):25}
// 출전 비중(성장 반영): 라리가는 실제 출전 시간, 다른 리그는 팀 내 능력 순위로 추정
function playShare(p){const c=clubOf(p.id);if(c<0)return 0;const q=S.ps[p.id]||{};
  if(CLUBS[c].lg==='ES'){const played=(S.fixtures||[]).filter(f=>f.res&&(f.h===c||f.a===c)).length;return played<3?rankShare(p):Math.min(1,(q.mins||0)/(played*90))}
  return rankShare(p)}
function rankShare(p){const rk=rankInClub(p);return rk<=11?.85:rk<=15?.5:rk<=20?.25:.08}
// 한 시즌 목표 변화량(20점 척도) — 시즌·선수별로 고정(난수 시드), 월별로 1/10씩 반영
// 선수 간 편차(사용자 확정: 실측의 75%)
//  근거: FC26→27 1년 변화의 중심부 표준편차(꼬리 제외) 21세 이하 3.0 / 22~25세 2.3 / 26~29세 1.8 / 30세 이상 1.8, 첨도 4.5~5(정규분포 3보다 꼬리가 두꺼움)
//  → '선수 단위 시즌 변동'(정규) + '돌파·급락 사건'(꼬리) 두 겹으로 구성
//  돌파·급락 빈도: FC 1년 +6 이상 17%(21세 이하)·7.8%(22~25)·1.8%(26~29), −4 이하 2.5%(26~29)·3.8%(30~33)·9.4%(34+)
//  계기: TM 2016~23 시장가치 ×2.5 급등은 출전 +1,000분 늘어난 선수에서 3.7~7배, ×0.4 급락은 출전 −1,000분 줄어든 선수에서 약 2배
const DEV_SD=a=>a<=21?2.24:a<=25?1.75:a<=29?1.38:1.35;
function devEvent(p,season){const age=ageAt(p,`${season}-07-01`),q=S.ps[p.id]||{},sh=q.shareLast??rankShare(p),ovr=q.ovrF??p.ovr,pa=q.pa??p.pa??ovr,pro=p.pro??10,H=k=>hsh(p.id+k+season);
  let pb=age<=21?.10:age<=25?.045:age<=29?.012:.003;pb*=(sh>=.6?1.6:sh<=.25?.5:1)*(pa-ovr>=8?1.4:pa-ovr<=2?.3:1)*.75;
  let pc=age<26?.004:age<=29?.02:age<=33?.035:.08;pc*=(1.5-pro/20)*(q.injLong===season?1.8:1)*.75;
  if(H('ev1')<pb)return {t:'break',d:3+H('ev2')*3};
  if(H('ev3')<pc)return {t:'crash',d:-(3+H('ev4')*2),phys:age>=30};
  return null}
function annualDelta(p,season){const P=devParams(p),a=ageAt(p,`${season}-07-01`)-P.shift*(1),gk=p.g==='GK';
  const q0=S.ps[p.id]||{},ovr=q0.ovrF??p.ovr,pro=p.pro??10,out={};const realAge=ageAt(p,`${season}-07-01`);
  // 선수 단위 시즌 변동(모든 능력치 공통) = 영구 변화 + 일시 변동(좋은 해·나쁜 해, 다음 시즌에 되돌아감)
  //  1년 변화 편차는 목표(실측 75%)와 같게: 영구 0.45 + 일시 0.63 → √(0.45²+2×0.63²)≈1.0. 일시 변동을 두는 이유: 매년 독립된 영구 변화면 10년 뒤 격차가 과하게 벌어짐(시뮬레이션 확인)
  const eDamp=realAge<=(DEV_TOP[3]??99)?Math.max(.4,1-DEV_TOP[2]*Math.max(0,ovr-80)):1;const sdA=DEV_SD(realAge),gT=s=>gauss(hsh(p.id+'tr1'+s),hsh(p.id+'tr2'+s));
  const shock=(gauss(hsh(p.id+'shk1'+season),hsh(p.id+'shk2'+season))*sdA*.45+(gT(season)-gT(season-1))*sdA*.63)/4.15;
  const ev=devEvent(p,season);
  for(const k of DEV_KEYS){if(k.startsWith('gk_')&&!gk)continue;let grp=DEV_G[k];if(gk&&(k==='pass'))grp='tech';
    let v=curveAt(k==='aerial'?'aerial':grp,a);if(k==='aerial')v=v*.6+curveAt('strength',a)*.4;
    v=v/4.2;
    if(v>0)v*=P.gr*(.9+.2*pro/20)*eDamp; else v*=P.dr*(1.15-.3*pro/20);
    v*=P.am[k];
    v+=(-0.06*(Math.min(ovr,DEV_TOP[0])-70)-DEV_TOP[1]*Math.max(0,ovr-DEV_TOP[0]))/4.15; // 평균 회귀: 실측 −0.08 × 75%(편차를 실측 75%로 넣었으므로 같은 비율) + 85+ 소폭 추가
    v+=shock+gauss(hsh(p.id+k+season+'n1'),hsh(p.id+k+season+'n2'))*.25; // 항목별 작은 변동
    if(ev){if(ev.t==='crash'&&ev.phys)v+=(['pace','stamina','str'].includes(k)?ev.d*1.8:ev.d*.5)/4.15;else v+=ev.d/4.15}
    out[k]=v}
  // 잠재력: 어린 선수는 잠재력까지 끌어올림, 잠재력 근처면 성장 둔화
  const pa=q0.pa??p.pa??ovr;if(realAge<=24){const gap=pa-ovr;const pull=(p.id>=9e6?Math.max(0,gap-DEV_PULL[0]):Math.max(0,gap-devGapM(realAge)))*DEV_PULL[1]*eDamp/4.15;for(const k in out)out[k]+=pull}
  out._ev=ev;return out}
/* 잠재력 끌어올림(24세 이하): 간격(잠재력−현재)이 [0]을 넘는 만큼 × [1] FC점/년. v60 보정: 이전 [6,.05]는 23세+ 유스가 잠재력보다 S·A·B 등급 8~9 낮게 머물러 리그 수준이 해마다 하락(세계 수준 보정치가 상한 14까지 올라감) */
let DEV_PULL=[2,.35];
/* v161 상위권 성장·회귀 재조정(6시즌에 85+ 160→224, 상위 100명 평균 87.4→89.0으로 최상위만 커지던 문제)
   ① 평균 회귀 −.06×(능력−70)은 82까지만, 82 초과분은 −.02(기존 84 초과 −.03 추가): 정상급 스타가 전성기에 과하게 떨어지지 않게
   ② 능력 80 초과 선수의 성장분(나이 곡선 양수 부분·잠재력 끌어올림)을 1−.09×(능력−80)배(최소 .4)로: 80대 초중반이 해마다 2점씩 85+로 넘어오던 유입 억제
   4시즌 검증(경기 생략 빠른 모드): 85+ 160→165→174→169→167, 상위 100명 87.4→87.8, 구단 상위 16명 78.7→78.3~78.7. 같은 조건 비교안: ②를 25세 이하에만 → 85+ 180·상위100 88.4 */
let DEV_TOP=[82,.02,.09];
/* v161 실제 선수의 잠재력 끌어올림을 '나이 평균 간격 대비'로 중심화: 나이 곡선(FC26→27 실측)은 이미 평균적인 잠재력 간격을 가진 실제 선수의 성장이라
   (간격−2)만큼 더 끌어올리면 이중 반영 → 6시즌 시뮬에서 21~23세 80~84 선수 연 +2.2(곡선 기대 약 +1.1), 85+ 인원 160→206.
   평균 간격(시작 데이터 실제 선수 전체, 잠재력−능력): 16세 12.2·17세 11.6·18세 10.4·19세 9.2·20세 7.2·21세 5.4·22세 3.8·23세 2.3·24세 0.7.
   평균보다 간격이 크면 더 크고, 작으면 덜 큼(최대 −1 FC점/년). 생성 유망주(id 900만+)는 시작 간격이 커서 기존 방식 유지 */
function devGapM(a){return a<18?11.8:Math.max(0,10.4-1.62*(a-18))}
function devMonthly(){const season=S.season;const done=[];
  for(const id in BASE){const c=clubOf(+id);if(c===RET)continue;const p=pl(+id);const q=S.ps[id]=S.ps[id]||{};
    if(!q.af){q.af={};DEV_KEYS.forEach(k=>{if(p[k]!=null)q.af[k]=p[k]});q.ovrF=p.ovr;if(q.ovrS==null)q.ovrS=p.ovr}
    const d=annualDelta(p,season),sh=playShare(p),young=ageAt(p,S.date)<=21,W=DEV_W[p.g]||DEV_W.CM;let wsum=0,wd=0;const ev=d._ev;delete d._ev;
    if(ev&&q.devEv!==season){q.devEv=season;q.devEvT=ev.t;if(ev.t==='break')q.pa=Math.max(q.pa??p.pa??0,Math.round((q.ovrF??p.ovr)+ev.d+2))}
    const paCap=q.pa??p.pa??99,young25=ageAt(p,S.date)<=25;
    for(const k in d){if(q.af[k]==null)continue;let v=d[k]/10;if(v>0&&young)v*=.5+.5*Math.min(1,sh/.6); // 21세 이하: 주전 100%, 벤치 50%
      if(v>0&&young25&&q.ovrF>=paCap-.5&&!(ev&&ev.t==='break'))v*=.2; // 잠재력 상한은 25세 이하에만(이후는 나이 곡선이 결정)
      q.af[k]=Math.round(Math.max(1,Math.min(20,q.af[k]+v))*100)/100;const w=W[k]||0;wsum+=w;wd+=w*v}
    q.ovrF=Math.max(40,Math.min(95,q.ovrF+(wsum?wd/wsum:0)*4.15));
    DEV_KEYS.forEach(k=>{if(q.af[k]!=null)q[k]=Math.round(q.af[k])});q.ovr=Math.round(q.ovrF);
    const b=BASE[id];q.val=Math.round(valCapS(b.val*Math.pow(10,.06*(q.ovrF-b.ovr))*valAge2(ageAt(p,S.date))/valAge2(ageAt(b,SEASON_START))*(q.pm||1)))}
}
/* v161 초고가 완만화: 6시즌 검증에서 최고 가치가 €3.6억까지 오름(실제 Transfermarkt 최고 €2억 안팎) → €2억 초과분은 0.3제곱으로 눌러 €3.6억→약 €2.4억(시작 시점 실제 가치는 그대로) */
function valCapS(v){const V0=2e8;return v>V0?V0*Math.pow(v/V0,.3):v}
function valAge(a){return a<=24?1:a<=28?1-(a-24)*.05:Math.max(.15,.8-(a-28)*.1)}
/* v145 시장가치 나이 경로 보정: 성과항을 뺀 1시즌 가치 변화(능력치 성장·노화 포함)가 실측 Transfermarkt 1년 변화(€2M 이상, 기하평균)보다 나이마다 5~25% 후했음
   (예: 25세 게임 1.08 vs 실측 0.97, 30세 0.82 vs 0.67) → 나이별 보정 배수 c(a)를 기존 곡선의 연간 비율에 곱한 누적 곡선. 새 선수 생성 가치는 기존 valAge 그대로 */
const VA_C={15:.87,16:.87,17:.87,18:.87,19:.86,20:.82,21:.84,22:.86,23:.91,24:.95,25:.91,26:.9,27:.91,28:.9,29:.85,30:.82,31:.8,32:.83,33:.9,34:.75,35:.75};
/* v161 다시즌 검증: 성과 배수(pm)의 나이 쏠림(노장 +, 유망주 −)을 없앤 뒤(blk_mv MV_AGE), 성과항 제외 1년 가치 변화(로그 평균)를
   Transfermarkt 5대 리그 잔류 선수 2014~2023 실측과 맞춤 — <21 +.36·21~23 +.18·24~26 +.05·27~29 −.11·30~32 −.34·33+ −.37.
   이전 경로는 2·3시즌째 24세 이상이 실측보다 12~17%p 더 떨어져 리그 총가치가 매년 10%가량 줄었음 */
const VA_K=a=>a<21?-.10:a<24?.09:a<27?.115:a<30?.15:a<33?.17:.16;
const VA2=(()=>{const v={15:1};for(let a=15;a<42;a++){const r=valAge(a+1)/valAge(a);v[a+1]=v[a]*r*(VA_C[a]??.75)*Math.exp(VA_K(a))}return v})();
function valAge2(a){const A=Math.max(15,Math.min(41.99,a)),i=Math.floor(A),f=A-i;return VA2[i]*(1-f)+VA2[i+1]*f}
// ---- 은퇴(시즌 종료) ----
const RET_REG=[.08,.12,.17,.22,.25,.30,.35,.45,.6,.8],RET_BACK=[.45,.55,.62,.72,.75,.82,.85,.9,.95,1]; // 31~40세
function retireProb(p){let a=Math.floor(ageAt(p,S.date));if(p.g==='GK')a-=2;if(a<33)return 0; // 31~32세 이탈은 대부분 다른 리그 이적 → 무소속일 때만 처리
const i=Math.min(9,a-31);const sh=playShare(p);
  let pr=RET_BACK[i]+(RET_REG[i]-RET_BACK[i])*Math.min(1,sh/.6);pr*=1.3-.6*(p.pro??10)/20;const q=S.ps[p.id]||{};if(q.ovrS!=null&&q.ovrF!=null&&q.ovrF-q.ovrS<-2)pr*=1.2;
  if(p.ovr>=85)pr*=.6;return Math.min(.97,pr*.85)} // 실측은 '자료 밖 리그 이적' 포함 → 0.85배
// ---- 유망주 ----
const NAMES={KOR:{f:['Min-jun','Seo-jun','Ji-ho','Hyun-woo','Jun-seo','Do-yun','Si-woo','Ye-jun','Ju-won','Han-gyeol'],l:['Kim','Lee','Park','Choi','Jung','Kang','Cho','Yoon','Jang','Lim','Han','Oh']},
 JPN:{f:['Haruto','Sota','Yuto','Riku','Kaito','Ren','Takumi','Hayato','Kota','Daiki'],l:['Sato','Suzuki','Takahashi','Tanaka','Watanabe','Ito','Yamamoto','Nakamura','Kobayashi','Kato']},
 USA:{f:['Tyler','Brandon','Jordan','Christian','Caleb','Aidan','Diego','Owen','Cole','Mason'],l:['Johnson','Williams','Miller','Davis','Garcia','Martinez','Anderson','Taylor','Thomas','Moore']},
 SCO:{f:['Callum','Lewis','Ross','Fraser','Euan','Jamie','Liam','Kyle'],l:['Smith','Brown','Wilson','Campbell','Stewart','Thomson','Robertson','McDonald']},
 SUI:{f:['Luca','Noah','Leon','Nico','Jan','Fabian'],l:['Müller','Meier','Schmid','Keller','Weber','Huber']},
 AUT:{f:['Lukas','David','Tobias','Florian','Simon','Jakob'],l:['Gruber','Huber','Bauer','Wagner','Pichler','Steiner']},
 NED:{f:['Daan','Sem','Lucas','Levi','Finn','Milan','Jesse','Thijs','Bram','Ruben','Stijn','Noah'],l:['de Jong','Jansen','de Vries','van den Berg','Bakker','Visser','Smit','Meijer','de Boer','Mulder','Bos','Vos','Peters','Hendriks']},
 TUR:{f:['Emre','Arda','Kerem','Yusuf','Berkay','Can','Mert','Eren','Ozan','Burak'],l:['Yılmaz','Kaya','Demir','Şahin','Çelik','Yıldız','Aydın','Öztürk','Arslan','Doğan']},
 DEN:{f:['Mikkel','Rasmus','Emil','Mads','Jonas','Oliver','Magnus','Kasper'],l:['Nielsen','Jensen','Hansen','Pedersen','Andersen','Christensen','Larsen','Sørensen']},
 ESP:{f:['Pablo','Hugo','Álvaro','Adrián','Diego','Javier','Mario','Iker','Sergio','Marcos','Rubén','Unai','Aitor','Gonzalo','Jorge','Víctor','Raúl','Nicolás','Íñigo','Ander','Carlos','Daniel','Martín','Lucas','Óscar','Rodrigo','Samuel','Bruno','Eric','Pau','Marc','Jon'],
  l:['García','Martínez','López','Sánchez','González','Rodríguez','Fernández','Pérez','Gómez','Ruiz','Díaz','Moreno','Muñoz','Álvarez','Romero','Navarro','Torres','Domínguez','Vázquez','Ramos','Gil','Serrano','Molina','Blanco','Castro','Ortega','Delgado','Garrido','Marín','Iglesias','Medina','Cortés','Castillo','Santos','Lozano','Guerrero','Cano','Prieto','Méndez','Calvo','Aguirre','Etxeberria','Arrieta','Goikoetxea']},
 ENG:{f:['Jack','Harry','Oliver','George','Charlie','Alfie','Jacob','Thomas','Joe','Mason','Kai','Leo','Archie','Ethan','Reece','Callum','Tyler','Lewis','Ben','Sam','Jamie','Luke','Max','Ryan'],l:['Smith','Jones','Taylor','Brown','Williams','Wilson','Johnson','Davies','Robinson','Wright','Thompson','Evans','Walker','White','Roberts','Green','Hall','Wood','Jackson','Clarke','Hughes','Edwards','Hill','Moore','Harris','Turner','Cooper','Ward']},
 ITA:{f:['Lorenzo','Matteo','Francesco','Alessandro','Andrea','Leonardo','Gabriele','Riccardo','Tommaso','Edoardo','Federico','Nicolò','Giuseppe','Pietro','Davide','Simone','Luca','Marco','Filippo','Samuele'],l:['Rossi','Russo','Ferrari','Esposito','Bianchi','Romano','Colombo','Ricci','Marino','Greco','Bruno','Gallo','Conti','De Luca','Mancini','Costa','Giordano','Rizzo','Lombardi','Moretti','Barbieri','Fontana','Santoro','Mariani']},
 GER:{f:['Lukas','Leon','Finn','Jonas','Paul','Felix','Elias','Luis','Noah','Ben','Moritz','Julian','Tim','Niklas','Jan','David','Maximilian','Tom','Linus','Nico'],l:['Müller','Schmidt','Schneider','Fischer','Weber','Meyer','Wagner','Becker','Schulz','Hoffmann','Koch','Richter','Klein','Wolf','Schröder','Neumann','Schwarz','Zimmermann','Braun','Krüger','Hofmann','Hartmann','Lange','Werner']},
 FRA:{f:['Lucas','Hugo','Nathan','Enzo','Louis','Théo','Mathis','Tom','Noah','Maxime','Rayan','Yanis','Adam','Ethan','Clément','Antoine','Baptiste','Kylian','Ibrahim','Moussa','Sacha','Axel'],l:['Martin','Bernard','Dubois','Thomas','Robert','Richard','Petit','Durand','Leroy','Moreau','Simon','Laurent','Lefebvre','Michel','Garcia','David','Bertrand','Roux','Vincent','Fournier','Diallo','Traoré','Camara','Koné']},
 BRA:{f:['João','Pedro','Gabriel','Lucas','Matheus','Rafael','Vinícius','Gustavo','Felipe','Thiago','Caio','Igor','Enzo','Davi'],l:['Silva','Santos','Oliveira','Souza','Lima','Pereira','Costa','Ferreira','Almeida','Carvalho','Ribeiro','Gomes','Rocha','Barbosa']},
 ARG:{f:['Santiago','Mateo','Thiago','Benjamín','Valentín','Joaquín','Tomás','Franco','Facundo','Agustín','Lautaro','Nahuel'],l:['González','Rodríguez','Gómez','Fernández','López','Díaz','Martínez','Pérez','Romero','Sosa','Acosta','Benítez']},
 POR:{f:['João','Diogo','Tiago','Rodrigo','Gonçalo','Rafael','Tomás','Afonso','Duarte','Martim'],l:['Silva','Santos','Ferreira','Pereira','Oliveira','Costa','Rodrigues','Martins','Sousa','Fernandes']}};
const LG_NAT={ES:'ESP',EN:'ENG',IT:'ITA',DE:'GER',FR:'FRA',PT:'POR',NL:'NED',BE:'NED',TR:'TUR',SC:'SCO',CH:'SUI',AT:'AUT',DK:'DEN',BR:'BRA',AR:'ARG',US:'USA',KR:'KOR',JP:'JPN'};
const GRADES=[['S',[88,95],.02],['A',[82,87],.08],['B',[75,81],.20],['C',[68,74],.35],['D',[60,67],.35]];
const YOUTH_MULT={'Barcelona':1.5,'Real Madrid':1.3,'Atlético Madrid':1.2};
const POS_W={GK:10,CB:18,FB:16,DM:8,CM:14,AM:8,W:14,ST:12};
const OFF10={ST:[2,-1,0,-2,-5,-5,2,0,0,-1],W:[0,0,2,1,-4,-5,1,-4,2,0],AM:[0,2,1,-1,-4,-4,1,-4,0,0],CM:[-2,2,0,-1,0,0,-1,-2,-1,1],DM:[-3,1,-2,-2,2,2,-3,0,-2,1],FB:[-4,0,0,2,1,0,-3,-2,2,2],CB:[-6,0,-3,-5,2,2,-5,2,-1,0],GK:[-12,-4,-9,-10,-10,-4,-12,0,-6,0]};
function hpick(arr,h){return arr[Math.floor(h*arr.length)%arr.length]}
function pickGrade(h,mult,forced){const g=forced||GRADES.map(([k,r,p])=>[k,r,['S','A','B'].includes(k)?p*mult:p]);const t=g.reduce((a,x)=>a+x[2],0);let x=h*t;for(const e of g){x-=e[2];if(x<=0)return e}return g[g.length-1]}
function makeYouth(c,y,o={}){S.genSeq=(S.genSeq||0)+1;const id=9000000+S.genSeq,H=k=>hsh(id+':'+k+':'+y);
  const club=CLUBS[c];const mult=YOUTH_MULT[club.name]||1;
  let gr=o.grade?GRADES.find(g=>g[0]===o.grade):pickGrade(H('g'),mult);if(o.golden&&!o.grade){const g2=pickGrade(H('g2'),mult);if(GRADES.indexOf(g2)<GRADES.indexOf(gr))gr=g2}
  const [grade,[lo,hi]]=gr;const pa=o.pa??Math.min(97,Math.round(lo+(hi-lo)*H('pa')+(S.inBias||0)*.5));
  const age=o.age??(16+Math.floor(H('age')*3));const dob=`${y-age}-${String(1+Math.floor(H('m')*12)).padStart(2,'0')}-${String(1+Math.floor(H('d')*28)).padStart(2,'0')}`;
  const g=o.g||(()=>{let x=H('pos')*100;for(const k in POS_W){x-=POS_W[k];if(x<=0)return k}return 'CM'})();
  const nat0=LG_NAT[club.lg]||'ESP';const nat=o.nat||(H('nat')<.22?hpick(['BRA','ARG','POR','FRA','ESP'].filter(n=>n!==nat0),H('nat2')):nat0);const NP=NAMES[nat]||NAMES.ESP;
  const first=hpick(NP.f,H('fn'));const last=o.surname||hpick(NP.l,H('ln'))+(nat==='ESP'&&H('l2')<.35?' '+hpick(NP.l,H('ln2')):'');
  const ovr=o.ovrSet??Math.max(42,Math.min(pa-6,Math.round(pa-(32-(age-16)*4)+(H('ov')-.5)*8)));
  const Q=(ovr-40)/54*13+3;const strong=o.strengths||[...OUTA].sort((a,b)=>H('s'+a)-H('s'+b)).slice(0,3);
  const p={id,name:`${first} ${last}`,club:c,g,sub:g==='FB'||g==='W'?(H('side')<.5?'Left':'Right'):'',dob,nat,foot:o.foot||(H('ft')<.7?'right':H('ft')<.95?'left':'both'),
    h:Math.round((g==='GK'?188:g==='CB'?186:g==='ST'?182:g==='W'||g==='AM'?175:179)-(age<18?3:1)+gauss(H('h1'),H('h2'))*5),ovr,pa,
    val:Math.round(Math.pow(10,5+(ovr-45)*3.3/47)*(1+(pa-ovr)/25)*valAge(age)/1e4)*1e4,hi:0,cEnd:`${y+3}-06-30`,wage:Math.round(Math.pow(10,5+(ovr-45)*3.3/47)*.12/1000)*1000,clause:null,
    inj:3+Math.floor(H('inj')*10),pro:o.pro??Math.round(6+H('pro')*12),gt:o.gt||(H('gt')<.3?[.6,.3,.1]:H('gt')<.7?[.2,.6,.2]:[.1,.3,.6]),est:1,tend:null,attSh:null,pos2:null,
    youth:{grade,y,est:H('ge')<.2?GRADES[Math.max(0,Math.min(4,GRADES.findIndex(x=>x[0]===grade)+(H('ge2')<.5?-1:1)))][0]:grade},hg:age<=17?Math.floor(H('hg')*6):Math.floor(H('hg')*3)};
  OUTA.forEach((k,i)=>{p[k]=Math.max(1,Math.min(20,Math.round(Q+OFF10[g][i]+(strong.includes(k)?2+H('b'+k)*2:0)+(H('n'+k)-.5)*2)))});
  ['gk_save','gk_air','gk_sweep','gk_dist'].forEach(k=>{p[k]=g==='GK'?Math.max(1,Math.min(20,Math.round(Q+1+(H('n'+k)-.5)*3))):1});
  p.wf=H('wf')<.15?4:H('wf')<.8?3:2;p.str=Math.max(1,Math.round(p.aerial*.6+Q*.3));p.comp=Math.max(1,Math.round(Q-2+(H('cp')-.5)*3));p.fk=Math.max(1,Math.round(p.cross*.6+p.shoot*.3));p.pen=Math.max(1,Math.round((p.shoot+p.comp)/2));
  if(o.legend){p.legendOf=o.legend.name;p.legendRel=o.rel;inherit(p,o.legend,H)}
  S.gen=S.gen||{};S.gen[id]=p;BASE[id]=p;SQC=null;return p}
/* 레전드 후계자: S등급 100%(시그니처까지 그대로), A등급 80%, B등급 60%. A·B: 공격·수비 성향 = 레전드 비율 + 나머지는 본인 능력치 예측(로그 평균),
   유형은 같은 포지션이면 그대로, 일반 특성은 하나씩 그 비율 확률로(A 최대 4개·B 3개), 시그니처는 일반 특성으로(A 40%·B 25%) */
function inherit(p,L,H){const gd=p.youth&&p.youth.grade,S1=gd==='S';const w=S1?1:gd==='A'?.8:.6,ps=gd==='A'?.4:.25,mx=gd==='A'?4:3;const mix=(a,b)=>a&&(S1||!b)?[...a]:a&&b&&a.length===b.length?a.map((v,i)=>+Math.exp(w*Math.log(v)+(1-w)*Math.log(b[i])).toFixed(2)):(a||b||null);
  if(p.g!=='GK'){if(L.hab)p.hab=mix(L.hab,typeof habOf==='function'?habOf(p):null);if(L.dh)p.dh=mix(L.dh,typeof dhOf==='function'?dhOf(p):null)}
  const lp=L.pst;if(lp&&L.g===p.g){const mine=typeof pstPred==='function'?pstPred(p):null;if(S1){p.pst=[lp[0],[...lp[1]],[...(lp[2]||[])],[...(lp[3]||[])]];return}const tr=[];(lp[2]||[]).forEach((n,i)=>{if(H('it'+i)<w&&tr.length<mx)tr.push(n)});(lp[3]||[]).forEach((n,i)=>{if(H('is'+i)<ps&&!tr.includes(n)&&tr.length<mx)tr.push(n)});
    p.pst=[lp[0],mine&&mine[1]&&lp[1]&&mine[1].length===lp[1].length?lp[1].map((v,i)=>+(w*v+(1-w)*mine[1][i]).toFixed(2)):lp[1],tr,[]]}}
function devLoad(){if(S&&S.gen)for(const id in S.gen)BASE[id]=S.gen[id];SQC=null}
function gradeShown(p){if(!p.youth)return null;const apps=(S.ps[p.id]||{}).capps||0;return apps>=10?p.youth.grade:p.youth.est}
// ---- 레전드 ----
function legendCheck(p,c){const hist=(BASE[p.id].hist||[0,0]);const same=BASE[p.id].club===c;const q=S.ps[p.id]||{};const apps=(same?hist[0]:0)+(q.tapps||0),cap=same?hist[1]:0;
  if(apps>=300||cap>=5){S.legends=S.legends||[];const top=OUTA.map(k=>[k,p[k]]).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);
    S.legends.push({id:p.id,name:p.name,club:c,g:p.g,foot:p.foot,strengths:top,gt:p.gt,pro:p.pro,hab:p.hab||null,dh:p.dh||null,pst:(typeof pstOf==='function'?pstOf(p):p.pst)||null,surname:p.name.split(' ').slice(-1)[0],nat:p.nat,ret:S.season,apps,cap,done:false});return true}return false}
// ---- 시즌 정산(7월 1일, 새 시즌 직전) ----
function worldLevel(){const o=[];for(const id in BASE){const c=clubOf(+id);if(c<0||!LG5.has(CLUBS[c].lg))continue;o.push((S.ps[id]&&S.ps[id].ovrF)??BASE[id].ovr)}o.sort((a,b)=>b-a);const n=Math.min(o.length,CLUBS.filter(c=>LG5.has(c.lg)).length*16);return o.slice(0,n).reduce((a,b)=>a+b,0)/n}
function devSeasonEnd(){const y=S.season+1,mine=S.club,rep={ret:[],myRet:[],youth:[],legend:[],up:[],down:[]};
  // 세계 수준 유지(게임 설계): 닫힌 5대 리그 세계라 실제보다 새 인재 유입이 적음 → 상위 1,536명 평균이 시작 시점보다 낮으면 유스·해외 유입 품질을 올림
  const W0=S.world0??(S.world0=worldLevel()),Wn=worldLevel();S.inBias=Math.max(0,Math.min(14,(S.inBias??4)+(W0-Wn)*1.5));
  // 1) 성장 요약(우리 팀)
  squadOf(mine).forEach(p=>{const q=S.ps[p.id]||{};if(q.ovrS!=null){const d=(q.ovrF??p.ovr)-q.ovrS;if(d>=1.5)rep.up.push([p,d]);if(d<=-1.5)rep.down.push([p,d])}});
  const evs=squadOf(mine).filter(p=>{const q=S.ps[p.id]||{};return q.devEv===S.season});rep.brk=evs.filter(p=>S.ps[p.id].devEvT==='break');rep.crs=evs.filter(p=>S.ps[p.id].devEvT==='crash');
  // 2) 은퇴·해외 이적
  for(const id in BASE){const c=clubOf(+id);if(c===RET)continue;const p=pl(+id);const a=ageAt(p,S.date);
    let go=false,why='은퇴';if(c===FA){const q=S.ps[id]||{};q.faS=(q.faS||0)+1;if(q.faS>=1&&a<31){go=true;why='해외 리그 이적'}}
    if(!go&&hsh(id+'ret'+y)<retireProb(p))go=true;
    if(go){const leg=why==='은퇴'&&c>=0&&legendCheck(p,c);setP(+id,{club:RET,ret:y,retWhy:why});
      if(c===mine)rep.myRet.push(p);else if(p.ovr>=82&&why==='은퇴'&&c>=0)rep.ret.push([p,c]);if(leg)rep.legend.push([p,c])}}
  // 3) 유스 키 성장
  for(const id in BASE){const b=BASE[id];if(!(b.hg>0))continue;const p=pl(+id);const a=ageAt(p,S.date);if(a>21)continue;const q=S.ps[id]=S.ps[id]||{};const left=q.hgL??b.hg;if(left<=0)continue;
    const g=Math.max(0,Math.round(left/Math.max(1,21-a)));q.h=(q.h??b.h)+g;q.hgL=left-g}
  // 4) 유망주 입단(구단별 2~3명, 황금세대 5%)
  CLUBS.forEach(c=>{const h=hsh(c.i+'yth'+y);const golden=hsh(c.i+'gold'+y)<.05;const n=(LG5.has(c.lg)?2:(h<.5?1:0))+(golden?1:0); // 선수 풀 5천 명 ÷ 평균 경력 약 15년 ≈ 연 330명 신규
    for(let k=0;k<n;k++){const p=makeYouth(c.i,y,{golden});if(c.i===mine)rep.youth.push(p)}
    if(golden&&c.i===mine)rep.golden=true});
  // 4-2) 다른 리그에서 5대 리그로 유입(근거: TM 이적 2019~24 연평균 442명) — 13개 리그 실제 선수 풀에서 우선 영입
  //      게임 선수 풀(약 2,000명)이 실제(약 2,700명)보다 작아 0.75배 → 연 330명. 구단 수준에 맞춰 배정
  //      가치 환산 OVR → 게임 OVR: 가치 62% + 출전 성과 38%(이적 후 주전급 가정 78)
  {const lv={};CLUBS.forEach(c=>{const s=squadOf(c.i).sort((a,b)=>b.ovr-a.ovr).slice(0,16);lv[c.i]=s.length?s.reduce((a,p)=>a+p.ovr,0)/s.length:60});
   const pool=[];for(const id in BASE){const c=clubOf(+id);if(c<0||LG5.has(CLUBS[c].lg))continue;const p=pl(+id);if(ageAt(p,S.date)<=30)pool.push(p)}
   const taken=new Set();const buyers=CLUBS.filter(c=>c.i!==mine&&LG5.has(c.lg));const src=['NED','POR','BRA','TUR','BEL','DEN','ARG','ESP','FRA'];
   for(let k=0;k<330;k++){const H=x=>hsh(y+'imp'+k+x);const b=buyers[Math.floor(H('b')*buyers.length)];if(sqSize(b.i)>=30)continue;const L=lv[b.i];
     // 실제 선수 풀에서 구단 수준 −6~+2 범위 후보 중 무작위(젊을수록 선호)
     const cs=pool.filter(p=>!taken.has(p.id)&&p.ovr>=L-6&&p.ovr<=L+2&&sqSize(clubOf(p.id))>11);
     if(cs.length){const p=cs.sort((a,c)=>(ageAt(a,S.date)+hsh(a.id+'r'+y)*6)-(ageAt(c,S.date)+hsh(c.id+'r'+y)*6))[Math.floor(H('pick')*Math.min(8,cs.length))];taken.add(p.id);
       const from=clubOf(p.id);setP(p.id,{club:b.i,cEnd:`${y+3+Math.floor(H('ce')*2)}-06-30`,faS:0});SQC=null;
       if(b.lg==='ES'&&p.ovr>=75)inbox('news','',`${b.short}, ${CLUBS[from].name}의 ${p.name} 영입`,`${Math.floor(ageAt(p,S.date))}세 ${GN[p.g]} · 능력치 ${p.ovr} · ${LGN[CLUBS[from].lg]}에서 이적`);continue}
     // 풀에 맞는 선수가 없으면 가상 선수(근거: TM 이적 2019~24 연평균 442명, 나이 중앙값 23.7, 가치 환산 OVR 65±7.2)
     let ovr=Math.round(.62*(65+gauss(H('o1'),H('o2'))*7.2)+.38*78+(S.inBias||0)*.6);ovr=Math.max(55,Math.min(88,ovr));const age=Math.max(18,Math.min(31,Math.round(23.7+gauss(H('a1'),H('a2'))*3)));
     let nat=src[Math.floor(H('n')*src.length)];if(nat==='BEL')nat=H('b2')<.5?'NED':'FRA';const pa=Math.min(94,ovr+Math.round(Math.max(0,26-age)*(.5+1.5*H('pa'))));
     const p=makeYouth(b.i,y,{age,nat,pa,ovrSet:ovr});p.youth=null;p.imported=nat;p.cEnd=`${y+3+Math.floor(H('ce')*2)}-06-30`}}
  // 5) 레전드 후계자(은퇴 5~10년 뒤 매 시즌 15%)
  (S.legends||[]).forEach(L=>{if(L.done)return;const gap=y-L.ret;if(gap<5||gap>10)return;if(hsh(L.id+'succ'+y)>=.15)return;L.done=true;
    const fam=hsh(L.id+'fam')<.5;const x=hsh(L.id+'gr');const grade=x<.15?'S':x<.6?'A':'B';
    const p=makeYouth(L.club,y,{grade,g:L.g,foot:L.foot,strengths:L.strengths,gt:L.gt,pro:Math.max(5,Math.min(20,(L.pro??12)+Math.round((hsh(L.id+'pr')-.5)*4))),legend:L,
      rel:fam?(hsh(L.id+'rel')<.6?'아들':'조카'):'제2의',surname:fam?L.surname:null,nat:fam?L.nat:null});
    rep.legend.push([p,L.club,L]);if(L.club!==mine)inbox('news','',`${CLUBS[L.club].short} 유스에 '${fam?L.name+'의 '+p.legendRel:'제2의 '+L.name}' 등장`,`${p.name}(${ageOf(p)}세, ${GN[p.g]})가 ${CLUBS[L.club].name} 유스에 입단했습니다.`)});
  // 6) AI 구단 인원 정리(28명 초과 시 방출 → 다음 시즌까지 무소속이면 해외 이적, 20명 미만이면 자유계약 영입). 근거: 5대 리그 → 다른 리그 연 460명 유출
  CLUBS.forEach(c=>{if(c.i===mine)return;const big=LG5.has(c.lg)||c.lg==='ES2'||(typeof OTL!=='undefined'&&OTL.includes(c.lg)),mx=big?28:20,mn=big?20:13;let sq=squadOf(c.i);if(sq.length>mx){sq.sort((a,b)=>(a.ovr-ageAt(a,S.date)*.3)-(b.ovr-ageAt(b,S.date)*.3));sq.slice(0,sq.length-mx).forEach(p=>{if(!p.youth||p.youth.y<y)setP(p.id,{club:FA})})}
    sq=squadOf(c.i);if(sq.length<mn){const fa=squadOf(FA).sort((a,b)=>b.ovr-a.ovr);fa.slice(0,mn-sq.length).forEach(p=>setP(p.id,{club:c.i,cEnd:`${y+1}-06-30`,faS:0}))}});
  SQC=null;
  // 7) 다음 시즌 기준점
  for(const id in BASE){if(clubOf(+id)===RET)continue;const q=S.ps[id]=S.ps[id]||{};q.shareLast=playShare(pl(+id));q.ovrS=q.ovrF??BASE[id].ovr;q.mins=0;q.starts=0;q.shs=0}
  // 8) 보고
  const L=[];if(rep.up.length)L.push('성장: '+rep.up.sort((a,b)=>b[1]-a[1]).slice(0,5).map(([p,d])=>`${shortName(p.name)} +${d.toFixed(0)}`).join(', '));
  if(rep.down.length)L.push('하락: '+rep.down.sort((a,b)=>a[1]-b[1]).slice(0,5).map(([p,d])=>`${shortName(p.name)} ${d.toFixed(0)}`).join(', '));
  if(rep.brk&&rep.brk.length)L.push('돌파 시즌: '+rep.brk.map(p=>shortName(p.name)).join(', '));if(rep.crs&&rep.crs.length)L.push('급격한 하락: '+rep.crs.map(p=>shortName(p.name)).join(', '));
  if(rep.myRet.length)L.push('은퇴·이탈: '+rep.myRet.map(p=>`${p.name}(${ageOf(p)}세)`).join(', '));
  if(rep.youth.length)L.push(`유스 입단${rep.golden?'(황금세대!)':''}: `+rep.youth.map(p=>`${p.name} ${GN[p.g]} · 추정 등급 ${p.youth.est}${p.legendOf?` · ${p.legendRel==='제2의'?'제2의 '+p.legendOf:p.legendOf+'의 '+p.legendRel}`:''}`).join(' / '));
  if(rep.ret.length)L.push('주요 은퇴: '+rep.ret.slice(0,6).map(([p,c])=>`${p.name}(${CLUBS[c].short})`).join(', '));
  inbox('board','',`${S.season}-${String(y).slice(2)} 시즌 정산`,L.join('\n')||'큰 변화가 없었습니다.');
}
// 경기 출전 → 포지션 숙련(posXp): 어색한 자리에서 90분 뛸 때마다 +0.6%p, 약 40경기면 거의 익숙해짐
function devAfterMatch(T,res,s){const keys=E3.FORMS[T.form.base];T.xi.forEach((p,i)=>{const k0=keys[i];if(!k0)return;const [sg,side]=E3.SLOT[k0];const key=sg+(side?'-'+side:'');
  const f=E3.fitOf(p,k0);const q=S.ps[p.id]=S.ps[p.id]||{};q.tapps=(q.tapps||0)+1;q.capps=(q.capps||0)+1;if(f<1){q.posXp=q.posXp||{};q.posXp[key]=Math.min(.45,(q.posXp[key]||0)+.006)}})}
function devLine(p){const q=S.ps[p.id]||{},bits=[];const gs=gradeShown(p);if(gs)bits.push(`유스 등급 <b style="color:var(--amber)">${gs}</b>${(q.capps||0)<10?' (추정)':''}`);
  if(p.legendOf)bits.push(p.legendRel==='제2의'?`'제2의 ${esc(p.legendOf)}'`:`${esc(p.legendOf)}의 ${p.legendRel}`);
  if(q.ovrS!=null&&q.ovrF!=null){const d=q.ovrF-q.ovrS;if(Math.abs(d)>=.5)bits.push(`이번 시즌 능력 ${d>0?'▲':'▼'}${Math.abs(d).toFixed(1)}`)}
  const P=devParams(p);bits.push(`성장형 ${['조숙','표준','대기만성'][P.type+1]}`);
  return bits.length?`<div class="note" style="margin-top:4px">${bits.join(' · ')}</div>`:''}

