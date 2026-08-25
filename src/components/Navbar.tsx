import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Video, 
  Truck, 
  BarChart3, 
  MessageSquareText, 
  User as UserIcon,
  Radio,
  Zap,
  Cpu,
  Lock,
  PhoneCall
} from 'lucide-react';
import { User } from '../types';

export type NavTabType = 'alerts' | 'hardware' | 'lockscreen' | 'vision' | 'fleet' | 'analytics' | 'sms';

interface NavbarProps {
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
  pendingAlertsCount: number;
  user: User | null;
  onOpenAuth: () => void;
  onOpenSimulator: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingAlertsCount,
  user,
  onOpenAuth,
  onOpenSimulator,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('alerts')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">TRIDENT</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800/60 font-mono font-semibold">
                  ESP32 &bull; SIM800L
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Hardware Crash Response & Medical Telemetry
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 overflow-x-auto py-1">
            <button
              id="nav-tab-alerts"
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'alerts'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Triage Alerts</span>
              {pendingAlertsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-white text-red-700 animate-pulse">
                  {pendingAlertsCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-hardware"
              onClick={() => setActiveTab('hardware')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'hardware'
                  ? 'bg-amber-600 text-slate-950 shadow-md shadow-amber-600/30 font-bold'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-800'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Hardware & IoT Lab</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </button>

            <button
              id="nav-tab-lockscreen"
              onClick={() => setActiveTab('lockscreen')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'lockscreen'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-red-400" />
              <span>ICE Passport</span>
            </button>

            <button
              id="nav-tab-vision"
              onClick={() => setActiveTab('vision')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'vision'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Vision Feed</span>
            </button>

            <button
              id="nav-tab-fleet"
              onClick={() => setActiveTab('fleet')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'fleet'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Fleet</span>
            </button>

            <button
              id="nav-tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Analytics</span>
            </button>

            <button
              id="nav-tab-sms"
              onClick={() => setActiveTab('sms')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'sms'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MessageSquareText className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Dispatches</span>
            </button>
          </nav>

          {/* Quick Actions & Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              id="btn-simulate-crash"
              onClick={onOpenSimulator}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition"
              title="Test crash telemetry ingestion"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simulate Crash</span>
            </button>

            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-slate-200">{user.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{user.role}</p>
                </div>
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                id="btn-login-modal"
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

