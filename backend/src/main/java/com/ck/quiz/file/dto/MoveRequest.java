package com.ck.quiz.file.dto;

import lombok.Data;

import java.util.List;

@Data
public class MoveRequest {
    private List<String> ids;
    private String targetPath;
}
