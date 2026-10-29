# -*- coding: utf-8 -*-
"""handoff/cur.html → src/ 트리 1회 분리 (2a). 재실행하면 src/의 생성 파일을 덮어씀.
사용: python split_cur.py <cur.html> <src_dir>
"""
import sys, os, re, json, base64

SRC_HTML, OUT = sys.argv[1], sys.argv[2]
s = open(SRC_HTML, encoding='utf-8', newline='').read()
assert '\r' not in s
for t in ['@@', '__DATA__', '__CFG__', '__ENGINE_SRC__']:
    assert t not in s, t
L = s.split('\n')  # L[i] = (i+1)번째 줄
dec = json.JSONDecoder()


def w(rel, text=None, data=None):
    p = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    if data is not None:
        open(p, 'wb').write(data)
    else:
        open(p, 'w', encoding='utf-8', newline='').write(text)


def rowsplit(raw):
    """JSON 원문의 최상위 요소 사이에만 줄바꿈 삽입. 빌드는 줄바꿈만 지워 원문 복원."""
    assert '\n' not in raw
    out, depth, ins, esc = [], 0, False, False
    n = len(raw)
    for i, ch in enumerate(raw):
        if ins:
            out.append(ch)
            if esc: esc = False
            elif ch == '\\': esc = True
            elif ch == '"': ins = False
            continue
        if ch == '"':
            ins = True; out.append(ch); continue
        if ch in '[{':
            depth += 1; out.append(ch)
            if depth == 1 and i + 1 < n and raw[i + 1] not in ']}': out.append('\n')
            continue
        if ch in ']}':
            if depth == 1 and i > 0 and raw[i - 1] not in '[{': out.append('\n')
            depth -= 1; out.append(ch); continue
        out.append(ch)
        if ch == ',' and depth == 1: out.append('\n')
    r = ''.join(out)
    assert r.replace('\n', '') == raw
    json.loads(r)
    return r


# ---------- 1) 페이지 틀: CSS · 메인 스크립트 · 자산 ----------
i_style = s.index('<style>') + len('<style>'); j_style = s.index('</style>')
i_app = s.index('<script>') + len('<script>'); j_app = s.index('</script>', i_app)
css = s[i_style:j_style]
app = s[i_app:j_app]
assert app.startswith('\n') and app.endswith('\n')

tpl = s[:i_style] + '@@CSS@@' + s[j_style:i_app] + '\n@@APP@@' + s[j_app:]
w('app/style.css', css)

# 자산 script 태그
assets = []
for m in re.finditer(r'<script type="text/x-(three|glb|img)" id="(\w+)">(.*?)</script>', tpl, re.S):
    assets.append((m.start(3), m.end(3), m.group(1), m.group(2), m.group(3)))
assert len(assets) == 8, len(assets)
for a, b, kind, aid, body in reversed(assets):
    if kind == 'three':
        assert body.startswith('void 0,\n')
        rest = body[len('void 0,\n'):]
        k = rest.index('\n\n(()=>{')
        lib, x = rest[:k + 1], rest[k + 2:]
        w('assets/three/three.min.js', lib); w('assets/three/three_x.js', x)
        tok = 'void 0,\n@@ASSET:text:three/three.min.js@@\n@@ASSET:text:three/three_x.js@@'
    elif kind == 'glb':
        raw = base64.b64decode(body, validate=True)
        assert base64.b64encode(raw).decode() == body
        w('assets/model/player.glb', data=raw)
        tok = '@@ASSET:b64:model/player.glb@@'
    else:
        mm = re.match(r'data:(image/(jpeg|png));base64,(.*)$', body, re.S)
        mime, ext = mm.group(1), {'jpeg': 'jpg', 'png': 'png'}[mm.group(2)]
        raw = base64.b64decode(mm.group(3), validate=True)
        assert base64.b64encode(raw).decode() == mm.group(3)
        w(f'assets/tex/{aid}.{ext}', data=raw)
        tok = f'@@ASSET:dataurl:{mime}:tex/{aid}.{ext}@@'
    tpl = tpl[:a] + tok + tpl[b:]
w('page.html', tpl)

# ---------- 2) 메인 스크립트 줄 범위 ----------
A0, A1 = 212, 7300                      # 메인 스크립트 첫·끝 줄(1부터)
assert app == '\n' + '\n'.join(L[A0 - 1:A1]) + '\n'
E0, E1 = 286, 1844                      # 엔진 본문(E3·POS5·DEC5·E5 모델·E4)
eng_text = '\n'.join(L[E0 - 1:E1]) + '\n'
ENG_LINE = 1846
el = L[ENG_LINE - 1]
assert el == 'const ENGINE_SRC=' + json.dumps(eng_text, ensure_ascii=False) + ';'

# ---------- 3) 데이터 추출(줄 단위 치환) ----------
data_files = {}
line_sub = {}  # 줄 번호 → 바뀐 줄


def put_data(name, raw):
    data_files[name] = raw
    w(f'data/{name}.json', rowsplit(raw))
    return f'__DATA__("{name}")'


def extract(lineno, specs):
    """specs: [(js 식별자 앞 문자열, 이름)] → 그 대입식의 JSON 값을 데이터로"""
    l = line_sub.get(lineno, L[lineno - 1])
    for anchor, name in specs:
        assert l.count(anchor) == 1, (lineno, anchor)
        st = l.index(anchor) + len(anchor)
        _, en = dec.raw_decode(l, st)
        l = l[:st] + put_data(name, l[st:en]) + l[en:]
    line_sub[lineno] = l


# G: 최상위 키별 파일
gl = L[212 - 1]
st = len('const G=')
assert gl.startswith('const G={')
parts, k, txt = [], st + 1, gl
gobj, gend = dec.raw_decode(gl, st)
new = 'const G={'
pos = st + 1
for key in gobj:
    ks = json.dumps(key)
    assert gl[pos:pos + len(ks) + 1] == ks + ':', (key, gl[pos:pos + 20])
    vs = pos + len(ks) + 1
    _, ve = dec.raw_decode(gl, vs)
    new += ks + ':' + put_data('G/' + key, gl[vs:ve])
    if gl[ve] == ',':
        new += ','; pos = ve + 1
    else:
        assert gl[ve] == '}' and ve + 1 == gend; pos = ve
new += gl[gend - 1:]
line_sub[212] = new
extract(212, [(';G.mgrs=', 'G/mgrs')])
extract(775, [('const POS5=', 'POS5')])
extract(4777, [('const STAD=', 'STAD')])
extract(6660, [('const DB247=', 'DB247')])
extract(6769, [('const TOCAL=', 'TOCAL'), ('const KITS3D=', 'KITS3D'), ('const LOOK3D=', 'LOOK3D')])
extract(7204, [('const WMAP=', 'WMAP')])

# 플래그(빌드 설정값)
for lineno, old, new_ in [(6470, 'var LGMKT_OFF=true;', 'var LGMKT_OFF=__CFG__("LGMKT_OFF");'),
                          (3812, 'const APPV=245;', 'const APPV=__CFG__("APPV");')]:
    l = line_sub.get(lineno, L[lineno - 1])
    assert l.count(old) == 1
    line_sub[lineno] = l.replace(old, new_)
line_sub[ENG_LINE] = 'const ENGINE_SRC=__ENGINE_SRC__;'


def lines_text(a, b):
    return ''.join(line_sub.get(i, L[i - 1]) + '\n' for i in range(a, b + 1))


# ---------- 4) 엔진 파일 ----------
ENG = [(286, 773, '10_e3_zone.js'), (774, 777, '20_pos5.js'), (778, 781, '30_dec5.js'),
       (782, 813, '40_e5_outcome.js'), (814, 1844, '50_e4_continuous.js')]
assert ENG[0][0] == E0 and ENG[-1][1] == E1
for (a, b, f), nx in zip(ENG, ENG[1:] + [(E1 + 1,)]):
    assert b + 1 == nx[0]
    w('engine/' + f, lines_text(a, b))
w('engine/order.txt', ''.join('engine/' + f + '\n' for _, _, f in ENG))

# ---------- 5) 앱 파일(기존 순서 그대로) ----------
SEC = [  # (첫 줄, 파일명)
    (212, '0000_data_G.js'), (213, '0010_data.js'), (227, '0020_util.js'), (252, '0030_state.js'),
    (268, '0040_calendar.js'), (285, '0050_engine_header.js'), (286, '@engine'), (1845, '0060_engine_glue.js'),
    (2002, '0070_growth.js'), (2234, '0080_transfer.js'), (2303, '0090_ai.js'), (2363, '0100_season.js'),
    (2424, '0110_match_screen.js'), (2696, '0120_view2d.js'), (2789, '0130_view2d_v4.js'),
    (2839, '0140_position_report.js'), (3117, '0150_screens.js'), (3180, '0160_tactics.js'),
    (3434, '0170_setpiece.js'), (3684, '0180_events.js'), (3814, '0190_career.js'),
    (4033, '0200_div2_promotion.js'), (4166, '0210_euro_leagues.js'), (4223, '0220_cups.js'),
    (4330, '0230_div2_playoff.js'), (4385, '0240_uefa_comps.js'), (4527, '0250_foreign_career.js'),
    (4577, '0260_save_storage.js'), (4604, '0270_awards.js'), (4690, '0280_training.js'),
    (4778, '0290_finance.js'), (4845, '0300_press.js'), (4926, '0310_negotiation.js'),
    (5003, '0320_youth_story.js'), (5030, '0330_media.js'), (5062, '0340_board_goals.js'),
    (5097, '0350_suspension.js'), (5147, '0360_comp_theme.js'), (5188, '0370_trade.js'),
    (5246, '0380_fee_discount.js'), (5276, '0390_player_analysis.js'), (5364, '0400_playlog.js'),
    (5455, '0410_ai_shapes.js'), (5476, '0420_value_revalue.js'), (5521, '0430_loans.js'),
    (5635, '0440_reserves.js'), (5675, '0450_div3_es.js'), (5776, '0460_div3_others.js'),
    (5814, '0470_market_search.js'), (5870, '0480_v149_recent5.js'), (5880, '0490_v151_recovery.js'),
    (5886, '0500_v156_chemistry.js'), (5956, '0510_v159_wage_cap.js'), (6026, '0520_v161_live_analysis.js'),
    (6040, '0530_v161_money_input.js'), (6065, '0540_v164_ai_manager.js'), (6121, '0550_v170_aggregate.js'),
    (6134, '0560_v171_foreign_apply.js'), (6271, '0570_v216_ui.js'), (6287, '0580_v216_scout_age.js'),
    (6307, '0590_v216_history.js'), (6335, '0600_v218_ai_club.js'), (6537, '0610_v239_replay2d.js'),
    (6627, '0620_v241_all_league_engine.js'), (6707, '0630_v247_revenue_scr.js'),
    (6769, '0635_data_tocal_kits_look.js'), (6770, '0640_replay3d.js'), (7137, '0650_v178_player_model.js'),
    (7204, '0655_data_wmap.js'), (7205, '0660_start_map.js'), (7262, '0670_breaking_popup.js'),
]
order = []
for (a, f), nx in zip(SEC, SEC[1:] + [(A1 + 1, None)]):
    b = nx[0] - 1
    if f == '@engine':
        assert (a, b) == (E0, E1); order.append('@engine'); continue
    w('app/' + f, lines_text(a, b)); order.append('app/' + f)
w('app/order.txt', ''.join(x + '\n' for x in order))

w('build_config.json', json.dumps({
    "dev": {"APPV": 245, "LGMKT_OFF": True},
    "deploy": {"APPV": None, "LGMKT_OFF": False}
}, ensure_ascii=False, indent=1) + '\n')
print('ok', len(order), 'app parts,', len(data_files), 'data files')
