package com.ck.quiz.mcp.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.mcp.dto.McpDiscoveredToolDto;
import com.ck.quiz.mcp.dto.McpServerCreateDto;
import com.ck.quiz.mcp.dto.McpServerDto;
import com.ck.quiz.mcp.dto.McpServerQueryDto;
import com.ck.quiz.mcp.dto.McpServerUpdateDto;
import com.ck.quiz.mcp.dto.McpToolCreateDto;
import com.ck.quiz.mcp.dto.McpToolDto;
import com.ck.quiz.mcp.dto.McpToolImportItemDto;
import com.ck.quiz.mcp.entity.McpServer;
import com.ck.quiz.mcp.entity.McpTool;
import com.ck.quiz.mcp.repository.McpServerRepository;
import com.ck.quiz.mcp.repository.McpToolRepository;
import com.ck.quiz.mcp.service.McpServerService;
import com.ck.quiz.mcp.service.McpToolService;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class McpServerServiceImpl extends
        BaseServiceImpl<McpServerCreateDto, McpServerUpdateDto, McpServerQueryDto, McpServerDto, McpServer, McpServerRepository>
        implements McpServerService {

    @Autowired
    private McpToolRepository mcpToolRepository;

    @Autowired
    private McpToolService mcpToolService;

    @Override
    protected McpServerDto newDto() {
        return new McpServerDto();
    }

    @Override
    protected McpServer newModel() {
        return new McpServer();
    }

    @Override
    public McpServerDto update(String userId, McpServerUpdateDto updateDto) {
        McpServer server = repository.findById(updateDto.getId())
                .orElseThrow(() -> new IllegalArgumentException("Server not found: " + updateDto.getId()));
        if (server.getCreateUser() != null && !server.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No permission to update server: " + updateDto.getId());
        }
        if (updateDto.getName() != null) {
            server.setName(updateDto.getName());
        }
        if (updateDto.getIdentifier() != null) {
            server.setIdentifier(updateDto.getIdentifier());
        }
        if (updateDto.getDescription() != null) {
            server.setDescription(updateDto.getDescription());
        }
        if (updateDto.getEnv() != null) {
            server.setEnv(updateDto.getEnv());
        }
        if (updateDto.getAddress() != null) {
            server.setAddress(updateDto.getAddress());
        }
        if (updateDto.getProtocol() != null) {
            server.setProtocol(updateDto.getProtocol());
        }
        if (updateDto.getAuthType() != null) {
            server.setAuthType(updateDto.getAuthType());
        }
        if (updateDto.getNewAuthConfig() != null) {
            server.setAuthConfig(updateDto.getNewAuthConfig());
        }
        McpServer saved = repository.save(server);
        return convertToDto(saved, true);
    }

    @Override
    public McpServerDto convertToDto(McpServer model, Boolean loadProps) {
        McpServerDto dto = (McpServerDto) super.convertToDto(model, loadProps);
        dto.setHasAuthConfig(StringUtils.hasText(model.getAuthConfig()));
        return dto;
    }

    @Override
    public Page<McpServerDto> search(String userId, McpServerQueryDto queryDto) {
        StringBuilder sql = new StringBuilder("select s.* from mcp_server s where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from mcp_server s where 1=1 ");
        Map<String, Object> params = new HashMap<>();
        JdbcQueryHelper.lowerLike("keyWord", queryDto.getKeyWord(),
                " and (lower(s.name) like :keyWord or lower(s.identifier) like :keyWord) ", params,
                namedParameterJdbcTemplate, sql, countSql);
        if (StringUtils.hasText(queryDto.getEnv())) {
            JdbcQueryHelper.equals("env", queryDto.getEnv(), " and s.env = :env ", params, sql, countSql);
        }
        if (StringUtils.hasText(queryDto.getStatus())) {
            JdbcQueryHelper.equals("status", queryDto.getStatus(), " and s.status = :status ", params, sql,
                    countSql);
        }
        JdbcQueryHelper.order("create_date", "desc", sql);
        String limitSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(),
                queryDto.getPageNum(), queryDto.getPageSize());
        List<McpServerDto> list = namedParameterJdbcTemplate.query(limitSql, params, (rs, rowNum) -> {
            McpServerDto dto = new McpServerDto();
            dto.setId(rs.getString("id"));
            dto.setName(rs.getString("name"));
            dto.setIdentifier(rs.getString("identifier"));
            dto.setDescription(rs.getString("description"));
            dto.setEnv(rs.getString("env"));
            dto.setAddress(rs.getString("address"));
            dto.setProtocol(rs.getString("protocol"));
            dto.setAuthType(rs.getString("auth_type"));
            dto.setStatus(rs.getString("status"));
            dto.setLastHeartbeatAt(
                    rs.getTimestamp("last_heartbeat_at") != null
                            ? rs.getTimestamp("last_heartbeat_at").toLocalDateTime()
                            : null);
            dto.setHasAuthConfig(rs.getString("auth_config") != null);
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
    public void healthCheck(String userId, String serverId) {
        McpServer server = repository.findById(serverId)
                .orElseThrow(() -> new IllegalArgumentException("Server not found: " + serverId));
        server.setLastHeartbeatAt(LocalDateTime.now());
        if (!StringUtils.hasText(server.getStatus()) || "CREATED".equals(server.getStatus())) {
            server.setStatus("ACTIVE");
        }
        repository.save(server);
    }

    @Override
    public List<McpDiscoveredToolDto> listDiscoveredTools(String serverId) {
        List<McpTool> tools = mcpToolRepository.findByServerId(serverId);
        return tools.stream().map(tool -> {
            McpDiscoveredToolDto dto = new McpDiscoveredToolDto();
            dto.setOriginName(tool.getOriginName());
            dto.setOriginDescription(tool.getDescription());
            dto.setSchemaDigest(null);
            dto.setRegistered(true);
            dto.setRegisteredToolId(tool.getId());
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public List<String> importTools(String userId, String serverId, List<McpToolImportItemDto> tools) {
        return tools.stream().map(item -> {
            McpToolCreateDto createDto = new McpToolCreateDto();
            createDto.setServerId(serverId);
            McpServer server = repository.findById(serverId)
                    .orElseThrow(() -> new IllegalArgumentException("Server not found: " + serverId));
            createDto.setEnv(server.getEnv());
            createDto.setOriginName(item.getOriginName());
            createDto.setDisplayName(item.getDisplayName());
            createDto.setDescription(item.getDescription());
            createDto.setCategory(item.getCategory());
            createDto.setTags(item.getTags());
            createDto.setSchemaJson(null);
            createDto.setStrategyJson(null);
            createDto.setVisibilityJson(null);
            McpToolDto dto = mcpToolService.create(createDto);
            return dto.getId();
        }).collect(Collectors.toList());
    }
}
