package com.ck.quiz.orchestration.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(
        name = "orch_workflow_version",
        indexes = {
                @Index(name = "idx_orch_wf_ver_workflow", columnList = "workflow_id"),
                @Index(name = "idx_orch_wf_ver_number", columnList = "version_number"),
                @Index(name = "idx_orch_wf_ver_create_date", columnList = "create_date")
        }
)
@Data
@EqualsAndHashCode(callSuper = true)
public class OrchestrationWorkflowVersion extends Model {

    @Column(name = "workflow_id", length = 32, nullable = false)
    private String workflowId;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Lob
    @Column(name = "definition_graph", columnDefinition = "TEXT")
    private String definitionGraph;

    @Lob
    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;
}

