package com.crashresponsebackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AnalyticsResponseDto {
    private Long totalCrashes;
    private Long highSeverityCount;
    private Long mediumSeverityCount;
    private Long lowSeverityCount;
    private Long crashesForVehicle;
    private Double averageResponseTimeMinutes;
}