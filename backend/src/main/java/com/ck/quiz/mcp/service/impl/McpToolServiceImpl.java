package com.ck.quiz.mcp.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.mcp.dto.McpToolCreateDto;
import com.ck.quiz.mcp.dto.McpToolDto;
import com.ck.quiz.mcp.dto.McpToolMetricsPointDto;
import com.ck.quiz.mcp.dto.McpToolMetricsResponseDto;
import com.ck.quiz.mcp.dto.McpToolQueryDto;
import com.ck.quiz.mcp.dto.McpToolUpdateDto;
import com.ck.quiz.mcp.entity.McpTool;
import com.ck.quiz.mcp.repository.McpToolRepository;
import com.ck.quiz.mcp.service.McpToolService;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class McpToolServiceImpl extends
        BaseServiceImpl<McpToolCreateDto, McpToolUpdateDto, McpToolQueryDto, McpToolDto, McpTool, McpToolRepository>
        implements McpToolService {

    @Override
    protected McpToolDto newDto() {
        return new McpToolDto();
    }

    @Override
    protected McpTool newModel() {
        return new McpTool();
    }

    @Override
    public McpToolDto create(McpToolCreateDto createDto) {
        McpTool tool = newModel();
        BeanUtils.copyProperties(createDto, tool);
        tool.setStatus("REGISTERED");
        tool.setSourceDeletedFlag(false);
        McpTool saved = repository.save(tool);
        return convertToDto(saved, true);
    }

    @Override
    public Page<McpToolDto> search(String userId, McpToolQueryDto queryDto) {
        StringBuilder sql = new StringBuilder("select t.* from mcp_tool t where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from mcp_tool t where 1=1 ");
        Map<String, Object> params = new HashMap<>();
        JdbcQueryHelper.lowerLike("keyWord", queryDto.getKeyWord(),
                " and (lower(t.display_name) like :keyWord or lower(t.origin_name) like :keyWord) ", params,
                namedParameterJdbcTemplate, sql, countSql);
        if (StringUtils.hasText(queryDto.getEnv())) {
            JdbcQueryHelper.equals("env", queryDto.getEnv(), " and t.env = :env ", params, sql, countSql);
        }
        if (StringUtils.hasText(queryDto.getServerId())) {
            JdbcQueryHelper.equals("serverId", queryDto.getServerId(), " and t.server_id = :serverId ", params, sql,
                    countSql);
        }
        if (StringUtils.hasText(queryDto.getStatus())) {
            JdbcQueryHelper.equals("status", queryDto.getStatus(), " and t.status = :status ", params, sql, countSql);
        }
        if (StringUtils.hasText(queryDto.getCategory())) {
            JdbcQueryHelper.equals("category", queryDto.getCategory(), " and t.category = :category ", params, sql,
                    countSql);
        }
        JdbcQueryHelper.order("create_date", "desc", sql);
        String limitSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(),
                queryDto.getPageNum(), queryDto.getPageSize());
        List<McpToolDto> list = namedParameterJdbcTemplate.query(limitSql, params, (rs, rowNum) -> {
            McpToolDto dto = new McpToolDto();
            dto.setId(rs.getString("id"));
            dto.setServerId(rs.getString("server_id"));
            dto.setEnv(rs.getString("env"));
            dto.setOriginName(rs.getString("origin_name"));
            dto.setDisplayName(rs.getString("display_name"));
            dto.setDescription(rs.getString("description"));
            dto.setCategory(rs.getString("category"));
            dto.setTags(rs.getString("tags"));
            dto.setStatus(rs.getString("status"));
            dto.setSchemaJson(rs.getString("schema_json"));
            dto.setStrategyJson(rs.getString("strategy_json"));
            dto.setVisibilityJson(rs.getString("visibility_json"));
            dto.setSourceDeletedFlag(rs.getObject("source_deleted_flag") != null
                    ? rs.getBoolean("source_deleted_flag")
                    : null);
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateDate(
                    rs.getTimestamp("create_date") != null
                            ? rs.getTimestamp("create_date").toLocalDateTime()
                            : null);
            dto.setUpdateUser(rs.getString("update_user"));
            dto.setUpdateDate(
                    rs.getTimestamp("update_date") != null
                            ? rs.getTimestamp("update_date").toLocalDateTime()
                            : null);
            return dto;
        });
        return JdbcQueryHelper.toPage(namedParameterJdbcTemplate, countSql.toString(), params, list,
                queryDto.getPageNum(), queryDto.getPageSize());
    }

    @Override
    public void enable(String userId, String id) {
        McpTool tool = repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Tool not found: " + id));
        if (tool.getCreateUser() != null && !tool.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No permission to update tool: " + id);
        }
        tool.setStatus("ENABLED");
        repository.save(tool);
    }

    @Override
    public void disable(String userId, String id) {
        McpTool tool = repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Tool not found: " + id));
        if (tool.getCreateUser() != null && !tool.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No permission to update tool: " + id);
        }
        tool.setStatus("DISABLED");
        repository.save(tool);
    }

    @Override
    public String cloneConfig(String userId, String id, String targetEnv) {
        McpTool tool = repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Tool not found: " + id));
        McpTool cloned = new McpTool();
        BeanUtils.copyProperties(tool, cloned);
        cloned.setId(null);
        cloned.setEnv(targetEnv);
        cloned.setStatus("REGISTERED");
        cloned.setCreateUser(userId);
        cloned.setCreateDate(LocalDateTime.now());
        cloned.setUpdateUser(null);
        cloned.setUpdateDate(null);
        McpTool saved = repository.save(cloned);
        return saved.getId();
    }

    @Override
    public List<McpToolDto> listRuntimeTools(String env, String appId) {
        List<McpTool> tools;
        if (StringUtils.hasText(appId)) {
            tools = repository.findByEnvAndStatusAndVisibilityJsonContaining(env, "ENABLED", appId);
        } else {
            tools = repository.findByEnvAndStatus(env, "ENABLED");
        }
        return convertToDtos(tools);
    }

    @Override
    public McpToolMetricsResponseDto queryMetrics(String toolId, LocalDateTime from, LocalDateTime to) {
        McpToolMetricsResponseDto response = new McpToolMetricsResponseDto();
        response.setSuccessRate(new ArrayList<>());
        response.setLatencyP95(new ArrayList<>());
        response.setLatencyP99(new ArrayList<>());
        return response;
    }
}

