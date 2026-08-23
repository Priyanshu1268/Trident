package com.crashresponsebackend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vehicles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String vehicleNumber;

    private String owner;
    private String emergencyContactPhone;
    private String vehicleType;

    @ManyToOne
    @JoinColumn(name = "driver_id")
    private User driver; // Link to Driver User Profile
}