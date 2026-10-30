#!/bin/bash
# 빌더 측정 4차(1안 = D안): 가+나 + 비용 절반(라인 전진·복귀 지연 gmbRestK) — K .5 / .35, 시드 8642 n=600, 각 단일 프로세스(K0 분할 시 상태 불일치 발생해 금지)
export NODE_PATH=$(npm root -g); cd /home/claude/wsm/work/sim/gmb256; H=/home/claude/work/gmb_d.html
HTML=$H OUT=out/s8642_airD50.jsonl N=600 CH=25 SEED=8642 POLS=airD RK=.5 OV='{"gmbAirK":0.05}' node bg.js 2>>out/err4.log &
HTML=$H OUT=out/s8642_airD35.jsonl N=600 CH=25 SEED=8642 POLS=airD RK=.35 OV='{"gmbAirK":0.05}' node bg.js 2>>out/err4.log &
wait; echo done > out/DONE4
