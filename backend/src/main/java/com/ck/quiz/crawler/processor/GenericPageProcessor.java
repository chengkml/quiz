package com.ck.quiz.crawler.processor;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang3.StringUtils;
import us.codecraft.webmagic.Page;
import us.codecraft.webmagic.Site;
import us.codecraft.webmagic.processor.PageProcessor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 通用爬虫页面处理器
 */
public class GenericPageProcessor implements PageProcessor {

    private Site site;
    private Map<String, String> extractRules;
    private List<String> urlPatterns;

    public GenericPageProcessor(
            String charset,
            String userAgent,
            int retryTimes,
            int sleepTime,
            int timeoutMillis,
            String urlPatterns,
            String extractRules,
            String headers,
            String cookies) {

        this.site = Site.me()
                .setCharset(charset)
                .setRetryTimes(retryTimes)
                .setSleepTime(sleepTime)
                .setTimeOut(timeoutMillis);

        if (StringUtils.isNotBlank(userAgent)) {
            this.site.setUserAgent(userAgent);
        }

        // 解析 headers
        if (StringUtils.isNotBlank(headers)) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                Map<String, String> headerMap = mapper.readValue(headers, new TypeReference<>() {
                });
                headerMap.forEach((key, value) -> this.site.addHeader(key, value));
            } catch (Exception e) {
                // ignore
            }
        }

        // 解析 cookies
        if (StringUtils.isNotBlank(cookies)) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                Map<String, String> cookieMap = mapper.readValue(cookies, new TypeReference<>() {
                });
                cookieMap.forEach((key, value) -> this.site.addCookie(key, value));
            } catch (Exception e) {
                // ignore
            }
        }

        // 解析 URL 匹配模式
        if (StringUtils.isNotBlank(urlPatterns)) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                this.urlPatterns = mapper.readValue(urlPatterns, new TypeReference<>() {
                });
            } catch (Exception e) {
                // ignore
            }
        }

        // 解析提取规则
        if (StringUtils.isNotBlank(extractRules)) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                this.extractRules = mapper.readValue(extractRules, new TypeReference<>() {
                });
            } catch (Exception e) {
                this.extractRules = new HashMap<>();
            }
        } else {
            this.extractRules = new HashMap<>();
        }
    }

    @Override
    public void process(Page page) {
        // 添加目标链接
        if (urlPatterns != null && !urlPatterns.isEmpty()) {
            for (String pattern : urlPatterns) {
                page.addTargetRequests(page.getHtml().links().regex(pattern).all());
            }
        }

        // 根据配置的规则提取数据
        Map<String, Object> extractedData = new HashMap<>();
        extractedData.put("url", page.getUrl().toString());
        extractedData.put("title", page.getHtml().xpath("//title/text()").get());

        for (Map.Entry<String, String> entry : extractRules.entrySet()) {
            String fieldName = entry.getKey();
            String rule = entry.getValue();

            try {
                // 根据规则类型提取数据
                if (rule.startsWith("xpath:")) {
                    String xpathExpr = rule.substring(6);
                    extractedData.put(fieldName, page.getHtml().xpath(xpathExpr).get());
                } else if (rule.startsWith("css:")) {
                    String cssExpr = rule.substring(4);
                    extractedData.put(fieldName, page.getHtml().css(cssExpr).get());
                } else if (rule.startsWith("regex:")) {
                    String regexExpr = rule.substring(6);
                    extractedData.put(fieldName, page.getHtml().regex(regexExpr).get());
                } else if (rule.startsWith("json:")) {
                    String jsonPath = rule.substring(5);
                    extractedData.put(fieldName, page.getJson().jsonPath(jsonPath).get());
                }
            } catch (Exception e) {
                // 提取失败时忽略
            }
        }

        // 将提取的数据放入结果字段
        page.putField("extractedData", extractedData);
        page.putField("rawHtml", page.getRawText());
    }

    @Override
    public Site getSite() {
        return site;
    }
}
