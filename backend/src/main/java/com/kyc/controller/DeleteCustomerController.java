package com.kyc.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

import java.util.*;
// import java.util.HashMap;

@RestController
@RequestMapping("/api")
public class DeleteCustomerController {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUriString;

    @DeleteMapping("/deleteCustomer")
    public ResponseEntity<?> deleteCustomer(@RequestBody Map<String, String> bodyReq) {
        String custId = bodyReq.get("cust_id");
        String userId = bodyReq.get("user_id");

        try (var mongoClient = MongoClients.create(mongoUriString)) {
                MongoDatabase db = mongoClient.getDatabase("kyc_db");

                MongoCollection<Document> documentCollection = db.getCollection("document");
                Document docQuery = new Document("cust_id", custId).append("user_id", userId);
                long deleted = documentCollection.deleteOne(docQuery).getDeletedCount();

                if (deleted == 0) {
                    return ResponseEntity.status(404).body(Map.of("status", "error", "message", "Customer not found"));
                }

                String[] collections = { "aadhaar", "pan", "creditcard", "cheque", "drivinglicense", "passport" };

                for (String colName : collections) {
                    MongoCollection<Document> collection = db.getCollection(colName);
                    Document query = new Document("cust_id", custId);
                    collection.deleteOne(query);
                }

                return ResponseEntity.ok(Map.of("status", "success", "message", "Customer deleted successfully!"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }
}
