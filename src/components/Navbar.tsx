import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Users, 
  HeartPulse, 
  History, 
  Cpu, 
  BarChart3, 
  MessageSquareText, 
  Camera, 
  SlidersHorizontal,
  LogOut,
  User as UserIcon,
  Play
} from 'lucide-react';
import { User, SystemHealthStatus } from '../types';

export type NavTabType = 
  | 'dashboard' 
  | 'telemetry' 
  | 'contacts' 
  | 'medical' 
  | 'history' 
  | 'hardware' 
  | 'analytics' 
  | 'messages' 
  | 'vision' 
  | 'settings';

interface NavbarProps {
  activeTab: NavTabType;
  onSelectTab: (tab: NavTabType) => void;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenSimulator: () => void;
  systemHealth: SystemHealthStatus;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  user,
  onOpenAuth,
  onLogout,
  onOpenSimulator,
  systemHealth
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Meta Bar with Demo Banner & Quick Status */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-1 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Active
          </span>

          <span className="text-slate-500 hidden sm:inline">
            Device: <strong className="text-slate-700 font-mono">ESP32_001</strong>
          </span>

          <span className="text-slate-500 hidden md:inline">
            Signal: <strong className="text-slate-700">{systemHealth.csqSignal}/31 CSQ</strong>
          </span>

          <span className="text-slate-500 hidden lg:inline">
            Battery: <strong className="text-slate-700">{systemHealth.batteryLevel}%</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {systemHealth.demoMode && (
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium text-[11px] border border-amber-200">
              Demo Mode Active (Safe Simulation)
            </span>
          )}

          <button
            onClick={onOpenSimulator}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Play className="w-3 h-3 text-rose-400" />
            Simulate Event
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-slate-900">SafeRide</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-50 text-rose-700 rounded border border-rose-200">AI</span>
              </div>
              <p className="text-xs text-slate-500 leading-none">Accident Detection & Emergency Response</p>
            </div>
          </div>

          {/* Nav Items (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-600" />
              Dashboard
            </button>

            <button
              onClick={() => onSelectTab('telemetry')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'telemetry'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-4 h-4 text-slate-600" />
              Live Telemetry
            </button>

            <button
              onClick={() => onSelectTab('contacts')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'contacts'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 text-slate-600" />
              Emergency Contacts
            </button>

            <button
              onClick={() => onSelectTab('medical')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'medical'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <HeartPulse className="w-4 h-4 text-rose-600" />
              Medical Profile
            </button>

            <button
              onClick={() => onSelectTab('history')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <History className="w-4 h-4 text-slate-600" />
              Accident History
            </button>

            <button
              onClick={() => onSelectTab('hardware')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'hardware'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Cpu className="w-4 h-4 text-slate-600" />
              Hardware Studio
            </button>

            <button
              onClick={() => onSelectTab('analytics')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-slate-600" />
              Analytics
            </button>

            <button
              onClick={() => onSelectTab('messages')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'messages'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MessageSquareText className="w-4 h-4 text-slate-600" />
              SMS Logs
            </button>

            <button
              onClick={() => onSelectTab('vision')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'vision'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Camera className="w-4 h-4 text-slate-600" />
              AI Vision
            </button>
          </nav>

          {/* User Account / Auth */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
                  <p className="text-[11px] text-slate-500 leading-tight">{user.phone}</p>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                <UserIcon className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Scrollbar */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto py-2 border-t border-slate-100 text-xs">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Activity },
            { id: 'telemetry', label: 'Telemetry', icon: Activity },
            { id: 'contacts', label: 'Contacts', icon: Users },
            { id: 'medical', label: 'Medical', icon: HeartPulse },
            { id: 'history', label: 'History', icon: History },
            { id: 'hardware', label: 'Hardware', icon: Cpu },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'messages', label: 'SMS Logs', icon: MessageSquareText },
            { id: 'vision', label: 'Vision', icon: Camera }
          ].map((item) => {
            const Icon = item.icon;
            const isSel = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id as NavTabType)}
                className={`whitespace-nowrap px-2.5 py-1.5 rounded-md font-medium flex items-center gap-1 transition-colors ${
                  isSel ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
