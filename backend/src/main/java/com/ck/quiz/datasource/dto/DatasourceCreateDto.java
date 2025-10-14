package com.ck.quiz.datasource.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 数据源创建 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DatasourceCreateDto {
    @NotBlank(message = "名称不能为空")
    private String name;

    private String driver;

    @NotBlank(message = "JDBC连接串不能为空")
    private String jdbcUrl;

    private String username;

    private String password;

    private String description;

    private Boolean active = true;
}