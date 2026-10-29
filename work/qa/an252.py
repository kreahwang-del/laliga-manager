import json,glob,math,collections,statistics as st,random
D='/home/claude/work/qa/out/'
def load(tag,pol):
    R={}
    for f in glob.glob(D+f'{tag}_{pol}_*.json'):
        for r in json.load(open(f)): R[r['seed']]=r
    return R
def ci(v):
    n=len(v);m=sum(v)/n;s=st.stdev(v) if n>1 else 0;h=1.96*s/math.sqrt(n);return n,m,s,m-h,m+h
def fmt(t):return 'n=%d mean=%+.3f sd=%.3f CI95=[%+.3f,%+.3f]'%t
def prop(a):n=len(a);p=sum(a)/n if n else float('nan');return n,p,math.sqrt(p*(1-p)/n) if n else 0
print('== A determinism')
for pol in ['ai','off']:
    b,c=load('base',pol),load('cand',pol)
    ks=sorted(set(b)&set(c)&set(range(900001,900101)))
    same=sum(b[k]['hs']==c[k]['hs'] and b[k]['sc']==c[k]['sc'] for k in ks)
    print(pol,'seeds',len(ks),'identical',same,'diff',[k for k in ks if b[k]['hs']!=c[k]['hs']][:10])
off=load('cand','off')
# also check cand ai vs cand off (should differ? hooks wantDec false vs none)
print('== B advantage (paired vs off)')
pols={}
for pol in ['best','auto','sw','wd','in','rnd']:
    on=load('cand',pol);pols[pol]=on
    ks=sorted(set(on)&set(off))
    gd=[(on[k]['sc'][0]-on[k]['sc'][1])-(off[k]['sc'][0]-off[k]['sc'][1]) for k in ks]
    xd=[(on[k]['xg'][0]-on[k]['xg'][1])-(off[k]['xg'][0]-off[k]['xg'][1]) for k in ks]
    gf=[on[k]['sc'][0]-off[k]['sc'][0] for k in ks];ga=[on[k]['sc'][1]-off[k]['sc'][1] for k in ks]
    pts=lambda s:3 if s[0]>s[1] else 1 if s[0]==s[1] else 0
    pd=[pts(on[k]['sc'])-pts(off[k]['sc']) for k in ks]
    same=sum(on[k]['hs']==off[k]['hs'] for k in ks)
    nd=sum(len(on[k]['dl']) for k in ks)/len(ks)
    print(pol,'GD',fmt(ci(gd)),'| xGD',fmt(ci(xd)),'| GF %+.3f GA %+.3f pts %+.3f'%(sum(gf)/len(gf),sum(ga)/len(ga),sum(pd)/len(pd)),'| dec/match %.2f identical-to-off %d'%(nd,same))
    if pol=='best':
        k150=[k for k in ks if k<=900150]
        g1=[gd[i] for i,k in enumerate(ks) if k<=900150];x1=[xd[i] for i,k in enumerate(ks) if k<=900150]
        print('  best@150',fmt(ci(g1)),'xGD',fmt(ci(x1)))
        # bootstrap
        random.seed(1);bs=sorted(sum(random.choice(gd) for _ in gd)/len(gd) for _ in range(4000));print('  bootstrap GD CI',round(bs[100],3),round(bs[3899],3))
        ofd=[off[k]['sc'][0]-off[k]['sc'][1] for k in ks];print('  off baseline GD mean %.3f sd %.3f; off goals/match %.3f'%(sum(ofd)/len(ofd),st.stdev(ofd),sum(sum(off[k]['sc']) for k in ks)/len(ks)))
        print('  on goals/match %.3f'%(sum(sum(on[k]['sc']) for k in ks)/len(ks)))
        kinds=collections.Counter(d['k'] for k in ks for d in on[k]['dl']);chs=collections.Counter((d['k'],d['ch']) for k in ks for d in on[k]['dl']);print('  best choices',dict(chs))
print('== C follow rate')
allon=[r for p in ['best','sw','wd','in','rnd'] for r in pols[p].values()]
wd=[d for r in allon for d in r['decs'] if d['k']=='wide' and d['s']==0]
fk=[d for r in allon for d in r['decs'] if d['k']=='fk']
fps=[d['fp'] for d in wd]
print('wide decs',len(wd),'follow mean %.3f'%(sum(d['fol'] for d in wd)/len(wd)),'fp mean %.3f min %.3f max %.3f'%(sum(fps)/len(fps),min(fps),max(fps)))
for p in ['best','sw','wd','in','rnd']:
    w=[d for r in pols[p].values() for d in r['decs'] if d['k']=='wide']
    if w:print('  ',p,'n',len(w),'fol %.3f fp %.3f'%(sum(d['fol'] for d in w)/len(w),sum(d['fp'] for d in w)/len(w)))
for ch in ['switch','wide','inside']:
    w=[d for d in wd if d['ch']==ch];print('  ch',ch,'n',len(w),'fol %.3f fp %.3f blk %.3f'%(sum(d['fol'] for d in w)/len(w),sum(d['fp'] for d in w)/len(w),sum('blk' in d['why'] for d in w)/len(w)))
nf=[d for d in wd if not d['fol']];print('non-follow',len(nf),'why empty',sum(d['why']=='' for d in nf),collections.Counter(d['why'] for d in nf).most_common(8))
fl=[d for d in wd if d['fol']];print('follow why dist',collections.Counter(d['why'] for d in fl).most_common(5))
# calibration fol vs fp bins
for lo,hi in [(.6,.65),(.65,.7),(.7,.75),(.75,.8),(.8,.89)]:
    b=[d for d in wd if lo<=d['fp']<hi]
    if b:print('  fp[%.2f,%.2f) n=%d fol=%.3f fpmean=%.3f'%(lo,hi,len(b),sum(d['fol'] for d in b)/len(b),sum(d['fp'] for d in b)/len(b)))
# modifier direction: recompute
cl=lambda v,a,b:max(a,min(b,v))
ok=n=0;bad=[]
for r in allon:
    for d in r['decs']:
        if d['k']!='wide':continue
        p=r['pa'].get(d['pn'])
        if not p:continue
        n+=1;pro=p['pro'] if p['pro'] is not None else 12;cond=p['cond'] if p['cond'] is not None else 2
        v=.755+cl((pro-12)/6,-1,1)*.10+cl((cond-2)/2,-1,1)*.05
        hb=p['hab'];lg=lambda i:cl(math.log(hb[i])/math.log(2),-1,1) if hb and hb[i]>0 else None
        if d['ch']=='wide':
            u,w=lg(0),lg(2);tm=max(u,w) if u is not None else cl((max(p['cross'] or 10,p['drib'] or 10)-12)/6,-1,1)
        elif d['ch']=='inside':
            u=lg(4);tm=u if u is not None else cl(((p['pass'] or 10)-12)/6,-1,1)
        else: tm=cl(((p['pass'] or 10)-12)/6,-1,1)
        v+=tm*.08
        if 'blk' in d['why']:v-=.15
        v=cl(v,.6,.88)
        if abs(v-d['fp'])<.0015:ok+=1
        else:bad.append((d['fp'],round(v,3),d['why'],p['pro'],p['cond']))
print('formula recompute: n',n,'match',ok,'mismatch ex',bad[:5])
# fp by pro bucket and blk
def grp(f):
    g=collections.defaultdict(list)
    for r in allon:
        for d in r['decs']:
            if d['k']=='wide' and d['pn'] in r['pa']:g[f(r['pa'][d['pn']],d)].append(d['fp'])
    return {k:(len(v),round(sum(v)/len(v),3)) for k,v in sorted(g.items(),key=lambda z:str(z[0]))}
print('fp by pro<10/10-14/>14',grp(lambda p,d:'lo' if (p['pro'] or 12)<10 else 'hi' if (p['pro'] or 12)>14 else 'mid'))
print('fp by blk',grp(lambda p,d:'blk' in d['why']))
print('fp by cond',grp(lambda p,d:p['cond']))
print('FK decs',len(fk),'fol field',collections.Counter(d['fol'] for d in fk))
print('== D good consistency')
inc=0;tot=0;gb=collections.Counter()
for r in allon:
    decs=[d for d in r['decs'] if d['k']=='wide'];acts=r['acts']
    for d in decs:
        a=next((x for x in acts if x['sec']>=d['sec']),None)
        if not a:continue
        tot+=1
        exp=1 if (d['good'] and d['fol']) else 0
        gb[(d['good'],d['fol'],a['good'],a['fol'])]+=1
        if a['good']!=exp or a['fol']!=d['fol']:inc+=1
print('wide dec->act pairs',tot,'inconsistent',inc,dict(gb))
# harness good vs dl
mm=0
for r in allon:
    for x,d in zip(r['dl'],r['decs']):
        if int(bool(x['good']))!=d['good'] or x['ch']!=d['ch']:mm+=1
print('harness passed good vs dec.good mismatch',mm)
au=pols['auto'];print('auto dec good/fol',collections.Counter((d['good'],d['fol'],d['ch']) for r in au.values() for d in r['decs']))
print('== E labels (uncapped forced runs + capped forced runs)')
def emet(rs,k,ch):
    ds=[d for r in rs for d in r['decs'] if d['k']==k and d['ch']==ch and d['s']==0 and not d.get('end')]
    return ds
for src in ['unc','cand']:
    for k,chs in [('wide',['switch','wide','inside']),('fk',['shot','cross','short'])]:
        print(' src',src,k)
        M={}
        for ch,p in zip(chs,['sw','wd','in']):
            rs=list(load(src,p).values());ds=emet(rs,k,ch);M[ch]=ds
            if not ds:continue
            n=len(ds);loss=sum(d['loss'] for d in ds)/n;osh=sum(d['osh'] for d in ds)/n;ox=sum(d['oxg'] for d in ds)/n;own=sum(d['own'] for d in ds)/n;g=sum(d['g'] for d in ds)/n;og=sum(d['og'] for d in ds)/n
            fol=[d['fol'] for d in ds if d['fol'] is not None]
            print('   %-7s n=%4d loss=%.3f oppShot=%.3f oppGoal=%.3f ownShot=%.3f ownXG=%.4f(sd %.3f) ownGoal=%.3f fol=%s'%(ch,n,loss,osh,og,own,ox,st.stdev([d['oxg'] for d in ds]),g,('%.3f'%(sum(fol)/len(fol))) if fol else '-'))
        def z2(a,b,f):
            na,nb=len(a),len(b);pa=sum(f(d) for d in a)/na;pb=sum(f(d) for d in b)/nb;p=(sum(f(d) for d in a)+sum(f(d) for d in b))/(na+nb);se=math.sqrt(p*(1-p)*(1/na+1/nb)) or 1e-9;return pa-pb,(pa-pb)/se
        def zm(a,b,f):
            va=[f(d) for d in a];vb=[f(d) for d in b];se=math.sqrt(st.variance(va)/len(va)+st.variance(vb)/len(vb)) or 1e-9;return sum(va)/len(va)-sum(vb)/len(vb),(sum(va)/len(va)-sum(vb)/len(vb))/se
        pr=lambda t:'diff %+.4f z=%.2f'%t
        if k=='wide' and all(M.values()):
            print('   risk switch(high) - inside(low): loss',pr(z2(M['switch'],M['inside'],lambda d:d['loss'])),'| oppShot',pr(z2(M['switch'],M['inside'],lambda d:d['osh'])))
            print('   risk wide(mid) - inside(low): loss',pr(z2(M['wide'],M['inside'],lambda d:d['loss'])),'| oppShot',pr(z2(M['wide'],M['inside'],lambda d:d['osh'])))
            print('   opp wide(high) - switch(mid): xG',pr(zm(M['wide'],M['switch'],lambda d:d['oxg'])),'| ownShot',pr(z2(M['wide'],M['switch'],lambda d:d['own'])))
            print('   opp wide(high) - inside(mid): xG',pr(zm(M['wide'],M['inside'],lambda d:d['oxg'])),'| ownShot',pr(z2(M['wide'],M['inside'],lambda d:d['own'])))
        if k=='fk' and all(M.values()):
            for o in ['cross','short']:
                print('   risk shot(low) - %s(mid): loss'%o,pr(z2(M['shot'],M[o],lambda d:d['loss'])),'| oppShot',pr(z2(M['shot'],M[o],lambda d:d['osh'])))
            print('   opp shot(high) - short(low): xG',pr(zm(M['shot'],M['short'],lambda d:d['oxg'])),'| ownGoal',pr(z2(M['shot'],M['short'],lambda d:d['g'])))
            print('   opp cross(mid) - short(low): xG',pr(zm(M['cross'],M['short'],lambda d:d['oxg'])))
            print('   risk short(mid) vs cross(mid) oppShot',pr(z2(M['short'],M['cross'],lambda d:d['osh'])))
