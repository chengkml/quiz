package com.ck.quiz.poetry.service.impl;

import com.ck.quiz.base.dto.ReviewLogDto;
import com.ck.quiz.base.dto.ReviewRequestDto;
import com.ck.quiz.base.dto.ReviewResultDto;
import com.ck.quiz.base.entity.ReviewLog;
import com.ck.quiz.base.repository.ReviewLogRepository;
import com.ck.quiz.base.service.impl.ReviewBaseServiceImpl;
import com.ck.quiz.poetry.dto.PoetryCardCreateDto;
import com.ck.quiz.poetry.dto.PoetryCardDto;
import com.ck.quiz.poetry.dto.PoetryCardQueryDto;
import com.ck.quiz.poetry.dto.PoetryCardUpdateDto;
import com.ck.quiz.poetry.entity.PoetryCard;
import com.ck.quiz.poetry.repository.PoetryCardRepository;
import com.ck.quiz.poetry.service.PoetryCardService;
import com.ck.quiz.utils.IdHelper;
import jakarta.persistence.criteria.Predicate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 诗词卡片服务实现
 */
@Slf4j
@Service
public class PoetryCardServiceImpl extends
        ReviewBaseServiceImpl<PoetryCardCreateDto, PoetryCardUpdateDto, PoetryCardQueryDto, PoetryCardDto, PoetryCard, PoetryCardRepository>
        implements PoetryCardService {

    @Autowired
    private PoetryCardRepository poetryCardRepository;

    @Autowired
    private ReviewLogRepository reviewLogRepository;

    @Override
    protected PoetryCardDto newDto() {
        return new PoetryCardDto();
    }

    @Override
    protected PoetryCard newModel() {
        return new PoetryCard();
    }

    @Override
    @Transactional
    public PoetryCardDto create(PoetryCardCreateDto createDto) {
        Optional<PoetryCard> existing = poetryCardRepository.findByTitleAndAuthor(
                createDto.getTitle(), createDto.getAuthor());
        if (existing.isPresent()) {
            throw new RuntimeException("该作者的同名诗词已存在: " + createDto.getTitle());
        }

        PoetryCard card = newModel();
        card.setId(IdHelper.genUuid());
        BeanUtils.copyProperties(createDto, card);

        card.setEasinessFactor(2.5);
        card.setInterval(0);
        card.setRepetition(0);
        card.setNextReviewDate(LocalDateTime.now().plusDays(1));
        card.setArchived(false);
        card.setTotalReviewCount(0);

        PoetryCard saved = poetryCardRepository.save(card);
        return convertToDto(saved, true);
    }

    @Override
    @Transactional
    public PoetryCardDto update(String userId, PoetryCardUpdateDto updateDto) {
        PoetryCard card = poetryCardRepository.findById(updateDto.getId())
                .orElseThrow(() -> new RuntimeException("诗词不存在"));

        BeanUtils.copyProperties(updateDto, card);
        PoetryCard saved = poetryCardRepository.save(card);
        return convertToDto(saved, true);
    }

    @Override
    public Page<PoetryCardDto> search(String userId, PoetryCardQueryDto queryDto) {
        Sort.Direction direction = "asc".equalsIgnoreCase(queryDto.getSortDirection())
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        String sortBy = queryDto.getSortBy() != null && !queryDto.getSortBy().isEmpty()
                ? queryDto.getSortBy()
                : "createDate";

        int page = queryDto.getPage() != null ? queryDto.getPage() : 0;
        int size = queryDto.getSize() != null ? queryDto.getSize() : 20;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<PoetryCard> pageResult = poetryCardRepository.findAll((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (queryDto.getKeyword() != null && !queryDto.getKeyword().trim().isEmpty()) {
                String keywordLike = "%" + queryDto.getKeyword().toLowerCase() + "%";
                Predicate titleLike = cb.like(cb.lower(root.get("title")), keywordLike);
                Predicate authorLike = cb.like(cb.lower(root.get("author")), keywordLike);
                Predicate contentLike = cb.like(cb.lower(root.get("content")), keywordLike);
                predicates.add(cb.or(titleLike, authorLike, contentLike));
            }

            if (queryDto.getArchived() != null) {
                predicates.add(cb.equal(root.get("archived"), queryDto.getArchived()));
            }

            if (queryDto.getMinRepetition() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("repetition"), queryDto.getMinRepetition()));
            }
            if (queryDto.getMaxRepetition() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("repetition"), queryDto.getMaxRepetition()));
            }

            if (queryDto.getCreateDateStart() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createDate"), queryDto.getCreateDateStart().atStartOfDay()));
            }
            if (queryDto.getCreateDateEnd() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createDate"), queryDto.getCreateDateEnd().atTime(23, 59, 59)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        }, pageable);

        List<PoetryCardDto> dtos = pageResult.getContent().stream()
                .map(card -> convertToDto(card, true))
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, pageResult.getTotalElements());
    }

    @Override
    @Transactional
    public void delete(String userId, String id) {
        PoetryCard card = poetryCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("诗词不存在"));

        groupObjRelaRepository.deleteByObjId(id);
        tagObjRelaRepository.deleteByObjId(id);
        poetryCardRepository.delete(card);
    }

    @Override
    public PoetryCardDto get(String userId, String id) {
        PoetryCard card = poetryCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("诗词不存在"));
        return convertToDto(card, true);
    }

    @Override
    public List<PoetryCardDto> list(String userId) {
        return convertToDtos(poetryCardRepository.findAll());
    }

    @Override
    @Transactional
    public void archive(String userId, String id, boolean archived) {
        PoetryCard card = poetryCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("诗词不存在"));

        card.setArchived(archived);
        poetryCardRepository.save(card);
    }

    @Override
    @Transactional
    public void reset(String userId, String id) {
        PoetryCard card = poetryCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("诗词不存在"));

        card.setEasinessFactor(2.5);
        card.setInterval(0);
        card.setRepetition(0);
        card.setNextReviewDate(LocalDateTime.now().plusDays(1));
        card.setLastScore(null);

        poetryCardRepository.save(card);
        log.info("诗词 {} 已重置学习状态", card.getId());
    }

    @Override
    public List<PoetryCardDto> getDueToday(String userId) {
        LocalDateTime now = LocalDateTime.now();
        return poetryCardRepository.findDueToday(now).stream()
                .map(card -> convertToDto(card, true))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ReviewResultDto review(String userId, ReviewRequestDto dto) {
        PoetryCard card = poetryCardRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("诗词不存在"));

        if (dto.getScore() < 0 || dto.getScore() > 5) {
            throw new RuntimeException("评分必须在 0-5 之间");
        }

        Double efBefore = card.getEasinessFactor();
        LocalDateTime reviewTime = LocalDateTime.now();

        double newEF = card.getEasinessFactor() +
                (0.1 - (5 - dto.getScore()) * (0.08 + (5 - dto.getScore()) * 0.02));
        newEF = Math.max(1.3, newEF);
        card.setEasinessFactor(newEF);

        int newInterval;
        int newRepetition;
        String message;

        if (dto.getScore() < 3) {
            newRepetition = 0;
            newInterval = 1;
            message = "继续加油！明天再来复习这首诗词";
        } else {
            newRepetition = card.getRepetition() + 1;

            if (newRepetition == 1) {
                newInterval = 1;
                message = "不错！明天再来巩固一次";
            } else if (newRepetition == 2) {
                newInterval = 6;
                message = "很好！6天后再复习";
            } else {
                newInterval = (int) Math.ceil(card.getInterval() * newEF);
                message = String.format("太棒了！%d天后再复习", newInterval);
            }
        }

        card.setRepetition(newRepetition);
        card.setInterval(newInterval);

        LocalDateTime nextReview = reviewTime.plusDays(newInterval);
        card.setNextReviewDate(nextReview);
        card.setTotalReviewCount(card.getTotalReviewCount() + 1);
        card.setLastScore(dto.getScore());

        ReviewLog reviewLog = new ReviewLog();
        reviewLog.setId(IdHelper.genUuid());
        reviewLog.setObjId(card.getId());
        reviewLog.setReviewDate(LocalDateTime.now());
        reviewLog.setScore(dto.getScore());
        reviewLog.setEfBefore(efBefore);
        reviewLog.setEfAfter(newEF);
        reviewLog.setNextIntervalDays(newInterval);
        reviewLogRepository.save(reviewLog);

        PoetryCard saved = poetryCardRepository.save(card);

        ReviewResultDto result = new ReviewResultDto();
        result.setId(saved.getId());
        result.setScore(dto.getScore());
        result.setNewEasinessFactor(newEF);
        result.setNewInterval(newInterval);
        result.setNewRepetition(newRepetition);
        result.setNextReviewDate(nextReview);
        result.setMessage(message);

        log.info("完成诗词复习: 评分={}, 新EF={}, 新间隔={}天, 下次复习={}",
                dto.getScore(), newEF, newInterval, nextReview);

        return result;
    }

    @Override
    public List<ReviewLogDto> getReviewHistory(String userId, String cardId) {
        PoetryCard card = poetryCardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("诗词不存在"));

        return reviewLogRepository.findByObjId(card.getId()).stream()
                .map(this::convertToReviewLogDto)
                .collect(Collectors.toList());
    }

    @Override
    public PoetryCardDto convertToDto(PoetryCard card, Boolean loadProps) {
        PoetryCardDto dto = super.convertToDto(card, loadProps);
        dto.setTitle(card.getTitle());
        dto.setAuthor(card.getAuthor());
        dto.setDynasty(card.getDynasty());
        dto.setContent(card.getContent());
        dto.setMdAnalysis(card.getMdAnalysis());
        return dto;
    }

    private ReviewLogDto convertToReviewLogDto(ReviewLog reviewLog) {
        ReviewLogDto dto = new ReviewLogDto();
        dto.setId(reviewLog.getId());
        dto.setObjId(reviewLog.getObjId());
        dto.setReviewDate(reviewLog.getReviewDate());
        dto.setScore(reviewLog.getScore());
        dto.setEfBefore(reviewLog.getEfBefore());
        dto.setEfAfter(reviewLog.getEfAfter());
        dto.setNextIntervalDays(reviewLog.getNextIntervalDays());
        return dto;
    }
}
