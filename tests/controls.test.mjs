import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitize,defaults} from '../src/controls.js';
import {glassLayer} from '../src/visual-system.js';
test('saved controls reject invalid colors and bound rendering parameters',()=>{const s=sanitize({layers:999,softness:0,opacity:-1,strength:NaN,colors:[{core:'bad',highlight:'#abcdef'}]});assert.equal(s.layers,24);assert.equal(s.softness,.035);assert.equal(s.opacity,.1);assert.equal(s.strength,defaults().strength);assert.equal(s.colors[0].core,defaults().colors[0].core);assert.equal(s.colors[0].highlight,'#abcdef');});
test('all editable layer counts stay sorted with a fixed front pane',()=>{for(let count=2;count<=24;count++){for(const time of [0,1,10,99]){let previous=-1;for(let i=0;i<count;i++){const layer=glassLayer(i,time,count);assert.ok(layer.position>=previous);assert.ok(Number.isFinite(layer.opacity));previous=layer.position;}assert.equal(previous,1);}}});
