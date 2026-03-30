package com.ck.quiz.hotsearch.service.impl;

import com.ck.quiz.hotsearch.dto.HotSearchCollectResultDto;
import com.ck.quiz.hotsearch.dto.HotSearchImportItemDto;
import com.ck.quiz.hotsearch.dto.HotSearchImportRequestDto;
import com.ck.quiz.hotsearch.dto.HotSearchQueryDto;
import com.ck.quiz.hotsearch.dto.HotSearchRecordDto;
import com.ck.quiz.hotsearch.entity.HotSearchRecord;
import com.ck.quiz.hotsearch.repository.HotSearchRecordRepository;
import com.ck.quiz.hotsearch.service.HotSearchService;
import com.ck.quiz.utils.IdHelper;
import jakarta.persistence.criteria.Predicate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class HotSearchServiceImpl implements HotSearchService {

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Autowired
    private HotSearchRecordRepository hotSearchRecordRepository;

    @Override
    @Transactional
    public HotSearchCollectResultDto importRecords(HotSearchImportRequestDto requestDto) {
        if (requestDto == null) {
            throw new IllegalArgumentException("导入请求不能为空");
        }
        if (!StringUtils.hasText(requestDto.getSource())) {
            throw new IllegalArgumentException("source 不能为空");
        }
        if (requestDto.getItems() == null || requestDto.getItems().isEmpty()) {
            throw new IllegalArgumentException("items 不能为空");
        }

        String source = requestDto.getSource().trim();
        String batchNo = StringUtils.hasText(requestDto.getBatchNo())
                ? requestDto.getBatchNo().trim()
                : UUID.randomUUID().toString().replace("-", "");
        LocalDateTime defaultCrawlTime = parseTime(requestDto.getCrawlTime());
        if (defaultCrawlTime == null) {
            LocalDateTime existingBatchTime = hotSearchRecordRepository.findMaxCrawlTimeBySourceAndBatchNo(source, batchNo);
            defaultCrawlTime = existingBatchTime != null ? existingBatchTime : LocalDateTime.now();
        }

        hotSearchRecordRepository.deleteBySourceAndBatchNo(source, batchNo);

        List<HotSearchRecord> records = new ArrayList<>();
        for (HotSearchImportItemDto item : requestDto.getItems()) {
            if (item == null || !StringUtils.hasText(item.getTitle())) {
                continue;
            }
            HotSearchRecord record = new HotSearchRecord();
            record.setId(IdHelper.genUuid());
            record.setSource(source);
            record.setExternalId(trimToNull(item.getExternalId()));
            record.setTitle(item.getTitle().trim());
            record.setUrl(trimToNull(item.getUrl()));
            record.setHotValue(trimToNull(item.getHotValue()));
            record.setRankIndex(item.getRankIndex());
            record.setCrawlTime(parseTime(item.getCrawlTime()) != null ? parseTime(item.getCrawlTime()) : defaultCrawlTime);
            record.setBatchNo(batchNo);
            record.setDetailMarkdown(trimToNull(item.getDetailMarkdown()));
            record.setExtraJson(trimToNull(item.getExtraJson()));
            records.add(record);
        }

        if (records.isEmpty()) {
            throw new IllegalArgumentException("items 中没有可入库的有效记录");
        }

        hotSearchRecordRepository.saveAll(records);
        log.info("热搜导入完成 source={}, batchNo={}, size={}", source, batchNo, records.size());
        return new HotSearchCollectResultDto(source, batchNo, TIME_FORMATTER.format(defaultCrawlTime), records.size());
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

        Specification<HotSearchRecord> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(queryDto.getSource())) {
                predicates.add(cb.equal(root.get("source"), queryDto.getSource().trim()));
            }
            if (StringUtils.hasText(queryDto.getTitleKeyword())) {
                predicates.add(cb.like(
                        cb.lower(root.get("title")),
                        "%" + queryDto.getTitleKeyword().trim().toLowerCase() + "%"
                ));
            }
            if (fromTime != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("crawlTime"), fromTime));
            }
            if (toTime != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("crawlTime"), toTime));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return hotSearchRecordRepository.findAll(spec, pageable).map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HotSearchRecordDto> latest(String source) {
        return hotSearchRecordRepository.findLatestBatch(trimToNull(source))
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

    private LocalDateTime parseTime(String text) {
        if (!StringUtils.hasText(text)) {
            return null;
        }
        String normalized = text.trim().replace('T', ' ');
        if (normalized.length() == 10) {
            normalized = normalized + " 00:00:00";
        } else if (normalized.length() == 16) {
            normalized = normalized + ":00";
        }
        try {
            return LocalDateTime.parse(normalized, TIME_FORMATTER);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("时间格式非法: " + text);
        }
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
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
