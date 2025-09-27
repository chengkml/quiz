package com.ck.quiz.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 用户更新请求DTO
 * 用于更新用户信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateDto {

    @Size(max = 32, message = "用户账号长度不能超过32个字符")
    private String userId;

    @Size(max = 128, message = "用户姓名长度不能超过128个字符")
    private String userName;

    @Email(message = "邮箱格式不正确")
    @Size(max = 64, message = "邮箱长度不能超过64个字符")
    private String email;

    @Size(max = 16, message = "手机号长度不能超过16个字符")
    private String phone;

    @Size(max = 256, message = "头像URL长度不能超过256个字符")
    private String logo;

}