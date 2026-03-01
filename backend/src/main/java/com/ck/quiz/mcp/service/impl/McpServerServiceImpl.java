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
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.*;

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

    @Autowired
    private WebClient.Builder webClientBuilder;

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

        if (updateDto.getName() != null)
            server.setName(updateDto.getName());
        if (updateDto.getDescription() != null)
            server.setDescription(updateDto.getDescription());
        if (updateDto.getAddress() != null)
            server.setAddress(updateDto.getAddress());
        if (updateDto.getAuthConfig() != null)
            server.setAuthConfig(updateDto.getAuthConfig());

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
        String limitSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(), queryDto.getPageNum(),
                queryDto.getPageSize());

        List<McpServerDto> list = namedParameterJdbcTemplate.query(limitSql, params, (rs, rowNum) -> {
            McpServerDto dto = new McpServerDto();
            dto.setId(rs.getString("id"));
            dto.setName(rs.getString("name"));
            dto.setIdentifier(rs.getString("identifier"));
            dto.setDescription(rs.getString("description"));
            dto.setAddress(rs.getString("address"));
            dto.setAuthConfig(rs.getString("auth_config"));
            dto.setStatus(rs.getString("status"));
            dto.setLastHeartbeatAt(rs.getTimestamp("last_heartbeat_at") != null
                    ? rs.getTimestamp("last_heartbeat_at").toLocalDateTime()
                    : null);
            dto.setHasAuthConfig(StringUtils.hasText(rs.getString("auth_config")));
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateDate(
                    rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            return dto;
        });

        return JdbcQueryHelper.toPage(namedParameterJdbcTemplate, countSql.toString(), params, list,
                queryDto.getPageNum(), queryDto.getPageSize());
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
            ResponseEntity<Map> response = restTemplate.exchange(server.getAddress(), HttpMethod.POST, entity,
                    Map.class);

            logger.info("Health check response - Status: {}, Headers: {}, Body: {}",
                    response.getStatusCode(), response.getHeaders(), response.getBody());

            if (response.getStatusCode().is2xxSuccessful()) {
                server.setLastHeartbeatAt(LocalDateTime.now());
                server.setStatus("ACTIVE");
            } else {
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

        try {
            logger.info("Starting MCP tool discovery for server: {}, address: {}", serverId, server.getAddress());
            String endpoint = performHandshake(server);
            logger.info("Handshake completed, endpoint: {}", endpoint);
            performInitialize(server, endpoint);
            logger.info("Initialize completed for server: {}", serverId);
            List<McpDiscoveredToolDto> resultList = discoverTools(server, endpoint, serverId);
            logger.info("Tool discovery completed, found {} tools", resultList.size());
            return resultList;
        } catch (Exception e) {
            logger.error("MCP tool discovery failed for server: {}", serverId, e);
            throw new RuntimeException("Tool discovery failed: " + e.getMessage(), e);
        }
    }

    private String performHandshake(McpServer server) {
        WebClient webClient = buildWebClient(server);
        final String[] endpoint = {null};
        final RuntimeException[] error = {null};

        String baseAddress = server.getAddress();
        String handshakeUrl = baseAddress.endsWith("/sse") ? baseAddress : baseAddress + "/sse";

        logger.info("Starting handshake with server: {}", handshakeUrl);

        try {
            webClient.post()
                    .uri(handshakeUrl)
                    .accept(MediaType.TEXT_EVENT_STREAM)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of("jsonrpc", "2.0"))
                    .retrieve()
                    .bodyToFlux(String.class)
                    .filter(StringUtils::hasText)
                    .doOnNext(line -> {
                        try {
                            if (line.startsWith("data:")) {
                                String jsonData = line.substring(5).trim();
                                if (StringUtils.hasText(jsonData)) {
                                    try {
                                        Map<String, Object> data = objectMapper.readValue(jsonData, Map.class);
                                        String sessionId = null;
                                        if (data.containsKey("session_id")) {
                                            sessionId = (String) data.get("session_id");
                                        }
                                        if (!StringUtils.hasText(sessionId) && data.containsKey("endpoint")) {
                                            Object endpointObj = data.get("endpoint");
                                            if (endpointObj instanceof Map) {
                                                Map<String, Object> endpointMap = (Map<String, Object>) endpointObj;
                                                sessionId = (String) endpointMap.get("session_id");
                                            } else if (endpointObj instanceof String) {
                                                sessionId = (String) endpointObj;
                                            }
                                        }

                                        if (StringUtils.hasText(sessionId)) {
                                            endpoint[0] = baseAddress + "/sse?session_id=" + sessionId;
                                        }
                                    } catch (Exception e) {
                                        if (StringUtils.hasText(jsonData) && !jsonData.startsWith("{")) {
                                            endpoint[0] = baseAddress + "/sse?session_id=" + jsonData.trim();
                                        }
                                    }
                                }
                            }
                        } catch (Exception e) {
                            logger.warn("Exception processing handshake line", e);
                        }
                    })
                    .timeout(java.time.Duration.ofSeconds(20))
                    .doOnError(e -> error[0] = new RuntimeException("Handshake SSE connection failed: " + e.getMessage(), e))
                    .onErrorResume(e -> reactor.core.publisher.Flux.empty())
                    .blockLast();

        } catch (Exception e) {
            if (error[0] == null) {
                error[0] = new RuntimeException("Handshake connection error: " + e.getMessage(), e);
            }
        }

        if (error[0] != null) {
            throw error[0];
        }

        if (!StringUtils.hasText(endpoint[0])) {
            throw new RuntimeException("Failed to obtain endpoint from handshake");
        }

        return endpoint[0];
    }

    private void performInitialize(McpServer server, String endpoint) {
        WebClient webClient = buildWebClient(server);

        Map<String, Object> initRequest = Map.of(
                "jsonrpc", "2.0",
                "id", IdHelper.genUuid(),
                "method", "initialize",
                "params", Map.of(
                        "protocolVersion", "2024-11-05",
                        "capabilities", Map.of(),
                        "clientInfo", Map.of(
                                "name", "mcp-java-backend",
                                "version", "1.0.0"
                        )
                )
        );

        final RuntimeException[] error = {null};

        try {
            webClient.post()
                    .uri(endpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(initRequest)
                    .retrieve()
                    .bodyToFlux(String.class)
                    .filter(StringUtils::hasText)
                    .doOnNext(line -> {
                        if (line.startsWith("data:")) {
                            String jsonData = line.substring(5).trim();
                            if (StringUtils.hasText(jsonData)) {
                                try {
                                    Map<String, Object> response = objectMapper.readValue(jsonData, Map.class);
                                    if (response.containsKey("error")) {
                                        Map<String, Object> errObj = (Map<String, Object>) response.get("error");
                                        String errMsg = (String) errObj.getOrDefault("message", "Unknown error");
                                        error[0] = new RuntimeException("Initialize failed: " + errMsg);
                                    }
                                } catch (Exception ignored) {
                                }
                            }
                        }
                    })
                    .timeout(java.time.Duration.ofSeconds(20))
                    .doOnError(e -> error[0] = new RuntimeException("Initialize request failed: " + e.getMessage(), e))
                    .onErrorResume(e -> reactor.core.publisher.Flux.empty())
                    .blockLast();

        } catch (Exception e) {
            if (error[0] == null) {
                error[0] = new RuntimeException("Initialize connection error: " + e.getMessage(), e);
            }
        }

        if (error[0] != null) {
            throw error[0];
        }
    }

    private List<McpDiscoveredToolDto> discoverTools(McpServer server, String endpoint, String serverId) {
        WebClient webClient = buildWebClient(server);
        List<McpDiscoveredToolDto> resultList = new ArrayList<>();

        Map<String, Object> listRequest = Map.of(
                "jsonrpc", "2.0",
                "method", "tools/list",
                "id", IdHelper.genUuid(),
                "params", Collections.emptyMap()
        );

        final RuntimeException[] error = {null};

        try {
            webClient.post()
                    .uri(endpoint)
                    .accept(MediaType.TEXT_EVENT_STREAM)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(listRequest)
                    .retrieve()
                    .bodyToFlux(String.class)
                    .filter(StringUtils::hasText)
                    .doOnNext(line -> {
                        try {
                            if (line.startsWith("data:")) {
                                String jsonData = line.substring(5).trim();
                                if (StringUtils.hasText(jsonData)) {
                                    Map<String, Object> body = objectMapper.readValue(jsonData, Map.class);
                                    if (body.containsKey("error")) {
                                        Map<String, Object> errObj = (Map<String, Object>) body.get("error");
                                        String errMsg = (String) errObj.getOrDefault("message", "Unknown error");
                                        error[0] = new RuntimeException("Tool discovery failed: " + errMsg);
                                        return;
                                    }

                                    if (body.containsKey("result")) {
                                        Map<String, Object> result = (Map<String, Object>) body.get("result");
                                        List<Map<String, Object>> tools = (List<Map<String, Object>>) result.get("tools");

                                        if (tools != null && !tools.isEmpty()) {
                                            for (Map<String, Object> toolMap : tools) {
                                                String name = (String) toolMap.get("name");
                                                String desc = (String) toolMap.get("description");
                                                Map<String, Object> schema = (Map<String, Object>) toolMap.get("inputSchema");

                                                McpDiscoveredToolDto dto = new McpDiscoveredToolDto();
                                                dto.setName(name);
                                                dto.setDescription(desc);
                                                dto.setInputSchema(schema);

                                                resultList.add(dto);
                                                saveMcpTool(serverId, server.getIdentifier(), name, desc, schema);
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (Exception e) {
                            logger.warn("Failed to parse tools/list response line", e);
                        }
                    })
                    .timeout(java.time.Duration.ofSeconds(30))
                    .doOnError(e -> error[0] = new RuntimeException("Tool discovery request failed: " + e.getMessage(), e))
                    .onErrorResume(e -> reactor.core.publisher.Flux.empty())
                    .blockLast();

        } catch (Exception e) {
            if (error[0] == null) {
                error[0] = new RuntimeException("Tool discovery connection error: " + e.getMessage(), e);
            }
        }

        if (error[0] != null) {
            throw error[0];
        }

        return resultList;
    }

    private WebClient buildWebClient(McpServer server) {
        WebClient webClient = webClientBuilder
                .baseUrl(server.getAddress())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();

        if (StringUtils.hasText(server.getAuthConfig())) {
            webClient = webClient.mutate()
                    .defaultHeader("Authorization", "Bearer " + server.getAuthConfig().trim())
                    .build();
        }

        return webClient;
    }

    private HttpHeaders createHeaders(McpServer server) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (StringUtils.hasText(server.getAuthConfig())) {
            headers.set("Authorization", "Bearer " + server.getAuthConfig().trim());
        }
        return headers;
    }

    private void saveMcpTool(String serverId, String env, String toolName, String toolDescription,
                             Map<String, Object> inputSchema) {
        try {
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

    @Override
    public McpToolCallResultDto callTool(McpToolCallRequestDto request) {
        String serverId = request.getServerId();
        String toolName = request.getToolName();
        Map<String, Object> arguments = request.getArguments();

        long startTime = System.currentTimeMillis();

        McpServer server = repository.findById(serverId)
                .orElseThrow(() -> new IllegalArgumentException("Server not found: " + serverId));

        try {
            String endpoint = performHandshake(server);
            performInitialize(server, endpoint);
            McpToolCallResultDto result = executeToolCall(server, endpoint, toolName, arguments);
            result.setDuration(System.currentTimeMillis() - startTime);
            return result;
        } catch (Exception e) {
            logger.error("MCP tool call failed - Server: {}, Tool: {}", serverId, toolName, e);
            McpToolCallResultDto errorResult = new McpToolCallResultDto(toolName, false, e.getMessage());
            errorResult.setDuration(System.currentTimeMillis() - startTime);
            return errorResult;
        }
    }

    private McpToolCallResultDto executeToolCall(McpServer server, String endpoint, String toolName,
                                                 Map<String, Object> arguments) {
        WebClient webClient = buildWebClient(server);
        final McpToolCallResultDto[] result = {null};
        final RuntimeException[] error = {null};

        Map<String, Object> callRequest = Map.of(
                "jsonrpc", "2.0",
                "method", "tools/call",
                "id", IdHelper.genUuid(),
                "params", Map.of(
                        "name", toolName,
                        "arguments", arguments != null ? arguments : Collections.emptyMap()
                )
        );

        try {
            webClient.post()
                    .uri(endpoint)
                    .accept(MediaType.TEXT_EVENT_STREAM)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(callRequest)
                    .retrieve()
                    .bodyToFlux(String.class)
                    .filter(StringUtils::hasText)
                    .doOnNext(line -> {
                        try {
                            if (line.startsWith("data:")) {
                                String jsonData = line.substring(5).trim();
                                if (StringUtils.hasText(jsonData)) {
                                    Map<String, Object> body = objectMapper.readValue(jsonData, Map.class);

                                    if (body.containsKey("error")) {
                                        Map<String, Object> errObj = (Map<String, Object>) body.get("error");
                                        String errMsg = (String) errObj.getOrDefault("message", "Unknown error");
                                        error[0] = new RuntimeException("Tool execution failed: " + errMsg);
                                        result[0] = new McpToolCallResultDto(toolName, false, errMsg);
                                        result[0].setRawResponse(body);
                                        return;
                                    }

                                    if (body.containsKey("result")) {
                                        Map<String, Object> resultObj = (Map<String, Object>) body.get("result");
                                        List<Map<String, Object>> content = (List<Map<String, Object>>) resultObj.get("content");
                                        McpToolCallResultDto callResult = new McpToolCallResultDto(
                                                toolName,
                                                true,
                                                content != null ? content : new ArrayList<>()
                                        );
                                        callResult.setRawResponse(body);
                                        result[0] = callResult;
                                    }
                                }
                            }
                        } catch (Exception e) {
                            logger.warn("Failed to parse tool call response", e);
                        }
                    })
                    .timeout(java.time.Duration.ofSeconds(30))
                    .doOnError(e -> error[0] = new RuntimeException("Tool call request failed: " + e.getMessage(), e))
                    .onErrorResume(e -> reactor.core.publisher.Flux.empty())
                    .blockLast();

        } catch (Exception e) {
            if (error[0] == null) {
                error[0] = new RuntimeException("Tool call connection error: " + e.getMessage(), e);
            }
        }

        if (error[0] != null) {
            throw error[0];
        }

        if (result[0] == null) {
            result[0] = new McpToolCallResultDto(toolName, false, "No response from server");
        }

        return result[0];
    }
}
