import json,glob,math,collections,statistics as st,random
D='/home/claude/work/qa/out254/'
def load(tag,pol,cap):
    R={}
    for f in glob.glob(D+f'{tag}_{pol}_c{cap}_*.json'):
        for r in json.load(open(f)): R[r['seed']]=r
    return R
def mean(v):return sum(v)/len(v) if v else float('nan')
def ci(v):
    n=len(v);m=mean(v);s=st.stdev(v) if n>1 else 0;h=1.96*s/math.sqrt(n);return n,m,s,m-h,m+h
def fmt(t):return 'n=%d mean=%+.3f sd=%.3f CI95=[%+.3f,%+.3f]'%t
def pci(v):
    n=len(v);p=mean(v);return '%.3f±%.3f'%(p,1.96*math.sqrt(p*(1-p)/n) if n else 0)
def mci(v):
    n=len(v);return '%.4f±%.4f'%(mean(v),1.96*st.stdev(v)/math.sqrt(n) if n>1 else 0)
def dz(a,b):
    if len(a)<2 or len(b)<2:return float('nan'),float('nan'),float('nan')
    d=mean(a)-mean(b);se=math.sqrt(st.variance(a)/len(a)+st.variance(b)/len(b)) or 1e-9;return d,d/se,se
pz=lambda t:'%+.4f (z=%+.2f, CI ±%.4f)'%(t[0],t[1],1.96*t[2])

print('== A determinism (seeds 940001-940050, base253 vs cand254)')
for pol in ['ai','off']:
    b,c=load('base',pol,1),load('cand',pol,1);ks=sorted(set(b)&set(c))
    print('  %s seeds %d identical %d'%(pol,len(ks),sum(b[k]['hs']==c[k]['hs'] and b[k]['sc']==c[k]['sc'] for k in ks)))
off=load('cand','off',1)
ON={p:load('cand',p,1) for p in ['best','hint','p0','p1','p2']}
UD={p:load('cand',p,0) for p in ['rnd','auto','follow','tackle','block','orc']}
allr=[r for d in list(ON.values())+list(UD.values()) for r in d.values()]
print('  AI-side: aiDec',sum(r['aiDec'] for r in allr),'dec s!=0',sum(1 for r in allr for d in r['decs'] if d['s']!=0),'decTm on AI side (expected only def pass-L defPS):',dict(collections.Counter((t['s'],t['o']) for r in allr for t in r['tm'] if t['s']!=0)))

dpm=[]
print('== B caps & time windows (capped, real UI decWant)')
viol=collections.Counter();nm=nd=0;kc=collections.Counter();mins=[];ordm=collections.defaultdict(list)
for p,R in ON.items():
    for r in R.values():
        nm+=1;ds=r['dl'];nd+=len(ds)
        if len(ds)>3:viol['>3']+=1
        for i,d in enumerate(ds):
            mins.append(d['min']);ordm[i].append(d['min'])
            if d['min']<[10,35,60][min(i,2)]:viol['window%d'%(i+1)]+=1
            if i and d['min']-ds[i-1]['min']<10:viol['gap<10']+=1
            if d['k']!='fk' and d['min']<10:viol['nonFK<10']+=1
        c=collections.Counter(d['k'] for d in ds)
        for k,v in c.items():
            kc[k]+=v
            if k!='fk' and v>2:viol[k+'>2']+=1
        if len(r['decs'])!=len(ds):viol['dec/dl mismatch']+=1
if nm:
    print('  matches %d decisions %d (%.2f/match) kinds %s violations %s'%(nm,nd,nd/nm,dict(kc),dict(viol) or 0))
    print('  per-match count dist',dict(sorted(collections.Counter(len(r['dl']) for R in ON.values() for r in R.values()).items())))
    for i in range(3):
        v=ordm[i];print('  decision #%d: n=%d min=%d median=%d mean=%.1f'%(i+1,len(v),min(v),st.median(v),mean(v)))
    b=collections.Counter(min(m//15,6) for m in mins);print('  minute bins(15)',{('%d-%d'%(k*15,k*15+14) if k<6 else '90+'):round(b[k]/len(mins),3) for k in sorted(b)},'| 1st half share %.3f'%mean([m<45 for m in mins]))
    dpm=[sum(d['k']=='def' for d in r['dl']) for R in ON.values() for r in R.values()];print('  def per match (capped): mean %.2f dist %s'%((mean(dpm) if dpm else 1.5),dict(collections.Counter(dpm))))
    dpb=[sum(d['k']=='def' for d in r['dl']) for r in ON['best'].values()];print('  def per match (best policy): %.2f'%mean(dpb))
print('== C def scenes (uncapped def-only)')
def defs(R):return [d for r in R.values() for d in r['decs'] if d['k']=='def' and d['s']==0]
DD={p:defs(R) for p,R in UD.items()}
for p,v in DD.items():
    if not v:continue
    ic=collections.Counter(d['intent'] for d in v);n=len(v)
    fo=[d['fol'] for d in v if d['fol'] is not None]
    print('  %-6s n=%5d intents %s | res %s | oppXG/scene %s oppShot %s | fol %s | /match %.1f'%(p,n,{k:pci([d['intent']==k for d in v]) for k in ['drib','pass','shot']},dict(collections.Counter(d['res'] for d in v)),mci([d['dx'] for d in v]),pci([d['dsh'] for d in v]),('%.3f'%mean(fo)) if fo else '-',n/len(UD[p])))
au=DD['auto']
print('  adaptation check (beat-intent share vs auto): follow→pass, tackle→drib, block→shot')
for p,bi in [('follow','pass'),('tackle','drib'),('block','shot')]:
    v=DD[p];a=[d['intent']==bi for d in au];b2=[d['intent']==bi for d in v]
    # early (first 2 per match) vs later
    early=[];late=[]
    for r in UD[p].values():
        ds=[d for d in r['decs'] if d['k']=='def']
        for i,d in enumerate(ds):(early if i<2 else late).append(d['intent']==bi)
    print('    %-6s %s share: auto %.3f | policy %.3f (diff %s) | first2/match %.3f later %.3f'%(p,bi,mean(a),mean(b2),pz(dz(b2,a)),mean(early),mean(late)))
# W/L deltas per intent: use all uncapped (res is randomized by policy/follow); dx by intent x res
allD=[d for p in ['rnd','auto','follow','tackle','block','orc'] for d in DD[p]]
print('  oppXG by intent x res (all uncapped def scenes), delta vs T:')
for it in ['drib','pass','shot']:
    g={r:[d['dx'] for d in allD if d['intent']==it and d['res']==r] for r in 'WTL'}
    W=dz(g['W'],g['T']);L=dz(g['L'],g['T'])
    print('    %-5s T %s(n%d) | W %s(n%d) dW %s | L %s(n%d) dL %s | |dW|-|dL| %+.4f'%(it,mci(g['T']),len(g['T']),mci(g['W']),len(g['W']),pz(W),mci(g['L']),len(g['L']),pz(L),abs(W[0])-abs(L[0])))
    gs={r:[d['dsh'] for d in allD if d['intent']==it and d['res']==r] for r in 'WTL'}
    print('          oppShot T %.3f W %.3f L %.3f'%(mean(gs['T']),mean(gs['W']),mean(gs['L'])))
# rnd-only version (cleanest)
print('  same, rnd policy only:')
for it in ['drib','pass','shot']:
    g={r:[d['dx'] for d in DD['rnd'] if d['intent']==it and d['res']==r] for r in 'WTL'}
    print('    %-5s dW %s dL %s (nT %d nW %d nL %d)'%(it,pz(dz(g['W'],g['T'])),pz(dz(g['L'],g['T'])),len(g['T']),len(g['W']),len(g['L'])))
resW=[d['dx'] for d in allD if d['res']=='W'];resT=[d['dx'] for d in allD if d['res']=='T'];resL=[d['dx'] for d in allD if d['res']=='L']
print('  pooled over intents: dW %s dL %s'%(pz(dz(resW,resT)),pz(dz(resL,resT))))
print('  policy vs auto oppXG per scene (uncapped; scene sets from different matches = same fixtures):')
for p in ['follow','tackle','block','rnd','orc']:
    t=dz([d['dx'] for d in DD[p]],[d['dx'] for d in au]);print('    %-6s %s → per match at %.2f def/match: %+.4f (CI ±%.4f)'%(p,pz(t),(mean(dpm) if dpm else 1.5),t[0]*(mean(dpm) if dpm else 1.5),1.96*t[2]*(mean(dpm) if dpm else 1.5)))
# model-based (intent-mix) expectation using pooled deltas and auto intent shares & follow rate
fr=mean([d['fol'] for d in allD if d['fol'] is not None])
dl={it:{r:mean([d['dx'] for d in allD if d['intent']==it and d['res']==r])-mean([d['dx'] for d in allD if d['intent']==it and d['res']=='T']) for r in 'WL'} for it in ['drib','pass','shot']}
sh={it:mean([d['intent']==it for d in au]) for it in dl}
DM={'follow':{'drib':'W','pass':'L','shot':'T'},'tackle':{'drib':'L','pass':'T','shot':'W'},'block':{'drib':'T','pass':'W','shot':'L'}}
print('  model expectation per scene vs auto (follow rate %.3f, auto intent mix):'%fr)
for p in DM:
    e=sum(sh[it]*fr*(dl[it][DM[p][it]] if DM[p][it]!='T' else 0) for it in sh);print('    %-6s %+.4f/scene → %+.4f/match'%(p,e,e*(mean(dpm) if dpm else 1.5)))
eo=sum(sh[it]*fr*dl[it]['W'] for it in sh);print('    oracle %+.4f/scene → %+.4f/match (at %.2f def/match)'%(eo,eo*(mean(dpm) if dpm else 1.5),(mean(dpm) if dpm else 1.5)))
dad=[d['dadl'] for d in allD if 'dadl' in d];print('  def decAct delay: n %d of %d, max %.1f, >6s %d'%(len(dad),len(allD),max(dad),sum(x>6.01 for x in dad)))
print('  def decAct res==dec res mismatch',sum(1 for d in allD if 'dres' in d and d['dres']!=d['res']))

print('== D advantage (paired vs off, capped)')
pts=lambda s:3 if s[0]>s[1] else 1 if s[0]==s[1] else 0
for pol,on in ON.items():
    ks=sorted(set(on)&set(off))
    if not ks:continue
    gd=[(on[k]['sc'][0]-on[k]['sc'][1])-(off[k]['sc'][0]-off[k]['sc'][1]) for k in ks]
    xd=[(on[k]['xg'][0]-on[k]['xg'][1])-(off[k]['xg'][0]-off[k]['xg'][1]) for k in ks]
    pd=[pts(on[k]['sc'])-pts(off[k]['sc']) for k in ks]
    print('  %-4s GD %s | xGD %s | pts %+.3f | xGF %+.3f xGA %+.3f'%(pol,fmt(ci(gd)),fmt(ci(xd)),mean(pd),mean([on[k]['xg'][0]-off[k]['xg'][0] for k in ks]),mean([on[k]['xg'][1]-off[k]['xg'][1] for k in ks])))
    print('       choices',dict(collections.Counter((d['k'],d['ch']) for k in ks for d in on[k]['dl'])))
# pooled v253 p2 + v254 p2 not comparable (def added) -> report separately
print('== E follow (all non-FK decisions)')
fd=[d for r in allr for d in r['decs'] if d['k']!='fk' and d['fol'] is not None]
print('  n %d follow %.3f fp mean %.3f min %.3f max %.3f'%(len(fd),mean([d['fol'] for d in fd]),mean([d['fp'] for d in fd]),min(d['fp'] for d in fd),max(d['fp'] for d in fd)))
for k in ['def','box','cross']:
    v=[d for d in fd if d['k']==k]
    if v:print('   ',k,'n',len(v),'fol %.3f fp %.3f'%(mean([d['fol'] for d in v]),mean([d['fp'] for d in v])))
fc=[d for R in ON.values() for r in R.values() for d in r['decs'] if d['k']!='fk' and d['fol'] is not None];print('  capped only: n %d follow %.3f'%(len(fc),mean([d['fol'] for d in fc])))
print('== F regression (capped vs off, paired)')
for pol,on in ON.items():
    ks=sorted(set(on)&set(off))
    if not ks:continue
    g=[sum(on[k]['sc'])-sum(off[k]['sc']) for k in ks];s_=[sum(on[k]['shots'])-sum(off[k]['shots']) for k in ks]
    pp=[on[k]['poss'][0]/sum(on[k]['poss'])-off[k]['poss'][0]/sum(off[k]['poss']) for k in ks]
    print('  %-4s goals %s | shots %s | poss %s'%(pol,fmt(ci(g)),fmt(ci(s_)),fmt(ci(pp))))
print('  off goals/match %.3f shots %.2f n=%d'%(mean([sum(r['sc']) for r in off.values()]),mean([sum(r['shots']) for r in off.values()]),len(off)))
