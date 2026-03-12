package com.ck.quiz.character.service;

import com.ck.quiz.base.service.ReviewBaseService;
import com.ck.quiz.character.dto.CharacterCardCreateDto;
import com.ck.quiz.character.dto.CharacterCardDto;
import com.ck.quiz.character.dto.CharacterCardQueryDto;
import com.ck.quiz.character.dto.CharacterCardUpdateDto;
import com.ck.quiz.character.entity.CharacterCard;
import reactor.core.publisher.Flux;

/**
 * 生字卡片服务接口
 */
public interface CharacterCardService extends ReviewBaseService<CharacterCardCreateDto, CharacterCardUpdateDto, CharacterCardQueryDto, CharacterCardDto, CharacterCard> {

    Flux<String> streamGenerateDefinition(String characterText, String modelName);
}
