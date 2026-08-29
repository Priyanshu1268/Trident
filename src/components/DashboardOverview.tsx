import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Cpu, 
  Radio, 
  Wifi, 
  MapPin, 
  Battery, 
  Phone, 
  User, 
  Car, 
  Activity, 
  ArrowRight,
  Sparkles,
  Play,
  QrCode,
  HeartPulse
} from 'lucide-react';
import { SystemHealthStatus, Vehicle, EmergencyContact, CrashAlert } from '../types';

interface DashboardOverviewProps {
  systemHealth: SystemHealthStatus;
  vehicle: Vehicle | null;
  emergencyContacts: EmergencyContact[];
  latestAlert: CrashAlert | null;
  onNavigate: (tab: any) => void;
  onSimulateCrash: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  systemHealth,
  vehicle,
  emergencyContacts,
  latestAlert,
  onNavigate,
  onSimulateCrash
}) => {
  const isAllNominal = systemHealth.deviceConnected && systemHealth.mpu6050Active;

  return (
    <div className="space-y-6">
      {/* 1. Primary Safe Status Hero Banner */}
      <div className={`p-6 rounded-xl border ${
        isAllNominal 
          ? 'bg-white border-emerald-200' 
          : 'bg-amber-50 border-amber-200'
      } shadow-xs`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isAllNominal ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {isAllNominal ? <ShieldCheck className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {isAllNominal ? 'All Systems Nominal • Vehicle Protected' : 'System Needs Attention'}
                </h1>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  isAllNominal ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900'
                }`}>
                  {isAllNominal ? 'MONITORING ACTIVE' : 'DIAGNOSTIC WARNING'}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                {isAllNominal 
                  ? 'Real-time multi-axis IMU collision detection running at 50Hz. Cellular SMS emergency escalation standby active.'
                  : 'Check hardware connection or power supply to GSM modem.'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => onNavigate('telemetry')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              Live Telemetry
            </button>
            <button
              onClick={onSimulateCrash}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Play className="w-3.5 h-3.5 text-rose-400" />
              Simulate Test Impact
            </button>
          </div>
        </div>
      </div>

      {/* 2. Hardware Subsystem Health Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Device Status */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">ESP32 Core</span>
            <Cpu className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${systemHealth.deviceConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className="text-sm font-semibold text-slate-800">
              {systemHealth.deviceConnected ? 'Online (50Hz)' : 'Disconnected'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Firmware v2.1.0</p>
        </div>

        {/* MPU6050 IMU */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">MPU6050 IMU</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${systemHealth.mpu6050Active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className="text-sm font-semibold text-slate-800">
              {systemHealth.mpu6050Active ? 'Calibrated' : 'Check I2C'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">±8g / ±1000°/s</p>
        </div>

        {/* SIM800L GSM */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">GSM Modem</span>
            <Radio className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${systemHealth.gsmAvailable ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-sm font-semibold text-slate-800">
              {systemHealth.gsmAvailable ? 'CSQ ' + systemHealth.csqSignal + '/31' : 'Offline'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">SIM800L 4.0V Ready</p>
        </div>

        {/* Cloud / WiFi */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Cloud Link</span>
            <Wifi className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${systemHealth.internetConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-sm font-semibold text-slate-800">
              {systemHealth.internetConnected ? 'Connected' : 'Fallback GSM'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">REST + MQTT</p>
        </div>

        {/* Smartphone GPS */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">GPS Signal</span>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${systemHealth.gpsAvailable ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <span className="text-sm font-semibold text-slate-800">
              {systemHealth.gpsAvailable ? 'High Accuracy' : 'Locating...'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Lat/Lng Ready</p>
        </div>

        {/* Battery & Power */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Aux Battery</span>
            <Battery className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-slate-800">
              {systemHealth.batteryLevel}% (4.1V)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Li-Ion Buffer OK</p>
        </div>
      </div>

      {/* 3. Main Dashboard Grid: Vehicle + Contacts + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle & Active Driver Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900">Vehicle Profile</h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
              {vehicle?.vehicleType || 'CAR'}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs text-slate-500">Registration Number</span>
              <p className="text-base font-bold text-slate-900 font-mono">
                {vehicle?.vehicleNumber || 'KA-01-SR-2026'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Model</span>
                <p className="font-semibold text-slate-800">{vehicle?.modelName || 'Honda City (2024)'}</p>
              </div>
              <div>
                <span className="text-slate-500">Assigned Driver</span>
                <p className="font-semibold text-slate-800">{vehicle?.owner || 'John Doe'}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Emergency Protocol:</span>
              <span className="font-semibold text-emerald-700">30s Auto-Escalate</span>
            </div>
          </div>
        </div>

        {/* Emergency Escalation Preview */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-rose-600" />
              <h2 className="text-sm font-bold text-slate-900">Emergency Contacts</h2>
            </div>
            <button 
              onClick={() => onNavigate('contacts')}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {emergencyContacts.slice(0, 3).map((contact, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900">{contact.name}</p>
                    <span className={`px-1.5 py-0.2 text-[10px] font-semibold rounded ${
                      contact.priority === 'PRIMARY' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {contact.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{contact.relationship} • {contact.phone}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-700 font-medium">SMS + Voice</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Emergency Medical Passport & QR Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-rose-600" />
              <h2 className="text-sm font-bold text-slate-900">Medical Passport & QR</h2>
            </div>
            <button 
              onClick={() => onNavigate('medical')}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold inline-flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100"
            >
              <span>Scan / Decal</span> <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50 border border-rose-100">
              <div className="flex items-center space-x-1.5">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span className="text-rose-900 font-bold">Blood Group</span>
              </div>
              <span className="text-base font-black text-rose-700 font-mono">O Positive (O+)</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Drug Allergies</span>
                <span className="font-semibold text-rose-900 text-xs">Penicillin, Aspirin</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Organ Donor</span>
                <span className="font-semibold text-emerald-700 text-xs">YES (Registered)</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              When victim is non-communicative, responders scan the windshield QR for instant blood type, allergy contraindications, and ICE calling.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Layered Architecture Explanation Bar */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
          Intelligent Multi-Layer Accident Pipeline
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <strong className="text-slate-900 block mb-1">Level 1: Hardware Rule Engine</strong>
            Instantaneous &gt;3.5g shock detection, &gt;55° rollover tilt, and jerk differential on ESP32 in 20ms.
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <strong className="text-slate-900 block mb-1">Level 2: Feature Extraction</strong>
            Statistical time-window analysis across RMS acceleration, angular rate, and impact energy vectors.
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <strong className="text-slate-900 block mb-1">Level 3: ML Severity Scoring</strong>
            Random Forest & Isolation Forest ensemble filtering false alarms (potholes/bumps) with &gt;96% precision.
          </div>
        </div>
      </div>
    </div>
  );
};
