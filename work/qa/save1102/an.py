# 전술 변형별 승점/경기, 득실, xG, 상대가 상성으로 맞선 비율 (실제 사용 전술 대비 짝 차이)
import json,sys,math,collections
R=[json.loads(l) for f in sys.argv[1:] for l in open(f) if l.strip()]
by=collections.defaultdict(dict)
for o in R: by[o['v']][(o['s'],o['i'])]=o
P=lambda o:3 if o['r']=='W' else 1 if o['r']=='D' else 0
base=by.get('실제')
for v,D in by.items():
    L=list(D.values());n=len(L)
    s=f"{v:14s} n={n} 승점 {sum(map(P,L))/n:.2f} 득 {sum(o['gf'] for o in L)/n:.2f} 실 {sum(o['ga'] for o in L)/n:.2f} xG {sum(o['xf'] for o in L)/n:.2f}-{sum(o['xa'] for o in L)/n:.2f} 상대맞춤 {sum(o['plan'] for o in L)/n:.2f} 상성불리 {sum(o['cnt'] for o in L)/n:.2f}"
    if base and v!='실제':
        d=[P(D[k])-P(base[k]) for k in D if k in base];m=sum(d)/len(d);se=math.sqrt(sum((x-m)**2 for x in d)/(len(d)-1)/len(d));s+=f" | 실제 대비 {m:+.2f}±{se:.2f}"
    print(s)
