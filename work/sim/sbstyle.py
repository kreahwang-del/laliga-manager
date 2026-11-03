# StatsBomb 공개 데이터: 리그 DNA 지표(경기당 양팀 합계, 일부 팀당) — 파울·카드·경합·공중볼·압박·템포·롱볼·크로스·역습
import json,sys,os,urllib.request
RAW=sys.argv[1];OUT=sys.argv[2];comps=[tuple(map(int,x.split(':'))) for x in sys.argv[3].split(',')]
B='https://raw.githubusercontent.com/statsbomb/open-data/master/data/'
def get(path):
  fn=os.path.join(RAW,path.replace('/','_'))
  for k in range(4):
    if os.path.exists(fn):return fn
    try:urllib.request.urlretrieve(B+path,fn+'.part');os.replace(fn+'.part',fn)
    except Exception as ex:
      print('retry',path,ex,flush=True);import time;time.sleep(3)
  return fn
res={}
for cid,sid in comps:
  ms=json.load(open(get(f'matches/{cid}/{sid}.json')));A={};n=0
  def add(k,v=1):A[k]=A.get(k,0)+v
  for m in ms:
    fn=get(f"events/{m['match_id']}.json");ev=json.load(open(fn));os.remove(fn);n+=1
    hs,as_=m['home_score'],m['away_score'];add('goals',hs+as_);add('homeW',hs>as_);add('draw',hs==as_);add('zeroZero',hs+as_==0);add('g4plus',hs+as_>=4)
    poss={};defAct={};passOpp={}
    for e in ev:
      t=e['type']['name'];tm=e.get('team',{}).get('name');loc=e.get('location')
      if t=='Foul Committed':
        add('fouls');c=(e.get('foul_committed') or {}).get('card',{}).get('name','')
        if 'Yellow' in c:add('yellow')
        if 'Red' in c:add('red')
      if t=='Bad Behaviour':
        c=(e.get('bad_behaviour') or {}).get('card',{}).get('name','')
        if 'Yellow' in c:add('yellow')
        if 'Red' in c:add('red')
      if t=='Duel':
        dt=(e.get('duel') or {}).get('type',{}).get('name','');add('duel');add('duel_'+dt.replace(' ',''))
      if t=='Clearance' and (e.get('clearance') or {}).get('aerial_won'):add('aerialWonClr')
      if t=='Pass' and (e.get('pass') or {}).get('aerial_won'):add('aerialWonPass')
      if t=='Shot' and (e.get('shot') or {}).get('aerial_won'):add('aerialWonShot')
      if t=='Miscontrol' and (e.get('miscontrol') or {}).get('aerial_won'):add('aerialWonMis')
      if t=='Pressure':add('pressure')
      if t=='Pass':
        p=e['pass'];sp=p.get('type',{}).get('name')
        add('passes');add('passOK','outcome' not in p)
        if p.get('length',0)>=32:add('longPass')
        if p.get('cross'):add('cross')
        # PPDA: 상대 진영 60% 지점 이전(자기 진영 기준 x<72)에서 상대가 한 패스 수 / 그 구역 수비 행동
        if loc and loc[0]<72 and not sp:passOpp[tm]=passOpp.get(tm,0)+1
      if t in('Duel','Interception','Foul Committed','Block') or (t=='Ball Recovery'):
        if loc and loc[0]>48:defAct[tm]=defAct.get(tm,0)+1
      pp=(e.get('play_pattern') or {}).get('name','')
      if t=='Shot':
        add('shots')
        if pp=='From Counter':add('shotsCounter')
        if pp in('From Corner','From Free Kick','From Throw In'):add('shotsSetPiece')
    tms=list(passOpp.keys())
    if len(tms)==2:
      for a in tms:
        b=[x for x in tms if x!=a][0];add('ppda_pass',passOpp[a]);add('ppda_def',defAct.get(b,0))
  r={k:round(v/n,3) for k,v in A.items()};r['matches']=n
  r['ppda']=round(A.get('ppda_pass',0)/max(1,A.get('ppda_def',1)),2)
  r['aerial']=round((A.get('duel_AerialLost',0)*2)/n,2)
  res[f'{cid}:{sid}']=r;print(cid,n,flush=True);json.dump(res,open(OUT,'w'),indent=1)
