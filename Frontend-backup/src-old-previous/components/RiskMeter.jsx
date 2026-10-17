import {useEffect,useState} from 'react'
export default function RiskMeter({title,level,value}){const[v,s]=useState(0);useEffect(()=>{const t=setTimeout(()=>s(value),150);return()=>clearTimeout(t)},[value])
const C=2*Math.PI*52
return<div className={`card risk r-${level}`}><h3>{title}</h3><svg viewBox="0 0 120 120" role="img" aria-label={`${title}: ${level}`}><circle cx="60" cy="60" r="52" className="tr"/><circle cx="60" cy="60" r="52" className="fg" strokeDasharray={C} strokeDashoffset={C*(1-v/100)} transform="rotate(-90 60 60)"/><text x="60" y="66" textAnchor="middle">{Math.round(v)}</text></svg><strong>{level}</strong></div>}
