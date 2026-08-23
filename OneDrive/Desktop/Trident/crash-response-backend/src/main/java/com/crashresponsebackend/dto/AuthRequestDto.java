package com.crashresponsebackend.dto;

import lombok.Data;

@Data
public class AuthRequestDto {
    private String email;
    private String password;
    private String name;
    private String phone;
    private String bloodGroup;
    private String medicalConditions;
    private String secondaryEmergencyContact;
}