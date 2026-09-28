import test from 'node:test';
import assert from 'node:assert/strict';
import {media} from '../src/config.js';

test('the showreel uses the requested YouTube film',()=>{
  assert.equal(media.youtubeId,'5LWhB6rnv5s');
});
