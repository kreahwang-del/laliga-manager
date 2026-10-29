// ================= AI 공격·수비 대형 분리(v112) =================
// 이전: 라리가 AI 19팀 중 15팀이 기본=공격=수비 같은 대형(두 줄 수비·역습 프리셋만 수비 5-4-1/4-4-2).
// 실제 팀처럼 공을 가졌을 때와 잃었을 때 대형을 바꿈 — 수비 시 미드필드 한 줄을 더 세우고(4-3-3→4-1-4-1, 4-2-3-1→4-4-2, 3백→5백),
// 점유형(티키타카·측면 공략)·상위권은 공격 시 풀백을 올린 3-4-3 계열. 약팀(평판 55 미만)·내려앉는 전술은 수비 시 5-4-1/4-1-4-1로 더 많은 인원이 수비하고,
// 공격 시엔 기본 대형 그대로 두어 역습 위주. 압박 전술(게겐프레싱)은 앞선 3명을 남겨 높은 압박(4-3-3 유지 또는 4-4-2). 일부 팀(약 20%)은 대형을 바꾸지 않음(감독 성향 다양성)
function aiPhase(t,c){if(!t||t._ph||!CLUBS[c])return t;t._ph=1;const rep=CLUBS[c].rep||50,b=t.form.base,pr=t.preset,h=hsh('ph'+c+S.season),h2=hsh('pa'+c+S.season);
  const weak=rep<55,deep=pr==='두 줄 수비'||pr==='선수비 후 역습',poss=pr==='티키타카'||pr==='측면 공략',press=pr==='게겐프레싱',three=b==='3-5-2'||b==='3-4-3',five=b[0]==='5';
  if(t.form.def!==b||t.form.atk!==b)return t; // 이미 지정된 팀(아틀레티코 등)·사용자 지정 유지
  if(!weak&&!deep&&h<.2)return t;
  let def=b,atk=b;
  if(weak||deep){def=three?(b==='3-5-2'?'5-3-2':'5-4-1'):five?b:(weak?(h<.6?'5-4-1':'4-1-4-1'):(b==='4-4-2'||b==='4-2-3-1'?'4-4-2':'4-1-4-1'))}
  else if(press){def=b==='4-3-3'?(h<.55?'4-3-3':'4-4-2'):b==='4-2-3-1'?'4-4-2':three?(b==='3-5-2'?'5-3-2':'5-4-1'):b}
  else def={'4-3-3':'4-1-4-1','4-2-3-1':'4-4-2','4-4-2':'4-4-2','3-5-2':'5-3-2','3-4-3':'5-4-1','4-1-4-1':'4-1-4-1'}[b]||b;
  if(!(weak||deep)){if(five)atk=b==='5-3-2'?'3-5-2':'3-4-3';
    else if(poss||rep>=80)atk=b==='4-2-3-1'||b==='4-1-4-1'?(h2<.5?'4-3-3':'3-4-3'):b[0]==='4'?(h2<.6?'3-4-3':b):b;
    else if(pr!=='다이렉트')atk=b==='4-2-3-1'||b==='4-1-4-1'?(h2<.5?'4-3-3':b):b}
  else if(five&&!weak)atk=b==='5-3-2'?'3-5-2':'3-4-3';
  t.form={base:b,atk,def};return t}
{const _a=aiTacFor;aiTacFor=function(c){return aiPhase(_a.apply(this,arguments),c)}}
{const _tf=teamFor;teamFor=function(c){try{if(c!==S.club&&S.aiTac&&S.aiTac[c])aiPhase(S.aiTac[c],c)}catch(e){}return _tf.apply(this,arguments)}}

