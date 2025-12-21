package com.kyc.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.util.MultiValueMap;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.core.ParameterizedTypeReference;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.*;

@RestController
@RequestMapping("/api")
public class ExtractDetails {

    @PostMapping("/details")
    public ResponseEntity<?> extractOnly(
            @RequestParam("file") MultipartFile[] files,
            @RequestParam("document_type") String[] documentTypes) {
        try {
            List<Object> allExtractedEntities = new ArrayList<>();
            RestTemplate restTemplate = new RestTemplate();

            for (int i = 0; i < files.length; i++) {

                MultipartFile file = files[i];
                String documentType = documentTypes[i];

                InputStream flaskStream = new ByteArrayInputStream(file.getBytes());

                MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                body.add("file", new MultipartInputStreamFileResource(
                        flaskStream, file.getOriginalFilename()));
                body.add("document_type", documentType);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);

                HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

                ResponseEntity<Map<String, Object>> flaskResponse = restTemplate.exchange(
                        "http://localhost:5000/uploadDetails",
                        HttpMethod.POST,
                        requestEntity,
                        new ParameterizedTypeReference<>() {
                        });

                allExtractedEntities.addAll(
                        (List<?>) flaskResponse.getBody().get("extracted_entities"));
            }
            // System.out.println("Extracted Entities: " + allExtractedEntities);
            return ResponseEntity.ok(
                    Map.of("status", "success", "data", allExtractedEntities));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", e.getMessage()));
        }
    }

}
