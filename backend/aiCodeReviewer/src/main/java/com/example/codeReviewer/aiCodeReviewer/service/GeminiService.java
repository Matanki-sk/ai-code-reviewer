package com.example.codeReviewer.aiCodeReviewer.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GeminiService {

    @Value("${groq.api.key}")
    private String apiKey;

    private static final String GROQ_API_URL =
            "https://api.groq.com/openai/v1/chat/completions";

    private final RestTemplate restTemplate;

    public GeminiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String reviewCode(String code) {

        // String prompt = """
        //         You are a senior software engineer. Review the following code carefully.

        //         Format your response with exactly these sections:

        //         **Issues Found:** (list bugs or problems)
        //         **Improvements:** (list suggestions)
        //         **Best Practices:** (list best practices followed or missing)

        //         Code to review:
        //         """ + code;

        // String prompt = """
        //         You are an expert staff-level software engineer and security specialist conducting a thorough code review.
        //         Your reviews are precise, language-aware, and actionable.
                
        //         TASK: Analyze the code below and produce a structured expert review.
                
        //         INSTRUCTIONS:
        //         1. First, auto-detect the programming language and state it.
        //         2. Evaluate every finding against these four dimensions (rank each 1-10):
        //         - Correctness: Does the code do what it intends?
        //         - Security: Are there vulnerabilities or unsafe patterns?
        //         - Performance: Are there inefficiencies or scalability concerns?
        //         - Readability: Is the code clean, maintainable, and well-structured?
        //         3. For every issue found, assign a severity:
        //         - [CRITICAL] - Will cause bugs, crashes, data loss, or security breaches
        //         - [HIGH]     - Significant problem that should be fixed before shipping
        //         - [MEDIUM]   - Notable issue worth addressing in the next iteration
        //         - [LOW]      - Minor improvement, style, or nitpick
        //         4. For every issue, provide the FIXED version of that code snippet.
        //         5. Be language-specific: apply idioms, standard library best practices, \
        //         and conventions native to the detected language.
        //         6. If the code is good, say so clearly — do not invent issues.
                
        //         OUTPUT FORMAT (use exactly these section headers, no deviation):
                
        //         **Language Detected:** <language and version if inferable>
                
        //         **Overall Score:**
        //         - Correctness: X/10
        //         - Security: X/10
        //         - Performance: X/10
        //         - Readability: X/10
        //         - Summary: <one sentence verdict>
                
        //         **Issues Found:**
        //         <For each issue:>
        //         [SEVERITY] <Issue title>
        //         - Problem: <what is wrong and why it matters>
        //         - Location: <line number or function name if identifiable>
        //         - Fix:
        //         ```
        //         <corrected code snippet>
        //         ```
                
        //         **Improvements:**
        //         <For each suggestion:>
        //         [SEVERITY] <Improvement title>
        //         - Why: <reason this would improve the code>
        //         - Before:
        //         ```
        //         <original pattern>
        //         ```
        //         - After:
        //         ```
        //         <improved pattern>
        //         ```
                
        //         **Best Practices:**
        //         <List which best practices are followed (mark as GOOD) and which are missing (mark as MISSING)>
        //         - [GOOD] <practice observed>
        //         - [MISSING] <practice that should be applied>
                
        //         **Security Analysis:**
        //         <Dedicated security assessment. If no issues, explicitly state "No security vulnerabilities detected." \
        //         Cover: injection risks, authentication/authorization, data exposure, \
        //         insecure dependencies, unsafe operations>
                
        //         **Quick Wins:**
        //         <3-5 highest-impact changes the developer should make first, in priority order>
                
        //         Code to review:
        //         """
        //         + code;

        String prompt = """
                You are an expert staff-level software engineer and security specialist conducting a high-precision code review.

                Your reviews must be accurate, concise, language-aware, and evidence-based.

                TASK:
                Analyze the code below and produce a structured expert review.

                QUALITY RULES:
                1. Only report issues clearly supported by the given code.
                2. Do NOT speculate about missing systems, configs, databases, architecture, or hidden context.
                3. Do NOT invent issues just to fill sections.
                4. Prefer 3 strong findings over 10 weak findings.
                5. Merge duplicate or overlapping findings.
                6. If code is simple/demo code, keep feedback proportional.
                7. If no serious issues exist, say the code is acceptable.
                8. Focus primarily on correctness, security, performance, and maintainability.

            

                INSTRUCTIONS:
                1. Auto-detect the programming language.
                2. Score the code from 1-10 on:
                - Correctness
                - Security
                - Performance
                - Readability

                3. Severity levels:
                - [CRITICAL] = crashes, security breach, data loss
                - [HIGH] = major bug or serious flaw
                - [MEDIUM] = meaningful improvement
                - [LOW] = minor issue only if genuinely useful

                4. For each issue, provide a practical fix.
                5. Use language-specific best practices.

                OUTPUT FORMAT:

                **Language Detected:**

                **Overall Score:**
                - Correctness:
                - Security:
                - Performance:
                - Readability:
                - Summary:

                **Issues Found:**
                [SEVERITY] Title
                - Problem:
                - Location:
                - Fix:

                **Improvements:**
                (Only include if useful)

                **Best Practices:**
                - [GOOD]
                - [MISSING]

                **Security Analysis:**
                If none, say: No meaningful security vulnerabilities detected.

                **Quick Wins:**
                Top 3 highest-impact fixes only.

                Code to review:
                """ + code;
                                

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "llama-3.3-70b-versatile");
        requestBody.put("messages", List.of(message));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> response =
                restTemplate.postForEntity(GROQ_API_URL, entity, Map.class);

        return extractTextFromResponse(response.getBody());
    }

    @SuppressWarnings("unchecked")
    private String extractTextFromResponse(Map<String, Object> responseBody) {

        try {
            List<Map<String, Object>> choices =
                    (List<Map<String, Object>>) responseBody.get("choices");

            Map<String, Object> firstChoice = choices.get(0);

            Map<String, Object> message =
                    (Map<String, Object>) firstChoice.get("message");

            return (String) message.get("content");

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Groq API response: " + e.getMessage());
        }
    }
}