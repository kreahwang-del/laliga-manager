# Real league per-match averages (2024-25 / 2025) — notes

File: real_league_stats.csv (28 rows). All values are per match, both teams combined. Every number was computed by me from raw tables (nothing copied as a ready average), except the soccerstats La Liga cross-check.

## Method
- goals, homeW/draw/awayW, balance: Wikipedia season pages (en.wikipedia.org; EN from the cliffipedia.org mirror, AR from the wiki.krisyotam.com mirror, because the en.wikipedia URLs for those were refused by the fetch-permission check). The league table and the full results matrix were extracted and parsed by script (scratchpad/tools/wiki.py, raw inputs in scratchpad/raw/*.txt).
  - goals = sum GF / matches (final table). For AT and DK the matrix total is used so the championship and relegation rounds are included.
  - H/D/A = counted from every score in the results matrix (home perspective).
  - balance = PPG of the best team minus PPG of the worst team, using on-field points (3W+D), so point deductions are ignored (relevant for TR Adana Demirspor and IT2 Brescia). Standard deviation of PPG is given in source_notes.
- Checks: matrix goals equal table goals for 24 leagues. Small mismatches: PT (3 goals), NL (303/306 cells), CH (230/228), KR (225/228), US (509/510). La Liga H/D/A 44.5/25.5/30.0 matches soccerstats (44/26/30, 2.62 goals).
- shots, sot, fouls, yellow, red: FBref squad tables (aws.fbref.com mirror; fbref.com main returned client errors). Rate = 2 × sum(team stat) / sum(team 90s).
  - These are MID-SEASON SNAPSHOTS, not final totals: Big5 shooting at about 15-19 rounds, Big5 misc at about 22-26, NL about 29/34, TR about 19/36, SA about 16/34, BE only 10 rounds, MLS shots only 4 rounds (low confidence).
  - FBref yellow (CrdY) counts all yellow cards. Red (CrdR) includes second-yellow reds.

## Coverage
| column | leagues covered |
|---|---|
| goals | 28/28 |
| homeW/draw/awayW | 27/28 (AR missing: no results matrix; 2025 format is two zones of 15 plus interzonal games) |
| balance | 28/28 |
| shots, sot | 10 (ES EN DE IT FR NL BE TR SA US*) |
| fouls, yellow, red | 9 (ES EN DE IT FR NL BE TR SA) |

## Season scope caveats
- BE: regular season only (30 rounds). CH, SC, KR: full 38 rounds including split. AT, DK: goals and H/D/A cover all 192 matches, but balance uses the 22-round regular table.
- MX: Apertura 2024 + Clausura 2025 regular phases (306 matches, no liguilla). Balance comes from the summed 34-game table.
- US: regular season only. AR: aggregate table (32 games per team, group phases). The low 1.96 goals per match is real for Argentina.
- EN2, ES2, IT2: regular season only (no play-offs).

## Not reachable or blocked (not bypassed)
- fbref.com competition pages (permission timeout or client_error), footystats.org (permission timeout), en.wikipedia 2024-25 Premier League (provenance; used a mirror instead), most soccerstats.com pages (server_error). Transfermarkt and namu.wiki were not used.
- No reachable source for shots, fouls or cards in PT, SC, CH, AT, DK, the second tiers, ES3, MX, BR, AR, JP, CN, KR. These are marked NA.
