# MLSPA 2026 가을 보장 연봉 → players.json 연봉(€, 환율 0.86) / 목록에 없는 MLS 선수는 리그 최저 수준(€9.7만~11.2만)으로 맞춤
import json
P=json.load(open('src/data/G/players.json'));C=json.load(open('src/data/G/clubs.json'))
us={c[0] for c in C if c[3]=='US'};M=json.load(open('work/mls/match.json'));FX=.86
byname={}
for p in P:
  if p[2] in us:byname.setdefault((p[1],p[2]),[]).append(p)
n=0;m=0
for p in P:
  if p[2] not in us:continue
  v=M.get(str(p[0]))
  if not v:
    for q in byname[(p[1],p[2])]:
      if str(q[0]) in M:v=M[str(q[0])]
  if v:p[15]=int(round(v[0]*1000*FX,-3));m+=1
  else:p[15]=int(min(max(p[15] or 0,97000),112000));n+=1
json.dump(P,open('src/data/G/players.json','w'),ensure_ascii=False,separators=(',',':'))
print('matched',m,'min-level',n)
