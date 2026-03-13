package com.ck.quiz.project.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

@Data
@Entity
@Comment("需求生命周期日志")
@EqualsAndHashCode(callSuper = true)
@Table(name = "project_requirement_log", indexes = {
        @Index(name = "idx_requirement_log_requirement", columnList = "requirement_id"),
        @Index(name = "idx_requirement_log_create_date", columnList = "create_date")
})
public class RequirementLifecycleLog extends Model {

    @Column(name = "requirement_id", length = 32, nullable = false)
    @Comment("需求ID")
    private String requirementId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", length = 30, nullable = false)
    @Comment("事件类型")
    private EventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 30)
    @Comment("变更前状态")
    private Requirement.Status fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", length = 30)
    @Comment("变更后状态")
    private Requirement.Status toStatus;

    @Column(name = "before_descr", columnDefinition = "TEXT")
    @Comment("变更前描述")
    private String beforeDescr;

    @Column(name = "after_descr", columnDefinition = "TEXT")
    @Comment("变更后描述")
    private String afterDescr;

    @Column(name = "remark", columnDefinition = "TEXT")
    @Comment("备注")
    private String remark;

    public enum EventType {
        CREATE,
        EDIT,
        STATUS_CHANGE,
        ANALYZE,
        REVIEW
    }
}
