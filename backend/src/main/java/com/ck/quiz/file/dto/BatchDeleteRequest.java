package com.ck.quiz.file.dto;

import lombok.Data;

import java.util.List;

@Data
public class BatchDeleteRequest {
    private List<String> ids;
}
