package com.ck.quiz.datasource.dto;

import lombok.Data;
import java.util.List;

@Data
public class DatabaseSchemaDto {
    private String productName;
    private String productVersion;
    private String driverName;
    private String driverVersion;
    private String databaseType; // 通过 JdbcQueryHelper 检测的类型
    private List<TableSchemaDto> tables;
}