// 화면 스크린샷(시작·홈·전술) — 같은 시드로 새 게임 후 탭 전환
// node shots.js <html> <out_prefix>
const path = require('path');
const {chromium} = require(path.resolve(__dirname, '../../tools/node_modules/playwright-core'));
const HTML = path.resolve(process.argv[2]), PRE = process.argv[3];
(async () => {
  const b = await chromium.launch({channel: 'chrome'});
  const pg = await b.newPage({viewport: {width: 390, height: 844}});
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.route(/tmssl|transfermarkt|googleapis|gstatic/, r => r.abort());
  await pg.goto(require('url').pathToFileURL(HTML).href); await pg.waitForTimeout(1500);
  await pg.screenshot({path: PRE + '_start.png'});
  await pg.evaluate(() => {
    let gx = 12345; Math.random = () => { gx = (gx * 16807) % 2147483647; return gx / 2147483647 }; RSEED = 1;
    UI.mode = 'club'; UI.nm = 't'; startGame(LIGA[0]); window.save = () => {}; UI.tab = 'home'; render();
  });
  await pg.waitForTimeout(800); await pg.screenshot({path: PRE + '_home.png'});
  await pg.evaluate(() => { UI.tab = 'tac'; render() }); await pg.waitForTimeout(800);
  await pg.screenshot({path: PRE + '_tac.png'});
  console.log(JSON.stringify({html: HTML, errs}));
  await b.close();
})();
