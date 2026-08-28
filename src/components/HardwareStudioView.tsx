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
  Gauge,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
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
  const [selectedDevice, setSelectedDevice] = useState<string>('ESP32-SAFERIDE-01');
  const [callLogs, setCallLogs] = useState<EmergencyCallLog[]>([]);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Live sensor readings
  const [testGForce, setTestGForce] = useState<number>(1.0);
  const [testPitch, setTestPitch] = useState<number>(0);
  const [testRoll, setTestRoll] = useState<number>(0);
  const [testAx, setTestAx] = useState<number>(0);
  const [testAy, setTestAy] = useState<number>(0);
  const [testAz, setTestAz] = useState<number>(1.0);
  const [testSpeed, setTestSpeed] = useState<number>(55);
  const [testVehicleNumber, setTestVehicleNumber] = useState<string>('KA-01-SR-2026');
  const [testBattery, setTestBattery] = useState<number>(4.12);
  const [testCsq, setTestCsq] = useState<number>(28);
  const [testSos, setTestSos] = useState<boolean>(false);

  // Real-time oscilloscope chart history
  const [chartHistory, setChartHistory] = useState<any[]>(() => {
    const initial = [];
    const now = Date.now();
    for (let i = 25; i >= 0; i--) {
      const d = new Date(now - i * 500);
      initial.push({
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        gForce: 1.0,
        pitch: 0.0,
        roll: 0.0,
        ax: 0.0,
        ay: 0.0,
        az: 1.0,
      });
    }
    return initial;
  });

  // WebSerial state
  const [serialConnected, setSerialConnected] = useState<boolean>(false);
  const [virtualStreamActive, setVirtualStreamActive] = useState<boolean>(false);
  const [serialPermissionWarning, setSerialPermissionWarning] = useState<string | null>(null);
  const [serialLogs, setSerialLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] SafeRide Hardware Engine initialized.`,
    `[${new Date().toLocaleTimeString()}] Ready for ESP32 + MPU6050 + SIM800L telemetry streams.`,
  ]);
  const serialPortRef = useRef<any>(null);
  const serialReaderRef = useRef<any>(null);
  const virtualIntervalRef = useRef<any>(null);
  const lastCrashTriggerTimeRef = useRef<number>(0);

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

  // Update chart history point
  const pushChartPoint = (g: number, p: number, r: number, ax = 0, ay = 0, az = 1) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setChartHistory((prev) => [
      ...prev.slice(-35),
      {
        time: timeStr,
        gForce: parseFloat(g.toFixed(2)),
        pitch: parseFloat(p.toFixed(1)),
        roll: parseFloat(r.toFixed(1)),
        ax: parseFloat(ax.toFixed(2)),
        ay: parseFloat(ay.toFixed(2)),
        az: parseFloat(az.toFixed(2)),
      },
    ]);
  };

  // Process incoming telemetry packet
  const handleIncomingTelemetryData = (pkt: {
    gForce?: number;
    ax?: number;
    ay?: number;
    az?: number;
    pitch?: number;
    roll?: number;
    sosButtonPressed?: boolean;
    csq?: number;
    batteryVoltage?: number;
    deviceId?: string;
    vehicleNumber?: string;
  }) => {
    const g = typeof pkt.gForce === 'number' ? pkt.gForce : 1.0;
    const p = typeof pkt.pitch === 'number' ? pkt.pitch : 0.0;
    const r = typeof pkt.roll === 'number' ? pkt.roll : 0.0;
    const ax = typeof pkt.ax === 'number' ? pkt.ax : 0.0;
    const ay = typeof pkt.ay === 'number' ? pkt.ay : 0.0;
    const az = typeof pkt.az === 'number' ? pkt.az : 1.0;
    const sos = Boolean(pkt.sosButtonPressed);

    setTestGForce(g);
    setTestPitch(p);
    setTestRoll(r);
    setTestAx(ax);
    setTestAy(ay);
    setTestAz(az);
    setTestSos(sos);
    if (typeof pkt.csq === 'number') setTestCsq(pkt.csq);
    if (typeof pkt.batteryVoltage === 'number') setTestBattery(pkt.batteryVoltage);

    pushChartPoint(g, p, r, ax, ay, az);

    // Auto-detect crash thresholds
    const isImpact = g >= 3.5;
    const isRollover = Math.abs(r) >= 50 || Math.abs(p) >= 50;
    const now = Date.now();

    if ((isImpact || isRollover || sos) && now - lastCrashTriggerTimeRef.current > 10000) {
      lastCrashTriggerTimeRef.current = now;
      handleTriggerImpact(g, sos);
    }
  };

  // Virtual ESP32 Serial Live Stream generator
  const toggleVirtualSerialStream = () => {
    if (virtualStreamActive) {
      if (virtualIntervalRef.current) {
        clearInterval(virtualIntervalRef.current);
        virtualIntervalRef.current = null;
      }
      setVirtualStreamActive(false);
      setSerialLogs((prev) => [
        ...prev.slice(-40),
        `[${new Date().toLocaleTimeString()}] [VIRTUAL-COM] Virtual ESP32 UART Stream paused.`,
      ]);
    } else {
      setVirtualStreamActive(true);
      setSerialLogs((prev) => [
        ...prev.slice(-40),
        `[${new Date().toLocaleTimeString()}] [VIRTUAL-COM] Starting Virtual ESP32 UART Stream at 115200 baud...`,
      ]);

      virtualIntervalRef.current = setInterval(() => {
        const noiseAx = parseFloat((Math.random() * 0.1 - 0.05).toFixed(2));
        const noiseAy = parseFloat((Math.random() * 0.1 - 0.05).toFixed(2));
        const noiseAz = parseFloat((1.0 + Math.random() * 0.06 - 0.03).toFixed(2));
        const totalG = parseFloat(Math.sqrt(noiseAx ** 2 + noiseAy ** 2 + noiseAz ** 2).toFixed(2));
        const randPitch = parseFloat((Math.random() * 3 - 1.5).toFixed(1));
        const randRoll = parseFloat((Math.random() * 3 - 1.5).toFixed(1));

        handleIncomingTelemetryData({
          gForce: totalG,
          ax: noiseAx,
          ay: noiseAy,
          az: noiseAz,
          pitch: randPitch,
          roll: randRoll,
          sosButtonPressed: false,
          csq: 28,
          batteryVoltage: 4.12
        });

        const frame = `{"deviceId":"ESP32-DEV-01","gForce":${totalG},"ax":${noiseAx},"ay":${noiseAy},"az":${noiseAz},"pitch":${randPitch},"roll":${randRoll},"sosButtonPressed":false}`;
        setSerialLogs((prev) => [...prev.slice(-40), frame]);
      }, 500);
    }
  };

  useEffect(() => {
    return () => {
      if (virtualIntervalRef.current) clearInterval(virtualIntervalRef.current);
    };
  }, []);

  // WebSerial Handler
  const handleConnectSerial = async () => {
    if (!('serial' in navigator)) {
      setSerialPermissionWarning(
        'WebSerial API is not supported in this browser. Please use Google Chrome or Microsoft Edge, or use the Virtual Stream mode.'
      );
      return;
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      serialPortRef.current = port;
      setSerialConnected(true);
      setSerialPermissionWarning(null);

      setSerialLogs((prev) => [
        ...prev.slice(-40),
        `[${new Date().toLocaleTimeString()}] [USB-COM] ESP32 Serial Connected @ 115200 baud.`,
      ]);

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      serialReaderRef.current = reader;

      readSerialLoop(reader);
    } catch (err: any) {
      console.warn('WebSerial request failed:', err);
      if (err.name === 'SecurityError' || err.message?.includes('permissions policy') || err.message?.includes('disallowed') || err.message?.includes('denied')) {
        setSerialPermissionWarning(
          'WebSerial (direct USB serial communication) is blocked inside embedded iframe previews by standard browser security policies. To connect your physical ESP32 directly via USB WebSerial, open this web app in a dedicated browser tab (click "Open in New Tab" on top-right of your preview), or use the Virtual Stream / Wi-Fi HTTP telemetry options.'
        );
      } else {
        setSerialPermissionWarning(`Serial connection notice: ${err.message}`);
      }
    }
  };

  const readSerialLoop = async (reader: any) => {
    let buffer = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine) {
              setSerialLogs((prev) => [...prev.slice(-40), cleanLine]);

              // Attempt JSON parsing from ESP32 stream
              try {
                if (cleanLine.startsWith('{') && cleanLine.endsWith('}')) {
                  const data = JSON.parse(cleanLine);
                  handleIncomingTelemetryData(data);
                } else if (cleanLine.includes('gForce') || cleanLine.includes('pitch') || cleanLine.includes('roll')) {
                  // Fallback string matching if JSON fragment
                  const gMatch = cleanLine.match(/gForce["':\s]+([0-9.-]+)/i);
                  const pMatch = cleanLine.match(/pitch["':\s]+([0-9.-]+)/i);
                  const rMatch = cleanLine.match(/roll["':\s]+([0-9.-]+)/i);
                  if (gMatch || pMatch || rMatch) {
                    handleIncomingTelemetryData({
                      gForce: gMatch ? parseFloat(gMatch[1]) : undefined,
                      pitch: pMatch ? parseFloat(pMatch[1]) : undefined,
                      roll: rMatch ? parseFloat(rMatch[1]) : undefined,
                    });
                  }
                }
              } catch (parseErr) {
                // Non-JSON diagnostic logs (e.g. [INIT] [OK] etc)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Serial read error:', error);
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
    } catch (e) {
      console.error('Error closing serial:', e);
    } finally {
      setSerialConnected(false);
      setSerialLogs((prev) => [
        ...prev.slice(-40),
        `[${new Date().toLocaleTimeString()}] [USB-COM] Disconnected.`,
      ]);
    }
  };

  // Trigger test telemetry
  const handleTriggerImpact = async (gVal: number, isSos = false) => {
    setLoading(true);
    const payload = {
      deviceId: selectedDevice,
      vehicleNumber: testVehicleNumber,
      ax: testAx,
      ay: testAy,
      az: testAz,
      gForce: gVal,
      pitch: testPitch,
      roll: testRoll,
      speed: testSpeed,
      impactSpeed: testSpeed,
      batteryVoltage: testBattery,
      csq: testCsq,
      sosButtonPressed: isSos,
      latitude: 28.6139,
      longitude: 77.2090,
    };

    setSerialLogs((prev) => [
      ...prev.slice(-40),
      `[CRASH ALERT TRIGGERED] G=${gVal}g | Pitch=${testPitch}° | Roll=${testRoll}° | SOS=${isSos}`,
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

  const currentGForce = activeTelemetry ? activeTelemetry.gForce : testGForce;
  const currentPitch = activeTelemetry ? activeTelemetry.pitch : testPitch;
  const currentRoll = activeTelemetry ? activeTelemetry.roll : testRoll;
  const currentSpeed = activeTelemetry ? activeTelemetry.speed : testSpeed;
  const currentBattery = activeTelemetry ? activeTelemetry.batteryVoltage : testBattery;
  const currentCsq = activeTelemetry ? activeTelemetry.csq : testCsq;

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
                ESP32 &bull; MPU6050 &bull; SIM800L
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
              Hardware Studio & Embedded IoT Lab
            </h1>
            <p className="text-xs text-slate-500">
              Live MPU6050 6-axis I2C sensor telemetry, SIM800L GSM modem AT interface, and PlatformIO C++ firmware generator.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleVirtualSerialStream}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition border ${
              virtualStreamActive
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-amber-600" />
            <span>{virtualStreamActive ? 'Pause Virtual Stream' : 'Start Virtual ESP32 Stream'}</span>
            {virtualStreamActive && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
          </button>

          {serialConnected ? (
            <button
              onClick={handleDisconnectSerial}
              className="px-3.5 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center space-x-2"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Disconnect Serial</span>
            </button>
          ) : (
            <button
              onClick={handleConnectSerial}
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-2 shadow-xs cursor-pointer"
              title="Connect physical ESP32 via USB WebSerial"
            >
              <Cable className="w-3.5 h-3.5" />
              <span>Connect ESP32 (USB)</span>
            </button>
          )}

          <a
            href="/api/v1/hardware/firmware"
            download="trident_esp32_firmware.ino"
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center space-x-2 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>.INO Sketch</span>
          </a>
        </div>
      </div>

      {/* Permission Policy Security Notice Banner */}
      {serialPermissionWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
          <div className="flex items-start space-x-3">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 flex-shrink-0 mt-0.5">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-amber-900 block font-bold">WebSerial Sandbox Notice</strong>
              <p className="text-amber-800 text-[11px] leading-relaxed mt-0.5">
                {serialPermissionWarning}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0 w-full md:w-auto justify-end">
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs inline-flex items-center space-x-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab for USB</span>
            </a>
            <button
              onClick={toggleVirtualSerialStream}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs"
            >
              {virtualStreamActive ? 'Streaming Active' : 'Start Virtual ESP32 Stream'}
            </button>
            <button
              onClick={() => setSerialPermissionWarning(null)}
              className="px-2.5 py-1.5 rounded-lg text-amber-700 hover:text-amber-900 text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition ${
            activeTab === 'monitor'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Live Sensor Monitor & Controls</span>
        </button>

        <button
          onClick={() => setActiveTab('wiring')}
          className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition ${
            activeTab === 'wiring'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Breadboard Wiring & Pinout Guide</span>
        </button>

        <button
          onClick={() => setActiveTab('calls')}
          className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition ${
            activeTab === 'calls'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>Automated Call & SIM Logs ({callLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('firmware')}
          className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition ${
            activeTab === 'firmware'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>C++ Firmware Code</span>
        </button>
      </div>

      {/* TAB 1: Live Monitor & Simulator */}
      {activeTab === 'monitor' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Metric 1: G-Force */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>MPU6050 Acceleration</span>
                <Gauge className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {currentGForce.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500 font-mono">g</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    currentGForce >= 4.0 ? 'bg-rose-500' : currentGForce >= 2.5 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (currentGForce / 8.0) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500 font-mono block">
                Impact Threshold: <strong>&gt; 3.50g</strong>
              </span>
            </div>

            {/* Metric 2: Pitch & Roll Tilt Angle */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Gyro Tilt Angle</span>
                <Activity className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-extrabold text-slate-900 font-mono">
                  {currentPitch > 0 ? `+${currentPitch}°` : `${currentPitch}°`}
                </span>
                <span className="text-xs text-slate-500 font-mono">/ {currentRoll}° Roll</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${Math.abs(currentPitch) > 45 || Math.abs(currentRoll) > 45 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`}>
                {Math.abs(currentPitch) > 45 || Math.abs(currentRoll) > 45 ? 'ACUTE ROLLOVER DETECTED' : 'ORIENTATION NORMAL'}
              </span>
            </div>

            {/* Metric 3: SIM800L Cellular Signal */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>SIM800L CSQ Signal</span>
                <Radio className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  {currentCsq}
                </span>
                <span className="text-xs text-slate-500 font-mono">/ 31 CSQ</span>
              </div>
              <div className="flex items-center space-x-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-xs ${
                      i < Math.round((currentCsq / 31) * 5) ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-slate-500 font-mono block">
                Network: <strong className="text-emerald-700">GSM / GPRS OK</strong>
              </span>
            </div>

            {/* Metric 4: Hardware Battery Level */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Li-Ion 3.7V Battery</span>
                <Battery className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  {currentBattery.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500 font-mono">Volts</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, ((currentBattery - 3.3) / (4.2 - 3.3)) * 100))}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500 font-mono block">
                Power Rail: <strong>4.12V Regulated</strong>
              </span>
            </div>
          </div>

          {/* Real-time Oscilloscope Chart */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-indigo-600 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-900">
                  Live Motion & Tilt Waveform Oscilloscope
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  serialConnected 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : virtualStreamActive 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {serialConnected ? 'LIVE USB SERIAL (115200 BAUD)' : virtualStreamActive ? 'VIRTUAL STREAM ACTIVE' : 'MANUAL / STANDBY'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900 inline-block" />
                  G-Force: <strong>{testGForce.toFixed(2)}g</strong>
                </span>
                <span className="flex items-center gap-1.5 text-indigo-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                  Pitch: <strong>{testPitch}°</strong>
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                  Roll: <strong>{testRoll}°</strong>
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
                  <YAxis yAxisId="left" domain={[0, 8]} tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" label={{ value: 'G-Force (g)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 10 } }} />
                  <YAxis yAxisId="right" orientation="right" domain={[-90, 90]} tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" label={{ value: 'Angle (°)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 10 } }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <ReferenceLine yAxisId="left" y={3.5} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Crash Limit (3.5g)', fill: '#f43f5e', fontSize: 10, position: 'insideTopLeft' }} />
                  <ReferenceLine yAxisId="right" y={45} stroke="#f59e0b" strokeDasharray="3 3" />
                  <ReferenceLine yAxisId="right" y={-45} stroke="#f59e0b" strokeDasharray="3 3" />
                  <Line yAxisId="left" type="monotone" dataKey="gForce" name="G-Force (g)" stroke="#0f172a" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  <Line yAxisId="right" type="monotone" dataKey="pitch" name="Pitch (°)" stroke="#6366f1" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line yAxisId="right" type="monotone" dataKey="roll" name="Roll (°)" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg">
              <span>Dynamic sliding window updating continuously from breadboard MPU-6050 I2C stream.</span>
              <span>Rollover Warning Threshold: <strong>±45°</strong> | Impact Trigger: <strong>&ge; 3.50g</strong></span>
            </div>
          </div>

          {/* Test Bench Controls & UART Log Terminal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Test Bench Controls */}
            <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-slate-700" />
                  Hardware Simulation Bench
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  REAL-TIME CONTROL
                </span>
              </div>

              {/* Slider 1: G-Force */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Impact Acceleration (G-Force)</span>
                  <span className="font-mono font-bold text-slate-900">{testGForce.toFixed(2)}g</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="8.0"
                  step="0.1"
                  value={testGForce}
                  onChange={(e) => setTestGForce(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />
              </div>

              {/* Slider 2: Pitch & Roll */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Pitch Angle</span>
                    <span className="font-mono font-bold text-slate-900">{testPitch}°</span>
                  </div>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    value={testPitch}
                    onChange={(e) => setTestPitch(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Roll Angle</span>
                    <span className="font-mono font-bold text-slate-900">{testRoll}°</span>
                  </div>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    value={testRoll}
                    onChange={(e) => setTestRoll(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                  />
                </div>
              </div>

              {/* Quick Shock Buttons */}
              <div className="pt-2 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Trigger Test Events:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleTriggerImpact(1.05, false)}
                    className="p-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cruise (1.0g)
                  </button>
                  <button
                    onClick={() => handleTriggerImpact(2.4, false)}
                    className="p-2 rounded-lg border border-amber-200 bg-amber-50 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
                  >
                    Pothole (2.4g)
                  </button>
                  <button
                    onClick={() => handleTriggerImpact(5.2, false)}
                    className="p-2 rounded-lg border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-900 hover:bg-rose-100 transition-colors"
                  >
                    💥 Crash (5.2g)
                  </button>
                </div>

                <button
                  onClick={() => handleTriggerImpact(1.2, true)}
                  className="w-full py-2.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Trigger Hardware SOS Pushbutton
                </button>
              </div>
            </div>

            {/* Right: Live UART Console */}
            <div className="lg:col-span-6 bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-xs flex flex-col justify-between h-84">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-200 font-bold">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  ESP32 UART Telemetry Monitor (115200 Baud)
                </span>
                <button
                  onClick={() => setSerialLogs([`[${new Date().toLocaleTimeString()}] Buffer Cleared.`])}
                  className="hover:text-white"
                >
                  Clear
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[11px] text-emerald-400/90 py-2 scrollbar-thin">
                {serialLogs.map((log, index) => (
                  <div key={index} className="leading-tight">
                    {log}
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between font-mono">
                <span>PROTOCOL: JSON / MQTT over GSM GPRS</span>
                <span>STATUS: {virtualStreamActive ? 'STREAMING VIRTUAL' : serialConnected ? 'USB ATTACHED' : 'IDLE'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Breadboard Wiring Guide */}
      {activeTab === 'wiring' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">ESP32 & MPU6050/6500 & SIM800L Hardware Pinout</h2>
            <p className="text-xs text-slate-500">
              Schematic wiring instructions for connecting the accelerometer, GSM cellular modem, buzzer, and SOS rocker switch to the ESP32 devkit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase">MPU-6050 / 6500 (Raw I2C 6-DOF IMU)</h3>
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2">MPU Pin</th>
                    <th className="p-2">ESP32 Pin</th>
                    <th className="p-2">Function</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr><td className="p-2 font-mono">VCC</td><td className="p-2 font-mono text-emerald-700 font-bold">3V3</td><td className="p-2">Power supply (3.3V)</td></tr>
                  <tr><td className="p-2 font-mono">GND</td><td className="p-2 font-mono text-slate-900 font-bold">GND</td><td className="p-2">Ground</td></tr>
                  <tr><td className="p-2 font-mono">SCL</td><td className="p-2 font-mono text-blue-700 font-bold">GPIO 22</td><td className="p-2">I2C Clock Line</td></tr>
                  <tr><td className="p-2 font-mono">SDA</td><td className="p-2 font-mono text-blue-700 font-bold">GPIO 21</td><td className="p-2">I2C Data Line</td></tr>
                </tbody>
              </table>

              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase">Buzzer & SOS Rocker Switch</h3>
                <table className="w-full text-xs text-left mt-2">
                  <thead className="bg-slate-50 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2">Component</th>
                      <th className="p-2">ESP32 Connection</th>
                      <th className="p-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr><td className="p-2 font-mono">Active Buzzer (+)</td><td className="p-2 font-mono text-amber-700 font-bold">GPIO 23</td><td className="p-2">(-) goes to common GND</td></tr>
                    <tr><td className="p-2 font-mono">SOS Rocker Switch</td><td className="p-2 font-mono text-rose-700 font-bold">GPIO 18</td><td className="p-2">Term 1 to 3V3, Term 2 to GPIO 18 (internal pull-down)</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase">SIM800L (GSM Cellular & SMS Modem)</h3>
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2">SIM800L Pin</th>
                    <th className="p-2">ESP32 / Power Pin</th>
                    <th className="p-2">Function</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr><td className="p-2 font-mono">VCC</td><td className="p-2 font-mono text-rose-700 font-bold">3.7V–4.2V (LiPo / LM2596)</td><td className="p-2">Requires 2A Peak Burst current</td></tr>
                  <tr><td className="p-2 font-mono">GND</td><td className="p-2 font-mono text-slate-900 font-bold">Common GND</td><td className="p-2">Must share common ground with ESP32</td></tr>
                  <tr><td className="p-2 font-mono">SIM_TXD</td><td className="p-2 font-mono text-indigo-700 font-bold">GPIO 16 (RX2)</td><td className="p-2">UART2 Receive on ESP32</td></tr>
                  <tr><td className="p-2 font-mono">SIM_RXD</td><td className="p-2 font-mono text-indigo-700 font-bold">GPIO 17 (TX2)</td><td className="p-2">UART2 Transmit (Via 1k/2k divider)</td></tr>
                </tbody>
              </table>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">💡 MPU6500 Compatibility Note:</p>
                <p>
                  Firmware uses raw I2C register access with Wire library only to support both MPU6050 and MPU6500 clones without strict Adafruit WHO_AM_I chip rejection errors.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Calls & AT Command Logs */}
      {activeTab === 'calls' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">SIM800L Automated Call Dispatches</h2>
              <p className="text-xs text-slate-500">Log of automated voice calls initiated via SIM800L modem.</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
              {callLogs.length} Calls Initiated
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {callLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No hardware call logs recorded yet.</p>
            ) : (
              callLogs.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-mono font-bold text-slate-900">{c.phoneNumber}</span>
                      <span className="text-slate-500 text-[11px] block">{c.recipientName || c.recipientType}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    {c.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Firmware Studio */}
      {activeTab === 'firmware' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">ESP32 C++ Production Firmware Source</h2>
              <p className="text-xs text-slate-500">Tested PlatformIO & Arduino IDE code for production deployment.</p>
            </div>
            <button
              onClick={handleCopyFirmware}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl text-[11px] font-mono text-slate-200 overflow-x-auto max-h-[500px]">
            <pre id="firmware-code-block">{`/*
 * ============================================================================
 * SafeRide AI — Master Firmware for ESP32 DevKit V1
 * Hardware: ESP32 + MPU-6050/6500 + SIM800L GSM + Active Buzzer + SOS Rocker Switch
 * ============================================================================
 * Pin Connections:
 *  - MPU6050: VCC->3V3, GND->GND, SDA->GPIO 21, SCL->GPIO 22
 *  - SIM800L: TXD->GPIO 16 (RX2), RXD->GPIO 17 (TX2), GND->Common GND, VCC->3.7V-4.2V
 *  - Buzzer:  (+) -> GPIO 23, (-) -> GND
 *  - SOS SW:  Term 1 -> 3V3, Term 2 -> GPIO 18 (with internal pulldown)
 *
 * NOTE: Uses raw I2C register access for the IMU (Wire library only) instead
 * of the Adafruit_MPU6050 library. This board's sensor identifies as an
 * MPU6500 clone (WHO_AM_I = 0x70), which the Adafruit library's strict
 * chip-ID check rejects even though the registers are fully compatible.
 * ============================================================================
 */

#include <Wire.h>
#include <HardwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
#define BUZZER_PIN      23
#define SOS_SWITCH_PIN  18
#define SIM_RX2_PIN     16
#define SIM_TX2_PIN     17
#define SDA_PIN         21
#define SCL_PIN         22

// --- MPU6050/6500 Registers ---
#define MPU_ADDR        0x68
#define REG_PWR_MGMT_1  0x6B
#define REG_GYRO_CONFIG 0x1B
#define REG_ACCEL_CONFIG 0x1C
#define REG_CONFIG      0x1A
#define REG_ACCEL_XOUT_H 0x3B

// Sensitivity scale factors matching the ranges configured below:
// Accel range set to +/-8G  -> 4096 LSB/g
// Gyro range set to +/-500 deg/s -> 65.5 LSB/(deg/s)
#define ACCEL_SENSITIVITY 4096.0
#define GYRO_SENSITIVITY  65.5

// --- Thresholds for Accident & Hazard Classification ---
#define CRASH_G_THRESHOLD    3.50   // G-force impact trigger (Gs)
#define ROLLOVER_THRESHOLD   50.0   // Tilt angle trigger (Degrees)
#define JERK_THRESHOLD       8.00   // Sudden shock slope (G/s)
#define COUNTDOWN_SECONDS    30     // False-alarm cancellation window

// --- Emergency Contacts Configuration ---
const char* EMERGENCY_NUMBER_1 = "+919876543210";  // Replace with primary contact
const char* EMERGENCY_NUMBER_2 = "+91108";         // 108 Emergency Ambulance / Trauma
const char* VEHICLE_REG_NO     = "KA-01-SR-2026";
const char* DRIVER_NAME        = "Priyanshu Kumar";
const char* BLOOD_GROUP        = "O+";

// --- Global Objects & State ---
HardwareSerial sim800(2); // UART2 on ESP32
bool mpuReady = false;

enum SystemState {
  STATE_NORMAL,
  STATE_COUNTDOWN,
  STATE_DISPATCHED
};

SystemState currentState = STATE_NORMAL;
unsigned long countdownStartTime = 0;
float prevGForce = 1.0;
unsigned long lastSampleTime = 0;
unsigned long lastTelemetryStreamTime = 0;

// Function Prototypes
void sendATCommand(String cmd, unsigned long timeout = 1000);
void initSIM800L();
void sendEmergencySMS(String reason, float gVal, float rollVal);
void makeEmergencyCall(const char* phoneNumber);
void beepBuzzer(int times, int delayMs);
bool initMPU();
void readMPU(float &ax, float &ay, float &az, float &gx, float &gy, float &gz, float &tempC);

void setup() {
  // 1. Initialize USB Serial for Web Dashboard
  Serial.begin(115200);
  delay(500);
  Serial.println("\\n[INIT] Starting SafeRide AI Master Firmware...");

  // 2. Configure I/O Pins
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(SOS_SWITCH_PIN, INPUT_PULLDOWN); // ESP32 internal pull-down
  digitalWrite(BUZZER_PIN, LOW);

  // 3. Initialize MPU6050/6500 (I2C, raw register access)
  Wire.begin(SDA_PIN, SCL_PIN);
  mpuReady = initMPU();
  if (!mpuReady) {
    Serial.println("[ERROR] MPU sensor not detected. Check I2C wiring (SDA=21, SCL=22)!");
    beepBuzzer(3, 100);
  } else {
    Serial.println("[OK] MPU 6-Axis Sensor Ready (raw I2C).");
  }

  // 4. Initialize SIM800L GSM (UART2)
  sim800.begin(9600, SERIAL_8N1, SIM_RX2_PIN, SIM_TX2_PIN);
  delay(1000);
  initSIM800L();

  // Startup Success Tone
  beepBuzzer(2, 80);
  Serial.println("[READY] SafeRide AI System Active & Telemetry Streaming.\\n");
}

void loop() {
  unsigned long now = millis();

  // --- Step A: Read MPU Sensor (raw I2C) ---
  float ax, ay, az, gxDps, gyDps, gzDps, tempC;
  readMPU(ax, ay, az, gxDps, gyDps, gzDps, tempC);
  // ax, ay, az are already in g's (raw register conversion below)

  float gForce = sqrt(ax * ax + ay * ay + az * az);

  // Angular Orientation (Pitch & Roll in Degrees)
  float pitch = atan2(ay, sqrt(ax * ax + az * az)) * 180.0 / PI;
  float roll  = atan2(-ax, az) * 180.0 / PI;

  // Rate of Change (Jerk in G/s)
  float dt = (now - lastSampleTime) / 1000.0;
  if (dt <= 0) dt = 0.02;
  float jerk = abs(gForce - prevGForce) / dt;
  prevGForce = gForce;
  lastSampleTime = now;

  // Check Physical SOS Rocker Switch
  bool isSosPressed = (digitalRead(SOS_SWITCH_PIN) == HIGH);

  // --- Step B: Check Serial Commands from Web UI ---
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\\n');
    cmd.trim();
    if (cmd == "CANCEL" || cmd == "SAFE") {
      currentState = STATE_NORMAL;
      digitalWrite(BUZZER_PIN, LOW);
      Serial.println("{\\"status\\":\\"CANCELLED_BY_USER\\"}");
    } else if (cmd == "TEST_SOS") {
      isSosPressed = true;
    }
  }

  // --- Step C: State Machine & Accident Detection ---
  switch (currentState) {
    case STATE_NORMAL: {
      bool isHighImpact = (gForce >= CRASH_G_THRESHOLD && jerk >= JERK_THRESHOLD);
      bool isRollover   = (abs(roll) >= ROLLOVER_THRESHOLD || abs(pitch) >= ROLLOVER_THRESHOLD);

      if (isHighImpact || isRollover || isSosPressed) {
        currentState = STATE_COUNTDOWN;
        countdownStartTime = now;
        String reason = isSosPressed ? "MANUAL_SOS_TRIGGER" : (isHighImpact ? "HIGH_G_COLLISION" : "VEHICLE_ROLLOVER");
        Serial.printf("{\\"alert\\":\\"CRASH_DETECTED\\",\\"reason\\":\\"%s\\",\\"gForce\\":%.2f,\\"roll\\":%.1f}\\n",
                      reason.c_str(), gForce, roll);
      }
      break;
    }

    case STATE_COUNTDOWN: {
      unsigned long elapsedSec = (now - countdownStartTime) / 1000;
      int remainingSec = COUNTDOWN_SECONDS - elapsedSec;

      // Pulsing Warning Alarm on Buzzer during countdown
      if ((now / 250) % 2 == 0) {
        digitalWrite(BUZZER_PIN, HIGH);
      } else {
        digitalWrite(BUZZER_PIN, LOW);
      }

      if (remainingSec <= 0) {
        // Countdown expired! Driver is unresponsive -> Auto Dispatch!
        currentState = STATE_DISPATCHED;
        digitalWrite(BUZZER_PIN, HIGH); // Continuous alarm tone
        Serial.println("{\\"alert\\":\\"EMERGENCY_DISPATCH_TRIGGERED\\"}");

        // Send Out Emergency SMS Broadcast & Voice Call via SIM800L
        sendEmergencySMS("UNRESPONSIVE_CRASH", gForce, roll);
        delay(1000);
        makeEmergencyCall(EMERGENCY_NUMBER_1);
      }
      break;
    }

    case STATE_DISPATCHED: {
      // System in alert dispatched state
      break;
    }
  }

  // --- Step D: Stream Real-Time JSON Telemetry to SafeRide Web App (10Hz) ---
  if (now - lastTelemetryStreamTime >= 100) {
    lastTelemetryStreamTime = now;

    int secondsLeft = (currentState == STATE_COUNTDOWN) ? (COUNTDOWN_SECONDS - (now - countdownStartTime) / 1000) : 0;
    if (secondsLeft < 0) secondsLeft = 0;

    StaticJsonDocument<256> doc;
    doc["deviceId"] = "ESP32-DEV-01";
    doc["vehicleNumber"] = VEHICLE_REG_NO;
    doc["gForce"] = round(gForce * 100) / 100.0;
    doc["ax"] = round(ax * 100) / 100.0;
    doc["ay"] = round(ay * 100) / 100.0;
    doc["az"] = round(az * 100) / 100.0;
    doc["pitch"] = round(pitch * 10) / 10.0;
    doc["roll"] = round(roll * 10) / 10.0;
    doc["jerk"] = round(jerk * 10) / 10.0;
    doc["sosButtonPressed"] = isSosPressed;
    doc["state"] = (currentState == STATE_NORMAL) ? "NORMAL" : ((currentState == STATE_COUNTDOWN) ? "COUNTDOWN" : "DISPATCHED");
    doc["countdown"] = secondsLeft;

    serializeJson(doc, Serial);
    Serial.println();
  }

  delay(20); // 50Hz internal loop cycle
}

// ============================================================================
// MPU6050/6500 Raw I2C Helper Functions
// ============================================================================

bool initMPU() {
  // Wake up the sensor (it starts in sleep mode)
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(REG_PWR_MGMT_1);
  Wire.write(0);
  byte error = Wire.endTransmission(true);
  if (error != 0) return false;

  // Set gyro range to +/-500 deg/s (FS_SEL=1 -> bits 4:3 = 01 -> 0x08)
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(REG_GYRO_CONFIG);
  Wire.write(0x08);
  Wire.endTransmission(true);

  // Set accel range to +/-8G (AFS_SEL=2 -> bits 4:3 = 10 -> 0x10)
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(REG_ACCEL_CONFIG);
  Wire.write(0x10);
  Wire.endTransmission(true);

  // Set digital low-pass filter to ~21Hz (DLPF_CFG=4)
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(REG_CONFIG);
  Wire.write(0x04);
  Wire.endTransmission(true);

  return true;
}

void readMPU(float &ax, float &ay, float &az, float &gx, float &gy, float &gz, float &tempC) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(REG_ACCEL_XOUT_H);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 14, true);

  int16_t rawAx = Wire.read() << 8 | Wire.read();
  int16_t rawAy = Wire.read() << 8 | Wire.read();
  int16_t rawAz = Wire.read() << 8 | Wire.read();
  int16_t rawTemp = Wire.read() << 8 | Wire.read();
  int16_t rawGx = Wire.read() << 8 | Wire.read();
  int16_t rawGy = Wire.read() << 8 | Wire.read();
  int16_t rawGz = Wire.read() << 8 | Wire.read();

  ax = rawAx / ACCEL_SENSITIVITY;   // g
  ay = rawAy / ACCEL_SENSITIVITY;
  az = rawAz / ACCEL_SENSITIVITY;

  gx = rawGx / GYRO_SENSITIVITY;    // deg/s
  gy = rawGy / GYRO_SENSITIVITY;
  gz = rawGz / GYRO_SENSITIVITY;

  tempC = (rawTemp / 340.0) + 36.53;
}

// ============================================================================
// SIM800L GSM Helper Functions
// ============================================================================

void sendATCommand(String cmd, unsigned long timeout) {
  sim800.println(cmd);
  unsigned long start = millis();
  while (millis() - start < timeout) {
    while (sim800.available()) {
      char c = sim800.read();
      // Optional: Serial.write(c);
    }
  }
}

void initSIM800L() {
  Serial.println("[GSM] Initializing SIM800L modem...");
  sendATCommand("AT", 1000);
  sendATCommand("ATE0", 1000);      // Echo off
  sendATCommand("AT+CMGF=1", 1000);  // Text mode for SMS
  sendATCommand("AT+CSCS=\\"GSM\\"", 1000);
  sendATCommand("AT+CSQ", 1000);     // Check Signal Quality
  Serial.println("[GSM] SIM800L Modem Initialized.");
}

void sendEmergencySMS(String reason, float gVal, float rollVal) {
  Serial.println("[GSM] Sending Cellular Emergency SMS Broadcast...");

  String message = "EMERGENCY ALERT: SafeRide AI Crash Detected!\\n";
  message += "Vehicle: " + String(VEHICLE_REG_NO) + "\\n";
  message += "Driver: " + String(DRIVER_NAME) + " (Blood: " + String(BLOOD_GROUP) + ")\\n";
  message += "Impact: " + String(gVal, 1) + "G | Tilt: " + String(rollVal, 1) + " deg\\n";
  message += "Event: " + reason + "\\n";
  message += "Location: https://maps.google.com/?q=28.6139,77.2090\\n";
  message += "Auto-dispatched by SafeRide AI.";

  // Send to Emergency Contact 1
  sim800.println("AT+CMGS=\\"" + String(EMERGENCY_NUMBER_1) + "\\"");
  delay(500);
  sim800.print(message);
  delay(500);
  sim800.write(26); // Ctrl+Z to send
  delay(3000);

  Serial.println("[GSM] SMS Broadcast Sent.");
}

void makeEmergencyCall(const char* phoneNumber) {
  Serial.printf("[GSM] Dialing Emergency Number: %s ...\\n", phoneNumber);
  sim800.printf("ATD%s;\\r\\n", phoneNumber);
  delay(10000); // Ring for 10 seconds
  sim800.println("ATH"); // Hang up
}

void beepBuzzer(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(delayMs);
    digitalWrite(BUZZER_PIN, LOW);
    delay(delayMs);
  }
}`}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
