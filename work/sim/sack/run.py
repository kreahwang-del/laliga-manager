import json,random,sys
exec(open('mc.py').read())
F='/mnt/user-data/attachments/f31d21f9-c264-59b6-9240-2b0ee68043bb/aac5631f-laliga-save-2026-10-26-LO1.json'
S=json.load(open(F));ids=sorted({f['h'] for f in S['fixtures']}|{f['a'] for f in S['fixtures']})
mls_xp=[S['exp'][str(c)]['xp'] for c in ids];mls_tp=[S['exp'][str(c)]['tp'] for c in ids]
EP=[2.4,2.2,1.8,1.65,1.55,1.45,1.4,1.38,1.33,1.28,1.24,1.2,1.17,1.14,1.1,1.07,1.04,1.0,.96,.9]
es_tp=[1,2,4,4,6,6,7,10,10,10,12,12,17,17,17,17,17,17,17,17]
es_big=[1.4]*6+[1]*14
for k,v in (('es',EP),('mls',mls_xp)):fit_cache[tuple(v)]=fit(v)
N=int(sys.argv[1]) if len(sys.argv)>1 else 200
for K in [135,100,80,60]:
    rng=random.Random(1)
    es=sum(season(EP,es_tp,es_big,K,rng) for _ in range(N))/N
    rng=random.Random(2)
    ml=sum(season(mls_xp,mls_tp,[1]*30,K,rng,h=.15) for _ in range(N))/N
    print(f'K={K}: 라리가 {es:.1f}/시즌, MLS {ml:.1f}/시즌')
print('MLS xp 범위',min(mls_xp),max(mls_xp),'n',len(ids))
