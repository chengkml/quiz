package com.ck.quiz.knowledgeset.service.impl;

import com.ck.quiz.knowledgeset.converter.VectorConverter;
import com.ck.quiz.knowledgeset.dto.VectorSearchResultDto;
import com.ck.quiz.knowledgeset.entity.KnowledgeChunk;
import com.ck.quiz.knowledgeset.entity.KnowledgeVector;
import com.ck.quiz.knowledgeset.repository.KnowledgeChunkRepository;
import com.ck.quiz.knowledgeset.repository.KnowledgeVectorRepository;
import com.ck.quiz.knowledgeset.service.VectorService;
import com.ck.quiz.llmmodel.service.LLMModelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.ck.quiz.knowledgeset.dto.VectorSearchFilter;

@Slf4j
@Service
@RequiredArgsConstructor
public class VectorServiceImpl implements VectorService {

    private final KnowledgeChunkRepository chunkRepository;
    private final KnowledgeVectorRepository vectorRepository;
    private final LLMModelService llmModelService;
    private final VectorConverter vectorConverter = new VectorConverter(); // 用于格式化查询向量字符串

    @Override
    @Transactional
    public void embedAndStore(List<KnowledgeChunk> chunks, String modelName) {
        if (chunks == null || chunks.isEmpty()) {
            return;
        }

        // 0. 获取嵌入模型
        EmbeddingModel embeddingModel = llmModelService.getEmbeddingModel(modelName);

        // 1. 保存切片
        List<KnowledgeChunk> savedChunks = chunkRepository.saveAll(chunks);
        log.info("Saved {} chunks", savedChunks.size());

        // 2. 准备文本列表用于 Embedding
        List<String> texts = savedChunks.stream()
                .map(KnowledgeChunk::getContent)
                .collect(Collectors.toList());

        // 3. 批量调用 Embedding 模型
        // Spring AI 的 embed 方法支持批量 List<String>
        List<float[]> embeddingsFloat = embeddingModel.embed(texts);
        List<List<Double>> embeddings = new ArrayList<>();
        for (float[] arr : embeddingsFloat) {
            List<Double> list = new ArrayList<>();
            for (float f : arr)
                list.add((double) f);
            embeddings.add(list);
        }

        if (embeddings.size() != savedChunks.size()) {
            throw new RuntimeException(
                    "Embedding count mismatch: sent " + savedChunks.size() + ", got " + embeddings.size());
        }

        // 4. 构建并保存向量实体
        List<KnowledgeVector> vectors = new ArrayList<>();
        for (int i = 0; i < savedChunks.size(); i++) {
            KnowledgeChunk chunk = savedChunks.get(i);
            List<Double> vectorData = embeddings.get(i);

            KnowledgeVector vector = new KnowledgeVector();
            vector.setId(com.ck.quiz.utils.IdHelper.genUuid());
            vector.setKnowledgeChunkId(chunk.getId());
            vector.setEmbedding(vectorData);
            vector.setDimension(vectorData.size());
            vector.setModel(modelName);
            // 如果 modelName 为空，这里实际上保存的是 default，最好能获取到真实名称
            // 但 Spring AI EmbeddingModel 接口不直接暴露 config
            // 这里暂且存传入的 modelName 或 "default"
            vector.setModel(modelName != null ? modelName : "default");

            vectors.add(vector);
        }

        vectorRepository.saveAll(vectors);
        log.info("Saved {} vectors", vectors.size());
    }

    @Override
    public List<VectorSearchResultDto> search(String queryText, int limit, String modelName) {
        return search(queryText, limit, modelName, null);
    }

    @Override
    public List<VectorSearchResultDto> search(String queryText, int limit, String modelName,
            VectorSearchFilter filter) {
        // 0. 检查是否为全文检索
        if (filter != null && "TEXT".equalsIgnoreCase(filter.getSearchType())) {
            return searchByText(queryText, limit, filter.getKnowledgeSetId());
        }

        // 0. 获取嵌入模型
        EmbeddingModel embeddingModel = llmModelService.getEmbeddingModel(modelName);

        // 1. 生成查询向量
        float[] queryVectorFloat = embeddingModel.embed(queryText);
        List<Double> queryVector = new ArrayList<>();
        for (float f : queryVectorFloat)
            queryVector.add((double) f);

        // 2. 转换向量为 PG vector 字符串格式 [x,y,z]
        String vectorStr = vectorConverter.convertToDatabaseColumn(queryVector);

        // 3. 执行原生 SQL 相似度搜索 (带距离和过滤)
        String knowledgeSetId = filter != null ? filter.getKnowledgeSetId() : null;
        List<Object[]> searchResults = vectorRepository.searchSimilarWithDistance(vectorStr, limit, knowledgeSetId);

        if (searchResults.isEmpty()) {
            return new ArrayList<>();
        }

        // 4. 解析结果
        List<KnowledgeVector> vectors = new ArrayList<>();
        List<Double> distances = new ArrayList<>();

        for (Object[] row : searchResults) {
            if (row[0] instanceof KnowledgeVector) {
                vectors.add((KnowledgeVector) row[0]);
            }
            if (row.length > 1 && row[1] instanceof Number) {
                distances.add(((Number) row[1]).doubleValue());
            } else {
                distances.add(null);
            }
        }

        // 5. 获取对应的切片ID
        List<String> chunkIds = vectors.stream()
                .map(KnowledgeVector::getKnowledgeChunkId)
                .collect(Collectors.toList());

        // 6. 查询切片详情
        Map<String, KnowledgeChunk> chunkMap = chunkRepository.findAllById(chunkIds).stream()
                .collect(Collectors.toMap(KnowledgeChunk::getId, c -> c));

        // 7. 组装结果
        List<VectorSearchResultDto> results = new ArrayList<>();
        for (int i = 0; i < vectors.size(); i++) {
            KnowledgeVector vec = vectors.get(i);
            KnowledgeChunk chunk = chunkMap.get(vec.getKnowledgeChunkId());
            Double distance = distances.get(i);

            if (chunk != null) {
                results.add(new VectorSearchResultDto(chunk, distance));
            }
        }

        return results;
    }

    @Override
    @Transactional
    public void deleteChunks(List<String> chunkIds) {
        if (chunkIds == null || chunkIds.isEmpty())
            return;

        // 先删向量
        vectorRepository.deleteByKnowledgeChunkIdIn(chunkIds);
        // 再删切片
        chunkRepository.deleteAllById(chunkIds);
    }

    @Override
    @Transactional
    public void deleteBySourceId(String sourceId) {
        if (sourceId == null || sourceId.isEmpty())
            return;

        // 1. 查找 sourceId 下所有的 chunkId
        List<KnowledgeChunk> chunks = chunkRepository.findByKnowledgeSourceId(sourceId);
        if (chunks.isEmpty()) {
            return;
        }

        List<String> chunkIds = chunks.stream().map(KnowledgeChunk::getId).collect(Collectors.toList());

        // 2. 删除向量
        vectorRepository.deleteByKnowledgeChunkIdIn(chunkIds);

        // 3. 删除切片
        chunkRepository.deleteAllById(chunkIds);

        log.info("Deleted {} chunks and their vectors for sourceId {}", chunkIds.size(), sourceId);
    }

    private List<VectorSearchResultDto> searchByText(String queryText, int limit, String knowledgeSetId) {
        List<KnowledgeChunk> chunks = chunkRepository.searchByText(queryText, knowledgeSetId,
                org.springframework.data.domain.PageRequest.of(0, limit));

        return chunks.stream()
                .map(chunk -> new VectorSearchResultDto(chunk, 0.0))
                .collect(Collectors.toList());
    }
}
