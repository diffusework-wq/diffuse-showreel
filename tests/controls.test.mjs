import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitize,defaults} from '../src/controls.js';
import {glassLayer} from '../src/visual-system.js';
test('saved controls reject invalid colors and bound rendering parameters',()=>{const s=sanitize({layers:999,softness:0,opacity:-1,strength:NaN,colors:[{core:'bad',highlight:'#abcdef'}]});assert.equal(s.layers,24);assert.equal(s.softness,.035);assert.equal(s.opacity,.1);assert.equal(s.strength,defaults().strength);assert.equal(s.colors[0].core,defaults().colors[0].core);assert.equal(s.colors[0].highlight,'#abcdef');});
test('all editable layer counts stay sorted with a fixed front pane',()=>{for(let count=2;count<=24;count++){for(const time of [0,1,10,99]){let previous=-1;for(let i=0;i<count;i++){const layer=glassLayer(i,time,count);assert.ok(layer.position>=previous);assert.ok(Number.isFinite(layer.opacity));previous=layer.position;}assert.equal(previous,1);}}});
import {curveValue} from '../src/curve-editor.js';
test('depth curves preserve endpoints and the solid center without overshoot',()=>{
 const points=[0,1,0];assert.equal(curveValue(points,0),0);assert.equal(curveValue(points,.5),1);assert.equal(curveValue(points,1),0);
 for(let i=0;i<=100;i++){const t=i/100;assert.ok(curveValue(points,t)>=0&&curveValue(points,t)<=1);assert.ok(Math.abs(curveValue(points,t)-curveValue(points,1-t))<1e-9);}
 assert.equal(curveValue([0,0,0],.3),0);assert.equal(curveValue([2,2,2],.8),2);
});
test('material settings migrate old presets and reject unsafe or unavailable font values',()=>{
 const s=sanitize({fillCurve:[-1,2,null],edgeCurve:[4,.25,-3],ior:10,roughness:-2,lightShape:'bad',font:'local'});
 assert.deepEqual(s.fillCurve,[0,1,1]);assert.deepEqual(s.edgeCurve,[2,.25,0]);assert.equal(s.ior,2.5);assert.equal(s.roughness,0);assert.equal(s.font,'design');assert.equal(s.lightShape,'dual');
 assert.deepEqual(sanitize({layers:12}).fillCurve,[1,1,1]);assert.equal(sanitize({font:'serif',lightShape:'rectangle'}).font,'serif');
});
test('light count and independent endpoint transforms survive validation',()=>{
 const s=sanitize({lightCount:99,diffuseX:25,showX:-40,diffusePivot:'front',showPivot:'rear',showY:900});
 assert.equal(s.lightCount,6);assert.equal(s.diffuseX,25);assert.equal(s.showX,-40);assert.equal(s.showY,70);assert.equal(s.diffusePivot,'front');assert.equal(s.showPivot,'rear');assert.equal(sanitize({lightCount:-3}).lightCount,1);assert.equal(sanitize({lightShape:'ellipse'}).lightCount,1);
});
test('legacy settings default to contour-preserving crossfade and alternatives persist',()=>{assert.equal(sanitize({}).transition,'crossfade');assert.equal(sanitize({transition:'layers'}).transition,'layers');assert.equal(sanitize({transition:'bad'}).transition,'crossfade');});
