# StatsBomb 공개 데이터: 리그 DNA 스타일 지표(팀·경기당)
import json,sys,os,urllib.request,math
RAW=sys.argv[1];OUT=sys.argv[2];comps=[tuple(map(int,x.split(':'))) for x in sys.argv[3].split(',')]
B='https://raw.githubusercontent.com/statsbomb/open-data/master/data/'
def get(path):
  fn=os.path.join(RAW,path.replace('/','_'))
  if not os.path.exists(fn):urllib.request.urlretrieve(B+path,fn)
  return fn
res={}
for cid,sid in comps:
  ms=json.load(open(get(f'matches/{cid}/{sid}.json')));A={};tm=0;poss_n=0;poss_p=0
  def add(k,v=1):A[k]=A.get(k,0)+v
  for m in ms:
    fn=get(f"events/{m['match_id']}.json");ev=json.load(open(fn));os.remove(fn);tm+=2
    add('goalsM',(m.get('home_score') or 0)+(m.get('away_score') or 0))
    pc={}
    for e in ev:
      t=e['type']['name'];loc=e.get('location')
      if t=='Pass':
        p=e['pass'];add('pass');add('passOK','outcome' not in p)
        if p.get('length',0)>=32:add('longPass')
        if p.get('cross'):add('crossAll')
        pc[e['possession']]=pc.get(e['possession'],0)+1
      if t=='Duel':
        add('duel');dt=e['duel'].get('type',{}).get('name','')
        if dt=='Tackle':add('duelTackle')
        if 'Aerial' in dt:add('aerial')
      if t in('Clearance','Shot','Pass','Miscontrol') and e.get(t.lower(),{}).get('aerial_won'):add('aerial')
      if t=='Pressure':add('press');(add('pressHigh') if loc and loc[0]>=80 else None)
      if t=='Foul Committed':
        add('foul');c=(e.get('foul_committed') or {}).get('card',{}).get('name','')
        if 'Yellow' in c:add('yel')
        if 'Red' in c:add('red')
      if t=='Bad Behaviour':
        c=(e.get('bad_behaviour') or {}).get('card',{}).get('name','')
        if 'Yellow' in c:add('yel')
        if 'Red' in c:add('red')
      if t=='Dribble':add('drib');add('dribOK',e['dribble']['outcome']['name']=='Complete')
      if t=='Interception':add('intc')
      if t=='Ball Recovery':add('recov')
      if t=='Shot':add('shot')
    for v in pc.values():poss_n+=1;poss_p+=v
  r={k:round(v/tm,3) for k,v in A.items()};r['goalsM']=round(A['goalsM']/(tm/2),3);r['passPerPoss']=round(poss_p/max(1,poss_n),2);r['passOK%']=round(A['passOK']/A['pass']*100,1);r['longPass%']=round(A.get('longPass',0)/A['pass']*100,1);r['teamMatches']=tm
  res[f'{cid}:{sid}']=r;print(cid,sid,tm,flush=True)
json.dump(res,open(OUT,'w'),indent=1)
