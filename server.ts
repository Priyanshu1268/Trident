import express from 'express';
import cors from 'cors';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'trident_jwt_super_secret_key_2026';

app.use(cors());
app.use(express.json());

// In-Memory Database Store with initial seed data matching Trident domain
let users: any[] = [
  {
    id: 1,
    email: 'driver.rahul@example.com',
    password: bcrypt.hashSync('password123', 10),
    name: 'Rahul Sharma',
    phone: '+919876543210',
    bloodGroup: 'O+',
    medicalConditions: 'Diabetic (Type 2), Penicillin Allergy',
    allergies: 'Penicillin, Dust Mites',
    medications: 'Metformin 500mg, Aspirin',
    organDonor: true,
    dateOfBirth: '1992-05-14',
    heightCm: 178,
    weightKg: 74,
    secondaryEmergencyContact: '+919811223344 (Father: Mr. O.P. Sharma)',
    emergencyContacts: [
      { name: 'Priya Sharma', relationship: 'Spouse', phone: '+919876543210', isPriority: true },
      { name: 'O.P. Sharma', relationship: 'Father', phone: '+919811223344', isPriority: false },
      { name: 'Dr. Anita Mehta', relationship: 'Family Physician', phone: '+919822334455', isPriority: false },
    ],
    role: 'DRIVER',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 2,
    email: 'aiims.dispatch@emergency.gov.in',
    password: bcrypt.hashSync('responder123', 10),
    name: 'AIIMS Trauma Command Center',
    phone: '+911126598500',
    bloodGroup: 'N/A',
    medicalConditions: 'Emergency Response Base',
    secondaryEmergencyContact: '+911126588700',
    emergencyContacts: [],
    role: 'HOSPITAL',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 3,
    email: 'sarah.connor@trident.io',
    password: bcrypt.hashSync('driver123', 10),
    name: 'Sarah Connor',
    phone: '+918757882039',
    bloodGroup: 'B+',
    medicalConditions: 'Asthma (Carries Inhaler), Latex Allergy',
    allergies: 'Latex, Sulfa Drugs',
    medications: 'Salbutamol Inhaler',
    organDonor: true,
    dateOfBirth: '1995-11-20',
    heightCm: 165,
    weightKg: 58,
    secondaryEmergencyContact: '+919431229988 (Spouse)',
    emergencyContacts: [
      { name: 'John Connor', relationship: 'Family', phone: '+918757882039', isPriority: true },
      { name: 'Kyle Reese', relationship: 'Emergency Contact', phone: '+919431229988', isPriority: false },
    ],
    role: 'DRIVER',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  }
];

let hardwareDevices: any[] = [
  {
    deviceId: 'ESP32-TRIDENT-01',
    deviceSecretKey: 'trident_sec_esp32_9981',
    vehicleNumber: 'KA-01-AI-2026',
    status: 'ONLINE',
    firmwareVersion: 'v2.6.4-prod',
    ipAddress: '192.168.1.104',
    macAddress: '24:0A:C4:58:3B:1A',
    simImei: '868120038912345',
    simSignalQuality: 88,
    csq: 28,
    gprsAttached: true,
    batteryVoltage: 4.12,
    lastHeartbeat: new Date().toISOString(),
    gForceCrashThreshold: 3.5,
    tiltAngleCrashThreshold: 55.0,
    confirmationTimerSeconds: 20,
    favoritePhone1: '+919876543210',
    favoritePhone2: '+919811223344',
    policeEmergencyNumber: '112',
    ambulanceEmergencyNumber: '108',
    gprsApn: 'airtelgprs.com',
  },
  {
    deviceId: 'ESP32-TRIDENT-02',
    deviceSecretKey: 'trident_sec_esp32_4402',
    vehicleNumber: 'DL-04-TR-9981',
    status: 'ONLINE',
    firmwareVersion: 'v2.6.4-prod',
    ipAddress: '192.168.1.108',
    macAddress: '3C:71:BF:12:8E:5C',
    simImei: '868120038999812',
    simSignalQuality: 92,
    csq: 30,
    gprsAttached: true,
    batteryVoltage: 4.05,
    lastHeartbeat: new Date().toISOString(),
    gForceCrashThreshold: 3.0,
    tiltAngleCrashThreshold: 45.0,
    confirmationTimerSeconds: 20,
    favoritePhone1: '+918757882039',
    favoritePhone2: '+919431229988',
    policeEmergencyNumber: '112',
    ambulanceEmergencyNumber: '108',
    gprsApn: 'www',
  }
];

let activeConfirmationSessions: any[] = [];
let emergencyCallLogs: any[] = [
  {
    id: 'CALL-1718001',
    recipientName: 'Priya Sharma (Spouse)',
    recipientType: 'FAVORITE_CONTACT',
    phoneNumber: '+919876543210',
    timestamp: new Date(Date.now() - 11 * 60000).toISOString(),
    status: 'VOICE_PROMPT_PLAYED',
    durationSeconds: 38,
    simModule: 'SIM800L_MODEM_PORT_1',
    atCommand: 'ATD+919876543210;',
    audioDispatchTranscript: 'Emergency Alert: Vehicle KA-01-AI-2026 registered to Rahul Sharma has detected a critical impact at Janpath & Rajpath Crossing. Emergency medical services are being dispatched.',
  },
  {
    id: 'CALL-1718002',
    recipientName: 'Delhi Police Control Room (PCR 112)',
    recipientType: 'POLICE_CONTROL_ROOM',
    phoneNumber: '112',
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    status: 'DISPATCHED',
    durationSeconds: 45,
    simModule: 'SIM800L_MODEM_PORT_1',
    atCommand: 'ATD112;',
    audioDispatchTranscript: 'Automated Police SOS: Severe collision event detected for vehicle KA-01-AI-2026 at Lat 28.6139, Lng 77.2090. Driver incapacitated / countdown expired.',
  },
  {
    id: 'CALL-1718003',
    recipientName: 'AIIMS Central Trauma Dispatch (108)',
    recipientType: 'AMBULANCE_TRAUMA_108',
    phoneNumber: '108',
    timestamp: new Date(Date.now() - 9 * 60000).toISOString(),
    status: 'DISPATCHED',
    durationSeconds: 52,
    simModule: 'SIM800L_MODEM_PORT_1',
    atCommand: 'ATD108;',
    audioDispatchTranscript: 'Trauma Emergency Broadcast: Level 1 ambulance requested for vehicle KA-01-AI-2026. Driver Blood Group O+, Diabetic. G-Force 6.8g.',
  }
];

let hardwareTelemetriesCount = 142;
let falseAlarmsPreventedCount = 9;

let vehicles: any[] = [
  {
    id: 1,
    vehicleNumber: 'KA-01-AI-2026',
    owner: 'Rahul Sharma',
    emergencyContactPhone: '+919876543210',
    vehicleType: 'CAR',
    modelName: 'Tesla Model 3 / Autonomous Fleet',
    registrationDate: '2025-01-10',
    driver: users[0],
  },
  {
    id: 2,
    vehicleNumber: 'DL-04-TR-9981',
    owner: 'Sarah Connor',
    emergencyContactPhone: '+918757882039',
    vehicleType: 'BIKE',
    modelName: 'Yamaha MT-15 (Connected Telemetry)',
    registrationDate: '2025-03-22',
    driver: users[2],
  },
  {
    id: 3,
    vehicleNumber: 'MH-12-EM-1080',
    owner: 'AIIMS Trauma Emergency Fleet',
    emergencyContactPhone: '+911126598500',
    vehicleType: 'AMBULANCE',
    modelName: 'Force Traveller ALS Emergency Unit 04',
    registrationDate: '2024-11-05',
    driver: users[1],
  },
  {
    id: 4,
    vehicleNumber: 'KA-05-LG-4402',
    owner: 'Arjun Verma',
    emergencyContactPhone: '+919845012345',
    vehicleType: 'TRUCK',
    modelName: 'Tata Prima Heavy Logistics',
    registrationDate: '2024-08-14',
    driver: null,
  }
];

let alerts: any[] = [
  {
    id: 101,
    vehicle: vehicles[0],
    latitude: 28.6139,
    longitude: 77.2090,
    locationName: 'Janpath & Rajpath Crossing, New Delhi',
    gForce: 6.8,
    impactSpeed: 74.5,
    severity: 'HIGH',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    dispatched: true,
    status: 'AMBULANCE_DISPATCHED',
    responseTimeMinutes: 3.4,
    notes: 'High velocity front-quarter impact detected. Driver airbags deployed. Unit 04 en-route.',
    dispatchedAmbulanceUnit: 'ALS Unit 04 (ETA 4 min)',
    assignedHospital: 'AIIMS Central Trauma Center',
    visionEvent: 'DIRECT_COLLISION',
  },
  {
    id: 102,
    vehicle: vehicles[1],
    latitude: 28.5355,
    longitude: 77.3910,
    locationName: 'Noida-Greater Noida Expressway KM 14',
    gForce: 3.2,
    impactSpeed: 42.0,
    severity: 'MEDIUM',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    dispatched: false,
    status: 'HOSPITAL_NOTIFIED',
    responseTimeMinutes: 5.1,
    notes: 'Sudden deceleration and pothole shock wave detected. Vision AI caught helmet compliance.',
    assignedHospital: 'Fortis Hospital Sector 62',
    visionEvent: 'POTHOLE_IMPACT',
  },
  {
    id: 103,
    vehicle: vehicles[3],
    latitude: 28.7041,
    longitude: 77.1025,
    locationName: 'Outer Ring Road, Pitampura',
    gForce: 1.8,
    impactSpeed: 18.0,
    severity: 'LOW',
    timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
    dispatched: false,
    status: 'RESOLVED',
    responseTimeMinutes: 2.0,
    notes: 'Minor curb graze during tight docking maneuver. No structural damage reported.',
    resolvedAt: new Date(Date.now() - 175 * 60000).toISOString(),
    visionEvent: null,
  }
];

let smsLogs: any[] = [
  {
    id: 'SMS-9921',
    recipient: '+919876543210',
    vehicleNumber: 'KA-01-AI-2026',
    message: '[EMERGENCY ALERT] Severe crash detected for KA-01-AI-2026 at Lat: 28.6139, Lng: 77.2090. Driver: Rahul Sharma [Blood: O+, Conditions: Diabetic, Penicillin Allergy]. Emergency Ambulance Unit Dispatched.',
    coordinates: { lat: 28.6139, lng: 77.2090 },
    severity: 'HIGH',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    status: 'DELIVERED',
  }
];

// Server-Sent Events subscribers
const sseClients = new Set<express.Response>();

function broadcastSSE(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  });
}

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------
app.post(['/api/v1/auth/signup', '/api/auth/register'], (req, res) => {
  const { email, password, name, fullName, phone, bloodGroup, medicalConditions, secondaryEmergencyContact, role } = req.body;
  const targetEmail = email?.trim().toLowerCase();

  if (!targetEmail || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (users.find((u) => u.email === targetEmail)) {
    return res.status(400).json({ error: 'Error: Email is already registered!' });
  }

  const newUser = {
    id: Date.now(),
    email: targetEmail,
    password: bcrypt.hashSync(password, 10),
    name: name || fullName || targetEmail.split('@')[0],
    phone: phone || '+910000000000',
    bloodGroup: bloodGroup || 'O+',
    medicalConditions: medicalConditions || 'None Recorded',
    secondaryEmergencyContact: secondaryEmergencyContact || 'None',
    role: role || 'DRIVER',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

  const safeUser: any = { ...newUser };
  delete safeUser.password;

  return res.json({
    token,
    accessToken: token,
    tokenType: 'Bearer',
    expiresInMs: 7 * 86400000,
    user: safeUser,
    email: newUser.email,
    name: newUser.name,
  });
});

app.post(['/api/v1/auth/login', '/api/auth/login'], (req, res) => {
  const { email, password } = req.body;
  const targetEmail = email?.trim().toLowerCase();

  const user = users.find((u) => u.email === targetEmail);
  if (!user) {
    return res.status(400).json({ error: 'Error: Invalid email or password' });
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: 'Error: Invalid email or password' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  const safeUser: any = { ...user };
  delete safeUser.password;

  return res.json({
    token,
    accessToken: token,
    tokenType: 'Bearer',
    expiresInMs: 7 * 86400000,
    user: safeUser,
    email: user.email,
    name: user.name,
  });
});

app.get(['/api/v1/auth/me', '/api/users/me'], (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing token' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = users.find((u) => u.id === decoded.id || u.email === decoded.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const safeUser: any = { ...user };
    delete safeUser.password;
    return res.json(safeUser);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// ----------------------------------------------------
// TELEMETRY & CRASH PROCESSING (Spring Boot Port)
// ----------------------------------------------------
app.post('/api/v1/telemetry', (req, res) => {
  const dto = req.body;
  const vehicleNumber = dto.vehicleNumber || 'KA-01-AI-2026';

  let vehicle = vehicles.find((v) => v.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase());
  if (!vehicle) {
    vehicle = {
      id: Date.now(),
      vehicleNumber: vehicleNumber,
      owner: 'Auto-Registered Driver',
      emergencyContactPhone: '+918757882039',
      vehicleType: 'CAR',
      modelName: 'Generic Connected Telemetry Vehicle',
      registrationDate: new Date().toISOString().split('T')[0],
      driver: {
        id: Date.now() + 1,
        name: 'Auto-Registered Driver',
        phone: '+918757882039',
        bloodGroup: 'B+',
        medicalConditions: 'None Recorded',
        role: 'DRIVER',
      },
    };
    vehicles.push(vehicle);
  }

  const gForce = Number(dto.gForce) || 0;
  const impactSpeed = Number(dto.impactSpeed || dto.speed) || 0;
  const latitude = Number(dto.latitude) || 28.6139;
  const longitude = Number(dto.longitude) || 77.2090;

  // Severity calculation matching Spring Boot CrashService.java
  let severity: 'HIGH' | 'MEDIUM' | 'LOW' = dto.severity || 'LOW';
  if ((gForce > 4.0 && impactSpeed > 30.0) || gForce > 6.0) {
    severity = 'HIGH';
  } else if (gForce > 2.5) {
    severity = 'MEDIUM';
  }

  const isDispatched = severity === 'HIGH';

  const newAlert = {
    id: Date.now(),
    vehicle: vehicle,
    latitude: latitude,
    longitude: longitude,
    locationName: dto.locationName || `Live GPS Coordinates [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`,
    gForce: gForce,
    impactSpeed: impactSpeed,
    severity: severity,
    timestamp: new Date().toISOString(),
    dispatched: isDispatched,
    status: isDispatched ? 'AMBULANCE_DISPATCHED' : (severity === 'MEDIUM' ? 'HOSPITAL_NOTIFIED' : 'PENDING'),
    responseTimeMinutes: isDispatched ? 2.8 : null,
    notes: dto.notes || (severity === 'HIGH' ? 'Critical G-Force impact detected. Auto-dispatched nearest trauma unit.' : 'Telemetry event captured by AI sensor array.'),
    dispatchedAmbulanceUnit: isDispatched ? 'ALS Rapid Response Unit 08' : null,
    assignedHospital: isDispatched ? 'AIIMS Apex Trauma Center' : null,
    visionEvent: dto.visionEvent || null,
  };

  alerts.unshift(newAlert);

  // SMS Generation matching Spring Boot SmsService.java
  if (severity === 'HIGH' || severity === 'MEDIUM') {
    const bloodGroup = vehicle.driver?.bloodGroup || 'Unknown';
    const conditions = vehicle.driver?.medicalConditions || 'None Recorded';
    const medicalInfo = ` [Blood: ${bloodGroup}, Conditions: ${conditions}]`;

    const smsMessage = `[TRIDENT CRASH ALERT] Vehicle ${vehicle.vehicleNumber}${medicalInfo} experienced ${severity} severity impact at Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}. G-Force: ${gForce}g. Speed: ${impactSpeed}km/h. Emergency responders dispatched.`;

    const sms = {
      id: `SMS-${Date.now()}`,
      recipient: vehicle.emergencyContactPhone || '+918757882039',
      vehicleNumber: vehicle.vehicleNumber,
      message: smsMessage,
      coordinates: { lat: latitude, lng: longitude },
      severity: severity,
      timestamp: new Date().toISOString(),
      status: 'DELIVERED',
    };
    smsLogs.unshift(sms);
  }

  // Broadcast real-time update
  broadcastSSE('new_alert', newAlert);

  return res.status(200).json(newAlert);
});

// ----------------------------------------------------
// ALERTS CONTROLLER ENDPOINTS
// ----------------------------------------------------
app.get('/api/v1/alerts', (req, res) => {
  const { severity, status, search } = req.query;
  let filtered = [...alerts];

  if (severity) {
    filtered = filtered.filter((a) => a.severity.toLowerCase() === String(severity).toLowerCase());
  }
  if (status) {
    filtered = filtered.filter((a) => a.status.toLowerCase() === String(status).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.vehicle.vehicleNumber.toLowerCase().includes(q) ||
        a.vehicle.owner.toLowerCase().includes(q) ||
        (a.locationName && a.locationName.toLowerCase().includes(q))
    );
  }

  return res.json(filtered);
});

app.put('/api/v1/alerts/:id/respond', (req, res) => {
  const alertId = Number(req.params.id);
  const alert = alerts.find((a) => a.id === alertId);

  if (!alert) {
    return res.status(404).json({ error: `Crash alert not found with ID: ${alertId}` });
  }

  const { status, notes, dispatchedAmbulanceUnit, assignedHospital } = req.body;

  if (status) alert.status = status;
  if (notes) alert.notes = notes;
  if (dispatchedAmbulanceUnit) alert.dispatchedAmbulanceUnit = dispatchedAmbulanceUnit;
  if (assignedHospital) alert.assignedHospital = assignedHospital;

  if (status === 'RESOLVED') {
    alert.resolvedAt = new Date().toISOString();
    if (!alert.responseTimeMinutes) {
      alert.responseTimeMinutes = 4.2;
    }
  } else if (status === 'AMBULANCE_DISPATCHED') {
    alert.dispatched = true;
    if (!alert.dispatchedAmbulanceUnit) {
      alert.dispatchedAmbulanceUnit = 'ALS Emergency Rescue Team #3';
    }
  }

  broadcastSSE('alert_updated', alert);
  return res.json(alert);
});

// Preset simulation trigger
app.post('/api/v1/alerts/simulate', (req, res) => {
  const { scenario } = req.body;

  const scenarios: Record<string, any> = {
    highway_crash: {
      vehicleNumber: 'KA-01-AI-2026',
      gForce: 7.4,
      impactSpeed: 88.0,
      latitude: 28.5910,
      longitude: 77.2285,
      locationName: 'Barapullah Elevated Corridor, Delhi',
      visionEvent: 'DIRECT_COLLISION',
      notes: 'Multi-vehicle collision triggered by sudden brake at high speed. G-Force spike 7.4g.',
    },
    bike_pothole_slip: {
      vehicleNumber: 'DL-04-TR-9981',
      gForce: 3.8,
      impactSpeed: 48.5,
      latitude: 28.6289,
      longitude: 77.2065,
      locationName: 'Connaught Place Outer Circle, Delhi',
      visionEvent: 'POTHOLE_IMPACT',
      notes: 'Deep pothole destabilized two-wheeler front wheel. Driver helmet was detected by vision AI.',
    },
    no_helmet_hazard: {
      vehicleNumber: 'DL-04-TR-9981',
      gForce: 1.2,
      impactSpeed: 35.0,
      latitude: 28.5450,
      longitude: 77.2720,
      locationName: 'Mathura Road Near Apollo Hospital',
      visionEvent: 'HELMET_MISSING',
      notes: 'AI Vision Camera detected rider without helmet. Warning emitted to rider HUD & logged.',
    },
    heavy_truck_rollover: {
      vehicleNumber: 'KA-05-LG-4402',
      gForce: 5.6,
      impactSpeed: 62.0,
      latitude: 28.4595,
      longitude: 77.0266,
      locationName: 'Gurugram NH-48 Expressway Toll Plaza',
      visionEvent: 'ROLLOVER',
      notes: 'Cargo shift caused acute tilt & rollover telemetry trigger.',
    }
  };

  const selected = scenarios[scenario] || scenarios.highway_crash;

  let vehicle = vehicles.find((v) => v.vehicleNumber === selected.vehicleNumber) || vehicles[0];

  const gForce = selected.gForce;
  const impactSpeed = selected.impactSpeed;
  let severity: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if ((gForce > 4.0 && impactSpeed > 30.0) || gForce > 6.0) {
    severity = 'HIGH';
  } else if (gForce > 2.5) {
    severity = 'MEDIUM';
  }

  const isDispatched = severity === 'HIGH';

  const newAlert = {
    id: Date.now(),
    vehicle: vehicle,
    latitude: selected.latitude,
    longitude: selected.longitude,
    locationName: selected.locationName,
    gForce: gForce,
    impactSpeed: impactSpeed,
    severity: severity,
    timestamp: new Date().toISOString(),
    dispatched: isDispatched,
    status: isDispatched ? 'AMBULANCE_DISPATCHED' : (severity === 'MEDIUM' ? 'HOSPITAL_NOTIFIED' : 'PENDING'),
    responseTimeMinutes: isDispatched ? 3.1 : null,
    notes: selected.notes,
    dispatchedAmbulanceUnit: isDispatched ? 'Trauma ALS Interceptor Alpha' : null,
    assignedHospital: isDispatched ? 'Max Super Speciality Emergency Wing' : null,
    visionEvent: selected.visionEvent,
  };

  alerts.unshift(newAlert);

  if (severity === 'HIGH' || severity === 'MEDIUM') {
    const bloodGroup = vehicle.driver?.bloodGroup || 'Unknown';
    const conditions = vehicle.driver?.medicalConditions || 'None Recorded';
    const sms = {
      id: `SMS-${Date.now()}`,
      recipient: vehicle.emergencyContactPhone || '+918757882039',
      vehicleNumber: vehicle.vehicleNumber,
      message: `[SIMULATED EMERGENCY] ${severity} impact for ${vehicle.vehicleNumber} [Driver: ${vehicle.owner}, Blood: ${bloodGroup}, Med: ${conditions}] at ${selected.locationName}. Responders auto-notified.`,
      coordinates: { lat: selected.latitude, lng: selected.longitude },
      severity: severity,
      timestamp: new Date().toISOString(),
      status: 'DELIVERED',
    };
    smsLogs.unshift(sms);
  }

  broadcastSSE('new_alert', newAlert);
  return res.json(newAlert);
});

// ----------------------------------------------------
// VEHICLES CONTROLLER ENDPOINTS
// ----------------------------------------------------
app.get('/api/v1/vehicles', (req, res) => {
  return res.json(vehicles);
});

app.post('/api/v1/vehicles/register', (req, res) => {
  const { vehicleNumber, owner, emergencyContactPhone, vehicleType, modelName, driverEmail } = req.body;

  if (!vehicleNumber) {
    return res.status(400).json({ error: 'Vehicle number is required.' });
  }

  if (vehicles.find((v) => v.vehicleNumber.toLowerCase() === vehicleNumber.trim().toLowerCase())) {
    return res.status(400).json({ error: 'Vehicle number already registered.' });
  }

  let matchedDriver = null;
  if (driverEmail) {
    matchedDriver = users.find((u) => u.email.toLowerCase() === driverEmail.trim().toLowerCase());
  }

  const newVehicle = {
    id: Date.now(),
    vehicleNumber: vehicleNumber.trim().toUpperCase(),
    owner: owner || 'Registered Owner',
    emergencyContactPhone: emergencyContactPhone || '+918757882039',
    vehicleType: vehicleType || 'CAR',
    modelName: modelName || 'Connected Vehicle',
    registrationDate: new Date().toISOString().split('T')[0],
    driver: matchedDriver || {
      id: Date.now() + 10,
      name: owner || 'Primary Driver',
      phone: emergencyContactPhone || '+918757882039',
      bloodGroup: 'O+',
      medicalConditions: 'None Recorded',
      role: 'DRIVER',
    },
  };

  vehicles.push(newVehicle);
  return res.json(newVehicle);
});

// ----------------------------------------------------
// ANALYTICS CONTROLLER ENDPOINTS
// ----------------------------------------------------
app.get('/api/v1/analytics/history/:vehicleNumber', (req, res) => {
  const { vehicleNumber } = req.params;
  const history = alerts.filter(
    (a) => a.vehicle.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase()
  );
  return res.json(history);
});

app.get('/api/v1/analytics/summary', (req, res) => {
  const { vehicleNumber } = req.query;

  const totalCrashes = alerts.length;
  const highSeverityCount = alerts.filter((a) => a.severity === 'HIGH').length;
  const mediumSeverityCount = alerts.filter((a) => a.severity === 'MEDIUM').length;
  const lowSeverityCount = alerts.filter((a) => a.severity === 'LOW').length;

  const vehicleCrashCount = vehicleNumber
    ? alerts.filter((a) => a.vehicle.vehicleNumber.toLowerCase() === String(vehicleNumber).toLowerCase()).length
    : 0;

  const respondedAlerts = alerts.filter((a) => typeof a.responseTimeMinutes === 'number' && a.responseTimeMinutes > 0);
  const avgResponseTime = respondedAlerts.length > 0
    ? respondedAlerts.reduce((acc, a) => acc + (a.responseTimeMinutes || 0), 0) / respondedAlerts.length
    : 3.4;

  const resolvedCount = alerts.filter((a) => a.status === 'RESOLVED').length;
  const pendingEmergencyCount = alerts.filter((a) => a.status === 'PENDING').length;
  const dispatchedCount = alerts.filter((a) => a.status === 'AMBULANCE_DISPATCHED').length;
  const hospitalNotifiedCount = alerts.filter((a) => a.status === 'HOSPITAL_NOTIFIED').length;

  // Timeline aggregated for 24h
  const timelineData = [
    { time: '00:00', high: 0, medium: 1, low: 0 },
    { time: '04:00', high: 1, medium: 0, low: 0 },
    { time: '08:00', high: highSeverityCount, medium: 1, low: 1 },
    { time: '12:00', high: 0, medium: mediumSeverityCount, low: 2 },
    { time: '16:00', high: 1, medium: 2, low: lowSeverityCount },
    { time: '20:00', high: 0, medium: 1, low: 1 },
  ];

  const severityBreakdown = [
    { name: 'High Severity', value: highSeverityCount, color: '#ef4444' },
    { name: 'Medium Severity', value: mediumSeverityCount, color: '#f59e0b' },
    { name: 'Low Severity', value: lowSeverityCount, color: '#10b981' },
  ];

  return res.json({
    totalCrashes,
    highSeverityCount,
    mediumSeverityCount,
    lowSeverityCount,
    crashesForVehicle: vehicleCrashCount,
    averageResponseTimeMinutes: Math.round(avgResponseTime * 100) / 100,
    resolvedCount,
    pendingEmergencyCount,
    dispatchedCount,
    hospitalNotifiedCount,
    timelineData,
    severityBreakdown,
  });
});

// ----------------------------------------------------
// SMS LOGS & AI VISION STATUS
// ----------------------------------------------------
app.get('/api/v1/sms/logs', (req, res) => {
  return res.json(smsLogs);
});

app.get('/api/v1/ai/status', (req, res) => {
  return res.json({
    engine: 'Trident Vision AI v2.4',
    helmetModel: 'yolov8_helmet.pt (Active)',
    potholeModel: 'yolov8_pothole.pt (Active)',
    telemetryInferenceFPS: 30,
    cameraStreamActive: true,
    lastHeartbeat: new Date().toISOString(),
  });
});

// ----------------------------------------------------
// HARDWARE MODULE INTEGRATION (ESP32 + MPU6050 + SIM800L)
// ----------------------------------------------------
app.get('/api/v1/hardware/devices', (req, res) => {
  return res.json(hardwareDevices);
});

app.get('/api/v1/hardware/call-logs', (req, res) => {
  return res.json(emergencyCallLogs);
});

app.get('/api/v1/hardware/config/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  const dev = hardwareDevices.find((d) => d.deviceId.toLowerCase() === deviceId.toLowerCase());
  if (!dev) {
    return res.status(404).json({ error: `Hardware device ${deviceId} not found.` });
  }
  return res.json(dev);
});

// Ingest telemetry from ESP32 MPU6050 + SIM800L module
app.post('/api/v1/hardware/telemetry', (req, res) => {
  const body = req.body;
  const deviceId = body.deviceId || 'ESP32-TRIDENT-01';
  const deviceKey = req.headers['x-device-key'] || body.deviceKey;

  hardwareTelemetriesCount++;

  // Find hardware profile or vehicle
  let device = hardwareDevices.find((d) => d.deviceId === deviceId);
  const targetVehicleNumber = body.vehicleNumber || device?.vehicleNumber || 'KA-01-AI-2026';
  let vehicle = vehicles.find((v) => v.vehicleNumber.toLowerCase() === targetVehicleNumber.toLowerCase()) || vehicles[0];

  const accelX = Number(body.accelX) || 0;
  const accelY = Number(body.accelY) || 0;
  const accelZ = Number(body.accelZ) || 9.8;
  const gyroX = Number(body.gyroX) || 0;
  const gyroY = Number(body.gyroY) || 0;
  const gyroZ = Number(body.gyroZ) || 0;

  // Calculate total G-Force from raw accelerometer vectors if not provided
  let gForce = Number(body.gForce);
  if (isNaN(gForce) || gForce <= 0) {
    const rawMag = Math.sqrt(accelX * accelX + accelY * accelY + accelZ * accelZ);
    gForce = Math.round((rawMag / 9.80665) * 10) / 10;
  }

  // Calculate pitch & roll angles
  const pitch = Number(body.pitch) || Math.round(Math.atan2(accelX, Math.sqrt(accelY * accelY + accelZ * accelZ)) * (180 / Math.PI));
  const roll = Number(body.roll) || Math.round(Math.atan2(accelY, Math.sqrt(accelX * accelX + accelZ * accelZ)) * (180 / Math.PI));
  const speed = Number(body.speed || body.impactSpeed) || 68;
  const latitude = Number(body.latitude || body.lat) || 28.6139;
  const longitude = Number(body.longitude || body.lng) || 77.2090;
  const isEmergencyButtonPressed = Boolean(body.isEmergencyButtonPressed || body.emergencyButton);

  const tiltThreshold = device?.tiltAngleCrashThreshold || 50;
  const gForceThreshold = device?.gForceCrashThreshold || 3.5;

  const isSevereTilt = Math.abs(pitch) > tiltThreshold || Math.abs(roll) > tiltThreshold;
  const isImpact = gForce >= gForceThreshold || isEmergencyButtonPressed || isSevereTilt;

  // Update device health status
  if (device) {
    device.lastHeartbeat = new Date().toISOString();
    device.batteryVoltage = Number(body.batteryVoltage) || 4.10;
    device.csq = Number(body.csq) || 28;
    device.simSignalQuality = Math.min(100, Math.round((device.csq / 31) * 100));
  }

  const telemetryPayload = {
    deviceId,
    vehicleNumber: vehicle.vehicleNumber,
    timestamp: new Date().toISOString(),
    accelX,
    accelY,
    accelZ,
    gyroX,
    gyroY,
    gyroZ,
    gForce,
    pitch,
    roll,
    speed,
    latitude,
    longitude,
    simSignalQuality: device?.simSignalQuality || 90,
    csq: device?.csq || 28,
    gprsAttached: true,
    batteryVoltage: device?.batteryVoltage || 4.12,
    isEmergencyButtonPressed,
    impactDetected: isImpact,
  };

  // Broadcast live hardware metrics
  broadcastSSE('telemetry_stream', telemetryPayload);

  // If crash detected, initiate crash confirmation session (safety countdown)
  if (isImpact) {
    let severity: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if ((gForce > 4.5 && speed > 30.0) || gForce > 6.0 || isEmergencyButtonPressed) {
      severity = 'HIGH';
    }

    const alertId = Date.now();
    const totalSeconds = device?.confirmationTimerSeconds || 20;

    const newAlert = {
      id: alertId,
      vehicle: vehicle,
      latitude,
      longitude,
      locationName: `Hardware Trigger: GPS [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`,
      gForce,
      impactSpeed: speed,
      severity,
      timestamp: new Date().toISOString(),
      dispatched: false,
      status: 'CONFIRMATION_COUNTDOWN',
      responseTimeMinutes: null,
      notes: isEmergencyButtonPressed
        ? 'Physical SOS Button pressed on vehicle dashboard / breadboard!'
        : isSevereTilt
        ? `Acute vehicle tilt/rollover detected (Pitch: ${pitch}°, Roll: ${roll}°).`
        : `High G-Force impact (${gForce}g) recorded by MPU6050 accelerometer.`,
      confirmationCountdown: totalSeconds,
      isConfirmedAccident: false,
      visionEvent: isSevereTilt ? 'ROLLOVER' : 'DIRECT_COLLISION',
    };

    alerts.unshift(newAlert);

    const session = {
      alertId,
      vehicleNumber: vehicle.vehicleNumber,
      driverName: vehicle.owner || vehicle.driver?.name || 'Driver',
      emergencyPhone: vehicle.emergencyContactPhone,
      gForce,
      impactSpeed: speed,
      latitude,
      longitude,
      secondsRemaining: totalSeconds,
      totalSeconds,
      status: 'COUNTDOWN_ACTIVE',
      startedAt: new Date().toISOString(),
    };
    activeConfirmationSessions.push(session);

    // Broadcast countdown trigger to frontends
    broadcastSSE('crash_countdown_started', { alert: newAlert, session });
    broadcastSSE('new_alert', newAlert);

    return res.status(200).json({
      status: 'COUNTDOWN_INITIATED',
      alert: newAlert,
      session,
      message: `Impact detected (${gForce}g). User given ${totalSeconds}s safety timer to confirm condition.`,
    });
  }

  return res.status(200).json({
    status: 'TELEMETRY_OK',
    gForce,
    pitch,
    roll,
    impactDetected: false,
  });
});

// User or physical hardware button pressed "I AM OK / CANCEL ALARM"
app.post('/api/v1/hardware/timer-cancel', (req, res) => {
  const { alertId, reason, vehicleNumber } = req.body;

  let alert = alerts.find((a) => a.id === Number(alertId));
  if (!alert && vehicleNumber) {
    alert = alerts.find((a) => a.vehicle.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase() && a.status === 'CONFIRMATION_COUNTDOWN');
  }

  if (alert) {
    alert.status = 'FALSE_ALARM';
    alert.notes = `Alarm cancelled by user: ${reason || 'Driver confirmed safe / false bump'}.`;
    alert.cancelledReason = reason || 'I AM SAFE - FALSE ALARM';
    alert.resolvedAt = new Date().toISOString();
  }

  // Remove from active confirmation sessions
  activeConfirmationSessions = activeConfirmationSessions.filter((s) => s.alertId !== alert?.id);
  falseAlarmsPreventedCount++;

  broadcastSSE('crash_cancelled', { alertId: alert?.id, reason });
  if (alert) broadcastSSE('alert_updated', alert);

  return res.json({
    success: true,
    message: 'Crash countdown cancelled successfully. No emergency services were dispatched.',
    falseAlarmsPrevented: falseAlarmsPreventedCount,
  });
});

// Timer expired without user cancel -> AUTO ESCALATE EMERGENCY PROTOCOL
app.post('/api/v1/hardware/timer-expire', (req, res) => {
  const { alertId } = req.body;
  const alert = alerts.find((a) => a.id === Number(alertId));

  if (!alert) {
    return res.status(404).json({ error: 'Alert session not found' });
  }

  alert.status = 'AMBULANCE_DISPATCHED';
  alert.dispatched = true;
  alert.isConfirmedAccident = true;
  alert.responseTimeMinutes = 1.9;
  alert.dispatchedAmbulanceUnit = 'ALS Emergency Rescue Interceptor #04';
  alert.assignedHospital = 'AIIMS Apex Trauma Center';
  alert.notes = 'CONFIRMED CRASH: Driver unresponsive to countdown timer. Auto-dialed emergency contacts, Police 112, and Ambulance 108. Dispatched cellular SMS with GPS & Medical Passport.';

  const vehicle = alert.vehicle;
  const driver = vehicle.driver;
  const driverName = vehicle.owner || driver?.name || 'Driver';
  const bloodGroup = driver?.bloodGroup || 'O+';
  const medicalConditions = driver?.medicalConditions || 'No conditions logged';
  const allergies = driver?.allergies || 'None';
  const contactPhone = vehicle.emergencyContactPhone || '+918757882039';

  // 1. Dispatch Tier 1 Voice Call (Favorite Contact)
  const call1 = {
    id: `CALL-${Date.now()}-1`,
    recipientName: `${driverName} Emergency Contact (${contactPhone})`,
    recipientType: 'FAVORITE_CONTACT',
    phoneNumber: contactPhone,
    timestamp: new Date().toISOString(),
    status: 'CONNECTED',
    durationSeconds: 42,
    simModule: 'SIM800L_MODEM_PORT_1',
    atCommand: `ATD${contactPhone};`,
    audioDispatchTranscript: `Automated Voice SOS: Vehicle ${vehicle.vehicleNumber} registered to ${driverName} was in a severe crash (${alert.gForce}g) at Lat ${alert.latitude.toFixed(4)}, Lng ${alert.longitude.toFixed(4)}. Emergency services have been deployed.`,
  };
  emergencyCallLogs.unshift(call1);

  // 2. Dispatch Tier 2 Voice Call (Police Control Room 112)
  const call2 = {
    id: `CALL-${Date.now()}-2`,
    recipientName: 'Police Central Control (PCR 112)',
    recipientType: 'POLICE_CONTROL_ROOM',
    phoneNumber: '112',
    timestamp: new Date(Date.now() + 1000).toISOString(),
    status: 'DISPATCHED',
    durationSeconds: 48,
    simModule: 'SIM800L_MODEM_PORT_1',
    atCommand: 'ATD112;',
    audioDispatchTranscript: `Priority Police SOS: Vehicle accident confirmed on NH corridor for plate ${vehicle.vehicleNumber}. Unresponsive occupant at coordinates [${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}].`,
  };
  emergencyCallLogs.unshift(call2);

  // 3. Dispatch Tier 3 Voice Call (Ambulance Trauma 108)
  const call3 = {
    id: `CALL-${Date.now()}-3`,
    recipientName: 'Ambulance & Trauma Operations (108)',
    recipientType: 'AMBULANCE_TRAUMA_108',
    phoneNumber: '108',
    timestamp: new Date(Date.now() + 2000).toISOString(),
    status: 'DISPATCHED',
    durationSeconds: 55,
    simModule: 'SIM800L_MODEM_PORT_1',
    atCommand: 'ATD108;',
    audioDispatchTranscript: `Medical Trauma Auto-Dispatch: Level 1 ambulance required for ${vehicle.vehicleNumber}. Occupant ${driverName}, Blood Group ${bloodGroup}, Allergies: ${allergies}. Impact G-Force: ${alert.gForce}g.`,
  };
  emergencyCallLogs.unshift(call3);

  // 4. Dispatch Automated SMS via SIM800L AT Commands
  const mapsLink = `https://maps.google.com/?q=${alert.latitude},${alert.longitude}`;
  const smsMessage = `[URGENT TRIDENT CRASH SOS] Vehicle ${vehicle.vehicleNumber} (${driverName}) has been involved in an accident! Impact: ${alert.gForce}g at ${alert.impactSpeed}km/h. Medical: Blood ${bloodGroup}, Allergies: ${allergies}, Conditions: ${medicalConditions}. GPS Location: ${mapsLink}. Ambulance 108 and Police 112 notified!`;

  const sms = {
    id: `SMS-${Date.now()}`,
    recipient: contactPhone,
    recipientName: `${driverName} Primary ICE`,
    vehicleNumber: vehicle.vehicleNumber,
    message: smsMessage,
    coordinates: { lat: alert.latitude, lng: alert.longitude },
    severity: alert.severity,
    timestamp: new Date().toISOString(),
    status: 'DELIVERED',
    atCommand: `AT+CMGS="${contactPhone}"\\r${smsMessage}\\x1A`,
  };
  smsLogs.unshift(sms);

  // Remove from active confirmation sessions
  activeConfirmationSessions = activeConfirmationSessions.filter((s) => s.alertId !== alert.id);

  broadcastSSE('crash_escalated', { alert, calls: [call1, call2, call3], sms });
  broadcastSSE('alert_updated', alert);

  return res.json({
    success: true,
    escalated: true,
    alert,
    callsDispatched: [call1, call2, call3],
    smsDispatched: sms,
  });
});

// ----------------------------------------------------
// GOOD SAMARITAN / EMERGENCY LOCK SCREEN MEDICAL PASSPORT
// ----------------------------------------------------
app.get('/api/v1/ice-passport/:vehicleNumber', (req, res) => {
  const { vehicleNumber } = req.params;
  const vehicle = vehicles.find((v) => v.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase());

  if (!vehicle) {
    return res.status(404).json({ error: `Vehicle ${vehicleNumber} not found.` });
  }

  const driver = vehicle.driver || users[0];
  const lastAlert = alerts.find((a) => a.vehicle.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase());

  return res.json({
    vehicleNumber: vehicle.vehicleNumber,
    modelName: vehicle.modelName,
    vehicleType: vehicle.vehicleType,
    driver: {
      name: driver.name || vehicle.owner,
      phone: driver.phone || vehicle.emergencyContactPhone,
      bloodGroup: driver.bloodGroup || 'O+',
      medicalConditions: driver.medicalConditions || 'None Recorded',
      allergies: driver.allergies || 'None Recorded',
      medications: driver.medications || 'None Recorded',
      organDonor: driver.organDonor ?? true,
      dateOfBirth: driver.dateOfBirth || '1995-01-01',
      emergencyContacts: driver.emergencyContacts && driver.emergencyContacts.length > 0 ? driver.emergencyContacts : [
        { name: 'Primary ICE Contact', relationship: 'Spouse / Parent', phone: vehicle.emergencyContactPhone, isPriority: true },
        { name: 'Secondary ICE Contact', relationship: 'Family', phone: '+919811223344', isPriority: false },
      ],
    },
    latestLocation: {
      latitude: lastAlert?.latitude || 28.6139,
      longitude: lastAlert?.longitude || 77.2090,
      locationName: lastAlert?.locationName || 'Live GPS Location',
      timestamp: lastAlert?.timestamp || new Date().toISOString(),
    },
    emergencyHelplines: [
      { name: 'Ambulance & Medical Trauma', number: '108' },
      { name: 'Police Emergency Response', number: '112' },
      { name: 'National Highway Helpline', number: '1033' },
    ],
  });
});

// Update Medical Passport profile
app.post('/api/v1/ice-passport/save', (req, res) => {
  const { vehicleNumber, bloodGroup, medicalConditions, allergies, medications, organDonor, emergencyContacts } = req.body;

  const vehicle = vehicles.find((v) => v.vehicleNumber.toLowerCase() === String(vehicleNumber).toLowerCase());
  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  if (vehicle.driver) {
    if (bloodGroup) vehicle.driver.bloodGroup = bloodGroup;
    if (medicalConditions) vehicle.driver.medicalConditions = medicalConditions;
    if (allergies) vehicle.driver.allergies = allergies;
    if (medications) vehicle.driver.medications = medications;
    if (organDonor !== undefined) vehicle.driver.organDonor = organDonor;
    if (emergencyContacts) vehicle.driver.emergencyContacts = emergencyContacts;
  }

  return res.json({ success: true, message: 'Medical Passport updated successfully.' });
});

// Downloadable production-ready Arduino C++ firmware for ESP32 + MPU6050 + SIM800L
app.get('/api/v1/hardware/firmware', (req, res) => {
  const firmwareCode = `/**
 * =========================================================================
 * TRIDENT IoT CRASH DETECTION & EMERGENCY CELLULAR TELEMETRY FIRMWARE
 * Target Hardware: ESP32 Dev Module / NodeMCU-32S
 * Sensors: MPU6050 (I2C) Accelerometer & Gyroscope
 * Cellular: SIM800L GSM/GPRS Modem (Hardware Serial 2)
 * Peripherals: Piezo Buzzer (GPIO 18), Cancel SOS Button (GPIO 4), LED (GPIO 2)
 * =========================================================================
 */

#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <HardwareSerial.h>

// --- PIN DEFINITIONS ---
#define MPU6050_SDA_PIN 21
#define MPU6050_SCL_PIN 22
#define SIM800_TX_PIN   17
#define SIM800_RX_PIN   16
#define BUZZER_PIN      18
#define SOS_CANCEL_BTN  4
#define STATUS_LED      2

// --- HARDWARE CONFIGURATION ---
const char* DEVICE_ID = "ESP32-TRIDENT-01";
const char* DEVICE_SECRET = "trident_sec_esp32_9981";
const char* VEHICLE_NUMBER = "KA-01-AI-2026";
const char* SERVER_ENDPOINT = "http://YOUR_SERVER_HOST:3000/api/v1/hardware/telemetry";

const char* FAVORITE_PHONE = "+919876543210";
const char* POLICE_NUMBER = "112";
const char* AMBULANCE_NUMBER = "108";

// --- THRESHOLDS ---
const float G_FORCE_CRASH_THRESHOLD = 3.5; // > 3.5g impact
const float TILT_ANGLE_THRESHOLD    = 55.0; // > 55 deg tilt/rollover
const int COUNTDOWN_SECONDS         = 20;

// Hardware Serial for SIM800L
HardwareSerial sim800(2);

// MPU6050 I2C Address
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
  Serial.println("[SIM800L] Initializing GSM Modem...");
  sim800.begin(9600, SERIAL_8N1, SIM800_RX_PIN, SIM800_TX_PIN);
  delay(3000);
  sendAT("AT");
  sendAT("ATE0");
  sendAT("AT+CPIN?");
  sendAT("AT+CSQ");
  sendAT("AT+CMGF=1"); // SMS Text mode
}

void initMPU6050() {
  Wire.begin(MPU6050_SDA_PIN, MPU6050_SCL_PIN);
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B); // PWR_MGMT_1 register
  Wire.write(0);    // Wake up MPU6050
  Wire.endTransmission(true);
  Serial.println("[MPU6050] 6-DOF Sensor Initialized.");
}

void readMPU6050(float &ax, float &ay, float &az, float &gForce, float &pitch, float &roll) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B); // Starting register for Accel readings
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 14, true);

  AcX = Wire.read()<<8 | Wire.read();
  AcY = Wire.read()<<8 | Wire.read();
  AcZ = Wire.read()<<8 | Wire.read();
  Tmp = Wire.read()<<8 | Wire.read();
  GyX = Wire.read()<<8 | Wire.read();
  GyY = Wire.read()<<8 | Wire.read();
  GyZ = Wire.read()<<8 | Wire.read();

  // Convert raw 16-bit to m/s^2 (±2g range: 16384 LSB/g)
  ax = (AcX / 16384.0) * 9.80665;
  ay = (AcY / 16384.0) * 9.80665;
  az = (AcZ / 16384.0) * 9.80665;

  float mag = sqrt(ax*ax + ay*ay + az*az);
  gForce = mag / 9.80665;

  pitch = atan2(ax, sqrt(ay*ay + az*az)) * 180.0 / PI;
  roll  = atan2(ay, sqrt(ax*ax + az*az)) * 180.0 / PI;
}

void triggerEmergencyEscalation(float gForce) {
  Serial.println("[ESCALATION] Driver Unresponsive! Escalating Emergency Protocol...");
  digitalWrite(BUZZER_PIN, HIGH);

  // 1. Dial Favorite Emergency Contact
  String dialCmd = "ATD" + String(FAVORITE_PHONE) + ";";
  sendAT(dialCmd, 15000);
  sendAT("ATH"); // Hang up after 15s

  // 2. Dial Ambulance Trauma (108)
  sendAT("ATD108;", 15000);
  sendAT("ATH");

  // 3. Send Emergency SMS with GPS
  String smsMsg = "[TRIDENT SOS] Vehicle " + String(VEHICLE_NUMBER) + " CRASH CONFIRMED! Impact: " + String(gForce, 1) + "g. Ambulance Dispatched.";
  sendAT("AT+CMGS=\\"" + String(FAVORITE_PHONE) + "\\"");
  delay(100);
  sim800.print(smsMsg);
  sim800.write(26); // Ctrl+Z to send
  delay(5000);
  
  digitalWrite(BUZZER_PIN, LOW);
}

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(STATUS_LED, OUTPUT);
  pinMode(SOS_CANCEL_BTN, INPUT_PULLUP);

  digitalWrite(STATUS_LED, HIGH);
  initMPU6050();
  initSIM800L();
  digitalWrite(STATUS_LED, LOW);
  Serial.println("[TRIDENT] System Armed & Monitoring...");
}

void loop() {
  float ax, ay, az, gForce, pitch, roll;
  readMPU6050(ax, ay, az, gForce, pitch, roll);

  bool sosBtnPressed = (digitalRead(SOS_CANCEL_BTN) == LOW);

  // Check Crash Conditions
  if (!isCountdownActive && (gForce >= G_FORCE_CRASH_THRESHOLD || abs(pitch) >= TILT_ANGLE_THRESHOLD || abs(roll) >= TILT_ANGLE_THRESHOLD || sosBtnPressed)) {
    Serial.printf("[ALERT] CRASH DETECTED! G-Force: %.2fg | Pitch: %.1f | Roll: %.1f\\n", gForce, pitch, roll);
    isCountdownActive = true;
    countdownStartTime = millis();
  }

  // Active Countdown Logic
  if (isCountdownActive) {
    int elapsedSec = (millis() - countdownStartTime) / 1000;
    int remainingSec = COUNTDOWN_SECONDS - elapsedSec;

    // Audible alarm beep
    digitalWrite(BUZZER_PIN, (millis() / 250) % 2);

    // Cancel Button Check (False Alarm)
    if (sosBtnPressed && elapsedSec > 1) {
      Serial.println("[CANCEL] User pressed I AM SAFE button. Alarm Disarmed.");
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
}
`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename="trident_esp32_firmware.ino"');
  return res.send(firmwareCode);
});

// ----------------------------------------------------
// REAL-TIME SERVER-SENT EVENTS (SSE)
// ----------------------------------------------------
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', time: new Date().toISOString() })}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// ----------------------------------------------------
// USERS CRUD
// ----------------------------------------------------
app.get('/api/v1/users', (req, res) => {
  const safeUsers = users.map((u) => {
    const copy: any = { ...u };
    delete copy.password;
    return copy;
  });
  return res.json(safeUsers);
});

app.put('/api/v1/users/:id', (req, res) => {
  const id = Number(req.params.id);
  const user = users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { name, phone, bloodGroup, medicalConditions, secondaryEmergencyContact } = req.body;
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (bloodGroup) user.bloodGroup = bloodGroup;
  if (medicalConditions) user.medicalConditions = medicalConditions;
  if (secondaryEmergencyContact) user.secondaryEmergencyContact = secondaryEmergencyContact;

  const safe: any = { ...user };
  delete safe.password;
  return res.json(safe);
});

// ----------------------------------------------------
// VITE OR STATIC SERVING
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TRIDENT SERVER] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
