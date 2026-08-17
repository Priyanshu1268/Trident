package com.myapp.project.exception;

/**
 * Thrown when attempting to create a resource that already exists (e.g. duplicate email).
 * Mapped to HTTP 409 by the GlobalExceptionHandler.
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}
