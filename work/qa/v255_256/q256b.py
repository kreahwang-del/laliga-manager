import json,math,sys
sys.path.insert(0,'.')
D='out256/'
def load(fs):
    R={}
    for f in fs:
        for l in open(D+f):
            if l.strip():o=json.loads(l);R[o['k']]=o
    return R
old=load(['ai_old_0.jsonl','ai_old_1.jsonl']);new=load(['ai_new_0.jsonl','ai_new_1.jsonl'])
def st(R):
    a={'trS':0,'ldS':0,'trG':0,'ldG':0,'trX':0,'ldX':0,'n':0,'lvS':0,'lvG':0,'nl':0}
    for o in R.values():
        sh=o['sh65']
        if sh[2]==sh[3]:
            a['nl']+=1;a['lvS']+=o['shE'][0]+o['shE'][1]-sh[0]-sh[1];a['lvG']+=sum(1 for g in o['g'] if g[0]>65);continue
        t=0 if sh[2]<sh[3] else 1;a['n']+=1
        a['trS']+=o['shE'][t]-sh[t];a['ldS']+=o['shE'][1-t]-sh[1-t]
        a['trX']+=o['xg'][t]-sh[4+t];a['ldX']+=o['xg'][1-t]-sh[5-t]
        a['trG']+=sum(1 for g in o['g'] if g[0]>65 and g[1]==t);a['ldG']+=sum(1 for g in o['g'] if g[0]>65 and g[1]==1-t)
    n=a['n'];return {k:round(v/n,3) if k not in('n','nl','lvS','lvG') else v for k,v in a.items()}|{'lvS/m':round(a['lvS']/a['nl'],2),'lvG/m':round(a['lvG']/a['nl'],3)}
print('old',st(old));print('new',st(new))
# 시간대별 득점
for nm,R in [('old',old),('new',new)]:
    b=[0]*7
    for o in R.values():
        for g in o['g']:b[min(6,int(g[0]//15))]+=1
    print(nm,[round(x/len(R),3) for x in b])
# 점수 동일 비율, 65분까지 동일 비율
same=sum(1 for k in old if old[k]['sc']==new[k]['sc'])/len(old);same65=sum(1 for k in old if old[k]['sh65']==new[k]['sh65'])/len(old)
print('same final',same,'same sh65',same65)
