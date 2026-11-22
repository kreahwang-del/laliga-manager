# 홈그로운 산정(사용자 제공 트랜스퍼마르크트 이적 기록, 개인용): 15~21세 사이 같은 구단(유스팀 포함) 36개월 이상 → 구단 육성, 같은 나라 구단 36개월 이상 → 협회 육성
import csv,sys,json,re,collections,datetime as dt,unicodedata
TF,PF,OUT=sys.argv[1],sys.argv[2],sys.argv[3]
CC=json.load(open('work/hg/country2code.json'));CC.update({'Belarus':'BLR','Chinese Taipei':'TPE','French Guiana':'GUF','Grenada':'GRN','Hongkong':'HKG','Korea, North':'PRK','North Macedonia':'MKD','Palestine':'PLE'})
T=list(csv.DictReader(open(TF,encoding='utf-8-sig')));R=list(csv.DictReader(open(PF,encoding='utf-8-sig')))
PL=json.load(open('src/data/G/players.json'));C=json.load(open('src/data/G/clubs.json'))
def nz(s):return ''.join(c for c in unicodedata.normalize('NFKD',s.lower()) if c.isalnum() or c==' ').split()
YOUTH=re.compile(r"\s+(U\s?\d{2}|Youth|Academy|Jugend|Juvenil\s?[AB]?|Primavera|Reserves?|B|II|Sub-?\d{2}|Jong)$",re.I)
GEN=set('fc cf ac bc sc afc cd ud sd rc rcd ca club clube futebol football calcio fk sk sv vfb vfl tsg ssc as us acf hsc ogc rb 1913 1904 1907 1909 1899 1900 1919 de del la le of the and youth academy primavera jugend juvenil reserves reserve b ii jong u15 u16 u17 u18 u19 u20 u21 u22 u23 castilla atletic atlètic'.split())
def key(n):
  n=re.sub(r'\(.*?\)','',n).strip();n=re.sub(r'^Jong\s+','',n)
  t=[w for w in nz(n) if w not in GEN and not re.fullmatch(r'u\d\d|\d{4}',w)]
  return frozenset(t) or frozenset(nz(n))
def parent(n):return key(n)
# 자료 구단 이름 → 게임 구단 id (선수 목록의 소속 구단 이름과 게임 구단 다수결 대응)
byid={r['id']:r for r in R};byd=collections.defaultdict(list)
for r in R:byd[r['dateOfBirth']].append(r)
m={}
for p in PL:
  r=byid.get(str(p[0]))
  if r and (r['dateOfBirth']==p[5] or set(nz(r['name']))&set(nz(p[1]))):m[p[0]]=r;continue
  c=[r for r in byd.get(p[5],[]) if set(nz(r['name']))&set(nz(p[1]))]
  if len(c)==1:m[p[0]]=c[0]
cv=collections.defaultdict(collections.Counter)
for p in PL:
  r=m.get(p[0])
  if r:cv[r['club']][p[2]]+=1
CP={c[0]:c for c in C}
# B팀(par 있음)은 본 구단 기록으로 합침 — 구단 육성은 B팀·유스팀 기간을 모두 본 구단에 셈
def isB(i):c=CP.get(i);return bool(c) and any(isinstance(x,int) and x in CP and x!=i and CP[x][1] in c[1] for x in c[4:6]) or (bool(c) and (c[1].endswith(' B') or ' II' in c[1] or 'Castilla' in c[1] or 'Atlètic' in c[1]))
cmap={}
for k,v in cv.items():
  i,n=v.most_common(1)[0]
  if n>=3 and not isB(i):cmap.setdefault(key(k),i)
by=collections.defaultdict(list)
for r in T:
  if r['upcoming']=='True' or not r['date']:continue
  by[r['id']].append(r)
D=lambda s:dt.date.fromisoformat(s)
res={};stat=collections.Counter();assumed=0;OUTG={}
for p in PL:
  r=m.get(p[0]);tid=r['id'] if r else str(p[0])
  L=sorted(by.get(tid,[]),key=lambda x:x['date'])
  if not L:stat['이적 기록 없음']+=1;continue
  dob=D(p[5]);w0=dob.replace(year=dob.year+15) if not(dob.month==2 and dob.day==29) else dt.date(dob.year+15,3,1);w1=dt.date(w0.year+6,w0.month,w0.day)
  st=[];s0=L[0];start=D(s0['date'])
  if s0['transferType']=='internal':start0=min(start,w0)  # 첫 기록이 같은 구단 내부 승격이면 그 전부터 재적 → 15세부터로 봄(다른 구단에서 온 기록은 날짜부터)
  else:start0=start
  if start0<start:st.append((parent(s0['fromClub']),s0['fromCountry'],start0,start));assumed+=start0<w0+dt.timedelta(1) and start>w0
  for i,x in enumerate(L):
    e=D(L[i+1]['date']) if i+1<len(L) else dt.date(2026,7,1)
    st.append((parent(x['toClub']),x['toCountry'],D(x['date']),e))
  ks={x[0] for x in st}
  def mg(k):
    if k in cmap:return k
    sup=[s for s in ks if s!=k and k<=s]
    if len(set(sup))==1:return sup[0]
    sup=[s for s in cmap if k and k<s]
    return sup[0] if len(sup)==1 else k
  st=[(mg(cl),co,a,b) for cl,co,a,b in st]
  cd=collections.Counter();nd=collections.Counter()
  for cl,co,a,b in st:
    a2,b2=max(a,w0),min(b,w1)
    if b2>a2:cd[cl]+=(b2-a2).days;nd[co]+=(b2-a2).days
  clubs=[c for c,d in cd.items() if d>=1065];cos=[c for c,d in nd.items() if d>=1065 and c]
  # 게임용: 15~21세 재적 일수(180일 이상만). 게임 진행 중 시즌 기록과 더해 판정
  gc=collections.Counter()
  for c,d in cd.items():
    if c in cmap and d>=180:gc[cmap[c]]+=d
  ga={CC[c]:d for c,d in nd.items() if c in CC and d>=180}
  if gc or ga:OUTG[str(p[0])]=[[[k,v] for k,v in gc.items()],[[k,v] for k,v in ga.items()]]
  ours=sorted({cmap[c] for c in clubs if c in cmap})
  res[str(p[0])]={'c':ours,'cn':[' '.join(sorted(c)) for c in clubs if c not in cmap],'a':cos}
  stat['구단 육성 있음' if clubs else ('협회만' if cos else '해당 없음')]+=1
print(dict(stat),'유스팀 출발 가정',assumed)
json.dump(res,open(OUT,'w'),ensure_ascii=False)

json.dump(OUTG,open('src/data/G/hgTM.json','w'),separators=(',',':'),ensure_ascii=False);print('hgTM',len(OUTG),'명')
