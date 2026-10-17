import {useState,lazy,Suspense} from 'react'
import {useNavigate} from 'react-router-dom'
import {ArrowRight} from 'lucide-react'
import {readouts} from '../data/mockData'
const Globe=lazy(()=>import('../components/Globe'))
const F=[['name','Name','text','name','Your full name'],['phone','Phone number','tel','tel','+91 98765 43210'],['address','Address','text','street-address','Street, city']]
export default function Login(){const nav=useNavigate(),[busy,sb]=useState(false),[out,so]=useState(false),[fail,sf]=useState(false)
const go=e=>{e.preventDefault();sb(true);setTimeout(()=>so(true),900);setTimeout(()=>nav('/dashboard'),1450)}
return<div className={`entry${out?' out':''}`}>
<section className="stage"><div className="stat"><i/>Climate Intelligence System<span>v0.1</span></div>
<div className="gl">{fail?<div className="gl-fb"/>:<Suspense fallback={null}><Globe onFail={()=>sf(true)}/></Suspense>}<dl className="ro">{readouts.map(r=><div key={r.k} className={r.s?`s-${r.s}`:''}><dt>{r.k}</dt><dd>{r.s&&<i/>}{r.v}</dd></div>)}</dl></div>
<h1><span>Know the Risk.</span><span>Before It Reaches You.</span></h1><p className="sub">Personalized climate intelligence for where you live.</p></section>
<form className="panel" onSubmit={go}><h2>Create your profile</h2><p className="hint">Set your location to receive personalized climate alerts.</p>
{F.map(([k,l,t,a,ph])=><label key={k}><span>{l}</span><input name={k} type={t} autoComplete={a} placeholder={ph} required/></label>)}
<button className={`go${busy?' busy':''}`} disabled={busy}>{busy?'Initializing…':<>Initialize ClimateGuard<ArrowRight size={16}/></>}</button></form></div>}
