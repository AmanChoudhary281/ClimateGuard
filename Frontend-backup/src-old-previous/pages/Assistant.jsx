import {useState,useRef,useEffect} from 'react'
import {Send,Mic} from 'lucide-react'
import AIOrb from '../components/AIOrb'
import {chips,reply} from '../data/mockData'
export default function Assistant(){const[m,sm]=useState([{r:'ai',t:'Hi Aman, ask me anything about the climate around you.'}]),[v,sv]=useState(''),[busy,sb]=useState(false),[mic,smic]=useState(false),end=useRef()
useEffect(()=>end.current?.scrollIntoView({behavior:'smooth'}),[m,busy])
const send=q=>{q=q.trim();if(!q||busy)return;sm(x=>[...x,{r:'me',t:q}]);sv('');sb(true)
setTimeout(()=>{const full=reply(q);sb(false);sm(x=>[...x,{r:'ai',t:''}]);let i=0;const id=setInterval(()=>{i+=3;sm(x=>x.map((y,j)=>j===x.length-1?{...y,t:full.slice(0,i)}:y));if(i>=full.length)clearInterval(id)},25)},700)}
return<div className="chat card"><div className="ch"><AIOrb active={busy} size={52}/><div><h1>ClimateGuard AI</h1><small>Your personal climate intelligence assistant.</small></div></div>
<div className="msgs" aria-live="polite">{m.map((x,i)=><div key={i} className={`msg ${x.r}`}>{x.t}</div>)}{busy&&<div className="msg ai typing"><u/><u/><u/></div>}<div ref={end}/></div>
{mic&&<div className="voice" onClick={()=>smic(false)}><AIOrb active size={110}/><em><u/><u/><u/><u/><u/></em><p>Listening…</p></div>}
<div className="chips">{chips.map(c=><button key={c} onClick={()=>send(c)}>{c}</button>)}</div>
<form className="ci" onSubmit={e=>{e.preventDefault();send(v)}}><input value={v} onChange={e=>sv(e.target.value)} placeholder="Ask about weather, risks or safety" aria-label="Message"/><button type="button" className="ic" aria-label="Voice input" onClick={()=>smic(true)}><Mic size={18}/></button><button className="ic go" aria-label="Send"><Send size={18}/></button></form></div>}
