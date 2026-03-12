package com.ck.quiz.character.service.impl;

import com.ck.quiz.base.service.impl.ReviewBaseServiceImpl;
import com.ck.quiz.character.dto.CharacterCardCreateDto;
import com.ck.quiz.character.dto.CharacterCardDto;
import com.ck.quiz.character.dto.CharacterCardQueryDto;
import com.ck.quiz.character.dto.CharacterCardUpdateDto;
import com.ck.quiz.character.entity.CharacterCard;
import com.ck.quiz.character.repository.CharacterCardRepository;
import com.ck.quiz.character.service.CharacterCardService;
import com.ck.quiz.llmmodel.service.LLMModelService;
import com.ck.quiz.prompt.dto.PromptTemplateDto;
import com.ck.quiz.prompt.service.PromptTemplateService;
import com.ck.quiz.utils.IdHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 生字卡片服务实现
 */
@Slf4j
@Service
public class CharacterCardServiceImpl
        extends ReviewBaseServiceImpl<CharacterCardCreateDto, CharacterCardUpdateDto, CharacterCardQueryDto, CharacterCardDto, CharacterCard, CharacterCardRepository>
        implements CharacterCardService {

    @Autowired
    private CharacterCardRepository characterCardRepository;

    @Autowired
    private LLMModelService llmModelService;

    @Autowired
    private PromptTemplateService promptTemplateService;

    @Override
    protected CharacterCardDto newDto() {
        return new CharacterCardDto();
    }

    @Override
    protected CharacterCard newModel() {
        return new CharacterCard();
    }

    @Override
    @Transactional
    public CharacterCardDto create(CharacterCardCreateDto createDto) {
        String userId = getCurrentUserId();
        String normalizedCharacterText = normalizeRequiredText(createDto.getCharacterText(), "生字不能为空");
        createDto.setCharacterText(normalizedCharacterText);
        createDto.setPinyin(normalizeOptionalText(createDto.getPinyin()));

        Optional<CharacterCard> existing = characterCardRepository
                .findByCharacterTextAndUser(normalizedCharacterText, userId);
        if (existing.isPresent()) {
            throw new RuntimeException("生字已存在: " + normalizedCharacterText);
        }

        CharacterCard card = newModel();
        card.setId(IdHelper.genUuid());
        BeanUtils.copyProperties(createDto, card);

        card.setEasinessFactor(2.5);
        card.setInterval(0);
        card.setRepetition(0);
        card.setNextReviewDate(LocalDateTime.now().plusDays(1));
        card.setArchived(false);
        card.setTotalReviewCount(0);

        CharacterCard saved = characterCardRepository.save(card);
        return convertToDto(saved, true);
    }

    @Override
    @Transactional
    public CharacterCardDto update(String userId, CharacterCardUpdateDto updateDto) {
        CharacterCard card = characterCardRepository.findById(updateDto.getId())
                .orElseThrow(() -> new RuntimeException("生字不存在"));

        if (!card.getCreateUser().equals(userId)) {
            throw new RuntimeException("无权限操作此生字");
        }

        String normalizedCharacterText = normalizeRequiredText(updateDto.getCharacterText(), "生字不能为空");
        updateDto.setCharacterText(normalizedCharacterText);
        updateDto.setPinyin(normalizeOptionalText(updateDto.getPinyin()));

        Optional<CharacterCard> duplicate = characterCardRepository
                .findByCharacterTextAndUser(normalizedCharacterText, userId);
        if (duplicate.isPresent() && !duplicate.get().getId().equals(card.getId())) {
            throw new RuntimeException("生字已存在: " + normalizedCharacterText);
        }

        BeanUtils.copyProperties(updateDto, card);
        CharacterCard saved = characterCardRepository.save(card);
        return convertToDto(saved, true);
    }

    @Override
    public Page<CharacterCardDto> search(String userId, CharacterCardQueryDto queryDto) {
        Sort.Direction direction = "asc".equalsIgnoreCase(queryDto.getSortDirection())
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortBy = queryDto.getSortBy() != null && !queryDto.getSortBy().isEmpty()
                ? queryDto.getSortBy() : "createDate";

        int page = queryDto.getPage() != null ? queryDto.getPage() : 0;
        int size = queryDto.getSize() != null ? queryDto.getSize() : 20;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<CharacterCard> pageResult = characterCardRepository.findAll((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("createUser"), userId));

            if (queryDto.getKeyword() != null && !queryDto.getKeyword().trim().isEmpty()) {
                String keyword = "%" + queryDto.getKeyword().toLowerCase() + "%";
                Predicate byCharacter = cb.like(cb.lower(root.get("characterText")), keyword);
                Predicate byPinyin = cb.like(cb.lower(root.get("pinyin")), keyword);
                Predicate byDefinition = cb.like(cb.lower(root.get("mdDefinition")), keyword);
                predicates.add(cb.or(byCharacter, byPinyin, byDefinition));
            }

            if (queryDto.getArchived() != null) {
                predicates.add(cb.equal(root.get("archived"), queryDto.getArchived()));
            }

            if (queryDto.getMinRepetition() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("repetition"), queryDto.getMinRepetition()));
            }
            if (queryDto.getMaxRepetition() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("repetition"), queryDto.getMaxRepetition()));
            }

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

        List<CharacterCardDto> dtos = pageResult.getContent().stream()
                .map(card -> convertToDto(card, true))
                .collect(Collectors.toList());

        return new org.springframework.data.domain.PageImpl<>(dtos, pageable, pageResult.getTotalElements());
    }

    @Override
    public Flux<String> streamGenerateDefinition(String characterText, String modelName) {
        OpenAiChatModel chatModel = llmModelService.getChatModel(modelName);
        ChatClient chat = ChatClient.builder(chatModel).build();
        String prompt = buildDefinitionPrompt(characterText);

        StringBuilder fullContent = new StringBuilder();

        return chat.prompt()
                .user(prompt)
                .stream()
                .content()
                .doOnNext(fullContent::append)
                .concatWith(Flux.defer(() -> {
                    String content = fullContent.toString().trim();
                    return Flux.just("\n\n[PARSE_RESULT]\n", "[DEFINITION]" + content);
                }))
                .onErrorResume(e -> Flux.just("[ERROR]服务异常: " + e.getMessage()));
    }

    @Override
    public CharacterCardDto convertToDto(CharacterCard card, Boolean loadProps) {
        CharacterCardDto dto = super.convertToDto(card, loadProps);
        dto.setCharacterText(card.getCharacterText());
        dto.setPinyin(card.getPinyin());
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

    private String buildDefinitionPrompt(String characterText) {
        try {
            PromptTemplateDto template = promptTemplateService.getByName("characterDefinitionGenerate");
            String targetPrompt = template.getContent().replace("{{character}}", characterText)
                    .replace("{{word}}", characterText);
            return targetPrompt.replace("{{currentDateTime}}", LocalDateTime.now().toString());
        } catch (Exception ex) {
            log.warn("characterDefinitionGenerate not found, use fallback prompt");
            return "请为生字“" + characterText + "”生成Markdown学习卡，包含拼音、释义、词语搭配、例句和易混字对比。";
        }
    }

    private String normalizeRequiredText(String text, String errorMessage) {
        String normalized = normalizeOptionalText(text);
        if (normalized == null || normalized.isEmpty()) {
            throw new RuntimeException(errorMessage);
        }
        return normalized;
    }

    private String normalizeOptionalText(String text) {
        if (text == null) {
            return null;
        }
        String normalized = text.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String getCurrentUserId() {
        org.springframework.security.core.Authentication authentication =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "anonymous";
        }
        return authentication.getName();
    }
}
