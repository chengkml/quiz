package com.ck.quiz.base.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class Dto {

    private String id;

    private LocalDateTime createDate;

    private String createUser;

    private String createUserName;

    private LocalDateTime updateDate;

    private String updateUser;

    private String updateUserName;

    private String groupName;

    private String groupLabel;

    private java.util.List<String> tagNames;

    private java.util.List<String> tagLabels;
}
