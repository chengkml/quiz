package com.ck.quiz.llmmodel.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.llmmodel.dto.LLMModelCreateDto;
import com.ck.quiz.llmmodel.dto.LLMModelDto;
import com.ck.quiz.llmmodel.dto.LLMModelQueryDto;
import com.ck.quiz.llmmodel.dto.LLMModelUpdateDto;
import com.ck.quiz.llmmodel.entity.LLMModel;
import com.ck.quiz.llmmodel.service.LLMModelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.content.Media;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Tag(name = "大语言模型管理", description = "大语言模型相关API")
@RestController
@RequestMapping("/api/llm-model")
public class LLMModelController extends BaseController<LLMModelCreateDto, LLMModelUpdateDto, LLMModelQueryDto, LLMModelDto> {

    private LLMModelService modelService;

    public LLMModelController(LLMModelService modelService) {
        this.modelService = modelService;
    }

    @Override
    protected LLMModelService getService() {
        return modelService;
    }

    @Operation(summary = "按类型获取模型列表")
    @GetMapping("/list-by-type/{type}")
    public List<LLMModelDto> listModelsByType(
            @Parameter(description = "模型类型", required = true)
            @PathVariable("type") String type) {
        return modelService.listModelsByType(LLMModel.ModelType.valueOf(type));
    }

    @Operation(summary = "设置默认模型")
    @PutMapping("/{id}/set-default")
    public void setDefaultModel(
            @Parameter(description = "模型ID", required = true)
            @PathVariable("id") String id) {
        modelService.setDefaultModel(id);
    }


    @Operation(summary = "多模态测试", description = "上传图片并使用指定模型进行图文理解测试")
    @PostMapping(path = "/{id}/test-multimodal", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> testMultimodal(
            @Parameter(description = "模型ID", required = true) @PathVariable("id") String id,
            @RequestParam("prompt") String prompt,
            @RequestPart("image") MultipartFile image) {
        if (!StringUtils.hasText(prompt)) {
            throw new IllegalArgumentException("测试提示词不能为空");
        }
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("请上传测试图片");
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication != null ? authentication.getName() : null;
        LLMModelDto model = modelService.get(userId, id);
        if (model == null) {
            throw new IllegalArgumentException("模型不存在");
        }

        LLMModel.ModelType type = model.getType();
        if (type != LLMModel.ModelType.VISION && type != LLMModel.ModelType.IMAGE) {
            throw new IllegalArgumentException("当前模型类型不支持多模态测试");
        }

        OpenAiChatModel chatModel = modelService.getChatModel(model.getName());
        ChatClient chatClient = ChatClient.builder(chatModel).build();

        UserMessage userMessage = UserMessage.builder()
                .text(prompt)
                .media(resolveImageMedia(image))
                .build();

        String content = chatClient.prompt().messages(userMessage).call().content();

        Map<String, Object> result = new HashMap<>();
        result.put("modelName", model.getName());
        result.put("content", content);
        return ResponseEntity.ok(result);
    }

    private Media resolveImageMedia(MultipartFile image) {
        String contentType = image.getContentType() == null ? "" : image.getContentType().toLowerCase();
        String filename = image.getOriginalFilename() == null ? "" : image.getOriginalFilename().toLowerCase();

        if (contentType.contains("png") || filename.endsWith(".png")) {
            return new Media(Media.Format.IMAGE_PNG, image.getResource());
        }
        if (contentType.contains("gif") || filename.endsWith(".gif")) {
            return new Media(Media.Format.IMAGE_GIF, image.getResource());
        }
        return new Media(Media.Format.IMAGE_JPEG, image.getResource());
    }
}