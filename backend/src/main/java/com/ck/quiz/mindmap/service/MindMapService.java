package com.ck.quiz.mindmap.service;

import com.ck.quiz.mindmap.dto.*;
import com.ck.quiz.mindmap.entity.MindMap;
import org.springframework.data.domain.Page;

/**
 * 思维导图管理服务接口
 * <p>
 * 定义了思维导图相关的核心业务操作，包括增删改查、分页查询等。
 * 实现类通常会调用数据库访问层（Repository）来完成具体逻辑。
 */
public interface MindMapService {

    /**
     * 创建思维导图
     *
     * @param mindMapCreateDto 思维导图创建信息（包含名称、描述、数据等）
     * @return 创建成功后的思维导图信息
     */
    MindMapDto createMindMap(MindMapCreateDto mindMapCreateDto);

    /**
     * 更新思维导图基本信息
     *
     * @param mindMapBasicInfoUpdateDto 思维导图基本信息更新DTO
     * @return 更新后的思维导图信息
     */
    MindMapDto updateMindMapBasicInfo(MindMapBasicInfoUpdateDto mindMapBasicInfoUpdateDto);

    /**
     * 更新思维导图数据
     *
     * @param mindMapDataUpdateDto 思维导图数据更新DTO
     * @return 更新后的思维导图信息
     */
    MindMapDto updateMindMapData(MindMapDataUpdateDto mindMapDataUpdateDto);

    /**
     * 更新思维导图（旧接口，为了向后兼容保留）
     *
     * @param mindMapUpdateDto 思维导图更新信息
     * @return 更新后的思维导图信息
     */
    @Deprecated
    MindMapDto updateMindMap(MindMapUpdateDto mindMapUpdateDto);

    /**
     * 删除思维导图
     *
     * @param mindMapId 思维导图ID
     * @return 被删除的思维导图信息（可用于前端回显或确认）
     */
    MindMapDto deleteMindMap(String mindMapId);

    /**
     * 根据ID获取思维导图信息
     *
     * @param mindMapId 思维导图ID
     * @return 对应的思维导图信息，如果不存在可返回 null 或抛异常
     */
    MindMapDto getMindMapById(String mindMapId);

    /**
     * 分页查询思维导图列表
     *
     * @param queryDto 查询条件（支持名称模糊查询、是否共享、分页参数等）
     * @return 分页封装的思维导图列表
     */
    Page<MindMapDto> searchMindMaps(MindMapQueryDto queryDto);

    /**
     * 将实体类对象转换为传输对象
     *
     * @param mindMap 思维导图实体对象
     * @return 思维导图DTO
     */
    MindMapDto convertToDto(MindMap mindMap);
}