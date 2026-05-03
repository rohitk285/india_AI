package com.kyc.controller;

import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;

import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api")
public class FetchLinksByCustID {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUriString;

    @PostMapping("/fetchLinksByCustID")
    public ResponseEntity<?> fetchLinksByCustID(@RequestBody Map<String, String> body) {
        try {
            String cust_id = body.get("cust_id");

            try (var mongoClient = MongoClients.create(mongoUriString)) {
                MongoDatabase database = mongoClient.getDatabase("kyc_db");
                MongoCollection<Document> collection = database.getCollection("document");

                Document query = new Document("cust_id", cust_id);
                Document projection = new Document("fileLinks", 1).append("_id", 0);

                Document result = collection.find(query).projection(projection).first();

                if (result == null || !result.containsKey("fileLinks")) {
                    return ResponseEntity.status(404)
                            .body("No file links found for cust_id: " + cust_id);
                }

                List<String> fileLinks = result.getList("fileLinks", String.class);
                return ResponseEntity.ok(fileLinks);
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body("Error: " + e.getMessage());
        }
    }
}