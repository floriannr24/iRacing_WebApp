package com.example.rest.api;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;

import org.springframework.util.ResourceUtils;

public class SessionBuilder {

    private void readCredentialsFromFile() {

        String filePath = "C:/Users/FSX-P/Documents/VisualStudioCode/iRacing_WebApp/_backendJava/src/main/resources/credentials.properties";

        Properties properties = new Properties();

        try (FileInputStream inputStream = new FileInputStream(filePath)) {
        properties.load(inputStream);
        } catch (IOException e) {
        e.printStackTrace();

        }

        // Access the properties using the key
        String value = properties.getProperty("password");
        System.out.println(value);
    }

    public void authenticate() {
        readCredentialsFromFile();
    }

}
