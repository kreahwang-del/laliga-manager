# D안 최종 분석: outd/d{seed}_{pol}.jsonl
import json,sys,math,os,random
from collections import Counter
D=os.path.dirname(os.path.abspath(__file__))+'/outd/'
SEEDS=[int(x) for x in (sys.argv[1] if len(sys.argv)>1 else '5309,6271').split(',')];PO=['none','g_all','g_air','g_long']
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
P={p:{} for p in PO}
for s in SEEDS:
    for p in PO:
        for k,o in load(D+f'd{s}_{p}.jsonl').items():P[p][(s,k)]=o
ks=sorted(set.intersection(*[set(P[p]) for p in PO]))
B=P['none']
mis=sum(1 for k in ks for p in PO[1:] if P[p][k]['r']!=B[k]['r'] or P[p][k]['d']!=B[k]['d'] or P[p][k]['oa']!=B[k]['oa'] or P[p][k]['da']!=B[k]['da'])
gadmis=sum(1 for k in ks if abs(P['g_air'][k].get('gad',0)-(B[k]['oa']-B[k]['da']))>0.02)
print(f'n(공통)={len(ks)} 80분상태 불일치={mis} gmbAirD 불일치={gadmis} g_air grest=1: {sum(P["g_air"][k].get("grest",0)==1 for k in ks)}')
d=lambda p,q,kk:ms([F[q](P[p][k])-F[q](B[k]) for k in kk])
pp=lambda a,b,q,kk:ms([F[q](P[a][k])-F[q](P[b][k]) for k in kk])
print('== 그대로',{q:'%.3f'%ms([F[q](B[k]) for k in ks])[0] for q in F})
print('== Δ vs 그대로')
for p in PO[1:]:print(' ',p,{q:'%+.3f±%.3f'%d(p,q,ks)[:2] for q in F})
for s in SEEDS:
    kk=[k for k in ks if k[0]==s];print(' seed',s,len(kk),{p:'xf%+.3f xa%+.3f xgd%+.3f gd%+.3f'%tuple(d(p,q,kk)[0] for q in ['xf','xa','xgd','gd']) for p in PO[1:]})
print('== 정책 간 A-B')
for a,b in [('g_air','g_all'),('g_air','g_long'),('g_all','g_long')]:
    print(' ',a,'-',b,{q:'%+.3f±%.3f'%pp(a,b,q,ks)[:2] for q in ['xf','xa','xgd','gd','pts']})
    for s in SEEDS:
        kk=[k for k in ks if k[0]==s];print('    seed',s,{q:'%+.3f±%.3f'%pp(a,b,q,kk)[:2] for q in ['xf','xa','xgd']})
ad=lambda o:o['oa']-o['da']
BINS=[(-99,0.5),(0.5,1.5),(1.5,99)]
binof=lambda o:next(i for i,(lo,hi) in enumerate(BINS) if lo<=ad(o)<hi)
print('== 구간별 Δ vs 그대로 (xgd, xa, xf, gd)')
bestbin={}
for i,(lo,hi) in enumerate(BINS):
    kk=[k for k in ks if binof(B[k])==i]
    r={p:d(p,'xgd',kk) for p in PO[1:]}
    print(f' ad[{lo},{hi}) n={len(kk)}',{p:'xgd%+.3f±%.3f xa%+.3f xf%+.3f gd%+.3f'%(*r[p][:2],d(p,'xa',kk)[0],d(p,'xf',kk)[0],d(p,'gd',kk)[0]) for p in PO[1:]})
    top=max(r,key=lambda p:r[p][0]);bestbin[i]=top
    for p in PO[1:]:
        if p!=top:print('    ',top,'-',p,'xgd %+.3f±%.3f'%pp(top,p,'xgd',kk)[:2],'gd %+.3f±%.3f'%pp(top,p,'gd',kk)[:2])
# 동률 판단: 구간 최선안과 2SE 안이면 동률
def ties(i):
    kk=[k for k in ks if binof(B[k])==i];top=bestbin[i];T={top}
    for p in PO[1:]:
        if p!=top:
            m,se,_=pp(top,p,'xgd',kk)
            if m<2*se:T.add(p)
    return T
TI={i:ties(i) for i in range(3)};print('구간별 최선(동률 포함)',TI)
# 분석관
def rec(o):
    a=ad(o);sc={'g_all':.087 if a>=1.5 else .001,'g_long':.075 if a>=1.5 else .055,'g_air':.039+.033*max(0,min(2,a))};return max(sc,key=lambda x:sc[x])
R=Counter(rec(B[k]) for k in ks);print('== 분석관 추천 분포',dict(R))
hit=sum(1 for k in ks if rec(B[k]) in TI[binof(B[k])]);print('추천 적중(구간 최선·동률)',hit,'/',len(ks),'%.1f%%'%(100*hit/len(ks)))
for i in range(3):
    kk=[k for k in ks if binof(B[k])==i];print('  구간',BINS[i],'추천',dict(Counter(rec(B[k]) for k in kk)))
for q in ['xgd','gd','pts']:
    v=[F[q](P[rec(B[k])][k])-F[q](B[k]) for k in ks];print(' 추천따르기',q,'%+.3f±%.3f'%ms(v)[:2],{p:'%+.3f'%d(p,q,ks)[0] for p in PO[1:]})
for p in PO[1:]:
    print('  추천따르기-항상',p,'xgd %+.3f±%.3f'%ms([F['xgd'](P[rec(B[k])][k])-F['xgd'](P[p][k]) for k in ks])[:2])
# 유저 이점
print('== 유저 이점(골득실)')
fixed={p:d(p,'gd',ks) for p in PO[1:]};bp=max(fixed,key=lambda p:fixed[p][0]);print(' 최선 고정안',bp,'%+.3f±%.3f'%fixed[bp][:2])
v=[F['gd'](P[bestbin[binof(B[k])]][k])-F['gd'](B[k]) for k in ks];print(' 구간별 xG차 1위안 따르기 gd %+.3f±%.3f'%ms(v)[:2],'xgd %+.3f'%ms([F['xgd'](P[bestbin[binof(B[k])]][k])-F['xgd'](B[k]) for k in ks])[0])
v2=[F['gd'](P[rec(B[k])][k])-F['gd'](B[k]) for k in ks]
# 부트스트랩: 구간별 최선(구간 안에서 gd 기준으로 고름, 선택 편향 포함) 가중
random.seed(11);bs=[];bs2=[]
idx={i:[k for k in ks if binof(B[k])==i] for i in range(3)}
for _ in range(1000):
    s=[random.choice(ks) for _ in ks];tot=0
    for i in range(3):
        si=[k for k in s if binof(B[k])==i]
        if si:tot+=max(sum(F['gd'](P[p][k])-F['gd'](B[k]) for k in si) for p in PO[1:])
    bs.append(tot/len(s));bs2.append(max(sum(F['gd'](P[p][k])-F['gd'](B[k]) for k in s)/len(s) for p in PO[1:]))
bs.sort();bs2.sort()
print(' 구간별 사후 최선(gd로 고름, 편향 포함) 부트스트랩 중앙 %.3f 95%% [%.3f, %.3f]'%(bs[500],bs[25],bs[975]))
print(' 최선 고정안 부트스트랩 중앙 %.3f 95%% [%.3f, %.3f]'%(bs2[500],bs2[25],bs2[975]))
print('80분 d',Counter(B[k]['d'] for k in ks),'ment',Counter(B[k]['ment'] for k in ks),'g85',{p:Counter(P[p][k]['g85'] for k in ks).most_common(2) for p in PO})
# 회귀
A=load(D+'ai_cur256.jsonl');C=load(D+'ai_cur256d.jsonl');kk=sorted(set(A)&set(C))
if kk:print('== 회귀 n',len(kk),'해시·스코어·xG 일치',sum(1 for k in kk if A[k]['h']==C[k]['h'] and A[k]['sc']==C[k]['sc'] and A[k]['xg']==C[k]['xg']),'goals %.3f draw %.3f'%(sum(sum(A[k]['sc']) for k in kk)/len(kk),sum(A[k]['sc'][0]==A[k]['sc'][1] for k in kk)/len(kk)))
