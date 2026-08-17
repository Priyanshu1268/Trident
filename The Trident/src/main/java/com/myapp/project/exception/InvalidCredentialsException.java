package com.myapp.project.exception;

/**
 * Thrown when authentication fails due to invalid email/password.
 * Mapped to HTTP 401 by the GlobalExceptionHandler.
 */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException(String message) {
        super(message);
    }
}
