package com.ck.quiz.hotsearch.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.hotsearch.dto.HotSearchFollowTopicCreateDto;
import com.ck.quiz.hotsearch.dto.HotSearchFollowTopicDto;
import com.ck.quiz.hotsearch.dto.HotSearchFollowTopicQueryDto;
import com.ck.quiz.hotsearch.dto.HotSearchFollowTopicUpdateDto;
import com.ck.quiz.hotsearch.entity.HotSearchFollowTopic;
import com.ck.quiz.hotsearch.repository.HotSearchFollowTopicRepository;
import com.ck.quiz.hotsearch.service.HotSearchFollowTopicService;
import com.ck.quiz.utils.IdHelper;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Service
public class HotSearchFollowTopicServiceImpl extends BaseServiceImpl<HotSearchFollowTopicCreateDto, HotSearchFollowTopicUpdateDto, HotSearchFollowTopicQueryDto, HotSearchFollowTopicDto, HotSearchFollowTopic, HotSearchFollowTopicRepository>
        implements HotSearchFollowTopicService {

    private final HotSearchFollowTopicRepository hotSearchFollowTopicRepository;

    public HotSearchFollowTopicServiceImpl(HotSearchFollowTopicRepository hotSearchFollowTopicRepository) {
        this.hotSearchFollowTopicRepository = hotSearchFollowTopicRepository;
    }

    @Override
    protected HotSearchFollowTopicDto newDto() {
        return new HotSearchFollowTopicDto();
    }

    @Override
    protected HotSearchFollowTopic newModel() {
        return new HotSearchFollowTopic();
    }

    @Override
    @Transactional
    public HotSearchFollowTopicDto create(HotSearchFollowTopicCreateDto createDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication == null ? null : authentication.getName();

        HotSearchFollowTopic model = newModel();
        model.setId(IdHelper.genUuid());
        model.setTopicName(normalizeRequired(createDto.getTopicName(), "主题名称不能为空"));
        model.setKeywords(normalizeKeywords(createDto.getKeywords()));
        model.setEnabled(createDto.getEnabled() == null ? Boolean.TRUE : createDto.getEnabled());
        model.setSeq(normalizeSeq(createDto.getSeq()));
        ensureDuplicateName(userId, model.getTopicName(), null);
        HotSearchFollowTopic saved = hotSearchFollowTopicRepository.save(model);
        return convertToDto(saved, true);
    }

    @Override
    @Transactional
    public HotSearchFollowTopicDto update(String userId, HotSearchFollowTopicUpdateDto updateDto) {
        HotSearchFollowTopic model = hotSearchFollowTopicRepository.findById(updateDto.getId())
                .orElseThrow(() -> new IllegalArgumentException("关注主题不存在: " + updateDto.getId()));
        ensureOwnership(userId, model);
        String topicName = normalizeRequired(updateDto.getTopicName(), "主题名称不能为空");
        ensureDuplicateName(userId, topicName, model.getId());
        model.setTopicName(topicName);
        model.setKeywords(normalizeKeywords(updateDto.getKeywords()));
        model.setEnabled(updateDto.getEnabled() == null ? Boolean.TRUE : updateDto.getEnabled());
        model.setSeq(normalizeSeq(updateDto.getSeq()));
        HotSearchFollowTopic saved = hotSearchFollowTopicRepository.save(model);
        return convertToDto(saved, true);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<HotSearchFollowTopicDto> search(String userId, HotSearchFollowTopicQueryDto queryDto) {
        int pageNum = queryDto.getPageNum() == null || queryDto.getPageNum() < 0 ? 0 : queryDto.getPageNum();
        int pageSize = queryDto.getPageSize() == null || queryDto.getPageSize() <= 0 ? 20 : Math.min(queryDto.getPageSize(), 200);
        PageRequest pageable = PageRequest.of(pageNum, pageSize, Sort.by(Sort.Order.asc("seq"), Sort.Order.desc("createDate")));

        Specification<HotSearchFollowTopic> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("createUser"), userId));
            if (StringUtils.hasText(queryDto.getTopicName())) {
                predicates.add(cb.like(cb.lower(root.get("topicName")), "%" + queryDto.getTopicName().trim().toLowerCase() + "%"));
            }
            if (queryDto.getEnabled() != null) {
                predicates.add(cb.equal(root.get("enabled"), queryDto.getEnabled()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return hotSearchFollowTopicRepository.findAll(spec, pageable).map(item -> convertToDto(item, true));
    }

    @Override
    @Transactional(readOnly = true)
    public List<HotSearchFollowTopicDto> list(String userId) {
        return convertToDtos(hotSearchFollowTopicRepository.findByCreateUserOrderBySeqAscCreateDateDesc(userId));
    }

    @Override
    @Transactional(readOnly = true)
    public HotSearchFollowTopicDto get(String userId, String id) {
        HotSearchFollowTopic model = hotSearchFollowTopicRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("关注主题不存在: " + id));
        ensureOwnership(userId, model);
        return convertToDto(model, true);
    }

    @Override
    @Transactional
    public void delete(String userId, String id) {
        HotSearchFollowTopic model = hotSearchFollowTopicRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("关注主题不存在: " + id));
        ensureOwnership(userId, model);
        hotSearchFollowTopicRepository.delete(model);
    }

    private void ensureOwnership(String userId, HotSearchFollowTopic model) {
        if (model.getCreateUser() != null && !model.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("无权操作关注主题: " + model.getId());
        }
    }

    private void ensureDuplicateName(String userId, String topicName, String excludeId) {
        if (StringUtils.hasText(userId) && hotSearchFollowTopicRepository.existsDuplicateTopicName(userId, topicName, excludeId)) {
            throw new IllegalArgumentException("主题名称已存在: " + topicName);
        }
    }

    private String normalizeRequired(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private String normalizeKeywords(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String[] parts = value.split("\\r?\\n|,");
        List<String> normalized = new ArrayList<>();
        for (String part : parts) {
            if (!StringUtils.hasText(part)) {
                continue;
            }
            String trimmed = part.trim();
            if (!trimmed.isEmpty() && !normalized.contains(trimmed)) {
                normalized.add(trimmed);
            }
        }
        return normalized.isEmpty() ? null : String.join(", ", normalized);
    }

    private Integer normalizeSeq(Integer seq) {
        return seq == null ? 0 : Math.max(seq, 0);
    }
}
