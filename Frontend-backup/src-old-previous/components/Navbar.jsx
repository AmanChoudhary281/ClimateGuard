import {NavLink} from 'react-router-dom'
import {LayoutDashboard,CloudSun,BellRing,Sparkles,User,Bell} from 'lucide-react'
const L=[['/dashboard','Dashboard',LayoutDashboard],['/weather','Weather',CloudSun],['/alerts','Alerts',BellRing],['/assistant','AI Assistant',Sparkles],['/profile','Profile',User]]
export default function Navbar(){return<header className="nav"><div className="logo"><i/>ClimateGuard</div>
<nav aria-label="Main">{L.map(([to,t,I])=><NavLink key={to} to={to}><I size={18}/><span>{t}</span></NavLink>)}</nav>
<div className="nr"><button className="ic" aria-label="Notifications"><Bell size={18}/><u/></button><div className="av">A</div></div></header>}
