package com.kyc.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kyc.util.EncryptionUtil;

import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;

// import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.mongodb.client.*;
import org.bson.Document;

import java.util.*;

@RestController
@RequestMapping("/api")
public class UploadDetails {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUriString;

    @PostMapping("/saveDetails")
    public ResponseEntity<?> uploadCustDetails(
            @RequestPart("entities") String entitiesJson,
            @RequestPart("user_id") String user_id
    ) {

        try (var mongoClient = MongoClients.create(mongoUriString)) {

            ObjectMapper mapper = new ObjectMapper();

            List<Map<String, Object>> entities =
                    mapper.readValue(
                            entitiesJson,
                            new TypeReference<List<Map<String, Object>>>() {}
                    );

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
                        Map<String, String> encryptedValue =
                                EncryptionUtil.encryptWithIV(value.toString());
                        encryptedEntity.put(key, encryptedValue);
                    }
                }
                encryptedEntities.add(encryptedEntity);
            }

            MongoDatabase db = mongoClient.getDatabase("kyc_db");
            MongoCollection<Document> documentCollection = db.getCollection("document");

            String custId = new ObjectId().toString();

            String name = "";
            if (entities.get(0).containsKey("name")) {
                name = entities.get(0).get("name").toString();
            }

            Document documentToInsert = new Document()
                    .append("cust_id", custId)
                    .append("name", name)
                    .append("entities", encryptedEntities)
                    .append("user_id", user_id);

            documentCollection.insertOne(documentToInsert);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "cust_id", custId,
                    "name", name
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        }
    }
}
