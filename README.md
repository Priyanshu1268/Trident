# Trident | AI Crash Response & Telemetry Safety System

A production-ready full-stack AI emergency crash response, vision safety monitoring, and vehicle telemetry management platform.

## Features

- **Live Triage Command Center**: Real-time crash telemetry ingestion, G-force impact severity calculation, and instant auto-dispatching for trauma responders.
- **AI Vision Safety Feed**: Real-time YOLO model detection for helmet compliance and road pothole hazards with live telemetry broadcast and cooldown controls.
- **Connected Fleet & Medical Passport**: Vehicle registry with driver medical profile integration (blood group, allergies, conditions, and emergency contacts).
- **Emergency Cellular SMS Broadcast**: Automated SMS dispatch logs with precise GPS coordinates, impact velocity, and driver medical passport data.
- **Analytics & SLA Dashboard**: Real-time response time tracking, severity breakdown, and 24-hour crash distribution charts.
- **Full REST API & Real-time SSE**: Complete endpoints compatible with the original Spring Boot and Python architectures.

## API Endpoints

- `POST /api/v1/auth/signup` - Register driver/responder profile
- `POST /api/v1/auth/login` - Authenticate and receive JWT
- `POST /api/v1/telemetry` - Ingest telemetry, calculate severity, and trigger auto-dispatch
- `GET /api/v1/alerts` - List active and historical crash alerts
- `PUT /api/v1/alerts/:id/respond` - Update alert status (Dispatch Ambulance, Notify Hospital, Resolve)
- `POST /api/v1/alerts/simulate` - Trigger simulated crash telemetry scenarios
- `GET /api/v1/vehicles` - List registered connected fleet
- `POST /api/v1/vehicles/register` - Register a new vehicle and driver
- `GET /api/v1/analytics/summary` - Aggregate system KPIs and crash distribution
- `GET /api/v1/analytics/history/:vehicleNumber` - Vehicle-specific crash logs
- `GET /api/v1/sms/logs` - Cellular SMS emergency broadcast logs
- `GET /api/events` - Server-Sent Events (SSE) live real-time stream
