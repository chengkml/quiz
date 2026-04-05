package com.ck.quiz.codereview.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.codereview.dto.CodeReviewTaskCreateDto;
import com.ck.quiz.codereview.dto.CodeReviewTaskDto;
import com.ck.quiz.codereview.dto.CodeReviewTaskHistoryOptionsDto;
import com.ck.quiz.codereview.dto.CodeReviewTaskQueryDto;
import com.ck.quiz.codereview.dto.CodeReviewTaskUpdateDto;
import com.ck.quiz.codereview.entity.CodeReviewTask;
import com.ck.quiz.codereview.repository.CodeReviewIssueRepository;
import com.ck.quiz.codereview.repository.CodeReviewTaskRepository;
import com.ck.quiz.codereview.service.CodeReviewTaskService;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.BeanUtils;
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
import java.util.Set;

@Service
@Transactional
public class CodeReviewTaskServiceImpl extends BaseServiceImpl<CodeReviewTaskCreateDto, CodeReviewTaskUpdateDto, CodeReviewTaskQueryDto, CodeReviewTaskDto, CodeReviewTask, CodeReviewTaskRepository>
        implements CodeReviewTaskService {

    @Autowired
    private CodeReviewIssueRepository codeReviewIssueRepository;

    @Override
    protected CodeReviewTaskDto newDto() {
        return new CodeReviewTaskDto();
    }

    @Override
    protected CodeReviewTask newModel() {
        return new CodeReviewTask();
    }

    @Override
    public CodeReviewTaskDto create(CodeReviewTaskCreateDto createDto) {
        normalizeCreateDto(createDto);
        return super.create(createDto);
    }

    @Override
    public CodeReviewTaskDto update(String userId, CodeReviewTaskUpdateDto updateDto) {
        CodeReviewTask task = getTaskById(updateDto.getId());
        assertPermission(task, userId);

        BeanUtils.copyProperties(updateDto, task, "id", "createDate", "createUser", "updateDate", "updateUser");
        normalizeTask(task);
        CodeReviewTask updated = repository.save(task);
        return convertToDto(updated, true);
    }

    @Override
    public void delete(String userId, String id) {
        CodeReviewTask task = getTaskById(id);
        assertPermission(task, userId);
        if (codeReviewIssueRepository.countByTaskId(id) > 0) {
            throw new RuntimeException("任务下存在审核明细，不能直接删除");
        }
        repository.delete(task);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CodeReviewTaskDto> search(String userId, CodeReviewTaskQueryDto queryDto) {
        Specification<CodeReviewTask> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(queryDto.getKeyWord())) {
                String likeValue = "%" + queryDto.getKeyWord().trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("title"), likeValue),
                        cb.like(root.get("projectName"), likeValue),
                        cb.like(root.get("targetPage"), likeValue),
                        cb.like(root.get("branch"), likeValue)
                ));
            }
            if (StringUtils.hasText(queryDto.getTitle())) {
                predicates.add(cb.like(root.get("title"), "%" + queryDto.getTitle().trim() + "%"));
            }
            if (StringUtils.hasText(queryDto.getProjectName())) {
                predicates.add(cb.like(root.get("projectName"), "%" + queryDto.getProjectName().trim() + "%"));
            }
            if (StringUtils.hasText(queryDto.getTargetPage())) {
                predicates.add(cb.like(root.get("targetPage"), "%" + queryDto.getTargetPage().trim() + "%"));
            }
            if (queryDto.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), queryDto.getStatus()));
            }
            if (StringUtils.hasText(userId)) {
                predicates.add(cb.equal(root.get("createUser"), userId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        int page = (queryDto.getPageNum() == null || queryDto.getPageNum() < 1) ? 0 : queryDto.getPageNum() - 1;
        int size = (queryDto.getPageSize() == null || queryDto.getPageSize() < 1) ? 20 : queryDto.getPageSize();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createDate"));
        return repository.findAll(spec, pageable).map(model -> convertToDto(model, true));
    }

    @Override
    public CodeReviewTaskDto start(String userId, String id) {
        CodeReviewTask task = getTaskById(id);
        assertPermission(task, userId);
        if (task.getStatus() != CodeReviewTask.Status.OPEN) {
            throw new RuntimeException("只有待处理任务才能开始处理");
        }
        task.setStatus(CodeReviewTask.Status.IN_PROGRESS);
        return convertToDto(repository.save(task), true);
    }

    @Override
    public CodeReviewTaskDto complete(String userId, String id) {
        CodeReviewTask task = getTaskById(id);
        assertPermission(task, userId);
        if (task.getStatus() != CodeReviewTask.Status.IN_PROGRESS) {
            throw new RuntimeException("只有处理中任务才能标记完成");
        }
        task.setStatus(CodeReviewTask.Status.COMPLETED);
        return convertToDto(repository.save(task), true);
    }

    @Override
    @Transactional(readOnly = true)
    public CodeReviewTaskHistoryOptionsDto getHistoryOptions(String userId) {
        CodeReviewTaskHistoryOptionsDto dto = new CodeReviewTaskHistoryOptionsDto();
        List<CodeReviewTask> tasks = repository.findTop200ByCreateUserOrderByCreateDateDesc(userId);
        Set<String> projectNames = new LinkedHashSet<>();
        Set<String> gitUrls = new LinkedHashSet<>();
        Set<String> branches = new LinkedHashSet<>();

        for (CodeReviewTask task : tasks) {
            if (StringUtils.hasText(task.getProjectName())) {
                projectNames.add(task.getProjectName().trim());
            }
            if (StringUtils.hasText(task.getGitUrl())) {
                gitUrls.add(task.getGitUrl().trim());
            }
            if (StringUtils.hasText(task.getBranch())) {
                branches.add(task.getBranch().trim());
            }
        }

        dto.setProjectNames(new ArrayList<>(projectNames));
        dto.setGitUrls(new ArrayList<>(gitUrls));
        dto.setBranches(new ArrayList<>(branches));
        return dto;
    }

    private void normalizeCreateDto(CodeReviewTaskCreateDto createDto) {
        if (!StringUtils.hasText(createDto.getBranch())) {
            createDto.setBranch(CodeReviewTask.DEFAULT_BRANCH);
        }
        if (!StringUtils.hasText(createDto.getReviewStandard())) {
            createDto.setReviewStandard(CodeReviewTask.DEFAULT_REVIEW_STANDARD);
        }
        if (createDto.getStatus() == null) {
            createDto.setStatus(CodeReviewTask.Status.OPEN);
        }
    }

    private void normalizeTask(CodeReviewTask task) {
        if (!StringUtils.hasText(task.getBranch())) {
            task.setBranch(CodeReviewTask.DEFAULT_BRANCH);
        }
        if (!StringUtils.hasText(task.getReviewStandard())) {
            task.setReviewStandard(CodeReviewTask.DEFAULT_REVIEW_STANDARD);
        }
        if (task.getStatus() == null) {
            task.setStatus(CodeReviewTask.Status.OPEN);
        }
    }

    private CodeReviewTask getTaskById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("评审任务不存在: " + id));
    }

    private void assertPermission(CodeReviewTask task, String userId) {
        if (StringUtils.hasText(task.getCreateUser()) && !task.getCreateUser().equals(userId)) {
            throw new RuntimeException("无权限操作该评审任务");
        }
    }
}
