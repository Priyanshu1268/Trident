import React, { useState } from 'react';
import { 
  Truck, 
  Car, 
  Bike, 
  Ambulance, 
  Plus, 
  Search, 
  History, 
  Phone, 
  Shield, 
  User, 
  Check, 
  AlertTriangle,
  X,
  QrCode,
  HeartPulse
} from 'lucide-react';
import { Vehicle, CrashAlert, VehicleType } from '../types';

interface VehicleFleetViewProps {
  vehicles: Vehicle[];
  onRegisterVehicle: (data: Partial<Vehicle>) => Promise<void>;
  onFetchVehicleHistory: (vehicleNumber: string) => Promise<CrashAlert[]>;
}

export const VehicleFleetView: React.FC<VehicleFleetViewProps> = ({
  vehicles,
  onRegisterVehicle,
  onFetchVehicleHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedHistoryVehicle, setSelectedHistoryVehicle] = useState<string | null>(null);
  const [vehicleHistory, setVehicleHistory] = useState<CrashAlert[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Form State
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [owner, setOwner] = useState<string>('');
  const [emergencyPhone, setEmergencyPhone] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('CAR');
  const [modelName, setModelName] = useState<string>('');
  const [bloodGroup, setBloodGroup] = useState<string>('O+');
  const [medicalConditions, setMedicalConditions] = useState<string>('None Recorded');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const filteredVehicles = vehicles.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      v.vehicleNumber.toLowerCase().includes(q) ||
      v.owner.toLowerCase().includes(q) ||
      (v.modelName && v.modelName.toLowerCase().includes(q))
    );
  });

  const handleOpenHistory = async (vNumber: string) => {
    setSelectedHistoryVehicle(vNumber);
    setLoadingHistory(true);
    try {
      const history = await onFetchVehicleHistory(vNumber);
      setVehicleHistory(history);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) return;

    setSubmitting(true);
    try {
      await onRegisterVehicle({
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        owner: owner.trim() || 'Registered Driver',
        emergencyContactPhone: emergencyPhone.trim() || '+918757882039',
        vehicleType: vehicleType,
        modelName: modelName.trim() || 'Connected Vehicle',
        driver: {
          id: Date.now(),
          name: owner.trim() || 'Primary Driver',
          phone: emergencyPhone.trim() || '+918757882039',
          bloodGroup: bloodGroup,
          medicalConditions: medicalConditions,
          role: 'DRIVER',
          email: `${vehicleNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}@driver.trident.io`,
          createdAt: new Date().toISOString(),
        },
      });

      // Reset form
      setVehicleNumber('');
      setOwner('');
      setEmergencyPhone('');
      setModelName('');
      setShowAddModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const getVehicleIcon = (type: VehicleType) => {
    switch (type) {
      case 'BIKE':
        return <Bike className="w-5 h-5 text-amber-400" />;
      case 'AMBULANCE':
        return <Ambulance className="w-5 h-5 text-red-400" />;
      case 'TRUCK':
        return <Truck className="w-5 h-5 text-indigo-400" />;
      default:
        return <Car className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-red-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Connected Vehicle Fleet & Driver Registry</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time IoT registered vehicles, emergency contact bindings, and medical records.
          </p>
        </div>

        <button
          id="btn-add-vehicle"
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg shadow-red-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Vehicle</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          id="search-vehicles"
          type="text"
          placeholder="Filter by vehicle registration plate, owner, or vehicle model..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-900 text-slate-200 placeholder-slate-500 rounded-xl border border-slate-800 text-sm focus:outline-none focus:border-red-500"
        />
      </div>

      {/* Fleet Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono uppercase">
              <tr>
                <th className="py-3.5 px-4">Vehicle / Model</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Owner / Driver</th>
                <th className="py-3.5 px-4">Medical Passport</th>
                <th className="py-3.5 px-4">Emergency Contact</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredVehicles.map((v) => (
                <tr key={v.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-800">
                        {getVehicleIcon(v.vehicleType)}
                      </div>
                      <div>
                        <span className="font-mono font-bold text-slate-100 text-sm">{v.vehicleNumber}</span>
                        <p className="text-[11px] text-slate-400">{v.modelName || 'Standard Fleet Unit'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-semibold">
                      {v.vehicleType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200">{v.owner}</div>
                    <div className="text-[11px] text-slate-400">{v.driver?.email || 'N/A'}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 font-mono font-bold border border-red-900 text-[10px]">
                        {v.driver?.bloodGroup || 'O+'}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate max-w-xs block">
                        {v.driver?.medicalConditions || 'No conditions'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-slate-300 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      {v.emergencyContactPhone}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center space-x-1.5">
                      <a
                        href={`/?view=passport&vehicle=${encodeURIComponent(v.vehicleNumber)}#passport`}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold border border-rose-500 inline-flex items-center gap-1 transition shadow-xs"
                      >
                        <QrCode className="w-3 h-3" />
                        <span>Medical QR</span>
                      </a>
                      <button
                        id={`btn-view-history-${v.vehicleNumber}`}
                        onClick={() => handleOpenHistory(v.vehicleNumber)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 inline-flex items-center gap-1 transition"
                      >
                        <History className="w-3 h-3" />
                        <span>Crash History</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal / Drawer */}
      {selectedHistoryVehicle && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-lg text-white font-mono">
                  Telemetry & Crash History: {selectedHistoryVehicle}
                </h3>
              </div>
              <button
                onClick={() => setSelectedHistoryVehicle(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-8 text-center text-slate-400 text-sm font-mono animate-pulse">
                Loading telemetry logs from database...
              </div>
            ) : vehicleHistory.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                No recorded crash alerts or violations for vehicle {selectedHistoryVehicle}.
              </div>
            ) : (
              <div className="space-y-3">
                {vehicleHistory.map((h) => (
                  <div key={h.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                            h.severity === 'HIGH'
                              ? 'bg-red-500/20 text-red-300'
                              : h.severity === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {h.severity} SEVERITY
                        </span>
                        <span className="text-slate-400 font-mono">{new Date(h.timestamp).toLocaleString()}</span>
                      </div>
                      <span className="font-semibold text-slate-300">{h.status.replace('_', ' ')}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-500">G-Force:</span>{' '}
                        <span className="font-mono font-bold text-slate-200">{h.gForce}g</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Speed:</span>{' '}
                        <span className="font-mono font-bold text-slate-200">{h.impactSpeed} km/h</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Response Time:</span>{' '}
                        <span className="font-mono font-bold text-slate-200">
                          {h.responseTimeMinutes ? `${h.responseTimeMinutes}m` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-400 italic text-[11px]">{h.notes}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-lg text-white">Register Connected Vehicle</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Vehicle License Plate *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KA-02-TR-8899"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-700 font-mono uppercase focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                    className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-700 focus:outline-none focus:border-red-500"
                  >
                    <option value="CAR">Car / Passenger</option>
                    <option value="BIKE">Motorcycle / Two-Wheeler</option>
                    <option value="TRUCK">Heavy Logistics Truck</option>
                    <option value="AMBULANCE">Emergency Ambulance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Owner / Driver Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Malhotra"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-700 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Vehicle Model & Trim</label>
                  <input
                    type="text"
                    placeholder="e.g. Hyundai Creta SX"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-700 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Emergency Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +919876543210"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-700 font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Driver Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-700 font-mono focus:outline-none focus:border-red-500"
                  >
                    <option value="O+">O Positive (O+)</option>
                    <option value="O-">O Negative (O-)</option>
                    <option value="A+">A Positive (A+)</option>
                    <option value="A-">A Negative (A-)</option>
                    <option value="B+">B Positive (B+)</option>
                    <option value="B-">B Negative (B-)</option>
                    <option value="AB+">AB Positive (AB+)</option>
                    <option value="AB-">AB Negative (AB-)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Medical Conditions & Allergies</label>
                <input
                  type="text"
                  placeholder="e.g. Hypertension, Penicillin Allergy, Pacemaker"
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-700 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-md shadow-red-600/30"
                >
                  {submitting ? 'Registering...' : 'Save & Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
