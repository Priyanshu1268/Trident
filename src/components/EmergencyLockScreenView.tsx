import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  PhoneCall, 
  Heart, 
  AlertTriangle, 
  Pill, 
  QrCode, 
  MapPin, 
  ExternalLink, 
  Edit3, 
  Save, 
  CheckCircle2, 
  User as UserIcon, 
  Ambulance, 
  Share2, 
  Droplet,
  Smartphone,
  Lock,
  Clock,
  Sparkles
} from 'lucide-react';
import { Vehicle, EmergencyContact } from '../types';

interface EmergencyLockScreenViewProps {
  currentVehicleNumber: string;
  vehicles: Vehicle[];
}

export const EmergencyLockScreenView: React.FC<EmergencyLockScreenViewProps> = ({
  currentVehicleNumber,
  vehicles,
}) => {
  const [selectedVehicleNumber, setSelectedVehicleNumber] = useState<string>(currentVehicleNumber || 'KA-01-AI-2026');
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editing, setEditing] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Form states for editing
  const [formData, setFormData] = useState({
    bloodGroup: 'O+',
    medicalConditions: 'Diabetic (Type 2), Penicillin Allergy',
    allergies: 'Penicillin, Dust Mites, Sulfa Drugs',
    medications: 'Metformin 500mg, Aspirin 75mg',
    organDonor: true,
    emergencyContacts: [
      { name: 'Priya Sharma', relationship: 'Spouse', phone: '+919876543210', isPriority: true },
      { name: 'O.P. Sharma', relationship: 'Father', phone: '+919811223344', isPriority: false },
      { name: 'Dr. Anita Mehta', relationship: 'Physician', phone: '+919822334455', isPriority: false }
    ],
  });

  const fetchProfile = async (vehNum: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/ice-passport/${encodeURIComponent(vehNum)}`);
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        setFormData({
          bloodGroup: data.driver?.bloodGroup || 'O+',
          medicalConditions: data.driver?.medicalConditions || '',
          allergies: data.driver?.allergies || '',
          medications: data.driver?.medications || '',
          organDonor: data.driver?.organDonor ?? true,
          emergencyContacts: data.driver?.emergencyContacts?.length > 0 ? data.driver.emergencyContacts : [
            { name: 'Primary ICE Contact', relationship: 'Family', phone: '+919876543210', isPriority: true },
            { name: 'Secondary Contact', relationship: 'Parent', phone: '+919811223344', isPriority: false }
          ],
        });
      }
    } catch (e) {
      console.error('Failed to fetch ICE profile', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile(selectedVehicleNumber);
  }, [selectedVehicleNumber]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/ice-passport/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleNumber: selectedVehicleNumber,
          ...formData,
        }),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setEditing(false);
        fetchProfile(selectedVehicleNumber);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  };

  const handleContactChange = (index: number, field: keyof EmergencyContact, value: any) => {
    const updated = [...formData.emergencyContacts];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, emergencyContacts: updated });
  };

  const addContact = () => {
    setFormData({
      ...formData,
      emergencyContacts: [
        ...formData.emergencyContacts,
        { name: 'New Contact', relationship: 'Family / Friend', phone: '+91', isPriority: false },
      ],
    });
  };

  const removeContact = (index: number) => {
    const updated = formData.emergencyContacts.filter((_, i) => i !== index);
    setFormData({ ...formData, emergencyContacts: updated });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                Good Samaritan &bull; In Case of Emergency (ICE)
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              Emergency Lock Screen & Medical Passport
            </h1>
            <p className="text-xs text-slate-400">
              Instant critical medical data accessible to first responders and bystanders on the crash scene without unlocking the phone.
            </p>
          </div>
        </div>

        {/* Vehicle Selector & Edit Toggle */}
        <div className="flex items-center space-x-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-mono text-slate-500">Target Vehicle</span>
            <select
              value={selectedVehicleNumber}
              onChange={(e) => setSelectedVehicleNumber(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-red-500 outline-none"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.vehicleNumber}>
                  {v.vehicleNumber} - {v.owner}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setEditing(!editing)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition border ${
              editing
                ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{editing ? 'Cancel Edit' : 'Edit Passport'}</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center space-x-3 text-emerald-400 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Medical Passport profile successfully updated! Real-time changes are active on the lock screen.</span>
        </div>
      )}

      {/* Main Lock Screen Layout Preview (Side-by-side) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Realistic Smartphone Lockscreen Simulation */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-sm bg-black rounded-[42px] border-[6px] border-slate-800 p-4 shadow-2xl shadow-slate-950 relative overflow-hidden">
            {/* Phone Notch */}
            <div className="w-32 h-4 bg-slate-900 rounded-full mx-auto mb-4 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-slate-800" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
            </div>

            {/* Time & Lock Header */}
            <div className="text-center space-y-1 mb-4">
              <div className="flex items-center justify-center space-x-1 text-slate-400 text-[10px]">
                <Lock className="w-3 h-3 text-amber-400" />
                <span className="font-semibold text-amber-400 uppercase tracking-wider">EMERGENCY SOS MODE</span>
              </div>
              <div className="text-3xl font-black text-white font-mono tracking-tight">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>

            {/* Emergency Header Card */}
            <div className="bg-gradient-to-br from-red-600 to-red-900 rounded-2xl p-4 text-white shadow-lg space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-mono font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  DRIVER MEDICAL PASSPORT
                </span>
                <span className="text-xs font-mono font-bold bg-white text-red-900 px-2 py-0.5 rounded-md">
                  {profileData?.driver?.bloodGroup || 'O+'} POSITIVE
                </span>
              </div>

              <div className="flex items-center space-x-3 pt-1">
                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-lg">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    {profileData?.driver?.name || 'Rahul Sharma'}
                  </h3>
                  <p className="text-[11px] text-red-100 font-mono">
                    Plate: {selectedVehicleNumber}
                  </p>
                  <div className="flex items-center space-x-2 mt-0.5 text-[10px] text-red-200">
                    <span>Organ Donor: {profileData?.driver?.organDonor ? 'Yes' : 'No'}</span>
                    <span>&bull;</span>
                    <span>DOB: 1992-05-14</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Critical Medical Conditions */}
            <div className="space-y-2 mb-3">
              <div className="bg-slate-900/90 border border-red-900/40 rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex items-center space-x-1.5 text-red-400 font-bold text-[10px] uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <span>Allergies & Severe Hazards</span>
                </div>
                <p className="text-slate-200 font-semibold text-[11px]">
                  {profileData?.driver?.allergies || 'Penicillin, Dust Mites'}
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex items-center space-x-1.5 text-amber-400 font-bold text-[10px] uppercase tracking-wider">
                  <Heart className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Chronic Conditions</span>
                </div>
                <p className="text-slate-200 text-[11px]">
                  {profileData?.driver?.medicalConditions || 'Diabetic (Type 2)'}
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex items-center space-x-1.5 text-sky-400 font-bold text-[10px] uppercase tracking-wider">
                  <Pill className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                  <span>Active Medications</span>
                </div>
                <p className="text-slate-200 text-[11px]">
                  {profileData?.driver?.medications || 'Metformin 500mg, Aspirin 75mg'}
                </p>
              </div>
            </div>

            {/* Direct Tap-to-Call Emergency Contacts */}
            <div className="space-y-1.5 mb-3">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block px-1">
                Tap to Call Emergency Contacts (No PIN Needed)
              </span>

              {profileData?.driver?.emergencyContacts?.map((c: EmergencyContact, idx: number) => (
                <a
                  key={idx}
                  href={`tel:${c.phone}`}
                  className="flex items-center justify-between p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs transition group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                      <PhoneCall className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-[11px] flex items-center space-x-1">
                        <span>{c.name}</span>
                        {c.isPriority && (
                          <span className="text-[8px] bg-red-500/20 text-red-400 px-1 rounded uppercase">
                            Primary
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{c.relationship} &bull; {c.phone}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 group-hover:underline">CALL NOW</span>
                </a>
              ))}
            </div>

            {/* Hotlines Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <a
                href="tel:108"
                className="p-2.5 bg-red-950/40 border border-red-700/60 rounded-xl text-center flex flex-col items-center justify-center text-red-300 hover:bg-red-900/40 transition"
              >
                <Ambulance className="w-4 h-4 text-red-400 mb-0.5" />
                <span className="font-bold text-xs">Call Ambulance</span>
                <span className="text-[9px] font-mono text-red-400">Dial 108</span>
              </a>

              <a
                href="tel:112"
                className="p-2.5 bg-blue-950/40 border border-blue-700/60 rounded-xl text-center flex flex-col items-center justify-center text-blue-300 hover:bg-blue-900/40 transition"
              >
                <ShieldAlert className="w-4 h-4 text-blue-400 mb-0.5" />
                <span className="font-bold text-xs">Call Police</span>
                <span className="text-[9px] font-mono text-blue-400">Dial 112</span>
              </a>
            </div>

            {/* QR Code Action Button */}
            <button
              onClick={() => setShowQrModal(true)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition border border-slate-700"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Scan Paramedic FHIR QR Code</span>
            </button>
          </div>
        </div>

        {/* Right Column: Profile Editor / Detailed Medical Record */}
        <div className="lg:col-span-7 space-y-6">
          {editing ? (
            /* Editing Form */
            <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <h3 className="font-bold text-white text-base flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Update Emergency Medical Passport</span>
                </h3>
                <span className="text-xs text-slate-400">Vehicle: {selectedVehicleNumber}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-red-500"
                  >
                    <option value="A+">A+ (A Positive)</option>
                    <option value="A-">A- (A Negative)</option>
                    <option value="B+">B+ (B Positive)</option>
                    <option value="B-">B- (B Negative)</option>
                    <option value="O+">O+ (O Positive)</option>
                    <option value="O-">O- (O Negative)</option>
                    <option value="AB+">AB+ (AB Positive)</option>
                    <option value="AB-">AB- (AB Negative)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Organ Donor Registration</label>
                  <select
                    value={formData.organDonor ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, organDonor: e.target.value === 'true' })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-red-500"
                  >
                    <option value="true">Registered Organ Donor</option>
                    <option value="false">Not Registered</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Critical Drug Allergies & Environmental Hazards</label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="e.g. Penicillin, Latex, NSAIDs, Sulfa"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Chronic Medical Conditions</label>
                <input
                  type="text"
                  value={formData.medicalConditions}
                  onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                  placeholder="e.g. Diabetic (Type 2), Asthma, Pacemaker, Epilepsy"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Daily Medications & Dosages</label>
                <input
                  type="text"
                  value={formData.medications}
                  onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                  placeholder="e.g. Metformin 500mg, Salbutamol Inhaler, Aspirin"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-red-500"
                />
              </div>

              {/* Emergency Contacts List Editor */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-400 font-bold uppercase font-mono">Emergency Contacts List</label>
                  <button
                    type="button"
                    onClick={addContact}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold"
                  >
                    + Add Another Contact
                  </button>
                </div>

                {formData.emergencyContacts.map((contact, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        value={contact.name}
                        onChange={(e) => handleContactChange(idx, 'name', e.target.value)}
                        placeholder="Name"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        value={contact.relationship}
                        onChange={(e) => handleContactChange(idx, 'relationship', e.target.value)}
                        placeholder="Relation"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        value={contact.phone}
                        onChange={(e) => handleContactChange(idx, 'phone', e.target.value)}
                        placeholder="+91..."
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div className="sm:col-span-1 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeContact(idx)}
                        className="text-red-400 hover:text-red-300 text-xs font-bold"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-red-600/30"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Medical Passport</span>
                </button>
              </div>
            </form>
          ) : (
            /* Information & Protocols View */
            <div className="space-y-6">
              {/* Card 1: Medical Triage Protocol */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      Good Samaritan Incident Protocols (India / International)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Legal and medical guidelines for helping road accident victims.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <strong className="text-white block">1. Check Airway & Breathing</strong>
                    <span>Ensure cervical spine is stabilized if rider had high G-Force trauma. Do not remove helmet abruptly.</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <strong className="text-white block">2. Share Blood Group with 108</strong>
                    <span>Inform dispatch that driver is <strong className="text-red-400">{profileData?.driver?.bloodGroup || 'O+'}</strong> to prepare cross-matched blood packets before hospital arrival.</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <strong className="text-white block">3. Watch for Drug Allergies</strong>
                    <span>Alert medical team if driver is allergic to <strong className="text-amber-400">{profileData?.driver?.allergies || 'Penicillin'}</strong>.</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <strong className="text-white block">4. Good Samaritan Protection</strong>
                    <span>Under Section 134A of MV Act, bystanders rendering emergency aid are free from civil or criminal liability.</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Incident GPS & Live Tracking */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">
                        Incident Coordinates & Live Location
                      </h3>
                      <p className="text-xs text-slate-400">
                        Accident GPS transmitted from SIM800L / GPS Telemetry unit.
                      </p>
                    </div>
                  </div>

                  <a
                    href={`https://maps.google.com/?q=${profileData?.latestLocation?.latitude || 28.6139},${profileData?.latestLocation?.longitude || 77.2090}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
                  >
                    <span>Open in Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 block">Latitude / Longitude</span>
                    <span className="text-white font-bold">
                      {profileData?.latestLocation?.latitude?.toFixed(4) || '28.6139'}, {profileData?.latestLocation?.longitude?.toFixed(4) || '77.2090'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 block">Location Name</span>
                    <span className="text-slate-300">
                      {profileData?.latestLocation?.locationName || 'Live GPS Coordinates'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 block">Last Ping</span>
                    <span className="text-slate-400">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Paramedic FHIR QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-amber-400" />
                <span>Paramedic FHIR Medical QR</span>
              </h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-4 space-y-3 bg-white p-6 rounded-2xl">
              {/* Simulated QR Code using Canvas/SVG */}
              <div className="w-48 h-48 bg-slate-900 rounded-xl flex items-center justify-center relative p-3">
                <div className="grid grid-cols-6 grid-rows-6 gap-1 w-full h-full">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-sm ${
                        (i % 2 === 0 || i % 7 === 0 || i < 6 || i > 30) ? 'bg-white' : 'bg-slate-900'
                      }`}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-red-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow">
                    TRIDENT ICE
                  </div>
                </div>
              </div>

              <div className="text-center text-slate-800 text-xs">
                <strong className="block font-bold">Scan with Hospital / Paramedic Terminal</strong>
                <span className="text-[10px] text-slate-600 font-mono">FHIR Record ID: TRIDENT-{selectedVehicleNumber}</span>
              </div>
            </div>

            <pre className="p-3 bg-slate-950 rounded-xl text-[10px] font-mono text-slate-400 overflow-x-auto max-h-32 border border-slate-800">
              {JSON.stringify(
                {
                  resourceType: 'Patient',
                  identifier: [{ system: 'urn:trident:vehicle', value: selectedVehicleNumber }],
                  name: [{ text: profileData?.driver?.name }],
                  bloodGroup: profileData?.driver?.bloodGroup,
                  allergies: profileData?.driver?.allergies,
                  conditions: profileData?.driver?.medicalConditions,
                  contacts: profileData?.driver?.emergencyContacts,
                },
                null,
                2
              )}
            </pre>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
