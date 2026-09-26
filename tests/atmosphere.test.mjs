import test from 'node:test';
import assert from 'node:assert/strict';
import {paletteAt} from '../src/atmosphere.js';

test('film cues return the expected green and red scene palettes',()=>{
  assert.deepEqual(paletteAt(12.54).a,[98,140,58]);
  assert.deepEqual(paletteAt(56.43).a,[221,69,46]);
});

test('seeking backwards restores the same light and interpolation stays bounded',()=>{
  const before=paletteAt(15);
  paletteAt(58);
  assert.deepEqual(paletteAt(15),before);
  for(let time=0;time<65;time+=.1){
    const palette=paletteAt(time);
    assert.ok([...palette.a,...palette.b].every(value=>Number.isFinite(value)&&value>=0&&value<=255));
  }
  assert.deepEqual(paletteAt(-5),paletteAt(0));
  assert.deepEqual(paletteAt(999),paletteAt(62.7));
});
