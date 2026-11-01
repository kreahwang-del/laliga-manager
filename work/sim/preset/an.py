import json,sys,math
for f in sys.argv[1:]:
    L=[json.loads(l) for l in open(f) if l.strip()];P=[k for k in L[0] if k not in('k','h','a','orig')]
    print('==',f,'n',len(L))
    def st(v):n=len(v);m=sum(v)/n;return m,math.sqrt(sum((x-m)**2 for x in v)/(n-1))/math.sqrt(n)
    pts=lambda r:3 if r[0]>r[1] else 1 if r[0]==r[1] else 0
    for p in P:
        dx=st([(o[p][2]-o[p][3])-(o['orig'][2]-o['orig'][3]) for o in L]);dp=st([pts(o[p])-pts(o['orig']) for o in L])
        fit=[o[p][5] for o in L if o[p][5] is not None]
        print(f'  {p:10s} xG차 {dx[0]:+.3f}±{dx[1]:.3f}  승점 {dp[0]:+.3f}±{dp[1]:.3f}  선수구성 적합 평균 {sum(fit)/max(1,len(fit)):+.2f}')
