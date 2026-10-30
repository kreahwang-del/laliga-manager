#!/bin/bash
# 빌더 측정 5차(bg2 하네스: 역습 실점 경로·82분 상대 잠그기 기록) — 빌더 시드 8642만 사용(QA 최종 시드와 겹치지 않게)
# 1단계(성향 균형): 그대로·전원·공중볼 D·새 중거리 각 600 / 2단계(성향 공격적): 그대로·공중볼 D 각 600(계단식 비용 확인)
# 정책별 별도 프로세스, K0 분할 금지, 동시 2개
export NODE_PATH=$(npm root -g); cd /home/claude/wsm/work/sim/gmb256; H=/home/claude/work/gmb_l.html
run(){ HTML=$H OUT=out/b2_$1.jsonl N=600 CH=25 SEED=8642 POLS=$2 RK=.5 MENT=$3 node bg2.js 2>>out/err5.log; }
run none none '' & run longL longL '' & wait
run g_all g_all '' & run airD airD '' & wait
run none_att none 공격적 & run airD_att airD 공격적 & wait
echo done > out/DONE5
