import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Lock, 
  Mail, 
  Phone, 
  HeartHandshake, 
  X, 
  Check, 
  ShieldCheck 
} from 'lucide-react';
import { User, UserRole } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
  const [isSignup, setIsSignup] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('driver.rahul@example.com');
  const [password, setPassword] = useState<string>('password123');
  const [name, setName] = useState<string>('Rahul Sharma');
  const [phone, setPhone] = useState<string>('+919876543210');
  const [bloodGroup, setBloodGroup] = useState<string>('O+');
  const [medicalConditions, setMedicalConditions] = useState<string>('Diabetic, Penicillin Allergy');
  const [secondaryContact, setSecondaryContact] = useState<string>('+919811223344 (Father)');
  const [role, setRole] = useState<UserRole>('DRIVER');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isSignup ? '/api/v1/auth/signup' : '/api/v1/auth/login';
    const payload = isSignup
      ? { email, password, name, phone, bloodGroup, medicalConditions, secondaryEmergencyContact: secondaryContact, role }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.user, data.token || data.accessToken);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-lg text-white">
              {isSignup ? 'Create Driver / Responder Account' : 'Driver & Staff Sign In'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-lg text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {isSignup && (
            <div>
              <label className="text-slate-400 font-medium block mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="Ada Lovelace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-700 focus:outline-none focus:border-red-500"
              />
            </div>
          )}

          <div>
            <label className="text-slate-400 font-medium block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-700 font-mono focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-medium block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-700 font-mono focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {isSignup && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-700 focus:outline-none focus:border-red-500"
                  >
                    <option value="DRIVER">Driver</option>
                    <option value="HOSPITAL">Hospital Base</option>
                    <option value="RESPONDER">First Responder</option>
                    <option value="ADMIN">System Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-700 font-mono focus:outline-none focus:border-red-500"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Primary Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-700 font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Medical Conditions / Allergies</label>
                <input
                  type="text"
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-100 rounded-lg border border-slate-700 focus:outline-none focus:border-red-500"
                />
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition shadow-md shadow-red-600/30 text-xs"
            >
              {loading ? 'Authenticating...' : isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError(null);
              }}
              className="text-slate-400 hover:text-white text-xs underline underline-offset-4"
            >
              {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Register as Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
