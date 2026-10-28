exec(open('/tmp/claude-0/-home-claude/143ab34f-cae9-5cd6-8a3a-5ca97cda876d/scratchpad/lib.py').read())
import copy,random,statistics
random.seed(247)
R={r['pid']:r for r in json.load(open(SQ+'resolve.json'))}
NEW=json.load(open(SQ+'new_players.json'))
FA,RET=-1,-2
# clubs whose wiki tables are unreliable for "absent" judgement
dbsq=collections.Counter(r[2] for r in P)
absent=collections.Counter(r['frm'] for r in R.values() if r['src']=='absent')
PARTIAL={c for c,(n,l) in club.items() if n in ('Chelsea','Tottenham','Sochaux')}
unrel={c for c in absent if c in PARTIAL or absent[c]>0.3*dbsq[c] or any(x['stale'] for x in byclub[c])}
st=collections.Counter(); old={}; loans=[]
byid={r[0]:r for r in P}
for r in P:
  x=R.get(r[0])
  if not x: continue
  src=x['src']; to=x['to']
  if src.startswith('TL') or (src=='SQ' and x['conf']=='high'):
    if to is None: newc=FA; st['left_FA']+=1
    elif to==-1: newc=RET; st['outside_hidden']+=1
    elif to!=r[2]:
      newc=to; st['moved']+=1
      if x['loan']: loans.append([r[0],r[2]]); st['loan']+=1
    else: continue
  elif src=='absent' and r[2] not in unrel and r[9]<75:
    newc=FA; st['absent_FA']+=1
  else: continue
  old[r[0]]=r[2]; r[2]=newc
  if newc==FA: r[14]='2026-06-30'
OUTX={'Azzedine Ounahi'}
for r in P:
  if r[1] in OUTX and r[2]>=0: old[r[0]]=r[2]; r[2]=RET; st['manual_out']+=1
st['absent_kept_unreliable']=sum(absent[c] for c in unrel)
# ---- new players to fill clubs < 20
REV={}
for d,cn in co.items():
  for w,v in cn.items(): REV.setdefault(w,collections.Counter())[d]+=v
def dbnat(w):
  w=(w or '').strip()
  return REV[w].most_common(1)[0][0] if w in REV else (w[:3].upper() if w else '')
TARGET={'GK':3,'CB':4,'FB':4,'DM':2,'CM':3,'AM':2,'W':4,'ST':3}
GMAP={'GK':['GK'],'DF':['CB','FB'],'MF':['CM','DM','AM'],'FW':['ST','W']}
POSN={'CB':'CB','RB':'FB','LB':'FB','FB':'FB','DM':'DM','CM':'CM','AM':'AM','W':'W','RW':'W','LW':'W','ST':'ST','CF':'ST'}
sqd=collections.defaultdict(list)
for r in P:
  if r[2]>=0: sqd[r[2]].append(r)
newrows=[]; nid=90000000
newby=collections.defaultdict(list)
for w in NEW: newby[w['cid']].append(w)
def num(w):
  try: return int(re.sub(r'\D','',w.get('number','') or '') or 99)
  except: return 99
for cid,lst in newby.items():
  if cid not in club or club[cid][1] in ('NLL','CHL','TRL','SCL','ATL','PTL','BEL'): continue
  have=sqd[cid]
  need=20-len(have)
  if need<=0: continue
  top=sorted((r[9] for r in have),reverse=True)[:18] or [65]
  med=statistics.median(top)
  lst=sorted(lst,key=num)
  seen=set()
  for w in lst:
    if need<=0: break
    k=skey(w['name'])
    if k in seen: continue
    seen.add(k)
    pos=(w.get('pos') or '').strip().upper()
    cnt=collections.Counter(r[3] for r in sqd[cid])
    cands=[POSN[pos]] if pos in POSN else GMAP.get(pos[:2],list(TARGET))
    g=max(cands,key=lambda g:TARGET[g]-cnt[g])
    n=num(w)
    off=2 if n<=11 else 5 if n<=25 else 9 if n<99 else 6
    ovr=int(round(max(45,med-off+random.uniform(-2,2))))
    age=random.choice([19,20,21,22]) if n>30 and n<99 else random.randint(22,29)
    pa=min(95,ovr+(8 if age<=21 else 4 if age<=24 else 1))
    # template: same g at same club nearest ovr, else any club
    pool=[r for r in sqd[cid] if r[3]==g] or [r for r in P if r[3]==g]
    t=min(pool,key=lambda r:abs(r[9]-ovr))
    nr=copy.deepcopy(t)
    sc=ovr/max(1,t[9])
    nid+=1
    nr[0]=nid; nr[1]=w['name']; nr[2]=cid; nr[3]=g; nr[4]=''
    nr[5]=f"{2026-age}-{random.randint(1,12):02d}-15"; nr[6]=dbnat(w['nat']); nr[9]=ovr; nr[10]=pa
    nr[11]=[max(1,min(20,round(v*sc))) if i<10 else v for i,v in enumerate(t[11])]
    nr[12]=int(t[12]*sc**3); nr[13]=nr[12]; nr[14]='2028-06-30'; nr[15]=int(t[15]*sc**2); nr[16]=None
    nr[20]=2; nr[23]=None
    if len(nr)>26: nr[26]=None
    newrows.append(nr); sqd[cid].append(nr); need-=1; st['new_created']+=1
P2=P+newrows
small=[(club[c][0],len(sqd[c])) for c in club if club[c][1] not in ('NLL','CHL','TRL','SCL','ATL','PTL','BEL') and len(sqd[c])<20]
for k,v in st.items(): print(k,v)
print('unreliable clubs (absent kept):',sorted(club[c][0] for c in unrel)[:40])
print('still <20:',len(small),small[:20])
json.dump(dict(players=P2,old=old,new=[r[0] for r in newrows],loans=loans),open(SQ+'apply_out.json','w'),ensure_ascii=False)
