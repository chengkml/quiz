package com.ck.quiz.doc.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;

/**
 * 文档信息实体类
 * 用于存储 Word 文档的基本信息
 */
@Entity
@Table(
        name = "doc_info",
        indexes = {
                @Index(name = "idx_doc_info_file_name", columnList = "file_name"),
                @Index(name = "idx_doc_info_upload_user", columnList = "upload_user"),
                @Index(name = "idx_doc_info_upload_time", columnList = "upload_time")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocInfo {

    @Id
    @Column(name = "doc_id", length = 32, nullable = false)
    private String id;

    /**
     * 文件名（不含路径）
     */
    @Column(name = "file_name", length = 255, nullable = false)
    private String fileName;

    /**
     * 文件路径（相对或绝对路径）
     */
    @Column(name = "file_path", length = 500)
    private String filePath;

    /**
     * 文件唯一标识（MD5 值）
     */
    @Column(name = "file_md5", length = 64, unique = true)
    private String fileMd5;

    /**
     * 上传用户
     */
    @Column(name = "upload_user", length = 64)
    private String uploadUser;

    /**
     * 上传时间
     */
    @Column(name = "upload_time")
    private LocalDateTime uploadTime;

    /**
     * 备注
     */
    @Column(name = "remark", length = 500)
    private String remark;

    /**
     * 创建时间
     */
    @Column(name = "create_date", updatable = false)
    private LocalDateTime createDate;

    /**
     * 创建用户
     */
    @Column(name = "create_user", length = 64, updatable = false)
    private String createUser;

    /**
     * 修改时间
     */
    @Column(name = "update_date")
    private LocalDateTime updateDate;

    /**
     * 修改用户
     */
    @Column(name = "update_user", length = 64)
    private String updateUser;

    @PrePersist
    public void prePersist() {
        this.createDate = LocalDateTime.now();
        this.uploadTime = LocalDateTime.now();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            this.createUser = authentication.getName();
            this.uploadUser = this.uploadUser == null ? authentication.getName() : this.uploadUser;
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
