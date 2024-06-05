package com.example.rest.api;

import java.io.FileInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

import javax.swing.text.html.parser.Entity;

import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.boot.autoconfigure.integration.IntegrationProperties.RSocket.Client;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Map;

public class SessionBuilder {

    private Map<String, String> readCredentialsFromFile() {

        String filePath = "C:/Users/FSX-P/Documents/VisualStudioCode/iRacing_WebApp/_backendJava/src/main/resources/credentials.properties";

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

    public void authenticate() throws NoSuchAlgorithmException {
        Map<String, String> credentialsClear = this.readCredentialsFromFile();
        String encodedPassword = this.encodePW(credentialsClear);
        Credentials credentialsEncoded = new Credentials(credentialsClear.get("email"), encodedPassword);
        this.login(credentialsEncoded);
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

    private void login(Credentials credentials) {
        String loginAdress = "https://members-ng.iracing.com/auth";

        WebClient wc = WebClient.create();

        String result = wc.post()
            .uri("https://members-ng.iracing.com/auth")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(credentials)
            .retrieve()
            .bodyToMono(String.class)
            .block();

        System.out.println(result);

    }

    // loginAdress = "https://members-ng.iracing.com/auth"
    // loginHeaders = {"Content-Type": "application/json"}

    // authBody = {"email": self.credentials["email"], "password": self.encode_pw()}

    // self.session = requests.Session()
    // cookie_File = "C:/Users/FSX-P/IdeaProjects/iRacing_WebApp/_backend/application/sessionbuilder/files/cookie-jar.txt"
    // self.session.cookies = LWPCookieJar(cookie_File)

    // if os.path.exists(cookie_File):
    //     self.session.cookies.load(cookie_File)

    // responseStatusCode = self.session.get('https://members-ng.iracing.com/data/car/get').status_code

    // if responseStatusCode == 401:
    //     print('[session_builder] setting cookies')
    //     self.session.cookies.save()
    //     loginNow = self.session.post(loginAdress, json=authBody, headers=loginHeaders)
    //     response_Data = loginNow.json()

    //     if loginNow.status_code == 200 and response_Data['authcode']:
    //         if cookie_File:
    //             self.session.cookies.save(ignore_discard=True)
    //     else:
    //         raise RuntimeError("Error from iRacing: ", response_Data)
    // else:
    //     print('[session_builder] loading saved cookies')
    //     self.session.cookies.load(cookie_File)

}
