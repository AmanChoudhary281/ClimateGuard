import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Bell, Clock, Info } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';
import { audioService } from '../services/audioService';

export const AlertsView: React.FC = () => {
  const { alerts, coordinates } = useClimate();
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'ALL') return true;
    return a.status === filter;
  });

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'SEVERE':
        return { text: 'text-rose-400', border: 'border-rose-500/40', bg: 'bg-rose-500/10', dot: 'bg-rose-500' };
      case 'HIGH':
        return { text: 'text-orange-400', border: 'border-orange-500/40', bg: 'bg-orange-500/10', dot: 'bg-orange-500' };
      case 'MODERATE':
        return { text: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-500/10', dot: 'bg-amber-400' };
      default:
        return { text: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' };
    }
  };

  return (
    <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-rose-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span>DISPATCH & EMERGENCY BROADCASTS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mt-1 tracking-tight">
            Active Perimeter Alerts
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-mono">
            SECTOR: {coordinates.label || 'Monitored Perimeter'} · ACTIVE DIRECTIVES: {alerts.length}
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {(['ALL', 'ACTIVE', 'RESOLVED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                audioService.playTick();
                setFilter(tab);
              }}
              className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                filter === tab
                  ? 'bg-slate-800 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Stream */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-[#040814]/85 border border-slate-800/90 rounded-2xl p-12 text-center backdrop-blur-xl flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-base font-semibold text-white">NO ACTIVE CLIMATE ALERTS</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            All perimeter observation sensors report baseline environmental equilibrium. Zero hazardous thresholds exceeded.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const sev = getSeverityStyle(alert.severity);
            return (
              <div
                key={alert.id}
                className={`bg-[#040814]/85 border ${sev.border} rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-xl transition-all duration-300 flex flex-col gap-4`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/70 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${sev.dot} animate-pulse`} />
                    <span className={`text-xs font-mono font-bold tracking-wider ${sev.text} uppercase`}>
                      {alert.title}
                    </span>
                    <span className="text-slate-600 font-mono text-xs">|</span>
                    <span className="text-slate-400 font-mono text-xs uppercase">{alert.type.replace('_', ' ')}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{alert.time} UTC</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${sev.bg} ${sev.text} border ${sev.border}`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-200 font-normal leading-relaxed">
                  {alert.message}
                </p>

                {alert.advisory && (
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-3 text-xs font-sans text-slate-300">
                    <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block mb-0.5">ACTIONABLE PROTOCOL:</span>
                      <span>{alert.advisory}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
