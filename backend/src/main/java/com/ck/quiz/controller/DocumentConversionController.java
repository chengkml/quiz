package com.ck.quiz.controller;

import com.ck.quiz.service.converter.DocumentConverter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/convert")
@RequiredArgsConstructor
@Tag(name = "Document Conversion", description = "Convert documents to Markdown")
public class DocumentConversionController {

    private final List<DocumentConverter> converters;
    private final Tika tika = new Tika();

    @PostMapping(value = "/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Convert document file to Markdown")
    public Map<String, String> convertDocument(@RequestParam("file") MultipartFile file) {
        Map<String, String> result = new HashMap<>();

        try {
            String mediaType = tika.detect(file.getInputStream(), file.getOriginalFilename());
            log.info("Detected media type for file {}: {}", file.getOriginalFilename(), mediaType);

            DocumentConverter converter = converters.stream()
                    .filter(c -> c.supports(mediaType))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Unsupported media type: " + mediaType));

            try (InputStream inputStream = file.getInputStream()) {
                String markdown = converter.convert(inputStream);
                result.put("markdown", markdown);
                result.put("mediaType", mediaType);
            }

        } catch (Exception e) {
            log.error("Failed to convert document", e);
            throw new RuntimeException("Conversion failed: " + e.getMessage());
        }

        return result;
    }
}
