# 사용자 제공 트랜스퍼마르크트 자료(개인용) 공통: 선수 매칭·구단 대응
import csv,json,collections,unicodedata,re
def nz(s):return ''.join(c for c in unicodedata.normalize('NFKD',s.lower()) if c.isalnum() or c==' ').split()
GEN=set('fc cf ac bc sc afc cd ud sd rc rcd ca club clube futebol football calcio fk sk sv vfb vfl tsg ssc as us acf hsc ogc rb de del la le of the and youth academy primavera jugend juvenil reserves reserve b ii jong castilla atletic'.split())
def key(n):
  n=re.sub(r'\(.*?\)','',n).strip();n=re.sub(r'^Jong\s+','',n)
  t=[w for w in nz(n) if w not in GEN and not re.fullmatch(r'u\d\d|\d{4}',w)]
  return frozenset(t) or frozenset(nz(n))
def load(TF,PF):
  T=list(csv.DictReader(open(TF,encoding='utf-8-sig')));R=list(csv.DictReader(open(PF,encoding='utf-8-sig')))
  PL=json.load(open('src/data/G/players.json'));C=json.load(open('src/data/G/clubs.json'))
  byid={r['id']:r for r in R};byd=collections.defaultdict(list)
  for r in R:byd[r['dateOfBirth']].append(r)
  m={}
  for p in PL:
    r=byid.get(str(p[0]))
    if r and (r['dateOfBirth']==p[5] or set(nz(r['name']))&set(nz(p[1]))):m[p[0]]=r;continue
    c=[r for r in byd.get(p[5],[]) if set(nz(r['name']))&set(nz(p[1]))]
    if len(c)==1:m[p[0]]=c[0]
  # 구단 대응: 자료 구단 id(현 소속 'club' 이름) → 게임 구단, 이적 기록의 구단 id로 확장
  cv=collections.defaultdict(collections.Counter)
  for p in PL:
    r=m.get(p[0])
    if r:cv[r['club']][p[2]]+=1
  byname={k:v.most_common(1)[0][0] for k,v in cv.items() if v.most_common(1)[0][1]>=3}
  cid={}  # TM 구단 id → 게임 구단
  for r in T:
    for f in ('from','to'):
      n=r[f+'Club'];i=r[f+'ClubId']
      if n in byname and i:cid[i]=byname[n]
  return T,R,PL,C,m,byname,cid
