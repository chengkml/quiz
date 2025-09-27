package com.ck.quiz.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 用户登录请求DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserLoginDto {
    
    @NotBlank(message = "用户账号不能为空")
    @Size(max = 32, message = "用户账号长度不能超过32个字符")
    private String userId;
    
    @NotBlank(message = "密码不能为空")
    @Size(max = 20, message = "密码长度不能超过20个字符")
    private String userPwd;
    
    @Override
    public String toString() {
        return "UserLoginDto{" +
                "userId='" + userId + '\'' +
                ", userPwd='[PROTECTED]'" +
                '}';
    }
}