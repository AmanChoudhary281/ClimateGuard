import {Sun,Cloud,CloudRain} from 'lucide-react'
export default function ForecastCard({f}){const I={sun:Sun,cloud:Cloud,rain:CloudRain}[f.c];return<div className="card fc" tabIndex={0}><small>{f.d}</small><I size={34} className="wi"/><b>{f.hi}°</b><span>{f.lo}°</span><em>{f.rain}% rain</em></div>}
