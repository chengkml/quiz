package com.ck.quiz.group.dto;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class GroupDto {

    private String id;
    private String name;
    private String label;
    private LocalDateTime createDate;
    private String createUser;
    private String createUserName;
    private LocalDateTime updateDate;
    private String updateUser;
    private String updateUserName;

}