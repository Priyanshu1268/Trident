package com.crashresponsebackend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String name;
    private String phone;

    // Emergency & Medical Profile Fields
    private String bloodGroup;
    private String medicalConditions;
    private String secondaryEmergencyContact;

    @Enumerated(EnumType.STRING)
    private Role role;

    public enum Role {
        DRIVER, ADMIN, HOSPITAL
    }
}