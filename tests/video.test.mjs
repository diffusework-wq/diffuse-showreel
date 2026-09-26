import test from 'node:test';
import assert from 'node:assert/strict';
import {createCinema} from '../src/video.js';

function setup(t){
  const original={window:globalThis.window,document:globalThis.document,location:globalThis.location};
  const sound={hidden:true,handlers:{},setAttribute(){},addEventListener(type,fn){this.handlers[type]=fn;},removeEventListener(type){delete this.handlers[type];}};
  const status={textContent:''};
  let events,player;
  globalThis.document={querySelector:id=>id==='#sound-toggle'?sound:status,createElement:()=>({remove(){}}),head:{append(){}}};
  globalThis.location={origin:'https://example.test'};
  globalThis.window={YT:{Player:class{
    constructor(id,options){events=options.events;player=this;this.muted=true;this.volume=0;this.time=12;this.calls=[];}
    isMuted(){return this.muted;} getVolume(){return this.volume;} getCurrentTime(){return this.time;}
    mute(){this.muted=true;this.calls.push('mute');} unMute(){this.muted=false;this.calls.push('unmute');}
    setVolume(value){this.volume=value;} playVideo(){this.calls.push('play');} pauseVideo(){this.calls.push('pause');}
    seekTo(value){this.time=value;} getIframe(){return {setAttribute(){}};} destroy(){}
  }}};
  const cinema=createCinema();window.onYouTubeIframeAPIReady();events.onReady();
  t.after(()=>{cinema.dispose();for(const [key,value] of Object.entries(original)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}});
  return {cinema,sound,status,player,events};
}

test('entering film requests audible playback and leaving pauses without seeking',t=>{
  const {cinema,player,sound,events}=setup(t);
  assert.equal(sound.hidden,true);
  cinema.update(1,1000);events.onStateChange({data:1});
  assert.deepEqual(player.calls,['unmute','play']);
  assert.equal(cinema.data.muted,false);assert.equal(cinema.data.volume,80);
  assert.equal(sound.textContent,'關閉聲音');
  cinema.update(0,2000);assert.equal(player.calls.at(-1),'pause');assert.equal(sound.hidden,true);
  cinema.update(1,3000);assert.equal(player.time,12);assert.equal(player.calls.at(-1),'play');
});

test('blocked audible autoplay falls back once, then a sound click unmutes',t=>{
  const {cinema,player,sound,events}=setup(t);
  cinema.update(1,1000);events.onAutoplayBlocked();
  assert.deepEqual(player.calls,['unmute','play','mute','play']);
  assert.equal(cinema.data.soundBlocked,true);
  events.onStateChange({data:1});assert.equal(sound.textContent,'開啟聲音');
  sound.handlers.click();events.onStateChange({data:1});
  assert.equal(cinema.data.muted,false);assert.equal(cinema.data.soundBlocked,false);
  assert.equal(sound.textContent,'關閉聲音');
  sound.handlers.click();cinema.update(0,2000);cinema.update(1,3000);
  assert.equal(player.isMuted(),true,'an explicit mute persists when scrolling back into film');
});

test('fully blocked autoplay remains recoverable and does not retry indefinitely',t=>{
  const {cinema,player,sound,events}=setup(t);
  cinema.update(1,1000);events.onAutoplayBlocked();events.onAutoplayBlocked();
  assert.equal(player.calls.filter(c=>c==='play').length,2);
  assert.equal(sound.textContent,'播放並開啟聲音');
  sound.handlers.click();assert.equal(player.isMuted(),false);
  cinema.update(0,2000);const count=player.calls.length;events.onAutoplayBlocked();
  assert.equal(player.calls.length,count,'late blocked events cannot restart an inactive film');
});
