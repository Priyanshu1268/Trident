export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type AlertStatus =
  | 'PENDING'
  | 'CONFIRMATION_COUNTDOWN'
  | 'AMBULANCE_DISPATCHED'
  | 'HOSPITAL_NOTIFIED'
  | 'POLICE_ALERTED'
  | 'RESOLVED'
  | 'FALSE_ALARM';

export type VehicleType = 'CAR' | 'BIKE' | 'TRUCK' | 'AMBULANCE';

export type UserRole = 'DRIVER' | 'HOSPITAL' | 'RESPONDER' | 'ADMIN';

export type EscalationLevel = 1 | 2 | 3 | 4;

export interface EmergencyContact {
  id?: string;
  name: string;
  relationship: string;
  phone: string;
  priority: 'PRIMARY' | 'SECONDARY' | 'TERTIARY';
  notifyOnConfirmation?: boolean;
  isPriority?: boolean;
}

export interface MedicalProfileData {
  bloodGroup: string;
  allergies?: string;
  chronicConditions?: string;
  medications?: string;
  emergencyInstructions?: string;
  organDonor?: boolean;
  emergencyDoctorName?: string;
  emergencyDoctorPhone?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  dateOfBirth?: string;
  heightCm?: number;
  weightKg?: number;
}

export interface User {
  id: number | string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  bloodGroup?: string;
  medicalConditions?: string;
  medicalProfile?: MedicalProfileData;
  emergencyContacts?: EmergencyContact[];
  createdAt: string;
}

export interface Vehicle {
  id: number | string;
  vehicleNumber: string;
  owner: string;
  emergencyContactPhone: string;
  vehicleType: VehicleType;
  driver?: User | null;
  registrationDate?: string;
  modelName?: string;
  deviceId?: string;
  hardwareConfig?: HardwareDeviceConfig;
}

export interface AIAssessment {
  accidentProbability: number;
  confidence: number;
  severity: SeverityLevel;
  anomalyScore: number;
  contributingFactors: string[];
  modelVersion: string;
  timeSeriesSummary?: {
    peakG: number;
    peakGyro: number;
    jerk: number;
    tiltAngle: number;
    impactDurationMs: number;
  };
}

export interface AuditTimelineEvent {
  timestamp: string;
  action: string;
  actor: string;
  detail: string;
  status: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
}

export interface CrashAlert {
  id: number;
  vehicle: Vehicle;
  latitude: number;
  longitude: number;
  locationAccuracy?: number;
  locationName?: string;
  gForce: number;
  impactSpeed: number;
  severity: SeverityLevel;
  timestamp: string;
  dispatched: boolean;
  status: AlertStatus;
  responseTimeMinutes?: number | null;
  notes?: string;
  resolvedAt?: string | null;
  dispatchedAmbulanceUnit?: string | null;
  assignedHospital?: string | null;
  visionEvent?: 'HELMET_MISSING' | 'POTHOLE_IMPACT' | 'DIRECT_COLLISION' | 'ROLLOVER' | null;
  confirmationCountdown?: number; // in seconds
  isConfirmedAccident?: boolean;
  cancelledReason?: string;
  callDispatches?: EmergencyCallLog[];
  aiAssessment?: AIAssessment;
  timeline?: AuditTimelineEvent[];
}

export interface TelemetryRequest {
  vehicleNumber: string;
  speed?: number;
  impactSpeed?: number;
  gForce: number;
  latitude: number;
  longitude: number;
  impactDetected?: boolean;
  severity?: SeverityLevel;
  visionEvent?: string;
  accelX?: number;
  accelY?: number;
  accelZ?: number;
  gyroX?: number;
  gyroY?: number;
  gyroZ?: number;
  pitch?: number;
  roll?: number;
  jerk?: number;
  simSignalQuality?: number;
  isHardwareSource?: boolean;
  deviceId?: string;
  deviceKey?: string;
}

export interface HardwareTelemetry {
  deviceId: string;
  vehicleNumber: string;
  timestamp: string;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  gForce: number;
  pitch: number;
  roll: number;
  jerk?: number;
  speed: number;
  latitude: number;
  longitude: number;
  simSignalQuality: number;
  csq: number;
  gprsAttached: boolean;
  batteryVoltage: number;
  state?: string;
  isEmergencyButtonPressed?: boolean;
  impactDetected?: boolean;
}

export interface HardwareDeviceConfig {
  deviceId: string;
  deviceSecretKey: string;
  vehicleNumber: string;
  gForceCrashThreshold: number;
  tiltAngleCrashThreshold: number;
  confirmationTimerSeconds: number;
  favoritePhone1: string;
  favoritePhone2: string;
  policeEmergencyNumber: string;
  ambulanceEmergencyNumber: string;
  gprsApn: string;
  serverEndpointUrl: string;
  telemetryIntervalMs: number;
}

export interface CrashConfirmationSession {
  alertId: number;
  vehicleNumber: string;
  driverName: string;
  emergencyPhone: string;
  gForce: number;
  impactSpeed: number;
  latitude: number;
  longitude: number;
  secondsRemaining: number;
  totalSeconds: number;
  status: 'COUNTDOWN_ACTIVE' | 'CANCELLED_SAFE' | 'EXPIRED_ESCALATED';
  startedAt: string;
  aiConfidence?: number;
  aiSeverity?: SeverityLevel;
  contributingFactors?: string[];
}

export interface EmergencyCallLog {
  id: string;
  recipientName: string;
  recipientType: 'FAVORITE_CONTACT' | 'POLICE_CONTROL_ROOM' | 'AMBULANCE_TRAUMA_108';
  phoneNumber: string;
  timestamp: string;
  status: 'CONNECTED' | 'INITIATED' | 'VOICE_PROMPT_PLAYED' | 'DISPATCHED';
  durationSeconds: number;
  simModule: 'SIM800L_MODEM_PORT_1';
  atCommand: string;
  audioDispatchTranscript: string;
}

export interface AnalyticsSummary {
  totalCrashes: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  crashesForVehicle: number;
  averageResponseTimeMinutes: number;
  resolvedCount: number;
  pendingEmergencyCount: number;
  dispatchedCount: number;
  hospitalNotifiedCount: number;
  hardwareTelemetriesLogged: number;
  falseAlarmsPreventedCount: number;
  timelineData: { time: string; high: number; medium: number; low: number }[];
  severityBreakdown: { name: string; value: number; color: string }[];
}

export interface EmergencySmsLog {
  id: string;
  recipient: string;
  recipientName?: string;
  vehicleNumber: string;
  message: string;
  coordinates: { lat: number; lng: number };
  severity: SeverityLevel;
  timestamp: string;
  status: 'DELIVERED' | 'SENT' | 'FAILED';
  atCommand?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export interface SystemHealthStatus {
  deviceConnected: boolean;
  mpu6050Active: boolean;
  gsmAvailable: boolean;
  internetConnected: boolean;
  gpsAvailable: boolean;
  csqSignal: number;
  batteryLevel: number;
  demoMode: boolean;
  countdownDuration: number;
}
