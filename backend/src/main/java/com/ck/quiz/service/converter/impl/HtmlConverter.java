package com.ck.quiz.service.converter.impl;

import com.ck.quiz.service.converter.DocumentConverter;
import com.vladsch.flexmark.html2md.converter.FlexmarkHtmlConverter;
import com.vladsch.flexmark.util.data.MutableDataSet;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Set;

@Component
public class HtmlConverter implements DocumentConverter {

    private static final Set<String> SUPPORTED_TYPES = Set.of(
            "text/html",
            "application/xhtml+xml");

    @Override
    public String convert(InputStream inputStream) throws Exception {
        // Parse HTML with Jsoup
        Document doc = Jsoup.parse(inputStream, StandardCharsets.UTF_8.name(), "");

        // Cleaning: Remove scripts, styles, and ads (simple heuristics)
        doc.select("script, style, link, meta, iframe, noscript").remove();
        doc.select(".ad, .advertisement, .ads, [id*=ad-], [class*=ad-]").remove(); // Basic ad noise removal

        // Convert cleaned HTML to Markdown
        MutableDataSet options = new MutableDataSet();
        return FlexmarkHtmlConverter.builder(options).build().convert(doc.html());
    }

    @Override
    public boolean supports(String mediaType) {
        return SUPPORTED_TYPES.contains(mediaType);
    }
}
