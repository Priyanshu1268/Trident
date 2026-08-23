package com.crashresponsebackend.dto;

import lombok.Data;

@Data
public class TelemetryRequestDto {
    private String vehicleNumber;
    private Double gForce;
    private Double impactSpeed;
    private Double latitude;
    private Double longitude;
    private Boolean isAudioThresholdExceeded;
}