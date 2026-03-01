package com.ck.quiz.poetry.service.impl;

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
        String userId = getCurrentUserId();
        Optional<PoetryCard> existing = poetryCardRepository.findByTitleAndAuthorAndUser(
                createDto.getTitle(), createDto.getAuthor(), userId);
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

        if (!card.getCreateUser().equals(userId)) {
            throw new RuntimeException("无权限操作此诗词");
        }

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

            predicates.add(cb.equal(root.get("createUser"), userId));

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
    public PoetryCardDto convertToDto(PoetryCard card, Boolean loadProps) {
        PoetryCardDto dto = super.convertToDto(card, loadProps);
        dto.setTitle(card.getTitle());
        dto.setAuthor(card.getAuthor());
        dto.setDynasty(card.getDynasty());
        dto.setContent(card.getContent());
        dto.setMdAnalysis(card.getMdAnalysis());
        return dto;
    }

    private String getCurrentUserId() {
        org.springframework.security.core.Authentication authentication =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "anonymous";
        }
        return authentication.getName();
    }
}
