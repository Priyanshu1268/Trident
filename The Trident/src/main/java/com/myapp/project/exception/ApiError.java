package com.myapp.project.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Standard error response body returned by the API on any failure.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiError {

    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String message;
    private String path;

    /**
     * Field-level validation errors, e.g. {"email": "must be a valid email address"}.
     */
    private Map<String, String> validationErrors;
}
