import {useState} from 'react'
import AlertCard from '../components/AlertCard'
import {alerts} from '../data/mockData'
const T=['ALL','LOW','MODERATE','HIGH','SEVERE']
export default function Alerts(){const[f,sf]=useState('ALL');const l=alerts.filter(a=>f==='ALL'||a.sev===f)
return<><h1>Alerts</h1><div className="tabs" role="tablist">{T.map(t=><button key={t} role="tab" aria-selected={f===t} onClick={()=>sf(t)}>{t[0]+t.slice(1).toLowerCase()}</button>)}</div><div className="g2" key={f}>{l.map(a=><AlertCard key={a.id} a={a}/>)}</div>{!l.length&&<p className="mut">No alerts at this level.</p>}</>}
