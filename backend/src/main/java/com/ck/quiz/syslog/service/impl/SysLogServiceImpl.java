package com.ck.quiz.syslog.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.syslog.dto.SysLogCreateDto;
import com.ck.quiz.syslog.dto.SysLogDto;
import com.ck.quiz.syslog.dto.SysLogQueryDto;
import com.ck.quiz.syslog.dto.SysLogUpdateDto;
import com.ck.quiz.syslog.entity.SysLog;
import com.ck.quiz.syslog.repository.SysLogRepository;
import com.ck.quiz.syslog.service.SysLogService;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.sql.Timestamp;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class SysLogServiceImpl extends BaseServiceImpl<SysLogCreateDto, SysLogUpdateDto, SysLogQueryDto, SysLogDto, SysLog, SysLogRepository> implements SysLogService {

    @Override
    public Page<SysLogDto> search(String userId, SysLogQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "SELECT l.* FROM sys_log l WHERE 1=1 "
        );

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM sys_log l WHERE 1=1 "
        );

        Map<String, Object> params = new HashMap<>();

        JdbcQueryHelper.lowerLike("module", queryDto.getModule(), " AND LOWER(l.module) LIKE :module ", params, namedParameterJdbcTemplate, sql, countSql);
        JdbcQueryHelper.lowerLike("action", queryDto.getAction(), " AND LOWER(l.action) LIKE :action ", params, namedParameterJdbcTemplate, sql, countSql);
        JdbcQueryHelper.lowerLike("requestUri", queryDto.getRequestUri(), " AND LOWER(l.request_uri) LIKE :requestUri ", params, namedParameterJdbcTemplate, sql, countSql);

        if (queryDto.getSuccess() != null) {
            JdbcQueryHelper.equals("success", queryDto.getSuccess(), " AND l.success = :success ", params, sql, countSql);
        }

        if (StringUtils.hasText(userId)) {
            JdbcQueryHelper.equals("createUser", userId, " AND l.create_user = :createUser ", params, sql, countSql);
        }

        JdbcQueryHelper.order(queryDto.getSortColumn(), queryDto.getSortType(), sql);

        String pageSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(), queryDto.getPageNum(), queryDto.getPageSize());

        List<SysLogDto> list = namedParameterJdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            SysLogDto dto = new SysLogDto();
            dto.setId(rs.getString("id"));
            dto.setModule(rs.getString("module"));
            dto.setAction(rs.getString("action"));
            dto.setRequestUri(rs.getString("request_uri"));
            dto.setRequestMethod(rs.getString("request_method"));
            dto.setRequestParams(rs.getString("request_params"));
            dto.setResponseData(rs.getString("response_data"));
            Object successObj = rs.getObject("success");
            dto.setSuccess(successObj != null ? rs.getString("success") : null);
            dto.setErrorMessage(rs.getString("error_message"));
            dto.setIpAddress(rs.getString("ip_address"));
            dto.setUserAgent(rs.getString("user_agent"));
            Object costTimeObj = rs.getObject("cost_time");
            dto.setCostTime(costTimeObj != null ? rs.getLong("cost_time") : null);
            Timestamp createTs = rs.getTimestamp("create_date");
            dto.setCreateDate(createTs != null ? createTs.toLocalDateTime() : null);
            dto.setCreateUser(rs.getString("create_user"));
            Timestamp updateTs = rs.getTimestamp("update_date");
            dto.setUpdateDate(updateTs != null ? updateTs.toLocalDateTime() : null);
            dto.setUpdateUser(rs.getString("update_user"));
            return dto;
        });

        return JdbcQueryHelper.toPage(namedParameterJdbcTemplate, countSql.toString(), params, list, queryDto.getPageNum(), queryDto.getPageSize());
    }

    @Override
    protected SysLogDto newDto() {
        return new SysLogDto();
    }

    @Override
    protected SysLog newModel() {
        return new SysLog();
    }
}

