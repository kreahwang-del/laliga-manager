# v292: delta(능력치)만 반영 + OVR은 포지션 가중치(0070 DEV_W)로 능력치 변화에서 계산, 가치 ×10^(0.06ΔOVR). 정수 디더링(선수·항목 해시)
import json,hashlib,math,sys
src=sys.argv[1];tag=sys.argv[2]
D=json.load(open(src));K=D['K'];d=D['d']
P=json.load(open('src/data/G/players.json'))
W={'ST':{'shoot':.3,'offball':.25,'drib':.1,'aerial':.1,'pace':.15,'pass':.1},'W':{'drib':.25,'pace':.2,'cross':.1,'shoot':.15,'pass':.15,'offball':.15},'AM':{'pass':.3,'drib':.2,'shoot':.15,'offball':.2,'pace':.1,'stamina':.05},
'CM':{'pass':.3,'tackle':.15,'posit':.15,'stamina':.15,'drib':.1,'shoot':.05,'offball':.1},'DM':{'posit':.25,'tackle':.25,'pass':.25,'stamina':.1,'aerial':.1,'pace':.05},'FB':{'tackle':.2,'posit':.15,'pace':.2,'cross':.15,'stamina':.15,'pass':.15},
'CB':{'posit':.3,'tackle':.25,'aerial':.25,'pace':.1,'pass':.1},'GK':{'gk_save':.55,'gk_air':.15,'gk_sweep':.15,'gk_dist':.15}}
def u(pid,k):return int(hashlib.md5(f'{tag}:{pid}:{k}'.encode()).hexdigest()[:8],16)/2**32
n=0
for r in P:
  dd=d.get(str(r[0]))
  if not dd:continue
  old=list(r[11]);ch={}
  for i in range(14):
    if dd[i]:
      w=max(1,min(20,math.floor(r[11][i]+dd[i]+u(r[0],K[i]))));ch[K[i]]=w-r[11][i];r[11][i]=w
  if r[24]:
    for j,k in enumerate(['str','comp','fk','pen']):
      x=dd[14+j]
      if x:
        w=max(1,min(20,math.floor(r[24][1+j]+x+u(r[0],k))));ch[k]=w-r[24][1+j];r[24][1+j]=w
  wt=W.get(r[3],W['CM']);dv=4.15*sum(wt.get(k,0)*v for k,v in ch.items())
  if abs(dv)>1e-9:
    no=int(max(40,min(95,math.floor(r[9]+dv+u(r[0],'ovr')))));do=no-r[9]
    if do:
      r[9]=no;r[10]=max(r[10]+do,no)
      if r[12]:r[12]=int(round(r[12]*10**(.06*do)/1e4)*1e4)
  n+=1
open('src/data/G/players.json','w').write('[\n'+',\n'.join(json.dumps(r,ensure_ascii=False,separators=(',',':')) for r in P)+'\n]')
print('players',n)
