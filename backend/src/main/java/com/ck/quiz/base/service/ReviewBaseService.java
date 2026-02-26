package com.ck.quiz.base.service;

import com.ck.quiz.base.dto.CreateDto;
import com.ck.quiz.base.dto.Dto;
import com.ck.quiz.base.dto.QueryDto;
import com.ck.quiz.base.dto.ReviewLogDto;
import com.ck.quiz.base.dto.ReviewRequestDto;
import com.ck.quiz.base.dto.ReviewResultDto;
import com.ck.quiz.base.dto.UpdateDto;
import com.ck.quiz.base.entity.Model;

import java.util.List;

/**
 * 复习记录基础服务接口
 */
public interface ReviewBaseService<C extends CreateDto, U extends UpdateDto, Q extends QueryDto, D extends Dto, M extends Model> extends BaseService<C, U, Q, D, M> {

    /**
     * 归档/取消归档单
     */
    void archive(String userId, String id, boolean archived);

    /**
     * 重置学习状态
     */
    void reset(String userId, String id);

    /**
     * 获取今日待复习列表
     */
    List<D> getDueToday(String userId);

    /**
     * 提交复习评分，更新学习状态（SM-2 算法核心）
     */
    ReviewResultDto review(String userId, ReviewRequestDto dto);

    /**
     * 获取复习历史
     */
    List<ReviewLogDto> getReviewHistory(String userId, String cardId);
}
