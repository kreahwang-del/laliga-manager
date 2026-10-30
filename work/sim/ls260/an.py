import json,sys,math
for f in sys.argv[1:]:
    R=[json.loads(l) for l in open(f) if l.strip()];n=len(R)
    gl=sum(sum(r['sc']) for r in R)/n;dr=sum(r['sc'][0]==r['sc'][1] for r in R)/n
    ls=sum(r['sh'].get('longshot',0) for r in R);lg=sum(r['g'].get('longshot',0) for r in R);lx=sum(r['xgT'].get('longshot',0) for r in R)
    tg=sum(sum(r['g'].values()) for r in R);tsh=sum(sum(r['sh'].values()) for r in R)
    print(f"{f.split('/')[-1]:22s} n={n} 경기당 골 {gl:.2f} 무승부 {dr:.3f} 슈팅 {tsh/n:.1f}(블록 제외) | 중거리 {ls/n:.2f}회/경기 전환 {lg/max(1,ls):.3f} xG/회 {lx/max(1,ls):.3f} | 중거리 골 비중 {lg/max(1,tg):.1%}")
