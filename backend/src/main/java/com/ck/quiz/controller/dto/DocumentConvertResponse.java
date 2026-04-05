package com.ck.quiz.controller.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class DocumentConvertResponse {

    private String fileName;

    private String mediaType;

    private String markdown;

    private List<String> warnings = new ArrayList<>();
}
