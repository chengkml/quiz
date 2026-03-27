package com.ck.quiz.hotsearch.dto;

import lombok.Data;

@Data
public class HotSearchQueryDto {

    private String source;
    private String titleKeyword;
    private String fromTime;
    private String toTime;
    private Integer pageNum = 0;
    private Integer pageSize = 20;
}
