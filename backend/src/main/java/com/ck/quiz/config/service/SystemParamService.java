package com.ck.quiz.config.service;

import com.ck.quiz.config.dto.SystemParamCreateDto;
import com.ck.quiz.config.dto.SystemParamDto;
import com.ck.quiz.config.dto.SystemParamQueryDto;
import com.ck.quiz.config.dto.SystemParamUpdateDto;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 系统参数服务接口
 */
public interface SystemParamService {

    /**
     * 创建参数
     */
    SystemParamDto createParam(SystemParamCreateDto createDto);

    /**
     * 更新参数
     */
    SystemParamDto updateParam(SystemParamUpdateDto updateDto);

    /**
     * 删除参数
     */
    void deleteParam(String id);

    /**
     * 根据ID查询参数
     */
    SystemParamDto getParamById(String id);

    /**
     * 根据参数名查询参数
     */
    SystemParamDto getParamByName(String paramName);

    /**
     * 分页查询参数
     */
    Page<SystemParamDto> searchParams(SystemParamQueryDto queryDto);

    /**
     * 根据分类查询所有参数
     */
    List<SystemParamDto> getParamsByCategory(String category);

    /**
     * 批量更新参数值
     */
    void batchUpdateParams(List<SystemParamUpdateDto> updateDtos);

    /**
     * 重置参数为默认值
     */
    SystemParamDto resetParamToDefault(String id);
}
