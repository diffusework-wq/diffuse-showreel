import test from 'node:test';
import assert from 'node:assert/strict';
import {GLASS_LAYERS,glassLayer,depthOptics,COLOR_FAMILIES} from '../src/visual-system.js';
import {LETTERS} from '../src/timeline.js';

test('front silhouette remains stationary and all moving panes stay sorted behind it',()=>{
  const front=glassLayer(GLASS_LAYERS-1,0);
  for(let t=0;t<80;t+=.137){
    assert.deepEqual(glassLayer(GLASS_LAYERS-1,t),front);
    const stack=Array.from({length:GLASS_LAYERS},(_,i)=>glassLayer(i,t));
    for(let i=1;i<stack.length;i++)assert.ok(stack[i].position>stack[i-1].position);
    for(const layer of stack)assert.ok(layer.opacity>=0&&layer.opacity<=1&&layer.brightness>=0&&layer.brightness<=1);
  }
});

test('echo loop reindexing preserves each visible pane and entering/exiting panes are transparent',()=>{
  const count=GLASS_LAYERS-1,period=1/(.032*count),epsilon=1e-7;
  for(let loop=1;loop<20;loop++){
    const before=Array.from({length:count},(_,i)=>glassLayer(i,loop*period-epsilon));
    const after=Array.from({length:count},(_,i)=>glassLayer(i,loop*period+epsilon));
    assert.ok(before.at(-1).opacity<1e-8&&after[0].opacity<1e-8);
    for(let i=0;i<count-1;i++)for(const key of ['position','brightness','opacity'])assert.ok(Math.abs(before[i][key]-after[i+1][key])<1e-6);
  }
});

test('depth reduces optical density and each morph keeps a single approved family',()=>{
  let previous=depthOptics(0);
  for(let n=1;n<=1000;n++){
    const current=depthOptics(n/1000);
    assert.ok(current.brightness>=previous.brightness&&current.opacity>=previous.opacity);
    previous=current;
  }
  assert.equal(LETTERS[0].family,LETTERS[9].family);
  assert.equal(LETTERS[6].family,LETTERS[7].family);
  for(const letter of LETTERS)assert.ok(COLOR_FAMILIES[letter.family]);
});
