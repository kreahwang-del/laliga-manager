# 보충: 정책 간 결과 지표(gf·eqz·pts) 짝비교, 구간별 xf 차, 기존 시드(8642·3141) g_all−g_long 합산
import json,math,os,sys
exec(open(os.path.dirname(os.path.abspath(__file__))+'/anD.py').read().split("print('== 그대로'")[0])
B=P['none']
for a,b in [('g_air','g_all'),('g_long','g_air'),('g_long','g_all')]:
    print(a,'-',b,{q:'%+.3f±%.3f'%pp(a,b,q,ks)[:2] for q in ['gf','ga','eqz','pts']})
ad=lambda o:o['oa']-o['da']
for lo,hi in [(-99,0.5),(0.5,1.5),(1.5,99)]:
    kk=[k for k in ks if lo<=ad(B[k])<hi]
    print(f'ad[{lo},{hi})',{f'{a}-{b}':'xf %+.3f±%.3f xa %+.3f±%.3f'%(*pp(a,b,'xf',kk)[:2],*pp(a,b,'xa',kk)[:2]) for a,b in [('g_air','g_all'),('g_air','g_long'),('g_all','g_long')]})
# 기존 QA 원자료(같은 g_all·g_long 코드 경로) 합산
Q={}
for p in ['none','g_all','g_long']:
    Q[p]={}
    for s in [8642,3141]:
        for l in open(f'out/g{s}_{p}.jsonl'):o=json.loads(l);Q[p][(s,o['k'])]=o
qk=sorted(set(Q['g_all'])&set(Q['g_long']))
def m2(a,b,q,R,kk):return ms([F[q](R[a][k])-F[q](R[b][k]) for k in kk])
x1=m2('g_all','g_long','xf',Q,qk);x2=pp('g_all','g_long','xf',ks);w1,w2=1/x1[1]**2,1/x2[1]**2
print('g_all-g_long xf: 기존 %+.3f±%.3f / 최종 %+.3f±%.3f / 합산 %+.3f±%.3f'%(x1[0],x1[1],x2[0],x2[1],(x1[0]*w1+x2[0]*w2)/(w1+w2),1/math.sqrt(w1+w2)))
y1=m2('g_all','g_long','xa',Q,qk);y2=pp('g_all','g_long','xa',ks);w1,w2=1/y1[1]**2,1/y2[1]**2
print('g_all-g_long xa: 기존 %+.3f±%.3f / 최종 %+.3f±%.3f / 합산 %+.3f±%.3f'%(y1[0],y1[1],y2[0],y2[1],(y1[0]*w1+y2[0]*w2)/(w1+w2),1/math.sqrt(w1+w2)))
for q in ['pts','eqz','gf']:
    z1=m2('g_all','g_long',q,Q,qk);print('기존 g_all-g_long',q,'%+.3f±%.3f'%z1[:2])
# 빌더 8642 D안 공중볼−전원 실점xG(-0.024±0.012)과 합산
a=pp('g_air','g_all','xa',ks);w1,w2=1/a[1]**2,1/.012**2
print('g_air-g_all xa 최종 %+.3f±%.3f + 빌더 -0.024±0.012 합산 %+.3f±%.3f'%(a[0],a[1],(a[0]*w1-.024*w2)/(w1+w2),1/math.sqrt(w1+w2)))
