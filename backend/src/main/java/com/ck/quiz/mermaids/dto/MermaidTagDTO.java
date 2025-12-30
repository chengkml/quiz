package com.ck.quiz.mermaids.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MermaidTagDTO {
    private String id;

    @NotBlank(message = "标签名称不能为空")
    private String tagName;

    private LocalDateTime createDate;
    private String createUser;
}
