# StatsBomb 공개 데이터로 공격 단계별 실제 기준 산출 (팀·경기당)
import json,sys,os,urllib.request,random
RAW=sys.argv[1];OUT=sys.argv[2];N=int(sys.argv[3]);comps=[tuple(map(int,x.split(':'))) for x in sys.argv[4].split(',')]
B='https://raw.githubusercontent.com/statsbomb/open-data/master/data/'
def get(path):
  fn=os.path.join(RAW,path.replace('/','_'))
  if not os.path.exists(fn):urllib.request.urlretrieve(B+path,fn)
  return fn
inbox=lambda l:l and l[0]>=102 and 18<=l[1]<=62
res={}
for cid,sid in comps:
  ms=json.load(open(get(f'matches/{cid}/{sid}.json')));random.Random(7).shuffle(ms);ms=ms[:N]
  A={};tm=0
  def add(k,v=1):A[k]=A.get(k,0)+v
  for m in ms:
    fn=get(f"events/{m['match_id']}.json");ev=json.load(open(fn));os.remove(fn);tm+=2
    for e in ev:
      t=e['type']['name'];loc=e.get('location');pt=(e.get('play_pattern') or {}).get('name','')
      if t=='Shot':
        add('shot');st=e['shot'];g=st['outcome']['name']=='Goal'
        if st['type']['name']=='Penalty':add('pen');add('penG',g);continue
        add('goal',g);ib=inbox(loc);add('shIB' if ib else 'shOB');add('gIB' if ib else 'gOB',g)
        if st.get('body_part',{}).get('name')=='Head':add('shHead')
        if st['outcome']['name']=='Blocked':add('shBlk')
        if st['outcome']['name'] in('Goal','Saved','Saved To Post'):add('shSoT')
        add('xg',st.get('statsbomb_xg',0))
      sp=(e.get('pass') or {}).get('type',{}).get('name') if t=='Pass' else None
      setp=sp in('Corner','Free Kick','Throw-in','Kick Off','Goal Kick')
      if t in('Pass','Shot','Dribble','Clearance') and inbox(loc) and not setp:
        add('ibAct');add('ibAct_'+t)
      if t=='Ball Receipt*' and inbox(loc) and 'outcome' not in (e.get('ball_receipt') or {}):add('ibRecv')
      if t=='Pass' and not setp:
        p=e['pass'];end=p.get('end_location');ok='outcome' not in p
        if loc and end and not inbox(loc) and inbox(end):
          add('pIntoBox');add('pIntoBoxOK',ok)
          if p.get('cross'):add('crossBox');add('crossBoxOK',ok)
          if p.get('through_ball') or p.get('technique',{}).get('name')=='Through Ball':add('thrBox');add('thrBoxOK',ok)
        if loc and end and loc[0]<80 and end[0]>=80:add('pF3');add('pF3OK',ok)
        if loc and loc[0]>=80:add('pInF3');add('pInF3OK',ok)
        if p.get('cross'):add('cross');add('crossOK',ok)
      if t=='Carry':
        end=e['carry'].get('end_location')
        if loc and end and not inbox(loc) and inbox(end):add('cIntoBox')
        if loc and end and loc[0]<80 and end[0]>=80:add('cF3')
      if t=='Dribble' and loc and loc[0]>=80:add('drF3');add('drF3OK',e['dribble']['outcome']['name']=='Complete')
      if t=='Foul Committed' and loc and loc[0]<=18 and 18<=loc[1]<=62:add('foulBoxConceded')
  res[f'{cid}:{sid}']={k:round(v/tm,3) for k,v in A.items()};res[f'{cid}:{sid}']['teamMatches']=tm
  print(cid,sid,tm,flush=True)
json.dump(res,open(OUT,'w'),indent=1)
