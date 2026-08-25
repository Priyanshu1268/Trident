import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, NavTabType } from './components/Navbar';
import { AlertsCommandCenter } from './components/AlertsCommandCenter';
import { VisionSafetyMonitor } from './components/VisionSafetyMonitor';
import { VehicleFleetView } from './components/VehicleFleetView';
import { AnalyticsView } from './components/AnalyticsView';
import { SmsLogsView } from './components/SmsLogsView';
import { HardwareStudioView } from './components/HardwareStudioView';
import { EmergencyLockScreenView } from './components/EmergencyLockScreenView';
import { CrashConfirmationModal } from './components/CrashConfirmationModal';
import { TelemetrySimulatorModal } from './components/TelemetrySimulatorModal';
import { AuthModal } from './components/AuthModal';
import { 
  CrashAlert, 
  Vehicle, 
  AnalyticsSummary, 
  EmergencySmsLog, 
  User, 
  AlertStatus, 
  TelemetryRequest,
  HardwareTelemetry
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTabType>('alerts');
  const [alerts, setAlerts] = useState<CrashAlert[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [smsLogs, setSmsLogs] = useState<EmergencySmsLog[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showSimulatorModal, setShowSimulatorModal] = useState<boolean>(false);
  const [emergencyToast, setEmergencyToast] = useState<CrashAlert | null>(null);
  const [activeConfirmationAlert, setActiveConfirmationAlert] = useState<CrashAlert | null>(null);
  const [liveHardwareTelemetry, setLiveHardwareTelemetry] = useState<HardwareTelemetry | null>(null);

  // Fetch all initial state from backend
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  }, []);

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/vehicles');
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/analytics/summary');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  }, []);

  const fetchSmsLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/sms/logs');
      if (res.ok) {
        const data = await res.json();
        setSmsLogs(data);
      }
    } catch (err) {
      console.error('Error fetching SMS logs:', err);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchAlerts();
    fetchVehicles();
    fetchAnalytics();
    fetchSmsLogs();

    // Check localStorage for saved auth
    const savedToken = localStorage.getItem('trident_token');
    const savedUser = localStorage.getItem('trident_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('trident_token');
        localStorage.removeItem('trident_user');
      }
    }
  }, [fetchAlerts, fetchVehicles, fetchAnalytics, fetchSmsLogs]);

  // Connect to Live Server-Sent Events (SSE) Stream
  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.addEventListener('new_alert', (event) => {
      try {
        const newAlert = JSON.parse(event.data);
        setAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)]);
        fetchAnalytics();
        fetchSmsLogs();

        if (newAlert.severity === 'HIGH' && newAlert.status !== 'CONFIRMATION_COUNTDOWN') {
          setEmergencyToast(newAlert);
          setTimeout(() => setEmergencyToast(null), 6000);
        }
      } catch (e) {
        console.error('SSE new_alert parse error:', e);
      }
    });

    eventSource.addEventListener('crash_countdown_started', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.alert) {
          setActiveConfirmationAlert(data.alert);
        }
      } catch (e) {
        console.error('SSE crash_countdown_started error:', e);
      }
    });

    eventSource.addEventListener('crash_cancelled', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (activeConfirmationAlert && activeConfirmationAlert.id === data.alertId) {
          setActiveConfirmationAlert(null);
        }
        fetchAlerts();
        fetchAnalytics();
      } catch (e) {
        console.error('SSE crash_cancelled error:', e);
      }
    });

    eventSource.addEventListener('crash_escalated', (event) => {
      try {
        const data = JSON.parse(event.data);
        setActiveConfirmationAlert(null);
        fetchAlerts();
        fetchAnalytics();
        fetchSmsLogs();
        if (data.alert) {
          setEmergencyToast(data.alert);
          setTimeout(() => setEmergencyToast(null), 7000);
        }
      } catch (e) {
        console.error('SSE crash_escalated error:', e);
      }
    });

    eventSource.addEventListener('telemetry_stream', (event) => {
      try {
        const data = JSON.parse(event.data);
        setLiveHardwareTelemetry(data);
      } catch (e) {
        console.error('SSE telemetry_stream error:', e);
      }
    });

    eventSource.addEventListener('alert_updated', (event) => {
      try {
        const updatedAlert = JSON.parse(event.data);
        setAlerts((prev) => prev.map((a) => (a.id === updatedAlert.id ? updatedAlert : a)));
        fetchAnalytics();
      } catch (e) {
        console.error('SSE alert_updated parse error:', e);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [fetchAlerts, fetchAnalytics, fetchSmsLogs, activeConfirmationAlert]);

  // Alert Actions
  const handleUpdateAlertStatus = async (alertId: number, status: AlertStatus, notes?: string) => {
    try {
      const res = await fetch(`/api/v1/alerts/${alertId}/respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Error updating alert status:', err);
    }
  };

  const handleTriggerPreset = async (scenario: string) => {
    try {
      const res = await fetch('/api/v1/alerts/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });
      if (res.ok) {
        const alert = await res.json();
        setAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);
        fetchAnalytics();
        fetchSmsLogs();
        if (alert.severity === 'HIGH') {
          setEmergencyToast(alert);
          setTimeout(() => setEmergencyToast(null), 6000);
        }
      }
    } catch (err) {
      console.error('Error triggering preset:', err);
    }
  };

  const handleSendTelemetry = async (data: TelemetryRequest) => {
    const res = await fetch('/api/v1/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error('Failed to send telemetry');
    }
    const alert = await res.json();
    setAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);
    fetchVehicles();
    fetchAnalytics();
    fetchSmsLogs();
    return alert;
  };

  const handleHardwareTelemetry = async (data: any) => {
    const res = await fetch('/api/v1/hardware/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error('Failed to send hardware telemetry');
    }
    const result = await res.json();
    fetchAnalytics();
    return result;
  };

  const handleCancelSafe = async (alertId: number, reason: string) => {
    try {
      const res = await fetch('/api/v1/hardware/timer-cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, reason }),
      });
      if (res.ok) {
        setActiveConfirmationAlert(null);
        fetchAlerts();
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Failed to cancel countdown', err);
    }
  };

  const handleExpireEscalate = async (alertId: number) => {
    try {
      const res = await fetch('/api/v1/hardware/timer-expire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });
      if (res.ok) {
        setActiveConfirmationAlert(null);
        fetchAlerts();
        fetchAnalytics();
        fetchSmsLogs();
      }
    } catch (err) {
      console.error('Failed to expire countdown', err);
    }
  };

  const handleRegisterVehicle = async (data: Partial<Vehicle>) => {
    const res = await fetch('/api/v1/vehicles/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to register vehicle');
    }
    const newVehicle = await res.json();
    setVehicles((prev) => [...prev, newVehicle]);
  };

  const handleFetchVehicleHistory = async (vehicleNumber: string) => {
    const res = await fetch(`/api/v1/analytics/history/${encodeURIComponent(vehicleNumber)}`);
    if (!res.ok) throw new Error('Failed to fetch vehicle crash history');
    return await res.json();
  };

  const handleLoginSuccess = (loggedInUser: User, jwtToken: string) => {
    setUser(loggedInUser);
    setToken(jwtToken);
    localStorage.setItem('trident_token', jwtToken);
    localStorage.setItem('trident_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('trident_token');
    localStorage.removeItem('trident_user');
  };

  const pendingAlertsCount = alerts.filter((a) => a.status === 'PENDING' || a.status === 'AMBULANCE_DISPATCHED' || a.status === 'CONFIRMATION_COUNTDOWN').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-red-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingAlertsCount={pendingAlertsCount}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenSimulator={() => setShowSimulatorModal(true)}
        onLogout={handleLogout}
      />

      {/* High Severity Emergency Alert Toast Banner */}
      {emergencyToast && (
        <div className="sticky top-16 z-40 bg-red-600 text-white px-4 py-3 shadow-2xl flex items-center justify-between animate-bounce">
          <div className="max-w-7xl mx-auto flex items-center space-x-3 w-full">
            <span className="p-1.5 bg-red-950 rounded-lg font-mono font-bold text-xs">CRITICAL SOS</span>
            <p className="text-xs sm:text-sm font-bold">
              High Severity Crash: {emergencyToast.vehicle?.vehicleNumber} ({emergencyToast.gForce}g impact). Automated calls and trauma ambulance dispatched!
            </p>
            <button
              onClick={() => {
                setActiveTab('alerts');
                setEmergencyToast(null);
              }}
              className="ml-auto px-3 py-1 bg-white text-red-700 rounded-lg text-xs font-extrabold hover:bg-slate-100"
            >
              View Triage
            </button>
          </div>
        </div>
      )}

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'alerts' && (
          <AlertsCommandCenter
            alerts={alerts}
            onUpdateStatus={handleUpdateAlertStatus}
            onTriggerPreset={handleTriggerPreset}
          />
        )}

        {activeTab === 'hardware' && (
          <HardwareStudioView
            onTriggerTelemetry={handleHardwareTelemetry}
            onTriggerCountdown={(alert) => setActiveConfirmationAlert(alert)}
            activeTelemetry={liveHardwareTelemetry}
          />
        )}

        {activeTab === 'lockscreen' && (
          <EmergencyLockScreenView
            currentVehicleNumber={vehicles[0]?.vehicleNumber || 'KA-01-AI-2026'}
            vehicles={vehicles}
          />
        )}

        {activeTab === 'vision' && (
          <VisionSafetyMonitor onSendTelemetry={handleSendTelemetry} />
        )}

        {activeTab === 'fleet' && (
          <VehicleFleetView
            vehicles={vehicles}
            onRegisterVehicle={handleRegisterVehicle}
            onFetchVehicleHistory={handleFetchVehicleHistory}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView analytics={analytics} />
        )}

        {activeTab === 'sms' && (
          <SmsLogsView logs={smsLogs} />
        )}
      </main>

      {/* Crash Confirmation Safety Countdown Modal */}
      {activeConfirmationAlert && (
        <CrashConfirmationModal
          alert={activeConfirmationAlert}
          totalSeconds={activeConfirmationAlert.confirmationCountdown || 20}
          onCancelSafe={handleCancelSafe}
          onExpireEscalate={handleExpireEscalate}
        />
      )}

      {/* Telemetry Simulator Modal */}
      {showSimulatorModal && (
        <TelemetrySimulatorModal
          vehicles={vehicles}
          onClose={() => setShowSimulatorModal(false)}
          onSendTelemetry={handleSendTelemetry}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-900/50 py-4 text-center text-xs text-slate-500 font-mono">
        TRIDENT EMERGENCY SAFETY PLATFORM &bull; ESP32 + MPU6050 + SIM800L HARDWARE ENGINE &bull; AI VISION &bull; REAL-TIME EMERGENCY DISPATCH
      </footer>
    </div>
  );
}

export default App;

