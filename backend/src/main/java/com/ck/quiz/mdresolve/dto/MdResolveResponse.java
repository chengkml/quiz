package com.ck.quiz.mdresolve.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Markdown解析响应DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MdResolveResponse {

    /**
     * 是否成功
     */
    private boolean success;

    /**
     * 消息
     */
    private String message;

    /**
     * 解析结果数据
     * 键为块标识，值为该块提取的数据列表
     */
    private Map<String, List<Map<String, Object>>> data;

    public static MdResolveResponse success(Map<String, List<Map<String, Object>>> data) {
        return new MdResolveResponse(true, "解析成功", data);
    }

    public static MdResolveResponse error(String message) {
        return new MdResolveResponse(false, message, null);
    }
}
