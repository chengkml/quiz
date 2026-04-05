package com.ck.quiz.controller;

import com.ck.quiz.controller.dto.DocumentConvertResponse;
import com.ck.quiz.knowledgeset.service.DocumentConverterService;
import com.ck.quiz.service.converter.DocumentConverter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/convert")
@RequiredArgsConstructor
@Tag(name = "Document Conversion", description = "Convert documents to Markdown")
public class DocumentConversionController {

    private final List<DocumentConverter> converters;
    private final DocumentConverterService documentConverterService;
    private final Tika tika = new Tika();

    @PostMapping(value = "/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Convert document file to Markdown")
    public ResponseEntity<DocumentConvertResponse> convertDocument(@RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException("File is required");
            }

            String originalFileName = file.getOriginalFilename() == null ? "document" : file.getOriginalFilename();
            String mediaType = detectMediaType(file);
            log.info("Detected media type for file {}: {}", originalFileName, mediaType);

            DocumentConvertResponse response = new DocumentConvertResponse();
            response.setFileName(originalFileName);
            response.setMediaType(mediaType);
            response.setWarnings(new ArrayList<>());
            response.setMarkdown(convertToMarkdown(file, originalFileName, mediaType, response.getWarnings()));

            if (response.getMarkdown().isBlank()) {
                response.getWarnings().add("未提取到有效内容，请检查文件是否为空、为扫描件，或当前格式是否仅能提取纯文本。");
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to convert document", e);
            throw new RuntimeException("Conversion failed: " + e.getMessage());
        }
    }

    private String convertToMarkdown(MultipartFile file, String originalFileName, String mediaType, List<String> warnings)
            throws Exception {
        DocumentConverter converter = converters.stream()
                .filter(c -> c.supports(mediaType))
                .findFirst()
                .orElse(null);

        if (converter != null) {
            try (InputStream inputStream = file.getInputStream()) {
                return normalizeMarkdown(converter.convert(inputStream));
            } catch (Exception ex) {
                log.warn("Specific converter failed for file {}, fallback to tika text extraction", originalFileName, ex);
                warnings.add("当前格式未命中结构化 Markdown 转换，已降级为文本提取结果。");
            }
        } else {
            warnings.add("当前格式未命中专用转换器，已降级为文本提取结果。");
        }

        try (InputStream inputStream = file.getInputStream()) {
            return normalizeMarkdown(documentConverterService.convertToString(inputStream, originalFileName));
        }
    }

    private String detectMediaType(MultipartFile file) throws Exception {
        try (InputStream inputStream = file.getInputStream()) {
            String detected = tika.detect(inputStream, file.getOriginalFilename());
            if (detected != null && !detected.isBlank()) {
                return detected;
            }
        }

        if (file.getContentType() != null && !file.getContentType().isBlank()) {
            return file.getContentType();
        }

        return MediaType.APPLICATION_OCTET_STREAM_VALUE;
    }

    private String normalizeMarkdown(String markdown) {
        if (markdown == null) {
            return "";
        }

        String normalized = markdown.replace("\r\n", "\n").replace('\r', '\n').trim();
        return normalized.isEmpty() ? "" : normalized + "\n";
    }
}
