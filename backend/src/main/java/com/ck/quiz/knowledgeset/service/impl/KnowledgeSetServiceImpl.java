package com.ck.quiz.knowledgeset.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.knowledgeset.dto.KnowledgeSetCreateDto;
import com.ck.quiz.knowledgeset.dto.KnowledgeSetDto;
import com.ck.quiz.knowledgeset.dto.KnowledgeSetQueryDto;
import com.ck.quiz.knowledgeset.dto.KnowledgeSetUpdateDto;
import com.ck.quiz.knowledgeset.entity.KnowledgeSet;
import com.ck.quiz.knowledgeset.repository.KnowledgeSetRepository;
import com.ck.quiz.knowledgeset.service.KnowledgeSetService;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class KnowledgeSetServiceImpl extends BaseServiceImpl<KnowledgeSetCreateDto, KnowledgeSetUpdateDto, KnowledgeSetQueryDto, KnowledgeSetDto, KnowledgeSet, KnowledgeSetRepository> implements KnowledgeSetService {

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    protected KnowledgeSetDto newDto() {
        return new KnowledgeSetDto();
    }

    @Override
    protected KnowledgeSet newModel() {
        return new KnowledgeSet();
    }

    @Override
    public KnowledgeSetDto create(KnowledgeSetCreateDto createDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("用户未登录");
        }
        String userId = authentication.getName();
        if (repository.existsByNameAndCreateUser(createDto.getName(), userId)) {
            throw new DuplicateKeyException("知识集名称已存在");
        }
        KnowledgeSet model = newModel();
        model.setId(com.ck.quiz.utils.IdHelper.genUuid());
        BeanUtils.copyProperties(createDto, model);
        model.setCreateUser(userId);
        KnowledgeSet saved = repository.save(model);
        return convertToDto(saved, true);
    }

    @Override
    public KnowledgeSetDto update(String userId, KnowledgeSetUpdateDto updateDto) {
        KnowledgeSet model = repository.findById(updateDto.getId()).orElseThrow(() -> new IllegalArgumentException("知识集不存在"));
        if (model.getCreateUser() != null && !model.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("无权更新该知识集");
        }
        if (updateDto.getName() != null && repository.existsByNameAndCreateUserAndIdNot(updateDto.getName(), userId, updateDto.getId())) {
            throw new DuplicateKeyException("知识集名称已存在");
        }
        BeanUtils.copyProperties(updateDto, model);
        KnowledgeSet updated = repository.save(model);
        return convertToDto(updated, true);
    }

    @Override
    public Page<KnowledgeSetDto> search(String userId, KnowledgeSetQueryDto queryDto) {
        StringBuilder sql = new StringBuilder("select ks.*, u.user_name create_user_name from knowledge_set ks left join users u on u.user_id = ks.create_user where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from knowledge_set ks where 1=1 ");
        Map<String, Object> params = new HashMap<>();
        JdbcQueryHelper.equals("createUser", userId, " and ks.create_user = :createUser ", params, sql, countSql);
        JdbcQueryHelper.lowerLike("nameKey", queryDto.getKeyWord(), " and lower(ks.name) like :nameKey ", params, jdbcTemplate, sql, countSql);
        JdbcQueryHelper.equals("status", queryDto.getStatus(), " and ks.status = :status ", params, sql, countSql);
        JdbcQueryHelper.equals("visibility", queryDto.getVisibility(), " and ks.visibility = :visibility ", params, sql, countSql);
        JdbcQueryHelper.order("create_date", "desc", sql);
        String pageSql = JdbcQueryHelper.getLimitSql(jdbcTemplate, sql.toString(), queryDto.getPageNum(), queryDto.getPageSize());
        List<KnowledgeSetDto> list = jdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            KnowledgeSetDto dto = new KnowledgeSetDto();
            dto.setId(rs.getString("id"));
            dto.setName(rs.getString("name"));
            dto.setDescr(rs.getString("descr"));
            dto.setTags(rs.getString("tags"));
            dto.setVisibility(rs.getString("visibility"));
            dto.setDefaultLanguage(rs.getString("default_language"));
            dto.setStatus(rs.getString("status"));
            java.sql.Timestamp createTime = rs.getTimestamp("create_date");
            if (createTime != null) {
                dto.setCreateDate(createTime.toLocalDateTime());
            }
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateUserName(rs.getString("create_user_name"));
            java.sql.Timestamp updateTime = rs.getTimestamp("update_date");
            if (updateTime != null) {
                dto.setUpdateDate(updateTime.toLocalDateTime());
            }
            dto.setUpdateUser(rs.getString("update_user"));
            return dto;
        });
        return JdbcQueryHelper.toPage(jdbcTemplate, countSql.toString(), params, list, queryDto.getPageNum(), queryDto.getPageSize());
    }
}
