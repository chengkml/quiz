package com.ck.quiz.vocabulary.service;

import com.ck.quiz.vocabulary.dto.*;
import com.ck.quiz.vocabulary.entity.VocabularyCard;
import org.springframework.data.domain.Page;
import reactor.core.publisher.Flux;

import java.util.List;

/**
 * 单词卡片服务接口
 */
public interface VocabularyCardService {

    /**
     * 创建单词卡片
     */
    VocabularyCardDto create(String userId, VocabularyCardCreateDto dto);

    /**
     * 更新单词卡片
     */
    VocabularyCardDto update(String userId, VocabularyCardUpdateDto dto);

    /**
     * 删除单词卡片
     */
    void delete(String userId, String id);

    /**
     * 根据ID获取单词卡片
     */
    VocabularyCardDto getById(String userId, String id);

    /**
     * 搜索/筛选单词卡片
     */
    Page<VocabularyCardDto> search(String userId, VocabularyCardQueryDto queryDto);

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
