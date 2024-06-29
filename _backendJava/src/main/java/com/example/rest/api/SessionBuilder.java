package com.example.rest.api;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.io.*;

public class SessionBuilder {

    private RestClient restClient = RestClient.builder().baseUrl("https://members-ng.iracing.com").build();
    private MultiValueMap<String, String> myCookies = CookieHandler.loadCookies();

    private Map<String, String> readCredentialsFromFile() {

        String filePath = "C:/Users/FSX-P/Documents/VisualStudioCode/iRacing_WebApp_Java/_backendJava/src/main/resources/credentials.properties";

        Properties properties = new Properties();

        try (FileInputStream inputStream = new FileInputStream(filePath)) {
            properties.load(inputStream);
        } catch (IOException e) {
            e.printStackTrace();
        }

        Map<String, String> credentialsClear = new HashMap<>();
        credentialsClear.put("email", properties.getProperty("email"));
        credentialsClear.put("password", properties.getProperty("password"));

        return credentialsClear;
    }

    private Map<String, String> buildCredentials() {
        try {
            Map<String, String> credentials = this.readCredentialsFromFile();
            credentials.put("password", this.encodePW(credentials));
            return credentials;
        } catch (NoSuchAlgorithmException e) {
            return new HashMap<>();
        }
    }

    private String encodePW(Map<String, String> credentialsClear) throws NoSuchAlgorithmException {

        String email = credentialsClear.get("email");
        String password = credentialsClear.get("password");

        String combined = password + email.toLowerCase();

        // encrypt with sha-256
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(combined.getBytes(StandardCharsets.UTF_8));
        
        // encode with base64
        String hashInBase64 = Base64.getEncoder().encodeToString(hash);

        return hashInBase64;
    }

    private void login() {
        this.myCookies = new LinkedMultiValueMap<>();
        Map<String, String> credentials = this.buildCredentials();
        ResponseEntity<String> response = restClient.post()
            .uri("/auth")
            .body(credentials)
            .retrieve()
            .toEntity(String.class);
    
        if (response.getStatusCode().is2xxSuccessful()) {
            response.getHeaders().get(HttpHeaders.SET_COOKIE).forEach(cookie ->
                this.myCookies.add(HttpHeaders.COOKIE, cookie.split(";")[0]));
                CookieHandler.saveCookies(this.myCookies);
        } else {
            throw new RuntimeException("Login failed");
        }
    }
    
    public String get() {
        String path = "/data/car/get"; // temp
        try {
            ResponseEntity<String> response = restClient.get()
                .uri(path)
                .headers(headers -> headers.addAll(this.myCookies))
                .retrieve()
                .toEntity(String.class);
    
            if (response.getStatusCode().is2xxSuccessful()) {
                return response.getBody();
            } else if (response.getStatusCode().value() == 401) {
                System.out.println("401 catch");
                this.login();
                return this.get();
            } else {
                System.out.println("catch all error");
                return response.getBody();
            }
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode().value() == 401) {
                System.out.println("401 catch");
                this.login();
                return this.get();
            } else {
                throw e;
            }
        }
    }

}

class CookieHandler {

    private static String cookieFilePath = "C:/Users/FSX-P/Documents/VisualStudioCode/iRacing_WebApp_Java/_backendJava/cookie.txt";

    public static MultiValueMap<String, String> loadCookies() {
        LinkedMultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream(cookieFilePath))) {
            return (LinkedMultiValueMap<String, String>) ois.readObject();
        } catch (IOException | ClassNotFoundException e) {
            return map;
        }
    }

    public static void saveCookies(MultiValueMap<String, String> myCookies) {
        System.out.println("save");
        try (ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream(cookieFilePath))) {
            oos.writeObject(myCookies);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

}
