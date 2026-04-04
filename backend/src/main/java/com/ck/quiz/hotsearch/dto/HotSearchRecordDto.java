package com.ck.quiz.hotsearch.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

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
    private List<String> matchedTopics;
    private LocalDateTime createDate;
    private String createUser;
    private LocalDateTime updateDate;
    private String updateUser;
}
