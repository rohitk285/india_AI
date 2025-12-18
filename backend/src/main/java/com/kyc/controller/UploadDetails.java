package com.kyc.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kyc.util.EncryptionUtil;
import com.kyc.util.GoogleDriveUploader;

import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

// import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.mongodb.client.*;
import org.bson.Document;

import java.io.InputStream;
import java.util.*;

@RestController
@RequestMapping("/api")
public class UploadDetails {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUriString;

    @PostMapping("/saveDetails")
    public ResponseEntity<?> uploadCustDetails(@RequestPart("documents") String userDetailsJson,
            @RequestPart("files") List<MultipartFile> files,
            @RequestPart("user_id") String user_id) {
                
        try (var mongoClient = MongoClients.create(mongoUriString)) {
            ObjectMapper mapper = new ObjectMapper();
            List<Map<String, Object>> userDetails = mapper.readValue(
                    userDetailsJson,
                    new TypeReference<List<Map<String, Object>>>() {
                    });

                MongoDatabase db = mongoClient.getDatabase("kyc_db");

                MongoCollection<Document> documentCollection = db.getCollection("document");
                MongoCollection<Document> aadharCollection = db.getCollection("aadhaar");
                MongoCollection<Document> panCollection = db.getCollection("pan");
                MongoCollection<Document> creditCardCollection = db.getCollection("creditcard");
                MongoCollection<Document> chequeCollection = db.getCollection("cheque");
                MongoCollection<Document> drivingLicenseCollection = db.getCollection("drivinglicense");
                MongoCollection<Document> passportCollection = db.getCollection("passport");

                String custId = new ObjectId().toString();
                String name = null;
                List<String> documentTypes = new ArrayList<>();
                Map<String, Object> encryptedEntitiesGlobal = new HashMap<>();

                for (int i = 0; i < userDetails.size(); i++) {
                    try {
                        MultipartFile file = files.get(i);
                        try (InputStream inputStream = file.getInputStream()) {
                            String fileLink = GoogleDriveUploader.uploadToDrive(inputStream, file.getOriginalFilename(),
                                    file.getContentType());

                            Map<String, Object> doc = userDetails.get(i);
                            String docType = (String) doc.get("document_type");
                            if (docType == null || docType.isEmpty()) {
                                throw new RuntimeException("Missing or empty document_type");
                            }

                            documentTypes.add(docType);

                            Map<String, Object> namedEntities = (Map<String, Object>) doc.get("named_entities");
                            if (namedEntities == null) {
                                throw new RuntimeException("Missing named_entities for document type: " + docType);
                            }

                            if (name == null && namedEntities.containsKey("Name")) {
                                name = namedEntities.get("Name").toString();
                            }

                            // encryption
                            // Map<String, Object> encryptedEntities = new HashMap<>();
                            for (Map.Entry<String, Object> entry : namedEntities.entrySet()) {
                                try {
                                    Map<String, String> encResult = EncryptionUtil
                                            .encryptWithIV(entry.getValue().toString());
                                    // encryptedEntities.put(entry.getKey(), encResult);
                                    encryptedEntitiesGlobal.put(entry.getKey(), encResult);
                                } catch (Exception e) {
                                    throw new RuntimeException("Failed to encrypt field: " + entry.getKey(), e);
                                }
                            }

                            Document insertDoc = new Document("cust_id", custId)
                                    .append("fileLink", fileLink);

                            switch (docType) {
                                case "Aadhaar Card":
                                    aadharCollection.insertOne(insertDoc);
                                    break;
                                case "PAN Card":
                                    panCollection.insertOne(insertDoc);
                                    break;
                                case "Credit Card":
                                    creditCardCollection.insertOne(insertDoc);
                                    break;
                                case "Cheque":
                                    chequeCollection.insertOne(insertDoc);
                                    break;
                                case "Driving License":
                                    drivingLicenseCollection.insertOne(insertDoc);
                                    break;
                                case "Passport":
                                    passportCollection.insertOne(insertDoc);
                                    break;
                                default:
                                    throw new RuntimeException("Unknown document type: " + docType);
                            }

                        }
                    } catch (Exception e) {
                        throw new RuntimeException("Error processing document at index " + i + ": " + e.getMessage(),
                                e);
                    }
                }

                Document documentToInsert = new Document("cust_id", custId)
                        .append("name", name)
                        .append("document_type", documentTypes)
                        .append("entities", encryptedEntitiesGlobal)
                        .append("user_id", user_id);

                documentCollection.insertOne(documentToInsert);

                return ResponseEntity.ok(Map.of(
                        "status", "success",
                        "customer_id", custId,
                        "name", name,
                        "document_types", documentTypes,
                        "encrypted_entities", encryptedEntitiesGlobal));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "status", "error",
                    "message", e.getMessage()));
        }
    }
}
