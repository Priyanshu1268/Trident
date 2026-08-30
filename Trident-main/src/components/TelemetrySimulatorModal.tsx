import React, { useState } from 'react';
import { 
  Zap, 
  X, 
  MapPin, 
  Send, 
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import { Vehicle, TelemetryRequest } from '../types';

interface TelemetrySimulatorModalProps {
  vehicles: Vehicle[];
  onClose: () => void;
  onSendTelemetry: (data: TelemetryRequest) => Promise<any>;
}

export const TelemetrySimulatorModal: React.FC<TelemetrySimulatorModalProps> = ({
  vehicles,
  onClose,
  onSendTelemetry,
}) => {
  const [vehicleNumber, setVehicleNumber] = useState<string>(vehicles[0]?.vehicleNumber || 'KA-01-SR-2026');
  const [gForce, setGForce] = useState<number>(4.85);
  const [speed, setSpeed] = useState<number>(65);
  const [pitch, setPitch] = useState<number>(18);
  const [roll, setRoll] = useState<number>(62);
  const [latitude, setLatitude] = useState<number>(28.6139);
  const [longitude, setLongitude] = useState<number>(77.2090);
  const [sending, setSending] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Calculated predicted severity
  let predictedSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (gForce >= 5.0 || (gForce >= 3.5 && Math.abs(roll) >= 50)) {
    predictedSeverity = 'CRITICAL';
  } else if (gForce >= 3.5) {
    predictedSeverity = 'HIGH';
  } else if (gForce >= 2.2) {
    predictedSeverity = 'MEDIUM';
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSuccessMsg(null);

    try {
      await onSendTelemetry({
        vehicleNumber,
        gForce,
        impactSpeed: speed,
        speed,
        pitch,
        roll,
        latitude,
        longitude,
        impactDetected: gForce > 2.5 || Math.abs(roll) > 50,
        severity: predictedSeverity,
      });

      setSuccessMsg(`Simulated ${gForce}g impact broadcasted!`);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Telemetry Impact Injector</h2>
              <p className="text-xs text-slate-500">Inject calibrated test telemetry into the multi-layer pipeline.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Scenario Buttons */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Quick Test Scenarios</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => { setGForce(1.1); setPitch(2); setRoll(1); setSpeed(45); }}
              className="p-2 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 text-left"
            >
              🟢 Normal Cruise
              <span className="block text-[10px] text-slate-400 font-normal">1.1g (Safe)</span>
            </button>
            <button
              type="button"
              onClick={() => { setGForce(2.4); setPitch(6); setRoll(4); setSpeed(50); }}
              className="p-2 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 text-left"
            >
              🟡 Pothole Bump
              <span className="block text-[10px] text-slate-400 font-normal">2.4g (Low)</span>
            </button>
            <button
              type="button"
              onClick={() => { setGForce(5.2); setPitch(24); setRoll(68); setSpeed(70); }}
              className="p-2 rounded-lg border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-900 text-left"
            >
              💥 Severe Rollover
              <span className="block text-[10px] text-rose-600 font-normal">5.2g + 68° Tilt</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Impact Acceleration (G-Force)</span>
              <span className="font-mono font-bold text-slate-900">{gForce.toFixed(2)}g</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="10.0"
              step="0.1"
              value={gForce}
              onChange={(e) => setGForce(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tilt Roll Angle (°)</label>
              <input
                type="number"
                value={roll}
                onChange={(e) => setRoll(parseFloat(e.target.value))}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pre-Impact Speed (km/h)</label>
              <input
                type="number"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Severity Badge */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Pipeline Predicted Severity:</span>
            <span className={`px-2 py-0.5 rounded font-bold ${
              predictedSeverity === 'CRITICAL' || predictedSeverity === 'HIGH'
                ? 'bg-rose-100 text-rose-800'
                : predictedSeverity === 'MEDIUM'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {predictedSeverity}
            </span>
          </div>

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold">
              ✓ {successMsg}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? 'Injecting...' : 'Inject Telemetry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
