package com.ck.quiz.mcp.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

@Data
@Entity
@Comment("MCP工具")
@EqualsAndHashCode(callSuper = true)
@Table(name = "mcp_tool")
public class McpTool extends Model {

    @Column(length = 32, nullable = false)
    @Comment("服务器ID")
    private String serverId;

    @Column(length = 32, nullable = false)
    @Comment("环境")
    private String env;

    @Column(length = 128, nullable = false)
    @Comment("原始名称")
    private String originName;

    @Column(length = 256, nullable = false)
    @Comment("显示名称")
    private String displayName;

    @Column(length = 512)
    @Comment("工具描述")
    private String description;

    @Column(length = 64)
    @Comment("分类")
    private String category;

    @Column(length = 512)
    @Comment("标签")
    private String tags;

    @Column(length = 32, nullable = false)
    @Comment("状态")
    private String status = "REGISTERED";

    @Column(length = 8000)
    @Comment("Schema定义")
    private String schemaJson;

    @Column(length = 8000)
    @Comment("调用策略")
    private String strategyJson;

    @Column(length = 4000)
    @Comment("可见范围配置")
    private String visibilityJson;

    @Comment("来源已删除标记")
    private Boolean sourceDeletedFlag = Boolean.FALSE;
}
