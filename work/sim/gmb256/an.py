# 빌더 비교: 가(airA) vs 가+나(airAB k.05) — QA 사전 기준(우월안·위험 중간·열세 구간 1위 교체·유저 이점)
# 그대로·전원·중거리는 QA 원자료(시드 8642, 같은 코드 경로) 재사용. 공통 k만 짝비교.
import json,math,sys
Q='/home/claude/wsm/work/qa/v256_gmb/out/g8642_%s.jsonl'
B='/home/claude/wsm/work/sim/gmb256/out/s8642_%s.jsonl'
def ld(p):
    d={}
    for l in open(p):
        if l.strip():
            o=json.loads(l);d[o['k']]=o
    return d
P={'none':ld(Q%'none'),'g_all':ld(Q%'g_all'),'g_long':ld(Q%'g_long'),'g_air(현행)':ld(Q%'g_air'),'airA(가)':ld(B%'airA'),'airAB(가+나)':ld(B%'airABk05')}
K=sorted(set.intersection(*[set(v) for v in P.values()]))
bad=[k for k in K if any(P[p][k]['r']!=P['none'][k]['r'] or P[p][k]['d']!=P['none'][k]['d'] for p in P)]
print('공통 경기',len(K),'80분 상태 불일치',len(bad))
def pts(o):
    f=o['gf']-o['ga']+(-o['d'])  # 최종 득실(우리 기준): 80분 -d 에서 출발
    return 3 if f>0 else 1 if f==0 else 0
def st(vals):
    n=len(vals);m=sum(vals)/n;v=sum((x-m)**2 for x in vals)/(n-1);return m,math.sqrt(v/n)
def rep(keys,label):
    print(f'\n[{label}] n={len(keys)}  (그대로 대비 Δ ± SE, 짝비교)')
    for p in P:
        if p=='none':continue
        r=[]
        for name,f in (('xG',lambda o:o['xf']),('실점xG',lambda o:o['xa']),('xG차',lambda o:o['xf']-o['xa']),('골득실',lambda o:o['gf']-o['ga']),('승점',pts)):
            m,se=st([f(P[p][k])-f(P['none'][k]) for k in keys]);r.append(f'{name} {m:+.3f}±{se:.3f}')
        print(f'  {p:12s} '+' | '.join(r))
rep(K,'전체')
ad=lambda k:P['none'][k]['oa']-P['none'][k]['da']
for lo,hi,nm in ((-99,.5,'공중볼 열세·대등 ad<0.5'),(.5,1.5,'0.5≤ad<1.5'),(1.5,99,'우위 ad≥1.5')):
    rep([k for k in K if lo<=ad(k)<hi],nm)
# 상대 비교: 공중볼 변형 vs 전원 공격(우월안 검사)
print('\n[우월안 검사: 공중볼 변형 − 전원 공격]')
for p in ('g_air(현행)','airA(가)','airAB(가+나)'):
    out=[]
    for name,f in (('xG',lambda o:o['xf']),('실점xG',lambda o:o['xa'])):
        m,se=st([f(P[p][k])-f(P['g_all'][k]) for k in K]);out.append(f'{name} {m:+.3f}±{se:.3f}')
    print(f'  {p:12s} '+' | '.join(out))
