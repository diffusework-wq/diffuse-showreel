import * as THREE from 'three';
const SIZE=512;
// Exact squared Euclidean distance transform, O(n) per scanline.
function edtLine(f, n, d, v, z) {
  let k=0;v[0]=0;z[0]=-Infinity;z[1]=Infinity;
  for(let q=1;q<n;q++){
    let s;
    do { const vk=v[k];s=((f[q]+q*q)-(f[vk]+vk*vk))/(2*q-2*vk);if(s<=z[k])k--;else break; } while(k>=0);
    k++;v[k]=q;z[k]=s;z[k+1]=Infinity;
  }
  k=0;for(let q=0;q<n;q++){while(z[k+1]<q)k++;d[q]=(q-v[k])**2+f[v[k]];}
}
function distance(mask, toInside) {
  const grid=new Float64Array(SIZE*SIZE),f=new Float64Array(SIZE),d=new Float64Array(SIZE),v=new Int32Array(SIZE),z=new Float64Array(SIZE+1);
  for(let i=0;i<grid.length;i++)grid[i]=(mask[i]===toInside)?0:1e10;
  for(let x=0;x<SIZE;x++){for(let y=0;y<SIZE;y++)f[y]=grid[y*SIZE+x];edtLine(f,SIZE,d,v,z);for(let y=0;y<SIZE;y++)grid[y*SIZE+x]=d[y];}
  for(let y=0;y<SIZE;y++){for(let x=0;x<SIZE;x++)f[x]=grid[y*SIZE+x];edtLine(f,SIZE,d,v,z);for(let x=0;x<SIZE;x++)grid[y*SIZE+x]=d[x];}
  return grid;
}
const cache=new Map();
function glyphSdf(char) {
  if(cache.has(char))return cache.get(char);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=SIZE;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.fillStyle='#000';ctx.fillRect(0,0,SIZE,SIZE);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='alphabetic';
  ctx.font='900 245px "Arial Black", Arial, sans-serif';
  const metric=ctx.measureText(char), inkHeight=metric.actualBoundingBoxAscent+metric.actualBoundingBoxDescent;
  const sx=(char==='I'?58:194)*(SIZE/256)/Math.max(metric.width,1),sy=(char==='-'?25:200)*(SIZE/256)/Math.max(inkHeight,1);
  ctx.save();ctx.translate(SIZE/2,SIZE/2);ctx.scale(sx,sy);
  ctx.fillText(char,0,(metric.actualBoundingBoxAscent-metric.actualBoundingBoxDescent)/2);ctx.restore();
  const rgba=ctx.getImageData(0,0,SIZE,SIZE).data;
  const mask=new Uint8Array(SIZE*SIZE);for(let i=0;i<mask.length;i++)mask[i]=rgba[i*4]>128?1:0;
  const inside=distance(mask,0),outside=distance(mask,1),out=new Uint16Array(mask.length);
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
    const i=y*SIZE+x,coverage=rgba[i*4]/255;
    const raw=Math.sqrt(inside[i])-Math.sqrt(outside[i]);
    // Retain the font rasterizer's subpixel coverage at the contour.
    const signed=coverage>0&&coverage<1?coverage-.5:Math.sign(raw)*(Math.abs(raw)-.5);
    out[(SIZE-1-y)*SIZE+x]=Math.round(Math.min(1,Math.max(0,.5+signed/(SIZE*.2)))*65535);
  }
  cache.set(char,out);return out;
}
export function makeGlyphTexture(from,to) {
  const a=glyphSdf(from),b=glyphSdf(to||from),data=new Uint8Array(SIZE*SIZE*4);
  // Two 16-bit fields in RG / BA. Linear filtering remains linear after decode.
  for(let i=0;i<a.length;i++){data[i*4]=a[i]>>>8;data[i*4+1]=a[i]&255;data[i*4+2]=b[i]>>>8;data[i*4+3]=b[i]&255;}
  const texture=new THREE.DataTexture(data,SIZE,SIZE,THREE.RGBAFormat);
  texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
  return texture;
}

// Match the GPU's linear sampling for raycast hits, including byte carries.
export function sampleGlyphField({data,width,height},u,v){
  const x=Math.min(width-1,Math.max(0,u*width-.5)),y=Math.min(height-1,Math.max(0,v*height-.5));
  const x0=Math.floor(x),y0=Math.floor(y),x1=Math.min(x0+1,width-1),y1=Math.min(y0+1,height-1);
  const fx=x-x0,fy=y-y0;
  const read=(px,py,c)=>{const index=(py*width+px)*4+c;return (data[index]*256+data[index+1])/65535;};
  return [0,2].map(c=>(read(x0,y0,c)*(1-fx)+read(x1,y0,c)*fx)*(1-fy)+(read(x0,y1,c)*(1-fx)+read(x1,y1,c)*fx)*fy);
}

export const glassVertex=`
  attribute float layerPosition;
  attribute vec2 layerOptics;
  varying vec2 vUv,vOptics; varying float vLayer;
  void main(){vUv=uv;vLayer=layerPosition;vOptics=layerOptics;vec4 p=instanceMatrix*vec4(position,1.);gl_Position=projectionMatrix*modelViewMatrix*p;}
`;
export const glassFragment=`
  uniform sampler2D uGlyph;
  uniform vec3 uCore,uHighlight,uMid,uDeep,uStops;
  uniform vec4 uBounds;
  uniform vec2 uGradientDirection;
  uniform float uMorph,uOpacity,uTime,uPixelRatio,uDepthBlur;
  varying vec2 vUv,vOptics; varying float vLayer;

  float field(vec2 uv){
    vec4 packed=texture2D(uGlyph,uv);
    vec2 unpack16=vec2(256./257.,1./257.);
    return mix(dot(packed.rg,unpack16),dot(packed.ba,unpack16),uMorph)-.5;
  }
  vec4 glassGradient(float t){
    if(t<uStops.x)return vec4(mix(uHighlight,uCore,t/uStops.x),1.);
    if(t<uStops.y)return vec4(mix(uCore,uMid,(t-uStops.x)/(uStops.y-uStops.x)),1.);
    if(t<uStops.z)return mix(vec4(uMid,1.),vec4(uDeep,.45),(t-uStops.y)/(uStops.z-uStops.y));
    return mix(vec4(uDeep,.45),vec4(0.),(t-uStops.z)/(1.-uStops.z));
  }
  void main(){
    float d=field(vUv);
    float pixel=max(fwidth(d),.00001);
    // Selective defocus broadens coverage, never the primary front contour.
    float defocus=1.-smoothstep(.08,.82,vLayer);
    float blur=defocus*defocus*uDepthBlur*uPixelRatio;
    float aa=pixel*sqrt(.75*.75+blur*blur);
    float shape=smoothstep(-aa,aa,d);
    float halfStroke=pixel*max(.65,uPixelRatio*.55);
    float edge=smoothstep(-aa,aa,d+halfStroke)-smoothstep(-aa,aa,d-halfStroke);

    // Normalize to the ink bounds, so slender I and the dash receive the same
    // approved 135-degree gradient as wide letters, including during morphs.
    vec2 ink=(vUv-.5)/mix(uBounds.xy,uBounds.zw,uMorph)+.5;
    float diagonal=clamp(dot(vec2(ink.x,1.-ink.y),uGradientDirection)/(uGradientDirection.x+uGradientDirection.y),0.,1.);
    vec4 body=glassGradient(diagonal);

    // Frosted cuts diffuse incident light across a broad angular response.
    // Keep geometry and coverage stable; roughness never jitters UVs/normals.
    float e=3.5/512.;
    vec2 slope=vec2(field(vUv+vec2(e,0.))-field(vUv-vec2(e,0.)),field(vUv+vec2(0.,e))-field(vUv-vec2(0.,e)));
    vec2 normal=-slope/max(length(slope),.00001);
    float key=max(0.,dot(normal,normalize(vec2(-.55,.83))));
    float bounce=max(0.,dot(normal,normalize(vec2(.72,-.69))));
    float cut=shape*(1.-smoothstep(0.,max(.10,pixel*2.),d));
    float front=smoothstep(.6,1.,vLayer);

    // Broad internal light pools replace the polished, diagonal softbox stripe.
    // Only the light drifts. Front structure remains perfectly stationary.
    vec2 drift=vec2(sin(uTime*.16),cos(uTime*.13))*.018;
    vec2 upper=(ink-vec2(.30,.76)-drift)/vec2(.30,.25);
    vec2 lower=(ink-vec2(.70,.22)+drift)/vec2(.24,.22);
    float whitePool=clamp(exp(-dot(upper,upper)*1.25)+.42*exp(-dot(lower,lower)*1.5),0.,1.);
    float scatter=whitePool*(.38+.62*front);
    float coreLight=shape*exp(-pow((d-.13)/.18,2.))*(.45+.55*key);
    // Lift the transmitted core with the approved hue, not exposure/gamma.
    // The base retains the specified four colors and transparent-black tail.
    float corePresence=(.80+.15*coreLight)*(1.-smoothstep(.62,1.,diagonal));
    vec3 tint=mix(body.rgb,uCore,corePresence);
    vec3 frostWhite=mix(uHighlight,vec3(1.),.4);
    float milkyLight=clamp(scatter*.86+cut*key*.14,0.,.91);
    tint=mix(tint,frostWhite,milkyLight);
    // Frost has fuller diffuse density, while the back panes still transmit.
    float face=shape*(.36+.26*front+.27*scatter)+cut*.1;
    float surface=clamp(face+edge*(.15+.13*key),0.,1.)*mix(body.a,1.,scatter*.62)*(1.-smoothstep(.90,1.,diagonal));

    // Soft white spill is restricted to the lit regions; never blur the whole
    // letter. The SDF front silhouette keeps its original pixel coverage AA.
    float glowWidth=pixel*(4.2+defocus*1.5)*uPixelRatio;
    float halo=exp(-pow(abs(d)/max(glowWidth,.00001),2.))*(1.-shape);
    float glow=halo*(whitePool*.16+key*.008)*body.a;
    float alpha=clamp(surface+glow,0.,1.)*vOptics.y*uOpacity;
    if(alpha<.0001)discard;
    tint=mix(tint,frostWhite,glow/max(surface+glow,.0001));
    tint*=vOptics.x;
    gl_FragColor=vec4(tint,alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
