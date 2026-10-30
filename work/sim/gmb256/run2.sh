#!/bin/bash
# 빌더 측정 2차: 고친 '나'(경기 단위 공중볼 우열 × gmbAirK, 높은 크로스만) K=.05, 시드 8642 n=400
export NODE_PATH=$(npm root -g); cd /home/claude/wsm/work/sim/gmb256
HTML=/home/claude/work/gmb_ab2.html OUT=out/s8642_airABk05.jsonl N=400 CH=25 SEED=8642 POLS=airAB OV='{"gmbAirK":0.05}' node bg.js 2>>out/err.log
echo done > out/DONE2
