package com.ck.quiz.service.converter.impl;

import com.ck.quiz.service.converter.DocumentConverter;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Set;

@Component
public class TextConverter implements DocumentConverter {

    private static final Set<String> SUPPORTED_TYPES = Set.of(
            "text/plain",
            "text/markdown",
            "text/x-markdown",
            "text/x-web-markdown",
            "application/markdown");

    @Override
    public String convert(InputStream inputStream) throws Exception {
        return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
    }

    @Override
    public boolean supports(String mediaType) {
        return SUPPORTED_TYPES.contains(mediaType);
    }
}
