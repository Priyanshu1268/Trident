package com.myapp.project.util;

/**
 * Small string helpers used across the codebase.
 */
public final class StringUtils {

    private StringUtils() {
        // utility class
    }

    public static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    public static String normalizeEmail(String email) {
        return isBlank(email) ? email : email.trim().toLowerCase();
    }
}
