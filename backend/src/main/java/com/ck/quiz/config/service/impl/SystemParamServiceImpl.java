package com.ck.quiz.config.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.config.dto.SystemParamCreateDto;
import com.ck.quiz.config.dto.SystemParamDto;
import com.ck.quiz.config.dto.SystemParamQueryDto;
import com.ck.quiz.config.dto.SystemParamUpdateDto;
import com.ck.quiz.config.entity.SystemParam;
import com.ck.quiz.config.repository.SystemParamRepository;
import com.ck.quiz.config.service.SystemParamService;
import lombok.extern.slf4j.Slf4j;

import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@Transactional
public class SystemParamServiceImpl
        extends
        BaseServiceImpl<SystemParamCreateDto, SystemParamUpdateDto, SystemParamQueryDto, SystemParamDto, SystemParam, SystemParamRepository>
        implements SystemParamService {

    @Override
    protected SystemParamDto newDto() {
        return new SystemParamDto();
    }

    @Override
    protected SystemParam newModel() {
        return new SystemParam();
    }

    @Override
    @Transactional(readOnly = true)
    public SystemParamDto getParamByName(String paramName) {
        SystemParam param = repository.findByParamNameAndStatus(paramName, SystemParam.ParamStatus.ACTIVE);
        if (param == null) {
            throw new IllegalArgumentException("参数不存在或未激活: " + paramName);
        }
        return convertToDto(param, true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SystemParamDto> getParamsByCategory(String category) {
        List<SystemParam> params = repository.findByCategoryAndStatus(
                category,
                SystemParam.ParamStatus.ACTIVE);
        return convertToDtos(params);
    }

    @Override
    public Page<SystemParamDto> search(String userId, SystemParamQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "SELECT s.* FROM system_param s WHERE 1=1 ");

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM system_param s WHERE 1=1 ");

        Map<String, Object> params = new HashMap<>();

        // 动态条件：参数名称（模糊查询）
        JdbcQueryHelper.lowerLike("paramName", queryDto.getParamName(), " AND LOWER(s.param_name) LIKE :paramName ", params,
                namedParameterJdbcTemplate, sql, countSql);

        // 动态条件：分类
        if (queryDto.getCategory() != null) {
            JdbcQueryHelper.equals("category", queryDto.getCategory(), " AND s.category = :category ", params, sql,
                    countSql);
        }

        // 动态条件：状态
        if (queryDto.getStatus() != null) {
            JdbcQueryHelper.equals("status", queryDto.getStatus(), " AND s.status = :status ", params, sql,
                    countSql);
        }

        // 排序
        JdbcQueryHelper.order("s.sort_order", "asc", sql);

        // 分页
        String pageSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(), queryDto.getPageNum(),
                queryDto.getPageSize());

        List<SystemParam> list = namedParameterJdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            SystemParam param = new SystemParam();
            param.setId(rs.getString("id"));
            param.setParamName(rs.getString("param_name"));
            param.setParamValue(rs.getString("param_value"));
            param.setDefaultValue(rs.getString("default_value"));
            param.setParamType(rs.getString("param_type") != null ? 
                    SystemParam.ParamType.valueOf(rs.getString("param_type")) : SystemParam.ParamType.STRING);
            param.setCategory(rs.getString("category"));
            param.setDescription(rs.getString("description"));
            param.setIsEncrypted(rs.getBoolean("is_encrypted"));
            param.setIsReadonly(rs.getBoolean("is_readonly"));
            param.setStatus(rs.getString("status") != null ? 
                    SystemParam.ParamStatus.valueOf(rs.getString("status")) : SystemParam.ParamStatus.ACTIVE);
            param.setSortOrder(rs.getInt("sort_order"));
            param.setCreateDate(rs.getTimestamp("create_date") != null ? 
                    rs.getTimestamp("create_date").toLocalDateTime() : null);
            param.setCreateUser(rs.getString("create_user"));
            param.setUpdateDate(rs.getTimestamp("update_date") != null ? 
                    rs.getTimestamp("update_date").toLocalDateTime() : null);
            param.setUpdateUser(rs.getString("update_user"));
            return param;
        });

        return JdbcQueryHelper.toPage(namedParameterJdbcTemplate, countSql.toString(), params, convertToDtos(list),
                queryDto.getPageNum(), queryDto.getPageSize());
    }

}
