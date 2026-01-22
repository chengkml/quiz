package com.ck.quiz.knowledgeset.job;

import com.ck.quiz.cron.exec.AbstractAsyncJob;
import com.ck.quiz.knowledgeset.entity.KnowledgeChunk;
import com.ck.quiz.knowledgeset.entity.KnowledgeSource;
import com.ck.quiz.knowledgeset.repository.KnowledgeSourceRepository;
import com.ck.quiz.knowledgeset.service.VectorService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DriverManager;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
public class DatabaseProcessingJob extends AbstractAsyncJob {

    @Autowired
    private KnowledgeSourceRepository knowledgeSourceRepository;

    @Autowired
    private VectorService vectorService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String getJobPreffix() {
        return "db-process";
    }

    @Override
    public String getJobLabel() {
        return "数据库表处理任务";
    }

    @Override
    public Map<String, Object> getParamDef() {
        Map<String, Object> params = new HashMap<>();
        params.put("sourceId", "知识来源ID (必填)");
        params.put("dbUrl", "数据库连接串 (jdbc:mysql://...) (必填)");
        params.put("dbUsername", "数据库用户名 (必填)");
        params.put("dbPassword", "数据库密码 (必填)");
        params.put("tableName", "表名 (必填)");
        params.put("columns", "要向量化的列名 (逗号分隔) (必填)");
        params.put("idColumn", "主键列名 (默认 id)");
        params.put("filter", "SQL过滤条件 (可选, 如: status='active')");
        params.put("embeddingModel", "嵌入模型名称 (可选)");
        params.put("batchSize", "批处理大小 (默认 100)");
        return params;
    }

    @Override
    public void run(Map<String, Object> params) {
        String sourceId = MapUtils.getString(params, "sourceId");
        String dbUrl = MapUtils.getString(params, "dbUrl");
        String dbUsername = MapUtils.getString(params, "dbUsername");
        String dbPassword = MapUtils.getString(params, "dbPassword");
        String tableName = MapUtils.getString(params, "tableName");
        String columnsStr = MapUtils.getString(params, "columns");
        String idColumn = MapUtils.getString(params, "idColumn", "id");
        String filter = MapUtils.getString(params, "filter");
        String embeddingModel = MapUtils.getString(params, "embeddingModel");
        int batchSize = MapUtils.getIntValue(params, "batchSize", 100);

        log.info("开始处理数据库表 sourceId={}, table={}", sourceId, tableName);

        KnowledgeSource source = knowledgeSourceRepository.findById(sourceId)
                .orElseThrow(() -> new RuntimeException("知识来源不存在: " + sourceId));

        updateSourceStatus(source, "PARSING");

        try {
            // 1. 连接目标数据库
            // 注意：这里简单使用 DriverManager，实际生产环境建议使用连接池或 DatasourceService
            try (Connection connection = DriverManager.getConnection(dbUrl, dbUsername, dbPassword)) {
                JdbcTemplate jdbcTemplate = new JdbcTemplate(new org.springframework.jdbc.datasource.SingleConnectionDataSource(connection, true));

                // 2. 构建查询 SQL
                String[] columns = columnsStr.split(",");
                StringBuilder sqlBuilder = new StringBuilder("SELECT ");
                sqlBuilder.append(idColumn).append(", "); // 总是查询主键
                sqlBuilder.append(columnsStr);
                sqlBuilder.append(" FROM ").append(tableName);
                if (filter != null && !filter.trim().isEmpty()) {
                    sqlBuilder.append(" WHERE ").append(filter);
                }

                // 3. 分页读取数据并处理
                // 由于不同数据库分页语法不同，这里简单使用全量查询流式处理，或者应用层分页
                // 为简化适配，假设数据量可控或使用 MySQL/PG 语法，这里演示全量 fetchSize 控制
                jdbcTemplate.setFetchSize(batchSize);

                List<Map<String, Object>> rows = jdbcTemplate.queryForList(sqlBuilder.toString());
                log.info("查询到 {} 条记录", rows.size());

                List<KnowledgeChunk> batchChunks = new ArrayList<>();
                int totalProcessed = 0;

                for (Map<String, Object> row : rows) {
                    // 4. 数据切分 (Row -> Chunk)
                    // 策略：将选定的列拼接成文本，或者转为 JSON
                    // 这里采用 "列名: 值" 的格式拼接
                    StringBuilder contentBuilder = new StringBuilder();
                    for (String col : columns) {
                        String colName = col.trim();
                        Object val = row.get(colName);
                        if (val != null) {
                            contentBuilder.append(colName).append(": ").append(val).append("\n");
                        }
                    }
                    String content = contentBuilder.toString().trim();
                    
                    if (content.isEmpty()) continue;

                    KnowledgeChunk chunk = new KnowledgeChunk();
                    chunk.setKnowledgeSourceId(sourceId);
                    chunk.setContent(content);
                    // 存储原始行数据的 JSON 作为 meta，方便溯源
                    try {
                        chunk.setMeta(objectMapper.writeValueAsString(row));
                    } catch (JsonProcessingException e) {
                        log.warn("序列化元数据失败", e);
                    }
                    chunk.setChunkIndex(0); // 数据库行通常作为一个完整 Chunk
                    chunk.setTokenCount(content.length() / 4); // 粗略估算

                    batchChunks.add(chunk);

                    // 批量入库
                    if (batchChunks.size() >= batchSize) {
                        vectorService.embedAndStore(batchChunks, embeddingModel);
                        totalProcessed += batchChunks.size();
                        batchChunks.clear();
                        log.info("已处理 {} 条记录", totalProcessed);
                    }
                }

                // 处理剩余数据
                if (!batchChunks.isEmpty()) {
                    vectorService.embedAndStore(batchChunks, embeddingModel);
                    totalProcessed += batchChunks.size();
                }
                
                log.info("数据库表处理完成，共处理 {} 条记录", totalProcessed);
                updateSourceStatus(source, "SUCCESS");
            }

        } catch (Exception e) {
            log.error("数据库处理失败", e);
            updateSourceStatus(source, "FAILED");
            throw new RuntimeException(e);
        }
    }

    private void updateSourceStatus(KnowledgeSource source, String status) {
        source.setStatus(status);
        source.setUpdateDate(LocalDateTime.now());
        knowledgeSourceRepository.save(source);
    }
}
