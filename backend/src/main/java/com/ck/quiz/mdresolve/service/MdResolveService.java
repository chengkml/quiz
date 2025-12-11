package com.ck.quiz.mdresolve.service;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.FileCopyUtils;

import com.ck.quiz.utils.MdTemplateHelper;

import lombok.extern.slf4j.Slf4j;

/**
 * Markdown解析服务
 */
@Slf4j
@Service
public class MdResolveService {

    private final MdTemplateHelper mdTemplateHelper;

    public MdResolveService() {
        this.mdTemplateHelper = new MdTemplateHelper();
    }

    /**
     * 根据模板解析Markdown内容
     * 
     * @param mdContent Markdown内容
     * @param mdTpl Markdown模板
     * @return 解析结果，键为块标识，值为提取的数据列表
     */
    public Map<String, List<Map<String, Object>>> resolveMdContent(String mdContent, String mdTpl) {
        log.info("开始解析Markdown内容，内容长度: {}, 模板长度: {}", mdContent.length(), mdTpl.length());
        try {
            Map<String, List<Map<String, Object>>> result = mdTemplateHelper.resolveMdContent(mdContent, mdTpl);
            log.info("Markdown解析完成，结果包含 {} 个块", result.size());
            return result;
        } catch (Exception e) {
            log.error("Markdown解析失败", e);
            throw new RuntimeException("Markdown解析失败: " + e.getMessage(), e);
        }
    }

    /**
     * 使用默认模板解析Markdown内容
     * 
     * @param mdContent Markdown内容
     * @return 解析结果
     */
    public Map<String, List<Map<String, Object>>> resolveMdContentWithDefaultTemplate(String mdContent) {
        log.info("使用默认模板解析Markdown内容，内容长度: {}", mdContent.length());
        try {
            Map<String, List<Map<String, Object>>> result = mdTemplateHelper.resolveMdContent(mdContent);
            log.info("Markdown解析完成，结果包含 {} 个块", result.size());
            return result;
        } catch (Exception e) {
            log.error("Markdown解析失败", e);
            throw new RuntimeException("Markdown解析失败: " + e.getMessage(), e);
        }
    }

    /**
     * 获取默认的Markdown模板
     * 
     * @return 默认模板内容
     */
    public String getDefaultTemplate() {
        log.info("获取默认Markdown模板");
        try {
            ClassPathResource resource = new ClassPathResource("templates/md_extract.md");
            try (InputStream is = resource.getInputStream();
                 Reader reader = new InputStreamReader(is, java.nio.charset.StandardCharsets.UTF_8)) {
                String template = FileCopyUtils.copyToString(reader);
                log.info("成功读取默认模板，长度: {}", template.length());
                return template;
            }
        } catch (Exception e) {
            log.error("读取默认Markdown模板失败", e);
            throw new RuntimeException("无法读取默认Markdown模板文件: " + e.getMessage(), e);
        }
    }
}
