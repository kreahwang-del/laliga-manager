import json,unicodedata,re,sys
def nm(s):s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower();return re.sub(r'[^a-z ]','',s.replace('-',' ')).split()
P=json.load(open('src/data/G/players.json'));C=json.load(open('src/data/G/clubs.json'))
us={c[0]:c for c in C if c[3]=='US'}
CM={'Inter Miami':'Miami','Chicago Fire':'Chicago','Orlando City SC':'Orlando','LAFC':'Los Angeles Football','Atlanta United':'Atlanta','LA Galaxy':'Galaxy','Charlotte FC':'Charlotte','New York Red Bulls':'Red Bull','Nashville SC':'Nashville','Toronto FC':'Toronto','Columbus Crew':'Columbus','Vancouver Whitecaps':'Vancouver','St. Louis City SC':'Louis','New England Revolution':'New England','FC Cincinnati':'Cincinnati','Austin FC':'Austin','San Jose Earthquakes':'San Jose','Seattle Sounders FC':'Seattle','New York City FC':'New York City','San Diego FC':'San Diego','Portland Timbers':'Portland','Sporting Kansas City':'Kansas','CF Montreal':'Montr','FC Dallas':'Dallas','Houston Dynamo':'Houston','DC United':'D.C.','Real Salt Lake':'Salt Lake','Colorado Rapids':'Colorado','Minnesota United':'Minnesota','Philadelphia Union':'Philadelphia'}
cid={}
for k,v in CM.items():
  m=[c for c in us.values() if v.lower() in c[1].lower()]
  cid[k]=m[0][0] if len(m)==1 else None
  if len(m)!=1:print('club?',k,[c[1] for c in m])
rows=[l.split(';') for l in open('work/mls/mlspa_fall2026.txt') if l.strip() and not l.startswith('#')]
gp=[p for p in P if p[2] in us]
byc={}
for p in gp:byc.setdefault(p[2],[]).append(p)
res={};un=[]
for n,cl,d,k in rows:
  c=cid.get(cl);t=nm(n);cand=byc.get(c,[]) if c else gp
  def sc(p):
    s=nm(p[1]);
    if s==t:return 3
    if set(t)<=set(s) or set(s)<=set(t):return 2
    if s and t and s[-1]==t[-1] and s[0][0]==t[0][0]:return 1.5
    if s and t and (s[-1]==t[-1]):return 1
    return 0
  best=sorted(((sc(p),p) for p in cand),key=lambda x:-x[0])
  if best and best[0][0]>=1.5 and (len(best)<2 or best[1][0]<best[0][0]):
    res[best[0][1][0]]=(int(k),d,n,best[0][1][1],best[0][1][2]==c)
  elif c is None or not best or best[0][0]<1.5:
    # 다른 구단(이적)일 수 있음: 전체 MLS 선수에서 정확 일치
    ex=[p for p in gp if nm(p[1])==t]
    if len(ex)==1:res[ex[0][0]]=(int(k),d,n,ex[0][1],False)
    else:un.append(n+' / '+cl)
  else:un.append(n+' / '+cl+' (dup)')
print('rows',len(rows),'matched',len(res),'unmatched',len(un),'game MLS players',len(gp))
print(un[:60])
json.dump({str(k):v for k,v in res.items()},open('work/mls/match.json','w'),ensure_ascii=False)
