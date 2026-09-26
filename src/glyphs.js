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
  varying vec2 vUv; varying float vLayer;
  void main(){vUv=uv;vLayer=layerPosition;vec4 p=instanceMatrix*vec4(position,1.);gl_Position=projectionMatrix*modelViewMatrix*p;}
`;
export const glassFragment=`
  uniform sampler2D uGlyph;
  uniform vec3 uColor;
  uniform float uMorph,uOpacity,uTime,uHover,uPixelRatio;
  varying vec2 vUv; varying float vLayer;
  void main(){
    vec2 uv=vUv;
    vec4 sampleColor=texture2D(uGlyph,uv);
    vec2 unpack16=vec2(256./257.,1./257.);
    float d=mix(dot(sampleColor.rg,unpack16),dot(sampleColor.ba,unpack16),uMorph)-.5;
    float pixel=max(fwidth(d),.00001);
    float aa=pixel*.75;
    float shape=smoothstep(-aa,aa,d);
    // Integrate a soft contour in screen pixels instead of a subpixel spike.
    float halfStroke=pixel*max(.7,uPixelRatio*.6);
    float edge=1.-smoothstep(max(0.,halfStroke-aa),halfStroke+aa,abs(d));
    float sweep=pow(max(0.,sin(uv.x*2.8+uv.y*2.4-uTime*.32+vLayer*1.5)),14.);
    float lobe=pow(max(0.,cos(uv.y*4.0-vLayer*2.5+uTime*.2)),6.);
    // Broad colored faces carry the light; outlines only describe the panes.
    float front=smoothstep(.25,.86,vLayer);
    float face=shape*(.048+.065*front+.10*lobe+.14*sweep);
    float envelope=smoothstep(0.,.12,vLayer)*(1.-smoothstep(.87,1.,vLayer));
    float alpha=(face+edge*(.16+.065*front)) * uOpacity*envelope;
    if(alpha<.003)discard;
    vec3 tint=uColor*(.75+.5*front);
    vec3 highlight=mix(uColor,vec3(1.),.55);
    tint=mix(tint,highlight,clamp(sweep*.42+edge*.07+uHover*.04,0.,.55));
    tint*=1.65+.45*lobe+.8*sweep;
    gl_FragColor=vec4(tint,alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
