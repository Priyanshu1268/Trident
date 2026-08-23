package com.crashresponsebackend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "crash_alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrashAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    private Double latitude;
    private Double longitude;
    private Double gForce;
    private Double impactSpeed;
    private String severity;
    private LocalDateTime timestamp;
    private Boolean dispatched;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AlertStatus status = AlertStatus.PENDING;

    public enum AlertStatus {
        PENDING,
        ACCEPTED,
        DISPATCHED,
        RESOLVED,
        FALSE_ALARM
    }
}