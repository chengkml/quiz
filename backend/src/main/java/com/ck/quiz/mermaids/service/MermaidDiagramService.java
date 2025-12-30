package com.ck.quiz.mermaids.service;

import com.ck.quiz.mermaids.dto.MermaidDiagramDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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
     * @param id 思维图 ID
     * @param dto 思维图数据传输对象
     * @return 更新后的思维图数据
     */
    MermaidDiagramDTO update(String id, MermaidDiagramDTO dto);

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
     * @param keyword 查询关键字
     * @param pageable 分页参数
     * @return 分页后的思维图数据列表
     */
    Page<MermaidDiagramDTO> list(String keyword, String categoryId, Pageable pageable);
}
