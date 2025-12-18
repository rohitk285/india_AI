package com.kyc.controller;

import org.bson.Document;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.springframework.beans.factory.annotation.Value;
import java.util.regex.Pattern;

import com.mongodb.client.FindIterable;

import java.util.*;

@RestController
@RequestMapping("/api")
public class SearchByCustID {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUriString;

    @PostMapping("/custID")
    public ResponseEntity<?> getCustomerById(@RequestBody Map<String, String> bodyReq) {
        try {
            String custId = bodyReq.get("cust_id");
            String user_id = bodyReq.get("user_id");

            try (var mongoClient = MongoClients.create(mongoUriString)) {
                // ensures consistency of data that is read and returned
                MongoDatabase database = mongoClient.getDatabase("kyc_db");
                
                MongoCollection<Document> collection = database.getCollection("document");

                Pattern pattern = Pattern.compile(custId, Pattern.CASE_INSENSITIVE);
                Document query = new Document("cust_id", pattern).append("user_id", user_id);

                Document projection = new Document("name", 1)
                        .append("cust_id", 1)
                        .append("_id", 0);

                // -> .limit() function is being used to restrict the number of results to 12
                FindIterable<Document> result = collection.find(query).projection(projection).limit(12);
                List<String> returnList = new ArrayList<>();
                for (Document doc : result) {
                    returnList.add(doc.toJson());
                }

                return ResponseEntity.ok(returnList);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred: " + e.getMessage());
        }
    }
}
