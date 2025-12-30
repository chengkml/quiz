package com.ck.quiz.mermaids.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MermaidDiagramTagRelDTO {
    private String id;
    private String diagramId;
    private String tagId;
    private LocalDateTime createDate;
}
