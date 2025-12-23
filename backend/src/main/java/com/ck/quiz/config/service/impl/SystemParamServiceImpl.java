package com.ck.quiz.config.service.impl;

import com.ck.quiz.config.dto.SystemParamCreateDto;
import com.ck.quiz.config.dto.SystemParamDto;
import com.ck.quiz.config.dto.SystemParamQueryDto;
import com.ck.quiz.config.dto.SystemParamUpdateDto;
import com.ck.quiz.config.entity.SystemParam;
import com.ck.quiz.config.repository.SystemParamRepository;
import com.ck.quiz.config.service.SystemParamService;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 系统参数服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SystemParamServiceImpl implements SystemParamService {

    private final SystemParamRepository paramRepository;
    private final NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    public SystemParamDto createParam(SystemParamCreateDto createDto) {
        // 检查参数键是否已存在
        if (paramRepository.findByParamKey(createDto.getParamKey()).isPresent()) {
            throw new RuntimeException("参数键已存在: " + createDto.getParamKey());
        }

        SystemParam param = new SystemParam();
        BeanUtils.copyProperties(createDto, param);
        param.setId(IdHelper.genUuid());

        // 设置参数类型枚举
        if (StringUtils.hasText(createDto.getParamType())) {
            param.setParamType(SystemParam.ParamType.valueOf(createDto.getParamType()));
        }

        // 设置状态枚举
        if (StringUtils.hasText(createDto.getStatus())) {
            param.setStatus(SystemParam.ParamStatus.valueOf(createDto.getStatus()));
        }

        param = paramRepository.save(param);
        return convertToDto(param);
    }

    @Override
    public SystemParamDto updateParam(SystemParamUpdateDto updateDto) {
        SystemParam param = paramRepository.findById(updateDto.getId())
                .orElseThrow(() -> new RuntimeException("参数不存在"));

        // 检查只读属性
        if (param.getIsReadonly()) {
            throw new RuntimeException("该参数为只读，不允许修改");
        }

        // 更新字段
        if (StringUtils.hasText(updateDto.getParamName())) {
            param.setParamName(updateDto.getParamName());
        }
        if (updateDto.getParamValue() != null) {
            param.setParamValue(updateDto.getParamValue());
        }
        if (updateDto.getDefaultValue() != null) {
            param.setDefaultValue(updateDto.getDefaultValue());
        }
        if (StringUtils.hasText(updateDto.getCategory())) {
            param.setCategory(updateDto.getCategory());
        }
        if (StringUtils.hasText(updateDto.getDescription())) {
            param.setDescription(updateDto.getDescription());
        }
        if (updateDto.getIsEncrypted() != null) {
            param.setIsEncrypted(updateDto.getIsEncrypted());
        }
        if (updateDto.getIsReadonly() != null) {
            param.setIsReadonly(updateDto.getIsReadonly());
        }
        if (StringUtils.hasText(updateDto.getStatus())) {
            param.setStatus(SystemParam.ParamStatus.valueOf(updateDto.getStatus()));
        }
        if (updateDto.getSortOrder() != null) {
            param.setSortOrder(updateDto.getSortOrder());
        }

        param = paramRepository.save(param);
        return convertToDto(param);
    }

    @Override
    public void deleteParam(String id) {
        SystemParam param = paramRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("参数不存在"));

        // 检查只读属性
        if (param.getIsReadonly()) {
            throw new RuntimeException("该参数为只读，不允许删除");
        }

        paramRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public SystemParamDto getParamById(String id) {
        SystemParam param = paramRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("参数不存在"));
        return convertToDto(param);
    }

    @Override
    @Transactional(readOnly = true)
    public SystemParamDto getParamByKey(String paramKey) {
        SystemParam param = paramRepository.findByParamKey(paramKey)
                .orElseThrow(() -> new RuntimeException("参数不存在: " + paramKey));
        return convertToDto(param);
    }

    @Override
    @Transactional(readOnly = true)
    public String getParamValue(String paramKey) {
        return paramRepository.findByParamKey(paramKey)
                .map(SystemParam::getParamValue)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public String getParamValue(String paramKey, String defaultValue) {
        String value = getParamValue(paramKey);
        return value != null ? value : defaultValue;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SystemParamDto> searchParams(SystemParamQueryDto queryDto) {
        StringBuilder sql = new StringBuilder("SELECT * FROM system_param WHERE 1=1 ");
        Map<String, Object> params = new HashMap<>();

        // 构建查询条件
        if (StringUtils.hasText(queryDto.getParamKey())) {
            sql.append(" AND param_key LIKE :paramKey ");
            params.put("paramKey", "%" + queryDto.getParamKey() + "%");
        }
        if (StringUtils.hasText(queryDto.getParamName())) {
            sql.append(" AND param_name LIKE :paramName ");
            params.put("paramName", "%" + queryDto.getParamName() + "%");
        }
        if (StringUtils.hasText(queryDto.getCategory())) {
            sql.append(" AND category = :category ");
            params.put("category", queryDto.getCategory());
        }
        if (StringUtils.hasText(queryDto.getStatus())) {
            sql.append(" AND status = :status ");
            params.put("status", queryDto.getStatus());
        }

        // 排序
        sql.append(" ORDER BY sort_order ASC, create_date DESC ");

        // 分页
        String pageSql = JdbcQueryHelper.getLimitSql(
                jdbcTemplate, 
                sql.toString(), 
                queryDto.getPage(), 
                queryDto.getSize()
        );

        // 查询数据
        List<SystemParamDto> list = jdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            SystemParamDto dto = new SystemParamDto();
            dto.setId(rs.getString("id"));
            dto.setParamKey(rs.getString("param_key"));
            dto.setParamName(rs.getString("param_name"));
            dto.setParamValue(rs.getString("param_value"));
            dto.setDefaultValue(rs.getString("default_value"));
            dto.setParamType(rs.getString("param_type"));
            dto.setCategory(rs.getString("category"));
            dto.setDescription(rs.getString("description"));
            dto.setIsEncrypted(rs.getBoolean("is_encrypted"));
            dto.setIsReadonly(rs.getBoolean("is_readonly"));
            dto.setStatus(rs.getString("status"));
            dto.setSortOrder(rs.getInt("sort_order"));
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateDate(rs.getTimestamp("create_date") != null ? 
                    rs.getTimestamp("create_date").toLocalDateTime() : null);
            dto.setUpdateUser(rs.getString("update_user"));
            dto.setUpdateDate(rs.getTimestamp("update_date") != null ? 
                    rs.getTimestamp("update_date").toLocalDateTime() : null);
            return dto;
        });

        // 构建分页结果
        StringBuilder countSql = new StringBuilder("SELECT COUNT(*) FROM system_param WHERE 1=1 ");
        if (StringUtils.hasText(queryDto.getParamKey())) {
            countSql.append(" AND param_key LIKE :paramKey ");
        }
        if (StringUtils.hasText(queryDto.getParamName())) {
            countSql.append(" AND param_name LIKE :paramName ");
        }
        if (StringUtils.hasText(queryDto.getCategory())) {
            countSql.append(" AND category = :category ");
        }
        if (StringUtils.hasText(queryDto.getStatus())) {
            countSql.append(" AND status = :status ");
        }

        return JdbcQueryHelper.toPage(
                jdbcTemplate, 
                countSql.toString(), 
                params, 
                list, 
                queryDto.getPage(), 
                queryDto.getSize()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<SystemParamDto> getParamsByCategory(String category) {
        List<SystemParam> params = paramRepository.findByCategoryAndStatus(
                category, 
                SystemParam.ParamStatus.ACTIVE
        );
        return params.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public void batchUpdateParams(List<SystemParamUpdateDto> updateDtos) {
        for (SystemParamUpdateDto updateDto : updateDtos) {
            try {
                updateParam(updateDto);
            } catch (Exception e) {
                log.error("批量更新参数失败: {}", updateDto.getId(), e);
                throw new RuntimeException("批量更新参数失败: " + e.getMessage());
            }
        }
    }

    @Override
    public SystemParamDto resetParamToDefault(String id) {
        SystemParam param = paramRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("参数不存在"));

        // 检查只读属性
        if (param.getIsReadonly()) {
            throw new RuntimeException("该参数为只读，不允许重置");
        }

        // 重置为默认值
        param.setParamValue(param.getDefaultValue());
        param = paramRepository.save(param);
        return convertToDto(param);
    }

    /**
     * 转换为DTO
     */
    private SystemParamDto convertToDto(SystemParam param) {
        SystemParamDto dto = new SystemParamDto();
        BeanUtils.copyProperties(param, dto);
        dto.setParamType(param.getParamType().name());
        dto.setStatus(param.getStatus().name());
        return dto;
    }
}
