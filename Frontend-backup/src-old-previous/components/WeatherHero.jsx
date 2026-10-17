import {weather as w,user} from '../data/mockData'
import {Droplets,Wind,Thermometer,CloudRain} from 'lucide-react'
export default function WeatherHero(){const h=new Date().getHours(),g=h<12?'morning':h<17?'afternoon':'evening'
return<section className={`hero st-${w.state}`}><div className="sky"><i className="sun"/><i className="cl c1"/><i className="cl c2"/>{[0,1,2,3,4,5].map(i=><s key={i} style={{top:`${15+i*14}%`,animationDelay:`${-i*1.7}s`}}/>)}</div>
<div className="hc"><p>Good {g}, {user.name}.</p><h1>Climate conditions around you</h1><small>{w.location}</small><div className="temp">{w.temp}°</div>
<ul><li><Thermometer size={16}/>Feels {w.feels}°</li><li><Droplets size={16}/>{w.humidity}%</li><li><Wind size={16}/>{w.wind} km/h</li><li><CloudRain size={16}/>{w.rain} mm</li></ul></div></section>}
