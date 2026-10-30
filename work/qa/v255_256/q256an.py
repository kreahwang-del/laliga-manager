import json,sys,math,glob,os
D='/home/claude/work/qa/out256/'
def load(fs):
    R={}
    for f in fs:
        if not os.path.exists(D+f):continue
        for l in open(D+f):
            l=l.strip()
            if l:o=json.loads(l);R[o['k']]=o
    return R
def ms(v):
    n=len(v);m=sum(v)/n;sd=math.sqrt(sum((x-m)**2 for x in v)/(n-1)) if n>1 else 0;return m,sd/math.sqrt(n),n
def aim(o):
    a,b=o['sc'];s70=o['s70'];sh=o['sh65']
    late=sum(1 for g in o['g'] if g[0]>=76)
    r={'goals':a+b,'draw':int(a==b),'home':int(a>b),'late':late,'xg':o['xg'][0]+o['xg'][1],'shots':o['shE'][0]+o['shE'][1]}
    if s70[0]!=s70[1]:
        t=0 if s70[0]<s70[1] else 1
        r['cb70']=int((a>=b) if t==0 else (b>=a))
    if sh[2]!=sh[3]:
        t=0 if sh[2]<sh[3] else 1
        r['trS']=o['shE'][t]-sh[t];r['ldS']=o['shE'][1-t]-sh[1-t]
        r['trX']=o['xg'][t]-sh[4+t];r['ldX']=o['xg'][1-t]-sh[5-t]
    r['att']=int('공격적' in o['m10'][:2])
    return r
def summ(R,name):
    M=[aim(o) for o in R.values()]
    out={}
    for k in ['goals','draw','home','xg','shots','cb70','att']:
        v=[m[k] for m in M if k in m];out[k]=ms(v)
    G=sum(m['goals'] for m in M);out['lateShare']=(sum(m['late'] for m in M)/G,)
    tr=[m for m in M if 'trS' in m];out['trRatio']=(sum(m['trS'] for m in tr)/max(1,sum(m['ldS'] for m in tr)),len(tr))
    out['trXg']=(sum(m['trX'] for m in tr)/max(1e-9,sum(m['ldX'] for m in tr)),)
    return out
def paired(A,B,keys=('goals','draw','home','xg','late','shots')):
    ks=sorted(set(A)&set(B));res={}
    for key in keys:
        v=[aim(B[k])[key]-aim(A[k])[key] for k in ks];res[key]=ms(v)
    # 지는팀 슈팅비: 부트스트랩 대신 match-level 비율차 근사
    return res,len(ks)
def fmt(t):return ' '.join(f'{x:.4f}' if isinstance(x,float) else str(x) for x in t)
mode=sys.argv[1] if len(sys.argv)>1 else 'ai'
if mode=='ai':
    old=load(['ai_old_0.jsonl','ai_old_1.jsonl']);new=load(['ai_new_0.jsonl','ai_new_1.jsonl'])
    for nm,R in [('old',old),('new',new)]:
        s=summ(R,nm);print(nm,len(R),{k:fmt(v) for k,v in s.items()})
    p,n=paired(old,new);print('paired new-old n=',n,{k:fmt(v) for k,v in p.items()})
    # 지는팀 슈팅비 부트스트랩
    import random;random.seed(1);ks=sorted(set(old)&set(new))
    def ratio(R,ks):
        a=b=0
        for k in ks:
            m=aim(R[k])
            if 'trS' in m:a+=m['trS'];b+=m['ldS']
        return a/b
    bs=[];bc=[]
    for _ in range(300):
        s=[random.choice(ks) for _ in ks];bs.append(ratio(new,s)-ratio(old,s))
        c=[aim(new[k]).get('cb70') for k in s];c0=[aim(old[k]).get('cb70') for k in s]
        c=[x for x in c if x is not None];c0=[x for x in c0 if x is not None];bc.append(sum(c)/len(c)-sum(c0)/len(c0))
    print('trRatio diff',ratio(new,ks)-ratio(old,ks),'boot SE',ms(bs)[1]*math.sqrt(len(bs)))
    print('cb70 diff boot SE',ms(bc)[0],ms(bc)[1]*math.sqrt(len(bc)))
    # 첫 600 경기 기준 스윕
    o6={k:v for k,v in old.items() if k<600};n6={k:v for k,v in new.items() if k<600}
    for f in ['__new','sw_rec0','sw_rest0','sw_T35','sw_mild']:
        R=n6 if f=='__new' else load([f+'.jsonl'])
        if not R:continue
        p,n=paired(o6,R);s=summ(R,f)
        print(f,'n',n,'draw',fmt(s['draw']),'goals',fmt(s['goals']),'trRatio',fmt(s['trRatio']),'cb70',fmt(s['cb70']),'| d-old draw',fmt(p['draw']),'goals',fmt(p['goals']))
    s=summ(o6,'o6');print('old600 draw',fmt(s['draw']),'goals',fmt(s['goals']),'trRatio',fmt(s['trRatio']),'cb70',fmt(s['cb70']))
else:
    P={p:load([('g_'+p if p=='none' else p)+'.jsonl']) for p in ['none','g_all','g_air','g_pat']}
    base=P['none']
    def pts(o):
        net=o['gf']-o['ga']-o['d'];return 3 if net>0 else 1 if net==0 else 0
    for p,R in P.items():
        if not R:continue
        ks=sorted(set(R)&set(base));mis=sum(1 for k in ks if R[k]['r']!=base[k]['r'] or R[k]['d']!=base[k]['d'])
        row={'n':len(ks),'r_mismatch':mis}
        for key,f in [('gf',lambda o:o['gf']),('ga',lambda o:o['ga']),('xf',lambda o:o['xf']),('xa',lambda o:o['xa']),('gd',lambda o:o['gf']-o['ga']),('xgd',lambda o:o['xf']-o['xa']),('pts',pts),('eqz',lambda o:int(o['gf']-o['ga']>=o['d']))]:
            m=ms([f(R[k]) for k in ks])[0];dm=ms([f(R[k])-f(base[k]) for k in ks])
            row[key]=f'{m:.3f} (Δ{dm[0]:+.3f}±{dm[1]:.3f})'
        print(p,row)
