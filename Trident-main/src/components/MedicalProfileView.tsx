import React, { useState } from 'react';
import { 
  HeartPulse, 
  ShieldAlert, 
  FileText, 
  Printer, 
  CheckCircle2, 
  AlertOctagon,
  User,
  Phone
} from 'lucide-react';
import { MedicalProfileData } from '../types';

interface MedicalProfileViewProps {
  initialProfile?: MedicalProfileData;
  userName?: string;
  userPhone?: string;
  onSaveProfile: (profile: MedicalProfileData) => void;
}

export const MedicalProfileView: React.FC<MedicalProfileViewProps> = ({
  initialProfile,
  userName = 'John Doe',
  userPhone = '+91 98765 43210',
  onSaveProfile
}) => {
  const [profile, setProfile] = useState<MedicalProfileData>(initialProfile || {
    bloodGroup: 'O+',
    allergies: 'Penicillin, Aspirin',
    chronicConditions: 'Mild Asthma',
    medications: 'Salbutamol Inhaler (as needed)',
    emergencyInstructions: 'Carry inhaler in front glove compartment. Penicillin allergy.',
    organDonor: true,
    emergencyDoctorName: 'Dr. Robert Vance (Cardiologist)',
    emergencyDoctorPhone: '+91 98111 22334',
    insuranceProvider: 'Star Health Premier',
    insurancePolicyNumber: 'SH-2026-998812'
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(profile);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Driver Emergency Medical Profile (ICE)</h1>
          <p className="text-sm text-slate-500">
            Vital health information transmitted directly to paramedics and trauma hospitals upon crash confirmation.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 shadow-xs"
        >
          <Printer className="w-4 h-4" />
          Print ICE Card
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medical Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={profile.bloodGroup}
                  onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 bg-white font-bold text-rose-700"
                >
                  <option value="A+">A Positive (A+)</option>
                  <option value="A-">A Negative (A-)</option>
                  <option value="B+">B Positive (B+)</option>
                  <option value="B-">B Negative (B-)</option>
                  <option value="AB+">AB Positive (AB+)</option>
                  <option value="AB-">AB Negative (AB-)</option>
                  <option value="O+">O Positive (O+)</option>
                  <option value="O-">O Negative (O-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Organ Donor Registry</label>
                <select
                  value={profile.organDonor ? 'true' : 'false'}
                  onChange={(e) => setProfile({ ...profile, organDonor: e.target.value === 'true' })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  <option value="true">YES — Registered Organ Donor</option>
                  <option value="false">NO — Not Registered</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Known Drug / Food Allergies</label>
              <input
                type="text"
                value={profile.allergies || ''}
                onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                placeholder="e.g. Penicillin, Sulfa drugs, Peanuts"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Chronic Medical Conditions</label>
              <input
                type="text"
                value={profile.chronicConditions || ''}
                onChange={(e) => setProfile({ ...profile, chronicConditions: e.target.value })}
                placeholder="e.g. Diabetes Type 2, Hypertension, Asthma"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Daily Medications</label>
              <input
                type="text"
                value={profile.medications || ''}
                onChange={(e) => setProfile({ ...profile, medications: e.target.value })}
                placeholder="e.g. Metformin 500mg, Inhaler"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Emergency First Responder Instructions</label>
              <textarea
                rows={2}
                value={profile.emergencyInstructions || ''}
                onChange={(e) => setProfile({ ...profile, emergencyInstructions: e.target.value })}
                placeholder="Specific instructions for EMTs and doctors during trauma care..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Care Physician</label>
                <input
                  type="text"
                  value={profile.emergencyDoctorName || ''}
                  onChange={(e) => setProfile({ ...profile, emergencyDoctorName: e.target.value })}
                  placeholder="Doctor Name"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Contact Phone</label>
                <input
                  type="tel"
                  value={profile.emergencyDoctorPhone || ''}
                  onChange={(e) => setProfile({ ...profile, emergencyDoctorPhone: e.target.value })}
                  placeholder="+91 Doctor Phone"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              {isSaved ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Medical record updated & synced to emergency server!
                </div>
              ) : <div />}

              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                Save Medical Profile
              </button>
            </div>
          </form>
        </div>

        {/* Printable ICE Emergency Card Preview */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              ICE Emergency Card Preview
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              TRAUMA CARD
            </span>
          </div>

          <div className="p-4 rounded-xl border-2 border-dashed border-rose-200 bg-rose-50/50 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500">Driver Name</p>
                <h3 className="text-base font-bold text-slate-900">{userName}</h3>
                <p className="text-xs text-slate-600 font-mono">{userPhone}</p>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-center">
                <span className="text-[10px] block uppercase font-bold tracking-wider">Blood</span>
                <span className="text-xl font-extrabold">{profile.bloodGroup}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between border-t border-rose-100 pt-1.5">
                <span className="text-slate-500">Allergies:</span>
                <span className="font-semibold text-rose-900">{profile.allergies || 'None'}</span>
              </div>
              <div className="flex justify-between border-t border-rose-100 pt-1.5">
                <span className="text-slate-500">Conditions:</span>
                <span className="font-semibold text-slate-800">{profile.chronicConditions || 'None'}</span>
              </div>
              <div className="flex justify-between border-t border-rose-100 pt-1.5">
                <span className="text-slate-500">Organ Donor:</span>
                <span className="font-semibold text-emerald-700">{profile.organDonor ? 'YES' : 'NO'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-rose-200 text-[11px] text-slate-600 italic">
              "{profile.emergencyInstructions}"
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            This card is automatically formatted for first responder paramedic scanning.
          </p>
        </div>
      </div>
    </div>
  );
};
