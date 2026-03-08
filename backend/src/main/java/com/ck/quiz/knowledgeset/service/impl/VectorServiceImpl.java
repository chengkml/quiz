package com.ck.quiz.knowledgeset.service.impl;

import com.ck.quiz.knowledgeset.converter.VectorConverter;
import com.ck.quiz.knowledgeset.dto.VectorSearchFilter;
import com.ck.quiz.knowledgeset.dto.VectorSearchResultDto;
import com.ck.quiz.knowledgeset.entity.KnowledgeChunk;
import com.ck.quiz.knowledgeset.entity.KnowledgeVector;
import com.ck.quiz.knowledgeset.repository.KnowledgeChunkRepository;
import com.ck.quiz.knowledgeset.repository.KnowledgeVectorRepository;
import com.ck.quiz.knowledgeset.repository.VectorSearchProjection;
import com.ck.quiz.knowledgeset.service.VectorService;
import com.ck.quiz.llmmodel.service.LLMModelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VectorServiceImpl implements VectorService {

    private final KnowledgeChunkRepository chunkRepository;
    private final KnowledgeVectorRepository vectorRepository;
    private final LLMModelService llmModelService;
    private final VectorConverter vectorConverter = new VectorConverter();

    @Override
    @Transactional
    public void embedAndStore(List<KnowledgeChunk> chunks, String modelName) {
        if (chunks == null || chunks.isEmpty()) {
            return;
        }

        EmbeddingModel embeddingModel = llmModelService.getEmbeddingModel(modelName);

        List<KnowledgeChunk> savedChunks = chunkRepository.saveAll(chunks);
        log.info("Saved {} chunks", savedChunks.size());

        List<String> texts = savedChunks.stream()
                .map(KnowledgeChunk::getContent)
                .collect(Collectors.toList());

        List<float[]> embeddingsFloat = embeddingModel.embed(texts);
        List<List<Double>> embeddings = new ArrayList<>();
        for (float[] arr : embeddingsFloat) {
            List<Double> list = new ArrayList<>();
            for (float f : arr) {
                list.add((double) f);
            }
            embeddings.add(list);
        }

        if (embeddings.size() != savedChunks.size()) {
            throw new RuntimeException("Embedding count mismatch: sent " + savedChunks.size() + ", got " + embeddings.size());
        }

        List<KnowledgeVector> vectors = new ArrayList<>();
        for (int i = 0; i < savedChunks.size(); i++) {
            KnowledgeChunk chunk = savedChunks.get(i);
            List<Double> vectorData = embeddings.get(i);

            KnowledgeVector vector = new KnowledgeVector();
            vector.setId(com.ck.quiz.utils.IdHelper.genUuid());
            vector.setKnowledgeChunkId(chunk.getId());
            vector.setEmbedding(vectorData);
            vector.setDimension(vectorData.size());
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
    public List<VectorSearchResultDto> search(String queryText, int limit, String modelName, VectorSearchFilter filter) {
        if (filter != null && "TEXT".equalsIgnoreCase(filter.getSearchType())) {
            return searchByText(queryText, limit, filter.getKnowledgeSetId());
        }

        EmbeddingModel embeddingModel = llmModelService.getEmbeddingModel(modelName);

        float[] queryVectorFloat = embeddingModel.embed(queryText);
        List<Double> queryVector = new ArrayList<>();
        for (float f : queryVectorFloat) {
            queryVector.add((double) f);
        }

        String vectorStr = vectorConverter.convertToDatabaseColumn(queryVector);
        String knowledgeSetId = normalizeBlank(filter != null ? filter.getKnowledgeSetId() : null);
        String knowledgeSourceId = normalizeBlank(filter != null ? filter.getKnowledgeSourceId() : null);
        String normalizedModelName = normalizeBlank(modelName);
        int topK = limit <= 0 ? 5 : limit;

        List<VectorSearchProjection> rows = vectorRepository.searchSimilarWithDistance(
                vectorStr,
                topK,
                queryVector.size(),
                normalizedModelName,
                knowledgeSetId,
                knowledgeSourceId);

        if (rows.isEmpty()) {
            return new ArrayList<>();
        }

        List<String> chunkIds = rows.stream()
                .map(VectorSearchProjection::getKnowledgeChunkId)
                .distinct()
                .collect(Collectors.toList());

        Map<String, KnowledgeChunk> chunkMap = chunkRepository.findAllById(chunkIds).stream()
                .collect(Collectors.toMap(KnowledgeChunk::getId, c -> c, (a, b) -> a, LinkedHashMap::new));

        Double minScore = filter != null ? filter.getMinScore() : null;
        List<VectorSearchResultDto> results = new ArrayList<>();
        for (VectorSearchProjection row : rows) {
            KnowledgeChunk chunk = chunkMap.get(row.getKnowledgeChunkId());
            if (chunk == null) {
                continue;
            }

            Double distance = row.getDistance();
            if (minScore != null && distance != null) {
                double similarity = 1.0d - distance;
                if (similarity < minScore) {
                    continue;
                }
            }

            results.add(new VectorSearchResultDto(chunk, distance));
        }

        return results;
    }

    @Override
    @Transactional
    public void deleteChunks(List<String> chunkIds) {
        if (chunkIds == null || chunkIds.isEmpty()) {
            return;
        }

        vectorRepository.deleteByKnowledgeChunkIdIn(chunkIds);
        chunkRepository.deleteAllById(chunkIds);
    }

    @Override
    @Transactional
    public void deleteBySourceId(String sourceId) {
        if (sourceId == null || sourceId.isEmpty()) {
            return;
        }

        List<KnowledgeChunk> chunks = chunkRepository.findByKnowledgeSourceId(sourceId);
        if (chunks.isEmpty()) {
            return;
        }

        List<String> chunkIds = chunks.stream().map(KnowledgeChunk::getId).collect(Collectors.toList());
        vectorRepository.deleteByKnowledgeChunkIdIn(chunkIds);
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

    private String normalizeBlank(String value) {
        return StringUtils.hasText(value) ? value : null;
    }
}
