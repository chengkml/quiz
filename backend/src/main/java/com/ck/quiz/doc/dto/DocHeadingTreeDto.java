package com.ck.quiz.doc.dto;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

/**
 * 文档标题树节点DTO
 * 用于表示文档标题的层级结构
 */
@Data
public class DocHeadingTreeDto {
    
    /**
     * 标题ID
     */
    private String id;
    
    /**
     * 标题内容
     */
    private String headingText;
    
    /**
     * 标题层级
     */
    private Integer headingLevel;
    
    /**
     * 父标题ID
     */
    private String parentId;
    
    /**
     * 标题顺序号
     */
    private Integer orderNo;
    
    /**
     * 所在页码
     */
    private Integer pageNumber;
    
    /**
     * Word样式名称
     */
    private String styleName;
    
    /**
     * 子标题列表
     */
    private List<DocHeadingTreeDto> children = new ArrayList<>();
}