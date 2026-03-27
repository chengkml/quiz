package com.ck.quiz.hotsearch.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class HotSearchRecordDto {

    private String id;
    private String source;
    private String externalId;
    private String title;
    private String url;
    private String hotValue;
    private Integer rankIndex;
    private LocalDateTime crawlTime;
    private String batchNo;
    private String detailMarkdown;
    private String extraJson;
    private LocalDateTime createDate;
    private String createUser;
    private LocalDateTime updateDate;
    private String updateUser;
}
