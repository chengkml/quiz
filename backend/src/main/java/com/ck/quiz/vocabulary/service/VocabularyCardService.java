package com.ck.quiz.vocabulary.service;

import com.ck.quiz.base.service.ReviewBaseService;
import com.ck.quiz.vocabulary.dto.*;
import com.ck.quiz.vocabulary.entity.VocabularyCard;
import reactor.core.publisher.Flux;

/**
 * 单词卡片服务接口
 */
public interface VocabularyCardService extends ReviewBaseService<VocabularyCardCreateDto, VocabularyCardUpdateDto, VocabularyCardQueryDto, VocabularyCardDto, VocabularyCard> {

    /**
     * 流式生成单词释义
     */
    Flux<String> streamGenerateDefinition(String word, String modelName);

}
