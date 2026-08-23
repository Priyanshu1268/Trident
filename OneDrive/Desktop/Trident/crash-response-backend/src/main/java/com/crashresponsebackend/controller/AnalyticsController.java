package com.crashresponsebackend.controller;

import com.crashresponsebackend.dto.AnalyticsResponseDto;
import com.crashresponsebackend.model.CrashAlert;
import com.crashresponsebackend.service.CrashService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    private final CrashService crashService;

    public AnalyticsController(CrashService crashService) {
        this.crashService = crashService;
    }

    // 1. Get complete crash history for a specific vehicle
    @GetMapping("/history/{vehicleNumber}")
    public ResponseEntity<List<CrashAlert>> getVehicleHistory(@PathVariable String vehicleNumber) {
        return ResponseEntity.ok(crashService.getVehicleHistory(vehicleNumber));
    }

    // 2. Get aggregate system analytics & crash metrics
    @GetMapping("/summary")
    public ResponseEntity<AnalyticsResponseDto> getSummaryAnalytics(
            @RequestParam(required = false) String vehicleNumber) {
        return ResponseEntity.ok(crashService.getSystemAnalytics(vehicleNumber));
    }
}