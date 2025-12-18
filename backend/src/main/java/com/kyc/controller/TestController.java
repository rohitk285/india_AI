package com.kyc.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:5173") // frontend localhost
public class TestController {

    @GetMapping("/")
    public String hello() {
        return "Running.....";
    }
}
