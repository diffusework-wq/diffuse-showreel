// Authored lighting cues are synchronized to YouTube playback time.
// The embed does not expose pixels; this is deliberately not a pixel sampler.
export const COLOR_CUES = [
  {time:0, a:[51,77,105], b:[28,40,60]}, // dark mountain/water opening
  {time:6.27, a:[150,151,146], b:[74,92,89]}, // white phone and cotton
  {time:12.54, a:[98,140,58], b:[189,191,132]}, // green gimbal product scene
  {time:18.81, a:[112,149,195], b:[78,100,148]}, // blue phone lineup
  {time:25.08, a:[61,97,150], b:[17,26,43]}, // blue exploded phone
  {time:31.35, a:[86,90,47], b:[48,65,77]}, // night landscape / workstation
  {time:37.62, a:[179,193,204], b:[63,131,190]}, // concrete / bright sky
  {time:43.89, a:[154,183,220], b:[183,175,150]}, // clear glass on white
  {time:50.16, a:[168,187,204], b:[96,155,204]}, // white laptop architecture
  {time:52, a:[221,69,46], b:[65,99,123]}, // red product lighting enters
  {time:56.43, a:[221,69,46], b:[65,99,123]}, // red-lit gaming mouse
  {time:61.43, a:[41,44,48], b:[21,24,29]}, // black end card
  {time:62.7, a:[51,77,105], b:[28,40,60]},
];
export function paletteAt(time,cues=COLOR_CUES){
  const t=Math.max(0,time);
  let next=cues.findIndex(cue=>cue.time>t);
  if(next===0)return cues[0];
  if(next<0)return cues[cues.length-1];
  const from=cues[next-1],to=cues[next];
  const raw=(t-from.time)/(to.time-from.time),mix=raw*raw*(3-2*raw);
  return {a:from.a.map((c,i)=>c+(to.a[i]-c)*mix),b:from.b.map((c,i)=>c+(to.b[i]-c)*mix)};
}
export function createAtmosphere(){
  const element=document.querySelector('#ambient-light'),root=document.querySelector('#experience');
  const current={a:[101,143,174],b:[46,65,84]};
  return {data:{mode:'authored-time-cues',time:0,palette:current},update(time,reveal,dt){
    const palette=paletteAt(time),blend=1-Math.exp(-2.6*dt);
    for(const key of ['a','b'])for(let i=0;i<3;i++)current[key][i]+=(palette[key][i]-current[key][i])*blend;
    root.style.setProperty('--film-a',current.a.map(Math.round).join(' '));root.style.setProperty('--film-b',current.b.map(Math.round).join(' '));
    element.style.opacity=String(reveal*.92);root.style.setProperty('--film-reveal',reveal.toFixed(3));
    this.data.time=time;
  }};
}
