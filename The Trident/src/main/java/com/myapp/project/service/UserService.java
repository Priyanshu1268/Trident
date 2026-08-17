package com.myapp.project.service;

import com.myapp.project.dto.request.UserRequest;
import com.myapp.project.dto.response.UserResponse;

import java.util.List;

public interface UserService {

    UserResponse getUserById(Long id);

    UserResponse getUserByEmail(String email);

    List<UserResponse> getAllUsers();

    UserResponse updateUser(Long id, UserRequest request);

    void deleteUser(Long id);
}
