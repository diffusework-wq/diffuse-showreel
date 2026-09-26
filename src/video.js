import { media } from './config.js';

export function createCinema() {
  const status=document.querySelector('#video-status');
  const sound=document.querySelector('#sound-toggle');
  const data={ready:false,state:-1,time:0,error:null,autoplayBlocked:false,muted:true,volume:80,soundBlocked:false};
  let player,active=false,requested=false,lastSample=0,waitStarted=0,wantsSound=true,mutedFallback=false;
  const setStatus=text=>{status.textContent=text;};
  const errors={100:'This film is currently unavailable.',101:'This film cannot be played on this website.',150:'This film cannot be played on this website.',153:'The video service could not verify this website.'};
  function updateSound(){
    if(data.ready){data.muted=player.isMuted();data.volume=player.getVolume();}
    sound.hidden=!active||!data.ready||data.error!==null;
    const audible=!data.muted&&data.volume>0&&data.state===1;
    sound.textContent=audible?'關閉聲音':data.autoplayBlocked?'播放並開啟聲音':'開啟聲音';
    sound.setAttribute('aria-label',audible?'關閉影片聲音':'開啟影片聲音');
  }
  function play(){
    if(wantsSound&&!mutedFallback){player.setVolume(80);player.unMute();}
    else player.mute();
    player.playVideo();
    updateSound();
  }
  function sync(){
    if(!data.ready)return;
    if(active&&!requested){requested=true;play();}
    else if(!active&&requested){requested=false;player.pauseVideo();}
    updateSound();
  }
  function toggleSound(){
    if(!active||!data.ready||data.error!==null)return;
    if(!player.isMuted()&&player.getVolume()>0&&data.state===1){
      wantsSound=false;player.mute();
    }else{
      // Issue the YouTube commands directly inside the trusted click event.
      wantsSound=true;mutedFallback=false;data.soundBlocked=false;data.autoplayBlocked=false;
      play();
    }
    updateSound();
  }
  sound.addEventListener('click',toggleSound);
  function initialize(){
    player=new window.YT.Player('player',{
      videoId:media.youtubeId,
      playerVars:{autoplay:0,playsinline:1,controls:0,disablekb:1,fs:0,rel:0,origin:location.origin},
      events:{
        onReady(){data.ready=true;if(data.error==='load-timeout'){data.error=null;setStatus('');}const frame=player.getIframe();frame.setAttribute('allow','autoplay; encrypted-media; picture-in-picture');frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');frame.tabIndex=-1;sync();},
        onStateChange(event){
          data.state=event.data;
          if(event.data===1){
            if(!active){player.pauseVideo();return;}
            data.autoplayBlocked=false;setStatus('');
          }
          if(event.data===0&&active){player.seekTo(0,true);player.playVideo();}
          updateSound();
        },
        onAutoplayBlocked(){
          if(!active)return;
          data.autoplayBlocked=true;
          if(wantsSound&&!mutedFallback){
            // Preserve the scroll transition when audible autoplay needs a click.
            mutedFallback=true;data.soundBlocked=true;player.mute();player.playVideo();
          }else setStatus('點一下「播放並開啟聲音」繼續。');
          updateSound();
        },
        onError(event){data.error=event.data;setStatus(errors[event.data]||'The film could not be loaded.');updateSound();}
      }
    });
  }
  window.onYouTubeIframeAPIReady=initialize;
  const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=()=>{data.error='api-load';setStatus('The film could not be loaded.');};document.head.append(script);
  return { data,update(reveal,now){
    const next=reveal>.6;
    if(next!==active){active=next;if(active)waitStarted=now;sync();}
    if(active&&!data.ready&&!data.error&&now-waitStarted>18000){data.error='load-timeout';setStatus('The film is taking longer to load. Scroll up to return.');}
    if(player&&data.ready&&now-lastSample>250){lastSample=now;data.time=player.getCurrentTime();updateSound();}
  },dispose(){sound.removeEventListener('click',toggleSound);player?.destroy();script.remove();if(window.onYouTubeIframeAPIReady===initialize)delete window.onYouTubeIframeAPIReady;} };
}
