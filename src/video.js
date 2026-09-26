import { media } from './config.js';

export function createCinema() {
  const status=document.querySelector('#video-status');
  const data={ready:false,state:-1,time:0,error:null,autoplayBlocked:false};
  let player,active=false,requested=false,lastSample=0,waitStarted=0;
  const setStatus=text=>{status.textContent=text;};
  const errors={100:'This film is currently unavailable.',101:'This film cannot be played on this website.',150:'This film cannot be played on this website.',153:'The video service could not verify this website.'};
  function sync(){
    if(!data.ready)return;
    if(active&&!requested){requested=true;player.mute();player.playVideo();}
    else if(!active&&requested){requested=false;player.pauseVideo();}
  }
  function initialize(){
    player=new window.YT.Player('player',{
      videoId:media.youtubeId,
      playerVars:{autoplay:0,playsinline:1,controls:0,disablekb:1,fs:0,rel:0,origin:location.origin},
      events:{
        onReady(){data.ready=true;if(data.error==='load-timeout'){data.error=null;setStatus('');}player.mute();const frame=player.getIframe();frame.setAttribute('allow','autoplay; encrypted-media; picture-in-picture');frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');frame.tabIndex=-1;sync();},
        onStateChange(event){data.state=event.data;if(event.data===1){data.autoplayBlocked=false;setStatus('');}if(event.data===0&&active){player.seekTo(0,true);player.playVideo();}},
        onAutoplayBlocked(){data.autoplayBlocked=true;setStatus('Automatic playback is unavailable in this browser.');},
        onError(event){data.error=event.data;setStatus(errors[event.data]||'The film could not be loaded.');}
      }
    });
  }
  window.onYouTubeIframeAPIReady=initialize;
  const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=()=>{data.error='api-load';setStatus('The film could not be loaded.');};document.head.append(script);
  return { data,update(reveal,now){const next=reveal>.6;if(next!==active){active=next;if(active)waitStarted=now;sync();}if(active&&!data.ready&&!data.error&&now-waitStarted>18000){data.error='load-timeout';setStatus('The film is taking longer to load. Scroll up to return.');}if(player&&data.ready&&now-lastSample>250){lastSample=now;data.time=player.getCurrentTime();}},dispose(){player?.destroy();script.remove();} };
}
