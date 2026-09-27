import {LETTERS} from './timeline.js';
import {COLOR_FAMILIES} from './visual-system.js';
const key='diffuse-glass-controls-v1';
export const ranges={layers:[2,24,1],strength:[0,1.5,.01],softness:[.035,.3,.005],solid:[0,1,.01],opacity:[.1,1,.01],outline:[0,2,.01],glow:[0,3,.01],saturation:[0,1.8,.01]};
export function defaults(){return {layers:10,strength:.8,softness:.16,solid:.45,opacity:1,outline:1,glow:1,saturation:1,colors:LETTERS.map(l=>({core:COLOR_FAMILIES[l.family].core,highlight:COLOR_FAMILIES[l.family].highlight}))};}
export function sanitize(input){const out=defaults();for(const [k,[min,max]] of Object.entries(ranges)){if(Number.isFinite(input?.[k]))out[k]=Math.min(max,Math.max(min,input[k]));}out.layers=Math.round(out.layers);out.colors.forEach((c,i)=>{for(const k of ['core','highlight'])if(/^#[0-9a-f]{6}$/i.test(input?.colors?.[i]?.[k]))c[k]=input.colors[i][k];});return out;}
export function createControls(onChange,onScrub){
 let settings=defaults();try{settings=sanitize(JSON.parse(localStorage.getItem(key)));}catch{}
 const toggle=document.createElement('button');toggle.id='controls-toggle';toggle.textContent='調整玻璃';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','glass-controls');document.body.append(toggle);
 const panel=document.createElement('aside');panel.id='glass-controls';panel.hidden=true;panel.setAttribute('aria-label','玻璃效果控制');
 panel.innerHTML=`<header><div><small>DIFFUSE / EFFECT CONTROLS</small><h2>玻璃效果</h2></div><button type="button" id="controls-close" aria-label="關閉調整面板">×</button></header><p>即時預覽 · 設定儲存在這台瀏覽器</p><label>預覽段落<input aria-label="預覽段落" id="preview-scrub" type="range" min="0" max="0.55" step="0.005" value="0"></label><div class="preview-ends"><span>DIFFUSE</span><span>SHOW / REEL</span></div><fieldset><legend>色彩 / COLOR</legend><label>選擇字母<select id="letter-select" aria-label="選擇字母">${LETTERS.map((l,i)=>`<option value="${i}">${i+1} · ${l.from} → ${l.to||'消失'}</option>`).join('')}</select></label><div class="color-row"><label>本色<input type="color" id="core-color" aria-label="字母本色"></label><label>高光色<input type="color" id="highlight-color" aria-label="字母高光色"></label></div></fieldset><div id="effect-ranges"></div><div class="control-actions"><button id="reset-glass">重設全部</button><button id="export-glass">匯出設定</button></div><p id="control-status" role="status">本機調整不會變更其他訪客看到的版本。</p>`;
 document.body.append(panel);
 const names={layers:'薄片 / 線條層數',strength:'高光強度',softness:'高光柔和度',solid:'透明 → 實心',opacity:'整體不透明度',outline:'輪廓線強度',glow:'邊緣光暈',saturation:'色彩飽和度'};
 const container=panel.querySelector('#effect-ranges');
 for(const [k,[min,max,step]] of Object.entries(ranges)){const label=document.createElement('label');label.innerHTML=`<span>${names[k]}<output id="value-${k}"></output></span><input aria-label="${names[k]}" data-setting="${k}" type="range" min="${min}" max="${max}" step="${step}">`;container.append(label);}
 const select=panel.querySelector('select');
 function refresh(){for(const k of Object.keys(ranges)){panel.querySelector(`[data-setting="${k}"]`).value=settings[k];panel.querySelector(`#value-${k}`).textContent=k==='layers'?settings[k]:settings[k].toFixed(2);}for(const k of ['core','highlight'])panel.querySelector(`#${k}-color`).value=settings.colors[+select.value][k];}
 function apply(){refresh();onChange(settings);try{localStorage.setItem(key,JSON.stringify(settings));}catch{panel.querySelector('#control-status').textContent='設定目前僅保留於此頁；可匯出保存。';}}
 panel.addEventListener('input',e=>{const k=e.target.dataset.setting;if(k){settings[k]=+e.target.value;apply();}});
 for(const k of ['core','highlight'])panel.querySelector(`#${k}-color`).addEventListener('input',e=>{settings.colors[+select.value][k]=e.target.value;apply();});
 select.addEventListener('change',refresh);
 panel.querySelector('#preview-scrub').addEventListener('input',e=>onScrub(+e.target.value));
 function open(value){panel.hidden=!value;toggle.setAttribute('aria-expanded',String(value));if(value)panel.querySelector('#controls-close').focus();else toggle.focus();}
 toggle.onclick=()=>open(panel.hidden);panel.querySelector('#controls-close').onclick=()=>open(false);
 panel.addEventListener('keydown',e=>{if(e.key==='Escape')open(false);});
 panel.querySelector('#reset-glass').onclick=()=>{settings=defaults();apply();};
 panel.querySelector('#export-glass').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,...settings},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='diffuse-glass-settings.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 for(const event of ['wheel','touchstart','touchmove'])panel.addEventListener(event,e=>e.stopPropagation(),{passive:true});
 refresh();onChange(settings);return {panel};
}
