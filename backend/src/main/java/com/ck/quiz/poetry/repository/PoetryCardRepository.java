package com.ck.quiz.poetry.repository;

import com.ck.quiz.base.repository.ReviewBaseRepository;
import com.ck.quiz.poetry.entity.PoetryCard;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * 诗词卡片仓库接口
 */
public interface PoetryCardRepository extends ReviewBaseRepository<PoetryCard> {

    /**
     * 根据标题和作者查找（用于唯一性验证）
     */
    @Query("SELECT p FROM PoetryCard p WHERE p.title = :title AND p.author = :author AND p.createUser = :userId")
    Optional<PoetryCard> findByTitleAndAuthorAndUser(@Param("title") String title,
            @Param("author") String author,
            @Param("userId") String userId);
}
