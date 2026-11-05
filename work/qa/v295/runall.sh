cd /home/claude/wsm/work/qa/v295
H5=/tmp/claude-0/-home-claude/f31d21f9-c264-59b6-9240-2b0ee68043bb/scratchpad/qa295.html
export NODE_PATH=$(npm root -g)
HTML=$H5 MODE=MX timeout 590 node season.js > m295.txt 2>&1
HTML=$H5 MODE=save SV=/tmp/claude-0/-home-claude/f31d21f9-c264-59b6-9240-2b0ee68043bb/scratchpad/usersave/sv2.json POST=70 timeout 590 node season.js > s295.txt 2>&1
HTML=/tmp/qa294.html MODE=KR timeout 590 node season.js > k294.txt 2>&1
HTML=$H5 MODE=unemp timeout 590 node season.js > u295b.txt 2>&1
echo done > runall.done
