package com.ck.quiz.file.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

@Data
@Entity
@Table(name = "file_metadata")
@EqualsAndHashCode(callSuper = true)
public class FileMetadata extends Model {

    @Column(length = 255, nullable = false)
    @Comment("原始文件名")
    private String originalName;

    @Column(length = 512, nullable = false)
    @Comment("存储路径")
    private String storagePath;

    @Column(length = 50)
    @Comment("存储类型: LOCAL, SFTP, S3")
    private String storageType;

    @Column(length = 100)
    @Comment("文件类型(MIME)")
    private String contentType;

    @Column(length = 20)
    @Comment("文件后缀")
    private String extension;

    @Comment("文件大小(字节)")
    private Long size;

    @Column(nullable = false)
    @Comment("是否文件夹")
    private Boolean isFolder = false;

}
