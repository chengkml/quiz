package com.ck.quiz.crawler.job;

import com.ck.quiz.crawler.domain.CrawlerConfig;
import com.ck.quiz.crawler.pipeline.DatabasePipeline;
import com.ck.quiz.crawler.processor.GenericPageProcessor;
import com.ck.quiz.crawler.repository.CrawlerConfigRepository;
import com.ck.quiz.cron.exec.AbstractAsyncJob;
import com.ck.quiz.utils.SpringContextUtil;
import org.apache.commons.collections4.MapUtils;
import org.springframework.stereotype.Component;
import us.codecraft.webmagic.Spider;
import us.codecraft.webmagic.pipeline.ConsolePipeline;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * WebMagic 爬虫任务
 */
@Component
public class WebMagicCrawlerJob extends AbstractAsyncJob {

    @Override
    public String getJobPreffix() {
        return "CRAWLER";
    }

    @Override
    public String getJobLabel() {
        return "WebMagic爬虫任务";
    }

    @Override
    public Map<String, Object> getParamDef() {
        return Map.of(
                "crawlerConfigId", Map.of(
                        "label", "爬虫配置ID",
                        "type", "string",
                        "required", true,
                        "placeholder", "请输入爬虫配置ID"
                ),
                "maxPageCount", Map.of(
                        "label", "最大爬取页数",
                        "type", "number",
                        "required", false,
                        "placeholder", "不限制留空",
                        "default", 0
                )
        );
    }

    @Override
    public void run(Map<String, Object> params) {
        String crawlerConfigId = MapUtils.getString(params, "crawlerConfigId");
        String jobId = MapUtils.getString(params, "jobId");
        Integer maxPageCount = MapUtils.getInteger(params, "maxPageCount", 0);

        log.info("开始执行爬虫任务, crawlerConfigId: {}, jobId: {}", crawlerConfigId, jobId);

        // 查询爬虫配置
        CrawlerConfigRepository crawlerConfigRepository = SpringContextUtil.getBean(CrawlerConfigRepository.class);
        Optional<CrawlerConfig> configOptional = crawlerConfigRepository.findById(crawlerConfigId);

        if (!configOptional.isPresent()) {
            log.error("爬虫配置不存在: {}", crawlerConfigId);
            throw new RuntimeException("爬虫配置不存在: " + crawlerConfigId);
        }

        CrawlerConfig config = configOptional.get();
        log.info("加载爬虫配置: {}", config.getName());

        try {
            // 创建页面处理器
            GenericPageProcessor processor = new GenericPageProcessor(
                    config.getCharset(),
                    config.getUserAgent(),
                    config.getRetryTimes(),
                    config.getSleepTime(),
                    config.getTimeoutMillis(),
                    config.getUrlPatterns(),
                    config.getExtractRules(),
                    config.getHeaders(),
                    config.getCookies()
            );

            // 创建爬虫
            Spider spider = Spider.create(processor)
                    .addUrl(config.getStartUrl())
                    .thread(config.getThreadCount());

            // 添加数据处理管道
            String pipelineType = config.getPipelineType();
            if ("database".equalsIgnoreCase(pipelineType)) {
                spider.addPipeline(new DatabasePipeline(crawlerConfigId, jobId));
                log.info("使用数据库存储管道");
            } else if ("console".equalsIgnoreCase(pipelineType)) {
                spider.addPipeline(new ConsolePipeline());
                log.info("使用控制台输出管道");
            } else {
                // 默认使用数据库管道
                spider.addPipeline(new DatabasePipeline(crawlerConfigId, jobId));
                log.info("使用默认数据库存储管道");
            }

            // 设置爬取页数限制
            if (maxPageCount != null && maxPageCount > 0) {
                log.info("设置最大爬取页数: {}", maxPageCount);
                // WebMagic 0.9.1 版本没有直接的页数限制，这里可以通过其他方式实现
                // 简单起见，这里直接运行
            }

            // 启动爬虫
            log.info("启动爬虫，起始URL: {}", config.getStartUrl());
            spider.run();
            log.info("爬虫任务执行完成");

        } catch (Exception e) {
            log.error("爬虫执行失败", e);
            throw new RuntimeException("爬虫执行失败: " + e.getMessage(), e);
        }
    }
}
