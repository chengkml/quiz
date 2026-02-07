package com.ck.quiz.crawler.service;

import com.ck.quiz.crawler.domain.CrawlerConfig;
import com.ck.quiz.crawler.dto.CrawlerConfigDto;
import com.ck.quiz.crawler.repository.CrawlerConfigRepository;
import com.ck.quiz.cron.dto.JobDto;
import com.ck.quiz.cron.service.JobService;
import com.ck.quiz.utils.HumpHelper;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class CrawlerConfigService {

    @Autowired
    private CrawlerConfigRepository crawlerConfigRepository;

    @Autowired
    private NamedParameterJdbcTemplate jt;

    @Autowired
    private JobService jobService;

    /**
     * 分页查询爬虫配置
     */
    public Page<CrawlerConfigDto> getCrawlerConfigList(int offset, int limit, String state, String keyword) {
        StringBuilder sql = new StringBuilder("SELECT * FROM crawler_config WHERE 1=1 ");
        Map<String, Object> params = new HashMap<>();

        if (StringUtils.isNotBlank(state)) {
            sql.append(" AND state = :state ");
            params.put("state", state);
        }

        if (StringUtils.isNotBlank(keyword)) {
            sql.append(" AND (name LIKE :keyword OR label LIKE :keyword) ");
            params.put("keyword", "%" + keyword + "%");
        }

        sql.append(" ORDER BY create_time DESC ");

        String countSql = "SELECT COUNT(*) FROM crawler_config WHERE 1=1 ";
        if (StringUtils.isNotBlank(state)) {
            countSql += " AND state = :state ";
        }
        if (StringUtils.isNotBlank(keyword)) {
            countSql += " AND (name LIKE :keyword OR label LIKE :keyword) ";
        }

        Integer count = jt.queryForObject(countSql, params, Integer.class);
        if (count == null) {
            count = 0;
        }

        List<Map<String, Object>> list = JdbcQueryHelper.queryListWithPage(jt, sql.toString(), params, offset, limit);
        List<CrawlerConfigDto> dtoList = HumpHelper.lineToHump(list)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return new PageImpl<>(dtoList, PageRequest.of(offset / limit, limit), count);
    }

    /**
     * 根据ID获取爬虫配置
     */
    public CrawlerConfigDto getCrawlerConfigById(String id) {
        Optional<CrawlerConfig> optional = crawlerConfigRepository.findById(id);
        if (optional.isPresent()) {
            CrawlerConfig config = optional.get();
            CrawlerConfigDto dto = new CrawlerConfigDto();
            BeanUtils.copyProperties(config, dto);
            return dto;
        }
        return null;
    }

    /**
     * 保存爬虫配置
     */
    @Transactional
    public CrawlerConfig saveCrawlerConfig(CrawlerConfigDto dto) {
        String id = dto.getId();
        if (StringUtils.isBlank(id)) {
            id = IdHelper.genUuid();
            dto.setId(id);
            dto.setCreateTime(LocalDateTime.now());
        }
        dto.setUpdateTime(LocalDateTime.now());

        CrawlerConfig config = new CrawlerConfig();
        BeanUtils.copyProperties(dto, config);

        return crawlerConfigRepository.save(config);
    }

    /**
     * 删除爬虫配置
     */
    @Transactional
    public List<String> deleteCrawlerConfig(List<String> ids) {
        List<String> deletedIds = new ArrayList<>();
        for (String id : ids) {
            try {
                crawlerConfigRepository.deleteById(id);
                deletedIds.add(id);
            } catch (Exception e) {
                log.error("删除爬虫配置失败: {}", id, e);
            }
        }
        return deletedIds;
    }

    /**
     * 触发爬虫任务
     */
    public String triggerCrawler(String crawlerConfigId, Integer maxPageCount) {
        try {
            Optional<CrawlerConfig> optional = crawlerConfigRepository.findById(crawlerConfigId);
            if (!optional.isPresent()) {
                throw new RuntimeException("爬虫配置不存在: " + crawlerConfigId);
            }

            CrawlerConfig config = optional.get();

            // 构建任务参数
            Map<String, Object> taskParams = new HashMap<>();
            taskParams.put("crawlerConfigId", crawlerConfigId);
            if (maxPageCount != null && maxPageCount > 0) {
                taskParams.put("maxPageCount", maxPageCount);
            }

            // 创建 Job
            JobDto jobDto = new JobDto();
            jobDto.setTaskClass("com.ck.quiz.crawler.job.WebMagicCrawlerJob");
            jobDto.setTaskParams(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(taskParams));
            jobDto.setPriority(1);

            String jobId = jobService.addJob(jobDto);
            log.info("触发爬虫任务成功，jobId: {}, crawlerConfigId: {}", jobId, crawlerConfigId);

            return jobId;
        } catch (Exception e) {
            log.error("触发爬虫任务失败", e);
            throw new RuntimeException("触发爬虫任务失败: " + e.getMessage(), e);
        }
    }

    /**
     * 获取爬虫结果
     */
    public Page<Map<String, Object>> getCrawlerResults(String crawlerConfigId, int offset, int limit) {
        StringBuilder sql = new StringBuilder("SELECT * FROM crawler_result WHERE crawler_config_id = :crawlerConfigId ");
        Map<String, Object> params = new HashMap<>();
        params.put("crawlerConfigId", crawlerConfigId);

        sql.append(" ORDER BY crawl_time DESC ");

        String countSql = "SELECT COUNT(*) FROM crawler_result WHERE crawler_config_id = :crawlerConfigId ";
        Integer count = jt.queryForObject(countSql, params, Integer.class);
        if (count == null) {
            count = 0;
        }

        List<Map<String, Object>> list = JdbcQueryHelper.queryListWithPage(jt, sql.toString(), params, offset, limit);
        List<Map<String, Object>> resultList = HumpHelper.lineToHump(list);

        return new PageImpl<>(resultList, PageRequest.of(offset / limit, limit), count);
    }

    /**
     * Map 转 DTO
     */
    private CrawlerConfigDto mapToDto(Map<String, Object> map) {
        CrawlerConfigDto dto = new CrawlerConfigDto();
        dto.setId(MapUtils.getString(map, "id"));
        dto.setName(MapUtils.getString(map, "name"));
        dto.setLabel(MapUtils.getString(map, "label"));
        dto.setStartUrl(MapUtils.getString(map, "startUrl"));
        dto.setUrlPatterns(MapUtils.getString(map, "urlPatterns"));
        dto.setDomain(MapUtils.getString(map, "domain"));
        dto.setThreadCount(MapUtils.getInteger(map, "threadCount"));
        dto.setRetryTimes(MapUtils.getInteger(map, "retryTimes"));
        dto.setSleepTime(MapUtils.getInteger(map, "sleepTime"));
        dto.setTimeoutMillis(MapUtils.getInteger(map, "timeoutMillis"));
        dto.setCharset(MapUtils.getString(map, "charset"));
        dto.setUserAgent(MapUtils.getString(map, "userAgent"));
        dto.setHeaders(MapUtils.getString(map, "headers"));
        dto.setCookies(MapUtils.getString(map, "cookies"));
        dto.setExtractRules(MapUtils.getString(map, "extractRules"));
        dto.setPipelineType(MapUtils.getString(map, "pipelineType"));
        dto.setPipelineConfig(MapUtils.getString(map, "pipelineConfig"));
        dto.setState(MapUtils.getString(map, "state"));
        dto.setCreateTime((LocalDateTime) map.get("createTime"));
        dto.setUpdateTime((LocalDateTime) map.get("updateTime"));
        dto.setCreateBy(MapUtils.getString(map, "createBy"));
        dto.setUpdateBy(MapUtils.getString(map, "updateBy"));
        dto.setRemark(MapUtils.getString(map, "remark"));
        return dto;
    }
}
