package com.kyc.controller;

import com.kyc.util.EncryptionUtil;
import org.bson.Document;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

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
                    List<Document> encryptedEntities = (List<Document>) result.get("entities");
                    List<Map<String, Object>> decryptedEntities = new ArrayList<>();

                    for(Document encryptedEntity: encryptedEntities) {
                        Map<String, Object> decryptedEntity = new HashMap<>();

                        for (Map.Entry<String, Object> entry : encryptedEntity.entrySet()) {
                            String key = entry.getKey();
                            Object value = entry.getValue();

                            if(value instanceof Document encryptedField){
                                String iv = encryptedField.getString("iv");
                                String cipherText = encryptedField.getString("cipherText");
                                if(iv != null && cipherText != null){
                                    Map<String, String> encryptedMap = Map.of(
                                            "iv", iv,
                                            "cipherText", cipherText
                                    );
                                    String decryptedValue = EncryptionUtil.decryptWithIV(encryptedMap);
                                    decryptedEntity.put(key, decryptedValue);
                                } else {
                                    decryptedEntity.put(key, value.toString());
                                }
                            }
                            else{
                                decryptedEntity.put(key, value);
                            }
                        }
                        decryptedEntities.add(decryptedEntity);
                    }
                    result.put("entities", decryptedEntities);
                }

                List<Map<String, Object>> returnResult = (List<Map<String, Object>>) result.get("entities");
                return ResponseEntity.ok(returnResult);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred: " + e.getMessage());
        }
    }
}
