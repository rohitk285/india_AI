package com.kyc.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;

@Document(collection="user")
public class UserModel {
    @Id
    private String _id; // automatically indexed as _id by mongo db

    // @Indexed(unique = true)
    // private String user_id; // unique user identifier

    @NotBlank(message = "username must not be blank")
    @Indexed
    private String username;

    @NotBlank(message = "password must not be blank")
    private String password;

    public UserModel() {}

    public UserModel(String username, String password) {
        this.username = username;
        this.password = password;
    }

    // public String getUser_id() {
    //     return user_id;
    // }
    // public void setUser_id(String user_id) {
    //     this.user_id = user_id;
    // }
    public String get_id() {
        return _id;
    }
    public void set_id(String _id) {
        this._id = _id;
    }
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }
}
