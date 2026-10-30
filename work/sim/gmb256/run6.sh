#!/bin/bash
# 빌더 측정 6차(QA 의견 반영 재설계): 비용의 상대 속도 연동(gmbPK), 공중볼 강도 1.0, 중거리 질 연동·벌점 없음. 시드 8642 n=600, 균형. 그대로는 5차 b2_none 재사용(같은 경로)
export NODE_PATH=$(npm root -g); cd /home/claude/wsm/work/sim/gmb256; H=/home/claude/work/gmb_e.html
run(){ HTML=$H OUT=out/e_$1.jsonl N=600 CH=25 SEED=8642 POLS=$1 node bg2.js 2>>out/err6.log; }
run g_all & run g_air & wait
run g_long; echo done > out/DONE6
