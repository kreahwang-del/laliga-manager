# v308 사용자 제공 트랜스퍼마르크트 자료(개인용)로 갱신: 현 소속·임대·계약 만료·시장가치·키 + 예정 이적·이적 기록
import sys,json,collections;sys.path.insert(0,'work/tmupd')
from common import *
T,R,PL,C,m,byname,cid=load(sys.argv[1],sys.argv[2]);CN={c[0]:c[1] for c in C};CI={c[0]:c for c in C}
WRITE='--write' in sys.argv
by=collections.defaultdict(list)
for r in T:by[r['id']].append(r)
st=collections.Counter();prev={};loan0={};pre=[];hist={};names={};nid=lambda n:names.setdefault(n,len(names))
for p in PL:
  r=m.get(p[0])
  if not r:continue
  A=sorted(by.get(r['id'],[]),key=lambda x:x['date']);L=[x for x in A if x['upcoming']=='False'];U=[x for x in A if x['upcoming']=='True']
  old=(p[2],p[14]);cur=byname.get(r['club'])
  # ① 현 소속(자료의 현재 선수단 기준)
  if cur is not None and cur!=p[2]:p[2]=cur;st['소속 변경']+=1
  # ② 임대: 마지막 기록이 임대이고 임대 간 구단이 현 소속이면 원 소속 구단 기록(새 게임용)
  last=L[-1] if L else None
  if last and last['transferType']=='loan' and cid.get(last['toClubId'])==p[2]:
    par=cid.get(last['fromClubId']);ret=[x for x in U if x['transferType']=='endOfLoan']
    if par is not None and par!=p[2]:loan0[str(p[0])]=[par,(ret[0]['date'] if ret else '2027-06-30')];st['임대(원 소속 게임 안)']+=1
    else:st['임대(원 소속 게임 밖)']+=1
  # ③ 계약 만료: 임대 선수는 원 소속 계약(복귀 기록의 계약일)
  cu=''
  if last:
    cu=last['contractUntil']
    if last['transferType']=='loan':cu=next((x['contractUntil'] for x in U if x['transferType']=='endOfLoan'),'')
  if cu and cu>='2026-07-02' and cu!=p[14]:p[14]=cu;st['계약 만료일 변경']+=1
  # ④ 시장가치·키
  # 시장가치는 바꾸지 않음: 게임 경제(이적료·연봉·AI 예산)에 맞춘 값이라 하위 리그는 자료의 3~7배. 비교만 기록
  if r['marketValue'] and p[12]:st['가치 1/3 미만']+=float(r['marketValue'])<p[12]/3
  if r['height'] and int(r['height'])!=p[8]:p[8]=int(r['height']);st['키 변경']+=1
  if (p[2],p[14])!=old:prev[str(p[0])]=list(old)
  # ⑤ 예정 이적(완전 이적·자유 이적, 도착 구단이 게임 안)
  for x in U:
    if x['transferType'] in('transfer','freeTransfer'):
      to=cid.get(x['toClubId'])
      if to is not None and to!=p[2]:pre.append([p[0],to,x['date'],int(float(x['fee'])) if x['fee'] else 0,x['transferType'][0]]);st['예정 이적']+=1
  # ⑥ 이적 기록(화면용): 유스 내부 이동·임대 복귀 제외 최근 6건 [날짜, 출발, 도착, 방식 T/F/L, 이적료]
  H=[x for x in L if x['transferType'] in('transfer','freeTransfer','loan')][-6:]
  if H:hist[str(p[0])]=[[x['date'],nid(x['fromClub']),nid(x['toClub']),{'transfer':'T','freeTransfer':'F','loan':'L'}[x['transferType']],int(float(x['fee'])) if x['fee'] else 0] for x in H]
print(dict(st),'이적 기록',len(hist),'구단 이름',len(names))
if WRITE:
  json.dump(PL,open('src/data/G/players.json','w'),ensure_ascii=False,separators=(',',':'))
  json.dump({'prev':prev,'loan0':loan0,'pre':pre},open('src/data/G/tm308.json','w'),separators=(',',':'))
  json.dump({'n':[k for k,_ in sorted(names.items(),key=lambda t:t[1])],'h':hist},open('src/data/G/tfh.json','w'),ensure_ascii=False,separators=(',',':'))
  print('저장')
