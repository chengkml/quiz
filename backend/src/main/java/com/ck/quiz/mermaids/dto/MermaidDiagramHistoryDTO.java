package com.ck.quiz.mermaids.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MermaidDiagramHistoryDTO {
    private String id;

    @NotNull
    private String diagramId;

    private Integer versionNum;

    private String diagramData;

    private String description;

    private LocalDateTime createDate;
    private String createUser;
}
