#!/bin/bash
# 빌더 측정 7차(bg3 하네스: 실제 근거 비교용 세부 기록) — 재설계(gmb_e) 시드 8642 n=600, 균형. 1단계: 그대로·전원
export NODE_PATH=$(npm root -g); cd /home/claude/wsm/work/sim/gmb256; H=/home/claude/work/gmb_e.html
run(){ HTML=$H OUT=out/f_$1.jsonl N=600 CH=25 SEED=8642 POLS=$1 node bg3.js 2>>out/err7.log; }
run none & run g_all & wait; echo done > out/DONE7a
