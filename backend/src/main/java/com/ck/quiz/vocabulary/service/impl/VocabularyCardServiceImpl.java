package com.ck.quiz.vocabulary.service.impl;

import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.vocabulary.dto.*;
import com.ck.quiz.vocabulary.entity.ReviewLog;
import com.ck.quiz.vocabulary.entity.VocabularyCard;
import com.ck.quiz.vocabulary.repository.ReviewLogRepository;
import com.ck.quiz.vocabulary.repository.VocabularyCardRepository;
import com.ck.quiz.vocabulary.service.VocabularyCardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 单词卡片服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VocabularyCardServiceImpl implements VocabularyCardService {

    private final VocabularyCardRepository vocabularyCardRepository;
    private final ReviewLogRepository reviewLogRepository;
    private final EntityManager entityManager;

    @Override
    @Transactional
    public VocabularyCardDto create(String userId, VocabularyCardCreateDto dto) {
        // 检查单词是否已存在
        Optional<VocabularyCard> existing = vocabularyCardRepository.findByWordAndUser(dto.getWord(), userId);
        if (existing.isPresent()) {
            throw new RuntimeException("单词已存在: " + dto.getWord());
        }

        VocabularyCard card = new VocabularyCard();
        card.setId(IdHelper.genUuid());
        card.setWord(dto.getWord());
        card.setMdDefinition(dto.getMdDefinition());
        card.setTags(dto.getTags());
        
        // 初始化 SM-2 参数
        card.setEasinessFactor(2.5);
        card.setInterval(0);
        card.setRepetition(0);
        card.setNextReviewDate(LocalDate.now().plusDays(1)); // 明天开始复习
        card.setArchived(false);
        card.setTotalReviewCount(0);

        VocabularyCard saved = vocabularyCardRepository.save(card);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public VocabularyCardDto update(String userId, VocabularyCardUpdateDto dto) {
        VocabularyCard card = vocabularyCardRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("单词不存在"));

        if (!card.getCreateUser().equals(userId)) {
            throw new RuntimeException("无权限操作此单词");
        }

        card.setWord(dto.getWord());
        card.setMdDefinition(dto.getMdDefinition());
        card.setTags(dto.getTags());

        VocabularyCard saved = vocabularyCardRepository.save(card);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public void delete(String userId, String id) {
        VocabularyCard card = vocabularyCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("单词不存在"));

        if (!card.getCreateUser().equals(userId)) {
            throw new RuntimeException("无权限操作此单词");
        }

        vocabularyCardRepository.delete(card);
    }

    @Override
    public VocabularyCardDto getById(String userId, String id) {
        VocabularyCard card = vocabularyCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("单词不存在"));

        if (!card.getCreateUser().equals(userId)) {
            throw new RuntimeException("无权限访问此单词");
        }

        return convertToDto(card);
    }

    @Override
    public Page<VocabularyCardDto> search(String userId, VocabularyCardQueryDto queryDto) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<VocabularyCard> query = cb.createQuery(VocabularyCard.class);
        Root<VocabularyCard> root = query.from(VocabularyCard.class);

        List<Predicate> predicates = new ArrayList<>();
        
        // 用户过滤
        predicates.add(cb.equal(root.get("createUser"), userId));

        // 关键词搜索
        if (queryDto.getKeyword() != null && !queryDto.getKeyword().trim().isEmpty()) {
            predicates.add(cb.like(cb.lower(root.get("word")), 
                "%" + queryDto.getKeyword().toLowerCase() + "%"));
        }

        // 标签筛选
        if (queryDto.getTags() != null && !queryDto.getTags().trim().isEmpty()) {
            predicates.add(cb.like(root.get("tags"), "%" + queryDto.getTags() + "%"));
        }

        // 归档状态
        if (queryDto.getArchived() != null) {
            predicates.add(cb.equal(root.get("archived"), queryDto.getArchived()));
        }

        // 熟练度筛选
        if (queryDto.getMinRepetition() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("repetition"), queryDto.getMinRepetition()));
        }
        if (queryDto.getMaxRepetition() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("repetition"), queryDto.getMaxRepetition()));
        }

        // 创建日期筛选
        if (queryDto.getCreateDateStart() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("createDate"), 
                queryDto.getCreateDateStart().atStartOfDay()));
        }
        if (queryDto.getCreateDateEnd() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("createDate"), 
                queryDto.getCreateDateEnd().atTime(23, 59, 59)));
        }

        query.where(predicates.toArray(new Predicate[0]));

        // 排序
        Sort.Direction direction = "asc".equalsIgnoreCase(queryDto.getSortDirection()) ? 
            Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(queryDto.getPage(), queryDto.getSize(), 
            Sort.by(direction, queryDto.getSortBy()));

        // 执行查询
        long total = entityManager.createQuery(cb.createQuery(Long.class)
            .select(cb.count(query.from(VocabularyCard.class)))
            .where(predicates.toArray(new Predicate[0]))).getSingleResult();

        List<VocabularyCard> results = entityManager.createQuery(query)
            .setFirstResult((int) pageable.getOffset())
            .setMaxResults(pageable.getPageSize())
            .getResultList();

        List<VocabularyCardDto> dtos = results.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());

        return new org.springframework.data.domain.PageImpl<>(dtos, pageable, total);
    }

    @Override
    @Transactional
    public void archive(String userId, String id, boolean archived) {
        VocabularyCard card = vocabularyCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("单词不存在"));

        if (!card.getCreateUser().equals(userId)) {
            throw new RuntimeException("无权限操作此单词");
        }

        card.setArchived(archived);
        vocabularyCardRepository.save(card);
    }

    @Override
    @Transactional
    public void reset(String userId, String id) {
        VocabularyCard card = vocabularyCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("单词不存在"));

        if (!card.getCreateUser().equals(userId)) {
            throw new RuntimeException("无权限操作此单词");
        }

        // 重置为初始状态
        card.setEasinessFactor(2.5);
        card.setInterval(0);
        card.setRepetition(0);
        card.setNextReviewDate(LocalDate.now().plusDays(1));
        card.setLastScore(null);

        vocabularyCardRepository.save(card);
        log.info("单词 {} 已重置学习状态", card.getWord());
    }

    @Override
    public List<VocabularyCardDto> getDueToday(String userId) {
        LocalDate today = LocalDate.now();
        List<VocabularyCard> dueCards = vocabularyCardRepository.findDueToday(today, userId);
        return dueCards.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ReviewResultDto review(String userId, ReviewRequestDto dto) {
        VocabularyCard card = vocabularyCardRepository.findById(dto.getCardId())
                .orElseThrow(() -> new RuntimeException("单词不存在"));

        if (!card.getCreateUser().equals(userId)) {
            throw new RuntimeException("无权限操作此单词");
        }

        // 验证评分范围
        if (dto.getScore() < 0 || dto.getScore() > 5) {
            throw new RuntimeException("评分必须在 0-5 之间");
        }

        // 记录复习前状态
        Double efBefore = card.getEasinessFactor();

        // ============ SM-2 算法核心实现 ============
        
        // 1. 更新简易度因子 (EF)
        double newEF = card.getEasinessFactor() + 
            (0.1 - (5 - dto.getScore()) * (0.08 + (5 - dto.getScore()) * 0.02));
        newEF = Math.max(1.3, newEF); // 确保 EF >= 1.3
        card.setEasinessFactor(newEF);

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
            newRepetition = card.getRepetition() + 1;
            
            if (newRepetition == 1) {
                newInterval = 1;
                message = "不错！明天再来巩固一次";
            } else if (newRepetition == 2) {
                newInterval = 6;
                message = "很好！6天后再复习";
            } else {
                newInterval = (int) Math.ceil(card.getInterval() * newEF);
                message = String.format("太棒了！%d天后再复习", newInterval);
            }
        }

        card.setRepetition(newRepetition);
        card.setInterval(newInterval);

        // 3. 计算下次复习日期
        LocalDate nextReview = LocalDate.now().plusDays(newInterval);
        card.setNextReviewDate(nextReview);

        // 4. 更新统计信息
        card.setTotalReviewCount(card.getTotalReviewCount() + 1);
        card.setLastScore(dto.getScore());

        // 5. 保存复习记录
        ReviewLog log = new ReviewLog();
        log.setId(IdHelper.genUuid());
        log.setVocabularyCardId(card.getId());
        log.setReviewDate(LocalDateTime.now());
        log.setScore(dto.getScore());
        log.setEfBefore(efBefore);
        log.setEfAfter(newEF);
        log.setNextIntervalDays(newInterval);
        reviewLogRepository.save(log);

        // 6. 保存更新后的卡片
        VocabularyCard saved = vocabularyCardRepository.save(card);

        // 7. 构建返回结果
        ReviewResultDto result = new ReviewResultDto();
        result.setCardId(saved.getId());
        result.setWord(saved.getWord());
        result.setScore(dto.getScore());
        result.setNewEasinessFactor(newEF);
        result.setNewInterval(newInterval);
        result.setNewRepetition(newRepetition);
        result.setNextReviewDate(nextReview);
        result.setMessage(message);

        this.log.info("完成复习: 单词={}, 评分={}, 新EF={}, 新间隔={}天, 下次复习={}", 
            card.getWord(), dto.getScore(), newEF, newInterval, nextReview);

        return result;
    }

    @Override
    public StatisticsDto getStatistics(String userId) {
        StatisticsDto stats = new StatisticsDto();
        LocalDate today = LocalDate.now();

        // 基础统计
        stats.setTotalWords(vocabularyCardRepository.countByUser(userId));
        stats.setDueToday(vocabularyCardRepository.countDueToday(today, userId));
        stats.setArchived(vocabularyCardRepository.countArchived(userId));

        // 熟练度分布
        Map<String, Long> repetitionDist = new HashMap<>();
        repetitionDist.put("0次", countByRepetitionRange(userId, 0, 0));
        repetitionDist.put("1-2次", countByRepetitionRange(userId, 1, 2));
        repetitionDist.put("3-5次", countByRepetitionRange(userId, 3, 5));
        repetitionDist.put("6+次", countByRepetitionRange(userId, 6, Integer.MAX_VALUE));
        stats.setRepetitionDistribution(repetitionDist);

        // 简易度分布
        Map<String, Long> efDist = new HashMap<>();
        efDist.put("1.3-1.9", countByEFRange(userId, 1.3, 1.9));
        efDist.put("2.0-2.4", countByEFRange(userId, 2.0, 2.4));
        efDist.put("2.5+", countByEFRange(userId, 2.5, 10.0));
        stats.setEfDistribution(efDist);

        return stats;
    }

    @Override
    public List<ReviewLogDto> getReviewHistory(String userId, String cardId) {
        VocabularyCard card = vocabularyCardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("单词不存在"));

        if (!card.getCreateUser().equals(userId)) {
            throw new RuntimeException("无权限访问此单词");
        }

        List<ReviewLog> logs = reviewLogRepository.findByVocabularyCardId(cardId);
        return logs.stream()
                .map(this::convertToLogDto)
                .collect(Collectors.toList());
    }

    // ========== 辅助方法 ==========

    private VocabularyCardDto convertToDto(VocabularyCard card) {
        VocabularyCardDto dto = new VocabularyCardDto();
        dto.setId(card.getId());
        dto.setWord(card.getWord());
        dto.setMdDefinition(card.getMdDefinition());
        dto.setEasinessFactor(card.getEasinessFactor());
        dto.setInterval(card.getInterval());
        dto.setRepetition(card.getRepetition());
        dto.setNextReviewDate(card.getNextReviewDate());
        dto.setArchived(card.getArchived());
        dto.setTags(card.getTags());
        dto.setTotalReviewCount(card.getTotalReviewCount());
        dto.setLastScore(card.getLastScore());
        dto.setCreateDate(card.getCreateDate());
        dto.setUpdateDate(card.getUpdateDate());
        dto.setCreateUser(card.getCreateUser());
        return dto;
    }

    private ReviewLogDto convertToLogDto(ReviewLog log) {
        ReviewLogDto dto = new ReviewLogDto();
        dto.setId(log.getId());
        dto.setVocabularyCardId(log.getVocabularyCardId());
        dto.setReviewDate(log.getReviewDate());
        dto.setScore(log.getScore());
        dto.setEfBefore(log.getEfBefore());
        dto.setEfAfter(log.getEfAfter());
        dto.setNextIntervalDays(log.getNextIntervalDays());
        return dto;
    }

    private Long countByRepetitionRange(String userId, int min, int max) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> query = cb.createQuery(Long.class);
        Root<VocabularyCard> root = query.from(VocabularyCard.class);
        
        Predicate userPred = cb.equal(root.get("createUser"), userId);
        Predicate minPred = cb.greaterThanOrEqualTo(root.get("repetition"), min);
        Predicate maxPred = max == Integer.MAX_VALUE ? 
            cb.greaterThanOrEqualTo(root.get("repetition"), min) :
            cb.lessThanOrEqualTo(root.get("repetition"), max);
        
        query.select(cb.count(root)).where(cb.and(userPred, minPred, maxPred));
        return entityManager.createQuery(query).getSingleResult();
    }

    private Long countByEFRange(String userId, double min, double max) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> query = cb.createQuery(Long.class);
        Root<VocabularyCard> root = query.from(VocabularyCard.class);
        
        Predicate userPred = cb.equal(root.get("createUser"), userId);
        Predicate minPred = cb.greaterThanOrEqualTo(root.get("easinessFactor"), min);
        Predicate maxPred = max >= 10.0 ?
            cb.greaterThanOrEqualTo(root.get("easinessFactor"), min) :
            cb.lessThanOrEqualTo(root.get("easinessFactor"), max);
        
        query.select(cb.count(root)).where(cb.and(userPred, minPred, maxPred));
        return entityManager.createQuery(query).getSingleResult();
    }
}
