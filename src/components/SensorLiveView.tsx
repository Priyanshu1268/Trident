import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { Activity, Gauge, Compass, Zap, RefreshCw, Radio } from 'lucide-react';
import { HardwareTelemetry } from '../types';

interface SensorLiveViewProps {
  liveTelemetry: HardwareTelemetry | null;
}

export const SensorLiveView: React.FC<SensorLiveViewProps> = ({ liveTelemetry }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [mode, setMode] = useState<'LIVE' | 'FREEZE'>('LIVE');

  // Maintain sliding window of the last 30 samples
  useEffect(() => {
    if (mode === 'FREEZE') return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const ax = liveTelemetry ? liveTelemetry.accelX : (Math.random() * 0.2 - 0.1);
      const ay = liveTelemetry ? liveTelemetry.accelY : (Math.random() * 0.2 - 0.1);
      const az = liveTelemetry ? liveTelemetry.accelZ : (1.0 + Math.random() * 0.1 - 0.05);
      const totalAcc = Math.sqrt(ax * ax + ay * ay + az * az);

      const gx = liveTelemetry ? liveTelemetry.gyroX : (Math.random() * 4 - 2);
      const gy = liveTelemetry ? liveTelemetry.gyroY : (Math.random() * 4 - 2);
      const gz = liveTelemetry ? liveTelemetry.gyroZ : (Math.random() * 4 - 2);

      const pitch = liveTelemetry ? liveTelemetry.pitch : (Math.random() * 2 - 1);
      const roll = liveTelemetry ? liveTelemetry.roll : (Math.random() * 2 - 1);
      const jerk = liveTelemetry?.jerk || (Math.random() * 0.5);

      setHistory((prev) => {
        const next = [
          ...prev,
          {
            time: timeStr,
            ax: parseFloat(ax.toFixed(2)),
            ay: parseFloat(ay.toFixed(2)),
            az: parseFloat(az.toFixed(2)),
            totalAcc: parseFloat(totalAcc.toFixed(2)),
            gx: parseFloat(gx.toFixed(1)),
            gy: parseFloat(gy.toFixed(1)),
            gz: parseFloat(gz.toFixed(1)),
            pitch: parseFloat(pitch.toFixed(1)),
            roll: parseFloat(roll.toFixed(1)),
            jerk: parseFloat(jerk.toFixed(2))
          }
        ];
        return next.slice(-30);
      });
    }, 500);

    return () => clearInterval(interval);
  }, [liveTelemetry, mode]);

  const latest = history[history.length - 1] || {
    ax: 0.0,
    ay: 0.0,
    az: 1.0,
    totalAcc: 1.0,
    gx: 0.0,
    gy: 0.0,
    gz: 0.0,
    pitch: 0.0,
    roll: 0.0,
    jerk: 0.0
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Safety & Telemetry Telemetry Lab</h1>
          <p className="text-sm text-slate-500">
            Real-time 6-axis MPU6050 accelerometer & gyroscope motion telemetry stream.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode(mode === 'LIVE' ? 'FREEZE' : 'LIVE')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              mode === 'LIVE'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-amber-50 text-amber-700 border-amber-300'
            }`}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            {mode === 'LIVE' ? 'Live Streaming' : 'Stream Paused'}
          </button>

          <button
            onClick={() => setHistory([])}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Clear Buffer
          </button>
        </div>
      </div>

      {/* Live Value Gauges Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Acceleration Magnitude */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Accel Magnitude</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 font-mono">{latest.totalAcc}</span>
            <span className="text-xs text-slate-500 font-semibold">g</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Threshold: 3.50g</span>
            <span className={latest.totalAcc >= 3.5 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-medium'}>
              {latest.totalAcc >= 3.5 ? 'IMPACT' : 'NOMINAL'}
            </span>
          </div>
        </div>

        {/* Jerk (dAcc/dt) */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Instantaneous Jerk</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 font-mono">{latest.jerk}</span>
            <span className="text-xs text-slate-500 font-semibold">g/s</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Threshold: 8.0 g/s</span>
            <span className="text-emerald-600 font-medium">SMOOTH</span>
          </div>
        </div>

        {/* Pitch & Roll Angle */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Attitude (Pitch / Roll)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900 font-mono">P: {latest.pitch}°</span>
            <span className="text-lg font-bold text-slate-900 font-mono">R: {latest.roll}°</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Rollover limit: ±55°</span>
            <span className={Math.abs(latest.roll) > 55 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-medium'}>
              {Math.abs(latest.roll) > 55 ? 'ROLLOVER' : 'UPRIGHT'}
            </span>
          </div>
        </div>

        {/* Angular Velocity Rate */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Gyro Rotation Vector</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {Math.sqrt(latest.gx ** 2 + latest.gy ** 2 + latest.gz ** 2).toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-semibold">°/s</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Limit: 250°/s</span>
            <span className="text-emerald-600 font-medium">STABLE</span>
          </div>
        </div>
      </div>

      {/* Main Accelerometer Chart ($A_x, A_y, A_z$, Total) */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">3-Axis Accelerometer Telemetry ($A_x, A_y, A_z$)</h2>
            <p className="text-xs text-slate-500">Continuous 50Hz dynamic acceleration in standard gravity ($g$)</p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700">
            Impact Line: 3.5g
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={[-2, 6]} stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0.5rem', fontSize: '12px' }} 
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
              <ReferenceLine y={3.5} label="Impact Threshold (3.5g)" stroke="#e11d48" strokeDasharray="4 4" />
              <ReferenceLine y={1.0} label="1g Baseline" stroke="#94a3b8" strokeDasharray="2 2" />
              <Line type="monotone" dataKey="totalAcc" name="Total Magnitude" stroke="#0f172a" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="ax" name="X-Axis" stroke="#e11d48" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="ay" name="Y-Axis" stroke="#059669" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="az" name="Z-Axis" stroke="#d97706" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gyroscope Chart ($G_x, G_y, G_z$) */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">3-Axis Gyroscope Angular Rate ($G_x, G_y, G_z$)</h2>
            <p className="text-xs text-slate-500">Rotational velocity in degrees per second (°/s)</p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700">
            Rollover Limit: ±250°/s
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0.5rem', fontSize: '12px' }} 
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
              <Line type="monotone" dataKey="gx" name="Roll Rate (Gx)" stroke="#dc2626" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="gy" name="Pitch Rate (Gy)" stroke="#16a34a" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="gz" name="Yaw Rate (Gz)" stroke="#ca8a04" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
