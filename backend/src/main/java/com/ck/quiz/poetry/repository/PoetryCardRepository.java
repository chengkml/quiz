package com.ck.quiz.poetry.repository;

import com.ck.quiz.base.repository.ReviewBaseRepository;
import com.ck.quiz.poetry.entity.PoetryCard;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 诗词卡片仓库接口
 */
public interface PoetryCardRepository extends ReviewBaseRepository<PoetryCard> {

    /**
     * 根据标题和作者查找（用于唯一性验证）
     */
    Optional<PoetryCard> findByTitleAndAuthor(String title, String author);

    /**
     * 查询当前用户待复习的记录（到期时间 <= 当前时间）
     */
    @Query("SELECT p FROM PoetryCard p WHERE p.nextReviewDate <= :now AND p.createUser = :userId AND p.archived = false ORDER BY p.nextReviewDate ASC")
    List<PoetryCard> findDueToday(@Param("now") LocalDateTime now, @Param("userId") String userId);
}
