package com.ck.quiz.hotsearch.dto;

import lombok.Data;

import java.util.List;

@Data
public class HotSearchImportRequestDto {

    private String source;
    private String batchNo;
    private String crawlTime;
    private List<HotSearchImportItemDto> items;
}
