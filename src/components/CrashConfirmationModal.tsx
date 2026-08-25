import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, 
  ShieldCheck, 
  PhoneCall, 
  Flame, 
  Volume2, 
  VolumeX, 
  Ambulance, 
  ShieldAlert, 
  MapPin, 
  Activity,
  ArrowRight
} from 'lucide-react';
import { CrashAlert } from '../types';

interface CrashConfirmationModalProps {
  alert: CrashAlert;
  totalSeconds?: number;
  onCancelSafe: (alertId: number, reason: string) => Promise<void>;
  onExpireEscalate: (alertId: number) => Promise<void>;
}

export const CrashConfirmationModal: React.FC<CrashConfirmationModalProps> = ({
  alert,
  totalSeconds = 20,
  onCancelSafe,
  onExpireEscalate,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalSeconds);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [customReason, setCustomReason] = useState<string>('Driver confirmed safe - Minor road bump / phone dropped');

  // Simulated audible beep
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let osc: OscillatorNode | null = null;

    if (soundEnabled && secondsRemaining > 0) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
          const playBeep = () => {
            if (!audioCtx) return;
            const now = audioCtx.currentTime;
            osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(880, now); // A5 alert tone
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
          };
          playBeep();
        }
      } catch (e) {
        // AudioContext may be blocked before interaction
      }
    }

    return () => {
      if (audioCtx) {
        try {
          audioCtx.close();
        } catch {}
      }
    };
  }, [secondsRemaining, soundEnabled]);

  // Countdown timer effect
  useEffect(() => {
    if (secondsRemaining <= 0) {
      onExpireEscalate(alert.id);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, alert.id, onExpireEscalate]);

  const handleSafeClick = async () => {
    setCancelling(true);
    try {
      await onCancelSafe(alert.id, customReason);
    } finally {
      setCancelling(false);
    }
  };

  const handleImmediateEscalate = async () => {
    await onExpireEscalate(alert.id);
  };

  const progressPercent = Math.max(0, (secondsRemaining / totalSeconds) * 100);
  const driverName = alert.vehicle.owner || alert.vehicle.driver?.name || 'Registered Driver';
  const emergencyPhone = alert.vehicle.emergencyContactPhone || '+918757882039';

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-red-500 rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl shadow-red-900/50 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Pulsing Alert Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-red-600/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="flex items-center justify-between relative z-10 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <AlertOctagon className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 block">
                ESP32 &bull; MPU6050 CRASH DETECTED
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">
                Accident Confirmation Countdown
              </h2>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
            title={soundEnabled ? 'Mute Alert Siren' : 'Enable Alert Siren'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-red-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Circular Countdown Display */}
        <div className="flex flex-col items-center justify-center py-2 relative z-10">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-red-500 transition-all duration-1000 ease-linear"
                strokeWidth="8"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black text-white font-mono tracking-tighter">
                {secondsRemaining}s
              </span>
              <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">
                Until SOS Call
              </span>
            </div>
          </div>

          <p className="text-xs text-center text-slate-300 max-w-sm mt-3 leading-relaxed">
            Are you okay, <strong className="text-white">{driverName}</strong>? Tap the button below if this was a false alarm or minor bump.
          </p>
        </div>

        {/* Telemetry Snapshot Cards */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs relative z-10 font-mono">
          <div className="text-center">
            <span className="text-[10px] text-slate-500 block uppercase">G-Force</span>
            <span className="text-sm font-bold text-red-400">{alert.gForce}g</span>
          </div>
          <div className="text-center border-x border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Impact Speed</span>
            <span className="text-sm font-bold text-slate-200">{alert.impactSpeed} km/h</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-500 block uppercase">Vehicle</span>
            <span className="text-sm font-bold text-slate-200">{alert.vehicle.vehicleNumber}</span>
          </div>
        </div>

        {/* Escalation Sequence Pipeline */}
        <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-3.5 space-y-2 text-xs relative z-10">
          <div className="flex items-center justify-between text-red-300 font-semibold text-[11px]">
            <span className="flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-red-400" />
              Automated Escalation if Timer Expires:
            </span>
            <span className="font-mono text-[10px] text-red-400">SIM800L &bull; ATD</span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 rounded-full bg-red-600/30 text-red-300 flex items-center justify-center font-bold text-[9px]">1</span>
              <span>Call Favorite ICE Contact: <strong className="text-slate-200 font-mono">{emergencyPhone}</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 rounded-full bg-red-600/30 text-red-300 flex items-center justify-center font-bold text-[9px]">2</span>
              <span>Call Police Control Room: <strong className="text-slate-200 font-mono">112 / PCR</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 rounded-full bg-red-600/30 text-red-300 flex items-center justify-center font-bold text-[9px]">3</span>
              <span>Call & Dispatch Trauma Ambulance: <strong className="text-slate-200 font-mono">108 Emergency</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 rounded-full bg-red-600/30 text-red-300 flex items-center justify-center font-bold text-[9px]">4</span>
              <span>Send Cellular SMS with GPS coordinates & Driver Medical Passport</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 relative z-10 pt-1">
          <button
            id="btn-cancel-safe"
            onClick={handleSafeClick}
            disabled={cancelling}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-sm tracking-wide transition shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>{cancelling ? 'Disarming Alarm...' : "I AM OK / FALSE ALARM"}</span>
          </button>

          <button
            id="btn-immediate-sos"
            onClick={handleImmediateEscalate}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-400 text-xs font-semibold transition border border-slate-700 flex items-center justify-center space-x-1.5"
          >
            <Ambulance className="w-3.5 h-3.5 text-red-400" />
            <span>Need Help Immediately? Escalate Right Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
