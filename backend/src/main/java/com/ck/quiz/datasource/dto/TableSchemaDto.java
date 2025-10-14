package com.ck.quiz.datasource.dto;

import lombok.Data;
import java.util.List;

@Data
public class TableSchemaDto {
    private String tableCat;
    private String tableSchem;
    private String tableName;
    private String tableType;
    private String remarks;
    private List<ColumnSchemaDto> columns;
}