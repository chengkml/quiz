package com.ck.quiz.datasource.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 数据源信息 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DatasourceDto {
    private String id;
    private String name;
    private String driver;
    private String jdbcUrl;
    private String username;
    private String description;
    private Boolean active;
    private LocalDateTime createDate;
    private String createUser;
    private String createUserName;
    private LocalDateTime updateDate;
    private String updateUser;
}