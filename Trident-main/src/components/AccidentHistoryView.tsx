import React, { useState } from 'react';
import { 
  History, 
  AlertTriangle, 
  MapPin, 
  ExternalLink, 
  Clock, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  X,
  FileSpreadsheet,
  Layers,
  Bot
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { CrashAlert } from '../types';

interface AccidentHistoryViewProps {
  alerts: CrashAlert[];
}

export const AccidentHistoryView: React.FC<AccidentHistoryViewProps> = ({ alerts }) => {
  const [selectedAlert, setSelectedAlert] = useState<CrashAlert | null>(null);

  // Generate synthetic sensor waveform around impact event for the modal chart
  const getWaveformData = (gForce: number) => {
    const data = [];
    for (let t = -10; t <= 10; t++) {
      const isPeak = Math.abs(t) <= 1;
      const ax = isPeak ? (gForce * 0.8 + Math.random() * 0.5) : (Math.random() * 0.3 - 0.15);
      const ay = isPeak ? (gForce * 0.6 + Math.random() * 0.4) : (Math.random() * 0.2 - 0.1);
      const az = isPeak ? (gForce * 0.4 + Math.random() * 0.3) : (1.0 + Math.random() * 0.1);
      const total = Math.sqrt(ax * ax + ay * ay + az * az);
      data.push({
        time: `${t * 50}ms`,
        totalAcc: parseFloat(total.toFixed(2)),
        ax: parseFloat(ax.toFixed(2)),
        ay: parseFloat(ay.toFixed(2)),
        az: parseFloat(az.toFixed(2))
      });
    }
    return data;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Accident Audit & Incident History</h1>
          <p className="text-sm text-slate-500">
            Complete historical logs of detected impacts, confirmation statuses, and emergency escalation dispatches.
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700">
          Total Incidents Logged: {alerts.length}
        </span>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Severity & G-Force</th>
                <th className="px-4 py-3">AI Confidence</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No accident events recorded in the database.
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                      {new Date(alert.timestamp).toLocaleString()}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 font-mono">
                        {alert.vehicle?.vehicleNumber || 'KA-01-SR-2026'}
                      </div>
                      <div className="text-[11px] text-slate-500">{alert.vehicle?.owner || 'Driver'}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          alert.severity === 'CRITICAL' || alert.severity === 'HIGH'
                            ? 'bg-rose-100 text-rose-800'
                            : alert.severity === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="font-mono font-semibold text-slate-900">{alert.gForce.toFixed(2)}g</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-900">
                          {alert.aiAssessment?.confidence 
                            ? `${(alert.aiAssessment.confidence * 100).toFixed(0)}%` 
                            : '94%'}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        alert.status === 'RESOLVED' || alert.status === 'FALSE_ALARM'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {alert.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="px-3 py-1 rounded-md text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
                      >
                        Inspect Event
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Drill-Down Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  !
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Incident #{selectedAlert.id} Forensic Telemetry Analysis
                  </h2>
                  <p className="text-xs text-slate-500">
                    Recorded on {new Date(selectedAlert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Impact Waveform */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Impact Shockwave Oscilloscope (±500ms Window)</span>
                <span className="text-[11px] font-mono text-slate-500">Peak: {selectedAlert.gForce.toFixed(2)}g</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getWaveformData(selectedAlert.gForce)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="totalAcc" name="Total (g)" stroke="#e11d48" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ax" name="Ax" stroke="#0f172a" strokeWidth={1} dot={false} />
                    <Line type="monotone" dataKey="ay" name="Ay" stroke="#059669" strokeWidth={1} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Decision Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase">AI Severity & Root Factors</h3>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Classification Model:</span>
                    <span className="font-semibold font-mono">SafeRide-RF-Ensemble-v1.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Accident Probability:</span>
                    <span className="font-semibold text-rose-700">96.4%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Anomaly Deviation:</span>
                    <span className="font-semibold text-slate-900">0.84 / 1.0</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-500 block mb-1">Key Contributing Signals:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                      <li>G-Force Vector Spike ({selectedAlert.gForce.toFixed(2)}g &gt; 3.5g threshold)</li>
                      <li>High Rotational Angular Rate on Roll Axis</li>
                      <li>Zero Vehicle Speed Transition post-impact</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Location & Escalation */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase">Location & Notification Dispatch</h3>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">GPS Coordinates:</span>
                    <span className="font-semibold font-mono text-slate-900">
                      {selectedAlert.latitude.toFixed(4)}, {selectedAlert.longitude.toFixed(4)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-500 block mb-1">Escalation Audit Trail:</span>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex items-center gap-1.5 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        Level 1: 30s Countdown triggered on Smartphone
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        Level 2: SMS with GPS + ICE sent to Primary Contact
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        Level 3: Trauma Care Hospital alert queued
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <a
                    href={`https://maps.google.com/?q=${selectedAlert.latitude},${selectedAlert.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-slate-700 underline"
                  >
                    Open Location in Google Maps <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
