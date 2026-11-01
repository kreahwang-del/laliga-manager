# AI 성장 측정 분석: 시즌별 전술 성향 분포(최대 비중·엔트로피), 우승팀, 승점 분포, 평판 집중도(지니), 감독 평판 변화
import json, sys, math, collections
def gini(v):
    v=sorted(v); n=len(v); s=sum(v)
    return sum((2*i-n+1)*x for i,x in enumerate(v))/(n*s) if s else 0
for f in sys.argv[1:]:
    print('==', f)
    base_rep=None
    for l in open(f):
        d=json.loads(l); R=d['rows']
        cnt=collections.Counter(r['pre'] for r in R if r['pre'])
        n=sum(cnt.values()); H=-sum(c/n*math.log(c/n) for c in cnt.values())
        pts=[r['pts'] for r in R]; sd=(sum((p-sum(pts)/len(pts))**2 for p in pts)/len(pts))**.5
        reps=[r['rep'] for r in R]
        if base_rep is None: base_rep={r['c']:r['rep'] for r in R}
        moved=sum(1 for r in R if r['c'] in base_rep and r['rep']!=base_rep[r['c']])
        top=cnt.most_common(1)[0]
        print(f"{d['season']} 우승 {R[0]['n']}({R[0]['pts']}) 2위 {R[1]['n']} | 성향 최다 {top[0]} {top[1]}/{n} 엔트로피 {H:.2f} 종류 {len(cnt)} | 승점 표준편차 {sd:.1f} | 평판 지니 {gini(reps):.3f} 바뀐 구단 {moved} | 감독평판 평균 {sum(r['mrep'] or 0 for r in R)/len(R):.1f}")
        print('   ', dict(cnt))
