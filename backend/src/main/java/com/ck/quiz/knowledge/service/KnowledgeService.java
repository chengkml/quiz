package com.ck.quiz.knowledge.service;

import com.ck.quiz.knowledge.dto.KnowledgeCreateDto;
import com.ck.quiz.knowledge.dto.KnowledgeDto;
import com.ck.quiz.knowledge.dto.KnowledgeQueryDto;
import com.ck.quiz.knowledge.dto.KnowledgeUpdateDto;
import com.ck.quiz.knowledge.entity.Knowledge;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 知识点服务接口
 * 定义知识点管理的核心业务操作
 */
public interface KnowledgeService {

    /**
     * 创建新知识点
     *
     * @param createDto 知识点创建信息
     * @return 创建的知识点信息
     */
    KnowledgeDto createKnowledge(KnowledgeCreateDto createDto);

    /**
     * 更新知识点信息
     *
     * @param updateDto 知识点更新信息
     * @return 更新后的知识点信息
     */
    KnowledgeDto updateKnowledge(KnowledgeUpdateDto updateDto);

    /**
     * 删除知识点
     *
     * @param id 知识点ID
     */
    void deleteKnowledge(String id);

    /**
     * 根据ID获取知识点信息
     *
     * @param id 知识点ID
     * @return 知识点信息
     */
    KnowledgeDto getKnowledgeById(String id);

    /**
     * 根据名称获取知识点信息
     *
     * @param name 知识点名称
     * @return 知识点信息
     */
    KnowledgeDto getKnowledgeByName(String name);

    /**
     * 分页查询知识点
     *
     * @param queryDto 查询条件
     * @return 分页知识点列表
     */
    Page<KnowledgeDto> searchKnowledge(KnowledgeQueryDto queryDto);

    /**
     * 检查知识点名称是否存在
     *
     * @param name 知识点名称
     * @param excludeId 排除的知识点ID（用于更新时检查）
     * @return 是否存在
     */
    boolean checkKnowledgeNameExists(String name, String excludeId);

    /**
     * 将知识点实体转换为DTO
     *
     * @param knowledge 知识点实体
     * @return 知识点DTO
     */
    KnowledgeDto convertToDto(Knowledge knowledge);

}