# 경질 빈도 몬테카를로: 0190 evalOne·careerWeekly 규칙을 그대로 옮김(주 1회=라운드 1회). 결과는 Poisson 모형, 팀 강도는 기대 승점(xp)에 맞춤
import json,math,random,sys
def pm(l):
    o=[];p=math.exp(-l)
    for k in range(9):o.append(p);p*=l/(k+1)
    return o
def pts(d,h,a=.28,b=.55):
    A=pm(math.exp(a+b*d+h));B=pm(math.exp(a-b*d-h));w=dr=0
    for i in range(9):
        for j in range(9):
            q=A[i]*B[j]
            if i>j:w+=q
            elif i==j:dr+=q
    return w,dr
def fit(xp,h=.12):
    r=[0.0]*len(xp)
    for it in range(60):
        for i in range(len(xp)):
            t=0
            for j in range(len(xp)):
                if i==j:continue
                for hh in (h,-h):w,dr=pts(r[i]-r[j],hh);t+=3*w+dr
            e=t/(2*(len(xp)-1));r[i]+=(xp[i]-e)*.6
    return r
def season(xp,tp,big,K,rng,rounds=None,h=.12,nmin=6,cut=3,sack=14,upto=999):
    n=len(xp);R=fit_cache[tuple(xp)]
    teams=list(range(n));
    # 더블 라운드로빈 일정
    sched=[];arr=teams[:]
    for rr in range(n-1):
        sched.append([(arr[i],arr[n-1-i]) for i in range(n//2)]);arr=[arr[0]]+[arr[-1]]+arr[1:-1]
    sched=sched+[[(b,a) for a,b in rd] for rd in sched]
    if rounds:sched=sched[:rounds]
    tr=[65.0]*n;since=[0]*n;rec=[[] for _ in range(n)];P=[0]*n;GD=[0]*n;S=0
    for ri,rd in enumerate(sched):
        for a,b in rd:
            la=math.exp(.28+.55*(R[a]-R[b])+h);lb=math.exp(.28-.55*(R[a]-R[b])-h)
            ga=poi(la,rng);gb=poi(lb,rng)
            pa,pb=(3,0) if ga>gb else (1,1) if ga==gb else (0,3)
            rec[a].append(pa);rec[b].append(pb);P[a]+=pa;P[b]+=pb;GD[a]+=ga-gb;GD[b]+=gb-ga
        order=sorted(range(n),key=lambda c:(-P[c],-GD[c]));pos={c:i+1 for i,c in enumerate(order)}
        for c in range(n):
            r=rec[c][since[c]:];m=len(r)
            if m<3:continue
            ppg=sum(r)/m;r5=r[-5:];p5=sum(r5)/len(r5);e=xp[c]
            s=.6*(ppg-e)*m/(m+6)+.4*(p5-e)*.7
            if pos[c]>=n-2 and tp[c]>=n-3:s-=.12
            if pos[c]>tp[c]+4:s-=.08
            if pos[c]<=tp[c]:s+=.05
            T=max(0,min(100,62+K*s*(big[c] if s<0 else 1)))
            tr[c]+= (T-tr[c])*.22
            if m>=nmin and tr[c]<sack and ri+1<=len(sched)-cut:
                S+=(ri<upto);tr[c]=65;since[c]=len(rec[c])
    return S
def poi(l,rng):
    L=math.exp(-l);k=0;p=1
    while True:
        p*=rng.random()
        if p<L:return k
        k+=1
fit_cache={}
EOF=None
