# v307 빠진 선수 추가 1단계: 매칭·구단 대응·OVR 추정식(기존 선수로 학습)
import csv,json,collections,unicodedata,math,sys
F=sys.argv[1];P_=sys.argv[2]
R=list(csv.DictReader(open(F,encoding='utf-8-sig')))
PL=json.load(open('src/data/G/players.json'));C=json.load(open('src/data/G/clubs.json'));cid={c[0]:c for c in C}
def nz(s):return ''.join(c for c in unicodedata.normalize('NFKD',s.lower()) if c.isalnum() or c==' ').split()
byid={r['id']:r for r in R};byd=collections.defaultdict(list)
for r in R:byd[r['dateOfBirth']].append(r)
m={}
for p in PL:
  r=byid.get(str(p[0]))
  if r and (r['dateOfBirth']==p[5] or set(nz(r['name']))&set(nz(p[1]))):m[p[0]]=r;continue
  c=[r for r in byd.get(p[5],[]) if set(nz(r['name']))&set(nz(p[1]))]
  if len(c)==1:m[p[0]]=c[0]
used={r['id'] for r in m.values()}
# 구단 대응: 매칭 선수의 (자료 구단 → 게임 구단) 다수결
cm=collections.defaultdict(collections.Counter)
for p in PL:
  r=m.get(p[0])
  if r:cm[(r['league'],r['club'])][p[2]]+=1
club={k:v.most_common(1)[0][0] for k,v in cm.items() if v.most_common(1)[0][1]>=max(3,0.5*sum(v.values()))}
# OVR 추정식: 리그별 OVR = a + b*log10(가치) + c*(나이-26)^2 (최소제곱), 가치 없는 경우 리그 하위 분위
import numpy as np
age=lambda d:(2026.5-int(d[:4])-int(d[5:7])/12) if d else 26
fit={};low={}
by=collections.defaultdict(list)
for p in PL:
  r=m.get(p[0])
  if r and r['marketValue']:by[r['league']].append((math.log10(float(r['marketValue'])),age(r['dateOfBirth']),p[9],p[3]=='GK'))
for lg,L in by.items():
  X=np.array([[1,v,(a-26)**2,a-26,g] for v,a,o,g in L]);y=np.array([o for *_,o,g in [(v,a,o,g) for v,a,o,g in L]])
  y=np.array([o for v,a,o,g in L]);b,res,*_=np.linalg.lstsq(X,y,rcond=None);pred=X@b;sd=float(np.std(y-pred))
  fit[lg]=[float(x) for x in b]+[sd,len(L)]
for p in PL:
  r=m.get(p[0])
  if r and not r['marketValue']:low.setdefault(r['league'],[]).append(p[9])
lowm={k:float(np.median(v)) for k,v in low.items()}
cand=[r for r in R if r['id'] not in used and (r['league'],r['club']) in club]
size=collections.Counter(p[2] for p in PL)
print('구단 대응',len(club),'/',len(cm),' 후보',len(cand));print({k:(round(v[1],1),round(v[5],1),v[6]) for k,v in sorted(fit.items())})
json.dump({'club':{f'{a}|{b}':c for (a,b),c in club.items()},'fit':fit,'low':lowm,'cand':[r['id'] for r in cand]},open(P_+'/addpl1.json','w'))
