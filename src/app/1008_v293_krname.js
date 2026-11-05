// ================= v293 한국 선수 짧은 이름 통일(사용자 요청 2026-11-05) =================
// 문제: 짧은 이름(경기·라인업 표시)이 이름의 마지막 단어라, 'Min-kyu Joo'는 성(Joo), 'Kim Jin Su'는 이름 끝 글자(Su)로 섞여 나옴
// v293 사용자 요청("통일해줘"): 전체 이름도 한국식 '성 이름'(Joo Min-kyu, Kim Jin-su)으로 통일 — 데이터 표기가 'Min-kyu Joo'·'Kim Jin Su'로 섞여 있었음
// 수정: 국적 KOR 선수는 성을 빼고 이름만 'Min-kyu', 'Jin-su', 'Seung-woo'처럼 표시(김·이·박이 많아 성만 쓰면 구분이 안 됨)
const KR_SUR=new Set('kim lee yi rhee park pak choi choe jung jeong chung kang cho jo yoon yun jang chang lim im han oh seo suh shin kwon hwang ahn an song jeon jun chun cheon hong yoo yu ryu ko go moon mun yang son bae baek paik heo hur nam shim sim noh roh ha kwak sung seong cha joo ju woo koo gu min na jin ji uhm eom chae won bang kong hyun ham byun yeom yeo choo chu do so seok sun seol ma gil wi pyo myung ki ban wang geum ok yook yuk in maeng je mo tak kook guk yeon bong eun pi jegal seonwoo hwangbo namgung um goh eo byeon byun joung gong ri ryang sohn yoo chung'.split(' '));
function krGiven(n){const w=String(n).trim().split(/\s+/);if(w.length<2)return null;const isS=t=>KR_SUR.has(t.toLowerCase().replace(/-/g,''));
  const fmt=a=>{const s=a.join('-').toLowerCase();return s.charAt(0).toUpperCase()+s.slice(1)};
  if(isS(w[0])&&!w[0].includes('-'))return fmt(w.slice(1));if(isS(w[w.length-1]))return fmt(w.slice(0,-1));return null}
function krFull(n){const w=String(n).trim().split(/\s+/);if(w.length<2)return null;const isS=t=>KR_SUR.has(t.toLowerCase().replace(/-/g,''));const cap=t=>t.charAt(0).toUpperCase()+t.slice(1).toLowerCase();
  const fmt=a=>{const s=a.join('-').toLowerCase();return s.charAt(0).toUpperCase()+s.slice(1)};
  if(isS(w[0])&&!w[0].includes('-'))return cap(w[0])+' '+fmt(w.slice(1));if(isS(w[w.length-1]))return cap(w[w.length-1])+' '+fmt(w.slice(0,-1));return null}
function krRename(P){try{if(!P||!(P.nat==='KOR'||P.nat==='PRK')||!P.name||P._krn)return;const f=krFull(P.name);if(f&&f!==P.name){P.name0=P.name;P.name=f}P._krn=1}catch(e){}}
const KR_SHORT=window.__KRS={};
function krShortBuild(){try{for(const id in BASE){const p=BASE[id];krRename(p);if(p&&(p.nat==='KOR'||p.nat==='PRK')&&p.name&&KR_SHORT[p.name]===undefined)KR_SHORT[p.name]=krGiven(p.name)||''}}catch(e){}}
krShortBuild();{const _dl=devLoad;devLoad=function(){const r=_dl.apply(this,arguments);krShortBuild();return r}}
