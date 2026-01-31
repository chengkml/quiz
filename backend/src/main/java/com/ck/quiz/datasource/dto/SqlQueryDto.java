package com.ck.quiz.datasource.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class SqlQueryDto {
    @NotBlank(message = "SQL cannot be empty")
    private String sql;
}
