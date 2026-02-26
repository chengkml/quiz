package com.ck.quiz.vocabulary.repository;

import com.ck.quiz.base.repository.ReviewBaseRepository;
import com.ck.quiz.vocabulary.entity.VocabularyCard;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * 单词卡片仓库接口
 */
public interface VocabularyCardRepository extends ReviewBaseRepository<VocabularyCard> {

    /**
     * 根据单词查找（用于唯一性验证）
     * 
     * @param word   单词
     * @param userId 用户ID
     * @return 单词卡片
     */
    @Query("SELECT v FROM VocabularyCard v WHERE v.word = :word AND v.createUser = :userId")
    Optional<VocabularyCard> findByWordAndUser(@Param("word") String word, @Param("userId") String userId);


}
