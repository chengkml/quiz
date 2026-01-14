package com.ck.quiz.syslog.dto;

import com.ck.quiz.base.dto.QueryDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class SysLogQueryDto extends QueryDto {

    private String module;

    private String action;

    private String success;

    private String requestUri;

    private Integer pageNum = 0;

    private Integer pageSize = 20;

    private String sortColumn = "create_date";

    private String sortType = "desc";
}

