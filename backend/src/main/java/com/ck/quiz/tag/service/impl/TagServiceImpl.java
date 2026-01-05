package com.ck.quiz.tag.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.tag.dto.TagCreateDto;
import com.ck.quiz.tag.dto.TagDto;
import com.ck.quiz.tag.dto.TagQueryDto;
import com.ck.quiz.tag.dto.TagUpdateDto;
import com.ck.quiz.tag.entity.Tag;
import com.ck.quiz.tag.repository.TagRepository;
import com.ck.quiz.tag.service.TagService;
import com.ck.quiz.utils.JdbcQueryHelper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class TagServiceImpl extends BaseServiceImpl<TagCreateDto, TagUpdateDto, TagQueryDto, TagDto, Tag, TagRepository> implements TagService {

    @Autowired
    private TagRepository tagRepository;

    @Override
    public Page<TagDto> search(String userId, TagQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "select t.* from tag t where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from tag t where 1=1 ");
        Map<String, Object> params = new HashMap<>();

        // 按关键词模糊查询
        JdbcQueryHelper.lowerLike("keyWord", queryDto.getKeyWord(),
                " and (lower(t.name) like :keyWord or lower(t.label) like :keyWord) ", params, namedParameterJdbcTemplate, sql, countSql);

        // 按创建用户过滤
        if (StringUtils.hasText(userId)) {
            JdbcQueryHelper.equals("createUser", userId,
                    " AND t.create_user = :createUser ", params, sql, countSql);
        }

        // 排序
        JdbcQueryHelper.order("create_date", "desc", sql);

        // 分页SQL
        String limitSql = JdbcQueryHelper.getLimitSql(
                namedParameterJdbcTemplate,
                sql.toString(),
                queryDto.getPageNum(),
                queryDto.getPageSize());

        // 查询数据
        List<TagDto> tags = namedParameterJdbcTemplate.query(
                limitSql,
                params,
                (rs, rowNum) -> {
                    TagDto t = new TagDto();
                    t.setId(rs.getString("tag_id"));
                    t.setName(rs.getString("name"));
                    t.setLabel(rs.getString("label"));
                    t.setDescr(rs.getString("descr"));
                    t.setColor(rs.getString("color"));
                    t.setCreateUser(rs.getString("create_user"));
                    t.setCreateDate(rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
                    t.setUpdateDate(
                            rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime()
                                    : null);
                    t.setUpdateUser(rs.getString("update_user"));
                    return t;
                });

        // 组装分页对象
        return JdbcQueryHelper.toPage(
                namedParameterJdbcTemplate,
                countSql.toString(),
                params,
                tags,
                queryDto.getPageNum(),
                queryDto.getPageSize());
    }

    @Override
    public boolean checkNameUniq(String userId, String tagName, String excludeTagId) {
        if (!StringUtils.hasText(tagName)) {
            return true;
        }
        Tag tag = tagRepository.findByCreateUserAndName(userId, tagName);
        if (tag == null) {
            return true;
        }
        if (excludeTagId != null && excludeTagId.equals(tag.getId())) {
            return true;
        }
        return false;
    }

    @Override
    protected TagDto newDto() {
        return new TagDto();
    }

    @Override
    protected Tag newModel() {
        return new Tag();
    }

}
