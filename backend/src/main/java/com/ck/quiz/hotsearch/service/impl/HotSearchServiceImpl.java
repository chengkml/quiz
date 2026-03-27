package com.ck.quiz.hotsearch.service.impl;

import com.ck.quiz.hotsearch.collector.HotSearchCollector;
import com.ck.quiz.hotsearch.dto.HotSearchCollectResultDto;
import com.ck.quiz.hotsearch.dto.HotSearchQueryDto;
import com.ck.quiz.hotsearch.dto.HotSearchRecordDto;
import com.ck.quiz.hotsearch.dto.HotSearchSourceItem;
import com.ck.quiz.hotsearch.entity.HotSearchRecord;
import com.ck.quiz.hotsearch.repository.HotSearchRecordRepository;
import com.ck.quiz.hotsearch.service.HotSearchService;
import com.ck.quiz.utils.IdHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
public class HotSearchServiceImpl implements HotSearchService {

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Autowired
    private HotSearchRecordRepository hotSearchRecordRepository;

    @Autowired
    private List<HotSearchCollector> collectors;

    @Override
    @Transactional
    public HotSearchCollectResultDto collectLatest(String source) {
        HotSearchCollector collector = resolveCollector(source);
        String batchNo = UUID.randomUUID().toString().replace("-", "");
        LocalDateTime crawlTime = LocalDateTime.now();

        log.info("开始抓取热搜 source={}, batchNo={}", collector.source(), batchNo);
        List<HotSearchSourceItem> items = collector.collect();
        if (items == null || items.isEmpty()) {
            log.warn("热搜抓取结果为空 source={}", collector.source());
            return new HotSearchCollectResultDto(collector.source(), batchNo, TIME_FORMATTER.format(crawlTime), 0);
        }

        List<HotSearchRecord> records = items.stream().map(item -> {
            HotSearchRecord record = new HotSearchRecord();
            record.setId(IdHelper.genUuid());
            record.setSource(collector.source());
            record.setExternalId(item.getExternalId());
            record.setTitle(item.getTitle());
            record.setUrl(item.getUrl());
            record.setHotValue(item.getHotValue());
            record.setRankIndex(item.getRankIndex());
            record.setCrawlTime(crawlTime);
            record.setBatchNo(batchNo);
            record.setDetailMarkdown(item.getDetailMarkdown());
            record.setExtraJson(item.getExtraJson());
            return record;
        }).toList();

        hotSearchRecordRepository.saveAll(records);
        log.info("热搜抓取完成 source={}, batchNo={}, size={}", collector.source(), batchNo, records.size());
        return new HotSearchCollectResultDto(collector.source(), batchNo, TIME_FORMATTER.format(crawlTime), records.size());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<HotSearchRecordDto> search(HotSearchQueryDto queryDto) {
        int pageNum = normalizePageNum(queryDto.getPageNum());
        int pageSize = normalizePageSize(queryDto.getPageSize());

        LocalDateTime fromTime = parseTime(queryDto.getFromTime());
        LocalDateTime toTime = parseTime(queryDto.getToTime());

        PageRequest pageable = PageRequest.of(
                pageNum,
                pageSize,
                Sort.by(
                        Sort.Order.desc("crawlTime"),
                        Sort.Order.asc("rankIndex"),
                        Sort.Order.desc("createDate")
                )
        );

        Page<HotSearchRecord> page = hotSearchRecordRepository.searchPage(
                queryDto.getSource(),
                queryDto.getTitleKeyword(),
                fromTime,
                toTime,
                pageable
        );

        return page.map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HotSearchRecordDto> latest(String source) {
        return hotSearchRecordRepository.findLatestBatch(source)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public HotSearchRecordDto getById(String id) {
        Optional<HotSearchRecord> optional = hotSearchRecordRepository.findById(id);
        return optional.map(this::toDto).orElse(null);
    }

    private HotSearchRecordDto toDto(HotSearchRecord record) {
        HotSearchRecordDto dto = new HotSearchRecordDto();
        BeanUtils.copyProperties(record, dto);
        return dto;
    }

    private HotSearchCollector resolveCollector(String source) {
        if (collectors == null || collectors.isEmpty()) {
            throw new IllegalStateException("未找到热搜采集器实现");
        }

        Map<String, HotSearchCollector> collectorMap = collectors.stream()
                .collect(Collectors.toMap(c -> c.source().toUpperCase(), Function.identity(), (a, b) -> a));

        if (source == null || source.isBlank()) {
            return collectors.get(0);
        }

        HotSearchCollector collector = collectorMap.get(source.toUpperCase());
        if (collector == null) {
            throw new IllegalArgumentException("不支持的热搜来源: " + source + "，可选: " + collectorMap.keySet());
        }
        return collector;
    }

    private LocalDateTime parseTime(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        String normalized = text.trim();
        if (normalized.length() == 10) {
            normalized = normalized + " 00:00:00";
        } else if (normalized.length() == 16) {
            normalized = normalized + ":00";
        }
        return LocalDateTime.parse(normalized, TIME_FORMATTER);
    }

    private int normalizePageNum(Integer pageNum) {
        if (pageNum == null || pageNum < 0) {
            return 0;
        }
        return pageNum;
    }

    private int normalizePageSize(Integer pageSize) {
        if (pageSize == null || pageSize <= 0) {
            return 20;
        }
        return Math.min(pageSize, 200);
    }
}
