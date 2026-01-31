package com.ck.quiz.orchestration.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.orchestration.dto.*;
import com.ck.quiz.orchestration.entity.OrchestrationInstance;
import com.ck.quiz.orchestration.entity.OrchestrationWorkflow;
import com.ck.quiz.orchestration.entity.OrchestrationWorkflowVersion;
import com.ck.quiz.orchestration.repository.OrchestrationInstanceRepository;
import com.ck.quiz.orchestration.repository.OrchestrationWorkflowRepository;
import com.ck.quiz.orchestration.repository.OrchestrationWorkflowVersionRepository;
import com.ck.quiz.orchestration.service.OrchestrationWorkflowService;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class OrchestrationWorkflowServiceImpl extends
        BaseServiceImpl<OrchestrationWorkflowCreateDto, OrchestrationWorkflowUpdateDto, OrchestrationWorkflowQueryDto, OrchestrationWorkflowDto, OrchestrationWorkflow, OrchestrationWorkflowRepository>
        implements OrchestrationWorkflowService {

    @Autowired
    private OrchestrationWorkflowVersionRepository versionRepository;

    @Autowired
    private OrchestrationInstanceRepository instanceRepository;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    protected OrchestrationWorkflowDto newDto() {
        return new OrchestrationWorkflowDto();
    }

    @Override
    protected OrchestrationWorkflow newModel() {
        return new OrchestrationWorkflow();
    }

    @Override
    public Page<OrchestrationWorkflowDto> search(String userId, OrchestrationWorkflowQueryDto queryDto) {
        StringBuilder sql = new StringBuilder("select w.* from orch_workflow w where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from orch_workflow w where 1=1 ");
        Map<String, Object> params = new HashMap<>();

        if (StringUtils.hasText(userId)) {
            JdbcQueryHelper.equals("createUser", userId, " and w.create_user = :createUser ", params, sql, countSql);
        }

        JdbcQueryHelper.lowerLike("keyWord", queryDto.getKeyWord(),
                " and (lower(w.name) like :keyWord or lower(w.code) like :keyWord) ",
                params, jdbcTemplate, sql, countSql);

        if (queryDto.getStatus() != null) {
            JdbcQueryHelper.equals("status", queryDto.getStatus().name(),
                    " and w.status = :status ", params, sql, countSql);
        }

        JdbcQueryHelper.order("create_date", "desc", sql);

        String limitSql = JdbcQueryHelper.getLimitSql(jdbcTemplate, sql.toString(), queryDto.getPageNum(),
                queryDto.getPageSize());

        List<OrchestrationWorkflowDto> rows = jdbcTemplate.query(limitSql, params, (rs, rowNum) -> {
            OrchestrationWorkflowDto dto = new OrchestrationWorkflowDto();
            dto.setId(rs.getString("id"));
            dto.setCode(rs.getString("code"));
            dto.setName(rs.getString("name"));
            dto.setDescription(rs.getString("description"));

            String status = rs.getString("status");
            if (status != null) {
                dto.setStatus(OrchestrationWorkflow.WorkflowStatus.valueOf(status));
            }
            dto.setCurrentVersionId(rs.getString("current_version_id"));
            dto.setCreateUser(rs.getString("create_user"));
            if (rs.getTimestamp("create_date") != null) {
                dto.setCreateDate(rs.getTimestamp("create_date").toLocalDateTime());
            }
            dto.setUpdateUser(rs.getString("update_user"));
            if (rs.getTimestamp("update_date") != null) {
                dto.setUpdateDate(rs.getTimestamp("update_date").toLocalDateTime());
            }
            return dto;
        });

        Long total = jdbcTemplate.queryForObject(countSql.toString(), params, Long.class);

        return new PageImpl<>(rows,
                PageRequest.of(queryDto.getPageNum(), queryDto.getPageSize()),
                total != null ? total : 0);
    }

    @Override
    public OrchestrationWorkflowDto publish(String userId, String workflowId, String versionId) {
        OrchestrationWorkflow workflow = repository.findById(workflowId)
                .orElseThrow(() -> new IllegalArgumentException("Workflow not found: " + workflowId));
        if (workflow.getCreateUser() != null && userId != null && !userId.equals(workflow.getCreateUser())) {
            throw new IllegalArgumentException("No permission to publish workflow: " + workflowId);
        }
        OrchestrationWorkflowVersion version = versionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Workflow version not found: " + versionId));
        if (!workflow.getId().equals(version.getWorkflowId())) {
            throw new IllegalArgumentException("Version does not belong to workflow");
        }
        workflow.setCurrentVersionId(version.getId());
        workflow.setStatus(OrchestrationWorkflow.WorkflowStatus.PUBLISHED);
        OrchestrationWorkflow updated = repository.save(workflow);
        return convertToDto(updated, true);
    }

    @Override
    public OrchestrationWorkflowVersionDto createVersion(String userId,
            OrchestrationWorkflowVersionCreateDto createDto) {
        OrchestrationWorkflow workflow = repository.findById(createDto.getWorkflowId())
                .orElseThrow(() -> new IllegalArgumentException("Workflow not found: " + createDto.getWorkflowId()));
        if (workflow.getCreateUser() != null && userId != null && !userId.equals(workflow.getCreateUser())) {
            throw new IllegalArgumentException("No permission to create version for workflow: " + workflow.getId());
        }
        Optional<OrchestrationWorkflowVersion> latestOpt = versionRepository
                .findFirstByWorkflowIdOrderByVersionNumberDesc(workflow.getId());
        int nextVersion = latestOpt.map(v -> v.getVersionNumber() + 1).orElse(1);
        OrchestrationWorkflowVersion version = new OrchestrationWorkflowVersion();
        version.setId(IdHelper.genUuid());
        version.setWorkflowId(workflow.getId());
        version.setVersionNumber(nextVersion);
        version.setDefinitionGraph(createDto.getDefinitionGraph());
        version.setRemark(createDto.getRemark());
        OrchestrationWorkflowVersion saved = versionRepository.save(version);
        return convertVersionToDto(saved);
    }

    @Override
    public OrchestrationWorkflowVersionDto updateVersion(String userId,
            OrchestrationWorkflowVersionUpdateDto updateDto) {
        OrchestrationWorkflowVersion version = versionRepository.findById(updateDto.getId())
                .orElseThrow(() -> new IllegalArgumentException("Workflow version not found: " + updateDto.getId()));
        OrchestrationWorkflow workflow = repository.findById(version.getWorkflowId())
                .orElseThrow(
                        () -> new IllegalStateException("Workflow not found for version: " + version.getWorkflowId()));
        if (workflow.getCreateUser() != null && userId != null && !userId.equals(workflow.getCreateUser())) {
            throw new IllegalArgumentException("No permission to update version: " + updateDto.getId());
        }
        version.setDefinitionGraph(updateDto.getDefinitionGraph());
        version.setRemark(updateDto.getRemark());
        OrchestrationWorkflowVersion saved = versionRepository.save(version);
        return convertVersionToDto(saved);
    }

    @Override
    public List<OrchestrationWorkflowVersionDto> listVersions(String userId, String workflowId) {
        OrchestrationWorkflow workflow = repository.findById(workflowId)
                .orElseThrow(() -> new IllegalArgumentException("Workflow not found: " + workflowId));
        if (workflow.getCreateUser() != null && userId != null && !userId.equals(workflow.getCreateUser())) {
            throw new IllegalArgumentException("No permission to view versions for workflow: " + workflowId);
        }
        List<OrchestrationWorkflowVersion> versions = versionRepository
                .findByWorkflowIdOrderByVersionNumberDesc(workflowId);
        return versions.stream().map(this::convertVersionToDto).collect(Collectors.toList());
    }

    @Override
    public OrchestrationWorkflowVersionDto getLatestVersion(String userId, String workflowId) {
        OrchestrationWorkflow workflow = repository.findById(workflowId)
                .orElseThrow(() -> new IllegalArgumentException("Workflow not found: " + workflowId));
        if (workflow.getCreateUser() != null && userId != null && !userId.equals(workflow.getCreateUser())) {
            throw new IllegalArgumentException("No permission to view versions for workflow: " + workflowId);
        }
        Optional<OrchestrationWorkflowVersion> latestOpt = versionRepository
                .findFirstByWorkflowIdOrderByVersionNumberDesc(workflowId);
        return latestOpt.map(this::convertVersionToDto).orElse(null);
    }

    @Autowired
    private com.ck.quiz.orchestration.engine.WorkflowEngine workflowEngine;

    @Override
    public OrchestrationInstanceDto start(String userId, String workflowId, OrchestrationStartRequest startRequest) {
        OrchestrationWorkflow workflow = repository.findById(workflowId)
                .orElseThrow(() -> new IllegalArgumentException("Workflow not found: " + workflowId));
        if (workflow.getCreateUser() != null && userId != null && !userId.equals(workflow.getCreateUser())) {
            throw new IllegalArgumentException("No permission to start workflow: " + workflowId);
        }
        String versionId = startRequest.getWorkflowVersionId();
        if (!StringUtils.hasText(versionId)) {
            versionId = workflow.getCurrentVersionId();
        }

        OrchestrationWorkflowVersion version = null;
        if (StringUtils.hasText(versionId)) {
            version = versionRepository.findById(versionId).orElse(null);
        }

        if (version == null) {
            Optional<OrchestrationWorkflowVersion> latestOpt = versionRepository
                    .findFirstByWorkflowIdOrderByVersionNumberDesc(workflowId);
            if (latestOpt.isPresent()) {
                version = latestOpt.get();
                versionId = version.getId();
            }
        }

        if (version == null) {
            throw new IllegalStateException("No version available for workflow: " + workflowId);
        }

        OrchestrationInstance instance = new OrchestrationInstance();
        instance.setId(IdHelper.genUuid());
        instance.setWorkflowId(workflowId);
        instance.setWorkflowVersionId(versionId);
        instance.setTriggerType(startRequest.getTriggerType());
        instance.setTriggerParams(startRequest.getTriggerParams());
        instance.setStatus(OrchestrationInstance.InstanceStatus.RUNNING);
        instance.setStartTime(LocalDateTime.now());
        OrchestrationInstance saved = instanceRepository.save(instance);

        try {
            Map<String, Object> inputs = new HashMap<>();
            if (StringUtils.hasText(startRequest.getTriggerParams())) {
                try {
                    inputs = new ObjectMapper().readValue(startRequest.getTriggerParams(), Map.class);
                } catch (Exception e) {
                    inputs.put("rawInput", startRequest.getTriggerParams());
                }
            }

            Map<String, Object> outputs = workflowEngine.execute(version.getDefinitionGraph(), inputs);

            if (outputs.containsKey("_error")) {
                saved.setStatus(OrchestrationInstance.InstanceStatus.FAILED);
                saved.setErrorSummary((String) outputs.get("_error"));
            } else {
                saved.setStatus(OrchestrationInstance.InstanceStatus.SUCCESS);
            }
            // In a real system, we'd store the output in a separate field or log
        } catch (Exception e) {
            saved.setStatus(OrchestrationInstance.InstanceStatus.FAILED);
            saved.setErrorSummary(e.getMessage());
        }

        saved.setEndTime(LocalDateTime.now());
        OrchestrationInstance finished = instanceRepository.save(saved);
        return convertInstanceToDto(finished);
    }

    @Override
    public Page<OrchestrationInstanceDto> searchInstances(String userId, OrchestrationInstanceQueryDto queryDto) {
        PageRequest pageRequest = PageRequest.of(queryDto.getPageNum(), queryDto.getPageSize());
        Page<OrchestrationInstance> page;
        if (queryDto.getWorkflowId() != null && !queryDto.getWorkflowId().isEmpty()) {
            OrchestrationWorkflow workflow = repository.findById(queryDto.getWorkflowId())
                    .orElseThrow(() -> new IllegalArgumentException("Workflow not found: " + queryDto.getWorkflowId()));
            if (workflow.getCreateUser() != null && userId != null && !userId.equals(workflow.getCreateUser())) {
                throw new IllegalArgumentException(
                        "No permission to view instances for workflow: " + queryDto.getWorkflowId());
            }
            if (queryDto.getStatus() != null) {
                page = instanceRepository.findByWorkflowIdAndStatus(queryDto.getWorkflowId(), queryDto.getStatus(),
                        pageRequest);
            } else {
                page = instanceRepository.findByWorkflowId(queryDto.getWorkflowId(), pageRequest);
            }
        } else {
            page = instanceRepository.findAll(pageRequest);
        }
        List<OrchestrationInstanceDto> dtos = page.getContent().stream()
                .map(this::convertInstanceToDto)
                .collect(Collectors.toList());
        return new PageImpl<>(dtos, pageRequest, page.getTotalElements());
    }

    private OrchestrationWorkflowVersionDto convertVersionToDto(OrchestrationWorkflowVersion version) {
        OrchestrationWorkflowVersionDto dto = new OrchestrationWorkflowVersionDto();
        BeanUtils.copyProperties(version, dto);
        return dto;
    }

    private OrchestrationInstanceDto convertInstanceToDto(OrchestrationInstance instance) {
        OrchestrationInstanceDto dto = new OrchestrationInstanceDto();
        BeanUtils.copyProperties(instance, dto);
        return dto;
    }
}
