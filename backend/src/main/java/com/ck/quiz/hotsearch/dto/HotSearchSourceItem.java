package com.ck.quiz.hotsearch.dto;

import lombok.Data;

@Data
public class HotSearchSourceItem {

    private String externalId;
    private String title;
    private String url;
    private String hotValue;
    private Integer rankIndex;
    private String detailMarkdown;
    private String extraJson;
}
