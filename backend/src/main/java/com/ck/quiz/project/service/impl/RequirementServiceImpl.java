package com.ck.quiz.project.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.project.dto.RequirementAnalyzeDto;
import com.ck.quiz.project.dto.RequirementCreateDto;
import com.ck.quiz.project.dto.RequirementDto;
import com.ck.quiz.project.dto.RequirementHistoryOptionsDto;
import com.ck.quiz.project.dto.RequirementLifecycleLogDto;
import com.ck.quiz.project.dto.RequirementQueryDto;
import com.ck.quiz.project.dto.RequirementReviewDto;
import com.ck.quiz.project.dto.RequirementUpdateDto;
import com.ck.quiz.project.entity.Requirement;
import com.ck.quiz.project.entity.Requirement.Status;
import com.ck.quiz.project.entity.RequirementLifecycleLog;
import com.ck.quiz.project.repository.RequirementLifecycleLogRepository;
import com.ck.quiz.project.repository.RequirementRepository;
import com.ck.quiz.project.service.RequirementService;
import com.ck.quiz.user.dto.UserDto;
import com.ck.quiz.utils.IdHelper;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class RequirementServiceImpl extends BaseServiceImpl<RequirementCreateDto, RequirementUpdateDto, RequirementQueryDto, RequirementDto, Requirement, RequirementRepository> implements RequirementService {

    @Autowired
    private RequirementLifecycleLogRepository requirementLifecycleLogRepository;

    @Override
    protected RequirementDto newDto() {
        return new RequirementDto();
    }

    @Override
    protected Requirement newModel() {
        return new Requirement();
    }

    @Override
    @Transactional
    public RequirementDto create(RequirementCreateDto createDto) {
        RequirementDto dto = super.create(createDto);
        Requirement requirement = repository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Requirement not found: " + dto.getId()));
        appendLifecycleLog(requirement, RequirementLifecycleLog.EventType.CREATE, null, requirement.getStatus(),
                null, requirement.getDescr(), "创建需求");
        return dto;
    }

    @Override
    @Transactional
    public RequirementDto update(String userId, RequirementUpdateDto updateDto) {
        Requirement before = getRequirementForUser(userId, updateDto.getId());
        Status fromStatus = before.getStatus();
        String beforeDescr = before.getDescr();

        RequirementDto dto = super.update(userId, updateDto);
        Requirement updated = repository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Requirement not found: " + dto.getId()));

        appendLifecycleLog(updated, RequirementLifecycleLog.EventType.EDIT, fromStatus, updated.getStatus(),
                beforeDescr, updated.getDescr(), "更新需求");
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public RequirementDto getPendingRequirement() {
        List<Requirement> pendingList = repository.findAll((root, query, cb) ->
                        cb.equal(root.get("status"), Status.OPEN),
                PageRequest.of(0, 1, Sort.by(Sort.Direction.ASC, "createDate"))
        ).getContent();

        if (pendingList.isEmpty()) {
            return null;
        }
        return convertToDto(pendingList.get(0), false);
    }

    @Override
    @Transactional
    public void updateStatus(String id, String statusStr, String resultMsg, Integer progressPercent) {
        Requirement requirement = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Requirement not found: " + id));

        Status fromStatus = requirement.getStatus();
        String beforeDescr = requirement.getDescr();

        Status status;
        try {
            status = Status.valueOf(statusStr.toUpperCase());
            requirement.setStatus(status);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + statusStr);
        }

        if (StringUtils.hasText(resultMsg)) {
            requirement.setResultMsg(resultMsg);
        }

        if (progressPercent != null) {
            requirement.setProgressPercent(normalizeProgress(progressPercent));
        } else if (status == Status.COMPLETED) {
            requirement.setProgressPercent(100);
        } else if (status == Status.PENDING_ANALYSIS
                || status == Status.PENDING_REVIEW
                || status == Status.PENDING_REVISION
                || status == Status.OPEN) {
            requirement.setProgressPercent(0);
        }

        Requirement updated = repository.save(requirement);
        appendLifecycleLog(updated, RequirementLifecycleLog.EventType.STATUS_CHANGE, fromStatus, updated.getStatus(),
                beforeDescr, updated.getDescr(), resultMsg);
    }

    @Override
    @Transactional
    public RequirementDto analyze(String userId, String id, RequirementAnalyzeDto analyzeDto) {
        Requirement requirement = getRequirementForUser(userId, id);
        RequirementAnalyzeDto payload = analyzeDto == null ? new RequirementAnalyzeDto() : analyzeDto;

        Status fromStatus = requirement.getStatus();
        String beforeDescr = requirement.getDescr();

        if (payload.getDescr() != null) {
            requirement.setDescr(payload.getDescr());
        }
        requirement.setStatus(Status.PENDING_REVIEW);

        if (payload.getProgressPercent() != null) {
            requirement.setProgressPercent(normalizeProgress(payload.getProgressPercent()));
        } else {
            requirement.setProgressPercent(0);
        }

        Requirement updated = repository.save(requirement);
        appendLifecycleLog(updated, RequirementLifecycleLog.EventType.ANALYZE, fromStatus, updated.getStatus(),
                beforeDescr, updated.getDescr(), payload.getComment());
        return convertToDto(updated, true);
    }

    @Override
    @Transactional
    public RequirementDto review(String userId, String id, RequirementReviewDto reviewDto) {
        Requirement requirement = getRequirementForUser(userId, id);
        if (reviewDto == null || reviewDto.getDecision() == null) {
            throw new RuntimeException("Review decision is required");
        }

        Status fromStatus = requirement.getStatus();
        String beforeDescr = requirement.getDescr();

        if (reviewDto.getDescr() != null) {
            requirement.setDescr(reviewDto.getDescr());
        }

        if (reviewDto.getDecision() == RequirementReviewDto.ReviewDecision.TO_REVISION) {
            requirement.setStatus(Status.PENDING_REVISION);
            requirement.setProgressPercent(0);
        } else {
            requirement.setStatus(Status.OPEN);
            requirement.setProgressPercent(0);
        }

        Requirement updated = repository.save(requirement);
        appendLifecycleLog(updated, RequirementLifecycleLog.EventType.REVIEW, fromStatus, updated.getStatus(),
                beforeDescr, updated.getDescr(), reviewDto.getComment());
        return convertToDto(updated, true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RequirementLifecycleLogDto> getLifecycle(String userId, String requirementId) {
        getRequirementForUser(userId, requirementId);

        List<RequirementLifecycleLog> logs = requirementLifecycleLogRepository
                .findByRequirementIdOrderByCreateDateAsc(requirementId);

        List<RequirementLifecycleLogDto> dtos = new ArrayList<>();
        for (RequirementLifecycleLog log : logs) {
            RequirementLifecycleLogDto dto = new RequirementLifecycleLogDto();
            dto.setId(log.getId());
            dto.setRequirementId(log.getRequirementId());
            dto.setEventType(log.getEventType());
            dto.setFromStatus(log.getFromStatus());
            dto.setToStatus(log.getToStatus());
            dto.setBeforeDescr(log.getBeforeDescr());
            dto.setAfterDescr(log.getAfterDescr());
            dto.setRemark(log.getRemark());
            dto.setCreateDate(log.getCreateDate());
            dto.setCreateUser(log.getCreateUser());
            dto.setUpdateDate(log.getUpdateDate());
            dto.setUpdateUser(log.getUpdateUser());
            dtos.add(dto);
        }

        List<String> userIds = dtos.stream()
                .map(RequirementLifecycleLogDto::getCreateUser)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();

        if (!userIds.isEmpty()) {
            Map<String, UserDto> userMap = userService.getUserMapByIds(userIds);
            for (RequirementLifecycleLogDto dto : dtos) {
                UserDto userDto = userMap.get(dto.getCreateUser());
                if (userDto != null) {
                    dto.setCreateUserName(userDto.getUserName());
                } else if ("SYSTEM".equalsIgnoreCase(dto.getCreateUser())) {
                    dto.setCreateUserName("系统");
                }
            }
        }

        return dtos;
    }

    @Override
    public Page<RequirementDto> search(String userId, RequirementQueryDto queryDto) {
        Specification<Requirement> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(userId)) {
                predicates.add(cb.equal(root.get("createUser"), userId));
            }
            if (StringUtils.hasText(queryDto.getTitle())) {
                predicates.add(cb.like(root.get("title"), "%" + queryDto.getTitle() + "%"));
            }
            if (StringUtils.hasText(queryDto.getProjectName())) {
                predicates.add(cb.like(root.get("projectName"), "%" + queryDto.getProjectName() + "%"));
            }
            if (queryDto.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), queryDto.getStatus()));
            }
            if (queryDto.getPriority() != null) {
                predicates.add(cb.equal(root.get("priority"), queryDto.getPriority()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        int page = (queryDto.getPageNum() == null || queryDto.getPageNum() < 1) ? 0 : queryDto.getPageNum() - 1;
        int size = (queryDto.getPageSize() == null || queryDto.getPageSize() < 1) ? 10 : queryDto.getPageSize();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createDate"));
        Page<Requirement> resultPage = repository.findAll(spec, pageable);
        return resultPage.map(model -> convertToDto(model, true));
    }

    @Override
    @Transactional(readOnly = true)
    public RequirementHistoryOptionsDto getHistoryOptions(String userId) {
        RequirementHistoryOptionsDto dto = new RequirementHistoryOptionsDto();
        if (!StringUtils.hasText(userId)) {
            return dto;
        }

        List<Requirement> requirements = repository.findTop200ByCreateUserOrderByCreateDateDesc(userId);
        Set<String> projectNames = new LinkedHashSet<>();
        Set<String> gitUrls = new LinkedHashSet<>();
        Set<String> branches = new LinkedHashSet<>();

        for (Requirement requirement : requirements) {
            if (StringUtils.hasText(requirement.getProjectName())) {
                projectNames.add(requirement.getProjectName().trim());
            }
            if (StringUtils.hasText(requirement.getGitUrl())) {
                gitUrls.add(requirement.getGitUrl().trim());
            }
            if (StringUtils.hasText(requirement.getBranch())) {
                branches.add(requirement.getBranch().trim());
            }
        }

        dto.setProjectNames(new ArrayList<>(projectNames));
        dto.setGitUrls(new ArrayList<>(gitUrls));
        dto.setBranches(new ArrayList<>(branches));
        return dto;
    }

    private Requirement getRequirementForUser(String userId, String requirementId) {
        Requirement requirement = repository.findById(requirementId)
                .orElseThrow(() -> new RuntimeException("Requirement not found: " + requirementId));

        if (StringUtils.hasText(userId)
                && StringUtils.hasText(requirement.getCreateUser())
                && !userId.equals(requirement.getCreateUser())) {
            throw new RuntimeException("No permission to access requirement: " + requirementId);
        }
        return requirement;
    }

    private void appendLifecycleLog(Requirement requirement,
                                    RequirementLifecycleLog.EventType eventType,
                                    Status fromStatus,
                                    Status toStatus,
                                    String beforeDescr,
                                    String afterDescr,
                                    String remark) {
        RequirementLifecycleLog log = new RequirementLifecycleLog();
        log.setId(IdHelper.genUuid());
        log.setRequirementId(requirement.getId());
        log.setEventType(eventType);
        log.setFromStatus(fromStatus);
        log.setToStatus(toStatus);
        log.setBeforeDescr(beforeDescr);
        log.setAfterDescr(afterDescr);
        log.setRemark(remark);
        requirementLifecycleLogRepository.save(log);
    }

    private int normalizeProgress(Integer progressPercent) {
        if (progressPercent == null) {
            return 0;
        }
        return Math.max(0, Math.min(100, progressPercent));
    }
}
