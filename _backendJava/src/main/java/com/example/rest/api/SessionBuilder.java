package com.example.rest.api;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

import org.eclipse.jetty.http.HttpStatus;

import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.core.publisher.Mono;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.io.*;

public class SessionBuilder {

    private WebClient webClient = WebClient.builder().baseUrl("https://members-ng.iracing.com").build();
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
        } catch (NoSuchAlgorithmException n) {
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

    private Mono<Void> login() {
        this.myCookies = new LinkedMultiValueMap<>();
        Map<String, String> credentials = this.buildCredentials();
        return webClient.post()
            .uri("/auth")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(credentials)
            .exchangeToMono(response -> {
                System.out.println(response);
                if (response.statusCode().is2xxSuccessful()) {
                    response.cookies().forEach((key, respCookies) -> this.myCookies.add(key, respCookies.get(0).getValue()));
                    return response.bodyToMono(String.class).then();
                } else {
                    return response.createException().flatMap(e -> Mono.error(new Exception("Something went wrong")));
                }
            });
    }

    public Mono<String> get() {
    String path = "/data/car/get"; // temp
    return webClient.get()
        .uri("/data/car/get")
        .cookies(cookieMap -> cookieMap.addAll(this.myCookies))
        .exchangeToMono(response -> {
            if (response.statusCode().is2xxSuccessful()) {
                return response.bodyToMono(String.class);
            } else if (response.statusCode().value() == 401) {
                System.out.println("401 catch");
                return login().then(this.get());
            } else {
                System.out.println("catch all error");
                return response.bodyToMono(String.class);
            }
        });
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
