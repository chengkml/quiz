package com.ck.quiz.vocabulary.repository;

import com.ck.quiz.vocabulary.entity.ReviewLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * 复习记录仓库接口
 */
public interface ReviewLogRepository extends JpaRepository<ReviewLog, String> {

    /**
     * 获取某单词的复习历史
     * @param vocabularyCardId 单词卡片ID
     * @return 复习记录列表，按时间倒序
     */
    @Query("SELECT r FROM ReviewLog r WHERE r.vocabularyCardId = :vocabularyCardId ORDER BY r.reviewDate DESC")
    List<ReviewLog> findByVocabularyCardId(@Param("vocabularyCardId") String vocabularyCardId);
}
