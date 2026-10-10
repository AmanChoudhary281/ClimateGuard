import React, { useState, useRef } from 'react';
import { User, Phone, MapPin, ArrowRight, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { AddressResolutionState, InitPhase, OperatorForm, SystemRiskReport } from '../types/climate';
import { audioService } from '../services/audioService';

interface RegistrationCardProps {
  onAddressChange: (address: string) => void;
  onSubmit: (form: OperatorForm) => Promise<SystemRiskReport | null>;
  registrationError: string | null;
  addressState: AddressResolutionState;
  initPhase: InitPhase;
  lastReport: SystemRiskReport | null;
  onDismissReport: () => void;
}

export const RegistrationCard: React.FC<RegistrationCardProps> = ({
  onAddressChange,
  onSubmit,
  registrationError,
  addressState,
  initPhase,
  lastReport,
  onDismissReport,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [focusedField, setFocusedField] = useState<'name' | 'phone' | 'address' | null>(null);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});

  // Button magnetic interaction
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonTransform, setButtonTransform] = useState({ x: 0, y: 0 });

  // Calculate readiness percentage
  const hasName = name.trim().length >= 2;
  const hasPhone = phone.trim().length >= 6;
  const hasAddress = address.trim().length >= 3;

  let readiness = 0;
  if (hasName) readiness += 33;
  if (hasPhone) readiness += 33;
  if (hasAddress) readiness += 34;
  if (readiness === 99 || readiness > 95) readiness = 100;

  const handleMouseMoveButton = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setButtonTransform({ x: x * 0.1, y: y * 0.1 });
  };

  const handleMouseLeaveButton = () => {
    setButtonTransform({ x: 0, y: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; phone?: string; address?: string } = {};

    if (!hasName) newErrors.name = 'Operator identity required';
    if (!hasPhone) newErrors.phone = 'Valid phone format required';
    if (!hasAddress) newErrors.address = 'Street / city required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    audioService.playHandshakeSweep();
    await onSubmit({ name, phone, address });
  };

  const getButtonText = () => {
    switch (initPhase) {
      case 'INITIALIZING':
        return 'INITIALIZING...';
      case 'ESTABLISHING_LINK':
        return 'ESTABLISHING SECURE LINK...';
      case 'RESOLVING_LOCATION':
        return 'RESOLVING LOCATION...';
      case 'BUILDING_RISK_PROFILE':
        return 'BUILDING RISK PROFILE...';
      case 'READY':
        return 'READY';
      default:
        return 'INITIALIZE CLIMATEGUARD';
    }
  };

  const isSubmitting = initPhase !== 'IDLE' && initPhase !== 'READY' && initPhase !== 'ERROR';

  return (
    <div id="secure-risk-profile" tabIndex={-1} className="relative z-20 w-full max-w-[420px] transition-transform duration-500 outline-none">
      {/* 4 HUD Corner Brackets matching Lovable app */}
      <span className="corner-mark tl" aria-hidden="true" />
      <span className="corner-mark tr" aria-hidden="true" />
      <span className="corner-mark bl" aria-hidden="true" />
      <span className="corner-mark br" aria-hidden="true" />

      {/* Main Glassmorphic Card Container (.profile-panel) */}
      <div
        className={`profile-panel ${
          initPhase === 'READY' || lastReport ? 'profile-ready' : isSubmitting ? 'profile-scanning' : ''
        } p-6 sm:p-7 md:p-8 backdrop-blur-xl shadow-2xl transition-all duration-300`}
      >
        {/* Scanning line animation when submitting */}
        {isSubmitting && (
          <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-panelScan pointer-events-none z-30" />
        )}

        {/* Card Header: System ID & Sat-Link Status (.panel-status) */}
        <div className="panel-status pb-3 mb-1 select-none">
          <span>SYS.ID // 084-CG</span>
          <b>
            <i />
            <span>SAT-LINK ONLINE</span>
          </b>
        </div>

        {/* Card Title & Subtitle */}
        <header className="mt-4">
          <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
            {initPhase === 'READY' || lastReport ? 'Perimeter secured' : 'Secure Risk Profile'}
          </h2>
          <p className="mt-1 text-xs md:text-sm text-slate-400 font-normal">
            {initPhase === 'READY' || lastReport
              ? 'Regional monitoring is active for your coordinates.'
              : 'Establish regional perimeter monitoring'}
          </p>
        </header>

        {registrationError && initPhase === 'ERROR' && (
          <div
            role="alert"
            aria-live="assertive"
            className="mt-5 rounded-xl border border-rose-500/25 bg-rose-500/5 px-4 py-3 text-xs text-rose-300 flex gap-2 items-start"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-mono tracking-wider uppercase text-[10px] text-rose-300">REGISTRATION LINK ERROR</div>
              <div className="mt-1 text-rose-200/90 leading-relaxed">{registrationError}</div>
            </div>
          </div>
        )}

        {initPhase === 'READY' || lastReport ? (
          /* Secured In-Card Receipt View (matching Lovable app) */
          <div className="mt-6 space-y-4 animate-fadeIn">
            <dl className="profile-receipt">
              <div>
                <dt>Operator</dt>
                <dd>{name || lastReport?.operator?.name || '—'}</dd>
              </div>
              <div>
                <dt>Mobile</dt>
                <dd>{phone || lastReport?.operator?.phone || '—'}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd className="max-w-[200px] truncate">{address || lastReport?.operator?.address || 'Monitored Perimeter'}</dd>
              </div>
              <div className="pt-2 border-t border-slate-800/80">
                <dt className="text-emerald-400">Reference</dt>
                <dd className="text-emerald-400 font-semibold">{lastReport?.id || 'CG-084-SEC'}</dd>
              </div>
            </dl>

            <div className="panel-actions pt-1">
              <button
                type="button"
                onClick={() => {
                  audioService.playTick();
                }}
                className="panel-action"
              >
                <span>View full risk report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  audioService.playTick();
                  onDismissReport();
                }}
                className="panel-action panel-action-ghost"
              >
                <span>Add another location</span>
              </button>
            </div>

            <div className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs py-3 px-4 rounded-xl flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Perimeter protected</span>
              </div>
              <span className="text-[10px] text-emerald-500/80">AES-256 ACTIVE</span>
            </div>
          </div>
        ) : (
          /* Registration Form with Staggered Field Transitions */
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Field 1: Primary Operator Name */}
            <div className="transition-all duration-300">
              <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                <label htmlFor="operator-name" className={focusedField === 'name' ? 'text-sky-300' : ''}>
                  PRIMARY OPERATOR [AUTH]
                </label>
                {hasName && <Check className="w-3 h-3 text-emerald-400" />}
                {errors.name && <span className="text-rose-400 lowercase">{errors.name}</span>}
              </div>
              <div className="mt-1.5 relative flex items-center">
                <User
                  className={`absolute left-3.5 w-4 h-4 transition-colors duration-200 pointer-events-none ${
                    focusedField === 'name' ? 'text-sky-400' : 'text-slate-500'
                  }`}
                />
                <input
                  id="operator-name"
                  type="text"
                  value={name}
                  onFocus={() => {
                    setFocusedField('name');
                    audioService.playTick();
                  }}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Your full name"
                  disabled={isSubmitting}
                  className="w-full bg-[#070d1e]/80 border border-slate-800/90 focus:border-sky-500/80 focus:shadow-[0_0_12px_rgba(56,189,248,0.15)] rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none transition-all font-sans"
                />
              </div>
            </div>

            {/* Field 2: Encrypted Mobile */}
            <div className="transition-all duration-300">
              <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                <label htmlFor="operator-phone" className={focusedField === 'phone' ? 'text-sky-300' : ''}>
                  ENCRYPTED MOBILE [E.164]
                </label>
                {hasPhone && <Check className="w-3 h-3 text-emerald-400" />}
                {errors.phone && <span className="text-rose-400 lowercase">{errors.phone}</span>}
              </div>
              <div className="mt-1.5 relative flex items-center">
                <Phone
                  className={`absolute left-3.5 w-4 h-4 transition-colors duration-200 pointer-events-none ${
                    focusedField === 'phone' ? 'text-sky-400' : 'text-slate-500'
                  }`}
                />
                <input
                  id="operator-phone"
                  type="tel"
                  value={phone}
                  onFocus={() => {
                    setFocusedField('phone');
                    audioService.playTick();
                  }}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  placeholder="+91 98XXX XXXXX"
                  disabled={isSubmitting}
                  className="w-full bg-[#070d1e]/80 border border-slate-800/90 focus:border-sky-500/80 focus:shadow-[0_0_12px_rgba(56,189,248,0.15)] rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none transition-all font-sans"
                />
              </div>
            </div>

            {/* Field 3: Address & Location Resolution */}
            <div className="transition-all duration-300">
              <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                <label htmlFor="operator-address" className={focusedField === 'address' ? 'text-sky-300' : ''}>
                  ADDRESS <span className="text-sky-400/90 font-medium">[{addressState}]</span>
                </label>
                {hasAddress && addressState === 'LOCATED' && <Check className="w-3 h-3 text-emerald-400" />}
                {errors.address && <span className="text-rose-400 lowercase">{errors.address}</span>}
              </div>
              <div className="mt-1.5 relative flex items-center">
                <MapPin
                  className={`absolute left-3.5 w-4 h-4 transition-colors duration-200 pointer-events-none ${
                    focusedField === 'address' ? 'text-sky-400' : 'text-slate-500'
                  }`}
                />
                <input
                  id="operator-address"
                  type="text"
                  value={address}
                  onFocus={() => {
                    setFocusedField('address');
                    audioService.playTick();
                  }}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAddress(val);
                    onAddressChange(val);
                    if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
                  }}
                  placeholder="Street, city"
                  disabled={isSubmitting}
                  className="w-full bg-[#070d1e]/80 border border-slate-800/90 focus:border-sky-500/80 focus:shadow-[0_0_12px_rgba(56,189,248,0.15)] rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none transition-all font-sans"
                />
              </div>
            </div>

            {/* Readiness Meter with Smooth Segment Interpolation */}
            <div className="pt-2">
              <div className="flex items-center justify-between gap-2">
                <div className="grid grid-cols-3 gap-2 flex-1 h-1">
                  <div
                    className={`rounded-full transition-all duration-500 ${
                      readiness >= 33 ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'bg-slate-800'
                    }`}
                  />
                  <div
                    className={`rounded-full transition-all duration-500 ${
                      readiness >= 66 ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'bg-slate-800'
                    }`}
                  />
                  <div
                    className={`rounded-full transition-all duration-500 ${
                      readiness >= 100 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-800'
                    }`}
                  />
                </div>
                <span className="text-[10px] font-mono tracking-widest text-slate-400 select-none whitespace-nowrap">
                  READINESS {readiness}%
                </span>
              </div>
            </div>

            {/* Primary CTA Button with Subtle Hover Lift & Magnetic Micro-Motion */}
            <div className="pt-2">
              <button
                ref={buttonRef}
                type="submit"
                disabled={isSubmitting}
                onMouseMove={handleMouseMoveButton}
                onMouseLeave={handleMouseLeaveButton}
                style={{
                  transform: `translate3d(${buttonTransform.x}px, ${buttonTransform.y}px, 0)`,
                }}
                className="group relative w-full bg-[#e8e2d5] hover:bg-[#f2ece0] active:scale-[0.98] text-slate-950 font-semibold tracking-wider text-xs md:text-sm py-3.5 px-5 rounded-xl flex items-center justify-between transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[0_8px_20px_rgba(232,226,213,0.15)] disabled:opacity-75 disabled:cursor-not-allowed select-none"
              >
                <span className="font-mono tracking-widest">{getButtonText()}</span>
                <ArrowRight className="w-4 h-4 text-slate-950 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </form>
        )}

        {/* Card Footer: Security & Isolation Mark */}
        <div className="mt-5 text-center">
          <p className="text-[9px] font-mono tracking-widest text-slate-500/80 uppercase select-none">
            AES-256 GEOGRAPHIC ISOLATION · ZERO-TELEMETRY LOGGING
          </p>
        </div>
      </div>

      {/* Success Diagnostic Report Modal */}
      {lastReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#040814] border border-slate-800 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-emerald-400 tracking-wider">
                    SECURE LINK ESTABLISHED
                  </div>
                  <h3 className="text-lg font-semibold text-white">ClimateGuard Profile Active</h3>
                </div>
              </div>
              <button
                onClick={onDismissReport}
                className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 cursor-pointer"
              >
                CLOSE
              </button>
            </div>

            <div className="mt-5 space-y-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">OPERATOR ID:</span>
                <span className="text-slate-200">{lastReport.id}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">MONITORED COORDINATES:</span>
                <span className="text-slate-200">
                  {lastReport.coordinates.lat.toFixed(3)}° N, {lastReport.coordinates.lng.toFixed(3)}° E
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">PERIMETER RISK RATING:</span>
                <span
                  className={`font-semibold ${
                    lastReport.riskLevel === 'LOW'
                      ? 'text-emerald-400'
                      : lastReport.riskLevel === 'MODERATE'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {lastReport.riskLevel} ({lastReport.riskScore}/100)
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                  ACTIVE OBSERVATION ADVISORIES
                </div>
                <div className="space-y-1.5 font-sans text-xs text-slate-300">
                  {lastReport.advisories.map((adv, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-sky-400 font-mono">0{idx + 1}.</span>
                      <span>{adv}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onDismissReport}
                className="bg-[#e8e2d5] hover:bg-[#f2ece0] text-slate-950 font-semibold px-5 py-2.5 rounded-xl text-xs font-mono tracking-wider transition-colors cursor-pointer"
              >
                RETURN TO SYSTEM CONSOLE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
