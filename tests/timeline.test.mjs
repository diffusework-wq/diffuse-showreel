import test from 'node:test';
import assert from 'node:assert/strict';
import {LETTERS,timeline,localMorph,slotPosition,letterTurn} from '../src/timeline.js';
test('approved glyph mapping yields two four-letter rows',()=>{assert.equal(LETTERS.slice(0,5).map(x=>x.to||'').join(''),'SHOW');assert.equal(LETTERS.slice(5).map(x=>x.to||'').join(''),'REEL');assert.deepEqual(LETTERS.map((x,i)=>x.to===null?i:-1).filter(x=>x>=0),[2,7]);});
test('scrub is reversible and final glyphs settle before camera advances',()=>{let prev=timeline(0);const forward=[prev];for(let n=1;n<=1000;n++){const cur=timeline(n/1000);assert.ok(cur.morph>=prev.morph&&cur.push>=prev.push&&cur.cinema>=prev.cinema);if(cur.push>0)assert.equal(cur.morph,1);prev=cur;forward.push(cur);}for(let n=1000;n>=0;n--)assert.deepEqual(timeline(n/1000),forward[n]);assert.equal(timeline(-1).progress,0);assert.equal(timeline(2).progress,1);});
test('hover release preserves current scroll morph; hover cannot reverse it',()=>{for(const p of [0,.2,.6,1]){assert.equal(localMorph(p,0),p);assert.equal(localMorph(p,1),1);assert.ok(localMorph(p,.5)>=p);}});
test('final positions have four equally spaced surviving columns',()=>{for(const row of [0,5]){const xs=[0,1,3,4].map(i=>slotPosition(i+row,1,16/9).x);for(let i=1;i<xs.length;i++)assert.ok(Math.abs(xs[i]-xs[i-1]-2.6)<1e-9);}});

test('rotation precedes replacement and settles at opposite facing',()=>{
  const start=letterTurn(0),end=letterTurn(1);
  assert.ok(start.yaw<0&&end.yaw>0&&end.yaw-start.yaw>.9);
  assert.equal(letterTurn(.25).morph,0);
  assert.ok(letterTurn(.25).yaw>start.yaw);
  assert.equal(end.morph,1);
  assert.ok(end.pitch<=-.5,"final view must show diagonal depth, not a level side view");
  let previous=start;
  for(let i=1;i<=100;i++){
    const next=letterTurn(i/100);
    assert.ok(next.yaw>=previous.yaw&&next.morph>=previous.morph);
    assert.ok(Math.abs(next.yaw)<Math.PI/2);
    previous=next;
  }
  assert.deepEqual(letterTurn(localMorph(1,.8)),end);
});
