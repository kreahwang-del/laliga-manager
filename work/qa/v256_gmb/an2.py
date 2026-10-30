# 보충: 시드별 정책 간 짝비교, 공중볼 구간별 g_air 대비 차이, AI 회귀 해시
import json,math,os
exec(open(os.path.dirname(os.path.abspath(__file__))+'/an.py').read().split("print(f'seeds")[0].replace("SEEDS=[int(s) for s in (sys.argv[1].split(',') if len(sys.argv)>1 else ['8642','3141'])]","SEEDS=[8642,3141]"))
ks=sorted(set.intersection(*[set(P[p]) for p in PO]))
for s in SEEDS:
    kk=[k for k in ks if k[0]==s]
    for a,b in [('g_all','g_air'),('g_air','g_long'),('g_all','g_long')]:
        print(s,a,'-',b,{q:'%+.3f±%.3f'%ms([F[q](P[a][k])-F[q](P[b][k]) for k in kk])[:2] for q in ['xf','xa','xgd','pts']})
ad=lambda o:o['oa']-o['da']
for lo,hi in [(-99,0.5),(0.5,1.5),(1.5,99)]:
    kk=[k for k in ks if lo<=ad(P['none'][k])<hi]
    for b in ['g_all','g_long']:
        print(f'ad[{lo},{hi}) n={len(kk)} g_air-{b}',{q:'%+.3f±%.3f'%ms([F[q](P['g_air'][k])-F[q](P[b][k]) for k in kk])[:2] for q in ['xf','xa','xgd','pts']})
A=[json.loads(l) for l in open(D+'ai_off.jsonl')];B=[json.loads(l) for l in open(D+'ai_on.jsonl')]
same=sum(1 for a,b in zip(A,B) if a['h']==b['h'] and a['sc']==b['sc'] and a['xg']==b['xg'])
print('AI 회귀 n',len(A),len(B),'해시·스코어·xG 일치',same,'goals/match %.3f draw %.3f'%(sum(a['sc'][0]+a['sc'][1] for a in A)/len(A),sum(a['sc'][0]==a['sc'][1] for a in A)/len(A)))
