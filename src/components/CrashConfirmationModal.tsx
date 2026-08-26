import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Radio, 
  ShieldAlert,
  Volume2
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

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onConfirmNow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onConfirmNow]);

  const progressPercent = ((totalDuration - secondsLeft) / totalDuration) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      {/* High-priority Emergency Card Container */}
      <div className="bg-white rounded-3xl border-2 border-rose-500 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 animate-emergency-pulse">
        {/* Header Alert Flag */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/30">
              <AlertOctagon className="w-7 h-7 animate-bounce" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-700">
                CRITICAL EMERGENCY EVENT
              </span>
              <h2 className="text-xl font-black text-slate-950">Accident Detected!</h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-bold text-slate-500">Auto-Escalation</span>
            <div className="text-xs text-rose-600 font-bold flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> Active
            </div>
          </div>
        </div>

        {/* Large Countdown Window */}
        <div className="text-center space-y-2 py-2">
          <div className="text-6xl sm:text-7xl font-black text-rose-600 font-mono tracking-tight">
            00:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
          </div>
          <p className="text-sm font-semibold text-slate-800">
            Are you okay? Respond before the timer expires.
          </p>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-rose-600 h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Sensor & Telemetry Summary */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block">Impact Magnitude</span>
            <strong className="text-base text-slate-900 font-mono font-extrabold">{alert.gForce.toFixed(2)}g</strong>
          </div>
          <div>
            <span className="text-slate-500 block">AI Probability</span>
            <strong className="text-base text-rose-600 font-mono font-extrabold">96% Collision</strong>
          </div>
          <div className="col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
            </span>
            <span className="font-mono text-[11px] text-slate-500">{alert.vehicle?.vehicleNumber}</span>
          </div>
        </div>

        {/* Primary False Alarm Cancellation Button (Huge & High-Contrast) */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onCancel}
            className="w-full py-4 px-6 rounded-2xl text-lg font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
          >
            <CheckCircle2 className="w-6 h-6" />
            I'M OK — CANCEL FALSE ALARM
          </button>

          <button
            onClick={onConfirmNow}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 transition-colors"
          >
            I Need Immediate Assistance (Send Alert Now)
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-500">
          If you do not press Cancel, emergency SMS with GPS coordinates and medical details will be dispatched immediately.
        </p>
      </div>
    </div>
  );
};
