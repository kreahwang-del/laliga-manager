# 국적 코드 표준화(v295): players.json의 국적은 '영문 국가명 앞 3글자'와 FIFA 코드가 섞여 있어 AUS(호주/오스트리아)·CHI(중국/칠레)·UNI(미국/UAE) 등이 겹침
# → FIFA 코드로 통일. ① 스쿼드 CSV(work/tr)의 FIFA 코드(이름 일치) ② 앞 3글자 → FIFA 표 ③ 모호한 것은 소속 리그·이름으로 판정
import json,csv,glob,collections,unicodedata,sys
P='src/data/G/players.json'
d=json.load(open(P))
def nk(s):return ''.join(c for c in unicodedata.normalize('NFKD',s.lower()) if not unicodedata.combining(c)).strip()
FULL={'Chile':'CHI','China':'CHN','Australia':'AUS','Austria':'AUT','United States':'USA','Nigeria':'NGA','Slovakia':'SVK','Slovenia':'SVN','DR Congo':'COD','Guinea':'GUI','Cameroon':'CMR','Morocco':'MAR','Burkina Faso':'BFA','Dominican Republic':'DOM','Spain':'ESP','Belgium':'BEL','Brazil':'BRA'}
ALIAS={'NGR':'NGA','GBS':'GNB','GEQ':'EQG','CAF':'CTA','TRI':'TTO'}
csvc={}
for f in glob.glob('work/tr/sq/sq_*.csv')+glob.glob('work/tr/*.csv'):
  for r in csv.DictReader(open(f),delimiter='|'):
    n=(r.get('nat') or '').strip()
    if r.get('player') and n:
      c=FULL.get(n,n);c=ALIAS.get(c,c)
      if len(c)==3 and c.isupper():csvc.setdefault(nk(r['player']),set()).add(c)
# 앞 3글자 → FIFA(겹치지 않는 것)
PRE={'SPA':'ESP','JAP':'JPN','HOL':'NED','NET':'NED','TÜR':'TUR','SWI':'SUI','MOR':'MAR','SER':'SRB','CÔT':'CIV','COT':'CIV','ROM':'ROU','BOS':'BIH','ICE':'ISL','CUR':'CUW','IRE':'IRL','SIE':'SLE','LAT':'LVA','MOL':'MDA','LIT':'LTU','FAR':'FRO','LEB':'LBN','KVX':'KOS','SAU':'KSA','REP':'IRL','SOU':'RSA','IND':'IDN','MAL':'MLI','CAM':'CMR','BUR':'BFA','MON':'MNE','EQU':'EQG','DR ':'COD','THE':'GAM','EL ':'SLV','CEN':'CTA','NEW':'NZL','CAP':'CPV','COS':'CRC','TRI':'TTO','PHI':'PHI','MAU':'MTN','GUA':'GUA','NIG':'NGA','CON':'CGO','IRA':'IRN','LIB':'LBR','ST.':'SKN','BAR':'BRB','TAN':'TAN','DEN':'DEN','PAR':'PAR','POR':'POR','GER':'GER','ENG':'ENG','SCO':'SCO','WAL':'WAL'}
# 모호: 후보와 기본값(리그로 판정)
AMB={'UNI':['USA','UAE'],'CHI':['CHN','CHI'],'AUS':['AUT','AUS'],'NIG':['NGA','NIG'],'SLO':['SVN','SVK'],'CON':['CGO','COD'],'GUI':['GUI','GNB'],'MAL':['MLI','MLT','MAS'],'IRA':['IRN','IRQ'],'LIB':['LBR','LBA','LBN'],'MAR':['MAR','MTQ'],'CAP':['CPV'],'NEW':['NZL','NCL'],'EQU':['EQG'],'ST.':['SKN','LCA','VIN']}
clubs=json.load(open('src/data/G/clubs.json'))
CL={}
for c in clubs:CL[c[0]]=c[3]
def slo(name):
  n=nk(name)
  return 'SVK' if any(n.endswith(x) or (' '+x) in n for x in ['ak','ik','sky','ský','ova','cak']) and not n.endswith('ic') else 'SVN'
out=collections.Counter();chg=0;why=collections.Counter()
for r in d:
  o=r[6];c=None;s=csvc.get(nk(r[1]))
  if o in AMB:
    cand=AMB[o]
    if s:
      m=[x for x in s if x in cand]
      if len(m)==1:c=m[0];why['csv']+=1
    if not c:
      lg=CL.get(r[2])
      if o=='CHI':c='CHN' if lg=='CN' or lg=='CNL' else 'CHI'
      elif o=='AUS':c='AUT' if lg in ('AT','DE','CH') else 'AUS'
      elif o=='UNI':c='UAE' if lg in ('SA',) else 'USA'
      elif o=='SLO':c=slo(r[1])
      else:c=cand[0]
      why['rule:'+o]+=1
  else:
    c=PRE.get(o,o)
    if s and len(s)==1 and list(s)[0]!=c and o in PRE and len(o)==3:pass
  if o=='' :c=(list(s)[0] if s and len(s)==1 else 'ESP')
  if c!=o:chg+=1
  r[6]=c;out[c]+=1
print('changed',chg,dict(why))
print(len(out),sorted(out.items(),key=lambda x:-x[1])[:60])
if '--write' in sys.argv:
  json.dump(d,open(P,'w'),ensure_ascii=False,separators=(',',':'))
  print('written')
