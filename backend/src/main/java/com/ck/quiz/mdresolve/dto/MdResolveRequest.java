package com.ck.quiz.mdresolve.dto;

import lombok.Data;

/**
 * Markdown解析请求DTO
 */
@Data
public class MdResolveRequest {

    /**
     * Markdown内容
     */
    private String mdContent;

    /**
     * Markdown模板（可选，如果不提供则使用默认模板）
     */
    private String mdTemplate;
}
