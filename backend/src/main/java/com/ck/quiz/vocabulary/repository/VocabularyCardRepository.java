package com.ck.quiz.vocabulary.repository;

import com.ck.quiz.base.repository.ReviewBaseRepository;
import com.ck.quiz.vocabulary.entity.VocabularyCard;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 单词卡片仓库接口
 */
public interface VocabularyCardRepository extends ReviewBaseRepository<VocabularyCard> {

    /**
     * 根据单词查找（用于唯一性验证）
     *
     * @param word 单词
     * @return 单词卡片
     */
    Optional<VocabularyCard> findByWord(String word);

    /**
     * 查询全部待复习的记录（到期时间 <= 当前时间）
     *
     * @param now 当前时间
     * @return 待复习记录列表（按下次复习时间升序排序）
     */
    @Query("SELECT v FROM VocabularyCard v WHERE v.nextReviewDate <= :now AND v.archived = false ORDER BY v.nextReviewDate ASC")
    List<VocabularyCard> findDueToday(@Param("now") LocalDateTime now);

}
