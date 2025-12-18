package com.kyc.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.util.MultiValueMap;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.core.ParameterizedTypeReference;

import org.springframework.beans.factory.annotation.Value;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.*;

@RestController
@RequestMapping("/api")
public class ExtractDetails {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUriString;

    @PostMapping("/details")
    public ResponseEntity<?> extractOnly(@RequestParam("file") MultipartFile[] files) {
        try {
            List<Map<String, Object>> extractedResults = new ArrayList<>();
            for (MultipartFile file : files) {
                byte[] fileBytes = file.getBytes();
                InputStream flaskStream = new ByteArrayInputStream(fileBytes);
                MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                body.add("file", new MultipartInputStreamFileResource(flaskStream, file.getOriginalFilename()));
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);
                HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
                RestTemplate restTemplate = new RestTemplate();
                ResponseEntity<Map<String, Object>> flaskResponse = restTemplate.exchange(
                        "http://localhost:5000/uploadDetails",
                        HttpMethod.POST,
                        requestEntity,
                        new ParameterizedTypeReference<>() {
                        });
                if (flaskResponse.getStatusCode() != HttpStatus.OK || flaskResponse.getBody() == null) {
                    return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                            .body(Map.of("status", "error", "message", "Flask server error"));
                }
                extractedResults.add(flaskResponse.getBody());
            }
            return ResponseEntity.ok(Map.of("status", "success", "data", extractedResults));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }
}
