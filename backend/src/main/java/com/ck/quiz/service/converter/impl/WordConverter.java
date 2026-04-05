package com.ck.quiz.service.converter.impl;

import com.ck.quiz.service.converter.DocumentConverter;
import com.vladsch.flexmark.html2md.converter.FlexmarkHtmlConverter;
import com.vladsch.flexmark.util.data.MutableDataSet;
import org.springframework.stereotype.Component;
import org.zwobble.mammoth.*;

import java.io.InputStream;
import java.util.Set;

@Component
public class WordConverter implements DocumentConverter {

    private static final Set<String> SUPPORTED_TYPES = Set.of(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
    );

    @Override
    public String convert(InputStream inputStream) throws Exception {
        // Convert Docx -> HTML -> Markdown using Mammoth
        org.zwobble.mammoth.DocumentConverter converter = new org.zwobble.mammoth.DocumentConverter();
        org.zwobble.mammoth.Result<String> result = converter.convertToHtml(inputStream);

        // Use Flexmark to convert HTML to Markdown
        String html = result.getValue();
        MutableDataSet options = new MutableDataSet();
        return FlexmarkHtmlConverter.builder(options).build().convert(html);
    }

    @Override
    public boolean supports(String mediaType) {
        return SUPPORTED_TYPES.contains(mediaType);
    }
}
