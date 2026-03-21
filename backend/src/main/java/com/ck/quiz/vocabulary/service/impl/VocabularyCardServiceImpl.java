package com.ck.quiz.vocabulary.service.impl;

import com.ck.quiz.base.dto.ReviewLogDto;
import com.ck.quiz.base.dto.ReviewRequestDto;
import com.ck.quiz.base.dto.ReviewResultDto;
import com.ck.quiz.base.entity.ReviewLog;
import com.ck.quiz.base.service.impl.ReviewBaseServiceImpl;
import com.ck.quiz.llmmodel.service.LLMModelService;
import com.ck.quiz.prompt.dto.PromptTemplateDto;
import com.ck.quiz.prompt.service.PromptTemplateService;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.vocabulary.dto.*;
import com.ck.quiz.vocabulary.repository.VocabularyCardRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ck.quiz.vocabulary.entity.VocabularyCard;
import com.ck.quiz.base.repository.ReviewLogRepository;
import com.ck.quiz.vocabulary.service.VocabularyCardService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;

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
public class VocabularyCardServiceImpl 
        extends ReviewBaseServiceImpl<VocabularyCardCreateDto, VocabularyCardUpdateDto, VocabularyCardQueryDto, VocabularyCardDto, VocabularyCard, VocabularyCardRepository>
        implements VocabularyCardService {

    @Autowired
    private VocabularyCardRepository vocabularyCardRepository;

    @Autowired
    private LLMModelService llmModelService;

    @Autowired
    private PromptTemplateService promptTemplateService;

    @Autowired
    private ReviewLogRepository reviewLogRepository;

    @Override
    protected VocabularyCardDto newDto() {
        return new VocabularyCardDto();
    }

    @Override
    protected VocabularyCard newModel() {
        return new VocabularyCard();
    }

    @Override
    @Transactional
    public VocabularyCardDto create(VocabularyCardCreateDto createDto) {
        // 检查单词是否已存在
        Optional<VocabularyCard> existing = vocabularyCardRepository.findByWord(createDto.getWord());
        if (existing.isPresent()) {
            throw new RuntimeException("单词已存在: " + createDto.getWord());
        }

        VocabularyCard card = newModel();
        card.setId(IdHelper.genUuid());
        BeanUtils.copyProperties(createDto, card);

        // 初始化 SM-2 参数
        card.setEasinessFactor(2.5);
        card.setInterval(0);
        card.setRepetition(0);
        card.setNextReviewDate(LocalDateTime.now().plusDays(1)); // 明天开始复习
        card.setArchived(false);
        card.setTotalReviewCount(0);

        VocabularyCard saved = vocabularyCardRepository.save(card);
        return convertToDto(saved, true);
    }

    @Override
    @Transactional
    public VocabularyCardDto update(String userId, VocabularyCardUpdateDto updateDto) {
        VocabularyCard card = vocabularyCardRepository.findById(updateDto.getId())
                .orElseThrow(() -> new RuntimeException("单词不存在"));

        BeanUtils.copyProperties(updateDto, card);

        VocabularyCard saved = vocabularyCardRepository.save(card);
        return convertToDto(saved, true);
    }

    // ========== 特有业务方法 ==========

    @Override
    public Page<VocabularyCardDto> search(String userId, VocabularyCardQueryDto queryDto) {
        Sort.Direction direction = "asc".equalsIgnoreCase(queryDto.getSortDirection()) ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        String sortBy = queryDto.getSortBy() != null && !queryDto.getSortBy().isEmpty() ? queryDto.getSortBy()
                : "createDate";

        int page = queryDto.getPage() != null ? queryDto.getPage() : 0;
        int size = queryDto.getSize() != null ? queryDto.getSize() : 20;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<VocabularyCard> pageResult = vocabularyCardRepository.findAll((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 关键词搜索
            if (queryDto.getKeyword() != null && !queryDto.getKeyword().trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("word")),
                        "%" + queryDto.getKeyword().toLowerCase() + "%"));
            }

            // 标签筛选（基类的 tags 是 List<String>，我们需要对多个标签进行查询）
            if (queryDto.getTags() != null && !queryDto.getTags().isEmpty()) {
                // 对每个标签创建 LIKE 条件
                Predicate[] tagPredicates = queryDto.getTags().stream()
                        .map(tag -> cb.like(root.get("tags"), "%" + tag + "%"))
                        .toArray(Predicate[]::new);
                predicates.add(cb.or(tagPredicates));
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

            return cb.and(predicates.toArray(new Predicate[0]));
        }, pageable);

        List<VocabularyCardDto> dtos = pageResult.getContent().stream()
                .map(card -> convertToDto(card, true))
                .collect(Collectors.toList());

        return new org.springframework.data.domain.PageImpl<>(dtos, pageable, pageResult.getTotalElements());
    }

    @Override
    @Transactional
    public void delete(String userId, String id) {
        VocabularyCard card = vocabularyCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("单词不存在"));

        groupObjRelaRepository.deleteByObjId(id);
        tagObjRelaRepository.deleteByObjId(id);
        vocabularyCardRepository.delete(card);
    }

    @Override
    public VocabularyCardDto get(String userId, String id) {
        VocabularyCard card = vocabularyCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("单词不存在"));
        return convertToDto(card, true);
    }

    @Override
    public List<VocabularyCardDto> list(String userId) {
        return convertToDtos(vocabularyCardRepository.findAll());
    }

    @Override
    @Transactional
    public void archive(String userId, String id, boolean archived) {
        VocabularyCard card = vocabularyCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("单词不存在"));

        card.setArchived(archived);
        vocabularyCardRepository.save(card);
    }

    @Override
    @Transactional
    public void reset(String userId, String id) {
        VocabularyCard card = vocabularyCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("单词不存在"));

        card.setEasinessFactor(2.5);
        card.setInterval(0);
        card.setRepetition(0);
        card.setNextReviewDate(LocalDateTime.now().plusDays(1));
        card.setLastScore(null);

        vocabularyCardRepository.save(card);
        log.info("单词 {} 已重置学习状态", card.getId());
    }

    @Override
    public List<VocabularyCardDto> getDueToday(String userId) {
        LocalDateTime now = LocalDateTime.now();
        return vocabularyCardRepository.findDueToday(now).stream()
                .map(card -> convertToDto(card, true))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ReviewResultDto review(String userId, ReviewRequestDto dto) {
        VocabularyCard card = vocabularyCardRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("单词不存在"));

        if (dto.getScore() < 0 || dto.getScore() > 5) {
            throw new RuntimeException("评分必须在 0-5 之间");
        }

        Double efBefore = card.getEasinessFactor();
        LocalDateTime reviewTime = LocalDateTime.now();

        double newEF = card.getEasinessFactor() +
                (0.1 - (5 - dto.getScore()) * (0.08 + (5 - dto.getScore()) * 0.02));
        newEF = Math.max(1.3, newEF);
        card.setEasinessFactor(newEF);

        int newInterval;
        int newRepetition;
        String message;

        if (dto.getScore() < 3) {
            newRepetition = 0;
            newInterval = 1;
            message = "继续加油！明天再来复习这个单词";
        } else {
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

        LocalDateTime nextReview = reviewTime.plusDays(newInterval);
        card.setNextReviewDate(nextReview);
        card.setTotalReviewCount(card.getTotalReviewCount() + 1);
        card.setLastScore(dto.getScore());

        ReviewLog reviewLog = new ReviewLog();
        reviewLog.setId(IdHelper.genUuid());
        reviewLog.setObjId(card.getId());
        reviewLog.setReviewDate(LocalDateTime.now());
        reviewLog.setScore(dto.getScore());
        reviewLog.setEfBefore(efBefore);
        reviewLog.setEfAfter(newEF);
        reviewLog.setNextIntervalDays(newInterval);
        reviewLogRepository.save(reviewLog);

        VocabularyCard saved = vocabularyCardRepository.save(card);

        ReviewResultDto result = new ReviewResultDto();
        result.setId(saved.getId());
        result.setScore(dto.getScore());
        result.setNewEasinessFactor(newEF);
        result.setNewInterval(newInterval);
        result.setNewRepetition(newRepetition);
        result.setNextReviewDate(nextReview);
        result.setMessage(message);

        log.info("完成单词复习: 评分={}, 新EF={}, 新间隔={}天, 下次复习={}",
                dto.getScore(), newEF, newInterval, nextReview);

        return result;
    }

    @Override
    public List<ReviewLogDto> getReviewHistory(String userId, String cardId) {
        VocabularyCard card = vocabularyCardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("单词不存在"));

        return reviewLogRepository.findByObjId(card.getId()).stream()
                .map(this::convertToReviewLogDto)
                .collect(Collectors.toList());
    }

    private String buildDefinitionPrompt(String word) {
        PromptTemplateDto promptTemplateDto = promptTemplateService.getByName("vocabularyDefinitionGenerate");
        String targetPrompt = promptTemplateDto.getContent().replace("{{word}}", word);
        String dateTime = LocalDateTime.now().toString();
        return targetPrompt.replace("{{currentDateTime}}", dateTime);
    }

    @Override
    public Flux<String> streamGenerateDefinition(String word, String modelName) {
        OpenAiChatModel chatModel = llmModelService.getChatModel(modelName);
        ChatClient chat = ChatClient.builder(chatModel).build();
        String prompt = buildDefinitionPrompt(word);

        StringBuilder fullContent = new StringBuilder();

        return chat.prompt()
                .user(prompt)
                .stream()
                .content()
                .doOnNext(fullContent::append)
                .concatWith(Flux.defer(() -> {
                    String content = fullContent.toString().trim();
                    // 直接返回Markdown内容，不再JSON解析
                    return Flux.just("\n\n[PARSE_RESULT]\n", "[DEFINITION]" + content);
                }))
                .onErrorResume(e -> Flux.just("[ERROR]服务异常: " + e.getMessage()));
    }

    // ========== 辅助方法 ==========

    /**
     * 重写convertToDto，增强单词本特有字段的映射
     */
    @Override
    public VocabularyCardDto convertToDto(VocabularyCard card, Boolean loadProps) {
        VocabularyCardDto dto = super.convertToDto(card, loadProps);
        // 额外的单词本特有字段映射（如果基类未处理）
        dto.setWord(card.getWord());
        dto.setMdDefinition(card.getMdDefinition());
        dto.setEasinessFactor(card.getEasinessFactor());
        dto.setInterval(card.getInterval());
        dto.setRepetition(card.getRepetition());
        dto.setNextReviewDate(card.getNextReviewDate());
        dto.setArchived(card.getArchived());
        dto.setTotalReviewCount(card.getTotalReviewCount());
        dto.setLastScore(card.getLastScore());
        
        return dto;
    }

    private ReviewLogDto convertToReviewLogDto(ReviewLog reviewLog) {
        ReviewLogDto dto = new ReviewLogDto();
        dto.setId(reviewLog.getId());
        dto.setObjId(reviewLog.getObjId());
        dto.setReviewDate(reviewLog.getReviewDate());
        dto.setScore(reviewLog.getScore());
        dto.setEfBefore(reviewLog.getEfBefore());
        dto.setEfAfter(reviewLog.getEfAfter());
        dto.setNextIntervalDays(reviewLog.getNextIntervalDays());
        return dto;
    }

}
