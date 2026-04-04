package com.ck.quiz.hotsearch.service.impl;

import com.ck.quiz.hotsearch.dto.HotSearchCollectResultDto;
import com.ck.quiz.hotsearch.dto.HotSearchFollowTopicDto;
import com.ck.quiz.hotsearch.dto.HotSearchImportItemDto;
import com.ck.quiz.hotsearch.dto.HotSearchImportRequestDto;
import com.ck.quiz.hotsearch.dto.HotSearchQueryDto;
import com.ck.quiz.hotsearch.dto.HotSearchRecordDto;
import com.ck.quiz.hotsearch.entity.HotSearchRecord;
import com.ck.quiz.hotsearch.repository.HotSearchRecordRepository;
import com.ck.quiz.hotsearch.service.HotSearchFollowTopicService;
import com.ck.quiz.hotsearch.service.HotSearchService;
import com.ck.quiz.utils.IdHelper;
import jakarta.persistence.criteria.Predicate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
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
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class HotSearchServiceImpl implements HotSearchService {

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final HotSearchRecordRepository hotSearchRecordRepository;
    private final HotSearchFollowTopicService hotSearchFollowTopicService;

    public HotSearchServiceImpl(HotSearchRecordRepository hotSearchRecordRepository,
                                HotSearchFollowTopicService hotSearchFollowTopicService) {
        this.hotSearchRecordRepository = hotSearchRecordRepository;
        this.hotSearchFollowTopicService = hotSearchFollowTopicService;
    }

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
    public Page<HotSearchRecordDto> search(String userId, HotSearchQueryDto queryDto) {
        int pageNum = normalizePageNum(queryDto == null ? null : queryDto.getPageNum());
        int pageSize = normalizePageSize(queryDto == null ? null : queryDto.getPageSize());
        LocalDateTime fromTime = parseTime(queryDto == null ? null : queryDto.getFromTime());
        LocalDateTime toTime = parseTime(queryDto == null ? null : queryDto.getToTime());
        List<TopicMatcher> topicMatchers = loadEnabledTopicMatchers(userId);
        boolean followedOnly = queryDto != null && Boolean.TRUE.equals(queryDto.getFollowedOnly());

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
            if (queryDto != null && StringUtils.hasText(queryDto.getSource())) {
                predicates.add(cb.equal(root.get("source"), queryDto.getSource().trim()));
            }
            if (queryDto != null && StringUtils.hasText(queryDto.getTitleKeyword())) {
                predicates.add(cb.like(
                        cb.lower(root.get("title")),
                        "%" + queryDto.getTitleKeyword().trim().toLowerCase(Locale.ROOT) + "%"
                ));
            }
            if (fromTime != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("crawlTime"), fromTime));
            }
            if (toTime != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("crawlTime"), toTime));
            }
            if (followedOnly && !topicMatchers.isEmpty()) {
                List<Predicate> topicPredicates = new ArrayList<>();
                for (TopicMatcher matcher : topicMatchers) {
                    for (String keyword : matcher.keywords()) {
                        topicPredicates.add(cb.like(
                                cb.lower(root.get("title")),
                                "%" + keyword.toLowerCase(Locale.ROOT) + "%"
                        ));
                    }
                }
                if (topicPredicates.isEmpty()) {
                    predicates.add(cb.disjunction());
                } else {
                    predicates.add(cb.or(topicPredicates.toArray(new Predicate[0])));
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<HotSearchRecord> page = hotSearchRecordRepository.findAll(spec, pageable);
        List<HotSearchRecordDto> content = page.getContent().stream()
                .map(record -> toDto(record, topicMatchers))
                .collect(Collectors.toList());

        if (followedOnly && topicMatchers.isEmpty()) {
            content = Collections.emptyList();
            return new PageImpl<>(content, pageable, 0);
        }

        return new PageImpl<>(content, pageable, page.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public List<HotSearchRecordDto> latest(String userId, String source) {
        List<TopicMatcher> topicMatchers = loadEnabledTopicMatchers(userId);
        return hotSearchRecordRepository.findLatestBatch(trimToNull(source))
                .stream()
                .map(record -> toDto(record, topicMatchers))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public HotSearchRecordDto getById(String userId, String id) {
        Optional<HotSearchRecord> optional = hotSearchRecordRepository.findById(id);
        List<TopicMatcher> topicMatchers = loadEnabledTopicMatchers(userId);
        return optional.map(record -> toDto(record, topicMatchers)).orElse(null);
    }

    private HotSearchRecordDto toDto(HotSearchRecord record, List<TopicMatcher> topicMatchers) {
        HotSearchRecordDto dto = new HotSearchRecordDto();
        BeanUtils.copyProperties(record, dto);
        dto.setMatchedTopics(matchTopics(record, topicMatchers));
        return dto;
    }

    private List<TopicMatcher> loadEnabledTopicMatchers(String userId) {
        if (!StringUtils.hasText(userId)) {
            return Collections.emptyList();
        }
        List<HotSearchFollowTopicDto> topics = hotSearchFollowTopicService.list(userId);
        if (topics == null || topics.isEmpty()) {
            return Collections.emptyList();
        }
        return topics.stream()
                .filter(topic -> Boolean.TRUE.equals(topic.getEnabled()))
                .map(this::buildTopicMatcher)
                .filter(matcher -> !matcher.keywords().isEmpty())
                .toList();
    }

    private TopicMatcher buildTopicMatcher(HotSearchFollowTopicDto dto) {
        Set<String> keywords = new LinkedHashSet<>();
        if (StringUtils.hasText(dto.getKeywords())) {
            String[] parts = dto.getKeywords().split("\\r?\\n|,");
            for (String part : parts) {
                if (!StringUtils.hasText(part)) {
                    continue;
                }
                keywords.add(part.trim());
            }
        }
        if (keywords.isEmpty() && StringUtils.hasText(dto.getTopicName())) {
            keywords.add(dto.getTopicName().trim());
        }
        return new TopicMatcher(dto.getTopicName(), new ArrayList<>(keywords));
    }

    private List<String> matchTopics(HotSearchRecord record, List<TopicMatcher> topicMatchers) {
        if (record == null || topicMatchers == null || topicMatchers.isEmpty()) {
            return Collections.emptyList();
        }
        String title = normalizeForMatch(record.getTitle());
        if (!StringUtils.hasText(title)) {
            return Collections.emptyList();
        }
        List<String> matched = new ArrayList<>();
        for (TopicMatcher matcher : topicMatchers) {
            for (String keyword : matcher.keywords()) {
                if (title.contains(normalizeForMatch(keyword))) {
                    matched.add(matcher.topicName());
                    break;
                }
            }
        }
        return matched;
    }

    private String normalizeForMatch(String text) {
        return StringUtils.hasText(text) ? text.trim().toLowerCase(Locale.ROOT) : "";
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

    private record TopicMatcher(String topicName, List<String> keywords) {
    }
}
