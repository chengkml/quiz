package com.ck.quiz.character.repository;

import com.ck.quiz.base.repository.ReviewBaseRepository;
import com.ck.quiz.character.entity.CharacterCard;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 生字卡片仓库接口
 */
public interface CharacterCardRepository extends ReviewBaseRepository<CharacterCard> {

    /**
     * 根据生字查找（用于唯一性校验）
     */
    Optional<CharacterCard> findByCharacterText(String characterText);

    /**
     * 查询全部待复习的记录（到期时间 <= 当前时间）
     */
    @Query("SELECT c FROM CharacterCard c WHERE c.nextReviewDate <= :now AND c.archived = false ORDER BY c.nextReviewDate ASC")
    List<CharacterCard> findDueToday(@Param("now") LocalDateTime now);
}
