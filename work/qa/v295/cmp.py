import json,math
a=json.load(open('p294.json'))['res'];b=json.load(open('p295.json'))['res']
def st(L):
  s=[tuple(map(int,x.split('-'))) for x in L if x!='x'];n=len(s);g=[x+y for x,y in s];m=sum(g)/n;sd=(sum((v-m)**2 for v in g)/n)**.5;d=sum(1 for x,y in s if x==y)/n;return n,m,sd,d
tot={'aff':[[],[]],'un':[[],[]]}
AFF={'KR','JP','CN','MX','BR','AR'}
for lg in a:
  if not a[lg]: continue
  A,B=a[lg],b[lg];same=sum(1 for x,y in zip(A,B) if x==y)/len(A)
  n,m1,sd,d1=st(A);_,m2,_,d2=st(B)
  # 쌍 차이의 표준오차
  ga=[sum(map(int,x.split('-'))) for x in A];gb=[sum(map(int,x.split('-'))) for x in B];dd=[y-x for x,y in zip(ga,gb)];md=sum(dd)/n;sdd=(sum((v-md)**2 for v in dd)/n)**.5;se=sdd/n**.5
  k='aff' if lg in AFF else 'un';tot[k][0]+=A;tot[k][1]+=B
  print(f"{lg:5} n={n:4} same={same:.3f} gpg {m1:.3f}->{m2:.3f} (d={m2-m1:+.3f}, SE {se:.3f}) draw {d1:.3f}->{d2:.3f}")
for k,(A,B) in tot.items():
  n,m1,_,d1=st(A);_,m2,_,d2=st(B);same=sum(1 for x,y in zip(A,B) if x==y)/len(A);print(k,n,f"same={same:.3f} gpg {m1:.3f}->{m2:.3f} draw {d1:.3f}->{d2:.3f}")
