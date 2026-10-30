# 빌더 측정 7차 분석: 상황별 xG차(그대로 대비) + 실제 근거 비교(슈팅 유형·크로스·리바운드·역습)
import json,math
def ld(f):
    d={}
    for l in open(f):
        if l.strip():o=json.loads(l);d[o['k']]=o
    return d
P={p:ld(f'out/f_{p}.jsonl') for p in ('none','g_all','g_air','g_long')}
K=[k for k in P['none'] if all(k in P[p] for p in P) and all(P[p][k]['r']==P['none'][k]['r'] for p in P)]
print('유효',len(K))
def st(v):
    n=len(v);m=sum(v)/n;sd=math.sqrt(sum((x-m)**2 for x in v)/max(1,n-1));return m,sd/math.sqrt(n)
ls=sorted(P['none'][k]['ls'] for k in K);t1,t2=ls[len(ls)//3],ls[2*len(ls)//3]
def row(ks,lab):
    out=[]
    for p in ('g_all','g_air','g_long'):
        m,se=st([(P[p][k]['xf']-P[p][k]['xa'])-(P['none'][k]['xf']-P['none'][k]['xa']) for k in ks]);out.append(f'{p} {m:+.3f}±{se:.3f}')
    print(f'  {lab:14s} n={len(ks):3d} | '+' | '.join(out))
print('[전체 xG차]');row(K,'전체')
for p in ('g_all','g_air','g_long'):
    x=st([P[p][k]['xf']-P['none'][k]['xf'] for k in K]);a=st([P[p][k]['xa']-P['none'][k]['xa'] for k in K]);print(f'  {p}: 기회 {x[0]:+.3f}±{x[1]:.3f} 실점 {a[0]:+.3f}±{a[1]:.3f}')
for nm,f,b in (('공중볼 ad',lambda o:o['oa']-o['da'],[(-99,-.9,'하'),(-.9,.7,'중'),(.7,99,'상')]),('속도 op-dp',lambda o:o['op']-o['dp'],[(-99,-.2,'하(상대 느림)'),(-.2,1.6,'중'),(1.6,99,'상(상대 빠름)')]),('슈팅 ls',lambda o:o['ls'],[(-99,t1,'하'),(t1,t2,'중'),(t2,99,'상')])):
    print(f'[{nm}]')
    for lo,hi,l in b:row([k for k in K if lo<=f(P['none'][k])<hi],l)
print('\n[실제 근거 비교 — 80분 이후 우리 팀, 경기당]')
for p in P:
    sh={};xg={};g={};cr=cor=reb=sb=bl=0;xac=0
    for k in K:
        b=P[p][k]['bk'];cr+=b['cr'];cor+=b['cor'];reb+=b['reb'];sb+=b['sb'];bl+=b['blk'];xac+=P[p][k]['xac']
        for t,v in b['sh'].items():sh[t]=sh.get(t,0)+v
        for t,v in b['xg'].items():xg[t]=xg.get(t,0)+v
        for t,v in b['g'].items():g[t]=g.get(t,0)+v
    n=len(K);tsh=sum(sh.values());txg=sum(xg.values());tg=sum(g.values())
    ls_=sh.get('longshot',0);crg=g.get('cross',0)+g.get('lowcross',0)+g.get('header',0)
    print(f'  {p:6s} 슈팅 {tsh/n:.2f} (슈팅당 xG {txg/max(1,tsh):.3f}) | 중거리 {ls_/n:.2f}회 xG/회 {xg.get("longshot",0)/max(1,ls_):.3f} 골 {g.get("longshot",0)} | 크로스 {cr/n:.2f} 크로스골 {crg} → {cr/max(1,crg):.0f}개당 1골 | 코너 {cor/n:.2f} 리바운드 {reb/n:.2f} 세컨드볼 {sb/n:.1f} | 상대 역습 xG {xac/n:.3f}')
