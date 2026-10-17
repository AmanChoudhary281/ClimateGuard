import {useEffect,useMemo,useRef} from 'react'
import {useLocation} from 'react-router-dom'
// Deep space in three depth layers (far stars / haze + near stars). The Earth canvas is the foreground.
const seeded=s=>()=>(s=(s*1664525+1013904223)>>>0)/4294967296
const TINT=['#ffffff','#dfeaff','#cfe0ff','#fff1dc']
const field=(seed,n,r0,r1,o0,o1,tw)=>{const R=seeded(seed);return Array.from({length:n},(_,i)=>({x:R()*100,y:R()*100,r:r0+Math.pow(R(),3)*(r1-r0),o:o0+R()*(o1-o0),c:TINT[Math.floor(R()*TINT.length)],t:tw&&i%tw===0,d:7+R()*7}))}
const Stars=({list})=><svg aria-hidden="true">{list.map((s,i)=><circle key={i} className={s.t?'tw':undefined} style={s.t?{animationDuration:`${s.d}s`,animationDelay:`-${s.d*.5}s`}:undefined} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill={s.c} fillOpacity={s.o}/>)}</svg>
export default function ClimateBackground(){const ref=useRef(),{pathname}=useLocation()
const far=useMemo(()=>field(7,64,.45,1.3,.25,.9,9),[]),mid=useMemo(()=>field(23,9,1.2,2,.18,.4,0),[])
useEffect(()=>{const el=ref.current,set=(x,y)=>{el.style.setProperty('--px',x.toFixed(3));el.style.setProperty('--py',y.toFixed(3))};set(0,0)
// subtle cursor parallax on the landing page only; off for touch and reduced motion
if(pathname!=='/'||matchMedia('(prefers-reduced-motion: reduce)').matches||matchMedia('(pointer:coarse)').matches)return
let tx=0,ty=0,x=0,y=0,raf=0,last=0
const tick=now=>{const dt=Math.min((now-last)/1000,.05);last=now;const k=1-Math.exp(-dt*2.2);x+=(tx-x)*k;y+=(ty-y)*k;set(x,y);raf=Math.abs(tx-x)+Math.abs(ty-y)>.002?requestAnimationFrame(tick):0}
const kick=()=>{if(!raf){last=performance.now();raf=requestAnimationFrame(tick)}}
const move=e=>{if(e.pointerType!=='mouse')return;tx=e.clientX/innerWidth*2-1;ty=e.clientY/innerHeight*2-1;kick()}
const leave=()=>{tx=ty=0;kick()}
addEventListener('pointermove',move);document.documentElement.addEventListener('mouseleave',leave)
return()=>{cancelAnimationFrame(raf);removeEventListener('pointermove',move);document.documentElement.removeEventListener('mouseleave',leave)}},[pathname])
return<div className="bg" ref={ref} aria-hidden="true"><div className="bg-far"><Stars list={far}/></div><div className="bg-haze"/><div className="bg-mid"><Stars list={mid}/></div><div className="bg-vig"/></div>}
