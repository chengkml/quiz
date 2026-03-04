package com.ck.quiz.cron.exec;

import com.ck.quiz.exam.service.ExamService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Component
public class ReviewExamGeneratorJob extends AbstractJob {

    @Autowired
    private ExamService examService;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    public String getJobPreffix() {
        return "ReviewExamGen";
    }

    @Override
    public String getJobLabel() {
        return "复习试卷生成任务";
    }

    @Override
    public Map<String, Object> getParamDef() {
        Map<String, Object> params = new HashMap<>();
        params.put("userId", "用户ID（可选，不填则处理所有用户）");
        params.put("subjectId", "学科ID（可选，不填则处理所有学科）");
        return params;
    }

    @Override
    public void run(Map<String, Object> params) {
        // 获取参数
        String filterUserId = params != null ? (String) params.get("userId") : null;
        String filterSubjectId = params != null ? (String) params.get("subjectId") : null;
        
        log.info("开始执行复习试卷生成任务... [用户: {}, 学科: {}]", 
                filterUserId != null ? filterUserId : "全部", 
                filterSubjectId != null ? filterSubjectId : "全部");

        // 1. 查询所有有待复习知识点的用户和学科
        // Group by user and subject
        StringBuilder sqlBuilder = new StringBuilder();
        sqlBuilder.append("SELECT k.create_user, k.subject_id ")
                .append("FROM knowledge k ")
                .append("WHERE k.next_review_date <= :now ");
        
        // 添加用户过滤条件
        if (filterUserId != null && !filterUserId.trim().isEmpty()) {
            sqlBuilder.append("AND k.create_user = :userId ");
        }
        
        // 添加学科过滤条件
        if (filterSubjectId != null && !filterSubjectId.trim().isEmpty()) {
            sqlBuilder.append("AND k.subject_id = :subjectId ");
        }
        
        sqlBuilder.append("GROUP BY k.create_user, k.subject_id");

        Map<String, Object> queryParams = new HashMap<>();
        queryParams.put("now", LocalDateTime.now());
        if (filterUserId != null && !filterUserId.trim().isEmpty()) {
            queryParams.put("userId", filterUserId);
        }
        if (filterSubjectId != null && !filterSubjectId.trim().isEmpty()) {
            queryParams.put("subjectId", filterSubjectId);
        }

        List<Map<String, Object>> userSubjects = jdbcTemplate.queryForList(sqlBuilder.toString(), queryParams);
        log.info("发现 {} 个待复习的 (用户, 学科) 组合", userSubjects.size());

        for (Map<String, Object> entry : userSubjects) {
            // Handle case-insensitive keys
            String userId = MapUtils.getString(entry, "create_user");
            if (userId == null) userId = MapUtils.getString(entry, "CREATE_USER");
            
            String subjectId = MapUtils.getString(entry, "subject_id");
            if (subjectId == null) subjectId = MapUtils.getString(entry, "SUBJECT_ID");

            if (userId == null || subjectId == null) {
                continue;
            }

            try {
                examService.generateReviewExam(userId, subjectId);
            } catch (Exception e) {
                log.error("处理用户 {} 学科 {} 复习试卷生成失败", userId, subjectId, e);
            }
        }
        
        log.info("复习试卷生成任务执行完成");
    }
}
