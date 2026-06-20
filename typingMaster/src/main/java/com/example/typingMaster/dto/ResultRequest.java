package com.example.typingMaster.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResultRequest {

    private int wpm;
    private int accuracy;
    private Long userId;
}