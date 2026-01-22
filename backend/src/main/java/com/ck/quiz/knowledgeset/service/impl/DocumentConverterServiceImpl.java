package com.ck.quiz.knowledgeset.service.impl;

import com.ck.quiz.knowledgeset.service.DocumentConverterService;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.metadata.TikaCoreProperties;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.sax.BodyContentHandler;
import org.springframework.stereotype.Service;

import java.io.InputStream;

@Slf4j
@Service
public class DocumentConverterServiceImpl implements DocumentConverterService {

    @Override
    public String convertToString(InputStream inputStream, String fileName) {
        try {
            AutoDetectParser parser = new AutoDetectParser();
            BodyContentHandler handler = new BodyContentHandler(-1); // -1: disable write limit
            Metadata metadata = new Metadata();
            metadata.add(TikaCoreProperties.RESOURCE_NAME_KEY, fileName);
            
            parser.parse(inputStream, handler, metadata, new ParseContext());
            
            return handler.toString();
        } catch (Exception e) {
            log.error("Failed to parse document: {}", fileName, e);
            throw new RuntimeException("文档解析失败: " + e.getMessage(), e);
        }
    }
}
