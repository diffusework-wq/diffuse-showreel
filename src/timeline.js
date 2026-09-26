export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (a, b, x) => { const t = clamp((x-a)/(b-a)); return t*t*(3-2*t); };
export const LETTERS = [
  {from:'D',to:'S',family:'electricBlue',title:'DIFFUSE.WORK',subtitle:'SHOWREEL'},
  {from:'I',to:'H',family:'amberOrange',title:'IDEA',subtitle:'TO REALITY'},
  {from:'F',to:null,family:'cyan',title:'FLOW',subtitle:'IN MOTION'},
  {from:'F',to:'O',family:'magenta',title:'FOR BRANDS',subtitle:'WORLDWIDE'},
  {from:'U',to:'W',family:'gold',title:'UNLEASH',subtitle:'POTENTIAL'},
  {from:'S',to:'R',family:'emerald',title:'STORY',subtitle:'IN MOTION'},
  {from:'E',to:'E',family:'iceWhite',title:'ELEVATE',subtitle:'IDEAS'},
  {from:'-',to:null,family:'iceWhite',title:'—',subtitle:'TOGETHER'},
  {from:'W',to:'E',family:'coralRed',title:'WORK',subtitle:'CREATIVELY'},
  {from:'R',to:'L',family:'electricBlue',title:'REAL',subtitle:'IMPACT'},
];
export function timeline(progress) {
  const p = clamp(progress);
  return {progress:p, morph:smooth(.055,.49,p), push:smooth(.57,.91,p), cinema:smooth(.72,.96,p), label:1-smooth(.08,.3,p), chapter:p<.5?'01 — DIFFUSE':p<.75?'02 — TRANSFORM':'03 — SHOWREEL'};
}
export function localMorph(scrollMorph, hover) { return clamp(scrollMorph+(1-scrollMorph)*clamp(hover)); }
export function slotPosition(index, morph, aspect) {
  const col=index%5, row=Math.floor(index/5);
  const portrait=aspect<1;
  const sourceX=(col-2)*(portrait?2.23:2.6);
  const targetX=[-3.9,-1.3,0,1.3,3.9][col]*(portrait?.88:1);
  return {x:sourceX+(targetX-sourceX)*morph,y:(row===0?1.95:-1.9)*(portrait?1.25:1)};
}
