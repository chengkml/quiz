package com.ck.quiz.ocr.service.impl;

import com.ck.quiz.ocr.service.OcrService;
import org.springframework.stereotype.Service;

import com.ck.quiz.llmmodel.entity.LLMModel;
import com.ck.quiz.llmmodel.repository.LLMModelRepository;

import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import java.io.*;

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

@lombok.extern.slf4j.Slf4j
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
                            .doOnSubscribe(s -> log.info("[OCR] Stream generation started"))
                            .doOnNext(chunk -> {
                                log.info("[OCR] Received chunk: {}", chunk);
                                try {
                                    emitter.send(chunk);
                                    fullContent.append(chunk);
                                } catch (Exception e) {
                                    // ignore individual send errors
                                    log.error("[OCR] Error sending chunk", e);
                                }
                            })
                            .doOnError(err -> log.error("[OCR] Stream error", err))
                            .doOnComplete(() -> log.info("[OCR] Stream completion"))
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

    /**
     * 自然排序 Comparator，确保 10.jpg 排在 2.jpg 后面
     */
    private Comparator<Path> getNaturalSortComparator() {
        Pattern numberPattern = Pattern.compile("([0-9]+)");
        return (p1, p2) -> {
            String name1 = p1.getFileName().toString();
            String name2 = p2.getFileName().toString();
            
            String[] parts1 = numberPattern.split(name1);
            String[] parts2 = numberPattern.split(name2);
            
            List<Object> list1 = new ArrayList<>();
            List<Object> list2 = new ArrayList<>();
            
            // 分割并转换：数字转为Integer，文字保持String
            for (String part : parts1) {
                if (part.matches("[0-9]+")) {
                    list1.add(Integer.parseInt(part));
                } else if (!part.isEmpty()) {
                    list1.add(part.toLowerCase());
                }
            }
            for (String part : parts2) {
                if (part.matches("[0-9]+")) {
                    list2.add(Integer.parseInt(part));
                } else if (!part.isEmpty()) {
                    list2.add(part.toLowerCase());
                }
            }
            
            // 逐项比较
            for (int i = 0; i < Math.min(list1.size(), list2.size()); i++) {
                Object obj1 = list1.get(i);
                Object obj2 = list2.get(i);
                
                if (obj1 instanceof Integer && obj2 instanceof Integer) {
                    int cmp = ((Integer) obj1).compareTo((Integer) obj2);
                    if (cmp != 0) return cmp;
                } else if (obj1 instanceof String && obj2 instanceof String) {
                    int cmp = ((String) obj1).compareTo((String) obj2);
                    if (cmp != 0) return cmp;
                } else {
                    // 数字优先于字符
                    if (obj1 instanceof Integer) return -1;
                    if (obj2 instanceof Integer) return 1;
                }
            }
            return Integer.compare(list1.size(), list2.size());
        };
    }

    /**
     * 处理单张图片文件，转换为Markdown
     * @param imagePath 源图片路径
     * @param outputPath 输出Markdown文件路径
     * @param modelName 指定模型名称（可为null使用默认模型）
     * @return 处理结果信息
     */
    private String processImageFile(Path imagePath, Path outputPath, String modelName) {
        try {
            // 断点续传逻辑
            if (Files.exists(outputPath)) {
                return "  ⏭️ 跳过已存在文件: " + imagePath.getFileName();
            }

            // 创建输出目录
            Files.createDirectories(outputPath.getParent());

            // 读取图片文件为字节数组，转换为MultipartFile
            byte[] imageBytes = Files.readAllBytes(imagePath);
            String filename = imagePath.getFileName().toString();
            
            // 创建简单的MultipartFile实现
            MultipartFile multipartFile = new ByteArrayMultipartFile(imageBytes, filename);

            // 调用已有的recognize方法处理图片
            String result = recognize(multipartFile, modelName);

            // 写入输出Markdown文件
            if (result != null && !result.isEmpty()) {
                Files.write(outputPath, result.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                return "  ✅ 成功处理: " + imagePath.getFileName();
            } else {
                return "  ⚠️ 处理结果为空: " + imagePath.getFileName();
            }

        } catch (Exception e) {
            return "  ❌ 处理失败 " + imagePath.getFileName() + ": " + e.getMessage();
        }
    }

    /**
     * 批量处理图片目录，使用线程池并发调用
     * @param sourceRoot 源图片根目录（包含多个子目录）
     * @param targetBase 输出Markdown基础目录
     * @param modelName 指定模型名称（可为null使用默认模型）
     * @param maxWorkers 线程池大小，默认为2
     */
    public void batchRecognize(String sourceRoot, String targetBase, String modelName, int maxWorkers) {
        Path sourceRootPath = Paths.get(sourceRoot);
        Path targetBasePath = Paths.get(targetBase);

        if (!Files.isDirectory(sourceRootPath)) {
            log.error("❌ 错误: 未找到源目录 {}", sourceRoot);
            return;
        }

        try {
            // 收集所有待处理任务
            List<Pair<Path, Path>> tasks = new ArrayList<>();
            
            // 遍历源根目录的所有子目录
            try (Stream<Path> stream = Files.list(sourceRootPath)) {
                stream.filter(Files::isDirectory)
                      .sorted()
                      .forEach(subdir -> {
                    Path currentTargetDir = targetBasePath.resolve(subdir.getFileName());
                    
                    try {
                        // 获取该子目录下的所有图片文件，并自然排序
                        try (Stream<Path> imageStream = Files.list(subdir)
                                .filter(p -> {
                                    String ext = getFileExtension(p).toLowerCase();
                                    return ext.matches("(jpg|jpeg|png|gif)");
                                })
                                .sorted(getNaturalSortComparator())) {
                            
                            imageStream.forEach(imagePath -> {
                                String stem = getFileStem(imagePath);
                                Path outputFile = currentTargetDir.resolve(stem + ".md");
                                
                                // 过滤已存在的文件，减少线程池任务
                                if (!Files.exists(outputFile)) {
                                    tasks.add(new Pair<>(imagePath, outputFile));
                                } else {
                                    log.info("  ⏭️ 跳过已存在文件: {}", imagePath.getFileName());
                                }
                            });
                        }
                    } catch (Exception e) {
                        log.error("扫描目录 {} 失败: {}", subdir, e.getMessage());
                    }
                });
            }

            log.info("\n🚀 启动并发处理，线程数: {}，总任务数: {}", maxWorkers, tasks.size());

            // 使用线程池执行任务
            ExecutorService executor = Executors.newFixedThreadPool(maxWorkers);
            List<Future<String>> futures = new ArrayList<>();

            // 提交所有任务
            for (Pair<Path, Path> task : tasks) {
                futures.add(executor.submit(() -> processImageFile(task.first, task.second, modelName)));
            }

            // 实时打印每个任务的结果
            for (Future<String> future : futures) {
                try {
                    String result = future.get(); // 阻塞等待完成
                    log.info(result);
                    System.out.println(result);
                } catch (Exception e) {
                    log.error("任务执行出错: {}", e.getMessage(), e);
                }
            }

            executor.shutdown();
            log.info("✅ 所有任务处理完成");

        } catch (Exception e) {
            log.error("批量处理异常: {}", e.getMessage(), e);
        }
    }

    /**
     * 批量处理的便捷方法（使用默认2个线程）
     */
    public void batchRecognize(String sourceRoot, String targetBase, String modelName) {
        batchRecognize(sourceRoot, targetBase, modelName, 2);
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(Path path) {
        String filename = path.getFileName().toString();
        int lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot + 1) : "";
    }

    /**
     * 获取文件名（不含扩展名）
     */
    private String getFileStem(Path path) {
        String filename = path.getFileName().toString();
        int lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(0, lastDot) : filename;
    }

    /**
     * 简单的Pair类用于存储图片路径对
     */
    private static class Pair<K, V> {
        K first;
        V second;
        Pair(K first, V second) {
            this.first = first;
            this.second = second;
        }
    }

    /**
     * MultipartFile的简单实现，用于将字节数组转换为MultipartFile
     */
    private static class ByteArrayMultipartFile implements MultipartFile {
        private final byte[] data;
        private final String name;

        public ByteArrayMultipartFile(byte[] data, String name) {
            this.data = data;
            this.name = name;
        }

        @Override
        public String getName() {
            return name;
        }

        @Override
        public String getOriginalFilename() {
            return name;
        }

        @Override
        public String getContentType() {
            String ext = name.substring(name.lastIndexOf('.') + 1).toLowerCase();
            return "image/" + (ext.equals("jpg") || ext.equals("jpeg") ? "jpeg" : ext);
        }

        @Override
        public boolean isEmpty() {
            return data.length == 0;
        }

        @Override
        public long getSize() {
            return data.length;
        }

        @Override
        public byte[] getBytes() {
            return data;
        }

        @Override
        public InputStream getInputStream() {
            return new java.io.ByteArrayInputStream(data);
        }

        @Override
        public void transferTo(File dest) throws IOException, IllegalStateException {
            Files.write(dest.toPath(), data);
        }

        @Override
        public void transferTo(Path dest) throws IOException, IllegalStateException {
            Files.write(dest, data);
        }
    }

}