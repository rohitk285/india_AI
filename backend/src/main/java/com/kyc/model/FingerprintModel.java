package com.kyc.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import jakarta.validation.constraints.NotBlank;

@Document(collection="fingerprint")
public class FingerprintModel {
    @Id
    private String id; 

    private String fileLink;

    @NotBlank(message = "cust_id must not be blank")
    @Indexed
    private String cust_id; 

    public FingerprintModel() {}

    public FingerprintModel(String fileLink, String cust_id) {
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
