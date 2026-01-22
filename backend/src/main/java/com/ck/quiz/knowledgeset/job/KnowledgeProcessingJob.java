package com.ck.quiz.knowledgeset.job;

import com.ck.quiz.cron.exec.AbstractAsyncJob;
import com.ck.quiz.knowledgeset.entity.KnowledgeChunk;
import com.ck.quiz.knowledgeset.entity.KnowledgeSource;
import com.ck.quiz.knowledgeset.repository.KnowledgeSourceRepository;
import com.ck.quiz.knowledgeset.service.DocumentConverterService;
import com.ck.quiz.knowledgeset.service.DocumentSplitterService;
import com.ck.quiz.knowledgeset.service.VectorService;
import com.ck.quiz.utils.SpringContextUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class KnowledgeProcessingJob extends AbstractAsyncJob {

    @Autowired
    private KnowledgeSourceRepository knowledgeSourceRepository;

    @Autowired
    private DocumentConverterService documentConverterService;

    @Autowired
    private DocumentSplitterService documentSplitterService;

    @Autowired
    private VectorService vectorService;

    @Override
    public String getJobPreffix() {
        return "knowledge-process";
    }

    @Override
    public String getJobLabel() {
        return "知识库文档处理任务";
    }

    @Override
    public Map<String, Object> getParamDef() {
        Map<String, Object> params = new HashMap<>();
        params.put("sourceId", "知识来源ID (必填)");
        params.put("splitMethod", "切分方式 (TOKEN, CHARACTER, PARAGRAPH, MARKDOWN, TABLE, SEMANTIC, LLM) (必填)");
        params.put("chunkSize", "块大小 (默认 500)");
        params.put("overlap", "重叠大小 (默认 50)");
        params.put("embeddingModel", "嵌入模型名称 (可选)");
        params.put("llmModel", "LLM模型名称 (仅 splitMethod=LLM/SEMANTIC 时需要)");
        params.put("semanticThreshold", "语义切分阈值 (默认 0.8, 仅 splitMethod=SEMANTIC 时有效)");
        return params;
    }

    @Override
    public void run(Map<String, Object> params) {
        String sourceId = MapUtils.getString(params, "sourceId");
        String splitMethod = MapUtils.getString(params, "splitMethod", "TOKEN");
        int chunkSize = MapUtils.getIntValue(params, "chunkSize", 500);
        int overlap = MapUtils.getIntValue(params, "overlap", 50);
        String embeddingModel = MapUtils.getString(params, "embeddingModel");
        String llmModel = MapUtils.getString(params, "llmModel");
        double semanticThreshold = MapUtils.getDoubleValue(params, "semanticThreshold", 0.8);

        log.info("开始处理知识文档 sourceId={}, method={}", sourceId, splitMethod);

        // 1. 获取知识来源信息
        KnowledgeSource source = knowledgeSourceRepository.findById(sourceId)
                .orElseThrow(() -> new RuntimeException("知识来源不存在: " + sourceId));

        // 更新状态为 PARSING
        updateSourceStatus(source, "PARSING");

        try {
            // 2. 文档转换 (File -> Text)
            String textContent = convertDocument(source);
            log.info("文档转换完成，长度: {}", textContent.length());

            // 3. 文档切分 (Text -> Chunks)
            List<String> textChunks = splitDocument(textContent, splitMethod, chunkSize, overlap, embeddingModel, llmModel, semanticThreshold);
            log.info("文档切分完成，共 {} 个片段", textChunks.size());

            // 4. 向量化入库 (Chunks -> Vector Store)
            storeChunks(sourceId, textChunks, embeddingModel);
            log.info("向量化入库完成");

            // 更新状态为 SUCCESS
            updateSourceStatus(source, "SUCCESS");

        } catch (Exception e) {
            log.error("文档处理失败", e);
            updateSourceStatus(source, "FAILED");
            throw new RuntimeException(e);
        }
    }

    private String convertDocument(KnowledgeSource source) throws Exception {
        // 判断来源类型，目前假设是 FILE
        // 实际路径可能存储在 content 字段 (假设 content 存的是文件路径)
        String filePath = source.getContent();
        if (!StringUtils.hasText(filePath)) {
            throw new RuntimeException("文件路径为空");
        }
        
        File file = new File(filePath);
        if (!file.exists()) {
             // 尝试从项目根目录寻找 (仅用于测试方便，实际应使用绝对路径或对象存储)
             // 这里假设 content 可能是相对路径或绝对路径
             throw new RuntimeException("文件不存在: " + filePath);
        }

        try (InputStream inputStream = new FileInputStream(file)) {
            return documentConverterService.convertToString(inputStream, source.getName());
        }
    }

    private List<String> splitDocument(String text, String method, int chunkSize, int overlap, 
                                     String embeddingModel, String llmModel, double threshold) {
        switch (method.toUpperCase()) {
            case "TOKEN":
                return documentSplitterService.splitByToken(text, chunkSize, overlap);
            case "CHARACTER":
                return documentSplitterService.splitByCharacter(text, chunkSize, overlap);
            case "PARAGRAPH":
                return documentSplitterService.splitByParagraph(text, chunkSize, overlap);
            case "MARKDOWN":
                return documentSplitterService.splitByMarkdownHeader(text);
            case "TABLE":
                return documentSplitterService.splitTables(text);
            case "SEMANTIC":
                return documentSplitterService.splitBySemanticSimilarity(text, embeddingModel, threshold);
            case "LLM":
                return documentSplitterService.splitByLLM(text, llmModel);
            default:
                log.warn("未知的切分方式: {}, 降级为 TOKEN 切分", method);
                return documentSplitterService.splitByToken(text, chunkSize, overlap);
        }
    }

    private void storeChunks(String sourceId, List<String> textChunks, String embeddingModel) {
        // 先清理旧数据 (如果需要支持增量更新，这里需要调整)
        // 简单起见，这里采用先删后增策略，或者由 VectorService 内部处理去重
        // 由于 VectorService.deleteChunks 需要 ID 列表，这里暂时假设是全新的处理
        // 如果是重新处理，应该先根据 sourceId 查询出旧的 chunks 并删除
        // 但目前 VectorService 接口只支持根据 chunkIds 删除
        // 我们可以扩展 VectorService 支持 deleteBySourceId，或者在这里先查询
        
        // 构造 KnowledgeChunk 实体
        List<KnowledgeChunk> chunks = new ArrayList<>();
        for (int i = 0; i < textChunks.size(); i++) {
            KnowledgeChunk chunk = new KnowledgeChunk();
            chunk.setKnowledgeSourceId(sourceId);
            chunk.setContent(textChunks.get(i));
            chunk.setChunkIndex(i);
            // tokenCount 可以在 splitter 中计算，或者这里估算
            chunk.setTokenCount(textChunks.get(i).length() / 4); // 粗略估算
            chunks.add(chunk);
        }

        // 调用 VectorService 入库
        vectorService.embedAndStore(chunks, embeddingModel);
    }

    private void updateSourceStatus(KnowledgeSource source, String status) {
        source.setStatus(status);
        source.setUpdateDate(LocalDateTime.now());
        knowledgeSourceRepository.save(source);
    }
}
