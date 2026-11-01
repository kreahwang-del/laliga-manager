# 연구당함 측정 분석: 조건별 승률·승점/경기, 끔 대비 차이(같은 시드 짝), 상대 맞춤 대비 발생률, 연구 단계 분포
import json, glob, math, collections
def ld(f): return [json.loads(l) for l in open(f) if l.strip()]
def st(v):
    n=len(v); m=sum(v)/n; sd=math.sqrt(sum((x-m)**2 for x in v)/max(1,n-1)); return m, sd/math.sqrt(n)
pts=lambda o:3 if o['r']=='W' else 1 if o['r']=='D' else 0
for club in ('RealMadrid','RealBetis'):
    for strat in ('fixed','rotate'):
        try: A=ld(f'out/{club}_{strat}_0.jsonl'); B=ld(f'out/{club}_{strat}_1.jsonl')
        except FileNotFoundError: continue
        wa=sum(o['r']=='W' for o in A)/len(A); wb=sum(o['r']=='W' for o in B)/len(B)
        d=st([pts(b)-pts(a) for a,b in zip(A,B)])
        pa=sum(o['plan'] for o in A)/len(A); pb=sum(o['plan'] for o in B)/len(B)
        lv=collections.Counter(o['lv'] for o in B)
        xg=st([(b['xg'][0]-b['xg'][1])-(a['xg'][0]-a['xg'][1]) for a,b in zip(A,B)])
        print(f'{club:10s} {strat:6s} n={len(A)} 승률 끔 {wa:.3f} → 켬 {wb:.3f} ({(wb-wa)*100:+.1f}%p) | 승점/경기 차 {d[0]:+.3f}±{d[1]:.3f} | xG차 {xg[0]:+.3f}±{xg[1]:.3f} | 상대 맞춤 전술 {pa:.2f}→{pb:.2f} | 연구단계 {dict(sorted(lv.items()))}')
