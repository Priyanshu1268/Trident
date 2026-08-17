package com.myapp.project.dto.response;

import com.myapp.project.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Safe, outward-facing representation of a User (never exposes the password).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String fullName;
    private String email;
    private Role role;
    private boolean enabled;
    private LocalDateTime createdAt;
}
