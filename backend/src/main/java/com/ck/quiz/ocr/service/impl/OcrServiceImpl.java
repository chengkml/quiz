package com.ck.quiz.ocr.service.impl;

import com.ck.quiz.ocr.service.OcrService;
import org.springframework.stereotype.Service;

import com.ck.quiz.llmmodel.entity.LLMModel;
import com.ck.quiz.llmmodel.repository.LLMModelRepository;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.content.Media;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import com.ck.quiz.prompt.service.PromptTemplateService;
import com.ck.quiz.prompt.dto.PromptTemplateDto;

@Service
public class OcrServiceImpl implements OcrService {

    @Autowired
    private LLMModelRepository llmModelRepository;

    @Autowired
    private PromptTemplateService promptTemplateService;

    /**
     * 按名称或默认视觉模型解析配置
     */
    private LLMModel resolveModel(String modelName) {
        if (modelName != null && !modelName.isBlank()) {
            return llmModelRepository.findByName(modelName).orElse(null);
        } else {
            return llmModelRepository.findByTypeAndIsDefault(LLMModel.ModelType.VISION, "1").orElse(null);
        }
    }

    @Override
    public String recognize(MultipartFile file, String modelName) throws Exception {
        if (file == null || file.isEmpty()) {
            return "";
        }

        LLMModel model = resolveModel(modelName);
        if (model == null) {
            throw new RuntimeException("未找到可用的视觉模型，请在模型管理中配置一个默认视觉模型或指定模型名");
        }

        byte[] bytes = file.getBytes();
        String base64 = java.util.Base64.getEncoder().encodeToString(bytes);

        String originalFilename = file.getOriginalFilename();
        String ext = "png";
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
        }

        // 必须从提示词模板表读取模板 name = 'ocrRecognize'
        PromptTemplateDto tpl = promptTemplateService.getByName("ocrRecognize");
        if (tpl == null || tpl.getContent() == null || tpl.getContent().isBlank()) {
            throw new RuntimeException("未找到提示词模板 ocrRecognize，请在提示词管理中配置");
        }

        String prompt = tpl.getContent();
        // 替换常用占位符
        prompt = prompt.replace("{{imageBase64}}", base64)
                .replace("{{image}}", "data:image/" + ext + ";base64," + base64)
                .replace("{{base64}}", base64)
                .replace("{{imageData}}", "data:image/" + ext + ";base64," + base64)
                .replace("{{modelName}}", model.getName() == null ? "" : model.getName());

        OpenAiApi openAiApi = OpenAiApi.builder()
                .apiKey(model.getApiKey())
                .baseUrl(model.getApiEndpoint())
                .build();

        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .model(model.getName())
                .build();

        OpenAiChatModel chatModel = OpenAiChatModel.builder()
                .openAiApi(openAiApi)
                .defaultOptions(options)
                .build();

        ChatClient chat = ChatClient.builder(chatModel).build();

        String resp = chat.prompt(prompt).call().content();
        return resp != null ? resp.trim() : "";
    }

    @Override
    public SseEmitter recognizeStream(MultipartFile file, String modelName)
            throws Exception {
        SseEmitter emitter = new SseEmitter(0L);
        new Thread(() -> {
            try {
                if (file == null || file.isEmpty()) {
                    emitter.send("");
                    emitter.complete();
                    return;
                }

                LLMModel model = resolveModel(modelName);
                if (model == null) {
                    emitter.send("[ERROR]未找到可用的视觉模型，请在模型管理中配置一个默认视觉模型或指定模型名");
                    emitter.completeWithError(new RuntimeException("未找到可用的视觉模型"));
                    return;
                }

                // 必须从提示词模板表读取模板 name = 'ocrRecognize'
                PromptTemplateDto tpl = null;
                try {
                    tpl = promptTemplateService.getByName("ocrRecognize");
                } catch (Exception e) {
                    // allow handling below
                }
                if (tpl == null || tpl.getContent() == null || tpl.getContent().isBlank()) {
                    try {
                        emitter.send("[ERROR]未找到提示词模板 ocrRecognize，请在提示词管理中配置");
                    } catch (Exception ex) {
                        // ignore
                    }
                    emitter.completeWithError(new RuntimeException("未找到提示词模板 ocrRecognize"));
                    return;
                }

                String prompt = tpl.getContent();

                OpenAiApi openAiApi = OpenAiApi.builder()
                        .apiKey(model.getApiKey())
                        .baseUrl(model.getApiEndpoint())
                        .build();

                OpenAiChatOptions options = OpenAiChatOptions.builder()
                        .model(model.getName())
                        .build();

                OpenAiChatModel chatModel = OpenAiChatModel.builder()
                        .openAiApi(openAiApi)
                        .defaultOptions(options)
                        .build();

                ChatClient chat = ChatClient.builder(chatModel).build();

                StringBuilder fullContent = new StringBuilder();
                try {
                    String originalFilename = file.getOriginalFilename();
                    String ext = "jpg";
                    if (originalFilename != null && originalFilename.contains(".")) {
                        ext = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
                    }

                    Media image;
                    if ("png".equals(ext)) {
                        image = new Media(Media.Format.IMAGE_PNG, file.getResource());
                    } else if ("gif".equals(ext)) {
                        image = new Media(Media.Format.IMAGE_GIF, file.getResource());
                    } else if ("jpg".equals(ext) || "jpeg".equals(ext)) {
                        image = new Media(Media.Format.IMAGE_JPEG, file.getResource());
                    } else {
                        String contentType = file.getContentType();
                        if (contentType != null && contentType.contains("png")) {
                            image = new Media(Media.Format.IMAGE_PNG, file.getResource());
                        } else if (contentType != null && contentType.contains("gif")) {
                            image = new Media(Media.Format.IMAGE_GIF, file.getResource());
                        } else {
                            image = new Media(Media.Format.IMAGE_JPEG, file.getResource());
                        }
                    }
                    UserMessage message = UserMessage.builder()
                            .text(prompt)
                            .media(image)
                            .build();
                    chat.prompt()
                            .messages(message)
                            .stream()
                            .content()
                            .doOnNext(chunk -> {
                                try {
                                    emitter.send(chunk);
                                    fullContent.append(chunk);
                                } catch (Exception e) {
                                    // ignore individual send errors
                                }
                            })
                            .blockLast();

                    // 最终发送完整结果标记
                    try {
                        emitter.send("[PARSE_RESULT]");
                    } catch (Exception e) {
                        // ignore
                    }
                    emitter.complete();
                } catch (Exception e) {
                    try {
                        emitter.send("[ERROR]" + e.getMessage());
                    } catch (Exception ex) {
                        // ignore
                    }
                    emitter.completeWithError(e);
                }
            } catch (Exception outer) {
                try {
                    emitter.send("[ERROR]" + outer.getMessage());
                } catch (Exception ex) {
                    // ignore
                }
                emitter.completeWithError(outer);
            }
        }).start();

        return emitter;
    }

}