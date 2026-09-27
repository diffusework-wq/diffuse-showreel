import test from 'node:test';
import assert from 'node:assert/strict';
import {autoGlow} from '../src/auto-glow.js';
const settings={autoStart:45,autoEnd:70,autoAmount:1,autoSpeed:1};
test('auto glow is bounded, gated and disabled at zero',()=>{
 for(let i=0;i<10;i++)for(let t=0;t<30;t+=.1){const a=autoGlow(i,t,.55,settings);assert.ok(a>=0&&a<=1);}
 for(const p of [0,.44,.45,.7,1])assert.equal(autoGlow(1,3,p,settings),0);
 assert.equal(autoGlow(1,3,.55,{...settings,autoAmount:0}),0);
});
test('auto glow varies independently and stays continuous across cycles',()=>{
 assert.notEqual(autoGlow(0,3,.55,settings),autoGlow(1,3,.55,settings));
 assert.notEqual(autoGlow(0,3,.55,settings),autoGlow(0,4,.55,settings));
 assert.ok(Math.abs(autoGlow(0,1/.45-.0001,.55,settings)-autoGlow(0,1/.45+.0001,.55,settings))<.001);
});
