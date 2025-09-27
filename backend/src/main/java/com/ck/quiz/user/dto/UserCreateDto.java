package com.ck.quiz.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 用户创建请求DTO
 * 用于用户注册和管理员创建用户
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserCreateDto {

    @NotBlank(message = "用户账号不能为空")
    @Size(max = 32, message = "用户账号长度不能超过32个字符")
    private String userId;

    @NotBlank(message = "用户姓名不能为空")
    @Size(max = 128, message = "用户姓名长度不能超过128个字符")
    private String userName;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 20, message = "密码长度必须在6-20个字符之间")
    private String password;

    @Email(message = "邮箱格式不正确")
    @Size(max = 64, message = "邮箱长度不能超过64个字符")
    private String email;

    @Size(max = 16, message = "手机号长度不能超过16个字符")
    private String phone;

    private String logo;

}