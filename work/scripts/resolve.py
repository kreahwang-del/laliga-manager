exec(open('/tmp/claude-0/-home-claude/143ab34f-cae9-5cd6-8a3a-5ca97cda876d/scratchpad/lib.py').read())
LEFT=re.compile(r'free agent|retired|released|unattached|tbd|fired|without club',re.I)
res=[]; st=collections.Counter(); usedW=set()
for r in P:
  pid,name,cid=r[0],r[1],r[2]
  if cid not in club: continue
  rec=dict(pid=pid,name=name,frm=cid,ovr=r[9],to=cid,loan=False,src='',conf='')
  # 1) transfer lists
  tl=[t for t in TL.get(skey(name),[]) if t['fid']==cid or t['tid']==cid or t['fid'] is not None or t['tid'] is not None]
  tl=[t for t in tl if (t['fid']==cid or t['tid']==cid) or len(TL.get(skey(name),[]))==1 and len(norm(name).split())>1]
  if tl:
    tl.sort(key=lambda t:t['date'] or '0')
    t=tl[-1]
    fee=t['fee'].lower()
    if t['tid'] is not None:
      rec.update(to=t['tid'],loan=('loan' in fee and 'return' not in fee and 'end' not in fee),src='TL:'+t['src'],conf='high')
    elif set(ctok(t['to']))&alias[cid]:
      rec.update(src='TL:'+t['src'],conf='high')
    elif LEFT.search(t['to']) or LEFT.search(fee):
      rec.update(to=None,src='TL-left:'+t['to'],conf='high')
    else:
      rec.update(to=-1,src='TL-out:'+t['to'],conf='high')  # moved to club not in DB
    st['TL_'+('same' if rec['to']==cid else 'move' if isinstance(rec['to'],int) and rec['to']>=0 else 'left' if rec['to'] is None else 'outside')]+=1
    res.append(rec); continue
  # 2) squads
  c=byname.get(skey(name)) or bysp.get(nsp(name)) or []
  c2=[x for x in c if natok(r[6],x['nat']) is not False]
  fs=fuzzy_same(r)
  if any(x['cid']==cid for x in c2) or fs:
    st['SQ_same']+=1; rec['src']='SQ'; res.append(rec); continue
  cn=[t for t in norm(club[cid][0]).split() if len(t)>=4]
  if any(x['status']=='loaned_out' and any(t in norm(x['note']) for t in cn) for x in c2):
    st['SQ_same_onloan']+=1; rec['src']='SQ'; res.append(rec); continue
  if cid not in covered: st['uncovered_keep']+=1; rec['src']='keep'; res.append(rec); continue
  if c2 and len({x['cid'] for x in c2})==1:
    t=c2[0]; mono=len(norm(name).split())==1
    conf='low' if (mono or natok(r[6],t['nat']) is None or t['stale']) else 'high'
    loan='on loan from' in t['note'].lower()
    rec.update(to=t['cid'],loan=loan,src='SQ',conf=conf); st['SQ_move_'+conf]+=1; res.append(rec); continue
  if c2: st['ambig_keep']+=1; rec['src']='ambig'; res.append(rec); continue
  stale_club=any(x['stale'] for x in byclub[cid]) or len(byclub[cid])<20
  rec['src']='absent_stale' if stale_club else 'absent'; st[rec['src']]+=1; res.append(rec)
for k,v in sorted(st.items()): print(k,v)
json.dump(res,open(SQ+'resolve.json','w'),ensure_ascii=False)
# wiki players not in DB
dbn=set(skey(r[1]) for r in P)|set(nsp(r[1]) for r in P)
new=[w for w in W if w['status']=='squad' and skey(w['name']) not in dbn and nsp(w['name']) not in dbn and not w['stale']]
print('wiki squad players not in DB',len(new))
print(collections.Counter(club.get(w['cid'],('?','?'))[1] for w in new).most_common())
