package com.ck.quiz.mermaids.service;

import com.ck.quiz.mermaids.dto.MermaidDiagramDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * 服务接口：用于管理 Mermaid 思维图。
 * 提供创建、更新、删除、查询单个思维图以及分页查询思维图列表的功能。
 */
public interface MermaidDiagramService {

    /**
     * 创建新的 Mermaid 思维图。
     *
     * @param dto 思维图数据传输对象
     * @return 创建后的思维图数据
     */
    MermaidDiagramDTO create(MermaidDiagramDTO dto);

    /**
     * 更新指定 ID 的 Mermaid 思维图。
     *
     * @param id  思维图 ID
     * @param dto 思维图数据传输对象
     * @return 更新后的思维图数据
     */
    MermaidDiagramDTO update(String id, MermaidDiagramDTO dto);

    /**
     * 仅更新 diagramData 字段
     * 
     * @param id          图表 ID
     * @param diagramData Mermaid 源码文本
     * @return 更新后的 DTO
     */
    MermaidDiagramDTO updateDiagramData(String id, String diagramData);

    /**
     * 流式生成 Mermaid 图文本（SSE）
     * 
     * @param advice      用户输入的生成描述
     * @param diagramData Mermaid 源码文本
     * @param modelName   可选模型名称
     * @return SseEmitter 用于流式推送结果
     */
    SseEmitter streamGenerateDiagram(String advice, String diagramData, String modelName);

    /**
     * 删除指定 ID 的 Mermaid 思维图。
     *
     * @param id 思维图 ID
     */
    void delete(String id);

    /**
     * 根据 ID 查询 Mermaid 思维图。
     *
     * @param id 思维图 ID
     * @return 思维图数据传输对象
     */
    MermaidDiagramDTO findById(String id);

    /**
     * 分页查询 Mermaid 思维图列表。
     *
     * @param keyword  查询关键字
     * @param pageable 分页参数
     * @return 分页后的思维图数据列表
     */
    /**
     * 分页查询
     * 
     * @param keyword  关键字
     * @param group    分组标识 (Group Name)
     * @param pageable 分页参数
     * @return 分页结果
     */
    Page<MermaidDiagramDTO> list(String keyword, String group, Pageable pageable);
}
