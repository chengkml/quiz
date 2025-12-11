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
import com.ck.quiz.utils.ScoreCalculatorHelper;
import com.ck.quiz.utils.ScoreRule;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import java.util.ArrayList;
import java.io.ByteArrayOutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;

import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;

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

    public int calculateScore(Map<String, List<Map<String, Object>>> items) {
        log.info("开始计算分值，待评估块数: {}", items == null ? 0 : items.size());

        // 默认规则列表，如果工作区里提供了 templates/score_rules.json 会尝试加载
        List<ScoreRule> rules = new ArrayList<>();

        try {
            ClassPathResource resource = new ClassPathResource("templates/score_rules.json");
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    ObjectMapper mapper = new ObjectMapper();
                    rules = mapper.readValue(is, new TypeReference<List<ScoreRule>>() {});
                    log.info("加载到 {} 条分值规则", rules.size());
                }
            } else {
                log.info("未找到 templates/score_rules.json，使用空规则列表（不扣分）");
            }
        } catch (Exception e) {
            log.warn("加载分值规则失败，使用空规则列表", e);
        }

        // 调用帮助类计算最终分数
        ScoreCalculatorHelper helper = new ScoreCalculatorHelper();
        int score = helper.calculateScore(rules, items == null ? Map.of() : items);
        log.info("分值计算完成，得分: {}", score);
        return score;
    }

    /**
     * 将解析结果导出为 DOCX 文档并返回字节数组。
     *
     * @param items 解析结果数据（按块分组）
     * @param docName 文档名称（不含扩展名）
     * @param rank 档位描述，例如 "优秀"
     * @return docx 文件的字节数组
     */
    public byte[] exportDocx(Map<String, List<Map<String, Object>>> items, String docName, String rank) {
        log.info("导出 DOCX：name={}, rank={}, blocks={}", docName, rank, items == null ? 0 : items.size());
        try (XWPFDocument doc = new XWPFDocument(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            // 文档名称（左对齐，每项占一行）
            XWPFParagraph namePara = doc.createParagraph();
            namePara.setAlignment(ParagraphAlignment.LEFT);
            XWPFRun nameRun = namePara.createRun();
            nameRun.setBold(true);
            nameRun.setFontSize(14);
            nameRun.setText("文档名称：" + (docName == null || docName.isEmpty() ? "导出文档" : docName));

            // 时间（左对齐）
            XWPFParagraph timePara = doc.createParagraph();
            timePara.setAlignment(ParagraphAlignment.LEFT);
            XWPFRun timeRun = timePara.createRun();
            timeRun.setFontSize(10);
            String timeStr = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
            timeRun.setText("时间：" + timeStr);

            // 档位（左对齐）
            XWPFParagraph rankPara = doc.createParagraph();
            rankPara.setAlignment(ParagraphAlignment.LEFT);
            XWPFRun rankRun = rankPara.createRun();
            rankRun.setFontSize(10);
            rankRun.setText("档位：" + (rank == null ? "" : rank));

            // 空行
            doc.createParagraph();

            // 总标题
            XWPFParagraph h1 = doc.createParagraph();
            h1.setAlignment(ParagraphAlignment.LEFT);
            XWPFRun h1r = h1.createRun();
            h1r.setBold(true);
            h1r.setFontSize(12);
            h1r.setText("文档纠错结果：");

            // 规则名映射
            Map<String, String> nameMap = Map.of(
                "typo", "错别字",
                "terms", "专业术语规范",
                "grammar", "语法",
                "semantics", "语义优化",
                "logic", "逻辑严谨性",
                "fluency", "表述流畅性"
            );

            if (items != null) {
                for (Map.Entry<String, List<Map<String, Object>>> entry : items.entrySet()) {
                    String key = entry.getKey();
                    String sectionTitle = nameMap.getOrDefault(key, key);
                    List<Map<String, Object>> records = entry.getValue();
                    if (records == null || records.isEmpty()) continue;

                    // 小标题
                    XWPFParagraph secPara = doc.createParagraph();
                    XWPFRun secRun = secPara.createRun();
                    secRun.setBold(true);
                    secRun.setFontSize(11);
                    secRun.setText(sectionTitle);

                    for (Map<String, Object> record : records) {
                        XWPFParagraph recPara = doc.createParagraph();
                        XWPFRun recRun = recPara.createRun();
                        recRun.setFontSize(11);
                        // 尝试常见字段：原文、修改建议、修改原因
                        String original = getFirstString(record, "src");
                        String suggestion = getFirstString(record, "advice");
                        String reason = getFirstString(record, "reason");

                        // 直接逐行输出字段内容（不带序号）
                        if (original != null) {
                            recRun.setText("原文：\"" + original + "\"");
                            recRun.addBreak();
                        }
                        if (suggestion != null) {
                            recRun.setText("修改建议：\"" + suggestion + "\"");
                            recRun.addBreak();
                        }
                        if (reason != null) {
                            recRun.setText("修改原因：" + reason);
                            recRun.addBreak();
                        }

                        // 若上述字段均为空，则打印所有键值
                        if (original == null && suggestion == null && reason == null) {
                            for (Map.Entry<String, Object> kv : record.entrySet()) {
                                recRun.setText(kv.getKey() + ": " + String.valueOf(kv.getValue()));
                                recRun.addBreak();
                            }
                        }
                        // 每条记录后留空行
                        doc.createParagraph();
                    }
                    // 小节后空行
                    doc.createParagraph();
                }
            }

            doc.write(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("导出 DOCX 失败", e);
            throw new RuntimeException("导出 DOCX 失败: " + e.getMessage(), e);
        }
    }

    private String getFirstString(Map<String, Object> map, String... keys) {
        for (String k : keys) {
            if (map.containsKey(k) && map.get(k) != null) {
                return String.valueOf(map.get(k));
            }
        }
        return null;
    }
}
