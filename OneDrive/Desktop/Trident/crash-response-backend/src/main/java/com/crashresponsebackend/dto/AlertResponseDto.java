package com.crashresponsebackend.dto;

import com.crashresponsebackend.model.CrashAlert.AlertStatus;
import lombok.Data;

@Data
public class AlertResponseDto {
    private AlertStatus status;
    private String responderName;
    private String notes;
}