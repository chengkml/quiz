package com.ck.quiz.doc.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;

/**
 * 文档标题信息实体类
 * 用于存储 Word 文档中的标题层级、顺序及样式等信息
 */
@Entity
@Table(
        name = "doc_heading",
        indexes = {
                @Index(name = "idx_doc_heading_doc_id", columnList = "doc_id"),
                @Index(name = "idx_doc_heading_level", columnList = "heading_level"),
                @Index(name = "idx_doc_heading_order_no", columnList = "order_no")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocHeading {

    @Id
    @Column(name = "heading_id", length = 32, nullable = false)
    private String id;

    /**
     * 所属文档 ID
     */
    @Column(name = "doc_id", length = 32, nullable = false)
    private String docId;

    /**
     * 标题内容
     */
    @Column(name = "heading_text", length = 1000, nullable = false)
    private String headingText;

    /**
     * 标题层级（1=一级标题，2=二级标题...）
     */
    @Column(name = "heading_level", nullable = false)
    private Integer headingLevel;

    /**
     * 父标题 ID（顶级标题为 null）
     */
    @Column(name = "parent_id", length = 32)
    private String parentId;

    /**
     * 标题顺序号（按文档中出现顺序）
     */
    @Column(name = "order_no", nullable = false)
    private Integer orderNo;

    /**
     * 所在页码
     */
    @Column(name = "page_number")
    private Integer pageNumber;

    /**
     * Word 样式名称（例如：Heading 1, Heading 2）
     */
    @Column(name = "style_name", length = 100)
    private String styleName;

    @Column(name = "create_date", updatable = false)
    private LocalDateTime createDate;

    @Column(name = "create_user", length = 64, updatable = false)
    private String createUser;

    @Column(name = "update_date")
    private LocalDateTime updateDate;

    @Column(name = "update_user", length = 64)
    private String updateUser;

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
