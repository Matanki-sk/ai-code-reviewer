package com.example.codeReviewer.aiCodeReviewer.controller;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.codeReviewer.aiCodeReviewer.service.GeminiService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/review")
// @CrossOrigin(origins = "http://localhost:5173")
@CrossOrigin(origins = "https://ai-code-reviewer-nine-coral.vercel.app")

public class CodeReviewController {

    private final GeminiService geminiService;

    public CodeReviewController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> reviewCode(@RequestBody Map<String, String> request) {
        String code = request.get("code");

        if (code == null || code.trim().isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Code input cannot be empty.");
            return ResponseEntity.badRequest().body(error);
        }

        try {
            String review = geminiService.reviewCode(code);
            Map<String, String> response = new HashMap<>();
            response.put("review", review);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to get review from AI: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}