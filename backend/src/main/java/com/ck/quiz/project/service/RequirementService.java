package com.ck.quiz.project.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.project.dto.RequirementCreateDto;
import com.ck.quiz.project.dto.RequirementDto;
import com.ck.quiz.project.dto.RequirementHistoryOptionsDto;
import com.ck.quiz.project.dto.RequirementQueryDto;
import com.ck.quiz.project.dto.RequirementUpdateDto;
import com.ck.quiz.project.entity.Requirement;

public interface RequirementService extends BaseService<RequirementCreateDto, RequirementUpdateDto, RequirementQueryDto, RequirementDto, Requirement> {

    /**
     * 获取待处理的需求 (OpenClaw专用)
     * @return 待处理的需求DTO，如果没有则返回null
     */
    RequirementDto getPendingRequirement();

    /**
     * 更新需求状态 (OpenClaw专用)
     * @param id 需求ID
     * @param status 新状态
     * @param resultMsg 结果信息
     * @param progressPercent 进度百分比(0-100)
     */
    void updateStatus(String id, String status, String resultMsg, Integer progressPercent);

    /**
     * 获取历史输入选项
     * @param userId 当前用户ID
     * @return 历史选项
     */
    RequirementHistoryOptionsDto getHistoryOptions(String userId);
}
