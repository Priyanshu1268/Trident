package com.crashresponsebackend.controller;

import com.crashresponsebackend.dto.AlertResponseDto;
import com.crashresponsebackend.model.CrashAlert;
import com.crashresponsebackend.service.CrashService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/alerts")
public class AlertController {

    private final CrashService crashService;

    public AlertController(CrashService crashService) {
        this.crashService = crashService;
    }

    @GetMapping
    public ResponseEntity<List<CrashAlert>> getAllAlerts() {
        return ResponseEntity.ok(crashService.getAllAlerts());
    }

    @PutMapping("/{id}/respond")
    public ResponseEntity<?> respondToAlert(@PathVariable Long id, @RequestBody AlertResponseDto responseDto) {
        try {
            CrashAlert updatedAlert = crashService.updateAlertStatus(id, responseDto);
            return ResponseEntity.ok(updatedAlert);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}