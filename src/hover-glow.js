import * as THREE from 'three';
// Padded, blurred glyph masks keep the hover glow off the sharp glass shader.
export function makeHoverGlow(image,spread,softness){
 const size=512,ink=256,pad=128;
 const source=document.createElement('canvas');source.width=source.height=ink;
 const ctx=source.getContext('2d');
 const expanded=document.createElement('canvas');expanded.width=expanded.height=size;const ec=expanded.getContext('2d');
 const blurred=document.createElement('canvas');blurred.width=blurred.height=size;const bc=blurred.getContext('2d',{willReadFrequently:true});
 const output=new Uint8Array(size*size*4);
 for(let channel=0;channel<2;channel++){
  const mask=ctx.createImageData(ink,ink);
  for(let y=0;y<ink;y++)for(let x=0;x<ink;x++){
   const input=((y*2)*image.width+x*2)*4+channel*2,index=(y*ink+x)*4;
   const field=(image.data[input]*256+image.data[input+1])/65535;
   mask.data[index]=mask.data[index+1]=mask.data[index+2]=255;mask.data[index+3]=Math.round(Math.max(0,Math.min(1,(field-.495)/.01))*255);
  }
  ctx.putImageData(mask,0,0);ec.clearRect(0,0,size,size);ec.drawImage(source,pad,pad);
  for(let i=0;i<24;i++){const a=i*Math.PI/12;ec.drawImage(source,pad+Math.cos(a)*spread,pad+Math.sin(a)*spread);}
  bc.clearRect(0,0,size,size);bc.filter=`blur(${softness}px)`;bc.drawImage(expanded,0,0);bc.filter='none';
  const data=bc.getImageData(0,0,size,size).data;
  for(let i=0;i<size*size;i++){output[i*4+channel]=data[i*4+3];output[i*4+3]=255;}
 }
 const texture=new THREE.DataTexture(output,size,size,THREE.RGBAFormat);texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;return texture;
}
export function createHoverGlow(){
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{mask:{value:null},color:{value:new THREE.Color()},amount:{value:0},morph:{value:0}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform sampler2D mask;uniform vec3 color;uniform float amount,morph;varying vec2 vUv;void main(){vec2 coverage=texture2D(mask,vUv).rg;float alpha=mix(coverage.r,coverage.g,morph)*amount;gl_FragColor=vec4(color,alpha);}`});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(5,5.4),material);mesh.renderOrder=-10;mesh.frustumCulled=false;return mesh;
}
