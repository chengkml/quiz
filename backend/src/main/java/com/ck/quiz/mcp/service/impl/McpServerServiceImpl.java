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

            // 阶段一：握手 - 获取 session ID
            String endpoint = performHandshake(server);
            logger.info("Handshake completed, endpoint: {}", endpoint);

            // 阶段二：初始化 - 发送 initialize 指令
            performInitialize(server, endpoint);
            logger.info("Initialize completed for server: {}", serverId);

            // 阶段三：发现工具 - 获取并保存工具列表
            List<McpDiscoveredToolDto> resultList = discoverTools(server, endpoint, serverId);
            logger.info("Tool discovery completed, found {} tools", resultList.size());

            return resultList;

        } catch (Exception e) {
            logger.error("MCP tool discovery failed for server: {}", serverId, e);
            throw new RuntimeException("Tool discovery failed: " + e.getMessage(), e);
        }
    }

    /**
     * 阶段一：握手 - 建立 SSE 连接并获取 endpoint（session_id）
     * 流程：向 /sse 端点发送 POST 请求，等待接收 event: endpoint 消息
     */
    private String performHandshake(McpServer server) {
        WebClient webClient = buildWebClient(server);
        final String[] endpoint = {null};
        final RuntimeException[] error = {null};
        final StringBuilder[] sseBuffer = {new StringBuilder()};

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
                    .bodyToFlux(org.springframework.http.codec.ServerSentEvent.class)
                    .doOnNext(event -> {
                        sseBuffer[0].append(event).append("\n");
                        String eventType = event.event();
                        Object dataObj = event.data();

                        logger.debug("Handshake SSE event: {}, data: {}", eventType, dataObj);

                        if ("endpoint".equals(eventType) && dataObj != null) {
                            try {
                                Map<String, Object> data;
                                if (dataObj instanceof String) {
                                    String jsonData = ((String) dataObj).trim();
                                    data = objectMapper.readValue(jsonData, Map.class);
                                } else if (dataObj instanceof Map) {
                                    data = (Map<String, Object>) dataObj;
                                } else {
                                    return;
                                }

                                String sessionId = (String) data.get("session_id");
                                if (StringUtils.hasText(sessionId)) {
                                    endpoint[0] = baseAddress + "/sse?session_id=" + sessionId;
                                    logger.info("Received session_id from handshake: {}", sessionId);
                                }
                            } catch (Exception e) {
                                error[0] = new RuntimeException("Failed to parse endpoint data", e);
                            }
                        }
                    })
                    .timeout(java.time.Duration.ofSeconds(15))
                    .doOnError(e -> {
                        logger.error("Handshake SSE stream error: {}", e.getMessage());
                        error[0] = new RuntimeException("Handshake SSE connection failed: " + e.getMessage(), e);
                    })
                    .onErrorResume(e -> {
                        logger.error("Handshake error (resuming)", e);
                        return reactor.core.publisher.Flux.empty();
                    })
                    .blockLast();

            logger.debug("Handshake SSE stream ended. Buffer content:\n{}", sseBuffer[0].toString());

        } catch (Exception e) {
            logger.error("Handshake blockLast failed", e);
            if (error[0] == null) {
                error[0] = new RuntimeException("Handshake connection error: " + e.getMessage(), e);
            }
        }

        if (error[0] != null) {
            throw error[0];
        }

        if (!StringUtils.hasText(endpoint[0])) {
            logger.error("Failed to obtain endpoint from handshake. SSE buffer:\n{}", sseBuffer[0].toString());
            throw new RuntimeException("Failed to obtain endpoint from handshake - no valid session_id received");
        }

        logger.info("Handshake successful, endpoint: {}", endpoint[0]);
        return endpoint[0];
    }

    /**
     * 阶段二：初始化 - 发送 initialize 指令
     * 这是必需的握手步骤，否则服务器不会响应后续指令
     */
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
        final StringBuilder[] sseBuffer = {new StringBuilder()};

        logger.info("Sending initialize request to endpoint: {}", endpoint);

        try {
            webClient.post()
                    .uri(endpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(initRequest)
                    .retrieve()
                    .bodyToFlux(String.class)
                    .doOnNext(line -> {
                        sseBuffer[0].append(line).append("\n");
                        logger.debug("Initialize SSE raw line: {}", line);

                        if (!StringUtils.hasText(line)) {
                            return;
                        }

                        try {
                            if (line.startsWith("data:")) {
                                String jsonData = line.substring(5).trim();
                                logger.debug("Parsing initialize data: {}", jsonData);

                                if (StringUtils.hasText(jsonData)) {
                                    Map<String, Object> response = objectMapper.readValue(jsonData, Map.class);
                                    logger.debug("Initialize response: {}", response);

                                    if (response.containsKey("error")) {
                                        Map<String, Object> errObj = (Map<String, Object>) response.get("error");
                                        error[0] = new RuntimeException("Initialize failed: " + errObj.get("message"));
                                    } else if (response.containsKey("result")) {
                                        logger.info("Initialize successful, result: {}", response.get("result"));
                                    }
                                }
                            }
                        } catch (Exception e) {
                            logger.warn("Failed to parse initialize response line, continuing...", e);
                        }
                    })
                    .timeout(java.time.Duration.ofSeconds(15))
                    .doOnError(e -> {
                        logger.error("Initialize SSE stream error: {}", e.getMessage());
                        error[0] = new RuntimeException("Initialize request failed: " + e.getMessage(), e);
                    })
                    .onErrorResume(e -> {
                        logger.error("Initialize error (resuming)", e);
                        return reactor.core.publisher.Flux.empty();
                    })
                    .blockLast();

            logger.debug("Initialize SSE stream ended. Buffer:\n{}", sseBuffer[0].toString());

        } catch (Exception e) {
            logger.error("Initialize blockLast failed", e);
            if (error[0] == null) {
                error[0] = new RuntimeException("Initialize connection error: " + e.getMessage(), e);
            }
        }

        // 检查错误
        if (error[0] != null) {
            throw error[0];
        }

        logger.info("Initialize completed successfully");
    }

    /**
     * 阶段三：发现工具 - 发送 tools/list 指令并收集结果
     */
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
        final StringBuilder[] sseBuffer = {new StringBuilder()};

        logger.info("Sending tools/list request to endpoint: {}", endpoint);

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
                        sseBuffer[0].append(line).append("\n");
                        logger.debug("Tool discovery SSE raw line: {}", line);

                        try {
                            if (line.startsWith("data:")) {
                                String jsonData = line.substring(5).trim();
                                logger.debug("Parsing tools/list data: {}", jsonData);

                                if (StringUtils.hasText(jsonData)) {
                                    Map<String, Object> body = objectMapper.readValue(jsonData, Map.class);
                                    logger.debug("Tool discovery response: {}", body);

                                    // 检查是否有错误
                                    if (body.containsKey("error")) {
                                        Map<String, Object> errObj = (Map<String, Object>) body.get("error");
                                        error[0] = new RuntimeException("Tool discovery failed: " + errObj.get("message"));
                                        logger.error("Tool discovery error: {}", errObj.get("message"));
                                        return;
                                    }

                                    // 解析结果
                                    if (body.containsKey("result")) {
                                        Map<String, Object> result = (Map<String, Object>) body.get("result");
                                        List<Map<String, Object>> tools = (List<Map<String, Object>>) result.get("tools");

                                        if (tools != null && !tools.isEmpty()) {
                                            logger.info("Received {} tools from server", tools.size());

                                            for (Map<String, Object> toolMap : tools) {
                                                String name = (String) toolMap.get("name");
                                                String desc = (String) toolMap.get("description");
                                                Map<String, Object> schema = (Map<String, Object>) toolMap.get("inputSchema");

                                                McpDiscoveredToolDto dto = new McpDiscoveredToolDto();
                                                dto.setName(name);
                                                dto.setDescription(desc);
                                                dto.setInputSchema(schema);

                                                resultList.add(dto);

                                                logger.debug("Discovered tool: {} - {}", name, desc);
                                                saveMcpTool(serverId, server.getIdentifier(), name, desc, schema);
                                            }
                                        } else {
                                            logger.warn("No tools found in response");
                                        }
                                    }
                                }
                            }
                        } catch (Exception e) {
                            logger.warn("Failed to parse tools/list response line, continuing...", e);
                        }
                    })
                    .timeout(java.time.Duration.ofSeconds(30))
                    .doOnError(e -> {
                        logger.error("Tool discovery SSE stream error: {}", e.getMessage());
                        error[0] = new RuntimeException("Tool discovery request failed: " + e.getMessage(), e);
                    })
                    .onErrorResume(e -> {
                        logger.error("Tool discovery error (resuming)", e);
                        return reactor.core.publisher.Flux.empty();
                    })
                    .blockLast();

            logger.debug("Tool discovery SSE stream ended. Buffer:\n{}", sseBuffer[0].toString());

        } catch (Exception e) {
            logger.error("Tool discovery blockLast failed", e);
            if (error[0] == null) {
                error[0] = new RuntimeException("Tool discovery connection error: " + e.getMessage(), e);
            }
        }

        // 检查错误
        if (error[0] != null) {
            throw error[0];
        }

        logger.info("Tool discovery completed, found {} tools", resultList.size());
        return resultList;
    }

    /**
     * 构建 WebClient，带上认证信息
     */
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
            // 默认采用 Bearer Token 模式（适配阿里云百炼等）
            headers.set("Authorization", "Bearer " + server.getAuthConfig().trim());
        }
        return headers;
    }

    private void saveMcpTool(String serverId, String env, String toolName, String toolDescription,
            Map<String, Object> inputSchema) {
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

    @Override
    public McpToolCallResultDto callTool(McpToolCallRequestDto request) {
        String serverId = request.getServerId();
        String toolName = request.getToolName();
        Map<String, Object> arguments = request.getArguments();

        long startTime = System.currentTimeMillis();

        McpServer server = repository.findById(serverId)
                .orElseThrow(() -> new IllegalArgumentException("Server not found: " + serverId));

        try {
            logger.info("Starting MCP tool call - Server: {}, Tool: {}, Arguments: {}", serverId, toolName, arguments);

            // 阶段一：握手 - 获取 session ID
            String endpoint = performHandshake(server);
            logger.debug("Handshake completed for tool call, endpoint: {}", endpoint);

            // 阶段二：初始化 - 发送 initialize 指令
            performInitialize(server, endpoint);
            logger.debug("Initialize completed for tool call");

            // 阶段三：执行工具 - 发送 tools/call 指令
            McpToolCallResultDto result = executeToolCall(server, endpoint, toolName, arguments);
            result.setDuration(System.currentTimeMillis() - startTime);

            logger.info("Tool call completed successfully - Tool: {}, Duration: {}ms", toolName, result.getDuration());
            return result;

        } catch (Exception e) {
            logger.error("MCP tool call failed - Server: {}, Tool: {}", serverId, toolName, e);

            McpToolCallResultDto errorResult = new McpToolCallResultDto(
                    toolName,
                    false,
                    e.getMessage()
            );
            errorResult.setDuration(System.currentTimeMillis() - startTime);
            return errorResult;
        }
    }

    /**
     * 阶段三（工具执行）：发送 tools/call 指令并获取结果
     * 
     * @param server MCP 服务器信息
     * @param endpoint SSE 端点地址（包含 session_id）
     * @param toolName 工具名称
     * @param arguments 工具参数
     * @return 工具执行结果
     */
    private McpToolCallResultDto executeToolCall(McpServer server, String endpoint, String toolName,
                                                   Map<String, Object> arguments) {
        WebClient webClient = buildWebClient(server);
        final McpToolCallResultDto[] result = {null};
        final RuntimeException[] error = {null};
        final StringBuilder[] sseBuffer = {new StringBuilder()};

        Map<String, Object> callRequest = Map.of(
                "jsonrpc", "2.0",
                "method", "tools/call",
                "id", IdHelper.genUuid(),
                "params", Map.of(
                        "name", toolName,
                        "arguments", arguments != null ? arguments : Collections.emptyMap()
                )
        );

        logger.info("Sending tools/call request - Tool: {}, Arguments: {}", toolName, arguments);

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
                        sseBuffer[0].append(line).append("\n");
                        logger.debug("Tool call SSE raw line: {}", line);

                        try {
                            if (line.startsWith("data:")) {
                                String jsonData = line.substring(5).trim();
                                logger.debug("Parsing tools/call data: {}", jsonData);

                                if (StringUtils.hasText(jsonData)) {
                                    Map<String, Object> body = objectMapper.readValue(jsonData, Map.class);
                                    logger.debug("Tool call response: {}", body);

                                    if (body.containsKey("error")) {
                                        Map<String, Object> errObj = (Map<String, Object>) body.get("error");
                                        String errMsg = (String) errObj.getOrDefault("message", "Unknown error");
                                        logger.error("Tool execution error: {}", errMsg);
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

                                        logger.info("Tool call result received - Tool: {}, Content items: {}",
                                                toolName, content != null ? content.size() : 0);
                                    }
                                }
                            }
                        } catch (Exception e) {
                            logger.warn("Failed to parse tool call response line, continuing...", e);
                        }
                    })
                    .timeout(java.time.Duration.ofSeconds(30))
                    .doOnError(e -> {
                        logger.error("Tool call SSE stream error: {}", e.getMessage());
                        error[0] = new RuntimeException("Tool call request failed: " + e.getMessage(), e);
                    })
                    .onErrorResume(e -> {
                        logger.error("Tool call error (resuming)", e);
                        return reactor.core.publisher.Flux.empty();
                    })
                    .blockLast();

            logger.debug("Tool call SSE stream ended. Buffer:\n{}", sseBuffer[0].toString());

        } catch (Exception e) {
            logger.error("Tool call blockLast failed", e);
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

        logger.info("Tool call completed - Tool: {}, Success: {}", toolName, result[0].getSuccess());
        return result[0];
    }
}