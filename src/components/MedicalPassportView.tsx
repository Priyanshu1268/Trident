import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  HeartPulse,
  AlertTriangle,
  PhoneCall,
  ShieldAlert,
  Printer,
  Edit3,
  CheckCircle2,
  Ambulance,
  MapPin,
  ExternalLink,
  Pill,
  Droplet,
  User,
  Building2,
  Clock,
  Sparkles,
  Send,
  Download,
  Eye,
  Radio,
  FileCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { Vehicle, EmergencyContact, MedicalPassportData } from '../types';

interface MedicalPassportViewProps {
  currentVehicleNumber?: string;
  vehicles?: Vehicle[];
  onNavigateToTab?: (tab: string) => void;
}

export const MedicalPassportView: React.FC<MedicalPassportViewProps> = ({
  currentVehicleNumber = 'KA-01-AI-2026',
  vehicles = [],
  onNavigateToTab
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<string>(currentVehicleNumber);
  const [activeSubTab, setActiveSubTab] = useState<'responder' | 'sticker' | 'profile' | 'lockscreen'>('responder');
  const [passportData, setPassportData] = useState<MedicalPassportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [traumaSentSuccess, setTraumaSentSuccess] = useState<string | null>(null);
  const [traumaHospital, setTraumaHospital] = useState<string>('AIIMS Apex Trauma Center (Level 1)');
  const [triageNotes, setTriageNotes] = useState<string>('Victim unresponsive at scene. G-force 6.8g impact recorded. Need 2 units O+ blood on standby.');

  // Form edit states
  const [formData, setFormData] = useState({
    bloodGroup: 'O+',
    allergies: 'Penicillin, Aspirin, Sulfa drugs',
    chronicConditions: 'Mild Asthma, Type 2 Diabetes',
    medications: 'Salbutamol Inhaler (as needed), Metformin 500mg',
    emergencyInstructions: 'Carry rescue inhaler in front glove compartment. Penicillin allergy — do not administer beta-lactam antibiotics. Cervical spine immobilization required.',
    organDonor: true,
    emergencyDoctorName: 'Dr. Robert Vance (Apex Trauma Consultant)',
    emergencyDoctorPhone: '+919811122334',
    insuranceProvider: 'Star Health Premier Trauma Cover',
    insurancePolicyNumber: 'SH-2026-998812',
    abhaId: '91-2026-8812-4410',
    emergencyContacts: [
      { name: 'Priya Sharma', relationship: 'Spouse', phone: '+919876543210', isPriority: true, priority: 'PRIMARY' as const },
      { name: 'O.P. Sharma', relationship: 'Father', phone: '+919811223344', isPriority: false, priority: 'SECONDARY' as const },
      { name: 'Dr. Robert Vance', relationship: 'Family Physician', phone: '+919811122334', isPriority: false, priority: 'TERTIARY' as const },
    ]
  });

  const stickerRef = useRef<HTMLDivElement>(null);

  // Fetch medical passport data from API
  const fetchPassport = async (veh: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/medical-passport/${encodeURIComponent(veh)}`);
      if (res.ok) {
        const data: MedicalPassportData = await res.json();
        setPassportData(data);
        setFormData({
          bloodGroup: data.driver.bloodGroup || 'O+',
          allergies: data.driver.allergies || '',
          chronicConditions: data.driver.chronicConditions || '',
          medications: data.driver.medications || '',
          emergencyInstructions: data.driver.emergencyInstructions || '',
          organDonor: data.driver.organDonor ?? true,
          emergencyDoctorName: data.driver.emergencyDoctorName || '',
          emergencyDoctorPhone: data.driver.emergencyDoctorPhone || '',
          insuranceProvider: data.driver.insuranceProvider || '',
          insurancePolicyNumber: data.driver.insurancePolicyNumber || '',
          abhaId: data.driver.abhaId || '',
          emergencyContacts: data.driver.emergencyContacts?.length > 0 ? (data.driver.emergencyContacts as any) : formData.emergencyContacts
        });

        // Generate high-resolution scannable QR Code
        const scanUrl = `${window.location.origin}/?view=passport&vehicle=${encodeURIComponent(veh)}#passport`;
        const qrUrl = await QRCode.toDataURL(scanUrl, {
          width: 320,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });
        setQrDataUrl(qrUrl);
      }
    } catch (err) {
      console.error('Failed to load medical passport:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassport(selectedVehicle);
  }, [selectedVehicle]);

  // Handle Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/medical-passport/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleNumber: selectedVehicle,
          ...formData
        })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setIsEditing(false);
        fetchPassport(selectedVehicle);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to save medical passport:', err);
    }
  };

  // Pre-notify trauma hospital
  const handleNotifyTrauma = async () => {
    try {
      const res = await fetch('/api/v1/medical-passport/notify-trauma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleNumber: selectedVehicle,
          hospitalName: traumaHospital,
          triageNotes,
          bloodUnitsNeeded: 2,
          responderName: 'Paramedic Trauma Unit #04'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTraumaSentSuccess(data.message);
        setTimeout(() => setTraumaSentSuccess(null), 6000);
      }
    } catch (err) {
      console.error('Failed to notify trauma unit:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const bloodCompatibility: Record<string, { canReceive: string[]; canDonate: string[] }> = {
    'O+': { canReceive: ['O+', 'O-'], canDonate: ['O+', 'A+', 'B+', 'AB+'] },
    'O-': { canReceive: ['O- (Universal Red Cell Donor)'], canDonate: ['All Blood Types (Universal Donor)'] },
    'A+': { canReceive: ['A+', 'A-', 'O+', 'O-'], canDonate: ['A+', 'AB+'] },
    'A-': { canReceive: ['A-', 'O-'], canDonate: ['A+', 'A-', 'AB+', 'AB-'] },
    'B+': { canReceive: ['B+', 'B-', 'O+', 'O-'], canDonate: ['B+', 'AB+'] },
    'B-': { canReceive: ['B-', 'O-'], canDonate: ['B+', 'B-', 'AB+', 'AB-'] },
    'AB+': { canReceive: ['All Blood Types (Universal Recipient)'], canDonate: ['AB+ only'] },
    'AB-': { canReceive: ['AB-', 'A-', 'B-', 'O-'], canDonate: ['AB+', 'AB-'] },
  };

  const currentBlood = passportData?.driver?.bloodGroup || formData.bloodGroup || 'O+';
  const compatInfo = bloodCompatibility[currentBlood] || bloodCompatibility['O+'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                  Vehicle QR &bull; Emergency Medical Passport
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                  FHIR Compliant
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight mt-1">
                Emergency Medical Passport & QR Rescue Hub
              </h1>
              <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
                When a victim is non-communicative following a crash, authorized responders scan the vehicle's QR code to instantly access blood group, critical drug allergies, chronic conditions, and ICE emergency contacts.
              </p>
            </div>
          </div>

          {/* Vehicle Selector & Fast Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold">Registered Vehicle</span>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-rose-500 outline-none font-bold"
              >
                {vehicles && vehicles.length > 0 ? (
                  vehicles.map((v) => (
                    <option key={v.id} value={v.vehicleNumber}>
                      {v.vehicleNumber} ({v.owner})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="KA-01-AI-2026">KA-01-AI-2026 (Rahul Sharma)</option>
                    <option value="DL-04-TR-9981">DL-04-TR-9981 (Sarah Connor)</option>
                  </>
                )}
              </select>
            </div>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 transition shadow-sm flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sticker</span>
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('responder')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
              activeSubTab === 'responder'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>🚑 Authorized Responder Scanner View</span>
          </button>

          <button
            onClick={() => setActiveSubTab('sticker')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
              activeSubTab === 'sticker'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>🖨️ Windshield Emergency QR Sticker</span>
          </button>

          <button
            onClick={() => setActiveSubTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
              activeSubTab === 'profile'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>🪪 Driver Medical Profile & ICE Editor</span>
          </button>

          <button
            onClick={() => setActiveSubTab('lockscreen')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
              activeSubTab === 'lockscreen'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span>📱 Smartphone ICE Lock Screen</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center space-x-3 text-emerald-800 text-xs shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">Medical Passport and QR payload successfully synchronized across vehicle windshield QR and cloud registry!</span>
        </div>
      )}

      {traumaSentSuccess && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-center space-x-3 text-rose-900 text-xs shadow-sm animate-in fade-in">
          <Radio className="w-5 h-5 text-rose-600 animate-pulse flex-shrink-0" />
          <span className="font-semibold">{traumaSentSuccess}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: AUTHORIZED RESPONDER SCANNER & EMERGENCY TRIAGE VIEW */}
      {/* ======================================================== */}
      {activeSubTab === 'responder' && (
        <div className="space-y-6">
          {/* Critical Emergency Responder Banner */}
          <div className="bg-gradient-to-r from-rose-700 via-rose-800 to-slate-900 text-white p-5 rounded-3xl border border-rose-600 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-white/20 rounded-full font-bold">
                    EMERGENCY ON-SCENE TRIAGE &bull; UNRESPONSIVE VICTIM
                  </span>
                  <h2 className="text-xl font-black mt-0.5">
                    Vehicle QR Scanned: Plate {selectedVehicle}
                  </h2>
                  <p className="text-xs text-rose-100">
                    Driver is non-communicative. Vital clinical profile decoded directly from vehicle security token.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 text-center">
                  <span className="text-[9px] uppercase font-mono tracking-wider block text-rose-200">Incident Severity</span>
                  <span className="text-xs font-black bg-rose-500 text-white px-2 py-0.5 rounded uppercase">
                    CRITICAL (6.8g)
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 text-center">
                  <span className="text-[9px] uppercase font-mono tracking-wider block text-rose-200">Time Elapsed</span>
                  <span className="text-xs font-mono font-black text-amber-300">03m 14s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Core Emergency Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column: Immediate Medical Life-Threatening Data */}
            <div className="lg:col-span-2 space-y-6">
              {/* Blood Group & Transfusion Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
                    <Droplet className="w-5 h-5 text-rose-600" />
                    <span>Emergency Blood Group & Transfusion Protocol</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                    CRITICAL MATCH
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Huge Blood Group Badge */}
                  <div className="sm:col-span-4 bg-gradient-to-br from-rose-600 to-rose-800 rounded-2xl p-4 text-white text-center shadow-md">
                    <span className="text-[11px] font-bold uppercase tracking-widest block text-rose-200">
                      Victim Blood Group
                    </span>
                    <span className="text-4xl font-black tracking-tight block my-1">
                      {currentBlood}
                    </span>
                    <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded-full inline-block">
                      RH POSITIVE
                    </span>
                  </div>

                  {/* Compatibility Details */}
                  <div className="sm:col-span-8 space-y-2.5 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-bold block uppercase text-[10px]">
                        Can Safely Receive Red Blood Cells From:
                      </span>
                      <p className="text-slate-900 font-bold text-sm mt-0.5">
                        {compatInfo.canReceive.join(', ')}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-bold block uppercase text-[10px]">
                        Cross-Match Notice:
                      </span>
                      <p className="text-slate-700 text-xs mt-0.5">
                        Emergency uncrossed O-Negative blood can be transfused immediately if patient is in severe hemorrhagic shock.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* High-Alert Warnings: Allergies & Chronic Conditions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Allergies Card */}
                <div className="bg-rose-50/70 border-2 border-rose-200 rounded-3xl p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-rose-900 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <span>Severe Allergies & Contraindications</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl border border-rose-200 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-rose-600 font-bold block">
                      DO NOT ADMINISTER
                    </span>
                    <p className="text-base font-black text-rose-950">
                      {passportData?.driver?.allergies || formData.allergies}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      High risk of anaphylactic shock if beta-lactam antibiotics or aspirin are administered.
                    </p>
                  </div>
                </div>

                {/* Chronic Conditions Card */}
                <div className="bg-amber-50/70 border-2 border-amber-200 rounded-3xl p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
                    <HeartPulse className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <span>Chronic Medical Conditions</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl border border-amber-200 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-amber-600 font-bold block">
                      DIAGNOSED CONDITIONS
                    </span>
                    <p className="text-base font-black text-slate-900">
                      {passportData?.driver?.chronicConditions || formData.chronicConditions}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Check blood glucose levels (glucometer) and check airway for bronchospasm.
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Medications & Clinical First-Responder Guidance */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
                    <Pill className="w-5 h-5 text-indigo-600" />
                    <span>Active Daily Medications & Paramedic Directives</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    ABHA ID: {passportData?.driver?.abhaId || formData.abhaId}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                      Prescribed Daily Medications
                    </span>
                    <p className="text-slate-900 font-bold text-sm mt-0.5">
                      {passportData?.driver?.medications || formData.medications}
                    </p>
                  </div>

                  <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-200">
                    <span className="text-[10px] font-mono uppercase text-indigo-800 font-bold block">
                      On-Scene Clinical Instructions for EMTs & Good Samaritans
                    </span>
                    <p className="text-indigo-950 font-semibold mt-1 leading-relaxed">
                      "{passportData?.driver?.emergencyInstructions || formData.emergencyInstructions}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Pre-Notify Hospital Trauma Bay Form */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-lg space-y-4">
                <div className="flex items-center space-x-2.5">
                  <Building2 className="w-5 h-5 text-rose-400" />
                  <div>
                    <h3 className="font-bold text-sm">Pre-Alert Hospital Trauma Receiving Bay</h3>
                    <p className="text-xs text-slate-400">
                      Transmit victim blood group ({currentBlood}) and vital telemetry ahead so trauma surgeons prepare before ambulance arrival.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Target Trauma Emergency Ward</label>
                    <select
                      value={traumaHospital}
                      onChange={(e) => setTraumaHospital(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:ring-1 focus:ring-rose-500"
                    >
                      <option value="AIIMS Apex Trauma Center (Level 1)">AIIMS Apex Trauma Center (Level 1)</option>
                      <option value="Safdarjung Hospital Emergency Trauma">Safdarjung Hospital Emergency Trauma</option>
                      <option value="Apollo Hospitals Trauma & ICU">Apollo Hospitals Trauma & ICU</option>
                      <option value="Fortis Memorial Emergency Desk">Fortis Memorial Emergency Desk</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">On-Scene Responder Notes</label>
                    <input
                      type="text"
                      value={triageNotes}
                      onChange={(e) => setTriageNotes(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:ring-1 focus:ring-rose-500 text-xs"
                    />
                  </div>
                </div>

                <button
                  onClick={handleNotifyTrauma}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center space-x-2 transition shadow-md shadow-rose-600/30 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Transmit Patient Passport & Pre-Alert Trauma Bay</span>
                </button>
              </div>
            </div>

            {/* Right Column: ICE Contacts & Emergency Calling */}
            <div className="space-y-6">
              {/* Emergency Contacts (1-Click Call & SMS) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
                    <PhoneCall className="w-5 h-5 text-emerald-600" />
                    <span>Emergency Contacts (ICE)</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Direct Dial
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(passportData?.driver?.emergencyContacts || formData.emergencyContacts).map((contact, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-900 text-xs">{contact.name}</span>
                            {contact.isPriority && (
                              <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded uppercase">
                                Primary
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">{contact.relationship} &bull; {contact.phone}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <a
                          href={`tel:${contact.phone}`}
                          className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-1 transition shadow-xs"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>Call ICE</span>
                        </a>

                        <a
                          href={`sms:${contact.phone}?body=${encodeURIComponent(
                            `[EMERGENCY ALERT] Your family member ${passportData?.driver?.name || 'Driver'} was in a vehicle accident (Plate: ${selectedVehicle}). First responders are on scene. Location: https://maps.google.com/?q=${passportData?.latestLocation?.latitude || 28.6139},${passportData?.latestLocation?.longitude || 77.2090}`
                          )}`}
                          className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-center space-x-1 transition shadow-xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>SMS ICE</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* National Helplines Speed-Dial */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-mono">
                  National Emergency Helplines
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  <a
                    href="tel:108"
                    className="p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-2xl text-center text-rose-900 transition flex flex-col items-center"
                  >
                    <Ambulance className="w-4 h-4 text-rose-600 mb-0.5" />
                    <span className="font-extrabold text-sm">108</span>
                    <span className="text-[9px] text-slate-500">Ambulance</span>
                  </a>

                  <a
                    href="tel:112"
                    className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl text-center text-blue-900 transition flex flex-col items-center"
                  >
                    <ShieldAlert className="w-4 h-4 text-blue-600 mb-0.5" />
                    <span className="font-extrabold text-sm">112</span>
                    <span className="text-[9px] text-slate-500">Police PCR</span>
                  </a>

                  <a
                    href="tel:1033"
                    className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl text-center text-amber-900 transition flex flex-col items-center"
                  >
                    <Radio className="w-4 h-4 text-amber-600 mb-0.5" />
                    <span className="font-extrabold text-sm">1033</span>
                    <span className="text-[9px] text-slate-500">Highway</span>
                  </a>
                </div>
              </div>

              {/* Driver Identity & Organ Donor Status */}
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700 font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {passportData?.driver?.name || 'Rahul Sharma'}
                      </h4>
                      <p className="text-[11px] text-slate-500">Driver Phone: {passportData?.driver?.phone || '+91 98765 43210'}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    {passportData?.driver?.organDonor ? 'ORGAN DONOR' : 'STANDARD'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Insurance Provider:</span>
                    <span className="font-bold text-slate-800">{passportData?.driver?.insuranceProvider || formData.insuranceProvider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Policy Number:</span>
                    <span className="font-mono font-semibold text-slate-800">{passportData?.driver?.insurancePolicyNumber || formData.insurancePolicyNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Physician Contact:</span>
                    <span className="font-semibold text-slate-800">{passportData?.driver?.emergencyDoctorName || formData.emergencyDoctorName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: WINDSHIELD EMERGENCY QR STICKER (PRINT READY) */}
      {/* ======================================================== */}
      {activeSubTab === 'sticker' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Printer className="w-5 h-5 text-rose-600" />
                <span>Vehicle Windshield Emergency QR Decal</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Print this high-contrast sticker and adhere it to the lower-left corner of the front vehicle windshield or two-wheeler fuel tank.
              </p>
            </div>

            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-2 transition shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4 text-rose-400" />
              <span>Print Windshield Sticker Decal</span>
            </button>
          </div>

          {/* Printable Sticker Box */}
          <div className="flex justify-center p-6 bg-slate-100 rounded-3xl border border-slate-200">
            <div
              ref={stickerRef}
              className="w-full max-w-lg bg-white border-4 border-rose-600 rounded-3xl p-6 shadow-2xl space-y-4 print:border-4 print:shadow-none print:m-0"
              style={{ minHeight: '480px' }}
            >
              {/* Sticker Header */}
              <div className="bg-rose-600 text-white p-3 rounded-2xl text-center space-y-0.5">
                <div className="flex items-center justify-center space-x-1.5 text-xs font-black tracking-wider uppercase">
                  <ShieldAlert className="w-4 h-4" />
                  <span>EMERGENCY MEDICAL PASSPORT</span>
                </div>
                <p className="text-[10px] text-rose-100 font-medium">
                  IN CASE OF ACCIDENT &bull; PARAMEDICS & BYSTANDERS SCAN QR
                </p>
              </div>

              {/* Main Sticker Body */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* Left: Real QR Code */}
                <div className="sm:col-span-6 flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl border-2 border-slate-800">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Emergency Medical Passport QR Code"
                      className="w-44 h-44 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-44 h-44 bg-slate-200 animate-pulse rounded-lg flex items-center justify-center text-xs text-slate-500">
                      Generating QR...
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-slate-700 font-mono mt-1 text-center">
                    SCAN WITH ANY CAMERA
                  </span>
                </div>

                {/* Right: Critical Badges */}
                <div className="sm:col-span-6 space-y-3">
                  {/* Blood Group */}
                  <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-2xl text-center">
                    <span className="text-[10px] font-bold uppercase text-rose-700 block">BLOOD GROUP</span>
                    <span className="text-3xl font-black text-rose-900 block">{currentBlood}</span>
                    <span className="text-[9px] text-slate-600 font-semibold">RH POSITIVE</span>
                  </div>

                  {/* Vehicle Plate */}
                  <div className="p-2.5 bg-slate-900 text-white rounded-xl text-center">
                    <span className="text-[9px] font-mono uppercase text-slate-400 block">Vehicle Reg Plate</span>
                    <span className="text-sm font-black font-mono tracking-wider">{selectedVehicle}</span>
                  </div>

                  {/* Primary ICE Phone */}
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-center">
                    <span className="text-[9px] font-bold uppercase text-emerald-800 block">Primary ICE Contact</span>
                    <span className="text-xs font-black font-mono text-emerald-950">
                      {passportData?.driver?.emergencyContacts?.[0]?.phone || formData.emergencyContacts[0]?.phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Critical Medical Summary Strip */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] space-y-1">
                <div className="flex items-center space-x-1 text-amber-900 font-bold text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Critical Medical Highlights</span>
                </div>
                <div className="text-slate-700">
                  <strong>Allergies:</strong> {passportData?.driver?.allergies || formData.allergies}
                </div>
                <div className="text-slate-700">
                  <strong>Conditions:</strong> {passportData?.driver?.chronicConditions || formData.chronicConditions}
                </div>
              </div>

              {/* Sticker Footer */}
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-2 border-t border-slate-200">
                <span>SafeRide AI Emergency Decal</span>
                <span>Ambulance 108 &bull; Police 112</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: DRIVER MEDICAL PROFILE & ICE EDITOR */}
      {/* ======================================================== */}
      {activeSubTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Edit Driver Emergency Medical Passport</h2>
              <p className="text-xs text-slate-500">
                Update blood group, allergies, chronic conditions, and emergency contacts. Changes automatically sync to the vehicle's QR code.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg">
              Plate: {selectedVehicle}
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold text-rose-700 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900"
                >
                  <option value="A+">A Positive (A+)</option>
                  <option value="A-">A Negative (A-)</option>
                  <option value="B+">B Positive (B+)</option>
                  <option value="B-">B Negative (B-)</option>
                  <option value="O+">O Positive (O+)</option>
                  <option value="O-">O Negative (O-)</option>
                  <option value="AB+">AB Positive (AB+)</option>
                  <option value="AB-">AB Negative (AB-)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Organ Donor Registry</label>
                <select
                  value={formData.organDonor ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, organDonor: e.target.value === 'true' })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900"
                >
                  <option value="true">YES — Registered Organ Donor</option>
                  <option value="false">NO — Not Registered</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ABHA Health ID / Gov ID</label>
                <input
                  type="text"
                  value={formData.abhaId}
                  onChange={(e) => setFormData({ ...formData, abhaId: e.target.value })}
                  placeholder="91-2026-8812-4410"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Known Drug & Environmental Allergies</label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="e.g. Penicillin, Aspirin, Sulfa drugs, Latex"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Chronic Medical Conditions</label>
              <input
                type="text"
                value={formData.chronicConditions}
                onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })}
                placeholder="e.g. Type 2 Diabetes, Mild Asthma, Cardiac Stent"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Daily Medications & Dosages</label>
              <input
                type="text"
                value={formData.medications}
                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                placeholder="e.g. Metformin 500mg, Salbutamol Inhaler"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">First Responder Emergency Directives</label>
              <textarea
                rows={2}
                value={formData.emergencyInstructions}
                onChange={(e) => setFormData({ ...formData, emergencyInstructions: e.target.value })}
                placeholder="Specific instructions for EMTs and doctors during trauma care..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Insurance Provider</label>
                <input
                  type="text"
                  value={formData.insuranceProvider}
                  onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                  placeholder="e.g. Star Health Premier"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Policy Number</label>
                <input
                  type="text"
                  value={formData.insurancePolicyNumber}
                  onChange={(e) => setFormData({ ...formData, insurancePolicyNumber: e.target.value })}
                  placeholder="SH-2026-998812"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            {/* Emergency Contacts Form */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase font-mono">Emergency Contacts List (ICE)</span>
              </div>

              {formData.emergencyContacts.map((c, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => {
                        const updated = [...formData.emergencyContacts];
                        updated[i].name = e.target.value;
                        setFormData({ ...formData, emergencyContacts: updated });
                      }}
                      placeholder="Contact Name"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={c.relationship}
                      onChange={(e) => {
                        const updated = [...formData.emergencyContacts];
                        updated[i].relationship = e.target.value;
                        setFormData({ ...formData, emergencyContacts: updated });
                      }}
                      placeholder="Relationship"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="tel"
                      value={c.phone}
                      onChange={(e) => {
                        const updated = [...formData.emergencyContacts];
                        updated[i].phone = e.target.value;
                        setFormData({ ...formData, emergencyContacts: updated });
                      }}
                      placeholder="+91 Mobile Phone"
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition"
              >
                Save Medical Passport & Sync QR
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: SMARTPHONE ICE LOCK SCREEN SIMULATION */}
      {/* ======================================================== */}
      {activeSubTab === 'lockscreen' && (
        <div className="flex justify-center">
          <div className="w-full max-w-sm bg-black rounded-[42px] border-[6px] border-slate-800 p-4 shadow-2xl relative overflow-hidden">
            {/* Phone Notch */}
            <div className="w-32 h-4 bg-slate-900 rounded-full mx-auto mb-4 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-slate-800" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
            </div>

            {/* Time & Lock Header */}
            <div className="text-center space-y-1 mb-4">
              <div className="flex items-center justify-center space-x-1 text-slate-400 text-[10px]">
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                <span className="font-semibold text-rose-400 uppercase tracking-wider">EMERGENCY MEDICAL PASSPORT</span>
              </div>
              <div className="text-3xl font-black text-white font-mono tracking-tight">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>

            {/* Emergency Header Card */}
            <div className="bg-gradient-to-br from-rose-600 to-rose-900 rounded-2xl p-4 text-white shadow-lg space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-mono font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  DRIVER MEDICAL PASSPORT
                </span>
                <span className="text-xs font-mono font-bold bg-white text-rose-900 px-2 py-0.5 rounded-md">
                  {currentBlood} POSITIVE
                </span>
              </div>

              <div className="flex items-center space-x-3 pt-1">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-base">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">
                    {passportData?.driver?.name || 'Rahul Sharma'}
                  </h3>
                  <p className="text-[11px] text-rose-100 font-mono">
                    Plate: {selectedVehicle}
                  </p>
                </div>
              </div>
            </div>

            {/* Critical Medical Conditions */}
            <div className="space-y-2 mb-3 text-xs">
              <div className="bg-slate-900/90 border border-rose-900/40 rounded-xl p-3 space-y-1">
                <div className="flex items-center space-x-1.5 text-rose-400 font-bold text-[10px] uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  <span>Allergies</span>
                </div>
                <p className="text-slate-200 font-semibold text-[11px]">
                  {passportData?.driver?.allergies || formData.allergies}
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1">
                <div className="flex items-center space-x-1.5 text-amber-400 font-bold text-[10px] uppercase tracking-wider">
                  <HeartPulse className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Chronic Conditions</span>
                </div>
                <p className="text-slate-200 text-[11px]">
                  {passportData?.driver?.chronicConditions || formData.chronicConditions}
                </p>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="space-y-1.5 mb-3">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block px-1">
                Tap to Call ICE (No PIN Required)
              </span>

              {(passportData?.driver?.emergencyContacts || formData.emergencyContacts).slice(0, 2).map((c, i) => (
                <a
                  key={i}
                  href={`tel:${c.phone}`}
                  className="flex items-center justify-between p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs transition"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                      <PhoneCall className="w-3 h-3" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-[11px]">{c.name}</div>
                      <span className="text-[9px] text-slate-400 font-mono">{c.phone}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400">CALL</span>
                </a>
              ))}
            </div>

            {/* Hotlines */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href="tel:108"
                className="p-2 bg-rose-950/40 border border-rose-700/60 rounded-xl text-center flex flex-col items-center justify-center text-rose-300"
              >
                <Ambulance className="w-3.5 h-3.5 text-rose-400 mb-0.5" />
                <span className="font-bold text-[11px]">Ambulance 108</span>
              </a>

              <a
                href="tel:112"
                className="p-2 bg-blue-950/40 border border-blue-700/60 rounded-xl text-center flex flex-col items-center justify-center text-blue-300"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-blue-400 mb-0.5" />
                <span className="font-bold text-[11px]">Police 112</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
