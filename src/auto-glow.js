// Smooth deterministic per-letter variation: no frame-by-frame random flicker.
export function autoGlow(index,time,progress,settings){
 const start=settings.autoStart/100,end=settings.autoEnd/100;
 if(end<=start||progress<=start||progress>=end||settings.autoAmount<=0)return 0;
 const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 const edge=Math.min(.025,(end-start)/3);
 const envelope=smooth((progress-start)/edge)*smooth((end-progress)/edge);
 const clock=time*settings.autoSpeed*.45+index*.713;
 const cycle=Math.floor(clock),phase=clock-cycle;
 const hash=n=>{const v=Math.sin(n*127.1+index*311.7)*43758.5453;return v-Math.floor(v);};
 const random=hash(cycle)*(1-smooth(phase))+hash(cycle+1)*smooth(phase);
 return envelope*settings.autoAmount*Math.pow(random,2);
}
