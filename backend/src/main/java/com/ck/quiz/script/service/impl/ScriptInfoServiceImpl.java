package com.ck.quiz.script.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.script.dto.ScriptInfoCreateDto;
import com.ck.quiz.script.dto.ScriptInfoDto;
import com.ck.quiz.script.dto.ScriptInfoQueryDto;
import com.ck.quiz.script.dto.ScriptInfoUpdateDto;
import com.ck.quiz.script.entity.ScriptInfo;
import com.ck.quiz.script.entity.ScriptJob;
import com.ck.quiz.script.repository.ScriptInfoRepository;
import com.ck.quiz.script.repository.ScriptJobRepository;
import com.ck.quiz.script.service.ScriptInfoService;
import com.ck.quiz.utils.JdbcQueryHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@Transactional
public class ScriptInfoServiceImpl extends BaseServiceImpl<ScriptInfoCreateDto, ScriptInfoUpdateDto, ScriptInfoQueryDto, ScriptInfoDto, ScriptInfo, ScriptInfoRepository> implements ScriptInfoService {

    @Autowired
    private ScriptInfoRepository scriptInfoRepository;

    @Autowired
    private ScriptJobRepository jobRepo;

    @Override
    public Page<ScriptInfoDto> search(String userId, ScriptInfoQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "select s.* from script_info s where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from script_info s where 1=1 ");
        Map<String, Object> params = new HashMap<>();

        // 按名称/编码模糊查询
        JdbcQueryHelper.lowerLike("keyWord", queryDto.getKeyWord(),
                " and (lower(s.script_name) like :keyWord or lower(s.script_code) like :keyWord) ", params, namedParameterJdbcTemplate, sql, countSql);

        // 排序
        JdbcQueryHelper.order("create_date", "desc", sql);

        // 分页SQL
        String limitSql = JdbcQueryHelper.getLimitSql(
                namedParameterJdbcTemplate,
                sql.toString(),
                queryDto.getPageNum(),
                queryDto.getPageSize());

        // 查询数据
        java.util.List<ScriptInfoDto> scripts = namedParameterJdbcTemplate.query(
                limitSql,
                params,
                (rs, rowNum) -> {
                    ScriptInfoDto s = new ScriptInfoDto();
                    s.setId(rs.getString("id"));
                    s.setScriptCode(rs.getString("script_code"));
                    s.setScriptName(rs.getString("script_name"));
                    s.setRemoteScript(rs.getString("remote_script"));
                    s.setHost(rs.getString("host"));
                    s.setPort(rs.getInt("port"));
                    s.setUsername(rs.getString("username"));
                    s.setPassword(rs.getString("password"));
                    s.setExecCmd(rs.getString("exec_cmd"));
                    s.setState(ScriptInfo.State.valueOf(rs.getString("state")));
                    s.setCreateUser(rs.getString("create_user"));
                    s.setCreateDate(rs.getTimestamp("create_date").toLocalDateTime());
                    s.setUpdateDate(
                            rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime()
                                    : null);
                    return s;
                });

        // 组装分页对象
        return JdbcQueryHelper.toPage(
                namedParameterJdbcTemplate,
                countSql.toString(),
                params,
                scripts,
                queryDto.getPageNum(),
                queryDto.getPageSize());
    }

    @Override
    public ScriptInfoDto getScriptInfoByCode(String scriptCode) {
        ScriptInfo entity = scriptInfoRepository.findByScriptCode(scriptCode);
        return convertToDto(entity, true);
    }

    @Override
    @Transactional
    public void execScript(String id, String queueId) {
        ScriptInfo entity = scriptInfoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("脚本信息不存在"));
        
        ScriptJob scriptJob = new ScriptJob();
        scriptJob.setScriptId(id);
        jobRepo.save(scriptJob);
    }

    @Override
    public Page<Map<String, Object>> searchJobs(int offset, int limit, String scriptId, String state, String taskClass, String queueName, String triggerType, String startTimeLt, String startTimeGt, String taskId, String keyWord) {
        return null;
    }

    @Override
    @Transactional
    public void deleteJob(String id) {
        jobRepo.findByJobId(id).ifPresent(job -> {
            jobRepo.delete(job);
        });
    }

    @Override
    protected ScriptInfoDto newDto() {
        return new ScriptInfoDto();
    }

    @Override
    protected ScriptInfo newModel() {
        return new ScriptInfo();
    }
}