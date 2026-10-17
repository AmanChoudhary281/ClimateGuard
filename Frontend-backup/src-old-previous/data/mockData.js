export const user={name:'Aman',phone:'+91 98765 43210',address:'Rajpur Road, Dehradun',lat:30.3165,lon:78.0322}
export const weather={temp:24,feels:25,humidity:68,wind:8,rain:0,state:'calm',location:'Dehradun, Uttarakhand',heat:{level:'LOW',value:22},rainRisk:{level:'LOW',value:15}}
export const forecast=[{d:'Mon, 6 Oct',hi:29,lo:18,rain:10,c:'sun'},{d:'Tue, 7 Oct',hi:27,lo:17,rain:45,c:'cloud'},{d:'Wed, 8 Oct',hi:25,lo:16,rain:70,c:'rain'}]
export const trend=[18,17,17,20,24,27,29,28,25,22,20,19]
export const alerts=[
{id:1,type:'Heatwave Risk',sev:'HIGH',loc:'Dehradun',msg:'High heatwave risk detected in your area.',time:'2 hrs ago',status:'Active'},
{id:2,type:'Heavy Rainfall',sev:'MODERATE',loc:'Dehradun',msg:'Heavy rain expected Wednesday evening.',time:'Yesterday',status:'Active'},
{id:3,type:'Thunderstorm',sev:'SEVERE',loc:'Dehradun',msg:'Severe thunderstorm warning. Stay indoors.',time:'2 days ago',status:'Resolved'},
{id:4,type:'Humidity',sev:'LOW',loc:'Dehradun',msg:'Humidity above average today.',time:'3 days ago',status:'Resolved'}]
export const chips=['What is the weather in my area?','Is it safe for me to go outside?','What are heatwave precautions?','Will it rain tomorrow?']
export const reply=q=>`Right now it's 24°C in Dehradun with 68% humidity and light wind. Heat and rain risk are both LOW, so conditions are safe. Rain chances rise to 45% tomorrow.`
export const instruments=[['LIVE MONITORING','t1'],['LAT 28.6° N','t2'],['LON 77.2° E','t3'],['RISK ENGINE ONLINE','t4']]
export const marker={lat:28.6,lon:77.2}
export const riskSpots=[[19.1,72.9],[13.1,80.3],[26.9,75.8],[22.6,88.4]]
export const hotspots=[[26.9,75.8,'heat',.3],[23,8,'heat',.36],[14,88,'rain',.3],[-4,-62,'rain',.36]]
export const readouts=[{k:'Live monitoring',v:'System online',s:'ok'},{k:'Current location',v:'28.6° N  77.2° E'},{k:'Current conditions',v:'24°C · 68% humidity'},{k:'Climate risk',v:'Low',s:'low'}]
