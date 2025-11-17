package com.ck.quiz.doc.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 文档信息 DTO（Data Transfer Object）
 * 用于在服务层与前端或其他系统交互时传输文档详细信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocInfoDto {

    /**
     * 文档唯一标识
     */
    private String id;

    /**
     * 文件名（不含路径）
     */
    private String fileName;

    /**
     * 文件路径（相对或绝对路径）
     */
    private String filePath;

    /**
     * 文件唯一标识（MD5 值）
     */
    private String fileMd5;

    /**
     * 上传用户
     */
    private String uploadUser;

    private String uploadUserName;

    /**
     * 上传时间
     */
    private LocalDateTime uploadTime;

    /**
     * 备注
     */
    private String remark;

    /**
     * 创建时间
     */
    private LocalDateTime createDate;

    /**
     * 创建用户
     */
    private String createUser;

    /**
     * 修改时间
     */
    private LocalDateTime updateDate;

    /**
     * 修改用户
     */
    private String updateUser;
}