package com.ck.quiz.vocabulary.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
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
public class VocabularyCardServiceImpl 
        extends ReviewBaseServiceImpl<VocabularyCardCreateDto, VocabularyCardUpdateDto, VocabularyCardQueryDto, VocabularyCardDto, VocabularyCard, VocabularyCardRepository>
        implements VocabularyCardService {

    @Autowired
    private VocabularyCardRepository vocabularyCardRepository;

    @Autowired
    private LLMModelService llmModelService;

    @Autowired
    private PromptTemplateService promptTemplateService;

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
        // 获取当前用户ID
        String userId = getCurrentUserId();
        
        // 检查单词是否已存在
        Optional<VocabularyCard> existing = vocabularyCardRepository.findByWordAndUser(createDto.getWord(), userId);
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

        if (!card.getCreateUser().equals(userId)) {
            throw new RuntimeException("无权限操作此单词");
        }

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

            // 用户过滤
            predicates.add(cb.equal(root.get("createUser"), userId));

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
        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

        return chat.prompt()
                .user(prompt)
                .stream()
                .content()
                .doOnNext(fullContent::append)
                .concatWith(Flux.defer(() -> {
                    String content = fullContent.toString().trim();
                    try {
                        VocabularyDefinitionGenerateDto dto = objectMapper.readValue(content, VocabularyDefinitionGenerateDto.class);
                        String json = objectMapper.writeValueAsString(dto);
                        return Flux.just("\n\n[PARSE_RESULT]\n", "[DEFINITION]" + json);
                    } catch (Exception parseEx) {
                        log.error("[Vocabulary] JSON parse error", parseEx);
                        return Flux.just("[ERROR]解析JSON失败: " + parseEx.getMessage());
                    }
                }))
                .onErrorResume(e -> Flux.just("[ERROR]服务异常: " + e.getMessage()));
    }

    // ========== 辅助方法 ==========

    /**
     * 获取当前用户ID
     */
    private String getCurrentUserId() {
        org.springframework.security.core.Authentication authentication = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "anonymous";
        }
        return authentication.getName();
    }

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

}
