# 세이브의 실제 결과로 매주 월요일 신뢰도 평가를 다시 돌려 경질 수 비교(이전 규칙 vs v262 규칙)
import json,datetime as dt
S=json.load(open('/mnt/user-data/attachments/f31d21f9-c264-59b6-9240-2b0ee68043bb/aac5631f-laliga-save-2026-10-26-LO1.json'))
fx=[f for f in S['fixtures'] if f.get('res')];ids=sorted({f['h'] for f in S['fixtures']}|{f['a'] for f in S['fixtures']})
EX={c:S['exp'][str(c)] for c in ids};n=len(ids)
def run(K,lgF,nmin,me_excl=S['club']):
    tr={c:65.0 for c in ids};since={c:'2026-07-01' for c in ids};sk=[]
    d=dt.date(2026,7,6)
    while d<=dt.date(2026,10,26):
        ds=d.isoformat();done=[f for f in fx if f['d']<ds]
        P={c:0 for c in ids};GD={c:0 for c in ids}
        for f in done:
            x,y=f['res']['sc'];P[f['h']]+=3 if x>y else 1 if x==y else 0;P[f['a']]+=3 if y>x else 1 if x==y else 0;GD[f['h']]+=x-y;GD[f['a']]+=y-x
        pos={c:i+1 for i,c in enumerate(sorted(ids,key=lambda c:(-P[c],-GD[c])))}
        for c in ids:
            r=[]
            for f in done:
                if f['d']<since[c] or c not in (f['h'],f['a']):continue
                x,y=f['res']['sc'];g=x-y if f['h']==c else y-x;r.append(3 if g>0 else 1 if g==0 else 0)
            m=len(r)
            if m<3:continue
            ex=EX[c];ppg=sum(r)/m;p5=sum(r[-5:])/len(r[-5:]);e=ex['xp']
            s=.6*(ppg-e)*m/(m+6)+.4*(p5-e)*.7
            if pos[c]>=18 and ex['tp']>=17:s-=.12
            if pos[c]>ex['tp']+4:s-=.08
            if pos[c]<=ex['tp']:s+=.05
            T=max(0,min(100,62+K*s*(lgF if s<0 else 1)))
            tr[c]+=(T-tr[c])*.22
            if c!=me_excl and m>=nmin and tr[c]<14:sk.append((ds,c,m));tr[c]=65;since[c]=ds
        d+=dt.timedelta(days=7)
    return sk,round(tr[me_excl])
for lab,a in (('이전',(135,1,6)),('v262',(135,.7,8))):
    sk,me=run(*a);print(lab,'경질',len(sk),sk,'| 내 신뢰도',me)
