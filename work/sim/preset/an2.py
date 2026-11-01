import json,sys,math,collections
L=[json.loads(l) for f in sys.argv[1:] for l in open(f) if l.strip()]
by=collections.defaultdict(dict)
for o in L: by[o['k']].update({k:v for k,v in o.items() if k not in('k','h','a')})
ks=sorted(by);conds=list(by[ks[0]].keys())
def st(v):n=len(v);m=sum(v)/n;return m,math.sqrt(sum((x-m)**2 for x in v)/max(1,n-1))/math.sqrt(n)
pts=lambda r:3 if r['sc'][0]>r['sc'][1] else 1 if r['sc'][0]==r['sc'][1] else 0
base='균형'
print('n',len(ks))
for c in conds:
    R=[by[k][c] for k in ks if c in by[k] and base in by[k]];B=[by[k][base] for k in ks if c in by[k] and base in by[k]]
    xa=st([r['xg'][1]-b['xg'][1] for r,b in zip(R,B)]);xf=st([r['xg'][0]-b['xg'][0] for r,b in zip(R,B)]);pt=st([pts(r)-pts(b) for r,b in zip(R,B)])
    dr=sum(r['sc'][0]==r['sc'][1] for r in R)/len(R);n=sum(r['opp']['n'] for r in R)/len(R);xps=sum(r['opp']['xg'] for r in R)/max(1,sum(r['opp']['n'] for r in R))
    poss=sum((r['poss'] or 0) for r in R)/len(R);cnt=sum(r['opp']['cntX'] for r in R)/len(R);nb=sum(r['opp']['nb'] for r in R)/max(1,sum(r['opp']['n'] for r in R))
    ty=collections.Counter();tx=collections.Counter()
    for r in R:
        for t,(a,x) in r['opp']['ty'].items(): ty[t]+=a/len(R);tx[t]+=x/len(R)
    bd=collections.Counter();bx=collections.Counter()
    for r in R:
        for t,(a,x) in r['opp']['band'].items(): bd[t]+=a/len(R);bx[t]+=x/len(R)
    print(f"{c:22s} 실점xG {xa[0]:+.2f}±{xa[1]:.2f} 득점xG {xf[0]:+.2f} 승점 {pt[0]:+.2f}±{pt[1]:.2f} 무 {dr:.2f} | 상대슈팅 {n:.1f} 슈팅당xG {xps:.3f} 역습xG {cnt:.2f} 박스수비 {nb:.1f} 점유 {poss:.0f}")
    print('     유형별 실점xG', {t:round(tx[t],2) for t in sorted(tx,key=lambda t:-tx[t])[:6]})
    print('     거리별(수/xG)', {t:(round(bd[t],1),round(bx[t],2)) for t in sorted(bd)})
