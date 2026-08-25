import React from 'react';
import { 
  MessageSquareText, 
  Send, 
  CheckCheck, 
  Clock, 
  Phone, 
  MapPin, 
  Flame, 
  ShieldAlert 
} from 'lucide-react';
import { EmergencySmsLog } from '../types';

interface SmsLogsViewProps {
  logs: EmergencySmsLog[];
}

export const SmsLogsView: React.FC<SmsLogsViewProps> = ({ logs }) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center space-x-2">
          <MessageSquareText className="w-5 h-5 text-red-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">Emergency SMS & Cellular Broadcast Logs</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Ported from <code className="text-red-400 font-mono">SmsService.java</code> — automated SMS alerts dispatched to driver emergency contacts, including medical conditions and GPS coordinates.
        </p>
      </div>

      {/* Logs List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>REAL-TIME DISPATCH LOGS ({logs.length})</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <CheckCheck className="w-3.5 h-3.5" /> SMS GATEWAY OPERATIONAL
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No emergency SMS messages dispatched yet. Trigger a high severity crash to simulate automated SMS.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {logs.map((log) => {
              const isHigh = log.severity === 'HIGH';

              return (
                <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-800/30 transition space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-800 text-red-400 shrink-0">
                        <Send className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-200 text-sm">{log.recipient}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              isHigh ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {log.severity} SEVERITY
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">ID: {log.id}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-semibold border border-emerald-900 text-[10px]">
                        {log.status}
                      </span>
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 text-xs text-slate-200 font-mono leading-relaxed">
                    {log.message}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <MapPin className="w-3 h-3 text-red-400" />
                      Coordinates: {log.coordinates.lat.toFixed(4)}, {log.coordinates.lng.toFixed(4)}
                    </span>
                    <span className="text-slate-500">Vehicle: {log.vehicleNumber}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
