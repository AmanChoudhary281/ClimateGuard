import {Outlet,useLocation} from 'react-router-dom'
import Navbar from '../components/Navbar'
export default function DashboardLayout(){const l=useLocation();return<><Navbar/><main key={l.pathname} className="page"><Outlet/></main></>}
