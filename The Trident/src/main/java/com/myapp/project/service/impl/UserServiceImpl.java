package com.myapp.project.service.impl;

import com.myapp.project.dto.request.UserRequest;
import com.myapp.project.dto.response.UserResponse;
import com.myapp.project.entity.User;
import com.myapp.project.exception.DuplicateResourceException;
import com.myapp.project.exception.ResourceNotFoundException;
import com.myapp.project.mapper.UserMapper;
import com.myapp.project.repository.UserRepository;
import com.myapp.project.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Override
    public UserResponse getUserById(Long id) {
        User user = findUserOrThrow(id);
        return userMapper.toResponse(user);
    }

    @Override
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return userMapper.toResponse(user);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(userMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UserRequest request) {
        User user = findUserOrThrow(id);

        if (!user.getEmail().equalsIgnoreCase(request.getEmail())
                && userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already in use: " + request.getEmail());
        }

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());

        User saved = userRepository.save(user);
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = findUserOrThrow(id);
        userRepository.delete(user);
    }

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }
}
