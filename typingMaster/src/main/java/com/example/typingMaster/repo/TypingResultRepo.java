package com.example.typingMaster.repo;

import com.example.typingMaster.model.TypingResult;
import com.example.typingMaster.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TypingResultRepo extends JpaRepository<TypingResult, Long> {

    List<TypingResult> findTop5ByOrderByIdDesc();

    List<TypingResult> findByUser(User user);

    List<TypingResult> findTop5ByUserOrderByIdDesc(User user);
}