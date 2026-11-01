# v271 리그 회귀 분석: 기존(v270) 대비 득점·무·홈승·강팀승률·중거리 득점 비중·프리셋별 실점
import json,glob,math,collections,sys
D=sys.argv[1] if len(sys.argv)>1 else '/home/claude/work/qa/r271b/'
def ld(v):
    R=[]
    for f in sorted(glob.glob(D+v+'_*.json')):R+=json.load(open(f))
    return R
def ms(x):
    n=len(x);m=sum(x)/n;s=math.sqrt(sum((a-m)**2 for a in x)/max(1,n-1));return m,s/math.sqrt(n)
for v in ('v270rc','v271rc'):
    R=ld(v)
    if not R:continue
    g=ms([o['sc'][0]+o['sc'][1] for o in R]);n=len(R)
    d=sum(o['sc'][0]==o['sc'][1] for o in R)/n;h=sum(o['sc'][0]>o['sc'][1] for o in R)/n
    S=[o for o in R if abs(o['hr']-o['ar'])>=15];sw=sum((o['sc'][0]>o['sc'][1]) if o['hr']>o['ar'] else (o['sc'][1]>o['sc'][0]) for o in S)/max(1,len(S))
    G=[x for o in R for x in o['gs']];ls=sum(x['ty']=='longshot' for x in G)/max(1,len(G))
    print(f"{v} n={n} 득점 {g[0]:.2f}±{g[1]:.2f} 무 {d:.3f} 홈승 {h:.3f} 강팀승(평판차15+, n={len(S)}) {sw:.3f} 중거리비중 {ls:.3f}")
    P=collections.defaultdict(list)
    for o in R:
        P[o['hp']].append(o['xg'][1]);P[o['ap']].append(o['xg'][0])
    print('   프리셋별 상대 xG(실점기대):',{k:(round(sum(v)/len(v),2),len(v)) for k,v in sorted(P.items())})
