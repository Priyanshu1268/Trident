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
  User,
  Clock,
  Mic,
  Activity,
  PhoneForwarded
} from 'lucide-react';
import { CrashAlert } from '../types';

interface CrashConfirmationModalProps {
  alert: CrashAlert;
  onCancel: () => void;
  onConfirmNow: () => void;
  onViewLogs?: () => void;
}

export const CrashConfirmationModal: React.FC<CrashConfirmationModalProps> = ({
  alert,
  onCancel,
  onConfirmNow,
  onViewLogs
}) => {
  const [totalDuration, setTotalDuration] = useState<number>(alert.confirmationCountdown || 30);
  const [secondsLeft, setSecondsLeft] = useState<number>(alert.confirmationCountdown || 30);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [dispatchedState, setDispatchedState] = useState<boolean>(false);
  const [activeCallStep, setActiveCallStep] = useState<number>(1);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play synthesized emergency beeps while counting down
  useEffect(() => {
    if (!audioEnabled || dispatchedState) return;

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
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(800, audioCtxRef.current.currentTime);
          osc.frequency.exponentialRampToValueAtTime(400, audioCtxRef.current.currentTime + 0.15);
          gain.gain.setValueAtTime(0.12, audioCtxRef.current.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.15);
          osc.connect(gain);
          gain.connect(audioCtxRef.current.destination);
          osc.start();
          osc.stop(audioCtxRef.current.currentTime + 0.18);
        }
      } catch (e) {
        // silent fallback
      }
    };

    const intervalId = setInterval(playBeep, 1000);
    return () => {
      clearInterval(intervalId);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [audioEnabled, dispatchedState]);

  // Voice announcement helper
  const triggerVoiceSOS = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(
          "Emergency protocol triggered! Accident detected. Dialing Ambulance 108, Police Control 112, and emergency contacts."
        );
        utterance.rate = 1.0;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        // fallback
      }
    }
  };

  // Trigger genuine device dialing & voice synthesizer
  const triggerEmergencyDialing = () => {
    // 1. Voice Announcement
    triggerVoiceSOS();

    // 2. Trigger native device auto-dialer (tel protocol link)
    try {
      const dialNumber = alert.vehicle?.emergencyContactPhone || '+918757882039';
      const cleanNumber = dialNumber.replace(/[^0-9+]/g, '');
      const telUri = `tel:${cleanNumber}`;
      
      // Create and trigger an invisible anchor for broad browser compatibility
      const a = document.createElement('a');
      a.href = telUri;
      a.target = '_self';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.warn('Native tel URI trigger failed or restricted in iframe:', e);
    }
  };

  // Reliable Countdown Effect
  useEffect(() => {
    if (dispatchedState) return;

    if (secondsLeft <= 0) {
      setDispatchedState(true);
      triggerEmergencyDialing();
      onConfirmNow();
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsLeft, dispatchedState, onConfirmNow]);

  // Calling sequence steps animation after dispatch
  useEffect(() => {
    if (!dispatchedState) return;
    const t1 = setTimeout(() => setActiveCallStep(2), 1500);
    const t2 = setTimeout(() => setActiveCallStep(3), 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [dispatchedState]);

  const handleManualConfirm = () => {
    setSecondsLeft(0);
    setDispatchedState(true);
    triggerEmergencyDialing();
    onConfirmNow();
  };

  const handleQuickDuration = (secs: number) => {
    setTotalDuration(secs);
    setSecondsLeft(secs);
  };

  const progressPercent = Math.min(100, Math.max(0, ((totalDuration - secondsLeft) / totalDuration) * 100));
  const emergencyPhone = alert.vehicle?.emergencyContactPhone || '+91 8757882039';
  const driverName = alert.vehicle?.owner || 'Primary Rider';
  const bloodGroup = alert.vehicle?.driver?.bloodGroup || 'O+';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      {/* High-priority Emergency Modal */}
      <div className="bg-white rounded-3xl border-2 border-rose-500 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header & Audio Sound Toggle */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/30">
              <AlertOctagon className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block" />
                CRITICAL ACCIDENT DETECTED
              </span>
              <h2 className="text-lg font-black text-slate-950">30s Emergency Triage Protocol</h2>
            </div>
          </div>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
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
                Are you okay? Respond before automatic emergency calls are dialed.
              </p>
              
              {/* Animated Progress bar */}
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div 
                  className="bg-gradient-to-r from-rose-500 to-rose-600 h-full transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Quick Duration Chips for Testing */}
              <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-slate-500">
                <span>Speed up test:</span>
                <button
                  onClick={() => handleQuickDuration(5)}
                  className={`px-2 py-0.5 rounded-md font-bold transition ${secondsLeft === 5 && totalDuration === 5 ? 'bg-rose-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                  ⚡ 5s Quick
                </button>
                <button
                  onClick={() => handleQuickDuration(10)}
                  className={`px-2 py-0.5 rounded-md font-bold transition ${secondsLeft === 10 && totalDuration === 10 ? 'bg-rose-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                  10s
                </button>
                <button
                  onClick={() => handleQuickDuration(30)}
                  className={`px-2 py-0.5 rounded-md font-bold transition ${secondsLeft === 30 && totalDuration === 30 ? 'bg-rose-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                  30s Normal
                </button>
              </div>
            </div>

            {/* Impact Details Box */}
            <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Impact Jerk Magnitude</span>
                <strong className="text-sm text-slate-950 font-mono font-black">{alert.gForce ? alert.gForce.toFixed(2) : '5.20'}g</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Speed / Vehicle</span>
                <strong className="text-sm text-slate-950 font-mono font-black">{alert.vehicle?.vehicleNumber || 'KA-01-SR-2026'} ({alert.impactSpeed || 68} km/h)</strong>
              </div>
              <div className="col-span-2 pt-2 border-t border-rose-200/80 flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  GPS: {alert.latitude ? alert.latitude.toFixed(4) : '28.6139'}° N, {alert.longitude ? alert.longitude.toFixed(4) : '77.2090'}° E
                </span>
                <span className="font-bold text-rose-700 text-[11px]">HIGH IMPACT</span>
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
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                I Need Immediate Assistance (Trigger Emergency Calls Now)
              </button>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center space-y-0.5">
              <p className="font-bold text-slate-700">Automated Protocol at 00:00:</p>
              <p>🚑 Auto-dial Ambulance 108 &bull; 🚓 Police PCR 112 &bull; 📞 Call & SMS to {emergencyPhone}</p>
            </div>
          </>
        ) : (
          /* Dispatched Confirmation Screen (Live Calling HUD) */
          <div className="space-y-4 py-1">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <PhoneForwarded className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Emergency Dispatches & Calls Active!</h3>
              <p className="text-xs text-slate-600">
                Driver unresponsive after 30s. Auto-dialed emergency responders and sent SMS with GPS & Medical Passport ({bloodGroup}).
              </p>
            </div>

            {/* Live 3-Tier Call & Dispatch Cards with Direct 1-Click Tap-to-Dial */}
            <div className="space-y-2 text-xs">
              {/* Call Tier 1: Family Member */}
              <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                    <PhoneCall className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <strong className="text-white block font-bold">1. Auto-Dialing ICE ({driverName})</strong>
                    <span className="text-slate-300 text-[11px] font-mono">{emergencyPhone} &bull; Live GPS SMS</span>
                  </div>
                </div>
                <a
                  href={`tel:${emergencyPhone.replace(/[^0-9+]/g, '')}`}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition shadow-sm cursor-pointer"
                >
                  <Phone className="w-3 h-3" />
                  Dial Now
                </a>
              </div>

              {/* Call Tier 2: Ambulance 108 */}
              <div className={`p-3 rounded-xl border transition-all ${activeCallStep >= 2 ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                      <Ambulance className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-slate-900 block font-bold">2. Ambulance (EMS 108)</strong>
                      <span className="text-slate-600 text-[11px]">AIIMS Apex Trauma Center &bull; ETA 3.2 min</span>
                    </div>
                  </div>
                  <a
                    href="tel:108"
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-sm cursor-pointer"
                  >
                    <Phone className="w-3 h-3" />
                    Call 108
                  </a>
                </div>
              </div>

              {/* Call Tier 3: Police PCR 112 */}
              <div className={`p-3 rounded-xl border transition-all ${activeCallStep >= 3 ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-slate-900 block font-bold">3. Police Control (PCR 112)</strong>
                      <span className="text-slate-600 text-[11px]">Accident coordinates & speed relayed</span>
                    </div>
                  </div>
                  <a
                    href="tel:112"
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-sm cursor-pointer"
                  >
                    <Phone className="w-3 h-3" />
                    Call 112
                  </a>
                </div>
              </div>
            </div>

            {/* Modal Bottom Buttons */}
            <div className="space-y-2 pt-1">
              {onViewLogs && (
                <button
                  onClick={() => {
                    onCancel();
                    onViewLogs();
                  }}
                  className="w-full py-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  View Outgoing Calls & Cellular SMS Logs
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={onCancel}
                className="w-full py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


