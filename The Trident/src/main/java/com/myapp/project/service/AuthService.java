package com.myapp.project.service;

import com.myapp.project.dto.request.LoginRequest;
import com.myapp.project.dto.request.RegisterRequest;
import com.myapp.project.dto.response.AuthResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}
