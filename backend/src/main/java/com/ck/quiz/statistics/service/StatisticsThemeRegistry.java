package com.ck.quiz.statistics.service;

import com.ck.quiz.statistics.dto.StatisticsThemeDto;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 统计主题注册表
 */
@Component
public class StatisticsThemeRegistry {

    private final Map<String, StatisticsThemeService> themeServiceMap;

    public StatisticsThemeRegistry(List<StatisticsThemeService> themeServices) {
        this.themeServiceMap = new LinkedHashMap<>();
        for (StatisticsThemeService themeService : themeServices) {
            this.themeServiceMap.put(themeService.getThemeKey(), themeService);
        }
    }

    public List<StatisticsThemeDto> listThemes() {
        return themeServiceMap.values().stream()
                .map(StatisticsThemeService::getTheme)
                .toList();
    }

    public Optional<StatisticsThemeService> getThemeService(String themeKey) {
        return Optional.ofNullable(themeServiceMap.get(themeKey));
    }
}
