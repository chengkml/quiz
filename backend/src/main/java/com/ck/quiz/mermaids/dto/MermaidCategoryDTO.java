package com.ck.quiz.mermaids.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MermaidCategoryDTO {
    private String id;

    @NotBlank(message = "分类名称不能为空")
    private String categoryName;

    private String description;

    private LocalDateTime createDate;
    private String createUser;
    private LocalDateTime updateDate;
    private String updateUser;
}
