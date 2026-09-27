import * as THREE from 'three';
import {LETTERFORMS} from './letterforms.js';
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
function glyphSdf(char,font) {
  const cacheKey=font+char;
  if(cache.has(cacheKey))return cache.get(cacheKey);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=SIZE;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.fillStyle='#000';ctx.fillRect(0,0,SIZE,SIZE);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='alphabetic';
  ctx.font=`700 245px ${font==='design'?'Arial, sans-serif':font}`;
  const form=font==='design'?LETTERFORMS[char]:null;
  if(form){
    const inkWidth=(char==='I'?58:194)*(SIZE/256),inkHeight=200*(SIZE/256);
    ctx.save();ctx.translate((SIZE-inkWidth)/2,(SIZE-inkHeight)/2);
    ctx.scale(inkWidth/form.width,inkHeight/200);ctx.fill(new Path2D(form.path),'evenodd');ctx.restore();
  }else{
  const metric=ctx.measureText(char), inkHeight=metric.actualBoundingBoxAscent+metric.actualBoundingBoxDescent;
  const sx=(char==='I'?58:194)*(SIZE/256)/Math.max(metric.width,1),sy=(char==='-'?25:200)*(SIZE/256)/Math.max(inkHeight,1);
  ctx.save();ctx.translate(SIZE/2,SIZE/2);ctx.scale(sx,sy);
  ctx.fillText(char,0,(metric.actualBoundingBoxAscent-metric.actualBoundingBoxDescent)/2);ctx.restore();
  }
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
  cache.set(cacheKey,out);return out;
}
export function clearGlyphCache(){cache.clear();}
export function makeGlyphTexture(from,to,font='design') {
  const a=glyphSdf(from,font),b=glyphSdf(to||from,font),data=new Uint8Array(SIZE*SIZE*4);
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
  uniform vec2 uResolution;
  uniform float uTrailDistance;
  varying vec2 vUv,vOptics,vTrailPixels; varying float vLayer;
  void main(){
    vUv=uv;vLayer=layerPosition;vOptics=layerOptics;
    vec4 p=instanceMatrix*vec4(position,1.);
    vec4 current=projectionMatrix*modelViewMatrix*p;
    p.z-=uTrailDistance*(1.-smoothstep(.5,.94,vLayer));
    vec4 previous=projectionMatrix*modelViewMatrix*p;
    vTrailPixels=(current.xy/current.w-previous.xy/previous.w)*.5*uResolution;
    gl_Position=current;
  }
`;
export const glassFragment=`
  uniform sampler2D uGlyph;
  uniform vec3 uCore,uHighlight,uMid,uDeep,uStops;
  uniform vec4 uBounds,uEffect,uFinish,uLight,uMaterial;
  uniform vec3 uFillCurve,uEdgeCurve,uLightPose;
  uniform vec2 uGradientDirection;
  uniform float uMorph,uOpacity,uTime,uPixelRatio,uDepthBlur;
  varying vec2 vUv,vOptics,vTrailPixels; varying float vLayer;

  float depthCurve(vec3 values,float t){
    return t<=.5?mix(values.x,values.y,smoothstep(0.,.5,t)):mix(values.y,values.z,smoothstep(.5,1.,t));
  }
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
    float halfStroke=pixel*max(.8,uPixelRatio*.72);
    float edge=smoothstep(-aa,aa,d+halfStroke)-smoothstep(-aa,aa,d-halfStroke);
    // A short virtual shutter samples each moving pane along its projected
    // depth motion. The fixed front pane has exactly zero trail displacement.
    vec2 trailUv=dFdx(vUv)*vTrailPixels.x+dFdy(vUv)*vTrailPixels.y;
    float trailShape=shape*(8./36.),trailEdge=edge*(8./36.);
    for(int j=1;j<=7;j++){
      float sampleD=field(vUv+trailUv*(float(j)/7.));
      float weight=(8.-float(j))/36.;
      trailShape+=smoothstep(-aa,aa,sampleD)*weight;
      trailEdge+=(smoothstep(-aa,aa,sampleD+halfStroke)-smoothstep(-aa,aa,sampleD-halfStroke))*weight;
    }
    shape=trailShape;edge=trailEdge;

    // Normalize to the ink bounds, so slender I and the dash receive the same
    // approved 135-degree gradient as wide letters, including during morphs.
    vec2 ink=(vUv-.5)/mix(uBounds.xy,uBounds.zw,uMorph)+.5;
    float diagonal=clamp(dot(vec2(ink.x,1.-ink.y),uGradientDirection)/(uGradientDirection.x+uGradientDirection.y),0.,1.);
    vec4 body=glassGradient(diagonal);

    // Reference lighting: saturated glass between two broad white light cuts.
    // The cuts live on the rigid pane, so highlights never jitter with motion.
    float front=smoothstep(.48,1.,vLayer);
    vec2 q=vec2(ink.x,1.-ink.y)-uLightPose.xy;
    float c=cos(uLightPose.z),s=sin(uLightPose.z);
    q=vec2(c*q.x+s*q.y,-s*q.x+c*q.y);
    // Analytic area-light profiles: blur the boundary, not the whole letter.
    float softness=uEffect.y+uMaterial.y*.16;
    float width=max(.015,uLight.y),height=max(.015,uLight.z);
    float faceLight=0.;
    for(int lamp=0;lamp<6;lamp++){
      if(float(lamp)>=uLight.w)break;
      float offset=uLight.w<1.5?0.:(float(lamp)/(uLight.w-1.)-.5)*.70;
      vec2 lightPoint=q-vec2(offset,0.);
      float lightDistance;
      if(uLight.x<1.5){lightDistance=max(abs(lightPoint.x)-width*.5,abs(lightPoint.y)-height*.5);}
      else if(uLight.x<2.5){lightDistance=(length(lightPoint/vec2(width,height))-.5)*min(width,height);}
      else{vec2 box=abs(lightPoint)-vec2(width,height)*.5;lightDistance=length(max(box,0.))+min(max(box.x,box.y),0.);}
      float contribution=1.-smoothstep(-softness*.25,softness,lightDistance);
      faceLight=1.-(1.-faceLight)*(1.-contribution);
    }
    // Schlick reflectance is an artistic IOR approximation; no scene refraction.
    float f0=pow((uMaterial.x-1.)/(uMaterial.x+1.),2.);
    float fresnel=f0+(1.-f0)*pow(1.-uMaterial.z,5.);
    float reflection=clamp(fresnel*12.,0.,2.);
    vec3 tint=mix(body.rgb,uCore,.94);
    tint*=mix(.58,1.,1.-smoothstep(.72,1.,diagonal));
    float diffuseWhite=clamp(faceLight*(.18+.80*front)*uEffect.x*(.5+reflection),0.,1.);
    tint=mix(tint,uHighlight,diffuseWhite);
    float face=shape*uEffect.z*depthCurve(uFillCurve,vLayer)*(.35+.65*front)*(1.+.45*faceLight*uEffect.x)*(1.-min(.3,reflection*.12));
    float faceDensity=mix(body.a,1.,faceLight*.85)*(1.-smoothstep(.95,1.,diagonal));
    float rim=edge*(.64+.85*(1.-front))*uEffect.w*depthCurve(uEdgeCurve,vLayer);
    float surface=clamp(face*faceDensity+rim*body.a,0.,1.);

    // Rear outlines remain readable. Only a restrained spill hugs lit cuts;
    // the front silhouette retains its original analytic pixel coverage AA.
    // Stable texture-space halo: avoid fwidth-driven spikes at corners.
    // Average neighboring SDF values only for the glow, keeping the ink crisp.
    vec2 haloStep=vec2(.0025,0.);
    float haloDistance=(d*4.+field(vUv+haloStep)+field(vUv-haloStep)+field(vUv+haloStep.yx)+field(vUv-haloStep.yx))/8.;
    float glowWidth=.018+defocus*.008;
    float halo=exp(-pow(max(0.,-haloDistance)/glowWidth,2.))*(1.-smoothstep(-.003,.003,haloDistance));
    float glow=halo*(.008+faceLight*.16*uEffect.x)*body.a*uFinish.y;
    float alpha=clamp(surface+glow,0.,1.)*vOptics.y*uOpacity*uFinish.x;
    if(alpha<.0001)discard;
    tint=mix(tint,uHighlight,clamp((rim*body.a*(.06+.80*faceLight)+glow)/max(surface+glow,.0001),0.,1.));
    float luminance=dot(tint,vec3(.2126,.7152,.0722));
    tint=max(vec3(0.),mix(vec3(luminance),tint,uFinish.z));
    tint*=vOptics.x;
    gl_FragColor=vec4(tint,alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
