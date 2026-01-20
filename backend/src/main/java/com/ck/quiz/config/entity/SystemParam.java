package com.ck.quiz.config.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

@Data
@Entity
@Comment("系统参数表")
@EqualsAndHashCode(callSuper = true)
@Table(
        name = "system_param",
        indexes = {
                @Index(name = "idx_system_param_category", columnList = "category"),
                @Index(name = "idx_system_param_status", columnList = "status")
        }
)
public class SystemParam extends Model {

    @Column(length = 200, nullable = false)
    @Comment("参数名称")
    private String paramName;

    @Column(columnDefinition = "TEXT")
    @Comment("参数值")
    private String paramValue;

    @Column(columnDefinition = "TEXT")
    @Comment("默认值")
    private String defaultValue;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Comment("参数类型")
    private ParamType paramType = ParamType.STRING;

    @Column(length = 100)
    @Comment("参数分类")
    private String category;

    @Column(length = 500)
    @Comment("参数描述")
    private String description;

    @Column(nullable = false)
    @Comment("是否加密存储")
    private Boolean isEncrypted = false;

    @Column(nullable = false)
    @Comment("是否只读")
    private Boolean isReadonly = false;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Comment("状态")
    private ParamStatus status = ParamStatus.ACTIVE;

    @Column
    @Comment("排序号")
    private Integer sortOrder;

    /**
     * 参数类型枚举
     */
    public enum ParamType {
        STRING,
        NUMBER,
        BOOLEAN,
        JSON,
        LIST
    }

    /**
     * 参数状态枚举
     */
    public enum ParamStatus {
        ACTIVE,
        INACTIVE
    }
}
