package com.kyc.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import jakarta.validation.constraints.NotBlank;

@Document(collection="pan")
public class PanModel {
    @Id
    private String id; // automatically indexed as _id by mongo db

    private String fileLink;

    @NotBlank(message = "cust_id must not be blank")
    @Indexed
    private String cust_id; // foreign key reference to DocumentModel - creating a reference in mongodb

    public PanModel() {}

    public PanModel(String fileLink, String cust_id) {
        this.fileLink = fileLink;
        this.cust_id = cust_id;
    }

    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }
    public String getFileLink() {
        return fileLink;
    }
    public void setFileLink(String fileLink) {
        this.fileLink = fileLink;
    }
    public String getCust_id() {
        return cust_id;
    }
    public void setCust_id(String cust_id) {
        this.cust_id = cust_id;
    }
}
