import WeatherHero from '../components/WeatherHero'
import LiveIndicator from '../components/LiveIndicator'
import RiskMeter from '../components/RiskMeter'
import ForecastCard from '../components/ForecastCard'
import AlertCard from '../components/AlertCard'
import {weather as w,forecast,alerts} from '../data/mockData'
export default function Dashboard(){return<><LiveIndicator/><WeatherHero/><div className="g2"><RiskMeter title="Heat risk" {...w.heat}/><RiskMeter title="Rain risk" level={w.rainRisk.level} value={w.rainRisk.value}/></div>
<h2>3-day forecast</h2><div className="g3">{forecast.map(f=><ForecastCard key={f.d} f={f}/>)}</div><h2>Climate alerts</h2><div className="g2">{alerts.slice(0,2).map(a=><AlertCard key={a.id} a={a}/>)}</div></>}
