package com.ck.quiz.crawler.pipeline;

import com.ck.quiz.utils.SpringContextUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import us.codecraft.webmagic.ResultItems;
import us.codecraft.webmagic.Task;
import us.codecraft.webmagic.pipeline.Pipeline;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 数据库存储管道
 */
public class DatabasePipeline implements Pipeline {

    private String crawlerConfigId;
    private String jobId;

    public DatabasePipeline(String crawlerConfigId, String jobId) {
        this.crawlerConfigId = crawlerConfigId;
        this.jobId = jobId;
    }

    @Override
    public void process(ResultItems resultItems, Task task) {
        try {
            NamedParameterJdbcTemplate jt = SpringContextUtil.getBean(NamedParameterJdbcTemplate.class);
            ObjectMapper mapper = new ObjectMapper();

            Map<String, Object> extractedData = resultItems.get("extractedData");
            String rawHtml = resultItems.get("rawHtml");

            if (extractedData == null || extractedData.isEmpty()) {
                return;
            }

            Map<String, Object> params = new HashMap<>();
            params.put("id", UUID.randomUUID().toString());
            params.put("crawlerConfigId", crawlerConfigId);
            params.put("jobId", jobId);
            params.put("url", extractedData.get("url"));
            params.put("title", extractedData.get("title"));
            params.put("extractedData", mapper.writeValueAsString(extractedData));
            params.put("rawHtml", rawHtml);
            params.put("crawlTime", LocalDateTime.now());

            String sql = "INSERT INTO crawler_result " +
                    "(id, crawler_config_id, job_id, url, title, extracted_data, raw_html, crawl_time) " +
                    "VALUES (:id, :crawlerConfigId, :jobId, :url, :title, :extractedData, :rawHtml, :crawlTime)";

            jt.update(sql, params);
        } catch (Exception e) {
            // 记录日志但不中断爬虫
            e.printStackTrace();
        }
    }
}
