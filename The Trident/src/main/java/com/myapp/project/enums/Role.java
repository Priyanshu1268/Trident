package com.myapp.project.enums;

/**
 * Application-level user roles.
 * Prefixed with ROLE_ at the Spring Security layer via GrantedAuthority mapping.
 */
public enum Role {
    USER,
    ADMIN
}
