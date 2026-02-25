package com.ck.quiz.vocabulary.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.vocabulary.dto.*;
import com.ck.quiz.vocabulary.entity.VocabularyCard;
import reactor.core.publisher.Flux;

import java.util.List;

/**
 * 单词卡片服务接口
 */
public interface VocabularyCardService extends BaseService<VocabularyCardCreateDto, VocabularyCardUpdateDto, VocabularyCardQueryDto, VocabularyCardDto, VocabularyCard> {

    /**
     * 归档/取消归档单词
     */
    void archive(String userId, String id, boolean archived);

    /**
     * 重置单词学习状态
     */
    void reset(String userId, String id);

    /**
     * 获取今日待复习单词列表
     */
    List<VocabularyCardDto> getDueToday(String userId);

    /**
     * 流式生成单词释义
     */
    Flux<String> streamGenerateDefinition(String word, String modelName);

    /**
     * 提交复习评分，更新学习状态（SM-2 算法核心）
     */
    ReviewResultDto review(String userId, ReviewRequestDto dto);

    /**
     * 获取学习统计数据
     */
    StatisticsDto getStatistics(String userId);

    /**
     * 获取某单词的复习历史
     */
    List<ReviewLogDto> getReviewHistory(String userId, String cardId);
}
