import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Radio, 
  Activity, 
  Terminal, 
  Zap, 
  Download, 
  Copy, 
  Check, 
  PhoneCall, 
  ShieldAlert, 
  Sliders, 
  RefreshCw, 
  Battery, 
  Wifi, 
  AlertOctagon, 
  Layers, 
  Cable, 
  Play, 
  Square,
  HelpCircle,
  ExternalLink,
  Code,
  Gauge
} from 'lucide-react';
import { HardwareTelemetry, HardwareDeviceConfig, EmergencyCallLog } from '../types';

interface HardwareStudioViewProps {
  onTriggerTelemetry: (data: any) => Promise<any>;
  onTriggerCountdown: (alert: any) => void;
  activeTelemetry?: HardwareTelemetry | null;
}

export const HardwareStudioView: React.FC<HardwareStudioViewProps> = ({
  onTriggerTelemetry,
  onTriggerCountdown,
  activeTelemetry,
}) => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'wiring' | 'calls' | 'firmware' | 'config'>('monitor');
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('ESP32-TRIDENT-01');
  const [callLogs, setCallLogs] = useState<EmergencyCallLog[]>([]);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Live sensor test controls
  const [testGForce, setTestGForce] = useState<number>(1.0);
  const [testPitch, setTestPitch] = useState<number>(0);
  const [testRoll, setTestRoll] = useState<number>(0);
  const [testSpeed, setTestSpeed] = useState<number>(55);
  const [testVehicleNumber, setTestVehicleNumber] = useState<string>('KA-01-AI-2026');
  const [testBattery, setTestBattery] = useState<number>(4.12);
  const [testCsq, setTestCsq] = useState<number>(28);

  // WebSerial state
  const [serialConnected, setSerialConnected] = useState<boolean>(false);
  const [serialLogs, setSerialLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] Trident Hardware Engine initialized.`,
    `[${new Date().toLocaleTimeString()}] Ready for ESP32 + MPU6050 + SIM800L telemetry streams.`,
  ]);
  const serialPortRef = useRef<any>(null);
  const serialReaderRef = useRef<any>(null);

  // Fetch registered devices and call logs
  const fetchData = async () => {
    try {
      const [devRes, callRes] = await Promise.all([
        fetch('/api/v1/hardware/devices'),
        fetch('/api/v1/hardware/call-logs'),
      ]);
      if (devRes.ok) setDevices(await devRes.json());
      if (callRes.ok) setCallLogs(await callRes.json());
    } catch (e) {
      console.error('Failed to load hardware data', e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  // WebSerial connect handler
  const handleConnectSerial = async () => {
    if (!('serial' in navigator)) {
      alert('WebSerial API is not supported in this browser. Please use Chrome/Edge or use the manual telemetry simulator.');
      return;
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      serialPortRef.current = port;
      setSerialConnected(true);

      setSerialLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Connected to ESP32 Serial at 115200 Baud!`,
      ]);

      const decoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(decoder.writable);
      const reader = decoder.readable.getReader();
      serialReaderRef.current = reader;

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const clean = line.trim();
            if (clean) {
              setSerialLogs((prev) => [...prev.slice(-40), `[ESP32] ${clean}`]);

              // Try parsing JSON or key-values from ESP32
              try {
                if (clean.startsWith('{') && clean.endsWith('}')) {
                  const parsed = JSON.parse(clean);
                  onTriggerTelemetry(parsed);
                }
              } catch (e) {}
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Serial connection error:', err);
      setSerialConnected(false);
    }
  };

  const handleDisconnectSerial = async () => {
    try {
      if (serialReaderRef.current) {
        await serialReaderRef.current.cancel();
      }
      if (serialPortRef.current) {
        await serialPortRef.current.close();
      }
    } catch (e) {}
    setSerialConnected(false);
    setSerialLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Disconnected from ESP32 Serial.`,
    ]);
  };

  // Trigger manual simulation
  const handleSendTelemetry = async (overrideGForce?: number, overrideSos?: boolean) => {
    setLoading(true);
    const gVal = overrideGForce !== undefined ? overrideGForce : testGForce;
    const isSos = overrideSos !== undefined ? overrideSos : false;

    // Estimate accel components
    const gMs2 = gVal * 9.80665;
    const radPitch = (testPitch * Math.PI) / 180;
    const radRoll = (testRoll * Math.PI) / 180;

    const payload = {
      deviceId: selectedDevice,
      vehicleNumber: testVehicleNumber,
      gForce: gVal,
      accelX: Math.sin(radPitch) * gMs2,
      accelY: Math.sin(radRoll) * gMs2,
      accelZ: Math.cos(radPitch) * gMs2,
      gyroX: testPitch * 1.5,
      gyroY: testRoll * 1.5,
      gyroZ: 0,
      pitch: testPitch,
      roll: testRoll,
      speed: testSpeed,
      latitude: 28.6139 + (Math.random() - 0.5) * 0.01,
      longitude: 77.2090 + (Math.random() - 0.5) * 0.01,
      csq: testCsq,
      batteryVoltage: testBattery,
      isEmergencyButtonPressed: isSos,
    };

    setSerialLogs((prev) => [
      ...prev.slice(-40),
      `[SIMULATOR -> SERVER] Sent Telemetry: G=${gVal}g | Pitch=${testPitch}° | Roll=${testRoll}° | SOS=${isSos}`,
    ]);

    try {
      const res = await onTriggerTelemetry(payload);
      if (res?.alert && res?.status === 'COUNTDOWN_INITIATED') {
        onTriggerCountdown(res.alert);
      }
    } finally {
      setLoading(false);
    }
  };

  // Current display metrics from active SSE stream or manual sliders
  const currentGForce = activeTelemetry ? activeTelemetry.gForce : testGForce;
  const currentPitch = activeTelemetry ? activeTelemetry.pitch : testPitch;
  const currentRoll = activeTelemetry ? activeTelemetry.roll : testRoll;
  const currentSpeed = activeTelemetry ? activeTelemetry.speed : testSpeed;
  const currentBattery = activeTelemetry ? activeTelemetry.batteryVoltage : testBattery;
  const currentCsq = activeTelemetry ? activeTelemetry.csq : testCsq;

  const getGForceColor = (g: number) => {
    if (g >= 4.0) return 'text-red-400 bg-red-500/20 border-red-500/40';
    if (g >= 2.5) return 'text-amber-400 bg-amber-500/20 border-amber-500/40';
    return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';
  };

  const handleCopyFirmware = () => {
    const code = document.getElementById('firmware-code-block')?.innerText;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                Hardware Engine &bull; ESP32 &bull; MPU6050 &bull; SIM800L
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              Hardware Studio & IoT Lab
            </h1>
            <p className="text-xs text-slate-400">
              Live MPU6050 accelerometer & gyro visualization, SIM800L GSM cellular telemetry, breadboard pinout schematic, and firmware studio.
            </p>
          </div>
        </div>

        {/* WebSerial USB Connect Button */}
        <div className="flex items-center space-x-3">
          {serialConnected ? (
            <button
              onClick={handleDisconnectSerial}
              className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-semibold flex items-center space-x-2 transition"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Disconnect Serial</span>
            </button>
          ) : (
            <button
              onClick={handleConnectSerial}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 transition shadow-lg shadow-emerald-600/30"
            >
              <Cable className="w-3.5 h-3.5" />
              <span>Connect ESP32 (USB WebSerial)</span>
            </button>
          )}

          <a
            href="/api/v1/hardware/firmware"
            download="trident_esp32_firmware.ino"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-2 transition"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Download .INO</span>
          </a>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition ${
            activeTab === 'monitor'
              ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Live Sensor Monitor & Controls</span>
        </button>

        <button
          onClick={() => setActiveTab('wiring')}
          className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition ${
            activeTab === 'wiring'
              ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Breadboard Wiring & Pinout Guide</span>
        </button>

        <button
          onClick={() => setActiveTab('calls')}
          className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition ${
            activeTab === 'calls'
              ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>Automated Call & SIM Logs ({callLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('firmware')}
          className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition ${
            activeTab === 'firmware'
              ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Arduino C++ Firmware Studio</span>
        </button>
      </div>

      {/* TAB 1: Live Monitor & Simulator */}
      {activeTab === 'monitor' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Metric 1: G-Force */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>MPU6050 G-Force</span>
                <Gauge className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-white font-mono tracking-tight">
                  {currentGForce.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500 font-mono">g (Earth)</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    currentGForce >= 4.0 ? 'bg-red-500' : currentGForce >= 2.5 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (currentGForce / 8.0) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                Crash Threshold: <strong>&gt; 3.5g</strong>
              </span>
            </div>

            {/* Metric 2: Pitch & Roll Tilt Angle */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Gyro Tilt (Pitch/Roll)</span>
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-white font-mono">
                  {currentPitch > 0 ? `+${currentPitch}°` : `${currentPitch}°`}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ {currentRoll}°</span>
              </div>
              <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                <span className={`px-1.5 py-0.5 rounded font-mono ${Math.abs(currentPitch) > 45 || Math.abs(currentRoll) > 45 ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-300'}`}>
                  {Math.abs(currentPitch) > 45 || Math.abs(currentRoll) > 45 ? 'ACUTE TILT / ROLLOVER' : 'LEVEL NOMINAL'}
                </span>
              </div>
            </div>

            {/* Metric 3: SIM800L Cellular Signal */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>SIM800L CSQ Signal</span>
                <Radio className="w-4 h-4 text-sky-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-white font-mono">
                  {currentCsq}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ 31 CSQ</span>
              </div>
              <div className="flex items-center space-x-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-sm ${
                      i < Math.round((currentCsq / 31) * 5) ? 'bg-sky-400' : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                GPRS: <strong className="text-emerald-400">ATTACHED</strong> &bull; 2G Band 900/1800
              </span>
            </div>

            {/* Metric 4: Hardware Battery Level */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Li-Ion 3.7V Battery</span>
                <Battery className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-white font-mono">
                  {currentBattery.toFixed(2)}
                </span>
                <span className="text-xs text-slate-400 font-mono">Volts</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, ((currentBattery - 3.3) / (4.2 - 3.3)) * 100))}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                Power Rail: <strong>4.12V / LM2596 Buck</strong>
              </span>
            </div>
          </div>

          {/* Interactive Gyroscope Visual Horizon & Telemetry Sliders */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: 2D Artificial Horizon Gauge & Serial Terminal */}
            <div className="lg:col-span-6 space-y-6">
              {/* Artificial Horizon Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span>MPU6050 Artificial Horizon & Inertial Vector</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    I2C ADDR: 0x68
                  </span>
                </div>

                {/* Horizon Circle */}
                <div className="relative w-full h-52 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
                  {/* Sky / Ground Half-Half Pitch Plane */}
                  <div
                    className="absolute inset-0 transition-transform duration-200"
                    style={{
                      transform: `rotate(${currentRoll}deg) translateY(${currentPitch * 1.2}px)`,
                      background: 'linear-gradient(to bottom, #1e3a8a 50%, #78350f 50%)',
                      opacity: 0.6,
                    }}
                  />

                  {/* Horizon Line */}
                  <div
                    className="absolute w-full h-0.5 bg-amber-400 shadow-md transition-transform duration-200"
                    style={{
                      transform: `rotate(${currentRoll}deg) translateY(${currentPitch * 1.2}px)`,
                    }}
                  />

                  {/* Center Crosshair Fixed */}
                  <div className="relative z-10 w-16 h-16 border-2 border-red-500/80 rounded-full flex items-center justify-center pointer-events-none">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <div className="absolute w-24 h-0.5 bg-red-500/60" />
                    <div className="absolute h-24 w-0.5 bg-red-500/60" />
                  </div>

                  {/* Corner Readouts */}
                  <div className="absolute top-2 left-3 text-[10px] font-mono text-white/90 bg-black/60 px-2 py-1 rounded">
                    Pitch: {currentPitch}°
                  </div>
                  <div className="absolute top-2 right-3 text-[10px] font-mono text-white/90 bg-black/60 px-2 py-1 rounded">
                    Roll: {currentRoll}°
                  </div>
                  <div className="absolute bottom-2 left-3 text-[10px] font-mono text-white/90 bg-black/60 px-2 py-1 rounded">
                    AccZ: {(Math.cos((currentPitch * Math.PI) / 180) * currentGForce * 9.8).toFixed(1)} m/s²
                  </div>
                  <div className="absolute bottom-2 right-3 text-[10px] font-mono text-white/90 bg-black/60 px-2 py-1 rounded">
                    G-Load: {currentGForce.toFixed(2)}g
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">AXIAL X</span>
                    <span className="text-white font-bold">{((Math.sin((currentPitch * Math.PI) / 180) * currentGForce * 9.8)).toFixed(2)}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">AXIAL Y</span>
                    <span className="text-white font-bold">{((Math.sin((currentRoll * Math.PI) / 180) * currentGForce * 9.8)).toFixed(2)}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">AXIAL Z</span>
                    <span className="text-white font-bold">{((Math.cos((currentPitch * Math.PI) / 180) * currentGForce * 9.8)).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Serial & AT Terminal Log */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">Live Serial & AT Command Stream</span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    115200 BAUD &bull; RAW I/O
                  </span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 font-mono text-[11px] text-slate-300 h-44 overflow-y-auto space-y-1">
                  {serialLogs.map((log, i) => (
                    <div
                      key={i}
                      className={
                        log.includes('CRASH') || log.includes('ALERT')
                          ? 'text-red-400 font-bold'
                          : log.includes('ATD') || log.includes('AT+CMGS')
                          ? 'text-amber-400'
                          : log.includes('Connected')
                          ? 'text-emerald-400 font-bold'
                          : 'text-slate-400'
                      }
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Manual Hardware Telemetry Controls & Injector */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-white text-sm">Hardware Telemetry Injector</h3>
                  </div>
                  <span className="text-xs text-slate-400">Target: {testVehicleNumber}</span>
                </div>

                {/* G-Force Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-slate-300 font-semibold">Impact G-Force Acceleration</label>
                    <span className="font-mono font-bold text-red-400">{testGForce.toFixed(1)}g</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="9.0"
                    step="0.1"
                    value={testGForce}
                    onChange={(e) => setTestGForce(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>1.0g (Normal)</span>
                    <span>2.5g (Braking)</span>
                    <span className="text-amber-400 font-bold">3.5g (Crash Limit)</span>
                    <span className="text-red-400 font-bold">7.0g+ (Severe Collision)</span>
                  </div>
                </div>

                {/* Pitch Tilt Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-slate-300 font-semibold">Pitch Angle (Front/Rear Incline)</label>
                    <span className="font-mono text-amber-400">{testPitch}°</span>
                  </div>
                  <input
                    type="range"
                    min="-80"
                    max="80"
                    step="1"
                    value={testPitch}
                    onChange={(e) => setTestPitch(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Roll Tilt Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-slate-300 font-semibold">Roll Angle (Lateral Tilt / Rollover)</label>
                    <span className="font-mono text-sky-400">{testRoll}°</span>
                  </div>
                  <input
                    type="range"
                    min="-80"
                    max="80"
                    step="1"
                    value={testRoll}
                    onChange={(e) => setTestRoll(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>

                {/* Speed & CSQ Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Impact Speed (km/h)</label>
                    <input
                      type="number"
                      value={testSpeed}
                      onChange={(e) => setTestSpeed(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">SIM800L Signal (CSQ)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={testCsq}
                      onChange={(e) => setTestCsq(parseInt(e.target.value) || 28)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Presets Grid */}
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] uppercase font-mono text-slate-400 font-bold">Quick Hardware Presets</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setTestGForce(1.1);
                        setTestPitch(0);
                        setTestRoll(0);
                        setTestSpeed(60);
                      }}
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold text-left transition"
                    >
                      <span className="block font-bold">Cruising Nominal</span>
                      <span className="text-[10px] text-slate-400 font-mono">1.1g &bull; Speed 60 km/h</span>
                    </button>

                    <button
                      onClick={() => {
                        setTestGForce(6.8);
                        setTestPitch(15);
                        setTestRoll(12);
                        setTestSpeed(92);
                      }}
                      className="p-2.5 bg-red-950/40 border border-red-800/60 hover:bg-red-900/40 text-red-300 rounded-xl text-xs font-semibold text-left transition"
                    >
                      <span className="block font-bold">Highway Crash (6.8g)</span>
                      <span className="text-[10px] text-red-400 font-mono">Triggers 20s SOS Timer</span>
                    </button>

                    <button
                      onClick={() => {
                        setTestGForce(3.2);
                        setTestPitch(5);
                        setTestRoll(65);
                        setTestSpeed(45);
                      }}
                      className="p-2.5 bg-amber-950/40 border border-amber-800/60 hover:bg-amber-900/40 text-amber-300 rounded-xl text-xs font-semibold text-left transition"
                    >
                      <span className="block font-bold">Vehicle Rollover (65° Tilt)</span>
                      <span className="text-[10px] text-amber-400 font-mono">Triggers acute tilt alert</span>
                    </button>

                    <button
                      onClick={() => handleSendTelemetry(7.2, true)}
                      className="p-2.5 bg-purple-950/40 border border-purple-800/60 hover:bg-purple-900/40 text-purple-300 rounded-xl text-xs font-semibold text-left transition"
                    >
                      <span className="block font-bold">SOS Pushbutton Trigger</span>
                      <span className="text-[10px] text-purple-400 font-mono">Physical switch pressed</span>
                    </button>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="space-y-2.5 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => handleSendTelemetry()}
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition shadow-lg shadow-amber-600/30"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{loading ? 'Transmitting Packet...' : 'Transmit Telemetry to Server'}</span>
                  </button>

                  <button
                    onClick={() => handleSendTelemetry(6.5, false)}
                    className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-red-600/30"
                  >
                    <AlertOctagon className="w-4 h-4" />
                    <span>Trigger Severe Crash &amp; 20s Confirmation Timer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Breadboard Wiring & Pinout Guide */}
      {activeTab === 'wiring' && (
        <div className="space-y-6">
          {/* Visual Schematic Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">ESP32 + MPU6050 + SIM800L Breadboard Pinout Schematic</h2>
                <p className="text-xs text-slate-400">Complete wiring interconnect table for DevKit V1 38-Pin / 30-Pin boards.</p>
              </div>
            </div>

            {/* Pinout Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="pb-3 px-3">Module Component</th>
                    <th className="pb-3 px-3">Module Pin</th>
                    <th className="pb-3 px-3">ESP32 Pin</th>
                    <th className="pb-3 px-3">Wire Function / Protocol</th>
                    <th className="pb-3 px-3">Electrical Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {/* MPU6050 */}
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-amber-400">MPU6050 (6-DOF)</td>
                    <td className="py-2.5 px-3 text-white">VCC</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">3.3V Pin</td>
                    <td className="py-2.5 px-3 text-slate-300">Power Input</td>
                    <td className="py-2.5 px-3 text-slate-400">Do NOT connect to 5V if module lacks LDO</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-amber-400">MPU6050 (6-DOF)</td>
                    <td className="py-2.5 px-3 text-white">GND</td>
                    <td className="py-2.5 px-3 text-slate-400">GND</td>
                    <td className="py-2.5 px-3 text-slate-300">Common Ground</td>
                    <td className="py-2.5 px-3 text-slate-400">Common rail across all modules</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-amber-400">MPU6050 (6-DOF)</td>
                    <td className="py-2.5 px-3 text-white">SCL</td>
                    <td className="py-2.5 px-3 text-sky-400 font-bold">GPIO 22</td>
                    <td className="py-2.5 px-3 text-slate-300">I2C Clock Line</td>
                    <td className="py-2.5 px-3 text-slate-400">Internal pullup enabled via Wire.h</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-amber-400">MPU6050 (6-DOF)</td>
                    <td className="py-2.5 px-3 text-white">SDA</td>
                    <td className="py-2.5 px-3 text-sky-400 font-bold">GPIO 21</td>
                    <td className="py-2.5 px-3 text-slate-300">I2C Data Line</td>
                    <td className="py-2.5 px-3 text-slate-400">I2C address default: 0x68 (AD0 to GND)</td>
                  </tr>

                  {/* SIM800L */}
                  <tr className="hover:bg-slate-800/30 bg-red-950/10">
                    <td className="py-2.5 px-3 font-bold text-red-400">SIM800L GSM/GPRS</td>
                    <td className="py-2.5 px-3 text-white">VCC</td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold">LM2596 OUT+ (4.0V - 4.2V)</td>
                    <td className="py-2.5 px-3 text-slate-300">2A Peak Current Rail</td>
                    <td className="py-2.5 px-3 text-red-400 font-bold">CRITICAL: Add 1000uF cap across VCC/GND</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 bg-red-950/10">
                    <td className="py-2.5 px-3 font-bold text-red-400">SIM800L GSM/GPRS</td>
                    <td className="py-2.5 px-3 text-white">GND</td>
                    <td className="py-2.5 px-3 text-slate-400">Common GND</td>
                    <td className="py-2.5 px-3 text-slate-300">Ground</td>
                    <td className="py-2.5 px-3 text-slate-400">Must tie buck converter GND to ESP32 GND</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 bg-red-950/10">
                    <td className="py-2.5 px-3 font-bold text-red-400">SIM800L GSM/GPRS</td>
                    <td className="py-2.5 px-3 text-white">SIM_TXD</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">GPIO 16 (RX2)</td>
                    <td className="py-2.5 px-3 text-slate-300">Hardware Serial 2 RX</td>
                    <td className="py-2.5 px-3 text-slate-400">Direct connection to ESP32 3.3V logic</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 bg-red-950/10">
                    <td className="py-2.5 px-3 font-bold text-red-400">SIM800L GSM/GPRS</td>
                    <td className="py-2.5 px-3 text-white">SIM_RXD</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">GPIO 17 (TX2)</td>
                    <td className="py-2.5 px-3 text-slate-300">Hardware Serial 2 TX</td>
                    <td className="py-2.5 px-3 text-slate-400">1K / 2K resistor divider recommended</td>
                  </tr>

                  {/* Peripherals */}
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-purple-400">Piezo Buzzer</td>
                    <td className="py-2.5 px-3 text-white">Positive (+)</td>
                    <td className="py-2.5 px-3 text-purple-400 font-bold">GPIO 18</td>
                    <td className="py-2.5 px-3 text-slate-300">Siren PWM Output</td>
                    <td className="py-2.5 px-3 text-slate-400">Negative (-) to GND</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-purple-400">SOS Pushbutton</td>
                    <td className="py-2.5 px-3 text-white">Terminal A</td>
                    <td className="py-2.5 px-3 text-purple-400 font-bold">GPIO 4</td>
                    <td className="py-2.5 px-3 text-slate-300">Digital Input</td>
                    <td className="py-2.5 px-3 text-slate-400">INPUT_PULLUP (Terminal B to GND)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-purple-400">Status LED</td>
                    <td className="py-2.5 px-3 text-white">Anode (+)</td>
                    <td className="py-2.5 px-3 text-purple-400 font-bold">GPIO 2 (Onboard)</td>
                    <td className="py-2.5 px-3 text-slate-300">Heartbeat Indicator</td>
                    <td className="py-2.5 px-3 text-slate-400">Flashes 1Hz on telemetry sync</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Critical Electrical Warnings Box */}
            <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl text-xs space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 font-bold">
                <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                <span>Critical Power Rail Guidelines for SIM800L</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                1. <strong>Do NOT power SIM800L directly from ESP32 3.3V or 5V VIN pin</strong>. When registering to cell towers (GPRS/GSM bursts), SIM800L draws instantaneous spikes of up to <strong>2.0 Amperes</strong>, causing brownout resets on the ESP32.
              </p>
              <p className="text-slate-300 leading-relaxed">
                2. Use an external <strong>LM2596 or MP1584 buck converter</strong> adjusted to exactly <strong>4.0V - 4.1V</strong>, and solder a <strong>1000µF 16V electrolytic capacitor</strong> directly between SIM800L VCC and GND pins.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Automated Call & SIM Logs */}
      {activeTab === 'calls' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600/20 text-red-400 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Automated Emergency Voice Call Dispatch Logs</h2>
                  <p className="text-xs text-slate-400">Triggered automatically via SIM800L AT Commands when crash timer expires.</p>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 font-bold">
                SIM800L AUTO-DIAL ACTIVE
              </span>
            </div>

            <div className="space-y-3">
              {callLogs.map((call) => (
                <div
                  key={call.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 font-mono text-xs hover:border-slate-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        call.recipientType === 'AMBULANCE_TRAUMA_108'
                          ? 'bg-red-500/20 text-red-400'
                          : call.recipientType === 'POLICE_CONTROL_ROOM'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {call.recipientType}
                      </span>
                      <strong className="text-white text-sm">{call.recipientName}</strong>
                      <span className="text-slate-400 text-xs">({call.phoneNumber})</span>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                      <span>Duration: <strong className="text-white">{call.durationSeconds}s</strong></span>
                      <span>&bull;</span>
                      <span>{new Date(call.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 text-amber-300 text-[11px]">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Dispatched Modem AT Command</span>
                    <code>{call.atCommand}</code>
                  </div>

                  <div className="bg-slate-900/60 p-2.5 rounded-xl text-slate-300 text-xs">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Automated TTS Voice Transcript</span>
                    <p className="italic">"{call.audioDispatchTranscript}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Firmware Studio */}
      {activeTab === 'firmware' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Code className="w-5 h-5 text-amber-400" />
                  <span>Production Arduino / ESP32 C++ Firmware Script</span>
                </h2>
                <p className="text-xs text-slate-400">Complete sketch ready to flash into ESP32 Dev Module using Arduino IDE or PlatformIO.</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyFirmware}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>

                <a
                  href="/api/v1/hardware/firmware"
                  download="trident_esp32_firmware.ino"
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .INO</span>
                </a>
              </div>
            </div>

            {/* Code Display */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[500px]">
              <pre id="firmware-code-block">{`/**
 * TRIDENT IoT CRASH DETECTION & EMERGENCY CELLULAR TELEMETRY FIRMWARE
 * Target Hardware: ESP32 Dev Module
 * Sensors: MPU6050 (I2C 0x68: SDA 21, SCL 22)
 * Cellular: SIM800L GSM Modem (HardwareSerial 2: RX2 16, TX2 17)
 * Peripherals: Piezo Siren (GPIO 18), Cancel Button (GPIO 4), Status LED (GPIO 2)
 */

#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <HardwareSerial.h>

#define MPU6050_SDA_PIN 21
#define MPU6050_SCL_PIN 22
#define SIM800_TX_PIN   17
#define SIM800_RX_PIN   16
#define BUZZER_PIN      18
#define SOS_CANCEL_BTN  4
#define STATUS_LED      2

const char* DEVICE_ID = "ESP32-TRIDENT-01";
const char* DEVICE_SECRET = "trident_sec_esp32_9981";
const char* VEHICLE_NUMBER = "KA-01-AI-2026";
const char* FAVORITE_PHONE = "+919876543210";

const float G_FORCE_CRASH_THRESHOLD = 3.5;
const float TILT_ANGLE_THRESHOLD    = 55.0;
const int COUNTDOWN_SECONDS         = 20;

HardwareSerial sim800(2);
const int MPU_ADDR = 0x68;
int16_t AcX, AcY, AcZ, Tmp, GyX, GyY, GyZ;

bool isCountdownActive = false;
unsigned long countdownStartTime = 0;

void sendAT(String cmd, int waitMs = 1000) {
  sim800.println(cmd);
  delay(waitMs);
  while (sim800.available()) {
    Serial.write(sim800.read());
  }
}

void initSIM800L() {
  sim800.begin(9600, SERIAL_8N1, SIM800_RX_PIN, SIM800_TX_PIN);
  delay(3000);
  sendAT("AT");
  sendAT("ATE0");
  sendAT("AT+CPIN?");
  sendAT("AT+CSQ");
  sendAT("AT+CMGF=1");
}

void initMPU6050() {
  Wire.begin(MPU6050_SDA_PIN, MPU6050_SCL_PIN);
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B); // Wake up register
  Wire.write(0);
  Wire.endTransmission(true);
}

void readMPU6050(float &ax, float &ay, float &az, float &gForce, float &pitch, float &roll) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 14, true);

  AcX = Wire.read()<<8 | Wire.read();
  AcY = Wire.read()<<8 | Wire.read();
  AcZ = Wire.read()<<8 | Wire.read();
  Tmp = Wire.read()<<8 | Wire.read();
  GyX = Wire.read()<<8 | Wire.read();
  GyY = Wire.read()<<8 | Wire.read();
  GyZ = Wire.read()<<8 | Wire.read();

  ax = (AcX / 16384.0) * 9.80665;
  ay = (AcY / 16384.0) * 9.80665;
  az = (AcZ / 16384.0) * 9.80665;

  float mag = sqrt(ax*ax + ay*ay + az*az);
  gForce = mag / 9.80665;
  pitch = atan2(ax, sqrt(ay*ay + az*az)) * 180.0 / PI;
  roll  = atan2(ay, sqrt(ax*ax + az*az)) * 180.0 / PI;
}

void triggerEmergencyEscalation(float gForce) {
  digitalWrite(BUZZER_PIN, HIGH);
  // 1. Dial Favorite ICE Contact
  sendAT("ATD" + String(FAVORITE_PHONE) + ";", 15000);
  sendAT("ATH");
  // 2. Dial Ambulance 108
  sendAT("ATD108;", 15000);
  sendAT("ATH");
  // 3. Dispatch GPS SMS
  sendAT("AT+CMGS=\\"" + String(FAVORITE_PHONE) + "\\"");
  delay(100);
  sim800.print("[TRIDENT SOS] Vehicle " + String(VEHICLE_NUMBER) + " CRASH CONFIRMED! Impact: " + String(gForce, 1) + "g. Ambulance Dispatched.");
  sim800.write(26);
  delay(5000);
  digitalWrite(BUZZER_PIN, LOW);
}

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(STATUS_LED, OUTPUT);
  pinMode(SOS_CANCEL_BTN, INPUT_PULLUP);
  initMPU6050();
  initSIM800L();
}

void loop() {
  float ax, ay, az, gForce, pitch, roll;
  readMPU6050(ax, ay, az, gForce, pitch, roll);
  bool sosBtnPressed = (digitalRead(SOS_CANCEL_BTN) == LOW);

  if (!isCountdownActive && (gForce >= G_FORCE_CRASH_THRESHOLD || abs(pitch) >= TILT_ANGLE_THRESHOLD || abs(roll) >= TILT_ANGLE_THRESHOLD || sosBtnPressed)) {
    isCountdownActive = true;
    countdownStartTime = millis();
  }

  if (isCountdownActive) {
    int elapsedSec = (millis() - countdownStartTime) / 1000;
    int remainingSec = COUNTDOWN_SECONDS - elapsedSec;
    digitalWrite(BUZZER_PIN, (millis() / 250) % 2);

    if (sosBtnPressed && elapsedSec > 1) {
      isCountdownActive = false;
      digitalWrite(BUZZER_PIN, LOW);
      delay(1000);
      return;
    }

    if (remainingSec <= 0) {
      isCountdownActive = false;
      triggerEmergencyEscalation(gForce);
    }
  }

  delay(100);
}`}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
