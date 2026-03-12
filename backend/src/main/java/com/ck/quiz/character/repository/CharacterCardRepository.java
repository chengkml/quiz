package com.ck.quiz.character.repository;

import com.ck.quiz.base.repository.ReviewBaseRepository;
import com.ck.quiz.character.entity.CharacterCard;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * 生字卡片仓库接口
 */
public interface CharacterCardRepository extends ReviewBaseRepository<CharacterCard> {

    /**
     * 根据生字查找（用于唯一性校验）
     */
    @Query("SELECT c FROM CharacterCard c WHERE c.characterText = :characterText AND c.createUser = :userId")
    Optional<CharacterCard> findByCharacterTextAndUser(@Param("characterText") String characterText,
                                                       @Param("userId") String userId);
}
