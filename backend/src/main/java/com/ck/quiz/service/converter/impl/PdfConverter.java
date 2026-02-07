package com.ck.quiz.service.converter.impl;

import com.ck.quiz.service.converter.DocumentConverter;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.Set;

import org.apache.pdfbox.io.RandomAccessReadBuffer;

@Component
public class PdfConverter implements DocumentConverter {

    private static final Set<String> SUPPORTED_TYPES = Set.of(
            "application/pdf");

    @Override
    public String convert(InputStream inputStream) throws Exception {
        // PDFBox 3.x requires RandomAccessRead
        try (PDDocument document = Loader.loadPDF(new RandomAccessReadBuffer(inputStream))) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true); // Attempt to keep layout
            return stripper.getText(document);
        }
    }

    @Override
    public boolean supports(String mediaType) {
        return SUPPORTED_TYPES.contains(mediaType);
    }
}
