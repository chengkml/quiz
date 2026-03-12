package com.ck.quiz.project.service.impl;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.criteria.Predicate;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.project.dto.RequirementCreateDto;
import com.ck.quiz.project.dto.RequirementDto;
import com.ck.quiz.project.dto.RequirementHistoryOptionsDto;
import com.ck.quiz.project.dto.RequirementQueryDto;
import com.ck.quiz.project.dto.RequirementUpdateDto;
import com.ck.quiz.project.entity.Requirement;
import com.ck.quiz.project.repository.RequirementRepository;
import com.ck.quiz.project.service.RequirementService;
import com.ck.quiz.project.entity.Requirement.Status;

import java.util.LinkedHashSet;
import java.util.Set;

@Service
public class RequirementServiceImpl extends BaseServiceImpl<RequirementCreateDto, RequirementUpdateDto, RequirementQueryDto, RequirementDto, Requirement, RequirementRepository> implements RequirementService {

    @Override
    protected RequirementDto newDto() {
        return new RequirementDto();
    }

    @Override
    protected Requirement newModel() {
        return new Requirement();
    }

    @Override
    @Transactional(readOnly = true)
    public RequirementDto getPendingRequirement() {
        // 获取最早的一个待处理需求 (PENDING/OPEN)
        // 假设 OPEN 为待处理状态
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
        } else if (status == Status.OPEN) {
            requirement.setProgressPercent(0);
        } else if (status == Status.COMPLETED) {
            requirement.setProgressPercent(100);
        }

        repository.save(requirement);
    }

    private int normalizeProgress(Integer progressPercent) {
        if (progressPercent == null) {
            return 0;
        }
        return Math.max(0, Math.min(100, progressPercent));
    }

    @Override
    public Page<RequirementDto> search(String userId, RequirementQueryDto queryDto) {
        Specification<Requirement> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            // Assuming we only see our own created items or all? 
            // Based on BaseServiceImpl.list(userId), it filters by createUser.
            // So search should likely respect that too, or be project dependent.
            // For now, let's include the userId filter to be consistent with personal data pattern in this app
            // unless it is a shared project entity. 
            // Given "Project Requirement", it might be shared.
            // However, looking at BaseServiceImpl.list: repository.findByCreateUser(userId);
            // I'll stick to the user isolation for safety unless specified otherwise, or make it optional.
            // If the user wants to see all, they might need admin rights or specific logic.
            // Let's comment it out for now to allow broader search if it's a team project, 
            // or add it if the prompt implied "my requirements".
            // The prompt didn't specify. I will add it but check if userId is present.
            
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
}
