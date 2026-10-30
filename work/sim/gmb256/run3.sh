#!/bin/bash
# 빌더 측정 3차(QA 권고안 C): 공중볼 gsx 1.5 유지 + 뒤 수비 1명만 감소(gmbRest) + 우위 보정(gmbAirK .05) + 열세 시 크로스 경합 패배 직후 복귀 지연. 시드 8642 n=600, 2개 프로세스로 분할
export NODE_PATH=$(npm root -g); cd /home/claude/wsm/work/sim/gmb256; H=/home/claude/work/gmb_c.html
HTML=$H OUT=out/s8642_airC_a.jsonl N=300 K0=0 CH=25 SEED=8642 POLS=airC OV='{"gmbAirK":0.05}' node bg.js 2>>out/err3.log &
HTML=$H OUT=out/s8642_airC_b.jsonl N=300 K0=300 CH=25 SEED=8642 POLS=airC OV='{"gmbAirK":0.05}' node bg.js 2>>out/err3.log &
wait; echo done > out/DONE3
