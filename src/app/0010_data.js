// ================= 데이터 =================
const A=G.attrs;
const CLUBS=G.clubs.map(c=>({i:c[0],name:c[1],short:c[2],lg:c[3],rev:c[4],budget:c[5],wageCap:c[6],rep:c[7],revSrc:c[8],tend:c[9],tm:c[10]||null}));
const BASE={};
G.players.forEach(r=>{const p={id:r[0],name:r[1],club:r[2],g:r[3],sub:r[4],dob:r[5],nat:r[6],foot:r[7],h:r[8],ovr:r[9],pa:r[10],val:r[12],hi:r[13],cEnd:r[14],wage:r[15],clause:r[16],inj:r[17],pro:r[18],gt:r[19],est:r[20],tend:r[21],attSh:r[22],pos2:r[23]||null,img:r[26]||null,hab:(G.tend&&G.tend[r[0]])||null,pst:(G.pst&&G.pst[r[0]])||null,dh:(G.dtend&&G.dtend[r[0]])||null};if(r[24]){[p.wf,p.str,p.comp,p.fk,p.pen,p.hg]=r[24]};if(r[25])p.hist=r[25];
  A.forEach((k,j)=>p[k]=r[11][j]);
  // 세부 포지션 정보가 없는 선수는 실제 출전 기록의 주 포지션으로 보정
  if(!p.sub&&p.pos2){const top=Object.entries(p.pos2.n).sort((a,b)=>b[1]-a[1])[0];if(top&&top[1]>=10){const [g,sd]=top[0].split('-');if(g!=='GK'&&p.g!=='GK'){p.g=g;p.sub=sd==='L'?'Left':sd==='R'?'Right':''}}}
  BASE[p.id]=p;});
const LGN=Object.assign({ES:'라리가',EN:'프리미어리그',IT:'세리에A',DE:'분데스리가',FR:'리그1'},G.leagues||{});const LG5=new Set(['ES','EN','IT','DE','FR']);
const COLORS={'Barcelona':['#A50044','#004D98'],'Real Madrid':['#E6E9EE','#FEBE10','#1a1a1a'],'Atlético Madrid':['#CB3524','#272E61'],'Athletic Club':['#EE2523','#FFFFFF'],'Real Sociedad':['#0067B1','#FFFFFF'],'Villarreal':['#FFE667','#005187','#1a1a1a'],'Real Betis':['#0BB363','#FFFFFF'],'Sevilla':['#FFFFFF','#D81E05','#1a1a1a'],'Valencia':['#FFFFFF','#EE3524','#1a1a1a']};
function clubCol(c){const n=CLUBS[c].name;if(COLORS[n])return COLORS[n];let h=0;for(const ch of n)h=(h*31+ch.charCodeAt(0))%360;return [`hsl(${h} 55% 38%)`,`hsl(${(h+40)%360} 45% 22%)`]}
const LIGA=CLUBS.filter(c=>c.lg==='ES').map(c=>c.i);
const FA=-1;
