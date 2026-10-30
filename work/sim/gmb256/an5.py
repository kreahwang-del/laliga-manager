# 빌더 측정 5차 분석(성향 균형): 상황별 xG차·역습 실점 비중 — QA 사전 기준 구간
import json,math
def ld(f):
    d={}
    for l in open(f):
        if l.strip():o=json.loads(l);d[o['k']]=o
    return d
P={p:ld(f'out/b2_{p}.jsonl') for p in ('none','g_all','airD','longL')}
K=[k for k in P['none'] if all(k in P[p] for p in P)]
bad=[k for k in K if any(P[p][k]['r']!=P['none'][k]['r'] or P[p][k]['d']!=P['none'][k]['d'] for p in P)]
K=[k for k in K if k not in set(bad)];print('유효',len(K),'불일치',len(bad))
def st(v):
    n=len(v);m=sum(v)/n;sd=math.sqrt(sum((x-m)**2 for x in v)/max(1,n-1));return m,sd/math.sqrt(n)
ls=sorted(P['none'][k]['ls'] for k in K);t1,t2=ls[len(ls)//3],ls[2*len(ls)//3];print('ls 3분위 경계',t1,t2)
def row(ks,lab):
    out=[]
    for p in ('g_all','airD','longL'):
        m,se=st([(P[p][k]['xf']-P[p][k]['xa'])-(P['none'][k]['xf']-P['none'][k]['xa']) for k in ks]);out.append(f'{p} {m:+.3f}±{se:.3f}')
    print(f'  {lab:16s} n={len(ks):3d} | '+' | '.join(out))
print('[전체 xG차(그대로 대비)]');row(K,'전체')
for nm,f,b in (('공중볼 ad',lambda o:o['oa']-o['da'],[(-99,-.9,'하'),(-.9,.7,'중'),(.7,99,'상')]),('속도 op-dp',lambda o:o['op']-o['dp'],[(-99,-.2,'하(상대 느림)'),(-.2,1.6,'중'),(1.6,99,'상(상대 빠름)')]),('우리 슈팅 ls',lambda o:o['ls'],[(-99,t1,'하'),(t1,t2,'중'),(t2,99,'상')]),('상대 잠그기',lambda o:o['oG82'],[(-99,-.5,'잠금'),(-.5,99,'안 잠금')])):
    print(f'[{nm}]')
    for lo,hi,l in b:row([k for k in K if lo<=f(P['none'][k])<hi],l)
print('[실점xG 증가 중 역습 비중]')
for p in ('none','g_all','airD','longL'):
    xa=sum(P[p][k]['xa'] for k in K);xc=sum(P[p][k]['xac'] for k in K);print(f'  {p:6s} 실점xG {xa/len(K):.3f}  역습 {xc/len(K):.3f}  비중 {xc/max(1e-9,xa):.0%}')
