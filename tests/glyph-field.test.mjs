import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleGlyphField} from '../src/glyphs.js';

test('hover samples both 16-bit fields continuously across an 8-bit byte carry',()=>{
  const values=[[32767,49151],[32768,16384],[32767,49151],[32768,16384]];
  const data=Uint8Array.from(values.flatMap(([a,b])=>[a>>>8,a&255,b>>>8,b&255]));
  const field={data,width:2,height:2};
  const middle=sampleGlyphField(field,.5,.5);
  assert.equal(middle[0],.5);
  assert.equal(middle[1],.5);
  assert.deepEqual(sampleGlyphField(field,0,0),[32767/65535,49151/65535]);
  assert.deepEqual(sampleGlyphField(field,1,1),[32768/65535,16384/65535]);
  for(let n=0;n<20;n++)assert.ok(sampleGlyphField(field,n/20,.5)[0]<=sampleGlyphField(field,(n+1)/20,.5)[0]);
});
