package com.ck.quiz.datasource.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 数据源更新 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DatasourceUpdateDto {
    @NotBlank(message = "数据源ID不能为空")
    private String id;

    private String name;
    private String driver;
    private String jdbcUrl;
    private String username;
    private String password;
    private String description;
    private Boolean active;
}