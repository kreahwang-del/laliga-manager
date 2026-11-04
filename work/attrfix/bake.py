# delta.json(선수별 변화량)을 src/data/G/players.json에 반영. 능력치는 정수 유지 — 소수 변화는 선수·항목별 고정 해시로 디더링(리그 평균 보존)
import json,hashlib,math,sys
D=json.load(open('work/attrfix/delta.json'));K=D['K'];d=D['d']
P=json.load(open('src/data/G/players.json'))
def u(pid,k):return int(hashlib.md5(f'{pid}:{k}'.encode()).hexdigest()[:8],16)/2**32
cl=lambda v,lo,hi:max(lo,min(hi,v))
n=0;clip=0
for r in P:
  dd=d.get(str(r[0]))
  if not dd:continue
  n+=1
  for i in range(14):
    if dd[i]:
      v=r[11][i]+dd[i];w=math.floor(v+u(r[0],K[i]))
      if w>20 or w<1:clip+=1
      r[11][i]=cl(w,1,20)
  if r[24]:
    for j,k in enumerate(['str','comp','fk','pen']):
      x=dd[14+j]
      if x:r[24][1+j]=cl(math.floor(r[24][1+j]+x+u(r[0],k)),1,20)
  if dd[18]:
    o=r[9]+dd[18];r[9]=int(cl(math.floor(o+u(r[0],'ovr')),40,95));r[10]=max(r[10]+round(dd[18]),r[9])
open('src/data/G/players.json','w').write('[\n'+',\n'.join(json.dumps(r,ensure_ascii=False,separators=(',',':')) for r in P)+'\n]')
print('players',n,'clipped',clip)
