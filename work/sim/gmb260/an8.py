# v260 보정 뒤 승부수 재측정 분석(QA 상황별 기준): 4시드 합산, 그대로 대비 xG차, 자기 상황 1위 여부
import json,math,glob
P={p:{} for p in ('none','g_all','g_air','g_long')}
for f in glob.glob('out/s*_*.jsonl'):
    sd,p=f.split('/')[-1][1:-6].split('_',1)
    for l in open(f):
        if l.strip():o=json.loads(l);P[p][(sd,o['k'])]=o
K=[k for k in P['none'] if all(k in P[p] and P[p][k]['r']==P['none'][k]['r'] for p in P)]
print('유효',len(K))
def st(v):
    n=len(v);m=sum(v)/n;sd=math.sqrt(sum((x-m)**2 for x in v)/max(1,n-1));return m,sd/math.sqrt(n)
D=lambda p,k:(P[p][k]['xf']-P[p][k]['xa'])-(P['none'][k]['xf']-P['none'][k]['xa'])
ls=sorted(P['none'][k]['ls'] for k in K);t1,t2=ls[len(ls)//3],ls[2*len(ls)//3]
R={}
def row(ks,lab):
    r={p:st([D(p,k) for k in ks]) for p in ('g_all','g_air','g_long')};r['none']=(0,0);R[lab]=(r,len(ks))
    b=max(r,key=lambda p:r[p][0]);tie=[p for p in r if r[b][0]-r[p][0]<=2*math.hypot(r[b][1],r[p][1])]
    print(f'  {lab:22s} n={len(ks):4d} | '+' | '.join(f'{p} {r[p][0]:+.3f}±{r[p][1]:.3f}' for p in ('g_all','g_air','g_long'))+f' | 1위:{b} 동률:{",".join(tie)}')
print('[전체]');row(K,'전체')
for p in ('g_all','g_air','g_long'):
    x=st([P[p][k]['xf']-P['none'][k]['xf'] for k in K]);a=st([P[p][k]['xa']-P['none'][k]['xa'] for k in K]);pt=st([(3 if P[p][k]['gf']>P[p][k]['ga'] else 1 if P[p][k]['gf']==P[p][k]['ga'] else 0)-(3 if P['none'][k]['gf']>P['none'][k]['ga'] else 1 if P['none'][k]['gf']==P['none'][k]['ga'] else 0) for k in K])
    print(f'  {p}: 기회 {x[0]:+.3f}±{x[1]:.3f} 실점 {a[0]:+.3f}±{a[1]:.3f} 승점 {pt[0]:+.3f}±{pt[1]:.3f}')
for nm,f,b in (('공중볼 ad',lambda o:o['oa']-o['da'],[(-99,-.9,'ad 하'),(-.9,.7,'ad 중'),(.7,99,'ad 상')]),('속도 op-dp',lambda o:o['op']-o['dp'],[(-99,-.2,'op-dp 하(상대 느림)'),(-.2,1.6,'op-dp 중'),(1.6,99,'op-dp 상(상대 빠름)')]),('슈팅 ls',lambda o:o['ls'],[(-99,t1,'ls 하'),(t1,t2,'ls 중'),(t2,99,'ls 상')]),('상대 잠그기',lambda o:o['oG82'],[(-99,-1e-9,'잠금'),(0,99,'안 잠금')])):
    print(f'[{nm}]')
    for lo,hi,l in b:row([k for k in K if lo<=f(P['none'][k])<hi],l)
print('\n[자기 상황 판정]')
for p,labs in (('g_air',['ad 상']),('g_long',['ls 상']),('g_all',['잠금','op-dp 하(상대 느림)'])):
    for l in labs:
        r,n=R[l];b=max(r,key=lambda q:r[q][0]);ok=r[b][0]-r[p][0]<=2*math.hypot(r[b][1],r[p][1])
        print(f'  {p} @ {l}: n={n} {"1위/동률" if ok else "탈락"} (1위 {b})')
