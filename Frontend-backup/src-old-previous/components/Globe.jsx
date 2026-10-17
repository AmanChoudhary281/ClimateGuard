import {useEffect,useRef} from 'react'
import * as THREE from 'three'
import {marker,hotspots} from '../data/mockData'
const ll=(a,o,R=1)=>{const p=(90-a)*Math.PI/180,t=(o+180)*Math.PI/180;return new THREE.Vector3(-R*Math.sin(p)*Math.cos(t),R*Math.cos(p),R*Math.sin(p)*Math.sin(t))}
const glow=c=>{const k=document.createElement('canvas');k.width=k.height=64;const x=k.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,c+'cc');g.addColorStop(.45,c+'44');g.addColorStop(1,c+'00');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(k)}
const lerp=(a,b,k)=>a+(b-a)*k
// frame-rate independent damping: rate is roughly "1 / seconds to settle"
const ease=(cur,target,rate,dt)=>cur+(target-cur)*(1-Math.exp(-rate*dt))
const RA=1.12 // atmosphere shell radius (planet radius = 1)
const CAM_Z=5.2
const VS='varying vec2 vUv;varying vec3 vN;varying vec3 vT;varying vec3 vV;void main(){vUv=uv;mat3 M=mat3(modelMatrix);vN=normalize(M*normal);vT=normalize(M*vec3(position.z,0.,-position.x));vec4 w=modelMatrix*vec4(position,1.);vV=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}'
const EARTH=`uniform sampler2D dayT;uniform sampler2D nightT;uniform sampler2D brcT;uniform vec3 sun;uniform float hov;uniform float cOff;uniform float texel;
varying vec2 vUv;varying vec3 vN;varying vec3 vT;varying vec3 vV;
float H(vec2 u){return texture2D(brcT,u).r;}
void main(){vec3 n=normalize(vN);vec3 T=normalize(vT);vec3 B=normalize(cross(n,T));vec4 m=texture2D(brcT,vUv);float land=m.g;float water=1.-land;vec3 nb=n;float cl=0.;
#ifndef LITE
float e=1.5*texel;float hu=H(vUv+vec2(e,0.))-H(vUv-vec2(e,0.));float hv=H(vUv+vec2(0.,e*2.))-H(vUv-vec2(0.,e*2.));nb=normalize(n-2.4*land*(hu*T+hv*B));
cl=smoothstep(.2,.9,texture2D(brcT,vUv+vec2(-cOff,.0015)).b);
#endif
float d=dot(n,sun);float day=smoothstep(-.08,.2,d);float diff=max((dot(nb,sun)+.05)/1.05,0.);
vec3 dc=texture2D(dayT,vUv).rgb;dc=(dc-.5)*(1.06+.05*hov)+.5;
vec3 col=dc*(.02+1.05*diff)*mix(vec3(.9,.95,1.),vec3(1.,.94,.84),day)*(1.-.3*cl)+vec3(.008,.016,.035);
float tw=smoothstep(-.12,.02,d)*(1.-smoothstep(.02,.28,d));col+=vec3(.9,.42,.15)*tw*.12*(.3+land*.7);
vec3 h=normalize(sun+vV);float ndh=max(dot(n,h),0.);col+=vec3(1.,.88,.7)*(pow(ndh,110.)*.85+pow(ndh,14.)*.1)*water*day*(1.-cl);
vec3 nl=texture2D(nightT,vUv).rgb;col+=nl*vec3(1.,.8,.55)*.8*(1.-smoothstep(-.03,.14,d))*(1.-cl*.6);
float f=pow(1.-max(dot(n,vV),0.),3.2);col+=mix(vec3(.04,.08,.2),vec3(.22,.45,.85),day)*f*(.2+.45*day)*(1.+.25*hov);
gl_FragColor=vec4(col,1.);}`
const CLOUD=`uniform sampler2D brcT;uniform vec3 sun;varying vec2 vUv;varying vec3 vN;varying vec3 vT;varying vec3 vV;
void main(){float b=texture2D(brcT,vUv).b;float a=smoothstep(.18,.85,b);float l=smoothstep(-.1,.3,dot(normalize(vN),sun));
vec3 c=mix(vec3(.035,.05,.09),vec3(1.,.97,.93),l);gl_FragColor=vec4(c,a*mix(.3,.75,l));}`
// Atmosphere: a back-faced shell. For every pixel we compute how close the view ray passes to the
// planet centre (b). Glow depends only on altitude above the limb (b-1), so it fades smoothly to
// zero at the shell edge: space -> faint blue haze -> planet, with no outline or halo ring.
const ATM_VS='varying vec3 vP;varying vec3 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vP=mv.xyz;vC=(modelViewMatrix*vec4(0.,0.,0.,1.)).xyz;gl_Position=projectionMatrix*mv;}'
const ATM=`uniform vec3 sun;uniform float hov;uniform float RA;varying vec3 vP;varying vec3 vC;
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec3 r=normalize(vP);vec3 q=r*dot(vC,r);float b=length(q-vC);
float h=clamp((b-1.)/(RA-1.),0.,1.);float prof=pow(1.-h,3.2);
vec3 nl=normalize(q-vC);vec3 s=normalize((viewMatrix*vec4(sun,0.)).xyz);float ds=dot(nl,s);
float lit=smoothstep(-.5,.6,ds);
vec3 cool=mix(vec3(.10,.26,.62),vec3(.36,.62,1.),pow(1.-h,2.));
float z=(ds-.02)/.22;float wm=exp(-z*z)*.4*(1.-h);
vec3 c=mix(cool,vec3(1.,.62,.32),wm);
float I=prof*(.05+.95*lit)*.62*(1.+.3*hov);
I+=(hash(gl_FragCoord.xy)-.5)/255.;
gl_FragColor=vec4(c,clamp(I,0.,1.));}`
export default function Globe({onFail,onReady}){const ref=useRef()
useEffect(()=>{const el=ref.current;let r
const still=matchMedia('(prefers-reduced-motion: reduce)').matches,touch=matchMedia('(pointer:coarse)').matches,small=innerWidth<700||touch
try{r=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})}catch{onFail?.();return}
let pr=Math.min(devicePixelRatio,small?1.5:2);r.setPixelRatio(pr);el.appendChild(r.domElement);r.domElement.style.cssText='width:100%;height:100%;display:block'
const lm=new THREE.LoadingManager(()=>{el.classList.add('ready');onReady?.();if(still)draw(performance.now())},undefined,()=>onFail?.())
const dir=import.meta.env.BASE_URL+'textures/'+(small?'lo/':''),aniso=Math.min(8,r.capabilities.getMaxAnisotropy())
const L=new THREE.TextureLoader(lm),tex=n=>{const t=L.load(dir+n);t.anisotropy=aniso;t.wrapS=THREE.RepeatWrapping;return t}
const day=tex('earth_day_4096.jpg'),night=tex('earth_night_4096.jpg'),brc=tex('earth_bump_roughness_clouds_4096.jpg')
const sunBase=new THREE.Vector3(.95,.32,.58).normalize(),sun=sunBase.clone(),defs=small?{LITE:''}:{}
const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(30,1,.1,50);cam.position.z=CAM_Z
const outer=new THREE.Group(),tilt=new THREE.Group(),spin=new THREE.Group();tilt.rotation.set(.38,0,.12);outer.add(tilt);tilt.add(spin);sc.add(outer)
const hov={value:0},eU={dayT:{value:day},nightT:{value:night},brcT:{value:brc},sun:{value:sun},hov,cOff:{value:0},texel:{value:1/(small?2048:4096)}}
spin.add(new THREE.Mesh(new THREE.SphereGeometry(1,small?64:128,small?44:84),new THREE.ShaderMaterial({defines:defs,vertexShader:VS,fragmentShader:EARTH,uniforms:eU})))
const clouds=new THREE.Mesh(new THREE.SphereGeometry(1.009,small?48:96,small?32:64),new THREE.ShaderMaterial({transparent:true,depthWrite:false,vertexShader:VS,fragmentShader:CLOUD,uniforms:{brcT:{value:brc},sun:{value:sun}}}));tilt.add(clouds)
const gh=glow('#e0883a'),gr=glow('#4aa3df'),sp=[]
hotspots.forEach(([a,o,k,s])=>{const m=new THREE.Sprite(new THREE.SpriteMaterial({map:k==='heat'?gh:gr,transparent:true,depthWrite:false,opacity:.3}));m.scale.setScalar(s);m.position.copy(ll(a,o,1.03));spin.add(m);sp.push(m)})
const mv=ll(marker.lat,marker.lon,1.014),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),mv.clone().normalize())
const dot=new THREE.Mesh(new THREE.SphereGeometry(.013,12,8),new THREE.MeshBasicMaterial({color:0xfff2d0}));dot.position.copy(mv)
const ring=new THREE.Mesh(new THREE.RingGeometry(.026,.03,40),new THREE.MeshBasicMaterial({color:0xfff2d0,transparent:true,side:THREE.DoubleSide,depthWrite:false}));ring.position.copy(mv);ring.quaternion.copy(q);spin.add(dot,ring)
const atm=new THREE.Mesh(new THREE.SphereGeometry(RA,96,64),new THREE.ShaderMaterial({side:THREE.BackSide,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,uniforms:{sun:{value:sun},hov,RA:{value:RA}},vertexShader:ATM_VS,fragmentShader:ATM}));sc.add(atm)
const base=-Math.atan2(mv.x,mv.z)+.15;spin.rotation.y=base
// interaction state: T = target from cursor; E earth, C clouds, K camera, S light follow it with different inertia
const T={x:0,y:0,h:0},E={x:0,y:0},C={x:0,y:0},K={x:0,y:0},S={x:0,y:0},eu=new THREE.Euler()
let speed=0,delta=.3,last=performance.now(),raf,vis=true,rect=el.getBoundingClientRect(),acc=0,nf=0,prev=0
const move=e=>{if(e.pointerType!=='mouse')return;T.x=THREE.MathUtils.clamp(e.clientX/innerWidth*2-1,-1,1);T.y=THREE.MathUtils.clamp(e.clientY/innerHeight*2-1,-1,1)
const R=rect.width*.36,dx=e.clientX-(rect.left+rect.width/2),dy=e.clientY-(rect.top+rect.height/2),d=Math.hypot(dx,dy)/R;T.h=1-THREE.MathUtils.smoothstep(d,1,1.9)}
const leave=()=>{T.x=T.y=T.h=0}
const size=()=>{const w=el.clientWidth;if(!w)return;r.setPixelRatio(Math.min(pr,Math.sqrt(2.4e6)/w)) // cap total pixels, not just DPR
r.setSize(w,w,false);cam.aspect=1;cam.updateProjectionMatrix();rect=el.getBoundingClientRect();if(still&&el.classList.contains('ready'))draw(performance.now())}
size();const ro=new ResizeObserver(size);ro.observe(el);const io=new IntersectionObserver(([x])=>vis=x.isIntersecting);io.observe(el)
function draw(now){const dt=Math.min((now-last)/1000,.05);last=now;const s=now/1000
if(!still){speed=lerp(speed,.03,1-Math.pow(.2,dt));spin.rotation.y+=speed*dt;delta+=.006*dt}
const m=still?0:1
E.x=ease(E.x,T.x*m,2.4,dt);E.y=ease(E.y,T.y*m,2.4,dt);C.x=ease(C.x,T.x*m,1.4,dt);C.y=ease(C.y,T.y*m,1.4,dt)
K.x=ease(K.x,T.x*m,1.8,dt);K.y=ease(K.y,T.y*m,1.8,dt);S.x=ease(S.x,T.x*m,.9,dt);S.y=ease(S.y,T.y*m,.9,dt)
hov.value=ease(hov.value,T.h*m,3,dt)
// planet is nearest, so it shifts most against the cursor; tilt stays small so the surface never shakes
tilt.rotation.x=.38+E.y*.06;tilt.rotation.y=E.x*.07;tilt.position.set(-E.x*.035,E.y*.025,0);atm.position.copy(tilt.position)
cam.position.set(K.x*.12,-K.y*.08,CAM_Z);cam.lookAt(0,0,0)
clouds.rotation.y=spin.rotation.y+delta;clouds.position.set((C.x-E.x)*.025,(E.y-C.y)*.018,0);eU.cOff.value=delta/(Math.PI*2)
eu.set(S.y*.1,S.x*.14,0);sun.copy(sunBase).applyEuler(eu)
const p=(s%4)/4;ring.scale.setScalar(1+p*3.5);ring.material.opacity=.85*(1-p);sp.forEach((h,i)=>h.material.opacity=.28+.1*Math.sin(s*.7+i*1.7))
r.render(sc,cam)}
const loop=now=>{raf=requestAnimationFrame(loop);if(document.hidden||!vis){prev=0;return}
if(prev){acc+=now-prev;nf++};prev=now;draw(now)
if(nf===120){const avg=acc/nf;acc=nf=0;if(avg>24&&pr>1){pr=Math.max(1,pr-.25);size()}}} // sustained <~40fps: drop resolution a step
if(!still){raf=requestAnimationFrame(loop);if(!small){addEventListener('pointermove',move);document.documentElement.addEventListener('mouseleave',leave)}}
return()=>{cancelAnimationFrame(raf);removeEventListener('pointermove',move);document.documentElement.removeEventListener('mouseleave',leave);ro.disconnect();io.disconnect()
sc.traverse(o=>{o.geometry?.dispose();o.material?.dispose?.()});[day,night,brc,gh,gr].forEach(t=>t.dispose());r.dispose();el.contains(r.domElement)&&el.removeChild(r.domElement)}},[])
return<div ref={ref} className="gl-canvas" role="img" aria-label="Earth with your location marked and nearby heat and rain zones"/>}
