package com.ck.quiz.mdconvert.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ck.quiz.mdconvert.dto.MdConvertRequest;
import com.ck.quiz.mdconvert.service.MdConvertService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Markdown转换控制器
 * 支持将Markdown转换为Word、PDF、HTML等格式
 */
@Slf4j
@RestController
@RequestMapping("/api/md-convert")
@RequiredArgsConstructor
public class MdConvertController {

    @Autowired
    private MdConvertService mdConvertService;

    /**
     * 将Markdown转换为HTML
     * 
     * @param request 包含Markdown内容的请求
     * @return HTML内容
     */
    @PostMapping("/to-html")
    public Map<String, Object> convertToHtml(@RequestBody MdConvertRequest request) {
        log.info("收到Markdown转HTML请求");
        
        Map<String, Object> response = new HashMap<>();
        try {
            // 验证请求参数
            if (request.getMdContent() == null || request.getMdContent().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Markdown内容不能为空");
                response.put("data", null);
                return response;
            }

            String htmlContent = mdConvertService.convertToHtml(request.getMdContent());
            
            response.put("success", true);
            response.put("message", "转换成功");
            response.put("data", htmlContent);
            return response;
            
        } catch (Exception e) {
            log.error("Markdown转HTML失败", e);
            response.put("success", false);
            response.put("message", "转换失败: " + e.getMessage());
            response.put("data", null);
            return response;
        }
    }

    /**
     * 将Markdown转换为Word (DOCX)
     * 
     * @param request 包含Markdown内容和文件名的请求
     * @return Word文件的字节数组
     */
    @PostMapping("/to-word")
    public ResponseEntity<byte[]> convertToWord(@RequestBody MdConvertRequest request) {
        log.info("收到Markdown转Word请求");
        
        try {
            // 验证请求参数
            if (request.getMdContent() == null || request.getMdContent().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(null);
            }

            String fileName = request.getFileName() != null && !request.getFileName().trim().isEmpty() 
                ? request.getFileName() 
                : "markdown-document";

            byte[] wordBytes = mdConvertService.convertToWord(request.getMdContent(), fileName);
            
            String filename = fileName + ".docx";
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .body(wordBytes);
                
        } catch (Exception e) {
            log.error("Markdown转Word失败", e);
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * 将Markdown转换为PDF
     * 
     * @param request 包含Markdown内容和文件名的请求
     * @return PDF文件的字节数组
     */
    @PostMapping("/to-pdf")
    public ResponseEntity<byte[]> convertToPdf(@RequestBody MdConvertRequest request) {
        log.info("收到Markdown转PDF请求");
        
        try {
            // 验证请求参数
            if (request.getMdContent() == null || request.getMdContent().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(null);
            }

            String fileName = request.getFileName() != null && !request.getFileName().trim().isEmpty() 
                ? request.getFileName() 
                : "markdown-document";

            byte[] pdfBytes = mdConvertService.convertToPdf(request.getMdContent(), fileName);
            
            String filename = fileName + ".pdf";
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
                
        } catch (Exception e) {
            log.error("Markdown转PDF失败", e);
            return ResponseEntity.status(500).body(null);
        }
    }
}
