package com.ck.quiz.hotsearch.dto;

import lombok.Data;

@Data
public class HotSearchImportItemDto {

    private String externalId;
    private String title;
    private String url;
    private String hotValue;
    private Integer rankIndex;
    private String crawlTime;
    private String detailMarkdown;
    private String extraJson;
}
