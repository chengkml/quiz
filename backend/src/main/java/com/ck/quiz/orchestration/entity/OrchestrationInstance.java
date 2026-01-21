package com.ck.quiz.orchestration.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "orch_workflow_instance",
        indexes = {
                @Index(name = "idx_orch_inst_workflow", columnList = "workflow_id"),
                @Index(name = "idx_orch_inst_status", columnList = "status"),
                @Index(name = "idx_orch_inst_start_time", columnList = "start_time")
        }
)
@Data
@EqualsAndHashCode(callSuper = true)
public class OrchestrationInstance extends Model {

    @Column(name = "workflow_id", length = 32, nullable = false)
    private String workflowId;

    @Column(name = "workflow_version_id", length = 32, nullable = false)
    private String workflowVersionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 32, nullable = false)
    private InstanceStatus status = InstanceStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", length = 32, nullable = false)
    private TriggerType triggerType;

    @Column(name = "trigger_params", columnDefinition = "TEXT")
    private String triggerParams;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "error_summary", columnDefinition = "TEXT")
    private String errorSummary;

    public enum InstanceStatus {
        PENDING,
        RUNNING,
        SUCCESS,
        FAILED
    }

    public enum TriggerType {
        MANUAL,
        API,
        SCHEDULE,
        EVENT
    }
}

