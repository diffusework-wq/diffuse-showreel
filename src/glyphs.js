import * as THREE from 'three';
const SIZE=256;
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
  const sx=(char==='I'?58:194)/Math.max(metric.width,1),sy=(char==='-'?25:200)/Math.max(inkHeight,1);
  ctx.save();ctx.translate(SIZE/2,SIZE/2);ctx.scale(sx,sy);
  ctx.fillText(char,0,(metric.actualBoundingBoxAscent-metric.actualBoundingBoxDescent)/2);ctx.restore();
  const rgba=ctx.getImageData(0,0,SIZE,SIZE).data;
  const mask=new Uint8Array(SIZE*SIZE);for(let i=0;i<mask.length;i++)mask[i]=rgba[i*4]>128?1:0;
  const inside=distance(mask,0),outside=distance(mask,1),out=new Uint8Array(mask.length);
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){const i=y*SIZE+x;out[(SIZE-1-y)*SIZE+x]=Math.round(Math.min(255,Math.max(0,128+(Math.sqrt(inside[i])-Math.sqrt(outside[i]))*5)));}
  cache.set(char,out);return out;
}
export function makeGlyphTexture(from,to) {
  const a=glyphSdf(from),b=glyphSdf(to||from),data=new Uint8Array(SIZE*SIZE*4);
  for(let i=0;i<a.length;i++){data[i*4]=a[i];data[i*4+1]=b[i];data[i*4+3]=255;}
  const texture=new THREE.DataTexture(data,SIZE,SIZE,THREE.RGBAFormat);
  texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
  return texture;
}
export const glassVertex=`
  attribute float layerIndex;
  uniform float uTime;
  varying vec2 vUv; varying float vLayer; varying vec3 vWorld;
  void main(){vUv=uv;vLayer=fract(layerIndex+uTime*.065);vec4 p=instanceMatrix*vec4(position,1.);vWorld=(modelMatrix*p).xyz;gl_Position=projectionMatrix*modelViewMatrix*p;}
`;
export const glassFragment=`
  uniform sampler2D uGlyph;
  uniform vec3 uColor;
  uniform float uMorph,uOpacity,uTime,uHover;
  varying vec2 vUv; varying float vLayer; varying vec3 vWorld;
  void main(){
    vec2 uv=vUv;
    uv.x+=sin(uv.y*7.+uTime*.45+vLayer*2.)*.006*(1.-uMorph);
    vec4 sampleColor=texture2D(uGlyph,uv);
    float d=mix(sampleColor.r,sampleColor.g,uMorph)-.502;
    float aa=max(fwidth(d),.003);
    float shape=smoothstep(-aa,aa,d);
    float edge=exp(-abs(d)*95.);
    float inner=exp(-max(d,0.)*14.);
    float sweep=pow(max(0.,sin(uv.x*2.8+uv.y*2.4-uTime*.32+vLayer*1.5)),14.);
    float lobe=pow(max(0.,cos(uv.y*4.0-vLayer*2.5+uTime*.2)),6.);
    float face=shape*(.022+.07*lobe+.12*sweep);
    float envelope=smoothstep(0.,.12,vLayer)*(1.-smoothstep(.87,1.,vLayer));
    float alpha=(face+edge*(.38+.15*vLayer)) * uOpacity*envelope;
    if(alpha<.003)discard;
    vec3 tint=mix(uColor,uColor*.42,uv.y*.25);
    tint=mix(tint,vec3(.82,.92,1.),clamp(edge*.27+sweep*.3+uHover*.05,0.,.7));
    tint*=1.35+.55*lobe+.95*sweep;
    gl_FragColor=vec4(tint,alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
