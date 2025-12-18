package com.kyc.controller;

import com.kyc.util.EncryptionUtil;
import org.bson.Document;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import com.mongodb.ReadConcern;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.springframework.beans.factory.annotation.Value;

import java.util.*;

@RestController
@RequestMapping("/api")
public class FetchByCustID {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUriString;

    @PostMapping("/customerDetailsCustID")
    public ResponseEntity<?> getCustomerDetailsById(@RequestBody Map<String, String> bodyReq) {
        try {
            String custId = bodyReq.get("cust_id");
            String userId = bodyReq.get("user_id");

            try (var mongoClient = MongoClients.create(mongoUriString)) {
                // ReadConcern - returns data that has been ACK by the majority of replica set
                // ensures consistency of data that is read and returned
                MongoDatabase database = mongoClient.getDatabase("kyc_db");

                MongoCollection<Document> collection = database.getCollection("document");

                // fetching details of customer with cust_id
                Document query = new Document("cust_id", custId).append("user_id", userId);
                Document result = collection.find(query).first();

                if (result == null) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body("No customer found with cust_id: " + custId);
                }

                if (result.containsKey("entities")) {
                    Document entitiesDoc = (Document) result.get("entities");
                    Document decryptedEntities = new Document();

                    for (String key : entitiesDoc.keySet()) {
                        Object field = entitiesDoc.get(key);

                        if (field instanceof Document encryptedField) {
                            String iv = encryptedField.getString("iv");
                            String cipherText = encryptedField.getString("cipherText");

                            if (iv != null && cipherText != null) {
                                Map<String, String> map = Map.of("iv", iv, "cipherText", cipherText);
                                String decryptedValue = EncryptionUtil.decryptWithIV(map);
                                decryptedEntities.put(key, decryptedValue);
                            } else {
                                decryptedEntities.put(key, field.toString());
                            }
                        } else {
                            decryptedEntities.put(key, field.toString());
                        }
                    }

                    result.put("entities", decryptedEntities);
                }

                return ResponseEntity.ok(result);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred: " + e.getMessage());
        }
    }
}
