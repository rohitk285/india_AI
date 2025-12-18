package com.kyc.util;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.InputStreamContent;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.api.services.drive.model.File;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;

import java.io.InputStream;
import java.util.Collections;

public class GoogleDriveUploader {

    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    public static String uploadToDrive(InputStream inputStream, String fileName, String contentType) throws Exception {
        // Load credentials from JSON
        InputStream serviceAccountStream = GoogleDriveUploader.class.getClassLoader()
                .getResourceAsStream("keys/service_account.json");

        if (serviceAccountStream == null) {
            throw new RuntimeException("Service account file not found");
        }

        GoogleCredentials credentials = GoogleCredentials.fromStream(serviceAccountStream)
                .createScoped(Collections.singleton(DriveScopes.DRIVE_FILE));

        Drive driveService = new Drive.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                JSON_FACTORY,
                new HttpCredentialsAdapter(credentials)
        ).setApplicationName("KYC-Drive-Uploader").build();

        File fileMetadata = new File();
        fileMetadata.setName(fileName);

        InputStreamContent mediaContent = new InputStreamContent(contentType, inputStream);

        File uploadedFile = driveService.files().create(fileMetadata, mediaContent)
                .setFields("id")
                .execute();

        // Make public
        driveService.permissions().create(uploadedFile.getId(),
                new com.google.api.services.drive.model.Permission()
                        .setType("anyone")
                        .setRole("reader")).execute();

        return "https://drive.google.com/file/d/" + uploadedFile.getId() + "/view";
    }
}
