package com.ck.quiz.statistics.service.impl;

import com.ck.quiz.statistics.dto.StatisticsThemeDto;
import com.ck.quiz.statistics.dto.VocabularyProficiencyDashboardDto;
import com.ck.quiz.statistics.dto.VocabularyProficiencyOverviewDto;
import com.ck.quiz.statistics.service.StatisticsThemeService;
import com.ck.quiz.statistics.service.VocabularyProficiencyStatisticsService;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * 单词熟练度统计主题服务实现
 */
@Service
public class VocabularyProficiencyStatisticsServiceImpl
        implements VocabularyProficiencyStatisticsService, StatisticsThemeService {

    public static final String THEME_KEY = "vocabulary-proficiency";

    private static final String LEVEL_NEW = "新词（0次连对）";
    private static final String LEVEL_BEGINNER = "入门（1-2次连对）";
    private static final String LEVEL_INTERMEDIATE = "进阶（3-5次连对）";
    private static final String LEVEL_MASTERED = "熟练（6次及以上）";

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public VocabularyProficiencyStatisticsServiceImpl(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public String getThemeKey() {
        return THEME_KEY;
    }

    @Override
    public StatisticsThemeDto getTheme() {
        return new StatisticsThemeDto(
                THEME_KEY,
                "单词熟练度统计",
                "查看单词掌握分层、复习评分分布与近期复习趋势",
                "statistics-center/vocabulary-proficiency");
    }

    @Override
    public VocabularyProficiencyDashboardDto getDashboard() {
        return new VocabularyProficiencyDashboardDto(
                getOverview(),
                getProficiencyDistribution(),
                getReviewScoreDistribution(),
                getReviewCountByLastSevenDays());
    }

    @Override
    @Transactional(readOnly = true)
    public VocabularyProficiencyOverviewDto getOverview() {
        List<VocabularySnapshot> snapshots = queryVocabularySnapshots(getCurrentUserId());

        long totalWords = snapshots.size();
        long archivedWords = snapshots.stream().filter(VocabularySnapshot::archived).count();
        long activeWords = totalWords - archivedWords;
        long masteredWords = snapshots.stream()
                .filter(snapshot -> !snapshot.archived() && snapshot.repetition() >= 6)
                .count();

        LocalDateTime now = LocalDateTime.now();
        long dueTodayWords = snapshots.stream()
                .filter(snapshot -> !snapshot.archived())
                .map(VocabularySnapshot::nextReviewDate)
                .filter(Objects::nonNull)
                .filter(nextReviewDate -> !nextReviewDate.isAfter(now))
                .count();

        double averageRepetition = activeWords == 0 ? 0D : snapshots.stream()
                .filter(snapshot -> !snapshot.archived())
                .mapToInt(VocabularySnapshot::repetition)
                .average()
                .orElse(0D);

        double averageEasinessFactor = activeWords == 0 ? 0D : snapshots.stream()
                .filter(snapshot -> !snapshot.archived())
                .map(VocabularySnapshot::easinessFactor)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0D);

        return new VocabularyProficiencyOverviewDto(
                totalWords,
                activeWords,
                archivedWords,
                masteredWords,
                dueTodayWords,
                round2(averageRepetition),
                round2(averageEasinessFactor));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getProficiencyDistribution() {
        List<VocabularySnapshot> snapshots = queryVocabularySnapshots(getCurrentUserId());

        Map<String, Long> result = new LinkedHashMap<>();
        result.put(LEVEL_NEW, 0L);
        result.put(LEVEL_BEGINNER, 0L);
        result.put(LEVEL_INTERMEDIATE, 0L);
        result.put(LEVEL_MASTERED, 0L);

        for (VocabularySnapshot snapshot : snapshots) {
            if (snapshot.archived()) {
                continue;
            }

            if (snapshot.repetition() <= 0) {
                result.put(LEVEL_NEW, result.get(LEVEL_NEW) + 1);
            } else if (snapshot.repetition() <= 2) {
                result.put(LEVEL_BEGINNER, result.get(LEVEL_BEGINNER) + 1);
            } else if (snapshot.repetition() <= 5) {
                result.put(LEVEL_INTERMEDIATE, result.get(LEVEL_INTERMEDIATE) + 1);
            } else {
                result.put(LEVEL_MASTERED, result.get(LEVEL_MASTERED) + 1);
            }
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getReviewScoreDistribution() {
        List<ReviewSnapshot> reviewSnapshots = queryReviewSnapshots(getCurrentUserId());

        Map<String, Long> result = new LinkedHashMap<>();
        for (int score = 0; score <= 5; score++) {
            result.put(score + "分", 0L);
        }

        for (ReviewSnapshot reviewSnapshot : reviewSnapshots) {
            Integer score = reviewSnapshot.score();
            if (score == null || score < 0 || score > 5) {
                continue;
            }
            String scoreKey = score + "分";
            result.put(scoreKey, result.get(scoreKey) + 1);
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getReviewCountByLastSevenDays() {
        List<ReviewSnapshot> reviewSnapshots = queryReviewSnapshots(getCurrentUserId());

        LocalDate today = LocalDate.now();
        LocalDate sevenDaysAgo = today.minusDays(6);

        Map<String, Long> result = new LinkedHashMap<>();
        for (LocalDate date = sevenDaysAgo; !date.isAfter(today); date = date.plusDays(1)) {
            result.put(date.toString(), 0L);
        }

        for (ReviewSnapshot reviewSnapshot : reviewSnapshots) {
            LocalDateTime reviewDate = reviewSnapshot.reviewDate();
            if (reviewDate == null) {
                continue;
            }
            String reviewDay = reviewDate.toLocalDate().toString();
            if (result.containsKey(reviewDay)) {
                result.put(reviewDay, result.get(reviewDay) + 1);
            }
        }

        return result;
    }

    private List<VocabularySnapshot> queryVocabularySnapshots(String userId) {
        Map<String, Object> params = new HashMap<>();
        params.put("createUser", userId);

        String sql = """
                SELECT archived, repetition, next_review_date, easiness_factor
                FROM vocabulary_card
                WHERE create_user = :createUser
                """;

        return jdbcTemplate.query(sql, params, (rs, rowNum) -> {
            Timestamp nextReviewTimestamp = rs.getTimestamp("next_review_date");
            BigDecimal easinessFactorValue = rs.getBigDecimal("easiness_factor");
            return new VocabularySnapshot(
                    rs.getBoolean("archived"),
                    rs.getInt("repetition"),
                    nextReviewTimestamp == null ? null : nextReviewTimestamp.toLocalDateTime(),
                    easinessFactorValue == null ? null : easinessFactorValue.doubleValue());
        });
    }

    private List<ReviewSnapshot> queryReviewSnapshots(String userId) {
        Map<String, Object> params = new HashMap<>();
        params.put("createUser", userId);

        String sql = """
                SELECT r.review_date, r.score
                FROM review_log r
                INNER JOIN vocabulary_card v ON v.id = r.obj_id
                WHERE v.create_user = :createUser
                ORDER BY r.review_date ASC
                """;

        return jdbcTemplate.query(sql, params, (rs, rowNum) -> {
            Timestamp reviewTimestamp = rs.getTimestamp("review_date");
            return new ReviewSnapshot(
                    reviewTimestamp == null ? null : reviewTimestamp.toLocalDateTime(),
                    rs.getInt("score"));
        });
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }

    private Double round2(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private record VocabularySnapshot(Boolean archived, Integer repetition, LocalDateTime nextReviewDate,
            Double easinessFactor) {
    }

    private record ReviewSnapshot(LocalDateTime reviewDate, Integer score) {
    }
}
