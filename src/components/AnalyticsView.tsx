import React from 'react';
import { 
  BarChart3, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Ambulance, 
  TrendingUp,
  Activity
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
  Cell 
} from 'recharts';
import { AnalyticsSummary } from '../types';

interface AnalyticsViewProps {
  analytics: AnalyticsSummary | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 font-mono">
        Aggregating system telemetry data...
      </div>
    );
  }

  const dispatchRate = analytics.totalCrashes > 0
    ? Math.round(((analytics.dispatchedCount + analytics.hospitalNotifiedCount) / analytics.totalCrashes) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-red-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">System Emergency Analytics & Crash Metrics</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Ported from <code className="text-red-400 font-mono">AnalyticsController.java</code> — aggregate incident stats, response time SLA, and severity distributions.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Crashes Recorded</span>
            <Activity className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-mono">{analytics.totalCrashes}</p>
          <p className="text-[11px] text-slate-400 mt-1">Across all registered fleet vehicles</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-red-400 font-medium">
            <span>High Severity Crashes</span>
            <Flame className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-red-400 mt-2 font-mono">{analytics.highSeverityCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">G-Force &gt; 4.0g or high velocity</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-amber-400 font-medium">
            <span>Avg Response Time</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-2 font-mono">
            {analytics.averageResponseTimeMinutes} <span className="text-base font-normal text-slate-400">min</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">From impact to responder dispatch</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>Auto-Dispatch SLA</span>
            <Ambulance className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2 font-mono">{dispatchRate}%</p>
          <p className="text-[11px] text-slate-400 mt-1">{analytics.resolvedCount} incidents resolved</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Incident Timeline Area Chart */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">24-Hour Incident Timeline</h3>
              <p className="text-xs text-slate-400">Incident severity breakdown by time of day</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> High
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="high" stroke="#ef4444" fillOpacity={1} fill="url(#colorHigh)" />
                <Area type="monotone" dataKey="medium" stroke="#f59e0b" fillOpacity={1} fill="url(#colorMed)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Breakdown Donut Chart */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div>
            <h3 className="font-bold text-sm text-white">Severity Distribution</h3>
            <p className="text-xs text-slate-400">Proportion of high vs minor events</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.severityBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.severityBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            {analytics.severityBreakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className="font-mono font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
