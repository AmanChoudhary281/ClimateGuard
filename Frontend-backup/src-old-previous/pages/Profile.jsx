import {user} from '../data/mockData'
export default function Profile(){const S=[['Personal information',[['Name',user.name],['Phone',user.phone]]],['Location',[['Address',user.address],['Latitude',user.lat],['Longitude',user.lon]]]]
return<><h1>Profile</h1>{S.map(([t,r])=><section className="card" key={t}><h3>{t}</h3>{r.map(([a,b])=><div className="kv" key={a}><span>{a}</span><b>{b}</b></div>)}</section>)}
<section className="card"><h3>Notification preferences</h3>{['Heat alerts','Rain alerts','Severe weather'].map(x=><label className="kv" key={x}><span>{x}</span><input type="checkbox" defaultChecked/></label>)}</section></>}
