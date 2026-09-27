// User-approved DIFFUSE palette. Hex values are sRGB; Three converts uniforms
// to linear light once. Reflections stay inside each letter's assigned family.
export const COLOR_FAMILIES = Object.freeze({
  electricBlue: {highlight:'#EAF3FF',core:'#3478FF',mid:'#1649C9',deep:'#071A55'},
  amberOrange: {highlight:'#FFF0C7',core:'#FF9B18',mid:'#C95B08',deep:'#4C1C02'},
  cyan: {highlight:'#D9FAFF',core:'#19D5F5',mid:'#087EAB',deep:'#032B40'},
  magenta: {highlight:'#FFE0FF',core:'#EB3DF2',mid:'#9620AE',deep:'#35063F'},
  gold: {highlight:'#FFF7C2',core:'#FFC936',mid:'#D58B08',deep:'#503000'},
  emerald: {highlight:'#D9FFF0',core:'#20E2A2',mid:'#079568',deep:'#033B2C'},
  iceWhite: {highlight:'#FFFFFF',core:'#CDE1FF',mid:'#7698C9',deep:'#25334B'},
  coralRed: {highlight:'#FFE0DE',core:'#FF514E',mid:'#B51F27',deep:'#48090E'},
});
export const GLASS_LAYERS = 10;
export const GRADIENT_STOPS = Object.freeze([0,.18,.48,.76,1]);
export const GRADIENT_ANGLE = 135;
const DEPTH_BRIGHTNESS = [1,.9,.8,.69,.575,.45,.425,.4,.375,.35];
const DEPTH_OPACITY = [.96,.78,.63,.48,.33,.2,.17,.14,.12,.1];
const smooth = (a,b,x) => {const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};

export function depthOptics(position) {
  const depth=Math.max(0,Math.min(9,(1-position)*10));
  const a=Math.floor(depth),b=Math.min(9,a+1),t=depth-a;
  return {brightness:DEPTH_BRIGHTNESS[a]*(1-t)+DEPTH_BRIGHTNESS[b]*t,opacity:DEPTH_OPACITY[a]*(1-t)+DEPTH_OPACITY[b]*t};
}

export function glassLayer(index,time,total=GLASS_LAYERS) {
  // The final instance is a stationary, sharp front pane. Nine echoes travel
  // behind it; fading at both ends makes the sorted loop seam continuous.
  if(index===total-1)return {position:1,...depthOptics(1)};
  const count=total-1,flow=((time*.032*count)%1+1)%1;
  const position=(index+flow)/count*.9;
  const optics=depthOptics(position);
  return {position,brightness:optics.brightness,opacity:optics.opacity*smooth(0,.09,position)*(1-smooth(.78,.9,position))};
}
