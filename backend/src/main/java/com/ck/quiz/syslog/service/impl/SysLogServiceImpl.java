package com.ck.quiz.syslog.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.syslog.dto.SysLogCreateDto;
import com.ck.quiz.syslog.dto.SysLogDto;
import com.ck.quiz.syslog.dto.SysLogQueryDto;
import com.ck.quiz.syslog.dto.SysLogUpdateDto;
import com.ck.quiz.syslog.entity.SysLog;
import com.ck.quiz.syslog.repository.SysLogRepository;
import com.ck.quiz.syslog.service.SysLogService;
import com.ck.quiz.user.dto.UserDto;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.data.domain.Page;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class SysLogServiceImpl extends BaseServiceImpl<SysLogCreateDto, SysLogUpdateDto, SysLogQueryDto, SysLogDto, SysLog, SysLogRepository> implements SysLogService {

    @Async("sysLogAsyncExecutor")
    @Override
    public void createSysLogAsync(SysLogCreateDto dto) {
        create(dto);
    }

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

        if (!list.isEmpty()) {
            List<String> userIds = new ArrayList<>();
            for (SysLogDto dto : list) {
                if (StringUtils.hasText(dto.getCreateUser())) {
                    userIds.add(dto.getCreateUser());
                }
                if (StringUtils.hasText(dto.getUpdateUser())) {
                    userIds.add(dto.getUpdateUser());
                }
            }
            List<String> distinctUserIds = userIds.stream().distinct().toList();
            if (!distinctUserIds.isEmpty()) {
                Map<String, UserDto> userMap = userService.getUserMapByIds(distinctUserIds);
                for (SysLogDto dto : list) {
                    UserDto createUser = userMap.get(dto.getCreateUser());
                    if (createUser != null) {
                        dto.setCreateUserName(createUser.getUserName());
                    } else if ("SYSTEM".equalsIgnoreCase(dto.getCreateUser())) {
                        dto.setCreateUserName("系统");
                    }
                    UserDto updateUser = userMap.get(dto.getUpdateUser());
                    if (updateUser != null) {
                        dto.setUpdateUserName(updateUser.getUserName());
                    } else if ("SYSTEM".equalsIgnoreCase(dto.getUpdateUser())) {
                        dto.setUpdateUserName("系统");
                    }
                }
            }
        }

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

