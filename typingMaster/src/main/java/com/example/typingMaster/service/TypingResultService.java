package com.example.typingMaster.service;

import com.example.typingMaster.model.TypingResult;
import com.example.typingMaster.repo.TypingResultRepo;
import com.example.typingMaster.repo.UserRepo;
import com.example.typingMaster.model.User;
import com.example.typingMaster.dto.ResultRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TypingResultService {
    private final TypingResultRepo repo;
    private final UserRepo userRepo;

    public TypingResultService(
            TypingResultRepo repo,
            UserRepo userRepo) {

        this.repo = repo;
        this.userRepo = userRepo;
    }
    public TypingResult saveResult(ResultRequest request) {

        User user = userRepo.findById(request.getUserId())
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        TypingResult result = new TypingResult();

        result.setWpm(request.getWpm());
        result.setAccuracy(request.getAccuracy());
        result.setCreatedAt(LocalDateTime.now());
        result.setUser(user);

        return repo.save(result);
    }
    public TypingResult processResult(TypingResult result) {

        result.setCreatedAt(LocalDateTime.now());

        return repo.save(result);
    }

    public List<TypingResult> getAllResults() {
        return repo.findAll();
    }

    public TypingResult getBestResult() {

        return repo.findAll()
                .stream()
                .max((a, b) -> Integer.compare(a.getWpm(), b.getWpm()))
                .orElse(null);
    }

    public List<TypingResult> getLatestResults() {

        return repo.findTop5ByOrderByIdDesc();

    }
    public List<TypingResult> getResultsByUser(Long userId) {

        User user = userRepo.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return repo.findByUser(user);
    }
    public List<TypingResult> getLatestResultsByUser(Long userId) {

        User user = userRepo.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return repo.findTop5ByUserOrderByIdDesc(user);
    }
    public TypingResult getBestResultByUser(Long userId) {

        User user = userRepo.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return repo.findByUser(user)
                .stream()
                .max((a,b) ->
                        Integer.compare(a.getWpm(), b.getWpm()))
                .orElse(null);
    }
}