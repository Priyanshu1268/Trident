package com.myapp.project.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Type-safe binding for the `application.security.jwt.*` properties
 * defined in application.properties (backed by env vars).
 */
@Configuration
@ConfigurationProperties(prefix = "application.security.jwt")
@Getter
@Setter
public class JwtConfig {

    private String secretKey;
    private long expirationMs;
}
