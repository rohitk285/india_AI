package com.kyc.model;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;

import org.springframework.data.mongodb.core.index.Indexed;

import java.util.List;
import java.util.Map;

@Document(collection="document")
public class DocumentModel {
    @Id
    private String _id;

    @Indexed(unique = true)
    private String cust_id;

    @NotBlank(message = "Name must not be blank")
    @Indexed
    private String name;
    
    private List<String> document_type;
    private Map<String, Object> entities;

    @NotBlank(message = "user_id must not be blank")
    @Indexed
    private String user_id; // foreign key reference to UserModel.user_id - creating a reference in mongodb

    public DocumentModel() {}

    public DocumentModel(String name, List<String> document_type, Map<String, Object> entities, String user_id) {
        this.name = name;
        this.document_type = document_type;
        this.entities = entities;
        this.user_id = user_id;
    }

    public String getCust_id() {
        return cust_id;
    }

    public void setCust_id(String cust_id) {
        this.cust_id = cust_id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<String> getDocument_type() {
        return document_type;
    }

    public void setDocument_type(List<String> document_type) {
        this.document_type = document_type;
    }

    public Map<String, Object> getEntities() {
        return entities;
    }

    public void setEntities(Map<String, Object> entities) {
        this.entities = entities;
    }
    public String getUser_id(){
        return user_id;
    }
    public void setUser_id(String user_id){
        this.user_id = user_id;
    }
}
