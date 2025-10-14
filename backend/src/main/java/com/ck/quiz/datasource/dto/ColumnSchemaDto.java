package com.ck.quiz.datasource.dto;

import lombok.Data;

@Data
public class ColumnSchemaDto {
    private String columnName;
    private String dataType;
    private Integer columnSize;
    private Integer decimalDigits;
    private Boolean nullable;
    private String defaultValue;
    private Boolean primaryKey;
    private String remarks;
}