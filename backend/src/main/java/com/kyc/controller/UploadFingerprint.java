package com.kyc.controller;

import java.io.InputStream;

import org.apache.catalina.connector.Response;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.kyc.util.GoogleDriveUploader;
import com.mongodb.client.*;
import java.util.*;

@RestController
@RequestMapping("/api")
public class UploadFingerprint {
    @Value("${spring.data.mongodb.uri}")
    private String mongoUriString;

    @PostMapping("/fingerprint")
    public ResponseEntity<?> uploadFingerprint(
            @RequestPart("files") MultipartFile file,
            @RequestPart("cust_id") String custId,
            @RequestPart("user_id") String user_id) {

        try (var mongoClient = MongoClients.create(mongoUriString)) {
            try {
                MongoDatabase db = mongoClient.getDatabase("kyc_db");
                MongoCollection<Document> documentCollection = db.getCollection("document");
                MongoCollection<Document> fingerprintCollection = db.getCollection("fingerprint");

                try (InputStream inputStream = file.getInputStream()) {

                    String fileLink = GoogleDriveUploader.uploadToDrive(
                            inputStream,
                            file.getOriginalFilename(),
                            file.getContentType());

                    Document query = new Document("cust_id", custId)
                            .append("user_id", user_id);

                    Document existingDoc = documentCollection.find(query).first();
                    if (existingDoc == null) {
                        throw new RuntimeException("Customer not found");
                    }

                    List<String> document_type = (List<String>) existingDoc.get("document_type");
                    document_type.add("Fingerprint");

                    documentCollection.updateOne(query,
                            new Document("$set", new Document("document_type", document_type)));

                    Document fingerprintDoc = new Document("cust_id", custId)
                            .append("fileLink", fileLink);

                    fingerprintCollection.insertOne(fingerprintDoc);
                }

                return ResponseEntity.ok("Fingerprint uploaded successfully.");

            } catch (Exception e) {
                throw new RuntimeException(e);
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity
                    .status(Response.SC_INTERNAL_SERVER_ERROR)
                    .body("Error uploading fingerprint(s): " + e.getMessage());
        }
    }
}
