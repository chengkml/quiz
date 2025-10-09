package com.ck.quiz.question.entity;

import com.ck.quiz.knowledge.entity.Knowledge;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 题目信息实体类
 */
@Entity
@Table(
        name = "question",
        indexes = {
                @Index(name = "idx_question_type", columnList = "type"),
                @Index(name = "idx_question_difficulty", columnList = "difficulty_level"),
                @Index(name = "idx_question_create_date", columnList = "create_date")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Question {

    @Id
    @Column(name = "question_id", length = 32, nullable = false)
    private String id;

    /**
     * 题目类型：single, multiple, blank, short_answer
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 20, nullable = false)
    private QuestionType type;

    /**
     * 题干
     */
    @Lob
    @Column(name = "content", nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    /**
     * 选项（JSON 格式存储）
     * <p>
     * 示例：
     * 单选题(SINGLE)：
     * {
     * "A": "物理层",
     * "B": "数据链路层",
     * "C": "网络层",
     * "D": "传输层"
     * }
     * <p>
     * 多选题(MULTIPLE)：
     * {
     * "A": "交换机",
     * "B": "路由器",
     * "C": "集线器",
     * "D": "网桥"
     * }
     * <p>
     * 填空题(BLANK)：
     * {
     * "blanks": 2
     * }
     * <p>
     * 简答题(SHORT_ANSWER)：
     * {}
     */
    @Lob
    @Column(name = "options", columnDefinition = "LONGTEXT")
    private String options;

    /**
     * 标准答案（JSON 格式存储）
     * <p>
     * 示例：
     * 单选题(SINGLE)：
     * ["A"]
     * <p>
     * 多选题(MULTIPLE)：
     * ["A", "C", "D"]
     * <p>
     * 填空题(BLANK)：
     * ["OSI七层模型", "物理层"]
     * <p>
     * 简答题(SHORT_ANSWER)：
     * ["物理层负责比特流的传输，常见设备有中继器、集线器、网桥等。"]
     */
    @Lob
    @Column(name = "answer", columnDefinition = "LONGTEXT")
    private String answer;

    /**
     * 解析
     */
    @Lob
    @Column(name = "explanation", columnDefinition = "LONGTEXT")
    private String explanation;

    /**
     * 难度等级 1-5
     */
    @Column(name = "difficulty_level")
    private Integer difficultyLevel = 1;

    /**
     * 创建时间
     */
    @Column(name = "create_date", updatable = false)
    private LocalDateTime createDate;

    /**
     * 创建人
     */
    @Column(name = "create_user", length = 64, updatable = false)
    private String createUser;

    /**
     * 更新时间
     */
    @Column(name = "update_date")
    private LocalDateTime updateDate;

    /**
     * 更新人
     */
    @Column(name = "update_user", length = 64)
    private String updateUser;

    @ManyToMany
    @JoinTable(
            name = "question_knowledge_rela",
            joinColumns = @JoinColumn(name = "question_id"),
            inverseJoinColumns = @JoinColumn(name = "knowledge_id")
    )
    private List<Knowledge> knowledgePoints = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        this.createDate = LocalDateTime.now();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            this.createUser = authentication.getName();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updateDate = LocalDateTime.now();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            this.updateUser = authentication.getName();
        }
    }

    public enum QuestionType {
        SINGLE,
        MULTIPLE,
        BLANK,
        SHORT_ANSWER
    }
}

