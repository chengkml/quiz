package com.ck.quiz.baidupan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BaiduPanAuthorizeUrlDto {
    private String authorizeUrl;
    private String state;
    private Long expiresInSeconds;
    private String message;
}
