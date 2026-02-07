package com.ck.quiz.service.converter;

import java.io.InputStream;

public interface DocumentConverter {
    /**
     * Convert document stream to Markdown string
     * 
     * @param inputStream input stream of the document
     * @return markdown content
     */
    String convert(InputStream inputStream) throws Exception;

    /**
     * Check if the converter supports the given media type
     * 
     * @param mediaType media type (MIME type)
     * @return true if supported
     */
    boolean supports(String mediaType);
}
