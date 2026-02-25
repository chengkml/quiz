package com.ck.quiz.vocabulary.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.vocabulary.entity.VocabularyCard;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 单词卡片仓库接口
 */
public interface VocabularyCardRepository extends BaseRepository<VocabularyCard> {

    /**
     * 查找今日待复习的单词
     * 
     * @param today  今日日期
     * @param userId 用户ID
     * @return 待复习单词列表
     */
    @Query("SELECT v FROM VocabularyCard v WHERE v.nextReviewDate <= :today AND v.archived = false AND v.createUser = :userId ORDER BY v.nextReviewDate ASC")
    List<VocabularyCard> findDueToday(@Param("today") LocalDate today, @Param("userId") String userId);

    /**
     * 根据单词查找（用于唯一性验证）
     * 
     * @param word   单词
     * @param userId 用户ID
     * @return 单词卡片
     */
    @Query("SELECT v FROM VocabularyCard v WHERE v.word = :word AND v.createUser = :userId")
    Optional<VocabularyCard> findByWordAndUser(@Param("word") String word, @Param("userId") String userId);

    /**
     * 统计总单词数
     * 
     * @param userId 用户ID
     * @return 总数
     */
    @Query("SELECT COUNT(v) FROM VocabularyCard v WHERE v.createUser = :userId")
    Long countByUser(@Param("userId") String userId);

    /**
     * 统计今日待复习数
     * 
     * @param today  今日日期
     * @param userId 用户ID
     * @return 待复习数
     */
    @Query("SELECT COUNT(v) FROM VocabularyCard v WHERE v.nextReviewDate <= :today AND v.archived = false AND v.createUser = :userId")
    Long countDueToday(@Param("today") LocalDate today, @Param("userId") String userId);

    /**
     * 统计已归档数
     * 
     * @param userId 用户ID
     * @return 归档数
     */
    @Query("SELECT COUNT(v) FROM VocabularyCard v WHERE v.archived = true AND v.createUser = :userId")
    Long countArchived(@Param("userId") String userId);
}
