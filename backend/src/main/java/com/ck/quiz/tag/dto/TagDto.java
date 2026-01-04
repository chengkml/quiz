package com.ck.quiz.tag.dto;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class TagDto {

    private String id;
    private String name;
    private String label;
    private String descr;
    private String color;
    private LocalDateTime createDate;
    private String createUser;
    private String createUserName;
    private LocalDateTime updateDate;
    private String updateUser;
    private String updateUserName;
}
