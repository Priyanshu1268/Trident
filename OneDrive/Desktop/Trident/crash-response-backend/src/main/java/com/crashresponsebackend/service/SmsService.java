package com.crashresponsebackend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class SmsService {

    @Value("${fast2sms.api.key:YOUR_FAST2SMS_API_KEY_HERE}")
    private String apiKey;

    @Value("${fast2sms.url:https://www.fast2sms.com/dev/bulkV2}")
    private String apiUrl;

    public void sendEmergencySms(String phoneNumber, String vehicleDetails, Double lat, Double lng, String severity) {
        try {
            // Clean phone number (extract last 10 digits)
            String cleanPhone = phoneNumber.replaceAll("[^0-9]", "");
            if (cleanPhone.length() > 10) {
                cleanPhone = cleanPhone.substring(cleanPhone.length() - 10);
            }

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("authorization", apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            String message = String.format("EMERGENCY ALERT! Crash detected for %s. Severity: %s. Location: https://maps.google.com/?q=%f,%f",
                    vehicleDetails, severity, lat, lng);

            String requestBody = String.format("{\"route\":\"q\",\"message\":\"%s\",\"language\":\"english\",\"numbers\":\"%s\"}",
                    message, cleanPhone);

            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
            restTemplate.postForEntity(apiUrl, entity, String.class);

            System.out.println("Emergency SMS dispatch attempt completed for: " + cleanPhone);
        } catch (Exception e) {
            System.err.println("Failed to send SMS via Fast2SMS: " + e.getMessage());
            e.printStackTrace();
        }
    }
}