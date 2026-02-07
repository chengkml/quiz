package com.ck.quiz.tokenusage.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;
import com.ck.quiz.base.entity.Model;

@Data
@Entity
@Comment("Token使用记录表")
@EqualsAndHashCode(callSuper = true)
@Table(name = "token_usage", indexes = {
        @Index(name = "idx_model_name", columnList = "model_name"),
        @Index(name = "idx_create_user", columnList = "create_user"),
        @Index(name = "idx_create_date", columnList = "create_date"),
        @Index(name = "idx_business_type", columnList = "business_type")
})
public class TokenUsage extends Model {

    @Column(name = "model_name", length = 100, nullable = false)
    @Comment("模型名称")
    private String modelName;

    @Column(name = "model_provider", length = 50)
    @Comment("模型提供商")
    private String modelProvider;

    @Column(name = "prompt_tokens", nullable = false)
    @Comment("输入token数")
    private Integer promptTokens;

    @Column(name = "completion_tokens", nullable = false)
    @Comment("输出token数")
    private Integer completionTokens;

    @Column(name = "total_tokens", nullable = false)
    @Comment("总token数")
    private Integer totalTokens;

    @Column(name = "input_cost")
    @Comment("输入成本")
    private Double inputCost;

    @Column(name = "output_cost")
    @Comment("输出成本")
    private Double outputCost;

    @Column(name = "total_cost")
    @Comment("总成本")
    private Double totalCost;

    @Column(name = "business_type", length = 50)
    @Comment("业务类型：CHAT-聊天, QUESTION-题目生成, OCR-图片识别, KNOWLEDGE-知识点, DATASOURCE-数据源, FUNCDOC-文档, MINDMAP-思维导图, MERMAID-流程图, CALENDAR-日历")
    private String businessType;

    @Column(name = "business_id", length = 64)
    @Comment("业务ID")
    private String businessId;

    @Column(name = "session_id", length = 64)
    @Comment("会话ID（如果是聊天场景）")
    private String sessionId;

    @Column(name = "request_content", columnDefinition = "TEXT")
    @Comment("请求内容")
    private String requestContent;

    @Column(name = "response_content", columnDefinition = "TEXT")
    @Comment("响应内容")
    private String responseContent;

    @Column(name = "error_flag")
    @Comment("是否发生错误")
    private Boolean errorFlag = false;

    @Column(name = "error_message", columnDefinition = "TEXT")
    @Comment("错误信息")
    private String errorMessage;
}
