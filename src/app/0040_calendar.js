// ================= 달력 =================
const SEASON_START='2026-07-01';
function leagueDates(y){ // 38라운드, 8월 셋째 주 일요일 시작, A매치 기간 2회 휴식
  let d=`${y}-08-16`; const out=[]; const skip=[`${y}-10-11`,`${y}-11-15`,`${y+1}-03-28`];
  while(out.length<38){ if(!skip.includes(d)) out.push(d); d=addD(d,7) } return out }
function roundRobin(teams){ // 더블 라운드로빈
  const n=teams.length, t=[...teams], rounds=[];
  for(let r=0;r<n-1;r++){const m=[];for(let i=0;i<n/2;i++){const a=t[i],b=t[n-1-i];m.push(r%2?[b,a]:[a,b])}rounds.push(m);t.splice(1,0,t.pop())}
  return rounds.concat(rounds.map(r=>r.map(([a,b])=>[b,a])));
}
function windows(y,first){ // 이적시장
  const w=[{k:'winter',from:`${y+1}-01-02`,to:`${y+1}-02-01`}];
  if(!first) w.unshift({k:'summer',from:`${y}-07-01`,to:`${y}-09-01`});
  return w }
function winNow(){return S.windows.find(w=>S.date>=w.from&&S.date<=w.to)}
function nextWin(){return S.windows.find(w=>S.date<w.from)}

