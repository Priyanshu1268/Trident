import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Flame, 
  CheckCircle2, 
  Ambulance, 
  Hospital, 
  MapPin, 
  Gauge, 
  Clock, 
  User, 
  Phone, 
  HeartHandshake, 
  Search, 
  Filter, 
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { CrashAlert, AlertStatus, SeverityLevel } from '../types';

interface AlertsCommandCenterProps {
  alerts: CrashAlert[];
  onUpdateStatus: (alertId: number, status: AlertStatus, notes?: string) => Promise<void>;
  onTriggerPreset: (scenario: string) => Promise<void>;
}

export const AlertsCommandCenter: React.FC<AlertsCommandCenterProps> = ({
  alerts,
  onUpdateStatus,
  onTriggerPreset,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAlert, setSelectedAlert] = useState<CrashAlert | null>(alerts[0] || null);
  const [respondingId, setRespondingId] = useState<number | null>(null);

  const filteredAlerts = alerts.filter((alert) => {
    if (filterSeverity !== 'ALL' && alert.severity !== filterSeverity) return false;
    if (filterStatus !== 'ALL' && alert.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchVehicle = alert.vehicle?.vehicleNumber?.toLowerCase().includes(q);
      const matchOwner = alert.vehicle?.owner?.toLowerCase().includes(q);
      const matchLoc = alert.locationName?.toLowerCase().includes(q);
      if (!matchVehicle && !matchOwner && !matchLoc) return false;
    }
    return true;
  });

  const handleStatusChange = async (alertId: number, status: AlertStatus) => {
    setRespondingId(alertId);
    try {
      await onUpdateStatus(alertId, status);
      // Update selected alert if it is currently displayed
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert((prev) => (prev ? { ...prev, status } : null));
      }
    } finally {
      setRespondingId(null);
    }
  };

  const activeEmergency = alerts.filter((a) => a.status === 'PENDING' || a.status === 'AMBULANCE_DISPATCHED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Trigger Simulation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Emergency Crash & Triage Command Center
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Live ingest of vehicle G-force spikes, vision alerts, and auto-dispatched trauma responders.
            </p>
          </div>

          {/* Quick Scenario Simulators */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Test Ingest:
            </span>
            <button
              id="sim-highway"
              onClick={() => onTriggerPreset('highway_crash')}
              className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/80 text-xs font-semibold transition shadow-sm"
            >
              🚨 Severe Collision (7.4g)
            </button>
            <button
              id="sim-pothole"
              onClick={() => onTriggerPreset('bike_pothole_slip')}
              className="px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800/80 text-xs font-semibold transition shadow-sm"
            >
              ⚠️ Pothole Impact (3.8g)
            </button>
            <button
              id="sim-helmet"
              onClick={() => onTriggerPreset('no_helmet_hazard')}
              className="px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800/80 text-xs font-semibold transition shadow-sm"
            >
              🪖 Vision: No Helmet
            </button>
            <button
              id="sim-truck"
              onClick={() => onTriggerPreset('heavy_truck_rollover')}
              className="px-3 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800/80 text-xs font-semibold transition shadow-sm"
            >
              🚛 Truck Rollover (5.6g)
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-alerts-input"
            type="text"
            placeholder="Search vehicle number, owner, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-950 text-slate-200 placeholder-slate-500 rounded-lg border border-slate-700 text-sm focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Severity:</span>
            <select
              id="filter-severity-select"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All</option>
              <option value="HIGH" className="bg-slate-900">High</option>
              <option value="MEDIUM" className="bg-slate-900">Medium</option>
              <option value="LOW" className="bg-slate-900">Low</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700 text-xs text-slate-300">
            <span className="text-slate-400">Status:</span>
            <select
              id="filter-status-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All</option>
              <option value="PENDING" className="bg-slate-900">Pending</option>
              <option value="AMBULANCE_DISPATCHED" className="bg-slate-900">Ambulance Dispatched</option>
              <option value="HOSPITAL_NOTIFIED" className="bg-slate-900">Hospital Notified</option>
              <option value="RESOLVED" className="bg-slate-900">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Alerts List + Detail Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Alert Cards List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span>SHOWING {filteredAlerts.length} RECORDED INCIDENTS</span>
            <span>{activeEmergency} ACTIVE EMERGENCIES</span>
          </div>

          {filteredAlerts.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
              <p className="text-slate-200 font-semibold">No Incidents Found</p>
              <p className="text-xs text-slate-400 mt-1">Try modifying your search or trigger a simulated crash test above.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isSelected = selectedAlert?.id === alert.id;
              const isHigh = alert.severity === 'HIGH';
              const isMed = alert.severity === 'MEDIUM';

              return (
                <div
                  key={alert.id}
                  id={`alert-card-${alert.id}`}
                  onClick={() => setSelectedAlert(alert)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-900 border-red-500/80 shadow-lg shadow-red-500/10 ring-1 ring-red-500/50'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {/* Left severity indicator bar */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      isHigh ? 'bg-red-500' : isMed ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isHigh
                            ? 'bg-red-950 text-red-400 border border-red-800/80'
                            : isMed
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/80'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                        }`}
                      >
                        {isHigh ? (
                          <Flame className="w-5 h-5 animate-pulse" />
                        ) : isMed ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-100 text-base">
                            {alert.vehicle?.vehicleNumber || 'UNKNOWN'}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isHigh
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                : isMed
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {alert.severity} SEVERITY
                          </span>
                          {alert.visionEvent && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                              {alert.visionEvent.replace('_', ' ')}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-xs">{alert.locationName || 'Unknown Location'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center space-x-1 justify-end text-xs text-slate-400 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <span
                        className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          alert.status === 'AMBULANCE_DISPATCHED'
                            ? 'bg-red-500/20 text-red-300'
                            : alert.status === 'HOSPITAL_NOTIFIED'
                            ? 'bg-amber-500/20 text-amber-300'
                            : alert.status === 'RESOLVED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {alert.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Quick telemetry metrics banner */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                    <div className="bg-slate-950/60 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">G-Force</span>
                      <span className={`font-mono font-bold ${isHigh ? 'text-red-400' : 'text-slate-200'}`}>
                        {alert.gForce} g
                      </span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Impact Speed</span>
                      <span className="font-mono font-bold text-slate-200">{alert.impactSpeed} km/h</span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Driver</span>
                      <span className="font-semibold text-slate-200 truncate block">
                        {alert.vehicle?.owner || 'Registered'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Incident Detailed Inspector */}
        <div className="lg:col-span-5">
          {selectedAlert ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sticky top-24 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                    INCIDENT DETAILS #{selectedAlert.id}
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-0.5 font-mono">
                    {selectedAlert.vehicle?.vehicleNumber}
                  </h2>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                      selectedAlert.severity === 'HIGH'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : selectedAlert.severity === 'MEDIUM'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {selectedAlert.severity}
                  </span>
                </div>
              </div>

              {/* Driver & Medical Passport Information */}
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-red-400 uppercase tracking-wide">
                    <HeartHandshake className="w-4 h-4" />
                    <span>Emergency Medical Passport</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-red-950 text-red-300 rounded font-mono font-bold border border-red-900">
                    CRITICAL DATA
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Driver Name</span>
                    <p className="font-semibold text-slate-200 mt-0.5">{selectedAlert.vehicle?.owner || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Blood Group</span>
                    <p className="font-bold text-red-400 font-mono mt-0.5 text-sm">
                      {selectedAlert.vehicle?.driver?.bloodGroup || 'O+'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Medical Conditions & Allergies</span>
                    <p className="text-slate-300 font-medium mt-0.5 bg-slate-900 p-2 rounded border border-slate-800">
                      {selectedAlert.vehicle?.driver?.medicalConditions || 'No Chronic Conditions Reported'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Emergency Phone</span>
                    <p className="font-mono text-slate-200 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      {selectedAlert.vehicle?.emergencyContactPhone || '+918757882039'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Vehicle Type</span>
                    <p className="font-semibold text-slate-200 mt-0.5">{selectedAlert.vehicle?.vehicleType || 'CAR'}</p>
                  </div>
                </div>
              </div>

              {/* Coordinates & Location Map Box */}
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-red-400" /> GPS Telemetry Coordinates
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${selectedAlert.latitude},${selectedAlert.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    Open Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg font-mono text-xs text-slate-300 flex justify-between">
                  <span>LAT: {selectedAlert.latitude?.toFixed(5)}</span>
                  <span>LNG: {selectedAlert.longitude?.toFixed(5)}</span>
                </div>
                <p className="text-xs text-slate-400">{selectedAlert.locationName}</p>
              </div>

              {/* Responders & Hospital Assignments */}
              {(selectedAlert.dispatchedAmbulanceUnit || selectedAlert.assignedHospital) && (
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                    <Hospital className="w-4 h-4" /> Assigned Emergency Units
                  </div>
                  {selectedAlert.dispatchedAmbulanceUnit && (
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Ambulance:</span>
                      <span className="font-semibold text-red-300">{selectedAlert.dispatchedAmbulanceUnit}</span>
                    </div>
                  )}
                  {selectedAlert.assignedHospital && (
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Hospital Base:</span>
                      <span className="font-semibold text-emerald-300">{selectedAlert.assignedHospital}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Responder Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Responder Action Controls
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="btn-dispatch-ambulance"
                    onClick={() => handleStatusChange(selectedAlert.id, 'AMBULANCE_DISPATCHED')}
                    disabled={respondingId === selectedAlert.id || selectedAlert.status === 'AMBULANCE_DISPATCHED'}
                    className="flex items-center justify-center space-x-1.5 p-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-red-600/30"
                  >
                    <Ambulance className="w-4 h-4" />
                    <span>Dispatch Ambulance</span>
                  </button>

                  <button
                    id="btn-notify-hospital"
                    onClick={() => handleStatusChange(selectedAlert.id, 'HOSPITAL_NOTIFIED')}
                    disabled={respondingId === selectedAlert.id || selectedAlert.status === 'HOSPITAL_NOTIFIED'}
                    className="flex items-center justify-center space-x-1.5 p-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-amber-600/30"
                  >
                    <Hospital className="w-4 h-4" />
                    <span>Notify Hospital</span>
                  </button>

                  <button
                    id="btn-resolve-incident"
                    onClick={() => handleStatusChange(selectedAlert.id, 'RESOLVED')}
                    disabled={respondingId === selectedAlert.id || selectedAlert.status === 'RESOLVED'}
                    className="flex items-center justify-center space-x-1.5 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-emerald-600/30"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Resolved</span>
                  </button>

                  <button
                    id="btn-false-alarm"
                    onClick={() => handleStatusChange(selectedAlert.id, 'FALSE_ALARM')}
                    disabled={respondingId === selectedAlert.id || selectedAlert.status === 'FALSE_ALARM'}
                    className="flex items-center justify-center space-x-1.5 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700 text-xs font-bold transition"
                  >
                    <span>Flag False Alarm</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              Select an incident from the list to view telemetry and dispatch responders.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
