package com.ck.quiz.prompt.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.prompt.dto.PromptTemplateCreateDto;
import com.ck.quiz.prompt.dto.PromptTemplateDto;
import com.ck.quiz.prompt.dto.PromptTemplateQueryDto;
import com.ck.quiz.prompt.dto.PromptTemplateUpdateDto;
import com.ck.quiz.prompt.entity.PromptTemplate;
import com.ck.quiz.prompt.repository.PromptTemplateRepository;
import com.ck.quiz.prompt.service.PromptTemplateService;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Map;

@Service
@Transactional
public class PromptTemplateServiceImpl extends BaseServiceImpl<PromptTemplateCreateDto, PromptTemplateUpdateDto, PromptTemplateQueryDto, PromptTemplateDto, PromptTemplate, PromptTemplateRepository> implements PromptTemplateService {

    @Autowired
    private PromptTemplateRepository templateRepository;

    @Override
    public Page<PromptTemplateDto> search(String userId, PromptTemplateQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "select t.* from prompt_templates t where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from prompt_templates t where 1=1 ");
        Map<String, Object> params = new HashMap<>();

        // 按名称模糊查询
        JdbcQueryHelper.lowerLike("keyWord", queryDto.getKeyWord(),
                " and lower(t.name) like :keyWord ", params, namedParameterJdbcTemplate, sql, countSql);

        // 排序
        JdbcQueryHelper.order("create_date", "desc", sql);

        // 分页SQL
        String limitSql = JdbcQueryHelper.getLimitSql(
                namedParameterJdbcTemplate,
                sql.toString(),
                queryDto.getPageNum(),
                queryDto.getPageSize());

        // 查询数据
        java.util.List<PromptTemplateDto> templates = namedParameterJdbcTemplate.query(
                limitSql,
                params,
                (rs, rowNum) -> {
                    PromptTemplateDto t = new PromptTemplateDto();
                    t.setId(rs.getString("id"));
                    t.setName(rs.getString("name"));
                    t.setContent(rs.getString("content"));
                    t.setDescription(rs.getString("description"));
                    t.setCreateUser(rs.getString("create_user"));
                    t.setCreateDate(rs.getTimestamp("create_date").toLocalDateTime());
                    t.setUpdateDate(
                            rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime()
                                    : null);
                    return t;
                });

        // 组装分页对象
        return JdbcQueryHelper.toPage(
                namedParameterJdbcTemplate,
                countSql.toString(),
                params,
                templates,
                queryDto.getPageNum(),
                queryDto.getPageSize());
    }

    @Override
    public boolean checkNameUniq(String userId, String name, String excludeId) {
        if (!StringUtils.hasText(name)) {
            return true;
        }
        PromptTemplate template = templateRepository.findByName(name);
        if (template == null) {
            return true;
        }
        if (excludeId != null && excludeId.equals(template.getId())) {
            return true;
        }
        return false;
    }

    @Override
    protected PromptTemplateDto newDto() {
        return new PromptTemplateDto();
    }

    @Override
    protected PromptTemplate newModel() {
        return new PromptTemplate();
    }

    @Override
    public PromptTemplateDto getByName(String name) {
        PromptTemplate template = templateRepository.findByName(name);
        return convertToDto(template, true);
    }
}