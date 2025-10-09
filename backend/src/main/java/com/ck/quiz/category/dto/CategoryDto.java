package com.ck.quiz.category.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 分类信息 DTO（Data Transfer Object）
 * 用于在服务层与前端或其他系统交互时传输分类详细信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDto {

    /**
     * 分类唯一标识
     */
    private String id;

    /**
     * 分类名称
     */
    private String name;

    /**
     * 父分类ID（顶级分类为null）
     */
    private String parentId;

    /**
     * 父分类名称
     */
    private String parentName;

    /**
     * 所属学科ID
     */
    private String subjectId;

    /**
     * 所属学科名称
     */
    private String subjectName;

    /**
     * 分类层级（1=学科下一级，2=章节，3=知识点）
     */
    private Integer level;

    /**
     * 分类描述信息
     */
    private String description;

    /**
     * 分类创建时间
     */
    private LocalDateTime createDate;

    /**
     * 创建该分类的用户ID
     */
    private String createUser;

    /**
     * 创建该分类的用户中文名
     */
    private String createUserName;

    /**
     * 分类最后更新时间
     */
    private LocalDateTime updateDate;

    /**
     * 最后更新该分类的用户ID
     */
    private String updateUser;

    /**
     * 最后更新该分类的用户名
     */
    private String updateUserName;

    private List<CategoryDto> children;
}