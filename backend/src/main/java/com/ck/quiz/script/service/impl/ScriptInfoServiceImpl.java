package com.ck.quiz.script.service.impl;

import com.ck.quiz.cron.dto.JobDto;
import com.ck.quiz.cron.service.JobService;
import com.ck.quiz.script.dto.ScriptInfoCreateDto;
import com.ck.quiz.script.dto.ScriptInfoDto;
import com.ck.quiz.script.dto.ScriptInfoQueryDto;
import com.ck.quiz.script.dto.ScriptInfoUpdateDto;
import com.ck.quiz.script.entity.ScriptInfo;
import com.ck.quiz.script.entity.ScriptJob;
import com.ck.quiz.script.repository.ScriptInfoRepository;
import com.ck.quiz.script.repository.ScriptJobRepository;
import com.ck.quiz.script.service.ScriptInfoService;
import com.ck.quiz.utils.HumpHelper;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import com.ck.quiz.utils.SpringContextUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.sql.Timestamp;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 脚本信息Service实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScriptInfoServiceImpl implements ScriptInfoService {

    private final ScriptInfoRepository scriptInfoRepository;

    @Autowired
    private NamedParameterJdbcTemplate jt;

    @Autowired
    private JobService jobService;

    @Autowired
    private ScriptJobRepository jobRepo;

    @Override
    @Transactional
    public String createScriptInfo(ScriptInfoCreateDto createDto) {
        // 检查脚本编码是否已存在
        if (scriptInfoRepository.existsByScriptCode(createDto.getScriptCode())) {
            throw new RuntimeException("脚本编码已存在");
        }

        // 转换为实体类
        ScriptInfo entity = convertToEntity(createDto);
        entity.setId(IdHelper.genUuid());

        // 保存实体类
        entity = scriptInfoRepository.save(entity);
        return entity.getId();
    }

    @Override
    public ScriptInfoDto getScriptInfoById(String id) {
        ScriptInfo entity = scriptInfoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("脚本信息不存在"));
        return convertToDto(entity);
    }

    @Override
    public ScriptInfoDto getScriptInfoByCode(String scriptCode) {
        ScriptInfo entity = scriptInfoRepository.findByScriptCode(scriptCode)
                .orElseThrow(() -> new RuntimeException("脚本信息不存在"));
        return convertToDto(entity);
    }

    @Override
    public Page<ScriptInfoDto> queryScriptInfo(ScriptInfoQueryDto queryDto) {
        // 1. 构造基础SQL
        StringBuilder sql = new StringBuilder("SELECT s.*, u.user_name create_user_name FROM script_info s left join user u on u.user_id = s.create_user WHERE 1=1 ");
        StringBuilder countSql = new StringBuilder("SELECT COUNT(*) FROM script_info s WHERE 1=1 ");
        Map<String, Object> params = new HashMap<>();

        // 2. 拼接查询条件
        // 模糊查询：脚本编码 / 名称 / 类型
        JdbcQueryHelper.lowerLike("scriptName", queryDto.getScriptName(),
                " AND (LOWER(s.script_name) LIKE :scriptName or LOWER(s.script_code) LIKE :scriptName) ", params, jt, sql, countSql);
        JdbcQueryHelper.lowerLike("scriptType", queryDto.getScriptType(),
                " AND LOWER(s.script_type) LIKE :scriptType ", params, jt, sql, countSql);
        // 模糊查询：远程脚本
        JdbcQueryHelper.lowerLike("remoteScript", queryDto.getRemoteScript(),
                " AND LOWER(s.remote_script) LIKE :remoteScript ", params, jt, sql, countSql);

        // 精确匹配：状态
        JdbcQueryHelper.equals("state", queryDto.getState(),
                " AND s.state = :state ", params, sql, countSql);

        // 3. 排序（默认按创建时间倒序）
        JdbcQueryHelper.order("s.create_date", "desc", sql);

        // 4. 拼接分页SQL
        int pageNum = queryDto.getPageNum() == null ? 1 : queryDto.getPageNum();
        int pageSize = queryDto.getPageSize() == null ? 10 : queryDto.getPageSize();
        String pageSql = JdbcQueryHelper.getLimitSql(jt, sql.toString(), pageNum - 1, pageSize);

        // 5. 执行查询
        List<Map<String, Object>> rows = jt.queryForList(pageSql, params);

        // 6. 转换为DTO对象
        List<ScriptInfoDto> list = rows.stream().map(row -> {
            ScriptInfoDto dto = new ScriptInfoDto();
            dto.setId((String) row.get("id"));
            dto.setScriptCode((String) row.get("script_code"));
            dto.setScriptName((String) row.get("script_name"));
            dto.setRemoteScript((String) row.get("remote_script"));
            dto.setHost((String) row.get("host"));
            dto.setPort((Integer) row.get("port"));
            dto.setUsername((String) row.get("username"));
            dto.setPassword((String) row.get("password"));
            dto.setExecCmd((String) row.get("exec_cmd"));
            dto.setState((String) row.get("state"));
            dto.setCreateUser((String) row.get("create_user"));
            dto.setCreateUserName((String) row.get("create_user_name"));
            dto.setUpdateUser((String) row.get("update_user"));
            dto.setCreateDate(toLocalDateTime(row.get("create_date")));
            dto.setUpdateDate(toLocalDateTime(row.get("update_date")));
            return dto;
        }).collect(Collectors.toList());

        // 7. 查询总数并封装分页结果
        return JdbcQueryHelper.toPage(jt, countSql.toString(), params, list, pageNum - 1, pageSize);
    }

    /**
     * 时间类型安全转换工具
     */
    private LocalDateTime toLocalDateTime(Object value) {
        if (value instanceof Timestamp ts) {
            return ts.toLocalDateTime();
        } else if (value instanceof LocalDateTime ldt) {
            return ldt;
        }
        return null;
    }


    @Override
    @Transactional
    public void updateScriptInfo(ScriptInfoUpdateDto updateDto) {
        // 查询脚本信息是否存在
        ScriptInfo entity = scriptInfoRepository.findById(updateDto.getId())
                .orElseThrow(() -> new RuntimeException("脚本信息不存在"));

        // 复制属性（忽略null值）
        BeanUtils.copyProperties(updateDto, entity,
                "id", "scriptCode", "createDate", "createUser");

        // 如果更新状态，需要特殊处理
        if (StringUtils.hasText(updateDto.getState())) {
            entity.setState(ScriptInfo.State.valueOf(updateDto.getState()));
        }

        // 保存更新
        scriptInfoRepository.save(entity);
    }

    @Override
    @Transactional
    public void deleteScriptInfo(String id) {
        // 检查脚本是否存在
        if (!scriptInfoRepository.existsById(id)) {
            throw new RuntimeException("脚本信息不存在");
        }
        // 执行删除
        scriptInfoRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void batchDeleteScriptInfo(List<String> ids) {
        // 检查所有ID是否存在
        List<ScriptInfo> entities = scriptInfoRepository.findAllById(ids);
        if (entities.size() != ids.size()) {
            throw new RuntimeException("部分脚本信息不存在");
        }
        // 批量删除
        scriptInfoRepository.deleteAllById(ids);
    }

    @Override
    @Transactional
    public void updateScriptState(String id, String state) {
        ScriptInfo entity = scriptInfoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("脚本信息不存在"));
        entity.setState(ScriptInfo.State.valueOf(state));
        scriptInfoRepository.save(entity);
    }

    @Override
    public ScriptInfoDto convertToDto(ScriptInfo entity) {
        ScriptInfoDto dto = new ScriptInfoDto();
        BeanUtils.copyProperties(entity, dto);
        // 枚举类型需要特殊处理
        if (entity.getState() != null) {
            dto.setState(entity.getState().name());
        }
        return dto;
    }

    @Override
    public ScriptInfo convertToEntity(ScriptInfoCreateDto createDto) {
        ScriptInfo entity = new ScriptInfo();
        BeanUtils.copyProperties(createDto, entity);
        // 枚举类型需要特殊处理
        if (StringUtils.hasText(createDto.getState())) {
            entity.setState(ScriptInfo.State.valueOf(createDto.getState()));
        }
        return entity;
    }

    @Override
    @Transactional
    public void execScript(String id, String queueName) {
        ScriptInfo entity = scriptInfoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("脚本信息不存在"));
        JobDto jobDto = new JobDto();
        jobDto.setQueueName(queueName);
        jobDto.setPriority(999);
        Map<String, Object> taskParams = new HashMap<>();
        taskParams.put("cmd", entity.getExecCmd());
        if ("true".equals(entity.getRemoteScript())) {
            jobDto.setTaskClass("com.ck.quiz.cron.exec.RemoteScriptExecJob");
            taskParams.put("host", entity.getHost());
            taskParams.put("port", entity.getPort());
            taskParams.put("username", entity.getUsername());
            taskParams.put("password", entity.getPassword());
        } else {
            jobDto.setTaskClass("com.ck.quiz.cron.exec.LocalScriptExecJob");
        }
        ObjectMapper mapper = SpringContextUtil.getBean(ObjectMapper.class);
        String taskParamsStr;
        try {
            taskParamsStr = mapper.writeValueAsString(taskParams);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("任务参数转换失败", e);
        }
        // json转字符串
        jobDto.setTaskParams(taskParamsStr);
        ScriptJob scriptJob = new ScriptJob();
        scriptJob.setId(IdHelper.genUuid());
        scriptJob.setScriptId(id);
        try {
            scriptJob.setJobId(jobService.addJob(jobDto));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        jobRepo.save(scriptJob);
    }

    @Override
    public Page<Map<String, Object>> searchJobs(int offset, int limit, String scriptId, String state, String taskClass, String queueName, String triggerType, String startTimeLt, String startTimeGt, String taskId, String keyWord) {
        Map<String, Object> params = new HashMap<>();
        params.put("scriptId", scriptId);
        StringBuilder listSql = new StringBuilder("select j.*,q.queue_label from job j inner join script_job sj on sj.job_id = j.id left join job_queue q on j.queue_name = q.queue_name where sj.script_id = :scriptId ");
        StringBuilder countSql = new StringBuilder("select count(*) from job j inner join script_job sj on sj.job_id = j.id where sj.script_id = :scriptId ");

        // 状态过滤
        JdbcQueryHelper.equals("state", state, "and j.state = :state ", params, listSql, countSql);

        JdbcQueryHelper.equals("taskClass", taskClass, "and j.task_class = :taskClass ", params, listSql, countSql);

        JdbcQueryHelper.equals("queueName", queueName, "and j.queue_name = :queueName ", params, listSql, countSql);

        JdbcQueryHelper.equals("triggerType", triggerType, "and j.trigger_type = :triggerType ", params, listSql, countSql);

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        if (org.apache.commons.lang3.StringUtils.isNotBlank(startTimeLt) && org.apache.commons.lang3.StringUtils.isNotBlank(startTimeGt)) {
            try {
                JdbcQueryHelper.datetimeBetween("j.start_time", "startTimeGt", sdf.parse(startTimeGt), "startTimeLt", sdf.parse(startTimeLt), params, jt, listSql, countSql);
            } catch (ParseException e) {
                log.error("日期转换异常：{}", ExceptionUtils.getStackTrace(e));
            }
        }

        // 任务ID过滤
        JdbcQueryHelper.equals("taskId", taskId, "and j.task_id = :taskId ", params, listSql, countSql);

        // 关键字搜索
        JdbcQueryHelper.lowerLike("keyWord", keyWord, "and lower(j.id) like :keyWord ", params, jt, listSql, countSql);

        // 排序
        listSql.append(" order by j.create_time desc ");

        // 分页
        int pageSize = limit;
        int pageNum = offset / pageSize;
        String limitSql = JdbcQueryHelper.getLimitSql(jt, listSql.toString(), pageNum, pageSize);

        // 查询数据
        List<Map<String, Object>> rows = HumpHelper.lineToHump(jt.queryForList(limitSql, params));
        if (!rows.isEmpty()) {
            Map<String, String> jobLabelMap = jobService.getJobLabelMap();
            rows.forEach(row -> {
                String jobLabel = jobLabelMap.get(MapUtils.getString(row, "taskClass"));
                row.put("jobLabel", jobLabel);
            });
        }

        return JdbcQueryHelper.toPage(jt, countSql.toString(), params, rows, pageNum, pageSize);
    }

}