import React from 'react';
import { User, Phone, MapPin, ShieldCheck, RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';
import { audioService } from '../services/audioService';

export const ProfileView: React.FC = () => {
  const { operator, coordinates, locationStatus, userId, requestLocation, setCurrentView, logout } = useClimate();

  const locationLocked = locationStatus === 'LOCATION LOCKED';

  return (
    <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col gap-8 animate-fadeIn text-slate-100">
      <div className="border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-slate-400 uppercase">
          <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
          <span>PROFILE // SECURE RISK IDENTITY</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1.5 tracking-tight">Your ClimateGuard Profile</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">Your registered identity and monitored location used for personalized climate intelligence.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="profile-panel p-6 sm:p-7 backdrop-blur-2xl shadow-2xl">
          <div className="panel-status pb-3 mb-4"><span>REGISTRATION</span><b><i /><span>ACTIVE</span></b></div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800"><User className="w-4 h-4 text-sky-400" /><div><div className="text-[10px] uppercase tracking-wider font-mono text-slate-500">FULL NAME</div><div className="text-sm text-white mt-1">{operator.name}</div></div></div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800"><Phone className="w-4 h-4 text-sky-400" /><div><div className="text-[10px] uppercase tracking-wider font-mono text-slate-500">MOBILE</div><div className="text-sm text-white mt-1">{operator.phone}</div></div></div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800"><MapPin className="w-4 h-4 text-sky-400" /><div><div className="text-[10px] uppercase tracking-wider font-mono text-slate-500">ADDRESS</div><div className="text-sm text-white mt-1">{operator.address}</div></div></div>
            <div className="pt-3 border-t border-slate-800/80 text-xs font-mono text-slate-500">USER ID <span className="text-emerald-400">{userId || 'registered'}</span></div>
          </div>
        </section>

        <section className="bg-[#040814]/85 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3"><span className="text-xs font-mono tracking-wider text-slate-400">MONITORED LOCATION</span><ShieldCheck className="w-4 h-4 text-emerald-400" /></div>
          <div className="mt-5 text-3xl font-bold text-white tabular-nums">{coordinates.label || 'Location locked'}</div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs font-mono"><div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3"><span className="text-slate-500 block">LATITUDE</span><span className="text-slate-200 block mt-1">{coordinates.lat.toFixed(5)}°</span></div><div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3"><span className="text-slate-500 block">LONGITUDE</span><span className="text-slate-200 block mt-1">{coordinates.lng.toFixed(5)}°</span></div></div>
          <button onClick={() => { audioService.playTick(); requestLocation(); }} className="mt-4 w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-sky-400 transition-colors flex items-center justify-center gap-2"><RefreshCw className={`w-3.5 h-3.5 ${locationLocked ? '' : 'animate-spin'}`} /> UPDATE MY LOCATION</button>
          <div className="mt-5 flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Personalized climate monitoring is active.</div>
        </section>
      </div>

      <div className="self-start flex flex-wrap items-center gap-4">
      <button onClick={() => { audioService.playTick(); setCurrentView('AREA'); }} className="flex items-center gap-2 text-xs font-mono text-slate-300 hover:text-white transition-colors">RETURN TO YOUR AREA <ArrowRight className="w-4 h-4" /></button>
      <button onClick={() => { logout(); }} className="px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-xs font-mono text-red-400 hover:text-red-300 transition-colors">LOGOUT</button>
    </div>
    </div>
  );
};

