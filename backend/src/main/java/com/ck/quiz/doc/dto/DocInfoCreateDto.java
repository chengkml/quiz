package com.ck.quiz.doc.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 文档创建 DTO
 * 用于创建新文档时的数据传输
 */
@Data
public class DocInfoCreateDto {

    /**
     * 文件名（不含路径）
     */
    @NotBlank(message = "文件名不能为空")
    private String fileName;

    /**
     * 文件路径（相对或绝对路径）
     */
    private String filePath;

    /**
     * 文件唯一标识（MD5 值）
     */
    @NotBlank(message = "文件MD5不能为空")
    private String fileMd5;

    /**
     * 备注
     */
    private String remark;
}