package com.kyc.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kyc.util.EncryptionUtil;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Value;

import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

import java.util.*;

@RestController
@RequestMapping("/api")
public class UploadDetailsExisting {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUriString;

    @PostMapping("/saveDetailsExisting")
    public ResponseEntity<?> uploadCustDetails(@RequestPart("entities") String entitiesJson,
            @RequestPart("user_id") String user_id,
            @RequestPart("cust_id") String cust_id) {

        try (var mongoClient = MongoClients.create(mongoUriString)) {
            ObjectMapper mapper = new ObjectMapper();

            List<Map<String, Object>> entities = mapper.readValue(
                    entitiesJson,
                    new TypeReference<List<Map<String, Object>>>() {
                    });

            if (entities.isEmpty()) {
                throw new RuntimeException("Entities list is empty");
            }

            // Encryption entities
            List<Map<String, Object>> encryptedEntities = new ArrayList<>();

            for (Map<String, Object> entity : entities) {
                Map<String, Object> encryptedEntity = new HashMap<>();

                for (Map.Entry<String, Object> entry : entity.entrySet()) {
                    String key = entry.getKey();
                    Object value = entry.getValue();

                    if (value == null) {
                        encryptedEntity.put(key, null);
                    } else {
                        Map<String, String> encryptedValue = EncryptionUtil.encryptWithIV(value.toString());
                        encryptedEntity.put(key, encryptedValue);
                    }
                }
                encryptedEntities.add(encryptedEntity);
            }

            MongoDatabase db = mongoClient.getDatabase("kyc_db");
            MongoCollection<Document> documentCollection = db.getCollection("document");

            Document filter = new Document("cust_id", cust_id).append("user_id", user_id);
            Document update = new Document("$push", new Document("entities", new Document("$each", encryptedEntities)));

            var updateResult = documentCollection.updateOne(filter, update);

            if (updateResult.getMatchedCount() == 0) {
                return ResponseEntity.status(404).body(Map.of("status", "error", "message",
                        "No matching document found for the provided cust_id and user_id"));
            }

            return ResponseEntity.ok(Map.of("status", "success", "message", "Details updated successfully"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }
}
