package com.ck.quiz.knowledgeset.service;

import java.io.InputStream;

public interface DocumentConverterService {
    
    /**
     * 将文档转换为纯文本
     *
     * @param inputStream 文档输入流
     * @param fileName    文件名 (用于识别类型)
     * @return 提取的文本内容
     */
    String convertToString(InputStream inputStream, String fileName);
}
