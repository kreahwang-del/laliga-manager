// 같은 시드 경기 해시: 화면 엔진(E4/E3) vs 워커 엔진(ENGINE_SRC)
// node matchhash.js <html> [N=12] [shot.png]
// 출력(JSON): 경기별 스코어 + 결과 전체(JSON) sha256, 화면 엔진·워커 엔진 각각, 둘의 일치 여부
const path = require('path'), fs = require('fs'), crypto = require('crypto');
const {chromium} = require(path.resolve(__dirname, '../../tools/node_modules/playwright-core'));
const HTML = path.resolve(process.argv[2]), N = +process.argv[3] || 12, SHOT = process.argv[4];
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
(async () => {
  const b = await chromium.launch({channel: 'chrome'});
  const pg = await b.newPage({viewport: {width: 390, height: 844}});
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.route(/tmssl|transfermarkt|googleapis|gstatic/, r => r.abort());
  await pg.goto(require('url').pathToFileURL(HTML).href); await pg.waitForTimeout(1500);
  if (SHOT) await pg.screenshot({path: SHOT});
  const out = await pg.evaluate(async N => {
    // 결과에 순환 참조가 있어 화면·워커 양쪽에서 같은 직렬화 함수 사용(이미 본 객체는 '[ref]')
    const SER = "function __ser(r){var seen=new WeakSet();return JSON.stringify(r,function(k,v){if(v&&typeof v==='object'){if(seen.has(v))return '[ref]';seen.add(v)}return v})}";
    const __ser = (0, eval)('(' + SER + ')');
    // 새 게임 생성·팀 구성도 난수를 쓰므로 시작 전에 고정
    let gx = 12345; Math.random = () => { gx = (gx * 16807) % 2147483647; return gx / 2147483647 }; RSEED = 1;
    UI.mode = 'club'; UI.nm = 't'; startGame(LIGA[0]); window.save = () => {};
    // 리그 1~2라운드 경기에서 N개 선택(두 팀 구성은 화면 쪽 teamFor 그대로)
    const fx = S.fixtures.filter(f => !f.cup && !f.res).slice(0, N);
    const jobs = fx.map(f => {
      const H = teamFor(f.h), A = teamFor(f.a);
      aiMarking(H, A); aiMarking(A, H);
      const cf = engCfg(H, A), lg = cf ? engLg(H, A) : null;
      return {h: f.h, a: f.a, H: cf ? engShift(H, lg) : H, A: cf ? engShift(A, lg) : A,
              o: Object.assign({derby: !!derbyOf(H.club, A.club)}, cf ? {cfg: cf} : {})};
    });
    const E = ENGINE === 4 ? E4 : E3;
    // 입력을 구조화 복제해서(워커와 같은 조건) 화면 엔진으로 계산
    const page = jobs.map((j, k) => {
      let x = 123456789 + k * 7919; const rnd = () => { x = (x * 16807) % 2147483647; return x / 2147483647 };
      const r = E.simulate(structuredClone(j.H), structuredClone(j.A), Object.assign({rnd}, j.o));
      return __ser(r);
    });
    // 워커: ENGINE_SRC 그대로 + 경기마다 같은 시드 rnd
    const src = 'var window=self;' + ENGINE_SRC + '\n' + SER + '\nself.onmessage=function(e){var d=e.data;var x=123456789+d.k*7919;var rnd=function(){x=(x*16807)%2147483647;return x/2147483647};var o=d.o;o.rnd=rnd;try{var r=(d.eng===4?E4:E3).simulate(d.H,d.A,o);postMessage({k:d.k,res:__ser(r)})}catch(err){postMessage({k:d.k,err:String(err&&err.stack||err)})}}';
    const w = new Worker(URL.createObjectURL(new Blob([src], {type: 'text/javascript'})));
    const work = await Promise.all(jobs.map((j, k) => new Promise(res => {
      const h = e => { if (e.data.k === k) { w.removeEventListener('message', h); res(e.data.res || ('ERR ' + e.data.err)) } };
      w.addEventListener('message', h); w.postMessage({k, eng: ENGINE, H: j.H, A: j.A, o: j.o});
    })));
    w.terminate();
    return {engine: ENGINE, appv: typeof APPV !== 'undefined' ? APPV : null,
            lgmkt: typeof LGMKT_OFF !== 'undefined' ? LGMKT_OFF : null,
            rows: jobs.map((j, k) => ({h: j.h, a: j.a, page: page[k], work: work[k]}))};
  }, N);
  const rows = out.rows.map(r => {
    const P = JSON.parse(r.page), W = r.work.startsWith('ERR') ? null : JSON.parse(r.work);
    return {h: r.h, a: r.a, sc: P.sc, scW: W && W.sc, page: sha(r.page).slice(0, 16), work: sha(r.work).slice(0, 16), same: r.page === r.work};
  });
  const all = sha(out.rows.map(r => r.page).join('|'));
  console.log(JSON.stringify({html: HTML, engine: out.engine, appv: out.appv, lgmkt: out.lgmkt, n: rows.length,
    pageAll: all, workAll: sha(out.rows.map(r => r.work).join('|')), allSame: rows.every(r => r.same), errs: errs.slice(0, 3), rows}, null, 1));
  await b.close();
})();
