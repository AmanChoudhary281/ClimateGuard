import {lazy,Suspense} from 'react'
import {Routes,Route,Navigate,useLocation} from 'react-router-dom'
import ClimateBackground from './components/ClimateBackground'
import DashboardLayout from './layouts/DashboardLayout'
const P=n=>lazy(()=>import(`./pages/${n}.jsx`))
const Login=P('Login'),Dashboard=P('Dashboard'),Weather=P('Weather'),Alerts=P('Alerts'),Assistant=P('Assistant'),Profile=P('Profile')
export default function App(){const l=useLocation()
return<><ClimateBackground/><Suspense fallback={<div className="skel" style={{height:'100vh'}}/>}>
<Routes location={l}><Route path="/" element={<Login/>}/>
<Route element={<DashboardLayout/>}><Route path="/dashboard" element={<Dashboard/>}/><Route path="/weather" element={<Weather/>}/><Route path="/alerts" element={<Alerts/>}/><Route path="/assistant" element={<Assistant/>}/><Route path="/profile" element={<Profile/>}/></Route>
<Route path="*" element={<Navigate to="/"/>}/></Routes></Suspense></>}
