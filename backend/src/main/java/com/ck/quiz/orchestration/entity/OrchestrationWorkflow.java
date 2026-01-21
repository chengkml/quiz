package com.ck.quiz.orchestration.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(
        name = "orch_workflow",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_orch_workflow_code_user", columnNames = {"code", "create_user"})
        },
        indexes = {
                @Index(name = "idx_orch_workflow_code", columnList = "code"),
                @Index(name = "idx_orch_workflow_name", columnList = "name"),
                @Index(name = "idx_orch_workflow_status", columnList = "status"),
                @Index(name = "idx_orch_workflow_create_date", columnList = "create_date")
        }
)
@Data
@EqualsAndHashCode(callSuper = true)
public class OrchestrationWorkflow extends Model {

    @Column(name = "code", length = 64, nullable = false)
    private String code;

    @Column(name = "name", length = 255, nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "biz_domain", length = 128)
    private String bizDomain;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 32, nullable = false)
    private WorkflowStatus status = WorkflowStatus.DRAFT;

    @Column(name = "current_version_id", length = 32)
    private String currentVersionId;

    public enum WorkflowStatus {
        DRAFT,
        PENDING,
        PUBLISHED,
        DISABLED
    }
}

