import {weather as w,forecast,trend} from '../data/mockData'
import ForecastCard from '../components/ForecastCard'
export default function Weather(){const m=Math.max(...trend),n=Math.min(...trend),p=trend.map((v,i)=>`${i*(600/11)},${190-(v-n)/(m-n)*170}`).join(' ')
return<><h1>Weather</h1><div className="g4">{[['Temperature',w.temp+'°C'],['Humidity',w.humidity+'%'],['Wind',w.wind+' km/h'],['Rainfall',w.rain+' mm']].map(([a,b])=><div className="card stat" key={a}><small>{a}</small><b>{b}</b></div>)}</div>
<h2>Temperature trend, next 12 hours</h2><div className="card"><svg viewBox="0 0 600 200" className="chart" role="img" aria-label="Temperature trend"><polyline points={p} pathLength="1"/></svg></div>
<h2>3-day forecast</h2><div className="g3">{forecast.map(f=><ForecastCard key={f.d} f={f}/>)}</div></>}
