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
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

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

    /**
     * 计算提交的解析结果的分值。
     * 接收已解析的块数据（与 resolveMd 返回的格式一致），返回计算后的分值。
     *
     * @param items 按块分组的数据
     * @return 包含分值的响应对象
     */
    @PostMapping("/calculate")
    public Map<String, Object> calculateScore(@RequestBody Map<String, List<Map<String, Object>>> items) {
        log.info("收到分值计算请求，块数: {}", items == null ? 0 : items.size());
        Map<String, Object> response = new HashMap<>();
        try {
            int score = mdResolveService.calculateScore(items);
            String grade;
            if (score >= 90) {
                grade = "优秀";
            } else if (score >= 70) {
                grade = "良好";
            } else if (score >= 60) {
                grade = "合格";
            } else {
                grade = "不合格";
            }

            Map<String, Object> data = new HashMap<>();
            data.put("score", score);
            data.put("grade", grade);

            response.put("success", true);
            response.put("message", "计算成功");
            response.put("data", data);
            return response;
        } catch (Exception e) {
            log.error("分值计算失败", e);
            response.put("success", false);
            response.put("message", "计算失败: " + e.getMessage());
            response.put("data", null);
            return response;
        }
    }

    /**
     * 导出解析结果为 DOCX 文件。
     * 请求体中可包含：
     * - items: 解析结果（必需）
     * - docName: 文档名称（可选）
     * - rank: 档位描述（可选）
     */
    @PostMapping("/export-docx")
    public ResponseEntity<byte[]> exportDocx(@RequestBody Map<String, Object> payload) {
        log.info("收到 DOCX 导出请求");
        try {
            @SuppressWarnings("unchecked")
            Map<String, List<Map<String, Object>>> items = (Map<String, List<Map<String, Object>>>) payload.get("items");
            String docName = payload.getOrDefault("docName", "导出文档").toString();
            String rank = payload.getOrDefault("rank", "").toString();

            byte[] bytes = mdResolveService.exportDocx(items, docName, rank);

            String filename = docName + ".docx";
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .body(bytes);
        } catch (Exception e) {
            log.error("DOCX 导出失败", e);
            return ResponseEntity.status(500).body(null);
        }
    }
}
