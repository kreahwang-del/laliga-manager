// ================= v161 금액 입력: 단계 버튼(±) 사이 금액을 누르면 숫자 직접 입력(백만 유로 단위), 좌우로 끌면 세밀하게 조절(빠르게 끌수록 큰 단위) =================
function stpInfo(st){const b=st.querySelector('button');if(!b)return null;const d=b.dataset;
  if(d.o==='fee'&&UI.off)return {get:()=>UI.off.fee,set:v=>{UI.off.fee=Math.max(0,Math.round(v/1e5)*1e5);UI.off.resp=null},re:()=>offerSheet(UI.off.id),fine:1e5};
  if(d.o==='wage'&&UI.off)return {get:()=>UI.off.wage,set:v=>{UI.off.wage=Math.max(1e5,Math.round(v/1e4)*1e4);UI.off.resp=null},re:()=>offerSheet(UI.off.id),fine:1e4};
  if(d.tfo==='lfee'&&UI.off&&typeof tfOff==='function')return {get:()=>tfOff().lfee||0,set:v=>{const O=tfOff();O.lfee=Math.max(1e6,Math.round(v/1e5)*1e5);O.resp=null},re:()=>offerSheet(UI.off.id),fine:1e5};
  if(d.r==='wage'&&UI.ren)return {get:()=>UI.ren.wage,set:v=>{UI.ren.wage=Math.max(1e5,Math.round(v/1e4)*1e4);UI.ren.resp=null},re:()=>renewSheet(UI.ren.id),fine:1e4};
  return null}
function stpEnhance(){document.querySelectorAll('#scrim .stepper').forEach(st=>{if(st.dataset.enh)return;const I=stpInfo(st);if(!I)return;st.dataset.enh=1;const v=st.querySelector('.v');if(!v)return;
  v.classList.add('stpv');v.setAttribute('role','button');v.setAttribute('aria-label','금액 입력 또는 좌우로 끌어 조절');
  const h=document.createElement('div');h.className='note stph';h.textContent='금액을 누르면 직접 입력 · 좌우로 끌면 세밀하게 조절';st.insertAdjacentElement('afterend',h)})}
new MutationObserver(()=>{try{stpEnhance()}catch(e){}}).observe(document.body,{childList:true,subtree:false});
{const cs=document.createElement('style');cs.textContent='.stepper .stpv{cursor:ew-resize;touch-action:pan-y;user-select:none;-webkit-user-select:none;text-decoration:underline dotted var(--faint);text-underline-offset:4px}.stepper .stpv.drag{color:var(--amber)}.stph{margin:2px 0 0;font-size:11px;text-align:center}.stpin{width:100%;font:inherit;font-weight:700;text-align:center;background:var(--bg2,#0e1218);color:var(--text,#fff);border:1px solid var(--amber);border-radius:8px;padding:4px 6px}';document.head.appendChild(cs)}
{let D=null;
 document.addEventListener('pointerdown',e=>{const v=e.target.closest&&e.target.closest('.stepper .stpv');if(!v||v.querySelector('input'))return;const I=stpInfo(v.closest('.stepper'));if(!I)return;
   D={v,I,x0:e.clientX,lx:e.clientX,lt:performance.now(),val:I.get(),acc:0,drag:false,id:e.pointerId};try{v.setPointerCapture(e.pointerId)}catch(_){}} ,true);
 document.addEventListener('pointermove',e=>{if(!D||e.pointerId!==D.id)return;const now=performance.now(),dx=e.clientX-D.lx,dt=Math.max(8,now-D.lt);if(!D.drag&&Math.abs(e.clientX-D.x0)<8)return;
   if(!D.drag){D.drag=true;D.v.classList.add('drag')}D.lx=e.clientX;D.lt=now;D.sp=(D.sp||0)*.6+Math.abs(dx)/dt*.4;const sp=D.sp;const mult=sp>2?50:sp>.8?10:1;D.acc+=dx;const n=Math.trunc(D.acc/9);if(n){D.acc-=n*9;D.val=Math.max(0,D.val+n*D.I.fine*mult);D.I.set(D.val);D.val=D.I.get();D.v.textContent=money(D.val)}e.preventDefault()},true);
 const end=e=>{if(!D||e.pointerId!==D.id)return;const d=D;D=null;d.v.classList.remove('drag');if(d.drag){d.I.re();return}stpInput(d.v,d.I)};
 document.addEventListener('pointerup',end,true);document.addEventListener('pointercancel',e=>{if(D&&e.pointerId===D.id){const d=D;D=null;d.v.classList.remove('drag');if(d.drag)d.I.re()}},true)}
function stpInput(v,I){const cur=I.get()/1e6;v.innerHTML=`<input class="stpin" type="text" inputmode="decimal" enterkeyhint="done" aria-label="금액(백만 유로)" value="${+cur.toFixed(2)}">`;const inp=v.querySelector('input');
  const lab=document.createElement('div');lab.className='note stph';lab.textContent='백만 유로(M) 단위로 입력 · 예: 37.5 = €37.5M, 0.8 = €80만';v.closest('.stepper').insertAdjacentElement('afterend',lab);
  let done=false;const commit=ok=>{if(done)return;done=true;if(ok){const x=parseFloat(String(inp.value).replace(/,/g,'.').replace(/[^0-9.]/g,''));if(isFinite(x))I.set(x*1e6)}I.re()};
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commit(true)}else if(e.key==='Escape')commit(false)});inp.addEventListener('blur',()=>commit(true));
  setTimeout(()=>{inp.focus();inp.select()},30)}

