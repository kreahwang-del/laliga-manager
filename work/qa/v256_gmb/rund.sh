#!/bin/bash
# 최종 재검증 D안: 시드 5309·6271 각 600, 정책별 별도 프로세스, K0 분할 없음, 동시 2개. 회귀 9173 n=300(cur256 vs cur256d)
export NODE_PATH=$(npm root -g); cd /home/claude/wsm/work/qa/v256_gmb; mkdir -p outd
{
for S in 5309 6271; do for P in none g_all g_air g_long; do echo "$S $P"; done; done
} | xargs -P2 -L1 bash -c 'OUT=outd/d$0_$1.jsonl N=600 CH=25 SEED=$0 POLS=$1 HTML=/home/claude/work/cur256d.html node qgd.js 2>>outd/err.log'
HTML=/home/claude/work/cur256.html OUT=outd/ai_cur256.jsonl N=300 SEED=9173 node qai.js 2>>outd/err.log &
HTML=/home/claude/work/cur256d.html OUT=outd/ai_cur256d.jsonl N=300 SEED=9173 node qai.js 2>>outd/err.log; wait
echo done > outd/DONE
