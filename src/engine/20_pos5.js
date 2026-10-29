// 실측 위치 테이블(SkillCorner 20경기): POS5[role][phase][xbin][ybin]=[x,y,sx,sy]. phase: out / in(평균) / in0·in1·in2(상대 후방4 높이 <26·26-32·32+). 역할은 오른쪽 변형(왼쪽은 y 거울)
const POS5=__DATA__("POS5");const POS5_XC=[5.0, 15.0, 25.0, 36.0, 48.5, 62.5, 77.5, 95.5],POS5_YC=[6.0, 18.0, 29.0, 39.0, 50.0, 62.5];
if(typeof module!=='undefined')module.exports={POS5,POS5_XC,POS5_YC};

