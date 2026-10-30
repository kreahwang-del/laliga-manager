#!/bin/bash
# 빌더 측정: 시드 8642 n=600, 정책별 별도 프로세스(같은 프로세스 연속 실행 시 상태 이월로 짝비교 깨짐 확인)
export NODE_PATH=$(npm root -g); cd /home/claude/wsm/work/sim/gmb256; H=/home/claude/work/gmb_ab.html
HTML=$H OUT=out/s8642_airA.jsonl N=600 CH=25 SEED=8642 POLS=airA node bg.js 2>>out/err.log &
HTML=$H OUT=out/s8642_airAB1.jsonl N=600 CH=25 SEED=8642 POLS=airAB OV='{"gmbAirK":1}' node bg.js 2>>out/err.log &
HTML=$H OUT=out/s8642_airAB2.jsonl N=600 CH=25 SEED=8642 POLS=airAB OV='{"gmbAirK":2}' node bg.js 2>>out/err.log &
wait; echo done > out/DONE
