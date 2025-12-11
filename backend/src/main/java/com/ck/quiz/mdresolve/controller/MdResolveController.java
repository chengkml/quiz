package com.ck.quiz.mdresolve.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ck.quiz.mdresolve.dto.MdResolveRequest;
import com.ck.quiz.mdresolve.dto.MdResolveResponse;
import com.ck.quiz.mdresolve.service.MdResolveService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Markdown解析控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/md-resolve")
public class MdResolveController {

    @Autowired
    private MdResolveService mdResolveService;

    /**
     * 解析Markdown内容
     * 
     * @param request 包含Markdown内容和可选模板的请求
     * @return 解析结果
     */
    @PostMapping("/parse")
    public MdResolveResponse resolveMd(@RequestBody MdResolveRequest request) {
        log.info("收到Markdown解析请求");
        
        try {
            // 验证请求参数
            if (request.getMdContent() == null || request.getMdContent().trim().isEmpty()) {
                return MdResolveResponse.error("Markdown内容不能为空");
            }

            Map<String, List<Map<String, Object>>> result;
            
            // 判断是否提供了自定义模板
            if (request.getMdTemplate() != null && !request.getMdTemplate().trim().isEmpty()) {
                log.info("使用自定义模板解析");
                result = mdResolveService.resolveMdContent(
                    request.getMdContent(), 
                    request.getMdTemplate()
                );
            } else {
                log.info("使用默认模板解析");
                result = mdResolveService.resolveMdContentWithDefaultTemplate(
                    request.getMdContent()
                );
            }
            
            return MdResolveResponse.success(result);
            
        } catch (Exception e) {
            log.error("Markdown解析失败", e);
            return MdResolveResponse.error("解析失败: " + e.getMessage());
        }
    }

    /**
     * 获取默认的Markdown模板
     * 
     * @return 默认模板内容
     */
    @GetMapping("/default-template")
    public Map<String, Object> getDefaultTemplate() {
        log.info("收到获取默认模板请求");
        
        Map<String, Object> response = new HashMap<>();
        try {
            String template = mdResolveService.getDefaultTemplate();
            response.put("success", true);
            response.put("message", "获取成功");
            response.put("data", template);
            return response;
        } catch (Exception e) {
            log.error("获取默认模板失败", e);
            response.put("success", false);
            response.put("message", "获取失败: " + e.getMessage());
            response.put("data", null);
            return response;
        }
    }
}
