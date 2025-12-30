package com.ck.quiz.mermaids.service;

import com.ck.quiz.mermaids.dto.MermaidCategoryDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 服务接口：用于管理 Mermaid 分类。
 * 提供创建、更新、删除、查询单个分类以及分页查询分类列表的功能。
 */
public interface MermaidCategoryService {

    /**
     * 创建新的 Mermaid 分类。
     *
     * @param dto 分类数据传输对象
     * @return 创建后的分类数据
     */
    MermaidCategoryDTO create(MermaidCategoryDTO dto);

    /**
     * 更新指定 ID 的 Mermaid 分类。
     *
     * @param id 分类 ID
     * @param dto 分类数据传输对象
     * @return 更新后的分类数据
     */
    MermaidCategoryDTO update(String id, MermaidCategoryDTO dto);

    /**
     * 删除指定 ID 的 Mermaid 分类。
     *
     * @param id 分类 ID
     */
    void delete(String id);

    /**
     * 根据 ID 查询 Mermaid 分类。
     *
     * @param id 分类 ID
     * @return 分类数据传输对象
     */
    MermaidCategoryDTO findById(String id);

    /**
     * 分页查询 Mermaid 分类列表。
     *
     * @param pageable 分页参数
     * @return 分页后的分类数据列表
     */
    Page<MermaidCategoryDTO> list(Pageable pageable);
}
