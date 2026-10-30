import json,random,statistics as st
exec(open('mc.py').read())
F='/mnt/user-data/attachments/f31d21f9-c264-59b6-9240-2b0ee68043bb/aac5631f-laliga-save-2026-10-26-LO1.json'
S=json.load(open(F));ids=sorted({f['h'] for f in S['fixtures']}|{f['a'] for f in S['fixtures']})
xp=[S['exp'][str(c)]['xp'] for c in ids];tp=[S['exp'][str(c)]['tp'] for c in ids]
R0=fit(xp)
import mc_helpers if False else None
