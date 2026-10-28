import json,glob,re,unicodedata,collections,datetime
SQ='/home/claude/work/tr/sq/'
TR='/home/claude/work/tr/'
s=open('/home/claude/work/cur_pre247db.html',encoding='utf8').read()
dec=json.JSONDecoder()
P,_=dec.raw_decode(s[s.index('"players":[[')+10:])
C,_=dec.raw_decode(s[s.index('"clubs":')+8:])
club={c[0]:(c[1],c[3]) for c in C}
def norm(n):
  n=unicodedata.normalize('NFKD',n).encode('ascii','ignore').decode().lower()
  n=re.sub(r'\(.*?\)','',n); n=re.sub(r'[^a-z ]',' ',n); return ' '.join(n.split())
def nsp(n): return norm(n).replace(' ','')
def skey(n): return ' '.join(sorted(norm(n).split()))
def toks(n): return [t for t in norm(n).split() if len(t)>=3]
W=[]
for f in sorted(glob.glob(SQ+'sq_*.csv')):
  for k,l in enumerate(open(f,encoding='utf8')):
    if k==0: continue
    p=l.rstrip('\n').split('|')
    if len(p)<8 or not p[0].strip().isdigit(): continue
    if 'SUSPECT' in p[7]: continue
    W.append(dict(cid=int(p[0]),cname=p[1],status=p[2],nat=p[5],name=p[6].strip(),note=p[7],stale='STALE' in p[7]))
covered={w['cid'] for w in W}
byname=collections.defaultdict(list); bysp=collections.defaultdict(list); byclub=collections.defaultdict(list)
for w in W:
  byname[skey(w['name'])].append(w); bysp[nsp(w['name'])].append(w); byclub[w['cid']].append(w)
co=collections.defaultdict(collections.Counter)
for r in P:
  for x in byname.get(skey(r[1]),[]):
    if x['cid']==r[2] and x['nat'].strip(): co[r[6]][x['nat'].strip()]+=1
NM={d:set(k for k,v in c.items() if v>=max(2,c.most_common(1)[0][1]*0.1)) for d,c in co.items()}
def natok(dbn,wn):
  wn=(wn or '').strip()
  if not wn or dbn not in NM: return None
  return wn in NM[dbn]
def fuzzy_same(r):
  tk=set(toks(r[1]))
  for x in byclub.get(r[2],[]):
    xt=set(toks(x['name']))
    if tk and xt and (tk<=xt or xt<=tk or (tk&xt and natok(r[6],x['nat']))): return x
  return None
# club-name mapping
GEN=set('fc cf sc ac as afc cd ud rcd sd club de del la le the fk sk sv vfl vfb tsg bv kv kaa krc rsc ssc us ss calcio football futbol clube esporte sport cr ca se bk if aik ec do da e'.split())
def ctok(n):
  n=norm(re.sub(r'^[A-Z]{3} ','',(n or '').strip()))
  n=n.replace('utd','united').replace('man city','manchester city')
  return [t for t in n.split() if t not in GEN and len(t)>=3]
alias={cid:set(ctok(nm)) for cid,(nm,lg) in club.items()}
alias[434]|={'bromwich','albion'}
for w in W:
  if w['cid'] in alias: alias[w['cid']]|=set(ctok(w['cname']))
EX={}
for cid,(nm,lg) in club.items(): EX.setdefault(' '.join(ctok(nm)),cid); EX.setdefault(norm(nm),cid)
for w in W: EX.setdefault(norm(w['cname']),w['cid'])
for k,v in {'paris saint germain':'Paris SG','psg':'Paris SG','inter milan':'Inter','internazionale':'Inter','real sociedad':'Real Sociedad'}.items():
  for cid,(nm,lg) in club.items():
    if nm==v: EX[k]=cid

MAN={'wolverhampton wanderers':'Wolves','agf':'Aarhus GF','deportivo a coruna':'Dep. A Coruña','deportivo la coruna':'Dep. A Coruña','stvv':'Sint-Truidense VV','amedspor':'Amed Sportif Faaliyetler','rapid wien':'Rapid Vienna','sk rapid wien':'Rapid Vienna','union sg':'Union Saint-Gilloise','union saint gilloise':'Union Saint-Gilloise','kasimpasa':'Kasimpasa','fc nordsjaelland':'FC Nordsjaelland','nordsjaelland':'FC Nordsjaelland','brighton hove albion':'Brighton','newcastle united':'Newcastle','tottenham hotspur':'Tottenham','west ham united':'West Ham','nottingham forest':'Nottingham','besiktas':'Beşiktaş Jimnastik Kulübü','olympique lyonnais':'Lyon','olympique de marseille':'Marseille','bayer leverkusen':'Leverkusen','borussia dortmund':'Dortmund','eintracht frankfurt':'Frankfurt','santos':'Santos Futebol Clube'}
for k,v in MAN.items():
  for cid,(nm,lg) in club.items():
    if nm==v: EX[k]=cid
def cid_of(n):
  nn=norm(re.sub(r'^[A-Z]{3} ','',(n or '').strip()))
  if nn in EX: return EX[nn]
  if ' '.join(ctok(n)) in EX: return EX[' '.join(ctok(n))]
  t=set(ctok(n))
  if not t: return None
  best=sorted(((len(t&a)/len(t|a),c) for c,a in alias.items() if t&a),reverse=True)
  if best and best[0][0]>=0.5 and (len(best)==1 or best[0][0]>best[1][0]): return best[0][1]
  cont=[c for c,a in alias.items() if a and (a<=t or t<=a)]
  if len(cont)==1: return cont[0]
  return None
def pdate(d):
  for fm in ('%d %B %Y','%B %d, %Y','%d %b %Y'):
    try: return datetime.datetime.strptime(d.strip(),fm).date().isoformat()
    except: pass
  return ''
T=[]
for f in glob.glob(TR+'*.csv'):
  for k,l in enumerate(open(f,encoding='utf8')):
    if k==0: continue
    p=l.rstrip('\n').split('|')
    if len(p)<5 or not p[1].strip(): continue
    T.append(dict(src=f.split('/')[-1],date=pdate(p[0]),player=p[1].strip(),frm=p[2],to=p[3],fee=p[4],fid=cid_of(p[2]),tid=cid_of(p[3])))
TL=collections.defaultdict(list)
for t in T: TL[skey(t['player'])].append(t)
