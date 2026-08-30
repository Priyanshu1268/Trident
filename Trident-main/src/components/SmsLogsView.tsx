import React from 'react';
import { 
  MessageSquareText, 
  Send, 
  CheckCheck, 
  Phone, 
  MapPin, 
  Radio
} from 'lucide-react';
import { EmergencySmsLog } from '../types';

interface SmsLogsViewProps {
  logs: EmergencySmsLog[];
}

export const SmsLogsView: React.FC<SmsLogsViewProps> = ({ logs }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Emergency SMS & GSM Cellular Dispatch Logs</h1>
          <p className="text-sm text-slate-500">
            Real-time delivery transcripts of automated SMS alerts sent via SIM800L modem & Twilio Cloud Gateway.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCheck className="w-3.5 h-3.5" />
            GSM Modem Ready (SIM800L)
          </span>
        </div>
      </div>

      {/* Logs Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
          <span>Active Transmission History ({logs.length})</span>
          <span className="text-slate-500 font-mono">Carrier: Airtel 2G/GSM</span>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No SMS dispatches in current session. Trigger a simulation or test accident event to generate real-time dispatch logs.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="p-5 hover:bg-slate-50/80 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{log.recipient}</span>
                        {log.recipientName && (
                          <span className="text-xs text-slate-500 font-medium">({log.recipientName})</span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.severity === 'CRITICAL' || log.severity === 'HIGH'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {log.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Vehicle: {log.vehicleNumber} &bull; {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {log.status}
                    </span>
                  </div>
                </div>

                {/* Message Body */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {log.message}
                </div>

                {/* AT Command meta */}
                {log.atCommand && (
                  <div className="text-[11px] text-slate-400 font-mono">
                    Modem AT Command: <span className="text-slate-600">{log.atCommand}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
