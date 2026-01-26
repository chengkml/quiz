package com.ck.quiz.knowledge.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Comment("知识点信息实体")
@Table(
        name = "knowledge",
        indexes = {
                @Index(name = "idx_kp_name", columnList = "name"),
                @Index(name = "idx_kp_category_id", columnList = "category_id"),
                @Index(name = "idx_kp_subject_id", columnList = "subject_id"),
                @Index(name = "idx_kp_create_date", columnList = "create_date")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Knowledge {

    @Id
    @Comment("知识点ID")
    @Column(name = "knowledge_id", length = 32, nullable = false)
    private String id;

    @Comment("知识点名称")
    @Column(name = "name", length = 512, nullable = false)
    private String name;

    @Comment("所属分类ID")
    @Column(name = "category_id", length = 32, nullable = false)
    private String categoryId;

    @Comment("所属学科ID")
    @Column(name = "subject_id", length = 32, nullable = false)
    private String subjectId;

    @Comment("知识点内容(HTML)")
    @Column(columnDefinition = "TEXT")
    private String content;

    @Comment("创建时间")
    @Column(name = "create_date", updatable = false)
    private LocalDateTime createDate;

    @Comment("创建人")
    @Column(name = "create_user", length = 64, updatable = false)
    private String createUser;

    @Comment("更新时间")
    @Column(name = "update_date")
    private LocalDateTime updateDate;

    @Comment("更新人")
    @Column(name = "update_user", length = 64)
    private String updateUser;

    @ManyToMany(mappedBy = "knowledgePoints", fetch = FetchType.LAZY)
    private List<com.ck.quiz.question.entity.Question> questions = new ArrayList<>();

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
}
