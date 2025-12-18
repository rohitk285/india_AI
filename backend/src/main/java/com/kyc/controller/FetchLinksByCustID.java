package com.kyc.controller;

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
public class FetchLinksByCustID {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUriString;

    @PostMapping("/customerDetailsLinks")
    public ResponseEntity<?> getCustomerLinksById(
            @RequestBody Map<String, Object> reqBody) {
        try {
            String custId = (String) reqBody.get("cust_id");
            List<String> docType = (List<String>) reqBody.get("document_type");

            if (custId == null || docType == null || docType.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("cust_id and document_type are required in the request body");
            }

            try (var mongoClient = MongoClients.create(mongoUriString)) {
                // ensures consistency of data that is read and returned
                MongoDatabase db = mongoClient.getDatabase("kyc_db");

                // MongoCollection<Document> documentCollection = db.getCollection("document");
                MongoCollection<Document> aadharCollection = db.getCollection("aadhaar");
                MongoCollection<Document> panCollection = db.getCollection("pan");
                MongoCollection<Document> creditCardCollection = db.getCollection("creditcard");
                MongoCollection<Document> chequeCollection = db.getCollection("cheque");
                MongoCollection<Document> drivingLicenseCollection = db.getCollection("drivinglicense");
                MongoCollection<Document> passportCollection = db.getCollection("passport");

                List<Map<String, Object>> result = new ArrayList<>();
                Document projection = new Document("fileLink", 1).append("_id", 0);
                Document query = new Document("cust_id", custId);

                for (String dType : docType) {
                    Map<String, Object> map = new HashMap<>();
                    switch (dType) {
                        case "Aadhaar Card":
                            Document resultAadhaar = aadharCollection.find(query)
                                    .projection(projection).first();
                            map.put("Aadhaar Card", resultAadhaar);
                            break;
                        case "PAN Card":
                            Document resultPan = panCollection.find(query)
                                    .projection(projection)
                                    .first();
                            map.put("PAN Card", resultPan);
                            break;
                        case "Credit Card":
                            Document resultCreditCard = creditCardCollection.find(query)
                                    .projection(projection).first();
                            map.put("Credit Card", resultCreditCard);
                            break;
                        case "Cheque":
                            Document resultCheque = chequeCollection.find(query)
                                    .projection(projection)
                                    .first();
                            map.put("Cheque", resultCheque);
                            break;
                        case "Driving License":
                            Document resultDrivingLicense = drivingLicenseCollection
                                    .find(query)
                                    .projection(projection).first();
                            map.put("Driving License", resultDrivingLicense);
                            break;
                        case "Passport":
                            Document resultPassport = passportCollection.find(query)
                                    .projection(projection).first();
                            map.put("Passport", resultPassport);
                            break;
                        case "Fingerprint":
                            MongoCollection<Document> fingerprintCollection = db.getCollection("fingerprint");
                            Document resultFingerprint = fingerprintCollection.find(query)
                                    .projection(projection).first();
                            map.put("Fingerprint", resultFingerprint);
                            break;
                        default:
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body("Invalid document type: " + dType);
                    }
                    result.add(map);
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
