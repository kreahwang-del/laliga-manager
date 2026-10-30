# QA v256 승부수 분석: 짝비교(정책-none), 정책 간 짝비교, 라벨 순위, 분석관 추천 적중, 구간별 최선안
import json,sys,math,glob,os,random
D=os.path.dirname(os.path.abspath(__file__))+'/out/'
SEEDS=[int(s) for s in (sys.argv[1].split(',') if len(sys.argv)>1 else ['8642','3141'])]
PO=['none','g_all','g_air','g_long']
def load(f):
    R={}
    if os.path.exists(f):
        for l in open(f):
            l=l.strip()
            if l:o=json.loads(l);R[o['k']]=o
    return R
def ms(v):
    n=len(v);m=sum(v)/n;sd=math.sqrt(sum((x-m)**2 for x in v)/(n-1)) if n>1 else 0;return m,sd/math.sqrt(n),n
def pts(o):net=o['gf']-o['ga']-o['d'];return 3 if net>0 else 1 if net==0 else 0
F={'xf':lambda o:o['xf'],'xa':lambda o:o['xa'],'xgd':lambda o:o['xf']-o['xa'],'gf':lambda o:o['gf'],'ga':lambda o:o['ga'],'gd':lambda o:o['gf']-o['ga'],'pts':pts,'eqz':lambda o:int(o['gf']-o['ga']>=o['d'])}
# 데이터: (seed,k) 키
P={p:{} for p in PO}
for s in SEEDS:
    for p in PO:
        for k,o in load(D+f'g{s}_{p}.jsonl').items():P[p][(s,k)]=o
ks=sorted(set.intersection(*[set(P[p]) for p in PO]))
mis=sum(1 for k in ks for p in PO[1:] if P[p][k]['r']!=P['none'][k]['r'] or P[p][k]['d']!=P['none'][k]['d'] or P[p][k]['oa']!=P['none'][k]['oa'])
print(f'seeds={SEEDS} n(공통)={len(ks)} 80분상태 불일치={mis}')
base=P['none']
print('== 그대로(none) 절대값')
print({key:'%.3f'%ms([f(base[k]) for k in ks])[0] for key,f in F.items()})
print('== 정책 - 그대로 (Δ ± SE)')
for p in PO[1:]:
    print(p,{key:'%+.3f±%.3f'%ms([f(P[p][k])-f(base[k]) for k in ks])[:2] for key,f in F.items()})
print('== 정책 간 짝비교 (A-B)')
for a,b in [('g_all','g_air'),('g_all','g_long'),('g_air','g_long')]:
    print(a,'-',b,{key:'%+.3f±%.3f'%ms([F[key](P[a][k])-F[key](P[b][k]) for k in ks])[:2] for key in ['xf','xa','xgd','gd','pts']})
# 시드별
for s in SEEDS:
    kk=[k for k in ks if k[0]==s]
    print('seed',s,'n',len(kk),{p:'xf%+.3f xa%+.3f gd%+.3f pts%+.3f'%tuple(ms([F[q](P[p][k])-F[q](base[k]) for k in kk])[0] for q in ['xf','xa','gd','pts']) for p in PO[1:]})
# 공중볼 우위 구간
def ad(o):return o['oa']-o['da']
print('== 공중볼 우위차(ad=oa-da) 구간별 Δ(xgd, gd, pts)')
bins=[(-99,-1),(-1,0),(0,1),(1,2),(2,99)]
for lo,hi in bins:
    kk=[k for k in ks if lo<=ad(base[k])<hi]
    if len(kk)<20:print(lo,hi,'n',len(kk));continue
    row={p:'xgd%+.3f±%.3f pts%+.3f±%.3f'%(*ms([F['xgd'](P[p][k])-F['xgd'](base[k]) for k in kk])[:2],*ms([F['pts'](P[p][k])-F['pts'](base[k]) for k in kk])[:2]) for p in PO[1:]}
    print(f'ad[{lo},{hi}) n={len(kk)}',row)
# 분석관 추천(gambleEval 재구현)
def rec(o):
    a=ad(o);sc={'g_all':.06,'g_long':.05,'g_air':max(-.03,min(.1,.02+a*.02))};return max(sc,key=lambda x:sc[x])
from collections import Counter
print('== 분석관 추천 분포',Counter(rec(base[k]) for k in ks))
for lo,hi in [(-99,0.5),(0.5,1.5),(1.5,99)]:
    kk=[k for k in ks if lo<=ad(base[k])<hi]
    if not kk:continue
    c=Counter(rec(base[k]) for k in kk)
    best={key:{p:ms([F[key](P[p][k]) for k in kk])[0] for p in PO[1:]} for key in ['xgd','gd','pts']}
    print(f'ad[{lo},{hi}) n={len(kk)} 추천',dict(c),'| 구간 평균 xgd',{p:'%.3f'%v for p,v in best['xgd'].items()},'pts',{p:'%.3f'%v for p,v in best['pts'].items()})
# 추천 따르기 vs 고정 정책 (경기 단위 정책 가치)
print('== 추천 따르기 vs 항상 같은 선택 (Δ vs none)')
for key in ['xgd','gd','pts']:
    v=[F[key](P[rec(base[k])][k])-F[key](base[k]) for k in ks];print(key,'추천따르기 %+.3f±%.3f'%ms(v)[:2],{p:'%+.3f'%ms([F[key](P[p][k])-F[key](base[k]) for k in ks])[0] for p in PO[1:]})
# 사후 최선(오라클, 상한) – 실제 결과로 고르면 과대(잡음 선택)이므로 참고만
v=[max(F['gd'](P[p][k]) for p in PO[1:])-F['gd'](base[k]) for k in ks];print('사후 최선(오라클 상한, 잡음 포함) gd %+.3f'%ms(v)[0])
# 부트스트랩: 최선 고정안 gd CI (최댓값 선택 편향 포함)
random.seed(7);bs=[]
for _ in range(1000):
    s=[random.choice(ks) for _ in ks];bs.append(max(sum(F['gd'](P[p][k])-F['gd'](base[k]) for k in s)/len(s) for p in PO[1:]))
bs.sort();print('최선 고정안 gd 부트스트랩 95%% [%.3f, %.3f] 중앙 %.3f'%(bs[25],bs[975],bs[500]))
# 85분 gsx 잔존, 상대 gsx
print('g85 분포',{p:Counter(P[p][k]['g85'] for k in ks).most_common(3) for p in PO})
print('80분 d 분포',Counter(base[k]['d'] for k in ks),'ment',Counter(base[k]['ment'] for k in ks))
# d 별
for dd in [1,2]:
    kk=[k for k in ks if base[k]['d']==dd]
    if len(kk)>30:print('d',dd,'n',len(kk),{p:'xgd%+.3f pts%+.3f'%(ms([F['xgd'](P[p][k])-F['xgd'](base[k]) for k in kk])[0],ms([F['pts'](P[p][k])-F['pts'](base[k]) for k in kk])[0]) for p in PO[1:]})
