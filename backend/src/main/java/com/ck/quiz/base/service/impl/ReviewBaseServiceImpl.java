package com.ck.quiz.base.service.impl;

import com.ck.quiz.base.dto.CreateDto;
import com.ck.quiz.base.dto.Dto;
import com.ck.quiz.base.dto.QueryDto;
import com.ck.quiz.base.dto.ReviewLogDto;
import com.ck.quiz.base.dto.ReviewRequestDto;
import com.ck.quiz.base.dto.ReviewResultDto;
import com.ck.quiz.base.dto.UpdateDto;
import com.ck.quiz.base.entity.ReviewLog;
import com.ck.quiz.base.entity.ReviewModel;
import com.ck.quiz.base.repository.ReviewBaseRepository;
import com.ck.quiz.base.repository.ReviewLogRepository;
import com.ck.quiz.base.service.ReviewBaseService;
import com.ck.quiz.utils.IdHelper;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 复习记录基础服务实现
 */
@Slf4j
@Service
@Transactional
public abstract class ReviewBaseServiceImpl<C extends CreateDto, U extends UpdateDto, Q extends QueryDto, D extends Dto, M extends ReviewModel, R extends ReviewBaseRepository<M>>
        extends BaseServiceImpl<C, U, Q, D, M, R>
        implements ReviewBaseService<C, U, Q, D, M> {

    @Autowired
    private ReviewLogRepository reviewLogRepository;

    @Override
    @Transactional
    public void archive(String userId, String id, boolean archived) {
        M model = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("记录不存在"));

        if (!model.getCreateUser().equals(userId)) {
            throw new RuntimeException("无权限操作此记录");
        }

        model.setArchived(archived);
        repository.save(model);
    }

    @Override
    @Transactional
    public void reset(String userId, String id) {
        M model = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("记录不存在"));

        if (!model.getCreateUser().equals(userId)) {
            throw new RuntimeException("无权限操作此记录");
        }

        // 重置为初始状态
        model.setEasinessFactor(2.5);
        model.setInterval(0);
        model.setRepetition(0);
        model.setNextReviewDate(LocalDateTime.now().plusDays(1));
        model.setLastScore(null);

        repository.save(model);
        log.info("记录 {} 已重置学习状态", model.getId());
    }

    @Override
    public List<D> getDueToday(String userId) {
        LocalDateTime now = LocalDateTime.now();
        List<M> dueModels = repository.findDueToday(now, userId);
        return dueModels.stream()
                .map(model -> convertToDto(model, true))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ReviewResultDto review(String userId, ReviewRequestDto dto) {
        M model = repository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("记录不存在"));

        if (!model.getCreateUser().equals(userId)) {
            throw new RuntimeException("无权限操作此记录");
        }

        // 验证评分范围
        if (dto.getScore() < 0 || dto.getScore() > 5) {
            throw new RuntimeException("评分必须在 0-5 之间");
        }

        // 记录复习前状态
        Double efBefore = model.getEasinessFactor();
        LocalDateTime reviewTime = LocalDateTime.now(); // 记录当前复习时间

        // ============ SM-2 算法核心实现 ============

        // 1. 更新简易度因子 (EF)
        double newEF = model.getEasinessFactor() +
                (0.1 - (5 - dto.getScore()) * (0.08 + (5 - dto.getScore()) * 0.02));
        newEF = Math.max(1.3, newEF); // 确保 EF >= 1.3
        model.setEasinessFactor(newEF);

        // 2. 更新复习计数和间隔
        int newInterval;
        int newRepetition;
        String message;

        if (dto.getScore() < 3) {
            // 答错了，重置
            newRepetition = 0;
            newInterval = 1;
            message = "继续加油！明天再来复习这个单词";
        } else {
            // 答对了
            newRepetition = model.getRepetition() + 1;

            if (newRepetition == 1) {
                newInterval = 1;
                message = "不错！明天再来巩固一次";
            } else if (newRepetition == 2) {
                newInterval = 6;
                message = "很好！6天后再复习";
            } else {
                newInterval = (int) Math.ceil(model.getInterval() * newEF);
                message = String.format("太棒了！%d天后再复习", newInterval);
            }
        }

        model.setRepetition(newRepetition);
        model.setInterval(newInterval);

        // 3. 计算下次复习时间（基于当前复习时间）
        LocalDateTime nextReview = reviewTime.plusDays(newInterval);
        model.setNextReviewDate(nextReview);

        // 4. 更新统计信息
        model.setTotalReviewCount(model.getTotalReviewCount() + 1);
        model.setLastScore(dto.getScore());

        // 5. 保存复习记录
        ReviewLog log = new ReviewLog();
        log.setId(IdHelper.genUuid());
        log.setObjId(model.getId());
        log.setReviewDate(LocalDateTime.now());
        log.setScore(dto.getScore());
        log.setEfBefore(efBefore);
        log.setEfAfter(newEF);
        log.setNextIntervalDays(newInterval);
        reviewLogRepository.save(log);

        // 6. 保存更新后的卡片
        M saved = repository.save(model);

        // 7. 构建返回结果
        ReviewResultDto result = new ReviewResultDto();
        result.setId(saved.getId());
        result.setScore(dto.getScore());
        result.setNewEasinessFactor(newEF);
        result.setNewInterval(newInterval);
        result.setNewRepetition(newRepetition);
        result.setNextReviewDate(nextReview);
        result.setMessage(message);

        this.log.info("完成复习: 评分={}, 新EF={}, 新间隔={}天, 下次复习={}",
                dto.getScore(), newEF, newInterval, nextReview);

        return result;
    }

    @Override
    public List<ReviewLogDto> getReviewHistory(String userId, String cardId) {
        M model = repository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("记录不存在"));

        if (!model.getCreateUser().equals(userId)) {
            throw new RuntimeException("无权限访问此记录");
        }

        List<ReviewLog> logs = reviewLogRepository.findByObjId(model.getId());
        return logs.stream()
                .map(this::convertToLogDto)
                .collect(Collectors.toList());
    }

    private ReviewLogDto convertToLogDto(ReviewLog log) {
        ReviewLogDto dto = new ReviewLogDto();
        dto.setId(log.getId());
        dto.setObjId(log.getObjId());
        dto.setReviewDate(log.getReviewDate());
        dto.setScore(log.getScore());
        dto.setEfBefore(log.getEfBefore());
        dto.setEfAfter(log.getEfAfter());
        dto.setNextIntervalDays(log.getNextIntervalDays());
        return dto;
    }
}
