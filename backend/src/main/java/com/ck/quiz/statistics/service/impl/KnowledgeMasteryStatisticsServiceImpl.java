package com.ck.quiz.statistics.service.impl;

import com.ck.quiz.statistics.dto.KnowledgeMasteryDashboardDto;
import com.ck.quiz.statistics.dto.KnowledgeMasteryOverviewDto;
import com.ck.quiz.statistics.dto.StatisticsThemeDto;
import com.ck.quiz.statistics.service.KnowledgeMasteryStatisticsService;
import com.ck.quiz.statistics.service.StatisticsThemeService;
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
 * 知识掌握统计主题服务实现
 */
@Service
public class KnowledgeMasteryStatisticsServiceImpl implements KnowledgeMasteryStatisticsService, StatisticsThemeService {

    public static final String THEME_KEY = "knowledge-mastery";

    private static final String LEVEL_NEW = "未掌握（0次连对）";
    private static final String LEVEL_BEGINNER = "初步掌握（1-2次连对）";
    private static final String LEVEL_INTERMEDIATE = "稳定掌握（3-5次连对）";
    private static final String LEVEL_MASTERED = "深度掌握（6次及以上）";

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public KnowledgeMasteryStatisticsServiceImpl(NamedParameterJdbcTemplate jdbcTemplate) {
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
                "知识掌握统计报表",
                "查看知识掌握分层、学科分布与近期复习趋势",
                "statistics-center/knowledge-mastery");
    }

    @Override
    public KnowledgeMasteryDashboardDto getDashboard() {
        return new KnowledgeMasteryDashboardDto(
                getOverview(),
                getMasteryDistribution(),
                getKnowledgeCountBySubject(),
                getReviewScoreDistribution(),
                getReviewCountByLastSevenDays());
    }

    @Override
    @Transactional(readOnly = true)
    public KnowledgeMasteryOverviewDto getOverview() {
        List<KnowledgeSnapshot> snapshots = queryKnowledgeSnapshots(getCurrentUserId());

        long totalKnowledges = snapshots.size();
        long archivedKnowledges = snapshots.stream().filter(snapshot -> isArchived(snapshot.archived())).count();
        long activeKnowledges = totalKnowledges - archivedKnowledges;
        long masteredKnowledges = snapshots.stream()
                .filter(snapshot -> !isArchived(snapshot.archived()) && snapshot.repetition() >= 6)
                .count();

        LocalDateTime now = LocalDateTime.now();
        long dueTodayKnowledges = snapshots.stream()
                .filter(snapshot -> !isArchived(snapshot.archived()))
                .map(KnowledgeSnapshot::nextReviewDate)
                .filter(Objects::nonNull)
                .filter(nextReviewDate -> !nextReviewDate.isAfter(now))
                .count();

        double averageRepetition = activeKnowledges == 0 ? 0D : snapshots.stream()
                .filter(snapshot -> !isArchived(snapshot.archived()))
                .mapToInt(KnowledgeSnapshot::repetition)
                .average()
                .orElse(0D);

        double averageEasinessFactor = activeKnowledges == 0 ? 0D : snapshots.stream()
                .filter(snapshot -> !isArchived(snapshot.archived()))
                .map(KnowledgeSnapshot::easinessFactor)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0D);

        return new KnowledgeMasteryOverviewDto(
                totalKnowledges,
                activeKnowledges,
                archivedKnowledges,
                masteredKnowledges,
                dueTodayKnowledges,
                round2(averageRepetition),
                round2(averageEasinessFactor));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getMasteryDistribution() {
        List<KnowledgeSnapshot> snapshots = queryKnowledgeSnapshots(getCurrentUserId());

        Map<String, Long> result = new LinkedHashMap<>();
        result.put(LEVEL_NEW, 0L);
        result.put(LEVEL_BEGINNER, 0L);
        result.put(LEVEL_INTERMEDIATE, 0L);
        result.put(LEVEL_MASTERED, 0L);

        for (KnowledgeSnapshot snapshot : snapshots) {
            if (isArchived(snapshot.archived())) {
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
    public Map<String, Long> getKnowledgeCountBySubject() {
        Map<String, Object> params = new HashMap<>();
        params.put("createUser", getCurrentUserId());

        String sql = """
                SELECT COALESCE(s.name, '未归类学科') AS subject_name, COUNT(k.knowledge_id) AS knowledge_count
                FROM knowledge k
                LEFT JOIN subject s ON s.id = k.subject_id
                WHERE k.create_user = :createUser
                  AND k.archived = false
                GROUP BY COALESCE(s.name, '未归类学科')
                ORDER BY knowledge_count DESC, subject_name ASC
                """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, params);
        Map<String, Long> result = new LinkedHashMap<>();

        for (Map<String, Object> row : rows) {
            String subjectName = (String) row.get("subject_name");
            Number count = (Number) row.get("knowledge_count");
            result.put(subjectName, count == null ? 0L : count.longValue());
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

    private List<KnowledgeSnapshot> queryKnowledgeSnapshots(String userId) {
        Map<String, Object> params = new HashMap<>();
        params.put("createUser", userId);

        String sql = """
                SELECT archived, repetition, next_review_date, easiness_factor
                FROM knowledge
                WHERE create_user = :createUser
                """;

        return jdbcTemplate.query(sql, params, (rs, rowNum) -> {
            Timestamp nextReviewTimestamp = rs.getTimestamp("next_review_date");
            BigDecimal easinessFactorValue = rs.getBigDecimal("easiness_factor");
            return new KnowledgeSnapshot(
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
                INNER JOIN knowledge k ON k.knowledge_id = r.obj_id
                WHERE k.create_user = :createUser
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

    private boolean isArchived(Boolean archived) {
        return Boolean.TRUE.equals(archived);
    }

    private Double round2(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private record KnowledgeSnapshot(Boolean archived, Integer repetition, LocalDateTime nextReviewDate,
            Double easinessFactor) {
    }

    private record ReviewSnapshot(LocalDateTime reviewDate, Integer score) {
    }
}
