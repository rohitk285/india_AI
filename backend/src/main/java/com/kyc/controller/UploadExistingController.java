package com.kyc.controller;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.springframework.util.MultiValueMap;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.beans.factory.annotation.Value;

import com.kyc.util.GoogleDriveUploader;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.*;

@RestController
@RequestMapping("/api")
public class UploadExistingController {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUriString;

    @PostMapping("/existingCustomer")
    public ResponseEntity<?> handleExistingCustomer(
            @RequestParam(value = "cust_id", required = true) String custId,
            @RequestParam("file") MultipartFile file) { // one file only
        try {
            // Read file bytes once
            byte[] fileBytes = file.getBytes();

            // uploading to GDrive through service account
            InputStream driveStream = new ByteArrayInputStream(fileBytes);
            String driveLink = GoogleDriveUploader.uploadToDrive(
                    driveStream,
                    file.getOriginalFilename(),
                    file.getContentType());

            // Send PDF to Flask API for NER (only the file)
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            InputStream flaskStream = new ByteArrayInputStream(fileBytes);
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new MultipartInputStreamFileResource(flaskStream, file.getOriginalFilename()));

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<Map<String, Object>> flaskResponse = restTemplate.exchange(
                    "http://localhost:5000/uploadDetails",
                    HttpMethod.POST,
                    requestEntity,
                    new ParameterizedTypeReference<>() {
                    });

            if (flaskResponse.getStatusCode() != HttpStatus.OK || flaskResponse.getBody() == null) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                        "status", "error",
                        "message", "Flask server error or no data"));
            }

            Map<String, Object> flaskData = flaskResponse.getBody();

            // parse response
            List<Map<String, Object>> extracted = new ArrayList<>();
            Object extractedObj = flaskData.get("extracted_data");
            if (extractedObj instanceof List<?>) {
                for (Object item : (List<?>) extractedObj) {
                    if (item instanceof Map<?, ?> rawMap) {
                        Map<String, Object> typedMap = new HashMap<>();
                        for (Map.Entry<?, ?> e : rawMap.entrySet()) {
                            typedMap.put(String.valueOf(e.getKey()), e.getValue());
                        }
                        extracted.add(typedMap);
                    }
                }
            }

            try (var mongoClient = MongoClients.create(mongoUriString)) {
                MongoDatabase database = mongoClient.getDatabase("kyc_db");
                MongoCollection<Document> collection = database.getCollection("document");

                Document filter = new Document("_id", new ObjectId(custId));
                Document projection = new Document("document_type", 1).append("entities", 1);

                Document result = collection.find(filter).projection(projection).first();
                if (result == null) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                            "status", "error",
                            "message", "Customer not found"));
                }

                List<String> existingDocumentTypes = (List<String>) result.get("document_type");
                if (existingDocumentTypes == null)
                    existingDocumentTypes = new ArrayList<>();

                for (Map<String, Object> doc : extracted) {
                    Object docTypeObj = doc.get("document_type");

                    List<String> newTypes = new ArrayList<>();
                    if (docTypeObj instanceof List<?> list) {
                        for (Object t : list)
                            newTypes.add(String.valueOf(t));
                    } else if (docTypeObj instanceof String s) {
                        newTypes.add(s);
                    }

                    for (String temp : newTypes) {
                        if (existingDocumentTypes.contains(temp)) {
                            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                                    "status", "error",
                                    "message", "Document type " + temp + " already exists for this customer"));
                        }
                    }

                    Document existingEntities = (Document) result.get("entities");
                    Object docEntities = doc.get("named_entities");
                    if (existingEntities == null)
                        existingEntities = new Document();

                    if (docEntities instanceof Map<?, ?> map) {
                        for (Map.Entry<?, ?> entry : map.entrySet()) {
                            String key = String.valueOf(entry.getKey());
                            Object value = entry.getValue();

                            // appending only if the key doesn't exist in the existing entities field
                            if (!existingEntities.containsKey(key)) {
                                existingEntities.append(key, value);
                            }
                        }
                    }

                    Document updatedDoc = new Document()
                            .append("$push",
                                    new Document("document_type", newTypes.size() == 1 ? newTypes.get(0) : newTypes))
                            .append("$set", new Document("entities", existingEntities));
                    collection.updateOne(filter, updatedDoc);

                    String tempType = newTypes.get(0).toLowerCase();
                    String type = tempType;
                    switch (tempType) {
                        case "pan card":
                            type = "pan";
                            break;
                        case "aadhaar card":
                            type = "aadhaar";
                            break;
                        case "credit card":
                            type = "creditcard";
                            break;
                    }

                    MongoCollection<Document> typeCollection = database.getCollection(type);
                    String name = null;
                    if (docEntities instanceof Map<?, ?>) {
                        Map<?, ?> temp = (Map<?, ?>) docEntities;
                        name = (String) temp.get("Name");
                    }

                    Document newTypeDoc = new Document();
                    newTypeDoc.append("name", name);
                    newTypeDoc.append("fileLink", driveLink);
                    newTypeDoc.append("cust_id", custId);

                    typeCollection.insertOne(newTypeDoc);
                }
            }

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "data", extracted));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "status", "error",
                    "message", "Server error: " + e.getMessage()));
        }
    }
}
