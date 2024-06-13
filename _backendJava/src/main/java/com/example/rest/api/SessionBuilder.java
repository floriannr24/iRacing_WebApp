package com.example.rest.api;

import java.io.FileInputStream;
import java.io.IOException;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.CookieStore;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

import org.springframework.boot.web.server.Cookie;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.JettyClientHttpConnector;
import org.springframework.objenesis.strategy.StdInstantiatorStrategy;
import org.springframework.web.client.RestClient;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.DefaultUriBuilderFactory;

import jakarta.servlet.http.HttpSession;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import org.eclipse.jetty.client.HttpClient;
import org.eclipse.jetty.http.HttpCookieStore;
import org.eclipse.jetty.http.HttpHeader;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class SessionBuilder {

    WebClient wc;

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
        //if cookie exists
        this.login(credentialsEncoded);
        //if no cookie exists
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
        CookieHandler ch = new CookieHandler();

        WebClient wc = WebClient.create("https://members-ng.iracing.com/");

        String loadedCookies = ch.loadCookies();

        if (loadedCookies.equals("")) {
            String result = wc.post()
            .uri("/auth")
            .bodyValue(credentials)
            .retrieve()
            .bodyToMono(String.class)
            .block();
    
            ch.saveCookies(result);
        }

        // String auth = ch.loadCookies();

        // String str = wc.get()
        //     .uri("/data/car/get")
        //     .header(auth)
        //     .retrieve()
        //     .bodyToMono(String.class)
        //     .block();   
            
        // System.out.println(str);
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

class CookieHandler {

    Path cookieFilePath;

    public CookieHandler() {
        this.cookieFilePath = Paths.get("C:/Users/FSX-P/Documents/VisualStudioCode/iRacing_WebApp/_backendJava/cookie.txt");
    }

    // public MultiValueMap<String, HttpCookie> getCookies() {
    //     this.loadCookies();
    //     return new LinkedMultiValueMap<>();
    // }

    public String loadCookies() {

        try {
            byte[] contentBytes = Files.readAllBytes(this.cookieFilePath);
            return new String(contentBytes);
        } catch (IOException e) {
            return "";
        }
    }

    public void saveCookies(String content) {
        try {
            Files.write(this.cookieFilePath, content.getBytes());
        } catch (IOException e) {

        }
    }

}
