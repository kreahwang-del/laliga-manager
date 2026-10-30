#!/bin/bash
# v262 승부수(공중볼·중거리 벌점, 중거리 슈터·GK 연동 강화) 재측정: 시드 7019·8263·4457·9811 각 300, bg3, 동시 2개
export NODE_PATH=$(npm root -g); cd /home/claude/wsm/work/sim/gmb262
while pgrep -f "node bgai.js" >/dev/null; do sleep 20; done
for S in 7019 8263 4457 9811; do for P in none g_all g_air g_long; do echo "$S $P"; done; done | xargs -P2 -L1 bash -c 'HTML=/home/claude/work/gmb262.html OUT=out/s$0_$1.jsonl N=300 CH=25 SEED=$0 POLS=$1 node ../gmb256/bg3.js 2>>out/err.log'
echo done > out/DONE
