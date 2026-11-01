#!/bin/bash
# AI 성장 측정 1차: 6시즌, 시드 1, 장치 끔 vs 4종 모두 켬(동시 2개)
export NODE_PATH=$(npm root -g); cd /home/claude/wsm/work/sim/aigrow
HTML=/home/claude/work/aig1.html SEASONS=6 SEED=1 OUT=out/off_s1.jsonl OPT='{}' node season.js > out/off_s1.log 2>&1 &
HTML=/home/claude/work/aig1.html SEASONS=6 SEED=1 OUT=out/on_s1.jsonl OPT='{"grow":1,"trend":1,"user":1,"rep":1}' node season.js > out/on_s1.log 2>&1 &
wait; echo done > out/DONE1
