# UI Inventory — single-HTML mobile football manager (`/home/claude/devwt/src`)

Read-only audit for the redesign. Source: `app/*.js` in `app/order.txt` order, `app/style.css`, `page.html`.
All paths below are relative to `/home/claude/devwt/src/app/`. `file:line` = line in the source file (lines are long, so one line can hold a whole template).

How to read this:
- **Final renderer** = the function after every monkey patch (`{const _x=fn;fn=function(){...}}`) has run. The wrap chain is listed in load order, so the last entry runs outermost.
- **Info** = something the user reads (label → data source).
- **Control** = something the user taps, shown as its exact `data-*` attribute → what it does. Most controls are routed by the global click handler `0180_events.js:3-102`. Many later files add their own **capture-phase** handlers that call `stopPropagation()`, and those win.
- **Cond.** = when the element is shown.
- **Long text** = player or club names and other strings that can run long, and how the space they sit in is limited.

---

## 0. Global frame and shared primitives

### 0.1 Page shell
- `page.html`: `<div id="app">` is the only mount point. Fonts are Barlow Condensed (numbers, `--disp`) and IBM Plex Sans KR (body). `theme-color` is `#0D1318`.
- `render()` at `0150_screens.js:3` builds `header.top` + `main.wrap` + `div.go` + `nav.nav` with innerHTML.
  - Wrap chain: `0110:232` (in-match tactics edit mode replaces the whole app), `0620:33` (prefetch timer only), `0620:111` (on entering the tactics tab, resets `TAC.phase='base'`), `0640:14` (redraws the 3D replay bar during a match).
- Sheets: `sheet(html)` at `0170:173` creates `div.scrim#scrim > div.sheet[role=dialog]`. `closeSheet()` is at `0170:174`.
  - Tapping the scrim closes the sheet, except while a match is paused (`0180:4`).
  - Any `[data-close]` button closes the sheet (`0180:14`).
- Overlays created outside `#app`:
  - `.toast` (`0020:21`): auto-hides after 2.8 s, `bottom:130px`.
  - `.busy` (`0100:24`): text "진행 중…", "다른 경기 진행 중… (N경기)", or "다른 리그 경기 계산 중…".
  - `#match` (`0110:17`).
  - `#rpv`: 2D replay (`0610:38`).
  - `#r3ov`: 3D replay (`0640:168`).
  - `.dragghost`: tactics drag (`0160:208`).
  - `#ythTag`, `#anaBtns`, and similar are injected into sheets.
- Z-stack: `.top` 5, `.go` 5, `.nav` 6, `.scrim` 20 (raised to 35 at `style.css:195`), `.match` 30, `.toast` 40, `.busy` 50, `.dragghost` 60, `#rpv` 80, `#r3ov` 9999.

### 0.2 Shared helpers (they emit markup and are reused on every screen)
| helper | file:line | output | long-text handling |
|---|---|---|---|
| `crest(c,cls)` | `0020:18` | `span.crest` with an **inline** `linear-gradient(135deg,a 50%,b 50%)` and an inline ink color from `clubCol()` (`0010:12`, `0560:71`). Shows a TM logo `img` when `IMG.on`; otherwise `<b>` with `CLUBS[c].short`. | `short` is a 3-letter code, so fixed width |
| `avatar(p,cls)` | `0020:17` | `span.av[.sm/.lg]`: TM portrait `img` or initial letter | – |
| `posTags(p)` | `0140:5` | `span.ptag.m` (main position) plus extra `span.ptag` (up to 3). The squad list trims to 2 + "+N" (`0570:12`). | – |
| `rowP(p,right)` | `0170:131` | `button.li[data-player]`: avatar, `.pos.{g}`, `.nm > b` name, and a line "club · age · value · ~contract year". Then the optional right pill, then `.ovr` (exact number or range "64-72" via `ovrShown`/`know`, `0170:130` → `0580:11`). | `.nm b` ellipsis; `.nm span` wraps |
| `money()` / `mM()` | `0020:6-7` → `0560:126` | € formatting. Korean clubs use **원** and Japanese clubs use **엔** (`krwFmt`/`jpyFmt`), which gives **longer strings** such as "1,234억원". | used inside `.facts b{white-space:nowrap}`, so it can overflow |
| `cnd(p)` | `0060:7` | condition arrow `↑↗→↘↓` + color (`CONDS`: `var(--good)`, **`#9CCB6A`**, `var(--muted)`, `var(--warn)`, `var(--bad)`) | – |
| `stars()` / `stars5()` | `0090:58`, `0160:74` | ★ text, `.stars .off` | – |
| `shortName()` | `0020:22` | surname only (handles Jr / de / van) | used for most width-limited labels |
| `verTag()` | `0560:118` | "월드 풋볼 매니저 · 버전 vN" footer (home, start, career) | – |

---

## 1. Home / dashboard (tab `home`)

**Final renderer**: `homeView` `0150:28`. Wrap chain:
1. `0140:162`: last-match report card
2. `0190:172`: unemployed mode → `unempHome()`; otherwise board card
3. `0300:53`: keeps press / renewreq / media / loanopt messages unread
4. `0400:87`: "확인할 소식" section
5. `0480:9`: recent-5 form strip
6. `0550:11`: second-leg line
7. `0560:119`: version tag

Layout order in the final DOM:
1. window banner
2. fixture card (+ form strip, + 2nd-leg line)
3. last report card
4. board card
5. 확인할 소식
6. 받은 소식
7. 순위 mini-table
8. version tag

| # | Info item | Source | Cond. |
|---|---|---|---|
| 1 | Open window banner `.banner.open`: "겨울/여름 이적시장 · {date} 마감" + `D-n` (`.num`, inline font-size 17px) | `winNow()` | window open |
| 2 | Closed banner `.banner.closed`: "다음 이적시장 {date} 개장" + `D-n` | `nextWin()` | otherwise, if a next window exists |
| 3 | Fixture card `.card.fixture` header: "{r}라운드" / `cupLabel()` / "프리시즌 친선경기" · date, and "홈/원정" | next of friendly / league / cup (`up`) | if a next fixture exists |
| 4 | `.vs`: home crest + **club name**, "VS", away crest + **club name** | `CLUBS[up.h/a].name` | 〃 |
| 5 | Note "오른쪽 아래 '계속'을 누르면…" (centered). **This is a string anchor for later patches.** | static | 〃 |
| 6 | "최근 5경기" two-column strip: result chip 승/패/무 (inline bg `var(--good)` / `var(--bad)` / **`#8A8F98`**, text `#fff`), opponent short name, title tooltip, "과거 → 최근" | `last5()` (`0480:2`) | 〃 |
| 7 | "2차전 · 1차전 {h} x-y {a}" (amber) | `legFirst()` (`0550:2`) | if the next fixture is a 2nd leg |
| 8 | Empty-state card "남은 경기가 없습니다…" | – | no fixture |
| 9 | Last report card: opponent crest, "지난 경기 x:y", "xG a-b", `R.head` (ellipsis), button "리포트" | `S.reports[0]` | a report exists for the current club, dated after `S.me.since` |
| 10 | Board card: "이사회 신뢰도 {n}" (color via `trustCol`), status 최후통첩 / 경고 / 안정, bar (`tbar`, inline color), "목표 {lb} · 현재 {pos}위 · 계약 {date}" | `S.me.trust`, `S.exp` | employed |
| 11 | "확인할 소식 N건" h2 with an inline red dot + `.card.inbox.unrd` list | unread `S.inbox` | if any are unread |
| 12 | "받은 소식" + `.card.inbox` of the first 25 messages (see §11) | `S.inbox` | always |
| 13 | "순위 · {pos}위" + compact table (rows pos−3 … pos+2; columns # / 구단 / 경기 / 득실 / 승점) | `table()` | after the first result |
| 14 | Version tag | `APPV` | always |

**Unemployed home** (`unempHome` `0190:167`):
- "무소속" card with `name · 평판 n(tier)` and a button "감독 탭 · 공석 N곳" (`data-tab="career"`).
- 받은 소식.
- Full league table (top 20, compact).

| Control | Action |
|---|---|
| `data-act="lastrep" data-i="0"` | opens `reportSheet(S.reports[i])` (`0180:100`) |
| `data-tab="career"` (unemployed only) | switches tab |
| message actions | see §11 |

Side effects: rendering `homeView` marks every non-actionable message as read (`0150:33`). `0300` and `0190` keep some types unread.

Long text:
- `.vs .team` club names wrap with no ellipsis (14px, 600 weight).
- The last-report head line has ellipsis.
- Table `td.t` is nowrap inside `.tbl-wrap` (horizontal scroll).

---

## 2. Squad list + player detail sheet (tab `squad`)

### 2a. Squad list
**Final renderer**: `squadView` `0150:53`. Wrap chain:
1. `0280:64`: `sqTabs` + training view switch
2. `0300:70`: mgmt view switch (`sqTabs` redefined at `0300:69` with 3 tabs)
3. `0440:36`: 2군 section appended
4. `0450:95`: B-team note inserted before `<h2>2군 (`
5. `0570:12`: regex trims ptags to 2, rewrites the note

| Info | Source / notes |
|---|---|
| Sub-tab chips "선수단 / 훈련·코치진 / 선수 관리" | `UI.sqv` |
| Position filter chips "전체 / GK / DF / MF / FW" | `UI.sq` |
| Note "연봉 총액 X / 한도 Y · 오른쪽: 능력치 · 컨디션(화살표) · 체력%…" | `wageBill`, `CLUBS[].wageCap` |
| Row `button.li[data-player]`: avatar(sm) | – |
| ┗ **name** (`.nm b`, ellipsis) + inline "선발" tag (`color:var(--amber);font-size:11px`) | `S.xi` |
| ┗ `.sub2` line (nowrap + ellipsis): posTags (≤2, +N) · age · wage/년 · ~contract year · injury "부상 n일 · m/d 복귀" (inline `var(--bad)`) | `injLeft`/`injRet` (`0600:80`) |
| ┗ pills: `.pill.y` "판매"; `.pill.n` "보통" / `.pill.r` "불만" (happy < 60) | `p.listed`, `p.happy` |
| ┗ `.rcol`: `.ovr` number (`hi`/`lo` class) and small "{cond arrow (inline color)} {fit}%" | – |
| 2군 h2 "2군 (N명) · 1군 등록 a/b" + note + rows (`rowP` with pill "U23/23+ · n경기 m분") or empty text | `resList`, `RES_REG` (`0440:36`) |
| B-team note "B팀 {name} · {league} {rank}위 ({pts}점)…" | `es3BOf` (`0450:95`) |

Controls:
- `data-sqv="sq|trn|mgmt"` (capture, `0280:65`)
- `data-sq="ALL|GK|DF|MF|FW"`
- `data-player="{id}"` → `playerSheet`

**Training view** `trView` `0280:45` (shown when `UI.sqv==='trn'`):
- Info:
  - focus chips: 균형 / 공격 / 수비 / 피지컬 / 전술 / 세트피스 / 회복 (`TR_FOC`)
  - intensity chips: 낮음 / 보통 / 높음
  - five growth rows with `+n%` (inline green / red / muted)
  - 체력 회복 "+x/일"
  - 부상 위험 "×n" (inline color)
  - 전술 숙련 "+x/주"
  - explanatory note
  - 코치진 list: avatar initial, **name**, role · age · 연봉, rating `.ovr`
  - hire list (when open): candidate name, age, wage, fee, required reputation, 영입 / 관심 없음
- Controls:
  - `data-trf="{key}"`
  - `data-tri="0|1|2"`
  - `data-sthire="{role}"` opens the candidate list; `data-sthire=""` closes it
  - `data-stsign="{staffId}"`

**Management view** `mgView` `0300:61` (+ `0330:31` media log):
- Mood card: average 만족도 (inline color), condition distribution (inline `x.c` colors), bar.
- Rows `div.li`:
  - name button (`data-player`) with avatar
  - "{pos} · 만족 {h} (inline color) · 컨디션 {arrow} · 최근 평점 · 기대 {role} · 계약 {yyyy}" + last talk result
  - buttons 칭찬 / 격려 / 질책 (`data-talk="praise|enc|crit" data-pid`), or "면담 완료" (21-day cooldown)
- Section "언론·이정표 기록": 40 rows of text + date.

### 2b. Player detail sheet
**Final renderer**: `playerSheet(id)` `0170:175`. Many later patches inject DOM after render. Wrap chain:

| Wrap | What it does |
|---|---|
| `0320:22` | `#ythTag` "유스 · {club} 아카데미 {y}년 입단 · 1군 데뷔…" after `h3` |
| `0390:84` | `#anaBtns` "경기 분석 (히트맵·패스)" `data-anabtn` / "스카우트 분석" `data-scana` after `h3` |
| `0430:61` | relabels the `loanout` button "임대 명단에 올림/제외" and enables it |
| `0430:95` | adds a row "계약 해지(방출)" `data-relopen` after the actions row |
| `0440:30` | adds a row "1군으로 올리기 / 2군으로 내리기" `data-res` + status note |
| `0470:55` | replaces the first token of the header note with the sub-position name (finds the leaf containing "{age}세 ·") |
| `0500:47` | appends a `.card.pad` "호흡": top 3 mates with score (inline `relCol`), awkward mates, most-pass partners |
| `0580:15` | `.ksnap` scout-report age note after `h3` |
| `0590:8` | `.pshw` "시즌별 기록" table, appended at the end (its anchor lookup fails, so it falls back) |
| `0600:83` | `.injw` "🩹 부상 · 남은 기간 · m/d 복귀 예정" or "🟥 출장 정지" before the 능력치 facts |
| `0600:180` | `.ssw` "이번 시즌 기록" rows before `.pshw` |

Base content, in order:

| # | Info | Source | Cond. |
|---|---|---|---|
| 1 | `button.x` "닫기" (`data-close`) | – | – |
| 2 | Note: position name (sub-position) · age · nationality · foot · height | `GN`, `subPos`, `p.nat`/`foot`/`h` | – |
| 3 | `.phead`: avatar(lg), `h3` **name** (+ "(추정)"), crest(xs) + club name · league, or "자유계약" / "은퇴" reason | `clubOf` | – |
| 4 | `posLine`: "가능 포지션(최근 3시즌 선발 기준)" pills "{pos} {pct}% · n경기" (`.pill.g`/`.y`, inline margin) or the fallback text | `p.pos2` | – |
| 5 | `devLine` (`0070:227`): 유스 등급 (amber), legend tag, "이번 시즌 능력 ▲x", 성장형 | `S.ps` | – |
| ┗ | `habLine` (`0140:228`): "플레이 성향" ptags (많음/적음, ▲▼) | `p.hab`/`p.dh` | – |
| ┗ | `styleLine` (`0140:245`): "선수 유형 {role}", ★ signature ptag, trait ptags (`data-trd`, tap → `.trdesc` explanation box with inline `background:var(--line)`) | `pstOf` | – |
| 6 | `.facts` ×6: 능력치 (exact or range), 잠재력 (★, amber inline), 시장가치, 연봉(추정), 계약 만료, 바이아웃 | `ovrShown`, `stars`, `valueNow` | – |
| 7 | "정보 수준 … 범위로 표시" | `know` < 3 | – |
| 8 | h2 "능력치 (20점 만점)" + `.attr` rows (10 outfield / 6 GK): label, `.bar > i` (**inline** width + bg amber/good/faint), value or range | `OUTA`/`GKA` | – |
| 9 | h2 "추가 능력치": 몸싸움, 침착성, 프리킥, 페널티 | – | – |
| 10 | `.facts` ×3: 주발, 약발 ★ (inline faint), 키 | – | – |
| 11 | h2 "이번 시즌" `.facts` ×6: 출전 (선발), 출전 시간, 평균 평점 (amber), 골, 도움, 공격포인트 | `S.ps` | – |
| 12 | "최근 n경기 평점 … · 체력 x%"; "실제 2026-27 기록…" | `recentR`, `s27` | if present |
| 13 | h2 "숨은 정보" `.facts` ×3: 부상 위험, 프로의식, 시장가치 | `know`≥3 | – |
| 14 | "세부 기록이 적어…" | `p.est` | – |
| 15 | Actions (see below) | – | – |
| 16 | Injected cards and sections from the wrap table above | – | – |

Actions, own player (`mine`):

| Control | Action |
|---|---|
| `data-act="renew" data-id` | `renewSheet` |
| `data-act="listtog" data-id` | toggles the sale list (label switches) |
| `data-act="loanout" data-id` | **hijacked** by the `0430:54` capture handler: toggles the loan list, not an instant loan |
| `data-act="talk" data-id` | `talkSheet` |
| `data-res` | 1군/2군 |
| `data-relopen` | `relSheet` |

Actions, other player:

| Control | Action / cond. |
|---|---|
| `data-act="watch"` | label 관심 목록에 추가 / 빼기 |
| `data-act="scout"` | disabled when fully known or already scouting |
| `data-act="offer"` | label varies: 개인 조건 협상 계속 / 자유계약 영입 협상 / 사전 계약 협상 / 이적 제안. Shown only when a window is open or the player has ≤6 months left; otherwise a note. |

Other controls: `data-anabtn`, `data-scana`, `data-trd`, `data-close`.

**Sub-sheets opened from player detail**

- **Renew** `renewSheet` `0170:239` (+ `0310:62/64/72`)
  - facts: 현재 연봉, 계약 만료, 만족도
  - wage stepper `data-r="wage" data-v=-1|1` (enhanced by `0530`: tap to type, drag to adjust)
  - years seg `data-r="years" data-v=1..5`
  - clause seg `data-rcl=1|2|3` (injected before `sendRenew`)
  - `.resp.ok/.mid/.no`
  - `data-act="sendRenew"` (after agreement, replaced by `data-close` "재계약 완료 · 닫기")
- **Talk** `talkSheet` `0170:246`
  - "면담 · 만족도 n", 5 buttons `data-talk="praise|encourage|criticize|promise2|promise1" data-id`
  - ⚠ **Conflict**: the capture handler at `0300:73` grabs `[data-talk]` and calls `mgTalk(+dataset.pid)`, but these buttons have `data-id` and no `data-pid`, so this sheet very likely does not work.
- **Release** `relSheet` `0430:83`
  - facts: 남은 계약, 연봉, 남은 연봉 합계, note with willingness %
  - 3 buttons `data-rel={id} data-k=1|.75|.5` (disabled when over budget)
- **Analysis** `anaSheet` `0390:44` (+ `0520:4` live, `0620:116` GK tab and neighbours)
  - source chips `data-anasrc data-anaid` (last 3 matches / 시즌 누적)
  - tab seg `data-anatab="heat|pass|shot|def|drib" data-anaid data-anasrc0` (GK: "슈팅" becomes "선방")
  - SVG pitch (`background:var(--pitch)`), legends with inline colors
  - pass rose + stats
  - nav "‹ prev name · i/N · next ›" `data-anaswipe=-1|1` + touch swipe
  - `data-anaback` (back) or `data-close`
- **Scout analysis** `scoutAna` `0390:78`: estimated heatmap, trait list (`.rnotes`), real records card.

Long text in the sheet:
- `h3` name: no clamp (wraps).
- Club line in `.note`: wraps.
- `.facts b` is nowrap at 19px in a 3-column grid: €/원/엔 values can overflow.
- Trait ptags wrap.

---

## 3. Tactics (tab `tac`)

**Final renderer**: `tacView` `0160:92`. Wrap: `0500:38` adds a 호흡 선 chip after the 저장 chip, chemistry SVG lines before `#zones`, and a legend note. Set-piece phase: `tacView` → `spView` `0170:27`. Also used in match-edit mode (§4h).

| # | Info | Source | Cond. |
|---|---|---|---|
| 1 | Next-opponent banner `.banner.closed`: "다음 상대 **{club name}** ({rank}위 · 우리 n위) {comp label} · {preset} · {form}" + "숙련도 n" | `oppNext`, `lgRankTxt` (`0360:38`), `nextFxLabel` | opponent exists |
| 2 | Phase seg: 포메이션 / 세트피스 (`tacSeg`). In atk/def mode: subheader "‹ 포메이션으로" + seg 공격 시 / 수비 시 | `TAC.phase` | – |
| 3 | Fold chip "대형 **{form}** · 저장·상대 대형·자동 선발 / 펼치기▼ 접기▲" | `tacFold` | – |
| 4 | (in fold) in-match note on opponent dots (inline `#ffb4b4`) | – | match edit |
| 5 | (in fold) formation chips (all `E3.FORMS`) | `T.form[ph]` | – |
| 6 | (in fold) `.tools` chips: 전술 저장·불러오기, 호흡 선, 상대 대형 (예상 / 최근 10분 · 글자), 15칸 수적 우위, 위치 초기화, 자동 선발, 기준: 균형/포지션/능력치 | – | some conditional |
| 7 | (in fold) `.okline` "배치 기준 대형 X (Y에서 위치를 옮김)"; `.phase-note` | `E3.shapeOf` | – |
| 8 | Ball-position slider (atk/def): "공 위치 · 우리 골문에서 **n m**", `input[type=range][data-hzbx]`, zone chips "우리 진영 25m ● / 중앙 52m / 상대 진영 80m", reset chip | `hzLayout` | atk/def |
| 9 | `.pitch#pitch`: SVG lines; `.hzball`; opponent `.oslot` dots (labels hidden unless `.on`); `.zones` 15-cell grid (+/− values); chemistry lines (inline hex stroke) | – | – |
| 10 | Slot `button.slot[data-slot]`: `.dot` (inline border color = fit good/ok/bad) with ovr, `.cd` condition arrow (inline color), `.mbadge` "M" (man-mark), `.mbadge.pib` PI count; `.lb` **shortName** (max 76px, ellipsis); `.sl` "{slotKey} · {fit}%" + " · 범위 밖" | `S.xi`, `cnd`, `piSum` | – |
| 11 | Selection bubble `.sbub`: "ⓘ 선수 정보" / "교체·역할" | `TAC.sel` | slot selected |
| 12 | Nudge pad `.znud`: name · position text, ▲◀▼▶ | – | atk/def + selected |
| 13 | `.finebtn` "공격·수비 위치 세부 조정 ›" + summary of custom shapes/zones | `tacFineHTML` | base |
| 14 | `.legend`: 최적 / 가능 / 어색 / 컨디션 / 체력 / M 맨마킹 (inline `#5EC2E8`) | static | – |
| 15 | h2 "교체 명단…" + `.bench` horizontal chips `div.bch[data-bench]`: posTags (2 shown), shortName, ovr, cond arrow (inline color), `.inj` 부상/정지 tag (**`.inj` is unstyled**), "ⓘ 정보" | squad not in XI | – |
| 16 | Card "추천 · {club}전": 2 preset recs `.rec(.best)` with reasons + 적용 / 적용 중; recommended lineup `.chg` rows "{slot} A → **B**" + reason | `recTactics`, `recLineup` | opponent |
| 17 | Card "예상 수비 매치업": `.mu` rows "{slot} | me ↔ opp + M | 속도 x vs y · 태클 vs 드리블 | `.vd` 유리▲/비슷●/불리▼" | `defSlots`, `expectedFor` | opponent |
| 18 | Card "세트피스 키커": 4 `.mu` rows (왼쪽 코너, 오른쪽 코너, 프리킥, 페널티킥) with name, 직접 지정 / 자동 선택, stats, "변경" | `T.setp` | – |
| 19 | Card "전술 성향 · 숙련도 n": preset chips (▲▼ inline good/bad), fit note; 6 `.ti` 5-step rows + "역습 전환" on/off; 공격 집중 방향 seg (5); 상대 공략 지시 seg (5) + description; 기본 성향 seg (3); `.warnline` / `.okline` | `T.preset`, `T.ti`, `AF_OPTS` | – |

Controls (all handled at `0180:7-52` unless a file is noted):
- Phase, shape, layout:
  - `data-phase="base|sp|atk|def"`
  - `data-tfold` (capture `0170:119`)
  - `data-shape="{form}"` (also capture `0170:113`, which clears `posZ`)
  - `data-tsets` → `tsetSheet`
  - `data-chem` (capture `0500:44`)
  - `data-showopp` (capture `0170:115`, cycles on → 글자 → off)
  - `data-zones`
  - `data-resetpos` (+ capture `0170:111`)
  - `data-act="auto"`
  - `data-pickm` (capture `0600:91`)
- Ball and zones: `data-hzbx` (input), `data-zsel="{25|52|80}"`, `data-zreset="{D|M|A}"`, `data-znudge="dx,dy"` (capture `0160:22`)
- Slots and bench:
  - `data-slot="{i}"` (tap selects; a second tap opens `openSlot`)
  - drag (`pointerdown` on `.slot`/`.bch`, 280 ms long-press) → swap / sub / move
  - `data-pinfo="{id}"`, `data-slotopen="{i}"`, `data-bench="{id}"`
  - `data-applyxi`
  - `data-preset="{k}"` (also used in recs)
  - `data-mslot="{i}"` → slot sheet on its mark tab
  - `data-kick="cornerL|cornerR|fk|pen"` → `kickSheet`
- Instructions:
  - `data-ti="{0-5}" data-v="1-5"`
  - `data-ti="6" data-v="0|1"`
  - `data-tfocus="null|0|2|4|W"`
  - `data-taf="{''|behind|long|cross|combo}"` (`0170:101`)
  - `data-ment="수비적|균형|공격적"`

**Slot sheet** `drawSlot` `0160:141`:
- Header: slot key, `h3` **name** + "ⓘ 정보" (`data-pinfo`).
- Tabs `data-stab="p|r|i|m"` (선수 선택 / 역할·임무 / 지시● / 맨마킹 [defenders only]).
- Tab p:
  - sort chips `data-sort="fit|ovr|fitness|cond"`
  - pinned current row; rows `.row > .rmain`:
    - checkbox `data-chk`
    - name button `data-open`: posTags, fit pill, age, strengths `.st`, injury/ban, "{slot} 선발"
    - fitness bar (inline color), cond, ovr
  - expanded `diffHTML`: `.dgrid` attribute deltas, `data-pick="{id}" data-i="{slot}"` "선발로 넣기" (disabled when injured or banned), `data-chk` 비교에 추가/빼기
  - `.tray`: "비교: …" + `data-compare` 비교하기
- Tab r (`roleHTML`): position alternates `data-slotas`; 임무 `.duty` `data-duty`; role cards `button.role[data-role]` with ★ and key attrs; 이동 성향 card.
- Tab i (`piHTML`): per-PI `.duty` 3-way `data-pi="{k}" data-v=0|1|2` + hint and description; `data-pireset`.
- Tab m (`markHTML`): seg `data-mk="off|on"`, `data-mkt="0|1"`, expected matchup card with `.dgrid` and `data-mtar`, list of other targets `.mu[data-mtar]`.

**Compare sheet** `drawCompare` `0160:189`:
- `data-back`
- `.cmp-head` `.pc` cards (inline border-top `var(--c1..c3)`, name ellipsis, ovr, age, fit pill, cond)
- SVG radar (`var(--c1..c3)`)
- `.ctab` table
- `data-pick` per candidate

**Kick sheet** `kickSheet` `0160:232`: `data-kickset="{kind}" data-v="{id|''}"`.

**Tactic sets** `tsetSheet` `0160:245`: 3 `.rec` slots A/B/C with date and description; `data-tsave="{i}"`, `data-tload="{i}"` (disabled when empty).

**Set-piece phase** `spView` `0170:27`:
- Cards:
  - 상대 맞춤 추천: `data-sprec="show|auto|off"`
  - 공격 세트피스: SVG pitch with 8 `g[data-spsit]` markers (**inline hex** fills `#F0B429` / `#111` / `#fff`, `var(--pitch,#2c6e3f)`)
  - 수비 세트피스: `.mu[data-spdef]`
  - 스로인·페널티킥: `.mu[data-splt]`, `.mu[data-kick="pen"]`
- Sheets:
  - `spSheet` `0170:53`: `data-spset="{sit}|{key}|{v}"` (auto / taker / type / mode / target / atk / stay); preview SVG with offside line `#ff6b6b`
  - `spRecSheet` `0170:66`: `data-sprec="apply|autoS"`
  - `spDefSheet` `0170:75`: `data-spg="{k}|{v}"`
  - `spLtSheet` `0170:82`: `data-splt2="on|off"`, `data-spthr="{id|''}"`

Long text:
- `.slot .lb` is clamped to 76px with ellipsis (shortName).
- The banner club name wraps.
- `.mu b` wraps.
- `.bch small` holds shortName (bench chip width = content).
- Set-piece SVG labels are positioned text with no clamp.

---

## 4. Live match screen (`#match`, created by `startMatch` `0110:3`)

Wrap chain for `startMatch`:

| Wrap | Effect |
|---|---|
| `0300:77` | pre-match press sheet; can block kick-off |
| `0350:45` | suspension bookkeeping (no UI) |
| `0360:32` | competition theme: `.mth` class, CSS vars `--mta`/`--mtb`/`--mton`, `.mtbadge` |
| `0360:40` | league rank `small.mrk` under team names |
| `0400:8` | play log (no UI) |
| `0610:20` | adds button "복기" (`data-rpopen="live"`) to `#mptab` |
| `0620:25` | prefetch (no UI) |

Other match-screen patches:
- `0550:6` `updateBoard`: `#magg` aggregate line
- `0640:12-17`: `#r3dbar` 3D highlight chips before `#mfd`
- `0620:36` `decOverlay`: big text over `.m2dw`
- `0520:12` `mpst`: names get `data-lana`
- `0130`: 2D v4 renderer (player circles in kit colors, inline hex)

### 4a. Board and pitch
| Info | Source |
|---|---|
| `.mtbadge` competition name with a colored dot | `matchTheme(fx).n` |
| `.board`: home crest + **club name** (+ `.mrk` "리그 n위 · pts점"); `#msc` "x : y" (52px); `#mck` round / cup label / 친선경기 + derby name (amber), then live minute "n'" or "경기 종료"; away team | `CLUBS[].name`, `derbyOf` |
| `#magg` "합계 a : b · 1차전 …" | 2nd leg only |
| `.m2dw > svg#m2d` (pitch `#1f6b3a`, player `g.pl` circles with inline kit color, my side has a `#F0B429` stroke, name text with shortN); `#mcap` caption (`.hot`/`.goal`/`.sys`, `.tag`) | `pitchSVG`, `drawPlayers`, `cap` |
| `.decOv` overlay "✔ 지시 수용 / ✋ 선수 자체 판단 / 🎯 벤치 지시가 골로!…" (inline border color) | `decTrack` |
| `#mst .mstats`: three `.cmp` rows 점유율 / 슈팅 / xG with bars (inline width + amber/faint) | `mstats` |
| `#r3dbar`: "🎥 3D" + chips "{m}' 골/선방/빅찬스 · name" (goals get an inline amber border) | `M.reps` |
| `#mfd .feed`: `.ev` rows (minute `.m` + text `.t`); `.ev.goal`, `.ev.sys`; tags `.tag` 골 / PK / 부상 / 경고 / 퇴장 / 교체 / 프리킥 / 선수 판단 적중 (**inline hex**: `#E8C547`/`#231C02`, `var(--bad)`/`#fff`, `var(--info)`/`#062230`, `var(--surf2)`) | `feed()` `0110:60` |
| `#mptab` 3-way + replay: 중계만 / 우리 기록 / 상대 기록 / 복기 | `UI.mpst` |
| `#mpst` table (sticky header): name + slot + ↑교체 / ↓아웃 + card (inline yellow `#F0B429` / red); 평점, 골, 도움, 선방, 슈팅, xG, 패스, 키패스, 빅찬스, 드리블, 태클, 공중볼, 차단, 파울, 체력 (inline color) | `mpst()` `0110:258` |
| `#mct .mctl`: speed label "속도: 보통/빠르게/느리게/아주 느리게"; 지시; 전술·교체 + `#msl` subs left; 결과 보기 | – |
| After finish: feed summary block (team ratings `.rt` with inline color, attack-direction %, 1v1 duels `.chg` with inline good/bad color) and `#mct` replaced by 경기 리포트 / 확인 | `finish()` `0110:172` |

Controls:

| Control | Action |
|---|---|
| `data-act="speed"` | cycles 1 → 3 → .5 → .25; persists `UI.mspd` |
| `data-act="mshout"` | pause + `shoutSheet` |
| `data-act="msubs"` | pause + `subsSheet` |
| `data-act="skip"` | `finish()`; remaining time is simulated |
| `data-mpst="feed|0|1"` | toggles the stats table |
| `data-rpopen="live"` | opens 2D replay paused (`0610:71`) |
| `data-r3d="{i}"` | 3D replay of that highlight (`0640:18`) |
| `data-lana="{id}"` on table names (pointerup) | live analysis sheet, refreshed every 2 s |
| after finish: `data-act="mreport"` | report sheet |
| after finish: `data-act="closematch"` | removes `#match`, `M=null`, then `hlShow()` |

### 4b. Shout sheet (지시) `shoutSheet` `0110:134` (+ `0620:107`)
- `button.x data-mo="resume"` "닫기"
- 4 buttons `data-mo="shout:push|hold|calm|fire"`: label + sub-note; "적용 중" state is filled; fire shows "남은 n번" and is disabled at 0
- "공격 집중 레인" seg `data-mo="focus:null|0|2|4|W"`
- `.decTog`: "승부처 지시 … 켜짐 · 남은 n번 / 꺼짐" + chip `data-mo="decoffs:1|decon:1"`

### 4c. Tactics and subs sheet `subsSheet` `0110:111`
- Info:
  - "{m}' · x:y · 교체 n장 남음 · 퇴장 n명" (inline red)
  - h3 전술·교체
  - auto-sub chip + note
  - form · preset · 수비 시 · 공격 시
  - `.mpitch` with `button.mp[data-subout]`: `.d` circle (inline border color = stamina) with rating, `.yc` yellow card, `.si` ↑; `.n` shortName (nowrap, **no max-width**); `.k` "{slot} · sta%"
  - made subs as `.keys .st` "m' in ⟵ out"
- With an outgoing player selected:
  - "나갈 선수 **name** ({key}) → …"
  - list `button.li[data-subin][data-subout]` (posTags, fit pill, 컨디션, 체력, ovr)
- Otherwise:
  - "빠른 교체 추천" `.qs` rows (out → in, reason) + `data-qsub="{out}:{in}"`
  - `data-qsuball="1"` "추천 n명 한 번에 교체"
  - note
- Controls:
  - `data-mo="resume"` (x "경기 재개")
  - `data-mo="autosub"`
  - `data-subout`, `data-subin`, `data-qsub`, `data-qsuball`
  - `data-medit="open"` "전체 전술 화면 (경기 전과 같은 설정)"
  - `data-act="mtac"` 성향·대형 빠른 변경
  - `data-act="mshout"` 터치라인 지시

### 4d. Quick tactics sheet `mtacSheet` `0110:137`
- `data-mo="resume"` 닫기
- saved sets `data-mo="tset:{0-2}"` (label 전술 A/B/C + `tsetDesc`)
- 기본 대형 chips `data-mo="base:{form}"` (disabled with 10 men)
- 성향 chips `data-mo="preset:{k}"`
- 상대 공략 chips `data-mo="af:{v}"`
- 수비 대형 `data-mo="def:{form}"`
- 공격 대형 `data-mo="atk:{form}"`
- note

### 4e. Moment sheet kinds `momentSheet(kind)` `0110:87` (+ `0620:108` routes `dec`)
Every kind is prefixed with a right-aligned `.pill.n` "경기 일시정지". Options use `opt()` = `button.btn.ghost[data-mo]` with `b` label + `.note` sub.

| kind | Trigger | Content / controls |
|---|---|---|
| `pen` | we win a penalty | "{m}' · 페널티킥을 얻었습니다", h3 키커를 고르세요; 6 rows `button.li[data-pk="{id}"]` (avatar, `.pos`, name + "지정 키커" (inline amber), 페널티 / 침착성 / 오늘 평점) |
| `half` | 45' | "하프타임 · x : y", h3 팀토크; `data-mo="t_praise|t_calm|t_angry"`; row2 `data-act="msubs"` 교체, `data-act="mtac"` 전술 변경; `data-mo="resume"` "후반 시작" |
| `behind` | 60–75', losing | "{m}' · n점 뒤지고 있습니다"; `data-mo="push"` (hidden if already attacking), `data-mo="sub"` 공격수 투입, `data-mo="resume"` 현 상태 유지 |
| `lead` | ≥70', leading, 15% chance | `data-mo="hold"` / `resume` |
| `red` | our red card | `data-mo="compact"` (5-4-1), `hold`, `resume` |
| `ace` | opponent ace wins ≥3 duels | "상대 X이(가) Y을(를) n번 제쳤습니다"; `data-mo="mark:{name}"`, `resume` |
| `inj` | our injury | 8 bench rows `button.li[data-subin][data-subout]`, or with no subs left a note + `data-mo="resume"` 계속 |
| `gamble` | 80–86', losing — **disabled: `GMB_ON=false`** (`0620:92`) | `gambleSheetHTML` `0620:102`: air / pace comparison, `data-mo="g_all|g_air|g_long"` + `resume` |
| `dec` | engine decision point (fk / corner / def / box / cross / wide), max 3 per match | `decSheet` `0620:84`: context note + h3 "벤치 지시: …"; 3 `button.btn.ghost[data-mo="dec:{id}"]` with `decRL` risk/chance labels (inline good/bad); `#decTm` timer text; time chips `data-mo="dect:10|20|0"`; `data-mo="decoff:1"` 이 기능 끄기; footer note "경기당 최대 3번 · 남은 n번" |

Also: the pre-match press sheet (`0300:77`) "경기 전 기자회견" with `data-prpre="{tone}|skip" data-msg`, and an "injury replacement" sheet.

### 4f. Half-time
Covered by `half` above. Team-talk result shows as a toast, then the sheet re-renders.

### 4g. Penalty
Kicker choice is `pen` above (`data-pk`). Results appear only in the feed (`save`/`miss` with `pen` type texts).

### 4h. In-match full tactics edit (render override `0110:232`)
- `header.top`: "경기 중 전술" (h1 17px), "{m}' · x:y · 교체 n장 · 벤치에서 끌어 넣으면 교체", `data-medit="cancel"` 취소, `data-medit="apply"` 적용.
- `main#meMain`:
  - `.metab` seg `data-mev="us|opp"` + "좌우로 밀어서 전환" (horizontal swipe also switches)
  - `tacView()` (§3), or `oppView` `0110:242`:
    - opponent crest + name, preset / forms / mentality
    - chips `data-oph="base|atk|def"`
    - "실제 배치 X"
    - `.opitch` dots (`.dot` red `#E0685A`, ovr, `.lb` shortName nowrap, `.sl` slot · sta · rating)
    - "상대 오늘 활약" top 3 (name, goals / assists / shots / dribbles / passes, rating)
    - shots / xG / possession line
- No nav or 계속 button in this mode.

### 4i. 2D replay `#rpv` `rpOpen` `0610:32`
- `.rphd`: `#rpsc` "H x - y A", `#rpclk` "mm:ss", `data-rpx` 닫기
- SVG pitch (`#2f7a3b`, GK colors `#E8C547`/`#9C6ADE`, kit colors, my-side stroke `#F0B429`), name labels toggle
- Timeline markers `button.rpm[data-rpm]` (⚽ / 🟥 / ●), `input#rpr` range, fine slider `#rpf` ±15 s
- Controls:
  - `data-rpj="-15|-3|3|15"`
  - `data-rpplay` ▶ 재생 / ❚❚ 멈춤
  - `data-rpspd` (1/2/4/8/16배속)
  - `data-rplbl` 이름
- List `button.li.rpli[data-rpm]` with labels (minute, icon, team, shortName, assist, xG)

### 4j. 3D replay `#r3ov` `r3Open` `0640:167`
- Header overlay (inline styles; theme badge in competition color `TH.a`): minute · team · score, label · name (assist, GK, xG)
- `#r3diag` diagnostics (FPS / model)
- `#r3slow` "슬로모션"
- Bottom chips (`style="color:#fff"`):
  - `data-r3cam="auto|tv|goal|chase|sky"`
  - `data-r3spd` (1/0.5/2배속)
  - `data-r3re` 다시
  - `data-r3x` 닫기

Long text in the match screen:
- `.board .team` club names wrap with no clamp (13px), and the `.mrk` rank text sits under them.
- `.mp .n` and `.opitch .lb` are nowrap with no width limit, so they can overlap.
- The table name column `td.n` is sticky; horizontal scroll exists.
- The `#mcap` caption wraps.
- `.decOv` is capped at max-width 88%.
- `.mctl .btn` labels are nowrap; "전술·교체 5" and "속도: 아주 느리게" are tight on 360px.

---

## 5. Match report (`reportSheet(R)` → `sheet(reportHTML(R))`)

- `buildReport` `0140:26` (data only). Wrap chain: `0390:14` (analysis key `R.ak`), `0400:27` (play log), `0500:55` (`R.rel` pass pairs / switches), `0550:9` (`R.agg`), `0610:27` (`R.rpk` replay key + IDB), `0620:50` (`R.dec`).
- `reportHTML` `0140:111`. Wrap chain: `0400:82` (append 분석실 button), `0500:59` (append pass-link card), `0550:10` (prefix aggregate banner), `0610:83` (prefix 2D replay button), `0620:60` (decision panel inserted after the first `</h3>`).
- `reportSheet` `0140:161` → `0140:174` (stores `UI.curReport`, resets `pstSide`).
- Entry points:
  - match end `data-act="mreport"`
  - home card `data-act="lastrep" data-i`
  - (`S.reports` keeps the last 5)

Final top-to-bottom order:

| # | Info | Source | Cond. |
|---|---|---|---|
| 1 | `data-rpopen="{rpk}"` "⏪ 2D 경기 복기 (전체 타임라인 · 골 · 빅찬스)" | `R.rpk` in `S.rpKeys` | replay stored (last 5) |
| 2 | `.banner.closed` aggregate "합계 …" (amber) | `R.agg` | 2nd leg |
| 3 | `button.x[data-close]` 닫기; note "{r}라운드 / 친선경기 · date" | – | – |
| 4 | `h3`: our crest, score "x : y" (26px), their crest, **opponent club name** (14px) | `R.sc`, `CLUBS[them].name` | – |
| 5 | Decision panel `decRepHTML` `0620:51` (inline border-left color): verdict, counts, per-decision rows (minute, kind · choice, grade (inline color), 지시 수용 / 자체 판단, result) | `R.dec` | decisions were made |
| 6 | One-line verdict `R.head` (bold) | – | – |
| 7 | Timeline `.tl` (left = us, right = them): minute, icon (⚽, `.cd.y`/`.cd.r`, ⇄, ✚, ✋, ✕), shortName text (+PK, 도움, ⟵ out, 부상) | `R.log` via `logHTML` `0140:148` | – |
| 8 | `.cmp` bars: xG, 슈팅, 유효슈팅, 점유율, 파울, 경고, 퇴장 (if any), 코너킥, 오프사이드 (inline letter-spacing hack) | `R.*` | – |
| 9 | "선수 기록 (성공/시도)" + chips `data-pstside="0|1"` 우리 / 상대 + `#pstBox` table `pstHTML` (+ `0390:65` makes names tappable `data-pana data-rk`, adds a hint line); "경기 최우수 **name** r (상대)" | `R.pst`, `R.rat` | if `R.pst`; otherwise `ratHTML` grid with inline rating colors |
| 10 | "전술": "우리 F · P vs 상대 F · P — 상성 우위 / 열세 (inline color) / 중립" | – | – |
| 11 | "공격 전개 (우리 / 상대)" `.rt2` 8 rows (압박 탈취, 1대1 돌파, 마지막 패스 차단, 크로스, 롱볼, 2대1, 역습, 빅찬스) | `traceStats` | – |
| 12 | "방향별 전개" `.lanes` 5 cells (n, xG, goals) | `R.my.lane` | – |
| 13 | "15칸 평균 수적 차이" `.zrow` two `.zmini` grids (`.zg` with `#1f6b3a` bg) | `R.supAtk`/`supDef` | – |
| 14 | "분석" `.rnotes` good / bad / warn bullets | `R.notes` | – |
| 15 | "1대1 매치업" `.chg` rows (inline good / bad color) | `R.duels` | – |
| 16 | "선수" `.rp` rows: avatar, **shortName**, position, `.rnotes` items | `R.ppl` (≤8) | – |
| 17 | "다음 경기 준비" `.rnotes.tips` (tip bullets) | `R.tips` | – |
| 18 | `.nxo` next opponent: crest, "다음 상대 · **club name**", 홈/원정 · date, form · preset · 감독 · 핵심 star name, matchup advice (inline good / bad) | `nextOppInfo` | – |
| 19 | `button.btn.ghost[data-lgopen]` "분석실(누적 전술 진단)" | – | always |
| 20 | Card "패스 연결 상위" pairs "A ↔ B n회" + "위치 스위칭" "A ⇄ B" | `R.rel` | – |

Controls:
- `data-rpopen`, `data-close`, `data-pstside`, `data-pana`/`data-rk` (→ `anaSheet` with back), `data-lgopen`.

**분석실** `lgView` `0400:54`:
- seg `data-lgt="tac|sim|exp"`
- tac: 자동 진단 `.rnotes`, tables by preset·form and by opponent preset (`.pst`), lanes, time buckets
- sim: league sanity rows ("✓ 정상" / "! 범위 밖", inline colors) + engine anomalies
- exp: `data-lgcopy` 로그 복사 + `textarea#lgTxt` (inline styled)

Long text:
- The opponent name sits in `h3` next to two crests and the score, with no clamp (wraps on narrow screens).
- Timeline uses shortName.
- `.pst td.n` is sticky with horizontal scroll.

---

## 6. Transfer market (tab `trans`)

**Final renderer**: `transView` `0170:122`, wrapped by `0600:50` (`watchClean`).

| Info | Notes |
|---|---|
| Banner: open "이적시장 열림 · date 마감" + `D-n`, or closed "이적시장 닫힘 · 검색·스카우트·관심 목록·재계약은 지금도 가능" | `winNow` |
| `.tabs` `data-tt`: 선수 검색 / 관심 목록 `.cnt` / 협상 `.cnt` / 판매·제안 `.cnt` / 이적 소식 | counts |

**Search** `searchView`: fully replaced at `0470:28`.
- `input.search#q` (name; debounced re-render, `0180:2`)
- position chips `data-f="g" data-v`
- sub-position chips `data-f="sp"` (when a line is chosen)
- `data-fopen` 필터 chip with an active-filter summary (capture `0570:10`)
- When open: chip rows for
  - `data-f="ft"` foot
  - `data-f="lg"` league (with league logo `img.lgi`; extra row of non-top-5 leagues)
  - `data-f="age"`, `data-f="price"`, `data-f="sort"`
  - 12 stat filters `data-f="sgl|sas|srt|skp|sbc|saw|scr|stk|sdr|sdw|spp|sit"`
- Note "{n}명 · 능력치 범위는…"
- List of `rowP` rows; the meta line gets " · {sub-position}·{foot}" appended
- `data-act="more"` "더 보기 (n명)"

**Watch list** `watchView` `0170:151`. Wrap chain: `0560:131` (`data-wclr` "관심 목록 비우기 (… n명)", two-tap confirm with inline red), `0580:19` (adds "보고 n개월 전", `.pill.r` "재스카우트"), `0590:26` (error guard).
- Rows `rowP` + pill `.pill.b` 스카우팅 / `.pill.g` 파악 완료.

**Negotiations** `negView`: `rowP` + pill 구단 협상 중 (y) / 개인 조건 협상 (g) / 결렬 (r).

**Sell** `sellView` `0170:155` (+ `0430:64`):
- h2 받은 제안 (`msgHTML` of open offers / clauses)
- h2 판매 명단 (`rowP` + `.pill.y` asking price)
- h2 임대 명단 (`rowP` + `.pill` 유망주 / 임대 가능)
- h2 "임대 보낸 선수 (n/MAX명 …)" (`rowP` + `.pill` "club · role · 분")

**News** `newsView` `0170:158`:
- chips `data-act="newsf"` 주요 소식 / `data-act="newsa"` 전체
- rows `div.li`: **headline** (`b` with `white-space:normal`), date, right `.num` value (감독 / money / 자유)

**Offer sheet** `offerSheet(id)` `0170:208`. Wrap chain:

| Wrap | Injection |
|---|---|
| `0310:13` | agent fee seg `data-tfo="ag"` + clause seg `data-tfo="cl"` before `sendTerms`; loan option seg `data-tfo="lopt"` + stepper `data-tfo="lfee"` before `sendOffer` |
| `0310:70` | pre-contract done → info sheet |
| `0370:25` | trade block before `sendOffer`: player rows `data-tpx` 빼기, `data-tpadd` "+ 우리 선수 추가" → `tdPick` sheet (`data-tpick`, `data-tpback`) |
| `0380:28` | discount note before `sendOffer` (inline `var(--good)`) |
| `0510:46` | budget / wage-cap card after `.facts` (inline red warning) |
| `0600:42` | `data-o="feeset" data-cntset` "상대 희망가로 (…)" |
| `0600:45` | `data-wset` "선수 요구액으로 (…)" |
| `0600:54` | transfer-lock info sheet |
| `0600:63` | `.nfs` "판매 불가 선수…" (inline red) |

Club stage:
- note "{club}에 제안", h3 **player name**
- facts: 시장가치, 우리 예산, 바이아웃
- seg `data-o="loan" data-v=0|1` (완전 이적 / 임대)
- loan: `data-o="share" data-v=50|75|100`
- permanent:
  - stepper `data-o="fee" data-v=-5|5` (value `.v`, money)
  - `data-o="fee" data-v=-1|1`, `data-o="feeset" data-v`
  - `data-o="inst" data-v=1..3`
  - `data-o="sellOn" data-v=0|10|20`
  - "지금 지불…" note
- `.resp`
- `data-act="sendOffer"` (disabled with "예산 부족")
- `data-act="payClause"` (if a clause exists)

Personal stage:
- facts: 현재 연봉, 기대 역할, 연봉 여유
- wage stepper `data-o="wage" data-v=-1|1`
- years `data-o="years"`
- role `data-o="role" data-v=0..2`
- note, `.resp`
- `data-act="sendTerms"`

Steppers get tap-to-type and drag (`0530`, via MutationObserver).

Long text: `rowP` names use ellipsis; the meta line (club · age · value · year + sub-position) wraps; news headlines wrap; the sheet `h3` wraps.

---

## 7. League / table (tab `league`)

**Final renderer**: `leagueView` `0170:162`. Wrap chain:
1. `0140:166`: 도움 순위 tab
2. `0140:198`: 선수 기록 tab; renames 득점 / 도움
3. `0200:131`: 1부 / 2부 switch + note
4. `0210:53`: other-league tabs + `euroView`
5. `0220:101`: 컵대회 tab, `cupView`, cup fixtures
6. `0230:50`: promotion playoff list
7. `0240:136`: 유럽대항전 tab, `euView`, EU fixtures

Row order: competition `.tabs` (`data-elg`: our league / 유럽대항전 / 컵대회 / other leagues), division `.tabs` (`data-ldv`), section `.tabs` (`data-lt`), then content.

| Section | Info | Controls |
|---|---|---|
| 순위표 `lt=table` | `tableHTML` `0170:169`: #, **구단** (`td.t` nowrap), 경기, 승, 무, 패, 득실, 승점 (`td.pts` amber); `tr.me` highlight | – |
| 일정·결과 `fix` | rows "R{n}" (inline muted, 30px), "H x : y A" (short names), date; + h2 컵 경기 / 유럽대항전 경기 lists | – |
| 득점 `sc` | rank, crest, **name**, "n경기 m도움", goals (22px) | `data-player` |
| 도움 `as` | same layout with assists | `data-player` |
| 선수 기록 `ps` | `psHTML` `0140:186`: chips `data-psf="p90:false|true"`, `data-psf="pos:ALL|GK|DF|MF|FW"`; `select#psClub` (inline styled); `.pst` table with sortable `th[data-pss]` (inline amber when sorted); rows `tr[data-player]` with crest + shortName + position | `data-psf`, `data-pss`, `change #psClub`, `data-player` |
| Division note | "1·2위 자동 승격…" / "18~20위 2부 강등" | `data-ldv="1|2"` |
| Playoffs | "승격 플레이오프" tie rows | – |
| Other league `euroView` `0210:49` | table + 득점 순위 + note | `data-elg="{lg}"` |
| Cup `cupView` `0220:88` | cup tabs `data-cup`, 🏆 champion card, rounds (ties `.li`, our tie in inline `var(--surf2)` bg, winner bold / loser muted inline), next-round note, history, rules note | `data-cup` |
| Europe `euView` `0240:124` | comp tabs `data-euk` (UCL/UEL/UECL), 🏆 card, KO rounds, our schedule, league-phase table with an **inline** zone `border-left` (good / amber / faint), league-name small (inline muted), history, note | `data-euk` |

Long text: club names in `td.t` are nowrap and depend on `.tbl-wrap` horizontal scroll. The EU table adds a league name inside `td.t`, which is wider still.

---

## 8. Manager / career tab (tab `career`)

**Final renderer**: `careerView` `0190:176`. Wrap chain:
1. `0260:25`: + 저장 백업
2. `0270:82`: `hofTabs` prefix, or `hofView`
3. `0340:34`: `bdCard` prefix
4. `0400:81`: 분석실 card prefix
5. `0560:44`: `abCard` before `<h2>경력`
6. `0560:121`: + version tag
7. `0620:29`: + 다른 리그 경기 계산 setting

DOM order with `UI.cv` unset (the default):
1. 분석실 card
2. 이사회 시즌 목표
3. chips 감독 / 명예의 전당·시상
4. manager card
5. 공석
6. 해외 구단
7. 경력
8. 감독 list
9. 역대 우승
10. AI note
11. 저장 백업
12. version
13. 다른 리그 경기 계산

⚠ After the user taps the "감독" chip, `UI.cv='mgr'`, and **cards 1–2 disappear**. Both are gated on `!UI.cv||'me'||'career'`.

| # | Info | Source | Cond. |
|---|---|---|---|
| 1 | 분석실 card: "플레이 로그 n경기 · …" + `data-lgopen` 열기 | `S.plog` | see ⚠ |
| 2 | 이사회 시즌 목표: items ✓/· (inline good / muted), goal text + status | `S.goals`, `bdStat` | current season |
| 3 | Chips `data-hof="mgr|hof"` | `UI.cv` | – |
| 4 | Manager card: `.eyebrow` 도전 모드 / 구단 선택 모드 (**unstyled outside `.hero`**), h2 **manager name**, "{club} 감독 · 계약 date / 무소속 · 우승 n회 · 경질 n회"; 평판 n + tier + bar (`var(--c2)`); 이사회 신뢰도 + status + 목표 + bar; "이번 부임 리그 P경기 W승 D무 L패"; explanation note; `data-resign` 사임 | `S.me` | employed parts conditional |
| 5 | "{league} 공석 n곳": rows crest + **club name**, "요구 평판 · 목표", state 제안 대기 / 지원함 / 탈락, or `data-apply` 지원 (ghost if unlikely) | `S.vac` | – |
| 6 | 해외 구단 `abCard` `0560:28`: league tabs `data-ablg` (★ preferred), 희망 국가 + `data-abpref`, status note, rows crest + **name** + "요구 평판 · 가능성" + `data-abapp` 지원 / notes | `S.abApp` | – |
| 7 | 경력: rows crest + **club**, "from ~ to · why", W-D-L (`histRec`) | `me.hist` | – |
| 8 | "{league} 감독": rows crest + **manager name** ("(나)" / 공석 (inline muted)), "club short · age · 평판 · 신예", trust number (inline `trustCol`, 🔥 if low) | `mgrOf` | – |
| 9 | 역대 우승: "yyyy-yy **club**", manager | `S.champs` | if any |
| 10 | AI-manager data note | static | – |
| 11 | 저장 백업: note, `data-sv="exp"` 저장 내보내기, `data-sv="imp"` 저장 파일 불러오기 | – | – |
| 12 | 다른 리그 경기 계산: note + chip `data-engall` (켜짐 / 꺼짐) | `S.engAll` | – |

**Resign sheet** (`0190:216`): h3 사임, note, `data-resignok`, `data-close`.

**Hall of fame** `hofView` `0270:63` (`UI.cv='hof'`):
- Trophy cabinet: 4 cells with emoji (inline grayscale when 0), count, label.
- 시즌별 경력 rows.
- Season chips `data-awy`.
- "{league} 시상 · season": `awRow` rows (`data-player`: avatar, **name**, label · club short · stat, crest) for MVP, 득점왕, 도움왕, 영플레이어, 사모라, 올해의 감독.
- 베스트 11, 발롱도르 (rank rows), 골든보이, 역대 발롱도르, criteria note.

Long text: club and manager names inside `.nm b` use ellipsis (a crest plus a nested span; note `.nm` has a crest inside it). The h2 manager name has no clamp.

---

## 9. Start / new-game flow (no save loaded, `S==null`)

**Final renderer**: `startView` = `0660:16`, a **full replacement**, then wrapped by `0660:55` (+ version tag).
- Earlier versions are dead code:
  - `0150:19` (had `data-imgtog`)
  - `0190:194` `startCareerView`
  - wraps `0230:6` (라리가2 list), `0250:41` (other-league tabs), `0260:26` (save import box), `0560:120` (version)

| # | Info | Notes |
|---|---|---|
| 1 | `.hero`: `.eyebrow` "26개 리그 · 2026-27", h1 "월드 풋볼 매니저" (48px, `word-break:keep-all`), intro paragraph | – |
| 2 | Resume button `data-act="resume"` "이어하기 · {manager} · {club} · {date}" + warning note | if a save exists |
| 3 | h2 감독 이름 + `input#mgname.inp` (inline styled, maxlength 16) | `UI.nm` |
| 4 | h2 시작 방식 chips `data-mode="club|challenge"` + mode description | `UI.mode` |
| 5 | h2 나라 선택: `.wmapw` world map `svg#wmap` (paths `.mc[data-cc]`, labels `.ml[data-cc]` with country names; **hard-coded map colors**); zoom pad `.mzoom` `data-mz="in|out|eu|w"`; pan / pinch / wheel | `WMAP` |
| 6 | Country tabs `data-scc="{iso}"` (20 countries) | `CC_ORD` |
| 7 | h2 {country}; league tabs `data-slg="{lg}"` or a single league note | `CC_LG` |
| 8 | `.pick` club buttons `data-new="{clubId}"`: crest, **club name** (`b`, wraps), small "요구 평판 · 에이스 {name} · 이적 예산 €XM", `.ovr` average (`hi`/`lo`) | `clubRows`; challenge mode shows the weakest half (≤10) |
| 9 | "스페인 외 리그 감독은 게임이 만든 감독입니다." | non-ES |
| 10 | h2 저장 파일 불러오기 + `data-sv="imp"` | – |
| 11 | Data-source note; version tag | – |

Flow: `data-new` → `startGame(club)` (wrapped by `0190:152`, `0200`, `0210`, `0220`, `0240`, `0250:5`, `0620:131` → `careerInit(UI.mode, UI.nm, club)`) → home.

⚠ The **photo / logo toggle `data-imgtog` is no longer rendered anywhere.** Its handler at `0190:209` still exists, so `IMG.on` can only change through `localStorage`.

Long text:
- `.pick button` uses a grid of 40px / 1fr / auto; the name `b` wraps and the `small` meta wraps.
- Country tabs scroll horizontally.

---

## 10. Bottom navigation, top header, floating 계속 button

All defined in `render()` `0150:7-16`.

**Header** `header.top > .in`:
- crest (30px)
- `h1` **club name** (21px Barlow, **no ellipsis or nowrap**; a long name pushes against the money button)
- `.sub`: `fmtD(S.date) · {season}-{yy} 시즌`, plus " · 이적시장" (inline `color:var(--good)`) when a window is open
- Right side:
  - `button.money[data-act="fin"]` "이적 예산 **€X**" → `finSheet`
  - or, when unemployed, `span.money` "평판 **n**" (inline opacity .7)

**Finance sheet** `finSheet`: replaced at `0290:49`, wrapped by `0510:26` (wage-cap request card, `data-wreq="5|10"`) and `0630:50` (squad-cost ratio card).
- facts: 연 매출, 이적 예산, 운영 손익 (inline color)
- 수입 / 지출 rows (inline red for negatives)
- note
- 연봉 총액 bar (inline color)
- 시설 rows with `data-fac="st|tr|yo"`
- 예정된 분할금, 이적 예산 내역, 운영 내역 (inline colors)

**Floating 계속** `div.go > .in > button[data-act="advance"]`:
- "계속" + chevron SVG; amber pill, fixed `bottom: 58px + safe-area`, right-aligned
- → `advance()` `0100:23`: `.busy` overlay → sim → `startMatch(mine)`, or stops at events
- Always visible outside a match, including on the unemployed home.

**Bottom nav** `nav.nav > .in` (grid, equal columns). Buttons from `nb()` `0150:18`: `button[data-tab][aria-current]` with SVG icon + label.

| data-tab | label | badge | cond. |
|---|---|---|---|
| `home` | 홈 | `.dotn` red dot if any message is unread | always |
| `squad` | 스쿼드 | – | hidden when unemployed |
| `tac` | 전술 | – | hidden when unemployed |
| `trans` | 이적 | – | hidden when unemployed |
| `league` | 리그 | – | always |
| `career` | 감독 | – | always |

When unemployed, the squad / tac / trans tabs fall back to home (`0150:9`). The active tab is amber.

---

## 11. Inbox / news (home sections, sell tab, breaking popup)

`msgHTML(m)` `0150:43`. Wrap chain:
1. `0190:173`: job / renew / eval / vac
2. `0270:58`: award
3. `0300:50`: renewreq / press
4. `0310:55`: loanopt
5. `0310:65`: renewreq done
6. `0330:26`: media
7. `0370:49`: trade counter label
8. `0430:51`: loanoffer / loanrep
9. `0590:10`: generic "선수 보기"
10. `0590:24`: "역제안…" label

Anatomy, `div.msg(.new)`:
- `.h`: date + type label
- `b`: title (unread dot via `::before`, recolored **red** by an `!important` rule at `0400:90`)
- `p`: body + optional " → result" (inline `color:var(--text)`)
- `.acts`: buttons

| type → label | Actions (`data-*`) |
|---|---|
| `offer` → 영입 제안 (트레이드 제안) | `data-msg data-do="accept"` 수락; `data-do="counter"` "역제안…" (normal: opens `sellCounterSheet` `0590:14` with 4 `data-sc data-v` options + `data-player`; trade: "역제안 현금 X + 선수"); `data-do="reject"` 거절 |
| `request` → 선수 면담 | `data-do="list|promise|deny"` |
| `clause` → 바이아웃 | `data-do="persuade|letgo"` |
| `scout` → 스카우트 | `data-player` 선수 보기 |
| `window` → 이적시장; `board` → 이사회; `contract` → 계약; `부상` → 의료진; `news` → (no label) | – (plus `data-player` if `pid`) |
| `job` → 감독직 제안 | `data-job="accept|decline" data-msg` |
| `renew` / `eval` → 이사회 | `data-renew="1|0" data-msg` 서명 / 보류 |
| `vac` → 공석 | `data-apply="{club}"` 지원 |
| `award` → 시상 | `data-hof="aw"` 시상 보기 |
| `renewreq` → 재계약 | `data-player` "선수 보기 · 재계약" |
| `press` → 기자회견 | `data-pr="{tone}" data-msg` (option labels from `m.pr.opts`); body in “quotes” |
| `media` → 언론 | `data-md="{k}" data-msg` |
| `loanopt` → 임대 계약 | `data-loex` 행사 (money) / `data-lono` 돌려보내기 |
| `loanoffer` → 임대 제안 | `data-lnok` / `data-lnno` / `data-player` |
| `loanrep` → 임대 리포트 | – (body is **raw HTML**, not escaped) |

Where messages appear:
- home 확인할 소식 (unread)
- home 받은 소식 (first 25)
- unemployed home
- sell tab 받은 제안 (open offers / clauses only)

**Transfer news**: `newsView` (§6).

**Breaking popup** `hlShow` `0670:4`, shown after `closematch` or when advance stops:
- `button.x[data-close]`
- `.eyebrow` 속보 (inline amber)
- h3 = first item title
- rows `.hl(.good/.bad/.info)`: avatar, crest, or "!" badge; title (`b`, inline good / bad via class); `.note` body
- Up to 5, sorted by priority. Sources: match (derby, big win/loss, 1위, 강등권, hat-trick, first goal, 10th goal, streaks), transfers (watched player, big fee, rival), AI sackings, champion.

**Toasts** carry most action feedback (`toast()`).

---

## 12. CSS: tokens and component classes (`app/style.css`, 196 lines)

### 12.1 `:root` tokens
| token | value | use |
|---|---|---|
| `--bg` | `#0D1318` | page / match background |
| `--surf` | `#151E26` | cards, nav, sheet |
| `--surf2` | `#1C2731` | chips-on, facts, bars track |
| `--line` | `#26343F` | borders / dividers |
| `--text` | `#E4EAEE` | primary text |
| `--muted` | `#8497A6` | secondary text |
| `--faint` | `#5A6C7A` | tertiary / VS / bar off |
| `--amber` | `#F0B429` | primary accent, CTA, active tab |
| `--amber-ink` | `#1B1403` | text on amber |
| `--pitch` / `--pitch2` | `#1F5A3A` / `#23663F` | tactics pitch stripes |
| `--good` / `--ok` / `--warn` / `--bad` / `--info` | `#4CB782` / `#D9C24A` / `#E8903A` / `#E0685A` / `#5EC2E8` | status |
| `--disp` / `--body` | font stacks | – |
| `--c1` / `--c2` / `--c3` (line 194) | `#F0B429` / `#5EC2E8` / `#E07AB8` | compare series, rep bar |

There is **no light theme**: `color-scheme:dark` only, and no `prefers-color-scheme` block. Undeclared tokens referenced with fallbacks: `--bg2` (`#0e1218`), `--ui`.

Runtime tokens set by JS:
- `--mta` / `--mtb` / `--mton` on `#match.mth` (`0360`)

### 12.2 Key component classes
- Layout: `.wrap` (max 560, padding 16, bottom 150), `.top`, `.nav`, `.go`, `.match`, `.scrim`, `.sheet`, `.x`
- Surfaces: `.card`, `.pad`, `.banner(.open/.closed)`, `.fixture`, `.vs`, `.hero`, `.pick`, `.nxo`, `.rec(.best)`, `.role`, `.pinned`, `.tray`, `.finebtn` (injected)
- Buttons: `.btn` (amber block), `.btn.ghost`, `.btn.sm`, `.btn.danger` (unused), `.chip[aria-pressed]`, `.chips`, `.tabs button[aria-selected]`, `.seg button[aria-pressed]`, `.duty`, `.steps`, `.stepper`, `.metab`, `.mptab` (injected), `.sorts`, `.chk`
- Lists: `.list`, `.li`, `.nm` (`b` ellipsis), `.sub2`, `.rcol`, `.row`/`.rmain`, `.mu`, `.qs`/`.qsn`, `.chg`, `.hl`, `.rp`, `.msg`, `.inbox`
- Data display: `.num`, `.ovr(.hi/.lo/.rng)`, `.pos.{GK|CB|FB|DM|CM|AM|W|ST}`, `.ptag(.m)`, `.pill(.g/.y/.r/.b/.n)`, `.vd(.up/.eq/.dn)`, `.tag`, `.st`, `.cnt`, `.facts`, `.attr`, `.bar(.l)`, `.cmp`, `.rt`, `.rt2`, `.lanes`, `.dgrid`, `.zg`/`.zmini`/`.zrow`, `.tl`, `.cd(.y/.r)`, `.rnotes li(.good/.bad/.warn/.tip)`, `.stars`, `.legend`, `.resp(.ok/.mid/.no)`, `.warnline`/`.okline`, `.note`, `.lbl`, table / `th` / `td` / `td.t` / `td.pts` / `tr.me`, `.tbl-wrap`, `.pst`/`.pstw`, `.ctab`, `.radar`, `.cmp-head`/`.pc`
- Pitch: `.pitch`, `.slot` (`.dot` / `.lb` / `.sl` / `.sel` / `.lift` / `.hov`), `.zones`, `.mbadge(.pib)`, `.sbub`, `.bench`/`.bch`, `.mpitch`/`.mp`, `.opitch`, `.dragghost`, `.m2dw` / `#m2d` / `.mcap`, `.board`, `.feed`/`.ev`, `.mstats`, `.mctl`
- Identity: `.crest(.img/.xs)`, `.av(.sm/.lg)`, `.phead`, `.lgi(.big)`
- Feedback: `.toast`, `.busy`

**Hard-coded colors inside `style.css` itself** (not tokenized):
- `.pos.*` (8 bg / fg pairs)
- `.pill.*` (`#173A2A`/`#7CCB9C`, `#3A3717`/`#E3D27A`, `#44201C`/`#F09A8C`, `#15324A`/`#8CC8EE`)
- `.vd.*`
- `.resp.*` text tints
- `.mp .yc` `#E8C547`, `.cd.y` `#F0C419`
- `.mbadge` `#5EC2E8`/`#062230`
- `.metab` active `#231C02`, `.sbub`/`.mcap .tag`/`.bch .ib` `#1b1400`
- `.opitch` `#1f6b3a`/`#E0685A`, `.zg` `#1f6b3a`, `.mpitch` gradient
- `#m2d` `#1f6b3a`
- `.zones` rgba tints and `#7EE0B5`/`#F59A8C`
- `.crest` color `#fff`
- many `rgba(255,255,255,…)` / `rgba(0,0,0,…)` / `rgba(10,15,20,…)` overlays

**Classes used in JS but never styled anywhere**:
- `.inj`: injury / ban tag on bench chips and slot rows, renders as plain text
- `.eyebrow` outside `.hero`: career card, breaking popup
- `.inp`: start name input, inline-styled
- `.tips`
- Marker-only classes (fine as hooks, but must be kept): `.sh-head`, `.livetag`, `.anaNav`, `.decTog`, `.ksnap`, `.pshw`, `.ssw`, `.scrw`, `.nfs`, `.injw`, `.chemlines`, `.sppitch`, `.pl`, `.rpp`, `.rpn`, `.trdesc`

**CSS injected from JS** (10 `<style>` blocks; they sit outside `style.css` and override it):

| file:line | content |
|---|---|
| `0110:270` | `.mptab`, `.mpst` sticky table, `.match.mp-on .feed` |
| `0170:103` | `.hzball`, `.oslot`, `.subhd`, `.finebtn`, `.zchips`, `.znud`, `.hzctl` |
| `0360:20` | `#match.mth` theme gradient and accent overrides on `.board`, `.clock`, `.mctl .btn`, `.mptab`, `.mstats` |
| `0360:39` | `.mrk` |
| `0400:90` | `.msg.new b::before{background:var(--bad)!important}`, `.inbox.unrd` (uses `color-mix`) |
| `0530:12` | `.stpv`, `.stph`, `.stpin` |
| `0570:4` | `.finebtn .go` reset, `.oslot span` hide, `.lbtn-nw` |
| `0610:84` | `#rpv` replay UI, plus **`#mptab` overrides with `!important`** |
| `0620:36` | `.decOv` (lazy, on first overlay) |
| `0660:48` | `.wmapw`, `#wmap` map fills (hard-coded), `.mzoom`, `.hero h1` |

---

## 13. Inline color / style usage per JS file (counted by regex)

| file | hex | rgba | `style="` | `var(--` | inj. CSS | DOM inject | string patch | notes |
|---|---|---|---|---|---|---|---|---|
| 0010_data.js | 22 | 0 | 0 | 0 | 0 | 0 | 0 | club color data (`COLORS`), `hsl()` fallback |
| 0020_util.js | 1 | 0 | 1 | 0 | 0 | 1 | 0 | crest gradient inline |
| 0060_engine_glue.js | 1 | 0 | 0 | 4 | 0 | 0 | 0 | `CONDS` `#9CCB6A` |
| 0110_match_screen.js | 8 | 0 | **75** | 48 | 1 | 1 | 0 | feed tag colors, stamina colors, mpst |
| 0120_view2d.js | 9 | 4 | 0 | 0 | 0 | 0 | 0 | 2D pitch SVG |
| 0130_view2d_v4.js | 12 | 4 | 0 | 0 | 0 | 0 | 0 | kit colors |
| 0140_position_report.js | 1 | 0 | 46 | 28 | 0 | 1 | 4 | report bars, `psHTML` select |
| 0150_screens.js | 0 | 0 | 13 | 4 | 0 | 0 | 0 | header / home / squad |
| 0160_tactics.js | 2 | 1 | **89** | 23 | 0 | 0 | 0 | slots / legend / bars |
| 0170_setpiece.js | 21 | 13 | 65 | 25 | 1 | 1 | 0 | set-piece SVG, player sheet bars |
| 0180_events.js | 0 | 0 | 4 | 4 | 0 | 0 | 1 | old `finSheet` (dead) |
| 0190_career.js | 0 | 0 | 29 | 11 | 0 | 0 | 1 | trust colors, input |
| 0200–0260 | 0 | 0 | 29 | 8 | 0 | 0 | 7 | tabs / tables |
| 0270_awards.js | 0 | 0 | 7 | 0 | 0 | 0 | 0 | – |
| 0280_training.js | 0 | 0 | 9 | 6 | 0 | 0 | 0 | – |
| 0290_finance.js | 0 | 0 | 10 | 10 | 0 | 0 | 0 | – |
| 0300_press.js | 0 | 0 | 16 | 10 | 0 | 0 | 0 | – |
| 0310_negotiation.js | 0 | 0 | 10 | 2 | 0 | 4 | 0 | – |
| 0320–0340 | 1 | 0 | 13 | 6 | 0 | 1 | 0 | youth tag ink `#06210f` |
| 0360_comp_theme.js | **47** | 0 | 0 | 17 | 2 | 2 | 0 | competition palette (by design) |
| 0370–0380 | 0 | 0 | 7 | 1 | 0 | 2 | 1 | – |
| 0390_player_analysis.js | 6 | 2 | 18 | 24 | 0 | 1 | 1 | `ANA_C` greys |
| 0400_playlog.js | 1 | 0 | 16 | 10 | 1 | 0 | 1 | – |
| 0430–0470 | 0 | 0 | 6 | 1 | 0 | 2 | 2 | – |
| 0480_v149_recent5.js | 2 | 0 | 9 | 4 | 0 | 0 | 1 | form chips `#8A8F98` / `#fff` |
| 0500_v156_chemistry.js | 3 | 0 | 15 | 5 | 0 | 1 | 3 | chemistry lines hex |
| 0510–0530 | 2 | 0 | 8 | 9 | 1 | 3 | 0 | – |
| 0550–0590 | 1 | 0 | 21 | 6 | 1 | 4 | 11 | – |
| 0600_v218_ai_club.js | 0 | 0 | 11 | 3 | 0 | **9** | 0 | sheet injections |
| 0610_v239_replay2d.js | 18 | 6 | 5 | 4 | 1 | 2 | 1 | replay SVG |
| 0620_v241_all_league_engine.js | 2 | 1 | **51** | 44 | 1 | 4 | 1 | decision UI |
| 0630–0650 | 80 | 2 | 20 | 4 | 0 | 1 | 0 | 3D (75 hex in 0640) |
| 0660_start_map.js | 8 | 1 | 7 | 9 | 1 | 0 | 1 | map colors |
| 0670_breaking_popup.js | 0 | 0 | 4 | 1 | 0 | 0 | 0 | – |
| **TOTAL (app JS)** | **248** | **34** | **616** | **333** | **10** | **40** | **36** | |

Reading the table:
- About 616 inline `style="…"` attributes exist across the JS templates. Many set layout (margin, font-size, display:flex), and a large share set **colors**, mostly through `var(--…)`.
- The ~282 literal hex / rgba values are the part a token-based theme **cannot reach**.
- The biggest groups:
  - 3D replay (0640)
  - competition palette (0360)
  - feed tags (0110)
  - set-piece SVG (0170)
  - replay SVG (0610)
  - map (0660)
  - chemistry (0500)
  - `CONDS` arrow color (0060)
  - form chips (0480)

---

## 14. Redesign risks (things a restyle can silently break)

1. **Renderers are composed by string surgery.** Later files splice HTML by searching for exact markup or text. Changing these strings in the base templates silently drops features:

   | Exact string anchor | Used by |
   |---|---|
   | `'<h2>받은 소식</h2>'` | 0140, 0190, 0400 |
   | `'<p class="note" style="text-align:center">오른쪽 아래'` | 0480, 0550 |
   | `'득점 순위</button></div>'`, `'도움 순위</button></div>'`, `'>득점 순위</button>'`, `'>도움 순위</button>'` | 0140 |
   | `'<button data-elg="" aria-selected="'` | 0220 |
   | `'<button data-elg="CUP"'` | 0240 |
   | `h.indexOf('</div>')` (first div = competition tabs) | 0220, 0240 |
   | `'<button class="chip" data-tsets>전술 저장·불러오기</button>'`, `'<div class="zones" id="zones"'`, `'<div class="legend">'` | 0500 |
   | `'<h2>2군 ('` | 0450 |
   | regex `<span class="sub2">` + ptag spans, and the squad note sentence | 0570 |
   | `'<div class="card list"'` | 0560 watch |
   | regex `<button class="li" data-player="(\d+)">…</button>`, `'</span></span>'`, `'<span class="pill g">파악 완료</span>'`, `'<span class="ovr'` | 0580 |
   | `'</span></span>'` in `rowP` | 0470 |
   | `'<h2>경력'` | 0560 |
   | first `'</h3>'` in the report | 0620 |
   | `lastIndexOf('</main>')` | 0660 |
   | `'<div class="acts">'` and `/<\/div>\s*$/` | 0590 |
   | `/(data-do="counter">)역제안 [^<]*/` | 0590 |
   | `` `역제안 ${money(...)}` `` | 0370 |
   | `/<td class="n">/g` in `pstHTML` | 0390 |
   | `'<rect x="0" y="0"'` in `pitchSVG` | 0130 |
   | `'공격 방향 →'` | 0620 |

2. **Sheets are patched after render through DOM anchors.**
   - Selectors that must stay in place:

     | Anchor | Used by |
     |---|---|
     | `.sheet h3` | 0320, 0390, 0580, 0600 |
     | `[data-act="loanout"]` and its parent `.row2` | 0430, 0440 |
     | `[data-res]` | 0430 |
     | `[data-act="sendTerms"|"sendOffer"|"sendRenew"]` | 0310, 0370, 0380 |
     | `.facts` | 0510 |
     | `[data-o="feeset"]` parent | 0600 |
     | `[data-o="wage"]` with `.stepper` | 0600 |
     | `.stepper` with `button[data-o|data-r|data-tfo]` | 0530 MutationObserver |
     | `#scrim .sheet` (appended cards) | 0500, 0510, 0520, 0620, 0630 |
     | `#mptab` | 0610 |
     | `#mfd` | 0640 |
     | `#mck`, `#msc` | 0550 |
     | `.board .team` | 0360 |
     | `#match .in` | 0360 |
     | `#match .m2dw` | 0620 |
     | `[data-anatab="shot"]` | 0620 |
   - Text-label anchors (break if renamed or translated):
     - `small` text `'능력치'` (0600 ×2)
     - `small` text `'평균 평점'` (0590)
     - a leaf containing `"{age}세 ·"` (0470)
     - h2 text equal to the country name (0660 scroll)

3. **Capture-phase handlers.** Twenty-plus handlers use `addEventListener(...,true)` + `stopPropagation`. The `data-*` names are the real API. Known collisions:
   - `[data-talk]` in `0300:73` (expects `data-pid`) captures the player-detail talk sheet buttons (`data-talk` + `data-id`), so the **면담 sheet is probably broken**. Verify before preserving it.
   - `[data-act="loanout"]` is redefined by `0430:54`: the button toggles the loan list instead of loaning immediately. The `0180:92` path is dead.
   - `[data-fopen]` is rendered in `0470:50` but handled only by the `0570:10` capture handler (a cross-file dependency).

4. **Wholesale replacements leave dead UI.**
   - `startView` (0660) drops `data-imgtog`, so there is no way to toggle photos or logos.
   - `searchView` (0470), `finSheet` (0290) and `startView` (0190, 0660) are reassigned rather than wrapped. Any wrap installed before the reassignment is lost: 0230, 0250, 0260 and 0560's `startView` wraps are all dead.

5. **Conditional inconsistency in career.** The `bdCard` and 분석실 cards disappear once `UI.cv==='mgr'` (the 감독 chip), even though that is the "manager" view.

6. **Inline styles a theme cannot reach.**
   - Literal colors in templates:
     - feed tags (`#E8C547`, `#062230`, `#231C02`, `#fff`)
     - mpst yellow `#F0B429`
     - `.mptab` active `#111`
     - legend `#5EC2E8`
     - chemistry `#4CB782` / `#ffffff` / `#E0685A`
     - form chips `#8A8F98`
     - set-piece SVG `#F0B429` / `#111` / `#fff` / `#ff6b6b`
     - replay `#2f7a3b` / `#E8C547` / `#9C6ADE`
     - analysis greys
     - map fills
     - opponent tactics note `#ffb4b4`
     - 3D overlay (`style.cssText`)
     - `CONDS` `#9CCB6A`
   - `style.css` also hard-codes the semantic tint pairs for `.pos`, `.pill`, `.vd`, `.resp`, `.mbadge` and `.cd`.
   - Ten JS-injected `<style>` blocks, three of them with `!important`, override the stylesheet.

7. **Width risks on 360px phones.**
   - Header `h1` club name has no truncation.
   - `.facts b` is nowrap (KRW / JPY strings).
   - `.mp .n` and `.opitch .lb` are nowrap with no max width (overlap).
   - `.board .team` names wrap and push the score.
   - `td.t` is nowrap (EU table adds a league name).
   - `.mctl` has four nowrap buttons.
   - `#mptab` has four buttons after the replay button is added (`!important` flex).
   - Tab rows depend on horizontal scroll.

8. **Unescaped HTML**: `loanrep` message bodies are inserted raw (`0430:53`). Keep this in mind if templates move to a framework.

9. **Hidden or dormant features**: `GMB_ON=false` (gamble moment), `.btn.danger` (unused), and the old `finSheet` at `0180:120` (replaced).
