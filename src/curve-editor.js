// Monotonic segment interpolation matches the GLSL depth curve exactly.
export function curveValue(values,t){const segment=t<=.5?0:1;const u=Math.max(0,Math.min(1,(t-segment*.5)*2));const eased=u*u*(3-2*u);return values[segment]*(1-eased)+values[segment+1]*eased;}
export function createCurveEditor(host,title,max,onChange){
 let values=[1,1,1];
 host.className='curve-editor';host.innerHTML=`<h3>${title}</h3><svg viewBox="0 0 260 126" aria-label="${title}圖表"><path class="curve-grid" d="M16 12H244 M16 62H244 M16 112H244 M16 12V112 M130 12V112 M244 12V112"/><path class="curve-path"/>${[0,1,2].map(i=>`<circle data-point="${i}" r="7" cx="${16+i*114}" cy="62"/>`).join('')}</svg><div class="curve-inputs">${['開始・後層','中間','結束・前層'].map((name,i)=>`<label>${name}<input type="number" aria-label="${title} ${name}" min="0" max="${max}" step="0.05" data-point="${i}"></label>`).join('')}</div>`;
 const svg=host.querySelector('svg');
 function update(next){values=[...next];const points=Array.from({length:65},(_,i)=>`${16+i/64*228},${112-curveValue(values,i/64)/max*100}`);host.querySelector('.curve-path').setAttribute('d','M'+points.join(' L'));host.querySelectorAll('circle').forEach((el,i)=>el.setAttribute('cy',112-values[i]/max*100));host.querySelectorAll('input').forEach((el,i)=>el.value=+values[i].toFixed(2));}
 let dragging=-1;
 function move(e){if(dragging<0)return;const box=svg.getBoundingClientRect();const y=(e.clientY-box.top)/box.height*126;values[dragging]=Math.round(Math.max(0,Math.min(max,(112-y)/100*max))*100)/100;onChange([...values]);}
 svg.addEventListener('pointerdown',e=>{if(e.target.dataset.point===undefined)return;e.preventDefault();dragging=+e.target.dataset.point;svg.setPointerCapture(e.pointerId);move(e);});
 svg.addEventListener('pointermove',move);svg.addEventListener('pointerup',()=>dragging=-1);svg.addEventListener('pointercancel',()=>dragging=-1);
 host.querySelectorAll('input').forEach((el,i)=>el.addEventListener('change',()=>{const value=Number(el.value);if(Number.isFinite(value)){values[i]=Math.max(0,Math.min(max,value));onChange([...values]);}else update(values);}));
 update(values);return {update};
}
