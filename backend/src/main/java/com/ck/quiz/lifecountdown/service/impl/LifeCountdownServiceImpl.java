package com.ck.quiz.lifecountdown.service.impl;

import com.ck.quiz.lifecountdown.dto.LifeCountdownGenerateWarningDto;
import com.ck.quiz.lifecountdown.dto.LifeCountdownProfileDto;
import com.ck.quiz.lifecountdown.dto.LifeCountdownSaveDto;
import com.ck.quiz.lifecountdown.dto.LifeCountdownWarningDto;
import com.ck.quiz.lifecountdown.entity.LifeCountdownProfile;
import com.ck.quiz.lifecountdown.repository.LifeCountdownProfileRepository;
import com.ck.quiz.lifecountdown.service.LifeCountdownService;
import com.ck.quiz.llmmodel.service.LLMModelService;
import com.ck.quiz.prompt.dto.PromptTemplateDto;
import com.ck.quiz.prompt.service.PromptTemplateService;
import com.ck.quiz.utils.IdHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class LifeCountdownServiceImpl implements LifeCountdownService {

    private static final String PROMPT_TEMPLATE_NAME = "lifeCountdownWarningGenerate";
    private static final String FALLBACK_WARNING = "今天别再拿未来下注，你剩下的时间正在按秒结算。";

    private final LifeCountdownProfileRepository profileRepository;
    private final PromptTemplateService promptTemplateService;
    private final LLMModelService llmModelService;

    @Override
    @Transactional(readOnly = true)
    public LifeCountdownProfileDto getCurrentProfile(String userId) {
        validateUserId(userId);
        return profileRepository.findFirstByCreateUser(userId)
                .map(this::toProfileDto)
                .orElseGet(LifeCountdownProfileDto::new);
    }

    @Override
    @Transactional
    public LifeCountdownProfileDto saveProfile(String userId, LifeCountdownSaveDto dto) {
        validateUserId(userId);
        if (dto == null || dto.getDeathDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "死亡日期不能为空");
        }
        validateDeathDate(dto.getDeathDate());

        LifeCountdownProfile profile = profileRepository.findFirstByCreateUser(userId)
                .orElseGet(this::newProfile);

        boolean deathDateChanged = !Objects.equals(profile.getDeathDate(), dto.getDeathDate());
        profile.setDeathDate(dto.getDeathDate());
        if (deathDateChanged) {
            clearWarningCache(profile);
        }

        return toProfileDto(profileRepository.save(profile));
    }

    @Override
    @Transactional
    public LifeCountdownWarningDto generateTodayWarning(String userId, LifeCountdownGenerateWarningDto dto) {
        validateUserId(userId);
        LifeCountdownProfile profile = profileRepository.findFirstByCreateUser(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "请先设置死亡日期"));
        if (profile.getDeathDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请先设置死亡日期");
        }
        if (profile.getDeathDate().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "死亡日期已过，请先重新设置");
        }

        LocalDate today = LocalDate.now();
        boolean forceRefresh = dto != null && Boolean.TRUE.equals(dto.getForceRefresh());
        if (!forceRefresh
                && today.equals(profile.getTodayWarningDate())
                && StringUtils.hasText(profile.getTodayWarningText())) {
            return toWarningDto(profile, true);
        }

        String requestedModelName = dto == null ? null : normalizeText(dto.getModelName());
        OpenAiChatModel chatModel = llmModelService.getChatModel(requestedModelName);
        ChatClient chatClient = ChatClient.builder(chatModel).build();

        String prompt = buildWarningPrompt(profile);
        String generatedContent = chatClient.prompt(prompt).call().content();
        String normalizedWarning = normalizeWarningText(generatedContent);

        profile.setTodayWarningText(normalizedWarning);
        profile.setTodayWarningDate(today);
        profile.setTodayWarningGeneratedAt(LocalDateTime.now());
        profile.setTodayWarningModel(resolveModelName(requestedModelName, chatModel));
        LifeCountdownProfile saved = profileRepository.save(profile);

        return toWarningDto(saved, false);
    }

    private LifeCountdownProfile newProfile() {
        LifeCountdownProfile profile = new LifeCountdownProfile();
        profile.setId(IdHelper.genUuid());
        return profile;
    }

    private void clearWarningCache(LifeCountdownProfile profile) {
        profile.setTodayWarningDate(null);
        profile.setTodayWarningText(null);
        profile.setTodayWarningGeneratedAt(null);
        profile.setTodayWarningModel(null);
    }

    private void validateUserId(String userId) {
        if (!StringUtils.hasText(userId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "当前用户未登录");
        }
    }

    private void validateDeathDate(LocalDate deathDate) {
        if (deathDate.isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "死亡日期不能早于今天");
        }
    }

    private String buildWarningPrompt(LifeCountdownProfile profile) {
        long remainingDays = Math.max(0, ChronoUnit.DAYS.between(LocalDate.now(), profile.getDeathDate()));
        try {
            PromptTemplateDto promptTemplate = promptTemplateService.getByName(PROMPT_TEMPLATE_NAME);
            return promptTemplate.getContent()
                    .replace("{{currentDateTime}}", LocalDateTime.now().toString())
                    .replace("{{deathDate}}", profile.getDeathDate().toString())
                    .replace("{{remainingDays}}", String.valueOf(remainingDays));
        } catch (Exception ex) {
            log.warn("lifeCountdownWarningGenerate not found, use fallback prompt");
            return "请基于以下信息生成一句冷静、克制、促行动的中文今日警示语，"
                    + "只输出一句话，不要标题、解释、序号和引号，不要鼓励自伤或绝望。"
                    + "当前时间：" + LocalDateTime.now()
                    + "；死亡日期：" + profile.getDeathDate()
                    + "；剩余天数：" + remainingDays;
        }
    }

    private String normalizeWarningText(String content) {
        String normalized = normalizeText(content);
        if (!StringUtils.hasText(normalized)) {
            return FALLBACK_WARNING;
        }
        normalized = normalized
                .replace("\r", " ")
                .replace("\n", " ")
                .replaceAll("\\s+", " ")
                .replaceAll("^[\"“”'`]+", "")
                .replaceAll("[\"“”'`]+$", "")
                .trim();
        if (!StringUtils.hasText(normalized)) {
            return FALLBACK_WARNING;
        }
        if (normalized.length() > 80) {
            normalized = normalized.substring(0, 80).trim();
        }
        return normalized;
    }

    private String normalizeText(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private String resolveModelName(String requestedModelName, OpenAiChatModel chatModel) {
        if (StringUtils.hasText(requestedModelName)) {
            return requestedModelName;
        }
        if (chatModel != null && chatModel.getDefaultOptions() != null) {
            return chatModel.getDefaultOptions().getModel();
        }
        return null;
    }

    private LifeCountdownProfileDto toProfileDto(LifeCountdownProfile profile) {
        LifeCountdownProfileDto dto = new LifeCountdownProfileDto();
        dto.setId(profile.getId());
        dto.setCreateDate(profile.getCreateDate());
        dto.setCreateUser(profile.getCreateUser());
        dto.setUpdateDate(profile.getUpdateDate());
        dto.setUpdateUser(profile.getUpdateUser());
        dto.setDeathDate(profile.getDeathDate());
        dto.setTodayWarningDate(profile.getTodayWarningDate());
        dto.setTodayWarningText(profile.getTodayWarningText());
        dto.setTodayWarningGeneratedAt(profile.getTodayWarningGeneratedAt());
        dto.setTodayWarningModel(profile.getTodayWarningModel());
        return dto;
    }

    private LifeCountdownWarningDto toWarningDto(LifeCountdownProfile profile, boolean cached) {
        LifeCountdownWarningDto dto = new LifeCountdownWarningDto();
        dto.setWarningText(profile.getTodayWarningText());
        dto.setWarningDate(profile.getTodayWarningDate());
        dto.setGeneratedAt(profile.getTodayWarningGeneratedAt());
        dto.setModelName(profile.getTodayWarningModel());
        dto.setCached(cached);
        return dto;
    }
}
