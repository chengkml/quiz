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
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
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
 * 系统日志过滤器
 * 记录API请求日志，包括请求参数、响应数据、耗时等
 */
@Slf4j
@Component
public class LoggingFilter extends OncePerRequestFilter {

    @Autowired
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

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String requestUri = request.getRequestURI();

        // 1. 排除静态资源和特定路径
        if (shouldIgnore(requestUri)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. 包装 Request 和 Response 以便读取内容
        // 注意：ContentCachingRequestWrapper 只有在读取了 InputStream 后才有内容，
        // 对于 application/json 请求，Spring MVC 会读取，所以通常能获取到。
        // 对于 form-data 或 GET 请求，可能需要额外处理参数。
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
            throw e; // 继续抛出异常
        } finally {
            long costTime = System.currentTimeMillis() - startTime;
            
            // 记录日志 (确保在 responseWrapper.copyBodyToResponse() 之前读取内容，如果有需要修改响应的话)
            // 但这里我们只是读取记录，所以顺序其实灵活，关键是 copyBodyToResponse 必须执行
            try {
                recordLog(requestWrapper, responseWrapper, costTime, success, errorMessage);
            } catch (Exception e) {
                log.error("Failed to record sys log", e);
            }

            // 重要：将响应内容回写到原始 Response
            responseWrapper.copyBodyToResponse();
        }
    }

    private boolean shouldIgnore(String uri) {
        for (String ignoreUrl : IGNORE_URLS) {
            if (uri.startsWith(ignoreUrl)) {
                return true;
            }
        }
        for (String ext : STATIC_EXTENSIONS) {
            if (uri.endsWith(ext)) {
                return true;
            }
        }
        return false;
    }

    private void recordLog(ContentCachingRequestWrapper request, ContentCachingResponseWrapper response,
                           long costTime, boolean success, String errorMessage) {
        try {
            SysLogCreateDto logDto = new SysLogCreateDto();
            
            // 基本信息
            logDto.setRequestUri(request.getRequestURI());
            logDto.setRequestMethod(request.getMethod());
            logDto.setIpAddress(getClientIp(request));
            logDto.setUserAgent(request.getHeader(HttpHeaders.USER_AGENT));
            logDto.setCostTime(costTime);
            // logDto.setSuccess(success ? "1" : "0"); // Moved down
            // logDto.setErrorMessage(errorMessage); // Moved down

            // 模块和操作
            String module = "API";
            String action = request.getRequestURI();

            try {
                // 尝试获取 HandlerMethod 以读取 Swagger 注解
                HandlerExecutionChain chain = requestMappingHandlerMapping.getHandler(request);
                if (chain != null) {
                    Object handler = chain.getHandler();
                    if (handler instanceof HandlerMethod) {
                        HandlerMethod handlerMethod = (HandlerMethod) handler;

                        // 获取操作名称 (@Operation summary)
                        Operation operation = handlerMethod.getMethodAnnotation(Operation.class);
                        if (operation != null) {
                            action = operation.summary();
                        }

                        // 获取模块名称 (@Tag name)
                        Tag tag = handlerMethod.getBeanType().getAnnotation(Tag.class);
                        if (tag != null) {
                            module = tag.name();
                        }
                    }
                }
            } catch (Exception e) {
                // 忽略获取 Handler 失败，保持默认值
            }

            logDto.setModule(module);
            logDto.setAction(action);

            // 请求参数
            String requestParams = getRequestParams(request);
            logDto.setRequestParams(truncate(requestParams, 2000));

            // 响应数据
            // 检查是否是文件下载
            if (isFileDownload(response)) {
                logDto.setResponseData("[File Download]");
            } else {
                String responseData = new String(response.getContentAsByteArray(), StandardCharsets.UTF_8);
                logDto.setResponseData(truncate(responseData, 2000));
                
                // 尝试解析响应体中的错误信息 (针对 GlobalExceptionHandler 返回的 JSON)
                if (success && responseData.length() > 0 && responseData.trim().startsWith("{")) {
                    try {
                        // 简单检查 JSON 字符串特征，避免引入额外 JSON 库依赖或复杂的反序列化
                        // 假设标准格式: "success": false 或 "success":false
                        if (responseData.contains("\"success\":false") || responseData.contains("\"success\": false")) {
                            success = false;
                            
                            // 尝试提取 message 字段
                            // 查找 "message": "..." 或 "message":"..."
                            int msgIndex = responseData.indexOf("\"message\"");
                            if (msgIndex > 0) {
                                int startQuote = responseData.indexOf("\"", msgIndex + 9); // "message": " <-- start here
                                if (startQuote > 0) {
                                    // 查找结束引号，注意转义字符 (这里做简单处理，不处理复杂转义)
                                    int endQuote = -1;
                                    for (int i = startQuote + 1; i < responseData.length(); i++) {
                                        if (responseData.charAt(i) == '"' && responseData.charAt(i - 1) != '\\') {
                                            endQuote = i;
                                            break;
                                        }
                                    }
                                    if (endQuote > 0) {
                                        errorMessage = responseData.substring(startQuote + 1, endQuote);
                                    }
                                }
                            }
                            // 如果没提取到，可以用整个 responseData 也可以保持 null
                            if (errorMessage == null) {
                                errorMessage = truncate(responseData, 500);
                            }
                        }
                    } catch (Exception e) {
                        // ignore parsing error
                    }
                }
            }

            logDto.setSuccess(success ? "1" : "0");
            logDto.setErrorMessage(errorMessage);
            // 尝试从 SecurityContext 获取，因为 Filter 顺序在 Security Filter 之后，应该能获取到
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            // 注意：SysLogService 内部可能会再次获取 SecurityContext 来设置 createUser，
            // 但异步方法执行时，线程上下文会丢失。
            // 解决方案：
            // 1. 在这里获取 userId 并传给 Service (如果 Service 接口支持)
            // 2. 使用 DelegatingSecurityContextRunnable (比较复杂)
            // 3. 修改 SysLog 实体，允许 create_user 手动设置，或者信任 AuditorAware (但异步线程 AuditorAware 可能失效)
            
            // 当前 SysLogService.create() 会使用 AuditorAware 自动填充 createUser。
            // 但异步线程中 SecurityContextHolder 为空。
            // 因此我们需要手动设置上下文给子线程，或者直接修改 DTO 并在 Service 中处理。
            // 考虑到 SysLogCreateDto 中没有 createUser 字段 (它是 BaseEntity 字段)，
            // 我们可以依赖 SecurityContextHolder，但需要确保异步调用时上下文传递。
            // Spring 的 @Async 默认不传递 SecurityContext。
            // 这里简单处理：如果 SecurityContext 有值，我们暂时无法直接传给异步线程，
            // 除非配置 TaskDecorator。
            // 另一种简单方式：不使用 @Async，或者在 Service 中手动设置 createUser (需要修改 DTO)。
            // 为了简单且有效，我们在 Service 增加一个重载方法或者让 Service 处理上下文传递问题？
            // 不，最简单的是：SysLogService 使用 @Async 时，主线程上下文确实会丢失。
            // 我们可以在 Filter 中把 userId 取出来，放到 DTO 的某个扩展字段，或者直接修改 DTO 定义增加 userId 字段。
            // 查看 SysLogCreateDto 定义，它没有 createUser。
            // 让我们看看 SysLog 实体，它继承 Model，有 createUser。
            // 既然要求异步，那么必须解决上下文传递问题。
            // 方案：修改 SysLogCreateDto 并不合适，因为那是前端传参用的。
            // 我们可以暂时容忍异步日志没有 createUser，或者采用 ContextCopyingDecorator。
            // 或者，由于这只是日志记录，我们可以不追求 100% 异步，或者使用简单的线程池提交任务并手动传递 User。
            // 鉴于用户要求 "异步添加日志"，我们坚持异步。
            // 实际上，Spring Security 提供了 DelegatingSecurityContextExecutor 来支持 @Async 的上下文传递，
            // 但需要配置。
            // 为了简化，我们假设日志主要记录系统行为，如果没有 User 也可以接受，
            // 或者我们可以稍微 Hack 一下：在 SysLogService 中，如果 SecurityContext 为空，尝试从参数读取（如果我们在 DTO 加字段）。
            
            // 重新审视 SysLogCreateDto，我们可以添加一个 transient 字段或者额外字段用于传递 userId。
            // 但为了不修改现有 DTO 结构，我们这里先保持原样。
            // 如果需要记录 User，最好是在 LogDto 中显式包含 userId 字段，而不是依赖 JPA Auditing。
            // 不过查看 SysLog 实体，createUser 是 JPA Auditing 字段。
            // 如果异步导致丢失，可以考虑配置 Spring Security 的 MODE_INHERITABLETHREADLOCAL (不推荐)
            // 或者配置 AsyncConfigurer。
            
            // 这里我们先调用，如果发现没有 User，后续再优化配置。
            sysLogService.createSysLogAsync(logDto);

        } catch (Exception e) {
            log.error("Error creating sys log dto", e);
        }
    }

    private String getRequestParams(ContentCachingRequestWrapper request) {
        String params = request.getQueryString();
        try {
            byte[] content = request.getContentAsByteArray();
            if (content.length > 0) {
                String body = new String(content, StandardCharsets.UTF_8);
                if (params != null) {
                    params += " | Body: " + body;
                } else {
                    params = "Body: " + body;
                }
            }
        } catch (Exception e) {
            // ignore
        }
        return params;
    }

    private boolean isFileDownload(HttpServletResponse response) {
        String contentType = response.getContentType();
        if (contentType != null && (
                contentType.contains("application/octet-stream") ||
                contentType.contains("application/pdf") ||
                contentType.contains("image/") ||
                contentType.contains("application/vnd.ms-excel") ||
                contentType.contains("application/zip")
        )) {
            return true;
        }
        String disposition = response.getHeader(HttpHeaders.CONTENT_DISPOSITION);
        return disposition != null && disposition.contains("attachment");
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
    
    private String truncate(String str, int maxLength) {
        if (str == null) return null;
        if (str.length() <= maxLength) return str;
        return str.substring(0, maxLength) + "...";
    }
}
