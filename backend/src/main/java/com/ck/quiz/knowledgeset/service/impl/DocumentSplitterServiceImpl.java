package com.ck.quiz.knowledgeset.service.impl;

import com.ck.quiz.knowledgeset.service.DocumentSplitterService;
import com.ck.quiz.llmmodel.service.LLMModelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.stereotype.Service;

import java.text.BreakIterator;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentSplitterServiceImpl implements DocumentSplitterService {

    private final LLMModelService llmModelService;

    @Override
    public List<String> splitByToken(String text, int chunkSize, int overlap) {
        if (text == null || text.isEmpty()) {
            return Collections.emptyList();
        }

        try {
            TokenTextSplitter splitter = new TokenTextSplitter(chunkSize, 10, 5, 10000, true);
            List<Document> documents = splitter.apply(Collections.singletonList(new Document(text)));
            return documents.stream()
                    .map(Document::getText)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error splitting text by token", e);
            return splitByCharacter(text, chunkSize * 4, overlap * 4);
        }
    }

    @Override
    public List<String> splitByCharacter(String text, int chunkSize, int overlap) {
        if (text == null || text.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> chunks = new ArrayList<>();
        int length = text.length();
        int start = 0;
        
        while (start < length) {
            int end = Math.min(start + chunkSize, length);
            chunks.add(text.substring(start, end));
            
            if (end == length) {
                break;
            }
            
            start += (chunkSize - overlap);
            
            if (chunkSize <= overlap) {
                start = end; 
            }
        }
        return chunks;
    }

    @Override
    public List<String> splitByParagraph(String text, int maxChunkSize, int overlap) {
        if (text == null || text.isEmpty()) return Collections.emptyList();

        // 简单按双换行符切分段落
        String[] paragraphs = text.split("\\n\\s*\\n");
        List<String> result = new ArrayList<>();
        StringBuilder currentChunk = new StringBuilder();

        for (String para : paragraphs) {
            if (currentChunk.length() + para.length() + 2 <= maxChunkSize) {
                if (currentChunk.length() > 0) currentChunk.append("\n\n");
                currentChunk.append(para);
            } else {
                if (currentChunk.length() > 0) {
                    result.add(currentChunk.toString());
                    // 处理 overlap: 取当前 chunk 的后 overlap 个字符作为下一个 chunk 的开始 (简化处理)
                    String overlapText = "";
                    if (overlap > 0 && currentChunk.length() > overlap) {
                        overlapText = currentChunk.substring(currentChunk.length() - overlap);
                    }
                    currentChunk = new StringBuilder(overlapText);
                }
                
                // 如果单个段落本身就超过 maxChunkSize，强制切分
                if (para.length() > maxChunkSize) {
                    List<String> subChunks = splitByCharacter(para, maxChunkSize, overlap);
                    result.addAll(subChunks);
                    // Reset current chunk
                    currentChunk = new StringBuilder();
                } else {
                     if (currentChunk.length() > 0) currentChunk.append("\n\n");
                    currentChunk.append(para);
                }
            }
        }
        if (currentChunk.length() > 0) {
            result.add(currentChunk.toString());
        }
        return result;
    }

    @Override
    public List<String> splitByMarkdownHeader(String text) {
        if (text == null || text.isEmpty()) return Collections.emptyList();

        // 匹配 Markdown 标题: 行首 # 开头
        Pattern pattern = Pattern.compile("(?m)^#{1,6}\\s+.*");
        Matcher matcher = pattern.matcher(text);

        List<String> chunks = new ArrayList<>();
        int lastStart = 0;

        while (matcher.find()) {
            int start = matcher.start();
            if (start > lastStart) {
                String chunk = text.substring(lastStart, start).trim();
                if (!chunk.isEmpty()) {
                    chunks.add(chunk);
                }
            }
            lastStart = start;
        }
        // 添加最后一段
        if (lastStart < text.length()) {
            String chunk = text.substring(lastStart).trim();
            if (!chunk.isEmpty()) {
                chunks.add(chunk);
            }
        }
        return chunks;
    }

    @Override
    public List<String> splitTables(String text) {
        if (text == null || text.isEmpty()) return Collections.emptyList();

        List<String> chunks = new ArrayList<>();
        String[] lines = text.split("\\r?\\n");
        StringBuilder currentText = new StringBuilder();
        StringBuilder currentTable = new StringBuilder();
        boolean inTable = false;

        for (String line : lines) {
            // 简单判断: 以 | 开头和结尾
            boolean isTableLine = line.trim().startsWith("|") && line.trim().endsWith("|");

            if (isTableLine) {
                if (!inTable) {
                    // 开始新表格，先保存之前的文本
                    if (currentText.length() > 0) {
                        chunks.add(currentText.toString().trim());
                        currentText.setLength(0);
                    }
                    inTable = true;
                }
                currentTable.append(line).append("\n");
            } else {
                if (inTable) {
                    // 表格结束
                    chunks.add(currentTable.toString().trim());
                    currentTable.setLength(0);
                    inTable = false;
                }
                currentText.append(line).append("\n");
            }
        }

        if (inTable) {
            chunks.add(currentTable.toString().trim());
        }
        if (currentText.length() > 0) {
            chunks.add(currentText.toString().trim());
        }

        // 过滤空块
        return chunks.stream().filter(s -> !s.isEmpty()).collect(Collectors.toList());
    }

    @Override
    public List<String> splitBySemanticSimilarity(String text, String modelName, double threshold) {
        if (text == null || text.isEmpty()) return Collections.emptyList();

        EmbeddingModel embeddingModel = llmModelService.getEmbeddingModel(modelName);
        
        // 1. 按句子切分
        List<String> sentences = splitIntoSentences(text);
        if (sentences.size() <= 1) return sentences;

        // 2. 计算 Embedding
        // 注意：这里可能产生大量 Token 消耗
        // List<List<Double>> embeddings = embeddingModel.embed(sentences);
        // Fix: Convert float[] to Double
        List<float[]> embeddingsFloat = embeddingModel.embed(sentences);
        List<List<Double>> embeddings = new ArrayList<>();
        for (float[] arr : embeddingsFloat) {
            List<Double> list = new ArrayList<>();
            for (float f : arr) list.add((double) f);
            embeddings.add(list);
        }

        // 3. 计算相似度并分组
        List<String> chunks = new ArrayList<>();
        StringBuilder currentChunk = new StringBuilder(sentences.get(0));
        
        for (int i = 0; i < embeddings.size() - 1; i++) {
            List<Double> currVec = embeddings.get(i);
            List<Double> nextVec = embeddings.get(i + 1);
            
            double similarity = cosineSimilarity(currVec, nextVec);
            
            if (similarity >= threshold) {
                // 相似，合并
                currentChunk.append(" ").append(sentences.get(i + 1));
            } else {
                // 不相似，断开
                chunks.add(currentChunk.toString());
                currentChunk = new StringBuilder(sentences.get(i + 1));
            }
        }
        chunks.add(currentChunk.toString());
        
        return chunks;
    }

    @Override
    public List<String> splitByLLM(String text, String modelName) {
        if (text == null || text.isEmpty()) return Collections.emptyList();

        ChatModel chatModel = llmModelService.getChatModel(modelName);
        
        String prompt = "Please split the following text into semantically independent chunks. " +
                "Do not change the text content. " +
                "Separate each chunk with '---CHUNK_SPLIT---'.\n\nText:\n" + text;

        String response = chatModel.call(prompt);
        
        if (response == null) return Collections.singletonList(text);
        
        String[] parts = response.split("---CHUNK_SPLIT---");
        List<String> chunks = new ArrayList<>();
        for (String part : parts) {
            if (!part.trim().isEmpty()) {
                chunks.add(part.trim());
            }
        }
        return chunks;
    }

    // Helper: Split text into sentences using BreakIterator
    private List<String> splitIntoSentences(String text) {
        List<String> sentences = new ArrayList<>();
        BreakIterator iterator = BreakIterator.getSentenceInstance(Locale.CHINA); // 默认中文，可根据需求调整
        iterator.setText(text);
        int start = iterator.first();
        for (int end = iterator.next(); end != BreakIterator.DONE; start = end, end = iterator.next()) {
            sentences.add(text.substring(start, end).trim());
        }
        return sentences.stream().filter(s -> !s.isEmpty()).collect(Collectors.toList());
    }

    // Helper: Cosine Similarity
    private double cosineSimilarity(List<Double> v1, List<Double> v2) {
        if (v1.size() != v2.size()) return 0.0;
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        for (int i = 0; i < v1.size(); i++) {
            dotProduct += v1.get(i) * v2.get(i);
            normA += Math.pow(v1.get(i), 2);
            normB += Math.pow(v2.get(i), 2);
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
