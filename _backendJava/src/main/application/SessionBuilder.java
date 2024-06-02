package _backendJava.demo.src.main.application;

public class SessionBuilder {

    private void getCredentials() {
        // Define the file path
        String filePath = "_backendJava\\demo\\src\\main\\resources\\credentials.json";

        // Create a Properties object
        Properties properties = new Properties();

        // Load the properties from the file
        try (FileInputStream inputStream = new FileInputStream(filePath)) {
            properties.load(inputStream);
        } catch (IOException e) {
            e.printStackTrace();
        // Handle the error
        }

        // Access the properties using the key
        String value = properties.getProperty("email");
        System.out.println(value);

    }
            
}
