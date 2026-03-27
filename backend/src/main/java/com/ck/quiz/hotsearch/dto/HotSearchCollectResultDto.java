package com.ck.quiz.hotsearch.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HotSearchCollectResultDto {

    private String source;
    private String batchNo;
    private String crawlTime;
    private Integer total;
}
