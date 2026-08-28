import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertOctagon, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Radio, 
  ShieldAlert,
  Volume2,
  VolumeX,
  Ambulance,
  Building2,
  PhoneCall,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  User
} from 'lucide-react';
import { CrashAlert } from '../types';

interface CrashConfirmationModalProps {
  alert: CrashAlert;
  onCancel: () => void;
  onConfirmNow: () => void;
}

export const CrashConfirmationModal: React.FC<CrashConfirmationModalProps> = ({
  alert,
  onCancel,
  onConfirmNow
}) => {
  const totalDuration = alert.confirmationCountdown || 30;
  const [secondsLeft, setSecondsLeft] = useState(totalDuration);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [dispatchedState, setDispatchedState] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play synthesized emergency beeps
  useEffect(() => {
    if (!audioEnabled || dispatchedState) return;

    let intervalId: any;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    } catch {
      // Audio context might be restricted before interaction
    }

    const playBeep = () => {
      try {
        if (!audioCtxRef.current) {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        if (audioCtxRef.current) {
          const osc = audioCtxRef.current.createOscillator();
          const gain = audioCtxRef.current.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, audioCtxRef.current.currentTime); // A5 note
          osc.frequency.exponentialRampToValueAtTime(440, audioCtxRef.current.currentTime + 0.18);
          gain.gain.setValueAtTime(0.15, audioCtxRef.current.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.18);
          osc.connect(gain);
          gain.connect(audioCtxRef.current.destination);
          osc.start();
          osc.stop(audioCtxRef.current.currentTime + 0.2);
        }
      } catch (e) {
        // silent fallback
      }
    };

    intervalId = setInterval(playBeep, 1000);
    return () => {
      clearInterval(intervalId);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [audioEnabled, dispatchedState]);

  useEffect(() => {
    if (dispatchedState) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setDispatchedState(true);
          onConfirmNow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onConfirmNow, dispatchedState]);

  const handleManualConfirm = () => {
    setDispatchedState(true);
    onConfirmNow();
  };

  const progressPercent = ((totalDuration - secondsLeft) / totalDuration) * 100;
  const emergencyPhone = alert.vehicle?.emergencyContactPhone || '+91 8757882039';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      {/* High-priority Emergency Modal */}
      <div className="bg-white rounded-3xl border-2 border-rose-500 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header & Alarm Sound Toggle */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/30">
              <AlertOctagon className="w-7 h-7 animate-bounce" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-rose-600">
                CRITICAL ACCIDENT DETECTED
              </span>
              <h2 className="text-xl font-black text-slate-950">30s Emergency Triage</h2>
            </div>
          </div>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            title={audioEnabled ? 'Mute Alarm Sound' : 'Enable Alarm Sound'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-rose-600 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {!dispatchedState ? (
          <>
            {/* Active Countdown Timer */}
            <div className="text-center space-y-2 py-1">
              <div className="text-6xl sm:text-7xl font-black text-rose-600 font-mono tracking-tight animate-pulse">
                00:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
              </div>
              <p className="text-sm font-bold text-slate-800">
                Are you okay? Respond before automatic emergency dispatch.
              </p>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-600 h-full transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Impact Details Box */}
            <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-rose-50/50 border border-rose-100 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Impact Jerk Force</span>
                <strong className="text-sm text-slate-900 font-mono font-extrabold">{alert.gForce ? alert.gForce.toFixed(2) : '4.85'}g</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Vehicle / Speed</span>
                <strong className="text-sm text-slate-900 font-mono font-extrabold">{alert.vehicle?.vehicleNumber || 'KA-01-SR-2026'} ({alert.impactSpeed || 65} km/h)</strong>
              </div>
              <div className="col-span-2 pt-2 border-t border-rose-100 flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  GPS: {alert.latitude ? alert.latitude.toFixed(4) : '28.6139'}° N, {alert.longitude ? alert.longitude.toFixed(4) : '77.2090'}° E
                </span>
                <span className="font-bold text-rose-600 text-[11px]">High Severity</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {/* Giant False Alarm Button */}
              <button
                onClick={onCancel}
                className="w-full py-4 px-6 rounded-2xl text-base font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
              >
                <CheckCircle2 className="w-6 h-6" />
                I'M SAFE — CANCEL FALSE ALARM
              </button>

              {/* Immediate Escalation Button */}
              <button
                onClick={handleManualConfirm}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                I Need Immediate Assistance (Call Ambulance & Police Now)
              </button>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center space-y-0.5">
              <p className="font-semibold text-slate-700">Automated Dispatch Protocol at 00:00:</p>
              <p>🚑 Ambulance (108) &bull; 🚓 Police PCR (112) &bull; 📞 Call & SMS to {emergencyPhone}</p>
            </div>
          </>
        ) : (
          /* Dispatched Confirmation Screen */
          <div className="space-y-4 py-2">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Emergency Dispatches Sent!</h3>
              <p className="text-xs text-slate-600">
                Responders and emergency contacts have been notified with live telemetry and medical passport.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              {/* Ambulance Call Item */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Ambulance className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-slate-900 block">Ambulance (EMS 108)</strong>
                    <span className="text-slate-500 text-[11px]">AIIMS Apex Trauma Center &bull; ETA 3.2m</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                  DISPATCHED
                </span>
              </div>

              {/* Police Call Item */}
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-slate-900 block">Police Control (PCR 112)</strong>
                    <span className="text-slate-500 text-[11px]">Collision location forwarded</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-900 font-bold text-[10px]">
                  NOTIFIED
                </span>
              </div>

              {/* Close Contacts Call Item */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-slate-900 block">Close Family & Contacts</strong>
                    <span className="text-slate-500 text-[11px]">Auto-calling {emergencyPhone} + SMS</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold text-[10px]">
                  DIALED
                </span>
              </div>
            </div>

            <button
              onClick={onCancel}
              className="w-full py-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center justify-center gap-1.5"
            >
              Close & View Live Incident Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

