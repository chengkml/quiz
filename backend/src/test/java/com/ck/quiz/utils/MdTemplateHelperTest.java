package com.ck.quiz.utils;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class MdTemplateHelperTest {
    
    private MdTemplateHelper helper;
    private ObjectMapper mapper;
    
    @BeforeEach
    void setUp() {
        helper = new MdTemplateHelper();
        mapper = new ObjectMapper();
    }
    
    @Test
    void testReadTpl() throws Exception {
        String path = "src/main/resources/templates/md_extract.md";
        String mdTpl = new String(Files.readAllBytes(Paths.get(path)));
        List<?> blocks = helper.readTpl(mdTpl);
        
        String json = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(blocks);
        System.out.println(json);
        
        assertNotNull(blocks);
        assertFalse(blocks.isEmpty());
    }

    
    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    void testResolveMdContent_multipleBlocks() throws Exception {
        // 准备模板
        String template = """
                ### 错别字
                - 原文：{{typo.src}}
                  修改建议：{{typo.advice}}
                ---
                ### 语法
                - 原文：{{grammar.src}}
                  修改建议：{{grammar.advice}}
                """;
        
        // 准备实际内容
        String content = """
                ### 错别字
                - 原文：错误文本1
                  修改建议：正确文本1
                  
                ### 语法
                - 原文：语法错误示例
                  修改建议：语法正确示例
                """;
        
        // 解析模板
        List<?> tplBlocks = helper.readTpl(template);
        
        // 解析内容
        Map<String, List<Map<String, Object>>> result = helper.resolveMdContent(content, (List) tplBlocks);
        
        // 验证结果
        assertNotNull(result);
        assertEquals(2, result.size());
        
        assertTrue(result.containsKey("typo"));
        assertTrue(result.containsKey("grammar"));
        
        Map<String, Object> typoData = result.get("typo").get(0);
        assertEquals("错误文本1", typoData.get("src"));
        assertEquals("正确文本1", typoData.get("advice"));
        
        Map<String, Object> grammarData = result.get("grammar").get(0);
        assertEquals("语法错误示例", grammarData.get("src"));
        assertEquals("语法正确示例", grammarData.get("advice"));
    }
    
    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    void testResolveMdContent_multipleInstances() throws Exception {
        // 准备模板
        String template = """
                ### 错别字
                - 原文：{{typo.src}}
                  修改建议：{{typo.advice}}
                """;
        
        // 准备实际内容 - 包含多个错别字实例
        String content = """
                ### 错别字
                - 原文：错误1
                  修改建议：正确1
                  
                ### 错别字
                - 原文：错误2
                  修改建议：正确2
                  
                ### 错别字
                - 原文：错误3
                  修改建议：正确3
                """;
        
        // 解析模板
        List<?> tplBlocks = helper.readTpl(template);
        
        // 解析内容
        Map<String, List<Map<String, Object>>> result = helper.resolveMdContent(content, (List) tplBlocks);
        
        // 验证结果
        assertNotNull(result);
        assertTrue(result.containsKey("typo"));
        
        List<Map<String, Object>> typoList = result.get("typo");
        assertEquals(3, typoList.size());
        
        assertEquals("错误1", typoList.get(0).get("src"));
        assertEquals("正确1", typoList.get(0).get("advice"));
        
        assertEquals("错误2", typoList.get(1).get("src"));
        assertEquals("正确2", typoList.get(1).get("advice"));
        
        assertEquals("错误3", typoList.get(2).get("src"));
        assertEquals("正确3", typoList.get(2).get("advice"));
    }
    
    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    void testResolveMdContent_withFullTemplate() throws Exception {
        // 使用完整的模板文件
        String path = "src/main/resources/templates/md_extract.md";
        String mdTpl = new String(Files.readAllBytes(Paths.get(path)));
        
        // 准备实际内容
        String content = """
                ### 错别字
- 原文：测试红红火火恍恍惚  
  修改建议：测试红红火火、恍恍惚惚  
  修改原因：原文“恍恍惚”为错别字问题，应为“恍恍惚惚”，表示迷迷糊糊、不清醒的状态。

### 专业术语规范
- 无

### 语法
- 原文：测试红红火火恍恍惚  
  修改建议：测试“红红火火、恍恍惚惚”是否符合语言规范  
  修改原因：语法结构不完整。原句仅为词语堆砌，缺乏主谓宾结构，建议补充完整语义，使其成为完整句子。

### 语义优化
- 原文：测试红红火火恍恍惚  
  修改建议：测试“红红火火、恍恍惚惚”这一表述是否准确传达预期含义  
  修改原因：表达模糊、词义不清。原句语义不明确，缺乏上下文支撑，难以判断其具体用途或意图。

### 逻辑严谨性
- 无

### 表述流畅性
- 原文：测试红红火火恍恍惚  
  修改建议：测试“红红火火、恍恍惚惚”这一短语的使用是否符合语言习惯  
  修改原因：句式啰嗦、节奏不当。原句结构松散，建议通过补充语境或调整句式，使表达更自然流畅。
                """;
        
        // 解析模板
        List<?> tplBlocks = helper.readTpl(mdTpl);
        
        // 解析内容
        Map<String, List<Map<String, Object>>> result = helper.resolveMdContent(content, (List) tplBlocks);
        
        // 打印提取的内容为JSON
        System.out.println("=== Extracted Content ===");
        System.out.println(mapper.writerWithDefaultPrettyPrinter().writeValueAsString(result));
        
        // 验证结果
        assertNotNull(result);
        assertTrue(result.size() >= 3);
        
    }
    
    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    void testResolveMdContent_emptyContent() throws Exception {
        String template = """
                ### 错别字
                - 原文：{{typo.src}}
                  修改建议：{{typo.advice}}
                """;
        
        String content = "";
        
        List<?> tplBlocks = helper.readTpl(template);
        Map<String, List<Map<String, Object>>> result = helper.resolveMdContent(content, (List) tplBlocks);
        
        assertNotNull(result);
        assertTrue(result.containsKey("typo"));
        assertTrue(result.get("typo").isEmpty());
    }
    
    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    void testResolveMdContent_noMatch() throws Exception {
        String template = """
                ### 错别字
                - 原文：{{typo.src}}
                  修改建议：{{typo.advice}}
                """;
        
        // 内容格式不匹配
        String content = """
                ### 其他内容
                - 这是完全不同的内容
                """;
        
        List<?> tplBlocks = helper.readTpl(template);
        Map<String, List<Map<String, Object>>> result = helper.resolveMdContent(content, (List) tplBlocks);
        
        assertNotNull(result);
        assertTrue(result.containsKey("typo"));
        assertTrue(result.get("typo").isEmpty());
    }
}

