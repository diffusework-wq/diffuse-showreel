import * as THREE from 'three';
import './style.css';
import {LETTERS,clamp,smooth,timeline,localMorph,slotPosition} from './timeline.js';
import {makeGlyphTexture,sampleGlyphField,glassVertex,glassFragment} from './glyphs.js';
import {createCinema} from './video.js';
import {createAtmosphere} from './atmosphere.js';

const canvas=document.querySelector('#scene');
const loading=document.querySelector('#loading');
const diagnostics=document.querySelector('#diagnostics');
const params=new URLSearchParams(location.search);
const debug=params.has('debug');
diagnostics.hidden=!debug||params.get('debug')==='quiet';
const quality={layers:15,pixelRatio:Math.min(devicePixelRatio,2)};
const state={target:0,progress:0,hover:-1,hoverAmounts:Array(10).fill(0),frames:[],phaseFrames:{},events:[],errors:[],phase:'initializing',pointer:{x:-100,y:-100},started:performance.now()};
window.addEventListener('error',e=>state.errors.push(e.message));
window.addEventListener('unhandledrejection',e=>state.errors.push(String(e.reason)));
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});}catch(error){document.querySelector('#fatal-error').hidden=false;document.querySelector('#fatal-error').textContent='This experience needs a browser with WebGL 2 enabled.';loading.hidden=true;throw error;}
renderer.setClearColor(0x030406,0);renderer.setPixelRatio(quality.pixelRatio);renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.1,80);
let baseZ=18;
const root=new THREE.Group();scene.add(root);
const raycaster=new THREE.Raycaster();
const pointer=new THREE.Vector2();
const labels=document.querySelector('#letter-labels');
const temp=new THREE.Object3D();
const hitGeometry=new THREE.PlaneGeometry(2.5,2.7);
const hitMaterial=new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide});
const glyphs=[];
const labelPoint=new THREE.Vector3();

for(let i=0;i<LETTERS.length;i++){
  const spec=LETTERS[i];
  const geo=new THREE.PlaneGeometry(2.5,2.7);
  const layers=new THREE.InstancedBufferAttribute(new Float32Array(quality.layers),1).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('layerPosition',layers);
  const uniforms={uGlyph:{value:makeGlyphTexture(spec.from,spec.to)},uColor:{value:new THREE.Color(spec.color)},uMorph:{value:0},uOpacity:{value:1},uTime:{value:0},uHover:{value:0},uPixelRatio:{value:quality.pixelRatio}};
  const material=new THREE.ShaderMaterial({vertexShader:glassVertex,fragmentShader:glassFragment,uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const mesh=new THREE.InstancedMesh(geo,material,quality.layers);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;
  mesh.userData.index=i;mesh.boundingSphere=new THREE.Sphere(new THREE.Vector3(),4);
  const group=new THREE.Group();group.add(mesh);root.add(group);
  const hit=new THREE.Mesh(hitGeometry,hitMaterial);hit.userData.index=i;root.add(hit);
  const label=document.createElement('div');label.className='letter-label';label.innerHTML=`${spec.title}<small>${spec.subtitle}</small>`;labels.append(label);
  glyphs.push({spec,group,mesh,layers,uniforms,hit,label,morph:0,opacity:1});
}
const cinema=createCinema();
const atmosphere=createAtmosphere();
const cinemaElement=document.querySelector('#cinema');
const chapter=document.querySelector('#chapter');
const instruction=document.querySelector('#instruction');
const fill=document.querySelector('#progress-fill');
const progressLabel=document.querySelector('#progress-label');

function resize(){
  quality.pixelRatio=Math.min(devicePixelRatio,2);renderer.setPixelRatio(quality.pixelRatio);
  for(const g of glyphs)g.uniforms.uPixelRatio.value=quality.pixelRatio;
  camera.aspect=innerWidth/innerHeight;
  baseZ=Math.max(14.5,7.5/(Math.tan(THREE.MathUtils.degToRad(19))*camera.aspect));
  camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
}
resize();addEventListener('resize',resize);
addEventListener('pointermove',event=>{state.pointer.x=event.clientX;state.pointer.y=event.clientY;});
document.addEventListener('pointerleave',()=>{state.pointer.x=-100;state.pointer.y=-100;state.hover=-1;});
addEventListener('wheel',event=>{if(event.ctrlKey)return;event.preventDefault();const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);state.target=clamp(state.target+delta/4200);state.events.push({type:'wheel',delta,target:state.target,time:performance.now()});if(state.events.length>80)state.events.shift();},{passive:false});
let touchY=null;
addEventListener('touchstart',event=>{touchY=event.touches[0]?.clientY;},{passive:true});
addEventListener('touchmove',event=>{if(touchY===null)return;const y=event.touches[0].clientY;state.target=clamp(state.target+(touchY-y)/2400);touchY=y;},{passive:true});

function snapshot(){
  const durations=state.frames.filter(x=>x<1000),sorted=[...durations].sort((a,b)=>a-b);
  const mean=durations.reduce((a,b)=>a+b,0)/Math.max(durations.length,1);
  const phases=Object.fromEntries(Object.entries(state.phaseFrames).map(([key,values])=>{const s=[...values].sort((a,b)=>a-b);return [key,{samples:values.length,fps:1000/(values.reduce((a,b)=>a+b,0)/values.length),p95ms:s[Math.floor(s.length*.95)]}];}));
  return {phase:state.phase,progress:+state.progress.toFixed(4),target:+state.target.toFixed(4),hover:state.hover,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,renderDpr:renderer.getPixelRatio()},userAgent:navigator.userAgent,performance:{samples:durations.length,fps:+(1000/mean).toFixed(1),p95ms:sorted[Math.floor(sorted.length*.95)]||0,phases},renderer:{drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles},letters:glyphs.map((g,i)=>({index:i,from:g.spec.from,to:g.spec.to,morph:+g.morph.toFixed(3),opacity:+g.opacity.toFixed(3),center:{x:+((g.hit.position.clone().project(camera).x*.5+.5)*innerWidth).toFixed(1),y:+((-g.hit.position.clone().project(camera).y*.5+.5)*innerHeight).toFixed(1)}})),video:{...cinema.data},atmosphere:atmosphere.data,events:state.events,errors:state.errors};
}
// Read-only diagnostics support verification without synthetic interaction shortcuts.
Object.defineProperty(window,'__SHOWREEL__',{value:{snapshot},writable:false});
let prev=performance.now(),lastReport=0,lastSave=0;
function render(now){
  const dt=Math.min((now-prev)/1000,.05);const actualDt=now-prev;prev=now;const t=(now-state.started)/1000;
  state.progress+=(state.target-state.progress)*(1-Math.exp(-8*dt));
  if(Math.abs(state.target-state.progress)<.00001)state.progress=state.target;
  const timelineState=timeline(state.progress);
  state.phase=timelineState.cinema>.6?'film':timelineState.push>.01?'push':timelineState.morph>.99?'showreel':timelineState.morph>.01?'morph':'diffuse';
  camera.position.set(0,timelineState.push*.35,baseZ*(1-timelineState.push*.86));
  camera.lookAt(0,0,-2);camera.updateMatrixWorld();
  const lettersOpacity=1-smooth(.38,.89,timelineState.push);
  for(let i=0;i<glyphs.length;i++){
    const g=glyphs[i],pos=slotPosition(i,timelineState.morph,camera.aspect);
    state.hoverAmounts[i]+=(Number(state.hover===i)-state.hoverAmounts[i])*(1-Math.exp(-7*dt));
    const hover=state.hoverAmounts[i];
    g.morph=localMorph(timelineState.morph,hover);
    g.opacity=lettersOpacity*(g.spec.to===null?1-smooth(.05,1,g.morph):1);
    g.group.position.set(pos.x,pos.y,0);
    g.group.rotation.set(-.3,-.38,0);
    g.hit.position.set(pos.x,pos.y,.55);g.hit.rotation.copy(g.group.rotation);
    g.uniforms.uMorph.value=g.morph;g.uniforms.uOpacity.value=g.opacity;g.uniforms.uTime.value=t+i*.37;g.uniforms.uHover.value=hover;
    const depth=2.05*(1-.28*timelineState.morph)+hover*.25;
    const flow=((t+i*.37)*.032*quality.layers)%1;
    for(let j=0;j<quality.layers;j++){
      // Keep every pane rigid and draw back to front even across the loop seam.
      const l=(j+flow)/quality.layers;
      g.layers.setX(j,l);
      temp.position.set(0,0,(l-.5)*depth);
      temp.updateMatrix();g.mesh.setMatrixAt(j,temp.matrix);
    }
    g.layers.needsUpdate=true;
    g.mesh.instanceMatrix.needsUpdate=true;
    g.group.visible=lettersOpacity>.002;
    labelPoint.set(pos.x,pos.y-1.83,0).project(camera);
    g.label.style.left=`${(labelPoint.x*.5+.5)*innerWidth}px`;g.label.style.top=`${(-labelPoint.y*.5+.5)*innerHeight}px`;g.label.style.opacity=String(timelineState.label*(1-hover*.6));
  }
  scene.updateMatrixWorld(true);
  pointer.set(state.pointer.x/innerWidth*2-1,1-state.pointer.y/innerHeight*2);raycaster.setFromCamera(pointer,camera);
  const hits=timelineState.push<.15?raycaster.intersectObjects(glyphs.map(g=>g.mesh),false):[];
  const hit=hits.find(h=>{
    const g=glyphs[h.object.userData.index];
    if(g.spec.to===null&&timelineState.morph>.97)return false;
    const layer=g.layers.getX(h.instanceId);
    if(layer<.03||layer>.97)return false;
    const [source,target]=sampleGlyphField(g.uniforms.uGlyph.value.image,h.uv.x,h.uv.y);
    const baseline=source*(1-timelineState.morph)+target*timelineState.morph;
    const current=source*(1-g.morph)+target*g.morph;
    return Math.max(baseline,state.hover===h.object.userData.index?current:0)>.496;
  });
  const nextHover=hit?hit.object.userData.index:-1;
  if(nextHover!==state.hover){state.events.push({type:'hover',from:state.hover,to:nextHover,time:now});if(state.events.length>80)state.events.shift();}
  state.hover=nextHover;
  const reveal=timelineState.cinema;
  cinemaElement.style.opacity=String(reveal);cinemaElement.style.visibility=reveal>.001?'visible':'hidden';cinemaElement.style.transform=`translate(-50%, -62%) scale(${.68+.32*reveal})`;
  cinema.update(reveal,now);
  atmosphere.update(cinema.data.time,reveal,dt);
  chapter.textContent=timelineState.chapter;
  instruction.textContent=reveal>.6?'SCROLL UP TO RETURN':timelineState.morph>.9?'SCROLL INTO THE FILM':'HOVER TO DISCOVER · SCROLL TO EXPLORE';
  fill.style.height=`${state.progress*100}%`;progressLabel.textContent=`${String(Math.round(state.progress*100)).padStart(2,'0')} / 100`;
  renderer.render(scene,camera);
  if(t>4&&!document.hidden&&actualDt<1000){state.frames.push(actualDt);if(state.frames.length>1800)state.frames.shift();const list=state.phaseFrames[state.phase]??=[];list.push(actualDt);if(list.length>1800)list.shift();}
  if(now-lastReport>500){lastReport=now;const report=snapshot();diagnostics.dataset.report=JSON.stringify(report);diagnostics.textContent=JSON.stringify({phase:report.phase,progress:report.progress,hover:report.hover,viewport:report.viewport,performance:report.performance,video:report.video,atmosphere:report.atmosphere,errors:report.errors},null,2);if(import.meta.env.DEV&&debug&&now-lastSave>2500){lastSave=now;navigator.sendBeacon('/__showreel_metrics',new Blob([JSON.stringify(report)],{type:'application/json'}));}}
  requestAnimationFrame(render);
}
loading.hidden=true;state.phase='diffuse';requestAnimationFrame(render);
document.addEventListener('visibilitychange',()=>{prev=performance.now();});
