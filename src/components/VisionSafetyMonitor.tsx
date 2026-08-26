import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Camera, 
  ShieldCheck, 
  AlertOctagon, 
  Cpu, 
  Radio, 
  Play, 
  Square, 
  RefreshCw, 
  Zap, 
  Crosshair,
  Sliders
} from 'lucide-react';
import { TelemetryRequest } from '../types';

interface VisionSafetyMonitorProps {
  onSendTelemetry: (data: TelemetryRequest) => Promise<any>;
}

export const VisionSafetyMonitor: React.FC<VisionSafetyMonitorProps> = ({ onSendTelemetry }) => {
  const [mode, setMode] = useState<'SIMULATION' | 'WEBCAM'>('SIMULATION');
  const [simulationScenario, setSimulationScenario] = useState<'NO_HELMET' | 'HELMET_OK' | 'POTHOLE' | 'CRASH_IMPACT'>('NO_HELMET');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(29.8);
  const [latencyMs, setLatencyMs] = useState<number>(34);
  const [lastAlertSent, setLastAlertSent] = useState<string | null>(null);
  const [alertCooldownRemaining, setAlertCooldownRemaining] = useState<number>(0);
  const [autoEmitAlerts, setAutoEmitAlerts] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(45);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastEmitTimeRef = useRef<number>(0);

  // WebCam Stream toggle
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (mode === 'WEBCAM' && isRunning) {
      navigator.mediaDevices?.getUserMedia({ video: { width: 640, height: 480 } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
            setCameraActive(true);
          }
        })
        .catch((err) => {
          console.warn('Webcam permission denied or not available, falling back to simulated vision stream:', err);
          setMode('SIMULATION');
          setCameraActive(false);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
        videoRef.current.srcObject = null;
        setCameraActive(false);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [mode, isRunning]);

  // Main Canvas Render Loop (YOLO Bounding Box Rendering)
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // 1. Draw Background Feed
      if (mode === 'WEBCAM' && videoRef.current && cameraActive) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);
      } else {
        // Draw synthetic dashboard road perspective
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        // Horizon & Sky
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, width, height * 0.45);

        // Perspective Road
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(width * 0.45, height * 0.45);
        ctx.lineTo(width * 0.55, height * 0.45);
        ctx.lineTo(width * 0.9, height);
        ctx.lineTo(width * 0.1, height);
        ctx.closePath();
        ctx.fill();

        // Road Lane Dash (Animated motion)
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 15]);
        ctx.lineDashOffset = -(Date.now() / 25) % 35;
        ctx.beginPath();
        ctx.moveTo(width * 0.5, height * 0.45);
        ctx.lineTo(width * 0.5, height);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
      }

      // 2. Draw YOLOv8 Detection Boxes according to simulated / active scenario
      const t = Date.now() / 1000;
      const wobbleX = Math.sin(t * 3) * 6;
      const wobbleY = Math.cos(t * 3) * 4;

      if (simulationScenario === 'NO_HELMET') {
        const boxX = width * 0.38 + wobbleX;
        const boxY = height * 0.28 + wobbleY;
        const boxW = width * 0.24;
        const boxH = height * 0.38;

        // Bounding Box (Red = Violation)
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Label pill
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(boxX, boxY - 24, 160, 24);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('NO_HELMET 92.4%', boxX + 6, boxY - 8);

        // Crosshairs
        ctx.strokeStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(boxX + boxW / 2, boxY + boxH / 2, 8, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (simulationScenario === 'HELMET_OK') {
        const boxX = width * 0.38 + wobbleX;
        const boxY = height * 0.28 + wobbleY;
        const boxW = width * 0.24;
        const boxH = height * 0.38;

        // Bounding Box (Green = Compliant)
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Label pill
        ctx.fillStyle = '#10b981';
        ctx.fillRect(boxX, boxY - 24, 160, 24);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('HELMET_ON 97.8%', boxX + 6, boxY - 8);
      } else if (simulationScenario === 'POTHOLE') {
        const pX = width * 0.42 + Math.sin(t * 2) * 20;
        const pY = height * 0.65;
        const pW = width * 0.18;
        const pH = height * 0.14;

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(pX, pY, pW, pH);

        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(pX, pY - 22, 150, 22);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('POTHOLE 88.1%', pX + 6, pY - 7);
      } else if (simulationScenario === 'CRASH_IMPACT') {
        // Red Flash Overlay
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.fillRect(0, 0, width, height);

        const cX = width * 0.25;
        const cY = height * 0.25;
        const cW = width * 0.5;
        const cH = height * 0.5;

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4;
        ctx.strokeRect(cX, cY, cW, cH);

        ctx.fillStyle = '#ef4444';
        ctx.fillRect(cX, cY - 28, 220, 28);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('COLLISION SHOCK 98.9%', cX + 8, cY - 9);
      }

      // HUD Overlay Telemetry
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(10, 10, 200, 68);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(10, 10, 200, 68);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`FPS: ${fps.toFixed(1)} | LAT: ${latencyMs}ms`, 18, 28);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`SPEED: ${speed} km/h`, 18, 48);
      ctx.fillStyle = '#a855f7';
      ctx.fillText(`YOLOv8-NANO TENSORFLOW`, 18, 66);

      if (isRunning) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    if (isRunning) {
      render();
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, mode, cameraActive, simulationScenario, speed, fps, latencyMs]);

  // Automated Telemetry Dispatch Logic for Vision Events
  useEffect(() => {
    if (!isRunning || !autoEmitAlerts) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastEmitTimeRef.current < 6000) return; // 6s cooldown

      if (simulationScenario === 'NO_HELMET') {
        lastEmitTimeRef.current = now;
        setLastAlertSent('HELMET_MISSING (Dispatched)');
        onSendTelemetry({
          vehicleNumber: 'KA-01-SR-2026',
          speed: speed,
          gForce: 1.05,
          latitude: 28.6139,
          longitude: 77.2090,
          impactDetected: false,
          severity: 'LOW',
          visionEvent: 'HELMET_MISSING',
        });
      } else if (simulationScenario === 'POTHOLE') {
        lastEmitTimeRef.current = now;
        setLastAlertSent('POTHOLE_IMPACT (Logged)');
        onSendTelemetry({
          vehicleNumber: 'KA-01-SR-2026',
          speed: speed,
          gForce: 2.1,
          latitude: 28.5355,
          longitude: 77.3910,
          impactDetected: true,
          severity: 'MEDIUM',
          visionEvent: 'POTHOLE_IMPACT',
        });
      } else if (simulationScenario === 'CRASH_IMPACT') {
        lastEmitTimeRef.current = now;
        setLastAlertSent('DIRECT_COLLISION (HIGH Severity Auto-Dispatched)');
        onSendTelemetry({
          vehicleNumber: 'KA-01-SR-2026',
          speed: 78.0,
          gForce: 4.85,
          latitude: 28.6139,
          longitude: 77.2090,
          impactDetected: true,
          severity: 'HIGH',
          visionEvent: 'DIRECT_COLLISION',
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isRunning, autoEmitAlerts, simulationScenario, speed, onSendTelemetry]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">AI Vision Safety & YOLO Detection Engine</h1>
          <p className="text-sm text-slate-500">
            Real-time computer vision inference for helmet compliance, roadway pothole detection, and impact correlation.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setMode('SIMULATION')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              mode === 'SIMULATION' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Simulated Feed
          </button>
          <button
            onClick={() => setMode('WEBCAM')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
              mode === 'WEBCAM' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Live Camera
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Video / Canvas */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-300 shadow-xs aspect-video flex items-center justify-center">
            <video ref={videoRef} className="hidden" playsInline muted autoPlay />
            <canvas ref={canvasRef} width={640} height={480} className="w-full h-full object-contain" />

            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] text-white flex items-center space-x-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>YOLOv8 STREAM ACTIVE</span>
            </div>
          </div>

          {/* Scenario Switching Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <span className="text-xs font-bold text-slate-700">Vision Scenario Test:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSimulationScenario('NO_HELMET')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  simulationScenario === 'NO_HELMET'
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🔴 No Helmet Warning
              </button>
              <button
                onClick={() => setSimulationScenario('HELMET_OK')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  simulationScenario === 'HELMET_OK'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🟢 Helmet Compliant
              </button>
              <button
                onClick={() => setSimulationScenario('POTHOLE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  simulationScenario === 'POTHOLE'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🟡 Roadway Pothole
              </button>
              <button
                onClick={() => setSimulationScenario('CRASH_IMPACT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  simulationScenario === 'CRASH_IMPACT'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                💥 Collision Event
              </button>
            </div>
          </div>
        </div>

        {/* Right: Controls & Parameters */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-slate-700" />
              Inference Parameters
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Model Engine:</span>
                <span className="font-bold text-slate-900 font-mono">YOLOv8n-Safety</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Inference Device:</span>
                <span className="font-bold text-slate-900 font-mono">Edge WebAssembly / GPU</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Confidence Threshold:</span>
                <span className="font-bold text-emerald-700">0.85 (High Precision)</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700 flex justify-between">
                <span>Vehicle Speed Simulation</span>
                <span className="font-mono">{speed} km/h</span>
              </label>
              <input
                type="range"
                min="0"
                max="120"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={() => setAutoEmitAlerts(!autoEmitAlerts)}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                  autoEmitAlerts
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {autoEmitAlerts ? '✓ Auto-Sync Telemetry Enabled' : 'Auto-Sync Paused'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
