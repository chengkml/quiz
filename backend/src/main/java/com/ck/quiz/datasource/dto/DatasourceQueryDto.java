package com.ck.quiz.datasource.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 数据源查询 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DatasourceQueryDto {

    private String name;

    private Boolean active;

    private Integer pageNum = 0;

    private Integer pageSize = 20;

    private String sortColumn = "create_date";

    private String sortType = "desc";
}