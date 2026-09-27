import * as THREE from 'three';
// Background color wash is independent of glyph lighting and drawn in linear light.
export function createBackground(){
 const uniforms={colorA:{value:new THREE.Color()},colorB:{value:new THREE.Color()},strength:{value:0},range:{value:1},center:{value:new THREE.Vector2()},angle:{value:0},aspect:{value:1}};
 const material=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms,vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.999,1.);}`,fragmentShader:`varying vec2 vUv;uniform vec3 colorA,colorB;uniform vec2 center;uniform float strength,range,angle,aspect;void main(){vec2 p=vUv-center;p.x*=aspect;vec2 dir=vec2(cos(angle),sin(angle));float blend=smoothstep(-range,range,dot(p,dir));float falloff=exp(-dot(p,p)/(range*range));vec3 c=mix(colorA,colorB,blend)*falloff*strength;gl_FragColor=vec4(c,1.);}`});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);mesh.frustumCulled=false;mesh.renderOrder=-100;return mesh;
}
export function createMist(){
 const uniforms={mask:{value:null},color:{value:new THREE.Color()},amount:{value:0},morph:{value:0},spread:{value:1},softness:{value:.5},direction:{value:new THREE.Vector2()},time:{value:0}};
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,uniforms,vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;uniform sampler2D mask;uniform vec3 color;uniform float amount,morph,spread,softness,time;uniform vec2 direction;
 float glyph(vec2 uv){vec2 m=texture2D(mask,clamp(uv,0.,1.)).rg;return mix(m.r,m.g,morph);}
 void main(){vec2 p=(vUv-.5)*3.;float fog=exp(-dot(p,p)/(spread*spread*.13));vec2 uv=p/spread+.5;uv+=.008*softness*vec2(sin(p.y*8.+time*.45),cos(p.x*7.-time*.3));float trail=0.;for(int i=0;i<12;i++){float f=float(i)/11.;vec2 q=uv-direction*f;float blur=.035*softness*(1.+f);float ink=(glyph(q)+glyph(q+vec2(blur,0.))+glyph(q-vec2(blur,0.))+glyph(q+vec2(0.,blur))+glyph(q-vec2(0.,blur)))/5.;trail+=ink*(1.-f)/6.;}float edge=smoothstep(0.,.14,vUv.x)*smoothstep(0.,.14,vUv.y)*smoothstep(0.,.14,1.-vUv.x)*smoothstep(0.,.14,1.-vUv.y);gl_FragColor=vec4(color,(trail*.85+fog*.15)*amount*edge);}`});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(15,16.2),material);mesh.renderOrder=-20;mesh.frustumCulled=false;return mesh;
}
