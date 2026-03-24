package com.ck.quiz.knowledgeset.service.impl;

import com.ck.quiz.knowledgeset.converter.VectorConverter;
import com.ck.quiz.knowledgeset.dto.VectorSearchFilter;
import com.ck.quiz.knowledgeset.dto.VectorSearchResultDto;
import com.ck.quiz.knowledgeset.dto.VectorSyncCheckItemDto;
import com.ck.quiz.knowledgeset.dto.VectorSyncCheckRequestDto;
import com.ck.quiz.knowledgeset.dto.VectorSyncCheckResultDto;
import com.ck.quiz.knowledgeset.dto.VectorSyncCheckSummaryDto;
import com.ck.quiz.knowledgeset.dto.VectorSyncIssueSampleDto;
import com.ck.quiz.knowledgeset.entity.KnowledgeChunk;
import com.ck.quiz.knowledgeset.entity.KnowledgeVector;
import com.ck.quiz.knowledgeset.repository.KnowledgeChunkRepository;
import com.ck.quiz.knowledgeset.repository.KnowledgeVectorRepository;
import com.ck.quiz.knowledgeset.service.VectorService;
import com.ck.quiz.llmmodel.service.LLMModelService;
import com.ck.quiz.utils.IdHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
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
    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    private final VectorConverter vectorConverter = new VectorConverter();

    @Override
    @Transactional
    public void embedAndStore(List<KnowledgeChunk> chunks, String modelName) {
        if (chunks == null || chunks.isEmpty()) {
            return;
        }

        EmbeddingModel embeddingModel = llmModelService.getEmbeddingModel(modelName);

        for (KnowledgeChunk chunk : chunks) {
            if (!StringUtils.hasText(chunk.getId())) {
                chunk.setId(IdHelper.genUuid());
            }
        }

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
        List<String> knowledgeSetIds = normalizeKnowledgeSetIds(filter != null ? filter.getKnowledgeSetIds() : null);
        String knowledgeSetId = knowledgeSetIds.isEmpty()
                ? normalizeBlank(filter != null ? filter.getKnowledgeSetId() : null)
                : null;
        String knowledgeSourceId = normalizeBlank(filter != null ? filter.getKnowledgeSourceId() : null);

        if (filter != null && "TEXT".equalsIgnoreCase(filter.getSearchType())) {
            return searchByText(queryText, limit, knowledgeSetId, knowledgeSetIds);
        }

        EmbeddingModel embeddingModel = llmModelService.getEmbeddingModel(modelName);

        float[] queryVectorFloat = embeddingModel.embed(queryText);
        List<Double> queryVector = new ArrayList<>();
        for (float f : queryVectorFloat) {
            queryVector.add((double) f);
        }

        String vectorStr = vectorConverter.convertToDatabaseColumn(queryVector);
        String normalizedModelName = normalizeBlank(modelName);
        int topK = limit <= 0 ? 5 : limit;

        List<VectorRow> rows = searchVectorRows(vectorStr, topK, queryVector.size(), normalizedModelName, knowledgeSetId,
                knowledgeSetIds, knowledgeSourceId);

        if (rows.isEmpty()) {
            return new ArrayList<>();
        }

        List<String> chunkIds = rows.stream()
                .map(VectorRow::getKnowledgeChunkId)
                .distinct()
                .collect(Collectors.toList());

        Map<String, KnowledgeChunk> chunkMap = chunkRepository.findAllById(chunkIds).stream()
                .collect(Collectors.toMap(KnowledgeChunk::getId, c -> c, (a, b) -> a, LinkedHashMap::new));

        Double minScore = filter != null ? filter.getMinScore() : null;
        List<VectorSearchResultDto> results = new ArrayList<>();
        for (VectorRow row : rows) {
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

    @Override
    public VectorSyncCheckResultDto syncCheck(VectorSyncCheckRequestDto request) {
        VectorSyncCheckRequestDto req = request == null ? new VectorSyncCheckRequestDto() : request;

        String knowledgeSetId = normalizeBlank(req.getKnowledgeSetId());
        String knowledgeSourceId = normalizeBlank(req.getKnowledgeSourceId());
        int sampleLimit = req.getSampleLimit() == null || req.getSampleLimit() <= 0 ? 50 : Math.min(req.getSampleLimit(), 200);

        Long totalChunks = querySingleCount(buildTotalChunkCountSql(knowledgeSetId, knowledgeSourceId),
                buildFilterParams(knowledgeSetId, knowledgeSourceId));
        Long totalVectors = querySingleCount(buildTotalVectorCountSql(knowledgeSetId, knowledgeSourceId),
                buildFilterParams(knowledgeSetId, knowledgeSourceId));

        VectorSyncCheckItemDto chunkWithoutVector = queryChunkWithoutVector(knowledgeSetId, knowledgeSourceId, sampleLimit);
        VectorSyncCheckItemDto vectorWithoutChunk = queryVectorWithoutChunk(knowledgeSetId, knowledgeSourceId, sampleLimit);
        VectorSyncCheckItemDto chunkWithoutSet = queryChunkWithoutSet(knowledgeSetId, knowledgeSourceId, sampleLimit);
        VectorSyncCheckItemDto sourceWithoutSet = querySourceWithoutSet(knowledgeSetId, knowledgeSourceId, sampleLimit);

        long totalIssues = safeLong(chunkWithoutVector.getCount())
                + safeLong(vectorWithoutChunk.getCount())
                + safeLong(chunkWithoutSet.getCount())
                + safeLong(sourceWithoutSet.getCount());

        VectorSyncCheckResultDto result = new VectorSyncCheckResultDto();
        result.setSummary(new VectorSyncCheckSummaryDto(safeLong(totalChunks), safeLong(totalVectors), totalIssues));

        VectorSyncCheckResultDto.Checks checks = new VectorSyncCheckResultDto.Checks();
        checks.setChunkWithoutVector(chunkWithoutVector);
        checks.setVectorWithoutChunk(vectorWithoutChunk);
        checks.setChunkWithoutSet(chunkWithoutSet);
        checks.setSourceWithoutSet(sourceWithoutSet);
        result.setChecks(checks);

        return result;
    }

    private List<VectorSearchResultDto> searchByText(String queryText, int limit, String knowledgeSetId,
            List<String> knowledgeSetIds) {
        StringBuilder sql = new StringBuilder(
                "SELECT c.id, c.knowledge_source_id, c.content, c.meta, c.chunk_index, c.token_count " +
                        "FROM knowledge_chunk c " +
                        "JOIN knowledge_source s ON c.knowledge_source_id = s.id " +
                        "WHERE c.content LIKE CONCAT('%', :keyword, '%')");
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("keyword", queryText)
                .addValue("limit", limit <= 0 ? 5 : limit);

        if (!knowledgeSetIds.isEmpty()) {
            sql.append(" AND s.knowledge_set_id IN (:knowledgeSetIds)");
            params.addValue("knowledgeSetIds", knowledgeSetIds);
        } else if (knowledgeSetId != null) {
            sql.append(" AND s.knowledge_set_id = :knowledgeSetId");
            params.addValue("knowledgeSetId", knowledgeSetId);
        }

        sql.append(" ORDER BY c.create_date DESC LIMIT :limit");

        List<KnowledgeChunk> chunks = namedParameterJdbcTemplate.query(sql.toString(), params, (rs, rowNum) -> {
            KnowledgeChunk chunk = new KnowledgeChunk();
            chunk.setId(rs.getString("id"));
            chunk.setKnowledgeSourceId(rs.getString("knowledge_source_id"));
            chunk.setContent(rs.getString("content"));
            chunk.setMeta(rs.getString("meta"));

            int chunkIndex = rs.getInt("chunk_index");
            if (!rs.wasNull()) {
                chunk.setChunkIndex(chunkIndex);
            }

            int tokenCount = rs.getInt("token_count");
            if (!rs.wasNull()) {
                chunk.setTokenCount(tokenCount);
            }
            return chunk;
        });

        return chunks.stream()
                .map(chunk -> new VectorSearchResultDto(chunk, 0.0))
                .collect(Collectors.toList());
    }

    private List<VectorRow> searchVectorRows(String vectorStr, int limit, int dimension, String modelName,
            String knowledgeSetId, List<String> knowledgeSetIds, String knowledgeSourceId) {
        StringBuilder sql = new StringBuilder(
                "SELECT v.knowledge_chunk_id, (v.embedding <=> cast(:vectorStr as vector)) as distance " +
                        "FROM knowledge_vector v " +
                        "JOIN knowledge_chunk c ON v.knowledge_chunk_id = c.id " +
                        "JOIN knowledge_source s ON c.knowledge_source_id = s.id " +
                        "WHERE v.dimension = :dimension");

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("vectorStr", vectorStr)
                .addValue("dimension", dimension)
                .addValue("limit", limit <= 0 ? 5 : limit);

        if (modelName != null) {
            sql.append(" AND v.model = :modelName");
            params.addValue("modelName", modelName);
        }

        if (!knowledgeSetIds.isEmpty()) {
            sql.append(" AND s.knowledge_set_id IN (:knowledgeSetIds)");
            params.addValue("knowledgeSetIds", knowledgeSetIds);
        } else if (knowledgeSetId != null) {
            sql.append(" AND s.knowledge_set_id = :knowledgeSetId");
            params.addValue("knowledgeSetId", knowledgeSetId);
        }

        if (knowledgeSourceId != null) {
            sql.append(" AND c.knowledge_source_id = :knowledgeSourceId");
            params.addValue("knowledgeSourceId", knowledgeSourceId);
        }

        sql.append(" ORDER BY distance ASC LIMIT :limit");

        return namedParameterJdbcTemplate.query(sql.toString(), params, (rs, rowNum) -> new VectorRow(
                rs.getString("knowledge_chunk_id"),
                rs.getDouble("distance")));
    }

    private List<String> normalizeKnowledgeSetIds(List<String> knowledgeSetIds) {
        if (knowledgeSetIds == null || knowledgeSetIds.isEmpty()) {
            return Collections.emptyList();
        }
        return knowledgeSetIds.stream()
                .filter(StringUtils::hasText)
                .distinct()
                .collect(Collectors.toList());
    }

    private String normalizeBlank(String value) {
        return StringUtils.hasText(value) ? value : null;
    }

    private Long querySingleCount(String sql, MapSqlParameterSource params) {
        Long value = namedParameterJdbcTemplate.queryForObject(sql, params, Long.class);
        return value == null ? 0L : value;
    }

    private long safeLong(Long value) {
        return value == null ? 0L : value;
    }

    private MapSqlParameterSource buildFilterParams(String knowledgeSetId, String knowledgeSourceId) {
        return new MapSqlParameterSource()
                .addValue("knowledgeSetId", knowledgeSetId)
                .addValue("knowledgeSourceId", knowledgeSourceId);
    }

    private String buildSourceFilterCondition(boolean withAlias) {
        String sourceColumn = withAlias ? "s.id" : "knowledge_source_id";
        String setColumn = withAlias ? "s.knowledge_set_id" : "knowledge_set_id";

        StringBuilder sb = new StringBuilder();
        sb.append("(:knowledgeSourceId IS NULL OR ").append(sourceColumn).append(" = :knowledgeSourceId)");
        sb.append(" AND (:knowledgeSetId IS NULL OR ").append(setColumn).append(" = :knowledgeSetId)");
        return sb.toString();
    }

    private String buildTotalChunkCountSql(String knowledgeSetId, String knowledgeSourceId) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(1) FROM knowledge_chunk c WHERE 1=1");
        if (knowledgeSetId != null || knowledgeSourceId != null) {
            sql.append(" AND EXISTS (SELECT 1 FROM knowledge_source s WHERE s.id = c.knowledge_source_id AND ")
                    .append(buildSourceFilterCondition(true))
                    .append(")");
        }
        return sql.toString();
    }

    private String buildTotalVectorCountSql(String knowledgeSetId, String knowledgeSourceId) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(1) FROM knowledge_vector v WHERE 1=1");
        if (knowledgeSetId != null || knowledgeSourceId != null) {
            sql.append(" AND EXISTS (")
                    .append("SELECT 1 FROM knowledge_chunk c JOIN knowledge_source s ON c.knowledge_source_id = s.id ")
                    .append("WHERE c.id = v.knowledge_chunk_id AND ")
                    .append(buildSourceFilterCondition(true))
                    .append(")");
        }
        return sql.toString();
    }

    private VectorSyncCheckItemDto queryChunkWithoutVector(String knowledgeSetId, String knowledgeSourceId, int sampleLimit) {
        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM knowledge_chunk c " +
                        "LEFT JOIN knowledge_vector v ON v.knowledge_chunk_id = c.id " +
                        "JOIN knowledge_source s ON s.id = c.knowledge_source_id " +
                        "WHERE v.id IS NULL AND " + buildSourceFilterCondition(true));

        StringBuilder sampleSql = new StringBuilder(
                "SELECT c.id AS chunk_id, NULL AS vector_id, c.knowledge_source_id, s.knowledge_set_id, c.create_date " +
                        "FROM knowledge_chunk c " +
                        "LEFT JOIN knowledge_vector v ON v.knowledge_chunk_id = c.id " +
                        "JOIN knowledge_source s ON s.id = c.knowledge_source_id " +
                        "WHERE v.id IS NULL AND " + buildSourceFilterCondition(true) +
                        " ORDER BY c.create_date DESC LIMIT :sampleLimit");

        return queryIssueItem(countSql.toString(), sampleSql.toString(), buildFilterParams(knowledgeSetId, knowledgeSourceId),
                sampleLimit);
    }

    private VectorSyncCheckItemDto queryVectorWithoutChunk(String knowledgeSetId, String knowledgeSourceId, int sampleLimit) {
        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM knowledge_vector v " +
                        "LEFT JOIN knowledge_chunk c ON c.id = v.knowledge_chunk_id " +
                        "LEFT JOIN knowledge_source s ON s.id = c.knowledge_source_id " +
                        "WHERE c.id IS NULL");

        StringBuilder sampleSql = new StringBuilder(
                "SELECT NULL AS chunk_id, v.id AS vector_id, NULL AS knowledge_source_id, NULL AS knowledge_set_id, v.create_date " +
                        "FROM knowledge_vector v " +
                        "LEFT JOIN knowledge_chunk c ON c.id = v.knowledge_chunk_id " +
                        "WHERE c.id IS NULL ORDER BY v.create_date DESC LIMIT :sampleLimit");

        // vector 无 chunk 时无法按 set/source 过滤；只有全局检查有意义
        if (knowledgeSetId != null || knowledgeSourceId != null) {
            return new VectorSyncCheckItemDto(0L, new ArrayList<>());
        }

        return queryIssueItem(countSql.toString(), sampleSql.toString(), buildFilterParams(null, null), sampleLimit);
    }

    private VectorSyncCheckItemDto queryChunkWithoutSet(String knowledgeSetId, String knowledgeSourceId, int sampleLimit) {
        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM knowledge_chunk c " +
                        "JOIN knowledge_source s ON s.id = c.knowledge_source_id " +
                        "WHERE (s.knowledge_set_id IS NULL OR s.knowledge_set_id = '')");

        if (knowledgeSourceId != null) {
            countSql.append(" AND s.id = :knowledgeSourceId");
        }

        StringBuilder sampleSql = new StringBuilder(
                "SELECT c.id AS chunk_id, NULL AS vector_id, c.knowledge_source_id, s.knowledge_set_id, c.create_date " +
                        "FROM knowledge_chunk c " +
                        "JOIN knowledge_source s ON s.id = c.knowledge_source_id " +
                        "WHERE (s.knowledge_set_id IS NULL OR s.knowledge_set_id = '')");

        if (knowledgeSourceId != null) {
            sampleSql.append(" AND s.id = :knowledgeSourceId");
        }

        sampleSql.append(" ORDER BY c.create_date DESC LIMIT :sampleLimit");

        if (knowledgeSetId != null) {
            return new VectorSyncCheckItemDto(0L, new ArrayList<>());
        }

        return queryIssueItem(countSql.toString(), sampleSql.toString(), buildFilterParams(knowledgeSetId, knowledgeSourceId),
                sampleLimit);
    }

    private VectorSyncCheckItemDto querySourceWithoutSet(String knowledgeSetId, String knowledgeSourceId, int sampleLimit) {
        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM knowledge_source s WHERE (s.knowledge_set_id IS NULL OR s.knowledge_set_id = '')");
        StringBuilder sampleSql = new StringBuilder(
                "SELECT NULL AS chunk_id, NULL AS vector_id, s.id AS knowledge_source_id, s.knowledge_set_id, s.create_date " +
                        "FROM knowledge_source s WHERE (s.knowledge_set_id IS NULL OR s.knowledge_set_id = '')");

        if (knowledgeSourceId != null) {
            countSql.append(" AND s.id = :knowledgeSourceId");
            sampleSql.append(" AND s.id = :knowledgeSourceId");
        }

        sampleSql.append(" ORDER BY s.create_date DESC LIMIT :sampleLimit");

        if (knowledgeSetId != null) {
            return new VectorSyncCheckItemDto(0L, new ArrayList<>());
        }

        return queryIssueItem(countSql.toString(), sampleSql.toString(), buildFilterParams(knowledgeSetId, knowledgeSourceId),
                sampleLimit);
    }

    private VectorSyncCheckItemDto queryIssueItem(String countSql, String sampleSql,
            MapSqlParameterSource baseParams, int sampleLimit) {
        MapSqlParameterSource countParams = new MapSqlParameterSource()
                .addValue("knowledgeSetId", baseParams.getValue("knowledgeSetId"))
                .addValue("knowledgeSourceId", baseParams.getValue("knowledgeSourceId"));
        long count = safeLong(querySingleCount(countSql, countParams));

        MapSqlParameterSource sampleParams = new MapSqlParameterSource()
                .addValue("knowledgeSetId", baseParams.getValue("knowledgeSetId"))
                .addValue("knowledgeSourceId", baseParams.getValue("knowledgeSourceId"))
                .addValue("sampleLimit", sampleLimit);

        List<VectorSyncIssueSampleDto> samples = namedParameterJdbcTemplate.query(sampleSql, sampleParams, (rs, rowNum) ->
                new VectorSyncIssueSampleDto(
                        rs.getString("chunk_id"),
                        rs.getString("vector_id"),
                        rs.getString("knowledge_source_id"),
                        rs.getString("knowledge_set_id"),
                        rs.getTimestamp("create_date") == null ? null : rs.getTimestamp("create_date").toString()
                ));

        return new VectorSyncCheckItemDto(count, samples);
    }

    private static class VectorRow {
        private final String knowledgeChunkId;
        private final Double distance;

        private VectorRow(String knowledgeChunkId, Double distance) {
            this.knowledgeChunkId = knowledgeChunkId;
            this.distance = distance;
        }

        public String getKnowledgeChunkId() {
            return knowledgeChunkId;
        }

        public Double getDistance() {
            return distance;
        }
    }
}
