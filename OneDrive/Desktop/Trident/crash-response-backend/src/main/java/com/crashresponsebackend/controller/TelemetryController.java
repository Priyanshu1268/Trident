package com.crashresponsebackend.controller;

import com.crashresponsebackend.dto.TelemetryRequestDto;
import com.crashresponsebackend.model.CrashAlert;
import com.crashresponsebackend.service.CrashService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/telemetry")
public class TelemetryController {

    private final CrashService crashService;

    public TelemetryController(CrashService crashService) {
        this.crashService = crashService;
    }

    @PostMapping
    public ResponseEntity<CrashAlert> receiveCrashTelemetry(@RequestBody TelemetryRequestDto dto) {
        CrashAlert alert = crashService.processTelemetry(dto);
        return ResponseEntity.ok(alert);
    }
}