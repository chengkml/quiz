package com.ck.quiz.doc.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 功能点查询DTO
 * 用于分页查询文档功能点
 */
@Data
public class FunctionPointQueryDto {

    /**
     * 文档ID
     */
    @NotBlank(message = "文档ID不能为空")
    @Schema(description = "文档ID", requiredMode = Schema.RequiredMode.REQUIRED)
    private String docId;

    /**
     * 功能点名称（模糊搜索）
     */
    @Schema(description = "功能点名称（模糊搜索）")
    private String name;

    /**
     * 父功能点ID
     */
    @Schema(description = "父功能点ID，用于过滤指定父功能点下的子功能点")
    private String parentId;

    /**
     * 页码（从0开始）
     */
    @Min(value = 0, message = "页码不能小于0")
    @Schema(description = "页码，从0开始", example = "0", defaultValue = "0")
    private int pageNum = 0;

    /**
     * 每页数量
     */
    @Min(value = 1, message = "每页数量不能小于1")
    @Schema(description = "每页数量", example = "10", defaultValue = "10")
    private int pageSize = 10;
}