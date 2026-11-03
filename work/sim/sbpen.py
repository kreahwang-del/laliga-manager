import json,sys,os,urllib.request
RAW=sys.argv[1];B='https://raw.githubusercontent.com/statsbomb/open-data/master/data/'
def get(path):
  fn=os.path.join(RAW,path.replace('/','_'))
  if not os.path.exists(fn):urllib.request.urlretrieve(B+path,fn)
  return fn
res={}
for cid,sid in [(11,27),(2,27)]:
  ms=json.load(open(get(f'matches/{cid}/{sid}.json')));A={};n=0
  def add(k,v=1):A[k]=A.get(k,0)+v
  for m in ms:
    fn=get(f"events/{m['match_id']}.json");ev=json.load(open(fn));os.remove(fn);n+=1
    for e in ev:
      t=e['type']['name'];loc=e.get('location')
      if t=='Own Goal For':add('og')
      if t=='Shot' and e['shot']['type']['name']=='Penalty':add('pen')
      if t=='Foul Committed':
        fc=e.get('foul_committed') or {}
        if fc.get('penalty'):add('penFoul');add('penFoul_'+(fc.get('type',{}).get('name','plain')))
      if t=='Dribble' and loc and loc[0]>=102 and 18<=loc[1]<=62:add('ibDrib');add('ibDribOK',e['dribble']['outcome']['name']=='Complete')
      if t=='Foul Won' and loc and loc[0]>=102 and 18<=loc[1]<=62:add('foulWonBox')
  res[f'{cid}:{sid}']={'matches':n,**{k:round(v/n,3) for k,v in A.items()}};print(cid,n,flush=True)
json.dump(res,open(sys.argv[2],'w'),indent=1)
