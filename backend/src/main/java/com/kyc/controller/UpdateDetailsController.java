package com.kyc.controller;

import com.kyc.util.EncryptionUtil;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.result.UpdateResult;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class UpdateDetailsController {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUriString;

    @PatchMapping("/customer/{custId}")
    public ResponseEntity<?> patchCustomerDetails(
            @PathVariable String custId,
            @RequestBody Map<String, Object> updatedDetails) {

        try (var mongoClient = MongoClients.create(mongoUriString)) {

            MongoDatabase database = mongoClient.getDatabase("kyc_db");
            MongoCollection<Document> collection = database.getCollection("document");

            if (custId == null || custId.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("status", "error", "message", "cust_id cannot be null or empty"));
            }

            Document filter = new Document("cust_id", custId);
            Document updateFields = new Document();

            // Update name
            if (updatedDetails.containsKey("name")) {
                updateFields.append("name", updatedDetails.get("name"));
            }

            // Update encrypted entities
            if (updatedDetails.containsKey("entities")) {
                Map<String, Object> entitiesMap =
                        (Map<String, Object>) updatedDetails.get("entities");

                Document encryptedEntities = new Document();

                for (Map.Entry<String, Object> entry : entitiesMap.entrySet()) {
                    try {
                        Map<String, String> encResult =
                                EncryptionUtil.encryptWithIV(entry.getValue().toString());
                        encryptedEntities.put(entry.getKey(), encResult);
                    } catch (Exception e) {
                        throw new RuntimeException("Encryption failed for field: " + entry.getKey(), e);
                    }
                }

                updateFields.append("entities", encryptedEntities);
            }

            if (updateFields.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("status", "error", "message", "No valid fields to update"));
            }

            UpdateResult result =
                    collection.updateOne(filter, new Document("$set", updateFields));

            if (result.getMatchedCount() == 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("status", "error", "message", "Customer not found"));
            }

            return ResponseEntity.ok(
                    Map.of("status", "success", "message", "Customer details updated successfully"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }
}
