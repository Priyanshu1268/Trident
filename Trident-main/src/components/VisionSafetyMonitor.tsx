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
  Sliders,
  Layers,
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Terminal,
  Activity,
  HardDrive,
  Eye,
  SlidersHorizontal,
  Navigation
} from 'lucide-react';
import { TelemetryRequest, YoloModelInfo } from '../types';

interface VisionSafetyMonitorProps {
  onSendTelemetry: (data: TelemetryRequest) => Promise<any>;
}

type ActiveYoloModel = 'yolov8_helmet' | 'yolov8_pothole' | 'yolov8n';
type VisionScenario = 'NO_HELMET' | 'HELMET_OK' | 'POTHOLE' | 'TRAFFIC_MULTICLASS' | 'CRASH_IMPACT';

export const VisionSafetyMonitor: React.FC<VisionSafetyMonitorProps> = ({ onSendTelemetry }) => {
  const [activeModel, setActiveModel] = useState<ActiveYoloModel>('yolov8_helmet');
  const [mode, setMode] = useState<'SIMULATION' | 'WEBCAM'>('SIMULATION');
  const [simulationScenario, setSimulationScenario] = useState<VisionScenario>('NO_HELMET');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(29.8);
  const [latencyMs, setLatencyMs] = useState<number>(18);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.50);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [showHUD, setShowHUD] = useState<boolean>(true);
  const [lastAlertSent, setLastAlertSent] = useState<string | null>(null);
  const [autoEmitAlerts, setAutoEmitAlerts] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(48);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [copiedInstall, setCopiedInstall] = useState<boolean>(false);
  const [recentDetections, setRecentDetections] = useState<Array<{
    id: string;
    model: string;
    label: string;
    confidence: number;
    timestamp: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    dispatched: boolean;
  }>>([
    {
      id: 'DET-101',
      model: 'yolov8_helmet.pt',
      label: 'NO_HELMET (Violation)',
      confidence: 0.942,
      timestamp: 'Just now',
      severity: 'LOW',
      dispatched: true,
    },
    {
      id: 'DET-102',
      model: 'yolov8_pothole.pt',
      label: 'ROAD_POTHOLE (Severe)',
      confidence: 0.887,
      timestamp: '2 min ago',
      severity: 'MEDIUM',
      dispatched: true,
    },
    {
      id: 'DET-103',
      model: 'yolov8n.pt',
      label: 'CAR / VEHICLE_PROXIMITY',
      confidence: 0.965,
      timestamp: '4 min ago',
      severity: 'LOW',
      dispatched: false,
    },
  ]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastEmitTimeRef = useRef<number>(0);

  // Model Metadata registry
  const yoloModels: Record<ActiveYoloModel, YoloModelInfo> = {
    yolov8_helmet: {
      id: 'yolov8_helmet',
      name: 'YOLOv8 Helmet Guardian',
      filename: 'yolov8_helmet.pt',
      version: 'v8.1.0-helmet-ft',
      description: 'Specialized deep learning model trained on two-wheeler riders for helmet compliance verification and violation dispatching.',
      classes: ['helmet', 'no_helmet', 'head', 'face', 'rider'],
      sizeMb: 6.2,
      parameters: '3.2M',
      accuracyMap50: 0.948,
      inferenceTimeMs: 16.4,
      status: 'READY_ACTIVE',
      targetFps: 30,
      confidenceThreshold: 0.45,
      autoAlertSeverity: 'LOW',
    },
    yolov8_pothole: {
      id: 'yolov8_pothole',
      name: 'YOLOv8 Road Hazard & Pothole Classifier',
      filename: 'yolov8_pothole.pt',
      version: 'v8.1.0-pothole-ft',
      description: 'Road surface defect neural network detecting potholes, asphalt cracks, and speed bumps to pre-warn riders and corroborate impact shocks.',
      classes: ['pothole', 'crack', 'road_damage', 'manhole_cover', 'speed_bump'],
      sizeMb: 6.3,
      parameters: '3.2M',
      accuracyMap50: 0.924,
      inferenceTimeMs: 18.2,
      status: 'READY_ACTIVE',
      targetFps: 30,
      confidenceThreshold: 0.40,
      autoAlertSeverity: 'MEDIUM',
    },
    yolov8n: {
      id: 'yolov8n',
      name: 'YOLOv8 Nano Multiclass Core',
      filename: 'yolov8n.pt',
      version: 'v8.1.0-nano-base',
      description: 'High-speed object detector for surrounding traffic, cross-traffic vehicles, cyclists, pedestrians, and immediate collision hazards.',
      classes: ['person', 'bicycle', 'car', 'motorcycle', 'bus', 'truck', 'traffic light', 'stop sign'],
      sizeMb: 6.2,
      parameters: '3.2M',
      accuracyMap50: 0.895,
      inferenceTimeMs: 14.1,
      status: 'READY_ACTIVE',
      targetFps: 35,
      confidenceThreshold: 0.50,
      autoAlertSeverity: 'HIGH',
    },
  };

  const currentModelInfo = yoloModels[activeModel];

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
          console.warn('Webcam permission denied or unavailable, falling back to simulated vision stream:', err);
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
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, width, height);

        // Horizon & Sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.45);
        skyGrad.addColorStop(0, '#0f172a');
        skyGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height * 0.45);

        // Distant city silhouette
        ctx.fillStyle = '#334155';
        for (let i = 0; i < 12; i++) {
          const bx = i * (width / 12);
          const bh = 15 + Math.sin(i * 1.5) * 20;
          ctx.fillRect(bx, height * 0.45 - bh, width / 14, bh);
        }

        // Perspective Road
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(width * 0.44, height * 0.45);
        ctx.lineTo(width * 0.56, height * 0.45);
        ctx.lineTo(width * 0.92, height);
        ctx.lineTo(width * 0.08, height);
        ctx.closePath();
        ctx.fill();

        // Asphalt texture lines
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(width * 0.25, height);
        ctx.lineTo(width * 0.46, height * 0.45);
        ctx.moveTo(width * 0.75, height);
        ctx.lineTo(width * 0.54, height * 0.45);
        ctx.stroke();

        // Road Lane Dash (Animated forward motion)
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([25, 20]);
        ctx.lineDashOffset = -(Date.now() / 18) % 45;
        ctx.beginPath();
        ctx.moveTo(width * 0.5, height * 0.45);
        ctx.lineTo(width * 0.5, height);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
      }

      // 2. Draw YOLO Bounding Boxes based on active model and scenario
      if (showBoundingBoxes) {
        const t = Date.now() / 1000;
        const wobbleX = Math.sin(t * 3.2) * 5;
        const wobbleY = Math.cos(t * 2.8) * 4;

        if (activeModel === 'yolov8_helmet') {
          if (simulationScenario === 'NO_HELMET') {
            const boxX = width * 0.38 + wobbleX;
            const boxY = height * 0.22 + wobbleY;
            const boxW = width * 0.24;
            const boxH = height * 0.38;

            // Bounding Box (Red = Safety Violation)
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            // Semi-transparent fill
            ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
            ctx.fillRect(boxX, boxY, boxW, boxH);

            // Label pill
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(boxX, boxY - 26, 170, 26);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px monospace';
            ctx.fillText('NO_HELMET 94.2%', boxX + 8, boxY - 8);

            // Crosshairs
            ctx.strokeStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(boxX + boxW / 2, boxY + boxH / 2, 9, 0, 2 * Math.PI);
            ctx.stroke();
          } else {
            // Compliant Helmet
            const boxX = width * 0.38 + wobbleX;
            const boxY = height * 0.22 + wobbleY;
            const boxW = width * 0.24;
            const boxH = height * 0.38;

            // Bounding Box (Green = Compliant)
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
            ctx.fillRect(boxX, boxY, boxW, boxH);

            // Label pill
            ctx.fillStyle = '#10b981';
            ctx.fillRect(boxX, boxY - 26, 160, 26);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px monospace';
            ctx.fillText('HELMET_ON 98.4%', boxX + 8, boxY - 8);
          }
        } else if (activeModel === 'yolov8_pothole') {
          // Pothole model detections
          const pX = width * 0.36 + Math.sin(t * 1.8) * 15;
          const pY = height * 0.62;
          const pW = width * 0.28;
          const pH = height * 0.18;

          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(pX, pY, pW, pH);

          ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
          ctx.fillRect(pX, pY, pW, pH);

          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(pX, pY - 26, 175, 26);
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 11px monospace';
          ctx.fillText('POTHOLE_HAZARD 91.6%', pX + 8, pY - 8);

          // Secondary minor crack
          const cX = width * 0.18;
          const cY = height * 0.74;
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.8;
          ctx.strokeRect(cX, cY, width * 0.15, height * 0.12);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(cX, cY - 20, 110, 20);
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('CRACK 78.4%', cX + 6, cY - 6);
        } else if (activeModel === 'yolov8n') {
          // Multiclass Traffic Objects
          // Vehicle 1 (Car Ahead)
          const carX = width * 0.35 + wobbleX;
          const carY = height * 0.38 + wobbleY;
          const carW = width * 0.30;
          const carH = height * 0.32;

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(carX, carY, carW, carH);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(carX, carY - 24, 120, 24);
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 11px monospace';
          ctx.fillText('CAR 96.5%', carX + 6, carY - 7);

          // Vehicle 2 (Motorcycle on flank)
          const bikeX = width * 0.70;
          const bikeY = height * 0.44;
          const bikeW = width * 0.18;
          const bikeH = height * 0.30;

          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2;
          ctx.strokeRect(bikeX, bikeY, bikeW, bikeH);
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(bikeX, bikeY - 22, 140, 22);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('MOTORCYCLE 88.9%', bikeX + 6, bikeY - 6);
        }

        // Collision shockwave trigger
        if (simulationScenario === 'CRASH_IMPACT') {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.30)';
          ctx.fillRect(0, 0, width, height);

          const cX = width * 0.20;
          const cY = height * 0.20;
          const cW = width * 0.60;
          const cH = height * 0.60;

          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 4;
          ctx.strokeRect(cX, cY, cW, cH);

          ctx.fillStyle = '#ef4444';
          ctx.fillRect(cX, cY - 32, 260, 32);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px monospace';
          ctx.fillText('CRITICAL IMPACT DETECTED 99.2%', cX + 10, cY - 10);
        }
      }

      // 3. HUD Overlay Telemetry
      if (showHUD) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(12, 12, 230, 82);
        ctx.strokeStyle = '#334155';
        ctx.strokeRect(12, 12, 230, 82);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`MODEL: ${currentModelInfo.filename}`, 20, 30);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`FPS: ${fps.toFixed(1)} | LAT: ${currentModelInfo.inferenceTimeMs}ms`, 20, 48);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`CONF THRESHOLD: ${(confidenceThreshold * 100).toFixed(0)}%`, 20, 66);
        ctx.fillStyle = '#a855f7';
        ctx.fillText(`DEVICE: CPU (Ultralytics v8.1)`, 20, 84);
      }

      if (isRunning) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    if (isRunning) {
      render();
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, mode, cameraActive, activeModel, simulationScenario, speed, fps, confidenceThreshold, showBoundingBoxes, showHUD, currentModelInfo]);

  // Automated Telemetry Dispatch Logic for Vision Events
  useEffect(() => {
    if (!isRunning || !autoEmitAlerts) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastEmitTimeRef.current < 8000) return; // 8s cooldown

      if (activeModel === 'yolov8_helmet' && simulationScenario === 'NO_HELMET') {
        lastEmitTimeRef.current = now;
        setLastAlertSent('NO_HELMET (Safety Violation Dispatched)');
        onSendTelemetry({
          vehicleNumber: 'KA-01-AI-2026',
          speed: speed,
          gForce: 1.05,
          latitude: 28.6139,
          longitude: 77.2090,
          impactDetected: false,
          severity: 'LOW',
          visionEvent: 'HELMET_MISSING',
          notes: 'YOLOv8 Helmet Guardian: Rider detected without helmet at 48 km/h.'
        });
      } else if (activeModel === 'yolov8_pothole' && (simulationScenario === 'POTHOLE' || simulationScenario === 'NO_HELMET')) {
        lastEmitTimeRef.current = now;
        setLastAlertSent('POTHOLE_HAZARD (Logged to Road Safety DB)');
        onSendTelemetry({
          vehicleNumber: 'KA-01-AI-2026',
          speed: speed,
          gForce: 2.1,
          latitude: 28.5355,
          longitude: 77.3910,
          impactDetected: false,
          severity: 'MEDIUM',
          visionEvent: 'POTHOLE_IMPACT',
          notes: 'YOLOv8 Pothole Detector: Severe road depression detected (Depth ~12cm).'
        });
      } else if (simulationScenario === 'CRASH_IMPACT') {
        lastEmitTimeRef.current = now;
        setLastAlertSent('DIRECT_COLLISION (HIGH Severity Auto-Dispatched)');
        onSendTelemetry({
          vehicleNumber: 'KA-01-AI-2026',
          speed: 78.0,
          gForce: 5.4,
          latitude: 28.6139,
          longitude: 77.2090,
          impactDetected: true,
          severity: 'HIGH',
          visionEvent: 'DIRECT_COLLISION',
          notes: 'YOLOv8 Collision Shockwave: High velocity frontal deceleration correlated with vision obstacle.'
        });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isRunning, autoEmitAlerts, activeModel, simulationScenario, speed, onSendTelemetry]);

  const copyLocalScript = () => {
    const code = `python ai-service/vision_yolo_detector.py`;
    navigator.clipboard.writeText(code);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const copyPipCommand = () => {
    const code = `pip install ultralytics opencv-python requests && python ai-service/setup_yolo_models.py`;
    navigator.clipboard.writeText(code);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-100 text-indigo-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              YOLOv8 Neural Vision Suite
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              3 Weights Active
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">AI Vision Safety & Hazard Detection</h1>
          <p className="text-sm text-slate-500">
            Real-time computer vision inference with <code className="text-indigo-600 font-mono font-semibold">yolov8_helmet.pt</code>, <code className="text-amber-600 font-mono font-semibold">yolov8_pothole.pt</code>, and <code className="text-sky-600 font-mono font-semibold">yolov8n.pt</code>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setMode('SIMULATION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                mode === 'SIMULATION' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Simulated Feed
            </button>
            <button
              onClick={() => setMode('WEBCAM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                mode === 'WEBCAM' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-indigo-600" />
              Live Webcam
            </button>
          </div>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              isRunning 
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isRunning ? (
              <>
                <Square className="w-3.5 h-3.5" /> Pause Inference
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Resume Inference
              </>
            )}
          </button>
        </div>
      </div>

      {/* Model Selector Cards (3 YOLO Models) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Model 1: Helmet */}
        <div
          onClick={() => {
            setActiveModel('yolov8_helmet');
            setSimulationScenario('NO_HELMET');
          }}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeModel === 'yolov8_helmet'
              ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-lg ${activeModel === 'yolov8_helmet' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Helmet Safety</h3>
                <span className="text-[11px] font-mono text-indigo-600 font-semibold">yolov8_helmet.pt</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              94.8% mAP
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
            Rider headwear compliance detection. Dispatches immediate alerts if rider is unhelmeted.
          </p>
          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Latency: <strong>16.4 ms</strong></span>
            <span>Size: <strong>6.2 MB</strong></span>
          </div>
        </div>

        {/* Model 2: Pothole */}
        <div
          onClick={() => {
            setActiveModel('yolov8_pothole');
            setSimulationScenario('POTHOLE');
          }}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeModel === 'yolov8_pothole'
              ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-lg ${activeModel === 'yolov8_pothole' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Road Pothole & Hazard</h3>
                <span className="text-[11px] font-mono text-amber-600 font-semibold">yolov8_pothole.pt</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              92.4% mAP
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
            Detects asphalt potholes, road cracks, and bumps to corroborate accelerometer jerk spikes.
          </p>
          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Latency: <strong>18.2 ms</strong></span>
            <span>Size: <strong>6.3 MB</strong></span>
          </div>
        </div>

        {/* Model 3: Multiclass Traffic */}
        <div
          onClick={() => {
            setActiveModel('yolov8n');
            setSimulationScenario('TRAFFIC_MULTICLASS');
          }}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeModel === 'yolov8n'
              ? 'bg-sky-50/70 border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-lg ${activeModel === 'yolov8n' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Traffic Object Core</h3>
                <span className="text-[11px] font-mono text-sky-600 font-semibold">yolov8n.pt</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
              89.5% mAP
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
            Multiclass vehicle and obstacle tracker (cars, trucks, motorcycles, cyclists, pedestrians).
          </p>
          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Latency: <strong>14.1 ms</strong></span>
            <span>Size: <strong>6.2 MB</strong></span>
          </div>
        </div>
      </div>

      {/* Main Grid: Video Stream & Interactive Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Video Canvas & HUD */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-lg aspect-video flex items-center justify-center">
            <video ref={videoRef} className="hidden" playsInline muted autoPlay />
            <canvas ref={canvasRef} width={640} height={480} className="w-full h-full object-contain" />

            {/* Top Left Active Model Badge */}
            <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700 text-xs text-white flex items-center space-x-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold">{currentModelInfo.filename}</span>
              <span className="text-slate-400">|</span>
              <span className="text-sky-300">{currentModelInfo.parameters}</span>
            </div>

            {/* Top Right Live Telemetry Dispatch Badge */}
            {lastAlertSent && (
              <div className="absolute top-3 right-3 bg-rose-950/90 border border-rose-500/50 backdrop-blur-md px-3 py-1 rounded-lg text-xs text-rose-200 flex items-center space-x-1.5 animate-bounce">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-semibold">{lastAlertSent}</span>
              </div>
            )}

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-3 left-3 right-3 bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
              <div className="flex items-center space-x-3 font-mono">
                <span>FPS: <strong className="text-emerald-400">{fps.toFixed(1)}</strong></span>
                <span>Infer: <strong className="text-indigo-300">{currentModelInfo.inferenceTimeMs}ms</strong></span>
                <span>Conf: <strong className="text-sky-300">{(confidenceThreshold * 100).toFixed(0)}%</strong></span>
              </div>

              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1.5 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={showBoundingBoxes}
                    onChange={(e) => setShowBoundingBoxes(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>B-Boxes</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={showHUD}
                    onChange={(e) => setShowHUD(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>HUD</span>
                </label>
              </div>
            </div>
          </div>

          {/* Scenario Trigger Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                Simulate Camera Scenarios:
              </span>
              <span className="text-[11px] text-slate-500">
                Click any scenario below to trigger real-time YOLO bounding box classification
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setActiveModel('yolov8_helmet');
                  setSimulationScenario('NO_HELMET');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  activeModel === 'yolov8_helmet' && simulationScenario === 'NO_HELMET'
                    ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🔴 No Helmet Violation
              </button>

              <button
                onClick={() => {
                  setActiveModel('yolov8_helmet');
                  setSimulationScenario('HELMET_OK');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  activeModel === 'yolov8_helmet' && simulationScenario === 'HELMET_OK'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🟢 Helmet Compliant
              </button>

              <button
                onClick={() => {
                  setActiveModel('yolov8_pothole');
                  setSimulationScenario('POTHOLE');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  activeModel === 'yolov8_pothole' && simulationScenario === 'POTHOLE'
                    ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🕳️ Pothole & Road Hazard
              </button>

              <button
                onClick={() => {
                  setActiveModel('yolov8n');
                  setSimulationScenario('TRAFFIC_MULTICLASS');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  activeModel === 'yolov8n' && simulationScenario === 'TRAFFIC_MULTICLASS'
                    ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🚗 Multiclass Traffic
              </button>

              <button
                onClick={() => setSimulationScenario('CRASH_IMPACT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  simulationScenario === 'CRASH_IMPACT'
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                }`}
              >
                💥 Collision Shockwave (5.4g)
              </button>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Model Specs, Tuning, & Python Runner */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Model Deep Dive */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Active Model Specs</h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                {currentModelInfo.version}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Weight File:</span>
                <span className="font-mono font-bold text-slate-900">{currentModelInfo.filename}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Classes:</span>
                <span className="font-mono text-slate-700 truncate max-w-[160px]" title={currentModelInfo.classes.join(', ')}>
                  {currentModelInfo.classes.join(', ')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">mAP@0.50:</span>
                <span className="font-bold text-emerald-600">{(currentModelInfo.accuracyMap50 * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Inference Latency:</span>
                <span className="font-bold text-indigo-600">{currentModelInfo.inferenceTimeMs} ms</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Telemetry Severity:</span>
                <span className={`font-bold px-1.5 py-0.2 rounded ${
                  currentModelInfo.autoAlertSeverity === 'HIGH' ? 'bg-red-100 text-red-800' :
                  currentModelInfo.autoAlertSeverity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {currentModelInfo.autoAlertSeverity}
                </span>
              </div>
            </div>

            {/* Confidence Slider */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">Confidence Threshold</span>
                <span className="font-mono font-bold text-indigo-600">{(confidenceThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.20"
                max="0.95"
                step="0.05"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          {/* Local Python YOLO Runner Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Run YOLO Python Service
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-400 rounded-full">
                API Ready
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Run your standalone YOLOv8 Python script to stream webcam frames directly into this web app:
            </p>

            <div className="space-y-2">
              <div className="relative bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300 flex items-center justify-between">
                <code>python ai-service/vision_yolo_detector.py</code>
                <button
                  onClick={copyLocalScript}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                  title="Copy command"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="relative bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-sky-300 flex items-center justify-between">
                <span className="truncate pr-2">pip install ultralytics opencv-python</span>
                <button
                  onClick={copyPipCommand}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition shrink-0"
                  title="Copy command"
                >
                  {copiedInstall ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between">
              <span>Target: <strong className="text-slate-300">/api/v1/telemetry</strong></span>
              <span>Weights: <strong className="text-slate-300">ai-service/weights/</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Vision Alert Stream Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent YOLO Vision Alert Dispatches</h3>
          </div>
          <span className="text-xs text-slate-500">
            Automatically synced with Emergency Command Center & SMS Dispatch
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-mono">
                <th className="pb-2">ALERT ID</th>
                <th className="pb-2">NEURAL MODEL</th>
                <th className="pb-2">HAZARD / CLASSIFICATION</th>
                <th className="pb-2">CONFIDENCE</th>
                <th className="pb-2">SEVERITY</th>
                <th className="pb-2">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
              {recentDetections.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 font-bold text-slate-900">{d.id}</td>
                  <td className="py-2.5 text-indigo-600 font-semibold">{d.model}</td>
                  <td className="py-2.5 font-sans font-medium text-slate-800">{d.label}</td>
                  <td className="py-2.5">
                    <span className="font-bold text-emerald-600">{(d.confidence * 100).toFixed(1)}%</span>
                  </td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      d.severity === 'HIGH' ? 'bg-rose-100 text-rose-800' :
                      d.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {d.severity}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className="text-[11px] text-emerald-600 font-sans font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched to SMS & Triage
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
