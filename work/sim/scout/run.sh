#!/bin/bash
# 연구당함 측정: 구단 2(레알 마드리드·레알 베티스) × 전략 2(고집 '측면 공략' / 3성향 순환) × 연구 끔·켬, 각 6시즌(228경기), 같은 시드 짝 비교, 동시 2개
export NODE_PATH=$(npm root -g); cd /home/claude/wsm/work/sim/scout; mkdir -p out
for C in "Real Madrid" "Real Betis"; do for ST in fixed rotate; do for SD in 0 1; do echo "$C|$ST|$SD"; done; done; done | xargs -P2 -I{} bash -c 'IFS="|" read C ST SD <<< "{}"; n=$(echo $C|tr -d " "); HTML=/home/claude/work/v270rc.html CLUB="$C" STRAT=$ST STUDY=$SD PRE="측면 공략" SEASONS=6 SEED=3 OUT=out/${n}_${ST}_${SD}.jsonl node tu.js 2>>out/err.log'
echo done > out/DONE
