# -*- coding: utf-8 -*-
"""월드 사커매니저 빌드: src/ → 단일 HTML (Python 표준 라이브러리만)

  python src/build.py                       → src/dist/cur.html   (개발값: build_config.json "dev")
  python src/build.py --deploy --appv 247   → src/dist/index.html (배포값: "deploy" + APPV)
  옵션: -o 출력 경로, --appv N(개발 빌드에도 적용), --check 비교할 HTML(바이트 비교·sha256 출력)

조립 규칙
  page.html          페이지 틀. @@CSS@@ · @@APP@@ · @@ASSET:<방식>:...@@ 를 채움
  app/order.txt      메인 스크립트 결합 순서. 한 줄에 파일 하나(src 기준 경로), '@engine' = 엔진 본문
  engine/order.txt   엔진 본문 결합 순서. 화면 엔진(E3/E4)과 워커용 ENGINE_SRC 가 이 하나에서 생성됨
  __DATA__("이름")    → data/<이름>.json 내용에서 줄바꿈(\\n, \\r)만 지운 원문
  __CFG__("키")       → build_config.json 값(JSON 표기)
  __ENGINE_SRC__      → 엔진 본문의 JSON 문자열(ensure_ascii=False)
  모든 텍스트 입력에서 \\r 은 지움(원본은 LF 전용 → Windows autocrlf 대비)
"""
import argparse, base64, hashlib, json, os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))


def rd(rel):
    return open(os.path.join(ROOT, rel), encoding='utf-8', newline='').read().replace('\r', '')


def rdb(rel):
    return open(os.path.join(ROOT, rel), 'rb').read()


def order(rel):
    return [x.strip() for x in rd(rel).split('\n') if x.strip() and not x.lstrip().startswith('#')]


def build(cfg):
    def data(m):
        return rd('data/%s.json' % m.group(1)).replace('\n', '')

    def subst(t):
        t = re.sub(r'__DATA__\("([^"]+)"\)', data, t)
        return re.sub(r'__CFG__\("([^"]+)"\)', lambda m: json.dumps(cfg[m.group(1)]), t)

    engine = ''.join(subst(rd(f)) for f in order('engine/order.txt'))
    pal = json.loads(rd('app/theme_bplus_palette.json')) if os.path.exists(os.path.join(ROOT, 'app/theme_bplus_palette.json')) and os.path.exists(os.path.join(ROOT, 'app/theme_bplus.css')) else None
    def palette(f, t):
        # B+ 테마 전용: 예전 색 리터럴을 새 팔레트로(데이터 파일·엔진 제외). 테마 파일이 없으면 아무것도 안 바꿈
        if not pal or f in pal.get('skip', []):
            return t
        for a, b in pal['map'].items():
            t = re.sub(re.escape(a), b, t, flags=re.I)
        return t
    app = ''.join(engine if f == '@engine' else palette(f, subst(rd(f))) for f in order('app/order.txt'))
    assert app.count('__ENGINE_SRC__') == 1
    app = app.replace('__ENGINE_SRC__', json.dumps(engine, ensure_ascii=False))
    for tok in ('__DATA__(', '__CFG__('):
        assert tok not in app, tok + ' 남음'

    def asset(m):
        kind, arg = m.group(1), m.group(2)
        if kind == 'text':
            return rd('assets/' + arg)
        if kind == 'b64':
            return base64.b64encode(rdb('assets/' + arg)).decode()
        if kind == 'dataurl':
            mime, f = arg.split(':', 1)
            return 'data:%s;base64,%s' % (mime, base64.b64encode(rdb('assets/' + f)).decode())
        raise ValueError(kind)

    page = rd('page.html')
    page = re.sub(r'@@ASSET:(\w+):([^@]+)@@', asset, page)
    for tok, val in (('@@CSS@@', palette('app/style.css', rd('app/style.css')) + (('\n/* ==== theme_bplus.css ==== */\n' + rd('app/theme_bplus.css')) if os.path.exists(os.path.join(ROOT, 'app/theme_bplus.css')) else '')), ('@@APP@@', app)):
        assert page.count(tok) == 1, tok
        a = page.index(tok)
        page = page[:a] + val + page[a + len(tok):]
    return page


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--deploy', action='store_true')
    ap.add_argument('--appv', type=int)
    ap.add_argument('-o', '--out')
    ap.add_argument('--check')
    a = ap.parse_args()
    try:
        sys.stdout.reconfigure(encoding='utf-8'); sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass
    conf = json.loads(rd('build_config.json'))
    cfg = dict(conf['dev'])
    if a.deploy:
        cfg.update({k: v for k, v in conf['deploy'].items() if v is not None})
        if a.appv is None:
            sys.exit('--deploy 에는 --appv 가 필요함')
    if a.appv is not None:
        cfg['APPV'] = a.appv
    out = a.out or os.path.join(ROOT, 'dist', 'index.html' if a.deploy else 'cur.html')
    b = build(cfg).encode('utf-8')
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    open(out, 'wb').write(b)
    print('%s  %d bytes  sha256=%s  cfg=%s' % (out, len(b), hashlib.sha256(b).hexdigest(), json.dumps(cfg)))
    if a.check:
        c = open(a.check, 'rb').read()
        same = c == b
        print('check %s  sha256=%s  %s' % (a.check, hashlib.sha256(c).hexdigest(), '동일' if same else '다름'))
        if not same:
            i = next((k for k in range(min(len(b), len(c))) if b[k] != c[k]), min(len(b), len(c)))
            print('첫 차이 바이트', i, c[max(0, i - 60):i + 60], b[max(0, i - 60):i + 60])
            sys.exit(1)


if __name__ == '__main__':
    main()
