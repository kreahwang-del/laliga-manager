#!/bin/bash
# 빌더 측정 5차: 중거리 보상·벌점(gmbLong) — 시드 8642 n=600, 성향 균형 / 같은 시드 '공격적' 성향의 그대로·공중볼(계단식 비용 확인)
export NODE_PATH=$(npm root -g); cd /home/claude/wsm/work/sim/gmb256; H=/home/claude/work/gmb_l.html
HTML=$H OUT=out/s8642_longL.jsonl N=600 CH=25 SEED=8642 POLS=longL node bg.js 2>>out/err5.log &
HTML=$H OUT=out/s8642_none_att.jsonl N=600 CH=25 SEED=8642 POLS=none MENT=공격적 node bg.js 2>>out/err5.log &
wait
HTML=$H OUT=out/s8642_airD_att.jsonl N=600 CH=25 SEED=8642 POLS=airD RK=.5 MENT=공격적 node bg.js 2>>out/err5.log &
HTML=$H OUT=out/s8642_all_att.jsonl N=600 CH=25 SEED=8642 POLS=g_all MENT=공격적 node bg.js 2>>out/err5.log &
wait; echo done > out/DONE5
