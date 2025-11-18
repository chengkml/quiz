package com.ck.quiz.script.service;

import com.ck.quiz.cron.dto.JobDto;
import com.ck.quiz.script.dto.ScriptInfoCreateDto;
import com.ck.quiz.script.dto.ScriptInfoDto;
import com.ck.quiz.script.dto.ScriptInfoQueryDto;
import com.ck.quiz.script.dto.ScriptInfoUpdateDto;
import com.ck.quiz.script.entity.ScriptInfo;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Map;

/**
 * 脚本信息Service
 */
public interface ScriptInfoService {

    /**
     * 创建脚本信息
     *
     * @param createDto 创建DTO
     * @return 创建的脚本信息ID
     */
    String createScriptInfo(ScriptInfoCreateDto createDto);

    /**
     * 根据ID查询脚本信息
     *
     * @param id 脚本信息ID
     * @return 脚本信息DTO
     */
    ScriptInfoDto getScriptInfoById(String id);

    /**
     * 根据脚本编码查询脚本信息
     *
     * @param scriptCode 脚本编码
     * @return 脚本信息DTO
     */
    ScriptInfoDto getScriptInfoByCode(String scriptCode);

    /**
     * 查询脚本信息列表
     *
     * @param queryDto 查询DTO
     * @return 分页结果
     */
    Page<ScriptInfoDto> queryScriptInfo(ScriptInfoQueryDto queryDto);

    /**
     * 更新脚本信息
     *
     * @param updateDto 更新DTO
     */
    void updateScriptInfo(ScriptInfoUpdateDto updateDto);

    /**
     * 删除脚本信息
     *
     * @param id 脚本信息ID
     */
    void deleteScriptInfo(String id);

    /**
     * 批量删除脚本信息
     *
     * @param ids 脚本信息ID列表
     */
    void batchDeleteScriptInfo(List<String> ids);

    /**
     * 启用/禁用脚本
     *
     * @param id    脚本信息ID
     * @param state 状态
     */
    void updateScriptState(String id, String state);

    /**
     * 将实体类转换为DTO
     *
     * @param entity 实体类
     * @return DTO
     */
    ScriptInfoDto convertToDto(ScriptInfo entity);

    /**
     * 将DTO转换为实体类
     *
     * @param createDto 创建DTO
     * @return 实体类
     */
    ScriptInfo convertToEntity(ScriptInfoCreateDto createDto);

    void execScript(String id, String queueId);

    Page<Map<String, Object>> searchJobs(int offset, int limit, String scriptId, String state, String taskClass, String queueName, String triggerType, String startTimeLt, String startTimeGt, String taskId, String keyWord);

    void deleteJob(String jobId);
}