import React, { useState } from 'react';
import { 
  Zap, 
  X, 
  Gauge, 
  Activity, 
  MapPin, 
  Sliders, 
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
  const [vehicleNumber, setVehicleNumber] = useState<string>(vehicles[0]?.vehicleNumber || 'KA-01-AI-2026');
  const [gForce, setGForce] = useState<number>(6.5);
  const [speed, setSpeed] = useState<number>(75);
  const [latitude, setLatitude] = useState<number>(28.6139);
  const [longitude, setLongitude] = useState<number>(77.2090);
  const [visionEvent, setVisionEvent] = useState<string>('DIRECT_COLLISION');
  const [notes, setNotes] = useState<string>('Simulated sensor spike triggered via Command Center UI.');
  const [sending, setSending] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Calculate predicted severity
  let predictedSeverity: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if ((gForce > 4.0 && speed > 30.0) || gForce > 6.0) {
    predictedSeverity = 'HIGH';
  } else if (gForce > 2.5) {
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
        latitude,
        longitude,
        impactDetected: gForce > 2.5,
        severity: predictedSeverity,
        visionEvent: visionEvent === 'NONE' ? undefined : visionEvent,
      });

      setSuccessMsg(`Telemetry dispatched successfully! Processed as ${predictedSeverity} severity.`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg text-white">Telemetry & Crash Ingestion Injector</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-4 text-xs">
          {/* Target Vehicle */}
          <div>
            <label className="text-slate-400 font-medium block mb-1">Target Vehicle Fleet Unit</label>
            <select
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-700 font-mono focus:outline-none focus:border-red-500"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.vehicleNumber}>
                  {v.vehicleNumber} — {v.owner} ({v.vehicleType})
                </option>
              ))}
            </select>
          </div>

          {/* G-Force Slider */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Impact G-Force (Threshold: &gt;2.5g Med, &gt;4.0g High)</span>
              <span className={`font-mono font-bold text-sm ${gForce > 4.0 ? 'text-red-400' : gForce > 2.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {gForce} g
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={12.0}
              step={0.1}
              value={gForce}
              onChange={(e) => setGForce(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>

          {/* Speed Slider */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Vehicle Impact Velocity</span>
              <span className="font-mono font-bold text-slate-200 text-sm">{speed} km/h</span>
            </div>
            <input
              type="range"
              min={0}
              max={160}
              step={1}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>

          {/* GPS Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-medium block mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-700 font-mono focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-slate-400 font-medium block mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-700 font-mono focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Vision Event Tag */}
          <div>
            <label className="text-slate-400 font-medium block mb-1">AI Vision Association</label>
            <select
              value={visionEvent}
              onChange={(e) => setVisionEvent(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-700 focus:outline-none focus:border-red-500"
            >
              <option value="DIRECT_COLLISION">DIRECT_COLLISION (Frontal/Quarter Impact)</option>
              <option value="POTHOLE_IMPACT">POTHOLE_IMPACT (Road Surface Hazard)</option>
              <option value="HELMET_MISSING">HELMET_MISSING (Safety Violation)</option>
              <option value="ROLLOVER">ROLLOVER (Acute Tilt Angle)</option>
              <option value="NONE">NONE (Pure Telemetry Sensor)</option>
            </select>
          </div>

          {/* Live Predicted Severity Card */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 font-medium">Auto-Calculated Triage Severity:</span>
            <span
              className={`font-mono font-bold px-2.5 py-1 rounded uppercase text-xs ${
                predictedSeverity === 'HIGH'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : predictedSeverity === 'MEDIUM'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {predictedSeverity} SEVERITY
            </span>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-lg text-center font-medium">
              {successMsg}
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-md shadow-red-600/30"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Injecting Telemetry...' : 'Dispatch Telemetry Stream'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
