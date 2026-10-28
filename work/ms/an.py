import json,sys
LG=['EN','ES','DE','IT','FR','PT','NL','BE','TR','SA','BR','EN2']
for f in sys.argv[1:]:
  D=[json.loads(l) for l in open(f)];n=len(D);print('==',f,n,'seasons')
  avg={k:[sum(d['mkt'][k][i] for d in D)/n for i in range(5)] for k in LG}
  en=avg['EN'][0]
  print('gross  ',' '.join(f"{k}:{avg[k][0]:.0f}({avg[k][0]/en*100:.0f}%)" for k in LG))
  print('net    ',' '.join(f"{k}:{avg[k][1]:+.0f}" for k in LG))
  print('count  ',' '.join(f"{k}:{avg[k][2]:.0f}/{avg[k][3]:.0f}f/{avg[k][4]:.0f}l" for k in LG))
  M=[d['mid'] for d in D if d['mid']]
  print('fa80',[m['fa80'] for m in M],'age',[m.get('fa80age') for m in M])
  print('thin last',{k:M[-1]['lg'][k]['thin'] for k in LG})
  if 'scr' in M[-1]['lg']['EN']:
    print('scr avg first/last',{k:(M[0]['lg'][k]['scr'],M[-1]['lg'][k]['scr']) for k in LG})
    print('over last',{k:M[-1]['lg'][k]['over'] for k in LG},'scrN',[m.get('scrN') for m in M],'pen',[m.get('pen') for m in M])
    print('wage bill first/last',{k:(M[0]['lg'][k]['wbM'],M[-1]['lg'][k]['wbM']) for k in LG})
  print('c16',{k:(M[0]['lg'][k]['c16'],M[-1]['lg'][k]['c16']) for k in LG})
