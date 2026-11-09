# v307 빠진 선수 추가 2단계: 기존 '추정 선수' 방식으로 행 생성 → players.json·nat2.json에 추가
# OVR = 리그별 추정식(시장가치·나이·GK, 기존 선수로 학습). 가치 없음 = 리그의 가치 없는 기존 선수 OVR 중앙값
# 세부 능력치 = 새 선수 생성 틀(0070 makeYouth와 같은 식: Q + 포지션 오프셋 + 강점 3개 + 무작위), est=1
import csv,json,collections,math,sys,hashlib
F=sys.argv[1];P_=sys.argv[2]
R={r['id']:r for r in csv.DictReader(open(F,encoding='utf-8-sig'))}
A=json.load(open(P_+'/addpl1.json'));cm=json.load(open(P_+'/cmap2.json'))
PL=json.load(open('src/data/G/players.json'));N2=json.load(open('src/data/G/nat2.json'))
ids={p[0] for p in PL};size=collections.Counter(p[2] for p in PL)
def H(*k):return int(hashlib.md5(':'.join(map(str,k)).encode()).hexdigest()[:8],16)/2**32
age=lambda d:(2026.5-int(d[:4])-int(d[5:7])/12) if d else 26
OFF10={'ST':[2,-1,0,-2,-5,-5,2,0,0,-1],'W':[0,0,2,1,-4,-5,1,-4,2,0],'AM':[0,2,1,-1,-4,-4,1,-4,0,0],'CM':[-2,2,0,-1,0,0,-1,-2,-1,1],'DM':[-3,1,-2,-2,2,2,-3,0,-2,1],'FB':[-4,0,0,2,1,0,-3,-2,2,2],'CB':[-6,0,-3,-5,2,2,-5,2,-1,0],'GK':[-12,-4,-9,-10,-10,-4,-12,0,-6,0]}
POS={'Goalkeeper':('GK',''),'Centre-Back':('CB',''),'Left-Back':('FB','Left'),'Right-Back':('FB','Right'),'Defensive Midfield':('DM',''),'Central Midfield':('CM',''),'Attacking Midfield':('AM',''),
 'Left Winger':('W','Left'),'Right Winger':('W','Right'),'Left Midfield':('W','Left'),'Right Midfield':('W','Right'),'Centre-Forward':('ST',''),'Second Striker':('ST','')}
SUBN={'Goalkeeper':'Goalkeeper','Centre-Back':'Centre-Back','Left-Back':'Left-Back','Right-Back':'Right-Back','Defensive Midfield':'Defensive Midfield','Central Midfield':'Central Midfield','Attacking Midfield':'Attacking Midfield','Left Winger':'Left Winger','Right Winger':'Right Winger','Left Midfield':'Left Midfield','Right Midfield':'Right Midfield','Centre-Forward':'Centre-Forward','Second Striker':'Second Striker'}
# 잠재력 여유(pa-ovr) 나이별 중앙값, 연봉/가치 비율 리그별 중앙값 — 기존 실제 선수(est=0)
C={c[0]:c for c in json.load(open('src/data/G/clubs.json'))}
pg=collections.defaultdict(list);wr=collections.defaultdict(list)
for p in PL:
  if p[20]!=0:continue
  pg[min(36,max(16,int(age(p[5]))))].append(p[10]-p[9])
  if p[12] and p[15]:wr[C[p[2]][3] if p[2] in C else '?'].append(p[15]/p[12])
med=lambda L:sorted(L)[len(L)//2]
PG={k:med(v) for k,v in pg.items()};WR={k:med(v) for k,v in wr.items() if len(v)>20}
# 연봉 = 같은 리그·비슷한 OVR(±2) 기존 선수 연봉 중앙값
WO=collections.defaultdict(list)
for p in PL:
  if p[2] in C and p[15]:WO[(C[p[2]][3],p[9])].append(p[15])
def wageOf(lg,o):
  L=[w for d in range(-2,3) for w in WO.get((lg,o+d),[])]
  return med(L) if len(L)>=3 else None
rows=[];n2add={};per=collections.Counter()
cand=[R[i] for i in A['cand']]
cand.sort(key=lambda r:-(float(r['marketValue']) if r['marketValue'] else 0))
skip=collections.Counter()
for r in cand:
  c=A['club'][f"{r['league']}|{r['club']}"];pid=int(r['id'])
  if pid in ids:skip['id겹침']+=1;continue
  if r['position'] not in POS or not r['dateOfBirth']:skip['포지션·생일 없음']+=1;continue
  if size[c]>=30:skip['30명 초과']+=1;continue
  g,sub=POS[r['position']];a=age(r['dateOfBirth']);lg=r['league'];f=A['fit'].get(lg)
  if r['marketValue'] and f:v=math.log10(float(r['marketValue']));ovr=f[0]+f[1]*v+f[2]*(a-26)**2+f[3]*(a-26)+f[4]*(g=='GK')
  else:ovr=A['low'].get(lg,60)-2-(2 if a<21 else 0)  # 가치 정보 없음 = 대개 하위 선수
  ovr=int(round(max(42,min(88,ovr))))
  pa=int(round(max(ovr,min(95,ovr+PG.get(min(36,max(16,int(a))),0)+(H(pid,'pa')-.5)*6))))
  Q=(ovr-40)/54*13+3;OUTA=10
  strong=sorted(range(10),key=lambda i:H(pid,'s',i))[:3]
  fld=[max(1,min(20,round(Q+OFF10[g][i]+((2+H(pid,'b',i)*2) if i in strong else 0)+(H(pid,'n',i)-.5)*2))) for i in range(10)]
  gk=[max(1,min(20,round(Q+1+(H(pid,'g',i)-.5)*3))) if g=='GK' else 1 for i in range(4)]
  comp=max(1,min(20,round(Q-2+(H(pid,'cp')-.5)*3)));stro=max(1,min(20,round(fld[7]*.6+Q*.3+(H(pid,'st')-.5)*2)))
  fk=max(1,min(20,round(fld[3]*.6+fld[0]*.3)));pen=max(1,min(20,round((fld[0]+comp)/2)));wf=1+int(H(pid,'wf')*4)
  val=int(float(r['marketValue'])) if r['marketValue'] else int(round(10**(5+(ovr-45)*3.3/47)*.5/1e4)*1e4)
  wage=wageOf(C[c][3],ovr) or int(round(val*WR.get(C[c][3],0.1)/1e4)*1e4) or 50000
  nat=cm.get(r['nationality']) or 'ESP';nat2=cm.get(r['nationality2']) if r['nationality2'] else None
  h=int(r['height']) if r['height'] else (188 if g in('GK','CB') else 179)
  foot='right' if H(pid,'ft')<.7 else ('left' if H(pid,'ft')<.95 else 'both')
  if sub=='Left' and H(pid,'ft2')<.6:foot='left'
  gt=[.6,.3,.1] if H(pid,'gt')<.3 else ([.2,.6,.2] if H(pid,'gt')<.7 else [.1,.3,.6])
  row=[pid,r['name'],c,g,SUBN[r['position']],r['dateOfBirth'],nat,foot,h,ovr,pa,fld+gk,val,val,f"{2027+int(H(pid,'ce')*4)}-06-30",wage,None,3+int(H(pid,'inj')*10),6+int(H(pid,'pro')*12),gt,1,None,None,None,[wf,stro,comp,fk,pen,0],[0,0],None]
  rows.append(row);size[c]+=1;per[C[c][3]]+=1
  if nat2 and nat2!=nat:n2add[str(pid)]=nat2
print('추가',len(rows),'건너뜀',dict(skip));print(dict(per))
import statistics as st
print('OVR 평균(추가)',round(st.mean(r[9] for r in rows),1),'· 예시:',[(r[1],C[r[2]][1],r[9]) for r in rows if r[1] in('Mason Mount','Federico Chiesa','Dejan Kulusevski','Fikayo Tomori','Folarin Balogun','Ansu Fati')])
if '--write' in sys.argv:
  PL+=rows;N2.update(n2add)
  json.dump(PL,open('src/data/G/players.json','w'),ensure_ascii=False,separators=(',',':'));json.dump(N2,open('src/data/G/nat2.json','w'),separators=(',',':'))
  print('저장')
