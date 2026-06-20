package com.example.typingMaster.controller;
import com.example.typingMaster.model.User;
import com.example.typingMaster.service.UserService;
import com.example.typingMaster.model.TypingResult;
import com.example.typingMaster.service.TypingResultService;
import com.example.typingMaster.dto.ResultRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
public class HelloController {
    private final UserService userService;
    private final TypingResultService typingResultService;

    public HelloController(
            TypingResultService typingResultService,
            UserService userService) {

        this.typingResultService = typingResultService;
        this.userService = userService;
    }
    @PostMapping("/login")
    public User loginUser(@RequestBody User user) {

        return userService.loginUser(
                user.getEmail(),
                user.getPassword()
        );
    }
    @PostMapping("/register")
    public User registerUser(@RequestBody User user) {

        return userService.registerUser(user);

    }
    // Path Variable
    @GetMapping("/greet/{name}")
    public String greet(@PathVariable String name) {
        return "Hello " + name;
    }

    // Query Parameter
    @GetMapping("/welcome")
    public String welcome(@RequestParam String name) {
        return "Welcome " + name;
    }

    // Request Body String
    @PostMapping("/test")
    public String testData(@RequestBody String result) {
        return "Received " + result;
    }

    // Save Result
    @PostMapping("/result")
    public TypingResult saveResult(
            @RequestBody ResultRequest request) {

        return typingResultService.saveResult(request);
    }

    // Get All Results
    @GetMapping("/results")
    public List<TypingResult> getResults() {
        return typingResultService.getAllResults();
    }

    // Best Result
    @GetMapping("/results/best")
    public TypingResult getBestResult() {
        return typingResultService.getBestResult();
    }
    @GetMapping("/users/{id}/results")
    public List<TypingResult> getUserResults(
            @PathVariable Long id) {

        return typingResultService.getResultsByUser(id);
    }
    @GetMapping("/users/{id}/latest")
    public List<TypingResult> getUserLatestResults(
            @PathVariable Long id) {

        return typingResultService.getLatestResultsByUser(id);
    }
    @GetMapping("/users/{id}/best")
    public TypingResult getUserBestResult(
            @PathVariable Long id) {

        return typingResultService.getBestResultByUser(id);
    }

    // Latest 5 Results
    @GetMapping("/results/latest")
    public List<TypingResult> getLatestResults() {
        return typingResultService.getLatestResults();
    }
}