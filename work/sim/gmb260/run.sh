#!/bin/bash
# v260 보정(lsG .40) 뒤 승부수 재측정: QA 시드 7019·8263·4457·9811 각 300, 정책별 별도 프로세스, K0 분할 없음, 동시 2개, bg3 하네스
export NODE_PATH=$(npm root -g); cd /home/claude/wsm/work/sim/gmb260
for S in 7019 8263 4457 9811; do for P in none g_all g_air g_long; do echo "$S $P"; done; done | xargs -P2 -L1 bash -c 'HTML=/home/claude/work/v260b.html OUT=out/s$0_$1.jsonl N=300 CH=25 SEED=$0 POLS=$1 node ../gmb256/bg3.js 2>>out/err.log'
echo done > out/DONE
