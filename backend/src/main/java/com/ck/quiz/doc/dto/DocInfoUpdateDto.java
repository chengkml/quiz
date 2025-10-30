package com.ck.quiz.doc.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 文档更新 DTO
 * 用于更新文档信息时的数据传输
 */
@Data
public class DocInfoUpdateDto {

    /**
     * 文档唯一标识
     */
    @NotBlank(message = "文档ID不能为空")
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
     * 备注
     */
    private String remark;
}