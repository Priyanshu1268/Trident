package com.crashresponsebackend.service;

import com.crashresponsebackend.dto.AlertResponseDto;
import com.crashresponsebackend.dto.AnalyticsResponseDto;
import com.crashresponsebackend.dto.TelemetryRequestDto;
import com.crashresponsebackend.model.CrashAlert;
import com.crashresponsebackend.model.Vehicle;
import com.crashresponsebackend.repository.CrashAlertRepository;
import com.crashresponsebackend.repository.VehicleRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CrashService {

    private final CrashAlertRepository crashAlertRepository;
    private final VehicleRepository vehicleRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final SmsService smsService;

    public CrashService(CrashAlertRepository crashAlertRepository,
                        VehicleRepository vehicleRepository,
                        SimpMessagingTemplate messagingTemplate,
                        SmsService smsService) {
        this.crashAlertRepository = crashAlertRepository;
        this.vehicleRepository = vehicleRepository;
        this.messagingTemplate = messagingTemplate;
        this.smsService = smsService;
    }

    public CrashAlert updateAlertStatus(Long alertId, AlertResponseDto responseDto) {
        CrashAlert alert = crashAlertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Crash alert not found with ID: " + alertId));

        alert.setStatus(responseDto.getStatus());

        // Broadcast updated status to hospital dashboard via WebSockets
        messagingTemplate.convertAndSend("/topic/emergency-alerts/updates", alert);

        return crashAlertRepository.save(alert);
    }

    public List<CrashAlert> getAllAlerts() {
        return crashAlertRepository.findAll();
    }

    public List<CrashAlert> getVehicleHistory(String vehicleNumber) {
        return crashAlertRepository.findByVehicleVehicleNumber(vehicleNumber);
    }

    public AnalyticsResponseDto getSystemAnalytics(String vehicleNumber) {
        Long totalCrashes = crashAlertRepository.count();
        Long highCount = crashAlertRepository.countBySeverity("HIGH");
        Long medCount = crashAlertRepository.countBySeverity("MEDIUM");
        Long lowCount = crashAlertRepository.countBySeverity("LOW");

        Long vehicleCrashCount = (vehicleNumber != null && !vehicleNumber.isEmpty())
                ? crashAlertRepository.countByVehicleVehicleNumber(vehicleNumber)
                : 0L;

        Double avgResponseTime = crashAlertRepository.calculateAverageResponseTimeMinutes();

        return AnalyticsResponseDto.builder()
                .totalCrashes(totalCrashes)
                .highSeverityCount(highCount)
                .mediumSeverityCount(medCount)
                .lowSeverityCount(lowCount)
                .crashesForVehicle(vehicleCrashCount)
                .averageResponseTimeMinutes(avgResponseTime != null ? Math.round(avgResponseTime * 100.0) / 100.0 : 0.0)
                .build();
    }

    public CrashAlert processTelemetry(TelemetryRequestDto dto) {
        Vehicle vehicle = vehicleRepository.findByVehicleNumber(dto.getVehicleNumber())
                .orElseGet(() -> vehicleRepository.save(
                        Vehicle.builder()
                                .vehicleNumber(dto.getVehicleNumber())
                                .owner("Unknown Owner")
                                .emergencyContactPhone("+918757882039")
                                .vehicleType("CAR")
                                .build()
                ));

        String severity = "LOW";
        if (dto.getGForce() > 4.0 && dto.getImpactSpeed() > 30.0) {
            severity = "HIGH";
        } else if (dto.getGForce() > 2.5) {
            severity = "MEDIUM";
        }

        CrashAlert alert = CrashAlert.builder()
                .vehicle(vehicle)
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .gForce(dto.getGForce())
                .impactSpeed(dto.getImpactSpeed())
                .severity(severity)
                .timestamp(LocalDateTime.now())
                .dispatched("HIGH".equals(severity))
                .build();

        CrashAlert savedAlert = crashAlertRepository.save(alert);

        if ("HIGH".equals(severity)) {
            // 1. Broadcast alert with driver medical details via WebSocket
            messagingTemplate.convertAndSend("/topic/emergency-alerts", savedAlert);

            // 2. Format detailed emergency SMS
            String bloodGroup = (vehicle.getDriver() != null && vehicle.getDriver().getBloodGroup() != null)
                    ? vehicle.getDriver().getBloodGroup() : "Unknown";

            String conditions = (vehicle.getDriver() != null && vehicle.getDriver().getMedicalConditions() != null)
                    ? vehicle.getDriver().getMedicalConditions() : "None Recorded";

            String medicalInfoSMS = String.format(" [Blood: %s, Conditions: %s]", bloodGroup, conditions);

            smsService.sendEmergencySms(
                    vehicle.getEmergencyContactPhone(),
                    vehicle.getVehicleNumber() + medicalInfoSMS,
                    savedAlert.getLatitude(),
                    savedAlert.getLongitude(),
                    severity
            );
        }

        return savedAlert;
    }
}