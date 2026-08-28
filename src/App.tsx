import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, NavTabType } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { SensorLiveView } from './components/SensorLiveView';
import { ContactsManagerView } from './components/ContactsManagerView';
import { MedicalProfileView } from './components/MedicalProfileView';
import { AccidentHistoryView } from './components/AccidentHistoryView';
import { HardwareStudioView } from './components/HardwareStudioView';
import { AnalyticsView } from './components/AnalyticsView';
import { SmsLogsView } from './components/SmsLogsView';
import { VisionSafetyMonitor } from './components/VisionSafetyMonitor';
import { VehicleFleetView } from './components/VehicleFleetView';
import { AlertsCommandCenter } from './components/AlertsCommandCenter';
import { EmergencyLockScreenView } from './components/EmergencyLockScreenView';
import { CrashConfirmationModal } from './components/CrashConfirmationModal';
import { TelemetrySimulatorModal } from './components/TelemetrySimulatorModal';
import { AuthModal } from './components/AuthModal';
import { 
  CrashAlert, 
  Vehicle, 
  AnalyticsSummary, 
  EmergencySmsLog, 
  EmergencyContact,
  MedicalProfileData,
  User, 
  AlertStatus, 
  TelemetryRequest,
  HardwareTelemetry,
  SystemHealthStatus
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTabType>('dashboard');
  const [alerts, setAlerts] = useState<CrashAlert[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: '1',
      vehicleNumber: 'KA-01-SR-2026',
      owner: 'John Doe',
      emergencyContactPhone: '+91 98765 43210',
      vehicleType: 'CAR',
      modelName: 'SafeRide Smart Vehicle',
      deviceId: 'ESP32-SAFERIDE-01'
    }
  ]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [smsLogs, setSmsLogs] = useState<EmergencySmsLog[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    {
      id: '1',
      name: 'Sarah Connor (Spouse)',
      phone: '+91 98765 43210',
      relationship: 'Spouse',
      priority: 'PRIMARY',
      notifyOnConfirmation: true
    },
    {
      id: '2',
      name: 'James Doe (Brother)',
      phone: '+91 98111 22334',
      relationship: 'Brother',
      priority: 'SECONDARY',
      notifyOnConfirmation: true
    },
    {
      id: '3',
      name: 'Apollo Trauma Hospital Emergency Desk',
      phone: '+91 11 2692 5858',
      relationship: 'Hospital EMS',
      priority: 'TERTIARY',
      notifyOnConfirmation: true
    }
  ]);
  const [medicalProfile, setMedicalProfile] = useState<MedicalProfileData>({
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

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showSimulatorModal, setShowSimulatorModal] = useState<boolean>(false);
  const [activeConfirmationAlert, setActiveConfirmationAlert] = useState<CrashAlert | null>(null);
  const [liveHardwareTelemetry, setLiveHardwareTelemetry] = useState<HardwareTelemetry | null>(null);

  // System Health state
  const [systemHealth, setSystemHealth] = useState<SystemHealthStatus>({
    deviceConnected: true,
    mpu6050Active: true,
    gsmAvailable: true,
    internetConnected: true,
    gpsAvailable: true,
    csqSignal: 28,
    batteryLevel: 94,
    demoMode: true,
    countdownDuration: 30
  });

  // Fetch initial data
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
        if (data && data.length > 0) setVehicles(data);
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

  // Initial Load & Auth check
  useEffect(() => {
    fetchAlerts();
    fetchVehicles();
    fetchAnalytics();
    fetchSmsLogs();

    const savedToken = localStorage.getItem('saferide_token');
    const savedUser = localStorage.getItem('saferide_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('saferide_token');
        localStorage.removeItem('saferide_user');
      }
    }
  }, [fetchAlerts, fetchVehicles, fetchAnalytics, fetchSmsLogs]);

  // Server-Sent Events (SSE) live updates
  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.addEventListener('new_alert', (event) => {
      try {
        const newAlert = JSON.parse(event.data);
        setAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)]);
        fetchAnalytics();
        fetchSmsLogs();
      } catch (e) {
        console.error('SSE new_alert error:', e);
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
        setActiveConfirmationAlert(null);
        fetchAlerts();
        fetchAnalytics();
        fetchSmsLogs();
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

    return () => {
      eventSource.close();
    };
  }, [fetchAlerts, fetchAnalytics, fetchSmsLogs, activeConfirmationAlert]);

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

  const handleCancelCountdown = async () => {
    if (!activeConfirmationAlert) return;
    try {
      await fetch('/api/v1/hardware/timer-cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: activeConfirmationAlert.id, reason: 'Driver cancelled false alarm in UI' }),
      });
      setActiveConfirmationAlert(null);
      fetchAlerts();
      fetchAnalytics();
    } catch (err) {
      console.error('Failed to cancel countdown', err);
    }
  };

  const handleTriggerTestCrashCountdown = async () => {
    try {
      const res = await fetch('/api/v1/hardware/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gForce: 5.2,
          pitch: 28,
          roll: 55,
          speed: 68,
          latitude: 28.6139,
          longitude: 77.2090,
          isEmergencyButtonPressed: false,
          source: 'TEST_CRASH_TRIGGER'
        })
      });
      const data = await res.json();
      if (data.alert) {
        setActiveConfirmationAlert(data.alert);
      } else {
        throw new Error('No alert in response');
      }
    } catch (e) {
      setActiveConfirmationAlert({
        id: Date.now(),
        vehicle: vehicles[0] || {
          id: 1,
          vehicleNumber: 'KA-01-SR-2026',
          owner: 'Primary Driver',
          emergencyContactPhone: '+918757882039',
          vehicleType: 'CAR',
          modelName: 'Connected Telemetry Vehicle',
          registrationDate: '2026-01-01',
        },
        latitude: 28.6139,
        longitude: 77.2090,
        locationName: 'Live GPS Coordinates [28.6139, 77.2090]',
        gForce: 5.2,
        impactSpeed: 68,
        severity: 'HIGH',
        timestamp: new Date().toISOString(),
        dispatched: false,
        status: 'CONFIRMATION_COUNTDOWN',
        responseTimeMinutes: null,
        notes: 'High G-Force impact (5.20g) recorded by MPU6050 accelerometer.',
        confirmationCountdown: 30,
        isConfirmedAccident: false
      });
    }
  };

  const handleConfirmCountdownNow = async () => {
    if (!activeConfirmationAlert) return;
    try {
      await fetch('/api/v1/hardware/timer-expire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: activeConfirmationAlert.id }),
      });
      fetchAlerts();
      fetchAnalytics();
      fetchSmsLogs();
    } catch (err) {
      console.error('Failed to escalate countdown', err);
    }
  };

  const handleSaveMedicalProfile = (newProfile: MedicalProfileData) => {
    setMedicalProfile(newProfile);
  };

  const handleLoginSuccess = (loggedInUser: User, jwtToken: string) => {
    setUser(loggedInUser);
    setToken(jwtToken);
    localStorage.setItem('saferide_token', jwtToken);
    localStorage.setItem('saferide_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('saferide_token');
    localStorage.removeItem('saferide_user');
  };

  const handleUpdateStatus = async (alertId: number, status: AlertStatus, notes?: string) => {
    try {
      await fetch(`/api/v1/alerts/${alertId}/respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      fetchAlerts();
      fetchAnalytics();
    } catch (err) {
      console.error('Failed to update alert status', err);
    }
  };

  const handleTriggerPreset = async (scenario: string) => {
    try {
      await fetch('/api/v1/alerts/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });
      fetchAlerts();
      fetchAnalytics();
      fetchSmsLogs();
    } catch (err) {
      console.error('Failed to trigger scenario preset', err);
    }
  };

  const handleRegisterVehicle = async (vehData: Partial<Vehicle>) => {
    try {
      const res = await fetch('/api/v1/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehData),
      });
      if (res.ok) {
        fetchVehicles();
      }
    } catch (err) {
      console.error('Failed to register vehicle', err);
    }
  };

  const handleFetchVehicleHistory = async (vehicleNumber: string): Promise<CrashAlert[]> => {
    try {
      const res = await fetch(`/api/v1/vehicles/${encodeURIComponent(vehicleNumber)}/alerts`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Failed to fetch vehicle history', err);
    }
    return [];
  };

  const activeEmergencyCount = alerts.filter(
    (a) => a.status === 'PENDING' || a.status === 'CONFIRMATION_COUNTDOWN' || a.status === 'AMBULANCE_DISPATCHED'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onOpenSimulator={() => setShowSimulatorModal(true)}
        onTriggerCrashCountdown={handleTriggerTestCrashCountdown}
        systemHealth={systemHealth}
        activeEmergencyCount={activeEmergencyCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            systemHealth={systemHealth}
            vehicle={vehicles[0] || null}
            emergencyContacts={contacts}
            latestAlert={alerts[0] || null}
            onNavigate={setActiveTab}
            onSimulateCrash={handleTriggerTestCrashCountdown}
          />
        )}

        {activeTab === 'triage' && (
          <AlertsCommandCenter
            alerts={alerts}
            onUpdateStatus={handleUpdateStatus}
            onTriggerPreset={handleTriggerPreset}
          />
        )}

        {activeTab === 'fleet' && (
          <VehicleFleetView
            vehicles={vehicles}
            onRegisterVehicle={handleRegisterVehicle}
            onFetchVehicleHistory={handleFetchVehicleHistory}
          />
        )}

        {activeTab === 'ice' && (
          <EmergencyLockScreenView
            currentVehicleNumber={vehicles[0]?.vehicleNumber || 'KA-01-AI-2026'}
            vehicles={vehicles}
          />
        )}

        {activeTab === 'telemetry' && (
          <SensorLiveView
            liveTelemetry={liveHardwareTelemetry}
          />
        )}

        {activeTab === 'contacts' && (
          <ContactsManagerView
            contacts={contacts}
            onUpdateContacts={setContacts}
          />
        )}

        {activeTab === 'medical' && (
          <MedicalProfileView
            initialProfile={medicalProfile}
            userName={user?.name || 'John Doe'}
            userPhone={user?.phone || '+91 98765 43210'}
            onSaveProfile={handleSaveMedicalProfile}
          />
        )}

        {activeTab === 'history' && (
          <AccidentHistoryView alerts={alerts} />
        )}

        {activeTab === 'hardware' && (
          <HardwareStudioView
            onTriggerTelemetry={handleHardwareTelemetry}
            onTriggerCountdown={(alert) => setActiveConfirmationAlert(alert)}
            activeTelemetry={liveHardwareTelemetry}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView analytics={analytics} />
        )}

        {activeTab === 'messages' && (
          <SmsLogsView logs={smsLogs} />
        )}

        {activeTab === 'vision' && (
          <VisionSafetyMonitor onSendTelemetry={handleSendTelemetry} />
        )}
      </main>

      {/* Crash Confirmation Safety Modal */}
      {activeConfirmationAlert && (
        <CrashConfirmationModal
          alert={activeConfirmationAlert}
          onCancel={handleCancelCountdown}
          onConfirmNow={handleConfirmCountdownNow}
          onViewLogs={() => setActiveTab('messages')}
        />
      )}

      {/* Quick Telemetry Injector Modal */}
      {showSimulatorModal && (
        <TelemetrySimulatorModal
          vehicles={vehicles}
          onClose={() => setShowSimulatorModal(false)}
          onSendTelemetry={handleSendTelemetry}
        />
      )}

      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Clean Light Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SafeRide AI &bull; Autonomous Emergency Accident Detection & Rapid-Response System</span>
          <span className="font-mono text-slate-400">ESP32 &bull; MPU6050 &bull; SIM800L &bull; FastAPI AI Engine &bull; DEMO_MODE: TRUE</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
