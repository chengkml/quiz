package com.ck.quiz.crawler.controller;

import com.ck.quiz.crawler.domain.CrawlerConfig;
import com.ck.quiz.crawler.dto.CrawlerConfigDto;
import com.ck.quiz.crawler.service.CrawlerConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/crawler")
@Tag(name = "爬虫管理", description = "爬虫配置和任务管理接口")
public class CrawlerController {

    @Autowired
    private CrawlerConfigService crawlerConfigService;

    @GetMapping("/config/list")
    @Operation(summary = "分页查询爬虫配置列表")
    public ResponseEntity<Object> getCrawlerConfigList(
            @Parameter(description = "偏移量") @RequestParam(defaultValue = "0") int offset,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "10") int limit,
            @Parameter(description = "状态") @RequestParam(required = false) String state,
            @Parameter(description = "关键词") @RequestParam(required = false) String keyword) {
        try {
            Page<CrawlerConfigDto> page = crawlerConfigService.getCrawlerConfigList(offset, limit, state, keyword);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", page.getContent(),
                    "total", page.getTotalElements()
            ));
        } catch (Exception e) {
            log.error("查询爬虫配置列表失败", e);
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/config/{id}")
    @Operation(summary = "根据ID获取爬虫配置")
    public ResponseEntity<Object> getCrawlerConfigById(
            @Parameter(description = "爬虫配置ID") @PathVariable String id) {
        try {
            CrawlerConfigDto dto = crawlerConfigService.getCrawlerConfigById(id);
            if (dto == null) {
                return ResponseEntity.ok(Map.of(
                        "success", false,
                        "message", "爬虫配置不存在"
                ));
            }
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", dto
            ));
        } catch (Exception e) {
            log.error("获取爬虫配置失败", e);
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/config/save")
    @Operation(summary = "保存爬虫配置")
    public ResponseEntity<Object> saveCrawlerConfig(
            @Parameter(description = "爬虫配置") @RequestBody CrawlerConfigDto dto) {
        try {
            CrawlerConfig config = crawlerConfigService.saveCrawlerConfig(dto);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", config,
                    "message", "保存成功"
            ));
        } catch (Exception e) {
            log.error("保存爬虫配置失败", e);
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/config/delete")
    @Operation(summary = "删除爬虫配置")
    public ResponseEntity<Object> deleteCrawlerConfig(
            @Parameter(description = "爬虫配置ID列表") @RequestBody List<String> ids) {
        try {
            List<String> deletedIds = crawlerConfigService.deleteCrawlerConfig(ids);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", deletedIds,
                    "message", "删除成功"
            ));
        } catch (Exception e) {
            log.error("删除爬虫配置失败", e);
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/trigger/{crawlerConfigId}")
    @Operation(summary = "触发爬虫任务")
    public ResponseEntity<Object> triggerCrawler(
            @Parameter(description = "爬虫配置ID") @PathVariable String crawlerConfigId,
            @Parameter(description = "最大爬取页数") @RequestParam(required = false) Integer maxPageCount) {
        try {
            String jobId = crawlerConfigService.triggerCrawler(crawlerConfigId, maxPageCount);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", jobId,
                    "message", "爬虫任务已触发"
            ));
        } catch (Exception e) {
            log.error("触发爬虫任务失败", e);
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/results/{crawlerConfigId}")
    @Operation(summary = "获取爬虫结果")
    public ResponseEntity<Object> getCrawlerResults(
            @Parameter(description = "爬虫配置ID") @PathVariable String crawlerConfigId,
            @Parameter(description = "偏移量") @RequestParam(defaultValue = "0") int offset,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "10") int limit) {
        try {
            Page<Map<String, Object>> page = crawlerConfigService.getCrawlerResults(crawlerConfigId, offset, limit);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", page.getContent(),
                    "total", page.getTotalElements()
            ));
        } catch (Exception e) {
            log.error("获取爬虫结果失败", e);
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
}
