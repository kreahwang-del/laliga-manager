import json,glob,math,collections,statistics as st,random
D='/home/claude/work/qa/out253/'
def load(tag,pol,cap):
    R={}
    for f in glob.glob(D+f'{tag}_{pol}_c{cap}_*.json'):
        for r in json.load(open(f)): R[r['seed']]=r
    return R
def ci(v):
    n=len(v);m=sum(v)/n;s=st.stdev(v) if n>1 else 0;h=1.96*s/math.sqrt(n);return n,m,s,m-h,m+h
def fmt(t):return 'n=%d mean=%+.3f sd=%.3f CI95=[%+.3f,%+.3f]'%t
def mean(v):return sum(v)/len(v) if v else float('nan')
def pci(v):
    n=len(v);p=mean(v);h=1.96*math.sqrt(p*(1-p)/n) if n else 0;return '%.3f±%.3f'%(p,h)
def mci(v):
    n=len(v);m=mean(v);h=1.96*st.stdev(v)/math.sqrt(n) if n>1 else 0;return '%.4f±%.4f'%(m,h)
def dz(a,b):
    if len(a)<2 or len(b)<2:return float('nan'),float('nan')
    d=mean(a)-mean(b);se=math.sqrt(st.variance(a)/len(a)+st.variance(b)/len(b)) or 1e-9;return d,d/se
def pr(t):return 'diff %+.4f z=%+.2f'%t
OP={'box':['bshot','bpass','bdrib'],'cross':['low','high','carry'],'fk':['shot','cross','short']}

print('== A determinism (seeds 910001-910100)')
for pol in ['ai','off']:
    b,c=load('base',pol,1),load('cand',pol,1);ks=sorted(set(b)&set(c))
    same=sum(b[k]['hs']==c[k]['hs'] and b[k]['sc']==c[k]['sc'] for k in ks)
    print(' ',pol,'seeds',len(ks),'identical',same,'diff',[k for k in ks if b[k]['hs']!=c[k]['hs']][:10])
off=load('cand','off',1)
ON={p:load('cand',p,1) for p in ['best','p0','p1','p2']}
UNC={p:load('cand',p,0) for p in ['rnd','p0','p1','p2']}
allruns=[r for d in list(ON.values())+list(UNC.values()) for r in d.values()]
print('  AI-side leaks: aiDec polled',sum(r['aiDec'] for r in allruns),'| decTm s!=0',sum(1 for r in allruns for t in r['tm'] if t['s']!=0),'| dec events s!=0',sum(1 for r in allruns for d in r['decs'] if d['s']!=0),'| pers s=1',sum(1 for r in allruns for p in r['pers'] if p['s']==1))
print('  off/ai runs: decTm',sum(len(r['tm']) for r in list(off.values())),'dec',sum(len(r['decs']) for r in off.values()))

print('== B caps (capped runs, real UI decWant)')
viol=collections.Counter();nm=0;nd=0;kc=collections.Counter()
for p,R in ON.items():
    for r in R.values():
        nm+=1;ds=[d for d in r['dl']];nd+=len(ds)
        if len(ds)>3:viol['>3']+=1
        mins=[d['min'] for d in ds]
        for i in range(1,len(mins)):
            if mins[i]-mins[i-1]<10:viol['gap<10']+=1
        c=collections.Counter(d['k'] for d in ds)
        for k,v in c.items():
            kc[k]+=v
            if k!='fk' and v>2:viol[k+'>2']+=1
        for d in ds:
            if d['k']!='fk' and d['min']<10:viol['nonFK<10']+=1
        if len(r['decs'])!=len(ds):viol['dec/dl mismatch']+=1
print('  matches',nm,'decisions',nd,'per match %.2f'%(nd/nm),'kinds',dict(kc),'violations',dict(viol) or 0)
for p,R in ON.items():
    c=collections.Counter(len(r['dl']) for r in R.values());print('   ',p,'dec/match dist',dict(sorted(c.items())))

print('== C persistence')
alld=[(r,d) for r in allruns for d in r['decs'] if d['k']!='fk' and d['s']==0]
withact=[d for r,d in alld if 'adl' in d]
adl=[d['adl'] for d in withact]
print('  non-FK decs',len(alld),'with decAct',len(withact),'(%.1f%%)'%(100*len(withact)/len(alld)))
print('  decAct delay: mean %.2f median %.2f p90 %.2f max %.2f'%(mean(adl),st.median(adl),sorted(adl)[int(.9*len(adl))],max(adl)))
for lo,hi in [(0,1),(1,3),(3,6),(6,8),(8,30),(30,120),(120,1e9)]:
    print('    delay [%g,%g): %d'%(lo,hi,sum(lo<=v<hi for v in adl)))
stale=[(d['k'],d['ch'],d['adl'],d['ak'],d['fol']) for d in withact if d['adl']>8]
print('  stale (>8s) decAct',len(stale),'ex',stale[:8],'| by fol',collections.Counter(s[4] for s in stale),'| by act',collections.Counter(s[3] for s in stale))
ps=[p for r in allruns for p in r['pers']]
over=[p for p in ps if p['last']>p['decT']+0.01]
print('  polled (minute-step ends) decB/decN still set:',len(ps),'of which past decT',len(over),'max overrun s %.1f'%(max([p['last']-p['decT'] for p in over]) if over else 0), 'decB set (followed)',sum(1 for p in over if p['b']))
ok=bad=0
for r in allruns:
    fol=[d for d in r['decs'] if d['k']!='fk' and d['fol']==1]
    if len(fol)!=len(r['tm']):bad+=1;continue
    for d,t in zip(fol,r['tm']):
        if abs(t['until']-d['sec']-6)<.01 and t['o']==d['ch'] and t['s']==0:ok+=1
        else:bad+=1
print('  team modifier windows: matched followed decs with until=dec+6s',ok,'mismatch',bad)
print('== D advantage (paired vs off, capped real caps)')
pts=lambda s:3 if s[0]>s[1] else 1 if s[0]==s[1] else 0
for pol,on in ON.items():
    ks=sorted(set(on)&set(off))
    if not ks:continue
    gd=[(on[k]['sc'][0]-on[k]['sc'][1])-(off[k]['sc'][0]-off[k]['sc'][1]) for k in ks]
    xd=[(on[k]['xg'][0]-on[k]['xg'][1])-(off[k]['xg'][0]-off[k]['xg'][1]) for k in ks]
    pd=[pts(on[k]['sc'])-pts(off[k]['sc']) for k in ks]
    xf=[on[k]['xg'][0]-off[k]['xg'][0] for k in ks];xa=[on[k]['xg'][1]-off[k]['xg'][1] for k in ks]
    print('  %-4s GD %s | xGD %s | pts %+.3f | xGF %+.3f xGA %+.3f'%(pol,fmt(ci(gd)),fmt(ci(xd)),mean(pd),mean(xf),mean(xa)))
    if pol=='best':
        random.seed(7);bs=sorted(mean([random.choice(xd) for _ in xd]) for _ in range(3000));print('     bootstrap xGD CI [%+.3f,%+.3f]'%(bs[75],bs[2924]))
        print('     best choices',dict(collections.Counter((d['k'],d['ch']) for k in ks for d in on[k]['dl'])))

print('== E follow')
fd=[d for r,d in alld if d['fol'] is not None]
fps=[d['fp'] for d in fd]
print('  n',len(fd),'follow mean %.3f'%mean([d['fol'] for d in fd]),'fp mean %.3f min %.3f max %.3f'%(mean(fps),min(fps),max(fps)))
for ch in ['bshot','bpass','bdrib','low','high','carry']:
    w=[d for d in fd if d['ch']==ch]
    if w:print('   ',ch,'n',len(w),'fol %.3f fp %.3f'%(mean([d['fol'] for d in w]),mean([d['fp'] for d in w])))

def scenes(src):
    out=[]
    for r in src:
        dls=r['dl']
        for x,d in zip(dls,[q for q in r['decs']]):
            if d.get('end'):continue
            o=dict(d);o.update({'best':x['best'],'gr':x['gr'],'info':x['info'],'sh':x.get('sh'),'dr':x.get('dr')});out.append(o)
    return out
SR=scenes(UNC['rnd'].values())
SF=scenes([r for p in ['p0','p1','p2'] for r in UNC[p].values()])
SC=scenes([r for R in ON.values() for r in R.values()])
print('== F option outcomes (uncapped random-assignment = main; forced uncapped = check)')
MET=[('oxg','ownXG'),('own','ownShot'),('loss8','loss8s'),('loss','lossPoss'),('osh','oppShotNext'),('oxa','oppXGnext'),('g','ownGoal')]
def table(S,k,tag):
    print('  [%s] %s'%(tag,k))
    G={o:[d for d in S if d['k']==k and d['ch']==o] for o in OP[k]}
    for o,v in G.items():
        if not v:continue
        print('    %-6s n=%4d '%(o,len(v))+' '.join('%s=%s'%(nm,(mci if f in('oxg','oxa') else pci)([d[f] for d in v])) for f,nm in MET)+' fol=%.2f'%mean([d['fol'] for d in v if d['fol'] is not None] or [0]))
    return G
GR={};GF={}
for k in ['box','cross','fk']:
    GR[k]=table(SR,k,'rnd');GF[k]=table(SF,k,'forced')
print('  pairwise (rnd | forced):')
for k in ['box','cross','fk']:
    o=OP[k]
    for a,b in [(o[0],o[1]),(o[0],o[2]),(o[1],o[2])]:
        line='   %-5s %-6s-%-6s'%(k,a,b)
        for G in (GR[k],GF[k]):
            line+=' | xG '+pr(dz([d['oxg'] for d in G[a]],[d['oxg'] for d in G[b]]))+' own '+pr(dz([d['own'] for d in G[a]],[d['own'] for d in G[b]]))+' loss8 '+pr(dz([d['loss8'] for d in G[a]],[d['loss8'] for d in G[b]]))+' osh '+pr(dz([d['osh'] for d in G[a]],[d['osh'] for d in G[b]]))
        print(line)
# pooled rnd+forced
print('  pooled (rnd+forced) key contrasts:')
GP={k:{o:GR[k][o]+GF[k][o] for o in OP[k]} for k in GR}
for k,a,b,f in [('box','bshot','bpass','oxg'),('box','bdrib','bpass','oxg'),('box','bshot','bdrib','oxg'),('cross','low','high','oxg'),('cross','low','carry','oxg'),('cross','high','carry','oxg'),('cross','low','carry','own'),('cross','high','low','loss8'),('cross','high','carry','loss8'),('cross','low','carry','loss8'),('box','bpass','bshot','loss8'),('box','bdrib','bshot','loss8'),('box','bpass','bdrib','loss8'),('cross','high','low','loss'),('cross','high','carry','loss'),('cross','high','low','osh'),('cross','high','carry','osh'),('box','bpass','bshot','osh'),('fk','shot','short','oxg'),('fk','shot','cross','loss8'),('fk','short','cross','osh')]:
    print('    %-5s %-6s-%-6s %-6s %s (n %d/%d)'%(k,a,b,f,pr(dz([d[f] for d in GP[k][a]],[d[f] for d in GP[k][b]])),len(GP[k][a]),len(GP[k][b])))

print('== H analyst')
for tag,S in [('rnd-unc',SR),('forced-unc',SF),('capped',SC)]:
    for k in ['box','cross','fk']:
        v=[d for d in S if d['k']==k]
        if v:print('  [%s] %s n=%d best share %s'%(tag,k,len(v),{o:'%.1f%%'%(100*sum(d['best']==o for d in v)/len(v)) for o in OP[k]}))
SA=SR+SF
box=[d for d in SA if d['k']=='box']
b1=[d for d in box if d['info']['nd']<2];b2=[d for d in box if d['info']['nd']>=3 and d['info']['cone']==0]
print('  box nd<2: n=%d bdrib best %.1f%%'%(len(b1),100*mean([d['best']=='bdrib' for d in b1])))
print('  box nd>=3 & cone0: n=%d bshot best %.1f%% bdrib best %.1f%%'%(len(b2),100*mean([d['best']=='bshot' for d in b2]),100*mean([d['best']=='bdrib' for d in b2])))
print('  scene info dist box: nd<2 %.2f, nd>=3 %.2f, cone0 %.2f, dist<13 %.2f, ang>=14&dist>=18 %.2f'%(mean([d['info']['nd']<2 for d in box]),mean([d['info']['nd']>=3 for d in box]),mean([d['info']['cone']==0 for d in box]),mean([d['info']['dist']<13 for d in box]),mean([d['info']['ang']>=14 and d['info']['dist']>=18 for d in box])))
# best not worse than others, by analyst-best group (random assignment only => causal)
print('  outcome by analyst-best group (rnd-unc only; chosen option xG / own / loss8):')
for k in ['box','cross','fk']:
    for bo in OP[k]:
        g=[d for d in SR if d['k']==k and d['best']==bo]
        if len(g)<20:continue
        parts=[]
        for o in OP[k]:
            v=[d for d in g if d['ch']==o]
            if v:parts.append('%s%s n%d xG %.4f own %.2f l8 %.2f'%('*' if o==bo else ' ',o,len(v),mean([d['oxg'] for d in v]),mean([d['own'] for d in v]),mean([d['loss8'] for d in v])))
        bb=[d['oxg'] for d in g if d['ch']==bo]
        worst=min(dz(bb,[d['oxg'] for d in g if d['ch']==o])[1] for o in OP[k] if o!=bo)
        print('   %-5s best=%-6s n=%4d | %s | min z(best-other xG)=%+.2f'%(k,bo,len(g),' ; '.join(parts),worst))
# same pooled rnd+forced (scene distribution approx comparable)
print('  same, pooled rnd+forced:')
for k in ['box','cross']:
    for bo in OP[k]:
        g=[d for d in SA if d['k']==k and d['best']==bo]
        if len(g)<20:continue
        bb=[d['oxg'] for d in g if d['ch']==bo]
        zs={o:dz(bb,[d['oxg'] for d in g if d['ch']==o]) for o in OP[k] if o!=bo}
        print('   %-5s best=%-6s n=%4d xG(best)=%.4f %s'%(k,bo,len(g),mean(bb),' '.join('vs %s %s(n%d)'%(o,pr(z),sum(d['ch']==o for d in g)) for o,z in zs.items())))
# context bins
print('  context bins (pooled rnd+forced): xG by chosen option, analyst best share')
def bins(k,name,f):
    g=collections.defaultdict(list)
    for d in SA:
        if d['k']==k:g[f(d)].append(d)
    for b,v in sorted(g.items(),key=lambda z:str(z[0])):
        bs=collections.Counter(d['best'] for d in v);top=bs.most_common(1)[0][0]
        xs={o:[d['oxg'] for d in v if d['ch']==o] for o in OP[k]}
        flags=[o for o in OP[k] if o!=top and dz(xs[top],xs[o])[1]<-1.96]
        print('   %s %-5s=%-10s n=%4d best%%{%s} xG{%s}%s'%(k,name,b,len(v),','.join('%s:%.0f'%(o,100*bs[o]/len(v)) for o in OP[k]),','.join('%s:%.4f(n%d)'%(o,mean(xs[o]),len(xs[o])) for o in OP[k]),(' <-- modal best '+top+' signif. worse than '+','.join(flags)) if flags else ''))
bins('box','cone',lambda d:min(d['info']['cone'],2))
bins('box','dist',lambda d:'<13' if d['info']['dist']<13 else '13-18' if d['info']['dist']<18 else '>=18')
bins('box','nd',lambda d:'<2' if d['info']['nd']<2 else '2-3.5' if d['info']['nd']<3.5 else '>=3.5')
bins('box','wd&far',lambda d:(d['info']['ang']>=14 and d['info']['dist']>=18))
bins('cross','bA',lambda d:min(d['info']['bA'],3))
bins('cross','nd',lambda d:'<3' if d['info']['nd']<3 else '>=3')
# grade distribution in capped best runs: gap
print('== I labels (DEC_RO) vs pooled outcomes: see F pooled contrasts')
print('== K regression (capped on vs off, paired)')
for pol,on in ON.items():
    ks=sorted(set(on)&set(off))
    if not ks:continue
    g=[sum(on[k]['sc'])-sum(off[k]['sc']) for k in ks];s_=[sum(on[k]['shots'])-sum(off[k]['shots']) for k in ks]
    def posf(r):
        p=r.get('poss')
        if isinstance(p,list) and len(p)==2 and sum(p)>0:return p[0]/sum(p)
        return None
    pp=[posf(on[k])-posf(off[k]) for k in ks if posf(on[k]) is not None and posf(off[k]) is not None]
    us=[on[k]['shots'][0]-off[k]['shots'][0] for k in ks]
    print('  %-4s goals/match %s | shots %s | userShots %s | poss(user) %s'%(pol,fmt(ci(g)),fmt(ci(s_)),fmt(ci(us)),fmt(ci(pp)) if pp else '-'))
print('  off goals/match %.3f shots/match %.2f'%(mean([sum(r['sc']) for r in off.values()]),mean([sum(r['shots']) for r in off.values()])))
print('  example poss field',list(off.values())[0].get('poss'))
