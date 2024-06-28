package com.example.rest.api;

import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Sb {
    private static final String LOGIN_ADDRESS = "https://members-ng.iracing.com/auth";
    private static final String COOKIE_FILE = "C:/Users/FSX-P/IdeaProjects/iRacing_WebApp/_backend/application/sessionbuilder/files/cookie-jar.txt";
    private static final String CREDENTIALS_FILE = "C:/Users/FSX-P/IdeaProjects/iRacing_WebApp/_backend/application/sessionbuilder/files/credentials.json";

    private WebClient webClient;
    private Map<String, String> credentials;
    private MultiValueMap<String, String> cookies;

    public Sb() {
        this.webClient = WebClient.builder().baseUrl("https://members-ng.iracing.com").build();
        this.credentials = getCredentials();
        this.cookies = new LinkedMultiValueMap<>();
    }

    private Map<String, String> getCredentials() {
        try {
            String content = new String(Files.readAllBytes(Paths.get(CREDENTIALS_FILE)));
            // Parse JSON content to Map. You might want to use a proper JSON library like Jackson or Gson
            // This is a simplified version
            Map<String, String> cred = new HashMap<>();
            // Parse JSON string and populate cred map
            return cred;
        } catch (IOException e) {
            throw new RuntimeException("Failed to read credentials file", e);
        }
    }

    private String encodePw() {
        try {
            String username = credentials.get("email");
            String password = credentials.get("password");
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest((password + username.toLowerCase()).getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to encode password", e);
        }
    }

    public Mono<Void> authenticate() {
        return loadCookies()
            .flatMap(loadedCookies -> {
                // Correctly merge loadedCookies into cookies
                loadedCookies.forEach((key, valueList) -> {
                    cookies.addAll(key, valueList);
                });
                return webClient.get()
                    .uri("/data/car/get")
                    .cookies(httpCookies -> httpCookies.putAll(cookies))
                    .exchangeToMono(response -> {
                        if (response.statusCode() == HttpStatus.UNAUTHORIZED) {
                            System.out.println("[session_builder] setting cookies");
                            return login();
                        } else {
                            System.out.println("[session_builder] loading saved cookies");
                            return Mono.empty();
                        }
                    });
            });
    }

    private Mono<Void> login() {
        Map<String, String> authBody = new HashMap<>();
        authBody.put("email", credentials.get("email"));
        authBody.put("password", encodePw());
    
        return webClient.post()
            .uri(LOGIN_ADDRESS)
            .contentType(MediaType.APPLICATION_JSON)
            .body(BodyInserters.fromValue(authBody))
            .exchangeToMono(response -> {
                if (response.statusCode().is2xxSuccessful()) {
                    return response.bodyToMono(Map.class)
                        .flatMap(responseBody -> {
                            if (responseBody.containsKey("authcode")) {
                                // Correctly merge response cookies into cookies
                                response.cookies().forEach((key, cookieList) -> {
                                    cookies.addAll(key, cookieList.stream()
                                        .map(ResponseCookie::getValue)
                                        .toList());
                                });
                                return saveCookies();
                            } else {
                                return Mono.error(new RuntimeException("Error from iRacing: " + responseBody));
                            }
                        });
                } else {
                    return Mono.error(new RuntimeException("Login failed with status: " + response.statusCode()));
                }
            });
    }

    private Mono<MultiValueMap<String, String>> loadCookies() {
        return Mono.fromCallable(() -> {
            MultiValueMap<String, String> loadedCookies = new LinkedMultiValueMap<>();
            File cookieFile = new File(COOKIE_FILE);
            if (cookieFile.exists()) {
                try (BufferedReader reader = new BufferedReader(new FileReader(cookieFile))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        String[] parts = line.split("=", 2);
                        if (parts.length == 2) {
                            loadedCookies.add(parts[0], parts[1]);
                        }
                    }
                }
            }
            return loadedCookies;
        });
    }

    private Mono<Void> saveCookies() {
        return Mono.fromRunnable(() -> {
            try (BufferedWriter writer = new BufferedWriter(new FileWriter(COOKIE_FILE))) {
                for (Map.Entry<String, List<String>> entry : cookies.entrySet()) {
                    for (String value : entry.getValue()) {
                        writer.write(entry.getKey() + "=" + value);
                        writer.newLine();
                    }
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
    }

    public static boolean responseIsValid(org.springframework.web.reactive.function.client.ClientResponse response) {
        return response.statusCode() == HttpStatus.OK;
    }
}
