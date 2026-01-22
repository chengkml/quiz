package com.ck.quiz.knowledgeset.service;

import java.util.List;

public interface DocumentSplitterService {
    
    /**
     * 按 Token 切分文本
     *
     * @param text      原始文本
     * @param chunkSize 块大小 (Token数)
     * @param overlap   重叠大小 (Token数)
     * @return 切分后的文本列表
     */
    List<String> splitByToken(String text, int chunkSize, int overlap);

    /**
     * 按字符数切分文本 (备用)
     *
     * @param text      原始文本
     * @param chunkSize 块大小 (字符数)
     * @param overlap   重叠大小 (字符数)
     * @return 切分后的文本列表
     */
    List<String> splitByCharacter(String text, int chunkSize, int overlap);

    /**
     * 按段落切分
     *
     * @param text         原始文本
     * @param maxChunkSize 最大块大小 (字符数)
     * @param overlap      重叠大小 (字符数)
     * @return 切分后的文本列表
     */
    List<String> splitByParagraph(String text, int maxChunkSize, int overlap);

    /**
     * 按 Markdown 标题结构切分
     *
     * @param text 原始文本
     * @return 切分后的文本列表 (每个标题块为一个 Chunk)
     */
    List<String> splitByMarkdownHeader(String text);

    /**
     * 表格/结构化内容切分 (保持表格完整性)
     *
     * @param text 原始文本
     * @return 切分后的文本列表
     */
    List<String> splitTables(String text);

    /**
     * 语义相似度切分
     *
     * @param text      原始文本
     * @param modelName 嵌入模型名称
     * @param threshold 相似度阈值 (0-1, 越小切分越细)
     * @return 切分后的文本列表
     */
    List<String> splitBySemanticSimilarity(String text, String modelName, double threshold);

    /**
     * LLM 驱动切分
     *
     * @param text      原始文本
     * @param modelName 聊天模型名称
     * @return 切分后的文本列表
     */
    List<String> splitByLLM(String text, String modelName);
}
