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
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.URI;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeoutException;

@Service
@Transactional
public class McpServerServiceImpl extends
        BaseServiceImpl<McpServerCreateDto, McpServerUpdateDto, McpServerQueryDto, McpServerDto, McpServer, McpServerRepository>
        implements McpServerService {

    private static final Logger logger = LoggerFactory.getLogger(McpServerServiceImpl.class);
    private static final int MCP_RETRY_MAX_ATTEMPTS = 3;
    private static final long MCP_RETRY_INITIAL_BACKOFF_MS = 500L;
    private static final Duration HANDSHAKE_TIMEOUT = Duration.ofSeconds(20);
    private static final Duration INITIALIZE_TIMEOUT = Duration.ofSeconds(20);
    private static final Duration TOOLS_LIST_TIMEOUT = Duration.ofSeconds(30);
    private static final Duration TOOLS_CALL_TIMEOUT = Duration.ofSeconds(30);
    private static final Duration NOTIFICATION_TIMEOUT = Duration.ofSeconds(10);

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

        JdbcQueryHelper.order("s.create_date", "desc", sql);
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

        try {
            logger.info("Starting SSE compatible health check for server: {}, address: {}", serverId, server.getAddress());
            String endpoint = performHandshake(server);
            performInitialize(server, endpoint);
            server.setLastHeartbeatAt(LocalDateTime.now());
            server.setStatus("ACTIVE");
        } catch (Exception e) {
            server.setStatus("INACTIVE");
            logger.error("MCP SSE health check failed for server: {}", serverId, e);
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
            logger.info("Handshake completed, message endpoint: {}", endpoint);
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
        return executeWithRetry("handshake", () -> performHandshakeOnce(server));
    }

    private String performHandshakeOnce(McpServer server) {
        WebClient webClient = buildWebClient(server);
        String baseAddress = server.getAddress();
        String handshakeUrl = buildHandshakeUrl(baseAddress);
        SseAccumulator accumulator = new SseAccumulator();

        logger.info("Starting handshake with server: {}", handshakeUrl);

        try {
            webClient.post()
                    .uri(handshakeUrl)
                    .accept(MediaType.TEXT_EVENT_STREAM)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of("jsonrpc", "2.0"))
                    .retrieve()
                    .bodyToFlux(String.class)
                    .doOnNext(accumulator::consume)
                    .takeUntil(chunk -> accumulator.hasHandshakeEndpoint() || accumulator.hasRpcError())
                    .timeout(HANDSHAKE_TIMEOUT)
                    .blockLast();
        } catch (Exception e) {
            throw wrapOperationException("Handshake SSE connection failed", e);
        }

        accumulator.finish();

        RuntimeException rpcError = accumulator.extractRpcError(objectMapper, "Handshake failed");
        if (rpcError != null) {
            throw rpcError;
        }

        String endpoint = accumulator.resolveHandshakeEndpoint(objectMapper, handshakeUrl);
        if (!StringUtils.hasText(endpoint)) {
            throw new RuntimeException("Failed to obtain endpoint from handshake");
        }

        return endpoint;
    }

    private void performInitialize(McpServer server, String endpoint) {
        executeWithRetry("initialize", () -> {
            performInitializeOnce(server, endpoint);
            return null;
        });
    }

    private void performInitializeOnce(McpServer server, String endpoint) {
        WebClient webClient = buildWebClient(server);
        SseAccumulator accumulator = new SseAccumulator();

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

        try {
            webClient.post()
                    .uri(endpoint)
                    .accept(MediaType.TEXT_EVENT_STREAM)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(initRequest)
                    .retrieve()
                    .bodyToFlux(String.class)
                    .doOnNext(accumulator::consume)
                    .takeUntil(chunk -> accumulator.hasRpcResult() || accumulator.hasRpcError())
                    .timeout(INITIALIZE_TIMEOUT)
                    .blockLast();
        } catch (Exception e) {
            throw wrapOperationException("Initialize request failed", e);
        }

        accumulator.finish();

        RuntimeException rpcError = accumulator.extractRpcError(objectMapper, "Initialize failed");
        if (rpcError != null) {
            throw rpcError;
        }

        if (!accumulator.hasRpcResult()) {
            throw new RuntimeException("Initialize failed: No response from server");
        }

        sendInitializedNotification(server, endpoint);
    }

    private void sendInitializedNotification(McpServer server, String endpoint) {
        WebClient webClient = buildWebClient(server);
        Map<String, Object> initializedNotification = Map.of(
                "jsonrpc", "2.0",
                "method", "notifications/initialized",
                "params", Collections.emptyMap()
        );

        try {
            webClient.post()
                    .uri(endpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(initializedNotification)
                    .exchangeToMono(response -> response.releaseBody().thenReturn(response.statusCode()))
                    .timeout(NOTIFICATION_TIMEOUT)
                    .block();
        } catch (Exception e) {
            throw wrapOperationException("Initialized notification failed", e);
        }
    }

    private List<McpDiscoveredToolDto> discoverTools(McpServer server, String endpoint, String serverId) {
        return executeWithRetry("tools/list", () -> discoverToolsOnce(server, endpoint, serverId));
    }

    private List<McpDiscoveredToolDto> discoverToolsOnce(McpServer server, String endpoint, String serverId) {
        WebClient webClient = buildWebClient(server);
        List<McpDiscoveredToolDto> resultList = new ArrayList<>();
        SseAccumulator accumulator = new SseAccumulator();

        Map<String, Object> listRequest = Map.of(
                "jsonrpc", "2.0",
                "method", "tools/list",
                "id", IdHelper.genUuid(),
                "params", Collections.emptyMap()
        );

        try {
            webClient.post()
                    .uri(endpoint)
                    .accept(MediaType.TEXT_EVENT_STREAM)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(listRequest)
                    .retrieve()
                    .bodyToFlux(String.class)
                    .doOnNext(accumulator::consume)
                    .takeUntil(chunk -> accumulator.hasRpcResult() || accumulator.hasRpcError())
                    .timeout(TOOLS_LIST_TIMEOUT)
                    .blockLast();
        } catch (Exception e) {
            throw wrapOperationException("Tool discovery request failed", e);
        }

        accumulator.finish();

        RuntimeException rpcError = accumulator.extractRpcError(objectMapper, "Tool discovery failed");
        if (rpcError != null) {
            throw rpcError;
        }

        Map<String, Object> responseBody = accumulator.extractFirstRpcBody(objectMapper);
        if (responseBody == null || !responseBody.containsKey("result")) {
            throw new RuntimeException("Tool discovery failed: No response from server");
        }

        try {
            Map<String, Object> result = (Map<String, Object>) responseBody.get("result");
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
        } catch (Exception e) {
            throw new RuntimeException("Tool discovery failed: Invalid response payload", e);
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
        return executeWithRetry("tools/call", () -> executeToolCallOnce(server, endpoint, toolName, arguments));
    }

    private McpToolCallResultDto executeToolCallOnce(McpServer server, String endpoint, String toolName,
                                                     Map<String, Object> arguments) {
        WebClient webClient = buildWebClient(server);
        SseAccumulator accumulator = new SseAccumulator();

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
                    .doOnNext(accumulator::consume)
                    .takeUntil(chunk -> accumulator.hasRpcResult() || accumulator.hasRpcError())
                    .timeout(TOOLS_CALL_TIMEOUT)
                    .blockLast();
        } catch (Exception e) {
            throw wrapOperationException("Tool call request failed", e);
        }

        accumulator.finish();

        Map<String, Object> responseBody = accumulator.extractFirstRpcBody(objectMapper);
        RuntimeException rpcError = accumulator.extractRpcError(objectMapper, "Tool execution failed");
        if (rpcError != null) {
            McpToolCallResultDto errorResult = new McpToolCallResultDto(toolName, false, rpcError.getMessage());
            errorResult.setRawResponse(responseBody);
            throw new RuntimeException(rpcError.getMessage(), rpcError);
        }

        if (responseBody == null || !responseBody.containsKey("result")) {
            return new McpToolCallResultDto(toolName, false, "No response from server");
        }

        try {
            Map<String, Object> resultObj = (Map<String, Object>) responseBody.get("result");
            List<Map<String, Object>> content = (List<Map<String, Object>>) resultObj.get("content");
            McpToolCallResultDto callResult = new McpToolCallResultDto(
                    toolName,
                    true,
                    content != null ? content : new ArrayList<>()
            );
            callResult.setRawResponse(responseBody);
            return callResult;
        } catch (Exception e) {
            throw new RuntimeException("Tool execution failed: Invalid response payload", e);
        }
    }

    private <T> T executeWithRetry(String operation, RetryableOperation<T> operationCall) {
        RuntimeException lastError = null;
        for (int attempt = 1; attempt <= MCP_RETRY_MAX_ATTEMPTS; attempt++) {
            try {
                return operationCall.run();
            } catch (RuntimeException e) {
                lastError = e;
                if (attempt >= MCP_RETRY_MAX_ATTEMPTS || !isRetryableException(e)) {
                    throw e;
                }
                long backoffMs = MCP_RETRY_INITIAL_BACKOFF_MS * (1L << (attempt - 1));
                logger.warn("MCP {} attempt {}/{} failed with retryable error, retrying in {} ms: {}",
                        operation, attempt, MCP_RETRY_MAX_ATTEMPTS, backoffMs, summarizeException(e));
                sleepQuietly(backoffMs);
            }
        }
        throw lastError == null ? new RuntimeException("MCP operation failed: " + operation) : lastError;
    }

    private boolean isRetryableException(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            if (current instanceof RetryableMcpException) {
                return true;
            }
            if (current instanceof WebClientResponseException responseException) {
                int statusCode = responseException.getStatusCode().value();
                if (statusCode == 429 || statusCode == 408 || statusCode == 425 || statusCode >= 500) {
                    return true;
                }
            }
            if (current instanceof WebClientRequestException
                    || current instanceof TimeoutException
                    || current instanceof ConnectException
                    || current instanceof SocketTimeoutException) {
                return true;
            }
            String message = current.getMessage();
            if (message != null) {
                String lowerMessage = message.toLowerCase(Locale.ROOT);
                if (lowerMessage.contains(" 429")
                        || lowerMessage.contains("too many requests")
                        || lowerMessage.contains("timed out")
                        || lowerMessage.contains("timeout")
                        || lowerMessage.contains("connection reset")
                        || lowerMessage.contains("connection prematurely closed")
                        || lowerMessage.contains("503 service unavailable")
                        || lowerMessage.contains("502 bad gateway")
                        || lowerMessage.contains("504 gateway timeout")) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
    }

    private RuntimeException wrapOperationException(String prefix, Exception exception) {
        if (isRetryableException(exception)) {
            return new RetryableMcpException(prefix + ": " + summarizeException(exception), exception);
        }
        return new RuntimeException(prefix + ": " + summarizeException(exception), exception);
    }

    private String summarizeException(Throwable throwable) {
        Throwable root = throwable;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        return root.getMessage() != null ? root.getMessage() : root.getClass().getSimpleName();
    }

    private void sleepQuietly(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Retry interrupted", e);
        }
    }

    private String buildHandshakeUrl(String baseAddress) {
        return baseAddress.endsWith("/sse") ? baseAddress : baseAddress + "/sse";
    }

    private String appendSessionId(String handshakeUrl, String sessionId) {
        String delimiter = handshakeUrl.contains("?") ? "&" : "?";
        return handshakeUrl + delimiter + "session_id=" + sessionId;
    }

    private String resolveEndpoint(String baseUrl, String rawEndpoint) {
        if (!StringUtils.hasText(rawEndpoint)) {
            return null;
        }
        try {
            URI baseUri = URI.create(baseUrl);
            return baseUri.resolve(rawEndpoint.trim()).toString();
        } catch (Exception e) {
            logger.warn("Failed to resolve handshake endpoint: {} (base: {})", rawEndpoint, baseUrl, e);
            return rawEndpoint.trim();
        }
    }

    @FunctionalInterface
    private interface RetryableOperation<T> {
        T run();
    }

    private static class RetryableMcpException extends RuntimeException {
        RetryableMcpException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    private static class ParsedSseEvent {
        private final String event;
        private final String data;

        ParsedSseEvent(String event, String data) {
            this.event = event;
            this.data = data;
        }
    }

    private class SseAccumulator {
        private final StringBuilder chunkBuffer = new StringBuilder();
        private final StringBuilder eventDataBuffer = new StringBuilder();
        private final List<ParsedSseEvent> events = new ArrayList<>();
        private String currentEventName;

        void consume(String chunk) {
            if (chunk == null) {
                return;
            }
            chunkBuffer.append(chunk);
            drainCompleteLines();
        }

        void finish() {
            if (chunkBuffer.length() > 0) {
                String trailing = chunkBuffer.toString();
                chunkBuffer.setLength(0);
                processLine(trailing.replace("\r", ""));
            }
            flushCurrentEvent();
        }

        boolean hasHandshakeEndpoint() {
            return StringUtils.hasText(resolveHandshakeEndpoint(objectMapper, null));
        }

        boolean hasRpcResult() {
            return extractFirstRpcBody(objectMapper) != null && extractFirstRpcBody(objectMapper).containsKey("result");
        }

        boolean hasRpcError() {
            return extractRpcError(objectMapper, null) != null;
        }

        RuntimeException extractRpcError(ObjectMapper mapper, String defaultPrefix) {
            for (ParsedSseEvent event : events) {
                Map<String, Object> body = tryParseBody(mapper, event.data);
                if (body != null && body.containsKey("error")) {
                    Map<String, Object> errorBody = (Map<String, Object>) body.get("error");
                    String message = errorBody == null ? null : (String) errorBody.get("message");
                    String prefix = StringUtils.hasText(defaultPrefix) ? defaultPrefix : "MCP request failed";
                    return new RuntimeException(prefix + ": " + (StringUtils.hasText(message) ? message : "Unknown error"));
                }
            }
            return null;
        }

        Map<String, Object> extractFirstRpcBody(ObjectMapper mapper) {
            for (ParsedSseEvent event : events) {
                Map<String, Object> body = tryParseBody(mapper, event.data);
                if (body != null && (body.containsKey("result") || body.containsKey("error"))) {
                    return body;
                }
            }
            return null;
        }

        String resolveHandshakeEndpoint(ObjectMapper mapper, String handshakeUrl) {
            for (ParsedSseEvent event : events) {
                if (!"endpoint".equalsIgnoreCase(event.event)) {
                    continue;
                }
                String endpoint = extractMessageEndpoint(mapper, event.data, handshakeUrl);
                if (StringUtils.hasText(endpoint)) {
                    return endpoint;
                }
            }

            for (ParsedSseEvent event : events) {
                String endpoint = extractLegacyHandshakeEndpoint(mapper, event.data, handshakeUrl);
                if (StringUtils.hasText(endpoint)) {
                    return endpoint;
                }
            }
            return null;
        }

        private String extractMessageEndpoint(ObjectMapper mapper, String payload, String handshakeUrl) {
            if (!StringUtils.hasText(payload)) {
                return null;
            }
            String raw = payload.trim();
            Map<String, Object> body = tryParseBody(mapper, raw);
            if (body != null) {
                String endpoint = extractEndpointFromMap(body, handshakeUrl);
                if (StringUtils.hasText(endpoint)) {
                    return endpoint;
                }
            }

            if (looksLikeEndpoint(raw)) {
                return resolveEndpoint(handshakeUrl, raw);
            }
            return null;
        }

        private String extractLegacyHandshakeEndpoint(ObjectMapper mapper, String payload, String handshakeUrl) {
            if (!StringUtils.hasText(payload)) {
                return null;
            }
            String raw = payload.trim();
            Map<String, Object> body = tryParseBody(mapper, raw);
            if (body != null) {
                String endpoint = extractEndpointFromMap(body, handshakeUrl);
                if (StringUtils.hasText(endpoint)) {
                    return endpoint;
                }
                String sessionId = extractSessionIdFromMap(body);
                if (StringUtils.hasText(sessionId)) {
                    return appendSessionId(handshakeUrl, sessionId);
                }
            }

            if (looksLikeEndpoint(raw)) {
                return resolveEndpoint(handshakeUrl, raw);
            }
            if (StringUtils.hasText(raw)) {
                return appendSessionId(handshakeUrl, raw);
            }
            return null;
        }

        private String extractEndpointFromMap(Map<String, Object> body, String handshakeUrl) {
            List<String> endpointFields = Arrays.asList("messageEndpoint", "message_endpoint", "message", "endpoint", "url");
            for (String field : endpointFields) {
                Object value = body.get(field);
                String endpoint = extractEndpointValue(value, handshakeUrl);
                if (StringUtils.hasText(endpoint)) {
                    return endpoint;
                }
            }
            return null;
        }

        private String extractEndpointValue(Object value, String handshakeUrl) {
            if (value instanceof String textValue && looksLikeEndpoint(textValue)) {
                return resolveEndpoint(handshakeUrl, textValue);
            }
            if (value instanceof Map<?, ?> mapValue) {
                Map<String, Object> nestedMap = new LinkedHashMap<>();
                mapValue.forEach((k, v) -> nestedMap.put(String.valueOf(k), v));
                String nestedEndpoint = extractEndpointFromMap(nestedMap, handshakeUrl);
                if (StringUtils.hasText(nestedEndpoint)) {
                    return nestedEndpoint;
                }
            }
            return null;
        }

        private String extractSessionIdFromMap(Map<String, Object> body) {
            List<String> sessionFields = Arrays.asList("session_id", "sessionId");
            for (String field : sessionFields) {
                Object value = body.get(field);
                if (value instanceof String textValue && StringUtils.hasText(textValue)) {
                    return textValue.trim();
                }
            }
            Object endpoint = body.get("endpoint");
            if (endpoint instanceof Map<?, ?> mapValue) {
                for (String field : sessionFields) {
                    Object value = mapValue.get(field);
                    if (value instanceof String textValue && StringUtils.hasText(textValue)) {
                        return textValue.trim();
                    }
                }
            }
            return null;
        }

        private Map<String, Object> tryParseBody(ObjectMapper mapper, String payload) {
            if (!StringUtils.hasText(payload)) {
                return null;
            }
            String trimmed = payload.trim();
            if (!(trimmed.startsWith("{") && trimmed.endsWith("}"))) {
                return null;
            }
            try {
                return mapper.readValue(trimmed, Map.class);
            } catch (Exception e) {
                return null;
            }
        }

        private boolean looksLikeEndpoint(String value) {
            if (!StringUtils.hasText(value)) {
                return false;
            }
            String trimmed = value.trim();
            return trimmed.startsWith("http://")
                    || trimmed.startsWith("https://")
                    || trimmed.startsWith("/")
                    || trimmed.contains("message")
                    || trimmed.contains("session_id=")
                    || trimmed.contains("sessionId=");
        }

        private void drainCompleteLines() {
            int lineBreakIndex;
            while ((lineBreakIndex = chunkBuffer.indexOf("\n")) >= 0) {
                String line = chunkBuffer.substring(0, lineBreakIndex);
                chunkBuffer.delete(0, lineBreakIndex + 1);
                if (line.endsWith("\r")) {
                    line = line.substring(0, line.length() - 1);
                }
                processLine(line);
            }
        }

        private void processLine(String line) {
            if (line == null) {
                return;
            }
            if (line.isEmpty()) {
                flushCurrentEvent();
                return;
            }
            if (line.startsWith(":")) {
                return;
            }
            if (line.startsWith("event:")) {
                currentEventName = line.substring(6).trim();
                return;
            }
            if (line.startsWith("data:")) {
                appendEventData(line.substring(5).trim());
                return;
            }
            appendEventData(line.trim());
        }

        private void appendEventData(String line) {
            if (eventDataBuffer.length() > 0) {
                eventDataBuffer.append("\n");
            }
            eventDataBuffer.append(line);
        }

        private void flushCurrentEvent() {
            if (!StringUtils.hasText(currentEventName) && eventDataBuffer.length() == 0) {
                return;
            }
            events.add(new ParsedSseEvent(
                    StringUtils.hasText(currentEventName) ? currentEventName : "message",
                    eventDataBuffer.toString()
            ));
            currentEventName = null;
            eventDataBuffer.setLength(0);
        }
    }
}
