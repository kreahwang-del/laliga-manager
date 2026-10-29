# -*- coding: utf-8 -*-
"""권리 위험 전수조사 스캐너 (읽기 전용).

handoff/cur.html 을 읽어 실명·실데이터·외부 호출·브랜드 표기를 범주별로 센다.
각 등장 위치를 '주석 / 문자열 / 코드(식별자·정규식) / 데이터 리터럴 / HTML 본문'으로 나눠
화면 노출 가능성과 비노출을 구분한다.

실행: python -X utf8 -I scan_rights.py <cur.html> <out.json>
"""
import bisect
import collections
import json
import re
import sys

SRC, OUT = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()

# ---------------------------------------------------------------- 영역 나누기
a = s.index('<script>') + len('<script>')
b = s.index('</script>', a)
MAIN = (a, b)


def raw_json(key, start=0):
    """'key' 바로 뒤의 JSON 리터럴을 읽어 (값, 시작, 끝) 반환."""
    i = s.index(key, start) + len(key)
    v, e = json.JSONDecoder().raw_decode(s, i)
    return v, i, e


G, g0, g1 = raw_json('const G=')
MG, m0, m1 = raw_json('G.mgrs=', g1)
DB247, d0, d1 = raw_json('const DB247=')
TOCAL, t0, t1 = raw_json('const TOCAL=')
KITS3D, k0, k1 = raw_json('KITS3D=', t1)
LOOK3D, l0, l1 = raw_json('LOOK3D=', k1)
STAD, s0, s1 = raw_json('const STAD=')
WMAP, w0, w1 = raw_json('const WMAP=')
POS5, p0, p1 = raw_json('const POS5=')
ENG, e0, e1 = raw_json('const ENGINE_SRC=')  # 워커 엔진 소스(문자열)

DATA_REGIONS = [
    (g0, m1, 'G(선수·구단·리그·감독)'), (d0, d1, 'DB247'), (t0, t1, 'TOCAL'),
    (k0, k1, 'KITS3D'), (l0, l1, 'LOOK3D'), (s0, s1, 'STAD'), (w0, w1, 'WMAP'),
    (p0, p1, 'POS5'), (e0, e1, 'ENGINE_SRC'),
]


# ---------------------------------------------------------------- JS 렉서(근사)
def lex(src, base, out):
    """src 를 주석/문자열/템플릿/정규식/코드 구간으로 나눠 out 에 (시작,끝,종류) 추가."""
    n = len(src)
    i = 0
    last_sig = ''  # 직전 의미 있는 문자(정규식 판정용)
    last_word = ''
    code_start = 0
    REGEX_PREV = set('(,=:[!&|?{};+-*%<>~^')
    KW = {'return', 'typeof', 'case', 'in', 'of', 'delete', 'void', 'throw', 'new', 'else', 'do'}
    tstack = []  # 템플릿 ${ } 중첩

    def flush(j):
        nonlocal code_start
        if j > code_start:
            out.append((base + code_start, base + j, 'code'))

    while i < n:
        c = src[i]
        if c == '/' and i + 1 < n and src[i + 1] == '/':
            flush(i)
            j = src.find('\n', i)
            j = n if j < 0 else j
            out.append((base + i, base + j, 'comment'))
            i = code_start = j
            continue
        if c == '/' and i + 1 < n and src[i + 1] == '*':
            flush(i)
            j = src.find('*/', i + 2)
            j = n if j < 0 else j + 2
            out.append((base + i, base + j, 'comment'))
            i = code_start = j
            continue
        if c in '\'"':
            flush(i)
            j = i + 1
            while j < n and src[j] != c:
                if src[j] == '\\':
                    j += 1
                elif src[j] == '\n':
                    break
                j += 1
            out.append((base + i, base + j + 1, 'string'))
            i = code_start = j + 1
            last_sig = c
            continue
        if c == '`' or (c == '}' and tstack and tstack[-1] == 0):
            if c == '}':
                tstack.pop()
            flush(i)
            j = i + 1
            while j < n:
                if src[j] == '\\':
                    j += 2
                    continue
                if src[j] == '`':
                    break
                if src[j] == '$' and j + 1 < n and src[j + 1] == '{':
                    break
                j += 1
            if j < n and src[j] == '$':
                out.append((base + i, base + j + 2, 'string'))
                tstack.append(0)
                i = code_start = j + 2
                last_sig = '{'
            else:
                out.append((base + i, base + j + 1, 'string'))
                i = code_start = j + 1
                last_sig = '`'
            continue
        if c == '{' and tstack:
            tstack[-1] += 1
        elif c == '}' and tstack:
            tstack[-1] -= 1
        if c == '/' and (last_sig in REGEX_PREV or last_sig == '' or last_word in KW):
            flush(i)
            j = i + 1
            cls = False
            while j < n and src[j] != '\n':
                if src[j] == '\\':
                    j += 2
                    continue
                if src[j] == '[':
                    cls = True
                elif src[j] == ']':
                    cls = False
                elif src[j] == '/' and not cls:
                    break
                j += 1
            while j + 1 < n and src[j + 1].isalpha():
                j += 1
            out.append((base + i, base + j + 1, 'regex'))
            i = code_start = j + 1
            last_sig = ')'
            continue
        if not c.isspace():
            if c.isalnum() or c in '_$':
                j = i
                while j < n and (src[j].isalnum() or src[j] in '_$'):
                    j += 1
                last_word = src[i:j]
                last_sig = 'a'
                i = j
                continue
            last_sig = c
            last_word = ''
        i += 1
    flush(n)


segs = []
# 데이터 리터럴 영역은 통째로 'data'
for x0, x1, nm in DATA_REGIONS:
    segs.append((x0, x1, 'data:' + nm))
# 메인 스크립트에서 데이터 영역을 뺀 나머지를 렉싱
cuts = sorted([(x0, x1) for x0, x1, _ in DATA_REGIONS])
pos = MAIN[0]
for x0, x1 in cuts:
    if x0 > pos:
        lex(s[pos:x0], pos, segs)
    pos = max(pos, x1)
lex(s[pos:MAIN[1]], pos, segs)
# HTML 본문(스크립트 밖)
segs.append((0, MAIN[0], 'html'))
rest = s.find('</script>', MAIN[1]) + 9
nx = s.find('<script', rest)
segs.append((rest, nx if nx > 0 else len(s), 'html'))
for m in re.finditer(r'<script type="text/x-(\w+)" id="(\w+)">', s):
    e = s.index('</script>', m.end())
    segs.append((m.end(), e, 'asset:' + m.group(2)))
segs.sort()
starts = [x[0] for x in segs]


def kind(p):
    i = bisect.bisect_right(starts, p) - 1
    if i >= 0 and segs[i][0] <= p < segs[i][1]:
        return segs[i][2]
    return 'html'


# 워커 엔진 문자열 안은 별도로 렉싱(주석/문자열/코드)
eng_segs = []
lex(ENG, 0, eng_segs)
eng_segs.sort()
eng_starts = [x[0] for x in eng_segs]


def eng_kind(p):
    i = bisect.bisect_right(eng_starts, p) - 1
    return 'eng-' + (eng_segs[i][2] if i >= 0 and eng_segs[i][0] <= p < eng_segs[i][1] else 'code')


def count_term(term, regex=False, flags=0, ex=3):
    pat = re.compile(term if regex else re.escape(term), flags)
    by = collections.Counter()
    exs = collections.defaultdict(list)
    for m in pat.finditer(s):
        k = kind(m.start())
        if k == 'data:ENGINE_SRC':
            continue
        by[k] += 1
        if len(exs[k]) < ex:
            exs[k].append(s[max(0, m.start() - 50):m.end() + 50].replace('\n', ' '))
    for m in pat.finditer(ENG):
        k = eng_kind(m.start())
        by[k] += 1
        if len(exs[k]) < ex:
            exs[k].append(ENG[max(0, m.start() - 50):m.end() + 50].replace('\n', ' '))
    return dict(by), dict(exs)


R = {}

# ---------------------------------------------------------------- 1. 선수
P = G['players']
names = [r[1] for r in P]
ids = [r[0] for r in P]
img = [r[-1] for r in P if isinstance(r[-1], str) and r[-1]]
img_tm = [x for x in img if re.fullmatch(r'\d+-\d{10}\.(jpg|png)', x)]
img_id_match = sum(1 for r in P if isinstance(r[-1], str) and r[-1].startswith(f'{r[0]}-'))
gen_ids = [i for i in ids if i >= 90000000]
est2 = sum(1 for r in P if len(r) > 18 and r[18] == 2)
R['players'] = dict(
    rows=len(P), unique_names=len(set(names)), examples=names[:3],
    id_min=min(ids), id_max=max(ids), ids_ge_9e7=len(gen_ids),
    img_field=len(img), img_tm_pattern=len(img_tm), img_prefix_eq_id=img_id_match,
    img_examples=img[:3], est2=est2,
    dob_field=sum(1 for r in P if r[5]), nat_field=sum(1 for r in P if r[6]),
    height_field=sum(1 for r in P if r[8]),
    value_nonzero=sum(1 for r in P if r[12]), wage_nonzero=sum(1 for r in P if r[15]),
    clause_nonzero=sum(1 for r in P if r[16]),
)

# ---------------------------------------------------------------- 2. 구단
C = G['clubs']
R['clubs'] = dict(
    rows=len(C), examples=[(c[1], c[2], c[3]) for c in C[:3]],
    unique_short=len(set(c[2] for c in C)),
    tm_id=sum(1 for c in C if c[10]), tm_examples=[(c[1], c[10]) for c in C[:3]],
    revSrc=dict(collections.Counter(c[8] for c in C)),
    deloitte_examples=[(c[1], c[4]) for c in C if '딜로이트' in str(c[8])][:3],
    by_league=dict(collections.Counter(c[3] for c in C)),
)
R['leagues'] = dict(G=G['leagues'], lgTm=G['lgTm'])

# ---------------------------------------------------------------- 3. 감독
R['managers'] = dict(rows=len(MG), with_club=sum(1 for m in MG if m.get('club')),
                     examples=[(m['n'], m.get('club')) for m in MG[:3]])

# ---------------------------------------------------------------- 4. 실명 키 데이터
R['keyed'] = dict(
    TOCAL=dict(n=len(TOCAL), examples=list(TOCAL)[:3]),
    DB247={k: len(v) for k, v in DB247.items()},
    LOOK3D=dict(n=len(LOOK3D), keys_in_players=sum(1 for k in LOOK3D if int(k) in set(ids)),
                examples=list(LOOK3D.items())[:3]),
    KITS3D=dict(n=len(KITS3D), examples=list(KITS3D.items())[:2]),
    STAD=dict(n=len(STAD), keys_eq_club_tm=sum(1 for k in STAD if int(k) in {c[10] for c in C if c[10]}),
              examples=list(STAD.items())[:3]),
    id_keyed={k: len(G[k]) for k in ('tend', 'pst', 'dtend', 'tendTM') if isinstance(G.get(k), dict)},
)


# ---------------------------------------------------------------- 5. 코드 안에 박힌 실명
def code_text():
    """데이터 영역을 뺀 메인 스크립트 + 엔진 문자열."""
    parts = []
    pos = MAIN[0]
    for x0, x1 in cuts:
        if x0 > pos:
            parts.append((pos, s[pos:x0]))
        pos = max(pos, x1)
    parts.append((pos, s[pos:MAIN[1]]))
    return parts


CODE = code_text()


def residue(name_list, minlen=5, label=''):
    hits = collections.Counter()
    kinds = collections.Counter()
    exs = []
    for nm in set(name_list):
        if not nm or len(nm) < minlen:
            continue
        if not any(nm in txt for _, txt in CODE) and nm not in ENG:
            continue  # 빠른 사전 거름(대부분 이름은 코드에 없음)
        pat = re.compile(r'(?<![\w])' + re.escape(nm) + r'(?![\w])')
        for base, txt in CODE:
            for m in pat.finditer(txt):
                k = kind(base + m.start())
                hits[nm] += 1
                kinds[k] += 1
                if len(exs) < 4:
                    exs.append(txt[max(0, m.start() - 40):m.end() + 40].replace('\n', ' '))
        for m in pat.finditer(ENG):
            hits[nm] += 1
            kinds[eng_kind(m.start())] += 1
    return dict(distinct=len(hits), total=sum(hits.values()), kinds=dict(kinds),
                top=hits.most_common(12), examples=exs)


R['residue_players'] = residue(names, 7)
R['residue_clubs'] = residue([c[1] for c in C], 4)
R['residue_mgrs'] = residue([m['n'] for m in MG], 6)

# 코드 상수 표(실명)
TABLES = {}
for nm in ['COLORS', 'YOUTH_MULT', 'DERBY', 'DERBY_N', 'D2_CLUBS', 'ES3_DATA', 'ES3_POOL', 'CUPS', 'EUC',
           'MT_EU', 'LGN', 'CC_NM', 'NAMES']:
    m = re.search(r'(?:const|let|var)\s+' + nm + r'\s*=', s)
    if not m:
        continue
    j = m.end()
    # 괄호 짝 맞추기로 리터럴 끝 찾기(문자열 안 괄호는 건너뜀)
    while s[j] not in '[{(':
        j += 1
    depth, k = 0, j
    while k < len(s):
        ch = s[k]
        if ch in '\'"':
            k += 1
            while s[k] != ch:
                k += 2 if s[k] == '\\' else 1
        elif ch in '[{(':
            depth += 1
        elif ch in ']})':
            depth -= 1
            if depth == 0:
                break
        k += 1
    lit = s[j:k + 1]
    strs = re.findall(r"'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"", lit)
    strs = [x or y for x, y in strs]
    TABLES[nm] = dict(chars=len(lit), n_strings=len(strs), examples=strs[:6],
                      line=s.count('\n', MAIN[0], m.start()) + 1)
R['code_tables'] = TABLES

# COLORS 키 개수(실제 구단명)
cm = re.search(r"const COLORS=\{(.*?)\};", s)
R['COLORS_keys'] = len(re.findall(r"'([^']+)':\[", cm.group(1))) if cm else None

# ---------------------------------------------------------------- 6. 용어(대회·브랜드·출처)
TERMS = {
    # 대회·리그 명칭
    '챔피언스리그': '챔피언스리그', '유로파리그': '유로파리그', '컨퍼런스리그': '컨퍼런스리그',
    'UCL': r'\bUCL\b', 'UEL': r'\bUEL\b', 'UECL': r'\bUECL\b',
    '라리가': '라리가', '프리미어리그': '프리미어리그', '세리에': '세리에', '분데스리가': '분데스리가',
    '리그1': '리그1', '에레디비시': '에레디비시', 'K리그': 'K리그', 'J1리그': 'J1리그', 'MLS': r'\bMLS\b',
    '챔피언십': '챔피언십', '리가 MX': '리가 MX', '1RFEF': '1RFEF',
    '국왕컵': '국왕컵', 'FA컵': 'FA컵', 'DFB 포칼': 'DFB 포칼', '코파 이탈리아': '코파 이탈리아',
    '쿠프 드 프랑스': '쿠프 드 프랑스',
    '엘 클라시코': '엘 클라시코', '발롱도르': '발롱도르', '사모라': '사모라',
    # 단체·데이터 출처·브랜드
    'UEFA': 'UEFA', 'FIFA': 'FIFA', 'Opta': 'Opta', 'StatsBomb': 'StatsBomb', 'FBref': 'FBref',
    'Transfermarkt': 'Transfermarkt', '트랜스퍼마르크트': '트랜스퍼마르크트', 'TM(약칭)': r'\bTM\b',
    'Deloitte': 'Deloitte', '딜로이트': '딜로이트', 'FC26/FC27(EA)': r'\bFC2[4-7]\b', 'EA': r'\bEA\b',
    'Mixamo': 'Mixamo', 'mixamorig': 'mixamorig', 'ambientCG': 'ambientCG', 'Natural Earth': 'Natural Earth',
    'three.js': 'three.js', '위키백과': '위키백과',
    'xG': r'\bxG\b', 'xA': r'\bxA\b',
    # 제목
    '풋볼 매니저': '풋볼 매니저', '라리가 매니저': '라리가 매니저', 'laliga-manager': 'laliga-manager',
}
R['terms'] = {}
for label, pat in TERMS.items():
    by, ex = count_term(pat, regex=True)
    R['terms'][label] = dict(by=by, ex={k: v[:2] for k, v in ex.items()})

# ---------------------------------------------------------------- 7. 외부 주소
urls = collections.Counter()
url_kind = collections.defaultdict(collections.Counter)
for m in re.finditer(r'https?://([A-Za-z0-9.\-]+)', s):
    urls[m.group(1)] += 1
    url_kind[m.group(1)][kind(m.start())] += 1
for m in re.finditer(r'https?://([A-Za-z0-9.\-]+)', ENG):
    urls[m.group(1)] += 1
    url_kind[m.group(1)][eng_kind(m.start())] += 1
R['urls'] = {h: dict(n=n, kinds=dict(url_kind[h])) for h, n in urls.most_common()}
R['fetch_calls'] = len(re.findall(r'\bfetch\(', s))

# ---------------------------------------------------------------- 8. 이름 생성기 충돌 검사
nm = re.search(r'const NAMES=(\{.*?\});', s, re.S)
NM = {}
if nm:
    for na, body in re.findall(r"(\w{3}):\{f:\[(.*?)\]", nm.group(1)):
        NM[na] = None
    for na, f, l in re.findall(r"(\w{3}):\{f:\[(.*?)\],\s*l:\[(.*?)\]\}", nm.group(1), re.S):
        NM[na] = (re.findall(r"'([^']+)'", f), re.findall(r"'([^']+)'", l))
real = set(names)
coll = collections.Counter()
coll_ex = []
combos = 0
for na, v in NM.items():
    if not v:
        continue
    f, l = v
    for x in f:
        for y in l:
            combos += 1
            for full in (f'{x} {y}', f'{y} {x}'):
                if full in real:
                    coll[na] += 1
                    if len(coll_ex) < 8:
                        coll_ex.append((na, full))
R['NAMES'] = dict(nations=len(NM), sizes={k: (len(v[0]), len(v[1])) for k, v in NM.items() if v},
                  combos=combos, collisions=dict(coll), collision_examples=coll_ex)

# ---------------------------------------------------------------- 9. 3D·폰트·지도
R['assets'] = {}
for m in re.finditer(r'<script type="text/x-(\w+)" id="(\w+)">', s):
    e = s.index('</script>', m.end())
    R['assets'][m.group(2)] = dict(type=m.group(1), chars=e - m.end())
R['fonts'] = re.findall(r'family=([A-Za-z+]+)', s[:MAIN[0]])
R['title'] = re.findall(r'<title>(.*?)</title>', s)
R['three_license'] = bool(re.search(r'SPDX-License-Identifier: MIT', s))
R['WMAP'] = dict(keys=list(WMAP.keys())[:10], chars=w1 - w0)

json.dump(R, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', OUT)
