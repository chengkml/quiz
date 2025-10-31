package com.ck.quiz.doc.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * 功能点树形结构DTO
 * 用于构建功能点的层级树结构
 */
@Data
public class FunctionPointTreeDto {

    /**
     * 功能点ID
     */
    private String id;

    /**
     * 文档ID
     */
    private String docId;

    /**
     * 父级功能点ID
     */
    private String parentId;

    private String parentName;

    private String processDetail;

    /**
     * 功能点名称
     */
    private String name;

    /**
     * 功能点层级
     */
    private Integer level;

    /**
     * 功能点类型
     */
    private String type;

    /**
     * 业务描述
     */
    private String businessDesc;

    /**
     * 流程简介
     */
    private String processSummary;

    /**
     * 功能描述
     */
    private String functionDesc;

    /**
     * 排序号
     */
    private Integer orderNum;

    /**
     * 子功能点列表
     */
    private List<FunctionPointTreeDto> children = new ArrayList<>();
}