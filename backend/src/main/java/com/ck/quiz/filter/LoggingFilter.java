package com.ck.quiz.filter;

import com.ck.quiz.syslog.dto.SysLogCreateDto;
import com.ck.quiz.syslog.service.SysLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerExecutionChain;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * 系统日志过滤器 - 已修复流式请求支持
 */
@Slf4j
@Component
public class LoggingFilter extends OncePerRequestFilter {

    @Autowired
    @Lazy
    private SysLogService sysLogService;

    @Autowired
    @Lazy
    private RequestMappingHandlerMapping requestMappingHandlerMapping;

    private static final Set<String> IGNORE_URLS = new HashSet<>(Arrays.asList(
            "/swagger-ui", "/v3/api-docs", "/actuator", "/druid", "/favicon.ico"
    ));

    private static final Set<String> STATIC_EXTENSIONS = new HashSet<>(Arrays.asList(
            ".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2", ".ttf"
    ));

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String requestUri = request.getRequestURI();
        String acceptHeader = request.getHeader(HttpHeaders.ACCEPT);

        // 1. 核心修复点：如果是流式请求或静态资源，直接放行，不使用 Wrapper
        // 如果不排除，ContentCachingResponseWrapper 会缓存所有数据，导致流式输出失效
        boolean isStreamRequest = requestUri.contains("/generate/stream")
            || requestUri.contains("/chat/stream")
            || "text/event-stream".equals(acceptHeader);

        if (shouldIgnore(requestUri) || isStreamRequest) {
            log.debug("Skipping logging wrapper for: {}", requestUri);
            filterChain.doFilter(request, response);
            return;
        }

        // 2. 包装 Request 和 Response
        ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);

        long startTime = System.currentTimeMillis();
        boolean success = true;
        String errorMessage = null;

        try {
            filterChain.doFilter(requestWrapper, responseWrapper);
        } catch (Exception e) {
            success = false;
            errorMessage = e.getMessage();
            throw e;
        } finally {
            long costTime = System.currentTimeMillis() - startTime;
            
            try {
                // 记录日志
                recordLog(requestWrapper, responseWrapper, costTime, success, errorMessage);
            } catch (Exception e) {
                log.error("Failed to record sys log", e);
            }

            // 3. 重要：必须将缓存内容拷贝回原始响应，否则客户端收不到数据
            responseWrapper.copyBodyToResponse();
        }
    }

    private boolean shouldIgnore(String uri) {
        return IGNORE_URLS.stream().anyMatch(uri::startsWith) || 
               STATIC_EXTENSIONS.stream().anyMatch(uri::endsWith);
    }

    private void recordLog(ContentCachingRequestWrapper request, ContentCachingResponseWrapper response,
                           long costTime, boolean success, String errorMessage) {
        try {
            SysLogCreateDto logDto = new SysLogCreateDto();
            logDto.setRequestUri(request.getRequestURI());
            logDto.setRequestMethod(request.getMethod());
            logDto.setIpAddress(getClientIp(request));
            logDto.setUserAgent(request.getHeader(HttpHeaders.USER_AGENT));
            logDto.setCostTime(costTime);

            // 解析模块与操作
            setModuleAndAction(request, logDto);

            // 请求参数
            logDto.setRequestParams(truncate(getRequestParams(request), 2000));

            // 响应数据处理
            if (isFileDownload(response)) {
                logDto.setResponseData("[File Download]");
            } else {
                String responseData = new String(response.getContentAsByteArray(), StandardCharsets.UTF_8);
                logDto.setResponseData(truncate(responseData, 2000));
                
                // 处理业务逻辑上的失败 (比如 Result.error())
                if (success && responseData.contains("\"success\":false")) {
                    success = false;
                    // 这里可以进一步解析 message 字段赋值给 errorMessage
                }
            }

            logDto.setSuccess(success ? "1" : "0");
            logDto.setErrorMessage(errorMessage);

            // 使用带 SecurityContext 透传能力的异步执行器，确保审计字段能拿到当前登录用户。
            sysLogService.createSysLogAsync(logDto);

        } catch (Exception e) {
            log.error("Error creating sys log dto", e);
        }
    }

    private void setModuleAndAction(HttpServletRequest request, SysLogCreateDto logDto) {
        try {
            HandlerExecutionChain chain = requestMappingHandlerMapping.getHandler(request);
            if (chain != null && chain.getHandler() instanceof HandlerMethod) {
                HandlerMethod hm = (HandlerMethod) chain.getHandler();
                Operation op = hm.getMethodAnnotation(Operation.class);
                if (op != null) logDto.setAction(op.summary());
                
                Tag tag = hm.getBeanType().getAnnotation(Tag.class);
                if (tag != null) logDto.setModule(tag.name());
            }
        } catch (Exception ignored) {}
        
        if (logDto.getModule() == null) logDto.setModule("API");
        if (logDto.getAction() == null) logDto.setAction(request.getRequestURI());
    }

    private String getRequestParams(ContentCachingRequestWrapper request) {
        String query = request.getQueryString();
        String body = new String(request.getContentAsByteArray(), StandardCharsets.UTF_8);
        return (query != null ? "Query: " + query : "") + (body.length() > 0 ? " | Body: " + body : "");
    }

    private boolean isFileDownload(HttpServletResponse response) {
        String ct = response.getContentType();
        return ct != null && (ct.contains("application/octet-stream") || ct.contains("application/zip") || ct.contains("image/"));
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        return (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) ? request.getRemoteAddr() : ip.split(",")[0];
    }
    
    private String truncate(String str, int maxLength) {
        if (str == null || str.length() <= maxLength) return str;
        return str.substring(0, maxLength) + "...";
    }
}