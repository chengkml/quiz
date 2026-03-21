package com.ck.quiz.character.service.impl;

import com.ck.quiz.base.dto.ReviewLogDto;
import com.ck.quiz.base.dto.ReviewRequestDto;
import com.ck.quiz.base.dto.ReviewResultDto;
import com.ck.quiz.base.entity.ReviewLog;
import com.ck.quiz.base.repository.ReviewLogRepository;
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

    @Autowired
    private ReviewLogRepository reviewLogRepository;

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
        String normalizedCharacterText = normalizeRequiredText(createDto.getCharacterText(), "生字不能为空");
        createDto.setCharacterText(normalizedCharacterText);
        createDto.setPinyin(normalizeOptionalText(createDto.getPinyin()));

        Optional<CharacterCard> existing = characterCardRepository.findByCharacterText(normalizedCharacterText);
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

        String normalizedCharacterText = normalizeRequiredText(updateDto.getCharacterText(), "生字不能为空");
        updateDto.setCharacterText(normalizedCharacterText);
        updateDto.setPinyin(normalizeOptionalText(updateDto.getPinyin()));

        Optional<CharacterCard> duplicate = characterCardRepository.findByCharacterText(normalizedCharacterText);
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
    @Transactional
    public void delete(String userId, String id) {
        CharacterCard card = characterCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("生字不存在"));

        groupObjRelaRepository.deleteByObjId(id);
        tagObjRelaRepository.deleteByObjId(id);
        characterCardRepository.delete(card);
    }

    @Override
    public CharacterCardDto get(String userId, String id) {
        CharacterCard card = characterCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("生字不存在"));
        return convertToDto(card, true);
    }

    @Override
    public List<CharacterCardDto> list(String userId) {
        return convertToDtos(characterCardRepository.findAll());
    }

    @Override
    @Transactional
    public void archive(String userId, String id, boolean archived) {
        CharacterCard card = characterCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("生字不存在"));

        card.setArchived(archived);
        characterCardRepository.save(card);
    }

    @Override
    @Transactional
    public void reset(String userId, String id) {
        CharacterCard card = characterCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("生字不存在"));

        card.setEasinessFactor(2.5);
        card.setInterval(0);
        card.setRepetition(0);
        card.setNextReviewDate(LocalDateTime.now().plusDays(1));
        card.setLastScore(null);

        characterCardRepository.save(card);
        log.info("生字 {} 已重置学习状态", card.getId());
    }

    @Override
    public List<CharacterCardDto> getDueToday(String userId) {
        LocalDateTime now = LocalDateTime.now();
        return characterCardRepository.findDueToday(now).stream()
                .map(card -> convertToDto(card, true))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ReviewResultDto review(String userId, ReviewRequestDto dto) {
        CharacterCard card = characterCardRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("生字不存在"));

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
            message = "继续加油！明天再来复习这个生字";
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

        CharacterCard saved = characterCardRepository.save(card);

        ReviewResultDto result = new ReviewResultDto();
        result.setId(saved.getId());
        result.setScore(dto.getScore());
        result.setNewEasinessFactor(newEF);
        result.setNewInterval(newInterval);
        result.setNewRepetition(newRepetition);
        result.setNextReviewDate(nextReview);
        result.setMessage(message);

        log.info("完成生字复习: 评分={}, 新EF={}, 新间隔={}天, 下次复习={}",
                dto.getScore(), newEF, newInterval, nextReview);

        return result;
    }

    @Override
    public List<ReviewLogDto> getReviewHistory(String userId, String cardId) {
        CharacterCard card = characterCardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("生字不存在"));

        return reviewLogRepository.findByObjId(card.getId()).stream()
                .map(this::convertToReviewLogDto)
                .collect(Collectors.toList());
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
