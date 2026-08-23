package com.crashresponsebackend.controller;

import com.crashresponsebackend.dto.AuthRequestDto;
import com.crashresponsebackend.dto.AuthResponseDto;
import com.crashresponsebackend.model.User;
import com.crashresponsebackend.repository.UserRepository;
import com.crashresponsebackend.security.JwtUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody AuthRequestDto request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Error: Email is already registered!");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phone(request.getPhone())
                .bloodGroup(request.getBloodGroup())
                .medicalConditions(request.getMedicalConditions())
                .secondaryEmergencyContact(request.getSecondaryEmergencyContact())
                .role(User.Role.DRIVER)
                .build();

        userRepository.save(user);
        String token = jwtUtils.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponseDto(token, user.getEmail(), user.getName()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody AuthRequestDto request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body("Error: Invalid email or password");
        }

        String token = jwtUtils.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponseDto(token, user.getEmail(), user.getName()));
    }
}