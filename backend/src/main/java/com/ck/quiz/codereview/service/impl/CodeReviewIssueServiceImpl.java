package com.ck.quiz.codereview.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.codereview.dto.CodeReviewIssueCreateDto;
import com.ck.quiz.codereview.dto.CodeReviewIssueDto;
import com.ck.quiz.codereview.dto.CodeReviewIssueQueryDto;
import com.ck.quiz.codereview.dto.CodeReviewIssueUpdateDto;
import com.ck.quiz.codereview.entity.CodeReviewIssue;
import com.ck.quiz.codereview.entity.CodeReviewTask;
import com.ck.quiz.codereview.repository.CodeReviewIssueRepository;
import com.ck.quiz.codereview.repository.CodeReviewTaskRepository;
import com.ck.quiz.codereview.service.CodeReviewIssueService;
import com.ck.quiz.project.dto.RequirementCreateDto;
import com.ck.quiz.project.dto.RequirementDto;
import com.ck.quiz.project.entity.Requirement;
import com.ck.quiz.project.service.RequirementService;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class CodeReviewIssueServiceImpl extends BaseServiceImpl<CodeReviewIssueCreateDto, CodeReviewIssueUpdateDto, CodeReviewIssueQueryDto, CodeReviewIssueDto, CodeReviewIssue, CodeReviewIssueRepository>
        implements CodeReviewIssueService {

    @Autowired
    private RequirementService requirementService;

    @Autowired
    private CodeReviewTaskRepository codeReviewTaskRepository;

    @Override
    protected CodeReviewIssueDto newDto() {
        return new CodeReviewIssueDto();
    }

    @Override
    protected CodeReviewIssue newModel() {
        return new CodeReviewIssue();
    }

    @Override
    public CodeReviewIssueDto create(CodeReviewIssueCreateDto createDto) {
        normalizeCreateDto(createDto);
        validateTask(createDto.getTaskId());
        return super.create(createDto);
    }

    @Override
    public CodeReviewIssueDto update(String userId, CodeReviewIssueUpdateDto updateDto) {
        CodeReviewIssue issue = getIssueById(updateDto.getId());
        assertPermission(issue, userId);
        if (StringUtils.hasText(updateDto.getTaskId())) {
            validateTask(updateDto.getTaskId());
        }
        BeanUtils.copyProperties(updateDto, issue, "id", "createDate", "createUser", "updateDate", "updateUser");
        normalizeIssue(issue);
        return convertToDto(repository.save(issue), true);
    }

    @Override
    public Page<CodeReviewIssueDto> search(String userId, CodeReviewIssueQueryDto queryDto) {
        StringBuilder sql = new StringBuilder("select c.* from code_review_issue c where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from code_review_issue c where 1=1 ");
        Map<String, Object> params = new HashMap<>();

        JdbcQueryHelper.lowerLike("keyWord", queryDto.getKeyWord(),
                " and (lower(c.title) like :keyWord or lower(c.project_name) like :keyWord or lower(c.module_name) like :keyWord or lower(c.file_path) like :keyWord) ",
                params, namedParameterJdbcTemplate, sql, countSql);

        JdbcQueryHelper.equals("taskId", queryDto.getTaskId(), " and c.task_id = :taskId ", params, sql, countSql);
        JdbcQueryHelper.equals("projectName", queryDto.getProjectName(), " and c.project_name = :projectName ", params, sql, countSql);
        JdbcQueryHelper.equals("moduleName", queryDto.getModuleName(), " and c.module_name = :moduleName ", params, sql, countSql);
        JdbcQueryHelper.equals("source", queryDto.getSource(), " and c.source = :source ", params, sql, countSql);

        if (queryDto.getStatus() != null) {
            JdbcQueryHelper.equals("status", queryDto.getStatus().name(), " and c.status = :status ", params, sql, countSql);
        }
        if (queryDto.getSeverity() != null) {
            JdbcQueryHelper.equals("severity", queryDto.getSeverity().name(), " and c.severity = :severity ", params, sql, countSql);
        }
        if (StringUtils.hasText(userId)) {
            JdbcQueryHelper.equals("createUser", userId, " and c.create_user = :createUser ", params, sql, countSql);
        }

        JdbcQueryHelper.order("c.create_date", "desc", sql);

        String listSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(),
                queryDto.getPageNum(), queryDto.getPageSize());

        List<CodeReviewIssueDto> list = namedParameterJdbcTemplate.query(listSql, params, (rs, rowNum) -> {
            CodeReviewIssueDto dto = new CodeReviewIssueDto();
            dto.setId(rs.getString("id"));
            dto.setTaskId(rs.getString("task_id"));
            dto.setTitle(rs.getString("title"));
            dto.setProjectName(rs.getString("project_name"));
            dto.setModuleName(rs.getString("module_name"));
            dto.setFilePath(rs.getString("file_path"));
            dto.setLineNo(rs.getObject("line_no") != null ? rs.getInt("line_no") : null);
            String severity = rs.getString("severity");
            if (severity != null) {
                dto.setSeverity(CodeReviewIssue.Severity.valueOf(severity));
            }
            String status = rs.getString("status");
            if (status != null) {
                dto.setStatus(CodeReviewIssue.Status.valueOf(status));
            }
            dto.setSource(rs.getString("source"));
            dto.setIssueDetail(rs.getString("issue_detail"));
            dto.setSuggestion(rs.getString("suggestion"));
            dto.setRequirementId(rs.getString("requirement_id"));
            dto.setCreateUser(rs.getString("create_user"));
            dto.setUpdateUser(rs.getString("update_user"));
            dto.setCreateDate(rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            dto.setUpdateDate(rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
            return dto;
        });

        return JdbcQueryHelper.toPage(namedParameterJdbcTemplate, countSql.toString(), params,
                list, queryDto.getPageNum(), queryDto.getPageSize());
    }

    @Override
    public List<CodeReviewIssueDto> createBatch(List<CodeReviewIssueCreateDto> createDtos) {
        if (createDtos == null || createDtos.isEmpty()) {
            return new ArrayList<>();
        }
        List<CodeReviewIssueDto> result = new ArrayList<>();
        for (CodeReviewIssueCreateDto dto : createDtos) {
            normalizeCreateDto(dto);
            validateTask(dto.getTaskId());
            result.add(super.create(dto));
        }
        return result;
    }

    @Override
    public RequirementDto convertToRequirement(String userId, String issueId) {
        CodeReviewIssue issue = getIssueById(issueId);
        assertPermission(issue, userId);

        if (StringUtils.hasText(issue.getRequirementId())) {
            return requirementService.get(userId, issue.getRequirementId());
        }

        RequirementCreateDto createDto = new RequirementCreateDto();
        createDto.setTitle("[代码评审][" + issue.getSeverity() + "] " + issue.getTitle());
        createDto.setProjectName(issue.getProjectName());
        createDto.setBranch("main");
        createDto.setStatus(Requirement.Status.OPEN);
        createDto.setPriority(mapPriority(issue.getSeverity()));
        createDto.setDescr(buildRequirementDescr(issue));

        RequirementDto requirementDto = requirementService.create(createDto);

        issue.setRequirementId(requirementDto.getId());
        issue.setStatus(CodeReviewIssue.Status.CONVERTED);
        repository.save(issue);

        return requirementDto;
    }

    @Override
    public int convertBatchToRequirement(String userId, List<String> issueIds) {
        if (issueIds == null || issueIds.isEmpty()) {
            return 0;
        }
        int count = 0;
        for (String issueId : issueIds) {
            convertToRequirement(userId, issueId);
            count++;
        }
        return count;
    }

    private void normalizeCreateDto(CodeReviewIssueCreateDto dto) {
        if (dto.getSeverity() == null) {
            dto.setSeverity(CodeReviewIssue.Severity.MEDIUM);
        }
        if (dto.getStatus() == null) {
            dto.setStatus(CodeReviewIssue.Status.OPEN);
        }
        if (!StringUtils.hasText(dto.getSource())) {
            dto.setSource("OPENCLAW");
        }
    }

    private void normalizeIssue(CodeReviewIssue issue) {
        if (issue.getSeverity() == null) {
            issue.setSeverity(CodeReviewIssue.Severity.MEDIUM);
        }
        if (issue.getStatus() == null) {
            issue.setStatus(CodeReviewIssue.Status.OPEN);
        }
        if (!StringUtils.hasText(issue.getSource())) {
            issue.setSource("OPENCLAW");
        }
    }

    private void validateTask(String taskId) {
        if (!StringUtils.hasText(taskId)) {
            throw new RuntimeException("评审问题必须绑定任务");
        }
        codeReviewTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("评审任务不存在: " + taskId));
    }

    private CodeReviewIssue getIssueById(String issueId) {
        return repository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("评审问题不存在: " + issueId));
    }

    private void assertPermission(CodeReviewIssue issue, String userId) {
        if (StringUtils.hasText(issue.getCreateUser()) && !issue.getCreateUser().equals(userId)) {
            throw new RuntimeException("无权限操作该评审问题");
        }
    }

    private Requirement.Priority mapPriority(CodeReviewIssue.Severity severity) {
        if (severity == null) {
            return Requirement.Priority.MEDIUM;
        }
        return switch (severity) {
            case CRITICAL, HIGH -> Requirement.Priority.HIGH;
            case MEDIUM -> Requirement.Priority.MEDIUM;
            case LOW -> Requirement.Priority.LOW;
        };
    }

    private String buildRequirementDescr(CodeReviewIssue issue) {
        StringBuilder sb = new StringBuilder();
        sb.append("来源：代码评审\n");
        if (StringUtils.hasText(issue.getTaskId())) {
            codeReviewTaskRepository.findById(issue.getTaskId()).ifPresent(task -> {
                sb.append("评审任务：").append(task.getTitle()).append("\n");
                if (StringUtils.hasText(task.getTargetPage())) {
                    sb.append("目标页面：").append(task.getTargetPage()).append("\n");
                }
                if (StringUtils.hasText(task.getReviewStandard())) {
                    sb.append("评审规范：").append(task.getReviewStandard()).append("\n");
                }
            });
        }
        if (StringUtils.hasText(issue.getProjectName())) {
            sb.append("项目：").append(issue.getProjectName()).append("\n");
        }
        if (StringUtils.hasText(issue.getModuleName())) {
            sb.append("模块：").append(issue.getModuleName()).append("\n");
        }
        if (StringUtils.hasText(issue.getFilePath())) {
            sb.append("文件：").append(issue.getFilePath());
            if (issue.getLineNo() != null) {
                sb.append(":").append(issue.getLineNo());
            }
            sb.append("\n");
        }
        if (issue.getSeverity() != null) {
            sb.append("严重级别：").append(issue.getSeverity()).append("\n");
        }
        if (StringUtils.hasText(issue.getIssueDetail())) {
            sb.append("\n问题描述：\n").append(issue.getIssueDetail()).append("\n");
        }
        if (StringUtils.hasText(issue.getSuggestion())) {
            sb.append("\n修复建议：\n").append(issue.getSuggestion()).append("\n");
        }
        return sb.toString();
    }
}
