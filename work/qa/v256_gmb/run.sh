#!/bin/bash
# 정책별 별도 프로세스(같은 k 순서 → 80분 상태 일치 확인), 시드 8642·3141 각 n=600
export NODE_PATH=$(npm root -g); cd /home/claude/wsm/work/qa/v256_gmb
for S in 8642 3141; do
 for P in none g_all g_air g_long; do OUT=out/g${S}_${P}.jsonl N=600 CH=25 SEED=$S POLS=$P node qg.js 2>>out/err.log & done; wait
done
echo done > out/DONE
