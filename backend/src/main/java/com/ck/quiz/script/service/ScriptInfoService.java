package com.ck.quiz.script.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.script.dto.ScriptInfoCreateDto;
import com.ck.quiz.script.dto.ScriptInfoDto;
import com.ck.quiz.script.dto.ScriptInfoQueryDto;
import com.ck.quiz.script.dto.ScriptInfoUpdateDto;
import com.ck.quiz.script.entity.ScriptInfo;
import org.springframework.data.domain.Page;

import java.util.Map;

public interface ScriptInfoService extends BaseService<ScriptInfoCreateDto, ScriptInfoUpdateDto, ScriptInfoQueryDto, ScriptInfoDto, ScriptInfo> {

    ScriptInfoDto getScriptInfoByCode(String scriptCode);

    void execScript(String id, String queueId);

    Page<Map<String, Object>> searchJobs(int offset, int limit, String scriptId, String state, String taskClass, String queueName, String triggerType, String startTimeLt, String startTimeGt, String taskId, String keyWord);

    void deleteJob(String jobId);
}