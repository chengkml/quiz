package com.ck.quiz.statistics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 统计主题定义
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsThemeDto {

    /**
     * 主题唯一标识
     */
    private String themeKey;

    /**
     * 主题展示名称
     */
    private String title;

    /**
     * 主题说明
     */
    private String description;

    /**
     * 前端路由路径
     */
    private String routePath;
}
