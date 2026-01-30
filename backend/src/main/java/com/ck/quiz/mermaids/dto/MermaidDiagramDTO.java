package com.ck.quiz.mermaids.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MermaidDiagramDTO {
    private String id;

    @NotBlank(message = "图名称不能为空")
    private String diagramName;

    private String description;

    private String diagramData;

    // 分组信息 (Group interface)
    private String group;
    private String groupLabel;

    private LocalDateTime createDate;
    private String createUser;
    private LocalDateTime updateDate;
    private String updateUser;
}
