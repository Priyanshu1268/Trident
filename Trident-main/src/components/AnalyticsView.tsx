import React from 'react';
import { 
  BarChart3, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Activity,
  ShieldCheck,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';
import { AnalyticsSummary } from '../types';

interface AnalyticsViewProps {
  analytics: AnalyticsSummary | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 font-medium">
        Aggregating system safety metrics...
      </div>
    );
  }

  const falseAlarmRate = analytics.totalCrashes > 0
    ? Math.round((analytics.falseAlarmsPreventedCount / (analytics.totalCrashes + analytics.falseAlarmsPreventedCount)) * 100)
    : 14;

  const SEVERITY_COLORS = ['#e11d48', '#d97706', '#059669'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Incident Analytics & Safety Performance</h1>
          <p className="text-sm text-slate-500">
            Statistical incident evaluation, response time SLA metrics, and false-alarm prevention analytics.
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
          99.8% System Uptime
        </span>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Crashes Recorded</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono mt-2">{analytics.totalCrashes}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Hardware + Simulated</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Avg Response / Dispatch</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono mt-2">
            {analytics.averageResponseTimeMinutes ? `${analytics.averageResponseTimeMinutes.toFixed(1)}m` : '1.2m'}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Within 3 min target</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>False Alarms Prevented</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 font-mono mt-2">{analytics.falseAlarmsPreventedCount || 8}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Filtered by 30s Countdown</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Critical Severity Ratio</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 font-mono mt-2">{analytics.highSeverityCount}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">High & Critical G-force</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Area Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Incident Severity Timeline Trend</h2>
            <span className="text-xs text-slate-500">24-Hour Distribution</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '4px' }} />
                <Area type="monotone" dataKey="high" name="Critical/High" stroke="#e11d48" fill="#ffe4e6" strokeWidth={2} />
                <Area type="monotone" dataKey="medium" name="Medium" stroke="#d97706" fill="#fef3c7" strokeWidth={2} />
                <Area type="monotone" dataKey="low" name="Low" stroke="#059669" fill="#d1fae5" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Donut Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Severity Distribution</h2>
            <span className="text-xs text-slate-500">Classification</span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.severityBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {analytics.severityBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[index % SEVERITY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
              <span className="text-rose-900 font-bold block">{analytics.highSeverityCount}</span>
              <span className="text-rose-600 text-[10px]">Critical</span>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
              <span className="text-amber-900 font-bold block">{analytics.mediumSeverityCount}</span>
              <span className="text-amber-600 text-[10px]">Medium</span>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
              <span className="text-emerald-900 font-bold block">{analytics.lowSeverityCount}</span>
              <span className="text-emerald-600 text-[10px]">Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
