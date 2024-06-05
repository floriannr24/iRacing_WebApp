package com.example.rest.api;

import java.security.NoSuchAlgorithmException;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GreetingController {

	private static final String template = "Hello, %s!";
	private final AtomicLong counter = new AtomicLong();

	@GetMapping("/greeting")
	public void greeting(@RequestParam(value = "name", defaultValue = "World") String name) throws NoSuchAlgorithmException {
		SessionBuilder sb = new SessionBuilder();
		sb.authenticate();
		return;
	}
}