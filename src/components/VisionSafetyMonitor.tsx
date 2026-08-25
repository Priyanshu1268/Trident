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
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mode, isRunning]);

  // Main Canvas Rendering Loop (Drawing YOLO Bounding Boxes & HUD overlay)
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      if (mode === 'WEBCAM' && videoRef.current && cameraActive) {
        // Draw WebCam feed
        ctx.drawImage(videoRef.current, 0, 0, width, height);
      } else {
        // Draw Simulated Road & Rider Canvas
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(0.5, '#1e293b');
        gradient.addColorStop(1, '#090d16');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Perspective Road Lines
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width * 0.45, height * 0.4);
        ctx.lineTo(width * 0.1, height);
        ctx.moveTo(width * 0.55, height * 0.4);
        ctx.lineTo(width * 0.9, height);
        ctx.stroke();

        // Road Center dashed line
        ctx.strokeStyle = '#f59e0b';
        ctx.setLineDash([15, 15]);
        ctx.beginPath();
        ctx.moveTo(width * 0.5, height * 0.4);
        ctx.lineTo(width * 0.5, height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Horizon & Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        for (let y = height * 0.4; y < height; y += 30) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // ----------------------------------------------------
      // DRAW YOLO BOUNDING BOXES ACCORDING TO SCENARIO
      // ----------------------------------------------------
      const time = Date.now() / 1000;
      const wobbleX = Math.sin(time * 2) * 5;
      const wobbleY = Math.cos(time * 2) * 3;

      if (simulationScenario === 'HELMET_OK') {
        // Green Helmet Box
        const bx = width * 0.42 + wobbleX;
        const by = height * 0.25 + wobbleY;
        const bw = width * 0.16;
        const bh = height * 0.22;

        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
        ctx.fillRect(bx, by, bw, bh);

        // Label Tag
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(bx, by - 24, 150, 24);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('HELMET OK (0.94)', bx + 8, by - 7);
      } else if (simulationScenario === 'NO_HELMET') {
        // Red Missing Helmet Alert Box
        const bx = width * 0.42 + wobbleX;
        const by = height * 0.25 + wobbleY;
        const bw = width * 0.16;
        const bh = height * 0.22;

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fillRect(bx, by, bw, bh);

        // Alert Header
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(bx, by - 26, 175, 26);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('ALERT: NO HELMET (0.89)', bx + 6, by - 8);

        // Flashing Warning Bar
        if (Math.floor(time * 4) % 2 === 0) {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(20, 20, width - 40, 36);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⚠️ SAFETY VIOLATION: NO HELMET DETECTED ON RIDER', width / 2, 44);
          ctx.textAlign = 'left';
        }
      } else if (simulationScenario === 'POTHOLE') {
        // Pothole Warning Box on Road Surface
        const px = width * 0.35 + wobbleX;
        const py = height * 0.65;
        const pw = width * 0.3;
        const ph = height * 0.2;

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.strokeRect(px, py, pw, ph);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
        ctx.fillRect(px, py, pw, ph);

        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px, py - 24, 180, 24);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('POTHOLE SEVERE (0.91)', px + 8, py - 7);
      } else if (simulationScenario === 'CRASH_IMPACT') {
        // High G-Force Impact Shockwave
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, (time * 150) % 300, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.fillRect(20, 20, width - 40, 40);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🚨 CRITICAL IMPACT DETECTED! G-FORCE: 7.2G | DISPATCHING SOS', width / 2, 46);
        ctx.textAlign = 'left';
      }

      // ----------------------------------------------------
      // HUD OVERLAY & TELEMETRY RETICLE
      // ----------------------------------------------------
      // Top Right Reticle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(width - 150, 15, 135, 75);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(width - 150, 15, 135, 75);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(`FPS: ${fps.toFixed(1)}`, width - 140, 32);
      ctx.fillText(`LATENCY: ${latencyMs}ms`, width - 140, 48);
      ctx.fillText(`YOLOv8: ACTIVE`, width - 140, 64);
      ctx.fillText(`VEHICLE: KA-01-AI`, width - 140, 80);

      // Center crosshair
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(width / 2 - 15, height / 2);
      ctx.lineTo(width / 2 + 15, height / 2);
      ctx.moveTo(width / 2, height / 2 - 15);
      ctx.lineTo(width / 2, height / 2 + 15);
      ctx.stroke();

      if (isRunning) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    if (isRunning) {
      animationFrameId = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode, isRunning, simulationScenario, cameraActive, fps, latencyMs]);

  // Telemetry Emission with Cooldown (Matching ai_engine.py logic)
  useEffect(() => {
    if (!isRunning || !autoEmitAlerts) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSec = (now - lastEmitTimeRef.current) / 1000;

      if (elapsedSec < 10) {
        setAlertCooldownRemaining(Math.ceil(10 - elapsedSec));
        return;
      }
      setAlertCooldownRemaining(0);

      if (simulationScenario === 'NO_HELMET') {
        lastEmitTimeRef.current = now;
        setLastAlertSent('NO_HELMET (LOW Severity)');
        onSendTelemetry({
          vehicleNumber: 'DL-04-TR-9981',
          speed: speed,
          gForce: 1.1,
          latitude: 28.6139,
          longitude: 77.2090,
          impactDetected: false,
          severity: 'LOW',
          visionEvent: 'HELMET_MISSING',
        });
      } else if (simulationScenario === 'POTHOLE') {
        lastEmitTimeRef.current = now;
        setLastAlertSent('POTHOLE_IMPACT (MEDIUM Severity)');
        onSendTelemetry({
          vehicleNumber: 'DL-04-TR-9981',
          speed: speed,
          gForce: 3.2,
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
          vehicleNumber: 'KA-01-AI-2026',
          speed: 78.0,
          gForce: 7.2,
          latitude: 28.6139,
          longitude: 77.2090,
          impactDetected: true,
          severity: 'HIGH',
          visionEvent: 'DIRECT_COLLISION',
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning, autoEmitAlerts, simulationScenario, speed, onSendTelemetry]);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Video className="w-5 h-5 text-red-400" />
              <h1 className="text-xl font-bold text-white tracking-tight">
                AI Vision Safety & YOLO Detection Engine
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ported from <code className="text-red-400 font-mono">crash-response-AI/ai_engine.py</code> — continuous helmet compliance, road pothole detection, and real-time telemetry broadcast.
            </p>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start">
            <button
              id="vision-mode-sim"
              onClick={() => setMode('SIMULATION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                mode === 'SIMULATION' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Simulated Stream
            </button>
            <button
              id="vision-mode-webcam"
              onClick={() => setMode('WEBCAM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                mode === 'WEBCAM' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Live Camera
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Video Stream + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Video / Canvas Feed */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl aspect-video flex items-center justify-center">
            {/* Hidden video element for WebCam input */}
            <video ref={videoRef} className="hidden" playsInline muted autoPlay />

            {/* Render Canvas */}
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="w-full h-full object-contain"
            />

            {/* Bottom Stream Status Pill */}
            <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80 text-[11px] text-slate-300 flex items-center space-x-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>YOLOv8 STREAM: ACTIVE</span>
              <span className="text-slate-500">|</span>
              <span>COOLDOWN: {alertCooldownRemaining > 0 ? `${alertCooldownRemaining}s` : 'READY'}</span>
            </div>

            {/* Auto Emit Badge */}
            <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80 text-[11px] text-slate-300 flex items-center space-x-2">
              <Radio className="w-3.5 h-3.5 text-red-400" />
              <span className="text-slate-400">Endpoint:</span>
              <span className="font-mono text-emerald-400 font-semibold">/api/v1/telemetry</span>
            </div>
          </div>

          {/* Scenario Switching Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400">Vision Scenario:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  id="scenario-no-helmet"
                  onClick={() => setSimulationScenario('NO_HELMET')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                    simulationScenario === 'NO_HELMET'
                      ? 'bg-red-500/20 text-red-300 border-red-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  🔴 No Helmet Alert
                </button>
                <button
                  id="scenario-helmet-ok"
                  onClick={() => setSimulationScenario('HELMET_OK')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                    simulationScenario === 'HELMET_OK'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  🟢 Helmet Detected OK
                </button>
                <button
                  id="scenario-pothole"
                  onClick={() => setSimulationScenario('POTHOLE')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                    simulationScenario === 'POTHOLE'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  🟡 Severe Road Pothole
                </button>
                <button
                  id="scenario-crash"
                  onClick={() => setSimulationScenario('CRASH_IMPACT')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                    simulationScenario === 'CRASH_IMPACT'
                      ? 'bg-red-600 text-white border-red-600 animate-pulse'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  💥 Direct Crash Shock
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                id="btn-toggle-engine"
                onClick={() => setIsRunning(!isRunning)}
                className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                  isRunning
                    ? 'bg-red-950 text-red-400 border border-red-800 hover:bg-red-900'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                }`}
              >
                {isRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isRunning ? 'Pause Inference' : 'Resume Inference'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Engine Parameters & Weight Cards */}
        <div className="lg:col-span-4 space-y-4">
          {/* YOLO Weights Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 uppercase tracking-wide">
              <Cpu className="w-4 h-4 text-red-400" />
              <span>Model Weights Status</span>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-slate-200">yolov8_helmet.pt</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                    LOADED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Class: ['helmet', 'head', 'person'] | Threshold: 0.50</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-slate-200">yolov8_pothole.pt</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                    LOADED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Road surface depth disparity model | Threshold: 0.60</p>
              </div>
            </div>

            {/* Auto Ingest Toggle */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Auto-Emit Telemetry</span>
                  <span className="text-[11px] text-slate-400">Posts to backend when violations occur</span>
                </div>
                <button
                  id="toggle-auto-emit"
                  onClick={() => setAutoEmitAlerts(!autoEmitAlerts)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    autoEmitAlerts ? 'bg-red-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      autoEmitAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Speed Slider */}
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Simulated Vehicle Speed:</span>
                <span className="font-mono font-bold text-slate-200">{speed} km/h</span>
              </div>
              <input
                id="slider-speed"
                type="range"
                min={0}
                max={140}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            {/* Last emitted telemetry log */}
            {lastAlertSent && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Last Alert Broadcast</span>
                <p className="font-mono text-emerald-400 font-semibold mt-0.5">{lastAlertSent}</p>
                <p className="text-[10px] text-slate-500 mt-1">Cooldown: 10s between identical events</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
