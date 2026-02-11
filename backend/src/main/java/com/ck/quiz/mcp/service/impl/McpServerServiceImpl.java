package com.ck.quiz.mcp.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.mcp.dto.*;
import com.ck.quiz.mcp.entity.McpServer;
import com.ck.quiz.mcp.entity.McpTool;
import com.ck.quiz.mcp.repository.McpServerRepository;
import com.ck.quiz.mcp.repository.McpToolRepository;
import com.ck.quiz.mcp.service.McpServerService;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class McpServerServiceImpl extends
        BaseServiceImpl<McpServerCreateDto, McpServerUpdateDto, McpServerQueryDto, McpServerDto, McpServer, McpServerRepository>
        implements McpServerService {

    private static final Logger logger = LoggerFactory.getLogger(McpServerServiceImpl.class);

    @Autowired
    private McpToolRepository mcpToolRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    protected McpServerDto newDto() {
        return new McpServerDto();
    }

    @Override
    protected McpServer newModel() {
        return new McpServer();
    }

    @Override
    public McpServerDto create(McpServerCreateDto createDto) {
        McpServer existing = repository.findByIdentifier(createDto.getIdentifier());
        if (existing != null) {
            throw new IllegalArgumentException("服务器标识已存在: " + createDto.getIdentifier());
        }
        return super.create(createDto);
    }

    @Override
    public McpServerDto update(String userId, McpServerUpdateDto updateDto) {
        McpServer server = repository.findById(updateDto.getId())
                .orElseThrow(() -> new IllegalArgumentException("Server not found: " + updateDto.getId()));
        
        if (server.getCreateUser() != null && !server.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No permission to update server: " + updateDto.getId());
        }

        if (updateDto.getIdentifier() != null && !updateDto.getIdentifier().equals(server.getIdentifier())) {
            McpServer existing = repository.findByIdentifier(updateDto.getIdentifier());
            if (existing != null) {
                throw new IllegalArgumentException("服务器标识已存在: " + updateDto.getIdentifier());
            }
            server.setIdentifier(updateDto.getIdentifier());
        }

        if (updateDto.getName() != null) server.setName(updateDto.getName());
        if (updateDto.getDescription() != null) server.setDescription(updateDto.getDescription());
        if (updateDto.getAddress() != null) server.setAddress(updateDto.getAddress());
        if (updateDto.getAuthConfig() != null) server.setAuthConfig(updateDto.getAuthConfig());

        McpServer saved = repository.save(server);
        return convertToDto(saved, true);
    }

    @Override
    public McpServerDto convertToDto(McpServer model, Boolean loadProps) {
        McpServerDto dto = (McpServerDto) super.convertToDto(model, loadProps);
        dto.setAuthConfig(model.getAuthConfig());
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

        if (StringUtils.hasText(queryDto.getStatus())) {
            JdbcQueryHelper.equals("status", queryDto.getStatus(), " and s.status = :status ", params, sql, countSql);
        }

        JdbcQueryHelper.order("create_date", "desc", sql);
        String limitSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(), queryDto.getPageNum(), queryDto.getPageSize());

        List<McpServerDto> list = namedParameterJdbcTemplate.query(limitSql, params, (rs, rowNum) -> {
            McpServerDto dto = new McpServerDto();
            dto.setId(rs.getString("id"));
            dto.setName(rs.getString("name"));
            dto.setIdentifier(rs.getString("identifier"));
            dto.setDescription(rs.getString("description"));
            dto.setAddress(rs.getString("address"));
            dto.setAuthConfig(rs.getString("auth_config"));
            dto.setStatus(rs.getString("status"));
            dto.setLastHeartbeatAt(rs.getTimestamp("last_heartbeat_at") != null ? rs.getTimestamp("last_heartbeat_at").toLocalDateTime() : null);
            dto.setHasAuthConfig(StringUtils.hasText(rs.getString("auth_config")));
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateDate(rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            return dto;
        });

        return JdbcQueryHelper.toPage(namedParameterJdbcTemplate, countSql.toString(), params, list, queryDto.getPageNum(), queryDto.getPageSize());
    }

    @Override
    public McpServerDto healthCheck(String userId, String serverId) {
        McpServer server = repository.findById(serverId)
                .orElseThrow(() -> new IllegalArgumentException("Server not found: " + serverId));

        Map<String, Object> pingRequest = Map.of(
                "jsonrpc", "2.0",
                "method", "ping",
                "id", IdHelper.genUuid());

        try {
            logger.info("Health check request - Address: {}, Request: {}", server.getAddress(), pingRequest);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(pingRequest, createHeaders(server));
            ResponseEntity<Map> response = restTemplate.exchange(server.getAddress(), HttpMethod.POST, entity, Map.class);

            logger.info("Health check response - Status: {}, Headers: {}, Body: {}", 
                    response.getStatusCode(), response.getHeaders(), response.getBody());

            if (response.getStatusCode().is2xxSuccessful()) {
                server.setLastHeartbeatAt(LocalDateTime.now());
                server.setStatus("ACTIVE");
            }else{
                server.setStatus("INACTIVE");
            }
        } catch (Exception e) {
            server.setStatus("INACTIVE");
            logger.error("MCP Ping failed for server: {}. Request: {}", serverId, pingRequest, e);
        }
        McpServer saved = repository.save(server);
        return convertToDto(saved, true);
    }

    @Override
    public List<McpDiscoveredToolDto> listDiscoveredTools(String serverId) {
        McpServer server = repository.findById(serverId)
                .orElseThrow(() -> new IllegalArgumentException("Server not found: " + serverId));

        Map<String, Object> listRequest = Map.of(
                "jsonrpc", "2.0",
                "method", "tools/list",
                "id", IdHelper.genUuid(),
                "params", Collections.emptyMap());

        try {
            logger.info("List tools request - Address: {}, Request: {}", server.getAddress(), listRequest);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(listRequest, createHeaders(server));
            ResponseEntity<Map> response = restTemplate.exchange(server.getAddress(), HttpMethod.POST, entity, Map.class);

            logger.info("List tools response - Status: {}, Headers: {}, Body: {}", 
                    response.getStatusCode(), response.getHeaders(), response.getBody());

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                if (body.containsKey("result")) {
                    Map<String, Object> result = (Map<String, Object>) body.get("result");
                    List<Map<String, Object>> tools = (List<Map<String, Object>>) result.get("tools");

                    if (tools != null) {
                        return tools.stream().map(toolMap -> {
                            String name = (String) toolMap.get("name");
                            String desc = (String) toolMap.get("description");
                            Map<String, Object> schema = (Map<String, Object>) toolMap.get("inputSchema");

                            McpDiscoveredToolDto dto = new McpDiscoveredToolDto();
                            dto.setName(name);
                            dto.setDescription(desc);
                            dto.setInputSchema(schema);

                            // 同步保存到数据库
                            saveMcpTool(serverId, server.getIdentifier(), name, desc, schema);
                            return dto;
                        }).collect(Collectors.toList());
                    }
                } else if (body.containsKey("error")) {
                    logger.error("MCP server error: {}", body.get("error"));
                }
            }
        } catch (Exception e) {
            logger.error("Discovery failed for server: {}. Request: {}", serverId, listRequest, e);
            throw new RuntimeException("Tools discovery failed: " + e.getMessage());
        }
        return Collections.emptyList();
    }

    private HttpHeaders createHeaders(McpServer server) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (StringUtils.hasText(server.getAuthConfig())) {
            // 默认采用 Bearer Token 模式（适配阿里云百炼等）
            headers.set("Authorization", "Bearer " + server.getAuthConfig().trim());
        }
        return headers;
    }

    private void saveMcpTool(String serverId, String env, String toolName, String toolDescription, Map<String, Object> inputSchema) {
        try {
            // 查询是否已存在该服务器下的同名原始工具
            List<McpTool> existing = mcpToolRepository.findByServerId(serverId);
            Optional<McpTool> targetTool = existing.stream()
                    .filter(t -> toolName.equals(t.getOriginName()))
                    .findFirst();

            McpTool tool = targetTool.orElseGet(() -> {
                McpTool newTool = new McpTool();
                newTool.setServerId(serverId);
                newTool.setOriginName(toolName);
                newTool.setDisplayName(toolName);
                newTool.setStatus("REGISTERED");
                return newTool;
            });

            tool.setEnv(env);
            tool.setDescription(toolDescription);
            tool.setSourceDeletedFlag(false);

            if (inputSchema != null) {
                tool.setSchemaJson(objectMapper.writeValueAsString(inputSchema));
            }

            mcpToolRepository.save(tool);
        } catch (Exception e) {
            logger.error("Save tool failed: {}", toolName, e);
        }
    }
}