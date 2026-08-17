package com.myapp.project.service.impl;

import com.myapp.project.dto.request.LoginRequest;
import com.myapp.project.dto.request.RegisterRequest;
import com.myapp.project.dto.response.AuthResponse;
import com.myapp.project.entity.User;
import com.myapp.project.enums.Role;
import com.myapp.project.exception.DuplicateResourceException;
import com.myapp.project.exception.InvalidCredentialsException;
import com.myapp.project.mapper.UserMapper;
import com.myapp.project.repository.UserRepository;
import com.myapp.project.security.JwtService;
import com.myapp.project.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);

        String token = jwtService.generateToken(toUserDetails(savedUser));

        return AuthResponse.builder()
                .accessToken(token)
                .expiresInMs(jwtService.getExpirationMs())
                .user(userMapper.toResponse(savedUser))
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail().toLowerCase(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException ex) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        String token = jwtService.generateToken(toUserDetails(user));

        return AuthResponse.builder()
                .accessToken(token)
                .expiresInMs(jwtService.getExpirationMs())
                .user(userMapper.toResponse(user))
                .build();
    }

    private UserDetails toUserDetails(User user) {
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities("ROLE_" + user.getRole().name())
                .disabled(!user.isEnabled())
                .build();
    }
}
