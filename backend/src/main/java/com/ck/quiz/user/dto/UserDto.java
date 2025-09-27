package com.ck.quiz.user.dto;

import com.ck.quiz.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 用户信息DTO
 * 用于返回用户详细信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private String userId;

    private String userName;

    private String password;

    private String email;

    private String phone;

    private User.UserState state;

    private String logo;

    private LocalDateTime createDate;

    private String createUser;

    private String createUserName;

    private LocalDateTime updateDate;

    private String updateUser;

    private String updateUserName;

}